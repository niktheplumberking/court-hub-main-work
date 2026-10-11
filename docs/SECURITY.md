# Court Hub — Security overview

Plain-language summary of how the shop, admin and customer data are protected.
Last full audit: 11 Oct 2026.

## Payments: no order without real money
- **Card details never touch our server.** Customers pay on Stripe's own hosted page;
  we receive only "paid / not paid" plus name, email, phone and delivery address.
  (Card-data compliance burden is the lightest level: PCI SAQ A.)
- **Prices come only from our database.** The browser sends product ids and quantities;
  the server looks up prices and stock. Editing the request cannot change a price.
- **An order is created only after Stripe confirms payment**, by one of two ways:
  1. a Stripe webhook carrying a cryptographic signature only Stripe can produce
     (forged or unsigned "payment completed" messages are rejected), or
  2. the confirmation page asking Stripe directly whether that checkout is paid.
  A made-up or unpaid checkout id creates nothing.
- **Charged amount is cross-checked** against the reserved items (AED only);
  a mismatch is logged and flagged "Check amount" in Admin → Orders.
- **No overselling:** stock is reserved inside one database transaction the moment
  payment starts (tested: 150 people buying one racket at once → exactly 1 sale).
- **Tournament entries** can only be booked through a verified paid Stripe checkout;
  the old no-payment demo path is switched off on the real site, and the payment
  endpoint is closed while the tournaments section is hidden.
- Stripe key on the server is a **restricted key** (can only create/read checkouts).

## Admin console
- Sign-in happens on the server. Session cookies are **httpOnly** (no script can read
  them), **Secure** (HTTPS only) and **SameSite** (not sent by other websites).
- Every admin page and every admin action checks the account is **enrolled in the
  admins list** — being logged in is not enough.
- Password guessing is throttled (per IP and per email); errors never reveal whether
  an email exists. Public sign-ups are disabled in Supabase.
- Changing the password requires the **current password**.

## Customer data
- Database rules (RLS): visitors can read only active products and site text.
  Orders, drafts and inquiries are readable **only by enrolled admins**; stock and
  order functions can be called **only by the server**.
- The order confirmation page shows a masked email (j***@gmail.com), is never
  cached and never indexed by search engines.
- Uploaded product images: JPG/PNG/WebP/AVIF/GIF only, 10 MB max.

## Website & server
- Browser security headers: Content-Security-Policy (blocks injected scripts and
  foreign forms), HSTS (HTTPS only), clickjacking protection, no-sniff,
  strict referrer policy; framework version hidden.
- Bots: checkout limited to 30 starts per 10 min per visitor; nginx flood limits.
- Server: firewall (only SSH + web), SSH brute-force banning (fail2ban), automatic
  Ubuntu security updates, app reachable only through nginx, secrets file root-only.
- Dependencies patched (Next.js 15.5.27, React 19.0.8, sharp 0.35.5) — includes
  fixes for critical Next.js advisories affecting self-hosted sites.

## Re-test any time
`scripts/loadtest/` — stress, permission (RLS) and security tests. See its README.

## Recommended owner settings (optional, 5 minutes)
- Supabase → Authentication → Policies: minimum password length 10.
- Stripe → Settings → Team: enable two-step authentication for every member.
- Hostinger: enable two-factor login on the hosting account.
