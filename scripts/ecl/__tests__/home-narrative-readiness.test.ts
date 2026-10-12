import assert from "node:assert/strict";
import { test } from "node:test";
import { CANONICAL_TENANT_KEYS } from "../../../src/config/tenants/CANONICAL_TENANTS";
import { assertNarrativeInspectionScope, narrativeReadinessOnlyMode, narrativeReadinessIssues, signalSourceHash, verifiedReadiness, type NarrativeReadinessProof } from "../home-narrative-readiness";

const proof: NarrativeReadinessProof = {
  object_table: "ecl_projection.home_enterprise_landscape",
  object_id: "entry-1",
  client_key: "tenant-a",
  tenant_id: "tenant-a",
  source_layer: "signal",
  source_basis: "accepted source record",
  classification: "internal",
  retrievability: "fts_indexed",
  agent_readiness_status: "agent_ready",
  confidence_level: "high",
  cited_render_verified_at: "2026-01-01T00:00:00Z",
  policy_validation_status: "pass",
  policy_version: "1.0.0",
  policy_validated_at: "2026-01-01T00:00:00Z",
  source_hash: "source-v1",
  content_hash: "content-v1",
};

test("only independent, current readiness proof permits a narrative candidate", () => {
  const admits = (candidate: NarrativeReadinessProof | undefined, sourceHash = "source-v1", contentHash = "content-v1") =>
    verifiedReadiness(candidate, "tenant-a", sourceHash, contentHash);
  assert.equal(admits(proof), true);
  assert.equal(admits(undefined), false);
  assert.equal(admits({ ...proof, client_key: "tenant-b" }), false);
  assert.equal(admits({ ...proof, tenant_id: "tenant-b" }), false);
  assert.equal(admits(proof, "source-v2"), false);
  assert.equal(admits(proof, "source-v1", "content-v2"), false);
  assert.equal(admits({ ...proof, policy_validation_status: "pending" }), false);
  assert.equal(admits({ ...proof, policy_version: "0.9.0" }), false);
  assert.equal(admits({ ...proof, agent_readiness_status: "not_reviewed" }), false);
  assert.equal(admits({ ...proof, retrievability: "not_indexed" }), false);
  assert.equal(admits({ ...proof, cited_render_verified_at: null }), false);
  assert.equal(admits({ ...proof, classification: "restricted" }), false);
  assert.equal(admits({ ...proof, source_layer: "tenant_context" }), false);
  assert.equal(admits({ ...proof, policy_validated_at: null }), false);
  assert.equal(admits({ ...proof, source_basis: null }), false);
  assert.equal(admits({ ...proof, confidence_level: "low" }), false);
  assert.equal(admits({ ...proof, confidence_level: null }), false);
  assert.equal(admits({ ...proof, confidence_level: "medium" }), true);
  assert.equal(admits({ ...proof, retrievability: "search_indexed" }), true);
});

test("a signal's source hash covers every cited row, in any order, counted once", () => {
  // sha256 of the JSON array ["source-a","source-b"], computed outside this module.
  const known = "2fd42fa910872b1876599a17f959e94012d193e518d224a71daf8eb59cdb896f";
  assert.equal(signalSourceHash(["source-b", "source-a", "source-a"]), known);
  assert.equal(signalSourceHash(["source-a", "source-b"]), known);
  assert.notEqual(signalSourceHash(["source-a", "source-c"]), known);
  assert.notEqual(signalSourceHash(["source-a"]), known);
});

test("readiness diagnostics preserve every admission gate and identify missing evidence", () => {
  assert.deepEqual(narrativeReadinessIssues(proof, "tenant-a", "source-v1", "content-v1"), []);
  assert.deepEqual(narrativeReadinessIssues(undefined, "tenant-a", "source-v1", "content-v1"), ["missing_readiness_proof"]);
  assert.deepEqual(narrativeReadinessIssues({ ...proof, retrievability: "not_indexed", cited_render_verified_at: null }, "tenant-a", "source-v1", "content-v1"), ["not_indexed", "citation_render_unverified"]);
  assert.deepEqual(narrativeReadinessIssues(proof, "tenant-b", "source-v2", "content-v2"), ["tenant_mismatch", "source_hash_mismatch", "content_hash_mismatch"]);
});

test("readiness inspection is explicit and rejects plan writes before database access", () => {
  assert.equal(narrativeReadinessOnlyMode([], {}, false, null), false);
  assert.equal(narrativeReadinessOnlyMode([], { HOME_ECL_NARRATIVE_READINESS_ONLY: "false" }, false, null), false);
  assert.equal(narrativeReadinessOnlyMode(["--readiness-only"], {}, false, null), true);
  assert.equal(narrativeReadinessOnlyMode([], { HOME_ECL_NARRATIVE_READINESS_ONLY: "true" }, false, null), true);
  assert.throws(() => narrativeReadinessOnlyMode(["--readiness-only"], {}, true, null), /cannot apply/);
  assert.throws(() => narrativeReadinessOnlyMode([], { HOME_ECL_NARRATIVE_READINESS_ONLY: "true" }, false, "plan.json"), /cannot apply/);
  assert.throws(() => narrativeReadinessOnlyMode([], { HOME_ECL_NARRATIVE_READINESS_ONLY: "yes" }, false, null), /true or false/);
});

test("readiness inspection cannot silently use a default tenant or assessment", () => {
  assert.doesNotThrow(() => assertNarrativeInspectionScope(CANONICAL_TENANT_KEYS[0], "inspection-test"));
  assert.throws(() => assertNarrativeInspectionScope(undefined, "inspection-test"), /explicit canonical/);
  assert.throws(() => assertNarrativeInspectionScope("undeclared-tenant", "inspection-test"), /explicit canonical/);
  assert.throws(() => assertNarrativeInspectionScope(CANONICAL_TENANT_KEYS[0], undefined), /explicit canonical/);
  assert.throws(() => assertNarrativeInspectionScope(CANONICAL_TENANT_KEYS[0], "assessment' OR true"), /explicit canonical/);
});
