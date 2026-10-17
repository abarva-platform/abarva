import {
  EC_SLICE_STATES, ecSliceHash, evaluateOwnershipCoverage, evaluateCompetingAssertions,
  evaluateTargetReadiness, evaluateSelfServiceQa, evaluateEdgeAdapter, invalidateRuleEvaluation,
} from "../ec_slice_rules";
import type {
  EcAssertion, EcEntity, EcEvidence, EcRuleContext, EcMeasurementGrain, EcInvalidationChange,
  OwnershipCoverageInput, CompetingAssertionsInput, TargetReadinessInput, SelfServiceQaInput,
  EdgeAdapterInput, EcEdge, EcPredicateDefinition, EcRuleEvaluation,
} from "../ec_slice_rules";

// These are local rule scopes, not registered tenants or source-native fixtures.
const scope = { namespace: "unit:ec-rules", binding_key: "binding:unit", cohort_id: "cohort:applications" };
const sha = (value: string) => ecSliceHash(value);
const context = (expected = 1): EcRuleContext => ({
  scope, selection: { valid_at: "2026-09-30", known_at: "2026-10-16T00:00:00Z" },
  implementation_sha256: sha("test-implementation"),
  versions: { dictionary: "dictionary:v0", definition: "definition:v0", crosswalk: "crosswalk:v0", policy: "policy:v0" },
  coverage: { expected_count: expected, completeness: "complete", basis: "declared_unit_scope", revision: "cohort:v0" },
  applicability: "in_scope",
  access: { scope_ids: ["access:unit"], revision: "access:v0" },
});
const evidence = (id = "assertion:1"): EcEvidence => ({
  id, scope, source_id: "source:1", source_version_id: "version:1", source_sha256: sha("source-bytes"),
  payload_sha256: sha(id), locator: "row:1/field:value", source_known_at: "2026-10-01T00:00:00Z",
  known_from: "2026-10-01T00:00:00Z", known_to: null, valid_from: "2026-09-01", valid_to: null,
  source_date: "2026-09-30", fresh_until: null, access: "allowed", review: "not_reviewed", state: "current",
  access_scope: { id: "acl:unit", state: "known", scope_ids: ["access:unit"], revision: "acl:v0" },
});
const assertion = (id = "assertion:1", changes: Partial<EcAssertion> = {}): EcAssertion => ({
  ...evidence(id), subject_id: "app:1", grain: { kind: "attribute", predicate: "accountable_to", qualifiers: {}, fact_basis: "declared" },
  value: "role:1", missing_reason: null, context: "business_candidate", origin: "source", exact_copy_of: null, supersession: null, ...changes,
});
const entity = (id = "app:1", type = "application"): EcEntity => ({ id, scope, type, resolution: "resolved" });
const ownership = (): OwnershipCoverageInput => ({ context: context(), applications: [entity()], assertions: [assertion()], owner_predicate: "accountable_to" });
const competing = (rows: readonly EcAssertion[] = [assertion()]): CompetingAssertionsInput => ({ context: context(), subject_ids: ["app:1"], assertions: rows });
const grain = (changes: Partial<EcMeasurementGrain> = {}): EcMeasurementGrain => ({
  kind: "measurement", definition_id: "metric:1", definition_version: "v0", population: "eligible-inquiries",
  perimeter: "function:1", dimensions: {}, period_start: "2026-09-01", period_end: "2026-10-01", calendar: "gregorian",
  timezone: "UTC", scenario: "fictional_actual", method: "source-count", fact_basis: "fictional-source", unit: "percent", currency: null, ...changes,
});
const measurement = (id: string, changes: Partial<EcMeasurementGrain> = {}, value: number | null = 12): EcAssertion => assertion(id, {
  subject_id: "process:1", grain: grain(changes), value, missing_reason: value === null ? "not_supplied" : null,
});
const target = (): TargetReadinessInput => ({
  context: context(), subject_id: "process:1",
  definition: { id: "metric:1", version: "v0", numerator: "resolved_without_agent", denominator: "eligible_inquiries", aggregation: "share", directionality: "increase" },
  measurements: [measurement("target", { scenario: "proposed_target" }, 20), measurement("actual", { scenario: "fictional_actual" }, null), measurement("baseline", { scenario: "baseline" }, null)],
  eligibility_taxonomy: null, repeat_contact_window: null, scenario_pair: ["proposed_target", "fictional_actual"],
});
const readyTarget = (): TargetReadinessInput => ({
  ...target(), measurements: [measurement("target", { scenario: "proposed_target" }, 20), measurement("actual"), measurement("baseline", { scenario: "baseline" }, 8)],
  eligibility_taxonomy: assertion("eligibility", { subject_id: "process:1", grain: { kind: "attribute", predicate: "eligibility_taxonomy", qualifiers: {}, fact_basis: "declared" }, value: "routine-only" }),
  repeat_contact_window: assertion("window", { subject_id: "process:1", grain: { kind: "attribute", predicate: "repeat_contact_window", qualifiers: {}, fact_basis: "declared" }, value: 7 }),
});
const qa = (): SelfServiceQaInput => ({
  context: context(), purpose: "qa_only", scenario: "qa", evidence: { ...evidence("qa:1"), source_known_at: "2026-10-10T00:00:00Z", known_from: "2026-10-10T00:00:00Z" }, eligible: 100, attempts: 20,
  successful: 12, abandoned: 3, unresolved: 2, subsequent_agent: 3, follow_up_complete: true,
  repeat_contact_window_days: 7, eligibility_taxonomy: "routine-only", observation_period: ["2026-09-01", "2026-10-01"],
  timezone: "UTC",
});
it("abstains on non-UTC QA calendars until their date-boundary conversion is admitted", () => {
  const result = evaluateSelfServiceQa({ ...qa(), timezone: "America/New_York" });
  expect(result.output_state).toBe("unknown");
  expect(result.reasons).toContain("non_utc_qa_calendar_conversion_not_admitted");
  expect((result.details as Record<string, unknown>).successful_resolution_percent).toBeNull();
});
const predicate = (changes: Partial<EcPredicateDefinition> = {}): EcPredicateDefinition => ({
  predicate: "supports", inverse_predicate: "supported_by", from_types: ["application"], to_types: ["process"],
  allow_self_loop: false, acyclic: false, qualifiers: {}, requires_received_evidence: true, requires_document_version: false, ...changes,
});
const edge = (id = "edge:1", changes: Partial<EcEdge> = {}): EcEdge => ({
  ...evidence(id), from_id: "app:1", to_id: "process:1", predicate: "supports", qualifiers: {},
  evidence_refs: [{ scope, source_id: "source:1", source_version_id: "version:1", sha256: sha("source-bytes"), locator: "row:1", received: true, access_scope: evidence().access_scope }],
  cited_source_version_id: null, ...changes,
});
const edges = (): EdgeAdapterInput => ({ context: context(), entities: [entity(), entity("process:1", "process")], edges: [edge()], dictionary: [predicate()] });
const detail = (result: EcRuleEvaluation) => result.details as Record<string, unknown>;
const event = (changes: Partial<EcInvalidationChange> = {}): EcInvalidationChange => ({ scope, kind: "assertion", id: "new-owner", revision: "v1", change: "insert", subject_id: "app:1", predicate: "accountable_to", ...changes });

