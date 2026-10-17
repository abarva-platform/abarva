import { createHash } from "node:crypto";

// Rehearsal-only operator rules; product adoption is a separate governed release.

export type EcJson = null | boolean | number | string | readonly EcJson[] | { readonly [key: string]: EcJson };

// The contract enumerates eight states despite the brief's seven-state count.
// not_comparable is distinct from missing evidence and from a contradiction.
export const EC_SLICE_STATES = [
  "finding", "clear", "unknown", "partial", "conflicting", "restricted", "out_of_scope", "not_comparable",
] as const;
export type EcRuleState = (typeof EC_SLICE_STATES)[number];
export type EcRuleId = "ownership-coverage" | "competing-assertions" | "target-readiness" | "self-service-qa" | "edge-adapter";

export interface EcScope {
  readonly namespace: string;
  readonly binding_key: string;
  readonly cohort_id: string;
}

export interface EcRuleContext {
  readonly scope: EcScope;
  readonly selection: { readonly valid_at: string; readonly known_at: string };
  readonly implementation_sha256: string;
  readonly versions: { readonly dictionary: string; readonly definition: string; readonly crosswalk: string; readonly policy: string };
  readonly coverage: {
    readonly expected_count: number;
    readonly completeness: "complete" | "partial" | "absent" | "blocked";
    readonly basis: string;
    readonly revision: string;
  };
  readonly applicability: "in_scope" | "out_of_scope";
  readonly access: { readonly scope_ids: readonly string[]; readonly revision: string };
}

export interface EcSourceAccessScope {
  readonly id: string;
  readonly state: "known" | "unknown" | "denied";
  readonly scope_ids: readonly string[];
  readonly revision: string;
}

export interface EcEvidence {
  readonly id: string;
  readonly scope: EcScope;
  readonly source_id: string;
  readonly source_version_id: string;
  readonly source_sha256: string;
  readonly payload_sha256: string;
  readonly locator: string;
  readonly source_known_at: string;
  readonly known_from: string;
  readonly known_to: string | null;
  readonly valid_from: string | null;
  readonly valid_to: string | null;
  readonly source_date: string | null;
  readonly fresh_until: string | null;
  readonly access: "allowed" | "restricted";
  readonly access_scope: EcSourceAccessScope;
  readonly review: "not_reviewed" | "accepted" | "rejected";
  readonly state: "current" | "target";
}

export interface EcAttributeGrain {
  readonly kind: "attribute";
  readonly predicate: string;
  readonly qualifiers: Readonly<Record<string, EcJson>>;
  readonly fact_basis: string | null;
}

export interface EcMeasurementGrain {
  readonly kind: "measurement";
  readonly definition_id: string;
  readonly definition_version: string;
  readonly population: string | null;
  readonly perimeter: string | null;
  readonly dimensions: Readonly<Record<string, EcJson>>;
  readonly period_start: string | null;
  readonly period_end: string | null;
  readonly calendar: string | null;
  readonly timezone: string | null;
  readonly scenario: "proposed_target" | "actual" | "fictional_actual" | "baseline" | "forecast" | "qa";
  readonly method: string | null;
  readonly fact_basis: string | null;
  readonly unit: string | null;
  readonly currency: string | null;
}

export interface EcAssertion extends EcEvidence {
  readonly subject_id: string;
  readonly grain: EcAttributeGrain | EcMeasurementGrain;
  readonly value: EcJson;
  readonly missing_reason: string | null;
  readonly context: "business_candidate" | "qa_only";
  readonly origin: "source" | "derived" | "copy";
  readonly exact_copy_of: string | null;
  readonly supersession: {
    readonly assertion_id: string;
    readonly decision_id: string;
    readonly known_at: string;
    readonly recognized: boolean;
  } | null;
}

export interface EcEntity {
  readonly id: string;
  readonly scope: EcScope;
  readonly type: string;
  readonly resolution: "resolved" | "unresolved";
}

export interface OwnershipCoverageInput {
  readonly context: EcRuleContext;
  readonly applications: readonly EcEntity[];
  readonly assertions: readonly EcAssertion[];
  readonly owner_predicate: string;
}

export interface CompetingAssertionsInput {
  readonly context: EcRuleContext;
  readonly subject_ids: readonly string[];
  readonly assertions: readonly EcAssertion[];
}

export interface TargetReadinessInput {
  readonly context: EcRuleContext;
  readonly subject_id: string;
  readonly definition: {
    readonly id: string;
    readonly version: string;
    readonly numerator: string | null;
    readonly denominator: string | null;
    readonly aggregation: string | null;
    readonly directionality: string | null;
  };
  readonly measurements: readonly EcAssertion[];
  readonly eligibility_taxonomy: EcAssertion | null;
  readonly repeat_contact_window: EcAssertion | null;
  readonly scenario_pair: readonly ["proposed_target", "actual" | "fictional_actual"] | null;
}

export interface SelfServiceQaInput {
  readonly context: EcRuleContext;
  readonly purpose: "qa_only";
  readonly scenario: "qa";
  readonly evidence: EcEvidence;
  readonly eligible: number | null;
  readonly attempts: number | null;
  readonly successful: number | null;
  readonly abandoned: number | null;
  readonly unresolved: number | null;
  readonly subsequent_agent: number | null;
  readonly follow_up_complete: boolean;
  readonly repeat_contact_window_days: number | null;
  readonly eligibility_taxonomy: string | null;
  readonly observation_period: readonly [string, string] | null;
  readonly timezone: string | null;
}

