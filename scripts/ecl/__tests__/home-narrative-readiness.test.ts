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
};

test("only independent, current readiness proof permits a narrative candidate", () => {
  assert.equal(verifiedReadiness(proof, "tenant-a", "source-v1"), true);
  assert.equal(verifiedReadiness(undefined, "tenant-a", "source-v1"), false);
  assert.equal(verifiedReadiness({ ...proof, client_key: "tenant-b" }, "tenant-a", "source-v1"), false);
  assert.equal(verifiedReadiness({ ...proof, tenant_id: "tenant-b" }, "tenant-a", "source-v1"), false);
  assert.equal(verifiedReadiness(proof, "tenant-a", "source-v2"), false);
  assert.equal(verifiedReadiness({ ...proof, policy_validation_status: "pending" }, "tenant-a", "source-v1"), false);
  assert.equal(verifiedReadiness({ ...proof, policy_version: "0.9.0" }, "tenant-a", "source-v1"), false);
  assert.equal(verifiedReadiness({ ...proof, agent_readiness_status: "not_reviewed" }, "tenant-a", "source-v1"), false);
  assert.equal(verifiedReadiness({ ...proof, retrievability: "not_indexed" }, "tenant-a", "source-v1"), false);
  assert.equal(verifiedReadiness({ ...proof, cited_render_verified_at: null }, "tenant-a", "source-v1"), false);
  assert.equal(verifiedReadiness({ ...proof, classification: "restricted" }, "tenant-a", "source-v1"), false);
});
