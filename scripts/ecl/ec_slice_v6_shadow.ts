import { createHash } from "node:crypto";

export interface ShadowObjectRow {
  id: string;
  tenant_key: string;
  assessment_id: string;
  object_type: string;
  display_name: string;
  source_record_id: string | null;
  attributes_json: Record<string, unknown>;
}

export interface ShadowRelationshipRow {
  id: string;
  tenant_key: string;
  assessment_id: string;
  from_object_id: string;
  to_object_id: string;
  relationship_type: string;
  source_record_id: string | null;
  attributes_json: Record<string, unknown>;
  qualifiers_json?: Record<string, unknown> | null;
  valid_from?: string | null;
  valid_to?: string | null;
}

/** Physical relationship_types shape; empty family lists cannot prove type safety. */
export interface ShadowRelationshipTypeRow {
  relationship_type: string;
  relationship_category: string;
  directionality: "directed" | "bidirectional";
  active: boolean;
  allowed_from_object_families: readonly string[];
  allowed_to_object_families: readonly string[];
  inverse_relationship_type?: string | null;
}

export interface ShadowReaderSlice {
  tenantKey: string;
  assessmentId: string;
  objects: readonly ShadowObjectRow[];
  relationships: readonly ShadowRelationshipRow[];
}

export interface ShadowPlanInput extends ShadowReaderSlice {
  dictionary: readonly ShadowRelationshipTypeRow[];
  readerSlice?: ShadowReaderSlice;
}

type Metadata = Record<string, unknown>;

export interface ShadowGraphNodeRow {
  node_key: string;
  tenant_key: string;
  contract_version: string;
  node_id: string;
  object_family: string;
  business_display_name: string;
  canonical_name: string;
  source_record_id: string;
  source_record_key: string;
  source_evidence_refs: Metadata[];
  confidence: "unknown";
  known_gaps: string[];
  materialized_from: "ecl_context_object";
  metadata: Metadata;
}

export interface ShadowGraphEdgeRow {
  edge_key: string;
  tenant_key: string;
  contract_version: string;
  relationship_id: string;
  from_node_id: string;
  to_node_id: string;
  from_node_key: string;
  to_node_key: string;
  from_object_family: string;
  to_object_family: string;
  relationship_type: string;
  relationship_category: string;
  relationship_confidence: "unknown";
  evidence_basis: string;
  raw_relationship_type: string;
  source_relationship_key: string;
  source_evidence_refs: Metadata[];
  known_gaps: string[];
  caveats: string[];
  node_resolution_state: "resolved";
  metadata: Metadata;
}

export interface ShadowIssue {
  record_kind: "object" | "relationship" | "dictionary" | "reader";
  record_id: string | null;
  code: string;
}

export interface ShadowSetComparison {
  planned: string[];
  reader: string[];
  only_in_plan: string[];
  only_in_reader: string[];
  equal: boolean;
}

export interface ShadowComparison {
  status: "not_compared" | "invalid_reader" | "match" | "mismatch";
  node_ids: ShadowSetComparison | null;
  edge_ids: ShadowSetComparison | null;
  /** JSON tuples [relationship UUID, from UUID, canonical verb, to UUID]. */
  edge_set: ShadowSetComparison | null;
  semantic_nodes: ShadowSetComparison | null;
  counts: {
    planned: { nodes: number; edges: number };
    reader: { nodes: number; edges: number };
  } | null;
  issues: ShadowIssue[];
  counting_basis: string;
}

export interface ShadowGraphQualityReportRow {
  report_key: string;
  tenant_key: string;
  contract_version: string;
  graph_version: string;
  total_nodes: number;
  total_edges: number;
  explicit_node_count: number;
  inferred_node_count: 0;
  normalized_relationship_type_count: number;
  high_confidence_edge_count: 0;
  medium_confidence_edge_count: 0;
  low_confidence_edge_count: 0;
  unknown_confidence_edge_count: number;
  quality_status: "not_ready";
  summary: string;
  findings: ShadowIssue[];
  metadata: Metadata;
}