export interface EcPredicateDefinition {
  readonly predicate: string;
  readonly inverse_predicate: string | null;
  readonly from_types: readonly string[];
  readonly to_types: readonly string[];
  readonly allow_self_loop: boolean;
  readonly acyclic: boolean;
  readonly qualifiers: Readonly<Record<string, {
    readonly type: "string" | "boolean" | "number";
    readonly required: boolean;
    readonly values?: readonly EcJson[];
    readonly from_types?: readonly string[];
  }>>;
  readonly requires_received_evidence: boolean;
  readonly requires_document_version: boolean;
}

export interface EcEdge extends EcEvidence {
  readonly from_id: string;
  readonly to_id: string;
  readonly predicate: string;
  readonly qualifiers: Readonly<Record<string, EcJson>>;
  readonly evidence_refs: readonly {
    readonly scope: EcScope;
    readonly source_id: string;
    readonly source_version_id: string;
    readonly sha256: string;
    readonly locator: string;
    readonly received: boolean;
    readonly access_scope: EcSourceAccessScope;
  }[];
  readonly cited_source_version_id: string | null;
}

export interface EdgeAdapterInput {
  readonly context: EcRuleContext;
  readonly entities: readonly EcEntity[];
  readonly edges: readonly EcEdge[];
  readonly dictionary: readonly EcPredicateDefinition[];
}

export type EcDependencyKind = "entity" | "assertion" | "edge" | "source" | "source_version" | "cohort" | "coverage" | "query" | "dictionary" | "definition" | "crosswalk" | "policy" | "implementation" | "evaluation" | "selection" | "review" | "access";

export interface EcDependency {
  readonly kind: EcDependencyKind;
  readonly id: string;
  readonly revision: string;
  readonly selector?: {
    readonly kinds: readonly EcDependencyKind[];
    readonly subject_ids?: readonly string[];
    readonly predicates?: readonly string[];
    readonly entity_type?: string;
  };
}

export interface EcRuleEvaluation {
  readonly kind: "rule_evaluation";
  readonly id: string;
  readonly revision_id: string;
  readonly rule_id: string;
  readonly rule_version: "v0";
  readonly implementation_sha256: string;
  readonly input_sha256: string;
  readonly parameters_sha256: string;
  readonly scope: EcScope;
  readonly selection: EcRuleContext["selection"];
  readonly subject_ids: readonly string[];
  readonly output_state: EcRuleState;
  readonly predicate_result: boolean | null;
  readonly coverage: {
    readonly expected_count: number;
    readonly eligible_count: number;
    readonly evaluated_count: number;
    readonly skipped_count: number;
    readonly completeness: EcRuleContext["coverage"]["completeness"];
    readonly basis: string;
  };
  readonly dependencies: readonly EcDependency[];
  readonly reasons: readonly string[];
  readonly details: EcJson;
  readonly review_state: "not_reviewed";
  readonly agent_ready: false;
  readonly agent_readiness_status: "blocked";
  readonly index_state: "not_indexed";
  readonly downstream_context_policy: "exclude";
}

function canonical(value: unknown): string {
  if (value === null || typeof value === "string" || typeof value === "boolean") return JSON.stringify(value);
  if (typeof value === "number" && Number.isFinite(value)) return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object" && Object.getPrototypeOf(value) === Object.prototype) {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical((value as Record<string, unknown>)[key])}`).join(",")}}`;
  }
  throw new Error("Only finite JSON data is permitted");
}

export function ecSliceHash(value: unknown): string {
  return createHash("sha256").update(`${canonical(value)}\n`).digest("hex");
}

const ordered = <T>(rows: readonly T[]): T[] => [...rows].sort((a, b) => canonical(a) < canonical(b) ? -1 : canonical(a) > canonical(b) ? 1 : 0);
const distinct = (values: readonly string[]): string[] => [...new Set(values)].sort();
const text = (value: string): boolean => typeof value === "string" && value.trim().length > 0;

function instant(value: string): number {
  const parts = /^(\d{4}-\d{2}-\d{2})(?:T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,3})?(Z|[+-]\d{2}:\d{2}))?$/.exec(value);
  if (!parts) throw new Error("An ISO date or offset-aware instant is required");
  const day = new Date(parts[1]);
  if (!Number.isFinite(day.getTime()) || day.toISOString().slice(0, 10) !== parts[1] ||
    (parts[2] !== undefined && (Number(parts[2]) > 23 || Number(parts[3]) > 59 || Number(parts[4]) > 59))) throw new Error("Invalid date");
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) throw new Error("Invalid date");
  return date.getTime();
}

function hash(value: string): void {
  if (!/^[a-f0-9]{64}$/.test(value)) throw new Error("An exact SHA-256 is required");
}

function scopeMatches(a: EcScope, b: EcScope): boolean { return canonical(a) === canonical(b); }
function assertScope(context: EcRuleContext, scope: EcScope): void {
  if (!scopeMatches(context.scope, scope)) throw new Error("Cross-scope reference refused");
}
function uniqueIds(rows: readonly { readonly id: string }[]): void {
  if (rows.some((row) => !text(row.id)) || new Set(rows.map((row) => row.id)).size !== rows.length) throw new Error("Duplicate or missing record ID");
}

function validateContext(context: EcRuleContext): void {
  if (Object.values(context.scope).some((value) => !text(value)) || Object.values(context.versions).some((value) => !text(value))) throw new Error("Declared scope and versions are required");
  hash(context.implementation_sha256);
  instant(context.selection.valid_at); instant(context.selection.known_at);
  if (!Number.isSafeInteger(context.coverage.expected_count) || context.coverage.expected_count < 0 || !text(context.coverage.basis) || !text(context.coverage.revision)) throw new Error("A scoped coverage declaration is required");
  if (!context.access || !Array.isArray(context.access.scope_ids) || context.access.scope_ids.some((id) => !text(id)) || !text(context.access.revision)) throw new Error("Explicit caller access scope required");
}

