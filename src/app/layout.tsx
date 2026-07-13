import type { Metadata } from 'next';
import './globals.css';
import { SiteHeader } from '@/components/site/SiteHeader';
import { SiteFooter } from '@/components/site/SiteFooter';
import { CookieBanner } from '@/components/site/CookieBanner';
import { ServiceWorker } from '@/components/site/ServiceWorker';
import { Providers } from '@/components/site/Providers';

export const metadata: Metadata = {
  metadataBase: new URL('https://nihonpages.example.jp'),
  title: {
    default: 'NihonPages — Japan’s local business directory',
    template: '%s · NihonPages',
  },
  description:
    'Discover and review local businesses across Japan by category, city, or keyword. Verified profiles, real reviews, and a bilingual EN/日本語 interface.',
  openGraph: {
    title: 'NihonPages — Japan’s local business directory',
    description: 'Discover and review local businesses across Japan.',
    type: 'website',
    locale: 'en',
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Robust webfont load; system fallbacks in tokens keep the app usable offline. */}
        <link
          href="https://fonts.googleapis.com/css2?family=Archivo:wght@500;600;700;800&family=Public+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&family=IBM+Plex+Mono:wght@400;500;600&family=Noto+Sans+JP:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
        <meta name="theme-color" content="#FAFAF7" />
      </head>
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:panel focus:px-4 focus:py-2 focus:text-sm"
        >
          Skip to content
        </a>
        {/* Shared SVG defs — half-star gradient referenced by <Stars /> everywhere. */}
        <svg width="0" height="0" aria-hidden className="absolute">
          <defs>
            <linearGradient id="np-star-half">
              <stop offset="50%" stopColor="#C0392B" />
              <stop offset="50%" stopColor="#E4E3DB" />
            </linearGradient>
          </defs>
        </svg>
        <Providers>
          <SiteHeader />
          <main id="main">{children}</main>
          <SiteFooter />
          <CookieBanner />
        </Providers>
        <ServiceWorker />
      </body>
    </html>
  );
}
