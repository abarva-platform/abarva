import type { Metadata } from 'next';

const SITE_URL = 'https://abarva.ai';
const SITE_NAME = 'AbarVa';
const DEFAULT_TITLE = 'AbarVa — A knowledge layer for AI programs';
const DEFAULT_DESCRIPTION =
  '60 patterns. 30 signals. 10 contradictions. Cited reasoning for every decision your AI portfolio depends on.';

export const seoDefaults: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: DEFAULT_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME }],
  keywords: [
    'AI program management',
    'knowledge layer',
    'AI patterns',
    'enterprise AI',
    'AI corpus',
    'AI governance',
    'AI portfolio',
  ],
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    url: SITE_URL,
    images: [
      {
        url: '/og-card-default.png',
        width: 1200,
        height: 630,
        alt: 'AbarVa — A knowledge layer for AI programs',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: ['/og-card-default.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  icons: {
    icon: '/favicon.svg',
    apple: '/apple-touch-icon.png',
  },
};

export function buildPageMetadata(overrides: Partial<Metadata>): Metadata {
  return {
    ...seoDefaults,
    ...overrides,
    openGraph: {
      ...(seoDefaults.openGraph as object),
      ...(overrides.openGraph ?? {}),
    },
    twitter: {
      ...(seoDefaults.twitter as object),
      ...(overrides.twitter ?? {}),
    },
  };
}
