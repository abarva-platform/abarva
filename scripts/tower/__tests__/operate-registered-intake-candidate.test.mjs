import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  validateCandidate, validateReceipt, validatePhysicalPage, validateFactLineage,
  verifyProofBundleContents, physicalSubstrate, physicalMeasures,
} from "../operate-registered-intake-candidate.mjs";

const sha = (value) => crypto.createHash("sha256").update(value).digest("hex");
const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const pages = ["command_center", "decision_lanes", "recommended_actions", "value_proof", "cost_lens", "evidence", "risk_lens", "ai_portfolio", "adoption_lens"];

function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "tower-promote-test-"));
  const inputRoot = "datasets/tenant-inputs/registered/fixture";
  fs.mkdirSync(path.join(root, inputRoot), { recursive: true });
  const body = "tenant_key,amount\nfixture,1\n";
  fs.writeFileSync(path.join(root, inputRoot, "source.csv"), body);
  const source_manifest = { "source.csv": { sha256: sha(body), row_count: 1, source_path: `${inputRoot}/source.csv` } };
  const candidate = {
    contract_version: "tower-registered-intake-candidate/v1",
    tenant_key: "fixture",
    input_root: inputRoot,
    input_fingerprint_sha256: sha(JSON.stringify(source_manifest)),
    assessment_id: "tower-registry-candidate-1234567890123456",
    build_state: "dry_run_only",
    runtime_eligible: false,
    source_manifest,
    quality_gate_status: "pass",
    gates: [{ status: "pass" }],
    canonical: { budget: { approved_fy_budget_usd: null }, ai_claims: [{ claimable_value_usd: null }],
      modeled_annual_spend: { amount_usd: 1, status: "planning_estimate_one_source" } },
    view_counts: Object.fromEntries(pages.map((page) => [page, 1])),
    views: Object.fromEntries(pages.map((page) => [page, [{
      row_key: `${page}:one`, source_refs: [{ source_file: "source.csv", source_row: 2, source_sha256: source_manifest["source.csv"].sha256 }],
      approved_fy_budget_usd: null, claimable_value_usd: null, value: null, value_state: "unknown",
    }]])),
  };
  const registry = { canonicalRoot: "datasets/tenant-inputs/registered", activeTenants: [{ tenantKey: "fixture", canonicalInputRoot: inputRoot }] };
  const receipt = {
    contract_version: "tower-physical-stage-receipt/v1", tenant_key: "fixture",
    assessment_id: candidate.assessment_id, input_fingerprint_sha256: candidate.input_fingerprint_sha256,
    candidate_sha256: sha(JSON.stringify(candidate)),
    projection_version: 2, stage_status: "staged_pending_independent_readback",
    quality_gate_status: "pass", runtime_eligible: true,
    dataset_id: "tower-registered-intake-v1", object_count: 9, ingestion_method: "operator_aca_job",
    source_file_count: 1, source_record_count: 1,
    job_run_id: "run-1", build_version: "build-1", idempotency_key: "idempotency-1",
    view_counts: candidate.view_counts,
    view_fingerprints: Object.fromEntries(pages.map((page) => [page, sha(JSON.stringify([{ row_key: `${page}:one`, source_hash: sha(page) }]))])),
    proof_bundle_uri: "https://example.blob.core.windows.net/private/proof.zip",
    validation_output_uri: "https://example.blob.core.windows.net/private/validation.json",
    quality_gate_output_uri: "https://example.blob.core.windows.net/private/quality.json",
  };
  return { root, candidate, registry, receipt };
}

test("candidate remains review-only and source drift blocks the physical stage", (t) => {
  const { root, candidate, registry } = fixture();
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  assert.deepEqual(validateCandidate(candidate, registry, root), []);
  assert.ok(validateCandidate({ ...candidate, runtime_eligible: true, build_state: "physical_stage_ready" }, registry, root).includes("candidate_review_contract_changed"));
  fs.writeFileSync(path.join(root, candidate.input_root, "source.csv"), "different\n");
  assert.ok(validateCandidate(candidate, registry, root).includes("source_hash_mismatch:source.csv"));
});