export interface ShadowPlan {
  tenant_key: string;
  assessment_id: string;
  contract_version: string;
  quality_status: "not_ready";
  governance_status: "blocked";
  serving_eligible: false;
  agent_ready: false;
  executive_safe: false;
  adoption_state: "excluded";
  graph_nodes: ShadowGraphNodeRow[];
  graph_edges: ShadowGraphEdgeRow[];
  graph_quality_reports: ShadowGraphQualityReportRow[];
  comparison: ShadowComparison;
  issues: ShadowIssue[];
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ASSESSMENT = /^[A-Za-z0-9][A-Za-z0-9._:/-]{0,199}$/;
const FAMILY = /^[a-z][a-z0-9_]*$/;
const VERB = /^[A-Z][A-Z0-9_]*$/;
const SHADOW_STATE = {
  shadow_only: true,
  quality_status: "not_ready",
  governance_status: "blocked",
  serving_eligible: false,
  agent_ready: false,
  executive_safe: false,
  adoption_state: "excluded",
} as const;
const COUNTING_BASIS =
  "Distinct accepted explicit object UUIDs and physical directed edges in one tenant/assessment; " +
  "equivalent inverse/bidirectional assertions with equal qualifiers and time bounds share an edge. " +
  "Rejected rows and coalesced assertions are counted separately; no business metrics are computed.";

function uuid(value: unknown): value is string {
  return typeof value === "string" && UUID.test(value);
}

function assessment(value: unknown): value is string {
  return typeof value === "string" && ASSESSMENT.test(value);
}

function family(value: unknown): value is string {
  return typeof value === "string" && FAMILY.test(value);
}

function verb(value: unknown): value is string {
  return typeof value === "string" && VERB.test(value);
}

function id(value: string): string {
  return value.toLowerCase();
}

function object(value: unknown): value is Record<string, unknown> {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    (Object.getPrototypeOf(value) === Object.prototype ||
      Object.getPrototypeOf(value) === null)
  );
}

// Validate JSON before copying so metadata cannot silently drop non-JSON evidence.
function json(value: unknown, ancestors = new Set<object>()): boolean {
  if (value === null || typeof value === "string" || typeof value === "boolean")
    return true;
  if (typeof value === "number") return Number.isFinite(value);
  if (!Array.isArray(value) && !object(value)) return false;
  if (Array.isArray(value) && Object.keys(value).length !== value.length)
    return false;
  if (ancestors.has(value)) return false;
  ancestors.add(value);
  const valid = Object.values(value).every((item) => json(item, ancestors));
  ancestors.delete(value);
  return valid;
}

function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (object(value))
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stable(value[key])}`)
      .join(",")}}`;
  return JSON.stringify(value);
}

function copy<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function key(kind: string, ...parts: string[]): string {
  return `ec-shadow:${kind}:${createHash("sha256").update(JSON.stringify(parts)).digest("hex")}`;
}

function semanticType(row: ShadowObjectRow): string {
  const declared = row.attributes_json.canonical_semantic_type;
  return declared === undefined
    ? row.object_type
    : typeof declared === "string"
      ? declared
      : "";
}

function validTime(value: unknown): value is string {
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}(?:T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d{1,6})?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d))?$/.test(
      value,
    )
  )
    return false;
  if (!Number.isFinite(Date.parse(value))) return false;
  const date = value.slice(0, 10);
  return new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) === date;
}

export function ecSliceV6ShadowContractVersion(assessmentId: string): string {
  if (!assessment(assessmentId))
    throw new Error(
      "An assessment scope of 1-200 letters, digits, or ._:/- is required",
    );
  return `ec-slice-v6-shadow/v1/assessment/${assessmentId}`;
}

function scopeIssue(
  row: { tenant_key: string; assessment_id: string },
  scope: ShadowReaderSlice,
): string | null {
  if (row.tenant_key !== scope.tenantKey) return "tenant_fence";
  if (
    !assessment(row.assessment_id) ||
    row.assessment_id !== scope.assessmentId
  )
    return "assessment_fence";
  return null;
}

function difference(planned: string[], reader: string[]): ShadowSetComparison {
  const p = [...new Set(planned)].sort();
  const r = [...new Set(reader)].sort();
  const ps = new Set(p);
  const rs = new Set(r);
  const only_in_plan = p.filter((value) => !rs.has(value));
  const only_in_reader = r.filter((value) => !ps.has(value));
  return {
    planned: p,
    reader: r,
    only_in_plan,
    only_in_reader,
    equal: only_in_plan.length === 0 && only_in_reader.length === 0,
  };
}

