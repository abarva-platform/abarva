import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { adaptEcPrivateCandidateV0 } from "../adapt_ec_private_candidate_v0";
import type { EcPrivateCandidateEnvelope } from "../ec_private_candidate_types";
import { makeEcPrivateCandidateFixture } from "./ec_private_candidate_fixture";

type Row = Record<string, unknown>;
const rows = (input: unknown[]) => input as Row[];
const envelopeRows = (out: EcPrivateCandidateEnvelope) => [
  ...out.source_file, ...out.source_record, ...out.object, ...out.assertion,
  ...out.measure, ...out.relationship, ...out.document, ...out.evidence_item,
];
const sorted = (value: unknown): unknown => Array.isArray(value) ? value.map(sorted) :
  value && typeof value === "object" ? Object.fromEntries(Object.entries(value)
    .sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([key, item]) => [key, sorted(item)])) : value;
const hash = (value: unknown) => createHash("sha256").update(JSON.stringify(sorted(value)) + "\n").digest("hex");

test("every canonical row carries explicit unknown/deny and an independently reproducible access fingerprint", () => {
  const fixture = makeEcPrivateCandidateFixture();
  const before = JSON.stringify(fixture.input);
  const out = adaptEcPrivateCandidateV0(fixture.input, fixture.binding);
  for (const row of envelopeRows(out)) {
    const dependency = row.attributes_json.access_dependency as Row;
    assert.ok(dependency, row.id);
    assert.equal(dependency.source_access_scope, "unknown");
    assert.equal(dependency.access_decision, "deny");
    assert.equal(dependency.input_scope_state, "absent");
    const { revision_sha256, ...body } = dependency;
    assert.equal(revision_sha256, hash(body));
    assert.equal(row.agent_readiness_status, "blocked");
    assert.equal(row.downstream_context_policy, "exclude");
  }
  assert.equal(JSON.stringify(fixture.input), before);
});

test("explicit access metadata remains unknown/denied without changing source bytes or object identities", () => {
  const fixture = makeEcPrivateCandidateFixture();
  const original = adaptEcPrivateCandidateV0(fixture.input, fixture.binding);
  for (const group of [fixture.input.sources, fixture.input.entities, fixture.input.assertions,
    fixture.input.measurements, fixture.input.edges]) {
    for (const row of rows(group)) Object.assign(row, {
      access_scope: "unknown", source_access_scope: "unknown", access_decision: "deny",
      access_scope_revision: "fictional-access-declaration:v1",
    });
  }
  const revised = adaptEcPrivateCandidateV0(fixture.input, fixture.binding);
  assert.deepEqual(revised.object.map(row => row.id), original.object.map(row => row.id));
  assert.deepEqual(revised.source_file.map(row => row.file_hash), original.source_file.map(row => row.file_hash));
  for (const row of envelopeRows(revised)) {
    const dependency = row.attributes_json.access_dependency as Row;
    assert.equal(dependency.input_scope_state, "unknown");
    assert.equal(dependency.access_decision, "deny");
    assert.notEqual(dependency.revision_sha256,
      (envelopeRows(original).find(prior => prior.id === row.id)!.attributes_json.access_dependency as Row).revision_sha256);
  }
});

test("a source-only access revision invalidates dependent rows and edge endpoints with unchanged raw bytes", () => {
  const fixture = makeEcPrivateCandidateFixture();
  const original = adaptEcPrivateCandidateV0(fixture.input, fixture.binding);
  const source = rows(fixture.input.sources).find(row => row.file_path === "raw/fixture/objects.csv")!;
  assert.ok(source);
  source.access_scope_revision = "fictional-source-access:v2";
  const revised = adaptEcPrivateCandidateV0(fixture.input, fixture.binding);
  assert.deepEqual(revised.object.map(row => row.id), original.object.map(row => row.id));
  assert.deepEqual(revised.source_file.map(row => row.file_hash), original.source_file.map(row => row.file_hash));
  const dependent = revised.object.filter(row => row.source_version === source.id);
  assert.ok(dependent.length > 0);
  for (const row of dependent) {
    assert.notEqual((row.attributes_json.access_dependency as Row).revision_sha256,
      (original.object.find(prior => prior.id === row.id)!.attributes_json.access_dependency as Row).revision_sha256);
    assert.equal((row.attributes_json.access_dependency as Row).source_scope_revision, source.access_scope_revision);
  }
  assert.ok(revised.relationship.some(row => JSON.stringify(row.attributes_json.endpoint_access_dependencies) !==
    JSON.stringify(original.relationship.find(prior => prior.id === row.id)!.attributes_json.endpoint_access_dependencies)));
  assert.ok(revised.relationship.some(row => (row.attributes_json.access_dependency as Row).revision_sha256 !==
    (original.relationship.find(prior => prior.id === row.id)!.attributes_json.access_dependency as Row).revision_sha256));
  assert.ok(envelopeRows(revised).every(row => row.agent_readiness_status === "blocked"));
});

test("an assertion-only access revision changes its fingerprint without rewriting its source or identity", () => {
  const fixture = makeEcPrivateCandidateFixture();
  const original = adaptEcPrivateCandidateV0(fixture.input, fixture.binding);
  rows(fixture.input.assertions)[0].access_scope_revision = "fictional-assertion-access:v2";
  const revised = adaptEcPrivateCandidateV0(fixture.input, fixture.binding);
  assert.equal(revised.assertion[0].id, original.assertion[0].id);
  assert.equal(revised.assertion[0].source_version, original.assertion[0].source_version);
  assert.notEqual((revised.assertion[0].attributes_json.access_dependency as Row).revision_sha256,
    (original.assertion[0].attributes_json.access_dependency as Row).revision_sha256);
  assert.equal(revised.assertion[0].access_decision, "deny");
});

