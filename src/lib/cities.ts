import type { City, Prefecture } from './types';

const img = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=640&q=70`;

export const PREFECTURES: Prefecture[] = [
  { slug: 'tokyo', name: 'Tokyo', nameJa: '東京都' },
  { slug: 'osaka', name: 'Osaka', nameJa: '大阪府' },
  { slug: 'kyoto', name: 'Kyoto', nameJa: '京都府' },
  { slug: 'aichi', name: 'Aichi', nameJa: '愛知県' },
  { slug: 'kanagawa', name: 'Kanagawa', nameJa: '神奈川県' },
  { slug: 'fukuoka', name: 'Fukuoka', nameJa: '福岡県' },
  { slug: 'hokkaido', name: 'Hokkaido', nameJa: '北海道' },
  { slug: 'hyogo', name: 'Hyogo', nameJa: '兵庫県' },
];

export const PREFECTURE_BY_SLUG: Record<string, Prefecture> = Object.fromEntries(
  PREFECTURES.map((p) => [p.slug, p]),
);

export const CITIES: City[] = [
  { slug: 'tokyo', name: 'Tokyo', nameJa: '東京', prefecture: 'tokyo', count: 39120, image: img('photo-1540959733332-eab4deabeeaf') },
  { slug: 'chuo', name: 'Chuo', nameJa: '中央区', prefecture: 'tokyo', count: 9840, image: img('photo-1533050487297-09b450131914') },
  { slug: 'shinjuku', name: 'Shinjuku', nameJa: '新宿区', prefecture: 'tokyo', count: 11260, image: img('photo-1554797589-7241bb691973') },
  { slug: 'osaka', name: 'Osaka', nameJa: '大阪', prefecture: 'osaka', count: 24310, image: img('photo-1590559899731-a382839e5549') },
  { slug: 'kyoto', name: 'Kyoto', nameJa: '京都', prefecture: 'kyoto', count: 14870, image: img('photo-1493976040374-85c8e12f0c0e') },
  { slug: 'nagoya', name: 'Nagoya', nameJa: '名古屋', prefecture: 'aichi', count: 16540, image: img('photo-1610116306796-6fea9f4fae38') },
  { slug: 'yokohama', name: 'Yokohama', nameJa: '横浜', prefecture: 'kanagawa', count: 18720, image: img('photo-1584132967334-10e028bd69f7') },
  { slug: 'fukuoka', name: 'Fukuoka', nameJa: '福岡', prefecture: 'fukuoka', count: 13990, image: img('photo-1624253321171-1be53e12f5f4') },
  { slug: 'sapporo', name: 'Sapporo', nameJa: '札幌', prefecture: 'hokkaido', count: 10230, image: img('photo-1551641506-ee5bf4cb45f1') },
  { slug: 'kobe', name: 'Kobe', nameJa: '神戸', prefecture: 'hyogo', count: 9560, image: img('photo-1533050487297-09b450131914') },
];

export const CITY_BY_SLUG: Record<string, City> = Object.fromEntries(
  CITIES.map((c) => [c.slug, c]),
);

export function citiesInPrefecture(pref: string): City[] {
  return CITIES.filter((c) => c.prefecture === pref);
}
