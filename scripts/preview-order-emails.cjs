const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
execFileSync(process.execPath, ['scripts/build-order-email-worker.cjs']);
const { renderOrderEmail } = require('../.next/order-email-worker/order-email.js');
const order = require('./order-email-fixture.cjs');
const target = path.resolve('.qa/v1.6-email-preview');
fs.mkdirSync(target, { recursive: true });
for (const kind of ['owner', 'customer']) {
  const message = renderOrderEmail(order, kind, true);
  fs.writeFileSync(path.join(target, `${kind}.html`), message.html);
  fs.writeFileSync(path.join(target, `${kind}.txt`), message.text);
}
fs.writeFileSync(path.join(target, 'customer-ar.html'), renderOrderEmail({ ...order, locale: 'ar' }, 'customer', true).html);
fs.writeFileSync(path.join(target, 'index.html'), '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Court Hub email previews</title><body style="margin:24px;background:#EAF3FF;color:#0A2A66;font-family:Arial"><h1>COURT HUB <span style="color:#1F5FD6">EMAIL PREVIEWS</span></h1><p>Sample details only. No purchase or payment.</p><p><a href="owner.html">Owner notification</a> · <a href="customer.html">Customer confirmation</a> · <a href="customer-ar.html">Arabic confirmation</a></p><div style="display:flex;gap:20px;flex-wrap:wrap"><iframe title="Owner notification" src="owner.html" style="width:600px;max-width:100%;height:1600px;border:0"></iframe><iframe title="Customer confirmation" src="customer.html" style="width:600px;max-width:100%;height:1600px;border:0"></iframe></div></body>');
console.log(`Email previews: ${target}`);
