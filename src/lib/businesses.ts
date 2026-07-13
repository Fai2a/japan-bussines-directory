import type { Business, PlanTier, VerifyTier, Photo, Review } from './types';
import { CATEGORIES, CATEGORY_BY_SLUG } from './categories';
import { CITIES, CITY_BY_SLUG } from './cities';

// ---------------------------------------------------------------------------
// Deterministic seeded generator. Produces the same ~220 businesses on every
// run so pages are stable across renders. In production this data lives in
// Postgres (see prisma/schema.prisma) — the shape is identical.
// ---------------------------------------------------------------------------

function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const FAMILY = [
  ['Tanaka', '田中'], ['Suzuki', '鈴木'], ['Sato', '佐藤'], ['Takahashi', '高橋'],
  ['Watanabe', '渡辺'], ['Ito', '伊藤'], ['Yamamoto', '山本'], ['Nakamura', '中村'],
  ['Kobayashi', '小林'], ['Kato', '加藤'], ['Yoshida', '吉田'], ['Yamada', '山田'],
  ['Sasaki', '佐々木'], ['Matsumoto', '松本'], ['Inoue', '井上'], ['Kimura', '木村'],
  ['Hayashi', '林'], ['Shimizu', '清水'], ['Mori', '森'], ['Ikeda', '池田'],
];

const GIVEN_NAMES = ['Haruka', 'Ren', 'Yuki', 'Sho', 'Aoi', 'Kenji', 'Mao', 'Takumi', 'Nao', 'Hiro'];

// Per-group name construction. Kept plausible, never generic "Best Company".
const GROUP_NAME_PARTS: Record<string, { latin: (f: string) => string; ja: (f: string) => string }[]> = {
  food: [
    { latin: (f) => `${f} Shokudō`, ja: (f) => `${f}食堂` },
    { latin: (f) => `Sushi ${f}`, ja: (f) => `寿司 ${f}` },
    { latin: (f) => `Ramen ${f}`, ja: (f) => `らーめん ${f}` },
    { latin: (f) => `Kissaten ${f}`, ja: (f) => `喫茶 ${f}` },
    { latin: (f) => `${f}-tei`, ja: (f) => `${f}亭` },
  ],
  health: [
    { latin: (f) => `${f} Clinic`, ja: (f) => `${f}クリニック` },
    { latin: (f) => `${f} Medical Office`, ja: (f) => `${f}医院` },
    { latin: (f) => `${f} Dental`, ja: (f) => `${f}歯科` },
    { latin: (f) => `${f} Pharmacy`, ja: (f) => `${f}薬局` },
  ],
  trades: [
    { latin: (f) => `${f} Komuten`, ja: (f) => `${f}工務店` },
    { latin: (f) => `${f} Construction`, ja: (f) => `${f}建設` },
    { latin: (f) => `${f} Electric`, ja: (f) => `${f}電気` },
    { latin: (f) => `${f} Setsubi`, ja: (f) => `${f}設備` },
  ],
  pro: [
    { latin: (f) => `${f} Law Office`, ja: (f) => `${f}法律事務所` },
    { latin: (f) => `${f} Fudōsan`, ja: (f) => `${f}不動産` },
    { latin: (f) => `${f} Tax & Accounting`, ja: (f) => `${f}税理士事務所` },
    { latin: (f) => `${f} Staffing`, ja: (f) => `${f}人材サービス` },
  ],
  retail: [
    { latin: (f) => `${f} Shōten`, ja: (f) => `${f}商店` },
    { latin: (f) => `${f} Store`, ja: (f) => `${f}ストア` },
    { latin: (f) => `${f} Salon`, ja: (f) => `${f}サロン` },
    { latin: (f) => `${f} Denki`, ja: (f) => `${f}電器` },
  ],
  edu: [
    { latin: (f) => `${f} Juku`, ja: (f) => `${f}塾` },
    { latin: (f) => `${f} Academy`, ja: (f) => `${f}学院` },
    { latin: (f) => `${f} Language School`, ja: (f) => `${f}語学学校` },
  ],
  auto: [
    { latin: (f) => `${f} Motors`, ja: (f) => `${f}モータース` },
    { latin: (f) => `${f} Auto Service`, ja: (f) => `${f}自動車` },
    { latin: (f) => `${f} Jidōsha`, ja: (f) => `${f}自動車工業` },
  ],
  travel: [
    { latin: (f) => `${f} Ryokan`, ja: (f) => `${f}旅館` },
    { latin: (f) => `Hotel ${f}`, ja: (f) => `ホテル${f}` },
    { latin: (f) => `${f} Travel`, ja: (f) => `${f}トラベル` },
  ],
};

