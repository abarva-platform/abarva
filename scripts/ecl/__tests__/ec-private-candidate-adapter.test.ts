import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import Papa from "papaparse";
import { adaptEcPrivateCandidateV0 } from "../adapt_ec_private_candidate_v0";
import {
  EC_PRIVATE_TYPE_MAP, EC_PRIVATE_PREDICATE_MAP,
  ecPrivateCanonicalJson, ecPrivateSha256,
  type EcPrivateCandidateInput,
} from "../ec_private_candidate_types";
import { makeEcPrivateCandidateFixture } from "./ec_private_candidate_fixture";

type Row = Record<string, unknown>;
const rows = (values: unknown[]) => values as Row[];
const adapt = (fixture = makeEcPrivateCandidateFixture()) => adaptEcPrivateCandidateV0(fixture.input, fixture.binding);
const byType = (input: EcPrivateCandidateInput, type: string) => rows(input.entities).find(row => row.type === type)!;

// Reconstruct changed raw bytes and their source-version locators before semantic mutations.
function changeCsv(input: EcPrivateCandidateInput, file: string, edit: (rows: Record<string, string>[]) => void): void {
  const parsed = Papa.parse<Record<string, string>>(Buffer.from(input.raw_files[file]).toString(), {
    header: true, skipEmptyLines: true,
  }).data;
  edit(parsed);
  const bytes = Buffer.from(Papa.unparse(parsed, { newline: "\n" }) + "\n");
  input.raw_files[file] = bytes;
  const source = rows(input.sources).find(source => source.file_path === file)!;
  const oldVersion = source.id;
  const fileHash = ecPrivateSha256(bytes);
  source.file_sha256 = fileHash;
  source.source_version_id = `srcv:${ecPrivateSha256(ecPrivateCanonicalJson([source.source_id, fileHash]))}`;
  source.id = source.source_version_id;
  source.row_count = parsed.length;
  for (const row of [...rows(input.entities), ...rows(input.assertions), ...rows(input.measurements), ...rows(input.edges)]) {
    for (const field of ["source_locator", "evidence_locator"]) {
      const locator = row[field] as Row | undefined;
      if (locator && locator.source_version_id === oldVersion) {
        locator.source_version_id = source.id;
        locator.file_sha256 = fileHash;
      }
    }
  }
}

test("exports the complete explicit maps and only declared canonical directions", () => {
  assert.equal(Object.keys(EC_PRIVATE_TYPE_MAP).length, 32);
  assert.equal(Object.keys(EC_PRIVATE_PREDICATE_MAP).length, 27);
  assert.equal(Object.values(EC_PRIVATE_PREDICATE_MAP).filter(row => row.relationship_type === null).length, 7);
  assert.equal(EC_PRIVATE_TYPE_MAP["design:role"], "persona");
  assert.equal(EC_PRIVATE_TYPE_MAP["design:capability"], "capability");
  assert.equal(EC_PRIVATE_TYPE_MAP["design:initiative"], "initiative");
  assert.equal(EC_PRIVATE_PREDICATE_MAP["design:supports_process"].relationship_type, "SUPPORTS");
  assert.equal(EC_PRIVATE_PREDICATE_MAP["design:uses_tool"].relationship_type, "USES");
});

test("pure deterministic mapping retains the three application grains and every source row", () => {
  const fixture = makeEcPrivateCandidateFixture();
  const before = JSON.stringify(fixture);
  const first = adapt(fixture);
  assert.deepEqual(first, adapt(fixture));
  assert.equal(JSON.stringify(fixture), before);
  assert.equal(first.object.filter(row => row.object_type === "application").length, 3);
  assert.equal(first.object.filter(row => row.object_type === "application_module").length, 1);
  assert.equal(first.object.filter(row => row.object_type === "application_deployment").length, 4);
  const csvRows = rows(fixture.input.sources).reduce((n, row) => n + Number(row.row_count ?? 0), 0);
  assert.equal(first.source_record.filter(row => row.record_type === "csv_row").length, csvRows);
  assert(first.object.every(row => row.lifecycle_state === "candidate" && !row.canonical_semantic_type.startsWith("design:")));
  const candidate = byType(fixture.input, "design:application");
  const seed = [fixture.binding.id_namespace, fixture.binding.tenant_key, fixture.binding.assessment_id, "object", candidate.id].join("|");
  const hex = createHash("sha256").update(seed).digest("hex").slice(0, 32);
  const variant = ((Number.parseInt(hex[16], 16) & 3) | 8).toString(16);
  const expected = `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-${variant}${hex.slice(17, 20)}-${hex.slice(20)}`;
  assert.equal(first.object[0].id, expected);
  first.object[0].attributes_json.changed = true;
  assert.equal(JSON.stringify(fixture), before);
});

