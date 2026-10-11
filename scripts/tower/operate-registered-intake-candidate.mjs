#!/usr/bin/env node

// An operator boundary for a staged Tower projection. It never builds canonical records.
// The candidate and physical stage must be produced and reviewed independently.

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const REGISTRY = path.join(ROOT, "datasets/tenant-inputs/tenant-input-registry.json");
const PAGES = Object.freeze({
  command_center: ["tower_command_center", "page_key"],
  decision_lanes: ["tower_command_center", "page_key"],
  recommended_actions: ["tower_command_center", "page_key"],
  value_proof: ["tower_value_chain", "page_key"],
  cost_lens: ["tower_value_chain", "page_key"],
  evidence: ["tower_evidence_queue", "page_key"],
  risk_lens: ["tower_evidence_queue", "page_key"],
  ai_portfolio: ["tower_ai_portfolio", "display_payload_json"],
  adoption_lens: ["tower_ai_portfolio", "display_payload_json"],
});
const SHA256 = /^[a-f0-9]{64}$/;
const SENSITIVE_MONEY_KEYS = new Set([
  "approved_fy_budget_usd", "total_it_budget_usd", "board_claimable_ytd_usd",
  "claimable_ai_value_usd", "claimable_value_usd", "finance_validated_value_usd",
]);

const digest = (bytes) => crypto.createHash("sha256").update(bytes).digest("hex");
const readJson = (file) => JSON.parse(fs.readFileSync(file, "utf8"));
const string = (value) => typeof value === "string" && value.trim().length > 0;

function args(argv) {
  const mode = argv[0];
  const value = (flag) => {
    const index = argv.indexOf(flag);
    return index < 0 ? null : argv[index + 1] ?? null;
  };
  if (!["preflight", "promote", "rollback"].includes(mode)) {
    throw new Error("Use preflight, promote, or rollback");
  }
  return {
    mode,
    candidatePath: value("--candidate"),
    receiptPath: value("--stage-receipt"),
    proofPath: value("--preflight-proof"),
    promotionPath: value("--promotion-proof"),
    outPath: value("--out"),
    expectedProofSha: value("--expected-proof-sha256"),
    approvalRef: value("--approval-ref"),
    expectedInputSha: value("--expected-input-sha256"),
  };
}

