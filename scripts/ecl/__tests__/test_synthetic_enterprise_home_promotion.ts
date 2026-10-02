import assert from "node:assert/strict";
import { rm } from "node:fs/promises";
import { buildHomeEnterpriseContext } from "../../../src/lib/home/preview/ecl-enterprise-context";
import { generatePack } from "../load_synthetic_enterprise_v1";
import { assertProjectionProof } from "../promote_synthetic_enterprise_home";
import { buildSyntheticHomeRows } from "../synthetic_enterprise_home_rows";
import { assertWorkflowTriggersCover } from "./synthetic_enterprise_gate_fixtures";

const proof = {
  status: "passed",
  assessment_id: "synthetic-v2",
  source_set_hash: "a".repeat(64),
  projection_hash: "b".repeat(64),
  readback_proof_uri: "https://example.invalid/readback.json",
  rows: 3643,
  source_linked_rows: 3643,
  row_types: {
    enterprise_profile: 1,
    business_segment: 3,
    business_function: 14,
    priority: 5,
    program: 24,
    application: 344,
    contract: 230,
  },
  client_attestation_state: "not_client_attested",
  serving_state: "shadow_not_promoted",
};
const expected = {
  assessmentId: "synthetic-v2",
  sourceSetHash: "a".repeat(64),
};

assert.doesNotThrow(() => assertProjectionProof(proof, expected));
// One case per condition of the contract. Each changes the proof in a way that
// only its own condition refuses, so a condition that is removed lets its case
// through.
const refusedProofs: Record<string, Partial<typeof proof>> = {
  status: { status: "failed" },
  assessment_id: { assessment_id: "synthetic-v1" },
  source_set_hash: { source_set_hash: "c".repeat(64) },
  client_attestation_state: { client_attestation_state: "client_attested" },
  serving_state: { serving_state: "home_active" },
  projection_hash: { projection_hash: "B".repeat(64) },
  // Fewer rows, every one of them still source-linked.
  rows: { rows: 3642, source_linked_rows: 3642 },
  source_linked_rows: { source_linked_rows: 3642 },
  enterprise_profile: {
    row_types: { ...proof.row_types, enterprise_profile: 2 },
  },
  business_segment: { row_types: { ...proof.row_types, business_segment: 2 } },
  business_function: {
    row_types: { ...proof.row_types, business_function: 13 },
  },
  priority: { row_types: { ...proof.row_types, priority: 4 } },
  program: { row_types: { ...proof.row_types, program: 25 } },
  application: { row_types: { ...proof.row_types, application: 24 } },
  contract: { row_types: { ...proof.row_types, contract: 229 } },
};
assert.equal(Object.keys(refusedProofs).length, 15);
for (const [condition, changed] of Object.entries(refusedProofs)) {
  assert.throws(
    () => assertProjectionProof({ ...proof, ...changed }, expected),
    /^Error: Projection proof does not meet the Home admission contract$/,
    condition,
  );
}
// The expected assessment and source set are the caller's, not the proof's.
assert.throws(() =>
  assertProjectionProof(proof, { ...expected, assessmentId: "synthetic-v1" }),
);
assert.throws(() =>
  assertProjectionProof(proof, { ...expected, sourceSetHash: "c".repeat(64) }),
);
// A hash of the projected rows is an additional field: a proof with one, and
// a proof written before the field existed, both meet the contract.
assert.doesNotThrow(() =>
  assertProjectionProof(
    { ...proof, projected_rows_hash: "d".repeat(64) },
    expected,
  ),
);
async function main(): Promise<void> {
  const pack = await generatePack("v2");
  try {
    const rows = buildSyntheticHomeRows(
      pack.normalized.objects.map((object) => ({
        id: object.id,
        object_key: object.id,
        object_type: object.type,
        display_name: object.name,
        source_record_id: `${object.source.source_family}/${object.source.source_row_id}`,
        value_state: "known",
        attributes_json: {
          ...object.attributes,
          source_as_of: object.source_as_of,
        },
      })),
    );
    const sourceByRow = new Map(
      rows.map((row) => [row.row_key, row.source_record_id]),
    );
    const context = buildHomeEnterpriseContext(rows, (row) => {
      const source = sourceByRow.get(row.row_key);
      return source ? [source] : [];
    });
    assert.equal(rows.length, 3643);
    assert.ok(context);
    assert.equal(context.segmentSpine.segments.length, 3);
    assert.equal(context.functions.length, 14);
    assert.equal(context.priorities.length, 5);
    assert.equal(context.unlinkedPrograms.length, 1);
    assert.equal(context.excludedUncitedRows, 0);
    assertWorkflowTriggersCover([]);
    console.log("Home projection proof and generated enterprise spine passed");
  } finally {
    await rm(pack.dir, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
