export type TenantUsageCapDecision = "allow" | "alert" | "block";

export interface TenantUsageCapConfig {
  tenantId: string;
  period: "daily" | "weekly" | "monthly";
  alertAtPercent: number;
  blockAtPercent: number;
  tokenCap: number;
  costCapUsd?: number | null;
}

export interface TenantUsageTotals {
  inputTokens: number;
  outputTokens: number;
  costUsd?: number | null;
}

export interface TenantUsageCapEvaluationInput {
  config: TenantUsageCapConfig;
  current: TenantUsageTotals;
  pending?: Partial<TenantUsageTotals> | null;
}

export interface TenantUsageCapEvaluation {
  decision: TenantUsageCapDecision;
  reason:
    | "below_alert_threshold"
    | "token_alert_threshold_reached"
    | "cost_alert_threshold_reached"
    | "token_block_threshold_reached"
    | "cost_block_threshold_reached"
    | "invalid_cap_configuration";
  tenantId: string;
  period: TenantUsageCapConfig["period"];
  tokenCap: number;
  tokensBefore: number;
  tokensPending: number;
  tokensAfter: number;
  tokenPercentAfter: number;
  costCapUsd: number | null;
  costBeforeUsd: number | null;
  costPendingUsd: number | null;
  costAfterUsd: number | null;
  costPercentAfter: number | null;
  alertAtPercent: number;
  blockAtPercent: number;
  auditMetadata: Record<string, string | number | boolean | null>;
}

export function evaluateTenantUsageCap(
  input: TenantUsageCapEvaluationInput,
): TenantUsageCapEvaluation {
  const alertAtPercent = clampPercent(input.config.alertAtPercent);
  const blockAtPercent = clampPercent(input.config.blockAtPercent);
  const tokenCap = Math.max(0, Math.floor(input.config.tokenCap));
  const tokensBefore = totalTokens(input.current);
  const tokensPending = totalTokens(input.pending ?? {});
  const tokensAfter = tokensBefore + tokensPending;
  const tokenPercentAfter = percent(tokensAfter, tokenCap);
  const costCapUsd = normalizeOptionalCap(input.config.costCapUsd);
  const costBeforeUsd = normalizeOptionalValue(input.current.costUsd);
  const costPendingUsd = normalizeOptionalValue(input.pending?.costUsd);
  const costAfterUsd =
    costBeforeUsd === null && costPendingUsd === null
      ? null
      : roundCost((costBeforeUsd ?? 0) + (costPendingUsd ?? 0));
  const costPercentAfter =
    costCapUsd === null || costAfterUsd === null
      ? null
      : percent(costAfterUsd, costCapUsd);

  let decision: TenantUsageCapDecision = "allow";
  let reason: TenantUsageCapEvaluation["reason"] = "below_alert_threshold";

  if (tokenCap <= 0 || blockAtPercent < alertAtPercent) {
    decision = "block";
    reason = "invalid_cap_configuration";
  } else if (tokenPercentAfter >= blockAtPercent) {
    decision = "block";
    reason = "token_block_threshold_reached";
  } else if (costPercentAfter !== null && costPercentAfter >= blockAtPercent) {
    decision = "block";
    reason = "cost_block_threshold_reached";
  } else if (tokenPercentAfter >= alertAtPercent) {
    decision = "alert";
    reason = "token_alert_threshold_reached";
  } else if (costPercentAfter !== null && costPercentAfter >= alertAtPercent) {
    decision = "alert";
    reason = "cost_alert_threshold_reached";
  }

  const evaluation = {
    decision,
    reason,
    tenantId: input.config.tenantId,
    period: input.config.period,
    tokenCap,
    tokensBefore,
    tokensPending,
    tokensAfter,
    tokenPercentAfter,
    costCapUsd,
    costBeforeUsd,
    costPendingUsd,
    costAfterUsd,
    costPercentAfter,
    alertAtPercent,
    blockAtPercent,
  };

  return {
    ...evaluation,
    auditMetadata: {
      usage_cap_decision: decision,
      usage_cap_reason: reason,
      usage_cap_period: evaluation.period,
      usage_cap_token_cap: evaluation.tokenCap,
      usage_cap_tokens_before: evaluation.tokensBefore,
      usage_cap_tokens_pending: evaluation.tokensPending,
      usage_cap_tokens_after: evaluation.tokensAfter,
      usage_cap_token_percent_after: evaluation.tokenPercentAfter,
      usage_cap_cost_cap_usd: evaluation.costCapUsd,
      usage_cap_cost_after_usd: evaluation.costAfterUsd,
      usage_cap_cost_percent_after: evaluation.costPercentAfter,
      usage_cap_alert_at_percent: evaluation.alertAtPercent,
      usage_cap_block_at_percent: evaluation.blockAtPercent,
      usage_cap_blocks_model_call: decision === "block",
    },
  };
}

export function extractUsageTotalsFromMetadata(
  metadata: Record<string, unknown> | null | undefined,
): TenantUsageTotals {
  const usage = asRecord(metadata?.usage);
  return {
    inputTokens:
      numberFromAny(metadata?.inputTokens) ??
      numberFromAny(metadata?.input_tokens) ??
      numberFromAny(metadata?.promptTokens) ??
      numberFromAny(metadata?.prompt_tokens) ??
      numberFromAny(usage?.inputTokens) ??
      numberFromAny(usage?.input_tokens) ??
      numberFromAny(usage?.promptTokens) ??
      numberFromAny(usage?.prompt_tokens) ??
      0,
    outputTokens:
      numberFromAny(metadata?.outputTokens) ??
      numberFromAny(metadata?.output_tokens) ??
      numberFromAny(metadata?.completionTokens) ??
      numberFromAny(metadata?.completion_tokens) ??
      numberFromAny(usage?.outputTokens) ??
      numberFromAny(usage?.output_tokens) ??
      numberFromAny(usage?.completionTokens) ??
      numberFromAny(usage?.completion_tokens) ??
      0,
    costUsd:
      numberFromAny(metadata?.costUsd) ??
      numberFromAny(metadata?.cost_usd) ??
      numberFromAny(metadata?.estimatedCostUsd) ??
      numberFromAny(metadata?.estimated_cost_usd) ??
      numberFromAny(usage?.costUsd) ??
      numberFromAny(usage?.cost_usd) ??
      numberFromAny(usage?.estimatedCostUsd) ??
      numberFromAny(usage?.estimated_cost_usd) ??
      null,
  };
}

function totalTokens(value: Partial<TenantUsageTotals>): number {
  return (
    Math.max(0, Math.round(value.inputTokens ?? 0)) +
    Math.max(0, Math.round(value.outputTokens ?? 0))
  );
}

function percent(value: number, cap: number): number {
  if (cap <= 0) return 100;
  return Math.round((value / cap) * 10000) / 100;
}

function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 100;
  return Math.min(100, Math.max(0, Math.round(value * 100) / 100));
}

function normalizeOptionalCap(value: number | null | undefined): number | null {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return null;
  }
  return value > 0 ? roundCost(value) : null;
}

function normalizeOptionalValue(
  value: number | null | undefined,
): number | null {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return null;
  }
  return roundCost(Math.max(0, value));
}

function roundCost(value: number): number {
  return Math.round(value * 1000000) / 1000000;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : null;
}

function numberFromAny(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return value;
}
