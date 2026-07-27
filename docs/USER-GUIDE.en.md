# Court Hub — Owner's User Guide (English)

Welcome! This guide teaches you, the site owner, how to run everything yourself — no technical knowledge needed. Everything is written as "click this, then this," with real examples. Keep it next to you during the first weeks.

Your website has two sides:
- **The public site** — what customers see: `https://your-domain.com` (English) and `https://your-domain.com/ar` (Arabic).
- **Your admin console** — where you manage everything: `https://your-domain.com/admin`.

> 🔑 Your login email and password will be written on the separate credentials sheet you receive at handover. Never share them in chat or email.

---

## 1. Logging in

1. Open `/admin` (e.g. `https://your-domain.com/admin`). You'll see the Court Hub login screen.
2. Enter your admin email and password → **Sign in**.
3. Forgot the password? It cannot be emailed automatically — contact your developer, who resets it from the database dashboard in one minute. Then store the new one in your phone's password manager.
4. Always **Sign out** (top-right) on shared computers.

> Only accounts on the approved admins list can change anything — even if a stranger somehow created a login, the system rejects them.

## 2. The Dashboard — your map

After login you land on the dashboard. The top bar is your menu:

| Menu item | What it manages |
|---|---|
| **Products** | Everything for sale in the shop |
| **Categories** | The groups customers filter products by |
| **Orders** | Every paid sale, with customer + shipping details |
| **Tournaments** | Everything on the public tournament pages |
| **Site Content** | The words and pictures on the website's pages |
| **View site ↗** | Opens the public website in a new tab — use it after every change |

---

## 3. Products — adding, editing, and selling (read this section fully!)

Click **Products** in the top bar. You'll see the list of everything in your shop with photo, price, stock, and status.

### 3.1 Adding a new product, field by field

Click **New Product**. Here is every field and exactly what it does:

| Field | Required? | What to type | Example |
|---|---|---|---|
| **Title** | ✅ Yes | The full name shown everywhere — searchable, so include brand + model | "Babolat Technical Viper 2023" |
| **Brand** | No | Manufacturer only | "Babolat" |
| **Model** | No | Model only | "Technical Viper" |
| **Description** | No (but always write one) | 2–5 sentences: who it's for, what makes it special, condition notes for used items. This is your salesperson. | "Aggressive diamond shape for advanced attackers. 12K carbon face, fresh grip. Light scratches on the bumper, zero structural wear." |
| **Specs** (head size, weight, grip size, balance, year) | No | Fill what you know — buyers of rackets care a lot | weight: "365 g", year: "2023" |
| **Images** | Strongly recommended | Upload 2–5 photos (see 3.2) | — |
| **Status** | ✅ | See 3.3 | Active |
| **Category** | ✅ Yes | Pick from your categories (section 4) | Pro Rackets |
| **Condition** | For used gear | New / Like New / Good / Fair — shown as a badge to buyers | Good |
| **Price (AED)** | ✅ Yes | What the customer pays | 850 |
| **Compare-at price (AED)** | No | The OLD/original price. If you fill it AND it's higher than Price, the shop automatically shows it crossed out with a discount badge — this is how you make a SALE | 1200 |
| **Quantity** | Yes (unless Unique) | How many you have. Sells down automatically with each order; at 0 the product shows unavailable | 4 |
| **Unique item** checkbox | For one-offs | Tick for one-of-a-kind items (a specific used racket). Quantity locks to 1 and **the product removes itself from the shop the second it sells** — you can never sell it twice | ✓ for used rackets |
| **Instagram post URL** | No | If the item has an Instagram post, paste its link | — |

Click **Save** — the product is live in the shop immediately. Open **View site ↗ → Shop** to admire it.

### 3.2 Product photos — rules that make you money

- Upload **2–5 photos** per product: front, back, close-up of any wear (for used), and one lifestyle shot if you have it.
- Square-ish photos look best in the shop grid. Good daylight, plain background.
- JPG/PNG/WebP, each under ~8 MB. Give files simple English names (`viper-front.jpg`, not `صورة ١.jpg`).
- The FIRST photo is the cover shown in the shop grid — put the best one first (you can delete and re-upload to reorder).
- For used items: photograph the flaws honestly. It builds trust and prevents returns.

### 3.3 Product status — the visibility switch

| Status | What it means |
|---|---|
| **Active** | Live in the shop, buyable |
| **Draft** | Hidden from customers — use while you prepare photos/text |
| **Sold** | Hidden, kept for your records (unique items switch to this automatically when bought) |
| **Archived** | Hidden, old stock you want out of the way |

