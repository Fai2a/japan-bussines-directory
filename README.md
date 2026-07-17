# NihonPages — Japan’s local business directory

A production-quality local business directory for Japan: discover businesses by
category, city, or keyword; read and write reviews; buy paid listings; and access
the full company database as a B2B **Data Hub** product.

**All six build phases are complete**, plus a real backend: Prisma over
Postgres, Auth.js credential accounts, a moderated review pipeline, Get-Listed
submissions with real Stripe webhooks (payment only creates a listing once
Stripe confirms it — see "Payments" below), and transactional email for every
flow that promises one (submission confirmations, approvals, claim codes).

---

## Quick start

1. **Get a Postgres database.** The free tier of either works and takes under
   a minute:
   - [Neon](https://neon.tech) → New Project → copy the connection string.
   - Vercel Postgres → your Vercel project → **Storage** tab → Create Database
     → Postgres (this one also auto-fills `DATABASE_URL` in your deploy).
2. Paste that connection string into `.env` as `DATABASE_URL` (replacing the
   placeholder). If deploying to Vercel, set the same value in your Vercel
   project's **Settings → Environment Variables**.
3. Run:

```bash
npm install
npm run seed    # creates the schema (via `prisma db push`) and seeds it
npm run dev
# open http://localhost:3000
```

```bash
npm run build   # runs `prisma db push` then the production build
npm run start   # serve the production build
```

There's no local-only fallback anymore — both local dev and production point
at the same Postgres database (or two different ones, if you'd rather keep
dev/prod separate; just use a different `DATABASE_URL` in each place).

`.env` ships with a placeholder `DATABASE_URL` and working defaults for
everything else. Demo accounts seeded for each role — password `password123`:

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
| Bilingual EN/日本語 with real `/ja` locale routing (next-intl) | ✅ on the customer-facing surface — see i18n note below |

### Built in subsequent phases

- **Phase 2** — persistent favorites (bookmark on every card + account tab, synced server-side once signed in), map-view toggle with draw-area search, review writing wired to the moderation pipeline, suggest-edit flow, notification preferences.
- **Phase 3** — full 5-step Get-Listed wizard (per-plan limits enforced client *and* server side, progress saved between steps), owner dashboard (analytics, listing editor, review replies, plan usage/billing), claim-listing verification (real email codes, simulated phone, 法人番号 document review).
- **Phase 4** — Data Hub table app at `/saas/app`: dense sortable table, advanced filters, saved searches, CSV export with per-plan monthly quotas.
- **Phase 5** — admin panel (revenue dashboard + listing/review/removal/report queues), Buzz blog (index + Article JSON-LD template), a real "Report a problem" flow.
- **Phase 6** — PWA (manifest, production service worker, offline page), `next-intl` locale routing (`/` = English, `/ja` = Japanese) with full UI translation coverage across the entire app — home, browse, category/city, search, company profile, account, owner dashboard, admin panel, Data Hub app, blog, and legal pages. Two deliberate exceptions: Buzz article *bodies* (the long-form content itself, not the surrounding UI) and Data Hub CSV export column headers stay English by design — those are content/data-schema decisions, not missed UI strings.

### Backend (post-phase wiring)

- **Database** — Prisma over Postgres (see Quick Start above for provisioning
  a free one). `npm run seed` loads 220 businesses, 24 categories, 10 cities,
  ~380 reviews via `prisma db push` + a seed script.
- **Auth** — Auth.js (NextAuth) credentials against the `User` table, bcrypt
  hashes, JWT sessions carrying the DB role; `/api/register` for signup. RBAC:
  admin APIs 403 for non-admins.
- **Reviews** — `POST /api/reviews` (auth required, honeypot) → `PENDING` →
  admin approves via `PATCH /api/admin/reviews`, which recomputes the business
  rating, emails the reviewer, and writes an `AuditLog` row. The account
  page's "My reviews" tab reads real data back via `GET /api/account/reviews`
  (scoped to the signed-in user) — it's not a local cache.
- **Suggest an edit** — `POST /api/suggestions` (auth required) writes a real
  `EditSuggestion` row; the account page's "Suggested edits" tab reads it back
  via `GET /api/account/suggestions`. (Admin review/approval of suggestions
  isn't wired up yet — they stay `PENDING`.)
- **Listings & payments** — the wizard stashes the form as a `PendingListing`
  draft, *then* pays. `POST /api/checkout` creates a real Stripe **test-mode**
  Checkout Session (one-time or yearly subscription) when `STRIPE_SECRET_KEY`
  is set, with the draft id as `client_reference_id`. The listing is only ever
  created by `/api/webhooks/stripe` on `checkout.session.completed` — never by
  the client — so an abandoned payment never produces a listing. A lapsed
  Premium subscription (`customer.subscription.deleted`) auto-suspends the
  listing. Without a Stripe key, checkout converts the draft immediately so
  the demo flow still works end to end.
- **Email** — every flow that says "we'll email you" actually does, via
  `src/lib/server/email.ts`. With `RESEND_API_KEY` set it sends for real;
  without one, sends land in the `EmailLog` table instead of an inbox, so the
  whole feature is testable with zero provider setup.
- **Public Data Hub API** — the Enterprise plan's "Read-only public API" is
  real: generate a key from the "API access" panel in `/saas/app` (max 3 per
  account), then call `GET /api/v1/businesses` with
  `Authorization: Bearer <key>` — filters: `category`, `city`, `q`, `page`,
  `limit` (≤50). Each key enforces its own rolling-24h rate limit
  (`ApiKey.rateLimit`, default 1000/day) and can be revoked instantly from
  the same panel.
- **Notifications** — the account page's toggles (`/api/account/preferences`)
  are real per-user server state, not `localStorage`. Turning on "review
  replies" or "Q&A answers" makes `/api/owner/replies` and `/api/answers`
  email you the moment it happens. The "weekly digest" toggle drives
  `src/lib/server/digest.ts`, run weekly by Vercel Cron (`vercel.json`) via
  `/api/cron/digest`, which emails each opted-in user the new businesses in
  their favorited cities/categories from the last 7 days. Protect that route
  in production by setting `CRON_SECRET` (Vercel sends it automatically).

---

## Tech stack

- **Next.js 14** (App Router) + **TypeScript**
- **Tailwind CSS** with a real design-token layer (`tailwind.config.ts` + `globals.css`)
- **Prisma** over **Postgres** (`prisma/schema.prisma`)
- **Auth.js (NextAuth)** — credentials + JWT sessions with DB roles
- **Stripe** — test-mode Checkout Sessions + webhooks behind `/api/checkout` and `/api/webhooks/stripe`
- **next-intl** — locale-prefixed routing (`/`, `/ja`)
- **Resend** — transactional email (falls back to an `EmailLog` DB table with no API key)
- Planned: Google OAuth, **S3** uploads, **Meilisearch**

### Project structure

```
src/
  app/
    [locale]/       # every route, locale-prefixed via next-intl ("/" = en, "/ja" = ja)
    api/            # route handlers (auth, checkout, webhooks, admin, reports, contact...)
  components/
    site/           # header, footer, search, cookie banner, i18n switch
    ui/             # Stars, Badges, Monogram, BusinessCard, Pagination, Breadcrumbs
    home/           # stat band, pricing cards
    listing/        # filter bar
    browse/         # category browser
    company/        # gallery, hours, reviews, contact actions
  lib/
    server/         # Prisma-backed queries, email, createListingFromDraft, db.ts
  i18n/             # next-intl request config + routing
messages/           # en.json / ja.json translation catalogs
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
