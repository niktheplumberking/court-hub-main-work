# Court Hub: project instructions for Claude Code

The client's live e-commerce site for Court Hub Group (padel, UAE). It's built on Next.js 15 (App Router), Tailwind v4, Supabase (DB, auth, storage), Stripe Checkout (AED) and the Claude API (Instagram caption import).

## Current state (verified 2026-10-17)
- **Production:** courthub.ae on a Hostinger VPS (nginx + pm2 `courthub`). Deploy and update steps are in `docs/DEPLOY-VPS.md` and `scripts/vps-finish.sh`. Vercel (`court-hub-main-work.vercel.app`) is a preview only.
- **Languages:** English and Arabic, both live. Read the `courthub-rtl-architecture` memory and `lib/i18n/` before any i18n work.
- **Brand:** the Oct 2026 "Court Blue" rebrand (navy + baby blue, no black, no lime) is merged into `main`. The colour values live in `app/globals.css` `@theme`; the token *names* (ink, lime, sand) were kept but their values changed. Fonts: Outfit (display), Inter (UI), JetBrains Mono (labels). For Arabic, IBM Plex Sans Arabic and Cairo override them.
- **Hero:** 3D best-selling rackets (`components/home/simplified/HeroRackets.tsx`).
- **Navigation:** the 4 subpages swipe left/right (`components/swipe/`), with page transitions in `app/(en)/template.tsx` and `app/(ar)/template.tsx`.
- **No /faq page.** The Q&A lives on /contact, and `/faq` redirects there. This was a client decision.
- **Handover docs:** `docs/LAUNCH-PLAYBOOK.md`, `docs/HANDOVER-SHEET.md`, `docs/STRIPE-HANDOVER.md`, `docs/USER-GUIDE.en.md` / `.ar.md`, `docs/SECURITY.md`.
- `PLAN.md` is the original phase plan. Its phases A–E are complete; use it for history, not for current tasks.

## Workflow
- **Branch:** `main`. Pushing `main` updates the Vercel preview only. Production updates only when someone runs `git pull` + `scripts/vps-finish.sh` on the VPS, so ask Nick before doing that.
- **Committing:** commit and push after every completed change set, because a previous session lost hours of uncommitted work.
  - Run `git status --short` first.
  - Stage named paths, not `git add -A`.
  - Never commit `.env.local`.
- **QA:** before anything goes to production, run the `apple-website-checklist` full pass.

## Experience bar
- The client wants pages that feel alive and scroll-driven (GSAP + ScrollTrigger + Lenis via `components/shared/SmoothScroll.tsx`). Template-looking static pages are not acceptable.
- Every effect must also meet the global motion policy: a calm, complete version for visitors who ask for reduced motion, and pause controls on long loops.

## Conventions
- **Database writes** go through server actions or API routes using `supabaseAdmin()` after an auth or admin allow-list check. Never expose `SUPABASE_SECRET_KEY` client-side.
- **Money:** prices are in AED, and Stripe amounts are in fils (×100) via `toFils()`.
- **Unique items:** `is_unique=true`, quantity 1. The webhook flips status to `sold` on purchase.
- **Environment variables:** listed in `.env.example`.

## Commands
`npm run dev` (port 3005) · `npm run build` · `npm run lint` (tsc)
