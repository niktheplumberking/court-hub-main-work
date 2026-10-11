# Checkout load tests

Proof that the shop survives heavy traffic without overselling, losing orders
or double-charging stock. Runs entirely on your machine — never touches the
live database or real Stripe.

| File | What it does |
|---|---|
| `db-stress.mjs` | Runs `supabase/UPGRADE-CHECKOUT.sql` on a throwaway real Postgres and hammers it with truly concurrent connections (200 buyers vs 1 racket, deadlock check, double-webhook, double-cancel…). |
| `infra.mjs` | Local stand-in for production: Postgres + PostgREST (the engine behind Supabase's API) + a fake Stripe. |
| `load.mjs` | Drives the real production build like real shoppers + Stripe would (rush of 200, 100 purchases/min paced, abandoned checkouts, lost webhooks, garbage input, bots, page capacity). |
| `run-all.sh` | Fresh test world → `next build` → `next start` → `load.mjs` → tear down. |

## One-time setup

```bash
cd scripts/loadtest
npm init -y && npm i embedded-postgres pg undici
```

PostgREST (only needed for `run-all.sh`): download `postgrest-vXX-windows-x86-64.zip`
from https://github.com/PostgREST/postgrest/releases, unzip `postgrest.exe` into
`scripts/loadtest/bin/`, then copy next to it:
`node_modules/@embedded-postgres/windows-x64/native/bin/*.dll` and (Windows 10)
`C:\Windows\System32\downlevel\api-ms-win-*.dll`.

## Run

```bash
node scripts/loadtest/db-stress.mjs     # ~10 s, database logic only
bash scripts/loadtest/run-all.sh        # ~4 min, full end-to-end
```

`run-all.sh` builds `.next` with test settings and deletes it when done, so
your next `npm run dev` starts clean.

## Results (11 Oct 2026, Windows laptop, single Node process)

- 150 simultaneous buyers, 1 one-of-a-kind racket → exactly 1 sale, 149 clean "sold out".
- 200 complete purchases fired in the same second → 200 orders, 0 duplicates, stock exact.
- 100 purchases paced over 60 s + 50 browsing visitors → checkout p50 15 ms / p95 213 ms.
- Abandoned, expired, re-started checkouts → stock returned exactly once.
- Webhook never arrives → order still recorded from the success page.
- ~140 shop pages/second served with 50 concurrent visitors, 0 errors.
