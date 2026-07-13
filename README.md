# NihonPages — Japan’s local business directory

A production-quality local business directory for Japan: discover businesses by
category, city, or keyword; read and write reviews; buy paid listings; and access
the full company database as a B2B **Data Hub** product.

**All six build phases are complete**, plus a real backend: Prisma over SQLite
locally (documented one-line switch to Postgres), Auth.js credential accounts,
a moderated review pipeline, Get-Listed submissions into an admin queue, and a
Stripe checkout route (real test-mode sessions when a key is configured).

---

## Quick start

```bash
npm install
npm run seed    # create + populate the SQLite database (prisma/dev.db)
npm run dev
# open http://localhost:3000
```

```bash
npm run build   # production build (~294 pages + API routes)
npm run start   # serve the production build
```

`.env` ships with working local defaults (SQLite + a dev auth secret). Demo
accounts seeded for each role — password `password123`:

| Email | Role |
| --- | --- |
| `user@demo.jp` | User |
| `owner@demo.jp` | Owner (owns a Premium listing) |
| `admin@demo.jp` | Admin (moderation queues) |

---

## What’s built (Phase 1)

| Area | Status |
| --- | --- |
| Design-token layer + signature **index-tab** motif | ✅ |
| Layout shell (header, color-coded group tabs, rich footer, cookie banner) | ✅ |
| Homepage (hero, category quick-links, animated stat band, pricing, live feed, Data Hub promo, popular cities) | ✅ |
| Browse categories (searchable, grouped, color-coded) | ✅ |
| Category pages (filter by city/rating/verified/photos/open-now, sort, featured pinning, sidebar) | ✅ |
| City index + city pages (category breakdown, filters) | ✅ |
| **Company profile** (gallery + lightbox, map, hours w/ open-now, products, jobs, reviews + histogram + owner replies, Q&A, actions, LocalBusiness JSON-LD) | ✅ |
| Search results (tabs: companies / categories / products / jobs, matched keyword/category, helpful empty state) | ✅ |
| Get Listed (plan selection + account step + order summary) | ✅ |
| Public Holidays in Japan (real 2025–2027 data, year switcher) | ✅ |
| Contact, Remove-company, Legal (Terms / Privacy / Cookies) | ✅ |
| Data Hub marketing page + pricing | ✅ |
| 404 / 500 pages, sitemap, robots, per-page metadata + breadcrumb JSON-LD | ✅ |
| Bilingual EN/日本語 scaffolding (data carries both; switcher persists choice) | ✅ (full i18n routing in Phase 6) |

### Built in subsequent phases

- **Phase 2** — persistent favorites (bookmark on every card + account tab), map-view toggle with draw-area search, review writing wired to the moderation pipeline, suggest-edit flow, notification preferences.
- **Phase 3** — full 5-step Get-Listed wizard (per-plan limits enforced client *and* server side, progress saved between steps), owner dashboard (analytics, listing editor, review replies, plan usage/billing), claim-listing verification (email / phone / 法人番号 document).
- **Phase 4** — Data Hub table app at `/saas/app`: dense sortable table, advanced filters, saved searches, CSV export with per-plan monthly quotas.
- **Phase 5** — admin panel (revenue dashboard + listing/review/removal queues), Buzz blog (index + Article JSON-LD template).
- **Phase 6** — PWA (manifest, production service worker, offline page), EN/日本語 switcher (full next-intl locale routing is the one remaining roadmap item).

### Backend (post-phase wiring)

- **Database** — Prisma over SQLite for zero-install local dev; `npm run seed`
  loads 220 businesses, 24 categories, 10 cities, ~380 reviews. To use Postgres:
  set `DATABASE_URL` and flip `provider` in `prisma/schema.prisma`.
- **Auth** — Auth.js (NextAuth) credentials against the `User` table, bcrypt
  hashes, JWT sessions carrying the DB role; `/api/register` for signup. RBAC:
  admin APIs 403 for non-admins.
- **Reviews** — `POST /api/reviews` (auth required, honeypot) → `PENDING` →
  admin approves via `PATCH /api/admin/reviews`, which recomputes the business
  rating and writes an `AuditLog` row.
