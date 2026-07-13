import type { Category, CategoryGroup, CategoryGroupKey } from './types';

export const CATEGORY_GROUPS: CategoryGroup[] = [
  { key: 'food', name: 'Food & Drink', nameJa: '飲食', hue: '#B5642B' },
  { key: 'health', name: 'Health', nameJa: '医療・健康', hue: '#2E7D6B' },
  { key: 'trades', name: 'Trades & Construction', nameJa: '建設・工事', hue: '#7A6A2C' },
  { key: 'pro', name: 'Professional Services', nameJa: '専門サービス', hue: '#3B4A6B' },
  { key: 'retail', name: 'Retail & Shopping', nameJa: '小売・買物', hue: '#8E4585' },
  { key: 'edu', name: 'Education', nameJa: '教育', hue: '#4A6FA5' },
  { key: 'auto', name: 'Automotive', nameJa: '自動車', hue: '#455A64' },
  { key: 'travel', name: 'Travel & Hospitality', nameJa: '旅行・宿泊', hue: '#B07A2E' },
];

export const GROUP_BY_KEY: Record<CategoryGroupKey, CategoryGroup> = Object.fromEntries(
  CATEGORY_GROUPS.map((g) => [g.key, g]),
) as Record<CategoryGroupKey, CategoryGroup>;