describe("EC slice v0 evaluation identity and coverage (A14-A16, A18, A21, A23, A26)", () => {
  it("preserves all eight contract states including non-comparability", () => {
    expect(EC_SLICE_STATES).toEqual(["finding", "clear", "unknown", "partial", "conflicting", "restricted", "out_of_scope", "not_comparable"]);
  });
  it("binds immutable input, parameters and implementation to a deterministic revision", () => {
    const input = ownership(), first = evaluateOwnershipCoverage(input);
    expect(evaluateOwnershipCoverage(input)).toEqual(first);
    expect(first).toMatchObject({ kind: "rule_evaluation", rule_id: "design:ownership-coverage", rule_version: "v0", review_state: "not_reviewed", agent_ready: false, agent_readiness_status: "blocked", index_state: "not_indexed", downstream_context_policy: "exclude" });
    const changed = evaluateOwnershipCoverage({ ...input, context: { ...input.context, implementation_sha256: sha("changed-code") } });
    expect(changed.id).toBe(first.id);
    expect(changed.revision_id).not.toBe(first.revision_id);
    expect(changed.input_sha256).not.toBe(first.input_sha256);
    expect(changed.implementation_sha256).not.toBe(first.implementation_sha256);
  });
  it("canonicalizes nested keys, rejects non-JSON and nonfinite numbers", () => {
    expect(ecSliceHash({ z: { b: 2, a: 1 }, a: [] })).toBe(ecSliceHash({ a: [], z: { a: 1, b: 2 } }));
    for (const value of [NaN, Infinity, undefined, new Date(), { a: undefined }]) expect(() => ecSliceHash(value)).toThrow();
  });
  it("reordering source rows leaves the entire evaluation unchanged (A02, A18)", () => {
    const input: OwnershipCoverageInput = { ...ownership(), context: context(2), applications: [entity(), entity("app:2")], assertions: [assertion(), assertion("a2", { subject_id: "app:2" })] };
    expect(evaluateOwnershipCoverage({ ...input, applications: [...input.applications].reverse(), assertions: [...input.assertions].reverse() })).toEqual(evaluateOwnershipCoverage(input));
  });
  it("does not mutate its input", () => {
    const input = ownership(), before = JSON.stringify(input);
    evaluateOwnershipCoverage(input);
    expect(JSON.stringify(input)).toBe(before);
  });
  it.each(["partial", "absent", "blocked"] as const)("cannot clear %s coverage", (completeness) => {
    const input = ownership();
    const result = evaluateOwnershipCoverage({ ...input, context: { ...input.context, coverage: { ...input.context.coverage, completeness } } });
    expect(result.output_state).not.toBe("clear");
    expect(result.predicate_result).toBeNull();
  });
  it("zero findings and a zero denominator do not certify coverage", () => {
    const result = evaluateOwnershipCoverage({ ...ownership(), context: context(0), applications: [], assertions: [] });
    expect(result.output_state).toBe("unknown");
    expect(result.coverage).toMatchObject({ expected_count: 0, eligible_count: 0, evaluated_count: 0 });
  });
  it("requires expected and evaluated cohort counts to agree before clear", () => {
    const result = evaluateOwnershipCoverage({ ...ownership(), context: context(2) });
    expect(result.output_state).toBe("partial");
    expect(result.coverage).toMatchObject({ expected_count: 2, evaluated_count: 1, skipped_count: 1, completeness: "partial" });
  });
  it("preserves explicit applicability", () => {
    const input = ownership();
    expect(evaluateOwnershipCoverage({ ...input, context: { ...input.context, applicability: "out_of_scope" } }).output_state).toBe("out_of_scope");
  });
  it("refuses undeclared scope, duplicate IDs, invalid hash and cross-binding refs (A22)", () => {
    const input = ownership();
    expect(() => evaluateOwnershipCoverage({ ...input, context: { ...input.context, scope: { ...scope, binding_key: "" } } })).toThrow();
    expect(() => evaluateOwnershipCoverage({ ...input, applications: [entity(), entity()] })).toThrow();
    expect(() => evaluateOwnershipCoverage({ ...input, assertions: [assertion("a", { scope: { ...scope, binding_key: "other" } })] })).toThrow("Cross-scope");
    expect(() => evaluateOwnershipCoverage({ ...input, assertions: [assertion("a", { source_sha256: "bad" })] })).toThrow("SHA-256");
  });
});

