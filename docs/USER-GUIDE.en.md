# Court Hub — Owner's User Guide (English)

Welcome! This guide teaches you, the site owner, how to run everything yourself — no technical knowledge needed. Keep it next to you the first weeks; everything is written as "click this, then this."

Your website has two sides:
- **The public site** — what customers see: `https://your-domain.com` (English) and `https://your-domain.com/ar` (Arabic).
- **Your admin console** — where you manage everything: `https://your-domain.com/admin`.

---

## 1. Logging in

1. Go to `/admin` (e.g. `https://your-domain.com/admin`). You'll see the Court Hub login screen.
2. Enter your admin email and password → **Sign in**.
3. Forgot the password? It cannot be emailed to you automatically — contact your developer, who resets it from the database dashboard in one minute. Choose a strong password and save it in your phone's password manager.
4. Always **Sign out** (top-right) on shared computers.

> Only accounts on the approved admins list can do anything here — even if someone else somehow got a login, the system rejects them.

## 2. The Dashboard

After login you land on the dashboard. The top bar is your menu: **Dashboard · Products · Categories · Orders · Tournaments · Site Content · View site**. "View site ↗" opens the public website in a new tab — use it constantly to check your changes.

## 3. Changing website text and pictures (Site Content)

Click **Site Content**. This is your editing studio for the words and images on Home, About, Contact, Construct Your Court, and the Shop page headers.

- **Left side**: the editable fields, grouped by section. Use the search box to find any text quickly.
- **Right side**: a live preview of the real page.
- **The magic shortcut**: hover over the preview — editable areas glow with a dashed outline and an "✎ Edit" tag. **Click directly on the text you want to change** and the correct field opens on the left.
- Type your new text → **Save**. The change is live on the real website within moments. No "publish" step needed.
- Made a mess? Every field has a **Reset** that restores the original professional copy.
- **Images**: image fields let you upload a new picture (JPG/PNG/WebP). Use good-quality photos; the system stores them safely.

> **Arabic pages:** the Arabic site is a professional translation that mirrors your English content's meaning. Editing here changes the **English** site. To change specific Arabic wording, send the new Arabic text to your developer — it's a small task.

## 4. Products (your shop)

Click **Products**.

- **Add a product**: **New Product** → fill in title, description, price in AED, quantity in stock, category, and upload photos → **Save**. It appears in the shop immediately.
- **Sale price**: enter a lower "sale" price to show the crossed-out original and a discount badge.
- **One-of-a-kind items** (e.g. a used racket): mark it *unique* — the moment someone buys it, it automatically disappears from the shop.
- **Edit / remove**: click any product in the list to change it, or delete it.
- **Stock**: when a customer pays, stock decreases by itself. When it hits zero the product shows as unavailable.

## 5. Categories

Click **Categories** to add or remove the product groups customers filter by (e.g. "Pro Rackets", "Gear & Balls"). You can't delete a category that still has products in it — move or delete those products first.

## 6. Orders (your sales)

Click **Orders**. Every paid checkout appears here automatically with: what was bought, quantity, amount in AED, the customer's name, email, phone, and shipping address in the UAE.

- Money arrives via **Stripe** into your bank account (Stripe pays out on a rolling schedule — see your Stripe dashboard).
- Refunds are done in the **Stripe dashboard** (stripe.com → Payments → choose the payment → Refund), not in the site admin.
- Ship the order, then contact the customer via the phone/email on the order.

## 7. Tournaments

Click **Tournaments**. You control everything the public sees on the Tournaments pages.

> ⚠️ **Important — read once:** for now, tournament edits and registrations live in temporary storage. They can reset when the website is updated/redeployed. This is a known, planned stage — a permanent tournaments database is the next upgrade. Until then: make tournament edits shortly after the site was last updated, and export/write down important registrations.

- **The list** shows all events with status, registered pairs, bookings and fees.
- **+ New Tournament**: name, dates, venue, format (Groups+Knockout or Round Robin), category (P25–P250), division (Men/Women/Mixed), capacity, entry fee, prize pool, cover image (pick from the gallery or paste an image address), and **status**:
  - **Open** = "Book Your Spot" button (people can register and pay)
  - **Upcoming** = "Get Notified" (no booking yet)
  - **Live** = "Watch Live" (event running now — shows the live banner on the hub if the Final is live)
  - **Completed** = "View Results"
- **Manage draw** (per tournament): this is match control.
  - **Groups & Standings**: add groups (A, B…), add each pair with players and nationality, and type their Played/Won/Lost/Sets/Points as results come in. Tick **Q** for pairs that qualify.
  - **Knockout Bracket**: for Semifinals/Final/3rd place, type pair names and set scores as comma lists ("6, 4" means 6 then 4). Mark a match **Live** to show it live (a live Final appears on the tournaments homepage banner!). Mark **Done** when finished.
  - **Order of Play**: the day-by-day schedule the public sees.
  - Every save is instantly visible on the public site.
- **Points Tables**: how many season points each finishing position earns, per category. Shown on every tournament page.
- **Leaderboard**: add/edit the season ranking rows shown at `/leaderboards` (pair name, division, events, titles, points).
- **Registrations & Payments** (inside each tournament): every public booking with the pair's details, amount, payment method, reference (CH-XXXXXX) and a status you can change (demo/pending/paid/cancelled).

## 8. WhatsApp — where customers reach you

Every "Book a Court", quote and community button opens WhatsApp to your business number with a pre-written message. Answer fast — this is your main sales channel. The Contact page lets customers pick a department (Construction / Shop / Tournaments) so you know what they want before you open the chat.

## 9. If something looks wrong

| Problem | What to do |
|---|---|
| My saved text isn't on the site | Wait 1–2 minutes and refresh (hold Shift while clicking refresh). Still old? Save the field again. |
| I can't log in | Check email spelling; passwords are case-sensitive. Still stuck → ask the developer for a reset. |
| A product photo won't upload | Use JPG/PNG/WebP under 8 MB. Rename the file to simple letters (no Arabic/symbols in the filename). |
| A tournament edit disappeared | The site was redeployed (see the ⚠️ note in section 7). Re-enter it; ask about the permanent database upgrade. |
| A customer says payment failed | Check stripe.com → Payments. If there's no payment, ask them to retry; card errors are shown to them at checkout. |
| The site is down | Check status: vercel.com and supabase.com status pages, then contact the developer. |

## 10. Golden rules

1. **Never share passwords or keys in chat.** Anyone asking for them in a message is a red flag.
2. After every change, look at the public site (**View site ↗**) — English AND Arabic (`/ar`).
3. Keep photos high quality but sensible in size (under ~2 MB each is ideal).
4. You cannot break the website from the admin — everything you edit can be reset. Explore freely.