// City centres for plausible lat/lng + area codes.
const CITY_META: Record<string, { lat: number; lng: number; area: string; ward: string[] }> = {
  tokyo: { lat: 35.6762, lng: 139.6503, area: '03', ward: ['Shibuya', 'Minato', 'Chiyoda', 'Taito'] },
  chuo: { lat: 35.6706, lng: 139.7719, area: '03', ward: ['Ginza', 'Nihonbashi', 'Tsukiji'] },
  shinjuku: { lat: 35.6938, lng: 139.7036, area: '03', ward: ['Kabukichō', 'Yotsuya', 'Takadanobaba'] },
  osaka: { lat: 34.6937, lng: 135.5023, area: '06', ward: ['Namba', 'Umeda', 'Tennoji', 'Shinsaibashi'] },
  kyoto: { lat: 35.0116, lng: 135.7681, area: '075', ward: ['Nakagyō', 'Higashiyama', 'Gion'] },
  nagoya: { lat: 35.1815, lng: 136.9066, area: '052', ward: ['Naka', 'Sakae', 'Meieki'] },
  yokohama: { lat: 35.4437, lng: 139.638, area: '045', ward: ['Naka', 'Kannai', 'Minato Mirai'] },
  fukuoka: { lat: 33.5904, lng: 130.4017, area: '092', ward: ['Hakata', 'Tenjin', 'Chūō'] },
  sapporo: { lat: 43.0618, lng: 141.3545, area: '011', ward: ['Chūō', 'Susukino', 'Ōdōri'] },
  kobe: { lat: 34.6901, lng: 135.1955, area: '078', ward: ['Chūō', 'Sannomiya', 'Motomachi'] },
};

const KEYWORDS_BY_GROUP: Record<string, string[]> = {
  food: ['dinner', 'lunch set', 'takeout', 'private room', 'sake', 'vegetarian options'],
  health: ['appointment', 'walk-in', 'English spoken', 'insurance', 'evening hours'],
  trades: ['free estimate', 'emergency', 'licensed', 'renovation', 'earthquake retrofit'],
  pro: ['consultation', 'English support', 'free first meeting', 'foreign residents'],
  retail: ['gift wrapping', 'tax-free', 'delivery', 'made in Japan', 'reservations'],
  edu: ['trial lesson', 'small class', 'exam prep', 'online option'],
  auto: ['shaken', 'oil change', 'body work', 'used cars', 'inspection'],
  travel: ['onsen', 'breakfast included', 'near station', 'family rooms', 'English staff'],
};

const REVIEW_TEXTS = [
  'Friendly staff and spotless. Would come back.',
  'Great value and quick service. Recommended for locals.',
  'A little hard to find but worth it once inside.',
  'They took time to explain everything clearly. Very professional.',
  'Busy on weekends — go early. Quality is consistent.',
  'English support was better than I expected. Smooth experience.',
  'Reasonable prices and honest advice. No upselling.',
  'Cozy place with real character. A neighbourhood staple.',
];

const REVIEWER_NAMES = ['A. Morita', 'Kenta S.', 'Yui T.', 'Daniel R.', 'M. Ishikawa', 'Sophie L.', 'Ryo K.', 'Hana W.'];

function pad(n: number, len: number) {
  return String(n).padStart(len, '0');
}

