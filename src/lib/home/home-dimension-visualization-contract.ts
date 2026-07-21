import { z } from "zod";

// =============================================================================
// Home Dimension Visualization Contract
// -----------------------------------------------------------------------------
// Governs which primary/secondary/relationship/gap visual each of the 19 Home
// Knowledge dimensions renders, and how strictly that visual may imply
// numeric precision.
//
// `precisionMode` is not a style knob. Tenant content packs ship their own
// pre-vetted `approved-cxo-visual-specs.json` (see
// datasets/context-artifacts/approved/<tenant>/home-knowledge/) marking each
// candidate visual `chart_allowed: true|false` with a stated reason — usually
// "no certified numeric baseline, qualitative view prevents false precision".
// A dimension's contract entry must not render continuous/scored axes
// (bubble size = cost, scored 2x2 placement, etc.) unless the underlying
// dataset actually carries certified numeric fields for that axis. Where it
// doesn't, the SAME visual family (bubble/matrix/heatmap) still applies —
// built from real categorical fields and counts instead of invented scores.
// =============================================================================

export const HOME_DIMENSION_VISUAL_TYPES = [
  "kpi_segmented_bar",
  "functional_heatmap",
  "owner_treemap",
  "role_stacked_bar",
  "estate_bubble_matrix",
  "readiness_heatmap",
  "footprint_stacked_bar",
  "vendor_pareto_bubble",
  "budget_waterfall",
  "portfolio_bubble_matrix",
  "value_readiness_matrix",
  "risk_control_heatmap",
  "relationship_topology",
  "coverage_freshness_heatmap",
  "kpi_trend_bars",
  "maturity_radar",
  "expert_lens_radar",
  "vendor_sla_matrix",
  "process_funnel_heatmap",
  "bar" /** default/fallback — the existing plain volume bar. */,
] as const;
export type HomeDimensionVisualType =
  (typeof HOME_DIMENSION_VISUAL_TYPES)[number];

/**
 * "quantitative" — the visual may plot certified numeric fields as continuous
 *   axes (real $ amounts, real counts) because the tenant pack's visual specs
 *   allow it or the underlying dataset genuinely carries the numeric field.
 * "qualitative" — the visual must render categorical/ordinal fields only
 *   (status labels, severity bands, counts-of-category) — no invented score.
 */
export const HOME_DIMENSION_PRECISION_MODES = [
  "quantitative",
  "qualitative",
] as const;
export type HomeDimensionPrecisionMode =
  (typeof HOME_DIMENSION_PRECISION_MODES)[number];

export const homeDimensionCrossLensFilterSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
});
export type HomeDimensionCrossLensFilter = z.infer<
  typeof homeDimensionCrossLensFilterSchema
>;

export const homeDimensionVisualizationContractEntrySchema = z.object({
  dimensionId: z.string().min(1),
  primaryVisual: z.enum(HOME_DIMENSION_VISUAL_TYPES),
  precisionMode: z.enum(HOME_DIMENSION_PRECISION_MODES),
  secondaryVisual: z.enum(["data_table"]).default("data_table"),
  relationshipVisual: z.enum(["dependency_chain_text", "topology_graph"]),
  gapVisual: z.enum(["gap_cards", "gap_heatmap"]),
  /** Dataset columns the primary visual needs present to render (else falls back). */
  requiredFields: z.array(z.string()),
  emptyState: z.string().min(1),
  insightNarrative: z.literal("approved_story_slot"),
  drillDownRoute: z.string().min(1),
  crossLensFilters: z.array(homeDimensionCrossLensFilterSchema),
  exportBehavior: z.enum(["csv_rows"]).default("csv_rows"),
});
export type HomeDimensionVisualizationContractEntry = z.infer<
  typeof homeDimensionVisualizationContractEntrySchema
>;

export const homeDimensionVisualizationContractSchema = z.record(
  z.string(),
  homeDimensionVisualizationContractEntrySchema,
);
export type HomeDimensionVisualizationContract = z.infer<
  typeof homeDimensionVisualizationContractSchema
