# Court Hub — Launch Playbook

Step-by-step guide to take the project from "done on Vercel preview" to "live on the client's own domain, collecting real payments." Written for a non-technical operator: every step says exactly where to click. Do the phases in order.

> **Golden rule: never paste secret keys into chat, email, or WhatsApp.** Secret keys go directly from the dashboard that created them into the hosting dashboard's environment-variable form, and nowhere else.

---

## Phase 0 — What is already done (nothing to do here)

- Website (English + Arabic at `/ar`) is finished and live at https://court-hub-main-work.vercel.app
- Code lives at github.com/niktheplumberking/court-hub-main-work (auto-deploys the `main` branch)
- Supabase project (database + admin login) is connected: products, orders, categories, editable site content, admin accounts
- Stripe integration is **built and dormant** — it activates the moment real keys are added (Phase 4)
- Tournaments feature (public + admin) is live in **staging mode** (see Phase 6)
- Admin console at `/admin` (login: info@mindxbridge.com or nicolasukunda@gmail.com)

---

## Phase 1 — Accounts the CLIENT must own

The client must own the accounts that hold his money and his data. Create these WITH the client (he types his own passwords — you never see them):

1. **Stripe account** — stripe.com → Sign up with the client's business email.
   - Stripe UAE requires real business details: trade licence, Emirates ID of the owner, IBAN of the business bank account. The client fills these in himself under **Settings → Business settings**. Payouts land in his bank.
2. **WhatsApp Business number** — the phone number that receives all "Book a Court" / product / quote messages. Install WhatsApp Business on the client's phone with that number.
3. **Domain registrar login** — whoever buys the domain (Phase 2) owns the front door. Recommended: buy it in an account the client controls (or transfer later).
4. Optional but recommended: transfer the **Supabase project** and **Vercel project** to client-owned accounts at handover. Both dashboards have a "Transfer project" option (Supabase: Settings → General → Transfer; Vercel: Settings → Transfer). This can be done last — nothing breaks while you keep them.

---

## Phase 2 — Buy the domain (Hostinger)

1. Log into Atif's Hostinger account → **Domains → Get a New Domain**.
2. Search the name you want (e.g. `courthub.ae` or `courthub.com`). `.ae` gives local trust; `.com` is cheaper and simpler. Buy it.
3. Turn **ON auto-renewal** (a lapsed domain takes the site and email down).
4. Ignore every upsell (hosting, email, SSL offers) — not needed for the recommended setup below.

---

## Phase 3 — Hosting decision (read this before doing anything)

**Important fact:** this website is a Next.js application with a live server side (admin console, database, payments, Arabic/English rendering). It cannot run on Hostinger *shared/website* hosting — that only serves static files/PHP. Two working options:

### Option A — RECOMMENDED: keep Vercel, point the domain at it
Vercel already builds and runs this exact site perfectly, deploys automatically on every code update, and the Hobby tier is free (Pro is ~$20/mo if traffic grows). This is the zero-maintenance choice for a non-technical team.

1. Vercel dashboard → the **court-hub-main-work** project → **Settings → Domains** → **Add** → type the purchased domain (add both `courthub.com` and `www.courthub.com`).
2. Vercel shows you 1–2 DNS records (an `A` record `76.76.21.21` and/or a `CNAME` to `cname.vercel-dns.com`).
3. Hostinger → **Domains → Manage → DNS / Name Servers → DNS records**: add exactly those records (delete conflicting default A/CNAME records for `@` and `www`).
4. Wait up to an hour. Vercel shows a green check and issues SSL automatically. Done — the site is on the real domain.
5. Vercel → Settings → Environment Variables → set `NEXT_PUBLIC_SITE_URL` = `https://your-domain.com` → **Redeploy** (Deployments → ⋯ → Redeploy). This makes Stripe receipts/redirects and the sitemap use the real domain.

### Option B — Hostinger VPS (only if you insist on hosting at Hostinger)
Requires a **VPS plan** (KVM 1 or higher) and comfort with a Linux terminal. Summary (a developer should do this): install Node 20+, `git clone` the repo, create `.env.local` with all variables from the table in Phase 7, `npm ci && npm run build`, run with `pm2 start npm -- start`, put Nginx or Hostinger's proxy in front on ports 80/443 with a Let's Encrypt certificate, point the domain's A record at the VPS IP. You also become responsible for OS updates, restarts, and SSL renewals. The site is fully compatible with this (`next start` on any Node host) — but Option A removes all of that work.

---

## Phase 4 — Stripe: switch on real payments

Do this AFTER the domain is live (Stripe needs the final URL).

