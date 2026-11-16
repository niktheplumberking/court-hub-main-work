import { promises as fs } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { EMAIL_TEMPLATE_VERSION, renderOrderEmail, type EmailOrder, type EmailKind } from './order-email';
import { sendEmail, EmailSendError, type EmailMessage } from './resend';

type Config = { directory: string; since: number; apiKey: string; from: string; owner: string };
type Job = { kind: EmailKind; key: string; message: EmailMessage };
type Envelope = { version: string; orderId: string; jobs: Job[] };
type Receipt = { state: 'pending' | 'sent' | 'review'; attempts: number; firstAttempt?: string; nextAttempt?: string; providerId?: string; code?: string };
const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
export const validEmail = (value: string) => /^[^\s@<>\r\n]+@[^\s@<>\r\n]+\.[^\s@<>\r\n]+$/.test(value) && value.length <= 254;
export function emailConfig(env: NodeJS.ProcessEnv = process.env): Config | null {
  if (env.ORDER_EMAILS_ENABLED !== 'true') return null;
  const directory = env.ORDER_EMAIL_OUTBOX_DIR ?? '';
  const since = Date.parse(env.ORDER_EMAILS_SINCE ?? '');
  const apiKey = env.RESEND_API_KEY ?? '';
  const from = env.ORDER_EMAIL_FROM ?? '';
  const owner = env.ORDER_NOTIFICATION_EMAIL ?? 'Court.hub.ae@gmail.com';
  const sender = /^Court Hub <([^<>\r\n]+)>$/.exec(from)?.[1] ?? '';
  if (!path.isAbsolute(directory) || !Number.isFinite(since) || !apiKey || !validEmail(sender) || !validEmail(owner)) {
    throw new Error('Order email configuration is incomplete');
  }
  // The durable outbox is a production VPS feature. Preview deployments never send.
  if (env.VERCEL) throw new Error('Order emails require the production VPS durable outbox');
  return { directory, since, apiKey, from, owner };
}
async function atomicJson(file: string, data: unknown, exclusive = false) {
  const temporary = `${file}.${randomUUID()}.tmp`;
  const handle = await fs.open(temporary, 'wx', 0o600);
  try { await handle.writeFile(JSON.stringify(data)); await handle.sync(); }
  finally { await handle.close(); }
  try {
    if (exclusive) await fs.link(temporary, file); // Fully written before readers can see it.
    else await fs.rename(temporary, file);
    const directory = await fs.open(path.dirname(file), 'r');
    try { await directory.sync(); } finally { await directory.close(); }
  } finally { await fs.unlink(temporary).catch(() => {}); }
}
async function readReceipt(file: string): Promise<Receipt> {
  try { return JSON.parse(await fs.readFile(file, 'utf8')); }
  catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error; return { state: 'pending', attempts: 0 }; }
}

/** Awaited after paid fulfillment. A queue failure makes Stripe retry, never silently drops mail. */
export async function enqueueOrderEmails(order: EmailOrder, env: NodeJS.ProcessEnv = process.env): Promise<'disabled' | 'historical' | 'exists' | 'queued'> {
  const config = emailConfig(env);
  if (!config) return 'disabled';
  const created = Date.parse(order.created_at);
  if (!Number.isFinite(created) || !UUID.test(order.id)) throw new Error('Invalid order email snapshot');
  if (created < config.since) return 'historical'; // Refreshing an old success page must not email past buyers.
  await fs.mkdir(config.directory, { recursive: true, mode: 0o700 });
  const file = path.join(config.directory, `${order.id}.json`);
  // Freeze both messages together. Retries always use the same body and recipients.
  const jobs: Job[] = (['owner', 'customer'] as const).flatMap((kind) => {
    const to = kind === 'owner' ? config.owner : order.customer_email;
    if (!to || !validEmail(to)) {
      if (kind === 'customer') console.error('[order email] customer address missing or invalid', order.id);
      return [];
    }
    return [{ kind, key: `order-confirmation/v${EMAIL_TEMPLATE_VERSION}/${order.id}/${kind}`,
      message: { from: config.from, to: [to], reply_to: config.owner, ...renderOrderEmail(order, kind, Boolean(order.test)) } }];
  });
  try { await atomicJson(file, { version: EMAIL_TEMPLATE_VERSION, orderId: order.id, jobs }, true); }
  catch (error) { if ((error as NodeJS.ErrnoException).code === 'EEXIST') return 'exists'; throw error; }
  return 'queued';
}

