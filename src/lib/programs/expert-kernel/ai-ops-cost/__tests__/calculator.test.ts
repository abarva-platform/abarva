import {
  calculateEmbeddingUsd,
  calculateEvalUsd,
  calculateInferenceUsd,
  estimateAiOperatingCost,
} from '../calculator';
import { DEFAULT_QUERY_TOKENS_PER_EMBEDDING_QUERY } from '../embedding-cost-catalog';
import { EVAL_COST_DEFAULTS } from '../eval-cost-catalog';
import {
  DEFAULT_MODEL_COST_CATALOG,
  GOOGLE_MODEL_COSTS,
  OPENAI_MODEL_COSTS,
} from '../model-cost-catalog';
import type { AiOperatingCostInput, AiOpsCatalog } from '../types';

const baseInput: AiOperatingCostInput = {
  callRamp: {
    y1: 1_000_000,
    y2: 2_000_000,
    y3: 3_000_000,
    y4: 4_000_000,
    y5: 5_000_000,
  },
  tokensPerCall: {
    input: 1_000,
    output: 200,
  },
  modelTier: 'mid',
};

describe('AI operating cost calculator', () => {
  it('prices inference with input and output tokens per year', () => {
    const lookup = DEFAULT_MODEL_COST_CATALOG.lookups.mid;
    const cost = calculateInferenceUsd(baseInput, lookup, 1_000_000);

    expect(cost).toBe(6_000);
  });

  it('applies cache-hit input pricing to the hit fraction', () => {
    const lookup = DEFAULT_MODEL_COST_CATALOG.lookups.mid;
    const cost = calculateInferenceUsd(
      {
        ...baseInput,
        tokensPerCall: { input: 1_000, output: 200, cacheHitRate: 0.5 },
      },
      lookup,
      1_000_000,
    );

    expect(cost).toBe(4_650);
  });

  it('prices embedding refresh plus query embeddings with the documented query-token default', () => {
    const cost = calculateEmbeddingUsd(
      {
        ...baseInput,
        embedding: {
          documents: 10_000,
          tokensPerDoc: 800,
          refreshPerYear: 2,
          queriesPerYear: { y1: 500_000, y2: 0, y3: 0 },
          embeddingTier: 'cost_optimized',
        },
      },
      1,
    );

    const expectedTokens =
      10_000 * 800 * 2 + 500_000 * DEFAULT_QUERY_TOKENS_PER_EMBEDDING_QUERY;
    expect(cost).toBeCloseTo((expectedTokens / 1_000_000) * 0.15, 6);
  });

  it('prices eval as LLM-judge output tokens plus human-rater hours', () => {
    const cost = calculateEvalUsd(
      {
        ...baseInput,
        eval: {
          llmJudgeCallsPerYear: { y1: 10_000, y2: 0, y3: 0 },
          llmJudgeTier: 'cost_optimized',
          humanRaterHoursPerYear: { y1: 100, y2: 0, y3: 0 },
          humanRaterRateUsd: 85,
        },
      },
      DEFAULT_MODEL_COST_CATALOG,
      1,
    );

    expect(cost).toBe(
      100 * 85 +
        (10_000 *
          EVAL_COST_DEFAULTS.defaultLlmJudgeOutputTokens *
          DEFAULT_MODEL_COST_CATALOG.lookups.cost_optimized.outputPerMTokUsd) /
          1_000_000,
    );
  });

  it('surfaces pricing-tier breaches by projected monthly call volume', () => {
    const estimate = estimateAiOperatingCost({
      ...baseInput,
      pricingTiers: [
        {
          thresholdCallsPerMonth: 100_000,
          discount: 0,
          notes: 'contracted Tier 1 ceiling',
        },
      ],
    });

    expect(estimate.perYear[1].tierBreachWarnings[0]).toContain('Year 2');
    expect(estimate.pricingTierShockWarning).toContain('pricing threshold');
  });

  it('surfaces model-tier drift when a ramp upgrades to a more expensive tier', () => {
    const estimate = estimateAiOperatingCost({
      ...baseInput,
      modelTier: 'cost_optimized',
      modelTierRamp: [
        { year: 3, tier: 'frontier', reasonCode: 'quality escalation' },
      ],
    });

    expect(estimate.modelTierDriftWarning).toContain(
      'cost_optimized to frontier',
    );
    expect(estimate.perYear[2].inferenceUsd).toBeGreaterThan(
      estimate.perYear[0].inferenceUsd,
    );
  });

  it('uses the active tier ladder for each year and computes three- and five-year totals', () => {
    const estimate = estimateAiOperatingCost({
      ...baseInput,
      modelTier: 'cost_optimized',
      modelTierRamp: [{ year: 2, tier: 'mid', reasonCode: 'quality floor' }],
      decisionUnit: 'resolved ticket',
      decisionsPerCall: 0.5,
    });

    expect(estimate.perYear).toHaveLength(5);
    expect(estimate.threeYearTotal).toBe(
      estimate.perYear[0].totalUsd +
        estimate.perYear[1].totalUsd +
        estimate.perYear[2].totalUsd,
    );
    expect(estimate.fiveYearTotal).toBe(
      estimate.perYear.reduce((sum, row) => sum + row.totalUsd, 0),
    );
    expect(estimate.unitEconomic.decisionUnit).toBe('resolved ticket');
    expect(estimate.unitEconomic.costPerDecisionUsd).toBeGreaterThan(0);
  });

  it('accepts alternate provider catalogs for worked examples per tier ladder', () => {
    const googleCatalog: AiOpsCatalog = {
      catalogVersion: 'google-test',
      asOf: '2026-05-31',
      lookups: GOOGLE_MODEL_COSTS,
    };
    const openAiCatalog: AiOpsCatalog = {
      catalogVersion: 'openai-test',
      asOf: '2026-05-31',
      lookups: OPENAI_MODEL_COSTS,
    };

    expect(estimateAiOperatingCost(baseInput, googleCatalog).fiveYearTotal).toBeGreaterThan(0);
    expect(estimateAiOperatingCost(baseInput, openAiCatalog).fiveYearTotal).toBeGreaterThan(0);
  });

  it('keeps optional fine-tune costs at zero when the selected rate card has no public fine-tune rate', () => {
    const estimate = estimateAiOperatingCost({
      ...baseInput,
      fineTune: { examples: 5_000, runs: 2, tier: 'mid' },
    });

    expect(estimate.perYear[0].fineTuneUsd).toBe(0);
  });

  it('rejects impossible cache hit rates', () => {
    expect(() =>
      estimateAiOperatingCost({
        ...baseInput,
        tokensPerCall: { input: 1_000, output: 200, cacheHitRate: 1.5 },
      }),
    ).toThrow('cacheHitRate');
  });
});
