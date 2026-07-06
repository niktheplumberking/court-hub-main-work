# Court Hub: Simplified Homepage Implementation Brief

**Repo:** `niktheplumberking/court-hub-atif-version` (work on a new branch: `feat/simplified-home`)
**Reference:** `court-hub-simplified-home.html` (approved demo, included alongside this brief). Match it visually as closely as possible. It is a standalone mock with base64 assets; the real implementation must use repo assets and live data as specified below.

## Goal

Replace the current heavy homepage (`components/home/HomeClient.tsx` and its scroll-jacked sections) with a simple, fast, single-scroll homepage. Every key destination must be reachable in one click. No scroll-jacking, no 750vh pinned sections, no frame-sequence animations, no parallax. Keep the existing brand system exactly: sand `#EDE8E1` page background, ink `#0E0E0C`, court-blue `#1E5AE8`, lime `#C8FF3D`, fonts Outfit (display) / Inter (body) / JetBrains Mono (eyebrows). All tokens already exist in `app/globals.css` and the Tailwind config. Do not introduce new colors or fonts.

## Page structure (top to bottom)

### 1. Nav (sticky)
Transparent over the hero, transitions to `rgba(237,232,225,.92)` + blur + hairline shadow after ~40px scroll. Links: Services, Shop, Construct Your Court, About. Lime pill CTA "Get a Quote" linking to `/construct-your-court`. Below 820px: hamburger opening a full-screen ink overlay menu (big Outfit links, closes on selection, `aria-expanded` managed). Reuse the existing site Navbar component if it can be adapted; otherwise create `components/home/SimpleNav.tsx`.

### 2. Hero (reuse About page hero)
Port the hero from `components/pages/AboutClient.tsx`: full-viewport ink section, background video, white 3px rounded frame (`border-radius: 44px`, rgba(255,255,255,.6)), centered headline "EXPERIENCE PADEL / ELEVATED" (Outfit 900, clamp to ~124px, line-height .85).

- Background video: `public/fulldoneversion.mp4`, autoplay muted loop playsinline, poster `public/assets/images/hero_padel_night_view_1779713624496.png`. Filter `brightness(.82) contrast(1.12) saturate(1.15)` plus a top/bottom gradient overlay at .55/.78 opacity (see demo). Do NOT over-darken.
- Bottom strip inside the frame: short supporting line, quick-jump pills (Shop Rackets / Build a Court / Our Services, hidden below 640px), and two CTAs: lime "Construct Your Court" -> `/construct-your-court`, ghost white "Shop Now" -> `/shop`.
- Animated scroll cue at frame bottom center (lime dot in pill outline), hidden on mobile and under reduced motion.

### 3. Brand ribbon
Full-bleed ink band directly under the hero. Scrolling marquee: STEALTH, DOPADEL, MUSA, WILSON, HEAD, BULLPADEL (the `BRANDS` array already in `components/home/ShopSection.tsx` line 77). Italic Outfit 900, ~26px, white at 32% opacity, lime 6px dot separators, edge fade via mask-image, ~32s linear loop, pause on hover. IMPORTANT: use the existing pure-CSS marquee pattern (`.ch-marquee-reverse` in globals.css) so it keeps moving under OS reduce-motion, only slowed. This constraint is documented in a comment at ShopSection.tsx line 498; preserve that behavior.

### 4. Numbers / reach
Sand background, 72px vertical padding, bottom hairline. Header row: mono eyebrow "Court Hub in numbers" left, lead line right ("From Al Quoz to the wider GCC, engineered courts and a growing community of players."). Four stats in a grid with 1px vertical dividers (`rgba(14,14,12,.12)`), value in ink with the unit suffix in court-blue:
- 180+ Pre-Calibrated Arenas
- 5,000+ Active Players in Our Community
- 2.1x Vibration Dampening
- 10yr Rust & Structure Warranty

Count-up animation on scroll into view via IntersectionObserver (ease-out cubic, ~1.4s, run once). These figures come from AboutClient copy; verify against it before hardcoding. 2 columns below 820px (drop the divider on the 3rd item).

### 5. Our Services (4 cards)
White cards on sand, radius 24px, 1px `rgba(14,14,12,.08)` border, lift + shadow on hover. Each card is one `<a>`:
1. Court Construction -> `/construct-your-court`
2. Racket Shop -> `/shop`
3. Pre-Owned Rackets -> `/shop` (or the pre-owned filter/route if one exists; check `app/shop`)
4. Maintenance & Upgrades -> `/contact`