function validateEvidence(context: EcRuleContext, row: EcEvidence): void {
  assertScope(context, row.scope);
  for (const value of [row.id, row.source_id, row.source_version_id, row.locator]) if (!text(value)) throw new Error("Exact evidence identity and locator required");
  hash(row.source_sha256); hash(row.payload_sha256);
  const known = instant(row.known_from);
  if (instant(row.source_known_at) > known || (row.known_to !== null && instant(row.known_to) <= known)) throw new Error("Invalid source knowledge chronology");
  if (row.valid_from !== null && row.valid_to !== null && instant(row.valid_to) <= instant(row.valid_from)) throw new Error("Invalid half-open validity interval");
  if (row.valid_from !== null) instant(row.valid_from);
  if (row.valid_to !== null) instant(row.valid_to);
  if (row.source_date !== null && instant(row.source_date) > known) throw new Error("Source date cannot follow source knowledge");
  if (row.fresh_until !== null) instant(row.fresh_until);
  if (row.access_scope && (!text(row.access_scope.id) || !text(row.access_scope.revision) || !Array.isArray(row.access_scope.scope_ids) || row.access_scope.scope_ids.some((id) => !text(id)))) throw new Error("Invalid source access scope");
}

function selected(context: EcRuleContext, row: EcEvidence): boolean {
  const known = instant(context.selection.known_at), valid = instant(context.selection.valid_at);
  return instant(row.source_known_at) <= known && instant(row.known_from) <= known &&
    (row.known_to === null || known < instant(row.known_to)) &&
    (row.valid_from === null || instant(row.valid_from) <= valid) &&
    (row.valid_to === null || valid < instant(row.valid_to));
}

function usable(context: EcRuleContext, row: EcEvidence): boolean {
  return selected(context, row) && !accessBlocked(context, row) && row.review !== "rejected" && row.state === "current" &&
    row.valid_from !== null && row.source_date !== null &&
    (row.fresh_until === null || instant(context.selection.valid_at) < instant(row.fresh_until));
}

function accessBlocked(context: EcRuleContext, row: EcEvidence): boolean {
  return row.access !== "allowed" || sourceAccessBlocked(context, row.access_scope);
}

function sourceAccessBlocked(context: EcRuleContext, access: EcSourceAccessScope | undefined): boolean {
  return access?.state !== "known" || !Array.isArray(access.scope_ids) || access.scope_ids.length === 0 ||
    !access.scope_ids.every((id) => context.access.scope_ids.includes(id));
}

function commonDependencies(context: EcRuleContext): EcDependency[] {
  return [
    ...Object.entries(context.versions).map(([kind, revision]) => ({ kind: kind as EcDependencyKind, id: kind, revision })),
    { kind: "implementation", id: "rules", revision: context.implementation_sha256 },
    { kind: "coverage", id: context.scope.cohort_id, revision: ecSliceHash(context.coverage) },
    { kind: "cohort", id: context.scope.cohort_id, revision: context.coverage.revision },
    { kind: "selection", id: "valid_known_time", revision: ecSliceHash(context.selection) },
    { kind: "access", id: "rule-caller", revision: ecSliceHash(context.access) },
  ];
}

function evidenceDependencies(rows: readonly EcEvidence[]): EcDependency[] {
  return rows.flatMap((row): EcDependency[] => [
    { kind: "assertion" as const, id: row.id, revision: ecSliceHash(row) },
    { kind: "source" as const, id: row.source_id, revision: row.source_version_id },
    { kind: "source_version" as const, id: row.source_version_id, revision: row.source_sha256 },
    { kind: "review" as const, id: row.id, revision: ecSliceHash(row.review) },
    { kind: "access", id: row.id, revision: ecSliceHash({ access: row.access, access_scope: row.access_scope ?? null }) },
    ...(row.access_scope ? [{ kind: "access" as const, id: row.access_scope.id, revision: ecSliceHash(row.access_scope) }] : []),
    ...("grain" in row && (row as EcAssertion).grain.kind === "measurement" ? [{ kind: "definition" as const, id: ((row as EcAssertion).grain as EcMeasurementGrain).definition_id, revision: ((row as EcAssertion).grain as EcMeasurementGrain).definition_version }] : []),
    ...("supersession" in row && (row as EcAssertion).supersession ? [{ kind: "review" as const, id: (row as EcAssertion).supersession!.decision_id, revision: ecSliceHash((row as EcAssertion).supersession) }] : []),
  ]);
}

function validateSourceVersions(rows: readonly { readonly source_id: string; readonly source_version_id: string; readonly source_sha256: string }[]): void {
  const versions = new Map<string, string>();
  for (const row of rows) {
    const identity = canonical([row.source_id, row.source_sha256]);
    if (versions.has(row.source_version_id) && versions.get(row.source_version_id) !== identity) throw new Error("Immutable source-version mismatch");
    versions.set(row.source_version_id, identity);
  }
}

function queryDependency(id: string, selector: NonNullable<EcDependency["selector"]>, rows: readonly unknown[]): EcDependency {
  return { kind: "query", id, selector, revision: ecSliceHash(ordered(rows)) };
}

