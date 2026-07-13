export interface Article {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  author: string;
  date: string; // ISO
  readMins: number;
  cover: string;
  body: string[]; // paragraphs
}

const img = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&q=70`;

export const ARTICLES: Article[] = [
  {
    slug: 'how-verified-listings-work',
    title: 'How verified listings work on NihonPages',
    excerpt: 'Admin-verified vs. community-verified — what each badge means, and how we check ownership without slowing you down.',
    category: 'Trust & Safety',
    author: 'NihonPages Team',
    date: '2026-06-28',
    readMins: 4,
    cover: img('photo-1554797589-7241bb691973'),
    body: [
      'Trust is the whole product. A directory is only useful if the profile in front of you is real, current, and actually run by the business it claims to represent. That’s why every listing on NihonPages carries a clear verification state, and why we never hide what a badge actually means.',
      'An **Admin-verified** badge means our team checked ownership documents — a business registration, a matching corporate number (法人番号), or a domain-verified email. A **Community-verified** badge means the profile has been corroborated by contributor reports and open data, but hasn’t yet passed a document check. Hover either badge and we tell you exactly that.',
      'Owners can move from community to admin verification at any time by claiming their listing and completing a short check. It usually takes minutes by email or phone, or one to two business days if you verify with documents.',
      'We deliberately avoid a single opaque “verified” checkmark. Two honest states beat one vague one — you can decide how much weight to give a profile, and owners have a clear path to earn more trust.',
    ],
  },
  {
    slug: 'writing-a-review-that-helps',
    title: 'What makes a business review actually useful',
    excerpt: 'A few specifics beat five stars and no words. Here’s how to write a review the next visitor will thank you for.',
    category: 'Community',
    author: 'Mika Ishikawa',
    date: '2026-06-15',
    readMins: 3,
    cover: img('photo-1517248135467-4c7edcad34c4'),
    body: [
      'The best reviews answer the question the next person is actually asking: “Is this right for me, today?” That means specifics — what you came for, what you got, and who you’d recommend it to.',
      'Mention the concrete stuff: how long the wait was, whether English was spoken, if reservations are needed, what a typical spend looked like. A single detail like “counter seating only, cash preferred” saves the next visitor a wasted trip.',
      'If you have proof of your visit, add it. Reviews tagged **Visited — receipt verified** are weighted higher in the average, because they’re much harder to fake. Every review is checked by a human before it’s published, usually within a day.',
    ],
  },
  {
    slug: 'choosing-a-listing-plan',
    title: 'Basic, Premium or Lifetime: choosing a listing plan',
    excerpt: 'A plain breakdown of placement, photos, leads and cost so you can pick without the marketing gloss.',
    category: 'For Owners',
    author: 'NihonPages Team',
    date: '2026-05-30',
    readMins: 5,
    cover: img('photo-1441986300917-64674bd600d8'),
    body: [
      'Every plan gets you a real, indexable profile with reviews, hours and a map. The difference is reach and headroom: how prominently you appear, and how much you can show.',
      '**Basic** is a one-time fee and a great fit if you mostly need to be found and look credible. **Premium** is a yearly subscription that highlights and top-places you across search, categories and keywords, with far more photos, products and monthly leads. **Lifetime** is Premium’s reach paid once, forever.',
      'If leads are your goal, Premium usually pays for itself quickly — the top slot on a busy category-plus-city page gets a disproportionate share of clicks. If you just need presence, start with Basic; you can upgrade any time and we prorate.',
    ],
  },
  {
    slug: 'shotengai-and-the-local-economy',
    title: 'Why the shōtengai still matters to local search',
    excerpt: 'Japan’s covered shopping streets are a model for how neighbourhood discovery should feel online.',
    category: 'Perspective',
    author: 'Ren Takahashi',
    date: '2026-05-12',
    readMins: 6,
    cover: img('photo-1524413840807-0c3cb6fa808d'),
    body: [
      'Walk any shōtengai and you get an interface refined over decades: signage at a glance, tightly packed specialists, and social proof in the form of a queue outside the good tonkatsu place. It’s dense where density helps and generous where it counts.',
      'That’s the feel we want online — legible, fast, and honest about what’s popular. A directory shouldn’t bury the neighbourhood barber under ten national chains. It should help you find the person two streets over who’s been doing one thing well since 1979.',
      'Our category tabs, colour-coded by group, are a direct nod to the paper phone book and the wayfinding of a Japanese station. Familiar, quiet, and quick to scan.',
    ],
  },
  {
    slug: 'public-holidays-and-opening-hours',
    title: 'Public holidays and why “open now” is harder than it looks',
    excerpt: 'Golden Week, Obon, and the edge cases behind a simple green “Open now” dot.',
    category: 'Product',
    author: 'NihonPages Team',
    date: '2026-04-20',
    readMins: 4,
    cover: img('photo-1493976040374-85c8e12f0c0e'),
    body: [
      'A live “Open now” indicator sounds trivial until you account for Japan’s holidays. Many businesses keep different hours during Golden Week and Obon, and a lot simply close.',
      'We cross-reference standard weekly hours with the national holiday calendar, and we surface the next opening time rather than a bare “Closed”. If an owner sets holiday hours, those win.',
      'You can see the full calendar any time on our Public Holidays page, switchable by year, in both Japanese and English.',
    ],
  },
  {
    slug: 'data-hub-for-b2b-teams',
    title: 'Using the Data Hub without drowning in rows',
    excerpt: 'Saved searches, sensible filters and export quotas — a short guide for sales and research teams.',
    category: 'Data Hub',
    author: 'NihonPages Team',
    date: '2026-04-02',
    readMins: 5,
    cover: img('photo-1551288049-bebda4e38f71'),
    body: [
      'The Data Hub is a single dense table over the whole company database — no ads, built for people who live in spreadsheets. The trick to using it well is to filter before you export.',
      'Stack filters that map to your ICP: category, prefecture, has-email, employee range, and year established. Save the combination as a named search so you can re-run it next week without rebuilding it.',
      'Exports respect a monthly row quota per plan, shown live in the header. Narrow the set until it’s the accounts you’ll actually work, then export to CSV. It keeps your list clean and your quota intact.',
    ],
  },
];

export const ARTICLE_BY_SLUG: Record<string, Article> = Object.fromEntries(ARTICLES.map((a) => [a.slug, a]));
