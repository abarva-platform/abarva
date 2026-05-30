/**
 * Capability Grounding broker contract tests · Wave 3 PR-1.
 *
 * Verifies the broker contract surfaced by
 * `capability-grounding-broker.ts`.  The broker is deliberately
 * honest about the absence of evaluator data — every test below
 * confirms that absence is reflected in either the level (no fake
 * L3) or the `evidence` flag (`'estimated'` when substrate is the
 * only signal).
 */

import {
  getCapabilityGrounding,
  panelFootFromGrounding,
  panelStatusFromGrounding,
  type CapabilityGrounding,
} from '../capability-grounding-broker';
import * as broker from '@/lib/admin/setup-data-broker';
import type {
  InventorySegmentRollup,
  SetupInventorySnapshot,
} from '@/lib/admin/setup-acts-registry';

jest.mock('@/lib/admin/setup-data-broker', () => ({
  getSetupInventorySnapshot: jest.fn(),
}));

const getSetupInventorySnapshotMock =
  broker.getSetupInventorySnapshot as jest.MockedFunction<
    typeof broker.getSetupInventorySnapshot
  >;

function seg(
  familyNumber: number,
  healthState: string,
  overrides: Partial<InventorySegmentRollup> = {},
): InventorySegmentRollup {
  return {
    segmentId: `seg_${familyNumber}`,
    segmentName: `Segment ${familyNumber}`,
    familyNumber,
    recordCount: 0,
    coverageScore: 0,
    staleCount: 0,
    missingCount: 0,
    healthState,
    lastReviewedAt: null,
    lastIngestedAt: null,
    ...overrides,
  };
}

function snapshot(segments: InventorySegmentRollup[]): SetupInventorySnapshot {
  return {
    tenantKey: 'apex-retail',
    segments,
    totalRecords: 0,
    totalChunks: 0,
    totalNodes: 0,
    totalEdges: 0,
    recentActivity: [],
    lastIngestedAt: null,
  };
}

