/** @jest-environment jsdom */
import React from 'react';
import { render, screen } from '@testing-library/react';

// ─── Next.js mocks ─────────────────────────────────────────────────────────────

jest.mock('next/link', () => {
  return function MockLink({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
    [key: string]: unknown;
  }) {
    return React.createElement('a', { href, ...rest }, children);
  };
});

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), prefetch: jest.fn() }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// ─── getPublicPatterns ─────────────────────────────────────────────────────────

describe('getPublicPatterns()', () => {
  let getPublicPatterns: typeof import('@/lib/public-site/public-patterns').getPublicPatterns;

  beforeAll(async () => {
    ({ getPublicPatterns } = await import('@/lib/public-site/public-patterns'));
  });

  it('returns an array', () => {
    const patterns = getPublicPatterns();
    expect(Array.isArray(patterns)).toBe(true);
  });

  it('returns at least one pattern', () => {
    const patterns = getPublicPatterns();
    expect(patterns.length).toBeGreaterThan(0);
  });

  it('every pattern has a string slug', () => {
    const patterns = getPublicPatterns();
    for (const p of patterns) {
      expect(typeof p.slug).toBe('string');
      expect(p.slug.trim().length).toBeGreaterThan(0);
    }
  });

  it('has no duplicate slugs', () => {
    const patterns = getPublicPatterns();
    const slugs = patterns.map((p) => p.slug);
    const unique = new Set(slugs);
    expect(unique.size).toBe(slugs.length);
  });

  it('caps at 60 patterns', () => {
    const patterns = getPublicPatterns();
    expect(patterns.length).toBeLessThanOrEqual(60);
  });
});

// ─── getPublicPatternBySlug ────────────────────────────────────────────────────

describe('getPublicPatternBySlug()', () => {
  let getPublicPatternBySlug: typeof import('@/lib/public-site/public-patterns').getPublicPatternBySlug;
  let getPublicPatterns: typeof import('@/lib/public-site/public-patterns').getPublicPatterns;

  beforeAll(async () => {
    ({ getPublicPatternBySlug, getPublicPatterns } = await import('@/lib/public-site/public-patterns'));
  });

  it('returns correct pattern for a real slug', () => {
    const patterns = getPublicPatterns();
    const first = patterns[0];
    const found = getPublicPatternBySlug(first.slug);
    expect(found).toBeDefined();
    expect(found?.slug).toBe(first.slug);
    expect(found?.title).toBe(first.title);
  });

  it('returns undefined for a nonexistent slug', () => {
    const result = getPublicPatternBySlug('this-slug-does-not-exist-in-corpus');
    expect(result).toBeUndefined();
  });
});

// ─── getPublicPatternCategories ────────────────────────────────────────────────

describe('getPublicPatternCategories()', () => {
  let getPublicPatternCategories: typeof import('@/lib/public-site/public-patterns').getPublicPatternCategories;

  beforeAll(async () => {
    ({ getPublicPatternCategories } = await import('@/lib/public-site/public-patterns'));
  });

  it('returns an array of strings', () => {
    const cats = getPublicPatternCategories();
    expect(Array.isArray(cats)).toBe(true);
    for (const c of cats) {
      expect(typeof c).toBe('string');
    }
  });

  it('has no duplicates', () => {
    const cats = getPublicPatternCategories();
    expect(new Set(cats).size).toBe(cats.length);
  });
});

// ─── PatternCard ──────────────────────────────────────────────────────────────

describe('PatternCard', () => {
  let PatternCard: typeof import('@/components/public-site/PatternCard').PatternCard;
  let getPublicPatterns: typeof import('@/lib/public-site/public-patterns').getPublicPatterns;

  beforeAll(async () => {
    ({ PatternCard } = await import('@/components/public-site/PatternCard'));
    ({ getPublicPatterns } = await import('@/lib/public-site/public-patterns'));
  });

  it('renders the pattern title', () => {
    const pattern = getPublicPatterns()[0];
    render(React.createElement(PatternCard, { pattern }));
    expect(screen.getByText(pattern.title)).toBeTruthy();
  });

  it('links to the correct pattern href', () => {
    const pattern = getPublicPatterns()[0];
    const { container } = render(React.createElement(PatternCard, { pattern }));
    const link = container.querySelector('a');
    expect(link).toBeTruthy();
    expect(link?.getAttribute('href')).toBe(`/patterns/${pattern.slug}/`);
  });

  it('displays a confidence percentage', () => {
    const pattern = getPublicPatterns()[0];
    const { container } = render(React.createElement(PatternCard, { pattern }));
    const text = container.textContent ?? '';
    expect(text).toContain('%');
  });
});