1. **Get the live keys**: Stripe dashboard (client's account) → **Developers → API keys** → copy the **Secret key** (`sk_live_…`).
2. **Create the webhook**: Developers → **Webhooks → Add endpoint**.
   - Endpoint URL: `https://your-domain.com/api/webhooks/stripe`
   - Events: select **`checkout.session.completed`** (that's the only one the site uses).
   - After saving, click the endpoint → **Reveal signing secret** (`whsec_…`).
3. **Add both to the hosting env vars** (Vercel → Settings → Environment Variables):
   - `STRIPE_SECRET_KEY` = the `sk_live_…` value
   - `STRIPE_WEBHOOK_SECRET` = the `whsec_…` value
   - Redeploy.
4. **Test with a real card for AED 5**: create a cheap test product in the admin, buy it on the live site, confirm (a) Stripe shows the payment, (b) the order appears in **Admin → Orders**, (c) stock decreased. Refund it from the Stripe dashboard afterwards.
5. Notes already handled in code: prices are always read from the database server-side (a customer cannot tamper with amounts); shipping is restricted to the UAE; tournament entry fees flow through the same Stripe account but never create shop orders.

---

## Phase 5 — WhatsApp: point every button at the real number

Every "Book a Court", quote, community and product-question button builds a WhatsApp link from ONE variable.

1. Vercel → Settings → Environment Variables → add `NEXT_PUBLIC_WHATSAPP_NUMBER` = the client's number in international format **without + or spaces**, e.g. `9715XXXXXXXX`.
2. Redeploy. Test one button on the live site — it must open the client's WhatsApp Business chat.
3. The Contact page's "dispatcher" number is editable by the client himself in **Admin → Site Content → Contact** (field: WhatsApp phone).

---

## Phase 6 — Tournaments database (the last development task)

Current state (by design): tournament admin edits and public bookings work fully but live **in server memory** — they reset whenever the site redeploys or restarts. The admin console shows a notice about this.

To make them permanent, the plan agreed with Atif: a **dedicated Supabase project** for tournaments. The code was built so this is a contained swap (only the function bodies in `lib/tournaments/server-store.ts` change; nothing else in the site is touched). When you're ready, tell your developer/Claude: "wire the tournaments store to the new Supabase project" and provide its URL + keys via the dashboards.

Until then: schedule tournament edits right after a deploy, and treat the tournaments section as live-demo quality for real registrations.

---

## Phase 7 — Environment variables master table

| Variable | What it is | Secret? | Where to get it |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Database address | No | Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public database key (`sb_publishable_…`) | No | Supabase → Settings → API keys |
| `SUPABASE_SECRET_KEY` | Server database key (`sb_secret_…`) | **YES** | Supabase → Settings → API keys |
| `STRIPE_SECRET_KEY` | Live payments key (`sk_live_…`) | **YES** | Stripe → Developers → API keys |
| `STRIPE_WEBHOOK_SECRET` | Webhook signature (`whsec_…`) | **YES** | Stripe → Developers → Webhooks |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | Business WhatsApp, digits only | No | The client's phone |
| `NEXT_PUBLIC_SITE_URL` | `https://your-domain.com` | No | You set it |

All seven must exist in the hosting dashboard (Vercel: Settings → Environment Variables, environment = Production). After ANY change: Redeploy.

---

## Phase 8 — Go-live checklist (tick every box)

- [ ] Domain opens the site with a padlock (SSL) on desktop AND phone
- [ ] `https://your-domain.com/ar` shows the Arabic site right-to-left
- [ ] Real AED 5 purchase → order in Admin → Orders → refund issued
- [ ] Tournament demo booking shows a CH- reference and appears in Admin → Tournaments → (event) → Registrations
- [ ] Every WhatsApp button opens the client's WhatsApp Business
- [ ] Admin login works for the client's account; password known only to him
- [ ] `NEXT_PUBLIC_SITE_URL` set to the real domain (check: share a product link on WhatsApp — the preview image should appear)
- [ ] Client received both user guides (`docs/USER-GUIDE.en.md` + `docs/USER-GUIDE.ar.md`) and a 30-minute walkthrough call
- [ ] Auto-renew ON: domain (Hostinger); billing healthy: Vercel, Supabase, Stripe
- [ ] Decide account transfers (Phase 1, point 4) and calendar them

## Known limitations at handover (all agreed/by design)

1. Tournament data resets on redeploy until the dedicated tournaments database is connected (Phase 6).
2. Arabic site text mirrors the professionally translated Arabic copy; the admin Content Studio edits the **English** text live. Changing Arabic wording is currently a developer request (the plumbing exists — an editing screen for it is future work).
3. Terms, Privacy, and the order-success page are English-only.
4. The public demo admin at `/tournaments/admin` is an unprotected showcase (separate from the real admin) — it saves nothing permanently.
