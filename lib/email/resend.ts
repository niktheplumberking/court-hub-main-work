export type EmailMessage = { from: string; to: string[]; reply_to: string; subject: string; html: string; text: string };
export class EmailSendError extends Error {
  constructor(public status: number, public retryAfter = 60) { super(`Email provider returned HTTP ${status}`); }
}
export async function sendEmail(message: EmailMessage, key: string, apiKey: string, fetcher: typeof fetch = fetch) {
  const response = await fetcher('https://api.resend.com/emails', {
    method: 'POST', headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json', 'Idempotency-Key': key },
    body: JSON.stringify(message), signal: AbortSignal.timeout(20_000),
  });
  // Never log response bodies: they can echo customer details or credentials.
  if (!response.ok) throw new EmailSendError(response.status, Number(response.headers.get('retry-after')) || 60);
  const data = await response.json();
  if (typeof data.id !== 'string' || !data.id) throw new Error('Email provider returned no message ID');
  return data.id as string;
}
