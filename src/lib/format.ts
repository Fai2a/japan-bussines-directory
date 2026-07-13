import { CATEGORY_BY_SLUG, GROUP_BY_KEY } from './categories';
import type { Business } from './types';

export function yen(n: number): string {
  return '¥' + n.toLocaleString('en-US');
}

export function usd(n: number): string {
  return '$' + n.toLocaleString('en-US');
}

export function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function relativeDate(iso: string, now = new Date()): string {
  const days = Math.round((+now - +new Date(iso)) / 86400000);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 30) return `${days} days ago`;
  const months = Math.round(days / 30);
  return `${months} month${months > 1 ? 's' : ''} ago`;
}

/** Obfuscate an email against naive scrapers; UI reassembles on interaction. */
export function obfuscateEmail(email: string): { user: string; domain: string } {
  const [user, domain] = email.split('@');
  return { user, domain };
}

/** The hue of a business's primary category group — drives its monogram tile & badge. */
export function businessHue(b: Business): string {
  const cat = CATEGORY_BY_SLUG[b.categorySlugs[0]];
  return cat ? GROUP_BY_KEY[cat.group].hue : '#8A8B85';
}

export function monogram(name: string): string {
  const clean = name.replace(/[^A-Za-z぀-ヿ一-龯 ]/g, '').trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '•';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function ratingStars(rating: number): { full: number; half: boolean; empty: number } {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  return { full, half, empty };
}