describe("ownership, source selection and conflict preservation (A09, A11, A13-A16)", () => {
  it("assesses only declared logical apps, never modules or deployments", () => {
    const result = evaluateOwnershipCoverage({ ...ownership(), applications: [entity(), entity("module:1", "application_module"), entity("deployment:1", "deployment")] });
    expect(result.output_state).toBe("clear");
    expect(result.coverage.eligible_count).toBe(1);
    expect(result.subject_ids).toEqual(["app:1"]);
  });
  it("keeps one unknown and one conflicting owner separate from the known owner", () => {
    const result = evaluateOwnershipCoverage({ ...ownership(), context: context(3), applications: [entity(), entity("app:2"), entity("app:3")],
      assertions: [assertion(), assertion("a2", { subject_id: "app:2" }), assertion("a3", { subject_id: "app:2", value: "role:2" })] });
    expect(result.output_state).toBe("conflicting");
    expect(detail(result).subjects).toEqual([{ subject_id: "app:1", state: "clear" }, { subject_id: "app:2", state: "conflicting" }, { subject_id: "app:3", state: "unknown" }]);
    expect(result.coverage).toMatchObject({ expected_count: 3, evaluated_count: 2, skipped_count: 1, completeness: "partial" });
  });
  it("reports mixed known and missing owners as partial", () => {
    expect(evaluateOwnershipCoverage({ ...ownership(), context: context(2), applications: [entity(), entity("app:2")] }).output_state).toBe("partial");
  });
  it.each([null, ""])("keeps missing owner %s unknown", (value) => {
    const result = evaluateOwnershipCoverage({ ...ownership(), assertions: [assertion("a", { value, missing_reason: "not_supplied" })] });
    expect(result.output_state).toBe("unknown");
  });
  it.each([
    { source_date: null }, { valid_from: null }, { state: "target" as const }, { fresh_until: "2026-09-30" }, { review: "rejected" as const },
    { known_from: "2026-10-17T00:00:00Z" }, { valid_from: "2026-10-01" }, { valid_to: "2026-09-30" }, { known_to: "2026-10-16T00:00:00Z" },
  ])("does not clear unavailable/target/stale evidence %#", (changes) => {
    expect(evaluateOwnershipCoverage({ ...ownership(), assertions: [assertion("a", changes)] }).output_state).toBe("unknown");
  });
  it("known-at selection reproduces the earlier answer after a late correction", () => {
    const old = assertion("old");
    const correction = assertion("correction", { value: "role:2", known_from: "2026-10-10T00:00:00Z", source_known_at: "2026-10-10T00:00:00Z", source_version_id: "version:2",
      supersession: { assertion_id: "old", decision_id: "decision:1", recognized: true, known_at: "2026-10-10T00:00:00Z" } });
    const input = competing([old, correction]);
    const earlier = evaluateCompetingAssertions({ ...input, context: { ...input.context, selection: { ...input.context.selection, known_at: "2026-10-05T00:00:00Z" } } });
    expect(detail(earlier).groups).toEqual([expect.objectContaining({ values: ["role:1"] })]);
    const later = evaluateCompetingAssertions(input);
    expect(later.output_state).toBe("clear");
    expect(detail(later).groups).toEqual([expect.objectContaining({ values: ["role:2"] })]);
  });
  it("rejects invalid chronology and calendar dates", () => {
    for (const changes of [{ source_date: "2026-10-02" }, { source_known_at: "2026-10-02T00:00:00Z" }, { valid_to: "2026-09-01" }, { valid_from: "2026-02-30" }]) {
      expect(() => evaluateOwnershipCoverage({ ...ownership(), assertions: [assertion("a", changes)] })).toThrow();
    }
  });
  it("rejects changed bytes masquerading as the same immutable source version", () => {
    expect(() => evaluateCompetingAssertions(competing([assertion(), assertion("a2", { source_sha256: sha("other-bytes") })]))).toThrow("source-version");
  });
  it("restricted evidence blocks clearing and suppresses detail", () => {
    const result = evaluateOwnershipCoverage({ ...ownership(), assertions: [assertion("a", { access: "restricted" })] });
    expect(result.output_state).toBe("restricted"); expect(result.details).toBeNull();
  });
});

