// TOWER · T-4 — Strategic alignment 2×2 view-model unit tests.
//
// Pure deterministic coverage of strategic-alignment-2x2-view.ts.
// Anchors against the AI Initiatives Substrate v1.1.0 example layout for
// Meridian Health (per Wireframe Addendum).

import {
  buildStrategicAlignment2x2View,
  dotsByQuadrant,
} from '@/lib/tower/strategic-alignment-2x2-view';
import type { AIInitiative } from '@/lib/admin/ai-initiatives/queries';

// ─────────────────────────────────────────────────────────────────────────────
// Fixtures — Meridian Health 7 initiatives (per template/full_load.json)
// ─────────────────────────────────────────────────────────────────────────────

function makeInitiative(overrides: Partial<AIInitiative>): AIInitiative {
  return {
    initiativeId: 'init-id',
    displayId: 'XX-00',
    name: 'Test initiative',
    description: '',
    primaryCategoryId: 'cat',
    primaryCategoryName: 'Cat',
    secondaryCategoryId: null,
    secondaryCategoryName: null,
    primaryGoalId: 'goal',
    primaryGoalName: 'Goal',
    stage: 'pilot',
    stageDetail: null,
    ownerName: 'Owner',
    ownerTitle: 'Title',
    ownerFunction: null,
    committedAnnualUsd: 1_000_000,
    committedTotalUsd: null,
    measuredValueUsd: 500_000,
    statusFlag: 'healthy',
    statusSummary: 'OK',
    confidenceLevel: 'HIGH',
    alignedCallout: false,
    alignedRationale: null,
    loadedViaTemplate: 'fixture',
    ...overrides,
  };
}

const MERIDIAN_FIXTURE: ReadonlyArray<AIInitiative> = [
  makeInitiative({
    initiativeId: 'mh01',
    displayId: 'MH-01',
    name: 'Clinical Documentation Copilot',
    stage: 'scaled',
    statusFlag: 'healthy',
    committedAnnualUsd: 4_100_000,
    measuredValueUsd: 5_800_000,
    alignedCallout: true,
    confidenceLevel: 'HIGH',
  }),
  makeInitiative({
    initiativeId: 'mh02',
    displayId: 'MH-02',
    name: 'Vibe Coding Rollout for IT',
    stage: 'pilot',
    statusFlag: 'foundation_phase',
    committedAnnualUsd: 400_000,
    measuredValueUsd: 180_000,
    alignedCallout: false,
    confidenceLevel: 'MED',
  }),
  makeInitiative({
    initiativeId: 'mh03',
    displayId: 'MH-03',
    name: 'Autonomous Helpdesk via ServiceNow',
    stage: 'pilot',
    statusFlag: 'duplication_risk',
    committedAnnualUsd: 900_000,
    measuredValueUsd: 380_000,
    alignedCallout: false,
    confidenceLevel: 'LOW',
  }),
  makeInitiative({
    initiativeId: 'mh04',
    displayId: 'MH-04',
    name: 'Epic AI for Revenue Cycle',
    stage: 'multi_year_strategic_bet',
    statusFlag: 'value_lag',
    committedAnnualUsd: 1_300_000,
    committedTotalUsd: 2_600_000,
    measuredValueUsd: 1_400_000,
    alignedCallout: true,
    confidenceLevel: 'HIGH',
  }),
  makeInitiative({
    initiativeId: 'mh05',
    displayId: 'MH-05',
    name: 'Clinical Risk Stratification ML',
    stage: 'scaled',
    statusFlag: 'healthy',
    committedAnnualUsd: 600_000,
    measuredValueUsd: 3_800_000,
    alignedCallout: false,
    confidenceLevel: 'HIGH',
  }),
  makeInitiative({
    initiativeId: 'mh06',
    displayId: 'MH-06',
    name: 'Joule (SAP) Pilot for Finance',
    stage: 'pilot',
    statusFlag: 'value_lag',
    committedAnnualUsd: 3_200_000,
    measuredValueUsd: 1_400_000,
    alignedCallout: false,
    confidenceLevel: 'MED',
  }),
  makeInitiative({
    initiativeId: 'mh07',
    displayId: 'MH-07',
    name: 'Model Governance & FinOps Platform',
    stage: 'multi_year_strategic_bet',
    statusFlag: 'foundation_phase',
    committedAnnualUsd: 1_400_000,
    committedTotalUsd: 4_200_000,
    measuredValueUsd: 0,
    alignedCallout: false,
    confidenceLevel: 'MED',
  }),
];