export function validateCandidate(candidate, registry, root = ROOT) {
  const gaps = [];
  const tenant = registry.activeTenants?.find((row) => row.tenantKey === candidate.tenant_key);
  if (!tenant) return ["tenant_not_active_in_registry"];
  if (candidate.contract_version !== "tower-registered-intake-candidate/v1") gaps.push("candidate_contract_unknown");
  if (candidate.input_root !== tenant.canonicalInputRoot) gaps.push("input_root_registry_mismatch");
  if (!SHA256.test(candidate.input_fingerprint_sha256 ?? "")) gaps.push("input_fingerprint_invalid");
  if (!string(candidate.assessment_id) || !candidate.assessment_id.startsWith("tower-registry-candidate-")) gaps.push("assessment_id_invalid");
  if (candidate.quality_gate_status !== "pass" || !Array.isArray(candidate.gates) || candidate.gates.some((gate) => gate.status !== "pass")) gaps.push("candidate_quality_gate_failed");
  if (candidate.runtime_eligible !== false || candidate.build_state !== "dry_run_only") gaps.push("candidate_review_contract_changed");
  if (!candidate.canonical?.budget || candidate.canonical.budget.approved_fy_budget_usd !== null) gaps.push("approved_budget_must_remain_unknown");
  if (!Array.isArray(candidate.canonical?.ai_claims) || candidate.canonical.ai_claims.some((row) => row.claimable_value_usd !== null)) gaps.push("claimable_ai_value_must_remain_unknown");
  if (!candidate.view_counts || Object.keys(PAGES).some((page) => !Number.isInteger(candidate.view_counts[page]) || candidate.view_counts[page] < 1)) gaps.push("nine_view_counts_missing");
  const manifest = candidate.source_manifest;
  if (!manifest || Object.keys(manifest).length === 0) gaps.push("source_manifest_missing");
  else {
    const canonicalRoot = path.resolve(root, registry.canonicalRoot);
    const inputRoot = path.resolve(root, tenant.canonicalInputRoot);
    if (!inputRoot.startsWith(`${canonicalRoot}${path.sep}`)) gaps.push("source_root_outside_registry");
    for (const [name, entry] of Object.entries(manifest)) {
      if (path.isAbsolute(name) || name.split(/[\\/]/).includes("..") || name !== path.posix.normalize(name) || entry.source_path !== path.join(tenant.canonicalInputRoot, name) || !SHA256.test(entry.sha256 ?? "") || !Number.isInteger(entry.row_count) || entry.row_count < 1) {
        gaps.push(`source_manifest_invalid:${name}`);
        continue;
      }
      const full = path.resolve(inputRoot, name);
      if (!full.startsWith(`${inputRoot}${path.sep}`) || !fs.existsSync(full) || digest(fs.readFileSync(full)) !== entry.sha256) gaps.push(`source_hash_mismatch:${name}`);
    }
    if (digest(JSON.stringify(manifest)) !== candidate.input_fingerprint_sha256) gaps.push("input_fingerprint_mismatch");
  }
  if (!candidate.views || Object.entries(PAGES).some(([page]) => !Array.isArray(candidate.views[page]) || candidate.views[page].length !== candidate.view_counts?.[page])) gaps.push("candidate_view_rows_missing");
  else for (const [page, rows] of Object.entries(candidate.views)) {
    for (const row of rows) {
      if (!string(row.row_key) || !Array.isArray(row.source_refs) || row.source_refs.length === 0) gaps.push(`candidate_source_refs_missing:${page}`);
      for (const ref of row.source_refs ?? []) {
        if (ref.source_sha256 !== manifest?.[ref.source_file]?.sha256 || !Number.isInteger(Number(ref.source_row))) gaps.push(`candidate_source_ref_mismatch:${page}`);
      }
      if (scanMoney(row).length) gaps.push(`candidate_unapproved_money_claim:${page}`);
    }
  }
  return gaps;
}

export function validateReceipt(receipt, candidate, candidateBytes) {
  const gaps = [];
  if (receipt?.contract_version !== "tower-physical-stage-receipt/v1") gaps.push("stage_receipt_contract_unknown");
  if (receipt?.tenant_key !== candidate.tenant_key || receipt?.assessment_id !== candidate.assessment_id) gaps.push("stage_receipt_identity_mismatch");
  if (receipt?.input_fingerprint_sha256 !== candidate.input_fingerprint_sha256) gaps.push("stage_receipt_input_mismatch");
  if (!candidateBytes || receipt?.candidate_sha256 !== digest(candidateBytes)) gaps.push("stage_receipt_candidate_mismatch");
  if (!Number.isInteger(receipt?.projection_version) || receipt.projection_version < 1) gaps.push("stage_projection_version_invalid");
  if (receipt?.stage_status !== "staged_pending_independent_readback") gaps.push("stage_receipt_not_staged");
  if (receipt?.quality_gate_status !== "pass" || receipt?.runtime_eligible !== true) gaps.push("stage_quality_or_runtime_gate_failed");
  if (!string(receipt?.job_run_id) || !string(receipt?.build_version) || !string(receipt?.idempotency_key)) gaps.push("stage_job_identity_missing");
  if (!string(receipt?.dataset_id) || !Number.isInteger(receipt?.object_count) || receipt.object_count < 1 || receipt?.ingestion_method !== "operator_aca_job") gaps.push("stage_governance_binding_missing");
  if (!receipt?.view_counts || Object.keys(PAGES).some((page) => !Number.isInteger(receipt.view_counts[page]) || receipt.view_counts[page] < 1)) gaps.push("stage_view_counts_missing");
  if (!receipt?.view_fingerprints || Object.keys(PAGES).some((page) => !SHA256.test(receipt.view_fingerprints[page] ?? ""))) gaps.push("stage_view_fingerprints_missing");
  return gaps;
}

