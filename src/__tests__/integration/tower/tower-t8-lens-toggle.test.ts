// TOWER · T-8 (Bind 4) — Lens toggle wiring unit tests.
//
// Covers band-metrics + pressure-cards lens parameter behavior.

import { buildTowerBandMetrics } from '@/lib/tower/band-metrics-view';
import { buildTowerPressuresView } from '@/lib/tower/pressure-cards-view';
import type {
  AIInitiative,
  AIInitiativeVendorRow,
} from '@/lib/admin/ai-initiatives/queries';

const TODAY = '2026-05-07';

function makeInitiative(o: Partial<AIInitiative>): AIInitiative {
  return {
    initiativeId: 'i', displayId: 'XX-0', name: 'X', description: '',
    primaryCategoryId: 'c', primaryCategoryName: 'C',
    secondaryCategoryId: null, secondaryCategoryName: null,
    primaryGoalId: 'g', primaryGoalName: 'G',
    stage: 'pilot', stageDetail: null,
    ownerName: 'O', ownerTitle: 'T', ownerFunction: null,
    committedAnnualUsd: 1_000_000, committedTotalUsd: null,
    measuredValueUsd: 500_000,
    statusFlag: 'healthy', statusSummary: 'OK',
    confidenceLevel: 'HIGH', alignedCallout: false, alignedRationale: null,
    loadedViaTemplate: 'fixture', ...o,
  };
}

function makeVendor(o: Partial<AIInitiativeVendorRow>): AIInitiativeVendorRow {
  return {
    vendorId: 'v', initiativeId: 'i', initiativeDisplayId: 'XX-0',
    initiativeName: 'X', vendorName: 'V', contractValueUsd: 1_000_000,
    renewalDate: null, financialHealth: null, ...o,
  };
}

const FIXTURE: ReadonlyArray<AIInitiative> = [
  makeInitiative({ displayId: 'A', stage: 'scaled', statusFlag: 'cost_overrun', committedAnnualUsd: 4_000_000, measuredValueUsd: 2_000_000 }),
  makeInitiative({ displayId: 'B', statusFlag: 'duplication_risk', committedAnnualUsd: 1_000_000, measuredValueUsd: 200_000 }),
  makeInitiative({ displayId: 'C', statusFlag: 'value_lag', committedAnnualUsd: 2_000_000, measuredValueUsd: 800_000 }),
  makeInitiative({ displayId: 'D', statusFlag: 'adoption_gap', committedAnnualUsd: 600_000, measuredValueUsd: 100_000 }),
  makeInitiative({ displayId: 'E', stage: 'scaled', statusFlag: 'healthy', committedAnnualUsd: 1_500_000, measuredValueUsd: 1_800_000 }),
];

const VENDORS_IN_WINDOW: AIInitiativeVendorRow[] = [
  makeVendor({ initiativeDisplayId: 'A', vendorName: 'Vendor X', renewalDate: '2026-06-01', contractValueUsd: 4_000_000 }),
];

// ─────────────────────────────────────────────────────────────────────────────
// Band hero swap
// ─────────────────────────────────────────────────────────────────────────────