- **Listings** — the wizard `POST`s to `/api/listings`; submissions are created
  `IN_REVIEW` (limits re-enforced server-side) and hidden until approved.
- **Payments** — `POST /api/checkout` creates a real Stripe **test-mode**
  Checkout Session (one-time or yearly subscription) when `STRIPE_SECRET_KEY`
  is set; otherwise it returns a simulated confirmation so the flow still works.

---

## Tech stack

- **Next.js 14** (App Router) + **TypeScript**
- **Tailwind CSS** with a real design-token layer (`tailwind.config.ts` + `globals.css`)
- **Prisma** — SQLite locally, Postgres-ready (`prisma/schema.prisma`)
- **Auth.js (NextAuth)** — credentials + JWT sessions with DB roles
- **Stripe** — test-mode Checkout Sessions behind `/api/checkout`
- Planned: Google OAuth, **S3** uploads, **Meilisearch**, **Resend/SES**, **next-intl** locale routing

### Project structure

```
src/
  app/              # routes (App Router)
  components/
    site/           # header, footer, search, cookie banner, i18n switch
    ui/             # Stars, Badges, Monogram, BusinessCard, Pagination, Breadcrumbs
    home/           # stat band, pricing cards
    listing/        # filter bar
    browse/         # category browser
    company/        # gallery, hours, reviews, contact actions
  lib/              # data layer + queries (mirrors the Prisma models)
prisma/schema.prisma
scripts/seed.ts
```

---

## Environment variables

See `.env.example`. Grouped by concern: database, Auth.js (+ Google OAuth), Stripe,
S3 storage, Meilisearch, Resend/SES email, Google Maps (optional), the Japan National
Tax Agency 法人番号 API, and the public site URL.

---

## Design decisions

**Thesis.** A modern Japanese civic / wayfinding information system crossed with a
well-set print directory: extremely legible, dense where density helps (tables,
listings), generous where it doesn’t (company profiles). Deliberately *not* a
Dribbble SaaS landing page — no gradient blobs, glassmorphism, emoji icons, or a
repeated `rounded-2xl shadow-md` card farm.

**Signature — the index tab.** Category groups are navigated through physical
paper-phone-book edge tabs (`.idx-tab` in `globals.css`): each group carries one
restrained identifying hue on its top edge; the active tab rises and connects to the
panel below. The motif is reused as the group filter on Browse, the result-type tabs
on Search, and the year switcher on Holidays. It’s the one intentional aesthetic
risk; everything else stays quiet.

**Palette (6 named roles).** `paper #FAFAF7` background · `ink #1A1C1E` text ·
**`seal #C0392B`** a hanko-inspired signal red used *only* on primary CTAs and the
logo, never as a wash · `indigo #3B4A6B` for links/interactive states ·
`meta #8A8B85` for metadata · `rule #E4E3DB` hairlines. Eight category-group hues
appear *only* in tabs, badges, and monogram tiles.

**Type pairing.** **Archivo** (a grotesque with real personality) for display /
titles; **Public Sans** (the US civic design-system face) for body; **IBM Plex Mono**
for the Data Hub tables, phone numbers, counts, and prices — everything numeric uses
**tabular lining numerals** (`.tnum`). **Noto Sans JP** carries Japanese glyphs for
the bilingual data. Fonts load via `<link>` with system fallbacks in the token layer,
so the app renders even offline. A real type scale is defined in `tailwind.config.ts`.

**Imagery.** Authentic photography via specific Unsplash searches (Tokyo storefronts
at night, shotengai, clinics, workshops). Photo-less listings get a **typographic
monogram tile in the category’s hue** — never a gray placeholder icon.

**Motion & a11y.** One orchestrated hero reveal and scroll-triggered stat counters;
hover states on everything interactive; nothing else. `prefers-reduced-motion` is
respected, focus rings are visible, contrast targets WCAG AA, and pages are
keyboard-navigable with a skip link.

---

*Product template. Before launch, have counsel review the legal pages for your
jurisdiction, and replace illustrative statistics and Unsplash imagery with licensed
production assets.*
