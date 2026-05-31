import type { AiOpsCatalog, ModelCostLookup, ModelTier } from './types';

export const MODEL_COST_CATALOG_VERSION = 'ai-ops-model-costs-2026-05-31';
export const MODEL_COST_CATALOG_AS_OF = '2026-05-31';

const commonAsOf = MODEL_COST_CATALOG_AS_OF;

export const ANTHROPIC_MODEL_COSTS: Record<ModelTier, ModelCostLookup> = {
  frontier: {
    tier: 'frontier',
    exemplar: 'claude-opus-4.8',
    inputPerMTokUsd: 5,
    outputPerMTokUsd: 25,
    cacheReadPerMTokUsd: 0.5,
    cacheWritePerMTokUsd: 6.25,
    fineTuneBaseUsd: null,
    fineTunePer1kExamplesUsd: null,
    vendor: 'Anthropic',
    asOf: commonAsOf,
    notes:
      'Anthropic pricing page, Model pricing table: Claude Opus 4.8 is listed at $5 input, $6.25 5m cache write, $0.50 cache read, and $25 output per MTok.',
  },
  mid: {
    tier: 'mid',
    exemplar: 'claude-sonnet-4.6',
    inputPerMTokUsd: 3,
    outputPerMTokUsd: 15,
    cacheReadPerMTokUsd: 0.3,
    cacheWritePerMTokUsd: 3.75,
    fineTuneBaseUsd: null,
    fineTunePer1kExamplesUsd: null,
    vendor: 'Anthropic',
    asOf: commonAsOf,
    notes:
      'Anthropic pricing page, Model pricing table: Claude Sonnet 4.6 is listed at $3 input, $3.75 5m cache write, $0.30 cache read, and $15 output per MTok.',
  },
  cost_optimized: {
    tier: 'cost_optimized',
    exemplar: 'claude-haiku-4.5',
    inputPerMTokUsd: 1,
    outputPerMTokUsd: 5,
    cacheReadPerMTokUsd: 0.1,
    cacheWritePerMTokUsd: 1.25,
    fineTuneBaseUsd: null,
    fineTunePer1kExamplesUsd: null,
    vendor: 'Anthropic',
    asOf: commonAsOf,
    notes:
      'Anthropic pricing page, Model pricing table: Claude Haiku 4.5 is listed at $1 input, $1.25 5m cache write, $0.10 cache read, and $5 output per MTok.',
  },
  on_prem_oss: {
    tier: 'on_prem_oss',
    exemplar: 'aws-bedrock-custom-model-import-llama-3.1-70b',
    inputPerMTokUsd: 0,
    outputPerMTokUsd: 0,
    cacheReadPerMTokUsd: 0,
    cacheWritePerMTokUsd: 0,
    fineTuneBaseUsd: null,
    fineTunePer1kExamplesUsd: null,
    vendor: 'AWS Bedrock',
    asOf: commonAsOf,
    notes:
      'AWS Bedrock Custom Model Import publishes Custom Model Unit pricing rather than per-token rates; this catalog records per-token cost as 0 and expects hosting cost to be modeled separately in a later wave.',
  },
};

