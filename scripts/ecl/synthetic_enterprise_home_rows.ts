import { createHash } from "node:crypto";

export interface CanonicalHomeObject {
  id: string;
  object_key: string;
  object_type: string;
  display_name: string;
  source_record_id: string;
  value_state: string;
  attributes_json: Record<string, unknown>;
}

export interface SyntheticHomeRow {
  page_key: string;
  row_key: string;
  row_type: string;
  section_key: string;
  title: string;
  summary: string | null;
  primary_object_id: string;
  source_record_id: string;
  source_hash: string;
  value_state: string;
  display_payload_json: Record<string, unknown>;
}

const PAGE_BY_TYPE: Record<string, [string, string]> = {
  business_segment: ["business_unit_profile", "business_segment"],
  business_function: ["business_unit_profile", "business_function"],
  application: ["applications_systems", "application"],
  contract: ["vendor_contracts", "contract"],
  infrastructure: ["infrastructure_platforms", "infrastructure"],
  data_platform: ["infrastructure_platforms", "infrastructure"],
  data_product: ["data_assets_integrations", "data_analytics_workload"],
  data_flow: ["current_state_data_flow", "data_flow"],
  metric: ["metrics_outcomes", "metric"],
  risk: ["risks_controls", "risk"],
  program: ["programs_initiatives", "program"],
  ai_use_case: ["ai_use_cases", "ai_use_case"],
  leadership_observation: ["executive_interviews", "executive_interview"],
  strategic_priority: ["strategy_value_creation", "priority"],
  spend_line: ["performance_value", "spend_line"],
  evidence_request: ["what_needs_attention", "evidence_request"],
  external_benchmark: ["performance_value", "external_benchmark"],
};

const INTERNAL_ATTRIBUTES = new Set([
  "source",
  "synthetic_review_state",
  "client_attestation_state",
  "provenance_class",
]);

function hash(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

export function buildSyntheticHomeRows(
  objects: readonly CanonicalHomeObject[],
): SyntheticHomeRow[] {
  const byKey = new Map(objects.map((object) => [object.object_key, object]));
  const rows: SyntheticHomeRow[] = [];
  for (const object of objects) {
    const attributes = object.attributes_json;
    const mapping =
      object.object_type === "persona"
        ? attributes.role_id
          ? (["business_unit_profile", "workforce_role"] as const)
          : attributes.owner_id
            ? (["org_ownership", "organization_ownership"] as const)
            : null
        : PAGE_BY_TYPE[object.object_type];
    if (!mapping) continue;
    if (!object.source_record_id) {
      throw new Error(`Missing source lineage for ${object.object_key}`);
    }
    const [page_key, row_type] = mapping;
    const payload: Record<string, unknown> = Object.fromEntries(
      Object.entries(attributes).filter(([key]) => !INTERNAL_ATTRIBUTES.has(key)),
    );
    if (object.object_type === "business_function") {
      const segmentId = String(attributes.business_segment_id ?? "");
      payload.business_segment = segmentId
        ? (byKey.get(segmentId)?.display_name ?? null)
        : "Enterprise shared function";
      payload.business_segment_key = segmentId || null;
      if (segmentId && !byKey.has(segmentId)) {
        throw new Error(`Unresolved declared segment ${segmentId}`);
      }
    } else if (object.object_type === "data_product") {
      payload.workload_name = object.display_name;
      payload.platform_name = attributes.platform_name;
      payload.function = attributes.function;
      payload.workload_count = attributes.workload_count ?? 1;
    } else if (object.object_type === "metric") {
      payload.metric_name = attributes.kpi_name;
      payload.actual_value = attributes.kpi_value;
      payload.metric_domain = attributes.business_function;
    } else if (object.object_type === "program") {
      payload.pct_complete = attributes.completion_pct;
      payload.business_sponsor = attributes.sponsor_function;
    } else if (object.object_type === "leadership_observation") {
      payload.stakeholder_role = attributes.interviewee_role;
      payload.question = attributes.theme;
    } else if (object.object_type === "data_flow") {
      const source = String(attributes.source_object_ref ?? "");
      const target = String(attributes.target_object_ref ?? "");
      payload.source_system_name = byKey.get(source)?.display_name ?? null;
      payload.target_system_name = byKey.get(target)?.display_name ?? null;
    } else if (
      object.object_type === "infrastructure" ||
      object.object_type === "data_platform"
    ) {
      payload.platform_name = attributes.platform_name ?? object.display_name;
    } else if (object.object_type === "persona") {
      if (attributes.role_id) {
        payload.persona_or_role = object.display_name;
        payload.function_name = attributes.function;
        payload.role_count =
          Number(attributes.employee_count ?? 0) +
          Number(attributes.contractor_count ?? 0);
      } else {
        payload.org_unit = attributes.accountability ?? object.display_name;
        payload.leader_name_or_role =
          attributes.owner_role ?? object.display_name;
        payload.org_unit_id = attributes.owner_id;
      }
    }
    rows.push({
      page_key,
      row_key: object.object_key,
      row_type,
      section_key: page_key,
      title: object.display_name,
      summary: null,
      primary_object_id: object.id,
      source_record_id: object.source_record_id,
      source_hash: hash({
        id: object.id,
        type: object.object_type,
        attributes,
        source: object.source_record_id,
      }),
      value_state: object.value_state,
      display_payload_json: payload,
    });
  }
  return rows.sort((a, b) =>
    `${a.page_key}:${a.row_key}`.localeCompare(`${b.page_key}:${b.row_key}`),
  );
}
