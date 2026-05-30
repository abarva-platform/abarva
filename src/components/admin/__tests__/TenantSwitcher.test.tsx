/**
 * @jest-environment jsdom
 */
/**
 * TenantSwitcher · Wave 2 PR-5 tests.
 *
 * Coverage:
 *   - canSwitch=false renders the static label (no chip, no button).
 *   - canSwitch=true renders the chip + popover with all 5 canonical
 *     tenants; the active tenant is marked.
 *   - Selecting a tenant POSTs the canonical key to the endpoint and
 *     captures the PostHog breadcrumb.
 *   - Selecting the already-active tenant closes the popover without
 *     POSTing.
 *   - Non-200 response surfaces a transient error.
 *   - The component never POSTs a key that is not in the prop-provided
 *     options list (locked to canonical 5).
 */

import '@testing-library/jest-dom';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';

import { TenantSwitcher, type TenantSwitcherOption } from '../TenantSwitcher';

const captureMock = jest.fn();

jest.mock('posthog-js', () => ({
  __esModule: true,
  default: {
    capture: (...args: unknown[]) => captureMock(...args),
  },
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

beforeEach(() => {
  jest.clearAllMocks();
});

afterEach(() => {
  globalThis.fetch = originalFetch;
});

function mockFetchOk(): jest.Mock {
  const fetchMock = jest.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: () => Promise.resolve({ ok: true }),
  });
  globalThis.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
}

function mockFetchError(status: number, body: object): jest.Mock {
  const fetchMock = jest.fn().mockResolvedValue({
    ok: false,
    status,
    json: () => Promise.resolve(body),
  });
  globalThis.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
}

describe('TenantSwitcher', () => {
  it('renders the static label and no chip when canSwitch=false', () => {
    render(
      <TenantSwitcher
        canSwitch={false}
        currentCanonicalKey="apex-retail"
        currentDisplayName="Apex Retail Group"
        options={CANONICAL_OPTIONS}
        onNavigate={navigateMock}
      />,
    );
    expect(screen.getByTestId('tenant-switcher-static')).toHaveTextContent(
      /acting as · apex retail group/i,
    );
    expect(screen.queryByTestId('tenant-switcher-chip')).not.toBeInTheDocument();
  });

  it('renders the chip and opens a popover listing all 5 canonical tenants', () => {
    render(
      <TenantSwitcher
        canSwitch
        currentCanonicalKey="apex-retail"
        currentDisplayName="Apex Retail Group"
        options={CANONICAL_OPTIONS}
        onNavigate={navigateMock}
      />,
    );
    const chip = screen.getByTestId('tenant-switcher-chip');
    expect(chip).toBeInTheDocument();
    fireEvent.click(chip);
    expect(screen.getByTestId('tenant-switcher-popover')).toBeInTheDocument();
    for (const option of CANONICAL_OPTIONS) {
      expect(
        screen.getByTestId(`tenant-switcher-option-${option.canonicalKey}`),
      ).toBeInTheDocument();
    }
    // The active option is aria-selected=true.
    const active = screen.getByTestId('tenant-switcher-option-apex-retail');
    expect(active.getAttribute('aria-selected')).toBe('true');
  });

  it('POSTs the canonical key + captures PostHog + navigates on success', async () => {
    const fetchMock = mockFetchOk();
    render(
      <TenantSwitcher
        canSwitch
        currentCanonicalKey="apex-retail"
        currentDisplayName="Apex Retail Group"
        options={CANONICAL_OPTIONS}
        onNavigate={navigateMock}
      />,
    );
    fireEvent.click(screen.getByTestId('tenant-switcher-chip'));
    await act(async () => {
      fireEvent.click(screen.getByTestId('tenant-switcher-option-meridian-health'));
    });
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe('/api/admin/switch-tenant');
    expect(init).toMatchObject({ method: 'POST' });
    const body = JSON.parse(((init as RequestInit).body as string) ?? '{}');
    expect(body).toEqual({ tenantKey: 'meridian-health' });

    expect(captureMock).toHaveBeenCalledWith('admin.tenant_switched', {
      from: 'apex-retail',
      to: 'meridian-health',
    });
    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/admin');
    });
  });

  it('closes the popover without POSTing when re-selecting the current tenant', async () => {
    const fetchMock = mockFetchOk();
    render(
      <TenantSwitcher
        canSwitch
        currentCanonicalKey="apex-retail"
        currentDisplayName="Apex Retail Group"
        options={CANONICAL_OPTIONS}
        onNavigate={navigateMock}
      />,
    );
    fireEvent.click(screen.getByTestId('tenant-switcher-chip'));
    fireEvent.click(screen.getByTestId('tenant-switcher-option-apex-retail'));
    expect(fetchMock).not.toHaveBeenCalled();
    expect(
      screen.queryByTestId('tenant-switcher-popover'),
    ).not.toBeInTheDocument();
  });

  it('surfaces a transient error on a non-200 response', async () => {
    mockFetchError(403, { error: 'forbidden' });
    render(
      <TenantSwitcher
        canSwitch
        currentCanonicalKey="apex-retail"
        currentDisplayName="Apex Retail Group"
        options={CANONICAL_OPTIONS}
        onNavigate={navigateMock}
      />,
    );
    fireEvent.click(screen.getByTestId('tenant-switcher-chip'));
    await act(async () => {
      fireEvent.click(screen.getByTestId('tenant-switcher-option-meridian-health'));
    });
    await waitFor(() => {
      // Friendly message — never expose raw 'forbidden' to the user.
      expect(screen.getByTestId('tenant-switcher-error')).toHaveTextContent(
        /tenant-switch permission/i,
      );
    });
    // Should NOT have navigated.
    expect(navigateMock).not.toHaveBeenCalled();
    // Popover must remain open so the user sees the error.
    expect(screen.getByTestId('tenant-switcher-popover')).toBeInTheDocument();
  });

  it('honors the 5 canonical tenants — no free-form keys appear in the dropdown', () => {
    render(
      <TenantSwitcher
        canSwitch
        currentCanonicalKey="apex-retail"
        currentDisplayName="Apex Retail Group"
        options={CANONICAL_OPTIONS}
        onNavigate={navigateMock}
      />,
    );
    fireEvent.click(screen.getByTestId('tenant-switcher-chip'));
    const popover = screen.getByTestId('tenant-switcher-popover');
    const rows = popover.querySelectorAll('[data-testid^="tenant-switcher-option-"]');
    expect(rows.length).toBe(5);
    const keys = Array.from(rows).map(
      (el) => el.getAttribute('data-testid')?.replace('tenant-switcher-option-', ''),
    );
    expect(keys).toEqual([
      'apex-retail',
      'meridian-health',
      'first-capital',
      'northstar-clinical',
      'skyharbor-air',
    ]);
  });
});
