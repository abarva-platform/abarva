import Papa from "papaparse";
import { z } from "zod";
import { CANONICAL_TENANT_KEYS } from "../../src/config/tenants/CANONICAL_TENANTS";
import tenantRegistry from "../../datasets/tenant-inputs/tenant-input-registry.json";
import {
  EC_PRIVATE_TYPE_MAP, EC_PRIVATE_PREDICATE_MAP, EC_PRIVATE_RETENTION_ONLY_TYPES, EC_PRIVATE_CI_CLASS_MAP,
  ecPrivateCanonicalJson, ecPrivateCanonicalUuid, ecPrivateSha256,
  type EcPrivateBinding, type EcPrivateCandidateInput, type EcPrivateCandidateEnvelope,
  type EcCandidateHolds, type EcPrivateLocator, type EcPrivateType, type EcPrivatePredicate,
  type EcSourceRecordRow, type Json, type JsonObject,
} from "./ec_private_candidate_types";

export { EC_PRIVATE_TYPE_MAP, EC_PRIVATE_PREDICATE_MAP } from "./ec_private_candidate_types";

const text = z.string().min(1);
const hash = z.string().regex(/^[a-f0-9]{64}$/);
const nullableText = text.nullable();
const holdsSchema = z.object({
  synthetic: z.literal(true),
  fact_authority: z.literal("fictional_fixture_not_tenant_actuals"),
  review_state: z.literal("not_reviewed"),
  index_state: z.literal("not_indexed"),
  agent_readiness_status: z.literal("blocked"),
  downstream_context_policy: z.literal("exclude"),
  independent_verification: z.literal("not_performed"),
  approvals: z.object({ declaration: z.literal("not_granted"), load: z.literal("not_granted"),
    serving: z.literal("not_granted"), finance: z.literal("not_granted"),
    approved_by: z.null(), approved_at: z.null() }).strict(),
});
const base = holdsSchema.extend({
  contract_id: z.literal("ec-private-context/v0"), fixture_namespace: text,
  binding_key: text, id: text,
  access_scope: z.literal("unknown").nullable().optional(),
  source_access_scope: z.literal("unknown").optional(),
  access_decision: z.literal("deny").optional(),
  access_scope_revision: text.refine(value => value.trim().length > 0, "access revision must not be blank").optional(),
}).passthrough();
const locatorSchema = z.object({
  file_path: text, file_sha256: hash, source_id: text, source_version_id: text,
  row_number: z.number().int().min(2).optional(), row_end: z.number().int().min(2).optional(),
  row_key: text.optional(), column: text.optional(),
  line_start: z.number().int().positive().optional(), line_end: z.number().int().positive().optional(),
  excerpt_sha256: hash.optional(), json_pointer: z.string().optional(),
}).strict();
const timed = base.extend({
  valid_from: text, valid_to: nullableText, known_at: text,
  observed_at: nullableText, source_time: nullableText, received_at: text,
  source_locator: locatorSchema,
});
const sourceSchema = base.extend({
  source_id: text, source_version_id: text, file_path: text, file_sha256: hash,
  family: text, owner_role: text, native_namespace: text, logical_source_key: text,
  source_date: nullableText, received_at: nullableText.default(null), known_at: text,
  row_count: z.number().int().nonnegative().optional(),
});
const entitySchema = timed.extend({
  type: text, native_key: text, native_namespace: text, native_ref: text,
  display_label: text, evidence_locator: locatorSchema.optional(),
});
const assertionSchema = timed.extend({
  subject_id: text, predicate: text, value: z.unknown(),
  value_state: z.enum(["source_asserted_fictional", "unknown"]),
  missing_reason: nullableText, fact_basis: z.literal("fictional_source_assertion"),
});
const measureSchema = timed.extend({
  subject_id: text, definition_id: text, definition_version: nullableText,
  observation_key: text, scenario: z.enum(["proposed_target", "baseline", "actual", "fictional_actual"]),
  value: z.number().finite().nullable(),
  value_state: z.enum(["proposed_not_measured", "unknown", "fictional_assertion_not_enterprise_actual"]),
  missing_reason: nullableText,
  population: z.unknown(), dimensions: z.record(z.string(), z.unknown()),
  period_start: nullableText, period_end: nullableText, calendar: nullableText,
  timezone: nullableText, method: nullableText, unit: text, currency: nullableText, fact_basis: text,
});
const edgeSchema = timed.extend({
  from_id: text, to_id: text, predicate: text, dictionary_version: z.literal("ec-design-dictionary/v0"),
  semantic_key: hash, qualifiers: z.record(z.string(), z.unknown()),
  basis: z.literal("fictional_source_declared_not_reviewed"),
});
type Entity = z.infer<typeof entitySchema>;
type Locator = z.infer<typeof locatorSchema>;
type Timed = z.infer<typeof timed>;
type Source = z.infer<typeof sourceSchema>;
type RawRow = { values: Record<string, string>; start: number; end: number };