describe("same-grain assertions, copies and supersession (A10-A11, A13, A18)", () => {
  it.each([
    { known_from: "2026-10-17T00:00:00Z", source_known_at: "2026-10-17T00:00:00Z", valid_from: "2026-09-01" },
    { known_from: "2026-10-10T00:00:00Z", source_known_at: "2026-10-10T00:00:00Z", valid_from: "2026-10-01" },
  ])("selects temporal eligibility before supersession %#", (changes) => {
    const prior = assertion("old");
    const replacement = assertion("new", { ...changes, value: "role:2", source_version_id: "version:2",
      supersession: { assertion_id: "old", decision_id: "review:1", recognized: true, known_at: changes.known_from } });
    const result = evaluateCompetingAssertions(competing([prior, replacement]));
    expect(result.output_state).toBe("clear");
    expect(detail(result).groups).toEqual([expect.objectContaining({ values: ["role:1"], assertion_ids: ["old"] })]);
  });
  it("orders offset timestamps by actual UTC instants rather than lexical dates", () => {
    const replacement = assertion("new", { known_from: "2026-10-15T23:30:00-02:00", source_known_at: "2026-10-15T23:30:00-02:00", value: "role:2",
      supersession: { assertion_id: "old", decision_id: "review:1", recognized: true, known_at: "2026-10-15T23:30:00-02:00" } });
    const result = evaluateCompetingAssertions(competing([assertion("old"), replacement]));
    expect(result.output_state).toBe("clear");
    expect(detail(result).groups).toEqual([expect.objectContaining({ values: ["role:1"] })]);
    const laterContext = { ...context(), selection: { valid_at: "2026-09-30", known_at: "2026-10-16T02:00:00Z" } };
    const later = evaluateCompetingAssertions({ ...competing([assertion("old"), replacement]), context: laterContext });
    expect(detail(later).groups).toEqual([expect.objectContaining({ values: ["role:2"] })]);
  });
  it("rejects cross-population replacement instead of suppressing the old grain", () => {
    const prior = measurement("old", {}, 10);
    const replacement = { ...measurement("new", { population: "other" }, 20), known_from: "2026-10-10T00:00:00Z",
      supersession: { assertion_id: "old", decision_id: "review:1", recognized: true, known_at: "2026-10-10T00:00:00Z" } };
    expect(() => evaluateCompetingAssertions({ ...competing(), subject_ids: ["process:1"], assertions: [prior, replacement] })).toThrow("supersession");
  });
  it("rejects cyclic supersession even when each individual reference is otherwise valid", () => {
    const first = assertion("a", { supersession: { assertion_id: "b", decision_id: "review:a", recognized: true, known_at: "2026-10-10T00:00:00Z" } });
    const second = assertion("b", { supersession: { assertion_id: "a", decision_id: "review:b", recognized: true, known_at: "2026-10-10T00:00:00Z" } });
    expect(() => evaluateCompetingAssertions(competing([first, second]))).toThrow("Cyclic supersession");
  });
  it("detects different values from the same source", () => {
    const result = evaluateCompetingAssertions(competing([assertion(), assertion("other", { value: "role:2" })]));
    expect(result.output_state).toBe("conflicting");
    expect(detail(result).groups).toEqual([expect.objectContaining({ values: ["role:1", "role:2"], independent_sources: 1 })]);
  });
  it("detects two same-source observations at a complete measurement grain", () => {
    const input = { ...competing(), subject_ids: ["process:1"], assertions: [measurement("m1", {}, 38), measurement("m2", {}, 42)] };
    expect(evaluateCompetingAssertions(input).output_state).toBe("conflicting");
  });
  it("does not count an explicit copy or a derived assertion as independent evidence", () => {
    const original = assertion();
    const copy = assertion("copy", { origin: "copy", exact_copy_of: original.id, source_id: "source:copy", source_version_id: "version:copy" });
    const derived = assertion("derived", { origin: "derived", source_id: "source:derived", source_version_id: "version:derived" });
    const result = evaluateCompetingAssertions(competing([original, copy, derived]));
    expect(result.output_state).toBe("clear");
    expect(detail(result).groups).toEqual([expect.objectContaining({ values: ["role:1"], independent_sources: 1 })]);
  });
  it("does not silently treat a newer source version as supersession", () => {
    const later = assertion("new", { source_version_id: "version:2", value: "role:2", known_from: "2026-10-10T00:00:00Z" });
    expect(evaluateCompetingAssertions(competing([assertion(), later])).output_state).toBe("conflicting");
  });
  it("ignores unrecognized supersession and rejects unlike-grain supersession", () => {
    const replacement = assertion("new", { value: "role:2", known_from: "2026-10-10T00:00:00Z", supersession: { assertion_id: "assertion:1", decision_id: "review:1", known_at: "2026-10-10T00:00:00Z", recognized: false } });
    expect(evaluateCompetingAssertions(competing([assertion(), replacement])).output_state).toBe("conflicting");
    expect(() => evaluateCompetingAssertions(competing([assertion(), { ...replacement, grain: { kind: "attribute", predicate: "technology_owner", qualifiers: {}, fact_basis: "declared" } }]))).toThrow("supersession");
  });
  it("copies cannot resurrect a superseded original", () => {
    const original = assertion("old");
    const copy = assertion("copy", { origin: "copy", exact_copy_of: "old" });
    const replacement = assertion("new", { value: "role:2", known_from: "2026-10-10T00:00:00Z", supersession: { assertion_id: "old", decision_id: "review:1", known_at: "2026-10-10T00:00:00Z", recognized: true } });
    const result = evaluateCompetingAssertions(competing([original, copy, replacement]));
    expect(result.output_state).toBe("clear");
    expect(detail(result).groups).toEqual([expect.objectContaining({ values: ["role:2"] })]);
  });
  it("rejects false exact copies and copy cycles", () => {
    expect(() => evaluateCompetingAssertions(competing([assertion(), assertion("copy", { origin: "copy", exact_copy_of: "assertion:1", value: "role:2" })]))).toThrow("copy");
    expect(() => evaluateCompetingAssertions(competing([assertion("a", { origin: "copy", exact_copy_of: "b" }), assertion("b", { origin: "copy", exact_copy_of: "a" })]))).toThrow("Cyclic");
  });
  it.each([
    { population: "other" }, { perimeter: "other" }, { unit: "count" }, { timezone: "Other/Zone" }, { calendar: "fiscal" },
    { definition_version: "v1" }, { method: "estimated" }, { fact_basis: "derived" }, { scenario: "forecast" as const },
    { dimensions: { segment: "other" } }, { period_start: "2026-08-01" },
  ])("unlike measurement grain is not a contradiction %#", (changes) => {
    const result = evaluateCompetingAssertions({ ...competing(), subject_ids: ["process:1"], assertions: [measurement("a", {}, 10), measurement("b", changes, 99)] });
    expect(result.output_state).toBe("not_comparable");
    expect(result.predicate_result).toBeNull();
  });
  it("does not compare non-overlapping validity or unavailable source knowledge", () => {
    const rows = [assertion(), assertion("past", { value: "role:2", valid_to: "2026-09-20" }), assertion("future", { value: "role:3", source_known_at: "2026-10-20T00:00:00Z", known_from: "2026-10-20T00:00:00Z" })];
    expect(evaluateCompetingAssertions(competing(rows)).output_state).toBe("clear");
  });
  it("missing values are unknown and missing grain is not comparable", () => {
    expect(evaluateCompetingAssertions(competing([assertion("a", { value: null, missing_reason: "not_supplied" })])).output_state).toBe("unknown");
    expect(evaluateCompetingAssertions({ ...competing(), subject_ids: ["process:1"], assertions: [measurement("a", { population: null })] }).output_state).toBe("not_comparable");
  });
  it.each(["binding_key", "namespace"] as const)("cross-%s observations cannot be compared", (key) => {
    const first = measurement("a"), second = { ...measurement("b"), scope: { ...scope, [key]: "other" } };
    expect(() => evaluateCompetingAssertions({ ...competing(), subject_ids: ["process:1"], assertions: [first, second] })).toThrow("Cross-scope");
  });
});