>;

function filters(
  ...pairs: Array<[string, string]>
): HomeDimensionCrossLensFilter[] {
  return pairs.map(([key, label]) => ({ key, label }));
}

/**
 * Registry keyed by the 19 canonical dimension keys (see
 * datasets/tenant-inputs/<tenant>/approved-content/home/design-contract-pack.json
 * `design_slots.DIMS[].key`). Every dimension has an entry — dimensions
 * without a differentiated Phase-1 renderer fall back to `"bar"`, which the
 * surface already renders today, so adding an entry here is never a
 * regression.
 *
 * IMPORTANT — the 19 dimension datasets are NOT 19 distinctly-structured
 * shapes. As shipped for Meridian they are stamped from ~5 shared schema
 * templates reused across dimension labels (confirmed by inspecting
 * datasets/tenant-inputs/meridian-health/approved-content/home/design-contract-pack.json
 * `design_slots.DATA.<key>.columns`):
 *   - app/infra-shaped:   criticality, lifecycle_status        (apps, infra)
 *   - org-shaped:         owner_role, operating_model, processes (functions, org)
 *   - value-hypothesis:   use_case, data_domain, systems, evidence_needed (data, ai, programs)
 *   - risk-shaped:        use_case, risk_or_gap, affected_systems, metric_boundary,
 *                         forbidden_claims                     (rel, metrics — same schema,
 *                         different `dimension` label; "rel" has no real relationship fields)
 *   - vendor-shaped:      service, contract_risk, pricing_basis (vendors, ms)
 *   - industry-shaped:    industry_context, signals, module_next_actions
 *                         (industry, lenses, opev)
 * The registry below assigns each dimension the visual its ACTUAL schema
 * family supports, not the aspirational per-dimension type from the original
 * design brief. `budget`'s amount_usd/realized_value_usd fields are the
 * literal string "Needs evidence" on every row for Meridian — there is no
 * numeric data to plot, so it stays a qualitative value-hypothesis-status
 * view (matching the tenant's own approved visual spec VIZ-007, which is
 * itself `chart_allowed: false` for the same reason), not a waterfall.
 */