function evaluation(
  rule: EcRuleId, context: EcRuleContext, input: unknown, subjects: readonly string[], dependencies: readonly EcDependency[],
  result: { state: EcRuleState; predicate: boolean | null; eligible: number; evaluated: number; reasons: readonly string[]; details: EcJson },
): EcRuleEvaluation {
  validateContext(context);
  let state = result.state, predicate = result.predicate;
  const skipped = Math.max(0, context.coverage.expected_count - result.evaluated);
  let completeness = context.coverage.completeness;
  if (completeness === "complete" && (skipped > 0 || result.evaluated !== context.coverage.expected_count)) completeness = result.evaluated > 0 ? "partial" : "absent";
  if (context.applicability === "out_of_scope") { state = "out_of_scope"; predicate = null; }
  else if (completeness === "blocked") { state = "restricted"; predicate = null; }
  else if (state === "clear" && (completeness !== "complete" || result.evaluated === 0 || predicate !== false)) {
    state = result.evaluated > 0 ? "partial" : "unknown"; predicate = null;
  }
  const rule_id = `design:${rule}`;
  const identity = { rule_id, rule_version: "v0", scope: context.scope, subject_ids: distinct(subjects), selection: context.selection };
  const body = {
    ...identity, kind: "rule_evaluation" as const, rule_version: "v0" as const,
    id: `evaluation:${ecSliceHash(identity)}`, implementation_sha256: context.implementation_sha256,
    input_sha256: ecSliceHash(input), parameters_sha256: ecSliceHash({ rule_id, versions: context.versions, selection: context.selection, scope: context.scope }),
    output_state: state, predicate_result: predicate,
    coverage: { expected_count: context.coverage.expected_count, eligible_count: result.eligible, evaluated_count: result.evaluated, skipped_count: skipped, completeness, basis: context.coverage.basis },
    dependencies: ordered([...new Map([...commonDependencies(context), ...dependencies].map((dep) => [canonical(dep), dep])).values()]),
    reasons: distinct(result.reasons), details: result.details,
    review_state: "not_reviewed" as const, agent_ready: false as const, agent_readiness_status: "blocked" as const,
    index_state: "not_indexed" as const, downstream_context_policy: "exclude" as const,
  };
  return { ...body, revision_id: `evaluation-revision:${ecSliceHash(body)}` };
}

function completeGrain(grain: EcAssertion["grain"]): boolean {
  if (grain.kind === "attribute") return text(grain.predicate) && grain.fact_basis !== null && text(grain.fact_basis);
  return [grain.definition_id, grain.definition_version, grain.population, grain.perimeter, grain.period_start, grain.period_end,
    grain.calendar, grain.timezone, grain.scenario, grain.method, grain.fact_basis, grain.unit].every((value) => value !== null && text(value));
}

function semantic(row: EcAssertion): string {
  return canonical({ subject_id: row.subject_id, grain: row.grain, context: row.context });
}

function validateAssertions(context: EcRuleContext, rows: readonly EcAssertion[]): void {
  uniqueIds(rows);
  validateSourceVersions(rows);
  for (const row of rows) {
    validateEvidence(context, row); canonical(row.value); canonical(row.grain);
    const attributes = row.grain.kind === "attribute" ? row.grain.qualifiers : row.grain.dimensions;
    if (!attributes || Array.isArray(attributes) || Object.getPrototypeOf(attributes) !== Object.prototype) throw new Error("Grain qualifiers and dimensions require objects");
    if (!text(row.subject_id) || (row.value === null && !row.missing_reason)) throw new Error("Assertion subject and missing reason are required");
    if (row.grain.kind === "measurement") {
      const { period_start: start, period_end: end, currency, unit } = row.grain;
      if (start !== null) instant(start);
      if (end !== null) instant(end);
      if (start !== null && end !== null && instant(end) <= instant(start)) throw new Error("Invalid observation period");
      if (currency !== null && !text(currency)) throw new Error("Invalid currency");
      if (unit === "currency" && currency === null) throw new Error("Currency unit requires currency");
      if ((row.context === "qa_only") !== (row.grain.scenario === "qa")) throw new Error("QA scenario cannot become a business observation");
    }
    if ((row.origin === "copy") !== (row.exact_copy_of !== null)) throw new Error("Copies require an exact original assertion");
  }
  const byId = new Map(rows.map((row) => [row.id, row]));
  for (const row of rows) {
    if (row.exact_copy_of !== null) {
      const original = byId.get(row.exact_copy_of);
      if (!original || semantic(original) !== semantic(row) || canonical(original.value) !== canonical(row.value) || original.valid_from !== row.valid_from || original.valid_to !== row.valid_to) throw new Error("Invalid exact-copy reference");
    }
    if (row.supersession !== null) {
      const prior = byId.get(row.supersession.assertion_id);
      if (!prior || prior.id === row.id || semantic(prior) !== semantic(row) || !text(row.supersession.decision_id) || instant(row.supersession.known_at) < instant(row.known_from) || instant(prior.known_from) >= instant(row.supersession.known_at)) throw new Error("Invalid explicit supersession");
    }
    const seen = new Set([row.id]);
    let cursor = row;
    while (cursor.exact_copy_of !== null) {
      if (seen.has(cursor.exact_copy_of)) throw new Error("Cyclic copy reference");
      seen.add(cursor.exact_copy_of); cursor = byId.get(cursor.exact_copy_of)!;
    }
    const supersessionSeen = new Set([row.id]);
    cursor = row;
    while (cursor.supersession !== null) {
      if (supersessionSeen.has(cursor.supersession.assertion_id)) throw new Error("Cyclic supersession reference");
      supersessionSeen.add(cursor.supersession.assertion_id); cursor = byId.get(cursor.supersession.assertion_id)!;
    }
  }
}

