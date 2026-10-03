import assert from "node:assert/strict";
import { test } from "node:test";
import { signalSourceHash, verifiedReadiness, type NarrativeReadinessProof } from "../home-narrative-readiness";

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