describe("target readiness without inferred actuals (A10, A14, A23, A28)", () => {
  it("preserves target 20 while actual and baseline remain unknown", () => {
    const result = evaluateTargetReadiness(target());
    expect(result.output_state).toBe("unknown");
    expect(detail(result)).toMatchObject({ target_values: [20], actual: null, baseline: null, attainment: null });
    expect(result.reasons).toEqual(expect.arrayContaining(["actual", "baseline", "eligibility_taxonomy", "repeat_contact_window"]));
  });
  it("complete evidence clears readiness without calculating attainment", () => {
    const result = evaluateTargetReadiness(readyTarget());
    expect(result.output_state).toBe("clear"); expect(result.predicate_result).toBe(false);
    expect(detail(result).attainment).toBeNull();
  });
  it.each(["unit", "population", "method", "period_start", "calendar", "timezone"] as const)("missing %s prevents readiness", (key) => {
    const input = readyTarget();
    const measurements = input.measurements.map((row) => ({ ...row, grain: grain({ ...(row.grain as EcMeasurementGrain), [key]: null }) }));
    expect(evaluateTargetReadiness({ ...input, measurements }).output_state).toBe("unknown");
  });
  it("requires the definition metadata and scenario pair", () => {
    const input = readyTarget();
    expect(evaluateTargetReadiness({ ...input, definition: { ...input.definition, denominator: null } }).output_state).toBe("unknown");
    expect(evaluateTargetReadiness({ ...input, scenario_pair: null }).output_state).toBe("unknown");
  });
  it("requires source-backed taxonomy and positive follow-up metadata with exact predicates", () => {
    const input = readyTarget();
    expect(() => evaluateTargetReadiness({ ...input, eligibility_taxonomy: assertion("unrelated", { subject_id: "process:1" }) })).toThrow("metadata predicate");
    expect(evaluateTargetReadiness({ ...input, repeat_contact_window: { ...input.repeat_contact_window!, value: 0 } }).output_state).toBe("unknown");
    expect(evaluateTargetReadiness({ ...input, eligibility_taxonomy: { ...input.eligibility_taxonomy!, value: "" } }).output_state).toBe("unknown");
  });
  it("different scenarios require otherwise compatible grains", () => {
    const input = readyTarget();
    expect(evaluateTargetReadiness({ ...input, measurements: input.measurements.map((row) => row.id === "actual" ? { ...row, grain: grain({ fact_basis: "different-basis" }) } : row) }).output_state).toBe("not_comparable");
  });
  it("competing actuals block readiness even within one file", () => {
    const input = readyTarget();
    expect(evaluateTargetReadiness({ ...input, measurements: [...input.measurements, measurement("actual-conflict", {}, 13)] }).output_state).toBe("conflicting");
  });
  it("refuses QA evidence as a candidate actual even when relabeled", () => {
    const input = readyTarget();
    expect(() => evaluateTargetReadiness({ ...input, measurements: [...input.measurements, { ...measurement("qa"), context: "qa_only" }] })).toThrow("QA");
  });
});

