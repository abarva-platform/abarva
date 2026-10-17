import { createHash } from "node:crypto";

export type Json = null | boolean | number | string | Json[] | { [key: string]: Json };
export type JsonObject = { [key: string]: Json };

/** Shared grains retain their narrower meaning; they are never estate totals. */
export const EC_PRIVATE_TYPE_MAP = {
  "design:enterprise": "enterprise",
  "design:segment": "business_segment",
  "design:function": "business_function",
  "design:org_unit": "organization",
  "design:role": "persona",
  "design:workforce_cohort": "organization",
  "design:process": "process",
  "design:capability": "capability",
  "design:application": "application",
  "design:application_module": "application_module",
  "design:platform": "infrastructure",
  "design:deployment": "application_deployment",
  "design:data_asset": "data_product",
  "design:etl_job": "data_flow",
  "design:supplier": "vendor",
  "design:contract": "contract",
  "design:service": "process",
  "design:financial_line": "spend_line",
  "design:program": "program",
  "design:initiative": "initiative",
  "design:metric_definition": "metric",
  "design:risk": "risk",
  "design:control": "control",
  "design:ai_use_case": "ai_use_case",
  "design:ai_tool": "ai_tool",
  "design:usage_observation": "metric",
  "design:evidence_request": "evidence_request",
  "design:source_document": null,
  "design:evidence_item": null,
  "design:leadership_observation": "leadership_observation",
  "design:strategic_priority": "strategic_priority",
  "design:data_flow": "data_flow",
} as const;

export type EcPrivateType = keyof typeof EC_PRIVATE_TYPE_MAP;
export type EcCanonicalType = NonNullable<(typeof EC_PRIVATE_TYPE_MAP)[EcPrivateType]>;

export const EC_PRIVATE_CI_CLASS_MAP = {
  application: "design:application",
  logical_application: "design:application",
  application_module: "design:application_module",
} as const satisfies Record<string, EcPrivateType>;

export const EC_PRIVATE_RETENTION_ONLY_TYPES: readonly EcPrivateType[] = [
  "design:workforce_cohort", "design:etl_job", "design:service", "design:usage_observation",
];

const predicate = <const F extends readonly EcPrivateType[], const T extends readonly EcPrivateType[]>(
  relationship_type: string | null, from_types: F, to_types: T, reverse = false,
) => ({ relationship_type, from_types, to_types, reverse });

