/**
 * TrustSpine broker contract tests · Wave 1 PR-4
 *
 * Verifies:
 *   • The composed shape matches the documented contract.
 *   • Substrate and governance dimensions carry `evidence: 'live'`.
 *   • Isolation and integration dimensions carry `evidence: 'estimated'`.
 *   • Mature / sparse / missing buckets follow the HealthState mapping.
 *   • Top sparse segment surfaces the lowest-family-number sparse row
 *     with `unlocks` copy from `setup-vocab`.
 *   • An upstream broker throwing degrades that dimension instead of
 *     crashing the whole call (Promise.allSettled guarantee).
 */

import { getTrustSpine } from '../trust-spine-broker';
import * as setupDataBroker from '@/lib/admin/setup-data-broker';
import * as programApproval from '@/lib/programs/approval';
import * as connectorHealthBroker from '@/lib/admin/broker/connector-health-broker';
import * as isolationBroker from '@/lib/admin/broker/isolation-posture-broker';
import type { SetupInventorySnapshot } from '@/lib/admin/setup-acts-registry';
import type { ConnectorHealth } from '@/lib/admin/broker/connector-health-broker';
import type { IsolationPosture } from '@/lib/admin/broker/isolation-posture-broker';

jest.mock('@/lib/admin/setup-data-broker', () => ({
  getSetupInventorySnapshot: jest.fn(),
}));

jest.mock('@/lib/programs/approval', () => ({
  getApprovalQueueForTenant: jest.fn(),
}));

jest.mock('@/lib/admin/broker/connector-health-broker', () => ({
  getConnectorHealth: jest.fn(),
}));

jest.mock('@/lib/admin/broker/isolation-posture-broker', () => ({
  getIsolationPosture: jest.fn(),
}));

const getSnapshotMock = setupDataBroker.getSetupInventorySnapshot as jest.MockedFunction<
  typeof setupDataBroker.getSetupInventorySnapshot
>;
const getApprovalsMock = programApproval.getApprovalQueueForTenant as jest.MockedFunction<
  typeof programApproval.getApprovalQueueForTenant
>;
const getConnectorHealthMock = connectorHealthBroker.getConnectorHealth as jest.MockedFunction<
  typeof connectorHealthBroker.getConnectorHealth
>;
const getIsolationPostureMock = isolationBroker.getIsolationPosture as jest.MockedFunction<
  typeof isolationBroker.getIsolationPosture
>;

function makeEmptyIsolation(): IsolationPosture {
  return {
    rlsCoveragePct: 100,
    tenantResolutionEvents24h: 0,
    anomaliesLast24h: 0,
    topAnomaly: null,
    recentEvents: [],
    evidence: 'estimated',
  };
}

// Default empty connector health for tests that don't care about it.
function makeEmptyHealth(): ConnectorHealth {
  return {
    connectorsTotal: 0,
    connectorsLive: 0,
    connectorsDegraded: 0,
    lastPullIso: null,
    topDegraded: null,
    perConnector: [],
  };
}

function makeSnapshot(): SetupInventorySnapshot {
  return {
    tenantKey: 'apex-retail',
    segments: [
      {
        segmentId: 'org_profile',
        segmentName: 'Org profile',
        familyNumber: 1,
        recordCount: 40,
        coverageScore: 90,
        staleCount: 0,
        missingCount: 0,
        healthState: 'complete',
        lastReviewedAt: '2026-05-01T00:00:00Z',
        lastIngestedAt: '2026-05-01T00:00:00Z',
      },
      {
        segmentId: 'decision_rights',
        segmentName: 'Decision rights',
        familyNumber: 2,
        recordCount: 20,
        coverageScore: 70,
        staleCount: 1,
        missingCount: 0,
        healthState: 'partial',
        lastReviewedAt: '2026-05-02T00:00:00Z',
        lastIngestedAt: '2026-05-02T00:00:00Z',
      },
      {
        segmentId: 'authoritative_systems',
        segmentName: 'Authoritative systems',
        familyNumber: 3,
        recordCount: 4,
        coverageScore: 30,
        staleCount: 1,
        missingCount: 5,
        healthState: 'sparse',
        lastReviewedAt: null,
        lastIngestedAt: '2026-05-03T00:00:00Z',
      },
      {
        segmentId: 'kpi_dictionary',
        segmentName: 'KPI dictionary',
        familyNumber: 5,
        recordCount: 0,
        coverageScore: 0,
        staleCount: 0,
        missingCount: 12,
        healthState: 'not_started',
        lastReviewedAt: null,
        lastIngestedAt: null,
      },
    ],
    totalRecords: 64,
    totalChunks: 100,
    totalNodes: 50,
    totalEdges: 75,
    recentActivity: [
      {
        actor: 'Import pipeline',
        what: 'Imported segment org_profile from apex-retail-v1.zip',
        timestampIso: '2026-05-01T12:00:00Z',
      },
    ],
    lastIngestedAt: '2026-05-03T00:00:00Z',
  };
}

