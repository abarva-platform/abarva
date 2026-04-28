/** @jest-environment jsdom */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { ATLAS_SAMPLE_INSIGHTS } from '@/lib/public-site/atlas-public-scope';
import { CANONICAL_URLS } from '@/lib/public-site/canonical-urls';
import { EDITORIAL_SLUGS, getAllEditorialPieces } from '@/lib/public-site/editorial-loader';

// Mock Next.js modules
jest.mock('next/link', () =>
  function MockLink({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
    [k: string]: unknown;
  }) {
    return React.createElement('a', { href, ...rest }, children);
  },
);

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// ─── ATLAS_SAMPLE_INSIGHTS ────────────────────────────────────────────────────

describe('ATLAS_SAMPLE_INSIGHTS', () => {
  it('has exactly 3 items', () => {
    expect(ATLAS_SAMPLE_INSIGHTS).toHaveLength(3);
  });

  it('each insight has required id field', () => {
    for (const insight of ATLAS_SAMPLE_INSIGHTS) {
      expect(typeof insight.id).toBe('string');
      expect(insight.id.length).toBeGreaterThan(0);
    }
  });

  it('each insight has a non-empty question', () => {
    for (const insight of ATLAS_SAMPLE_INSIGHTS) {
      expect(typeof insight.question).toBe('string');
      expect(insight.question.length).toBeGreaterThan(10);
    }
  });

  it('each insight has a non-empty answer (2-3 sentences)', () => {
    for (const insight of ATLAS_SAMPLE_INSIGHTS) {
      expect(typeof insight.answer).toBe('string');
      expect(insight.answer.length).toBeGreaterThan(40);
    }
  });

  it('each insight confidence is between 0 and 1 (exclusive)', () => {
    for (const insight of ATLAS_SAMPLE_INSIGHTS) {
      expect(insight.confidence).toBeGreaterThan(0);
      expect(insight.confidence).toBeLessThan(1);
    }
  });

  it('insight ids are unique', () => {
    const ids = ATLAS_SAMPLE_INSIGHTS.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('each insight has a non-empty patterns array', () => {
    for (const insight of ATLAS_SAMPLE_INSIGHTS) {
      expect(Array.isArray(insight.patterns)).toBe(true);
      expect(insight.patterns.length).toBeGreaterThan(0);
    }
  });
});

// ─── PublicAtlas component ────────────────────────────────────────────────────

describe('PublicAtlas component', () => {
  let PublicAtlas: typeof import('@/components/public-site/PublicAtlas').PublicAtlas;

  beforeAll(async () => {
    ({ PublicAtlas } = await import('@/components/public-site/PublicAtlas'));
  });

  it('renders all 3 insight cards (questions visible)', () => {
    render(React.createElement(PublicAtlas, { insights: ATLAS_SAMPLE_INSIGHTS }));
    for (const insight of ATLAS_SAMPLE_INSIGHTS) {
      const matches = screen.getAllByText(new RegExp(insight.question.slice(0, 20), 'i'));
      expect(matches.length).toBeGreaterThan(0);
    }
  });

  it('CTA links to CANONICAL_URLS.contact', () => {
    const { container } = render(
      React.createElement(PublicAtlas, { insights: ATLAS_SAMPLE_INSIGHTS }),
    );
    const links = container.querySelectorAll(`a[href="${CANONICAL_URLS.contact}"]`);
    expect(links.length).toBeGreaterThan(0);
  });

  it('renders without crash with empty insights array', () => {
    const { container } = render(React.createElement(PublicAtlas, { insights: [] }));
    expect(container.firstChild).toBeTruthy();
  });
});

// ─── Atlas page canonical URL ─────────────────────────────────────────────────

describe('Atlas page metadata', () => {
  it('CANONICAL_URLS.atlas equals the expected atlas URL', () => {
    expect(CANONICAL_URLS.atlas).toBe('https://abarva.ai/atlas/');
  });

  it('atlas page exports default function', async () => {
    const mod = await import('@/app/(public)/atlas/page');
    expect(typeof mod.default).toBe('function');
  });

  it('atlas page metadata uses CANONICAL_URLS.atlas (not hardcoded)', async () => {
    const mod = await import('@/app/(public)/atlas/page');
    const meta = mod.metadata as { alternates?: { canonical?: string } };
    expect(meta.alternates?.canonical).toBe(CANONICAL_URLS.atlas);
  });
});

// ─── Editorial slugs ──────────────────────────────────────────────────────────

describe('Editorial slugs', () => {
  it('contains all 3 expected slugs', () => {
    expect(EDITORIAL_SLUGS).toContain('10-reasons-ai-initiatives-fail');
    expect(EDITORIAL_SLUGS).toContain('why-we-publish-our-contradictions');
    expect(EDITORIAL_SLUGS).toContain('the-cost-of-ai-program-drift');
  });

  it('has exactly 3 slugs', () => {
    expect(EDITORIAL_SLUGS).toHaveLength(3);
  });
});

// ─── Editorial generateStaticParams ──────────────────────────────────────────

describe('Editorial detail generateStaticParams', () => {
  it('returns all 3 slugs as param objects', async () => {
    const mod = await import('@/app/(public)/editorial/[slug]/page');
    const params = mod.generateStaticParams();
    expect(params).toHaveLength(3);
    const slugs = params.map((p: { slug: string }) => p.slug);
    expect(slugs).toContain('10-reasons-ai-initiatives-fail');
    expect(slugs).toContain('why-we-publish-our-contradictions');
    expect(slugs).toContain('the-cost-of-ai-program-drift');
  });
});

// ─── EditorialPiece component ─────────────────────────────────────────────────

describe('EditorialPiece component', () => {
  let EditorialPiece: typeof import('@/components/public-site/EditorialPiece').EditorialPiece;

  beforeAll(async () => {
    ({ EditorialPiece } = await import('@/components/public-site/EditorialPiece'));
  });

  it('renders the article title', () => {
    const pieces = getAllEditorialPieces();
    const piece = pieces[0];
    const others = pieces.slice(1).map((p) => ({ slug: p.slug, title: p.title }));
    render(React.createElement(EditorialPiece, { piece, otherPieces: others }));
    expect(screen.getByText(piece.title)).toBeTruthy();
  });

  it('renders byline "AbarVa Research Team"', () => {
    const pieces = getAllEditorialPieces();
    const piece = pieces[0];
    const others = pieces.slice(1).map((p) => ({ slug: p.slug, title: p.title }));
    render(React.createElement(EditorialPiece, { piece, otherPieces: others }));
    expect(screen.getByText('AbarVa Research Team')).toBeTruthy();
  });

  it('renders continue-reading links to other pieces', () => {
    const pieces = getAllEditorialPieces();
    const piece = pieces[0];
    const others = pieces.slice(1).map((p) => ({ slug: p.slug, title: p.title }));
    const { container } = render(
      React.createElement(EditorialPiece, { piece, otherPieces: others }),
    );
    const links = container.querySelectorAll('a');
    const hrefs = Array.from(links).map((l) => l.getAttribute('href'));
    expect(hrefs.some((h) => h?.includes(others[0].slug))).toBe(true);
  });
});

// ─── Editorial index page ─────────────────────────────────────────────────────

describe('Editorial index metadata', () => {
  it('CANONICAL_URLS.editorialIndex equals expected URL', () => {
    expect(CANONICAL_URLS.editorialIndex).toBe('https://abarva.ai/editorial/');
  });

  it('editorial index page exports default function', async () => {
    const mod = await import('@/app/(public)/editorial/page');
    expect(typeof mod.default).toBe('function');
  });
});

// ─── CANONICAL_URLS (no hardcoded strings) ────────────────────────────────────

describe('CANONICAL_URLS coverage for new routes', () => {
  it('atlas URL is on abarva.ai domain', () => {
    const url = new URL(CANONICAL_URLS.atlas);
    expect(url.hostname).toBe('abarva.ai');
  });

  it('editorialIndex URL is on abarva.ai domain', () => {
    const url = new URL(CANONICAL_URLS.editorialIndex);
    expect(url.hostname).toBe('abarva.ai');
  });

  it('editorial(slug) returns URL containing the slug', () => {
    const url = CANONICAL_URLS.editorial('test-slug');
    expect(url).toContain('test-slug');
    expect(new URL(url).hostname).toBe('abarva.ai');
  });
});
