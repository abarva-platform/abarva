import {
  buildMoveBusinessCase,
  type MoveBusinessCaseInput,
} from '../../move-business-case';
import { CHARTER_FUNCTION_PACK_KEY } from '../../function-identity';
import type { AiOperatingCostInput } from '../ai-ops-cost';

const STORE_LABOR_AI_OPS: AiOperatingCostInput = {
  callRamp: { y1: 300_000, y2: 900_000, y3: 1_500_000, y4: 1_900_000, y5: 2_200_000 },
  tokensPerCall: { input: 1_800, output: 600, cacheHitRate: 0.25 },
  modelTier: 'cost_optimized',
  modelTierRamp: [{ year: 3, tier: 'mid', reasonCode: 'schedule_quality' }],
  embedding: {
    documents: 12_000,
    tokensPerDoc: 900,
    refreshPerYear: 4,
    queriesPerYear: { y1: 300_000, y2: 900_000, y3: 1_500_000 },
    embeddingTier: 'cost_optimized',
  },
  eval: {
    llmJudgeCallsPerYear: { y1: 20_000, y2: 40_000, y3: 70_000 },
    llmJudgeTier: 'cost_optimized',
    humanRaterHoursPerYear: { y1: 120, y2: 180, y3: 240 },
    humanRaterRateUsd: 95,
  },
  pricingTiers: [
    {
      thresholdCallsPerMonth: 100_000,
      discount: 0,
      notes: 'requires pricing-tier lock before network-wide rollout',
    },
  ],
  decisionUnit: 'scheduled store-week',
  decisionsPerCall: 1,
};

describe('buildMoveBusinessCase — AI ops pass-through', () => {
  it('threads Move-supplied AI operating cost into the expert-kernel skeleton', () => {
    const move: MoveBusinessCaseInput = {
      name: 'Apex Store Labor AI',
      industry_code: 'RETAIL',
      charter: { [CHARTER_FUNCTION_PACK_KEY]: 'workforce_labor' },
      baseline_metrics: [
        {
          metric_name: 'Labor cost as % of sales',
          value: 12.8,
          unit: '%',
          source: 'Apex labor ledger',
          as_of: '2026-05-01',
        },
      ],
      aiOperatingCost: STORE_LABOR_AI_OPS,
    };

    const result = buildMoveBusinessCase(move);

    expect(result.bound).toBe(true);
    const skeleton = result.skeleton!;
    expect(skeleton.aiOpsCost).not.toBeNull();
    expect(skeleton.effort.aiOpsCost).toBe(skeleton.aiOpsCost);
    expect(skeleton.effort.buildVsChange.aiOpsCost).toBe(
      skeleton.aiOpsCost!.threeYearTotal,
    );
    expect(skeleton.aiOpsCost!.unitEconomic.decisionUnit).toBe(
      'scheduled store-week',
    );
    expect(skeleton.aiOpsCost!.pricingTierShockWarning).toContain('Year');
    expect(skeleton.economics.investment.point).toBeGreaterThan(
      skeleton.effort.totalCost.point,
    );
  });

  it('keeps originated Moves backward compatible when AI ops is absent', () => {
    const move: MoveBusinessCaseInput = {
      name: 'Meridian Ambient Documentation',
      industry_code: 'HEALTHCARE_IDN',
      charter: {
        [CHARTER_FUNCTION_PACK_KEY]: 'clinical_operations_documentation',
      },
      baseline_metrics: [
        {
          metric_name: 'Clinician after-hours documentation time',
          value: 6.4,
          unit: 'hours per clinician per week',
          source: 'Meridian EHR time study',
          as_of: '2026-05-01',
        },
      ],
    };

    const result = buildMoveBusinessCase(move);

    expect(result.bound).toBe(true);
    expect(result.skeleton!.aiOpsCost).toBeNull();
    expect(result.skeleton!.effort.aiOpsCost).toBeNull();
    expect(result.skeleton!.effort.buildVsChange.aiOpsCost).toBe(0);
  });
});