// Unsplash source images chosen with specific Japanese searches. Served via
// next/image with AVIF/WebP + srcset. (?auto=format&fit=crop keeps them light.)
const img = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=640&q=70`;

// 24 categories across the 8 groups. Counts are illustrative of a real DB.
export const CATEGORIES: Category[] = [
  // Food & Drink
  { slug: 'restaurants', name: 'Restaurants', nameJa: 'レストラン', group: 'food', count: 41280, image: img('photo-1552566626-52f8b828add9'), blurb: 'Izakaya, ramen, sushi, kissaten and family dining across Japan.' },
  { slug: 'cafes-bakeries', name: 'Cafés & Bakeries', nameJa: 'カフェ・パン屋', group: 'food', count: 12940, image: img('photo-1495474472287-4d71bcdd2085'), blurb: 'Kissaten, specialty coffee roasters and neighbourhood bakeries.' },
  { slug: 'bars-izakaya', name: 'Bars & Izakaya', nameJa: '居酒屋・バー', group: 'food', count: 9870, image: img('photo-1514933651103-005eec06c04b'), blurb: 'Standing bars, izakaya and late-night yokocho spots.' },
  // Health
  { slug: 'doctors-clinics', name: 'Doctors & Clinics', nameJa: '医院・クリニック', group: 'health', count: 18450, image: img('photo-1519494026892-80bbd2d6fd0d'), blurb: 'General clinics, specialists and community health centres.' },
  { slug: 'dentists', name: 'Dentists', nameJa: '歯科', group: 'health', count: 8120, image: img('photo-1606811841689-23dfddce3e95'), blurb: 'Dental clinics, orthodontics and oral surgery.' },
  { slug: 'pharmacies', name: 'Pharmacies', nameJa: '薬局', group: 'health', count: 6640, image: img('photo-1587854692152-cbe660dbde88'), blurb: 'Dispensing pharmacies and drugstores.' },
  // Trades & Construction
  { slug: 'contractors', name: 'Contractors', nameJa: '工務店', group: 'trades', count: 14230, image: img('photo-1503387762-592deb58ef4e'), blurb: 'General contractors, remodelling and home construction.' },
  { slug: 'electricians', name: 'Electricians', nameJa: '電気工事', group: 'trades', count: 5310, image: img('photo-1621905251189-08b45d6a269e'), blurb: 'Licensed electrical work for homes and businesses.' },
  { slug: 'plumbers', name: 'Plumbers', nameJa: '配管工', group: 'trades', count: 4820, image: img('photo-1607472586893-edb57bdc0e39'), blurb: 'Plumbing repair, water heaters and drainage.' },
  // Professional Services
  { slug: 'legal', name: 'Legal & Law Firms', nameJa: '法律事務所', group: 'pro', count: 7760, image: img('photo-1589829545856-d10d557cf95f'), blurb: 'Lawyers, judicial scriveners and legal consultation.' },
  { slug: 'real-estate', name: 'Real Estate', nameJa: '不動産', group: 'pro', count: 21540, image: img('photo-1560518883-ce09059eeffa'), blurb: 'Rentals, sales, property management and agents.' },
  { slug: 'accounting', name: 'Accounting & Tax', nameJa: '会計・税理士', group: 'pro', count: 6980, image: img('photo-1554224155-6726b3ff858f'), blurb: 'Certified accountants, tax advisors and bookkeeping.' },
  { slug: 'employment', name: 'Employment & Staffing', nameJa: '人材・派遣', group: 'pro', count: 5240, image: img('photo-1521737604893-d14cc237f11d'), blurb: 'Recruiting agencies and staffing services.' },
  // Retail & Shopping
  { slug: 'shopping', name: 'Shopping & Retail', nameJa: '小売・ショップ', group: 'retail', count: 26310, image: img('photo-1481437156560-3205f6a55735'), blurb: 'Boutiques, department stores and specialty shops.' },
  { slug: 'grocery', name: 'Grocery & Markets', nameJa: 'スーパー・市場', group: 'retail', count: 9110, image: img('photo-1542838132-92c53300491e'), blurb: 'Supermarkets, greengrocers and covered markets.' },
  { slug: 'electronics', name: 'Electronics', nameJa: '電化製品', group: 'retail', count: 4470, image: img('photo-1498049794561-7780e7231661'), blurb: 'Home appliances, gadgets and repair.' },
  // Education
  { slug: 'schools', name: 'Schools', nameJa: '学校', group: 'edu', count: 8890, image: img('photo-1580582932707-520aed937b7b'), blurb: 'Public and private schools, kindergartens.' },
  { slug: 'language-schools', name: 'Language Schools', nameJa: '語学学校', group: 'edu', count: 3560, image: img('photo-1523240795612-9a054b0db644'), blurb: 'Japanese, English and multilingual instruction.' },
  { slug: 'cram-schools', name: 'Cram Schools', nameJa: '学習塾', group: 'edu', count: 7020, image: img('photo-1509062522246-3755977927d7'), blurb: 'Juku, exam prep and tutoring.' },
  // Automotive
  { slug: 'automotive', name: 'Automotive', nameJa: '自動車', group: 'auto', count: 15680, image: img('photo-1486262715619-67b85e0b08d3'), blurb: 'Dealers, repair, inspection (shaken) and parts.' },
  { slug: 'car-repair', name: 'Car Repair & Service', nameJa: '車修理・整備', group: 'auto', count: 8340, image: img('photo-1487754180451-c456f719a1fc'), blurb: 'Garages, body shops and maintenance.' },
  // Travel & Hospitality
  { slug: 'hotels-ryokan', name: 'Hotels & Ryokan', nameJa: 'ホテル・旅館', group: 'travel', count: 11220, image: img('photo-1578662996442-48f60103fc96'), blurb: 'Business hotels, ryokan and guesthouses.' },
  { slug: 'travel-agents', name: 'Travel Agents', nameJa: '旅行代理店', group: 'travel', count: 2980, image: img('photo-1436491865332-7a61a109cc05'), blurb: 'Tours, tickets and travel planning.' },
  { slug: 'beauty-salons', name: 'Beauty & Barbers', nameJa: '美容・理容', group: 'retail', count: 13470, image: img('photo-1503951914875-452162b0f3f1'), blurb: 'Hair salons, barbers, nail and beauty.' },
];

export const CATEGORY_BY_SLUG: Record<string, Category> = Object.fromEntries(
  CATEGORIES.map((c) => [c.slug, c]),
);

export function categoriesInGroup(group: CategoryGroupKey): Category[] {
  return CATEGORIES.filter((c) => c.group === group);
}

export const TOTAL_COMPANIES = 222410;
