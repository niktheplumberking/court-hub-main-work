// Manual, explicitly addressed sample emails only. Never creates an order or charges a card.
// Build first. Run with the protected server environment; never pass an API key in argv.
const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const { renderOrderEmail } = require('../.next/order-email-worker/order-email.js');
const { sendEmail } = require('../.next/order-email-worker/resend.js');
const { validEmail } = require('../.next/order-email-worker/outbox.js');
const order = require('./order-email-fixture.cjs');

(async () => {
  const args = process.argv.slice(2);
  const recipients = [];
  let run = '';
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--to') recipients.push(args[++i]);
    else if (args[i] === '--run') run = args[++i];
    else throw new Error('Use --to address (repeatable) and --run unique-test-name');
  }
  if (!recipients.length || recipients.length > 5 || !recipients.every(validEmail) || !/^[a-z0-9-]{5,80}$/.test(run)) {
    throw new Error('Specify 1-5 valid test recipients and a stable test run name');
  }
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.ORDER_EMAIL_FROM;
  const owner = process.env.ORDER_NOTIFICATION_EMAIL || 'Court.hub.ae@gmail.com';
  const folder = process.env.ORDER_EMAIL_OUTBOX_DIR;
  if (!apiKey || !/^Court Hub <[^\r\n<>]+>$/.test(from || '') || !validEmail(owner) || !folder || !path.isAbsolute(folder)) {
    throw new Error('Set the protected Resend, sender and absolute outbox configuration first');
  }
  await fs.mkdir(folder, { recursive: true, mode: 0o700 });
  const ledgerFile = path.join(folder, `test-${run}.ledger.json`);
  let ledger;
  try { ledger = JSON.parse(await fs.readFile(ledgerFile, 'utf8')); }
  catch (error) {
    if (error.code !== 'ENOENT') throw error;
    ledger = { started: new Date().toISOString(), messages: [] };
    await fs.writeFile(ledgerFile, JSON.stringify(ledger), { mode: 0o600, flag: 'wx' });
  }
  if (Date.now() - Date.parse(ledger.started) >= 20 * 3600_000) throw new Error('Old test run: check prior delivery before choosing a new run name');
  for (const recipient of [...new Set(recipients)]) for (const kind of ['owner', 'customer']) {
    const message = { from, to: [recipient], reply_to: owner, ...renderOrderEmail(order, kind, true) };
    const hash = crypto.createHash('sha256').update(JSON.stringify(message)).digest('hex');
    if (ledger.messages.some((m) => m.hash === hash)) { console.log(`Already sent ${kind} sample to ${recipient}`); continue; }
    const id = await sendEmail(message, `court-hub-test/${run}/${hash}`, apiKey);
    ledger.messages.push({ kind, recipient, hash, id });
    const temporary = `${ledgerFile}.tmp`;
    await fs.writeFile(temporary, JSON.stringify(ledger), { mode: 0o600 });
    await fs.rename(temporary, ledgerFile);
    console.log(`Accepted ${kind} sample for ${recipient}: ${id}`);
    await new Promise((resolve) => setTimeout(resolve, 700));
  }
  console.log('Samples submitted. Verify Delivered in Resend and check the recipient inboxes; API acceptance alone is not proof of inbox delivery.');
})().catch((error) => {
  // Deliberately avoid provider response bodies and configuration values.
  console.error(error.message);
  process.exitCode = 1;
});
