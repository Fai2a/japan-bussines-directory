import type { Config } from 'tailwindcss';

/**
 * NihonPages design tokens.
 *
 * Aesthetic thesis: a modern Japanese civic / wayfinding information system
 * crossed with a well-set print directory. Quiet, disciplined, extremely legible.
 * The one deliberate signature is the "index tab" motif for category navigation
 * (see .idx-tab in globals.css) — the edge tabs of a paper phone book.
 *
 * Signal red (#C0392B, a nod to hanko seals) is reserved ONLY for the primary
 * CTA and the logo. It is never used as a background wash.
 */
const config: Config = {
  content: ['./src/**/*.{ts,tsx,mdx}'],
  theme: {
    // A real, restrained type scale (major-third-ish, tuned for a directory).
    fontSize: {
      '2xs': ['0.6875rem', { lineHeight: '1rem', letterSpacing: '0.02em' }],
      xs: ['0.75rem', { lineHeight: '1.1rem' }],
      sm: ['0.8125rem', { lineHeight: '1.25rem' }],
      base: ['0.9375rem', { lineHeight: '1.6rem' }],
      lg: ['1.0625rem', { lineHeight: '1.6rem' }],
      xl: ['1.25rem', { lineHeight: '1.5rem' }],
      '2xl': ['1.5rem', { lineHeight: '1.7rem', letterSpacing: '-0.01em' }],
      '3xl': ['1.9375rem', { lineHeight: '1.15', letterSpacing: '-0.015em' }],
      '4xl': ['2.5rem', { lineHeight: '1.08', letterSpacing: '-0.02em' }],
      '5xl': ['3.25rem', { lineHeight: '1.02', letterSpacing: '-0.025em' }],
      '6xl': ['4.25rem', { lineHeight: '0.98', letterSpacing: '-0.03em' }],
    },
    extend: {
      colors: {
        // Core palette — named, systematic, 6 roles.
        paper: '#FAFAF7', // background
        panel: '#FFFFFF', // raised surfaces
        ink: '#1A1C1E', // primary text
        'ink-soft': '#41454B', // secondary text
        meta: '#8A8B85', // metadata / warm gray
        rule: '#E4E3DB', // hairline borders on paper
        seal: {
          // signal red — CTAs & logo ONLY
          DEFAULT: '#C0392B',
          ink: '#9C2A1F',
          wash: '#F6E7E4', // permitted only for tiny accents (badges), never full-bleed
        },
        indigo: {
          // interactive / links
          DEFAULT: '#3B4A6B',
          soft: '#5A6C92',
          wash: '#EAEDF3',
        },
        // Category-group identifying hues — used ONLY in tabs/badges, restrained.
        grp: {
          food: '#B5642B', // Food & Drink
          health: '#2E7D6B', // Health
          trades: '#7A6A2C', // Trades & Construction
          pro: '#3B4A6B', // Professional Services
          retail: '#8E4585', // Retail
          edu: '#4A6FA5', // Education
          auto: '#455A64', // Automotive
          travel: '#B07A2E', // Travel & Hospitality
        },
        ok: '#2E7D6B',
        warn: '#B5642B',
      },
      fontFamily: {
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        body: ['var(--font-body)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
        jp: ['var(--font-jp)', 'var(--font-body)', 'sans-serif'],
      },
      maxWidth: {
        shell: '1200px',
        prose: '68ch',
      },
      borderRadius: {
        // Deliberately modest — no rounded-2xl card farm.
        sm: '2px',
        DEFAULT: '3px',
        md: '4px',
        lg: '6px',
        tab: '7px 7px 0 0',
      },
      boxShadow: {
        // Flat by default; a single soft lift for genuine overlays only.
        card: '0 1px 0 rgba(26,28,30,0.04)',
        lift: '0 6px 24px -8px rgba(26,28,30,0.18)',
        tab: '0 -2px 6px -4px rgba(26,28,30,0.25)',
      },
      keyframes: {
        'rise-in': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        'rise-in': 'rise-in 0.55s cubic-bezier(0.2, 0.7, 0.2, 1) both',
        'fade-in': 'fade-in 0.4s ease-out both',
      },
    },
  },
  plugins: [],
};

export default config;
