import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  validateCandidate, validateReceipt, validatePhysicalPage, physicalSubstrate,
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
    canonical: { budget: { approved_fy_budget_usd: null }, ai_claims: [{ claimable_value_usd: null }] },
    view_counts: Object.fromEntries(pages.map((page) => [page, 1])),
    views: Object.fromEntries(pages.map((page) => [page, [{
      row_key: `${page}:one`, source_refs: [{ source_file: "source.csv", source_row: 2, source_sha256: source_manifest["source.csv"].sha256 }],
      approved_fy_budget_usd: null, claimable_value_usd: null,
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
    job_run_id: "run-1", build_version: "build-1", idempotency_key: "idempotency-1",
    view_counts: candidate.view_counts,
    view_fingerprints: Object.fromEntries(pages.map((page) => [page, sha(JSON.stringify([{ row_key: `${page}:one`, source_hash: sha(page) }]))])),
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
});

test("physical rows require source hash, source reference, and unknown claims", (t) => {
  const { root, candidate } = fixture();
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const row = {
    row_key: "one", source_hash: sha("projection"),
    source_refs_json: [{ source_file: "source.csv", source_row: 2, source_sha256: candidate.source_manifest["source.csv"].sha256 }],
    display_payload_json: { approved_fy_budget_usd: null, claimable_ai_value_usd: null },
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

test("independent readback rejects a staged source hash that differs from intake", async (t) => {
  const { root, candidate, receipt } = fixture();
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const db = { query: async (sql) => {
    if (sql.includes("ecl_context.object")) return { rows: [{ total: receipt.object_count }] };
    if (sql.includes("ecl_source.source_file")) return { rows: [{ file_name: "source.csv", file_hash: sha("different") }] };
    if (sql.includes("ecl_projection.projection_manifest")) return { rows: pages.map((page) => ({
      projection_key: `tower_${page}`, source_hash: candidate.input_fingerprint_sha256, row_count: 1,
    })).sort((a, b) => a.projection_key.localeCompare(b.projection_key)) };
    throw new Error("Unexpected query");
  } };
  const readback = await physicalSubstrate(db, candidate, receipt);
  assert.deepEqual(readback.gaps, ["physical_source_file_hash_mismatch"]);
});

test("declared tenants have no ranking fallback; undeclared tenants retain it", () => {
  const migration = fs.readFileSync(path.join(repo, "supabase/migrations/20261011210000_tower_active_lifecycle_fail_closed.sql"), "utf8");
  assert.match(migration, /where declaration\.tenant_key = ranked\.tenant_key/);
  assert.doesNotMatch(migration, /declaration\.state = 'active'/);
});