test("stage receipt is bound to candidate identity and supplies all nine physical page counts and hashes", (t) => {
  const { root, candidate, receipt } = fixture();
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const bytes = Buffer.from(JSON.stringify(candidate));
  assert.deepEqual(validateReceipt(receipt, candidate, bytes), []);
  assert.ok(validateReceipt({ ...receipt, assessment_id: "other" }, candidate, bytes).includes("stage_receipt_identity_mismatch"));
  assert.ok(validateReceipt({ ...receipt, candidate_sha256: sha("other") }, candidate, bytes).includes("stage_receipt_candidate_mismatch"));
  assert.ok(validateReceipt({ ...receipt, runtime_eligible: false }, candidate, bytes).includes("stage_quality_or_runtime_gate_failed"));
  assert.ok(validateReceipt({ ...receipt, view_counts: { ...receipt.view_counts, evidence: 0 } }, candidate, bytes).includes("stage_view_counts_missing"));
  assert.ok(validateReceipt({ ...receipt, view_fingerprints: { ...receipt.view_fingerprints, evidence: "bad" } }, candidate, bytes).includes("stage_view_fingerprints_missing"));
  assert.ok(validateReceipt({ ...receipt, source_record_count: null }, candidate, bytes).includes("stage_source_counts_missing"));
});

test("private proof bundle must contain exact candidate, receipt, and passing validation", async (t) => {
  const { root, candidate, receipt } = fixture();
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const { default: JSZip } = await import("jszip");
  const bytes = Buffer.from(JSON.stringify(candidate));
  const receiptBytes = Buffer.from(JSON.stringify(receipt));
  const zip = new JSZip();
  zip.file("candidate.json", bytes);
  zip.file("stage-receipt.json", receiptBytes);
  zip.file("stage-validation.json", JSON.stringify({ status: "pass", materialized: true,
    source_file_count: 1, source_record_count: 1, canonical_object_count: 9,
    view_counts: receipt.view_counts, view_fingerprints: receipt.view_fingerprints }));
  zip.file("stage-quality-gate.json", JSON.stringify({ status: "pass", checks: {
    unapproved_evidence_records_loaded: 0, user_detail_records_loaded: 0,
    approved_fy_budget_known: false, claimable_value_known: false } }));
  const archive = await zip.generateAsync({ type: "nodebuffer" });
  assert.equal((await verifyProofBundleContents(archive, bytes, receiptBytes)).quality_status, "pass");
  await assert.rejects(verifyProofBundleContents(archive, Buffer.from("changed"), receiptBytes), /candidate_or_receipt_mismatch/);
});

test("physical rows require source hash, source reference, and unknown claims", (t) => {
  const { root, candidate } = fixture();
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const row = {
    row_key: "one", source_hash: sha("projection"),
    source_refs_json: [{ source_file: "source.csv", source_row: 2, source_sha256: candidate.source_manifest["source.csv"].sha256 }],
    display_payload_json: { approved_fy_budget_usd: null, claimable_ai_value_usd: null, value: null, value_state: "unknown" },
    claimable_value_usd: null, finance_validated_value_usd: null,
  };
  assert.deepEqual(validatePhysicalPage([row], "command_center", candidate, 1), []);
  assert.ok(validatePhysicalPage([{ ...row, display_payload_json: { approved_fy_budget_usd: 0 } }], "command_center", candidate, 1).includes("unapproved_money_claim:command_center"));
  assert.ok(validatePhysicalPage([{ ...row, source_refs_json: [] }], "command_center", candidate, 1).includes("page_source_refs_missing:command_center"));
  const evidence = {
    ...row, row_key: "evidence_approval_gap",
    source_refs_json: [{ source_file: "13_evidence_sources.csv", source_sha256: sha("register"), source_row: null, scope: "register_coverage_only" }],
    display_payload_json: { value: null, approval_gap_count: 1 },
  };
  const evidenceCandidate = { ...candidate, evidence_rows_not_approved: 1, source_manifest: { ...candidate.source_manifest, "13_evidence_sources.csv": { sha256: sha("register") } } };
  assert.deepEqual(validatePhysicalPage([evidence], "evidence", evidenceCandidate, 1), []);
  assert.ok(validatePhysicalPage([evidence], "evidence", { ...candidate, evidence_rows_not_approved: 1 }, 1).includes("page_source_ref_mismatch:evidence"));
});

