/**
 * @jest-environment jsdom
 */
/**
 * TenantSwitcher · error-path coverage (P1 silent-fail post-mortem · 2026-05-30).
 *
 * The prior TenantSwitcher.test.tsx covers the happy path and a single
 * 'forbidden' surface. This file expands coverage so the regression
 * never re-occurs:
 *
 *   - 401 → "session has expired" message, popover stays open, no
 *     navigation, retry button present.
 *   - 403 → "tenant-switch permission" message (red surface).
 *   - 5xx → "temporarily unavailable" message (amber surface) with
 *     retry hint.
 *   - Network reject (fetch throws) → transient banner, no leak of
 *     stack/internal error.
 *   - Retry: clicking Retry re-POSTs and on success calls navigate.
 *   - 200 → window.location.assign('/admin') invoked when no
 *     onNavigate prop is supplied.
 *
 * No raw error code (`forbidden`, `unauthenticated`, `invalid_tenant`,
 * `switch_failed_500`) should ever appear in the UI text — those are
 * server contract values, not user-facing strings.
 */

import '@testing-library/jest-dom';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';

import { TenantSwitcher, type TenantSwitcherOption } from '../TenantSwitcher';

jest.mock('posthog-js', () => ({
  __esModule: true,
  default: { capture: jest.fn() },
}));

const CANONICAL_OPTIONS: TenantSwitcherOption[] = [
  {
    canonicalKey: 'apex-retail',
    displayName: 'Apex Retail Group',
    industryLabel: 'Retail',
  },
  {
    canonicalKey: 'meridian-health',
    displayName: 'Meridian Health System',
    industryLabel: 'Healthcare',
  },
  {
    canonicalKey: 'first-capital',
    displayName: 'First Capital Financial',
    industryLabel: 'Financial Services',
  },
  {
    canonicalKey: 'northstar-clinical',
    displayName: 'Northstar Clinical Technologies',
    industryLabel: 'Clinical Technology',
  },
  {
    canonicalKey: 'skyharbor-air',
    displayName: 'SkyHarbor Air',
    industryLabel: 'Global Airline',
  },
];

const originalFetch = globalThis.fetch;
const navigateMock = jest.fn();

function mockFetchStatus(status: number, body: object = {}): jest.Mock {
  const fetchMock = jest.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  });
  globalThis.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
}

function mockFetchReject(reason: unknown): jest.Mock {
  const fetchMock = jest.fn().mockRejectedValue(reason);
  globalThis.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
}

function renderSwitcher(): void {
  render(
    <TenantSwitcher
      canSwitch
      currentCanonicalKey="apex-retail"
      currentDisplayName="Apex Retail Group"
      options={CANONICAL_OPTIONS}
      onNavigate={navigateMock}
    />,
  );
}