// ─────────────────────────────────────────────────────────────────────────────
// buildStrategicAlignment2x2View
// ─────────────────────────────────────────────────────────────────────────────

describe('buildStrategicAlignment2x2View', () => {
  it('returns deterministicSeed: true', () => {
    const view = buildStrategicAlignment2x2View(MERIDIAN_FIXTURE);
    expect(view.deterministicSeed).toBe(true);
  });

  it('places MH-07 in Strategic Bets row (multi_year_strategic_bet + foundation_phase + measured=0)', () => {
    const view = buildStrategicAlignment2x2View(MERIDIAN_FIXTURE);
    expect(view.strategicBets.map((b) => b.displayId)).toContain('MH-07');
  });

  it('does not place MH-07 in any 2×2 quadrant', () => {
    const view = buildStrategicAlignment2x2View(MERIDIAN_FIXTURE);
    expect(view.dots.map((d) => d.displayId)).not.toContain('MH-07');
  });

  it('plots six initiatives in the 2×2 (MH-01..MH-06)', () => {
    const view = buildStrategicAlignment2x2View(MERIDIAN_FIXTURE);
    expect(view.dots).toHaveLength(6);
    expect(view.totalPlotted).toBe(6);
  });

  it('places MH-01 (Clinical Documentation Copilot) in TR — high value, aligned callout', () => {
    const view = buildStrategicAlignment2x2View(MERIDIAN_FIXTURE);
    const mh01 = view.dots.find((d) => d.displayId === 'MH-01');
    expect(mh01?.quadrant).toBe('tr');
    expect(mh01?.alignedCallout).toBe(true);
  });

  it('places MH-04 (Epic AI for Revenue Cycle) in TR — aligned overrides value_lag', () => {
    const view = buildStrategicAlignment2x2View(MERIDIAN_FIXTURE);
    const mh04 = view.dots.find((d) => d.displayId === 'MH-04');
    expect(mh04?.quadrant).toBe('tr');
  });

  it('places MH-05 (Clinical Risk Stratification ML) in TR — healthy + scaled drives high alignment', () => {
    const view = buildStrategicAlignment2x2View(MERIDIAN_FIXTURE);
    const mh05 = view.dots.find((d) => d.displayId === 'MH-05');
    expect(mh05?.quadrant).toBe('tr');
  });

  it('places MH-06 (Joule SAP) in TL — high value but value_lag without aligned_callout', () => {
    const view = buildStrategicAlignment2x2View(MERIDIAN_FIXTURE);
    const mh06 = view.dots.find((d) => d.displayId === 'MH-06');
    expect(mh06?.quadrant).toBe('tl');
  });

  it('places MH-03 (Autonomous Helpdesk) in BL — duplication_risk forces low alignment', () => {
    const view = buildStrategicAlignment2x2View(MERIDIAN_FIXTURE);
    const mh03 = view.dots.find((d) => d.displayId === 'MH-03');
    expect(mh03?.quadrant).toBe('bl');
  });

  it('places MH-02 (Vibe Coding) in BR — low value, foundation_phase drives high alignment', () => {
    const view = buildStrategicAlignment2x2View(MERIDIAN_FIXTURE);
    const mh02 = view.dots.find((d) => d.displayId === 'MH-02');
    expect(mh02?.quadrant).toBe('br');
  });

  it('formats committed_total_usd as the displayed amount when present (MH-04 → $2.6M)', () => {
    const view = buildStrategicAlignment2x2View(MERIDIAN_FIXTURE);
    const mh04 = view.dots.find((d) => d.displayId === 'MH-04');
    expect(mh04?.amount).toBe('$2.6M');
  });

  it('formats committed_annual_usd when committed_total_usd is null (MH-01 → $4.1M)', () => {
    const view = buildStrategicAlignment2x2View(MERIDIAN_FIXTURE);
    const mh01 = view.dots.find((d) => d.displayId === 'MH-01');
    expect(mh01?.amount).toBe('$4.1M');
  });

  it('returns empty view with hint when no initiatives provided', () => {
    const view = buildStrategicAlignment2x2View([]);
    expect(view.dots).toHaveLength(0);
    expect(view.strategicBets).toHaveLength(0);
    expect(view.totalPlotted).toBe(0);
    expect(view.emptyHint).toMatch(/scoring pending/);
  });

  it('returns null emptyHint when initiatives are present', () => {
    const view = buildStrategicAlignment2x2View(MERIDIAN_FIXTURE);
    expect(view.emptyHint).toBeNull();
  });

  it('is pure — identical inputs yield identical outputs', () => {
    const a = buildStrategicAlignment2x2View(MERIDIAN_FIXTURE);
    const b = buildStrategicAlignment2x2View(MERIDIAN_FIXTURE);
    expect(a).toEqual(b);
  });

  it('preserves confidenceLevel on every dot', () => {
    const view = buildStrategicAlignment2x2View(MERIDIAN_FIXTURE);
    for (const dot of view.dots) {
      expect(['HIGH', 'MED', 'LOW']).toContain(dot.confidenceLevel);
    }
  });

  it('includes MH-07 stageDetail (when null defaults to "Multi-year strategic bet")', () => {
    const view = buildStrategicAlignment2x2View(MERIDIAN_FIXTURE);
    const mh07 = view.strategicBets.find((b) => b.displayId === 'MH-07');
    expect(mh07?.stageDetail).toBe('Multi-year strategic bet');
  });

  it('uses committed_total_usd for Strategic Bets dollar display (MH-07 → $4.2M)', () => {
    const view = buildStrategicAlignment2x2View(MERIDIAN_FIXTURE);
    const mh07 = view.strategicBets.find((b) => b.displayId === 'MH-07');
    expect(mh07?.amount).toBe('$4.2M');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// dotsByQuadrant
// ─────────────────────────────────────────────────────────────────────────────

describe('dotsByQuadrant', () => {
  it('groups dots into the four quadrants', () => {
    const view = buildStrategicAlignment2x2View(MERIDIAN_FIXTURE);
    const grouped = dotsByQuadrant(view);
    const total =
      grouped.tl.length + grouped.tr.length + grouped.bl.length + grouped.br.length;
    expect(total).toBe(view.dots.length);
  });

  it('places three Meridian initiatives in TR (MH-01, MH-04, MH-05)', () => {
    const view = buildStrategicAlignment2x2View(MERIDIAN_FIXTURE);
    const grouped = dotsByQuadrant(view);
    expect(grouped.tr.map((d) => d.displayId).sort()).toEqual(['MH-01', 'MH-04', 'MH-05']);
  });

  it('places one Meridian initiative in TL (MH-06)', () => {
    const view = buildStrategicAlignment2x2View(MERIDIAN_FIXTURE);
    const grouped = dotsByQuadrant(view);
    expect(grouped.tl.map((d) => d.displayId)).toEqual(['MH-06']);
  });

  it('places one Meridian initiative in BL (MH-03)', () => {
    const view = buildStrategicAlignment2x2View(MERIDIAN_FIXTURE);
    const grouped = dotsByQuadrant(view);
    expect(grouped.bl.map((d) => d.displayId)).toEqual(['MH-03']);
  });

  it('places one Meridian initiative in BR (MH-02)', () => {
    const view = buildStrategicAlignment2x2View(MERIDIAN_FIXTURE);
    const grouped = dotsByQuadrant(view);
    expect(grouped.br.map((d) => d.displayId)).toEqual(['MH-02']);
  });

  it('returns empty arrays for every quadrant when view is empty', () => {
    const view = buildStrategicAlignment2x2View([]);
    const grouped = dotsByQuadrant(view);
    expect(grouped.tl).toHaveLength(0);
    expect(grouped.tr).toHaveLength(0);
    expect(grouped.bl).toHaveLength(0);
    expect(grouped.br).toHaveLength(0);
  });
});