function scanMoney(value, pathParts = []) {
  if (!value || typeof value !== "object") return [];
  return Object.entries(value).flatMap(([key, child]) => {
    const next = [...pathParts, key];
    if (SENSITIVE_MONEY_KEYS.has(key) && child !== null) return [next.join(".")];
    return scanMoney(child, next);
  });
}

export function validatePhysicalPage(rows, page, candidate, expectedCount) {
  const gaps = [];
  if (rows.length !== expectedCount) gaps.push(`page_count_mismatch:${page}`);
  const seen = new Set();
  for (const row of rows) {
    if (!string(row.row_key) || seen.has(row.row_key)) gaps.push(`page_row_key_invalid:${page}`);
    seen.add(row.row_key);
    if (!SHA256.test(row.source_hash ?? "")) gaps.push(`page_source_hash_invalid:${page}`);
    const refs = row.source_refs_json;
    if (!Array.isArray(refs) || refs.length === 0) {
      gaps.push(`page_source_refs_missing:${page}`);
      continue;
    }
    for (const ref of refs) {
      const expected = candidate.source_manifest?.[ref.source_file]?.sha256;
      const coverageOnly = page === "evidence" && row.row_key === "evidence_approval_gap"
        && ref.scope === "register_coverage_only" && ref.source_row === null
        && ref.source_file === "13_evidence_sources.csv";
      if (!expected || ref.source_sha256 !== expected || (!coverageOnly && !Number.isInteger(ref.source_row))) gaps.push(`page_source_ref_mismatch:${page}`);
    }
    if (page === "evidence" && row.row_key === "evidence_approval_gap"
      && (rows.length !== 1 || row.display_payload_json?.value !== null
        || row.display_payload_json?.approval_gap_count !== candidate.evidence_rows_not_approved)) {
      gaps.push("unapproved_evidence_detail_or_gap_mismatch");
    }
    if (scanMoney(row.display_payload_json).length || row.claimable_value_usd != null || row.finance_validated_value_usd != null) gaps.push(`unapproved_money_claim:${page}`);
  }
  return [...new Set(gaps)];
}

async function lifecycle(client, tenant) {
  const table = await client.query("select to_regclass('ecl_projection.tower_assessment_lifecycle') is not null as present");
  if (table.rows[0]?.present !== true) return { declared: [], resolved: [], gap: "lifecycle_table_absent" };
  const declared = (await client.query(
    "select assessment_id, projection_version, state from ecl_projection.tower_assessment_lifecycle where tenant_key=$1 order by state, assessment_id",
    [tenant],
  )).rows;
  const resolved = (await client.query(
    "select assessment_id, projection_version from serving.tower_active_assessment_keys() where tenant_key=$1",
    [tenant],
  )).rows;
  return { declared, resolved };
}

async function physicalPages(client, candidate, receipt) {
  const counts = {};
  const fingerprints = {};
  const gaps = [];
  for (const [page, [table, column]] of Object.entries(PAGES)) {
    const predicate = column === "page_key"
      ? "page_key = $4"
      : "display_payload_json ->> 'page_key' = $4";
    const result = await client.query(
      `select row_key, source_hash, source_refs_json, display_payload_json, to_jsonb(p)->>'claimable_value_usd' as claimable_value_usd, to_jsonb(p)->>'finance_validated_value_usd' as finance_validated_value_usd from ecl_projection.${table} p where tenant_key=$1 and assessment_id=$2 and projection_version=$3 and ${predicate}`,
      [candidate.tenant_key, candidate.assessment_id, receipt.projection_version, page],
    );
    counts[page] = result.rows.length;
    fingerprints[page] = digest(JSON.stringify(result.rows
      .map((row) => ({ row_key: row.row_key, source_hash: row.source_hash }))
      .sort((a, b) => a.row_key.localeCompare(b.row_key) || a.source_hash.localeCompare(b.source_hash))));
    gaps.push(...validatePhysicalPage(result.rows, page, candidate, receipt.view_counts[page]));
    if (fingerprints[page] !== receipt.view_fingerprints?.[page]) gaps.push(`page_fingerprint_mismatch:${page}`);
  }
  return { counts, fingerprints, gaps: [...new Set(gaps)] };
}