describe('getTrustSpine', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    // Default to an empty connector health unless a test overrides.
    getConnectorHealthMock.mockResolvedValue(makeEmptyHealth());
    getIsolationPostureMock.mockResolvedValue(makeEmptyIsolation());
  });

  it('returns the contract shape with composed substrate + governance', async () => {
    getSnapshotMock.mockResolvedValue(makeSnapshot());
    getApprovalsMock.mockResolvedValue([
      // shape matters for the audit ribbon (PR-6); .length still
      // drives the governance count.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      { id: 'req-1', requestedAt: '2026-05-02T09:00:00Z', requestedByUserId: 'u1', programId: 'p1' } as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      { id: 'req-2', requestedAt: '2026-05-02T10:00:00Z', requestedByUserId: 'u2', programId: 'p2' } as any,
    ]);

    const spine = await getTrustSpine('apex-retail');

    expect(spine.tenantKey).toBe('apex-retail');
    expect(typeof spine.refreshedAtIso).toBe('string');

    // Substrate — 4 segments, 2 mature (complete + partial), 1 sparse,
    // 1 missing (not_started).
    expect(spine.substrate).toEqual({
      segmentsTotal: 4,
      mature: 2,
      sparse: 1,
      missing: 1,
      lastIngestIso: '2026-05-03T00:00:00Z',
      topSparseSegment: {
        id: 'authoritative_systems',
        label: 'Authoritative systems',
        unlocks: expect.any(String),
      },
      evidence: 'live',
    });
    expect(spine.substrate.topSparseSegment?.unlocks.length).toBeGreaterThan(10);

    // Governance — openApprovals from the queue length.
    expect(spine.governance).toEqual({
      ssoConfigured: false,
      openApprovals: 2,
      policyDriftCount: 0,
      openInvites: 0,
      evidence: 'live',
    });
  });

  it('marks isolation as estimated (RLS coverage % hardcoded — Wave 3 will flip to live)', async () => {
    getSnapshotMock.mockResolvedValue(makeSnapshot());
    getApprovalsMock.mockResolvedValue([]);

    const spine = await getTrustSpine('apex-retail');

    expect(spine.isolation.evidence).toBe('estimated');
    expect(spine.isolation.anomaliesLast24h).toBe(0);
  });

  it('passes through live isolation rollups from the isolation-posture broker', async () => {
    getSnapshotMock.mockResolvedValue(makeSnapshot());
    getApprovalsMock.mockResolvedValue([]);
    getIsolationPostureMock.mockResolvedValue({
      rlsCoveragePct: 100,
      tenantResolutionEvents24h: 12,
      anomaliesLast24h: 3,
      topAnomaly: {
        id: 'anom-1',
        description: 'kernel-only mode rejected external provider',
        severity: 'high',
        ts: '2026-05-30T11:00:00Z',
      },
      recentEvents: [
        {
          id: 'anom-1',
          ts: '2026-05-30T11:00:00Z',
          tenantKey: 'apex-retail',
          userId: 'user_clerk_1',
          intendedTenant: null,
          resolvedTenant: null,
          severity: 'high',
          anomaly: true,
          reason: 'kernel-only mode rejected external provider',
          workflow: 'intelligence.ask',
          provider: 'anthropic',
          policyDecision: 'deny',
          dataClass: 'confidential',
        },
      ],
      evidence: 'estimated',
    });

    const spine = await getTrustSpine('apex-retail');

    expect(spine.isolation.tenantResolutionEvents24h).toBe(12);
    expect(spine.isolation.anomaliesLast24h).toBe(3);
    expect(spine.isolation.topAnomaly?.id).toBe('anom-1');
    expect(spine.isolation.topAnomaly?.severity).toBe('high');
  });

  it('falls back to estimated zeros when the isolation broker throws', async () => {
    getSnapshotMock.mockResolvedValue(makeSnapshot());
    getApprovalsMock.mockResolvedValue([]);
    getIsolationPostureMock.mockRejectedValue(new Error('audit table missing'));

    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const spine = await getTrustSpine('apex-retail');
    expect(spine.isolation.evidence).toBe('estimated');
    expect(spine.isolation.anomaliesLast24h).toBe(0);
    expect(spine.isolation.topAnomaly).toBeNull();
    expect(warnSpy).toHaveBeenCalled();
    const logged = warnSpy.mock.calls[0]?.[0];
    expect(logged as string).toMatch(/trust_spine\.isolation_posture\.degraded/);
    warnSpy.mockRestore();
  });

  it('emits source=auth audit events from top isolation anomalies (capped at 5)', async () => {
    getSnapshotMock.mockResolvedValue({
      ...makeSnapshot(),
      recentActivity: [],
    });
    getApprovalsMock.mockResolvedValue([]);

    function anomalyRow(id: string, ts: string, severity: 'low' | 'med' | 'high') {
      return {
        id,
        ts,
        tenantKey: 'apex-retail',
        userId: id === 'sys' ? null : `user_${id}`,
        intendedTenant: null,
        resolvedTenant: null,
        severity,
        anomaly: true,
        reason: `${severity} reason ${id}`,
        workflow: 'intelligence.ask',
        provider: 'anthropic',
        policyDecision: severity === 'high' ? 'error' : 'deny',
        dataClass: 'internal',
      } as const;
    }

    getIsolationPostureMock.mockResolvedValue({
      rlsCoveragePct: 100,
      tenantResolutionEvents24h: 7,
      anomaliesLast24h: 7,
      topAnomaly: null,
      evidence: 'estimated',
      recentEvents: [
        anomalyRow('a', '2026-05-30T10:00:00Z', 'high'),
        anomalyRow('b', '2026-05-30T09:00:00Z', 'high'),
        anomalyRow('c', '2026-05-30T08:00:00Z', 'med'),
        anomalyRow('d', '2026-05-30T07:00:00Z', 'med'),
        anomalyRow('e', '2026-05-30T06:00:00Z', 'low'),
        anomalyRow('f', '2026-05-30T05:00:00Z', 'low'),
        anomalyRow('sys', '2026-05-30T04:00:00Z', 'low'),
      ],
    });

    const spine = await getTrustSpine('apex-retail');
    const authEvents = spine.audit.last24hEvents.filter((e) => e.source === 'auth');
    // Capped at 5; severity desc then ts desc → a, b, c, d, e.
    expect(authEvents).toHaveLength(5);
    expect(authEvents.map((e) => e.target)).toEqual(['a', 'b', 'c', 'd', 'e']);
    expect(authEvents[0]).toEqual({
      ts: '2026-05-30T10:00:00Z',
      source: 'auth',
      actor: 'user_a',
      action: 'tenant-resolution anomaly: high reason a',
      target: 'a',
    });
  });

  it('marks integration as live when the connector health broker succeeds', async () => {
    getSnapshotMock.mockResolvedValue(makeSnapshot());
    getApprovalsMock.mockResolvedValue([]);
    getConnectorHealthMock.mockResolvedValue({
      connectorsTotal: 5,
      connectorsLive: 3,
      connectorsDegraded: 1,
      lastPullIso: '2026-05-29T12:00:00Z',
      topDegraded: { id: 'c1', name: 'C1', reason: 'auth expired' },
      perConnector: [],
    });

    const spine = await getTrustSpine('apex-retail');

    expect(spine.integration).toEqual({
      connectorsTotal: 5,
      connectorsLive: 3,
      connectorsDegraded: 1,
      lastPullIso: '2026-05-29T12:00:00Z',
      topDegraded: { id: 'c1', name: 'C1', reason: 'auth expired' },
      evidence: 'live',
    });
  });

  it('falls back to estimated zeros when the connector health broker throws', async () => {
    getSnapshotMock.mockResolvedValue(makeSnapshot());
    getApprovalsMock.mockResolvedValue([]);
    getConnectorHealthMock.mockRejectedValue(
      new Error('admin_connectors migration pending'),
    );

    // Silence the structured warn — we assert that it fires but don't
    // need it in the test output.
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    const spine = await getTrustSpine('apex-retail');

    expect(spine.integration).toEqual({
      connectorsTotal: 0,
      connectorsLive: 0,
      connectorsDegraded: 0,
      lastPullIso: null,
      topDegraded: null,
      evidence: 'estimated',
    });
    expect(warnSpy).toHaveBeenCalled();
    const logged = warnSpy.mock.calls[0]?.[0];
    expect(typeof logged).toBe('string');
    expect(logged as string).toMatch(
      /trust_spine\.connector_health\.degraded/,
    );

    warnSpy.mockRestore();
  });

  it('surfaces substrate audit events on the audit ribbon', async () => {
    getSnapshotMock.mockResolvedValue(makeSnapshot());
    getApprovalsMock.mockResolvedValue([]);

    const spine = await getTrustSpine('apex-retail');

    expect(spine.audit.last24hEvents).toHaveLength(1);
    expect(spine.audit.last24hEvents[0]).toEqual({
      ts: '2026-05-01T12:00:00Z',
      source: 'substrate',
      actor: 'Import pipeline',
      action: 'Imported segment org_profile from apex-retail-v1.zip',
    });
  });

  it('unions substrate + approval events on the audit ribbon, sorted by ts desc', async () => {
    getSnapshotMock.mockResolvedValue(makeSnapshot());
    getApprovalsMock.mockResolvedValue([
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      { id: 'a1', requestedAt: '2026-05-02T09:00:00Z', requestedByUserId: 'u1', programId: 'p1' } as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      { id: 'a2', requestedAt: '2026-05-04T07:30:00Z', requestedByUserId: 'u2', programId: 'p2' } as any,
    ]);

    const spine = await getTrustSpine('apex-retail');

    expect(spine.audit.last24hEvents).toHaveLength(3);
    // Sorted by ts desc: 2026-05-04 > 2026-05-02 (approval) > 2026-05-01 (substrate).
    expect(spine.audit.last24hEvents.map((e) => e.source)).toEqual([
      'approval',
      'approval',
      'substrate',
    ]);
    expect(spine.audit.last24hEvents[0]).toEqual({
      ts: '2026-05-04T07:30:00Z',
      source: 'approval',
      actor: 'Program owner',
      action: 'Opened program approval request',
      target: 'p2',
    });
  });

  it('caps the audit ribbon at 50 events', async () => {
    const big = makeSnapshot();
    // 60 substrate events; broker should keep only top 50 by ts desc.
    big.recentActivity = Array.from({ length: 60 }, (_, i) => ({
      actor: 'Import pipeline',
      what: `event ${i}`,
      // i=0 oldest, i=59 newest
      timestampIso: new Date(2026, 0, 1, 0, i).toISOString(),
    }));
    getSnapshotMock.mockResolvedValue(big);
    getApprovalsMock.mockResolvedValue([]);

    const spine = await getTrustSpine('apex-retail');
    expect(spine.audit.last24hEvents).toHaveLength(50);
    // Newest first (i=59).
    expect(spine.audit.last24hEvents[0]?.action).toBe('event 59');
  });

  it('returns invite events as empty arrays (Wave 2 invite ledger pending)', async () => {
    getSnapshotMock.mockResolvedValue({
      ...makeSnapshot(),
      recentActivity: [],
    });
    getApprovalsMock.mockResolvedValue([]);

    const spine = await getTrustSpine('apex-retail');

    expect(spine.audit.last24hEvents).toEqual([]);
    expect(
      spine.audit.last24hEvents.find((e) => e.source === 'invite'),
    ).toBeUndefined();
  });

  it('emits connector audit events from the connector health broker', async () => {
    // Snapshot empty so only connector events land on the ribbon.
    getSnapshotMock.mockResolvedValue({
      ...makeSnapshot(),
      recentActivity: [],
    });
    getApprovalsMock.mockResolvedValue([]);
    // Pin "now" to a known timestamp so the 24h-recent-pull window
    // assertion is stable.
    const now = new Date('2026-05-30T12:00:00Z');
    jest.useFakeTimers().setSystemTime(now);

    getConnectorHealthMock.mockResolvedValue({
      connectorsTotal: 3,
      connectorsLive: 1,
      connectorsDegraded: 1,
      lastPullIso: '2026-05-30T10:00:00Z',
      topDegraded: {
        id: 'fail-1',
        name: 'Failing connector',
        reason: 'auth expired',
      },
      perConnector: [
        {
          id: 'live-1',
          name: 'Healthy connector',
          status: 'live',
          // 2h ago — inside the 24h success window.
          lastPullIso: '2026-05-30T10:00:00Z',
          failureReason: null,
        },
        {
          id: 'fail-1',
          name: 'Failing connector',
          status: 'degraded',
          lastPullIso: '2026-05-30T09:00:00Z',
          failureReason: 'auth expired',
        },
        {
          id: 'stale-live-1',
          name: 'Stale healthy connector',
          status: 'live',
          // 3 days ago — outside the 24h success window; no event.
          lastPullIso: '2026-05-27T12:00:00Z',
          failureReason: null,
        },
      ],
    });

    const spine = await getTrustSpine('apex-retail');

    const connectorEvents = spine.audit.last24hEvents.filter(
      (e) => e.source === 'connector',
    );
    // 1 sync-succeeded (live-1, recent) + 1 sync-failed (fail-1).
    // stale-live-1 is outside the 24h window so no event.
    expect(connectorEvents).toHaveLength(2);

    const failed = connectorEvents.find((e) =>
      e.action.startsWith('sync failed'),
    );
    expect(failed).toEqual({
      ts: '2026-05-30T09:00:00Z',
      source: 'connector',
      actor: 'Failing connector',
      action: 'sync failed — auth expired',
      target: 'fail-1',
    });

    const succeeded = connectorEvents.find(
      (e) => e.action === 'sync succeeded',
    );
    expect(succeeded).toEqual({
      ts: '2026-05-30T10:00:00Z',
      source: 'connector',
      actor: 'Healthy connector',
      action: 'sync succeeded',
      target: 'live-1',
    });

    jest.useRealTimers();
  });

  it('does NOT emit a sync-succeeded event for a degraded connector', async () => {
    getSnapshotMock.mockResolvedValue({
      ...makeSnapshot(),
      recentActivity: [],
    });
    getApprovalsMock.mockResolvedValue([]);
    const now = new Date('2026-05-30T12:00:00Z');
    jest.useFakeTimers().setSystemTime(now);

    getConnectorHealthMock.mockResolvedValue({
      connectorsTotal: 1,
      connectorsLive: 0,
      connectorsDegraded: 1,
      lastPullIso: '2026-05-30T10:00:00Z',
      topDegraded: {
        id: 'fail-1',
        name: 'Failing connector',
        reason: 'auth expired',
      },
      perConnector: [
        {
          id: 'fail-1',
          name: 'Failing connector',
          status: 'degraded',
          lastPullIso: '2026-05-30T10:00:00Z',
          failureReason: 'auth expired',
        },
      ],
    });

    const spine = await getTrustSpine('apex-retail');
    const connectorEvents = spine.audit.last24hEvents.filter(
      (e) => e.source === 'connector',
    );
    // Only one event — the failure. No sync-succeeded for a degraded row.
    expect(connectorEvents).toHaveLength(1);
    expect(connectorEvents[0].action).toMatch(/^sync failed/);

    jest.useRealTimers();
  });

  it('degrades gracefully when the substrate broker throws', async () => {
    getSnapshotMock.mockRejectedValue(new Error('substrate unreachable'));
    getApprovalsMock.mockResolvedValue([]);

    const spine = await getTrustSpine('apex-retail');

    // Substrate dimension still returns a coherent shape — zeroes,
    // not a crash.
    expect(spine.substrate.segmentsTotal).toBe(0);
    expect(spine.substrate.mature).toBe(0);
    expect(spine.substrate.topSparseSegment).toBeNull();
    expect(spine.substrate.evidence).toBe('live');
    // Audit ribbon empty when no snapshot.
    expect(spine.audit.last24hEvents).toEqual([]);
    // Governance unaffected.
    expect(spine.governance.openApprovals).toBe(0);
  });

  it('degrades gracefully when the approval broker throws', async () => {
    getSnapshotMock.mockResolvedValue(makeSnapshot());
    getApprovalsMock.mockRejectedValue(new Error('approval queue down'));

    const spine = await getTrustSpine('apex-retail');

    expect(spine.governance.openApprovals).toBe(0);
    // Substrate side still composes from the snapshot.
    expect(spine.substrate.segmentsTotal).toBe(4);
  });

  it('returns an empty-substrate shape when the snapshot is null', async () => {
    getSnapshotMock.mockResolvedValue(null);
    getApprovalsMock.mockResolvedValue([]);

    const spine = await getTrustSpine('apex-retail');

    expect(spine.substrate).toEqual({
      segmentsTotal: 0,
      mature: 0,
      sparse: 0,
      missing: 0,
      lastIngestIso: null,
      topSparseSegment: null,
      evidence: 'live',
    });
    expect(spine.audit.last24hEvents).toEqual([]);
  });
});
