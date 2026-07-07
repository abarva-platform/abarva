export interface EvalCostDefaults {
  catalogVersion: string;
  asOf: string;
  defaultLlmJudgeOutputTokens: number;
  notes: string;
}

export const EVAL_COST_DEFAULTS: EvalCostDefaults = {
  catalogVersion: 'ai-ops-eval-costs-2026-05-31',
  asOf: '2026-05-31',
  defaultLlmJudgeOutputTokens: 1_000,
  notes:
    'LLM-judge token volume is move-specific; use 1,000 output tokens per judge call when the Move has not supplied an eval token budget.',
};