/** Null retains document evidence sidecar lineage without creating a graph edge. */
export const EC_PRIVATE_PREDICATE_MAP = {
  "design:has_segment": predicate("HAS_SEGMENT", ["design:enterprise"], ["design:segment"]),
  "design:has_function": predicate("HAS_FUNCTION", ["design:enterprise"], ["design:function"]),
  "design:belongs_to_segment": predicate("BELONGS_TO_SEGMENT", ["design:function", "design:org_unit"], ["design:segment"]),
  "design:part_of_unit": predicate("PART_OF_UNIT", ["design:function"], ["design:org_unit"]),
  "design:accountable_to": predicate("ACCOUNTABLE_TO", ["design:function", "design:process", "design:application", "design:platform", "design:program", "design:initiative", "design:service", "design:risk", "design:control", "design:strategic_priority"], ["design:role"]),
  "design:performs": predicate("PERFORMS", ["design:function"], ["design:process"]),
  "design:realizes": predicate("REALIZES", ["design:process"], ["design:capability"]),
  "design:supports_process": predicate("SUPPORTS", ["design:application"], ["design:process"]),
  "design:module_of": predicate("MODULE_OF", ["design:application_module"], ["design:application"]),
  "design:deployment_of": predicate("DEPLOYMENT_OF", ["design:deployment"], ["design:application"]),
  "design:hosted_on": predicate("HOSTED_ON", ["design:deployment", "design:data_asset", "design:etl_job"], ["design:platform"]),
  "design:feeds": predicate("FEEDS", ["design:application", "design:etl_job", "design:data_asset"], ["design:data_asset"]),
  "design:supplied_by": predicate("SUPPLIED_BY", ["design:application", "design:contract", "design:service", "design:ai_tool"], ["design:supplier"]),
  "design:covered_by": predicate("COVERED_BY", ["design:application", "design:service"], ["design:contract"]),
  "design:implements": predicate("IMPLEMENTS_CAPABILITY", ["design:initiative"], ["design:capability"]),
  "design:part_of_program": predicate("PART_OF_PROGRAM", ["design:initiative"], ["design:program"]),
  "design:advances": predicate("ADVANCES_PRIORITY", ["design:program", "design:initiative"], ["design:strategic_priority"]),
  "design:applies_to": predicate("APPLIES_TO", ["design:risk"], ["design:application", "design:process", "design:data_asset", "design:service"]),
  "design:mitigated_by": predicate("MITIGATES", ["design:risk"], ["design:control"], true),
  "design:uses_tool": predicate("USES", ["design:ai_use_case"], ["design:ai_tool"]),
  "design:assists_process": predicate("ASSISTS_PROCESS", ["design:ai_use_case"], ["design:process"]),
  "design:works_in": predicate("WORKS_IN", ["design:workforce_cohort"], ["design:function"]),
  "design:requests_evidence_for": predicate("EVIDENCE_REQUESTED_FOR", ["design:evidence_request"], ["design:risk", "design:control", "design:program", "design:initiative", "design:metric_definition"]),
  "design:cites_document": predicate(null, ["design:evidence_item"], ["design:source_document"]),
  "design:attributed_to_role": predicate("ATTRIBUTED_TO", ["design:leadership_observation"], ["design:role"]),
  "design:cost_for": predicate("COST_OF", ["design:financial_line"], ["design:application", "design:service"]),
  "design:measures": predicate("MEASURES", ["design:metric_definition"], ["design:process"]),
} as const;

export type EcPrivatePredicate = keyof typeof EC_PRIVATE_PREDICATE_MAP;

export interface EcPrivateBinding {
  tenant_key: string;
  assessment_id: string;
  id_namespace: string;
  fixture_namespace: string;
  isolation: "non_serving";
}

/** Only parser-surface JSON and raw bytes. Recipe, evaluations and QA are forbidden. */
export interface EcPrivateCandidateInput {
  raw_files: Record<string, Uint8Array>;
  csv_key_columns: Record<string, string>;
  sources: unknown[];
  entities: unknown[];
  assertions: unknown[];
  measurements: unknown[];
  edges: unknown[];
}

export interface EcPrivateLocator extends JsonObject {
  file_path: string;
  file_sha256: string;
  source_id: string;
  source_version_id: string;
}

export interface EcCandidateHolds {
  synthetic: true;
  fact_authority: "fictional_fixture_not_tenant_actuals";
  review_state: "not_reviewed";
  index_state: "not_indexed";
  agent_readiness_status: "blocked";
  downstream_context_policy: "exclude";
  independent_verification: "not_performed";
  approvals: {
    declaration: "not_granted"; load: "not_granted"; serving: "not_granted";
    finance: "not_granted"; approved_by: null; approved_at: null;
  };
}

export interface EcCandidateRow extends EcCandidateHolds {
  id: string;
  tenant_key: string;
  assessment_id: string;
  attributes_json: JsonObject;
}

export interface EcTimedCandidateRow extends EcCandidateRow {
  valid_from: string;
  valid_to: string | null;
  known_at: string;
  source_version: string;
  source_record_id: string;
  source_locator: EcPrivateLocator;
}

export interface EcSourceFileRow extends EcCandidateRow {
  source_id: string; source_version_id: string;
  file_name: string; file_hash: string; source_type: "synthetic_source_room";
  origin: "synthetic_generator"; source_owner: string;
  source_date: string | null; received_at: string | null; known_at: string;
  access_class: "restricted"; quality_state: "blocked";
}

