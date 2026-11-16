import { drainOrderEmails } from './outbox';

drainOrderEmails().then((result) => {
  console.log('[order email worker]', JSON.stringify(result));
  if (result.review) process.exitCode = 2;
}).catch(() => {
  console.error('[order email worker] failed; check protected configuration and outbox permissions');
  process.exitCode = 1;
});
