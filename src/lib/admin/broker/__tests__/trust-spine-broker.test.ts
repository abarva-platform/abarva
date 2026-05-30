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
import type { SetupInventorySnapshot } from '@/lib/admin/setup-acts-registry';

jest.mock('@/lib/admin/setup-data-broker', () => ({
  getSetupInventorySnapshot: jest.fn(),
}));

jest.mock('@/lib/programs/approval', () => ({
  getApprovalQueueForTenant: jest.fn(),
}));

const getSnapshotMock = setupDataBroker.getSetupInventorySnapshot as jest.MockedFunction<
  typeof setupDataBroker.getSetupInventorySnapshot
>;
const getApprovalsMock = programApproval.getApprovalQueueForTenant as jest.MockedFunction<
  typeof programApproval.getApprovalQueueForTenant
>;

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
  });

  it('returns the contract shape with composed substrate + governance', async () => {
    getSnapshotMock.mockResolvedValue(makeSnapshot());
    getApprovalsMock.mockResolvedValue([
      // shape doesn't matter — only .length is read
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      { id: 'req-1' } as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      { id: 'req-2' } as any,
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

  it('marks isolation and integration as estimated', async () => {
    getSnapshotMock.mockResolvedValue(makeSnapshot());
    getApprovalsMock.mockResolvedValue([]);

    const spine = await getTrustSpine('apex-retail');

    expect(spine.isolation.evidence).toBe('estimated');
    expect(spine.integration.evidence).toBe('estimated');
    expect(spine.isolation.anomaliesLast24h).toBe(0);
    expect(spine.integration.connectorsTotal).toBe(0);
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
