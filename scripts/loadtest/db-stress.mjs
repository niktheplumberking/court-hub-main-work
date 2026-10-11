// Stress + correctness test of supabase/UPGRADE-CHECKOUT.sql on a REAL Postgres
// server (embedded-postgres), with genuinely concurrent connections.
import EmbeddedPostgres from 'embedded-postgres';
import pg from 'pg';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const REPO = fileURLToPath(new URL('../..', import.meta.url));
const dir = path.resolve('./data-' + Date.now());
const db = new EmbeddedPostgres({ databaseDir: dir, user: 'postgres', password: 'x', port: 54329, persistent: false, initdbFlags: ['--encoding=UTF8', '--locale=C'] });
await db.initialise();
await db.start();
await db.createDatabase('t');
const pool = new pg.Pool({ host: 'localhost', port: 54329, user: 'postgres', password: 'x', database: 't', max: 40 });
const q = (s, a) => pool.query(s, a);

let fails = 0;
const check = (name, cond, extra = '') => {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${extra ? '  ' + extra : ''}`);
  if (!cond) fails++;
};

try {
  // Supabase roles + the original schema (minus storage + policies).
  await q(`create role anon; create role authenticated; create role service_role; create schema if not exists auth; create table if not exists auth.users (id uuid primary key); create or replace function auth.uid() returns uuid language sql stable as \$\$ select null::uuid \$\$; create schema if not exists storage; create table if not exists storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);`);
  const schema = fs.readFileSync(`${REPO}/supabase/schema.sql`, 'utf8')
    .split('-- ── Row Level Security ──')[0];
  await q(schema);
  await q(fs.readFileSync(`${REPO}/supabase/UPGRADE-CHECKOUT.sql`, 'utf8'));
  await q(fs.readFileSync(`${REPO}/supabase/UPGRADE-CHECKOUT.sql`, 'utf8')); // idempotent re-run
  check('migration runs twice without error', true);

  const cat = (await q(`insert into categories (name, slug) values ('T','t') returning id`)).rows[0].id;
  const mk = async (slug, qty, unique, price = 100) =>
    (await q(`insert into products (slug,title,category_id,price_aed,quantity,is_unique,status)
              values ($1,$1,$2,$3,$4,$5,'active') returning id`, [slug, cat, price, qty, unique])).rows[0].id;

  const reserve = async (items) => (await q(`select reserve_stock($1::jsonb) r`, [JSON.stringify(items)])).rows[0].r;
  const stock = async (id) => (await q(`select quantity, status from products where id=$1`, [id])).rows[0];

  // 1. 200 buyers hit ONE unique racket at the same instant.
  const racket = await mk('unique-racket', 1, true);
  let res = await Promise.all(Array.from({ length: 200 }, () => reserve([{ id: racket, qty: 1 }])));
  check('200 simultaneous buyers, 1 unique racket → exactly 1 reservation', res.filter((r) => r.ok).length === 1,
    `(${res.filter((r) => r.ok).length} ok, ${res.filter((r) => !r.ok).length} refused)`);
  check('racket stock is 0, never negative', (await stock(racket)).quantity === 0);

  // 2. 300 buyers, stock 25, random qty 1-3.
  const balls = await mk('balls', 25, false, 20);
  const wants = Array.from({ length: 300 }, () => 1 + Math.floor(Math.random() * 3));
  res = await Promise.all(wants.map((n) => reserve([{ id: balls, qty: n }])));
  const sold = res.filter((r) => r.ok).reduce((s, r) => s + r.items[0].qty, 0);
  const left = (await stock(balls)).quantity;
  check('300 simultaneous buyers, stock 25 → never oversold', sold + left === 25 && left >= 0, `(reserved ${sold}, left ${left})`);

  // 3. Mixed multi-item carts in opposite order → no deadlocks, all-or-nothing.
  const a = await mk('a', 40, false), b = await mk('b', 40, false);
  const carts = Array.from({ length: 200 }, (_, i) =>
    i % 2 ? [{ id: a, qty: 1 }, { id: b, qty: 1 }] : [{ id: b, qty: 1 }, { id: a, qty: 1 }]);
  const t0 = Date.now();
  res = await Promise.all(carts.map(reserve));
  const ms = Date.now() - t0;
  const okCarts = res.filter((r) => r.ok).length;
  const sa = (await stock(a)).quantity, sb = (await stock(b)).quantity;
  check('200 two-item carts in opposite order → no deadlock', true, `(${ms} ms total)`);
  check('all-or-nothing: both products drop by the same amount', okCarts === 40 && sa === 0 && sb === 0, `(ok ${okCarts}, a ${sa}, b ${sb})`);

  // 4. Refused cart changes nothing.
  const c = await mk('c', 5, false), d = await mk('d', 1, false);
  const r4 = await reserve([{ id: c, qty: 2 }, { id: d, qty: 3 }]);
  check('cart with one short item is refused and reports it', !r4.ok && r4.id === d && r4.available === 1);
  check('…and the other item\'s stock is untouched', (await stock(c)).quantity === 5);

  // 5. Unique item qty>1, inactive item.
  const u = await mk('u', 1, true);
  check('unique item cannot be reserved twice in one cart', !(await reserve([{ id: u, qty: 2 }])).ok);
  await q(`update products set status='draft' where id=$1`, [c]);
  check('draft product cannot be bought', (await reserve([{ id: c, qty: 1 }])).reason === 'unavailable');

  // 6. Release: abandoned checkout returns stock exactly once (50 parallel releases).
  const e = await mk('e', 3, false);
  const h = await reserve([{ id: e, qty: 2 }]);
  const rel = await Promise.all(Array.from({ length: 50 }, () => q(`select release_hold($1) r`, [h.hold_id])));
  check('release of an abandoned checkout happens exactly once', rel.filter((x) => x.rows[0].r).length === 1);
  check('stock restored to 3', (await stock(e)).quantity === 3);

  // 7. Convert: payment → unique item flips to sold; repeat webhook = no-op.
  const v = await mk('v', 1, true);
  const hv = await reserve([{ id: v, qty: 1 }]);
  const conv = await Promise.all(Array.from({ length: 20 }, () => q(`select convert_hold($1) r`, [hv.hold_id])));
  const kinds = conv.map((x) => x.rows[0].r);
  check('20 duplicate webhooks → converted once', kinds.filter((k) => k === 'converted').length === 1 && kinds.filter((k) => k === 'already').length === 19);
  check('unique item now sold', (await stock(v)).status === 'sold');
  check('released hold cannot be released after conversion', !(await q(`select release_hold($1) r`, [hv.hold_id])).rows[0].r);

  // 8. Late payment on a released hold → stock taken again (not below 0).
  const w = await mk('w', 2, false);
  const hw = await reserve([{ id: w, qty: 2 }]);
  await q(`select release_hold($1)`, [hw.hold_id]);
  check('late payment flagged', (await q(`select convert_hold($1) r`, [hw.hold_id])).rows[0].r === 'late');
  check('late payment takes stock back', (await stock(w)).quantity === 0);

  // 9. Admin cancel → restock once; un-cancel → stock out again; double clicks harmless.
  const x = await mk('x', 1, true);
  const hx = await reserve([{ id: x, qty: 1 }]);
  await q(`select convert_hold($1)`, [hx.hold_id]);
  const order = (await q(`insert into orders (stripe_session_id, items, amount_aed, hold_id)
     values ('cs_test_1', $1, 100, $2) returning id`, [JSON.stringify(hx.items), hx.hold_id])).rows[0].id;
  await Promise.all(Array.from({ length: 10 }, () => q(`select set_order_status($1,'cancelled')`, [order])));
  let sx = await stock(x);
  check('10 parallel "cancel" clicks → restocked exactly once', sx.quantity === 1 && sx.status === 'active', JSON.stringify(sx));
  await q(`select set_order_status($1,'paid')`, [order]);
  sx = await stock(x);
  check('un-cancel takes the item back out (sold again)', sx.quantity === 0 && sx.status === 'sold', JSON.stringify(sx));
  await q(`select set_order_status($1,'fulfilled')`, [order]);
  check('paid → fulfilled leaves stock alone', (await stock(x)).quantity === 0);

  // 10. Duplicate order insert (webhook + success page at the same time) → one order.
  const dup = await Promise.allSettled(Array.from({ length: 10 }, () =>
    q(`insert into orders (stripe_session_id, items) values ('cs_dup','[]') on conflict (stripe_session_id) do nothing`)));
  const n = (await q(`select count(*)::int n from orders where stripe_session_id='cs_dup'`)).rows[0].n;
  check('10 simultaneous inserts of the same Stripe session → 1 order', n === 1 && dup.every((p) => p.status === 'fulfilled'));

  // 11. Throughput: 1000 single-item reservations on a big-stock item.
  const big = await mk('big', 100000, false);
  const t1 = Date.now();
  await Promise.all(Array.from({ length: 1000 }, () => reserve([{ id: big, qty: 1 }])));
  const t = Date.now() - t1;
  check('1000 reservations on one hot product', (await stock(big)).quantity === 99000, `(${t} ms → ~${Math.round(1000 / (t / 1000))}/sec, need ~2/sec for 100/min)`);
} catch (e) {
  console.error('ERROR', e);
  fails++;
} finally {
  await pool.end();
  await db.stop();
  fs.rmSync(dir, { recursive: true, force: true });
  console.log(fails ? `\n${fails} FAILURE(S)` : '\nALL PASSED');
}
