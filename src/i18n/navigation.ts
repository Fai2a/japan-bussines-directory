import { createNavigation } from 'next-intl/navigation';
import { routing } from './routing';

// Locale-aware drop-in replacements for next/link and next/navigation.
// `Link` auto-prefixes hrefs with the active locale; `usePathname`/`useRouter`
// strip/re-add the prefix so filter/search state updates don't reset locale.
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
