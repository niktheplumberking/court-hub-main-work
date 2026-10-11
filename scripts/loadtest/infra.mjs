// Local stand-in for production infra:
//   Postgres (real)  :54330
//   PostgREST (real) :54332   ← what Supabase runs
//   "Supabase" proxy :54331   /rest/v1/* → PostgREST (strips non-JWT auth)
//   fake Stripe      :12111   checkout sessions create/retrieve/expire + /__pay
import EmbeddedPostgres from 'embedded-postgres';
import pg from 'pg';
import http from 'node:http';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';

const REPO = fileURLToPath(new URL('../..', import.meta.url));
const SCRATCH = path.resolve('./bin'); // postgrest.exe + its DLLs go here (see README)
const dir = path.resolve('./infra-data');
fs.rmSync(dir, { recursive: true, force: true });

const db = new EmbeddedPostgres({
  databaseDir: dir, user: 'postgres', password: 'x', port: 54330, persistent: false,
  initdbFlags: ['--encoding=UTF8', '--locale=C'],
  postgresFlags: ['-c', 'max_connections=200'],
});
await db.initialise();
await db.start();
await db.createDatabase('t');
const pool = new pg.Pool({ host: 'localhost', port: 54330, user: 'postgres', password: 'x', database: 't' });
await pool.query(`create role anon; create role authenticated; create role service_role;`);
await pool.query(fs.readFileSync(`${REPO}/supabase/schema.sql`, 'utf8').split('-- ── Row Level Security ──')[0]);
await pool.query(fs.readFileSync(`${REPO}/supabase/UPGRADE-CHECKOUT.sql`, 'utf8'));
const cat = (await pool.query(`insert into categories (name, slug, sort) values ('New Rackets','new-rackets',1) returning id`)).rows[0].id;
const seed = [
  ['one-of-a-kind-racket', 'One-of-a-kind Racket', 450, 1, true],
  ['pro-balls', 'Pro Balls (3-pack)', 35, 400, false],
  ['grip-tape', 'Grip Tape', 15, 100000, false],
  ['abandon-test', 'Abandon Test Item', 100, 60, false],
];
for (const [slug, title, price, qty, uniq] of seed) {
  await pool.query(
    `insert into products (slug,title,category_id,price_aed,quantity,is_unique,status,images) values ($1,$2,$3,$4,$5,$6,'active','{}')`,
    [slug, title, cat, price, qty, uniq]);
}
console.log('[infra] postgres ready + seeded');

// PostgREST
const conf = path.join(dir, '..', 'postgrest.conf');
fs.writeFileSync(conf, [
  `db-uri = "postgres://postgres:x@127.0.0.1:54330/t"`,
  `db-schemas = "public"`,
  `db-anon-role = "postgres"`,
  `db-pool = 40`,
  `server-port = 54332`,
].join('\n'));
const pgrst = spawn(path.join(SCRATCH, 'postgrest.exe'), [conf], { stdio: ['ignore', 'pipe', 'pipe'] });
pgrst.stderr.on('data', (d) => process.stderr.write('[postgrest] ' + d));

// Supabase-shaped proxy
const agent = new http.Agent({ keepAlive: true, maxSockets: 200 });
http.createServer((req, res) => {
  if (!req.url.startsWith('/rest/v1')) { res.writeHead(404); return res.end(); }
  const headers = { ...req.headers };
  delete headers.authorization; delete headers.apikey; delete headers.host;
  const up = http.request({ host: '127.0.0.1', port: 54332, path: req.url.slice('/rest/v1'.length) || '/', method: req.method, headers, agent }, (r) => {
    res.writeHead(r.statusCode, r.headers);
    r.pipe(res);
  });
  up.on('error', (e) => { res.writeHead(502); res.end(String(e)); });
  req.pipe(up);
}).listen(54331, () => console.log('[infra] supabase proxy :54331'));

// Fake Stripe
const sessions = new Map();
const idem = new Map();
let created = 0;
const send = (res, code, obj) => { res.writeHead(code, { 'content-type': 'application/json' }); res.end(JSON.stringify(obj)); };
http.createServer((req, res) => {
  let body = '';
  req.on('data', (c) => (body += c));
  req.on('end', () => {
    const u = new URL(req.url, 'http://x');
    const p = u.pathname;
    if (req.method === 'POST' && p === '/v1/checkout/sessions') {
      const key = req.headers['idempotency-key'];
      if (key && idem.has(key)) return send(res, 200, sessions.get(idem.get(key)));
      const f = new URLSearchParams(body);
      let amount = 0;
      for (let i = 0; f.has(`line_items[${i}][quantity]`); i++) {
        amount += Number(f.get(`line_items[${i}][quantity]`)) * Number(f.get(`line_items[${i}][price_data][unit_amount]`));
      }
      const metadata = {};
      for (const [k, v] of f) { const m = k.match(/^metadata\[(.+)\]$/); if (m) metadata[m[1]] = v; }
      const id = 'cs_test_' + crypto.randomBytes(12).toString('hex');
      const s = {
        id, object: 'checkout.session', livemode: false, status: 'open', payment_status: 'unpaid',
        url: `https://checkout.stripe.test/${id}`, amount_total: amount, currency: 'aed', metadata,
        payment_intent: null, customer_details: null, collected_information: null,
        expires_at: Number(f.get('expires_at')),
      };
      sessions.set(id, s); created++;
      if (key) idem.set(key, id);
      return send(res, 200, s);
    }
    let m = p.match(/^\/v1\/checkout\/sessions\/([^/]+)$/);
    if (req.method === 'GET' && m) {
      const s = sessions.get(m[1]);
      return s ? send(res, 200, s) : send(res, 404, { error: { type: 'invalid_request_error', message: 'No such session' } });
    }
    m = p.match(/^\/v1\/checkout\/sessions\/([^/]+)\/expire$/);
    if (req.method === 'POST' && m) {
      const s = sessions.get(m[1]);
      if (!s) return send(res, 404, { error: { type: 'invalid_request_error', message: 'No such session' } });
      if (s.status !== 'open') return send(res, 400, { error: { type: 'invalid_request_error', message: 'Session is not open' } });
      s.status = 'expired';
      return send(res, 200, s);
    }
    // Test controls
    m = p.match(/^\/__pay\/([^/]+)$/);
    if (m) {
      const s = sessions.get(m[1]);
      if (!s || s.status !== 'open') return send(res, 409, { error: 'not open', status: s?.status });
      Object.assign(s, {
        status: 'complete', payment_status: 'paid', payment_intent: 'pi_test_' + crypto.randomBytes(8).toString('hex'),
        customer_details: { email: `buyer${created}@example.com`, name: 'Load Test Buyer', phone: '+971500000000' },
        collected_information: { shipping_details: { name: 'Load Test Buyer', address: { line1: '51A Street', line2: null, city: 'Dubai', state: 'Dubai', postal_code: null, country: 'AE' } } },
      });
      return send(res, 200, s);
    }
    m = p.match(/^\/__expire\/([^/]+)$/);
    if (m) {
      const s = sessions.get(m[1]);
      if (!s || s.status !== 'open') return send(res, 409, { error: 'not open' });
      s.status = 'expired';
      return send(res, 200, s);
    }
    if (p === '/__stats') return send(res, 200, { created, sessions: sessions.size });
    send(res, 404, { error: { type: 'invalid_request_error', message: 'unknown route ' + p } });
  });
}).listen(12111, () => console.log('[infra] fake stripe :12111'));

setTimeout(() => console.log('[infra] READY'), 1500);
const stop = async () => { pgrst.kill(); await pool.end(); await db.stop(); process.exit(0); };
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