/** Run only via scripts/run-order-email-worker.sh, which takes an OS-wide exclusive lock. */
export async function drainOrderEmails(env: NodeJS.ProcessEnv = process.env, deliver = sendEmail, now = Date.now()) {
  const config = emailConfig(env);
  if (!config) return { disabled: true, sent: 0, pending: 0, review: 0 };
  await fs.mkdir(config.directory, { recursive: true, mode: 0o700 });
  const result = { disabled: false, sent: 0, pending: 0, review: 0 };
  const files = (await fs.readdir(config.directory)).filter((f) => /^[a-f0-9-]{36}\.json$/i.test(f)).sort();
  let processed = 0;
  for (const file of files) {
    const envelope = JSON.parse(await fs.readFile(path.join(config.directory, file), 'utf8')) as Envelope;
    if (!UUID.test(envelope.orderId)) throw new Error('Invalid outbox envelope');
    for (const job of envelope.jobs) {
      if (job.kind !== 'owner' && job.kind !== 'customer') throw new Error('Invalid email kind');
      const receiptFile = path.join(config.directory, `${envelope.orderId}.${job.kind}.receipt.json`);
      const receipt = await readReceipt(receiptFile);
      if (receipt.state === 'sent') continue;
      if (receipt.state === 'review') { result.review++; continue; }
      // Resend deduplicates for 24h. An uncertain delivery older than 20h needs human review,
      // rather than risking a duplicate once the provider's idempotency window has elapsed.
      if (receipt.firstAttempt && now - Date.parse(receipt.firstAttempt) >= 20 * 60 * 60_000) {
        await atomicJson(receiptFile, { ...receipt, state: 'review', code: 'idempotency_window' });
        result.review++; continue;
      }
      if (processed >= 20 || (receipt.nextAttempt && Date.parse(receipt.nextAttempt) > now)) { result.pending++; continue; }
      const attempt: Receipt = { ...receipt, state: 'pending', attempts: receipt.attempts + 1,
        firstAttempt: receipt.firstAttempt ?? new Date(now).toISOString() };
      // Persist before transmission, including for a network timeout with an uncertain result.
      await atomicJson(receiptFile, attempt);
      processed++;
      try {
        const id = await deliver(job.message, job.key, config.apiKey);
        await atomicJson(receiptFile, { ...attempt, state: 'sent', providerId: id });
        result.sent++;
      } catch (error) {
        const status = error instanceof EmailSendError ? error.status : 0;
        const permanent = status >= 400 && status < 500 && ![408, 409, 429].includes(status);
        const seconds = Math.max(60, Math.min(3600, 60 * 2 ** Math.min(attempt.attempts - 1, 6)), error instanceof EmailSendError ? error.retryAfter : 0);
        await atomicJson(receiptFile, { ...attempt, state: permanent ? 'review' : 'pending',
          code: status ? `provider_${status}` : 'network_or_receipt_failure', nextAttempt: new Date(now + seconds * 1000).toISOString() });
        if (permanent) result.review++; else result.pending++;
        console.error('[order email] delivery needs retry or review', envelope.orderId, job.kind, status || 'network');
      }
      // The default Resend limit is 2 requests/second across the account.
      if (deliver === sendEmail) await new Promise((resolve) => setTimeout(resolve, 600));
    }
  }
  return result;
}
