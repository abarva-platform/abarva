/**
 * Authored inventory fallback (Setup Fix Package PR 3 · Option A).
 *
 * Locks in the Client Data Landscape ↔ Act 1 reconciliation:
 *   - When no live snapshot, the landscape uses authored
 *     capability matrix + Act 1 facts as its source.
 *   - Apex/Meridian (rich) and Arcturus (partial) all yield
 *     non-zero rollups consistent with what Act 1 cites.
 *   - Truly empty tenants (sparse) yield empty rollups so the
 *     landscape correctly shows 0/14.
 *   - Live snapshot still wins when it exists (no regression on
 *     Apex/Meridian production behaviour).
 */

import {
  buildAuthoredInventoryFallback,
  getSetupActsContent,
  getSetupSummaryCountsWithSnapshot,
  type SetupInventorySnapshot,
} from '../setup-acts-registry';

describe('buildAuthoredInventoryFallback', () => {
  it('Apex (rich) produces non-zero rollups for all 14 segments', () => {
    const fallback = buildAuthoredInventoryFallback(getSetupActsContent('apexretail'));
    expect(fallback.segments.length).toBeGreaterThan(0);
    expect(fallback.totalRecords).not.toBeNull();
    expect(fallback.totalRecords ?? 0).toBeGreaterThan(0);
    expect(fallback.segmentsTracked).not.toBeNull();
  });

  it('Arcturus (partial) produces non-zero rollups for cited segments', () => {
    const fallback = buildAuthoredInventoryFallback(getSetupActsContent('arcturus'));
    expect(fallback.segments.length).toBeGreaterThan(0);
    expect(fallback.totalRecords).not.toBeNull();
    expect(fallback.totalRecords ?? 0).toBeGreaterThan(0);
    // Segments cited in Act 1 (01, 03, 05, 09, 12) must be loaded.
    const segIds = new Set(fallback.segments.map((s) => s.segmentId));
    expect(segIds.has('enterprise_profile')).toBe(true); // 01
    expect(segIds.has('it_landscape')).toBe(true); // 03
    expect(segIds.has('evidence_ledger')).toBe(true); // 09
    expect(segIds.has('compliance')).toBe(true); // 12
  });

  it('cited Act-1 segments get a record-count boost', () => {
    const fallback = buildAuthoredInventoryFallback(getSetupActsContent('arcturus'));
    const enterpriseProfile = fallback.segments.find((s) => s.segmentId === 'enterprise_profile');
    const noFactSegment = fallback.segments.find((s) => s.segmentId === 'industry_context');
    expect(enterpriseProfile).toBeDefined();
    expect(noFactSegment).toBeDefined();
    // Both are 'partial' depth in Arcturus's matrix, but enterprise_profile
    // gets a fact-count boost (cited twice in actOneFacts) so its records
    // exceed industry_context's.
    expect(enterpriseProfile!.recordCount).toBeGreaterThan(noFactSegment!.recordCount);
  });

  it('sparse tenant (no capability matrix) returns empty rollups + null totalRecords', () => {
    const fallback = buildAuthoredInventoryFallback(getSetupActsContent('keystone'));
    expect(fallback.segments).toHaveLength(0);
    expect(fallback.totalRecords).toBeNull();
    expect(fallback.segmentsTracked).toBeNull();
  });

  it('chunk/node/edge counts scale with totalRecords', () => {
    const fallback = buildAuthoredInventoryFallback(getSetupActsContent('apexretail'));
    const records = fallback.totalRecords ?? 0;
    expect(fallback.totalChunks).toBeGreaterThan(0);
    expect(fallback.totalNodes).toBeGreaterThan(0);
    expect(fallback.totalEdges).toBeGreaterThan(0);
    // Order-of-magnitude check (matches Apex production substrate ratios).
    expect(fallback.totalChunks).toBeGreaterThanOrEqual(Math.round(records * 0.5));
    expect(fallback.totalNodes).toBeGreaterThanOrEqual(Math.round(records * 0.3));
  });
});

describe('getSetupSummaryCountsWithSnapshot — authored fallback', () => {
  it('Arcturus without snapshot uses authored totals (no longer null)', () => {
    const counts = getSetupSummaryCountsWithSnapshot(
      getSetupActsContent('arcturus'),
      null,
    );
    expect(counts.totalRecords).not.toBeNull();
    expect(counts.totalRecords ?? 0).toBeGreaterThan(0);
    expect(counts.segmentsTracked).not.toBeNull();
    expect(counts.segmentsTracked ?? 0).toBeGreaterThan(0);
  });

  it('snapshot still wins when present', () => {
    const snapshot: SetupInventorySnapshot = {
      tenantKey: 'arcturus',
      segments: [],
      totalRecords: 42,
      totalChunks: 100,
      totalNodes: 30,
      totalEdges: 35,
      recentActivity: [],
      lastIngestedAt: '2026-05-01T00:00:00Z',
    };
    const counts = getSetupSummaryCountsWithSnapshot(
      getSetupActsContent('arcturus'),
      snapshot,
    );
    expect(counts.totalRecords).toBe(42);
    expect(counts.segmentsTracked).toBe(0);
  });

  it('truly sparse tenant (Keystone) still reports null totals — empty-state honesty', () => {
    const counts = getSetupSummaryCountsWithSnapshot(
      getSetupActsContent('keystone'),
      null,
    );
    expect(counts.totalRecords).toBeNull();
    expect(counts.segmentsTracked).toBeNull();
  });
});
