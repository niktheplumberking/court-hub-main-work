// Verifies the RLS hardening in supabase/UPGRADE-CHECKOUT.sql on a throwaway
// Postgres with Supabase-like stubs (auth.uid(), roles, storage tables):
// logged-in NON-admins must see no orders/drafts/inquiries; admins see all;
// anonymous visitors see only active products and cannot call stock functions.
import EmbeddedPostgres from 'embedded-postgres';
import pg from 'pg';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = fileURLToPath(new URL('../..', import.meta.url));
const dir = path.resolve('./rls-data-' + Date.now());
const db = new EmbeddedPostgres({ databaseDir: dir, user: 'postgres', password: 'x', port: 54339, persistent: false, initdbFlags: ['--encoding=UTF8', '--locale=C'] });
await db.initialise();
await db.start();
await db.createDatabase('t');
const c = new pg.Client({ host: '127.0.0.1', port: 54339, user: 'postgres', password: 'x', database: 't' });
await c.connect();
let fails = 0;
const check = (n, ok, x = '') => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${x ? '  — ' + x : ''}`); if (!ok) fails++; };

try {
  await c.query(`
    create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
    create schema auth; create table auth.users (id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.sub', true), '')::uuid $$;
    grant usage on schema auth to anon, authenticated; grant execute on function auth.uid() to anon, authenticated;
    create schema storage; create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
    create table storage.objects (id serial, bucket_id text); alter table storage.objects enable row level security;
    grant usage on schema public to anon, authenticated;
  `);
  await c.query(fs.readFileSync(`${REPO}/supabase/schema.sql`, 'utf8'));
  await c.query(fs.readFileSync(`${REPO}/supabase/migrations/20260710_site_content.sql`, 'utf8'));
  await c.query(fs.readFileSync(`${REPO}/supabase/UPGRADE-CHECKOUT.sql`, 'utf8'));
  await c.query(fs.readFileSync(`${REPO}/supabase/UPGRADE-CHECKOUT.sql`, 'utf8'));
  check('schema + site content + upgrade (run twice) apply cleanly', true);
  await c.query(`grant select on all tables in schema public to anon, authenticated; grant insert on inquiries to anon, authenticated;`);

  const adminId = '11111111-1111-4111-8111-111111111111', userId = '22222222-2222-4222-8222-222222222222';
  await c.query(`insert into auth.users values ($1), ($2)`, [adminId, userId]);
  await c.query(`insert into admins (user_id, email) values ($1, 'boss@courthub.ae')`, [adminId]);
  const cat = (await c.query(`select id from categories limit 1`)).rows[0].id;
  await c.query(`insert into products (slug,title,category_id,status) values ('live','Live',$1,'active'), ('draft','Draft',$1,'draft')`, [cat]);
  await c.query(`insert into orders (stripe_session_id, customer_email, items) values ('cs_1','buyer@x.com','[]')`);
  await c.query(`insert into inquiries (name) values ('n')`);

  const as = async (role, sub, sql) => {
    await c.query('begin');
    await c.query(`set local role ${role}`);
    await c.query(`select set_config('request.jwt.sub', $1, true)`, [sub ?? '']);
    try { return (await c.query(sql)).rows; } finally { await c.query('rollback'); }
  };
  const count = async (role, sub, table) => (await as(role, sub, `select count(*)::int n from ${table}`))[0].n;

  check('anonymous visitor sees 0 orders', (await count('anon', null, 'orders')) === 0);
  check('anonymous visitor sees only the active product', (await count('anon', null, 'products')) === 1);
  check('logged-in NON-admin sees 0 orders', (await count('authenticated', userId, 'orders')) === 0);
  check('logged-in NON-admin sees 0 inquiries', (await count('authenticated', userId, 'inquiries')) === 0);
  check('logged-in NON-admin cannot see draft products', (await count('authenticated', userId, 'products')) === 1);
  check('admin sees the order', (await count('authenticated', adminId, 'orders')) === 1);
  check('admin sees drafts too', (await count('authenticated', adminId, 'products')) === 2);
  check('checkout reservations invisible to everyone but the server', (await count('authenticated', adminId, 'checkout_holds')) === 0);

  let blocked = false;
  try { await as('anon', null, `insert into inquiries (name) values ('spam')`); } catch { blocked = true; }
  check('public can no longer spam the inquiries table', blocked);
  for (const fn of [`reserve_stock('[]'::jsonb, 1)`, `release_hold(gen_random_uuid())`, `set_order_status(gen_random_uuid(), 'paid')`]) {
    let denied = false;
    try { await as('anon', null, `select ${fn}`); } catch (e) { denied = /permission denied/.test(e.message); }
    check(`anonymous cannot call ${fn.split('(')[0]}()`, denied);
    denied = false;
    try { await as('authenticated', adminId, `select ${fn}`); } catch (e) { denied = /permission denied/.test(e.message); }
    check(`even a logged-in admin cannot call ${fn.split('(')[0]}() directly (server only)`, denied);
  }
} catch (e) {
  console.error('ERROR', e.message);
  fails++;
} finally {
  await c.end();
  await db.stop();
  fs.rmSync(dir, { recursive: true, force: true });
  console.log(fails ? `\n${fails} FAILURE(S)` : '\nALL PASSED');
}
