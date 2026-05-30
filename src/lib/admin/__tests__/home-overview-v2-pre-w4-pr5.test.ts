/**
 * home-overview-v2 · PRE-W4-PR-5 (persona report §9 fixes #2, #7).
 *
 * Covers the two view-builder changes shipped in the Trust Plane
 * pre-comms wave:
 *
 *   - Fix #2 (audit verdict §5.5): panel #02 "AI Initiatives" is
 *     retired entirely. The old card pointed at /home/ai-initiatives
 *     which now hard-redirects to /home — ejecting tenant admins.
 *
 *   - Fix #7: the four Module readiness percentages would all
 *     evaluate to ≤30% for an empty tenant, painting Section 01 all
 *     red. When `emptyTenant === true` the composer returns an empty
 *     `readiness` array so the surface can render an editorial
 *     placeholder instead.
 */

import { composeHomeV2Extras } from '../home-overview-v2';

import type { InventorySegmentRollup } from '@/lib/admin/setup-acts-registry';

function segment(overrides: Partial<InventorySegmentRollup>): InventorySegmentRollup {
  return {
    segmentId: 'org_structure',
    segmentName: 'Org structure',
    familyNumber: 1,
    recordCount: 12,
    coverageScore: 0.9,
    staleCount: 0,
    missingCount: 0,
    healthState: 'mature',
    lastReviewedAt: '2026-05-30T00:00:00Z',
    lastIngestedAt: '2026-05-30T00:00:00Z',
    ...overrides,
  };
}

const NON_EMPTY_INPUT = {
  segments: [
    segment({ segmentId: 'org_structure', segmentName: 'Org structure' }),
    segment({ segmentId: 'kpi_dictionary', segmentName: 'KPI dictionary', familyNumber: 2 }),
  ],
  programsCount: 4,
  programsP6Count: 0,
  sourceEventsCount: 12,
  sourceEventsAtRiskCount: 0,
  initiativesCount: 4,
  initiativesAtRiskCount: 0,
  lastIngestedAt: '2026-05-30T00:00:00Z',
};

describe('composeHomeV2Extras · PRE-W4-PR-5 fix #2 · AI Initiatives panel retired', () => {
  it('does not emit a panel with name "AI Initiatives" (non-empty tenant)', () => {
    const extras = composeHomeV2Extras(NON_EMPTY_INPUT);
    expect(extras.panels.some((p) => p.name === 'AI Initiatives')).toBe(false);
  });

  it('does not emit any panel pointing at /home/ai-initiatives', () => {
    const extras = composeHomeV2Extras(NON_EMPTY_INPUT);
    expect(extras.panels.some((p) => p.href.startsWith('/home/ai-initiatives'))).toBe(false);
  });

  it('does not emit a panel with num "02" — kept stable so deep links + design vocab match', () => {
    const extras = composeHomeV2Extras(NON_EMPTY_INPUT);
    expect(extras.panels.some((p) => p.num === '02')).toBe(false);
  });

  it('still emits the remaining setup panels (data-trust, connectors, users-access, agent-readiness, etc.)', () => {
    const extras = composeHomeV2Extras(NON_EMPTY_INPUT);
    const nums = new Set(extras.panels.map((p) => p.num));
    expect(nums.has('01')).toBe(true);
    expect(nums.has('03')).toBe(true);
    expect(nums.has('04')).toBe(true);
    expect(nums.has('05')).toBe(true);
    expect(nums.has('06')).toBe(true);
    expect(nums.has('07')).toBe(true);
    expect(nums.has('08')).toBe(true);
  });
});

describe('composeHomeV2Extras · PRE-W4-PR-5 fix #7 · empty-tenant readiness', () => {
  const EMPTY_INPUT = {
    segments: [],
    programsCount: 0,
    programsP6Count: 0,
    sourceEventsCount: 0,
    sourceEventsAtRiskCount: 0,
    initiativesCount: 0,
    initiativesAtRiskCount: 0,
    lastIngestedAt: null,
  };

  it('emits an empty readiness array when emptyTenant === true', () => {
    const extras = composeHomeV2Extras({ ...EMPTY_INPUT, emptyTenant: true });
    expect(extras.readiness).toEqual([]);
  });

  it('still emits the four module rollups when emptyTenant is omitted', () => {
    const extras = composeHomeV2Extras(EMPTY_INPUT);
    expect(extras.readiness.map((r) => r.name)).toEqual([
      'Tower',
      'Source',
      'Intelligence',
      'Strategic Moves',
    ]);
  });

  it('still emits the four module rollups when emptyTenant === false', () => {
    const extras = composeHomeV2Extras({ ...NON_EMPTY_INPUT, emptyTenant: false });
    expect(extras.readiness).toHaveLength(4);
  });
});
