// TOWER · T-7 (Bind 3) — Atlas observations view-model unit tests.

import { buildTowerAtlasObservationsView } from '@/lib/tower/atlas-observations-view';
import { buildTowerPressuresView } from '@/lib/tower/pressure-cards-view';
import type {
  AIInitiative,
  AIInitiativeVendorRow,
} from '@/lib/admin/ai-initiatives/queries';

const TODAY = '2026-05-07';

function makeInitiative(overrides: Partial<AIInitiative>): AIInitiative {
  return {
    initiativeId: 'init',
    displayId: 'XX-00',
    name: 'Test',
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

function makeVendor(overrides: Partial<AIInitiativeVendorRow>): AIInitiativeVendorRow {
  return {
    vendorId: 'v',
    initiativeId: 'init',
    initiativeDisplayId: 'XX-00',
    initiativeName: 'Test',
    vendorName: 'Vendor',
    contractValueUsd: 1_000_000,
    renewalDate: null,
    financialHealth: null,
    ...overrides,
  };
}

const MERIDIAN: ReadonlyArray<AIInitiative> = [
  makeInitiative({ initiativeId: 'mh01', displayId: 'MH-01', name: 'Clinical Documentation Copilot', stage: 'scaled', statusFlag: 'healthy', alignedCallout: true, committedAnnualUsd: 4_100_000, measuredValueUsd: 5_800_000 }),
  makeInitiative({ initiativeId: 'mh02', displayId: 'MH-02', name: 'Vibe Coding for IT', statusFlag: 'foundation_phase' }),
  makeInitiative({ initiativeId: 'mh03', displayId: 'MH-03', name: 'Autonomous Helpdesk via ServiceNow', statusFlag: 'duplication_risk', confidenceLevel: 'LOW', committedAnnualUsd: 900_000, measuredValueUsd: 380_000, statusSummary: 'Overlap with M365 Copilot.' }),
  makeInitiative({ initiativeId: 'mh04', displayId: 'MH-04', name: 'Epic AI for Revenue Cycle', stage: 'multi_year_strategic_bet', statusFlag: 'value_lag', alignedCallout: true, confidenceLevel: 'HIGH', committedAnnualUsd: 1_300_000, measuredValueUsd: 1_400_000 }),
  makeInitiative({ initiativeId: 'mh05', displayId: 'MH-05', name: 'Risk Stratification ML', stage: 'scaled', statusFlag: 'healthy' }),
  makeInitiative({ initiativeId: 'mh06', displayId: 'MH-06', name: 'Joule (SAP) Pilot', statusFlag: 'value_lag', confidenceLevel: 'MED', committedAnnualUsd: 3_200_000, measuredValueUsd: 1_400_000, statusSummary: 'Joule under-realizing.' }),
  makeInitiative({ initiativeId: 'mh07', displayId: 'MH-07', name: 'Model Governance & FinOps Platform', stage: 'multi_year_strategic_bet', statusFlag: 'foundation_phase', committedAnnualUsd: 1_400_000, committedTotalUsd: 4_200_000, measuredValueUsd: 0 }),
];

// ─────────────────────────────────────────────────────────────────────────────

describe('buildTowerAtlasObservationsView — empty', () => {
  it('returns isEmpty when no initiatives + no vendors', () => {
    const pressures = buildTowerPressuresView([], [], TODAY);
    const v = buildTowerAtlasObservationsView([], [], pressures, TODAY);
    expect(v.isEmpty).toBe(true);
    expect(v.observations).toHaveLength(0);
    expect(v.headline).toMatch(/needs substrate/);
  });

  it('returns default suggested prompts even when empty', () => {
    const pressures = buildTowerPressuresView([], [], TODAY);
    const v = buildTowerAtlasObservationsView([], [], pressures, TODAY);
    expect(v.suggestedPrompts.length).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('buildTowerAtlasObservationsView — Meridian fixture (3 pressures)', () => {
  it('composes 3 observations: top pressure + portfolio pattern + look-ahead', () => {
    const pressures = buildTowerPressuresView(MERIDIAN, [], TODAY);
    const v = buildTowerAtlasObservationsView(MERIDIAN, [], pressures, TODAY);
    expect(v.observations).toHaveLength(3);
  });

  it('Obs 01 anchors on the top pressure (MH-03 dup)', () => {
    const pressures = buildTowerPressuresView(MERIDIAN, [], TODAY);
    const v = buildTowerAtlasObservationsView(MERIDIAN, [], pressures, TODAY);
    expect(v.observations[0]!.number).toBe(1);
    expect(v.observations[0]!.topic).toBe('Capability duplication');
    expect(v.observations[0]!.body).toMatch(/Autonomous Helpdesk via ServiceNow/);
  });

  it('Obs 01 carries an action chip targeting the recommended Move', () => {
    const pressures = buildTowerPressuresView(MERIDIAN, [], TODAY);
    const v = buildTowerAtlasObservationsView(MERIDIAN, [], pressures, TODAY);
    expect(v.observations[0]!.actions).toHaveLength(1);
    expect(v.observations[0]!.actions[0]!.label).toMatch(/attribution study/i);
  });

  it('Obs 02 surfaces portfolio pattern (value-lag dominates)', () => {
    const pressures = buildTowerPressuresView(MERIDIAN, [], TODAY);
    const v = buildTowerAtlasObservationsView(MERIDIAN, [], pressures, TODAY);
    expect(v.observations[1]!.topic).toBe('Portfolio pattern');
    expect(v.observations[1]!.body).toMatch(/2 of 3 active pressures are value-lag/);
    expect(v.observations[1]!.body).toMatch(/MH-04, MH-06|MH-06, MH-04/);
  });

  it('Obs 02 references aligned-callouts when present (MH-01 + MH-04)', () => {
    const pressures = buildTowerPressuresView(MERIDIAN, [], TODAY);
    const v = buildTowerAtlasObservationsView(MERIDIAN, [], pressures, TODAY);
    expect(v.observations[1]!.body).toMatch(/MH-01/);
    expect(v.observations[1]!.body).toMatch(/aligned-callout/);
  });

  it('Obs 03 surfaces strategic bets (MH-07)', () => {
    const pressures = buildTowerPressuresView(MERIDIAN, [], TODAY);
    const v = buildTowerAtlasObservationsView(MERIDIAN, [], pressures, TODAY);
    expect(v.observations[2]!.topic).toBe('Look-ahead');
    expect(v.observations[2]!.body).toMatch(/MH-07/);
    expect(v.observations[2]!.body).toMatch(/foundation phase/);
  });

  it('"if you only do one thing today" anchors on Obs 01 action', () => {
    const pressures = buildTowerPressuresView(MERIDIAN, [], TODAY);
    const v = buildTowerAtlasObservationsView(MERIDIAN, [], pressures, TODAY);
    expect(v.ifYouOnlyDoOneToday).toMatch(/attribution study/i);
  });

  it('headline scales with observation count ("Three threads…")', () => {
    const pressures = buildTowerPressuresView(MERIDIAN, [], TODAY);
    const v = buildTowerAtlasObservationsView(MERIDIAN, [], pressures, TODAY);
    expect(v.headline).toMatch(/^Three threads/);
  });

  it('suggested prompts include type-matched prompts for observed pressures', () => {
    const pressures = buildTowerPressuresView(MERIDIAN, [], TODAY);
    const v = buildTowerAtlasObservationsView(MERIDIAN, [], pressures, TODAY);
    // dup → "Run a clean attribution study", value → "lagging programs by realized value"
    expect(v.suggestedPrompts.some((p) => /attribution study/i.test(p))).toBe(true);
    expect(v.suggestedPrompts.some((p) => /lagging programs/i.test(p))).toBe(true);
  });

  it('suggested prompts cap at 4', () => {
    const pressures = buildTowerPressuresView(MERIDIAN, [], TODAY);
    const v = buildTowerAtlasObservationsView(MERIDIAN, [], pressures, TODAY);
    expect(v.suggestedPrompts).toHaveLength(4);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('buildTowerAtlasObservationsView — vendor renewal in window', () => {
  it('Obs 01 becomes the vendor-clock observation', () => {
    const vendors: AIInitiativeVendorRow[] = [
      makeVendor({ initiativeDisplayId: 'MH-04', initiativeName: 'Epic AI', vendorName: 'Epic Systems', renewalDate: '2026-06-15', contractValueUsd: 2_600_000 }),
    ];
    const pressures = buildTowerPressuresView(MERIDIAN, vendors, TODAY);
    const v = buildTowerAtlasObservationsView(MERIDIAN, vendors, pressures, TODAY);
    expect(v.observations[0]!.topic).toBe('Vendor clock');
    expect(v.observations[0]!.body).toMatch(/Epic Systems/);
    expect(v.observations[0]!.actions[0]!.label).toMatch(/renewal brief/i);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('buildTowerAtlasObservationsView — healthy portfolio', () => {
  const HEALTHY: ReadonlyArray<AIInitiative> = [
    makeInitiative({ displayId: 'MH-01', stage: 'scaled', statusFlag: 'healthy', alignedCallout: true }),
    makeInitiative({ displayId: 'MH-02', stage: 'scaled', statusFlag: 'healthy' }),
  ];

  it('returns 1+ observations even when no pressures', () => {
    const pressures = buildTowerPressuresView(HEALTHY, [], TODAY);
    const v = buildTowerAtlasObservationsView(HEALTHY, [], pressures, TODAY);
    expect(v.observations.length).toBeGreaterThanOrEqual(1);
    expect(v.observations[0]!.topic).toBe('Healthy posture');
  });

  it('headline reflects healthy state', () => {
    const pressures = buildTowerPressuresView(HEALTHY, [], TODAY);
    const v = buildTowerAtlasObservationsView(HEALTHY, [], pressures, TODAY);
    expect(v.headline).toMatch(/healthy portfolio/i);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('buildTowerAtlasObservationsView — purity', () => {
  it('same input yields identical output', () => {
    const p = buildTowerPressuresView(MERIDIAN, [], TODAY);
    const a = buildTowerAtlasObservationsView(MERIDIAN, [], p, TODAY);
    const b = buildTowerAtlasObservationsView(MERIDIAN, [], p, TODAY);
    expect(a).toEqual(b);
  });

  it('deterministicSeed: true', () => {
    const p = buildTowerPressuresView(MERIDIAN, [], TODAY);
    const v = buildTowerAtlasObservationsView(MERIDIAN, [], p, TODAY);
    expect(v.deterministicSeed).toBe(true);
  });

  it('every observation has a numeric `number` field 1..3', () => {
    const p = buildTowerPressuresView(MERIDIAN, [], TODAY);
    const v = buildTowerAtlasObservationsView(MERIDIAN, [], p, TODAY);
    for (const obs of v.observations) {
      expect(obs.number).toBeGreaterThanOrEqual(1);
      expect(obs.number).toBeLessThanOrEqual(3);
    }
  });

  it('every observation has non-empty body', () => {
    const p = buildTowerPressuresView(MERIDIAN, [], TODAY);
    const v = buildTowerAtlasObservationsView(MERIDIAN, [], p, TODAY);
    for (const obs of v.observations) {
      expect(obs.body.length).toBeGreaterThan(20);
    }
  });
});