function activeAssertions(context: EcRuleContext, rows: readonly EcAssertion[]): EcAssertion[] {
  const selectedRows = rows.filter((row) => usable(context, row));
  const superseded = new Set(selectedRows.filter((row) => row.supersession?.recognized && instant(row.supersession.known_at) <= instant(context.selection.known_at)).map((row) => row.supersession!.assertion_id));
  const byId = new Map(rows.map((row) => [row.id, row]));
  const root = (row: EcAssertion): string => row.exact_copy_of === null ? row.id : root(byId.get(row.exact_copy_of)!);
  // Copies cannot resurrect an explicitly superseded original.
  return ordered(selectedRows.filter((row) => !superseded.has(row.id) && !superseded.has(root(row))));
}

function assertionSummary(rows: readonly EcAssertion[]): { conflicting: boolean; comparable: boolean; independent_sources: number; values: EcJson[] } {
  const values = [...new Map(rows.filter((row) => row.value !== null).map((row) => [canonical(row.value), row.value])).values()];
  const keys = new Set(rows.map(semantic));
  return { conflicting: keys.size === 1 && values.length > 1, comparable: keys.size === 1 && rows.every((row) => completeGrain(row.grain)),
    independent_sources: new Set(rows.filter((row) => row.origin === "source" && row.value !== null).map((row) => row.source_id)).size, values: ordered(values) };
}

export function evaluateOwnershipCoverage(input: OwnershipCoverageInput): EcRuleEvaluation {
  const { context, owner_predicate } = input;
  validateContext(context); uniqueIds(input.applications); validateAssertions(context, input.assertions);
  if (!text(owner_predicate)) throw new Error("Declared owner predicate required");
  for (const app of input.applications) assertScope(context, app.scope);
  const apps = ordered(input.applications.filter((app) => app.type === "application"));
  const subjectIds = apps.map((app) => app.id);
  const relevant = input.assertions.filter((row) => subjectIds.includes(row.subject_id) && row.grain.kind === "attribute" && row.grain.predicate === owner_predicate);
  const active = activeAssertions(context, relevant);
  let evaluated = 0, restricted = false;
  const results = apps.map((app) => {
    const rows = active.filter((row) => row.subject_id === app.id);
    const summary = assertionSummary(rows);
    const hidden = relevant.some((row) => row.subject_id === app.id && selected(context, row) && accessBlocked(context, row));
    restricted ||= hidden;
    let state: EcRuleState = "unknown";
    if (hidden) state = "restricted";
    else if (app.resolution === "resolved" && rows.length > 0 && summary.comparable && rows.every((row) => typeof row.value === "string" && text(row.value))) {
      state = summary.conflicting ? "conflicting" : "clear"; evaluated++;
    } else if (rows.length > 0 && !summary.comparable) state = "not_comparable";
    return { subject_id: app.id, state };
  });
  const state: EcRuleState = restricted ? "restricted" : results.some((row) => row.state === "conflicting") ? "conflicting" :
    results.some((row) => row.state === "not_comparable") ? "not_comparable" : evaluated === apps.length && apps.length > 0 ? "clear" : evaluated > 0 ? "partial" : "unknown";
  const dependencies = [
    ...evidenceDependencies(relevant), ...apps.map((app): EcDependency => ({ kind: "entity", id: app.id, revision: ecSliceHash(app) })),
    queryDependency("logical-application-cohort", { kinds: ["entity", "cohort"], entity_type: "application" }, apps),
    queryDependency("accountable-owner-absence", { kinds: ["assertion", "edge"], subject_ids: distinct(subjectIds), predicates: [owner_predicate] }, relevant),
  ];
  return evaluation("ownership-coverage", context, { ...input, applications: ordered(input.applications), assertions: ordered(input.assertions) }, subjectIds, dependencies,
    { state, predicate: state === "clear" ? false : state === "conflicting" ? true : null, eligible: apps.length, evaluated,
      reasons: state === "clear" ? [] : ["owner_evidence_incomplete_ambiguous_or_unavailable"], details: restricted ? null : { subjects: results } });
}

export function evaluateCompetingAssertions(input: CompetingAssertionsInput): EcRuleEvaluation {
  const { context } = input;
  validateContext(context); validateAssertions(context, input.assertions);
  const subjects = distinct(input.subject_ids);
  if (input.assertions.some((row) => !subjects.includes(row.subject_id))) throw new Error("Assertion outside declared subjects");
  const active = activeAssertions(context, input.assertions);
  const groups = [...new Set(active.map(semantic))].sort().map((key) => {
    const rows = active.filter((row) => semantic(row) === key);
    const summary = assertionSummary(rows);
    return { semantic_key: ecSliceHash(key), assertion_ids: rows.map((row) => row.id).sort(), ...summary };
  });
  const restricted = input.assertions.some((row) => selected(context, row) && accessBlocked(context, row));
  const conflict = groups.some((group) => group.comparable && group.conflicting);
  const incomplete = input.assertions.some((row) => selected(context, row) && row.review !== "rejected" && row.state === "current" && !usable(context, row));
  const evaluated = groups.filter((group) => group.comparable && group.values.length > 0).length;
  const state: EcRuleState = restricted ? "restricted" : conflict ? "conflicting" : groups.length === 0 ? "unknown" :
    groups.some((group) => !group.comparable) || groups.length > 1 ? "not_comparable" : incomplete ? "partial" : evaluated === 0 ? "unknown" : "clear";
  return evaluation("competing-assertions", context, { ...input, subject_ids: subjects, assertions: ordered(input.assertions) }, subjects,
    [...evidenceDependencies(input.assertions), queryDependency("competing-assertion-population", { kinds: ["assertion"], subject_ids: subjects }, input.assertions)],
    { state, predicate: conflict ? true : state === "clear" ? false : null, eligible: groups.length, evaluated,
      reasons: state === "not_comparable" ? ["incompatible_or_incomplete_semantic_grain"] : state === "unknown" ? ["no_usable_assertion"] : [],
      details: restricted ? null : { groups } });
}