function makePhone(rand: () => number, area: string) {
  const rest = 8 - (area.length - 1); // keep ~10 digits total
  const a = pad(Math.floor(rand() * Math.pow(10, Math.ceil(rest / 2))), Math.ceil(rest / 2));
  const b = pad(Math.floor(rand() * 10000), 4);
  return `${area}-${a}-${b}`;
}

function buildOne(i: number): Business {
  const rand = mulberry32(1000 + i * 2654435761);
  const category = CATEGORIES[Math.floor(rand() * CATEGORIES.length)];
  const group = category.group;
  const city = CITIES[Math.floor(rand() * CITIES.length)];
  const meta = CITY_META[city.slug];
  const fam = FAMILY[Math.floor(rand() * FAMILY.length)];
  const partSet = GROUP_NAME_PARTS[group];
  const part = partSet[Math.floor(rand() * partSet.length)];
  const name = part.latin(fam[0]);
  const nameJa = part.ja(fam[1]);

  const id = 100001 + i;
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  // Secondary categories from the same group.
  const groupCats = CATEGORIES.filter((c) => c.group === group).map((c) => c.slug);
  const catSlugs = [category.slug];
  if (rand() > 0.55 && groupCats.length > 1) {
    const extra = groupCats[Math.floor(rand() * groupCats.length)];
    if (!catSlugs.includes(extra)) catSlugs.push(extra);
  }

  // Plan distribution: mostly basic/none, a minority premium/lifetime.
  const p = rand();
  const plan: PlanTier = p > 0.93 ? 'lifetime' : p > 0.82 ? 'premium' : p > 0.4 ? 'basic' : 'none';
  const v = rand();
  const verify: VerifyTier =
    plan === 'lifetime' || plan === 'premium'
      ? v > 0.4 ? 'admin' : 'community'
      : v > 0.75 ? 'community' : 'none';

  const ward = meta.ward[Math.floor(rand() * meta.ward.length)];
  const block = `${1 + Math.floor(rand() * 5)}-${1 + Math.floor(rand() * 25)}-${1 + Math.floor(rand() * 20)}`;
  const address = `${ward} ${block}, ${city.name}, ${CITY_BY_SLUG[city.slug].prefecture.replace(/^\w/, (c) => c.toUpperCase())}`;
  const addressJa = `${city.nameJa}${ward}${block}`;

  const established = 1955 + Math.floor(rand() * 68);
  const employees = [2, 4, 6, 9, 14, 22, 40, 75][Math.floor(rand() * 8)];
  const manager = `${fam[0]} ${GIVEN_NAMES[Math.floor(rand() * GIVEN_NAMES.length)]}`;

  // Business hours: many closed one weekday, most closed Sunday for some groups.
  const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
  const openTime = ['08:00', '09:00', '10:00', '11:00'][Math.floor(rand() * 4)];
  const closeTime = ['17:00', '18:00', '19:00', '20:00', '21:00'][Math.floor(rand() * 5)];
  const closedDay = Math.floor(rand() * 7);
  const hours: Business['hours'] = {};
  days.forEach((d, di) => {
    if (di === closedDay || (di === 6 && rand() > 0.5)) hours[d] = null;
    else hours[d] = [openTime, closeTime];
  });

  // Photos — premium/lifetime tend to have galleries; some have none (→ monogram).
  const photoCount = plan === 'lifetime' ? 4 + Math.floor(rand() * 3) : plan === 'premium' ? 3 + Math.floor(rand() * 2) : rand() > 0.5 ? 1 + Math.floor(rand() * 2) : 0;
  const photos: Photo[] = [];
  for (let k = 0; k < photoCount; k++) {
    photos.push({
      url: `${category.image.split('?')[0]}?auto=format&fit=crop&w=1200&q=72&sig=${id}${k}`,
      alt: `${name} — ${category.name} in ${city.name}`,
      credit: 'Unsplash',
    });
  }

  const rating = Math.round((3.4 + rand() * 1.5) * 10) / 10;
  const reviewCount = plan === 'none' ? Math.floor(rand() * 6) : 4 + Math.floor(rand() * 60);

  const reviews: Review[] = [];
  const nR = Math.min(reviewCount, 1 + Math.floor(rand() * 3));
  for (let k = 0; k < nR; k++) {
    const receipt = rand() > 0.7;
    reviews.push({
      author: REVIEWER_NAMES[Math.floor(rand() * REVIEWER_NAMES.length)],
      rating: Math.max(1, Math.min(5, Math.round(rating + (rand() - 0.5) * 2))),
      date: new Date(2026, Math.floor(rand() * 7), 1 + Math.floor(rand() * 27)).toISOString(),
      text: REVIEW_TEXTS[Math.floor(rand() * REVIEW_TEXTS.length)],
      receiptVerified: receipt,
      ownerReply:
        rand() > 0.7
          ? { date: new Date(2026, 6, 1 + Math.floor(rand() * 10)).toISOString(), text: 'Thank you for visiting — we hope to see you again soon.' }
          : undefined,
    });
  }

  // Products for food/retail; jobs for a subset.
  const products =
    group === 'food' || group === 'retail'
      ? Array.from({ length: 2 + Math.floor(rand() * 3) }, (_, k) => ({
          name: group === 'food' ? ['Lunch set', 'Course menu', 'Seasonal special', 'House blend'][k % 4] : ['Signature item', 'Gift set', 'Seasonal item', 'Bestseller'][k % 4],
          price: 500 + Math.floor(rand() * 20) * 250,
          blurb: 'Popular with regulars; available while stocks last.',
        }))
      : [];

  const jobs =
    rand() > 0.6
      ? Array.from({ length: 1 + Math.floor(rand() * 2) }, () => ({
          title: ['Part-time staff', 'Full-time associate', 'Reception', 'Apprentice'][Math.floor(rand() * 4)],
          type: (['Full-time', 'Part-time', 'Contract'] as const)[Math.floor(rand() * 3)],
          salaryMin: 1050 + Math.floor(rand() * 5) * 50,
          salaryMax: 1400 + Math.floor(rand() * 8) * 50,
        }))
      : [];

  const daysAgo = Math.floor(rand() * 60);
  const updatedAt = new Date(2026, 6, 12 - Math.min(daysAgo, 11)).toISOString();
  const status: Business['status'] = daysAgo < 10 ? 'new' : daysAgo < 30 ? 'updated' : 'active';

  const corporateNumber = `${1 + Math.floor(rand() * 8)}${pad(Math.floor(rand() * 1e12), 12)}`.slice(0, 13);
  const kw = KEYWORDS_BY_GROUP[group];
  const keywords = [category.name.toLowerCase(), ...kw.slice(0, 3 + Math.floor(rand() * 3))];

  return {
    id,
    slug,
    name,
    nameJa,
    categorySlugs: catSlugs,
    citySlug: city.slug,
    prefecture: city.prefecture,
    address,
    addressJa,
    lat: meta.lat + (rand() - 0.5) * 0.06,
    lng: meta.lng + (rand() - 0.5) * 0.06,
    phone: makePhone(rand, meta.area),
    website: rand() > 0.35 ? `https://${slug}.example.jp` : undefined,
    email: `info@${slug}.example.jp`,
    established,
    employees,
    manager,
    corporateNumber,
    hours,
    plan,
    verify,
    rating,
    reviewCount,
    photos,
    products,
    jobs,
    reviews,
    keywords,
    status,
    updatedAt,
    blurb: `${name} (${nameJa}) is a ${category.name.toLowerCase()} business in ${ward}, ${city.name}, serving the local community since ${established}.`,
  };
}

export const BUSINESSES: Business[] = Array.from({ length: 220 }, (_, i) => buildOne(i));

export const BUSINESS_BY_ID: Record<number, Business> = Object.fromEntries(
  BUSINESSES.map((b) => [b.id, b]),
);
