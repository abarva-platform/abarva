import {
  DEFAULT_QUERY_TOKENS_PER_EMBEDDING_QUERY,
  EMBEDDING_COST_CATALOG,
} from './embedding-cost-catalog';
import { EVAL_COST_DEFAULTS } from './eval-cost-catalog';
import {
  DEFAULT_MODEL_COST_CATALOG,
  MODEL_COST_CATALOG_AS_OF,
  MODEL_COST_CATALOG_VERSION,
} from './model-cost-catalog';
import type {
  AiOperatingCostInput,
  AiOpsCatalog,
  AiOpsCostEstimate,
  ModelCostLookup,
  ModelTier,
} from './types';

const YEARS = [1, 2, 3, 4, 5] as const;
const TIER_ORDER: Record<ModelTier, number> = {
  on_prem_oss: 0,
  cost_optimized: 1,
  mid: 2,
  frontier: 3,
};

export function estimateAiOperatingCost(
  input: AiOperatingCostInput,
  catalog: AiOpsCatalog = DEFAULT_MODEL_COST_CATALOG,
): AiOpsCostEstimate {
  validateInput(input, catalog);

  const sortedTierRamp = [...(input.modelTierRamp ?? [])].sort(
    (a, b) => a.year - b.year,
  );

  const perYear = YEARS.map((year) => {
    const calls = callsForYear(input, year);
    const tier = tierForYear(input.modelTier, sortedTierRamp, year);
    const lookup = catalog.lookups[tier];
    const inferenceUsd = round2(calculateInferenceUsd(input, lookup, calls));
    const embeddingUsd = round2(calculateEmbeddingUsd(input, year));
    const evalUsd = round2(calculateEvalUsd(input, catalog, year));
    const fineTuneUsd = year === 1 ? round2(calculateFineTuneUsd(input, catalog)) : 0;
    const tierBreachWarnings = tierBreachWarningsForYear(input, year, calls);

    return {
      year,
      inferenceUsd,
      embeddingUsd,
      evalUsd,
      fineTuneUsd,
      totalUsd: round2(inferenceUsd + embeddingUsd + evalUsd + fineTuneUsd),
      tierBreachWarnings,
    };
  });

  const threeYearTotal = round2(
    perYear.slice(0, 3).reduce((sum, row) => sum + row.totalUsd, 0),
  );
  const fiveYearTotal = round2(
    perYear.reduce((sum, row) => sum + row.totalUsd, 0),
  );
  const totalCalls = YEARS.reduce(
    (sum, year) => sum + callsForYear(input, year),
    0,
  );
  const costPerCallUsd = totalCalls > 0 ? round4(fiveYearTotal / totalCalls) : 0;
  const unitEconomic: AiOpsCostEstimate['unitEconomic'] = {
    costPerCallUsd,
  };
  if (input.decisionUnit && input.decisionsPerCall && input.decisionsPerCall > 0) {
    unitEconomic.decisionUnit = input.decisionUnit;
    unitEconomic.costPerDecisionUsd = round4(
      costPerCallUsd / input.decisionsPerCall,
    );
  }

  const allTierWarnings = perYear.flatMap((row) => row.tierBreachWarnings);

  return {
    perYear,
    threeYearTotal,
    fiveYearTotal,
    unitEconomic,
    pricingTierShockWarning:
      allTierWarnings.length > 0 ? allTierWarnings[0] : null,
    modelTierDriftWarning: modelTierDriftWarning(input, catalog, sortedTierRamp),
    rateCard: {
      catalogVersion: catalog.catalogVersion || MODEL_COST_CATALOG_VERSION,
      asOf: catalog.asOf || MODEL_COST_CATALOG_AS_OF,
    },
  };
}

export function calculateInferenceUsd(
  input: AiOperatingCostInput,
  lookup: ModelCostLookup,
  calls: number,
): number {
  const cacheHitRate = input.tokensPerCall.cacheHitRate ?? 0;
  const uncachedInputTokens = input.tokensPerCall.input * (1 - cacheHitRate);
  const cachedInputTokens = input.tokensPerCall.input * cacheHitRate;
  const inputUsd =
    ((calls * uncachedInputTokens) / 1_000_000) * lookup.inputPerMTokUsd;
  const cacheReadUsd =
    ((calls * cachedInputTokens) / 1_000_000) * lookup.cacheReadPerMTokUsd;
  const outputUsd =
    ((calls * input.tokensPerCall.output) / 1_000_000) *
    lookup.outputPerMTokUsd;
  return inputUsd + cacheReadUsd + outputUsd;
}

export function calculateEmbeddingUsd(
  input: AiOperatingCostInput,
  year: number,
): number {
  if (!input.embedding) return 0;
  const lookup = EMBEDDING_COST_CATALOG[input.embedding.embeddingTier];
  const refreshTokens =
    input.embedding.documents *
    input.embedding.tokensPerDoc *
    input.embedding.refreshPerYear;
  const queryTokens =
    queriesForYear(input.embedding.queriesPerYear, year) *
    DEFAULT_QUERY_TOKENS_PER_EMBEDDING_QUERY;
  return ((refreshTokens + queryTokens) / 1_000_000) * lookup.inputPerMTokUsd;
}