export function ecPrivateCandidateHolds(): EcCandidateHolds {
  return holdsSchema.parse({
    synthetic: true, fact_authority: "fictional_fixture_not_tenant_actuals",
    review_state: "not_reviewed", index_state: "not_indexed", agent_readiness_status: "blocked",
    downstream_context_policy: "exclude", independent_verification: "not_performed",
    approvals: { declaration: "not_granted", load: "not_granted", serving: "not_granted",
      finance: "not_granted", approved_by: null, approved_at: null },
  });
}

function requireCandidate(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`Invalid private candidate: ${message}`);
}

function accessDependency(row: unknown, source?: unknown, upstream: JsonObject[] = []): JsonObject {
  const record = row as Record<string, unknown>;
  const origin = source as Record<string, unknown> | undefined;
  const locator = record.source_locator as EcPrivateLocator | undefined;
  const dependency: JsonObject = {
    kind: "source_access_scope", source_access_scope: "unknown", access_decision: "deny",
    input_scope_state: record.access_scope === undefined && record.source_access_scope === undefined &&
      record.access_decision === undefined ? "absent" : "unknown",
    declared_scope_revision: typeof record.access_scope_revision === "string" ? record.access_scope_revision : null,
    source_scope_revision: typeof origin?.access_scope_revision === "string" ? origin.access_scope_revision : null,
    source_version: typeof origin?.id === "string" ? origin.id : locator?.source_version_id ?? null,
    source_locator: locator ? json(locator) : null,
    record_sha256: ecPrivateSha256(ecPrivateCanonicalJson(row)),
  };
  if (upstream.length) dependency.upstream_scope_revisions = upstream.map(item => item.revision_sha256);
  if (typeof record.id === "string" && record.id.startsWith("assert:")) {
    dependency.assertion_sha256 = dependency.record_sha256;
  }
  return { ...dependency, revision_sha256: ecPrivateSha256(ecPrivateCanonicalJson(dependency)) };
}

function date(value: string): number {
  requireCandidate(/^\d{4}-\d{2}-\d{2}$/.test(value), "invalid UTC date");
  const parsed = Date.parse(`${value}T00:00:00Z`);
  requireCandidate(Number.isFinite(parsed) && new Date(parsed).toISOString().slice(0, 10) === value, "invalid UTC date");
  return parsed;
}

function instant(value: string): number {
  requireCandidate(/^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d+)?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)$/.test(value), "timestamp requires valid time and offset");
  date(value.slice(0, 10));
  const parsed = Date.parse(value);
  requireCandidate(Number.isFinite(parsed), "invalid timestamp");
  return parsed;
}

function interval(row: Timed): void {
  const start = date(row.valid_from);
  requireCandidate(row.valid_to === null || date(row.valid_to) > start, "invalid half-open valid interval");
  const known = instant(row.known_at);
  requireCandidate(instant(row.received_at) <= known, "received time follows known-at");
  for (const value of [row.source_time, row.observed_at]) {
    requireCandidate(value === null || instant(value) <= known, "future source/observation chronology");
  }
}

function path(value: string): void {
  requireCandidate(/^raw\/[A-Za-z0-9_.\/-]+$/.test(value) &&
    value.split("/").every(part => part !== ".." && part !== "." && part !== ""), "raw-only relative path required");
}

function json(value: unknown): Json {
  ecPrivateCanonicalJson(value);
  return structuredClone(value) as Json;
}

function parseCsv(value: string, keyColumn: string): RawRow[] {
  let previous = 0;
  let physicalLine = 1;
  const records: { cells: string[]; start: number; end: number }[] = [];
  Papa.parse<string[]>(value, {
    skipEmptyLines: false,
    step(result) {
      requireCandidate(result.errors.length === 0, "malformed CSV");
      const chunk = value.slice(previous, result.meta.cursor);
      previous = result.meta.cursor;
      if (!chunk) return;
      const newlines = (chunk.match(/\n/g) ?? []).length;
      records.push({ cells: result.data, start: physicalLine,
        end: physicalLine + newlines - (chunk.endsWith("\n") ? 1 : 0) });
      physicalLine += newlines;
    },
  });
  const header = records.shift();
  requireCandidate(header && header.start === 1 && header.end === 1 &&
    header.cells.every(Boolean) && new Set(header.cells).size === header.cells.length &&
    header.cells.includes(keyColumn), "CSV header/key-column mismatch");
  const keys = new Set<string>();
  return records.map(record => {
    requireCandidate(record.cells.length === header.cells.length, "CSV column count mismatch");
    const values = Object.fromEntries(header.cells.map((key, i) => [key, record.cells[i]]));
    requireCandidate(values[keyColumn] && !keys.has(values[keyColumn]), "duplicate/empty raw native key");
    keys.add(values[keyColumn]);
    return { values, start: record.start, end: record.end };
  });
}