test("raw reconstruction keeps entity IDs stable through labels and corrected source versions", () => {
  const original = adapt();
  const renamed = adapt(makeEcPrivateCandidateFixture({ label_suffix: " revised" }));
  const corrected = adapt(makeEcPrivateCandidateFixture({ source_revision: "v2" }));
  assert.deepEqual(original.object.map(row => row.id), renamed.object.map(row => row.id));
  assert.deepEqual(original.object.map(row => row.id), corrected.object.map(row => row.id));
  assert.notEqual(original.object[0].display_name, renamed.object[0].display_name);
  assert.notEqual(original.object[0].source_version, corrected.object[0].source_version);
  assert.notEqual(original.object[0].source_record_id, corrected.object[0].source_record_id);
  const collisions = adapt(makeEcPrivateCandidateFixture({ same_application_labels: true })).object.filter(row => row.object_type === "application");
  assert.equal(new Set(collisions.map(row => row.display_name)).size, 1);
  assert.equal(new Set(collisions.map(row => row.id)).size, 3);
});

test("all canonical UUIDs and metric keys are scoped to the isolated assessment", () => {
  const fixture = makeEcPrivateCandidateFixture();
  const original = adapt(fixture);
  fixture.binding.assessment_id = "assessment-ec-private-another";
  const other = adapt(fixture);
  assert.notEqual(original.object[0].id, other.object[0].id);
  assert.notEqual(original.measure[0].metric_key, other.measure[0].metric_key);
  assert.equal(original.measure[0].metric_key, original.measure[1].metric_key);
});

test("missing and null source receipt times remain unknown while known-at stays exact", () => {
  const fixture = makeEcPrivateCandidateFixture();
  const notes = rows(fixture.input.sources).filter(row => String(row.file_path).endsWith(".txt"));
  delete notes[0].received_at;
  notes[1].received_at = null;
  const before = JSON.stringify(fixture);
  const out = adapt(fixture);
  const emitted = out.source_file.filter(row => row.file_name.endsWith(".txt"));
  assert.deepEqual(emitted.map(row => row.received_at), [null, null]);
  assert.deepEqual(emitted.map(row => row.known_at), notes.map(row => row.known_at));
  assert.equal(Object.hasOwn(emitted[0].attributes_json.raw_candidate as Row, "received_at"), false);
  assert.equal((emitted[1].attributes_json.raw_candidate as Row).received_at, null);
  assert.equal(JSON.stringify(fixture), before);
});

test("provided source receipt times still require valid chronology", () => {
  for (const received of ["2026-10-02T00:00:00Z", "not-a-time"]) {
    const fixture = makeEcPrivateCandidateFixture();
    rows(fixture.input.sources)[0].received_at = received;
    assert.throws(() => adapt(fixture), /chronology|timestamp/);
  }
});

test("preserves full grain, competing values and null target/actual/baseline metadata", () => {
  const out = adapt();
  assert.deepEqual(out.measure.map(row => [row.observation_role, row.value_number]), [
    ["target", 17], ["baseline", null], ["actual", null], ["actual", 23], ["actual", 29],
  ]);
  for (const row of out.measure) {
    assert.equal(row.definition_version, "v0-proposal");
    for (const key of ["population_json", "period_start", "period_end", "calendar", "timezone", "method", "currency"] as const) assert.equal(row[key], null);
    assert.deepEqual(row.dimensions_json, {});
    assert.equal(row.scenario, "candidate");
    assert.equal(row.quality_state, "blocked");
    assert.match(row.observation_key, /^[a-f0-9]{64}$/);
    assert(row.attributes_json.observation_grain);
  }
  assert.equal(out.measure[3].observation_key, out.measure[4].observation_key);
  assert.notEqual(out.measure[0].observation_key, out.measure[1].observation_key);
  assert.notEqual(out.measure[3].id, out.measure[4].id);
  assert.equal(out.assertion.length, 2);
  const roleIds=new Set(out.object.filter(row=>row.object_type==='persona').map(row=>row.id));
  assert.ok(out.assertion.every(row=>roleIds.has((row.value_json as {entity_id:string}).entity_id)));
  assert.notDeepEqual(out.assertion[0].value_json, out.assertion[1].value_json);
});

