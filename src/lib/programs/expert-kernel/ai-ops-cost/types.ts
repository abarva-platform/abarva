export type ModelTier =
  | 'frontier'
  | 'mid'
  | 'cost_optimized'
  | 'on_prem_oss';

export interface ModelCostLookup {
  tier: ModelTier;
  exemplar: string;
  inputPerMTokUsd: number;
  outputPerMTokUsd: number;
  cacheReadPerMTokUsd: number;
  cacheWritePerMTokUsd: number;
  fineTuneBaseUsd: number | null;
  fineTunePer1kExamplesUsd: number | null;
  vendor: string;
  asOf: string;
  notes: string;
}

export interface AiOperatingCostInput {
  callRamp: { y1: number; y2: number; y3: number; y4: number; y5: number };
  tokensPerCall: { input: number; output: number; cacheHitRate?: number };
  modelTier: ModelTier;
  modelTierRamp?: Array<{ year: number; tier: ModelTier; reasonCode: string }>;
  embedding?: {
    documents: number;
    tokensPerDoc: number;
    refreshPerYear: number;
    queriesPerYear: { y1: number; y2: number; y3: number };
    embeddingTier: 'frontier' | 'cost_optimized';
  };
  eval?: {
    llmJudgeCallsPerYear: { y1: number; y2: number; y3: number };
    llmJudgeTier: ModelTier;
    humanRaterHoursPerYear: { y1: number; y2: number; y3: number };
    humanRaterRateUsd: number;
  };
  fineTune?: { examples: number; tier: ModelTier; runs: number };
  pricingTiers?: Array<{
    thresholdCallsPerMonth: number;
    discount: number;
    notes: string;
  }>;
  decisionUnit?: string;
  decisionsPerCall?: number;
}

export interface AiOpsCostEstimate {
  perYear: Array<{
    year: number;
    inferenceUsd: number;
    embeddingUsd: number;
    evalUsd: number;
    fineTuneUsd: number;
    totalUsd: number;
    tierBreachWarnings: string[];
  }>;
  threeYearTotal: number;
  fiveYearTotal: number;
  unitEconomic: {
    costPerCallUsd: number;
    decisionUnit?: string;
    costPerDecisionUsd?: number;
  };
  pricingTierShockWarning: string | null;
  modelTierDriftWarning: string | null;
  rateCard: { catalogVersion: string; asOf: string };
}

export interface AiOpsCatalog {
  catalogVersion: string;
  asOf: string;
  lookups: Record<ModelTier, ModelCostLookup>;
}
