// Types mirroring the server-side V4 candidate contract enforced in
// scripts/knowledge/build-home-knowledge-v4-review-pack.mjs (requiredVisualFields,
// requiredRelationshipGraphFields, visualTypeEnum, classificationEnum). Kept in
// sync by hand — the two are not code-shared because one is a Node operator
// script and the other ships to the browser.

export type HomeV4Classification =
  | "loaded_fact"
  | "derived_measure"
  | "industry_pattern"
  | "strategic_inference"
  | "missing_evidence";

export type HomeV4ChartVisualType =
  | "horizontal_bar"
  | "stacked_bar"
  | "scatter_2x2"
  | "heatmap"
  | "waterfall"
  | "line_trend"
  | "area_trend"
  | "radar"
  | "treemap"
  | "evidence_timeline"
  | "executive_scorecard";

export interface HomeV4DataPoint {
  label?: string;
  value?: number;
  row?: string;
  col?: string;
  x?: number;
  y?: number;
  series?: string;
  date?: string;
  classification?: HomeV4Classification;
  source_basis?: string;
  [key: string]: unknown;
}

export interface HomeV4ChartVisual {
  visual_type: HomeV4ChartVisualType;
  title: string;
  executive_question: string;
  classification: HomeV4Classification;
  data_points: HomeV4DataPoint[];
  encoding?: { x?: string; y?: string; color?: string; series?: string; size?: string };
  annotation?: string;
  evidence_boundary: string;
  empty_state: string;
}

export interface HomeV4NodeGroup {
  group: string;
  examples: string[];
  classification: HomeV4Classification;
}

export interface HomeV4GraphVisual {
  visual_type: "relationship_graph";
  projection_type: string;
  classification: HomeV4Classification;
  node_groups: HomeV4NodeGroup[];
  edge_meaning: string;
  layout_hint?: string;
  visual_emphasis?: string;
  empty_state: string;
}

export type HomeV4PrimaryVisual = HomeV4ChartVisual | HomeV4GraphVisual;

export function isHomeV4GraphVisual(
  visual: HomeV4PrimaryVisual | undefined | null,
): visual is HomeV4GraphVisual {
  return visual?.visual_type === "relationship_graph";
}

export interface HomeV4DimensionTabCommon {
  headline?: string;
  classification?: HomeV4Classification;
}

export interface HomeV4SummaryTab extends HomeV4DimensionTabCommon {
  executive_read?: string;
}

export interface HomeV4DataTab extends HomeV4DimensionTabCommon {
  filters?: string[];
  rows?: Array<Record<string, unknown>>;
  evidence_boundary?: string;
  // Deterministic source rows, passed through directly from the reconciled source file —
  // never Claude-authored, never truncated. Distinct from `rows` above (an LLM-selected
  // sample). Absent/null fields are genuine source gaps, not omissions — render as
  // "not captured", never inferred.
  full_rows?: HomeV4ApplicationFullRow[];
}

export interface HomeV4ApplicationFullRow {
  app_id: string;
  name: string;
  business_domain?: string | null;
  criticality?: string | null;
  tech_stack?: string | null;
  hosting?: string | null;
  vendor?: string | null;
  modernization_disposition?: string | null;
  named_users?: number | null;
  annual_run_cost_usd?: number | null;
  interface_count?: number | null;
  owner?: string | null;
  sponsor?: string | null;
  application_type?: string | null;
  // 1 = directly captured on the source application record. <1 = derived from a
  // team/domain-matched join (see owner_caveat). null = no owner source found for
  // this row. Never silently promote a derived owner to the same confidence as a
  // directly-captured one.
  owner_confidence?: number | null;
  owner_caveat?: string | null;
  source_file: string;
}

export interface HomeV4RelationshipTab extends HomeV4DimensionTabCommon {
  graph_nodes?: Array<Record<string, unknown>>;
  graph_edges?: Array<Record<string, unknown>>;
  paths_to_show?: string[];
  missing_relationships?: string[];
}

export interface HomeV4GapsTab extends HomeV4DimensionTabCommon {
  decision_gaps?: string[];
  why_it_matters?: string;
  evidence_to_collect?: string[];
  owner_hint?: string;
}

export interface HomeV4EvidenceTab extends HomeV4DimensionTabCommon {
  source_inventory?: string[];
  what_it_proves?: string;
  what_it_does_not_prove?: string;
  next_evidence_request?: string;
}

export interface HomeV4Dimension {
  dimension_key: string;
  executive_title: string;
  summary_tab?: HomeV4SummaryTab;
  data_tab?: HomeV4DataTab;
  relationship_tab?: HomeV4RelationshipTab;
  gaps_tab?: HomeV4GapsTab;
  evidence_tab?: HomeV4EvidenceTab;
  primary_visual: HomeV4PrimaryVisual;
  module_implications?: unknown;
}

// --- Change & Transformation content (industry_change / use_cases / relationships) ---

export interface HomeV4IndustryMovement {
  movement: string;
  classification: HomeV4Classification;
  evidence_maturity?: string;
  so_what: string;
  industry_realization: string;
  evidence_gate?: string;
}

export interface HomeV4NewWayOfOperating {
  shift: string;
  classification: HomeV4Classification;
  from_state: string;
  to_state: string;
  industry_realization?: string;
}

export interface HomeV4ChangeThesis {
  thesis: string;
  classification: HomeV4Classification;
  argument: string;
  industry_realization?: string;
}

export interface HomeV4IndustryChange {
  headline: string;
  framing: { narrative: string; classification?: HomeV4Classification };
  industry_movements: HomeV4IndustryMovement[];
  new_ways_of_operating: HomeV4NewWayOfOperating[];
  change_theses: HomeV4ChangeThesis[];
  benchmark_exhibits: HomeV4ChartVisual[];
}

export interface HomeV4UseCaseCandidate {
  name: string;
  current_work?: string;
  future_work?: string;
  owner?: string;
  value_mechanism?: string;
  module_handoff?: string;
  classification: HomeV4Classification;
  business_object_classification?: string;
}

export interface HomeV4UseCaseBatch {
  section_thesis?: string;
  qualified_candidates: HomeV4UseCaseCandidate[];
  foundations: HomeV4UseCaseCandidate[];
  early_ideas: HomeV4UseCaseCandidate[];
  priority_matrix_visual: HomeV4ChartVisual;
  sequencing_rationale?: { narrative?: string; statement?: string };
}

export interface HomeV4GraphProjection extends HomeV4DimensionTabCommon {
  projection_type: string;
  headline: string;
  executive_question?: string;
  root_entities?: string[];
  material_paths?: string[];
  business_meaning?: string;
  what_it_enables?: string;
  dependencies?: string;
  constraints?: string;
  unresolved_relationships?: string;
  evidence_boundary?: string;
  next_action?: string;
  graph_display_contract: HomeV4GraphVisual;
}

export interface HomeV4Candidate {
  tenant: { canonical_key?: string; display_name?: string };
  dimensions: HomeV4Dimension[];
  requested_dimensions?: string[] | null;
  industry_change?: HomeV4IndustryChange;
  use_cases?: HomeV4UseCaseBatch[];
  relationships?: { graph_projections: HomeV4GraphProjection[] };
}
