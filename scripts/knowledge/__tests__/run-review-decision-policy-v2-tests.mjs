#!/usr/bin/env node
/**
 * Tests for the v2 review-decision policy. Proves the classifier separates
 * deterministic source-derived candidates from judgment-dependent ones (v1
 * collapsed 100% to individual review by matching field names in the raw row).
 */
import assert from "node:assert/strict";
import {
  REVIEW_POLICY_VERSION,
  classifyCandidateForReview,
  buildReviewBatches,
  buildEvidenceInheritanceIndex,
  createReviewSummary,
} from "../processing/review-decision-policy.mjs";

let passed = 0;
const test = (name, fn) => { fn(); passed += 1; console.log(`  ok  ${name}`); };
const cls = (row, opts) => classifyCandidateForReview(row, opts).candidateClass;

test("version bumped to v2", () => assert.equal(REVIEW_POLICY_VERSION, "knowledge-review-decision-policy-v2"));

test("structural relationship with unknown current/target is NOT kpi/individual", () => {
  const rel = { candidate_type: "relationship_candidate", candidate_ref: "rel:1", relationship_type_ref: "contains",
    current_target_state: "unknown", source_version_ref: "src:v1", evidence_refs: ["ev:1"] };
  const r = classifyCandidateForReview(rel);
  assert.notEqual(r.candidateClass, "individual_review_required");
  assert.ok(!r.reasons.includes("kpi_or_metric_definition"));
  assert.equal(r.candidateClass, "batch_review_required");
});

test("high-impact relationship (depends_on) → individual", () => {
  assert.equal(cls({ candidate_type: "relationship_candidate", candidate_ref: "rel:2", relationship_type_ref: "depends_on",
    current_target_state: "unknown", source_version_ref: "src:v1", evidence_refs: ["ev:1"] }), "individual_review_required");
});

test("target-scoped relationship → individual (target_state_assertion)", () => {
  const r = classifyCandidateForReview({ candidate_type: "relationship_candidate", candidate_ref: "rel:3", relationship_type_ref: "contains",
    current_target_state: "target", source_version_ref: "src:v1", evidence_refs: ["ev:1"] });
  assert.equal(r.candidateClass, "individual_review_required");
  assert.ok(r.reasons.includes("target_state_assertion"));
});

test("deterministic fact, evidence-backed, high confidence → auto_accept_eligible", () => {
  assert.equal(cls({ candidate_type: "fact_candidate", candidate_ref: "fact:1", fact_type: "hosting_model",
    fact_value: { value: "on_prem" }, source_version_ref: "src:v1", evidence_refs: ["ev:1"], confidence: 0.95 }), "auto_accept_eligible");
});

test("deterministic fact, evidence-backed, unscored confidence → batch (not auto, not individual)", () => {
  assert.equal(cls({ candidate_type: "fact_candidate", candidate_ref: "fact:2", fact_type: "owner",
    fact_value: { value: "IT" }, source_version_ref: "src:v1", evidence_refs: ["ev:1"] }), "batch_review_required");
});

test("KPI-definition fact → individual", () => {
  const r = classifyCandidateForReview({ candidate_type: "fact_candidate", candidate_ref: "fact:3", fact_type: "kpi_definition",
    fact_value: { value: "uptime" }, source_version_ref: "src:v1", evidence_refs: ["ev:1"], confidence: 0.99 });
  assert.equal(r.candidateClass, "individual_review_required");
  assert.ok(r.reasons.includes("kpi_or_metric_definition"));
});

test("commercial fact → individual", () => {
  assert.equal(cls({ candidate_type: "fact_candidate", candidate_ref: "fact:4", fact_type: "contract_value",
    fact_value: { value: 100 }, source_version_ref: "src:v1", evidence_refs: ["ev:1"], confidence: 0.99 }), "individual_review_required");
});

test("low-confidence deterministic candidate → individual", () => {
  assert.equal(cls({ candidate_type: "fact_candidate", candidate_ref: "fact:5", fact_type: "criticality",
    fact_value: { value: "tier_1" }, source_version_ref: "src:v1", evidence_refs: ["ev:1"], confidence: 0.5 }), "individual_review_required");
});

test("entity with no evidence but a source-backed fact → batch (evidence inheritance)", () => {
  const entity = { candidate_type: "entity_candidate", candidate_ref: "ent:1", entity_type: "application",
    display_name: "EHR", source_version_ref: "src:v1", evidence_refs: [] };
  const fact = { candidate_type: "fact_candidate", candidate_ref: "fact:6", subject_candidate_ref: "ent:1",
    fact_type: "owner", fact_value: { value: "IT" }, source_version_ref: "src:v1", evidence_refs: ["ev:9"] };
  const idx = buildEvidenceInheritanceIndex([entity, fact]);
  const r = classifyCandidateForReview(entity, { evidenceIndex: idx });
  assert.equal(r.candidateClass, "batch_review_required");
  assert.ok(r.reasons.includes("evidence_inherited_from_source_fact"));
});

test("entity with no evidence and no backing fact → individual (never auto)", () => {
  const r = classifyCandidateForReview({ candidate_type: "entity_candidate", candidate_ref: "ent:2",
    entity_type: "application", display_name: "X", source_version_ref: "src:v1", evidence_refs: [] });
  assert.equal(r.candidateClass, "individual_review_required");
  assert.ok(r.reasons.includes("no_evidence_lineage"));
});

test("probabilistic-identity entity → individual", () => {
  const r = classifyCandidateForReview({ candidate_type: "entity_candidate", candidate_ref: "ent:3", entity_type: "application",
    display_name: "Fuzzy", payload: { resolution: "probabilistic" }, source_version_ref: "src:v1", evidence_refs: ["ev:1"], confidence: 0.99 });
  assert.equal(r.candidateClass, "individual_review_required");
  assert.ok(r.reasons.includes("probabilistic_identity_resolution"));
});

test("batches carry dimensions + representative samples; summary has reason distribution", () => {
  const candidates = [
    { candidate_type: "relationship_candidate", candidate_ref: "rel:a", relationship_type_ref: "contains", current_target_state: "unknown", source_version_ref: "src:v1", evidence_refs: ["ev:1"], domain: "technology" },
    { candidate_type: "relationship_candidate", candidate_ref: "rel:b", relationship_type_ref: "depends_on", current_target_state: "unknown", source_version_ref: "src:v1", evidence_refs: ["ev:1"], domain: "technology" },
    { candidate_type: "fact_candidate", candidate_ref: "fact:a", fact_type: "hosting_model", fact_value: { value: "saas" }, source_version_ref: "src:v1", evidence_refs: ["ev:1"], confidence: 0.95, domain: "technology" },
  ];
  const batches = buildReviewBatches({ tenantKey: "airline-demo-new", candidates, validationRunRef: "vr:1", sourceVersionRef: "src:v1" });
  assert.ok(batches.length >= 2);
  for (const b of batches) {
    assert.ok(b.dimensions && b.dimensions.domain);
    assert.ok(Array.isArray(b.representativeSamples) && b.representativeSamples.length >= 1);
    assert.ok(b.batchContentHash && b.reviewBatchRef.includes("policy-v2"));
  }
  const summary = createReviewSummary(batches);
  assert.equal(summary.totalCandidates, 3);
  assert.ok(summary.byClass.batch_review_required >= 1);
  assert.ok(summary.byClass.individual_review_required >= 1); // depends_on
  assert.ok(summary.byClass.auto_accept_eligible >= 1); // the high-confidence fact
  assert.ok(Object.keys(summary.byReason).length >= 1);
});

console.log(`\nreview-decision-policy v2: ${passed} tests passed\n`);