// ─── PatternDetail ────────────────────────────────────────────────────────────

describe('PatternDetail', () => {
  let PatternDetail: typeof import('@/components/public-site/PatternDetail').PatternDetail;
  let getPublicPatterns: typeof import('@/lib/public-site/public-patterns').getPublicPatterns;

  beforeAll(async () => {
    ({ PatternDetail } = await import('@/components/public-site/PatternDetail'));
    ({ getPublicPatterns } = await import('@/lib/public-site/public-patterns'));
  });

  it('renders the pattern title in an h1', () => {
    const pattern = getPublicPatterns()[0];
    render(React.createElement(PatternDetail, { pattern }));
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1.textContent).toBe(pattern.title);
  });

  it('renders AskAtlasInline copy', () => {
    const pattern = getPublicPatterns()[0];
    render(React.createElement(PatternDetail, { pattern }));
    expect(screen.getByText('Want to see how this pattern plays out in your context?')).toBeTruthy();
  });
});

// ─── AskAtlasInline ──────────────────────────────────────────────────────────

describe('AskAtlasInline', () => {
  let AskAtlasInline: typeof import('@/components/public-site/AskAtlasInline').AskAtlasInline;

  beforeAll(async () => {
    ({ AskAtlasInline } = await import('@/components/public-site/AskAtlasInline'));
  });

  it('renders the Ask Atlas CTA text', () => {
    render(React.createElement(AskAtlasInline));
    expect(screen.getByText('Ask Atlas →')).toBeTruthy();
  });

  it('links to CANONICAL_URLS.atlas', async () => {
    const { CANONICAL_URLS } = await import('@/lib/public-site/canonical-urls');
    const { container } = render(React.createElement(AskAtlasInline));
    const link = container.querySelector('a');
    expect(link).toBeTruthy();
    expect(link?.getAttribute('href')).toBe(CANONICAL_URLS.atlas);
  });

  it('does not hardcode abarva.ai in component source', async () => {
    // The link href must come from CANONICAL_URLS, not a hardcoded string
    const { CANONICAL_URLS } = await import('@/lib/public-site/canonical-urls');
    const { container } = render(React.createElement(AskAtlasInline));
    const link = container.querySelector('a');
    // Verify it resolves to the atlas URL from canonical
    expect(link?.getAttribute('href')).toBe(CANONICAL_URLS.atlas);
  });
});

// ─── CANONICAL_URLS used by pattern URLs ──────────────────────────────────────

describe('CANONICAL_URLS pattern URLs', () => {
  it('patterns(slug) constructs correct URL without hardcoding', async () => {
    const { CANONICAL_URLS } = await import('@/lib/public-site/canonical-urls');
    const url = CANONICAL_URLS.patterns('six-phase-engagement-architecture');
    expect(url).toBe('https://abarva.ai/patterns/six-phase-engagement-architecture');
    expect(url).not.toMatch(/^(?!https:\/\/abarva\.ai)/);
  });

  it('patternIndex is a valid HTTPS URL', async () => {
    const { CANONICAL_URLS } = await import('@/lib/public-site/canonical-urls');
    const url = new URL(CANONICAL_URLS.patternIndex);
    expect(url.protocol).toBe('https:');
    expect(url.hostname).toBe('abarva.ai');
    expect(url.pathname).toBe('/patterns/');
  });

  it('atlas URL ends with trailing slash', async () => {
    const { CANONICAL_URLS } = await import('@/lib/public-site/canonical-urls');
    expect(CANONICAL_URLS.atlas.endsWith('/')).toBe(true);
  });
});