describe("self-service QA arithmetic is separate from candidate KPI values (A12, A14, A23)", () => {
  it("uses 12 successful resolutions, excluding abandonment, unresolved and later-agent contacts", () => {
    const result = evaluateSelfServiceQa(qa());
    expect(result.output_state).toBe("finding");
    expect(detail(result)).toMatchObject({ purpose: "qa_only", verification: "verified", numerator: 12, denominator: 100, successful_resolution_percent: 12, business_actual: null });
    expect(detail(result).successful_resolution_percent).not.toBe(20);
  });
  it("reclassifying a success into any failure bucket changes the numerator", () => {
    for (const bucket of ["abandoned", "unresolved", "subsequent_agent"] as const) {
      const input = qa();
      expect(detail(evaluateSelfServiceQa({ ...input, successful: 11, [bucket]: input[bucket]! + 1 })).successful_resolution_percent).toBe(11);
    }
  });
  it.each([
    { follow_up_complete: false }, { repeat_contact_window_days: null }, { eligibility_taxonomy: null },
    { observation_period: null }, { timezone: null }, { eligible: null },
    { eligible: 0, attempts: 0, successful: 0, abandoned: 0, unresolved: 0, subsequent_agent: 0 },
  ])("abstains on incomplete follow-up or denominator %#", (changes) => {
    const result = evaluateSelfServiceQa({ ...qa(), ...changes });
    expect(result.output_state).toBe("unknown");
    expect(detail(result)).toMatchObject({ verification: "unverified", numerator: null, successful_resolution_percent: null });
  });
  it("only a complete positive denominator permits an evidenced zero", () => {
    const result = evaluateSelfServiceQa({ ...qa(), successful: 0, abandoned: 15 });
    expect(result.output_state).toBe("clear");
    expect(detail(result).successful_resolution_percent).toBe(0);
  });
  it("requires chronology proving that the whole repeat-contact window elapsed", () => {
    const input = qa();
    const tooEarly = { ...input.evidence, known_from: "2026-10-05T00:00:00Z", source_known_at: "2026-10-05T00:00:00Z" };
    const result = evaluateSelfServiceQa({ ...input, evidence: tooEarly, follow_up_complete: true });
    expect(result.output_state).toBe("unknown");
    expect(detail(result)).toMatchObject({ verification: "unverified", successful_resolution_percent: null });
    expect(evaluateSelfServiceQa({ ...input, observation_period: ["2026-10-10", "2026-10-20"] }).output_state).toBe("unknown");
  });
  it("does not infer a timezone, eligibility or duration from a completeness flag", () => {
    for (const changes of [{ timezone: null }, { eligibility_taxonomy: "" }, { repeat_contact_window_days: null }]) {
      expect(detail(evaluateSelfServiceQa({ ...qa(), ...changes, follow_up_complete: true })).successful_resolution_percent).toBeNull();
    }
    expect(() => evaluateSelfServiceQa({ ...qa(), timezone: "not-a-timezone" })).toThrow();
    expect(() => evaluateSelfServiceQa({ ...qa(), repeat_contact_window_days: 0 })).toThrow();
    expect(() => evaluateSelfServiceQa({ ...qa(), observation_period: ["2026-10-01", "2026-09-01"] })).toThrow();
    expect(evaluateSelfServiceQa({ ...qa(), follow_up_complete: "true" as unknown as boolean }).output_state).toBe("unknown");
  });
  it.each(["timezone", "eligibility_taxonomy", "observation_period", "repeat_contact_window_days", "eligible"] as const)("omitted %s abstains at the untyped input boundary", (key) => {
    const { [key]: omitted, ...rest } = qa();
    void omitted;
    const result = evaluateSelfServiceQa(rest as SelfServiceQaInput);
    expect(result.output_state).toBe("unknown");
    expect(detail(result).successful_resolution_percent).toBeNull();
  });
  it.each([{ successful: -1 }, { successful: 1.2 }, { successful: Number.MAX_SAFE_INTEGER + 1 }, { successful: 13 }, { attempts: 101 }])("rejects invalid counts or partitions %#", (changes) => {
    expect(() => evaluateSelfServiceQa({ ...qa(), ...changes })).toThrow();
  });
});

