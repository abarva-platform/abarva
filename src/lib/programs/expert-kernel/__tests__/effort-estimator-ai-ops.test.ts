import { buildAssumptionLedger } from '../assumption-ledger';
import { buildBaselineModel } from '../baseline-model';
import { compileBusinessCase } from '../business-case-compiler';
import {
  buildEffortEstimate,
  type WorkstreamInput,
} from '../effort-estimator';
import type { AiOperatingCostInput } from '../ai-ops-cost';
import { rangeOf } from '../types';
import { buildValueForecast } from '../value-forecast';
import type { RoleRateCard } from '@/lib/source/should-cost/should-cost-model';

const RATE_CARD: RoleRateCard[] = [
  {
    role: 'solution_architect',
    onshoreAnnualRate: 240_000,
    offshoreAnnualRate: 130_000,
  },
  {
    role: 'senior_engineer',
    onshoreAnnualRate: 200_000,
    offshoreAnnualRate: 95_000,
  },
  { role: 'engineer', onshoreAnnualRate: 150_000, offshoreAnnualRate: 70_000 },
  { role: 'analyst', onshoreAnnualRate: 120_000, offshoreAnnualRate: 60_000 },
  {
    role: 'project_manager',
    onshoreAnnualRate: 170_000,
    offshoreAnnualRate: 90_000,
  },
];

const WORKSTREAMS: WorkstreamInput[] = [
  {
    id: 'ai_build',
    durationMonths: 6,
    agentSplit: 0.3,
    roleMix: [{ role: 'engineer', headcount: 2 }],
  },
  {
    id: 'change_adoption',
    durationMonths: 6,
    agentSplit: 0.1,
    roleMix: [{ role: 'analyst', headcount: 1 }],
  },
];

const AI_OPS: AiOperatingCostInput = {
  callRamp: { y1: 250_000, y2: 600_000, y3: 1_200_000, y4: 1_500_000, y5: 1_800_000 },
  tokensPerCall: { input: 2_000, output: 700, cacheHitRate: 0.2 },
  modelTier: 'cost_optimized',
  modelTierRamp: [{ year: 3, tier: 'mid', reasonCode: 'quality_upgrade' }],
  pricingTiers: [
    {
      thresholdCallsPerMonth: 80_000,
      discount: 0,
      notes: 'pricing-tier lock needed before scale',
    },
  ],
  decisionUnit: 'resolved ticket',
  decisionsPerCall: 1,
};

function buildEffort(aiOps?: AiOperatingCostInput) {
  return buildEffortEstimate({
    moveName: 'Apex Store Labor AI',
    rateCard: RATE_CARD,
    offshoreRatio: 0.4,
    workstreams: WORKSTREAMS,
    aiOps,
  });
}

describe('buildEffortEstimate — AI ops cost axis', () => {
  it('preserves the legacy effort shape when AI ops is omitted', () => {
    const effort = buildEffort();

    expect(effort.aiOpsCost).toBeNull();
    expect(effort.buildVsChange.aiOpsCost).toBe(0);
    expect(effort.totalCost.point).toBeGreaterThan(0);
  });

  it('adds AI ops as a third axis without changing labor effort', () => {
    const withoutOps = buildEffort();
    const withOps = buildEffort(AI_OPS);

    expect(withOps.totalCost).toEqual(withoutOps.totalCost);
    expect(withOps.buildVsChange.aiBuildCost).toBe(
      withoutOps.buildVsChange.aiBuildCost,
    );
    expect(withOps.buildVsChange.businessChangeCost).toBe(
      withoutOps.buildVsChange.businessChangeCost,
    );
    expect(withOps.aiOpsCost).not.toBeNull();
    expect(withOps.aiOpsCost!.threeYearTotal).toBeGreaterThan(0);
    expect(withOps.buildVsChange.aiOpsCost).toBe(
      withOps.aiOpsCost!.threeYearTotal,
    );
    expect(withOps.aiOpsCost!.unitEconomic.decisionUnit).toBe('resolved ticket');
    expect(withOps.aiOpsCost!.modelTierDriftWarning).toContain('quality_upgrade');
  });
});

describe('compileBusinessCase — AI ops investment math', () => {
  it('adds modeled AI ops cost to investment, net return, and payback', () => {
    const effort = buildEffort(AI_OPS);
    const baseline = buildBaselineModel({
      moveName: 'Apex Store Labor AI',
      tenantKey: 'apexretail',
      metrics: [
        {
          key: 'labor_overage',
          label: 'Labor overage',
          value: 4.5,
          unit: '% of scheduled hours',
          source: 'Workforce ledger',
          sourceQuality: 'measured',
          asOf: '2026-05-01',
          confidence: 'high',
        },
      ],
    });
    const assumptions = buildAssumptionLedger([
      {
        key: 'adoption_curve',
        statement: 'Store managers adopt guided scheduling recommendations.',
        owner: 'Store operations',
        confidence: 'medium',
        source: 'Apex pilot plan',
        sensitivityImpact: 'high',
      },
    ]);
    const value = buildValueForecast({
      moveName: 'Apex Store Labor AI',
      grossAnnualValue: rangeOf(2_000_000, 3_000_000),
      horizonYears: 3,
      adoptionCurve: [0.4, 0.8, 1],
      haircutScores: {
        adoptionRisk: 0.7,
        dataReadiness: 0.8,
        processDependency: 0.7,
        integrationComplexity: 0.8,
        controlBurden: 0.8,
        sponsorStrength: 0.8,
      },
    });

    const skeleton = compileBusinessCase({
      baseline,
      assumptions,
      effort,
      value,
      towerHandoff: [
        {
          metricKey: 'labor_overage',
          metricLabel: 'Labor overage',
          baselineValue: 4.5,
          targetValue: 3.2,
          unit: '% of scheduled hours',
          readinessNote: 'Measured in Workforce ledger.',
        },
      ],
    });

    expect(skeleton.aiOpsCost).toBe(effort.aiOpsCost);
    expect(skeleton.economics.investment.point).toBeCloseTo(
      effort.totalCost.point + effort.aiOpsCost!.threeYearTotal,
      2,
    );
    expect(skeleton.economics.netReturn.point).toBeCloseTo(
      skeleton.valueRange.point - skeleton.economics.investment.point,
      2,
    );
    expect(skeleton.economics.paybackMonths).toBeGreaterThan(0);
  });
});