describe('getCapabilityGrounding', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('emits 4 agents in the canonical catalog order', async () => {
    getSetupInventorySnapshotMock.mockResolvedValue(null);
    const result = await getCapabilityGrounding('apex-retail');
    expect(result.perAgent.map((a) => a.agent)).toEqual([
      'nexus',
      'sentinel',
      'steward',
      'atlas',
    ]);
  });

  it('returns L0 for every family of a cold-start tenant (no segments loaded)', async () => {
    getSetupInventorySnapshotMock.mockResolvedValue(snapshot([]));
    const result = await getCapabilityGrounding('cold-tenant');
    // Cold-start tenant has no segments in any family — every
    // (agent, family) row must be L0.  No L1 sympathy levels.
    for (const agentRollup of result.perAgent) {
      for (const family of agentRollup.families) {
        expect(family.level).toBe('L0');
      }
      expect(agentRollup.highestLevel).toBe('L0');
      expect(agentRollup.averageLevel).toBe('L0');
    }
  });

  it('promotes a family to L3 when its only required segment is mature', async () => {
    // Atlas depends on families [3, 4, 5].  Mark all three mature.
    getSetupInventorySnapshotMock.mockResolvedValue(
      snapshot([
        seg(3, 'mature'),
        seg(4, 'complete'),
        seg(5, 'mature'),
      ]),
    );
    const result = await getCapabilityGrounding('apex-retail');
    const atlas = result.perAgent.find((a) => a.agent === 'atlas')!;
    for (const family of atlas.families) {
      // Each family has 1 covered / 1 required = ratio 1.0 ≥ 0.75
      // → L3 (no eval score gating because lastEvalScore is null).
      expect(family.level).toBe('L3');
    }
    expect(atlas.highestLevel).toBe('L3');
    expect(atlas.averageLevel).toBe('L3');
  });

  it('drops a family to L0 when its substrate is thin / not_started', async () => {
    // Atlas family 3 is `thin` — not covered → L0.  Family 4 and 5
    // missing entirely → L0 too.
    getSetupInventorySnapshotMock.mockResolvedValue(
      snapshot([seg(3, 'thin')]),
    );
    const result = await getCapabilityGrounding('apex-retail');
    const atlas = result.perAgent.find((a) => a.agent === 'atlas')!;
    for (const family of atlas.families) {
      expect(family.level).toBe('L0');
    }
  });

  it('counts `partial` substrate as covered (soft coverage)', async () => {
    // Sentinel depends on [7, 11, 13].  Two partial, one missing →
    // 2 covered / 3 required ≈ 0.667 ratio → L2 per rubric.
    getSetupInventorySnapshotMock.mockResolvedValue(
      snapshot([seg(7, 'partial'), seg(11, 'partial')]),
    );
    const result = await getCapabilityGrounding('apex-retail');
    const sentinel = result.perAgent.find((a) => a.agent === 'sentinel')!;
    // Each individual family is binary (covered/uncovered) at the
    // per-family rubric tier; the per-family `level` for each
    // covered row is L3 (ratio 1) and each uncovered row is L0
    // (ratio 0).  The rollup's *average* across [L3, L3, L0] is
    // (3+3+0)/3 = 2.0 → L2 after flooring.
    expect(sentinel.averageLevel).toBe('L2');
    expect(sentinel.highestLevel).toBe('L3');
  });

  it("flags the rollup as 'estimated' whenever no evaluator scores exist", async () => {
    // Today there is no evaluator table; the broker always returns
    // null lastEvalScore for every family; therefore the rollup is
    // always 'estimated' — even when substrate is mature.
    getSetupInventorySnapshotMock.mockResolvedValue(
      snapshot([
        seg(1, 'mature'),
        seg(3, 'mature'),
        seg(7, 'mature'),
        seg(9, 'mature'),
      ]),
    );
    const result = await getCapabilityGrounding('apex-retail');
    expect(result.evidence).toBe('estimated');
    for (const agentRollup of result.perAgent) {
      for (const family of agentRollup.families) {
        expect(family.lastEvalScore).toBeNull();
      }
    }
  });

  it("falls back to authored inventory when the snapshot read throws", async () => {
    // Verdict §3 honesty: even if Supabase is unreachable, the
    // broker returns a stable shape (4 agents · canonical families)
    // rather than throw or return an empty payload.
    getSetupInventorySnapshotMock.mockRejectedValue(new Error('boom'));
    const result = await getCapabilityGrounding('apexretail');
    expect(result.perAgent).toHaveLength(4);
    expect(result.evidence).toBe('estimated');
    // The agent rollups still surface their primary families even
    // on fallback so the UI doesn't render empty rows.
    expect(
      result.perAgent.every((a) => a.families.length > 0),
    ).toBe(true);
  });

  it("emits 'estimated' when snapshot is null (no live data, authored fallback)", async () => {
    getSetupInventorySnapshotMock.mockResolvedValue(null);
    const result = await getCapabilityGrounding('apex-retail');
    expect(result.evidence).toBe('estimated');
  });

  it('records refreshedAtIso as a parsable timestamp', async () => {
    getSetupInventorySnapshotMock.mockResolvedValue(null);
    const result = await getCapabilityGrounding('apex-retail');
    expect(Number.isFinite(Date.parse(result.refreshedAtIso))).toBe(true);
  });

  it('exposes per-family segmentsCovered / segmentsRequired counts', async () => {
    getSetupInventorySnapshotMock.mockResolvedValue(
      snapshot([seg(3, 'complete')]),
    );
    const result = await getCapabilityGrounding('apex-retail');
    const atlas = result.perAgent.find((a) => a.agent === 'atlas')!;
    const family3 = atlas.families.find((f) => f.familyNumber === 3)!;
    expect(family3.segmentsRequired).toBe(1);
    expect(family3.segmentsCovered).toBe(1);
    const family4 = atlas.families.find((f) => f.familyNumber === 4)!;
    expect(family4.segmentsRequired).toBe(1);
    expect(family4.segmentsCovered).toBe(0);
  });
});

