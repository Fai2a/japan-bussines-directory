import { defineRouting } from 'next-intl/routing';

/**
 * Locale routing config. English is the default locale and stays
 * unprefixed ("/category/restaurants"); Japanese gets a "/ja" prefix
 * ("/ja/category/restaurants"). This keeps every existing plain-path link
 * in the app correct for English (the majority experience today) while
 * giving Japanese a real, addressable route.
 */
export const routing = defineRouting({
  locales: ['en', 'ja'],
  defaultLocale: 'en',
  localePrefix: 'as-needed',
});

export type Locale = (typeof routing.locales)[number];
