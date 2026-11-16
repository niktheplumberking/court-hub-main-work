const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
execFileSync(process.execPath, ['scripts/build-order-email-worker.cjs']);
const { renderOrderEmail } = require('../.next/order-email-worker/order-email.js');
const { enqueueOrderEmails, drainOrderEmails, emailConfig } = require('../.next/order-email-worker/outbox.js');
const { sendEmail, EmailSendError } = require('../.next/order-email-worker/resend.js');
const fixture = require('./order-email-fixture.cjs');

(async () => {
  await fs.mkdir(path.resolve('.qa'), { recursive: true });
  const directory = await fs.mkdtemp(path.resolve('.qa/email-tests-'));
  const env = { ORDER_EMAILS_ENABLED: 'true', ORDER_EMAILS_SINCE: '2026-11-16T00:00:00Z',
    ORDER_EMAIL_OUTBOX_DIR: directory, RESEND_API_KEY: 'fake-key-no-network',
    ORDER_EMAIL_FROM: 'Court Hub <orders@courthub.ae>', ORDER_NOTIFICATION_EMAIL: 'owner@example.com' };
  const now = Date.parse('2026-11-16T06:00:00Z');
  assert.equal(emailConfig({}), null);
  assert.throws(() => emailConfig({ ...env, VERCEL: '1' }), /production VPS/);
  assert.throws(() => emailConfig({ ...env, ORDER_EMAILS_SINCE: '' }), /incomplete/);
  assert.throws(() => emailConfig({ ...env, ORDER_EMAIL_FROM: 'Court Hub <a@b.com>\r\nBcc: bad@b.com' }));
  const customer = renderOrderEmail(fixture, 'customer', true);
  const owner = renderOrderEmail(fixture, 'owner', true);
  assert.match(customer.subject, /^\[TEST\].*#C0A71601/);
  assert.match(customer.html, /Thanks for your order, Alex!/);
  assert.match(owner.html, /New order received/);
  for (const msg of [customer, owner]) {
    assert.match(msg.html, /COURT <span[^>]*>HUB/);
    assert.match(msg.html, /AED 3,347\.99/);
    assert.match(msg.html, /Quantity: 2/);
    assert.match(msg.html, /\+971 55 883 3836/);
    assert.match(msg.html, /No purchase has been made/);
    assert.match(msg.text, /No purchase or payment/);
    assert(!msg.html.includes('\u2014'));
  }
  assert(!customer.html.includes('/admin/orders'));
  assert.match(owner.html, /https:\/\/courthub.ae\/admin\/orders/);
  const ar = renderOrderEmail({ ...fixture, locale: 'ar' }, 'customer');
  assert.match(ar.html, /lang="ar" dir="rtl"/);
  assert.match(ar.html, /شكراً لطلبك/);
  const unsafe = renderOrderEmail({ ...fixture, customer_name: '<img src=x onerror=alert(1)>',
    items: [{ ...fixture.items[0], title: '<script>alert(1)</script>', image: 'https://evil.example/pixel' }] }, 'customer');
  assert(!unsafe.html.includes('<script>'));
  assert(!unsafe.html.includes('https://evil.example'));
  assert(unsafe.html.includes('&lt;img'));
  assert.equal(await enqueueOrderEmails(fixture, {}), 'disabled');
  assert.equal(await enqueueOrderEmails({ ...fixture, created_at: '2026-10-25T01:00:00Z' }, env), 'historical');
  // Race the success page and webhook. Exactly one immutable envelope must win.
  const queued = await Promise.all(Array.from({ length: 10 }, () => enqueueOrderEmails(fixture, env)));
  assert.equal(queued.filter((r) => r === 'queued').length, 1);
  const file = path.join(directory, `${fixture.id}.json`);
  const envelope = JSON.parse(await fs.readFile(file, 'utf8'));
  assert.equal(envelope.jobs.length, 2);
  assert.deepEqual(envelope.jobs[0].message.to, ['owner@example.com']);
  assert.deepEqual(envelope.jobs[1].message.to, ['sample@example.com']);
  assert.equal((await fs.stat(file)).mode & 0o777, 0o600);
  // Partial failure: owner sent, customer 429. Retry only the failed customer email.
  const calls = [];
  const deliver = async (message, key) => { calls.push(key); if (key.endsWith('/customer')) throw new EmailSendError(429); return 'owner-message'; };
  let result = await drainOrderEmails(env, deliver, now);
  assert.equal(result.sent, 1); assert.equal(result.pending, 1);
  result = await drainOrderEmails(env, async (_, key) => { calls.push(key); return 'customer-message'; }, now + 61_000);
  assert.equal(result.sent, 1);
  assert.equal(calls.filter((k) => k.endsWith('/owner')).length, 1);
  assert.equal(calls.filter((k) => k.endsWith('/customer')).length, 2);
  // Old duplicate payment webhooks cannot resend beyond the provider's 24h window.
  await enqueueOrderEmails({ ...fixture, customer_email: 'changed@example.com' }, env);
  result = await drainOrderEmails(env, async () => { throw new Error('must not send'); }, now + 48 * 3600_000);
  assert.equal(result.sent, 0); assert.equal(result.review, 0);
  const uncertain = { ...fixture, id: 'c0a71602-1234-4000-8000-000000000002' };
  await enqueueOrderEmails(uncertain, env);
  await drainOrderEmails(env, async () => { throw new Error('uncertain timeout'); }, now);
  result = await drainOrderEmails(env, async () => { throw new Error('must not retry after window'); }, now + 21 * 3600_000);
  assert.equal(result.review, 2);
  // The transport must always carry stable idempotency, a text alternative and a timeout.
  await sendEmail(envelope.jobs[0].message, 'stable-key', 'fake-token', async (url, options) => {
    assert.equal(url, 'https://api.resend.com/emails');
    assert.equal(options.headers['Idempotency-Key'], 'stable-key');
    assert.equal(options.headers.Authorization, 'Bearer fake-token');
    assert(JSON.parse(options.body).text); assert(options.signal);
    return new Response(JSON.stringify({ id: 'mock-id' }), { status: 200 });
  });
  await fs.rm(directory, { recursive: true });
  console.log('PASS: branded EN/AR templates, safe HTML/images, totals, recipients, activation boundary, concurrent enqueue, durable duplicate prevention, partial retries, 24h ambiguity protection, private files and transport. No emails sent.');
})().catch((error) => { console.error(error); process.exitCode = 1; });