/** Comparison is identity/structure evidence only, never serving or readiness approval. */
export function compareEcSliceV6Shadow(
  plan: Pick<
    ShadowPlan,
    "tenant_key" | "assessment_id" | "graph_nodes" | "graph_edges"
  >,
  reader?: ShadowReaderSlice,
): ShadowComparison {
  const base = {
    node_ids: null,
    edge_ids: null,
    edge_set: null,
    semantic_nodes: null,
    counts: null,
    issues: [],
    counting_basis: COUNTING_BASIS,
  };
  if (!reader) return { ...base, status: "not_compared" };
  const issues: ShadowIssue[] = [];
  const issue = (record_id: string | null, code: string) =>
    issues.push({ record_kind: "reader", record_id, code });
  if (
    reader.tenantKey !== plan.tenant_key ||
    !assessment(reader.assessmentId) ||
    reader.assessmentId !== plan.assessment_id
  )
    issue(null, "reader_scope_mismatch");
  const nodes = new Set<string>();
  const edges = new Set<string>();
  for (const row of reader.objects) {
    const fence = scopeIssue(row, reader);
    if (fence) issue(row.id, fence);
    if (!uuid(row.id)) issue(row.id, "invalid_uuid");
    else if (nodes.has(id(row.id))) issue(row.id, "duplicate_object_id");
    else nodes.add(id(row.id));
    if (
      !object(row.attributes_json) ||
      !json(row.attributes_json) ||
      !family(row.object_type) ||
      !family(semanticType(row))
    )
      issue(row.id, "invalid_semantic_type");
  }
  for (const row of reader.relationships) {
    const fence = scopeIssue(row, reader);
    if (fence) issue(row.id, fence);
    if (!uuid(row.id) || !uuid(row.from_object_id) || !uuid(row.to_object_id))
      issue(row.id, "invalid_uuid");
    else {
      if (edges.has(id(row.id))) issue(row.id, "duplicate_relationship_id");
      edges.add(id(row.id));
      if (
        !nodes.has(id(row.from_object_id)) ||
        !nodes.has(id(row.to_object_id))
      )
        issue(row.id, "unresolved_endpoint");
    }
    if (!verb(row.relationship_type))
      issue(row.id, "invalid_relationship_type");
  }
  // Do not let a foreign/ambiguous reader slice contribute IDs or successful counts.
  if (issues.length) return { ...base, status: "invalid_reader", issues };
  const node_ids = difference(
    plan.graph_nodes.map((row) => row.node_id),
    [...nodes],
  );
  const edge_ids = difference(
    plan.graph_edges.map((row) => row.relationship_id),
    [...edges],
  );
  const edge_set = difference(
    plan.graph_edges.map((row) =>
      JSON.stringify([
        row.relationship_id,
        row.from_node_id,
        row.relationship_type,
        row.to_node_id,
      ]),
    ),
    reader.relationships.map((row) =>
      JSON.stringify([
        id(row.id),
        id(row.from_object_id),
        row.relationship_type,
        id(row.to_object_id),
      ]),
    ),
  );
  const semantic_nodes = difference(
    plan.graph_nodes.map((row) =>
      JSON.stringify([row.node_id, row.object_family]),
    ),
    reader.objects.map((row) =>
      JSON.stringify([id(row.id), semanticType(row)]),
    ),
  );
  return {
    status: [node_ids, edge_ids, edge_set, semantic_nodes].every(
      (set) => set.equal,
    )
      ? "match"
      : "mismatch",
    node_ids,
    edge_ids,
    edge_set,
    semantic_nodes,
    counts: {
      planned: {
        nodes: plan.graph_nodes.length,
        edges: plan.graph_edges.length,
      },
      reader: {
        nodes: reader.objects.length,
        edges: reader.relationships.length,
      },
    },
    issues,
    counting_basis: COUNTING_BASIS,
  };
}

