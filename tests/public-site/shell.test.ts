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
    expect(screen.getByAltText('AbarVa')).toBeTruthy();
  });

  it('renders the lean public navigation', () => {
    render(React.createElement(TopNav));
    expect(screen.getByText('Sign in')).toBeTruthy();
    expect(screen.queryByText('Product')).toBeNull();
    expect(screen.queryByText('Training')).toBeNull();
    expect(screen.queryByText('Patterns')).toBeNull();
    expect(screen.queryByText('Architecture')).toBeNull();
  });

  it('renders the Request access CTA linking to sign-in', () => {
    render(React.createElement(TopNav));
    const cta = screen.getByText('Request access');
    expect(cta).toBeTruthy();
    expect((cta as HTMLAnchorElement).getAttribute('href')).toBe('/sign-in');
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
    expect(screen.getAllByText('Request access').length).toBeGreaterThan(0);
    expect(
      screen
        .getAllByText('Request access')
        .some((node) => (node as HTMLAnchorElement).getAttribute('href') === '/sign-in')
    ).toBe(true);
    expect(screen.queryByText('Product')).toBeNull();
  });

  it('renders the access posture', () => {
    render(React.createElement(Footer));
    expect(screen.getByText(/Training, client primers, corpus detail/)).toBeTruthy();
  });

  it('renders the private trust posture instead of public trust links', () => {
    render(React.createElement(Footer));
    expect(screen.getByText('Trust')).toBeTruthy();
    expect(screen.getByText(/Responsible AI, model-card, subprocessors/)).toBeTruthy();
    expect(screen.queryByText('Contact')).toBeNull();
    expect(screen.queryByText('Model card')).toBeNull();
  });

  it('renders invite-only workspace copy', () => {
    render(React.createElement(Footer));
    expect(screen.getByText('Invite-only enterprise workspaces.')).toBeTruthy();
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