export interface EcSourceRecordRow extends EcCandidateRow {
  source_file_id: string; native_id: string; record_type: "csv_row" | "text" | "json";
  row_number: number | null; payload_json: Json; parse_state: "parsed";
  source_locator: EcPrivateLocator;
}

export interface EcObjectRow extends EcTimedCandidateRow {
  object_key: string; object_type: EcCanonicalType; display_name: string;
  lifecycle_state: "candidate";
  canonical_semantic_type: string; basis: "source_recorded"; value_state: "unknown";
}

export interface EcAssertionRow extends EcTimedCandidateRow {
  subject_id: string; subject_kind: "object" | "document" | "evidence_item";
  subject_object_id: string | null;
  predicate: string; value_json: Json; missing_reason: string | null;
  fact_basis: string; value_state: string;
  source_access_scope: "unknown";
  access_decision: "deny";
}

export interface EcMeasureRow extends EcTimedCandidateRow {
  subject_object_id: string; metric_key: string; definition_id: string;
  definition_version: string | null; population_json: Json; dimensions_json: JsonObject;
  calendar: string | null; timezone: string | null; method: string | null;
  observation_key: string; observation_role: "target" | "actual" | "baseline";
  currency: string | null; unit: string;
  period_start: string | null; period_end: string | null;
  scenario: "candidate"; fact_basis: string; basis: "source_recorded" | "unknown";
  value_number: number | null; value_text: string | null; missing_reason: string | null;
  value_state: "unknown" | "estimated"; quality_state: "blocked";
}

export interface EcRelationshipRow extends EcTimedCandidateRow {
  from_object_id: string; relationship_type: string; to_object_id: string;
  qualifiers_json: JsonObject; basis: "source_recorded"; value_state: "unknown";
}

/** Sidecars are candidates for existing tables, not fabricated verified documents/proof. */
export interface EcDocumentRow extends EcTimedCandidateRow {
  document_key: string; title: string; source_file_id: string;
  file_hash: string; logical_source_id: string; document_source_version: string;
}

export interface EcEvidenceItemRow extends EcTimedCandidateRow {
  document_id: string; evidence_locator: EcPrivateLocator;
}

export interface EcSemanticGap {
  candidate_id: string;
  reason: "predicate_not_admitted" | "retention_only_grain" | "non_object_endpoint";
  semantic_type: string;
}

export interface EcPrivateCandidateEnvelope extends EcCandidateHolds {
  adapter_contract: "ec-private-candidate-adapter/v0";
  binding: EcPrivateBinding;
  source_file: EcSourceFileRow[];
  source_record: EcSourceRecordRow[];
  object: EcObjectRow[];
  assertion: EcAssertionRow[];
  measure: EcMeasureRow[];
  relationship: EcRelationshipRow[];
  document: EcDocumentRow[];
  evidence_item: EcEvidenceItemRow[];
  gaps: EcSemanticGap[];
}

export function ecPrivateSha256(value: string | Uint8Array): string {
  return createHash("sha256").update(value).digest("hex");
}

/** Private contract canonical JSON includes one LF, including nested object sorting. */
export function ecPrivateCanonicalJson(value: unknown): string {
  const sort = (item: unknown): unknown => {
    if (item === null || typeof item === "string" || typeof item === "boolean") return item;
    if (typeof item === "number" && Number.isFinite(item)) return item;
    if (Array.isArray(item)) return item.map(sort);
    if (typeof item === "object" && Object.getPrototypeOf(item) === Object.prototype) {
      return Object.fromEntries(Object.entries(item!).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)
        .map(([key, item]) => [key, sort(item)]));
    }
    throw new Error("Candidate contains a non-JSON value");
  };
  return `${JSON.stringify(sort(value))}\n`;
}

/** Same SHA-256 UUID bits and part order as the existing canonical loader. */
export function ecPrivateCanonicalUuid(binding: EcPrivateBinding, kind: string, native: string): string {
  const bytes = Buffer.from(ecPrivateSha256([
    binding.id_namespace, binding.tenant_key, binding.assessment_id, kind, native,
  ].join("|")).slice(0, 32), "hex");
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