test("canonical predicates preserve direction and mitigation reverses exactly once", () => {
  const out = adapt();
  const object = (semantic: string) => out.object.find(row => row.canonical_semantic_type === semantic)!.id;
  const mitigation = out.relationship.find(row => row.relationship_type === "MITIGATES")!;
  assert.equal(mitigation.from_object_id, object("control"));
  assert.equal(mitigation.to_object_id, object("risk"));
  const support = out.relationship.find(row => row.relationship_type === "SUPPORTS")!;
  assert.equal(support.from_object_id, object("application"));
  assert.equal(support.to_object_id, object("process"));
  const uses = out.relationship.find(row => row.relationship_type === "USES")!;
  assert.equal(uses.from_object_id, object("ai_use_case"));
  assert.equal(uses.to_object_id, object("ai_tool"));
  assert(!out.relationship.some(row => ["SUPPORTED_BY", "USED_BY"].includes(row.relationship_type)));
  assert(out.gaps.some(row => row.semantic_type === "design:part_of_unit"));
  assert(out.source_record.some(row => (row.attributes_json.retained_edge as Row | undefined)?.predicate === "design:part_of_unit"));
});

test("document revisions and evidence spans retain exact sources without promoting requests", () => {
  const out = adapt();
  assert.equal(out.document.length, 2);
  assert.equal(out.evidence_item.length, 2);
  assert.equal(out.document[0].logical_source_id, out.document[1].logical_source_id);
  assert.notEqual(out.document[0].document_source_version, out.document[1].document_source_version);
  assert.notEqual(out.evidence_item[0].evidence_locator.excerpt_sha256, out.evidence_item[1].evidence_locator.excerpt_sha256);
  assert.equal(out.evidence_item[0].document_id, out.document[0].id);
  assert(out.relationship.some(row => row.relationship_type === "EVIDENCE_REQUESTED_FOR"));
  assert(!out.relationship.some(row => row.relationship_type === "GROUNDED_IN"));
});

test("every candidate stays blocked/excluded; absent assertion access is unknown and denied", () => {
  const fixture = makeEcPrivateCandidateFixture();
  const before = JSON.stringify(fixture.input.assertions);
  const out = adapt(fixture);
  for (const row of [out, ...out.source_file, ...out.source_record, ...out.object, ...out.assertion,
    ...out.measure, ...out.relationship, ...out.document, ...out.evidence_item]) {
    assert.equal(row.agent_readiness_status, "blocked");
    assert.equal(row.downstream_context_policy, "exclude");
    assert.equal(row.approvals.load, "not_granted");
    assert.equal(row.approvals.serving, "not_granted");
  }
  for (const row of out.assertion) {
    assert.equal(row.source_access_scope, "unknown");
    assert.equal(row.access_decision, "deny");
    const dependency = row.attributes_json.access_dependency as Row;
    assert.equal(dependency.input_scope_state, "absent");
    assert.equal(dependency.source_version, row.source_version);
    assert.match(String(dependency.assertion_sha256), /^[a-f0-9]{64}$/);
    assert.deepEqual(dependency.source_locator, row.source_locator);
  }
  assert.equal(JSON.stringify(fixture.input.assertions), before);
});

test("rejects qualifier arrays through the adapter runtime schema", () => {
  const fixture = makeEcPrivateCandidateFixture();
  rows(fixture.input.edges)[0].qualifiers = [];
  assert.throws(() => adapt(fixture), /qualifiers/);
});

