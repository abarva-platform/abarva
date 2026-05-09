// TOWER · T-6 (Bind 2) — Pressure cards view-model unit tests.
//
// Pure deterministic coverage of pressure-cards-view.ts.

import { buildTowerPressuresView } from '@/lib/tower/pressure-cards-view';
import type {
  AIInitiative,
  AIInitiativeVendorRow,
} from '@/lib/admin/ai-initiatives/queries';

const TODAY = '2026-05-07';

function makeInitiative(overrides: Partial<AIInitiative>): AIInitiative {
  return {
    initiativeId: 'init-id',
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
    ownerName: 'A. Owner',
    ownerTitle: 'CTO',
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
  makeInitiative({ displayId: 'MH-01', stage: 'scaled', statusFlag: 'healthy', committedAnnualUsd: 4_100_000, measuredValueUsd: 5_800_000 }),
  makeInitiative({ displayId: 'MH-02', stage: 'pilot', statusFlag: 'foundation_phase' }),
  makeInitiative({ displayId: 'MH-03', name: 'Autonomous Helpdesk via ServiceNow', stage: 'pilot', statusFlag: 'duplication_risk', committedAnnualUsd: 900_000, measuredValueUsd: 380_000, confidenceLevel: 'LOW', statusSummary: 'Overlap with M365 Copilot deflection.' }),
  makeInitiative({ displayId: 'MH-04', stage: 'multi_year_strategic_bet', statusFlag: 'value_lag', committedAnnualUsd: 1_300_000, measuredValueUsd: 1_400_000, confidenceLevel: 'HIGH' }),
  makeInitiative({ displayId: 'MH-05', stage: 'scaled', statusFlag: 'healthy' }),
  makeInitiative({ displayId: 'MH-06', name: 'Joule (SAP) Pilot for Finance', stage: 'pilot', statusFlag: 'value_lag', committedAnnualUsd: 3_200_000, measuredValueUsd: 1_400_000, confidenceLevel: 'MED', statusSummary: 'Joule under-realizing efficiency line.' }),
  makeInitiative({ displayId: 'MH-07', stage: 'multi_year_strategic_bet', statusFlag: 'foundation_phase' }),
];

// ─────────────────────────────────────────────────────────────────────────────

describe('buildTowerPressuresView — empty', () => {
  it('returns isEmpty + emptyHint when no initiatives', () => {
    const v = buildTowerPressuresView([], [], TODAY);
    expect(v.isEmpty).toBe(true);
    expect(v.cards).toHaveLength(0);
    expect(v.emptyHint).toMatch(/Setup → AI Initiatives/);
  });

  it('returns isEmpty when all initiatives are healthy/foundation', () => {
    const i = [makeInitiative({ statusFlag: 'healthy' }), makeInitiative({ statusFlag: 'foundation_phase' })];
    const v = buildTowerPressuresView(i, [], TODAY);
    expect(v.isEmpty).toBe(true);
    expect(v.emptyHint).toMatch(/healthy or in foundation phase/);
  });
});

describe('buildTowerPressuresView — Meridian fixture', () => {
  it('returns 3 cards for Meridian (MH-03 dup, MH-04 value, MH-06 value); no vendor pressures', () => {
    const v = buildTowerPressuresView(MERIDIAN, [], TODAY);
    expect(v.cards).toHaveLength(3);
    expect(v.totalActive).toBe(3);
  });

  it('cards sort: cost > dupl > value > adopt; vend tops the list when present', () => {
    const v = buildTowerPressuresView(MERIDIAN, [], TODAY);
    expect(v.cards[0]!.type).toBe('dupl'); // MH-03
    expect(v.cards[1]!.type).toBe('value'); // MH-04 or MH-06
    expect(v.cards[2]!.type).toBe('value');
  });

  it('demandingDecisions counts cost + vend + HIGH-confidence pressures', () => {
    const v = buildTowerPressuresView(MERIDIAN, [], TODAY);
    // MH-04 has HIGH confidence → counts. MH-03 LOW, MH-06 MED → don't count. No cost/vend.
    expect(v.demandingDecisions).toBe(1);
  });

  it('section headline anchors on vendor renewal when one is in window', () => {
    const vendors: AIInitiativeVendorRow[] = [
      makeVendor({ initiativeDisplayId: 'MH-04', initiativeName: 'Epic AI for Revenue Cycle', vendorName: 'Epic Systems', renewalDate: '2026-06-15', contractValueUsd: 2_600_000 }),
    ];
    const v = buildTowerPressuresView(MERIDIAN, vendors, TODAY);
    expect(v.sectionHeadline).toMatch(/Epic Systems renewal closes/);
    expect(v.cards[0]!.type).toBe('vend');
  });

  it('section headline is generic posture sentence when no vendor renewal in window', () => {
    const v = buildTowerPressuresView(MERIDIAN, [], TODAY);
    expect(v.sectionHeadline).toMatch(/CFO posture this week/);
  });

  it('MH-03 dup_risk card composes name + statusSummary + committed amount', () => {
    const v = buildTowerPressuresView(MERIDIAN, [], TODAY);
    const card = v.cards.find((c) => c.id.includes('MH-03'))!;
    expect(card.type).toBe('dupl');
    expect(card.label).toBe('Capability\nDuplication');
    expect(card.headline).toMatch(/Autonomous Helpdesk via ServiceNow overlaps/);
    expect(card.lede).toMatch(/Overlap with M365 Copilot deflection/);
    // $900K formatted compact (under $1M threshold).
    expect(card.magnitudeValue).toBe('$900');
    expect(card.magnitudeUnit).toBe('K');
  });

  it('MH-06 value_lag card shows committed/measured + realization gap magnitude', () => {
    const v = buildTowerPressuresView(MERIDIAN, [], TODAY);
    const card = v.cards.find((c) => c.id.includes('MH-06'))!;
    expect(card.type).toBe('value');
    expect(card.label).toBe('Value\nLag');
    expect(card.lede).toMatch(/Committed \$3\.2M annual; measured \$1\.4M/);
    // gap = 3.2 - 1.4 = 1.8M
    expect(card.magnitudeValue).toBe('$1.8');
    expect(card.magnitudeUnit).toBe('M');
  });

  it('Each card carries 3 meta rows (Initiative, Owner, Confidence) for substrate-derived cards', () => {
    const v = buildTowerPressuresView(MERIDIAN, [], TODAY);
    for (const card of v.cards) {
      expect(card.meta).toHaveLength(3);
    }
  });

  it('Card displayId matches the underlying initiative', () => {
    const v = buildTowerPressuresView(MERIDIAN, [], TODAY);
    const ids = v.cards.map((c) => c.displayId).sort();
    expect(ids).toEqual(['MH-03', 'MH-04', 'MH-06']);
  });
});

describe('buildTowerPressuresView — vendor pressures', () => {
  it('synthesizes a vendor card per renewal in the next 90 days', () => {
    const vendors: AIInitiativeVendorRow[] = [
      makeVendor({ initiativeDisplayId: 'MH-X', vendorName: 'Vendor A', renewalDate: '2026-06-01', contractValueUsd: 1_200_000 }),
      makeVendor({ initiativeDisplayId: 'MH-Y', vendorName: 'Vendor B', renewalDate: '2026-07-15', contractValueUsd: 800_000 }),
    ];
    const v = buildTowerPressuresView(MERIDIAN, vendors, TODAY);
    const vendorCards = v.cards.filter((c) => c.type === 'vend');
    expect(vendorCards).toHaveLength(2);
    expect(vendorCards[0]!.headline).toMatch(/Vendor A renewal closes in 25 days/);
  });

  it('skips vendors with renewal date past the 90-day window', () => {
    const vendors: AIInitiativeVendorRow[] = [
      makeVendor({ renewalDate: '2027-01-01', vendorName: 'Far Vendor' }),
    ];
    const v = buildTowerPressuresView(MERIDIAN, vendors, TODAY);
    expect(v.cards.find((c) => c.type === 'vend')).toBeUndefined();
  });

  it('skips vendors with renewal date in the past', () => {
    const vendors: AIInitiativeVendorRow[] = [
      makeVendor({ renewalDate: '2026-04-01', vendorName: 'Past Vendor' }),
    ];
    const v = buildTowerPressuresView(MERIDIAN, vendors, TODAY);
    expect(v.cards.find((c) => c.type === 'vend')).toBeUndefined();
  });

  it('vendor cards always carry HIGH magnitudeConfidence (deadline-driven)', () => {
    const vendors: AIInitiativeVendorRow[] = [
      makeVendor({ renewalDate: '2026-06-01' }),
    ];
    const v = buildTowerPressuresView(MERIDIAN, vendors, TODAY);
    const vendorCard = v.cards.find((c) => c.type === 'vend');
    expect(vendorCard?.magnitudeConfidence).toBe('high');
  });
});

describe('buildTowerPressuresView — purity', () => {
  it('same input yields identical output', () => {
    const a = buildTowerPressuresView(MERIDIAN, [], TODAY);
    const b = buildTowerPressuresView(MERIDIAN, [], TODAY);
    expect(a).toEqual(b);
  });

  it('deterministicSeed flag is true', () => {
    const v = buildTowerPressuresView(MERIDIAN, [], TODAY);
    expect(v.deterministicSeed).toBe(true);
  });
});
