/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';

// Mock window.matchMedia (not implemented in jsdom)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  }),
});

// Mock IntersectionObserver (not implemented in jsdom)
const mockObserve = jest.fn();
const mockUnobserve = jest.fn();
const mockDisconnect = jest.fn();
Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  value: jest.fn().mockImplementation(() => ({
    observe: mockObserve,
    unobserve: mockUnobserve,
    disconnect: mockDisconnect,
  })),
});

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

// ─── PHASES ──────────────────────────────────────────────────────────────────

describe('PHASES', () => {
  let PHASES: typeof import('@/lib/public-site/phases').PHASES;

  beforeAll(async () => {
    ({ PHASES } = await import('@/lib/public-site/phases'));
  });

  it('has 6 entries', () => {
    expect(PHASES).toHaveLength(6);
  });

  it('contains all expected phase ids', () => {
    const ids = PHASES.map((p) => p.id);
    expect(ids).toContain('discovery');
    expect(ids).toContain('synthesis');
    expect(ids).toContain('design');
    expect(ids).toContain('build');
    expect(ids).toContain('activate');
    expect(ids).toContain('operate');
  });
});

// ─── AnnotatedScreenshot ──────────────────────────────────────────────────────

describe('AnnotatedScreenshot', () => {
  let AnnotatedScreenshot: typeof import('@/components/public-site/AnnotatedScreenshot').AnnotatedScreenshot;

  beforeAll(async () => {
    ({ AnnotatedScreenshot } = await import('@/components/public-site/AnnotatedScreenshot'));
  });

  it('renders annotation text', () => {
    render(
      React.createElement(AnnotatedScreenshot, {
        phase: 'discovery',
        alt: 'Discovery phase screenshot',
        annotation: 'Atlas · context loaded',
      })
    );
    expect(screen.getByText('Atlas · context loaded')).toBeTruthy();
  });

  it('has aria-label for accessibility', () => {
    const { container } = render(
      React.createElement(AnnotatedScreenshot, {
        phase: 'synthesis',
        alt: 'Synthesis phase screenshot',
        annotation: 'Atlas · citations',
      })
    );
    const el = container.firstChild as HTMLElement;
    expect(el.getAttribute('aria-label')).toBe('Synthesis phase screenshot');
  });

  it('sets data-phase attribute on placeholder div', () => {
    const { container } = render(
      React.createElement(AnnotatedScreenshot, {
        phase: 'build',
        alt: 'Build phase screenshot',
        annotation: 'Sentinel validated',
      })
    );
    const phaseDiv = container.querySelector('[data-phase="build"]');
    expect(phaseDiv).toBeTruthy();
  });
});

// ─── PhaseSection ─────────────────────────────────────────────────────────────

describe('PhaseSection', () => {
  let PhaseSection: typeof import('@/components/public-site/PhaseSection').PhaseSection;

  const discoveryPhase = {
    id: 'discovery',
    label: 'Discovery',
    position: 0,
    marketingMessage: "Tenant context loaded. Atlas reads everything you've already documented.",
  };

  beforeAll(async () => {
    ({ PhaseSection } = await import('@/components/public-site/PhaseSection'));
  });

  it('renders phase label', () => {
    render(React.createElement(PhaseSection, { phase: discoveryPhase, isActive: true, index: 0 }));
    expect(screen.getByText('Discovery')).toBeTruthy();
  });

  it('renders marketing message', () => {
    render(React.createElement(PhaseSection, { phase: discoveryPhase, isActive: true, index: 0 }));
    expect(
      screen.getByText(
        "Tenant context loaded. Atlas reads everything you've already documented."
      )
    ).toBeTruthy();
  });

  it('applies reduced opacity when inactive via style', () => {
    const { container } = render(
      React.createElement(PhaseSection, { phase: discoveryPhase, isActive: false, index: 0 })
    );
    const section = container.querySelector('[data-phase-section="discovery"]') as HTMLElement;
    expect(section).toBeTruthy();
    expect(section.style.opacity).toBe('0.6');
  });

  it('applies full opacity when active via style', () => {
    const { container } = render(
      React.createElement(PhaseSection, { phase: discoveryPhase, isActive: true, index: 0 })
    );
    const section = container.querySelector('[data-phase-section="discovery"]') as HTMLElement;
    expect(section.style.opacity).toBe('1');
  });

  it('sets data-phase-section attribute', () => {
    const { container } = render(
      React.createElement(PhaseSection, { phase: discoveryPhase, isActive: false, index: 0 })
    );
    expect(container.querySelector('[data-phase-section="discovery"]')).toBeTruthy();
  });
});

// ─── HowItWorks ──────────────────────────────────────────────────────────────

describe('HowItWorks', () => {
  let HowItWorks: typeof import('@/components/public-site/HowItWorks').HowItWorks;

  beforeAll(async () => {
    ({ HowItWorks } = await import('@/components/public-site/HowItWorks'));
  });

  it('renders section with id="how-it-works"', () => {
    render(React.createElement(HowItWorks));
    const section = document.getElementById('how-it-works');
    expect(section).toBeTruthy();
  });

  it('renders all 6 phase sections', () => {
    render(React.createElement(HowItWorks));
    const phaseSections = document.querySelectorAll('[data-phase-section]');
    expect(phaseSections).toHaveLength(6);
  });

  it('renders section heading "How it works"', () => {
    render(React.createElement(HowItWorks));
    expect(screen.getByText('How it works')).toBeTruthy();
  });

  it('renders the exact subheading copy', () => {
    render(React.createElement(HowItWorks));
    expect(
      screen.getByText(
        'The maestro through six phases. Each phase delivers a specific capability.'
      )
    ).toBeTruthy();
  });
});

// ─── HowItWorksPage ──────────────────────────────────────────────────────────

describe('HowItWorksPage', () => {
  let HowItWorksPage: typeof import('@/app/(public)/how-it-works/page').default;

  beforeAll(async () => {
    ({ default: HowItWorksPage } = await import('@/app/(public)/how-it-works/page'));
  });

  it('renders HowItWorks component (section id="how-it-works")', () => {
    render(React.createElement(HowItWorksPage));
    const section = document.getElementById('how-it-works');
    expect(section).toBeTruthy();
  });

  it('renders the section heading', () => {
    render(React.createElement(HowItWorksPage));
    expect(screen.getByText('How it works')).toBeTruthy();
  });
});