async function physicalSubstrate(client, candidate, receipt) {
  const gaps = [];
  const objects = (await client.query(
    "select count(*)::int as total from ecl_context.object where tenant_key=$1 and assessment_id=$2",
    [candidate.tenant_key, candidate.assessment_id],
  )).rows[0]?.total;
  if (objects !== receipt.object_count) gaps.push("canonical_object_count_mismatch");
  const files = (await client.query(
    "select file_name, file_hash from ecl_source.source_file where tenant_key=$1 and assessment_id=$2 order by file_name",
    [candidate.tenant_key, candidate.assessment_id],
  )).rows;
  const expectedFiles = Object.entries(candidate.source_manifest)
    .filter(([name]) => !name.startsWith("extracts/"))
    .map(([file_name, entry]) => ({ file_name, file_hash: entry.sha256 }))
    .sort((a, b) => a.file_name.localeCompare(b.file_name));
  if (JSON.stringify(files) !== JSON.stringify(expectedFiles)) gaps.push("physical_source_file_hash_mismatch");
  const manifests = (await client.query(
    "select projection_key, source_hash, row_count from ecl_projection.projection_manifest where tenant_key=$1 and assessment_id=$2 and projection_version=$3 order by projection_key",
    [candidate.tenant_key, candidate.assessment_id, receipt.projection_version],
  )).rows;
  const expectedManifests = Object.entries(receipt.view_counts)
    .map(([page, row_count]) => ({ projection_key: `tower_${page}`, source_hash: candidate.input_fingerprint_sha256, row_count }))
    .sort((a, b) => a.projection_key.localeCompare(b.projection_key));
  if (JSON.stringify(manifests) !== JSON.stringify(expectedManifests)) gaps.push("physical_projection_manifest_mismatch");
  return { objects, source_files: files.length, projection_manifests: manifests.length, gaps };
}

async function generationFingerprints(client, tenant, assessment, version) {
  const result = {};
  for (const [page, [table, column]] of Object.entries(PAGES)) {
    const predicate = column === "page_key"
      ? "page_key = $4"
      : "display_payload_json ->> 'page_key' = $4";
    const rows = (await client.query(
      `select row_key, source_hash from ecl_projection.${table} where tenant_key=$1 and assessment_id=$2 and projection_version=$3 and ${predicate} order by row_key, source_hash`,
      [tenant, assessment, version, page],
    )).rows;
    result[page] = { rows: rows.length, fingerprint_sha256: digest(JSON.stringify(rows)) };
  }
  return result;
}

async function inspect(client, candidate, receipt, options = {}) {
  const gaps = [];
  const state = await lifecycle(client, candidate.tenant_key);
  if (state.gap) gaps.push(state.gap);
  const active = state.declared.filter((row) => row.state === "active");
  if (active.length !== 1 || state.resolved.length !== 1 || active[0]?.assessment_id !== state.resolved[0]?.assessment_id || Number(active[0]?.projection_version) !== Number(state.resolved[0]?.projection_version)) gaps.push("active_lifecycle_not_exactly_declared");
  if (state.declared.some((row) => row.assessment_id === candidate.assessment_id)) gaps.push("candidate_already_in_lifecycle");
  if (active[0]?.assessment_id === candidate.assessment_id) gaps.push("candidate_already_active");
  if (options.expectedActive && (active[0]?.assessment_id !== options.expectedActive.assessment_id || Number(active[0]?.projection_version) !== Number(options.expectedActive.projection_version))) gaps.push("active_generation_changed_since_preflight");
  const physical = Number.isInteger(receipt?.projection_version)
    ? await physicalPages(client, candidate, receipt)
    : { counts: {}, fingerprints: {}, gaps: ["physical_stage_unavailable"] };
  gaps.push(...physical.gaps);
  const substrate = receipt && Number.isInteger(receipt.projection_version)
    ? await physicalSubstrate(client, candidate, receipt)
    : { objects: null, source_files: null, projection_manifests: null, gaps: ["physical_substrate_unavailable"] };
  gaps.push(...substrate.gaps);
  const priorFingerprints = active.length === 1
    ? await generationFingerprints(client, candidate.tenant_key, active[0].assessment_id, Number(active[0].projection_version))
    : {};
  if (Object.values(priorFingerprints).some((page) => page.rows < 1)) gaps.push("prior_generation_missing_view_rows");
  return {
    status: gaps.length ? "blocked" : "ready",
    tenant_key: candidate.tenant_key,
    candidate_assessment_id: candidate.assessment_id,
    candidate_projection_version: receipt?.projection_version ?? null,
    prior_active: active[0] ?? null,
    prior_view_fingerprints: priorFingerprints,
    physical_view_counts: physical.counts,
    physical_view_fingerprints: physical.fingerprints,
    physical_substrate: { objects: substrate.objects, source_files: substrate.source_files, projection_manifests: substrate.projection_manifests },
    gaps: [...new Set(gaps)],
  };
}

