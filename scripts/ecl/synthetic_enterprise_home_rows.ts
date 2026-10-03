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
  enterprise: ["business_unit_profile", "enterprise_profile"],
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

/** A count the source holds, or null when it holds none. Never a default. */
function declaredCount(value: unknown): number | null {
  if (value === undefined || value === null || value === "") return null;
  const count = Number(value);
  return Number.isFinite(count) ? count : null;
}

/** One spelling for a value, whatever order an object's keys arrive in. */
function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (typeof value === "object" && value !== null) {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, entry]) => entry !== undefined)
        .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
        .map(([key, entry]) => [key, canonical(entry)]),
    );
  }
  return value ?? null;
}

/** The fields of a projected row that Home is served. */
export type ProjectedHomeRow = Pick<
  SyntheticHomeRow,
  | "page_key"
  | "row_key"
  | "row_type"
  | "section_key"
  | "title"
  | "summary"
  | "primary_object_id"
  | "source_record_id"
  | "source_hash"
  | "value_state"
  | "display_payload_json"
>;

/**
 * A hash of what a projection serves: every projected field of every row, in
 * one fixed order. `projection_hash` covers the canonical input each row was
 * made from; this covers the output, so a change to how a row is mapped, or to
 * a row after it was written, moves it. It is computed the same way from the
 * rows a projection is about to write and from the rows read back.
 */
export function projectedRowsHash(rows: readonly ProjectedHomeRow[]): string {
  const key = (row: ProjectedHomeRow) => `${row.page_key}:${row.row_key}`;
  return hash(
    [...rows]
      .sort((a, b) => (key(a) < key(b) ? -1 : key(a) > key(b) ? 1 : 0))
      .map((row) => [
        row.page_key,
        row.row_key,
        row.row_type,
        row.section_key,
        row.title,
        row.summary ?? null,
        row.primary_object_id,
        row.source_record_id,
        row.source_hash,
        row.value_state,
        canonical(row.display_payload_json),
      ]),
  );
}

/** A projected row as the landscape table holds it. */
export type PersistedHomeRow = Omit<ProjectedHomeRow, "source_record_id"> & {
  source_refs_json: unknown;
};

/**
 * The projected row a persisted row is. A projection writes exactly one source
 * reference per row; any other shape is kept as it was read, so it can never
 * be taken for the reference a projection wrote.
 */
export function persistedProjectedRow(row: PersistedHomeRow): ProjectedHomeRow {
  const refs = row.source_refs_json;
  const only =
    Array.isArray(refs) && refs.length === 1
      ? (refs[0] as Record<string, unknown> | null)
      : null;
  const written =
    only !== null &&
    typeof only === "object" &&
    Object.keys(only).length === 1 &&
    typeof only.source_record_id === "string";
  return {
    page_key: row.page_key,
    row_key: row.row_key,
    row_type: row.row_type,
    section_key: row.section_key,
    title: row.title,
    summary: row.summary,
    primary_object_id: row.primary_object_id,
    source_record_id: written
      ? (only.source_record_id as string)
      : `unrecognised:${JSON.stringify(canonical(refs))}`,
    source_hash: row.source_hash,
    value_state: row.value_state,
    display_payload_json: row.display_payload_json,
  };
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
      // A function that declares no segment has none. The source does not say
      // what such a function is, so no label is written for it.
      payload.business_segment = segmentId
        ? (byKey.get(segmentId)?.display_name ?? null)
        : null;
      payload.business_segment_key = segmentId || null;
      if (segmentId && !byKey.has(segmentId)) {
        throw new Error(`Unresolved declared segment ${segmentId}`);
      }
    } else if (object.object_type === "data_product") {
      payload.workload_name = object.display_name;
      payload.platform_name = attributes.platform_name;
      payload.function = attributes.function;
      // Missing stays missing: a workload the source does not count is not one.
      payload.workload_count = attributes.workload_count ?? null;
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
        // A total of two counts exists only when the source holds both.
        const employees = declaredCount(attributes.employee_count);
        const contractors = declaredCount(attributes.contractor_count);
        payload.role_count =
          employees === null || contractors === null
            ? null
            : employees + contractors;
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
