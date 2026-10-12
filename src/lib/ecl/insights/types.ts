export interface CanonicalRow {
  id: string;
  tenant_key: string;
  assessment_id: string;
  source_record_id: string | null;
  basis: string;
  value_state: string;
  review_state: string;
}

export interface InsightObject extends CanonicalRow {
  object_type: string;
  canonical_semantic_type: string;
  display_name: string;
  lifecycle_state: string;
  attributes_json: Record<string, unknown>;
}

export interface InsightRelationship extends CanonicalRow {
  from_object_id: string;
  to_object_id: string;
  relationship_type: string;
}

export interface InsightMeasure extends CanonicalRow {
  subject_object_id: string;
  metric_key: string;
  value_number: number | null;
  unit: string;
  period_start: string | null;
  period_end: string | null;
  scenario: string;
  quality_state: string;
  attributes_json: Record<string, unknown>;
}

export interface InsightSource {
  id: string;
  tenant_key: string;
  assessment_id: string;
  source_file_id: string;
  file_hash: string;
  record_hash: string;
  origin: string;
  quality_state: string;
  parse_state: string;
  access_class: string;
}

export interface CubeMeasureLink {
  cube_slice_id: string;
  measure_id: string;
  metric_key: string;
}

export interface InsightInput {
  tenantKey: string;
  assessmentId: string;
  asOf: string;
  objects: InsightObject[];
  relationships: InsightRelationship[];
  measures: InsightMeasure[];
  sources: InsightSource[];
  metricDefinitions: Array<{ metric_key: string; unit: string; definition: string }>;
  cubeMeasureLinks: CubeMeasureLink[];
  cubeManifests: Array<Record<string, unknown>>;
}

export type InsightRuleKey =
  | "priority-delivery-links"
  | "program-forecast-budget"
  | "ai-target-actual-gap"
  | "risk-critical-dependency"
  | "compatible-benchmark";

export interface InsightFinding {
  id: string;
  ruleKey: InsightRuleKey;
  kind: "record_finding" | "benchmark_comparison";
  headline: string;
  detail: string;
  objectIds: string[];
  relationshipIds: string[];
  measureIds: string[];
  sourceRecordIds: string[];
  cubeSliceIds: string[];
  caveats: string[];
  reviewState: "not_reviewed";
  agentReady: false;
}

export interface InsightPlan {
  tenantKey: string;
  assessmentId: string;
  asOf: string;
  sourceSetHash: string;
  ruleSetHash: string;
  resultHash: string;
  loadVersionHash: string;
  releaseId: string;
  findings: InsightFinding[];
  evaluations: Array<{
    ruleKey: InsightRuleKey;
    state: "matched" | "clear" | "not_assessable";
    findings: number;
    reason: string;
  }>;
  inventory: Record<string, { recorded: number; eligible: number; reviewed: number }>;
  excluded: { objects: number; relationships: number; measures: number };
}
