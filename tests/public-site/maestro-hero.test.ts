/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';

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

// Mock window.matchMedia (not available in jsdom)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// ─── PHASES data ──────────────────────────────────────────────────────────────

describe('PHASES data', () => {
  let PHASES: typeof import('@/lib/public-site/phases').PHASES;

  beforeAll(async () => {
    ({ PHASES } = await import('@/lib/public-site/phases'));
  });

  it('has exactly 6 items', () => {
    expect(PHASES).toHaveLength(6);
  });

  it('each phase has id, label, position, and marketingMessage', () => {
    for (const phase of PHASES) {
      expect(typeof phase.id).toBe('string');
      expect(phase.id.length).toBeGreaterThan(0);
      expect(typeof phase.label).toBe('string');
      expect(phase.label.length).toBeGreaterThan(0);
      expect(typeof phase.position).toBe('number');
      expect(typeof phase.marketingMessage).toBe('string');
      expect(phase.marketingMessage.length).toBeGreaterThan(0);
    }
  });

  it('phase positions are sequential 0-5', () => {
    const positions = PHASES.map((p) => p.position);
    expect(positions).toEqual([0, 1, 2, 3, 4, 5]);
  });

  it('phase ids are unique', () => {
    const ids = PHASES.map((p) => p.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(PHASES.length);
  });
});

// ─── MaestroFigure ────────────────────────────────────────────────────────────

describe('MaestroFigure', () => {
  let MaestroFigure: typeof import('@/components/public-site/MaestroFigure').MaestroFigure;

  beforeAll(async () => {
    ({ MaestroFigure } = await import('@/components/public-site/MaestroFigure'));
  });

  it('renders without crashing', () => {
    const { container } = render(React.createElement(MaestroFigure, { phase: 0, animate: false }));
    expect(container.firstChild).toBeTruthy();
  });

  it('renders an SVG element', () => {
    const { container } = render(React.createElement(MaestroFigure, { phase: 2, animate: false }));
    const svg = container.querySelector('svg');
    expect(svg).toBeTruthy();
  });

  it('SVG has accessible title and desc', () => {
    const { container } = render(React.createElement(MaestroFigure, { phase: 1, animate: false }));
    const title = container.querySelector('title');
    const desc = container.querySelector('desc');
    expect(title).toBeTruthy();
    expect(desc).toBeTruthy();
  });

  it('applies walking class when animate=true', () => {
    const { container } = render(React.createElement(MaestroFigure, { phase: 3, animate: true }));
    const svg = container.querySelector('svg');
    // SVG elements have SVGAnimatedString for className; check via classList or getAttribute
    expect(svg?.classList.contains('pub-maestro-figure--walking')).toBe(true);
  });

  it('does not apply walking class when animate=false', () => {
    const { container } = render(React.createElement(MaestroFigure, { phase: 3, animate: false }));
    const svg = container.querySelector('svg');
    expect(svg?.classList.contains('pub-maestro-figure--walking')).toBe(false);
  });
});

// ─── MaestroHero ─────────────────────────────────────────────────────────────

describe('MaestroHero', () => {
  let MaestroHero: typeof import('@/components/public-site/MaestroHero').MaestroHero;

  beforeAll(async () => {
    jest.mock('@/components/public-site/MaestroFigure', () => ({
      MaestroFigure: function MockMaestroFigure() {
        return React.createElement('div', { 'data-testid': 'maestro-figure' });
      },
    }));

    ({ MaestroHero } = await import('@/components/public-site/MaestroHero'));
  });

  it('renders without crashing', () => {
    const { container } = render(React.createElement(MaestroHero));
    expect(container.firstChild).toBeTruthy();
  });

  it('contains the exact hero headline', () => {
    render(React.createElement(MaestroHero));
    expect(screen.getByText('A knowledge layer for AI programs.')).toBeTruthy();
  });

  it('contains the subhead copy', () => {
    render(React.createElement(MaestroHero));
    expect(
      screen.getByText(
        /60 patterns\. 30 signals\. 10 contradictions\./,
      ),
    ).toBeTruthy();
  });

  it('contains a link to /atlas/', () => {
    render(React.createElement(MaestroHero));
    const atlasLink = screen.getByRole('link', { name: /search the corpus/i });
    expect(atlasLink).toBeTruthy();
    expect(atlasLink.getAttribute('href')).toBe('/atlas/');
  });

  it('contains a link to #how-it-works', () => {
    render(React.createElement(MaestroHero));
    const howItWorksLink = screen.getByRole('link', { name: /how it works/i });
    expect(howItWorksLink).toBeTruthy();
    expect(howItWorksLink.getAttribute('href')).toBe('#how-it-works');
  });

  it('renders all 6 phase labels', () => {
    render(React.createElement(MaestroHero));
    const labels = ['Discovery', 'Synthesis', 'Design', 'Build', 'Activate', 'Operate'];
    for (const label of labels) {
      expect(screen.getByText(label)).toBeTruthy();
    }
  });
});