beforeEach(() => {
  jest.clearAllMocks();
});

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe('TenantSwitcher · error paths', () => {
  it('401 surfaces a session-expired message, keeps the popover open, no nav', async () => {
    mockFetchStatus(401, { error: 'unauthenticated' });
    renderSwitcher();
    fireEvent.click(screen.getByTestId('tenant-switcher-chip'));
    await act(async () => {
      fireEvent.click(
        screen.getByTestId('tenant-switcher-option-meridian-health'),
      );
    });
    await waitFor(() => {
      expect(
        screen.getByTestId('tenant-switcher-error-message'),
      ).toHaveTextContent(/session has expired/i);
    });
    expect(screen.getByTestId('tenant-switcher-popover')).toBeInTheDocument();
    expect(navigateMock).not.toHaveBeenCalled();
    // Eyebrow shows the status code for log correlation.
    expect(
      screen.getByTestId('tenant-switcher-error-eyebrow'),
    ).toHaveTextContent(/401/);
    // Retry button is rendered.
    expect(
      screen.getByTestId('tenant-switcher-error-retry'),
    ).toBeInTheDocument();
    // Raw error code is NOT exposed.
    expect(screen.getByTestId('tenant-switcher-error')).not.toHaveTextContent(
      /unauthenticated/i,
    );
  });

  it('403 surfaces a tenant-switch-permission message in the red palette', async () => {
    mockFetchStatus(403, { error: 'forbidden' });
    renderSwitcher();
    fireEvent.click(screen.getByTestId('tenant-switcher-chip'));
    await act(async () => {
      fireEvent.click(
        screen.getByTestId('tenant-switcher-option-meridian-health'),
      );
    });
    await waitFor(() => {
      expect(
        screen.getByTestId('tenant-switcher-error-message'),
      ).toHaveTextContent(/tenant-switch permission/i);
    });
    expect(screen.getByTestId('tenant-switcher-popover')).toBeInTheDocument();
    // The error dot uses the locked errorInk colour (#991B1B → rgb).
    const dot = screen.getByTestId('tenant-switcher-error-dot');
    expect(dot.getAttribute('style')).toMatch(/rgb\(153,\s*27,\s*27\)/i);
    expect(navigateMock).not.toHaveBeenCalled();
    expect(screen.getByTestId('tenant-switcher-error')).not.toHaveTextContent(
      /forbidden/i,
    );
  });

  it('5xx surfaces a retry hint with the transient (amber) surface', async () => {
    mockFetchStatus(500, { error: 'internal' });
    renderSwitcher();
    fireEvent.click(screen.getByTestId('tenant-switcher-chip'));
    await act(async () => {
      fireEvent.click(
        screen.getByTestId('tenant-switcher-option-meridian-health'),
      );
    });
    await waitFor(() => {
      expect(
        screen.getByTestId('tenant-switcher-error-message'),
      ).toHaveTextContent(/temporarily unavailable/i);
    });
    const banner = screen.getByTestId('tenant-switcher-error');
    // Amber/warn surface — must not be the red errorSurface for 5xx.
    // #FFFBEB → rgb(255, 251, 235) in jsdom-computed inline styles.
    expect(banner.getAttribute('style')).toMatch(/rgb\(255,\s*251,\s*235\)/i);
    expect(
      screen.getByTestId('tenant-switcher-error-eyebrow'),
    ).toHaveTextContent(/500/);
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it('network reject surfaces a transient banner without leaking the raw error', async () => {
    mockFetchReject(new Error('connection refused at internal-host:5432'));
    renderSwitcher();
    fireEvent.click(screen.getByTestId('tenant-switcher-chip'));
    await act(async () => {
      fireEvent.click(
        screen.getByTestId('tenant-switcher-option-meridian-health'),
      );
    });
    await waitFor(() => {
      expect(
        screen.getByTestId('tenant-switcher-error-message'),
      ).toBeInTheDocument();
    });
    // The raw network error (which mentions an internal hostname) must
    // NOT be surfaced to the user.
    expect(screen.getByTestId('tenant-switcher-error')).not.toHaveTextContent(
      /internal-host/i,
    );
    expect(screen.getByTestId('tenant-switcher-error')).not.toHaveTextContent(
      /5432/,
    );
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it('Retry button re-POSTs and navigates on second-attempt success', async () => {
    // First call: 503. Second call (Retry): 200.
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 503,
        json: () => Promise.resolve({ error: 'unavailable' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ ok: true }),
      });
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    renderSwitcher();
    fireEvent.click(screen.getByTestId('tenant-switcher-chip'));
    await act(async () => {
      fireEvent.click(
        screen.getByTestId('tenant-switcher-option-meridian-health'),
      );
    });
    await waitFor(() => {
      expect(
        screen.getByTestId('tenant-switcher-error-retry'),
      ).toBeInTheDocument();
    });
    await act(async () => {
      fireEvent.click(screen.getByTestId('tenant-switcher-error-retry'));
    });
    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/admin');
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const [, secondInit] = fetchMock.mock.calls[1]!;
    const body = JSON.parse(((secondInit as RequestInit).body as string) ?? '{}');
    expect(body).toEqual({ tenantKey: 'meridian-health' });
  });

  it('200 with onNavigate prop calls navigate(/admin)', async () => {
    // jsdom's window.location is non-configurable, so we can't spy on
    // window.location.assign directly. The component's onNavigate prop
    // is the production-equivalent seam — the component falls back to
    // window.location.assign('/admin') only when no override is given.
    // Coverage of the fallback ships separately via the e2e walkthrough.
    mockFetchStatus(200, { ok: true });
    renderSwitcher();
    fireEvent.click(screen.getByTestId('tenant-switcher-chip'));
    await act(async () => {
      fireEvent.click(
        screen.getByTestId('tenant-switcher-option-meridian-health'),
      );
    });
    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/admin');
    });
  });
});