function proofValue(candidateBytes, receiptBytes, inspection, localGaps) {
  const gaps = [...new Set([...localGaps, ...inspection.gaps])];
  return {
    contract_version: "tower-candidate-promotion-preflight/v1",
    status: gaps.length ? "blocked" : "ready",
    tenant_key: inspection.tenant_key,
    candidate_assessment_id: inspection.candidate_assessment_id,
    candidate_projection_version: inspection.candidate_projection_version,
    input_fingerprint_sha256: JSON.parse(candidateBytes.toString("utf8")).input_fingerprint_sha256,
    candidate_file_sha256: digest(candidateBytes),
    stage_receipt_sha256: receiptBytes ? digest(receiptBytes) : null,
    prior_active: inspection.prior_active,
    prior_view_fingerprints: inspection.prior_view_fingerprints,
    physical_view_counts: inspection.physical_view_counts,
    physical_view_fingerprints: inspection.physical_view_fingerprints,
    physical_substrate: inspection.physical_substrate,
    gaps,
  };
}

function writeProof(file, value) {
  if (!file) throw new Error("--out is required");
  fs.mkdirSync(path.dirname(path.resolve(file)), { recursive: true });
  const tmp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, `${JSON.stringify(value, null, 2)}\n`);
  fs.renameSync(tmp, file);
}

function servingApproval(candidatePath, receiptPath) {
  if (!receiptPath) return { approved: false, reasons: ["stage receipt missing"] };
  const result = spawnSync("npx", ["--no-install", "tsx", "scripts/tower/verify-registered-intake-serving-approval.ts", "--candidate", candidatePath, "--stage-receipt", receiptPath], {
    cwd: ROOT,
    encoding: "utf8",
    maxBuffer: 1024 * 1024,
  });
  if (result.status !== 0) return { approved: false, reasons: ["serving approval resolver failed"] };
  try { return JSON.parse(result.stdout.trim()); }
  catch { return { approved: false, reasons: ["serving approval resolver returned no decision"] }; }
}

async function setTenant(client, tenant) {
  await client.query("select set_config('app.tenant_key', $1, true)", [tenant]);
}

async function lockTenant(client, tenant) {
  await client.query("select pg_advisory_xact_lock(hashtext('tower-lifecycle'), hashtext($1))", [tenant]);
}