describe('getCapabilityGrounding · snapshotOverride contract', () => {
  // P0 follow-up to the browser walk 2026-05-30 banner: /admin
  // pre-fetches `getSetupInventorySnapshot` once for the masthead
  // pills + TrustSpine, and now threads that snapshot through here
  // so capability-grounding stops issuing a duplicate 3-query burst
  // against `data_inventory_segments` / `data_inventory_audit_log`
  // / `data_ingestion_runs` that competed with TrustSpine for the
  // single Postgres connection-pool slot. Same pattern as the
  // PR-2606 `getTrustSpine({ snapshotOverride })` dedup.
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('uses snapshot from override when provided, skipping fresh fetch', async () => {
    // The mock must blow up if invoked — proves we never touched
    // the Postgres pool on the override path.
    getSetupInventorySnapshotMock.mockRejectedValue(
      new Error('this should never be called'),
    );
    const override = snapshot([
      seg(3, 'mature'),
      seg(4, 'complete'),
      seg(5, 'mature'),
    ]);
    const result = await getCapabilityGrounding('apex-retail', {
      snapshotOverride: override,
    });
    expect(getSetupInventorySnapshotMock).not.toHaveBeenCalled();
    // And the override's substrate flowed through to the rollup —
    // Atlas families [3,4,5] are all covered → L3.
    const atlas = result.perAgent.find((a) => a.agent === 'atlas')!;
    for (const family of atlas.families) {
      expect(family.level).toBe('L3');
    }
  });

  it('falls back to fresh fetch when no override property is passed', async () => {
    getSetupInventorySnapshotMock.mockResolvedValue(
      snapshot([seg(3, 'mature')]),
    );
    await getCapabilityGrounding('apex-retail');
    expect(getSetupInventorySnapshotMock).toHaveBeenCalledTimes(1);
    expect(getSetupInventorySnapshotMock).toHaveBeenCalledWith('apex-retail');
  });

  it('honors explicit null override (does NOT refetch)', async () => {
    // Explicit `null` means "caller knows there is no live
    // substrate" — we honor it without refetching, mirroring the
    // `getTrustSpine` contract. The result falls through to the
    // authored inventory fallback.
    getSetupInventorySnapshotMock.mockRejectedValue(
      new Error('this should never be called'),
    );
    const result = await getCapabilityGrounding('apex-retail', {
      snapshotOverride: null,
    });
    expect(getSetupInventorySnapshotMock).not.toHaveBeenCalled();
    // Authored fallback still emits the 4-agent canonical shape.
    expect(result.perAgent).toHaveLength(4);
    expect(result.evidence).toBe('estimated');
  });
});

describe('panelFootFromGrounding', () => {
  function rollup(
    overrides: Partial<CapabilityGrounding> = {},
  ): CapabilityGrounding {
    return {
      perAgent: [
        {
          agent: 'nexus',
          highestLevel: 'L2',
          averageLevel: 'L2',
          families: [],
        },
        {
          agent: 'sentinel',
          highestLevel: 'L3',
          averageLevel: 'L3',
          families: [],
        },
        {
          agent: 'steward',
          highestLevel: 'L2',
          averageLevel: 'L2',
          families: [],
        },
        {
          agent: 'atlas',
          highestLevel: 'L1',
          averageLevel: 'L1',
          families: [],
        },
      ],
      refreshedAtIso: '2026-05-30T00:00:00Z',
      evidence: 'estimated',
      ...overrides,
    };
  }

  it('uses Sentinel highest level and averages the other three', () => {
    // Sentinel L3; others = [L2, L2, L1] → ordinals [2,2,1] avg 1.67
    // → floor → L1.  Estimated marker appended.
    const out = panelFootFromGrounding(rollup());
    expect(out).toBe('Sentinel L3 · 3 others avg L1 · estimated');
  });

  it('omits the estimated marker when evidence is live', () => {
    const out = panelFootFromGrounding(rollup({ evidence: 'live' }));
    expect(out).toBe('Sentinel L3 · 3 others avg L1');
  });
});

describe('panelStatusFromGrounding', () => {
  function rollup(sentinelLevel: 'L0' | 'L1' | 'L2' | 'L3'): CapabilityGrounding {
    return {
      perAgent: [
        {
          agent: 'nexus',
          highestLevel: 'L2',
          averageLevel: 'L2',
          families: [],
        },
        {
          agent: 'sentinel',
          highestLevel: sentinelLevel,
          averageLevel: sentinelLevel,
          families: [],
        },
        {
          agent: 'steward',
          highestLevel: 'L2',
          averageLevel: 'L2',
          families: [],
        },
        {
          agent: 'atlas',
          highestLevel: 'L1',
          averageLevel: 'L1',
          families: [],
        },
      ],
      refreshedAtIso: '2026-05-30T00:00:00Z',
      evidence: 'estimated',
    };
  }

  it("flags 'ready' when Sentinel is at L2 or above", () => {
    expect(panelStatusFromGrounding(rollup('L2'))).toBe('ready');
    expect(panelStatusFromGrounding(rollup('L3'))).toBe('ready');
  });

  it("flags 'attn' when Sentinel is below L2", () => {
    expect(panelStatusFromGrounding(rollup('L0'))).toBe('attn');
    expect(panelStatusFromGrounding(rollup('L1'))).toBe('attn');
  });
});