describe("edge adapter safety (A07-A09, A13-A14, A17, A22, A25-A26)", () => {
  it("normalizes only an explicitly declared inverse and deduplicates semantic edges", () => {
    const input = edges();
    const result = evaluateEdgeAdapter({ ...input, context: context(2), edges: [edge(), edge("inverse", { predicate: "supported_by", from_id: "process:1", to_id: "app:1" })] });
    expect(result.output_state).toBe("clear");
    expect(detail(result).distinct_edge_count).toBe(1);
    expect(detail(result).accepted_edges).toEqual([expect.objectContaining({ from_id: "app:1", to_id: "process:1", predicate: "supports" })]);
  });
  it.each([
    { predicate: "evidence prose" }, { from_id: "process:1", to_id: "app:1" }, { to_id: "missing" },
    { qualifiers: { invented: true } }, { valid_to: "2026-08-01" }, { evidence_refs: [] },
  ])("rejects unsafe semantics or missing evidence %#", (changes) => {
    expect(() => evaluateEdgeAdapter({ ...edges(), edges: [edge("e", changes)] })).toThrow();
  });
  it("requires an actual qualifier object, including for an otherwise empty contract", () => {
    expect(() => evaluateEdgeAdapter({ ...edges(), edges: [edge("e", { qualifiers: [] as unknown as EcEdge["qualifiers"] })] })).toThrow("object");
  });
  it("enforces required deployment environment without promoting it to application identity", () => {
    const dictionary = [predicate({ predicate: "hosted_on", inverse_predicate: null, from_types: ["deployment"], to_types: ["platform"], qualifiers: { environment: { type: "string", required: true, values: ["production", "recovery"], from_types: ["deployment"] } } })];
    const input: EdgeAdapterInput = { ...edges(), dictionary, entities: [entity("deployment:1", "deployment"), entity("platform:1", "platform")], edges: [edge("e", { predicate: "hosted_on", from_id: "deployment:1", to_id: "platform:1" })] };
    expect(() => evaluateEdgeAdapter(input)).toThrow("qualifier");
    expect(evaluateEdgeAdapter({ ...input, edges: [{ ...input.edges[0], qualifiers: { environment: "production" } }] }).output_state).toBe("clear");
  });
  it("does not turn pending requests into received evidence", () => {
    const input = edges(), original = input.edges[0];
    expect(() => evaluateEdgeAdapter({ ...input, edges: [{ ...original, evidence_refs: [{ ...original.evidence_refs[0], received: false }] }] })).toThrow("Pending");
  });
  it("requires the exact document version and rejects cross-binding citations", () => {
    const input = { ...edges(), dictionary: [predicate({ requires_document_version: true })] };
    expect(() => evaluateEdgeAdapter({ ...input, edges: [edge("e", { cited_source_version_id: "version:2" })] })).toThrow("Exact");
    expect(evaluateEdgeAdapter({ ...input, edges: [edge("e", { cited_source_version_id: "version:1" })] }).output_state).toBe("clear");
    expect(() => evaluateEdgeAdapter({ ...input, edges: [edge("e", { evidence_refs: [{ ...edge().evidence_refs[0], scope: { ...scope, binding_key: "other" } }] })] })).toThrow("Cross-scope");
    expect(() => evaluateEdgeAdapter({ ...input, edges: [edge("e", { evidence_refs: [{ ...edge().evidence_refs[0], sha256: sha("tampered") }] })] })).toThrow("source-version");
  });
  it("declared unresolved endpoints, target-state links and missing extracts cannot clear", () => {
    const input = edges();
    expect(evaluateEdgeAdapter({ ...input, entities: input.entities.map((row) => ({ ...row, resolution: "unresolved" })) }).output_state).toBe("unknown");
    expect(evaluateEdgeAdapter({ ...input, edges: [edge("e", { state: "target" })] }).output_state).toBe("unknown");
    expect(evaluateEdgeAdapter({ ...input, edges: [] }).output_state).toBe("unknown");
  });
  it("rejects forbidden self loops and hierarchy cycles", () => {
    const input: EdgeAdapterInput = { ...edges(), context: context(2), entities: [entity(), entity("app:2")], dictionary: [predicate({ from_types: ["application"], to_types: ["application"], acyclic: true })],
      edges: [edge("e1", { to_id: "app:2" }), edge("e2", { from_id: "app:2", to_id: "app:1" })] };
    expect(() => evaluateEdgeAdapter(input)).toThrow("cycle");
    expect(() => evaluateEdgeAdapter({ ...input, edges: [edge("self", { to_id: "app:1" })] })).toThrow("self-loop");
  });
});