describe('buildTowerBandMetrics — lens hero swap', () => {
  it('value lens leads with portfolio_roi', () => {
    const v = buildTowerBandMetrics(FIXTURE, [], TODAY, 'value');
    expect(v.metrics[0]!.key).toBe('portfolio_roi');
    expect(v.metrics[0]!.hero).toBe(true);
    expect(v.metrics.filter((m) => m.hero).length).toBe(1);
  });

  it('risk lens leads with spend_at_risk', () => {
    const v = buildTowerBandMetrics(FIXTURE, [], TODAY, 'risk');
    expect(v.metrics[0]!.key).toBe('spend_at_risk');
    expect(v.metrics[0]!.hero).toBe(true);
  });

  it('contract lens leads with renewals_90d', () => {
    const v = buildTowerBandMetrics(FIXTURE, VENDORS_IN_WINDOW, TODAY, 'contract');
    expect(v.metrics[0]!.key).toBe('renewals_90d');
    expect(v.metrics[0]!.hero).toBe(true);
  });

  it('adopt lens leads with adoption_rate', () => {
    const v = buildTowerBandMetrics(FIXTURE, [], TODAY, 'adopt');
    expect(v.metrics[0]!.key).toBe('adoption_rate');
    expect(v.metrics[0]!.hero).toBe(true);
  });

  it('exactly one tile is hero per lens', () => {
    for (const lens of ['value', 'risk', 'contract', 'adopt'] as const) {
      const v = buildTowerBandMetrics(FIXTURE, [], TODAY, lens);
      const heroes = v.metrics.filter((m) => m.hero);
      expect(heroes).toHaveLength(1);
    }
  });

  it('all 5 metric keys still present after lens reorder', () => {
    const expected = new Set(['portfolio_roi', 'active_pressures', 'spend_at_risk', 'renewals_90d', 'adoption_rate']);
    for (const lens of ['value', 'risk', 'contract', 'adopt'] as const) {
      const v = buildTowerBandMetrics(FIXTURE, [], TODAY, lens);
      const keys = new Set(v.metrics.map((m) => m.key));
      expect(keys).toEqual(expected);
    }
  });

  it('default lens is "value"', () => {
    const a = buildTowerBandMetrics(FIXTURE, [], TODAY);
    const b = buildTowerBandMetrics(FIXTURE, [], TODAY, 'value');
    expect(a).toEqual(b);
  });

  it('lens swap also applies on empty placeholder view', () => {
    const v = buildTowerBandMetrics([], [], TODAY, 'risk');
    expect(v.isEmpty).toBe(true);
    expect(v.metrics[0]!.key).toBe('spend_at_risk');
    expect(v.metrics[0]!.hero).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Pressure card re-ranking
// ─────────────────────────────────────────────────────────────────────────────

describe('buildTowerPressuresView — lens re-ranking', () => {
  it('value lens (default): cost first when no vend in window', () => {
    const v = buildTowerPressuresView(FIXTURE, [], TODAY, 'value');
    expect(v.cards[0]!.type).toBe('cost');
  });

  it('risk lens: cost first (financial-risk pressures lead)', () => {
    const v = buildTowerPressuresView(FIXTURE, [], TODAY, 'risk');
    expect(v.cards[0]!.type).toBe('cost');
  });

  it('contract lens: vend first when in window', () => {
    const v = buildTowerPressuresView(FIXTURE, VENDORS_IN_WINDOW, TODAY, 'contract');
    expect(v.cards[0]!.type).toBe('vend');
  });

  it('contract lens: cost first when no vend in window (vend has no card to lead with)', () => {
    const v = buildTowerPressuresView(FIXTURE, [], TODAY, 'contract');
    // No vendor in window → vendor pressure not synthesized; cost leads.
    expect(v.cards[0]!.type).toBe('cost');
  });

  it('adopt lens: adoption pressure leads', () => {
    const v = buildTowerPressuresView(FIXTURE, [], TODAY, 'adopt');
    expect(v.cards[0]!.type).toBe('adopt');
  });

  it('all pressure types preserved across lens variants', () => {
    const expected = ['cost', 'dupl', 'value', 'adopt'].sort();
    for (const lens of ['value', 'risk', 'contract', 'adopt'] as const) {
      const v = buildTowerPressuresView(FIXTURE, [], TODAY, lens);
      const types = v.cards.map((c) => c.type).sort();
      expect(types).toEqual(expected);
    }
  });

  it('default lens is "value"', () => {
    const a = buildTowerPressuresView(FIXTURE, [], TODAY);
    const b = buildTowerPressuresView(FIXTURE, [], TODAY, 'value');
    expect(a).toEqual(b);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Determinism across lenses
// ─────────────────────────────────────────────────────────────────────────────

describe('lens views are deterministic', () => {
  it('same lens twice = identical band view', () => {
    const a = buildTowerBandMetrics(FIXTURE, [], TODAY, 'risk');
    const b = buildTowerBandMetrics(FIXTURE, [], TODAY, 'risk');
    expect(a).toEqual(b);
  });

  it('same lens twice = identical pressure view', () => {
    const a = buildTowerPressuresView(FIXTURE, [], TODAY, 'contract');
    const b = buildTowerPressuresView(FIXTURE, [], TODAY, 'contract');
    expect(a).toEqual(b);
  });
});
