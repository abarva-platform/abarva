import assert from "node:assert/strict";
import { test } from "node:test";
import { verifiedReadiness, type NarrativeReadinessProof } from "../home-narrative-readiness";

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
});
