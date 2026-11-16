const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const fixture = require('./order-email-fixture.cjs');
let queues = [], inserts = 0, conversions = 0, conversion = 'converted';
const db = {
  from(table) {
    if (table === 'checkout_holds') return { select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { items: fixture.items } }) }) }) };
    if (table === 'orders') return {
      upsert: () => { inserts++; return { select: async () => ({ data: [{ id: fixture.id }] }) }; },
      select: () => ({ eq: () => ({ single: async () => ({ data: { ...fixture, status: 'paid' } }) }) }),
    };
    if (table === 'products') return { select: () => ({ in: async () => ({ data: fixture.items.map(i => ({ id: i.id, images: [i.image] })) }) }) };
    throw new Error(`Unexpected table ${table}`);
  },
  rpc: async () => { conversions++; return { data: conversion }; },
};
const moduleFixture = { exports: {} };
const code = ts.transpileModule(fs.readFileSync('lib/shop/fulfill.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const env = { ORDER_EMAILS_ENABLED: 'true' };
vm.runInNewContext(code, { module: moduleFixture, exports: moduleFixture.exports, process: { env }, console,
  require: name => {
    if (name === 'next/cache') return { revalidatePath() {} };
    if (name === '@/lib/supabase/admin') return { supabaseAdmin: () => db };
    if (name === '@/lib/stripe') return { getStripe: () => null };
    if (name === '@/lib/email/outbox') return { enqueueOrderEmails: async order => { queues.push(order); } };
    throw new Error(`Unexpected import ${name}`);
  },
});
const fulfill = moduleFixture.exports.fulfillCheckoutSession;
const session = { id: 'cs_test_fixture', status: 'complete', payment_status: 'paid', livemode: false,
  currency: 'aed', amount_total: 334799, metadata: { hold_id: 'fixture-hold', locale: 'ar' } };
(async () => {
  assert.equal(await fulfill({ ...session, status: 'open', payment_status: 'unpaid' }), 'unpaid');
  assert.equal(await fulfill({ ...session, metadata: { type: 'tournament_registration' } }), 'skipped');
  assert.equal(inserts, 0); assert.equal(queues.length, 0);
  assert.equal(await fulfill(session), 'ok');
  assert.equal(inserts, 1); assert.equal(conversions, 1); assert.equal(queues.length, 1);
  assert.equal(queues[0].id, fixture.id);
  assert.equal(queues[0].locale, 'ar'); assert.equal(queues[0].test, true);
  assert.equal(queues[0].review, false);
  assert.equal(queues[0].items[0].image, fixture.items[0].image);
  conversion = 'late';
  assert.equal(await fulfill(session), 'late'); assert.equal(queues[1].review, true);
  conversion = 'converted';
  await fulfill({ ...session, currency: 'usd' }); assert.equal(queues[2].review, true);
  env.ORDER_EMAILS_ENABLED = 'false';
  await fulfill(session); assert.equal(queues.length, 3);
  console.log('PASS: unpaid/tournament skip, paid fulfillment queues persisted order/photos, Arabic locale, test-mode marking, stock/amount review flag, disabled feature leaves checkout unchanged. No network, orders, payments or emails created.');
})().catch(error => { console.error(error); process.exitCode = 1; });
