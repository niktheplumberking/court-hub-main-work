# Court Hub — Stripe Handover Checklist

Everything needed to switch on real card payments on https://courthub.ae.
Sections A and B are for the **client**. Section C is how the keys reach us safely.
Section D is our side.

> **Never send a Stripe secret key by WhatsApp, email, SMS or chat.** See section C for
> the three acceptable ways. A leaked secret key lets someone charge and refund money on
> the client's account.

---

## A. What the client finishes inside Stripe first

Log in at **stripe.com** with the business account. All of this is in the dashboard.

| # | Task | Where | Why it matters |
|---|---|---|---|
| 1 | **Complete account activation** — trade licence, owner's Emirates ID / passport, business address | Home → "Activate payments" / Settings → Business settings | Until this is approved the account can only take TEST payments |
| 2 | **Add the payout bank account (AED, UAE IBAN)** | Settings → Business → Bank accounts and currencies | This is where the money actually lands |
| 3 | **Confirm the account is out of test mode** | Top-right toggle should show **live** data | Test keys never move real money |
| 4 | **Set the statement descriptor** (max 22 characters, e.g. `COURTHUB`) | Settings → Business → Public details | This is what shows on the buyer's card statement. A confusing name causes chargebacks |
| 5 | **Set public support email + phone** | Settings → Business → Public details | Printed on Stripe receipts; reduces disputes |
| 6 | **Enable payment methods**: Cards (required). Apple Pay / Google Pay work automatically with Stripe Checkout | Settings → Payment methods | Cards are the essential one |
| 7 | **Turn on email receipts** | Settings → Customer emails → "Successful payments" | Buyers get an automatic receipt; no work for the client |
| 8 | **Confirm presentment currency is AED** | Settings → Business → Bank accounts and currencies | The website prices everything in AED |

### Notes on payment methods
- **Cards + Apple Pay + Google Pay**: included, nothing extra to build.
- **Tabby / Tamara (buy-now-pay-later)**: the tournament booking demo screen shows these
  as options, but they are **not** connected. With Stripe live, checkout uses Stripe's own
  methods. Adding Tabby/Tamara later is a separate integration — worth deciding, not a blocker.

---

## B. The two values we need

Only two. Nothing else.

### 1. The API key — `STRIPE_SECRET_KEY`

**Preferred (safer): a RESTRICTED key.** The website only ever creates and reads Checkout
Sessions, so it does not need a full-power key.

- Stripe → **Developers → API keys → Create restricted key**
- Name it: `Court Hub website`
- Set permission: **Checkout Sessions → Write**
- Everything else: **None**
- Create, then copy the value (starts with `rk_live_…`)

**Simpler alternative:** the standard **Secret key** (`sk_live_…`) from the same page.
It works identically but can do anything on the account, so the restricted key is better.

### 2. The webhook signing secret — `STRIPE_WEBHOOK_SECRET`

This is what lets the website trust that a "payment succeeded" message really came from Stripe.

- Stripe → **Developers → Webhooks → Add endpoint**
- **Endpoint URL:** `https://courthub.ae/api/webhooks/stripe`
- **Events to send:** select exactly one — **`checkout.session.completed`**
- Save, then open the endpoint and click **Reveal signing secret** (starts with `whsec_…`)

---

## C. How to hand the keys over safely

Pick ONE. They are listed best-first.

**Option 1 — Give us temporary access instead of sending keys (recommended).**
Stripe → **Settings → Team and security → Team → New member**, invite our email with the
**Developer** role. We create the restricted key and the webhook ourselves, install them,
and the client removes our access afterwards. No secret ever travels through a message.

**Option 2 — A one-time secret link.** Use a password manager's share feature
(1Password "Share item", Bitwarden Send, Proton Pass link) set to expire after one view.
Send the link by one channel and, if possible, mention it on a call.

**Option 3 — Read it out on a call / screen share** while we paste it straight into the
server. Nothing gets stored in a chat history.

❌ **Not acceptable:** WhatsApp, email, SMS, Slack, a shared doc, or pasting into an AI chat.

---

## D. What we do once we have them (about 20 minutes)

1. Add both values to `/var/www/courthub/.env.local` on the server:
   - `STRIPE_SECRET_KEY=…`
   - `STRIPE_WEBHOOK_SECRET=…`
2. `pm2 restart courthub` — payments switch from demo mode to live automatically.
3. **Live test:** create a cheap product (AED 5), buy it on the real site with a real card.
4. Verify all four: money in Stripe → order in **Admin → Orders** → stock decreased →
   webhook shows `200` in Stripe → **refund the test payment**.
5. Confirm the customer receipt email arrived.

### Already handled in the code (no action needed)
- Prices and tournament fees are read from the database **server-side** — a customer cannot
  tamper with the amount at checkout.
- Shipping address collection is restricted to the **UAE**.
- Webhook messages are **signature-verified**; anything unsigned is rejected.
- Tournament entry fees run through the same Stripe account but never create shop orders.
- The order is only created after Stripe confirms payment, and is idempotent (a repeated
  webhook cannot double-count an order).

---

## E. Decide with the client before going live

- **Statement descriptor** wording (section A, item 4)
- **Who issues refunds** and the refund window (refunds happen in the Stripe dashboard)
- **Payout schedule** — Stripe's default is fine for most businesses
- **Delivery/shipping promise** shown to buyers (currently UAE only)