describe("pure dependency invalidation (A18-A20, A24)", () => {
  it("scope completeness and scope revision each change the evaluation revision", () => {
    const input = ownership(), previous = evaluateOwnershipCoverage(input);
    for (const coverage of [{ ...input.context.coverage, completeness: "partial" as const }, { ...input.context.coverage, revision: "scope:v1" }]) {
      const updated = evaluateOwnershipCoverage({ ...input, context: { ...input.context, coverage } });
      expect(updated.id).toBe(previous.id);
      expect(updated.revision_id).not.toBe(previous.revision_id);
      expect(updated.input_sha256).not.toBe(previous.input_sha256);
      if (coverage.completeness === "partial") expect(updated.output_state).toBe("partial");
    }
  });
  it.each(["assertion", "edge"] as const)("new %s invalidates an absence result without modifying old rows", (kind) => {
    const input = { ...ownership(), assertions: [] }, before = JSON.stringify(input);
    const old = evaluateOwnershipCoverage(input);
    expect(old.output_state).toBe("unknown");
    const invalidation = invalidateRuleEvaluation(old, [event({ kind })]);
    expect(invalidation).toMatchObject({ invalidated: true, stale: true, requires_re_evaluation: true, historical_revision_preserved: true, serving_authorized: false });
    expect(invalidation.affected_dependency_ids).toContain("query:accountable-owner-absence");
    expect(JSON.stringify(input)).toBe(before);
    const updated = evaluateOwnershipCoverage({ ...input, assertions: [assertion("new-owner")] });
    expect(updated.output_state).toBe("clear");
    expect(updated.id).toBe(old.id); expect(updated.revision_id).not.toBe(old.revision_id);
  });
  it("new logical cohort member invalidates without touching the old app or assertion", () => {
    const old = evaluateOwnershipCoverage(ownership());
    expect(invalidateRuleEvaluation(old, [event({ kind: "entity", id: "app:new", subject_id: "app:new", entity_type: "application" })]).invalidated).toBe(true);
    expect(evaluateOwnershipCoverage({ ...ownership(), context: context(2), applications: [entity(), entity("app:new")] }).output_state).toBe("partial");
  });
  it("new source version invalidates via logical source even when the old version is immutable", () => {
    const old = evaluateOwnershipCoverage(ownership());
    expect(invalidateRuleEvaluation(old, [event({ kind: "source_version", id: "version:2", source_id: "source:1" })]).affected_dependency_ids).toContain("source:source:1");
    expect(invalidateRuleEvaluation(old, [event({ kind: "source", id: "source:1", revision: "version:2", change: "update" })]).invalidated).toBe(true);
  });
  it.each(["delete", "supersede", "expire", "revoke"] as const)("%s invalidates exact input dependencies", (change) => {
    expect(invalidateRuleEvaluation(evaluateOwnershipCoverage(ownership()), [event({ id: "assertion:1", change })]).invalidated).toBe(true);
  });
  it.each(["dictionary", "definition", "crosswalk", "policy", "coverage", "cohort", "implementation", "selection", "review", "access"] as const)("%s revisions invalidate even without changed source bytes", (kind) => {
    const result = evaluateOwnershipCoverage(ownership());
    const dependency = result.dependencies.find((row) => row.kind === kind)!;
    expect(invalidateRuleEvaluation(result, [event({ kind, id: dependency.id, revision: "changed", change: "update" })]).invalidated).toBe(true);
  });
  it("new actual invalidates target missing-evidence evaluation", () => {
    const old = evaluateTargetReadiness(target());
    expect(invalidateRuleEvaluation(old, [event({ subject_id: "process:1", predicate: "observation", id: "actual:new" })]).invalidated).toBe(true);
  });
  it("disjoint scopes, unrelated subjects, predicates and entity kinds do not invalidate", () => {
    const result = evaluateOwnershipCoverage(ownership());
    for (const change of [event({ scope: { ...scope, binding_key: "other" } }), event({ subject_id: "app:other" }), event({ predicate: "technology_owner" }), event({ kind: "entity", entity_type: "deployment" }), event({ kind: "source_version", source_id: "source:unrelated" })]) {
      expect(invalidateRuleEvaluation(result, [change]).invalidated).toBe(false);
    }
  });
  it("unchanged exact revisions are idempotent and history remains intact", () => {
    const result = evaluateOwnershipCoverage(ownership()), before = JSON.stringify(result);
    const dependency = result.dependencies.find((row) => row.kind === "assertion")!;
    expect(invalidateRuleEvaluation(result, [event({ id: dependency.id, revision: dependency.revision, change: "update" })]).invalidated).toBe(false);
    expect(invalidateRuleEvaluation(result, [])).toMatchObject({ invalidated: false, stale: false, serving_authorized: false });
    expect(JSON.stringify(result)).toBe(before);
  });
  it("refuses a derivation with removed dependencies or changed output", () => {
    const result = evaluateOwnershipCoverage(ownership());
    expect(() => invalidateRuleEvaluation({ ...result, dependencies: result.dependencies.filter((dependency) => dependency.kind !== "query") }, [event()])).toThrow("integrity");
    expect(() => invalidateRuleEvaluation({ ...result, output_state: "finding" }, [event()])).toThrow("integrity");
  });
});

describe("explicit source access scope and revocation", () => {
  it.each(["unknown", "denied"] as const)("%s source access denies a result despite matching tenant binding", (state) => {
    const input = ownership();
    const result = evaluateOwnershipCoverage({ ...input, assertions: [assertion("a", { access_scope: { ...evidence().access_scope, state } })] });
    expect(result.output_state).toBe("restricted"); expect(result.details).toBeNull();
  });
  it("absence of a source access declaration denies instead of inventing permission", () => {
    const { access_scope: omitted, ...row } = assertion();
    void omitted;
    const result = evaluateOwnershipCoverage({ ...ownership(), assertions: [row as EcAssertion] });
    expect(result.output_state).toBe("restricted");
  });
  it("explicit caller scope must authorize every required source access scope", () => {
    const input = ownership();
    expect(evaluateOwnershipCoverage({ ...input, context: { ...input.context, access: { scope_ids: [], revision: "access:v1" } } }).output_state).toBe("restricted");
    expect(evaluateOwnershipCoverage({ ...input, assertions: [assertion("a", { access_scope: { ...evidence().access_scope, scope_ids: ["access:other"] } })] }).output_state).toBe("restricted");
  });
  it("access revisions change result revision and independently invalidate dependency", () => {
    const input = ownership(), previous = evaluateOwnershipCoverage(input);
    const changed = evaluateOwnershipCoverage({ ...input, assertions: [assertion("assertion:1", { access_scope: { ...evidence().access_scope, revision: "acl:v1" } })] });
    expect(changed.id).toBe(previous.id); expect(changed.revision_id).not.toBe(previous.revision_id);
    expect(invalidateRuleEvaluation(previous, [event({ kind: "access", id: "acl:unit", change: "revoke" })]).invalidated).toBe(true);
    expect(invalidateRuleEvaluation(previous, [event({ kind: "access", id: "rule-caller", change: "update", revision: "access:v2" })]).invalidated).toBe(true);
  });
  it("unknown cited-source access is denied independently from edge-source access", () => {
    const input = edges();
    const changed = edge("e", { evidence_refs: [{ ...edge().evidence_refs[0], access_scope: { ...evidence().access_scope, id: "acl:citation", state: "unknown" } }] });
    const result = evaluateEdgeAdapter({ ...input, edges: [changed] });
    expect(result.output_state).toBe("restricted"); expect(result.details).toBeNull();
    expect(invalidateRuleEvaluation(result, [event({ kind: "access", id: "acl:citation", change: "revoke" })]).invalidated).toBe(true);
  });
});