Workflow tip: create as **Draft**, perfect it, then flip to **Active**.

### 3.4 Editing, discounting, and removing

- **Edit**: click the product in the list → change anything → Save. Changes are live instantly.
- **Run a sale**: set Compare-at price = old price, Price = new lower price. Ending the sale = clear Compare-at.
- **Remove from shop**: set status to Draft/Archived (recoverable) — or delete permanently from the edit screen (cannot be undone).

### 3.5 A complete worked example — listing a used racket in 3 minutes

1. Products → New Product.
2. Title: "HEAD Alpha Pro 2022 — Used". Brand: HEAD. Model: Alpha Pro.
3. Description: "Balanced teardrop for intermediate players. Fresh overgrip, edges protected by bumper tape from day one. Small cosmetic marks, photos show all of them."
4. Specs: weight 360 g, year 2022. Condition: **Good**.
5. Photos: front, back, close-up of the marks.
6. Category: Pre-Owned. Price: 480. Compare-at: 900 (shows "-47%"). Tick **Unique item**.
7. Status: Active → Save. Done — it's live, and it will vanish by itself when it sells.

---

## 4. Categories — how customers filter your shop

Click **Categories**.

- **Add**: type a name (e.g. "Balls & Accessories") → Add. It immediately appears as a filter in the shop and as an option in the product form.
- **Remove**: click delete next to it. **A category holding products cannot be deleted** — first open those products and move them to another category.
- Keep it to 3–6 clear categories. Too many filters confuse customers. Good set: *Pro Rackets · Pre-Owned · Gear & Balls · Apparel*.
- Renaming: currently delete + re-add (move products across first), or ask your developer.

## 5. Orders — from "cha-ching" to delivered

Click **Orders**. Every PAID checkout appears here automatically — customers can't create an order without paying, so everything you see is real money already received.

Each order shows: the items and quantities, total in AED, customer name, email, phone, and the UAE shipping address they entered at checkout.

### Your fulfilment routine
1. New order appears (status **Paid**).
2. Pack the items. Stock already decreased by itself; unique items already left the shop.
3. Arrange delivery (your courier). Questions for the buyer? Use the phone/email on the order — WhatsApp works great.
4. When delivered, change the order's status dropdown to **Fulfilled** — this is your own bookkeeping so you always know what's still pending.
5. Problem/cancellation? Set status **Cancelled** AND refund the money in the **Stripe dashboard** (stripe.com → Payments → find the payment → Refund). Refunds happen in Stripe, never in the site admin.

### Where's the money?
Card payments land in your **Stripe** account and are paid out to your bank on Stripe's rolling schedule. See payouts at stripe.com → **Balance**.

---

## 6. Site Content — changing the website's words and pictures

Click **Site Content**. This is your editing studio for Home, About, Contact, Construct Your Court, the Shop page headers, **and your legal pages (Terms of Service + Privacy Policy)** — over 250 editable pieces of text and imagery.

- **Left**: the editable fields, grouped by page and section. The search box finds any text instantly — type a few words you saw on the site.
- **Right**: a live preview of the real page.
- **The magic shortcut**: hover over the preview — editable areas glow with a dashed outline and an "✎ Edit" tag. **Click directly on the text you want to change** and its field opens on the left.
- Type the new text → **Save**. Live within moments — no "publish" button exists because everything IS publishing.
- Every field has **Reset** to restore the original professional copy. You cannot permanently break anything.
- **Images**: image fields accept JPG/PNG/WebP uploads. Same photo rules as products.
- Things you can change yourself that you'll likely need on day one: the **WhatsApp number on the Contact page**, business hours, address, email, and every headline/paragraph on the main pages.

**Legal pages (Terms & Privacy):** each has a header block plus six section slots (heading + text). Empty slots stay invisible — fill a spare slot to add a new clause, empty it to remove one. The lime "DRAFT" badge at the top: once your final legal text is in, type a single dash (`-`) in the badge field to hide it.

> **Arabic pages:** the Arabic site (`/ar`) is a professional translation mirroring the English content. Editing here changes the **English** site. To change specific Arabic wording, send the new Arabic text to your developer — small task, quick turnaround.

---

## 7. Tournaments — running your competitions

Click **Tournaments**. You control everything the public sees on the tournament pages.