async function promote(client, candidate, receipt, reviewed, approvalRef) {
  await client.query("begin isolation level serializable");
  try {
    await setTenant(client, candidate.tenant_key);
    await lockTenant(client, candidate.tenant_key);
    const check = await inspect(client, candidate, receipt, { expectedActive: reviewed.prior_active });
    if (check.status !== "ready" || JSON.stringify(check.physical_view_counts) !== JSON.stringify(reviewed.physical_view_counts) || JSON.stringify(check.physical_view_fingerprints) !== JSON.stringify(reviewed.physical_view_fingerprints) || JSON.stringify(check.prior_view_fingerprints) !== JSON.stringify(reviewed.prior_view_fingerprints)) throw new Error(`promotion_readback_changed:${check.gaps.join(",")}`);
    const old = reviewed.prior_active;
    const retired = await client.query(
      "update ecl_projection.tower_assessment_lifecycle set state='retired', retired_at=now() where tenant_key=$1 and assessment_id=$2 and projection_version=$3 and state='active' returning assessment_id",
      [candidate.tenant_key, old.assessment_id, old.projection_version],
    );
    if (retired.rowCount !== 1) throw new Error("prior_active_pointer_changed");
    await client.query(
      "insert into ecl_projection.tower_assessment_lifecycle (tenant_key,assessment_id,projection_version,state,activated_at,retired_at,build_version,note) values ($1,$2,$3,'active',now(),null,$4,$5)",
      [candidate.tenant_key, candidate.assessment_id, receipt.projection_version, receipt.build_version, `Promotion approval ${approvalRef}`],
    );
    const selected = await lifecycle(client, candidate.tenant_key);
    if (selected.resolved.length !== 1 || selected.resolved[0].assessment_id !== candidate.assessment_id || Number(selected.resolved[0].projection_version) !== receipt.projection_version) throw new Error("candidate_not_sole_selected_generation");
    await client.query("commit");
    return { prior_active: old, prior_view_fingerprints: reviewed.prior_view_fingerprints, promoted: { assessment_id: candidate.assessment_id, projection_version: receipt.projection_version } };
  } catch (error) {
    await client.query("rollback");
    throw error;
  }
}

async function rollback(client, proof, approvalRef) {
  await client.query("begin isolation level serializable");
  try {
    await setTenant(client, proof.tenant_key);
    await lockTenant(client, proof.tenant_key);
    const state = await lifecycle(client, proof.tenant_key);
    const active = state.declared.filter((row) => row.state === "active");
    const prior = state.declared.filter((row) => row.assessment_id === proof.prior_active.assessment_id && Number(row.projection_version) === proof.prior_active.projection_version && row.state === "retired");
    if (active.length !== 1 || active[0].assessment_id !== proof.promoted.assessment_id || Number(active[0].projection_version) !== proof.promoted.projection_version || prior.length !== 1 ||
        state.resolved.length !== 1 || state.resolved[0].assessment_id !== proof.promoted.assessment_id || Number(state.resolved[0].projection_version) !== proof.promoted.projection_version) throw new Error("rollback_pointer_state_changed");
    const oldFingerprints = await generationFingerprints(client, proof.tenant_key, proof.prior_active.assessment_id, proof.prior_active.projection_version);
    if (JSON.stringify(oldFingerprints) !== JSON.stringify(proof.prior_view_fingerprints)) throw new Error("rollback_prior_generation_changed");
    const retired = await client.query(
      "update ecl_projection.tower_assessment_lifecycle set state='retired', retired_at=now() where tenant_key=$1 and assessment_id=$2 and projection_version=$3 and state='active'",
      [proof.tenant_key, proof.promoted.assessment_id, proof.promoted.projection_version],
    );
    if (retired.rowCount !== 1) throw new Error("rollback_candidate_pointer_changed");
    const restored = await client.query(
      "update ecl_projection.tower_assessment_lifecycle set state='active', activated_at=now(), retired_at=null, note=$4 where tenant_key=$1 and assessment_id=$2 and projection_version=$3 and state='retired'",
      [proof.tenant_key, proof.prior_active.assessment_id, proof.prior_active.projection_version, `Rollback approval ${approvalRef}`],
    );
    if (restored.rowCount !== 1) throw new Error("rollback_prior_pointer_changed");
    const selected = await lifecycle(client, proof.tenant_key);
    if (selected.resolved.length !== 1 || selected.resolved[0].assessment_id !== proof.prior_active.assessment_id || Number(selected.resolved[0].projection_version) !== proof.prior_active.projection_version) throw new Error("prior_generation_not_restored");
    await client.query("commit");
  } catch (error) {
    await client.query("rollback");
    throw error;
  }
}

