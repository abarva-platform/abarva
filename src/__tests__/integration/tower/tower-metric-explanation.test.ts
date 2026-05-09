import type { AIInitiative, AIInitiativeVendorRow } from '@/lib/admin/ai-initiatives/queries';
import { buildTowerBandMetrics } from '@/lib/tower/band-metrics-view';
import { buildMetricExplanation, renderMetricExplanationForAtlas } from '@/lib/tower/metric-explanation-view';

function initiative(partial: Partial<AIInitiative> & Pick<AIInitiative, 'initiativeId' | 'displayId' | 'name'>): AIInitiative {
  return {
    initiativeId: partial.initiativeId,
    displayId: partial.displayId,
    name: partial.name,
    description: partial.description ?? `${partial.name} description`,
    primaryCategoryId: partial.primaryCategoryId ?? 'CAT-01',
    primaryCategoryName: partial.primaryCategoryName ?? 'Productivity',
    secondaryCategoryId: partial.secondaryCategoryId ?? null,
    secondaryCategoryName: partial.secondaryCategoryName ?? null,
    primaryGoalId: partial.primaryGoalId ?? 'GOAL-01',
    primaryGoalName: partial.primaryGoalName ?? 'Margin',
    stage: partial.stage ?? 'pilot',
    stageDetail: partial.stageDetail ?? null,
    ownerName: partial.ownerName ?? 'Owner',
    ownerTitle: partial.ownerTitle ?? 'VP',
    ownerFunction: partial.ownerFunction ?? 'IT',
    committedAnnualUsd: partial.committedAnnualUsd ?? 1_000_000,
    committedTotalUsd: partial.committedTotalUsd ?? 1_000_000,
    measuredValueUsd: partial.measuredValueUsd ?? 0,
    statusFlag: partial.statusFlag ?? 'healthy',
    statusSummary: partial.statusSummary ?? 'On track',
    confidenceLevel: partial.confidenceLevel ?? 'HIGH',
    alignedCallout: partial.alignedCallout ?? false,
    alignedRationale: partial.alignedRationale ?? null,
    loadedViaTemplate: partial.loadedViaTemplate ?? 'test/full_load.json',
  };
}

function vendor(partial: Partial<AIInitiativeVendorRow> & Pick<AIInitiativeVendorRow, 'vendorId' | 'initiativeId' | 'vendorName'>): AIInitiativeVendorRow {
  return {
    vendorId: partial.vendorId,
    initiativeId: partial.initiativeId,
    initiativeDisplayId: partial.initiativeDisplayId ?? partial.initiativeId,
    initiativeName: partial.initiativeName ?? partial.initiativeId,
    vendorName: partial.vendorName,
    contractValueUsd: partial.contractValueUsd ?? 500_000,
    renewalDate: partial.renewalDate ?? null,
    financialHealth: partial.financialHealth ?? 'strong',
  };
}

const TODAY = '2026-05-12';

describe('buildMetricExplanation', () => {
  it('explains adoption as a stage proxy with inputs, exclusions, levers, and low confidence', () => {
    const initiatives = [
      initiative({ initiativeId: 'i1', displayId: 'MH-01', name: 'Clinical Copilot', stage: 'scaled' }),
      initiative({ initiativeId: 'i2', displayId: 'MH-03', name: 'Helpdesk AI', stage: 'pilot', confidenceLevel: 'LOW' }),
      initiative({ initiativeId: 'i3', displayId: 'MH-05', name: 'Risk ML', stage: 'scaled' }),
      initiative({ initiativeId: 'i4', displayId: 'MH-06', name: 'Finance Agent', stage: 'pilot' }),
      initiative({ initiativeId: 'i5', displayId: 'MH-07', name: 'Model Governance', stage: 'multi_year_strategic_bet', statusFlag: 'foundation_phase' }),
    ];
    const bandMetrics = buildTowerBandMetrics(initiatives, [], TODAY, 'adopt');

    const explanation = buildMetricExplanation({
      metricKey: 'adoption_rate',
      todayIso: TODAY,
      initiatives,
      vendors: [],
      bandMetrics,
    });

    expect(explanation.displayValue).toBe('50%');
    expect(explanation.displayConfidence).toBe('low');
    expect(explanation.composition.inputs).toHaveLength(4);
    expect(explanation.composition.excluded).toEqual([
      expect.objectContaining({ displayId: 'MH-07', reason: 'foundation_phase excluded from denominator' }),
    ]);
    expect(explanation.contributors.some((item) => item.displayId === 'MH-03' && item.pulling === 'down')).toBe(true);
    expect(explanation.levers.map((lever) => lever.action)).toContain('Scale MH-03 from pilot to scaled');
    expect(explanation.confidenceFloor.level).toBe('LOW');
    expect(explanation.citations.some((citation) => citation.field === 'tower_view.band_metrics.adoption_rate.eligible_count')).toBe(true);
  });

  it('explains renewals inside and outside the 90-day window', () => {
    const initiatives = [initiative({ initiativeId: 'i1', displayId: 'APX-01', name: 'Contact Center' })];
    const vendors = [
      vendor({ vendorId: 'v1', initiativeId: 'i1', initiativeDisplayId: 'APX-01', vendorName: 'Microsoft', renewalDate: '2026-06-28', contractValueUsd: 1_500_000 }),
      vendor({ vendorId: 'v2', initiativeId: 'i1', initiativeDisplayId: 'APX-01', vendorName: 'SAP', renewalDate: '2026-12-31', contractValueUsd: 3_000_000 }),
    ];
    const bandMetrics = buildTowerBandMetrics(initiatives, vendors, TODAY, 'contract');

    const explanation = buildMetricExplanation({
      metricKey: 'renewals_90d',
      todayIso: TODAY,
      initiatives,
      vendors,
      bandMetrics,
    });

    expect(explanation.displayValue).toBe('1');
    expect(explanation.composition.inputs).toEqual([
      expect.objectContaining({ name: 'Microsoft', contribution: expect.stringContaining('47 days out') }),
    ]);
    expect(explanation.composition.excluded).toEqual([
      expect.objectContaining({ name: 'SAP', reason: expect.stringContaining('outside 90-day window') }),
    ]);
    expect(explanation.levers[0]).toEqual(expect.objectContaining({ owner: 'Source' }));
    expect(renderMetricExplanationForAtlas(explanation)).toContain('What would move it:');
  });
});