> ⚠️ **Important — read once:** for now, tournament edits and registrations live in temporary storage and can reset when the website is updated. This is a known, planned stage — the permanent tournaments database is the next upgrade. Until then: enter tournament data after site updates, and write down important registrations.

### 7.1 Creating a tournament
**+ New Tournament** → name, dates ("12–13 Sep 2026" style), venue, format (**Groups + Knockout** or **Round Robin**), category (P25/P50/P100/P250 — higher = more prestigious + more season points), division (Men/Women/Mixed), capacity in pairs, entry fee (AED, per pair), prize pool, and a cover image (pick from the gallery or paste an image address).

**Status decides the button customers see:**

| Status | Public button | Use when |
|---|---|---|
| Open | **Book Your Spot** (they can register & pay) | Registration ongoing |
| Upcoming | Get Notified | Announced, not yet open |
| Live | Watch Live (+ live banner if the Final is Live) | Event days |
| Completed | View Results | It's over |

### 7.2 Manage draw — match control (per tournament)
- **Groups & Standings**: create groups (A, B…), add each pair (pair name, both players, nationality), and type Played / Won / Lost / Sets / Points as results come in. Tick **Q** on qualifying pairs. This feeds the public Teams and Standings tabs.
- **Knockout Bracket**: for Semifinal 1 & 2, Final, 3rd place — type the pair names and set scores as comma lists (**"6, 4" means set one 6, set two 4** — both pairs need the same number of sets). Set each match to Upcoming / **Live** / Done. A **Live Final** automatically appears as the big banner on the tournaments homepage — great for event-day buzz.
- **Order of Play**: the day-by-day schedule (day number, label like "Sep Sat", time, event, court).
- Every save is instantly visible on the public site — refresh the public tab to check.

### 7.3 Points Tables & Leaderboard
- **Points Tables**: season points per finishing position, per category — shown on every tournament's page ("Points on offer").
- **Leaderboard**: the season ranking at `/leaderboards`. Add a row per pair: name, nationality, division, events played, titles, points, movement. All four division filters (All/Men/Women/Mixed) should have entries as the season grows.

### 7.4 Registrations & Payments
Inside each tournament: every public booking with the pair's full details, amount, payment method, booking reference (CH-XXXXXX), and a status you control (demo/pending/paid/cancelled). When Stripe goes live, paid online registrations arrive marked **paid** automatically.

---

## 8. WhatsApp — where customers reach you

Every "Book a Court", quote, community, and product-question button opens WhatsApp to your business number with a pre-written message, so you instantly know what the customer wants. The Contact page even routes by department (Construction / Shop / Tournaments). **Answer fast — this is your main sales channel.** Keep WhatsApp Business installed on the number the site points to.

## 9. If something looks wrong

| Problem | What to do |
|---|---|
| My saved text isn't on the site | Wait 1–2 minutes, then hard-refresh (hold Shift + click refresh). Still old? Save the field again. |
| I can't log in | Check email spelling; password is case-sensitive. Still stuck → developer resets it. |
| A photo won't upload | JPG/PNG/WebP under 8 MB, simple English filename. |
| Product shows "out of stock" wrongly | Open the product → check Quantity and Status (must be Active, quantity ≥ 1). |
| A tournament edit disappeared | The site was updated (see ⚠️ in section 7). Re-enter it; ask about the permanent database upgrade. |
| Customer says payment failed | stripe.com → Payments. No payment there = their card was declined; ask them to retry. |
| The site is down | Check vercel.com and supabase.com status pages, then contact the developer. |

## 10. Golden rules

1. **Never share passwords or keys in chat.** Anyone asking for them in a message is a red flag.
2. After every change, check the public site (**View site ↗**) — English AND Arabic (`/ar`).
3. Draft first, Active when perfect.
4. Photos: good light, honest flaws, simple filenames, best photo first.
5. You cannot break the website from the admin — explore freely; everything can be reset.

## 11. Your first week checklist

- [ ] Log in, change nothing, click through every menu item once
- [ ] Edit one harmless text on the Home page, see it live, then Reset it
- [ ] Create one Draft product start-to-finish, then delete it
- [ ] Check your real products: prices, photos, categories, stock
- [ ] Update Contact page: WhatsApp number, hours, address (Site Content → Contact)
- [ ] Open the Arabic site (`/ar`) on your phone and scroll every page
- [ ] Do a test tournament edit and watch it appear on the public page
- [ ] Save stripe.com login in your password manager; find the Payments and Balance pages
