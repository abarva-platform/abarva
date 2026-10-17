import Papa from "papaparse";
import { CANONICAL_TENANT_KEYS } from "../../../src/config/tenants/CANONICAL_TENANTS";
import registry from "../../../datasets/tenant-inputs/tenant-input-registry.json";
import { ecPrivateCandidateHolds } from "../adapt_ec_private_candidate_v0";
import {
  ecPrivateCanonicalJson, ecPrivateSha256,
  type EcPrivateBinding, type EcPrivateCandidateInput, type EcPrivateType,
} from "../ec_private_candidate_types";

export interface EcPrivateFixtureOptions {
  label_suffix?: string;
  source_revision?: string;
  same_application_labels?: boolean;
  contradictory_evidence_link?: boolean;
}

/** Reconstructs raw bytes and candidates together; contains no node:test registrations. */
export function makeEcPrivateCandidateFixture(options: EcPrivateFixtureOptions = {}): {
  input: EcPrivateCandidateInput; binding: EcPrivateBinding;
} {
  const tenant = CANONICAL_TENANT_KEYS.find(key => registry.activeTenants.some(tenant =>
    tenant.tenantKey === key && tenant.packets.some(packet => packet.classification === "synthetic-demo")));
  if (!tenant) throw new Error("No canonical synthetic fixture binding available");
  const binding: EcPrivateBinding = { tenant_key: tenant, assessment_id: "assessment-ec-private-unit",
    fixture_namespace: "fixture:ec-adapter-unit:v0", id_namespace: "ecl:ec-adapter-unit:v0", isolation: "non_serving" };
  const envelope = () => ({ ...ecPrivateCandidateHolds(), contract_id: "ec-private-context/v0",
    fixture_namespace: binding.fixture_namespace, binding_key: tenant });
  const times = { valid_from: "2026-09-01", valid_to: null, known_at: "2026-10-01T00:00:00Z",
    observed_at: null, received_at: "2026-10-01T00:00:00Z", source_time: "2026-09-30T00:00:00Z" };
  const input: EcPrivateCandidateInput = { raw_files: {}, csv_key_columns: {}, sources: [],
    entities: [], assertions: [], measurements: [], edges: [] };
  const digest = (value: unknown) => ecPrivateSha256(ecPrivateCanonicalJson(value));
  const addSource = (file: string, bytes: string, logicalKey: string, keyColumn?: string, rowCount?: number) => {
    input.raw_files[file] = Buffer.from(bytes);
    if (keyColumn) input.csv_key_columns[file] = keyColumn;
    const fileHash = ecPrivateSha256(bytes);
    const sourceId = `src:${digest([binding.fixture_namespace, tenant, "fixture", "Fictional custodian", "fixture:rows:v0", logicalKey])}`;
    const id = `srcv:${digest([sourceId, fileHash])}`;
    const source = { ...envelope(), id, source_id: sourceId, source_version_id: id,
      family: "fixture", owner_role: "Fictional custodian", native_namespace: "fixture:rows:v0",
      logical_source_key: logicalKey, file_path: file, file_sha256: fileHash,
      source_date: "2026-09-30", received_at: times.received_at, known_at: times.known_at,
      ...(rowCount === undefined ? {} : { row_count: rowCount }) };
    input.sources.push(source);
    return source;
  };
  const addCsv = (file: string, rows: Record<string, string>[], key: string) =>
    addSource(file, Papa.unparse(rows, { newline: "\n" }) + "\n", file, key, rows.length);
  const locator = (source: ReturnType<typeof addSource>, row: number, key: string, column?: string) => ({
    file_path: source.file_path, file_sha256: source.file_sha256, source_id: source.source_id,
    source_version_id: source.id, row_number: row, row_end: row, row_key: key,
    ...(column ? { column } : {}),
  });
  type Spec = { key: string; type: EcPrivateType; label?: string; fields?: Record<string, string> };
  const specs: Spec[] = [
    { key: "app-a", type: "design:application" }, { key: "app-b", type: "design:application" },
    { key: "app-c", type: "design:application" }, { key: "module-a", type: "design:application_module" },
    { key: "deploy-a", type: "design:deployment", fields: { environment: "production" } },
    { key: "deploy-dr", type: "design:deployment", fields: { environment: "dr" } },
    { key: "deploy-b", type: "design:deployment", fields: { environment: "production" } },
    { key: "deploy-c", type: "design:deployment", fields: { environment: "test" } },
    { key: "role-a", type: "design:role" }, { key: "role-b", type: "design:role" },
    { key: "function-a", type: "design:function", label: "Fictional Service Function" },
    { key: "unit-a", type: "design:org_unit", label: "Fictional Operations Unit" },
    { key: "process-a", type: "design:process", label: "Fictional Request Process" },
    { key: "capability-a", type: "design:capability", label: "Fictional Request Capability" },
    { key: "initiative-a", type: "design:initiative", label: "Fictional Service Initiative" },
    { key: "program-a", type: "design:program", label: "Fictional Service Program" },
    { key: "priority-a", type: "design:strategic_priority", label: "Fictional Service Priority" },
    { key: "metric-a", type: "design:metric_definition",
      fields: { definition_version: "v0-proposal" } },
    { key: "risk-a", type: "design:risk" }, { key: "control-a", type: "design:control" },
    { key: "platform-a", type: "design:platform" }, { key: "asset-a", type: "design:data_asset" },
    { key: "flow-a", type: "design:data_flow", fields: { source_ref: "objects/app-a", target_ref: "objects/asset-a" } },
    { key: "usecase-a", type: "design:ai_use_case", label: "Fictional Request Assistance" },
    { key: "tool-a", type: "design:ai_tool" },
    { key: "request-a", type: "design:evidence_request", fields: { received: "false" } },
    { key: "segment-a", type: "design:segment", fields: { scope: "shared_service" } },
    { key: "doc-a", type: "design:source_document", fields: { document_path: "raw/fixture/note-a.txt", logical_source_key: "note", revision: "a" } },
    { key: "doc-b", type: "design:source_document", fields: { document_path: "raw/fixture/note-b.txt", logical_source_key: "note", revision: "b" } },
    { key: "evidence-a", type: "design:evidence_item", fields: { document_ref: "objects/doc-a", locator_file: "raw/fixture/note-a.txt", line_start: "1", line_end: "2" } },
    { key: "evidence-b", type: "design:evidence_item", fields: { document_ref: "objects/doc-b", locator_file: "raw/fixture/note-b.txt", line_start: "1", line_end: "2" } },
  ];
  const rows = specs.map(spec => ({ native_key: spec.key, ci_class: spec.type,
    label: (options.same_application_labels && spec.type === "design:application" ? "Fictional application" : spec.label ?? `Fictional ${spec.key}`) + (options.label_suffix ?? ""),
    environment: "", scope: "", source_ref: "", target_ref: "", definition_version: "",
    document_path: "", logical_source_key: "", revision: "", document_ref: "", locator_file: "",
    line_start: "", line_end: "", received: "", received_locator: "",
    source_revision: options.source_revision ?? "v1", ...spec.fields }));
  const objectSource = addCsv("raw/fixture/objects.csv", rows, "native_key");
  const noteA = addSource("raw/fixture/note-a.txt", "Fictional note revision A.\nUnreviewed observation.\n", "note");
  const noteB = addSource("raw/fixture/note-b.txt", "Fictional note revision B.\nUnreviewed observation.\n", "note");
  const byKey = new Map<string, Record<string, unknown>>();
  specs.forEach((spec, i) => {
    const id = `ent:${digest([binding.fixture_namespace, tenant, spec.type, "fixture:rows:v0", spec.key])}`;
    const note = spec.key === "evidence-a" ? noteA : noteB;
    const row = { ...envelope(), ...times, id, type: spec.type, native_key: spec.key,
      native_namespace: "fixture:rows:v0", native_ref: `objects/${spec.key}`, display_label: rows[i].label,
      source_locator: locator(objectSource, i + 2, spec.key),
      ...(spec.type === "design:evidence_item" ? { evidence_locator: { file_path: note.file_path,
        file_sha256: note.file_sha256, source_id: note.source_id, source_version_id: note.id,
        line_start: 1, line_end: 2,
        excerpt_sha256: ecPrivateSha256(Buffer.from(input.raw_files[note.file_path]).toString().trimEnd()) } } : {}) };
    input.entities.push(row);
    byKey.set(spec.key, row);
  });
  const idFor = (key: string) => byKey.get(key)!.id as string;
  const ownerRows = ["role-a", "role-b"].map((owner, i) => ({
    assertion_key: `owner-${i}`, subject_ref: "objects/app-a", value_ref: `objects/${owner}`,
  }));
  const ownerSource = addCsv("raw/fixture/owners.csv", ownerRows, "assertion_key");
  ownerRows.forEach((row, i) => input.assertions.push({ ...envelope(), ...times,
    id: `assert:${digest([ownerSource.id, row.assertion_key])}`, subject_id: idFor("app-a"),
    predicate: "design:accountable_to", value: { entity_id: idFor(i === 0 ? "role-a" : "role-b") },
    fact_basis: "fictional_source_assertion", value_state: "source_asserted_fictional", missing_reason: null,
    source_locator: locator(ownerSource, i + 2, row.assertion_key, "value_ref") }));
  const observations = [
    { key: "target", scenario: "proposed_target", value: "17", basis: "human_defined_proposal_not_measured" },
    { key: "baseline", scenario: "baseline", value: "", basis: "not_supplied" },
    { key: "actual", scenario: "actual", value: "", basis: "not_supplied" },
    { key: "volume-a", scenario: "fictional_actual", value: "23", basis: "fictional_source_assertion" },
    { key: "volume-b", scenario: "fictional_actual", value: "29", basis: "fictional_source_assertion" },
  ];
  const measureRows = observations.map(row => ({ observation_key: row.key, metric_ref: "objects/metric-a",
    subject_ref: "objects/process-a", scenario: row.scenario, value: row.value, fact_basis: row.basis,
    population: "", dimensions: "{}", period_start: "", period_end: "", calendar: "", timezone: "",
    method: "", unit: "percent", currency: "", qa_only: "false" }));
  const measureSource = addCsv("raw/fixture/measures.csv", measureRows, "observation_key");
  observations.forEach((row, i) => input.measurements.push({ ...envelope(), ...times,
    id: `obs:${digest([measureSource.id, row.key])}`, observation_key: row.key, subject_id: idFor("process-a"),
    definition_id: idFor("metric-a"), definition_version: "v0-proposal", scenario: row.scenario,
    value: row.value === "" ? null : Number(row.value), value_state: row.value === "" ? "unknown" :
      row.scenario === "fictional_actual" ? "fictional_assertion_not_enterprise_actual" : "proposed_not_measured",
    missing_reason: row.value === "" ? "source_evidence_not_supplied" : null,
    population: null, dimensions: {}, period_start: null, period_end: null, calendar: null, timezone: null,
    method: null, unit: "percent", currency: null, fact_basis: row.basis,
    source_locator: locator(measureSource, i + 2, row.key, "value") }));
  const links: [string, string, string, Record<string, string | boolean>][] = [
    ["module-a", "design:module_of", "app-a", {}],
    ...["deploy-a", "deploy-dr", "deploy-b", "deploy-c"].flatMap((key, i) => [
      [key, "design:deployment_of", i < 2 ? "app-a" : i === 2 ? "app-b" : "app-c", {}],
      [key, "design:hosted_on", "platform-a", { environment: i === 1 ? "dr" : i === 3 ? "test" : "production" }],
    ] as [string, string, string, Record<string, string>][]),
    ["risk-a", "design:mitigated_by", "control-a", {}],
    ["app-a", "design:supports_process", "process-a", {}],
    ["usecase-a", "design:uses_tool", "tool-a", {}],
    ["request-a", "design:requests_evidence_for", "risk-a", {}],
    ["app-a", "design:feeds", "asset-a", { flow_ref: "objects/flow-a" }],
    ["function-a", "design:belongs_to_segment", "segment-a", { shared_service: true }],
    ["function-a", "design:part_of_unit", "unit-a", {}],
    ["function-a", "design:performs", "process-a", {}],
    ["process-a", "design:realizes", "capability-a", {}],
    ["initiative-a", "design:implements", "capability-a", {}],
    ["initiative-a", "design:part_of_program", "program-a", {}],
    ["program-a", "design:advances", "priority-a", {}],
    ["initiative-a", "design:advances", "priority-a", {}],
    ["usecase-a", "design:assists_process", "process-a", {}],
    ["evidence-a", "design:cites_document", options.contradictory_evidence_link ? "doc-b" : "doc-a", {}],
    ["evidence-b", "design:cites_document", "doc-b", {}],
  ];
  const edgeRows = links.map(([from, predicate, to, qualifiers], i) => ({ relationship_key: `link-${i}`,
    from_ref: `objects/${from}`, predicate, to_ref: `objects/${to}`, qualifiers: JSON.stringify(qualifiers),
    valid_from: times.valid_from, valid_to: "", basis: "fictional_source_declared_not_reviewed" }));
  const edgeSource = addCsv("raw/fixture/links.csv", edgeRows, "relationship_key");
  links.forEach(([from, predicate, to, qualifiers], i) => input.edges.push({ ...envelope(), ...times,
    id: `edge:${digest([edgeSource.id, `link-${i}`])}`, from_id: idFor(from), to_id: idFor(to),
    predicate, qualifiers, dictionary_version: "ec-design-dictionary/v0",
    semantic_key: digest([predicate, idFor(from), idFor(to), qualifiers, times.valid_from, null]),
    basis: "fictional_source_declared_not_reviewed", source_locator: locator(edgeSource, i + 2, `link-${i}`) }));
  return { input, binding };
}

export const createEcPrivateCandidateFixture = makeEcPrivateCandidateFixture;