export const OPENAI_MODEL_COSTS: Record<ModelTier, ModelCostLookup> = {
  frontier: {
    tier: 'frontier',
    exemplar: 'gpt-5.2',
    inputPerMTokUsd: 1.75,
    outputPerMTokUsd: 14,
    cacheReadPerMTokUsd: 0.175,
    cacheWritePerMTokUsd: 1.75,
    fineTuneBaseUsd: null,
    fineTunePer1kExamplesUsd: null,
    vendor: 'OpenAI',
    asOf: commonAsOf,
    notes:
      'OpenAI API pricing page: GPT-5.2 is listed at $1.75 input, $0.175 cached input, and $14 output per 1M tokens.',
  },
  mid: {
    tier: 'mid',
    exemplar: 'gpt-5.1',
    inputPerMTokUsd: 1.25,
    outputPerMTokUsd: 10,
    cacheReadPerMTokUsd: 0.125,
    cacheWritePerMTokUsd: 1.25,
    fineTuneBaseUsd: null,
    fineTunePer1kExamplesUsd: null,
    vendor: 'OpenAI',
    asOf: commonAsOf,
    notes:
      'OpenAI model page for GPT-5.1 lists $1.25 input, $0.125 cached input, and $10 output per 1M tokens.',
  },
  cost_optimized: {
    tier: 'cost_optimized',
    exemplar: 'gpt-5-mini',
    inputPerMTokUsd: 0.25,
    outputPerMTokUsd: 2,
    cacheReadPerMTokUsd: 0.025,
    cacheWritePerMTokUsd: 0.25,
    fineTuneBaseUsd: null,
    fineTunePer1kExamplesUsd: null,
    vendor: 'OpenAI',
    asOf: commonAsOf,
    notes:
      'OpenAI API pricing page lists the GPT-5 mini family as a lower-cost API option; cached-input pricing follows the published 90% cached-input discount.',
  },
  on_prem_oss: {
    tier: 'on_prem_oss',
    exemplar: 'gpt-oss-120b',
    inputPerMTokUsd: 0,
    outputPerMTokUsd: 0,
    cacheReadPerMTokUsd: 0,
    cacheWritePerMTokUsd: 0,
    fineTuneBaseUsd: null,
    fineTunePer1kExamplesUsd: null,
    vendor: 'OpenAI open-weight',
    asOf: commonAsOf,
    notes:
      'OpenAI model catalog lists gpt-oss open-weight models; hosted operating cost depends on the deployment substrate and is intentionally not converted to a token rate here.',
  },
};

export const GOOGLE_MODEL_COSTS: Record<ModelTier, ModelCostLookup> = {
  frontier: {
    tier: 'frontier',
    exemplar: 'gemini-2.5-pro',
    inputPerMTokUsd: 1.25,
    outputPerMTokUsd: 10,
    cacheReadPerMTokUsd: 0.125,
    cacheWritePerMTokUsd: 1.25,
    fineTuneBaseUsd: null,
    fineTunePer1kExamplesUsd: null,
    vendor: 'Google',
    asOf: commonAsOf,
    notes:
      'Gemini Developer API pricing page: Gemini 2.5 Pro standard tier lists $1.25 input, $0.125 context caching, and $10 output per 1M tokens for prompts <=200k.',
  },
  mid: {
    tier: 'mid',
    exemplar: 'gemini-2.5-flash',
    inputPerMTokUsd: 0.3,
    outputPerMTokUsd: 2.5,
    cacheReadPerMTokUsd: 0.03,
    cacheWritePerMTokUsd: 0.3,
    fineTuneBaseUsd: null,
    fineTunePer1kExamplesUsd: null,
    vendor: 'Google',
    asOf: commonAsOf,
    notes:
      'Gemini Developer API pricing page: Gemini 2.5 Flash standard tier lists $0.30 text input, $0.03 context caching, and $2.50 output per 1M tokens.',
  },
  cost_optimized: {
    tier: 'cost_optimized',
    exemplar: 'gemini-2.5-flash-lite',
    inputPerMTokUsd: 0.1,
    outputPerMTokUsd: 0.4,
    cacheReadPerMTokUsd: 0.01,
    cacheWritePerMTokUsd: 0.1,
    fineTuneBaseUsd: null,
    fineTunePer1kExamplesUsd: null,
    vendor: 'Google',
    asOf: commonAsOf,
    notes:
      'Gemini Developer API pricing page: Gemini 2.5 Flash-Lite standard tier lists $0.10 text input, $0.01 context caching, and $0.40 output per 1M tokens.',
  },
  on_prem_oss: {
    tier: 'on_prem_oss',
    exemplar: 'gemma-3-27b-on-bedrock',
    inputPerMTokUsd: 0.28,
    outputPerMTokUsd: 0.46,
    cacheReadPerMTokUsd: 0,
    cacheWritePerMTokUsd: 0,
    fineTuneBaseUsd: null,
    fineTunePer1kExamplesUsd: null,
    vendor: 'Google on AWS Bedrock',
    asOf: commonAsOf,
    notes:
      'AWS Bedrock pricing page lists Gemma 3 27B in US East/West at $0.28 input and $0.46 output per 1M tokens.',
  },
};

export const DEFAULT_MODEL_COST_CATALOG: AiOpsCatalog = {
  catalogVersion: MODEL_COST_CATALOG_VERSION,
  asOf: MODEL_COST_CATALOG_AS_OF,
  lookups: ANTHROPIC_MODEL_COSTS,
};