for (const [key, value] of [["access_scope", "public_demo"], ["access_decision", "allow"],
  ["source_access_scope", "all_users"], ["review_state", "confirmed"], ["agent_readiness_status", "agent_ready"],
  ["index_state", "fts_indexed"], ["downstream_context_policy", "include"], ["fact_basis", "owner_confirmed"]]) {
  test(`rejects candidate escalation through ${key}`, () => {
    const fixture = makeEcPrivateCandidateFixture();
    rows(fixture.input.assertions)[0][String(key)] = value;
    assert.throws(() => adapt(fixture));
  });
}

test("rejects byte tampering and wrong raw locators/excerpts", () => {
  const fixture = makeEcPrivateCandidateFixture();
  fixture.input.raw_files["raw/fixture/objects.csv"][0] ^= 1;
  assert.throws(() => adapt(fixture), /hash mismatch|header/);
  const wrongRow = makeEcPrivateCandidateFixture();
  (rows(wrongRow.input.entities)[0].source_locator as Row).row_key = "missing";
  assert.throws(() => adapt(wrongRow), /native row mismatch/);
  const wrongExcerpt = makeEcPrivateCandidateFixture();
  (byType(wrongExcerpt.input, "design:evidence_item").evidence_locator as Row).excerpt_sha256 = "a".repeat(64);
  assert.throws(() => adapt(wrongExcerpt), /excerpt mismatch/);
});

test("rejects duplicate IDs, raw native keys, forged entity IDs and mixed bindings", () => {
  const duplicate = makeEcPrivateCandidateFixture();
  duplicate.input.entities.push(structuredClone(duplicate.input.entities[0]));
  assert.throws(() => adapt(duplicate), /duplicate candidate id/);
  const native = makeEcPrivateCandidateFixture();
  changeCsv(native.input, "raw/fixture/objects.csv", rows => { rows[1].native_key = rows[0].native_key; });
  assert.throws(() => adapt(native), /duplicate\/empty raw native key/);
  const forged = makeEcPrivateCandidateFixture();
  rows(forged.input.entities)[0].id = `ent:${"a".repeat(64)}`;
  assert.throws(() => adapt(forged), /entity candidate id mismatch/);
  const mixed = makeEcPrivateCandidateFixture();
  rows(mixed.input.edges)[0].binding_key = "unregistered-fictional-binding";
  assert.throws(() => adapt(mixed), /mixed tenant/);
});

test("raw ci_class independently constrains candidate type", () => {
  const fixture = makeEcPrivateCandidateFixture();
  changeCsv(fixture.input, "raw/fixture/objects.csv", rows => { rows[0].ci_class = "design:deployment"; });
  assert.throws(() => adapt(fixture), /raw ci_class/);
});

test("declared native application CI-class aliases retain the logical application grain", () => {
  for (const ciClass of ["application", "logical_application"]) {
    const fixture = makeEcPrivateCandidateFixture();
    changeCsv(fixture.input, "raw/fixture/objects.csv", rows => { rows[0].ci_class = ciClass; });
    assert.equal(adapt(fixture).object.filter(row => row.object_type === "application").length, 3);
  }
});

test("rejects wrong qualifiers after reconstructing matching source bytes", () => {
  for (const [predicate, qualifiers] of [["design:hosted_on", { environment: "test" }],
    ["design:feeds", { flow_ref: "objects/request-a" }], ["design:belongs_to_segment", { shared_service: false }],
    ["design:module_of", { invented: true }]] as const) {
    const fixture = makeEcPrivateCandidateFixture();
    const edge = rows(fixture.input.edges).find(row => row.predicate === predicate)!;
    const locator = edge.source_locator as Row;
    edge.qualifiers = qualifiers;
    changeCsv(fixture.input, "raw/fixture/links.csv", rows => { rows[Number(locator.row_number) - 2].qualifiers = JSON.stringify(qualifiers); });
    assert.throws(() => adapt(fixture), /qualifier|environment/);
  }
});

test("rejects invalid intervals, unknown verbs, reversed endpoints and foreign references", () => {
  for (const edit of [
    (row: Row) => { row.valid_to = row.valid_from; },
    (row: Row) => { row.predicate = "design:invented"; },
    (row: Row) => { [row.from_id, row.to_id] = [row.to_id, row.from_id]; },
    (row: Row) => { row.to_id = `ent:${"b".repeat(64)}`; },
  ]) {
    const fixture = makeEcPrivateCandidateFixture();
    edit(rows(fixture.input.edges)[0]);
    assert.throws(() => adapt(fixture), /interval|unmapped|direction|cross-binding/);
  }
});

