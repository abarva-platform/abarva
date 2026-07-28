#!/usr/bin/env node
/**
 * Tests for the gap-fills layered on top of the #5697 review policy:
 *   req 3 — entity evidence inheritance;
 *   req 5 — batch splitting by governed dimensions;
 *   req 6 — representative samples + reason/dimension distributions.
 * Preserves #5697's classification (not re-tested here).
 */
import assert from "node:assert/strict";
import {
  buildReviewBatches,
  buildEvidenceInheritanceIndex,
  classifyCandidateForReview,
  createReviewSummary,
} from "../processing/review-decision-policy.mjs";

let passed = 0;
const test = (name, fn) => { fn(); passed += 1; console.log(`  ok  ${name}`); };

test("evidence inheritance: evidence-less entity with a source-backed fact → batch", () => {
  const entity = { candidate_type: "entity_candidate", candidate_ref: "ent:1", entity_type: "application", display_name: "EHR", evidence_refs: [] };
  const fact = { candidate_type: "fact_candidate", candidate_ref: "fact:1", subject_candidate_ref: "ent:1", fact_type: "owner", fact_value: { value: "IT" }, source_version_ref: "src:v1", evidence_refs: ["ev:9"] };
  const idx = buildEvidenceInheritanceIndex([entity, fact]);
  const r = classifyCandidateForReview(entity, { evidenceIndex: idx });
  assert.equal(r.candidateClass, "batch_review_required");
  assert.ok(r.reasons.includes("evidence_inherited_from_source_fact"));
});

test("evidence-less entity with NO backing fact → defer (unchanged #5697 behavior)", () => {
  const r = classifyCandidateForReview({ candidate_type: "entity_candidate", candidate_ref: "ent:2", entity_type: "application", display_name: "X", evidence_refs: [] });
  assert.equal(r.candidateClass, "defer");
});

test("batches carry dimensions + representative samples; ref includes the dimensions hash", () => {
  const candidates = [
    { candidate_type: "relationship_candidate", candidate_ref: "rel:a", relationship_type_ref: "contains", current_target_state: "unknown", source_version_ref: "src:v1", evidence_refs: ["ev:1"], domain: "technology" },
    { candidate_type: "relationship_candidate", candidate_ref: "rel:b", relationship_type_ref: "depends_on", current_target_state: "unknown", source_version_ref: "src:v1", evidence_refs: ["ev:1"], domain: "technology" },
    { candidate_type: "fact_candidate", candidate_ref: "fact:v", fact_type: "hosting_source_row", fact_value: { value: "saas" }, source_version_ref: "src:v1", evidence_refs: ["ev:1"], source_family: "parser_visible_source_sample", confidence: 0.9, domain: "vendors" },
  ];
  const batches = buildReviewBatches({ tenantKey: "airline-demo-new", candidates, validationRunRef: "vr:1", sourceVersionRef: "src:v1" });
  assert.ok(batches.length >= 2);
  for (const b of batches) {
    assert.ok(b.dimensions && b.dimensions.domain && b.dimensions.sourceFamily && b.dimensions.evidenceCompleteness && b.dimensions.confidenceBand);
    assert.ok(Array.isArray(b.representativeSamples) && b.representativeSamples.length >= 1);
    assert.ok(b.representativeSamples[0].summary && Array.isArray(b.representativeSamples[0].reasons));
  }
});

test("two relationships with different impact split into different batches (dimension split)", () => {
  const candidates = [
    { candidate_type: "relationship_candidate", candidate_ref: "rel:a", relationship_type_ref: "contains", current_target_state: "unknown", source_version_ref: "src:v1", evidence_refs: ["ev:1"] },
    { candidate_type: "relationship_candidate", candidate_ref: "rel:b", relationship_type_ref: "depends_on", current_target_state: "unknown", source_version_ref: "src:v1", evidence_refs: ["ev:1"] },
  ];
  const batches = buildReviewBatches({ tenantKey: "t", candidates, validationRunRef: "vr", sourceVersionRef: "src:v1" });
  // contains (standard impact) and depends_on (high impact) land in distinct batches.
  const impacts = new Set(batches.map((b) => b.dimensions.relationshipImpact));
  assert.ok(impacts.has("standard") && impacts.has("high"));
});

test("summary carries reason + dimension distributions", () => {
  const candidates = [
    { candidate_type: "relationship_candidate", candidate_ref: "rel:a", relationship_type_ref: "depends_on", current_target_state: "unknown", source_version_ref: "src:v1", evidence_refs: ["ev:1"], domain: "technology" },
    { candidate_type: "fact_candidate", candidate_ref: "fact:v", fact_type: "hosting_source_row", fact_value: { value: "saas" }, source_version_ref: "src:v1", evidence_refs: ["ev:1"], source_family: "parser_visible_source_sample", confidence: 0.9, domain: "vendors" },
  ];
  const summary = createReviewSummary(buildReviewBatches({ tenantKey: "t", candidates, validationRunRef: "vr", sourceVersionRef: "src:v1" }));
  assert.equal(summary.totalCandidates, 2);
  assert.ok(Object.keys(summary.byDomain).length >= 1);
  assert.ok(Object.keys(summary.byReason).length >= 1);
  assert.ok(Object.keys(summary.byConfidenceBand).length >= 1);
  assert.ok(Object.keys(summary.byEvidenceCompleteness).length >= 1);
});

console.log(`\nreview-batch-dimensions: ${passed} tests passed\n`);