/** Pure insert-shaped plan. No database, clock, reader mutation, promotion, or serving hook. */
export function planEcSliceV6Shadow(input: ShadowPlanInput): ShadowPlan {
  if (
    typeof input.tenantKey !== "string" ||
    !input.tenantKey.trim() ||
    input.tenantKey.trim() !== input.tenantKey
  ) {
    throw new Error("An explicitly declared tenant scope is required");
  }
  const contract_version = ecSliceV6ShadowContractVersion(input.assessmentId);
  const assessment_id = input.assessmentId;
  const metadata = () => ({ ...SHADOW_STATE, assessment_id });
  const issues: ShadowIssue[] = [];
  const issue = (
    record_kind: ShadowIssue["record_kind"],
    record_id: string | null,
    code: string,
  ) => issues.push({ record_kind, record_id, code });

  function scoped<
    T extends { id: string; tenant_key: string; assessment_id: string },
  >(rows: readonly T[], kind: "object" | "relationship"): T[] {
    const groups = new Map<string, T[]>();
    for (const row of rows) {
      const fence = scopeIssue(row, input);
      if (fence) {
        issue(kind, null, fence);
        continue;
      }
      if (!uuid(row.id)) {
        issue(kind, row.id, "invalid_uuid");
        continue;
      }
      const group = groups.get(id(row.id)) ?? [];
      group.push(row);
      groups.set(id(row.id), group);
    }
    return [...groups.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .flatMap(([rowId, group]) => {
        if (group.length === 1) return group;
        issue(kind, rowId, `duplicate_${kind}_id`);
        return [];
      });
  }

  const dictionary = new Map<string, ShadowRelationshipTypeRow>();
  const dictionaryGroups = new Map<string, ShadowRelationshipTypeRow[]>();
  for (const row of input.dictionary) {
    const group = dictionaryGroups.get(row.relationship_type) ?? [];
    group.push(row);
    dictionaryGroups.set(row.relationship_type, group);
  }
  for (const [verb, group] of dictionaryGroups) {
    const row = group[0];
    if (group.length !== 1) {
      issue("dictionary", verb, "duplicate_dictionary_type");
      continue;
    }
    const families = [
      row.allowed_from_object_families,
      row.allowed_to_object_families,
    ];
    if (
      !VERB.test(verb) ||
      typeof verb !== "string" ||
      typeof row.relationship_category !== "string" ||
      !row.relationship_category.trim() ||
      !["directed", "bidirectional"].includes(row.directionality) ||
      (row.inverse_relationship_type != null &&
        (typeof row.inverse_relationship_type !== "string" ||
          !VERB.test(row.inverse_relationship_type))) ||
      families.some(
        (values) =>
          !Array.isArray(values) ||
          !values.length ||
          values.some((value) => !family(value)),
      )
    ) {
      issue("dictionary", verb, "invalid_dictionary_definition");
      continue;
    }
    if (row.active !== true) {
      issue("dictionary", verb, "inactive_dictionary_type");
      continue;
    }
    dictionary.set(verb, row);
  }

  const graph_nodes: ShadowGraphNodeRow[] = [];
  for (const row of scoped(input.objects, "object")) {
    if (!uuid(row.source_record_id)) {
      issue("object", row.id, "missing_or_invalid_source_lineage");
      continue;
    }
    if (!object(row.attributes_json) || !json(row.attributes_json)) {
      issue("object", row.id, "invalid_metadata");
      continue;
    }
    const semanticFamily = semanticType(row);
    if (!family(row.object_type) || !family(semanticFamily)) {
      issue("object", row.id, "invalid_semantic_type");
      continue;
    }
    if (typeof row.display_name !== "string" || !row.display_name.trim()) {
      issue("object", row.id, "missing_display_name");
      continue;
    }
    graph_nodes.push({
      node_key: key("node", input.tenantKey, contract_version, id(row.id)),
      tenant_key: input.tenantKey,
      contract_version,
      node_id: id(row.id),
      object_family: semanticFamily,
      business_display_name: row.display_name,
      canonical_name: row.display_name,
      source_record_id: id(row.source_record_id),
      source_record_key: id(row.source_record_id),
      source_evidence_refs: [
        { source_record_id: id(row.source_record_id), assessment_id },
      ],
      confidence: "unknown",
      known_gaps: ["shadow_only_not_reviewed"],
      materialized_from: "ecl_context_object",
      metadata: {
        ...metadata(),
        object_type: row.object_type,
        canonical_semantic_type: semanticFamily,
        source_record_id: id(row.source_record_id),
        attributes_json: copy(row.attributes_json),
      },
    });
  }
  const nodes = new Map(graph_nodes.map((row) => [row.node_id, row]));
  const accepted: ShadowRelationshipRow[] = [];
  for (const row of scoped(input.relationships, "relationship")) {
    if (!uuid(row.source_record_id)) {
      issue("relationship", row.id, "missing_or_invalid_source_lineage");
      continue;
    }
    if (
      !object(row.attributes_json) ||
      !json(row.attributes_json) ||
      (row.qualifiers_json != null &&
        (!object(row.qualifiers_json) || !json(row.qualifiers_json)))
    ) {
      issue("relationship", row.id, "invalid_metadata");
      continue;
    }
    const times = [row.valid_from, row.valid_to];
    if (
      times.some((time) => time != null && !validTime(time)) ||
      (row.valid_from != null &&
        row.valid_to != null &&
        Date.parse(row.valid_from) > Date.parse(row.valid_to))
    ) {
      issue("relationship", row.id, "invalid_validity_interval");
      continue;
    }
    if (!uuid(row.from_object_id) || !uuid(row.to_object_id)) {
      issue("relationship", row.id, "invalid_endpoint_uuid");
      continue;
    }
    const from = nodes.get(id(row.from_object_id));
    const to = nodes.get(id(row.to_object_id));
    if (!from || !to) {
      issue("relationship", row.id, "unresolved_endpoint");
      continue;
    }
    if (from.node_id === to.node_id) {
      issue("relationship", row.id, "self_edge");
      continue;
    }
    const definition = dictionary.get(row.relationship_type);
    if (!definition) {
      issue("relationship", row.id, "missing_dictionary_type");
      continue;
    }
    if (
      !definition.allowed_from_object_families.includes(from.object_family) ||
      !definition.allowed_to_object_families.includes(to.object_family)
    ) {
      issue("relationship", row.id, "dictionary_endpoint_orientation_or_type");
      continue;
    }
    accepted.push(row);
  }

  // Union only explicitly asserted equivalent edges; never emit an inverse or infer a node.
  const parents = accepted.map((_, index) => index);
  function root(index: number): number {
    while (parents[index] !== index) {
      parents[index] = parents[parents[index]];
      index = parents[index];
    }
    return index;
  }
  const signatures = new Map<string, number>();
  accepted.forEach((row, index) => {
    const definition = dictionary.get(row.relationship_type)!;
    const qualifiers = [
      row.qualifiers_json ?? null,
      row.valid_from ?? null,
      row.valid_to ?? null,
    ];
    const variants = [
      [
        id(row.from_object_id),
        row.relationship_type,
        id(row.to_object_id),
        qualifiers,
      ],
    ];
    if (definition.directionality === "bidirectional")
      variants.push([
        id(row.to_object_id),
        row.relationship_type,
        id(row.from_object_id),
        qualifiers,
      ]);
    if (definition.inverse_relationship_type)
      variants.push([
        id(row.to_object_id),
        definition.inverse_relationship_type,
        id(row.from_object_id),
        qualifiers,
      ]);
    for (const variant of variants) {
      const signature = stable(variant);
      const previous = signatures.get(signature);
      if (previous !== undefined) parents[root(index)] = root(previous);
      signatures.set(signature, index);
    }
  });
  const groups = new Map<number, ShadowRelationshipRow[]>();
  accepted.forEach((row, index) => {
    const group = groups.get(root(index)) ?? [];
    group.push(row);
    groups.set(root(index), group);
  });
  const graph_edges = [...groups.values()]
    .map((group): ShadowGraphEdgeRow => {
      const row = group[0];
      const from = nodes.get(id(row.from_object_id))!;
      const to = nodes.get(id(row.to_object_id))!;
      return {
        edge_key: key("edge", input.tenantKey, contract_version, id(row.id)),
        tenant_key: input.tenantKey,
        contract_version,
        relationship_id: id(row.id),
        from_node_id: from.node_id,
        to_node_id: to.node_id,
        from_node_key: from.node_key,
        to_node_key: to.node_key,
        from_object_family: from.object_family,
        to_object_family: to.object_family,
        relationship_type: row.relationship_type,
        relationship_category: dictionary.get(row.relationship_type)!
          .relationship_category,
        relationship_confidence: "unknown",
        evidence_basis: "explicit_canonical_relationship_source_record",
        raw_relationship_type: row.relationship_type,
        source_relationship_key: id(row.id),
        source_evidence_refs: group.map((assertion) => ({
          relationship_id: id(assertion.id),
          source_record_id: id(assertion.source_record_id!),
          assessment_id,
        })),
        known_gaps: ["shadow_only_not_reviewed"],
        caveats: [
          "Non-serving shadow plan; not approved for executive or agent use.",
        ],
        node_resolution_state: "resolved",
        metadata: {
          ...metadata(),
          source_record_id: id(row.source_record_id!),
          attributes_json: copy(row.attributes_json),
          qualifiers_json: copy(row.qualifiers_json ?? null),
          valid_from: row.valid_from ?? null,
          valid_to: row.valid_to ?? null,
          canonical_relationships: group.map((assertion) =>
            copy({
              id: id(assertion.id),
              tenant_key: input.tenantKey,
              assessment_id,
              from_object_id: id(assertion.from_object_id),
              to_object_id: id(assertion.to_object_id),
              relationship_type: assertion.relationship_type,
              source_record_id: id(assertion.source_record_id!),
              attributes_json: assertion.attributes_json,
              qualifiers_json: assertion.qualifiers_json ?? null,
              valid_from: assertion.valid_from ?? null,
              valid_to: assertion.valid_to ?? null,
            }),
          ),
        },
      };
    })
    .sort((a, b) => a.relationship_id.localeCompare(b.relationship_id));
  issues.sort((a, b) => stable(a).localeCompare(stable(b)));
  const comparison = compareEcSliceV6Shadow(
    { tenant_key: input.tenantKey, assessment_id, graph_nodes, graph_edges },
    input.readerSlice,
  );
  const report: ShadowGraphQualityReportRow = {
    report_key: key("quality", input.tenantKey, contract_version),
    tenant_key: input.tenantKey,
    contract_version,
    graph_version: "ec-slice-v6-shadow/v1",
    total_nodes: graph_nodes.length,
    total_edges: graph_edges.length,
    explicit_node_count: graph_nodes.length,
    inferred_node_count: 0,
    normalized_relationship_type_count: graph_edges.length,
    high_confidence_edge_count: 0,
    medium_confidence_edge_count: 0,
    low_confidence_edge_count: 0,
    unknown_confidence_edge_count: graph_edges.length,
    quality_status: "not_ready",
    summary:
      "Non-serving shadow plan only. Governance, serving, and executive use remain blocked.",
    findings: copy(issues),
    metadata: {
      ...metadata(),
      counting_basis: COUNTING_BASIS,
      input_counts: {
        objects: input.objects.length,
        relationships: input.relationships.length,
      },
      accepted_relationship_assertions: accepted.length,
      coalesced_relationship_assertions: accepted.length - graph_edges.length,
      rejected_row_counts: {
        objects: input.objects.length - graph_nodes.length,
        relationships: input.relationships.length - accepted.length,
      },
      issue_counting_basis:
        "Findings by code, not rejected row counts; duplicate IDs may reject multiple rows per finding.",
      issue_counts: Object.fromEntries(
        [...new Set(issues.map((finding) => finding.code))].map((code) => [
          code,
          issues.filter((finding) => finding.code === code).length,
        ]),
      ),
      comparison: copy(comparison),
      unassessed_fields: [
        "executive_readiness_score",
        "source_owner_coverage_rate",
        "evidence_coverage_rate",
        "orphan_edge_rate",
        "self_edge_rate",
        "placeholder_object_family_rate",
        "normalized_relationship_type_rate",
      ],
      physical_default_values_are_not_assessments: true,
      source_lineage_validation:
        "source_record_uuid_presence_only; upstream existence and authority are unverified",
    },
  };
  return {
    tenant_key: input.tenantKey,
    assessment_id,
    contract_version,
    ...SHADOW_STATE,
    graph_nodes,
    graph_edges,
    graph_quality_reports: [report],
    comparison,
    issues,
  };
}
