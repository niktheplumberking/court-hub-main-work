// End-to-end load test: real Next.js production build → real PostgREST →
// real Postgres, with a fake Stripe. Simulates shoppers exactly as browsers
// and Stripe would behave.
import pg from 'pg';
import crypto from 'node:crypto';
import { Agent, setGlobalDispatcher } from 'undici';
// Like nginx in production: queue the burst over a bounded set of connections
// (Windows refuses >200 simultaneous TCP connects; Linux+nginx queue them).
setGlobalDispatcher(new Agent({ connections: 100, keepAliveTimeout: 10_000 }));

const SITE = 'http://localhost:3105';
const STRIPE = 'http://127.0.0.1:12111';
const WHSEC = 'whsec_loadtest';
const db = new pg.Pool({ host: '127.0.0.1', port: 54330, user: 'postgres', password: 'x', database: 't' });
const q = async (s, a) => (await db.query(s, a)).rows;

let fails = 0;
const check = (name, cond, extra = '') => {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${extra ? '  — ' + extra : ''}`);
  if (!cond) fails++;
};
const ip = () => `10.${(Math.random() * 255) | 0}.${(Math.random() * 255) | 0}.${(Math.random() * 255) | 0}`;
const pct = (arr, p) => { const s = [...arr].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor((p / 100) * s.length))] ?? 0; };
const timed = async (fn) => { const t = performance.now(); const r = await fn(); return [r, performance.now() - t]; };

const product = async (slug) => (await q(`select id, quantity, status from products where slug=$1`, [slug]))[0];

async function cartCheck(ids, addr) {
  const r = await fetch(`${SITE}/api/cart`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-real-ip': addr }, body: JSON.stringify({ ids }) });
  return { status: r.status, body: await r.json().catch(() => null) };
}
async function checkout(items, addr, extra = {}) {
  const r = await fetch(`${SITE}/api/checkout`, {
    method: 'POST', headers: { 'content-type': 'application/json', 'x-real-ip': addr },
    body: JSON.stringify({ items, locale: 'en', ...extra }),
  });
  const text = await r.text();
  let body = null; try { body = JSON.parse(text); } catch {}
  return { status: r.status, body, text };
}
const sessionIdFromUrl = (url) => url.split('/').pop();
async function pay(sessionId) { return (await fetch(`${STRIPE}/__pay/${sessionId}`, { method: 'POST' })).json(); }
async function webhook(type, session) {
  const payload = JSON.stringify({ id: 'evt_' + crypto.randomBytes(8).toString('hex'), object: 'event', type, data: { object: session }, created: Math.floor(Date.now() / 1000) });
  const t = Math.floor(Date.now() / 1000);
  const sig = crypto.createHmac('sha256', WHSEC).update(`${t}.${payload}`).digest('hex');
  const r = await fetch(`${SITE}/api/webhooks/stripe`, { method: 'POST', headers: { 'stripe-signature': `t=${t},v1=${sig}`, 'content-type': 'application/json' }, body: payload });
  return r.status;
}

try {
  // warm up the server (first request compiles nothing in prod, but opens pools)
  await fetch(`${SITE}/shop`);

  const racket = await product('one-of-a-kind-racket');
  const balls = await product('pro-balls');
  const grip = await product('grip-tape');
  const ab = await product('abandon-test');

  // ── 1. The "last racket" rush ──────────────────────────────────────────
  console.log('\n## 1. 150 shoppers press Pay on the same one-of-a-kind racket at once');
  const rush = await Promise.all(Array.from({ length: 150 }, () => checkout([{ id: racket.id, qty: 1 }], ip())));
  const winners = rush.filter((r) => r.status === 200);
  const refused = rush.filter((r) => r.status === 409);
  check('exactly one shopper gets to the Stripe page', winners.length === 1, `${winners.length} ok, ${refused.length} told "sold out"`);
  check('no server errors (500s)', rush.every((r) => r.status < 500), [...new Set(rush.map((r) => r.status))].join(','));
  check('refusals carry a clear code for the cart', refused.every((r) => ['stock', 'unavailable'].includes(r.body?.code)));
  const win = await pay(sessionIdFromUrl(winners[0].body.url));
  const codes = await Promise.all([webhook('checkout.session.completed', win), webhook('checkout.session.completed', win), webhook('checkout.session.completed', win)]);
  check('3 duplicate webhook deliveries all answered 200', codes.every((c) => c === 200), codes.join(','));
  const r1 = await product('one-of-a-kind-racket');
  check('racket is now SOLD (gone from shop), stock 0', r1.status === 'sold' && r1.quantity === 0, JSON.stringify(r1));
  check('exactly one order recorded', (await q(`select count(*)::int n from orders where items @> $1::jsonb`, [JSON.stringify([{ id: racket.id }])]))[0].n === 1);

  // ── 2. Rush hour: 200 simultaneous complete purchases ──────────────────
  console.log('\n## 2. Rush hour: 200 shoppers buy at the same moment (2× the 100/min target, in ~1 second)');
  const ballsBefore = (await product('pro-balls')).quantity;
  const gripBefore = (await product('grip-tape')).quantity;
  const lat = { cart: [], checkout: [], webhook: [], success: [] };
  const results = await Promise.all(Array.from({ length: 200 }, async (_, n) => {
    const addr = ip();
    const items = n % 3 === 0 ? [{ id: balls.id, qty: 1 + (n % 2) }, { id: grip.id, qty: 2 }] : [{ id: grip.id, qty: 1 + (n % 4) }];
    const [c, tc] = await timed(() => cartCheck(items.map((i) => i.id), addr)); lat.cart.push(tc);
    if (c.status !== 200) return { stage: 'cart', status: c.status };
    const [co, tco] = await timed(() => checkout(items, addr)); lat.checkout.push(tco);
    if (co.status !== 200) return { stage: 'checkout', status: co.status, body: co.text };
    const s = await pay(sessionIdFromUrl(co.body.url));
    // Stripe webhook (twice) racing the customer landing on the success page.
    const [[w1, tw], w2, [sp, ts]] = await Promise.all([
      timed(() => webhook('checkout.session.completed', s)),
      webhook('checkout.session.completed', s),
      timed(() => fetch(`${SITE}/order/success?session_id=${s.id}`).then(async (r) => ({ status: r.status, html: await r.text() }))),
    ]);
    lat.webhook.push(tw); lat.success.push(ts);
    return { stage: 'done', w1, w2, success: sp.status, summary: sp.html.includes('Order summary'), items, session: s.id };
  }));
  const done = results.filter((r) => r.stage === 'done');
  const bad = results.filter((r) => r.stage !== 'done');
  check('all 200 purchases completed', done.length === 200, bad.length ? JSON.stringify(bad.slice(0, 3)) : '');
  check('every webhook answered 200', done.every((r) => r.w1 === 200 && r.w2 === 200));
  check('every customer saw their order summary on the success page', done.every((r) => r.success === 200 && r.summary));
  const sessions = done.map((r) => r.session);
  const ord = await q(`select stripe_session_id, items from orders where stripe_session_id = any($1)`, [sessions]);
  check('exactly 200 orders, no duplicates', ord.length === 200 && new Set(ord.map((o) => o.stripe_session_id)).size === 200);
  const wantBalls = done.reduce((s, r) => s + (r.items.find((i) => i.id === balls.id)?.qty ?? 0), 0);
  const wantGrip = done.reduce((s, r) => s + (r.items.find((i) => i.id === grip.id)?.qty ?? 0), 0);
  const ballsAfter = (await product('pro-balls')).quantity, gripAfter = (await product('grip-tape')).quantity;
  check('stock dropped by exactly what was sold (balls)', ballsBefore - ballsAfter === wantBalls, `${ballsBefore} → ${ballsAfter}, sold ${wantBalls}`);
  check('stock dropped by exactly what was sold (grip tape)', gripBefore - gripAfter === wantGrip, `${gripBefore} → ${gripAfter}, sold ${wantGrip}`);
  const held = (await q(`select count(*)::int n from checkout_holds where stripe_session_id = any($1) and status <> 'converted'`, [sessions]))[0].n;
  check('every reservation became a sale', held === 0);
  for (const k of Object.keys(lat)) console.log(`      ${k.padEnd(9)} p50 ${pct(lat[k], 50).toFixed(0)} ms   p95 ${pct(lat[k], 95).toFixed(0)} ms   max ${Math.max(...lat[k]).toFixed(0)} ms   (all 200 at once)`);

  // ── 2b. The real target: 100 purchases spread over one minute ───────────
  console.log('\n## 2b. Target load: 100 complete purchases in 60 seconds (one every 0.6 s) + 50 browsers');
  const paced = { checkout: [], success: [] };
  let pacedOk = 0;
  let browsing = true; let browsed = 0;
  const browsers = Array.from({ length: 50 }, async (_, w) => {
    const urls = ['/shop', '/shop/pro-balls', '/ar/shop', '/'];
    let i = w;
    while (browsing) { await fetch(SITE + urls[i++ % urls.length]).then((x) => x.arrayBuffer()).catch(() => {}); browsed++; await new Promise((r) => setTimeout(r, 1000)); }
  });
  const buyers = [];
  for (let n = 0; n < 100; n++) {
    buyers.push((async () => {
      const addr = ip();
      const [co, tco] = await timed(() => checkout([{ id: grip.id, qty: 1 }], addr));
      if (co.status !== 200) return;
      paced.checkout.push(tco);
      const s = await pay(sessionIdFromUrl(co.body.url));
      const [, [sp, ts]] = await Promise.all([
        webhook('checkout.session.completed', s),
        timed(() => fetch(`${SITE}/order/success?session_id=${s.id}`).then((r) => r.text())),
      ]);
      paced.success.push(ts);
      if (sp.includes('Order summary')) pacedOk++;
    })());
    await new Promise((r) => setTimeout(r, 600));
  }
  await Promise.all(buyers);
  browsing = false; await Promise.all(browsers);
  check('100/100 purchases completed at target load', pacedOk === 100, `while 50 visitors loaded ${browsed} pages`);
  for (const k of Object.keys(paced)) console.log(`      ${k.padEnd(9)} p50 ${pct(paced[k], 50).toFixed(0)} ms   p95 ${pct(paced[k], 95).toFixed(0)} ms   max ${Math.max(...paced[k]).toFixed(0)} ms`);

  // ── 3. Abandoned checkouts give stock back ─────────────────────────────
  console.log('\n## 3. 60 shoppers start paying for the last 60 units, then most walk away');
  const abBefore = (await product('abandon-test')).quantity;
  const starts = await Promise.all(Array.from({ length: 60 }, () => { const a = ip(); return checkout([{ id: ab.id, qty: 1 }], a).then((r) => ({ ...r, addr: a })); }));
  check('all 60 reserved', starts.every((r) => r.status === 200));
  check('shop now shows it sold out (stock 0)', (await product('abandon-test')).quantity === 0);
  const late = await checkout([{ id: ab.id, qty: 1 }], ip());
  check('61st shopper is told it is sold out', late.status === 409 && late.body?.code === 'stock');
  const cart61 = await cartCheck([ab.id], ip());
  check('…and the cart check shows maxQty 0 for them', cart61.body?.items?.[0]?.maxQty === 0);
  // 20 press the ← back link on Stripe (cancel_url → cart calls release)
  const rel = await Promise.all(starts.slice(0, 20).map((r) =>
    fetch(`${SITE}/api/checkout/release`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-real-ip': r.addr }, body: JSON.stringify({ hold: r.body.hold }) }).then((x) => x.json())));
  check('20 "cancelled on Stripe" releases', rel.every((r) => r.released === true));
  // 20 just close the tab: Stripe expires the session after 30 min and tells us
  const exp = await Promise.all(starts.slice(20, 40).map(async (r) => {
    const s = await (await fetch(`${STRIPE}/__expire/${sessionIdFromUrl(r.body.url)}`, { method: 'POST' })).json();
    return webhook('checkout.session.expired', s);
  }));
  check('20 "expired" webhooks answered 200', exp.every((c) => c === 200));
  // 20 come back and press Pay again (their old reservation is swapped, not doubled)
  const again = await Promise.all(starts.slice(40).map((r) => checkout([{ id: ab.id, qty: 1 }], r.addr, { replaceHold: r.body.hold })));
  check('20 shoppers re-start checkout successfully (own reservation swapped)', again.every((r) => r.status === 200), [...new Set(again.map((r) => r.status))].join(','));
  const abAfter = (await product('abandon-test')).quantity;
  check('stock is back to exactly 60 − 20 still-paying = 40', abAfter === abBefore - 20, `${abAfter}`);
  // repeat release = no double restock
  await Promise.all(starts.slice(0, 20).map((r) => fetch(`${SITE}/api/checkout/release`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-real-ip': r.addr }, body: JSON.stringify({ hold: r.body.hold }) })));
  check('releasing again never adds stock twice', (await product('abandon-test')).quantity === 40);

  // ── 4. Webhook lost: success page still records the order ──────────────
  console.log('\n## 4. Stripe webhook never arrives (misconfigured / outage)');
  const a4 = ip();
  const c4 = await checkout([{ id: grip.id, qty: 1 }], a4);
  const s4 = await pay(sessionIdFromUrl(c4.body.url));
  const page = await fetch(`${SITE}/order/success?session_id=${s4.id}`).then((r) => r.text());
  check('success page shows the order', page.includes('Order summary'));
  check('order saved in the database anyway', (await q(`select count(*)::int n from orders where stripe_session_id=$1`, [s4.id]))[0].n === 1);
  check('a later webhook does not duplicate it', (await webhook('checkout.session.completed', s4)) === 200 && (await q(`select count(*)::int n from orders where stripe_session_id=$1`, [s4.id]))[0].n === 1);
  const unpaid = await checkout([{ id: grip.id, qty: 1 }], ip());
  const page2 = await fetch(`${SITE}/order/success?session_id=${sessionIdFromUrl(unpaid.body.url)}`).then((r) => r.text());
  check('an UNPAID session on the success URL is not treated as an order', page2.includes('Payment not completed') && (await q(`select count(*)::int n from orders where stripe_session_id=$1`, [sessionIdFromUrl(unpaid.body.url)]))[0].n === 0);
  const page3 = await fetch(`${SITE}/order/success`, { redirect: 'manual' });
  check('success page with no session redirects to the shop', [303, 307, 308].includes(page3.status), `HTTP ${page3.status}`);

  // ── 5. Garbage / hostile input never crashes the API ───────────────────
  console.log('\n## 5. Garbage and tampered requests');
  const junk = [
    'not json', '{}', '{"items":"x"}', '{"items":[]}', '{"items":[{"id":"abc","qty":1}]}',
    JSON.stringify({ items: [{ id: grip.id, qty: -5 }] }), JSON.stringify({ items: [{ id: grip.id, qty: 1.5 }] }),
    JSON.stringify({ items: [{ id: grip.id, qty: '1; drop table products' }] }), JSON.stringify({ items: Array(80).fill({ id: grip.id, qty: 1 }) }),
    JSON.stringify({ items: [{ id: crypto.randomUUID(), qty: 1 }] }),
  ];
  const jr = await Promise.all(junk.map((b) => fetch(`${SITE}/api/checkout`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-real-ip': ip() }, body: b }).then(async (r) => ({ s: r.status, j: await r.json().catch(() => null) }))));
  check('every bad request gets a 4xx with JSON, never a 500', jr.every((r) => r.s >= 400 && r.s < 500 && r.j?.code), jr.map((r) => r.s).join(','));
  const tamper = await checkout([{ id: racket.id, qty: 5 }], ip());
  check('cannot buy a sold item by editing the request', tamper.status === 409);
  const dupLines = await checkout([{ id: ab.id, qty: 30 }, { id: ab.id, qty: 30 }], ip());
  check('duplicate cart lines are merged (60 > 40 in stock → refused)', dupLines.status === 409 && dupLines.body?.available === 40);
  const forged = await fetch(`${SITE}/api/webhooks/stripe`, { method: 'POST', headers: { 'stripe-signature': 't=1,v1=deadbeef' }, body: '{}' });
  check('forged webhook (bad signature) rejected', forged.status === 400);

  // ── 6. Bot protection ──────────────────────────────────────────────────
  console.log('\n## 6. One visitor hammering checkout (bot trying to lock up stock)');
  const botIp = ip();
  const bot = [];
  for (let i = 0; i < 34; i++) bot.push((await checkout([{ id: grip.id, qty: 1 }], botIp)).status);
  check('after 30 attempts in 10 min the bot gets 429', bot.slice(0, 30).every((s) => s === 200) && bot.slice(30).every((s) => s === 429), bot.join(','));

  // ── 7. Page load capacity ──────────────────────────────────────────────
  console.log('\n## 7. Browsing capacity: 50 concurrent visitors for 10 s on shop pages');
  const urls = ['/shop', '/ar/shop', '/shop/pro-balls', '/shop/grip-tape', '/'];
  let okN = 0, errN = 0; const pl = [];
  const end = Date.now() + 10_000;
  await Promise.all(Array.from({ length: 50 }, async (_, w) => {
    let i = w;
    while (Date.now() < end) {
      const [r, t] = await timed(() => fetch(SITE + urls[i++ % urls.length]).then(async (x) => { await x.arrayBuffer(); return x.status; }).catch(() => 0));
      pl.push(t); r === 200 ? okN++ : errN++;
    }
  }));
  check('no failed page loads', errN === 0, `${okN} pages in 10 s = ${Math.round(okN / 10)} pages/sec; p50 ${pct(pl, 50).toFixed(0)} ms, p95 ${pct(pl, 95).toFixed(0)} ms`);

  // ── 8. Security surface ────────────────────────────────────────────────
  console.log('\n## 8. Security checks');
  const home = await fetch(`${SITE}/`);
  const h = (k) => home.headers.get(k) ?? '';
  check('Content-Security-Policy is sent', /default-src 'self'/.test(h('content-security-policy')) && /object-src 'none'/.test(h('content-security-policy')));
  check('HSTS is sent', /max-age=\d{7,}/.test(h('strict-transport-security')));
  check('framework is not advertised (no X-Powered-By)', !home.headers.has('x-powered-by'));
  check('clickjacking blocked (X-Frame-Options)', h('x-frame-options') === 'SAMEORIGIN');
  const succ = await fetch(`${SITE}/order/success?session_id=cs_test_nope`);
  check('order pages are never cached', /no-store/.test(succ.headers.get('cache-control') ?? ''));
  const adm = await fetch(`${SITE}/admin/orders`, { redirect: 'manual' });
  check('admin pages redirect anonymous visitors to login', [307, 308].includes(adm.status) && (adm.headers.get('location') ?? '').includes('/admin/login'));
  const tadm = await fetch(`${SITE}/tournaments/admin`, { redirect: 'manual' });
  check('old public tournament "demo admin" is gone (redirects to protected admin)', [307, 308].includes(tadm.status));
  const tco = await fetch(`${SITE}/api/tournament-checkout`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-real-ip': ip() }, body: JSON.stringify({ slug: 'x', team: { captain: 'a', email: 'a@b.co', partner: 'b' } }) });
  check('tournament payment endpoint closed while tournaments are hidden', tco.status === 404);
  const relBad = await fetch(`${SITE}/api/checkout/release`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-real-ip': ip() }, body: JSON.stringify({ hold: "1' or '1'='1" }) });
  check('release endpoint rejects non-uuid input', relBad.status === 400);
  const unsigned = await fetch(`${SITE}/api/webhooks/stripe`, { method: 'POST', body: JSON.stringify({ type: 'checkout.session.completed', data: { object: { id: 'cs_fake', status: 'complete', payment_status: 'paid', metadata: {} } } }) });
  check('unsigned fake "payment completed" webhook is rejected', unsigned.status === 400);
  const fakeSuccess = await fetch(`${SITE}/order/success?session_id=cs_test_${'a'.repeat(24)}`).then((r) => r.text());
  check('made-up session id on success page creates nothing', !fakeSuccess.includes('Order summary') && (await q(`select count(*)::int n from orders where stripe_session_id like 'cs_test_aaaa%'`))[0].n === 0);

  // ── Final consistency audit ────────────────────────────────────────────
  console.log('\n## Final audit');
  const neg = (await q(`select count(*)::int n from products where quantity < 0`))[0].n;
  check('no product anywhere has negative stock', neg === 0);
  const orphan = (await q(`select count(*)::int n from orders o where hold_id is not null and not exists (select 1 from checkout_holds h where h.id=o.hold_id and h.status='converted')`))[0].n;
  check('every order\'s reservation is marked sold', orphan === 0);
} catch (e) {
  console.error('ERROR', e);
  fails++;
} finally {
  await db.end();
  console.log(fails ? `\n${fails} FAILURE(S)` : '\nALL PASSED');
}