test("half-open hierarchy intervals may meet but overlapping parents reject", () => {
  for (const overlaps of [false, true]) {
    const fixture = makeEcPrivateCandidateFixture();
    const original = rows(fixture.input.edges)[0];
    original.valid_to = "2026-10-01";
    const newStart = overlaps ? "2026-09-15" : "2026-10-01";
    const next = structuredClone(original);
    next.id = `edge:${"c".repeat(64)}`;
    next.to_id = rows(fixture.input.entities).find(row => row.native_key === "app-b")!.id;
    next.valid_from = newStart;
    next.valid_to = null;
    const nativeKey = "next-parent";
    changeCsv(fixture.input, "raw/fixture/links.csv", records => {
      records[0].valid_to = "2026-10-01";
      records.push({ ...records[0], relationship_key: nativeKey, to_ref: "objects/app-b",
        valid_from: newStart, valid_to: "" });
    });
    next.source_locator = { ...(original.source_locator as Row), row_number: fixture.input.edges.length + 2,
      row_end: fixture.input.edges.length + 2, row_key: nativeKey };
    fixture.input.edges.push(next);
    if (overlaps) assert.throws(() => adapt(fixture), /overlapping hierarchy parent interval/);
    else assert.equal(adapt(fixture).relationship.filter(row => row.relationship_type === "MODULE_OF").length, 2);
  }
});

test("assertions cannot switch subject and requests cannot acquire received locators", () => {
  const assertion = makeEcPrivateCandidateFixture();
  rows(assertion.input.assertions)[0].subject_id = rows(assertion.input.entities).find(row => row.native_key === "app-b")!.id;
  assert.throws(() => adapt(assertion), /assertion reference mismatch/);
  const request = makeEcPrivateCandidateFixture();
  changeCsv(request.input, "raw/fixture/objects.csv", rows => {
    rows.find(row => row.native_key === "request-a")!.received_locator = "raw/fixture/note-a.txt";
  });
  assert.throws(() => adapt(request), /request cannot become received evidence/);
});

test("typed attribute entity references must resolve the exact raw native reference", () => {
  const fixture = makeEcPrivateCandidateFixture();
  const flow = byType(fixture.input, "design:data_flow");
  const target = byType(fixture.input, "design:application");
  const referenceAssertion = { ...structuredClone(rows(fixture.input.assertions)[0]),
    id: `assert:${"d".repeat(64)}`, subject_id: flow.id, predicate: "design:attribute/source_ref",
    source_locator: { ...(flow.source_locator as Row), column: "source_ref" },
    value: { entity_id: target.id } };
  fixture.input.assertions.push(referenceAssertion);
  const out=adapt(fixture);
  const canonicalTarget=out.object.find(row=>row.attributes_json.raw_candidate &&
    (row.attributes_json.raw_candidate as Row).id===target.id)!;
  assert.deepEqual(out.assertion.at(-1)!.value_json, { entity_id: canonicalTarget.id });
  referenceAssertion.value.entity_id = byType(fixture.input, "design:role").id;
  assert.throws(() => adapt(fixture), /assertion differs from declared raw cell/);
});

test("rejects measured-actual escalation, QA input, traversal and missing key declarations", () => {
  const actual = makeEcPrivateCandidateFixture();
  rows(actual.input.measurements)[0].scenario = "actual";
  assert.throws(() => adapt(actual), /scenario\/basis escalation/);
  const qa = makeEcPrivateCandidateFixture();
  Object.assign(qa.input, { evaluations: [] });
  assert.throws(() => adapt(qa), /Unrecognized key/);
  const traversal = makeEcPrivateCandidateFixture();
  traversal.input.raw_files["raw/../recipe.json"] = Buffer.from("{}");
  assert.throws(() => adapt(traversal), /relative path/);
  const keys = makeEcPrivateCandidateFixture();
  delete keys.input.csv_key_columns["raw/fixture/objects.csv"];
  assert.throws(() => adapt(keys), /key column/);
});