export function calculateEvalUsd(
  input: AiOperatingCostInput,
  catalog: AiOpsCatalog,
  year: number,
): number {
  if (!input.eval) return 0;
  const lookup = catalog.lookups[input.eval.llmJudgeTier];
  const judgeCalls = evalCallsForYear(input.eval.llmJudgeCallsPerYear, year);
  const judgeUsd =
    ((judgeCalls * EVAL_COST_DEFAULTS.defaultLlmJudgeOutputTokens) /
      1_000_000) *
    lookup.outputPerMTokUsd;
  const humanUsd =
    evalCallsForYear(input.eval.humanRaterHoursPerYear, year) *
    input.eval.humanRaterRateUsd;
  return judgeUsd + humanUsd;
}

export function calculateFineTuneUsd(
  input: AiOperatingCostInput,
  catalog: AiOpsCatalog,
): number {
  if (!input.fineTune) return 0;
  const lookup = catalog.lookups[input.fineTune.tier];
  if (
    lookup.fineTuneBaseUsd === null ||
    lookup.fineTunePer1kExamplesUsd === null
  ) {
    return 0;
  }
  return (
    input.fineTune.runs *
    (lookup.fineTuneBaseUsd +
      (input.fineTune.examples / 1_000) * lookup.fineTunePer1kExamplesUsd)
  );
}

function validateInput(input: AiOperatingCostInput, catalog: AiOpsCatalog): void {
  for (const year of YEARS) {
    const calls = callsForYear(input, year);
    if (!Number.isFinite(calls) || calls < 0) {
      throw new Error(`AI ops callRamp y${year} must be a non-negative number.`);
    }
  }
  if (input.tokensPerCall.input < 0 || input.tokensPerCall.output < 0) {
    throw new Error('AI ops tokensPerCall values must be non-negative.');
  }
  const cacheHitRate = input.tokensPerCall.cacheHitRate ?? 0;
  if (cacheHitRate < 0 || cacheHitRate > 1) {
    throw new Error('AI ops cacheHitRate must be within 0..1.');
  }
  for (const tier of Object.keys(catalog.lookups) as ModelTier[]) {
    if (!catalog.lookups[tier]) {
      throw new Error(`AI ops catalog is missing ${tier}.`);
    }
  }
}

function tierForYear(
  defaultTier: ModelTier,
  ramp: Array<{ year: number; tier: ModelTier; reasonCode: string }>,
  year: number,
): ModelTier {
  let tier = defaultTier;
  for (const entry of ramp) {
    if (entry.year <= year) tier = entry.tier;
  }
  return tier;
}

function callsForYear(input: AiOperatingCostInput, year: number): number {
  return input.callRamp[`y${year}` as keyof AiOperatingCostInput['callRamp']];
}

function queriesForYear(
  ramp: { y1: number; y2: number; y3: number },
  year: number,
): number {
  if (year === 1) return ramp.y1;
  if (year === 2) return ramp.y2;
  if (year === 3) return ramp.y3;
  return 0;
}

function evalCallsForYear(
  ramp: { y1: number; y2: number; y3: number },
  year: number,
): number {
  return queriesForYear(ramp, year);
}

function tierBreachWarningsForYear(
  input: AiOperatingCostInput,
  year: number,
  calls: number,
): string[] {
  if (!input.pricingTiers || input.pricingTiers.length === 0) return [];
  const monthlyCalls = (calls * 30) / 365;
  return input.pricingTiers
    .filter((tier) => monthlyCalls > tier.thresholdCallsPerMonth)
    .map(
      (tier) =>
        `Year ${year}: projected ${Math.round(
          monthlyCalls,
        ).toLocaleString()} calls/month exceeds ${tier.thresholdCallsPerMonth.toLocaleString()} calls/month pricing threshold (${tier.notes}).`,
    );
}

function modelTierDriftWarning(
  input: AiOperatingCostInput,
  catalog: AiOpsCatalog,
  ramp: Array<{ year: number; tier: ModelTier; reasonCode: string }>,
): string | null {
  if (ramp.length === 0) return null;
  let previousTier = input.modelTier;
  for (const entry of ramp) {
    if (TIER_ORDER[entry.tier] <= TIER_ORDER[previousTier]) {
      previousTier = entry.tier;
      continue;
    }
    const calls = callsForYear(input, entry.year);
    const fromUsd = calculateInferenceUsd(
      { ...input, modelTier: previousTier },
      catalog.lookups[previousTier],
      calls,
    );
    const toUsd = calculateInferenceUsd(
      { ...input, modelTier: entry.tier },
      catalog.lookups[entry.tier],
      calls,
    );
    return `Year ${entry.year}: model tier drift from ${previousTier} to ${entry.tier} raises projected inference cost by ${formatUsd(
      round2(toUsd - fromUsd),
    )} (${entry.reasonCode}).`;
  }
  return null;
}

function formatUsd(value: number): string {
  return `$${value.toLocaleString('en-US', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  })}`;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function round4(n: number): number {
  return Math.round(n * 10_000) / 10_000;
}
