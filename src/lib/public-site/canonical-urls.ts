// Single source of truth for all AbarVa public site URLs.
// Every file that needs a URL imports from here — never hardcode.
// Companion: docs/build/PUBLIC_SITE_SPEC_V1.md §0

export const CANONICAL_URLS = {
  origin: 'https://abarva.ai',
  app: 'https://app.abarva.ai',
  patterns: (slug: string) => `https://abarva.ai/patterns/${slug}`,
  patternIndex: 'https://abarva.ai/patterns/',
  atlas: 'https://abarva.ai/atlas/',
  editorial: (slug: string) => `https://abarva.ai/editorial/${slug}`,
  editorialIndex: 'https://abarva.ai/editorial/',
  contradictions: 'https://abarva.ai/contradictions/',
  contradiction: (id: string) => `https://abarva.ai/contradictions/${id}`,
  solutions: 'https://abarva.ai/solutions/',
  architecture: (slug: string) => `https://abarva.ai/architecture/${slug}`,
  architectureIndex: 'https://abarva.ai/architecture/',
  digest: 'https://abarva.ai/digest/',
  rssFeed: 'https://abarva.ai/digest/feed.xml',
  atomFeed: 'https://abarva.ai/digest/feed.atom',
  jsonFeed: 'https://abarva.ai/digest/feed.json',
  contact: 'https://abarva.ai/contact/',
  howItWorks: 'https://abarva.ai/how-it-works/',
  sitemap: 'https://abarva.ai/sitemap.xml',
  robots: 'https://abarva.ai/robots.txt',
} as const;

export type CanonicalUrlKey = keyof typeof CANONICAL_URLS;
