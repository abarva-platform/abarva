// Unit tests for the L2 Azure connectivity smoke route. Mocks the
// per-resource probes so the test never touches a real Azure
// dependency. Covers:
//   - all probes pass → 200 with the expected body shape
//   - one probe fails → 503 and every other probe still reports
//   - the 3s timeout fires (using a slow probe)
//   - non-admin caller gets 403
//
// We avoid the SDK auto-mock dance by hand-rolling probe fns that
// match the `ProbeFns` interface and passing them through
// `runAzureConnectivityProbes` directly. Route-level Clerk gating is
// asserted against the shared helper.

const mockAuth = jest.fn();
const mockGetUser = jest.fn();

jest.mock('@clerk/nextjs/server', () => ({
  auth: () => mockAuth(),
  clerkClient: async () => ({
    users: { getUser: (id: string) => mockGetUser(id) },
  }),
}));

import {
  runAzureConnectivityProbes,
  withTimeout,
  type ProbeFns,
  type ProbeResult,
} from '@/lib/health/azure-connectivity';
import { handleAzureConnectivity } from '@/lib/health/azure-connectivity-route-helpers';

function pass(latencyMs = 5): () => Promise<ProbeResult> {
  return async () => ({ status: 'pass', latencyMs });
}

function fail(error = 'boom'): () => Promise<ProbeResult> {
  return async () => ({ status: 'fail', latencyMs: 3, error });
}

function skipped(reason = 'not_configured'): () => Promise<ProbeResult> {
  return async () => ({ status: 'skipped', latencyMs: 0, reason });
}

function allPassing(): ProbeFns {
  return {
    postgres: pass(),
    blob: pass(),
    serviceBus: pass(),
    keyVault: pass(),
    search: pass(),
    neo4j: skipped('GRAPH_NEO4J_ENABLED_not_true'),
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockAuth.mockResolvedValue({ userId: 'user_admin' });
  mockGetUser.mockResolvedValue({ publicMetadata: { role: 'admin' } });
});

describe('runAzureConnectivityProbes', () => {
  it('returns ok=true and a probe result per name when every probe passes', async () => {
    const report = await runAzureConnectivityProbes({ probes: allPassing() });
    expect(report.ok).toBe(true);
    expect(report.lane).toBe('all');
    expect(Object.keys(report.probes).sort()).toEqual([
      'blob', 'keyVault', 'neo4j', 'postgres', 'search', 'serviceBus',
    ]);
    for (const r of Object.values(report.probes)) {
      expect(['pass', 'skipped']).toContain(r?.status);
      expect(typeof r?.latencyMs).toBe('number');
    }
  });

  it('returns ok=false when any one probe fails and still reports the rest', async () => {
    const probes: ProbeFns = { ...allPassing(), serviceBus: fail('service_bus_unreachable') };
    const report = await runAzureConnectivityProbes({ probes });
    expect(report.ok).toBe(false);
    expect(report.probes.serviceBus).toEqual(
      expect.objectContaining({ status: 'fail', error: 'service_bus_unreachable' }),
    );
    expect(report.probes.postgres?.status).toBe('pass');
    expect(report.probes.blob?.status).toBe('pass');
  });

  it('scopes probes to the lane when lane=private-data', async () => {
    const report = await runAzureConnectivityProbes({ lane: 'private-data', probes: allPassing() });
    expect(Object.keys(report.probes).sort()).toEqual(
      ['blob', 'neo4j', 'postgres', 'serviceBus'],
    );
    expect(report.lane).toBe('private-data');
  });

  it('scopes probes to the lane when lane=control', async () => {
    const report = await runAzureConnectivityProbes({ lane: 'control', probes: allPassing() });
    expect(Object.keys(report.probes)).toEqual(['keyVault']);
  });

  it('scopes probes to the lane when lane=intelligence-model', async () => {
    const report = await runAzureConnectivityProbes({ lane: 'intelligence-model', probes: allPassing() });
    expect(Object.keys(report.probes)).toEqual(['search']);
  });
});

describe('withTimeout', () => {
  it('reports fail with probe_timeout_* when the probe outruns the timeout', async () => {
    const slow = () => new Promise<ProbeResult>(() => { /* never resolves */ });
    const result = await withTimeout(slow, 50);
    expect(result.status).toBe('fail');
    expect(result.error).toMatch(/^probe_timeout_/);
    expect(result.latencyMs).toBeGreaterThanOrEqual(50);
  });

  it('returns the probe result when it resolves under the deadline', async () => {
    const fast = async (): Promise<ProbeResult> => ({ status: 'pass', latencyMs: 1 });
    const result = await withTimeout(fast, 1_000);
    expect(result.status).toBe('pass');
  });
});

describe('handleAzureConnectivity (admin gate)', () => {
  it('returns 200 + report for an admin caller when every probe passes', async () => {
    const res = await handleAzureConnectivity({ probes: allPassing() });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.probes.postgres.status).toBe('pass');
  });

  it('returns 503 + report when any probe fails', async () => {
    const probes: ProbeFns = { ...allPassing(), postgres: fail('pg_unreachable') };
    const res = await handleAzureConnectivity({ probes });
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.probes.postgres.error).toBe('pg_unreachable');
    expect(body.probes.blob.status).toBe('pass');
  });

  it('returns 401 when the caller is unauthenticated', async () => {
    mockAuth.mockResolvedValueOnce({ userId: null });
    const res = await handleAzureConnectivity({ probes: allPassing() });
    expect(res.status).toBe(401);
  });

  it('returns 403 when the caller is authenticated but not admin/maestro', async () => {
    mockGetUser.mockResolvedValueOnce({ publicMetadata: { role: 'cxo' } });
    const res = await handleAzureConnectivity({ probes: allPassing() });
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe('forbidden_admin_only');
  });

  it('honors the per-lane variant by scoping probes', async () => {
    const probes: ProbeFns = { ...allPassing(), search: fail('search_unreachable') };
    // control lane should NOT report a search fail because search is
    // not on the control lane.
    const res = await handleAzureConnectivity({ lane: 'control', probes });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.lane).toBe('control');
    expect(body.probes.search).toBeUndefined();
  });
});