async function main() {
  const options = args(process.argv.slice(2));
  if (!options.candidatePath || !options.outPath) throw new Error("--candidate and --out are required");
  const candidateBytes = fs.readFileSync(options.candidatePath);
  const candidate = JSON.parse(candidateBytes);
  const registry = readJson(REGISTRY);
  const localGaps = validateCandidate(candidate, registry);
  const receiptBytes = options.receiptPath ? fs.readFileSync(options.receiptPath) : null;
  const receipt = receiptBytes ? JSON.parse(receiptBytes) : null;
  localGaps.push(...(receipt ? validateReceipt(receipt, candidate, candidateBytes) : ["stage_receipt_missing"]));
  const approval = servingApproval(options.candidatePath, options.receiptPath);
  if (!approval.approved) localGaps.push(...approval.reasons.map((reason) => `serving_approval:${reason}`));
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required for a live lifecycle and physical readback");
  const { default: pg } = await import("pg");
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    if (options.mode === "rollback") {
      if (!options.promotionPath || !options.expectedProofSha || !options.approvalRef) throw new Error("Rollback requires promotion proof, exact proof SHA-256, and approval reference");
      const bytes = fs.readFileSync(options.promotionPath);
      if (digest(bytes) !== options.expectedProofSha) throw new Error("promotion_proof_hash_mismatch");
      const proof = JSON.parse(bytes);
      if (proof.contract_version !== "tower-candidate-promotion/v1" || proof.status !== "promoted" || proof.tenant_key !== candidate.tenant_key || proof.candidate_file_sha256 !== digest(candidateBytes)) throw new Error("promotion_proof_identity_mismatch");
      if (options.approvalRef !== proof.approval_ref) throw new Error("rollback_approval_reference_mismatch");
      writeProof(options.outPath, { contract_version: "tower-candidate-rollback/v1", status: "rollback_pending", tenant_key: proof.tenant_key, prior_active: proof.prior_active, approval_ref: options.approvalRef });
      await rollback(client, proof, options.approvalRef);
      writeProof(options.outPath, { contract_version: "tower-candidate-rollback/v1", status: "rolled_back", tenant_key: proof.tenant_key, prior_active: proof.prior_active, approval_ref: options.approvalRef });
      return;
    }
    await client.query("begin transaction read only");
    await setTenant(client, candidate.tenant_key);
    const inspection = await inspect(client, candidate, receipt);
    await client.query("commit");
    const proof = proofValue(candidateBytes, receiptBytes, inspection, localGaps);
    if (options.mode === "preflight") {
      writeProof(options.outPath, proof);
      process.stdout.write(`${JSON.stringify({ status: proof.status, gaps: proof.gaps, out: options.outPath })}\n`);
      if (proof.status !== "ready") process.exitCode = 2;
      return;
    }
    if (!options.proofPath || !options.expectedProofSha || !options.approvalRef || !options.expectedInputSha) throw new Error("Promotion requires reviewed preflight proof SHA-256, approval reference and input SHA-256");
    if (!approval.approved || options.approvalRef !== approval.release_record) throw new Error("approval_reference_does_not_match_manifest_serving_approval");
    const reviewedBytes = fs.readFileSync(options.proofPath);
    const reviewed = JSON.parse(reviewedBytes);
    if (digest(reviewedBytes) !== options.expectedProofSha || reviewed.status !== "ready" || options.expectedInputSha !== candidate.input_fingerprint_sha256 || JSON.stringify(reviewed) !== JSON.stringify(proof)) throw new Error("reviewed_preflight_does_not_match_current_readback");
    writeProof(options.outPath, { contract_version: "tower-candidate-promotion/v1", status: "promotion_pending", tenant_key: candidate.tenant_key, candidate_file_sha256: digest(candidateBytes), stage_receipt_sha256: digest(receiptBytes), input_fingerprint_sha256: candidate.input_fingerprint_sha256, approval_ref: options.approvalRef, prior_active: reviewed.prior_active, prior_view_fingerprints: reviewed.prior_view_fingerprints });
    const swap = await promote(client, candidate, receipt, reviewed, options.approvalRef);
    writeProof(options.outPath, { contract_version: "tower-candidate-promotion/v1", status: "promoted", tenant_key: candidate.tenant_key, candidate_file_sha256: digest(candidateBytes), stage_receipt_sha256: digest(receiptBytes), input_fingerprint_sha256: candidate.input_fingerprint_sha256, approval_ref: options.approvalRef, ...swap });
  } finally {
    await client.end();
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  });
}

export { args, physicalSubstrate, proofValue, scanMoney };
