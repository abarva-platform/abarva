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

// ─── TopNav ──────────────────────────────────────────────────────────────────

describe('TopNav', () => {
  let TopNav: typeof import('@/components/public-site/TopNav').TopNav;

  beforeAll(async () => {
    ({ TopNav } = await import('@/components/public-site/TopNav'));
  });

  it('renders the AbarVa wordmark', () => {
    render(React.createElement(TopNav));
    expect(screen.getByText('Abar')).toBeTruthy();
    expect(screen.getByText('Va')).toBeTruthy();
  });

  it('renders all four nav links', () => {
    render(React.createElement(TopNav));
    expect(screen.getByText('Patterns')).toBeTruthy();
    expect(screen.getByText('Contradictions')).toBeTruthy();
    expect(screen.getByText('Editorial')).toBeTruthy();
    expect(screen.getByText('Architecture')).toBeTruthy();
  });

  it('renders the Try Atlas CTA linking to /atlas/', () => {
    render(React.createElement(TopNav));
    const cta = screen.getByText('Try Atlas →');
    expect(cta).toBeTruthy();
    expect((cta as HTMLAnchorElement).getAttribute('href')).toBe('/atlas/');
  });

  it('has an accessible navigation landmark', () => {
    render(React.createElement(TopNav));
    const nav = screen.getByRole('navigation', { name: 'Main navigation' });
    expect(nav).toBeTruthy();
  });
});

// ─── Footer ──────────────────────────────────────────────────────────────────

describe('Footer', () => {
  let Footer: typeof import('@/components/public-site/Footer').Footer;

  beforeAll(async () => {
    ({ Footer } = await import('@/components/public-site/Footer'));
  });

  it('renders the product column', () => {
    render(React.createElement(Footer));
    expect(screen.getByText('How it works')).toBeTruthy();
    expect(screen.getByText('Atlas')).toBeTruthy();
  });

  it('renders the corpus column links', () => {
    render(React.createElement(Footer));
    expect(screen.getByText('Contradictions')).toBeTruthy();
    expect(screen.getByText('Editorial')).toBeTruthy();
    expect(screen.getByText('Digest')).toBeTruthy();
  });

  it('renders the architecture column', () => {
    render(React.createElement(Footer));
    expect(screen.getByText('Knowledge fabric')).toBeTruthy();
    expect(screen.getByText('Data plane')).toBeTruthy();
    expect(screen.getByText('Governance')).toBeTruthy();
  });

  it('renders a Talk to us contact link', () => {
    render(React.createElement(Footer));
    const link = screen.getByText('Talk to us');
    expect(link).toBeTruthy();
    expect((link as HTMLAnchorElement).getAttribute('href')).toBe('/contact/');
  });

  it('renders privacy and terms legal links', () => {
    render(React.createElement(Footer));
    expect(screen.getByText('Privacy')).toBeTruthy();
    expect(screen.getByText('Terms')).toBeTruthy();
  });

  it('has contentinfo role', () => {
    render(React.createElement(Footer));
    const footer = screen.getByRole('contentinfo');
    expect(footer).toBeTruthy();
  });
});

// ─── PaperContainer ──────────────────────────────────────────────────────────

describe('PaperContainer', () => {
  let PaperContainer: typeof import('@/components/public-site/PaperContainer').PaperContainer;

  beforeAll(async () => {
    ({ PaperContainer } = await import('@/components/public-site/PaperContainer'));
  });

  it('renders children', () => {
    render(
      React.createElement(PaperContainer, null, React.createElement('p', null, 'hello corpus'))
    );
    expect(screen.getByText('hello corpus')).toBeTruthy();
  });

  it('defaults to div tag', () => {
    const { container } = render(
      React.createElement(PaperContainer, null, React.createElement('span', null, 'x'))
    );
    expect(container.firstChild?.nodeName).toBe('DIV');
  });

  it('respects as prop for semantic elements', () => {
    const { container } = render(
      React.createElement(PaperContainer, { as: 'section' }, React.createElement('span', null, 'x'))
    );
    expect(container.firstChild?.nodeName).toBe('SECTION');
  });
});