export function evaluateTargetReadiness(input: TargetReadinessInput): EcRuleEvaluation {
  const { context, definition } = input;
  validateContext(context);
  const metadata = [input.eligibility_taxonomy, input.repeat_contact_window].filter((row): row is EcAssertion => row !== null);
  const rows = [...input.measurements, ...metadata];
  validateAssertions(context, rows);
  if (rows.some((row) => row.context !== "business_candidate" || row.subject_id !== input.subject_id)) throw new Error("QA or foreign subject cannot supply business target evidence");
  if (input.measurements.some((row) => row.grain.kind !== "measurement" || row.grain.definition_id !== definition.id)) throw new Error("Target definition mismatch");
  if (input.scenario_pair !== null && (input.scenario_pair[0] !== "proposed_target" || !["actual", "fictional_actual"].includes(input.scenario_pair[1]))) throw new Error("Explicit target/actual scenario pair required");
  const active = activeAssertions(context, rows);
  const missing: string[] = [];
  for (const key of ["numerator", "denominator", "aggregation", "directionality"] as const) if (!definition[key]) missing.push(`definition_${key}`);
  if (!input.scenario_pair) missing.push("scenario_pair");
  for (const [key, row] of [["eligibility_taxonomy", input.eligibility_taxonomy], ["repeat_contact_window", input.repeat_contact_window]] as const) {
    if (row && (row.grain.kind !== "attribute" || row.grain.predicate !== key)) throw new Error("Exact readiness metadata predicate required");
    const valueValid = row !== null && (key === "eligibility_taxonomy" ? typeof row.value === "string" && text(row.value) : typeof row.value === "number" && Number.isSafeInteger(row.value) && row.value > 0);
    if (!row || !active.includes(row) || !valueValid) missing.push(key);
  }
  const scenarioRows = (scenario: string) => active.filter((row) => row.grain.kind === "measurement" && row.grain.scenario === scenario);
  const target = scenarioRows("proposed_target"), actual = scenarioRows(input.scenario_pair?.[1] ?? "actual"), baseline = scenarioRows("baseline");
  for (const [name, group] of [["target", target], ["actual", actual], ["baseline", baseline]] as const) {
    if (group.length === 0 || group.some((row) => row.value === null)) missing.push(name);
    if (group.some((row) => !completeGrain(row.grain))) missing.push(`${name}_grain`);
    if (group.some((row) => typeof row.value !== "number" && row.value !== null)) throw new Error("Numeric target observations required");
  }
  const conflict = [target, actual, baseline].some((group) => assertionSummary(group).conflicting);
  const comparisonKey = (row: EcAssertion) => row.grain.kind === "measurement" ? canonical({ ...row.grain, scenario: "explicit_comparison" }) : "";
  const comparisonRows = [...target, ...actual, ...baseline];
  const incompatible = comparisonRows.some((row) => row.grain.kind === "measurement" && row.grain.definition_version !== definition.version) || new Set(comparisonRows.map(comparisonKey)).size > 1;
  const restricted = rows.some((row) => selected(context, row) && accessBlocked(context, row));
  const state: EcRuleState = restricted ? "restricted" : conflict ? "conflicting" : missing.length > 0 ? "unknown" : incompatible ? "not_comparable" : "clear";
  return evaluation("target-readiness", context, { ...input, measurements: ordered(input.measurements) }, [input.subject_id],
    [...evidenceDependencies(rows), { kind: "definition", id: definition.id, revision: ecSliceHash(definition) },
      queryDependency("target-actual-baseline-absence", { kinds: ["assertion"], subject_ids: [input.subject_id] }, rows)],
    { state, predicate: state === "clear" ? false : null, eligible: 1, evaluated: state === "clear" || state === "not_comparable" || conflict ? 1 : 0,
      reasons: restricted ? ["authorized_evidence_unavailable"] : distinct(missing),
      details: restricted ? null : { target_values: target.map((row) => row.value), actual: null, baseline: null, attainment: null, missing_evidence: distinct(missing) } });
}