test("edge access dependencies follow canonical endpoint order, including reversed source predicates", () => {
  const fixture = makeEcPrivateCandidateFixture();
  const out = adaptEcPrivateCandidateV0(fixture.input, fixture.binding);
  const accessById = new Map(out.object.map(row => [row.id, row.attributes_json.access_dependency]));
  assert.ok(out.relationship.some(row => row.relationship_type === "MITIGATES"));
  for (const row of out.relationship) {
    assert.deepEqual(row.attributes_json.endpoint_access_dependencies, [
      accessById.get(row.from_object_id), accessById.get(row.to_object_id),
    ]);
  }
});

test("document source-access revisions invalidate documents, evidence and their retained citation links", () => {
  const fixture = makeEcPrivateCandidateFixture();
  const original = adaptEcPrivateCandidateV0(fixture.input, fixture.binding);
  const source = rows(fixture.input.sources).find(row => String(row.file_path).endsWith(".txt"))!;
  assert.ok(source);
  source.access_scope_revision = "fictional-document-source-access:v2";
  const revised = adaptEcPrivateCandidateV0(fixture.input, fixture.binding);
  const changed = (before: { id: string; attributes_json: Record<string, unknown> }[],
    after: { id: string; attributes_json: Record<string, unknown> }[]) => after.some(row =>
    (row.attributes_json.access_dependency as Row).revision_sha256 !==
    (before.find(prior => prior.id === row.id)!.attributes_json.access_dependency as Row).revision_sha256);
  assert.equal(changed(original.document, revised.document), true);
  assert.equal(changed(original.evidence_item, revised.evidence_item), true);
  const links = revised.source_record.filter(row => row.attributes_json.evidence_link);
  assert.ok(links.length > 0);
  assert.ok(links.some(row => {
    const previous = original.source_record.find(prior => prior.id === row.id)!;
    return ((row.attributes_json.evidence_link as Row).access_dependency as Row).revision_sha256 !==
      ((previous.attributes_json.evidence_link as Row).access_dependency as Row).revision_sha256;
  }));
  assert.ok(envelopeRows(revised).every(row => row.agent_readiness_status === "blocked"));
});

test("a FEEDS qualifier flow-only access revision invalidates its edge without changing source bytes or endpoints", () => {
  const fixture = makeEcPrivateCandidateFixture();
  const original = adaptEcPrivateCandidateV0(fixture.input, fixture.binding);
  const flow = rows(fixture.input.entities).find(row => row.type === "design:data_flow")!;
  assert.ok(flow);
  flow.access_scope_revision = "fictional-qualifier-flow-access:v2";
  const revised = adaptEcPrivateCandidateV0(fixture.input, fixture.binding);
  const before = original.relationship.find(row => row.relationship_type === "FEEDS")!;
  const after = revised.relationship.find(row => row.id === before.id)!;
  assert.deepEqual(revised.source_file.map(row => row.file_hash), original.source_file.map(row => row.file_hash));
  assert.deepEqual([after.from_object_id, after.to_object_id], [before.from_object_id, before.to_object_id]);
  assert.deepEqual(after.attributes_json.endpoint_access_dependencies, before.attributes_json.endpoint_access_dependencies);
  assert.equal((after.attributes_json.reference_object_ids as string[]).length, 1);
  assert.notDeepEqual(after.attributes_json.reference_access_dependencies, before.attributes_json.reference_access_dependencies);
  assert.notEqual((after.attributes_json.access_dependency as Row).revision_sha256,
    (before.attributes_json.access_dependency as Row).revision_sha256);
  assert.equal(after.agent_readiness_status, "blocked");
});

test("a citation-only access revision stays in the retained source-record sidecar", () => {
  const fixture = makeEcPrivateCandidateFixture();
  const original = adaptEcPrivateCandidateV0(fixture.input, fixture.binding);
  const citation = rows(fixture.input.edges).find(row => row.predicate === "design:cites_document")!;
  assert.ok(citation);
  citation.access_scope_revision = "fictional-citation-only-access:v2";
  const revised = adaptEcPrivateCandidateV0(fixture.input, fixture.binding);
  assert.deepEqual(revised.source_file.map(row => row.file_hash), original.source_file.map(row => row.file_hash));
  const changed = revised.source_record.filter(row => row.attributes_json.evidence_link).filter(row => {
    const before = original.source_record.find(prior => prior.id === row.id)!;
    const dependency = (row.attributes_json.evidence_link as Row).access_dependency as Row;
    return dependency.revision_sha256 !== ((before.attributes_json.evidence_link as Row).access_dependency as Row).revision_sha256;
  });
  assert.equal(changed.length, 1);
  assert.equal(((changed[0].attributes_json.evidence_link as Row).access_dependency as Row).declared_scope_revision,
    citation.access_scope_revision);
});

for (const group of ["sources", "entities", "assertions", "measurements", "edges"] as const) {
  for (const [field, value] of [
    ["access_scope", "public"], ["source_access_scope", "tenant_all"], ["access_decision", "allow"],
    ["access_scope_revision", ""], ["access_scope_revision", "   "], ["access_scope_revision", 1],
  ] as const) {
    test(`rejects ${group} access escalation or invalid revision through ${field}=${JSON.stringify(value)}`, () => {
      const fixture = makeEcPrivateCandidateFixture();
      rows(fixture.input[group])[0][field] = value;
      assert.throws(() => adaptEcPrivateCandidateV0(fixture.input, fixture.binding));
    });
  }
}
