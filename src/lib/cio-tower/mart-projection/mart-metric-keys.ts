// The metric_key vocabulary the mart assembler understands.
//
// Both projections (real tower_* operational + curated/synthetic V3 budget &
// program) stamp facts with these keys, and the assembler pivots them into
// mart records. Keeping the vocabulary in one place is what lets "facts → mart"
// be the single projection path: the assembler never reads a CSV or a tower_*
// table directly, only facts carrying these keys.

/** Enterprise budget envelope (V3 side). */
export const BUDGET_METRIC_KEYS = {
  total: "it_budget_total_usd",
  run: "it_budget_run_usd",
  change: "it_budget_change_usd",
} as const;

/** Per-program value/funding metrics (V3 side, canonical_program_key set). */
export const PROGRAM_METRIC_KEYS = {
  approvedFunding: "program_approved_funding_usd",
  promisedValue: "program_promised_value_usd",
  financeValidatedValue: "program_finance_validated_value_usd",
} as const;

/** AI tool / cloud spend metrics that roll up to ai_tagged_spend. */
export const SPEND_METRIC_KEYS = new Set<string>([
  "ai_tool_monthly_cost_usd",
  "cloud_run_cost_usd",
]);

/** Adoption/usage metrics that provide "is it actually used" evidence. */
export const ADOPTION_METRIC_KEYS = new Set<string>([
  "ai_tool_active_users",
  "ai_tool_acceptance_rate_pct",
  "ai_tool_seat_utilization",
]);

/** Operational KPI metrics (DORA, ITSM, Jira) — outcome evidence. */
export const KPI_METRIC_KEYS = new Set<string>([
  "dora_lead_time_hours",
  "dora_deploy_frequency_per_day",
  "dora_change_failure_rate_pct",
  "dora_mttr_hours",
  "itsm_mean_mttr_minutes",
  "itsm_change_success_rate_pct",
  "jira_mean_cycle_time_hours",
]);

export type ValueClaimStatus =
  | "partial_validated"
  | "promised_with_usage"
  | "promised_only"
  | "funded_no_value_case"
  | "not_loaded";

export type TowerClaimAllowed = "partial" | "no";

export type DecisionLane = "fund" | "fix" | "freeze" | "stop";