export const HOME_DIMENSION_VISUALIZATION_CONTRACT: HomeDimensionVisualizationContract =
  {
    profile: entry("profile", "kpi_segmented_bar", "qualitative", [
      "industry",
      "tenant_archetype",
    ]),
    functions: entry(
      "functions",
      "functional_heatmap",
      "qualitative",
      ["owner_role", "operating_model"],
      filters(["owner_role", "Owner"], ["operating_model", "Operating model"]),
    ),
    org: entry(
      "org",
      "owner_treemap",
      "qualitative",
      ["owner_role", "operating_model"],
      filters(["owner_role", "Owner"]),
    ),
    workforce: entry(
      "workforce",
      "role_stacked_bar",
      "qualitative",
      ["interview_group", "priority_theme"],
      filters(["interview_group", "Interview group"]),
    ),
    apps: entry(
      "apps",
      "estate_bubble_matrix",
      "qualitative",
      ["criticality", "lifecycle_status"],
      filters(
        ["criticality", "Criticality"],
        ["lifecycle_status", "Lifecycle status"],
      ),
    ),
    data: entry(
      "data",
      "readiness_heatmap",
      "qualitative",
      ["use_case", "data_domain"],
      filters(["data_domain", "Data domain"]),
    ),
    infra: entry(
      "infra",
      "footprint_stacked_bar",
      "qualitative",
      ["criticality", "lifecycle_status"],
      filters(["lifecycle_status", "Lifecycle status"]),
    ),
    vendors: entry(
      "vendors",
      "vendor_pareto_bubble",
      "qualitative",
      ["contract_risk", "owning_function"],
      filters(["contract_risk", "Contract risk"]),
    ),
    budget: entry(
      "budget",
      "value_readiness_matrix",
      "qualitative",
      ["value_boundary", "confidence"],
      filters(["value_boundary", "Value boundary"]),
    ),
    programs: entry(
      "programs",
      "portfolio_bubble_matrix",
      "qualitative",
      ["use_case", "data_domain"],
      filters(["data_domain", "Data domain"]),
    ),
    ai: entry(
      "ai",
      "value_readiness_matrix",
      "qualitative",
      ["use_case", "data_domain"],
      filters(["data_domain", "Data domain"], ["confidence", "Confidence"]),
    ),
    risks: entry(
      "risks",
      "risk_control_heatmap",
      "qualitative",
      ["risk_or_gap", "metric_boundary"],
      filters(["metric_boundary", "Boundary type"]),
    ),
    rel: entry(
      "rel",
      "risk_control_heatmap",
      "qualitative",
      ["risk_or_gap", "metric_boundary"],
      filters(["metric_boundary", "Boundary type"]),
    ),
    evidence: entry(
      "evidence",
      "coverage_freshness_heatmap",
      "qualitative",
      ["evidence_type", "evidence_owner"],
      filters(["evidence_type", "Evidence type"]),
    ),
    metrics: entry(
      "metrics",
      "risk_control_heatmap",
      "qualitative",
      ["risk_or_gap", "metric_boundary"],
      filters(["metric_boundary", "Boundary type"]),
    ),
    industry: entry("industry", "maturity_radar", "qualitative", [
      "industry_context",
      "signals",
    ]),
    lenses: entry("lenses", "expert_lens_radar", "qualitative", [
      "industry_context",
      "signals",
    ]),
    ms: entry(
      "ms",
      "vendor_sla_matrix",
      "qualitative",
      ["contract_risk", "owning_function"],
      filters(["contract_risk", "Contract risk"]),
    ),
    opev: entry("opev", "process_funnel_heatmap", "qualitative", [
      "industry_context",
      "signals",
    ]),
  };

function entry(
  dimensionId: string,
  primaryVisual: HomeDimensionVisualType,
  precisionMode: HomeDimensionPrecisionMode,
  requiredFields: string[],
  crossLensFilters: HomeDimensionCrossLensFilter[] = [],
  relationshipVisual:
    | "dependency_chain_text"
    | "topology_graph" = "dependency_chain_text",
): HomeDimensionVisualizationContractEntry {
  return {
    dimensionId,
    primaryVisual,
    precisionMode,
    secondaryVisual: "data_table",
    relationshipVisual,
    gapVisual: "gap_cards",
    requiredFields,
    emptyState: "Not enough loaded rows to render this view yet.",
    insightNarrative: "approved_story_slot",
    drillDownRoute: `/home?dimension=${dimensionId}`,
    crossLensFilters,
    exportBehavior: "csv_rows",
  };
}

/** Falls back to the plain bar visual for any dimension key not in the registry. */
export function resolveHomeDimensionVisualContract(
  dimensionKey: string | null | undefined,
): HomeDimensionVisualizationContractEntry {
  const found = dimensionKey
    ? HOME_DIMENSION_VISUALIZATION_CONTRACT[dimensionKey]
    : undefined;
  return found ?? entry(dimensionKey ?? "unknown", "bar", "qualitative", []);
}

/**
 * True only when the dataset's rows actually carry every field the contract's
 * primary visual requires. Callers must fall back to the existing plain
 * breakdown/bar rendering when this is false — never render a differentiated
 * visual against fields that aren't there.
 */
export function dimensionRowsSupportPrimaryVisual(
  contract: HomeDimensionVisualizationContractEntry,
  rows: ReadonlyArray<Record<string, unknown>>,
): boolean {
  if (!contract.requiredFields.length) return false;
  if (!rows.length) return false;
  const sample = rows.slice(0, Math.min(rows.length, 25));
  return contract.requiredFields.every((field) =>
    sample.some((row) => {
      const value = row[field];
      return (
        value !== null && value !== undefined && String(value).trim() !== ""
      );
    }),
  );
}