export function evaluateSelfServiceQa(raw: SelfServiceQaInput): EcRuleEvaluation {
  const input: SelfServiceQaInput = {
    ...raw, eligible: raw.eligible ?? null, attempts: raw.attempts ?? null, successful: raw.successful ?? null,
    abandoned: raw.abandoned ?? null, unresolved: raw.unresolved ?? null, subsequent_agent: raw.subsequent_agent ?? null,
    repeat_contact_window_days: raw.repeat_contact_window_days ?? null, observation_period: raw.observation_period ?? null,
    timezone: raw.timezone ?? null, eligibility_taxonomy: raw.eligibility_taxonomy ?? null,
  };
  const { context } = input;
  validateContext(context); validateEvidence(context, input.evidence);
  if (input.purpose !== "qa_only" || input.scenario !== "qa") throw new Error("Self-service arithmetic is QA-only");
  const counts = [input.eligible, input.attempts, input.successful, input.abandoned, input.unresolved, input.subsequent_agent];
  if (counts.some((value) => value !== null && (!Number.isSafeInteger(value) || value < 0))) throw new Error("Nonnegative safe integer counts required");
  if (input.repeat_contact_window_days !== null && (!Number.isSafeInteger(input.repeat_contact_window_days) || input.repeat_contact_window_days <= 0)) throw new Error("Positive follow-up window required");
  if (input.observation_period !== null && instant(input.observation_period[1]) <= instant(input.observation_period[0])) throw new Error("Invalid QA observation period");
  if (input.timezone !== null) {
    if (!text(input.timezone)) throw new Error("Invalid QA timezone");
    new Intl.DateTimeFormat("en", { timeZone: input.timezone });
  }
  const completeCounts = counts.every((value) => value !== null);
  if (completeCounts && (BigInt(input.successful!) + BigInt(input.abandoned!) + BigInt(input.unresolved!) + BigInt(input.subsequent_agent!) !== BigInt(input.attempts!) || input.attempts! > input.eligible!)) throw new Error("Outcome buckets must partition eligible attempts");
  const restricted = selected(context, input.evidence) && accessBlocked(context, input.evidence);
  const chronology = input.observation_period !== null && input.repeat_contact_window_days !== null &&
    instant(input.observation_period[1]) + input.repeat_contact_window_days * 86_400_000 <= instant(input.evidence.source_known_at);
  const verified = usable(context, input.evidence) && completeCounts && input.eligible! > 0 && input.follow_up_complete === true &&
    input.repeat_contact_window_days !== null && typeof input.eligibility_taxonomy === "string" && text(input.eligibility_taxonomy) &&
    input.observation_period !== null && input.timezone === "UTC" && chronology;
  const numerator = verified ? input.successful! : null;
  const state: EcRuleState = restricted ? "restricted" : !verified ? "unknown" : numerator! > 0 ? "finding" : "clear";
  return evaluation("self-service-qa", context, input, [], evidenceDependencies([input.evidence]),
    { state, predicate: verified ? numerator! > 0 : null, eligible: 1, evaluated: verified ? 1 : 0,
      reasons: verified ? [] : [input.timezone !== null && input.timezone !== "UTC"
        ? "non_utc_qa_calendar_conversion_not_admitted" : "unverified_follow_up_or_denominator_or_evidence"],
      details: restricted ? null : { purpose: "qa_only", verification: verified ? "verified" : "unverified", numerator,
        denominator: verified ? input.eligible : null, successful_resolution_percent: verified ? Number(BigInt(100) * BigInt(numerator!)) / input.eligible! : null,
        business_actual: null } });
}

export function evaluateEdgeAdapter(input: EdgeAdapterInput): EcRuleEvaluation {
  const { context } = input;
  validateContext(context); uniqueIds(input.entities); uniqueIds(input.edges);
  validateSourceVersions([
    ...input.edges,
    ...input.edges.flatMap((edge) => edge.evidence_refs.map((ref) => ({ ...ref, source_sha256: ref.sha256 }))),
  ]);
  for (const entity of input.entities) assertScope(context, entity.scope);
  const entities = new Map(input.entities.map((entity) => [entity.id, entity]));
  const verbs = input.dictionary.flatMap((entry) => [entry.predicate, ...(entry.inverse_predicate ? [entry.inverse_predicate] : [])]);
  if (new Set(verbs).size !== verbs.length) throw new Error("Ambiguous predicate dictionary");
  const canonicalEdges: Array<{ semantic_key: string; from_id: string; to_id: string; predicate: string; qualifiers: Readonly<Record<string, EcJson>>; valid_from: string | null; valid_to: string | null }> = [];
  let evaluated = 0, restricted = false;
  for (const edge of ordered(input.edges)) {
    validateEvidence(context, edge);
    if (!edge.qualifiers || Array.isArray(edge.qualifiers) || Object.getPrototypeOf(edge.qualifiers) !== Object.prototype) throw new Error("Edge qualifiers require an object");
    const definition = input.dictionary.find((entry) => entry.predicate === edge.predicate || entry.inverse_predicate === edge.predicate);
    if (!definition) throw new Error("Unknown predicate");
    const inverse = definition.predicate !== edge.predicate;
    const from = entities.get(inverse ? edge.to_id : edge.from_id), to = entities.get(inverse ? edge.from_id : edge.to_id);
    if (!from || !to) throw new Error("Undeclared endpoint");
    if (!definition.from_types.includes(from.type) || !definition.to_types.includes(to.type)) throw new Error("Invalid endpoint type or orientation");
    if (!definition.allow_self_loop && from.id === to.id) throw new Error("Forbidden self-loop");
    for (const [key, value] of Object.entries(edge.qualifiers)) {
      const qualifier = definition.qualifiers[key];
      if (!qualifier || (qualifier.from_types && !qualifier.from_types.includes(from.type)) || typeof value !== qualifier.type ||
        (typeof value === "number" && !Number.isFinite(value)) || (typeof value === "string" && !text(value)) ||
        (qualifier.values && !qualifier.values.some((allowed) => canonical(allowed) === canonical(value)))) throw new Error("Invalid edge qualifier");
    }
    for (const [key, qualifier] of Object.entries(definition.qualifiers)) if (qualifier.required && (!qualifier.from_types || qualifier.from_types.includes(from.type)) && !(key in edge.qualifiers)) throw new Error("Missing required edge qualifier");
    for (const ref of edge.evidence_refs) {
      assertScope(context, ref.scope); hash(ref.sha256);
      if (!text(ref.source_id) || !text(ref.source_version_id) || !text(ref.locator) || !ref.received) throw new Error("Pending evidence is not received proof");
    }
    if (definition.requires_received_evidence && edge.evidence_refs.length === 0) throw new Error("Received evidence required");
    if (definition.requires_document_version && (!edge.cited_source_version_id || !edge.evidence_refs.some((ref) => ref.source_version_id === edge.cited_source_version_id))) throw new Error("Exact cited document version required");
    if (!selected(context, edge)) continue;
    if (accessBlocked(context, edge) || edge.evidence_refs.some((ref) => sourceAccessBlocked(context, ref.access_scope))) { restricted = true; continue; }
    if (!usable(context, edge) || from.resolution !== "resolved" || to.resolution !== "resolved") continue;
    evaluated++;
    const semanticEdge = { from_id: from.id, to_id: to.id, predicate: definition.predicate, qualifiers: edge.qualifiers, valid_from: edge.valid_from, valid_to: edge.valid_to };
    canonicalEdges.push({ ...semanticEdge, semantic_key: ecSliceHash({ scope: context.scope, dictionary: context.versions.dictionary, ...semanticEdge }) });
  }
  for (const definition of input.dictionary.filter((entry) => entry.acyclic)) {
    const edges = canonicalEdges.filter((edge) => edge.predicate === definition.predicate);
    const done = new Set<string>(), visiting = new Set<string>();
    const visit = (id: string): void => {
      if (visiting.has(id)) throw new Error("Hierarchy cycle");
      if (done.has(id)) return;
      visiting.add(id); edges.filter((edge) => edge.from_id === id).forEach((edge) => visit(edge.to_id));
      visiting.delete(id); done.add(id);
    };
    for (const edge of edges) visit(edge.from_id);
  }
  const accepted = ordered([...new Map(canonicalEdges.map((edge) => [edge.semantic_key, edge])).values()]);
  const dependencies: EcDependency[] = [
    ...evidenceDependencies(input.edges), ...input.edges.map((edge): EcDependency => ({ kind: "edge", id: edge.id, revision: ecSliceHash(edge) })),
    ...input.entities.map((entity): EcDependency => ({ kind: "entity", id: entity.id, revision: ecSliceHash(entity) })),
    ...input.edges.flatMap((edge) => edge.evidence_refs.flatMap((ref): EcDependency[] => [
      { kind: "source", id: ref.source_id, revision: ref.source_version_id }, { kind: "source_version", id: ref.source_version_id, revision: ref.sha256 },
      ...(ref.access_scope ? [{ kind: "access" as const, id: ref.access_scope.id, revision: ecSliceHash(ref.access_scope) }] : []),
    ])),
    queryDependency("edge-population", { kinds: ["edge", "entity"] }, input.edges),
  ];
  return evaluation("edge-adapter", context, { ...input, entities: ordered(input.entities), edges: ordered(input.edges), dictionary: ordered(input.dictionary) }, input.entities.map((entity) => entity.id), dependencies,
    { state: restricted ? "restricted" : evaluated === input.edges.length && evaluated > 0 ? "clear" : evaluated > 0 ? "partial" : "unknown",
      predicate: evaluated === input.edges.length && evaluated > 0 ? false : null, eligible: input.edges.length, evaluated,
      reasons: evaluated === input.edges.length ? [] : ["edge_evidence_or_endpoint_unavailable"], details: restricted ? null : { accepted_edges: accepted, distinct_edge_count: accepted.length } });
}

