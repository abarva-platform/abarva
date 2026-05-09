import {
  TOWER_DEFAULT_DEMO_TODAY,
  resolveTowerToday,
} from '@/lib/tower/today-resolution';
import { buildTowerBandMetrics } from '@/lib/tower/band-metrics-view';
import { buildTowerPressuresView } from '@/lib/tower/pressure-cards-view';
import { buildTowerAtlasObservationsView } from '@/lib/tower/atlas-observations-view';
import type {
  AIInitiative,
  AIInitiativeVendorRow,
} from '@/lib/admin/ai-initiatives/queries';

function makeInitiative(overrides: Partial<AIInitiative>): AIInitiative {
  return {
    initiativeId: 'init-apex-1',
    displayId: 'AR-01',
    name: 'Apex Loyalty Copilot',
    description: '',
    primaryCategoryId: 'category',
    primaryCategoryName: 'Category',
    secondaryCategoryId: null,
    secondaryCategoryName: null,
    primaryGoalId: 'goal',
    primaryGoalName: 'Goal',
    stage: 'pilot',
    stageDetail: null,
    ownerName: 'Avery Stone',
    ownerTitle: 'VP Customer',
    ownerFunction: 'Customer',
    committedAnnualUsd: 1_000_000,
    committedTotalUsd: null,
    measuredValueUsd: 250_000,
    statusFlag: 'value_lag',
    statusSummary: 'Value evidence trails committed spend.',
    confidenceLevel: 'HIGH',
    alignedCallout: false,
    alignedRationale: null,
    loadedViaTemplate: 'fixture',
    ...overrides,
  };
}

function makeVendor(overrides: Partial<AIInitiativeVendorRow>): AIInitiativeVendorRow {
  return {
    vendorId: 'vendor-apex-1',
    initiativeId: 'init-apex-1',
    initiativeDisplayId: 'AR-01',
    initiativeName: 'Apex Loyalty Copilot',
    vendorName: 'Pilot Vendor',
    contractValueUsd: 1_200_000,
    renewalDate: null,
    financialHealth: null,
    ...overrides,
  };
}

const INITIATIVES: ReadonlyArray<AIInitiative> = [
  makeInitiative({}),
  makeInitiative({
    initiativeId: 'init-apex-2',
    displayId: 'AR-02',
    name: 'Apex Store Forecasting',
    stage: 'scaled',
    statusFlag: 'healthy',
    measuredValueUsd: 1_600_000,
  }),
];

const VENDORS: ReadonlyArray<AIInitiativeVendorRow> = [
  makeVendor({
    renewalDate: '2026-08-10',
  }),
];

describe('resolveTowerToday', () => {
  it('prefers a valid TOWER_DEMO_TODAY override', () => {
    expect(resolveTowerToday({ TOWER_DEMO_TODAY: '2026-05-14' })).toBe('2026-05-14');
  });

  it('falls back to the pilot-week demo date when unset', () => {
    expect(resolveTowerToday({})).toBe(TOWER_DEFAULT_DEMO_TODAY);
    expect(TOWER_DEFAULT_DEMO_TODAY).toBe('2026-05-12');
  });

  it('falls back when the override is not YYYY-MM-DD', () => {
    expect(resolveTowerToday({ TOWER_DEMO_TODAY: 'pilot-week' })).toBe(TOWER_DEFAULT_DEMO_TODAY);
  });
});

describe('Tower today resolution wiring', () => {
  it('lets band, pressure, and Atlas observation view-models share one resolved todayIso', () => {
    const todayIso = resolveTowerToday({ TOWER_DEMO_TODAY: '2026-05-12' });
    const bandMetrics = buildTowerBandMetrics(INITIATIVES, VENDORS, todayIso);
    const pressuresView = buildTowerPressuresView(INITIATIVES, VENDORS, todayIso);
    const atlasObservations = buildTowerAtlasObservationsView(
      INITIATIVES,
      VENDORS,
      pressuresView,
      todayIso,
    );

    const renewals = bandMetrics.metrics.find((m) => m.key === 'renewals_90d')!;
    const vendorPressure = pressuresView.cards.find((card) => card.type === 'vend')!;

    expect(todayIso).toBe('2026-05-12');
    expect(renewals.value).toBe('1');
    expect(renewals.subtext).toContain('AR-01 90d');
    expect(vendorPressure.magnitudeValue).toBe('90');
    expect(atlasObservations.observations[0]?.topic).toBe('Vendor clock');
  });
});