/** In-memory validation and mapping only. This does not authorize persistence or model use. */
export function adaptEcPrivateCandidateV0(
  input: EcPrivateCandidateInput, binding: EcPrivateBinding,
): EcPrivateCandidateEnvelope {
  const b = z.object({ tenant_key: text, assessment_id: text, id_namespace: text,
    fixture_namespace: text, isolation: z.literal("non_serving") }).strict().parse(binding);
  requireCandidate((CANONICAL_TENANT_KEYS as readonly string[]).includes(b.tenant_key) &&
    tenantRegistry.activeTenants.some(tenant => tenant.tenantKey === b.tenant_key &&
      tenant.packets.some(packet => packet.classification === "synthetic-demo")), "unregistered synthetic tenant binding");
  for (const part of [b.id_namespace, b.tenant_key, b.assessment_id]) {
    requireCandidate(!part.includes("|") && part.trim() === part, "ambiguous UUID binding component");
  }
  const parsedInput = z.object({
    raw_files: z.record(z.string(), z.instanceof(Uint8Array)), csv_key_columns: z.record(z.string(), text),
    sources: z.array(sourceSchema), entities: z.array(entitySchema), assertions: z.array(assertionSchema),
    measurements: z.array(measureSchema), edges: z.array(edgeSchema),
  }).strict().parse(input);
  const { sources, entities, assertions, measurements, edges } = parsedInput;
  const all = [...sources, ...entities, ...assertions, ...measurements, ...edges];
  const ids = new Set<string>();
  for (const row of all) {
    json(row);
    requireCandidate(row.binding_key === b.tenant_key && row.fixture_namespace === b.fixture_namespace,
      "mixed tenant/namespace binding");
    requireCandidate(!ids.has(row.id), "duplicate candidate id");
    ids.add(row.id);
    requireCandidate(/^(?:ent|srcv|assert|obs|edge):[a-f0-9]{64}$/.test(row.id), "invalid candidate id");
    for (const key of ["tenant_key", "assessment_id", "id_namespace"] as const) {
      requireCandidate(row[key] === undefined || row[key] === b[key], "mixed canonical binding");
    }
    for (const key of ["agent_ready", "qa_only", "indexed", "retrievable", "cite_verified", "serving_approved"]) {
      requireCandidate(row[key] === undefined || row[key] === false, "candidate readiness/QA escalation");
    }
  }
  const out: EcPrivateCandidateEnvelope = {
    ...ecPrivateCandidateHolds(), adapter_contract: "ec-private-candidate-adapter/v0", binding: { ...b },
    source_file: [], source_record: [], object: [], assertion: [], measure: [], relationship: [],
    document: [], evidence_item: [], gaps: [],
  };
  const uuid = (kind: string, native: string) => ecPrivateCanonicalUuid(b, kind, native);
  const attrs = (row: unknown, extra: JsonObject = {}): JsonObject => {
    const record = row as Record<string, unknown>;
    const locator = record.source_locator as EcPrivateLocator | undefined;
    const source = sourceByVersion.get(locator?.source_version_id ?? String(record.id));
    return { raw_candidate: json(row), access_dependency: accessDependency(row, source), ...extra };
  };
  const core = (kind: string, native: string, attributes_json: JsonObject) => ({
    ...ecPrivateCandidateHolds(), id: uuid(kind, native), tenant_key: b.tenant_key,
    assessment_id: b.assessment_id, attributes_json,
  });
  const sourceByVersion = new Map<string, Source>();
  const raw = new Map<string, { text: string; rows: RawRow[] }>();
  const sourceByPath = new Map<string, Source>();
  for (const [filePath, bytes] of Object.entries(parsedInput.raw_files)) {
    path(filePath);
    const decoded = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    requireCandidate(!decoded.includes("\r") && !decoded.startsWith("\ufeff"), "raw bytes require UTF-8 LF");
    requireCandidate(/\.(csv|txt|json)$/.test(filePath), "unsupported raw byte format");
    const keyColumn = parsedInput.csv_key_columns[filePath];
    requireCandidate(!filePath.endsWith(".csv") || keyColumn, "missing declared CSV key column");
    raw.set(filePath, { text: decoded, rows: filePath.endsWith(".csv") ? parseCsv(decoded, keyColumn) : [] });
  }
  for (const [sourceIndex, source] of sources.entries()) {
    path(source.file_path);
    const bytes = parsedInput.raw_files[source.file_path];
    requireCandidate(bytes && ecPrivateSha256(bytes) === source.file_sha256, "source byte hash mismatch");
    const sourceId = `src:${ecPrivateSha256(ecPrivateCanonicalJson([
      b.fixture_namespace, b.tenant_key, source.family, source.owner_role, source.native_namespace, source.logical_source_key,
    ]))}`;
    requireCandidate(source.source_id === sourceId && source.source_version_id ===
      `srcv:${ecPrivateSha256(ecPrivateCanonicalJson([sourceId, source.file_sha256]))}` &&
      source.id === source.source_version_id, "source identity/version mismatch");
    requireCandidate(!sourceByPath.has(source.file_path), "duplicate source path");
    sourceByPath.set(source.file_path, source);
    sourceByVersion.set(source.source_version_id, source);
    requireCandidate(source.row_count === undefined || source.row_count === raw.get(source.file_path)!.rows.length,
      "source row count mismatch");
    requireCandidate(source.source_date === null || date(source.source_date) <= instant(source.known_at),
      "future source content date");
    requireCandidate(source.received_at === null || instant(source.received_at) <= instant(source.known_at), "invalid source chronology");
    out.source_file.push({ ...core("source_file", source.id, attrs(input.sources[sourceIndex])), source_id: source.source_id,
      source_version_id: source.source_version_id, file_name: source.file_path, file_hash: source.file_sha256,
      source_type: "synthetic_source_room", origin: "synthetic_generator", source_owner: source.owner_role,
      source_date: source.source_date, received_at: source.received_at, known_at: source.known_at,
      access_class: "restricted", quality_state: "blocked" });
  }
  requireCandidate(raw.size === sourceByPath.size, "unmanifested raw bytes");
  requireCandidate(Object.keys(parsedInput.csv_key_columns).every(key => raw.has(key) && key.endsWith(".csv")),
    "unused CSV key declaration");

  const resolve = (locator: Locator): { source: Source; row?: RawRow; value?: string } => {
    path(locator.file_path);
    const source = sourceByVersion.get(locator.source_version_id);
    requireCandidate(source && source.source_id === locator.source_id && source.file_path === locator.file_path &&
      source.file_sha256 === locator.file_sha256, "locator source/version/hash mismatch");
    const file = raw.get(locator.file_path)!;
    if (locator.file_path.endsWith(".csv")) {
      requireCandidate(locator.line_start === undefined && locator.json_pointer === undefined, "mixed locator kinds");
      const row = file.rows.find(row => row.start === locator.row_number);
      requireCandidate(row && row.end === locator.row_end &&
        row.values[parsedInput.csv_key_columns[locator.file_path]] === locator.row_key, "CSV locator native row mismatch");
      requireCandidate(locator.column === undefined || Object.hasOwn(row.values, locator.column), "CSV locator column missing");
      return { source, row, value: locator.column ? row.values[locator.column] : undefined };
    }
    requireCandidate(locator.row_number === undefined && locator.column === undefined, "mixed locator kinds");
    if (locator.file_path.endsWith(".txt")) {
      const lines = file.text.split("\n");
      if (lines.at(-1) === "") lines.pop();
      requireCandidate(locator.line_start !== undefined && locator.line_end !== undefined &&
        locator.line_end >= locator.line_start && locator.line_end <= lines.length &&
        locator.excerpt_sha256 === ecPrivateSha256(lines.slice(locator.line_start - 1, locator.line_end).join("\n")),
      "text locator/excerpt mismatch");
      return { source };
    }
    requireCandidate(locator.json_pointer !== undefined &&
      /^(?:\/(?:[^~]|~[01])*)*$/.test(locator.json_pointer), "invalid JSON pointer");
    let value: unknown = JSON.parse(file.text);
    for (const part of locator.json_pointer === "" ? [] : locator.json_pointer.slice(1).split("/")) {
      const key = part.replace(/~1/g, "/").replace(/~0/g, "~");
      requireCandidate(value !== null && typeof value === "object" && Object.hasOwn(value, key), "unresolved JSON pointer");
      value = (value as Record<string, unknown>)[key];
    }
    return { source };
  };

  // Preserve every raw row, including unmaterialized and competing assertions.
  for (const source of sources) {
    const file = raw.get(source.file_path)!;
    if (source.file_path.endsWith(".csv")) {
      for (const row of file.rows) {
        const native = row.values[parsedInput.csv_key_columns[source.file_path]];
        const locator: EcPrivateLocator = { file_path: source.file_path, file_sha256: source.file_sha256,
          source_id: source.source_id, source_version_id: source.id, row_key: native,
          row_number: row.start, row_end: row.end };
        out.source_record.push({ ...core("source_record", ecPrivateCanonicalJson([source.id, native]),
          { access_dependency: accessDependency(source, source) }),
          source_file_id: uuid("source_file", source.id), native_id: native, record_type: "csv_row",
          row_number: row.start, payload_json: { ...row.values }, parse_state: "parsed", source_locator: locator });
      }
    } else {
      out.source_record.push({ ...core("source_record", ecPrivateCanonicalJson([source.id, "whole_file"]),
        { access_dependency: accessDependency(source, source) }),
        source_file_id: uuid("source_file", source.id), native_id: source.id,
        record_type: source.file_path.endsWith(".txt") ? "text" : "json", row_number: null,
        payload_json: source.file_path.endsWith(".txt") ? file.text : json(JSON.parse(file.text)),
        parse_state: "parsed", source_locator: { file_path: source.file_path,
          file_sha256: source.file_sha256, source_id: source.source_id, source_version_id: source.id } });
    }
  }
  const sourceRecord = (locator: Locator): EcSourceRecordRow => {
    resolve(locator);
    const found = out.source_record.find(row => row.source_locator.source_version_id === locator.source_version_id &&
      (locator.row_number === undefined || row.row_number === locator.row_number));
    requireCandidate(found, "source record is missing");
    return found;
  };
  const timedCore = (kind: string, row: Timed, extra: JsonObject = {}) => {
    interval(row);
    return { ...core(kind, row.id, attrs(row, extra)), valid_from: row.valid_from, valid_to: row.valid_to,
      known_at: row.known_at, source_version: row.source_locator.source_version_id,
      source_record_id: sourceRecord(row.source_locator).id, source_locator: json(row.source_locator) as EcPrivateLocator };
  };
  const entityById = new Map<string, Entity>();
  const entityByRef = new Map<string, Entity>();
  const tuples = new Set<string>();
  for (const entity of entities) {
    requireCandidate(Object.hasOwn(EC_PRIVATE_TYPE_MAP, entity.type), "unmapped entity type");
    const nativeTuple = [b.fixture_namespace, b.tenant_key, entity.type, entity.native_namespace, entity.native_key];
    requireCandidate(entity.id === `ent:${ecPrivateSha256(ecPrivateCanonicalJson(nativeTuple))}`, "entity candidate id mismatch");
    const tuple = ecPrivateCanonicalJson(nativeTuple);
    requireCandidate(!tuples.has(tuple) && !entityByRef.has(entity.native_ref), "duplicate native key/reference");
    tuples.add(tuple);
    const { row } = resolve(entity.source_locator);
    requireCandidate(row && row.values[parsedInput.csv_key_columns[entity.source_locator.file_path]] === entity.native_key,
      "entity native key differs from raw bytes");
    requireCandidate(row.values.label === entity.display_label, "entity label differs from raw bytes");
    if (row.values.ci_class) {
      const declaredClass = row.values.ci_class;
      const type = Object.hasOwn(EC_PRIVATE_TYPE_MAP, declaredClass) ? declaredClass :
        Object.hasOwn(EC_PRIVATE_CI_CLASS_MAP, declaredClass) ?
          EC_PRIVATE_CI_CLASS_MAP[declaredClass as keyof typeof EC_PRIVATE_CI_CLASS_MAP] : null;
      requireCandidate(type === entity.type, "raw ci_class differs from declared entity type");
    }
    entityById.set(entity.id, entity);
    entityByRef.set(entity.native_ref, entity);
  }
  const entity = (id: string): Entity => {
    const found = entityById.get(id);
    requireCandidate(found, "unresolved or cross-binding entity reference");
    return found;
  };
  const kind = (entity: Entity) => entity.type === "design:source_document" ? "document" :
    entity.type === "design:evidence_item" ? "evidence_item" : "object";
  const entityUuid = (row: Entity) => uuid(kind(row), row.id);
  const rawEntity = (row: Entity) => resolve(row.source_locator).row!.values;
  for (const row of entities) {
    const type = row.type as EcPrivateType;
    const objectType = EC_PRIVATE_TYPE_MAP[type];
    const semantic = row.type.slice("design:".length);
    const rawValues = rawEntity(row);
    if (type === "design:evidence_request") {
      requireCandidate(!row.evidence_locator && !rawValues.received_locator &&
        (!rawValues.received || rawValues.received === "false"), "request cannot become received evidence");
    }
    if (objectType !== null) {
      const retention = EC_PRIVATE_RETENTION_ONLY_TYPES.includes(type);
      out.object.push({ ...timedCore("object", row, { canonical_semantic_type: semantic,
        mapping_disposition: retention ? "retention_only" : "canonical_candidate" }),
        object_key: ecPrivateCanonicalJson([row.native_namespace, row.native_key]), object_type: objectType,
        display_name: row.display_label, lifecycle_state: "candidate", canonical_semantic_type: semantic,
        basis: "source_recorded", value_state: "unknown" });
      if (retention) out.gaps.push({ candidate_id: row.id, reason: "retention_only_grain", semantic_type: type });
    } else if (type === "design:source_document") {
      const docSource = sourceByPath.get(rawValues.document_path);
      requireCandidate(docSource && rawValues.logical_source_key === docSource.logical_source_key,
        "document does not resolve exact immutable source version");
      const documentAccess = [accessDependency(docSource, docSource)];
      out.document.push({ ...timedCore("document", row, {
        source_access_dependencies: documentAccess,
        access_dependency: accessDependency(row, sourceByVersion.get(row.source_locator.source_version_id), documentAccess),
      }), document_key: row.native_ref,
        title: row.display_label, source_file_id: uuid("source_file", docSource.id),
        file_hash: docSource.file_sha256, logical_source_id: docSource.source_id, document_source_version: docSource.id });
    } else {
      const doc = entityByRef.get(rawValues.document_ref);
      requireCandidate(doc?.type === "design:source_document" && row.evidence_locator,
        "evidence item lacks document/version locator");
      resolve(row.evidence_locator);
      requireCandidate(rawEntity(doc).document_path === row.evidence_locator.file_path &&
        rawValues.locator_file === row.evidence_locator.file_path &&
        Number(rawValues.line_start) === row.evidence_locator.line_start &&
        Number(rawValues.line_end) === row.evidence_locator.line_end, "evidence document revision/span mismatch");
      const documentSource = sourceByVersion.get(row.evidence_locator.source_version_id);
      requireCandidate(documentSource, "evidence source access cannot resolve its document version");
      const evidenceAccess = [accessDependency(doc, sourceByVersion.get(doc.source_locator.source_version_id)),
        accessDependency(documentSource, documentSource)];
      out.evidence_item.push({ ...timedCore("evidence_item", row, {
        source_access_dependencies: evidenceAccess,
        access_dependency: accessDependency(row, sourceByVersion.get(row.source_locator.source_version_id), evidenceAccess),
      }), document_id: entityUuid(doc),
        evidence_locator: json(row.evidence_locator) as EcPrivateLocator });
    }
  }

  const entityAccess = new Map([...out.object, ...out.document, ...out.evidence_item].map(row =>
    [row.id, row.attributes_json.access_dependency as JsonObject]));
  const endpointAccessFor = (rows: Entity[]): JsonObject[] => rows.map(row => {
    const dependency = entityAccess.get(entityUuid(row));
    requireCandidate(dependency, "canonical entity access dependency missing");
    return dependency;
  });
  const matchesCell = (value: unknown, cell: string): boolean => {
    if (value === null) return cell === "";
    if (typeof value !== "object") return String(value) === cell;
    try { return ecPrivateCanonicalJson(value) === ecPrivateCanonicalJson(JSON.parse(cell)); } catch { return false; }
  };
  for (const row of assertions) {
    const subject = entity(row.subject_id);
    const located = resolve(row.source_locator);
    requireCandidate(row.source_locator.column && located.value !== undefined, "assertion requires source cell");
    requireCandidate(row.value !== undefined && (row.value !== null || row.missing_reason), "null assertion requires missing reason");
    if (row.predicate === "design:accountable_to") {
      const ref = row.value as { entity_id?: string } | null;
      const owner = ref?.entity_id ? entity(ref.entity_id) : null;
      requireCandidate(row.value !== null && typeof row.value === "object" && !Array.isArray(row.value) &&
        Object.keys(row.value).length === 1 && owner?.type === "design:role" && located.value === owner.native_ref &&
        located.row?.values.subject_ref === subject.native_ref, "accountable assertion reference mismatch");
    } else {
      requireCandidate(row.source_locator.file_path === subject.source_locator.file_path &&
        row.source_locator.row_key === subject.source_locator.row_key, "assertion subject/source-row mismatch");
      const reference = row.value !== null && typeof row.value === "object" && !Array.isArray(row.value) &&
        Object.keys(row.value).length === 1 && Object.hasOwn(row.value, "entity_id") ?
        (row.value as { entity_id: unknown }) : null;
      const matchesValue = reference ? typeof reference.entity_id === "string" &&
        entity(reference.entity_id).native_ref === located.value : matchesCell(row.value, located.value);
      requireCandidate(row.predicate === `design:attribute/${row.source_locator.column}` &&
        matchesValue, "assertion differs from declared raw cell");
    }
    requireCandidate(subject.type !== "design:evidence_request" ||
      !["design:attribute/received", "design:attribute/received_locator"].includes(row.predicate) ||
      row.value === false || row.value === null, "request assertion cannot fabricate evidence");
    const typedReference = row.value !== null && typeof row.value === "object" && !Array.isArray(row.value) &&
      Object.keys(row.value).length === 1 && typeof (row.value as {entity_id?:unknown}).entity_id === "string"
      ? (row.value as {entity_id:string}).entity_id : null;
    const canonicalValue = typedReference === null ? json(row.value) : {entity_id:entityUuid(entity(typedReference))};
    const assertionAccess = endpointAccessFor([subject, ...(typedReference === null ? [] : [entity(typedReference)])]);
    out.assertion.push({ ...timedCore("assertion", row, { source_access_scope: "unknown", access_decision: "deny",
      source_access_dependencies: assertionAccess,
      access_dependency: accessDependency(row, sourceByVersion.get(row.source_locator.source_version_id), assertionAccess),
    }),
      subject_id: entityUuid(subject), subject_kind: kind(subject),
      subject_object_id: kind(subject) === "object" ? entityUuid(subject) : null,
      predicate: row.predicate, value_json: canonicalValue, value_state: row.value_state,
      missing_reason: row.missing_reason, fact_basis: row.fact_basis,
      source_access_scope: "unknown", access_decision: "deny" });
  }

  for (const row of measurements) {
    const subject = entity(row.subject_id);
    const definition = entity(row.definition_id);
    requireCandidate(kind(subject) === "object" && definition.type === "design:metric_definition", "invalid measurement subject/definition");
    const located = resolve(row.source_locator);
    requireCandidate(located.row && row.source_locator.column === "value" &&
      matchesCell(row.value, located.value!) && located.row.values.observation_key === row.observation_key,
    "measurement value/key differs from raw bytes");
    const values = located.row.values;
    requireCandidate(values.metric_ref === definition.native_ref && values.subject_ref === subject.native_ref &&
      values.scenario === row.scenario && values.fact_basis === row.fact_basis &&
      values.qa_only === "false", "measurement subject/scenario/basis escalation");
    for (const key of ["population", "dimensions", "period_start", "period_end", "calendar", "timezone", "method", "unit", "currency"] as const) {
      requireCandidate(matchesCell(row[key], values[key]), "measurement grain differs from raw bytes");
    }
    requireCandidate(rawEntity(definition).definition_version === row.definition_version, "measurement definition version mismatch");
    if (row.period_start !== null) date(row.period_start);
    if (row.period_end !== null) date(row.period_end);
    requireCandidate(row.period_start === null || row.period_end === null || date(row.period_end) > date(row.period_start), "invalid measure period");
    requireCandidate(row.value !== null || row.missing_reason, "null measure requires missing reason");
    requireCandidate(row.scenario !== "actual" && row.scenario !== "baseline" || row.value === null,
      "actual/baseline is not measured in the private candidate contract");
    requireCandidate(row.value === null ? row.value_state === "unknown" && row.fact_basis === "not_supplied" :
      row.scenario === "proposed_target" ? row.value_state === "proposed_not_measured" &&
        row.fact_basis === "human_defined_proposal_not_measured" :
        row.scenario === "fictional_actual" && row.value_state === "fictional_assertion_not_enterprise_actual" &&
        row.fact_basis === "fictional_source_assertion", "measurement authority escalation");
    const observationRole = row.scenario === "proposed_target" ? "target" : row.scenario === "baseline" ? "baseline" : "actual";
    const observationGrain = { fixture_namespace: b.fixture_namespace, tenant_key: b.tenant_key,
      subject_id: row.subject_id, definition_id: row.definition_id, definition_version: row.definition_version,
      population: json(row.population), dimensions: json(row.dimensions), period_start: row.period_start,
      period_end: row.period_end, calendar: row.calendar, timezone: row.timezone, scenario: row.scenario,
      method: row.method, fact_basis: row.fact_basis, unit: row.unit, currency: row.currency };
    const measureAccess = endpointAccessFor([subject, definition]);
    out.measure.push({ ...timedCore("measure", row, { observation_grain: observationGrain,
      candidate_observation_key: row.observation_key, candidate_scenario: row.scenario,
      source_access_dependencies: measureAccess,
      access_dependency: accessDependency(row, sourceByVersion.get(row.source_locator.source_version_id), measureAccess),
    }),
      subject_object_id: entityUuid(subject), metric_key: uuid("metric_definition", definition.id),
      definition_id: entityUuid(definition), definition_version: row.definition_version,
      observation_key: ecPrivateSha256(ecPrivateCanonicalJson(observationGrain)), observation_role: observationRole,
      population_json: json(row.population), dimensions_json: json(row.dimensions) as JsonObject,
      calendar: row.calendar, timezone: row.timezone, method: row.method, currency: row.currency, unit: row.unit,
      period_start: row.period_start, period_end: row.period_end, scenario: "candidate", fact_basis: row.fact_basis,
      basis: row.value === null ? "unknown" : "source_recorded", value_number: row.value, value_text: null,
      missing_reason: row.missing_reason, value_state: row.value === null ? "unknown" : "estimated", quality_state: "blocked" });
  }

  const parentEdges = new Map<string, typeof edges>();
  const semanticEdges = new Set<string>();
  for (const row of edges) {
    const from = entity(row.from_id);
    const to = entity(row.to_id);
    requireCandidate(Object.hasOwn(EC_PRIVATE_PREDICATE_MAP, row.predicate), "unmapped relationship predicate");
    const mapping = EC_PRIVATE_PREDICATE_MAP[row.predicate as EcPrivatePredicate];
    requireCandidate((mapping.from_types as readonly string[]).includes(from.type) &&
      (mapping.to_types as readonly string[]).includes(to.type) && from.id !== to.id,
    "wrong edge direction/endpoint type or self-loop");
    interval(row);
    const located = resolve(row.source_locator);
    requireCandidate(located.row && located.row.values.from_ref === from.native_ref &&
      located.row.values.to_ref === to.native_ref && located.row.values.predicate === row.predicate &&
      located.row.values.valid_from === row.valid_from && (located.row.values.valid_to || null) === row.valid_to &&
      matchesCell(row.qualifiers, located.row.values.qualifiers), "edge differs from raw assertion");
    const q = row.qualifiers;
    if (row.predicate === "design:hosted_on" && from.type === "design:deployment") {
      requireCandidate(Object.keys(q).length === 1 && ["production", "dr", "test"].includes(String(q.environment)) &&
        q.environment === rawEntity(from).environment, "wrong hosted_on qualifier/environment");
    } else if (row.predicate === "design:feeds") {
      const flow = typeof q.flow_ref === "string" ? entityByRef.get(q.flow_ref) : undefined;
      requireCandidate(Object.keys(q).length === 1 && flow?.type === "design:data_flow" &&
        rawEntity(flow).source_ref === from.native_ref && rawEntity(flow).target_ref === to.native_ref,
      "wrong feeds flow qualifier/endpoints");
    } else if (row.predicate === "design:belongs_to_segment") {
      requireCandidate(Object.keys(q).every(key => key === "shared_service") &&
        (q.shared_service === undefined || typeof q.shared_service === "boolean" &&
        q.shared_service === (rawEntity(to).scope === "shared_service")), "wrong segment scope qualifier");
    } else requireCandidate(Object.keys(q).length === 0, "unexpected edge qualifier");
    const endpointAccess = endpointAccessFor(mapping.reverse ? [to, from] : [from, to]);
    const references: Entity[] = [];
    if (row.predicate === "design:feeds") {
      const flow = entityByRef.get(String(q.flow_ref));
      requireCandidate(flow, "feed access cannot resolve the declared flow");
      references.push(flow);
    }
    const referenceAccess = endpointAccessFor(references);
    const edgeAccess = accessDependency(row, sourceByVersion.get(row.source_locator.source_version_id),
      [...endpointAccess, ...referenceAccess]);
    if (row.predicate === "design:cites_document") {
      requireCandidate(from.evidence_locator && rawEntity(from).document_ref === to.native_ref &&
        from.evidence_locator.file_path === rawEntity(to).document_path, "wrong citation document revision");
    }
    const semantic = ecPrivateCanonicalJson([row.predicate, row.from_id, row.to_id, row.qualifiers, row.valid_from, row.valid_to]);
    requireCandidate(!semanticEdges.has(semantic), "duplicate semantic edge");
    semanticEdges.add(semantic);
    if (["design:module_of", "design:deployment_of", "design:part_of_unit"].includes(row.predicate)) {
      const parentKey = `${row.predicate}|${row.from_id}`;
      const prior = parentEdges.get(parentKey) ?? [];
      requireCandidate(prior.every(other => row.valid_to !== null && row.valid_to <= other.valid_from ||
        other.valid_to !== null && other.valid_to <= row.valid_from), "overlapping hierarchy parent interval");
      prior.push(row);
      parentEdges.set(parentKey, prior);
    }
    if (row.predicate === "design:cites_document") {
      const item = out.evidence_item.find(item => item.id === entityUuid(from));
      requireCandidate(item?.document_id === entityUuid(to), "citation sidecar contradicts evidence document");
      sourceRecord(row.source_locator).attributes_json.evidence_link = {
        evidence_item_id: entityUuid(from), document_id: entityUuid(to),
        source_locator: json(row.source_locator),
        access_dependency: edgeAccess, endpoint_access_dependencies: endpointAccess,
      };
      continue;
    }
    if (mapping.relationship_type === null || kind(from) !== "object" || kind(to) !== "object") {
      out.gaps.push({ candidate_id: row.id, semantic_type: row.predicate,
        reason: mapping.relationship_type === null ? "predicate_not_admitted" : "non_object_endpoint" });
      // The raw source record and complete edge payload remain inspectable without a graph edge.
      sourceRecord(row.source_locator).attributes_json.retained_edge = json(row);
      continue;
    }
    out.relationship.push({ ...timedCore("relationship", row, {
      endpoint_access_dependencies: endpointAccess, access_dependency: edgeAccess,
      reference_access_dependencies: referenceAccess, reference_object_ids: references.map(entityUuid),
    }),
      from_object_id: entityUuid(mapping.reverse ? to : from), relationship_type: mapping.relationship_type,
      to_object_id: entityUuid(mapping.reverse ? from : to), qualifiers_json: json(q) as JsonObject,
      basis: "source_recorded", value_state: "unknown" });
  }
  return out;
}