test("lineage allows one-source planning spend but blocks a conflicting headline", (t) => {
  const { root, candidate } = fixture();
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const rows = [
    { tenant: "fixture", mode: "quote", metric: "it_budget_usd", status: "ABSENT", asserted: [] },
    { tenant: "fixture", mode: "quote", metric: "annual_it_spend_usd", status: "ONE_SOURCE", asserted: [{ value: 1 }] },
    { tenant: "fixture", mode: "quote", metric: "promised_value_usd", status: "CONFLICT", asserted: [{ value: 1 }, { value: 2 }] },
  ];
  assert.deepEqual(validateFactLineage(candidate, rows).gaps, []);
  assert.ok(validateFactLineage(candidate, rows.map((row) => row.metric === "annual_it_spend_usd" ? { ...row, status: "CONFLICT" } : row)).gaps.includes("modeled_spend_lineage_not_reconciled"));
  assert.ok(validateFactLineage({ ...candidate, views: { ...candidate.views, value_proof: [{ ...candidate.views.value_proof[0], value: 2 }] } }, rows).gaps.includes("conflicted_promise_surfaced_as_headline"));
});

test("independent readback rejects a staged source hash that differs from intake", async (t) => {
  const { root, candidate, receipt } = fixture();
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const db = { query: async (sql) => {
    if (sql.includes("ecl_context.object")) return { rows: [{ total: receipt.object_count }] };
    if (sql.includes("select file_name, file_hash")) return { rows: [{ file_name: "source.csv", file_hash: sha("different") }] };
    if (sql.includes("ecl_projection.projection_entry_source_record_ref")) return { rows: [{ total: 1, orphan_record_count: 0 }] };
    if (sql.includes("ecl_source.source_record")) return { rows: [{ total: 1, orphan_file_count: 0, evidence_detail_count: 0, user_detail_count: 0 }] };
    if (sql.includes("ecl_projection.projection_manifest")) return { rows: pages.map((page) => ({
      projection_key: `tower_${page}`, source_hash: candidate.input_fingerprint_sha256, row_count: 1,
    })).sort((a, b) => a.projection_key.localeCompare(b.projection_key)) };
    throw new Error("Unexpected query");
  } };
  const readback = await physicalSubstrate(db, candidate, receipt);
  assert.deepEqual(readback.gaps, ["physical_source_file_hash_mismatch"]);
});

test("promotion rejects a displayed cost amount without a linked canonical measure", async (t) => {
  const { root, candidate, receipt } = fixture();
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const db = { query: async (sql) => {
    if (sql.includes("like 'metric:%'")) return { rows: [] };
    if (sql.includes("tower_value_chain")) return { rows: [{ row_key: "cost", linked: false }] };
    return { rows: [{ row_key: "adoption", payload_matches: true, matching_measures: 1 }] };
  } };
  const readback = await physicalMeasures(db, candidate, receipt);
  assert.deepEqual(readback.gaps, ["cost_amount_missing_or_mismatched_layer3_measure"]);
});

test("displayed outcome text must match its canonical measure and projection bridge", async (t) => {
  const { root, candidate, receipt } = fixture();
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  candidate.canonical.outcome_metrics = [{ id: "MET-1" }];
  const db = { query: async (sql) => {
    if (sql.includes("like 'metric:%'")) return { rows: [{ row_key: "metric:MET-1",
      primary_object_id: "object-1", projection_entry_id: "entry-1", source_record_id: "source-1",
      display_payload_json: { baseline: "69.1%", target: null, observed: null,
        canonical_measure_refs: { baseline: "measure-1" } } }] };
    if (sql.includes("ecl_context.measure") && sql.includes("outcome_source_value")) return { rows: [{
      id: "measure-1", subject_object_id: "object-1", scenario: "baseline", value_text: "different",
      value_number: null, unit: "source_text", source_record_id: "source-1" }] };
    if (sql.includes("projection_entry_measure_ref")) return { rows: [{ projection_entry_id: "entry-1", measure_id: "measure-1" }] };
    if (sql.includes("tower_value_chain")) return { rows: [{ row_key: "cost", linked: true }] };
    return { rows: [{ row_key: "adoption", payload_matches: true, matching_measures: 1 }] };
  } };
  const readback = await physicalMeasures(db, candidate, receipt);
  assert.deepEqual(readback.gaps, ["outcome_text_missing_or_mismatched_layer3_measure"]);
});

test("declared tenants have no ranking fallback; undeclared tenants retain it", () => {
  const migration = fs.readFileSync(path.join(repo, "supabase/migrations/20261011210000_tower_active_lifecycle_fail_closed.sql"), "utf8");
  assert.match(migration, /where declaration\.tenant_key = ranked\.tenant_key/);
  assert.doesNotMatch(migration, /declaration\.state = 'active'/);
});