export interface EcInvalidationChange {
  readonly scope: EcScope;
  readonly kind: EcDependencyKind;
  readonly id: string;
  readonly revision: string | null;
  readonly change: "insert" | "update" | "delete" | "supersede" | "expire" | "revoke";
  readonly subject_id?: string;
  readonly predicate?: string;
  readonly entity_type?: string;
  readonly source_id?: string;
}

export interface EcInvalidationResult {
  readonly evaluation_id: string;
  readonly revision_id: string;
  readonly invalidated: boolean;
  readonly stale: boolean;
  readonly requires_re_evaluation: boolean;
  readonly affected_dependency_ids: readonly string[];
  readonly historical_revision_preserved: true;
  readonly serving_authorized: false;
}

export function invalidateRuleEvaluation(evaluation: EcRuleEvaluation, changes: readonly EcInvalidationChange[]): EcInvalidationResult {
  const { revision_id, ...body } = evaluation;
  if (revision_id !== `evaluation-revision:${ecSliceHash(body)}`) throw new Error("Evaluation revision or dependency integrity mismatch");
  const meaningfulChanges = changes.filter((change) => {
    const matching = evaluation.dependencies.filter((dependency) => dependency.kind === change.kind && dependency.id === change.id);
    return !(scopeMatches(evaluation.scope, change.scope) && change.change === "update" && matching.length > 0 && matching.every((dependency) => dependency.revision === change.revision));
  });
  const affected = evaluation.dependencies.filter((dependency) => meaningfulChanges.some((change) => {
    if (!scopeMatches(evaluation.scope, change.scope)) return false;
    if (dependency.kind === "source" && change.kind === "source_version" && dependency.id === change.source_id) {
      return change.id !== dependency.revision || change.change !== "update";
    }
    if (dependency.kind === change.kind && dependency.id === change.id) {
      return change.change !== "update" || change.revision === null || change.revision !== dependency.revision;
    }
    const query = dependency.selector;
    if (!query || !query.kinds.includes(change.kind)) return false;
    if (query.subject_ids && change.subject_id && !query.subject_ids.includes(change.subject_id)) return false;
    if (query.predicates && change.predicate && !query.predicates.includes(change.predicate)) return false;
    if (query.entity_type && change.entity_type && query.entity_type !== change.entity_type) return false;
    // An event lacking query keys is conservatively invalidating, never a false negative.
    return true;
  }));
  const invalidated = affected.length > 0;
  return { evaluation_id: evaluation.id, revision_id: evaluation.revision_id, invalidated, stale: invalidated, requires_re_evaluation: invalidated,
    affected_dependency_ids: distinct(affected.map((dependency) => `${dependency.kind}:${dependency.id}`)), historical_revision_preserved: true, serving_authorized: false };
}
