/**
 * @jest-environment jsdom
 */
/**
 * ConnectorTestConnectionButton · PRE-W4-PR-3 tests
 *
 * Covers the live-probe wiring:
 *   • Click fires PostHog `connector_test_connection_clicked`.
 *   • A 200 healthy response renders the green-dot banner.
 *   • A 200 failed response renders the red-dot banner with reason.
 *   • A 429 rate-limited response renders the amber-dot banner.
 *   • A non-2xx HTTP error renders the error banner.
 */

import '@testing-library/jest-dom';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';

import { ConnectorTestConnectionButton } from '../ConnectorTestConnectionButton';

const captureMock = jest.fn();

jest.mock('posthog-js', () => ({
  __esModule: true,
  default: {
    capture: (...args: unknown[]) => captureMock(...args),
  },
}));

function mockFetch(response: {
  status: number;
  body?: unknown;
  headers?: Record<string, string>;
}): void {
  const status = response.status;
  const headersMap = new Map<string, string>(
    Object.entries(response.headers ?? {}).map(([k, v]) => [k.toLowerCase(), v]),
  );
  const fakeResponse = {
    ok: status >= 200 && status < 300,
    status,
    headers: {
      get: (k: string) => headersMap.get(k.toLowerCase()) ?? null,
    },
    json: async () => response.body ?? {},
  };
  // @ts-expect-error · install on globalThis for jsdom.
  globalThis.fetch = jest.fn(async () => fakeResponse);
}

beforeEach(() => {
  captureMock.mockReset();
});

afterEach(() => {
  // @ts-expect-error · cleanup mock.
  delete globalThis.fetch;
});

describe('ConnectorTestConnectionButton', () => {
  it('renders the button with the connector id on the wrapper', () => {
    mockFetch({ status: 200, body: { ok: true, latencyMs: 12 } });
    render(<ConnectorTestConnectionButton connectorId="sn" />);
    expect(screen.getByTestId('connector-test-connection-button')).toHaveTextContent(
      /test connection/i,
    );
  });

  it('fires the click telemetry, probes, and renders the healthy banner', async () => {
    mockFetch({
      status: 200,
      body: {
        ok: true,
        latencyMs: 42,
        probedAtIso: new Date().toISOString(),
        transition: { kind: 'none' },
      },
    });
    render(<ConnectorTestConnectionButton connectorId="sn" />);
    await act(async () => {
      fireEvent.click(screen.getByTestId('connector-test-connection-button'));
    });
    expect(captureMock).toHaveBeenCalledWith(
      'connector_test_connection_clicked',
      { connector_id: 'sn' },
    );
    await waitFor(() => {
      const banner = screen.getByTestId('connector-test-connection-banner');
      expect(banner).toHaveAttribute('data-state', 'healthy');
      expect(banner).toHaveTextContent(/Connection healthy · 42ms/);
    });
  });

  it('renders the failed banner with the reason', async () => {
    mockFetch({
      status: 200,
      body: {
        ok: false,
        latencyMs: 87,
        reason: 'auth-error · HTTP 401 · reconnect connector',
        probedAtIso: new Date().toISOString(),
        transition: { kind: 'none' },
      },
    });
    render(<ConnectorTestConnectionButton connectorId="sf" />);
    await act(async () => {
      fireEvent.click(screen.getByTestId('connector-test-connection-button'));
    });
    await waitFor(() => {
      const banner = screen.getByTestId('connector-test-connection-banner');
      expect(banner).toHaveAttribute('data-state', 'failed');
      expect(banner).toHaveTextContent(/Connection failed/);
      expect(banner).toHaveTextContent(/auth-error/);
      // Auth-error reason ⇒ Reconnect hint.
      expect(banner).toHaveTextContent(/Reconnect connector/);
    });
  });

  it('renders the rate-limited banner on HTTP 429', async () => {
    mockFetch({
      status: 429,
      body: { error: 'rate_limited' },
      headers: { 'Retry-After': '45' },
    });
    render(<ConnectorTestConnectionButton connectorId="sf" />);
    await act(async () => {
      fireEvent.click(screen.getByTestId('connector-test-connection-button'));
    });
    await waitFor(() => {
      const banner = screen.getByTestId('connector-test-connection-banner');
      expect(banner).toHaveAttribute('data-state', 'rate-limited');
      expect(banner).toHaveTextContent(/Rate-limited · try again in 45s/);
    });
  });

  it('renders the error banner on non-2xx without JSON', async () => {
    mockFetch({ status: 500, body: { error: 'internal_error' } });
    render(<ConnectorTestConnectionButton connectorId="sf" />);
    await act(async () => {
      fireEvent.click(screen.getByTestId('connector-test-connection-button'));
    });
    await waitFor(() => {
      const banner = screen.getByTestId('connector-test-connection-banner');
      expect(banner).toHaveAttribute('data-state', 'error');
      expect(banner).toHaveTextContent(/HTTP 500/);
    });
  });
});