Icons: copy the four inline SVGs from the demo verbatim (isometric court, strung racket, refresh cycle with check seal, wrench over baseline). They use classes `.st` (ink 1.6 stroke), `.st2` (same at 32% opacity), `.ac` (lime fill, flips to blue on hover). Tile: 64px squircle, radius 18px, gradient `#faf8f4 -> sand`, inset top highlight, blue-to-lime gradient ring fading in on hover, slight lift and -3deg rotation on hover. Do not swap these for an icon library.

### 6. Shop Top Sellers (horizontal rail)
White section with top/bottom hairlines. Header: eyebrow + "Shop Top Sellers" left, prev/next circular arrow buttons right. Rail: horizontal scroll, snap-x, cards 264px, sand card background, image ~1/1.08, tag chip (ink bg, lime mono text), brand eyebrow, name, AED price in court-blue, ink "Add" pill.

- Data: fetch real products the same way `components/home/ShopSection.tsx` does (Supabase with `components/shop/placeholder-products.ts` fallback). Show 6 to 8 items. Prices in AED.
- "Add" must call the real cart via `lib/cart-context.tsx`.
- Arrows disable at scroll ends; right-edge fade mask on the rail wrapper; arrows hidden on `(hover:none) and (pointer:coarse)`.
- "Shop All Products" ink pill below, centered, -> `/shop`.

### 7. Construct Your Court
Ink panel, radius 44px, two columns (image left / content right, stacks below 900px). Image: `public/assets/images/dubai_court_night_construction_1779706759259.png` with a right-edge gradient into the content. Content: lime eyebrow "Turnkey construction", headline "Construct Your Court", short paragraph, then three rows (Classic / Panoramic / Super Pro with mono descriptors), hairline-separated, each linking to `/construct-your-court` (deep-link to the model if the configurator supports it; check `components/pages/ConstructClient.tsx`). Lime CTA "Configure & Get Quote".

### 8. Short About
Two columns: image `public/assets/images/court_action_landscape_1779705580138.png` (radius 44px) with a floating stat chip (dark blur pill, "180+ / Arenas built across the GCC"); text side: eyebrow "Who we are", headline "Crafted for the Obsessed", 2-3 sentence blurb from existing About copy (Al Quoz origin, Spanish glass, alloys), ghost button "Read Our Full Story" -> `/about`.

### 9. Footer
Compact version of the existing footer: logo + one-liner, three link columns (Explore / Support / Legal), base row. Reuse the existing Footer component if suitable.

## Implementation notes

- File plan: create `components/home/simplified/` with one component per section (SimpleHero, BrandRibbon, NumbersStrip, ServicesGrid, TopSellersRail, ConstructPanel, AboutTeaser) plus an index `SimplifiedHome.tsx`. Update `app/page.tsx` to render it. Leave the old HomeClient in place but unused (easy rollback); do not delete assets yet.
- Read `CLAUDE.md`, `PLAN.md`, and `NEXT-STEPS.md` at repo root before starting and follow any conventions there.
- Follow existing patterns: Tailwind utility classes with the project's tokens (`sand`, `ink`, `court-blue`, `lime`, `font-display`, `font-mono`), server components where no interactivity is needed, `"use client"` only for the rail, counters, nav, and menu. Use `next/image` for all images and `next/video`-style native `<video>` for the hero.
- Motion: CSS transitions and IntersectionObserver reveals only. Do not add Framer scroll-jacking back. Respect `prefers-reduced-motion` exactly as in the demo (reveals off, ribbon slowed not stopped).
- Accessibility: `:focus-visible` outlines (blue on sand, lime on dark surfaces), aria-labels on arrows and burger, alt text on all images.
- Performance targets: no frame-sequence folders loaded on the homepage, hero video is the only large asset, Lighthouse performance should improve substantially vs the current home. Lazy-load everything below the fold.

## Acceptance checklist

1. Homepage renders the 9 sections above in order, visually matching the demo on desktop and mobile.
2. Every nav link, service card, product card, and CTA routes to a real page. Zero dead `#` links.
3. Top sellers show real product data; Add updates the real cart.
4. Hero video autoplays muted and loops on iOS Safari (playsinline present).
5. Mobile: hamburger menu works, rail swipes, no horizontal overflow at 360px width.
6. Keyboard: all interactive elements focusable with visible outlines.
7. `npm run build` passes with no new type errors; commit on `feat/simplified-home`, do not push to main.
