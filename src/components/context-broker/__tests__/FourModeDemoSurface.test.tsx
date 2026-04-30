/**
 * @jest-environment jsdom
 */
/**
 * FourModeDemoSurface · render + interaction tests
 *
 * Mocks `fetch` to return a canned ModeBundles response and
 * verifies:
 *   - form initial state matches the first sample query
 *   - clicking Run posts to /api/context/demo with mode='all'
 *   - panel grid renders four columns post-fetch
 *   - sample-query buttons populate the form
 *   - error path renders the error banner
 */

import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import type { ContextBundle } from '@/lib/knowledge/context-broker';

import { FourModeDemoSurface } from '../FourModeDemoSurface';

function bundle(mode: ContextBundle['mode'], tenantKey: string | null): ContextBundle {
  return {
    query: 'test query',
    mode,
    tenantKey,
    facts: [],
    graphPaths: [],
    semanticChunks: [],
    corpusPatterns: [],
    worldviewChunks: [],
    provenance: [],
    warnings: [],
    infoTags: [],
    assembledAt: '2026-04-30T14:32:09Z',
  };
}

const ORIGINAL_FETCH = global.fetch;

function fakeResponse(status: number, body: object) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  };
}

function mockFetchOk(body: object): jest.Mock {
  const mock = jest.fn(() => Promise.resolve(fakeResponse(200, body)));
  global.fetch = mock as unknown as typeof fetch;
  return mock;
}

function mockFetchError(status: number, body: object): jest.Mock {
  const mock = jest.fn(() => Promise.resolve(fakeResponse(status, body)));
  global.fetch = mock as unknown as typeof fetch;
  return mock;
}

afterEach(() => {
  global.fetch = ORIGINAL_FETCH;
});

describe('FourModeDemoSurface — initial render', () => {
  it('renders the form with the first sample query pre-populated', () => {
    render(<FourModeDemoSurface />);
    const query = screen.getByTestId('four-mode-demo-query') as HTMLTextAreaElement;
    expect(query.value).toMatch(/Apex CDP/i);
    const tenant = screen.getByTestId('four-mode-demo-tenant') as HTMLSelectElement;
    expect(tenant.value).toBe('apex-retail');
  });

  it('renders the empty grid placeholder before any run', () => {
    render(<FourModeDemoSurface />);
    expect(screen.getByTestId('four-mode-demo-grid-empty')).toBeInTheDocument();
  });

  it('renders 3 sample-query chips', () => {
    render(<FourModeDemoSurface />);
    expect(screen.getByTestId('four-mode-demo-sample-0')).toBeInTheDocument();
    expect(screen.getByTestId('four-mode-demo-sample-1')).toBeInTheDocument();
    expect(screen.getByTestId('four-mode-demo-sample-2')).toBeInTheDocument();
  });
});

describe('FourModeDemoSurface — run + render bundles', () => {
  it('posts to /api/context/demo with mode=all and tenant', async () => {
    const fetchMock = mockFetchOk({
      bundles: {
        generic: bundle('generic', null),
        corpus: bundle('corpus', null),
        tenant: bundle('tenant', 'apex-retail'),
        full: bundle('full', 'apex-retail'),
      },
    });
    render(<FourModeDemoSurface />);
    fireEvent.click(screen.getByTestId('four-mode-demo-run'));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe('/api/context/demo');
    expect(init).toBeDefined();
    expect((init as RequestInit).method).toBe('POST');
    const body = JSON.parse(((init as RequestInit).body as string) ?? '{}');
    expect(body.mode).toBe('all');
    expect(body.tenantKey).toBe('apex-retail');
    expect(typeof body.query).toBe('string');
    expect(body.query.length).toBeGreaterThan(0);
  });

  it('renders the four-mode grid after a successful run', async () => {
    mockFetchOk({
      bundles: {
        generic: bundle('generic', null),
        corpus: bundle('corpus', null),
        tenant: bundle('tenant', 'apex-retail'),
        full: bundle('full', 'apex-retail'),
      },
    });
    render(<FourModeDemoSurface />);
    fireEvent.click(screen.getByTestId('four-mode-demo-run'));
    await waitFor(() => screen.getByTestId('four-mode-demo-grid'));
    expect(screen.getByTestId('four-mode-demo-generic')).toBeInTheDocument();
    expect(screen.getByTestId('four-mode-demo-corpus')).toBeInTheDocument();
    expect(screen.getByTestId('four-mode-demo-tenant-col')).toBeInTheDocument();
    expect(screen.getByTestId('four-mode-demo-full-col')).toBeInTheDocument();
  });

  it('renders empty-hints in tenant + full columns when tenant is null', async () => {
    mockFetchOk({
      bundles: {
        generic: bundle('generic', null),
        corpus: bundle('corpus', null),
        tenant: null,
        full: null,
      },
    });
    render(<FourModeDemoSurface />);
    // Pick the cold sample
    fireEvent.click(screen.getByTestId('four-mode-demo-sample-2'));
    fireEvent.click(screen.getByTestId('four-mode-demo-run'));
    await waitFor(() => screen.getByTestId('four-mode-demo-grid'));
    expect(screen.getByTestId('four-mode-demo-tenant-col-empty')).toBeInTheDocument();
    expect(screen.getByTestId('four-mode-demo-full-col-empty')).toBeInTheDocument();
  });
});

describe('FourModeDemoSurface — error path', () => {
  it('renders the error banner when fetch returns non-OK', async () => {
    mockFetchError(400, { error: '`query` is required.' });
    render(<FourModeDemoSurface />);
    fireEvent.click(screen.getByTestId('four-mode-demo-run'));
    await waitFor(() => screen.getByTestId('four-mode-demo-error'));
    expect(screen.getByTestId('four-mode-demo-error').textContent).toMatch(
      /query/i,
    );
  });
});

describe('FourModeDemoSurface — sample query population', () => {
  it('clicking a sample query repopulates the form', () => {
    render(<FourModeDemoSurface />);
    fireEvent.click(screen.getByTestId('four-mode-demo-sample-1'));
    const query = screen.getByTestId('four-mode-demo-query') as HTMLTextAreaElement;
    expect(query.value).toMatch(/Meridian/i);
    const tenant = screen.getByTestId('four-mode-demo-tenant') as HTMLSelectElement;
    expect(tenant.value).toBe('meridian-health');
  });
});
