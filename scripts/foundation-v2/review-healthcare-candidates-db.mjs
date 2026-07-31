#!/usr/bin/env node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import {
  FOUNDATION_RELEASE_ALIAS,
  READER_ROLE,
  SOURCE_RELEASE_ID,
  TENANT_KEY,
  TEST_NAMESPACE,
  WRITER_ROLE,
  bindFoundationV2SqlContext,
  emitProofBundle,
  foundationPostgresClientOptions,
  proofRef,
  sha256,
  stableJson,
  writeCsv,
  writeJson,
} from "./golden-slice-support.mjs";

const SOURCE_VOLUME_COUNTS = {
  source_files: 40,
  source_records: 140_773,
  source_field_values: 1_437_376,
  parser_executions: 1,
  source_volume_gates: 2,
};
const EXPECTED_NORMALIZATION_GATES = 4;
const REVIEW_EXECUTION_ID = `${SOURCE_RELEASE_ID}:review-dry-run-v1`;
const REVIEW_BATCH_ID = `${SOURCE_RELEASE_ID}:review-dry-run-batch-v1`;
const REVIEWER_REF = "foundation-v2-healthcare-review-dry-run-agent";
const J5_GATE_ID = "F2-HEALTHCARE-J5-REVIEW-DRY-RUN";
const J5_GATE_TRANSITION = "J5 pending candidates to dry-run review decisions";
const SOURCE_VOLUME_GATE_IDS = ["F2-SOURCE-VOLUME-L0-L1", "F2-SOURCE-VOLUME-L1-L2"];
const NORMALIZATION_GATE_IDS = [
  "F2-HEALTHCARE-J3A-NORMALIZATION",
  "F2-HEALTHCARE-J3B-IDENTITY",
  "F2-HEALTHCARE-J3C-RELATIONSHIPS",
  "F2-HEALTHCARE-J4-CANDIDATES",
];
const TERMINAL_STATUS = "HEALTHCARE_FOUNDATION_V2_REVIEW_DRY_RUN_VERIFIED";

const args = parseArgs(process.argv.slice(2));

await main().catch((error) => {
  console.error(
    JSON.stringify(
      {
        status: "HEALTHCARE_FOUNDATION_V2_REVIEW_DRY_RUN_FAILED",
        error: error.message,
      },
      null,
      2,
    ),
  );
  process.exit(1);
});

async function main() {
  fs.mkdirSync(args.outDir, { recursive: true });
  if (args.mode === "self-test") {
    const result = runSelfTest();
    writeJson(proofRef(args.outDir, "HEALTHCARE_REVIEW_DRY_RUN_SELF_TEST.json"), result);
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  const { Client } = await import("pg");
  const client = new Client(await foundationPostgresClientOptions("foundation-v2-healthcare-review-dry-run"));
  bindFoundationV2SqlContext(client);
  await client.connect();
  try {
    if (args.mode === "preflight") {
      const result = await preflight(client);
      writeProofSet(args.outDir, result);
      console.log(JSON.stringify(result, null, 2));
      maybeEmitProofBundle();
      if (result.status !== "HEALTHCARE_FOUNDATION_V2_REVIEW_DRY_RUN_PREFLIGHT_PASSED") process.exitCode = 1;
      return;
    }
    if (args.mode === "verify") {
      const result = await verify(client);
      writeProofSet(args.outDir, result);
      console.log(JSON.stringify(result, null, 2));
      maybeEmitProofBundle();
      if (result.status !== TERMINAL_STATUS) process.exitCode = 1;
      return;
    }
    if (args.mode !== "apply") throw new Error(`Unsupported mode ${args.mode}`);
    const result = await apply(client);
    writeProofSet(args.outDir, result);
    console.log(JSON.stringify(result, null, 2));
    maybeEmitProofBundle();
    if (result.status !== TERMINAL_STATUS) process.exitCode = 1;
  } finally {
    await client.end();
  }
}

function parseArgs(argv) {
  const parsed = {
    mode: process.env.FOUNDATION_V2_REVIEW_DRY_RUN_MODE || "preflight",
    outDir: process.env.FOUNDATION_V2_REVIEW_DRY_RUN_OUT_DIR || path.join(os.tmpdir(), "healthcare-review-dry-run"),
    emitProofBundle:
      process.env.EMIT_ACA_PROOF_BUNDLE === "true" ||
      process.env.FOUNDATION_V2_EMIT_PROOF_BUNDLE === "true",
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = () => {
      index += 1;
      if (index >= argv.length) throw new Error(`${arg} requires a value`);
      return argv[index];
    };
    if (arg === "--mode") parsed.mode = next();
    else if (arg === "--out-dir") parsed.outDir = path.resolve(next());
    else if (arg === "--execution-id") next();
    else if (arg === "--emit-proof-bundle") parsed.emitProofBundle = true;
    else if (arg === "--no-emit-proof-bundle") parsed.emitProofBundle = false;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  if (!["preflight", "apply", "verify", "self-test"].includes(parsed.mode)) throw new Error(`Unsupported mode ${parsed.mode}`);
  return parsed;
}

async function preflight(client) {
  await client.query("BEGIN");
  try {
    await setContext(client, WRITER_ROLE);
    const sourceCounts = await sourceVolumeCounts(client);
    const candidateCounts = await candidateReadinessCounts(client);
    const reviewCounts = await reviewCountsReadback(client);
    const forbiddenCounts = await forbiddenDownstreamCounts(client);
    await client.query("ROLLBACK");
    const sourceReady = exactSourceCounts(sourceCounts);
    const candidateReady = exactCandidateReadiness(candidateCounts);
    const existingExact = exactReviewCounts(reviewCounts);
    const existingTotal = Number(reviewCounts.review_batches || 0) + Number(reviewCounts.review_decisions || 0) + Number(reviewCounts.review_gates || 0);
    const noForbiddenDownstream = Object.values(forbiddenCounts).every((value) => Number(value || 0) === 0);
    const status =
      sourceReady && candidateReady && noForbiddenDownstream && (existingTotal === 0 || existingExact)
        ? "HEALTHCARE_FOUNDATION_V2_REVIEW_DRY_RUN_PREFLIGHT_PASSED"
        : "HEALTHCARE_FOUNDATION_V2_REVIEW_DRY_RUN_PREFLIGHT_FAILED";
    return manifest(status, {
      source_counts: sourceCounts,
      candidate_counts: candidateCounts,
      existing_review_counts: reviewCounts,
      existing_review_total: existingTotal,
      forbidden_downstream_counts: forbiddenCounts,
      source_exact_match: sourceReady,
      candidate_exact_match: candidateReady,
      existing_review_exact_match: existingExact,
      forbidden_downstream_exact_match: noForbiddenDownstream,
    });
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  }
}

async function apply(client) {
  const startedAt = new Date().toISOString();
  await client.query("BEGIN");
  try {
    await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [`foundation-v2:${TENANT_KEY}:${TEST_NAMESPACE}:review-dry-run`]);
    await setContext(client, WRITER_ROLE);
    const sourceCounts = await sourceVolumeCounts(client);
    const candidateCounts = await candidateReadinessCounts(client);
    const forbiddenCounts = await forbiddenDownstreamCounts(client);
    if (!exactSourceCounts(sourceCounts)) throw new Error(`Source-volume counts are not verified: ${JSON.stringify(sourceCounts)}`);
    if (!exactCandidateReadiness(candidateCounts)) throw new Error(`Candidate readiness counts are not verified: ${JSON.stringify(candidateCounts)}`);
    if (!Object.values(forbiddenCounts).every((value) => Number(value || 0) === 0)) {
      throw new Error(`Forbidden downstream records already exist: ${JSON.stringify(forbiddenCounts)}`);
    }

    const existingCounts = await reviewCountsReadback(client);
    const existingTotal =
      Number(existingCounts.review_batches || 0) + Number(existingCounts.review_decisions || 0) + Number(existingCounts.review_gates || 0);
    if (existingTotal > 0) {
      if (!exactReviewCounts(existingCounts)) {
        throw new Error(`Existing review dry-run rows do not match expected counts: ${JSON.stringify(existingCounts)}`);
      }
      await client.query("ROLLBACK");
      return await verifiedManifest(client, TERMINAL_STATUS, {
        already_verified: true,
        started_at: startedAt,
        completed_at: new Date().toISOString(),
        source_counts: sourceCounts,
        candidate_counts: candidateCounts,
        actual_counts: existingCounts,
      });
    }

    await insertReviewBatch(client);
    await insertReviewDecisions(client);
    const j5 = await j5Readback(client);
    assertGate(j5.status, "HEALTHCARE_FOUNDATION_V2_J5_REVIEW_DRY_RUN_PASSED", j5);
    await insertGateResult(client, j5.knowledge_candidates, j5.review_decisions);
    const result = await verifiedManifest(client, TERMINAL_STATUS, {
      started_at: startedAt,
      completed_at: new Date().toISOString(),
      source_counts: sourceCounts,
      candidate_counts: candidateCounts,
      j5,
    });
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  }
}

async function verify(client) {
  await client.query("BEGIN");
  try {
    await setContext(client, READER_ROLE);
    const j5 = await j5Readback(client);
    const result = await verifiedManifest(client, TERMINAL_STATUS, { j5 });
    await client.query("ROLLBACK");
    if (!result.exact_match || j5.status !== "HEALTHCARE_FOUNDATION_V2_J5_REVIEW_DRY_RUN_PASSED") {
      result.status = "HEALTHCARE_FOUNDATION_V2_REVIEW_DRY_RUN_VERIFY_FAILED";
    }
    return result;
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  }
}

async function insertReviewBatch(client) {
  await q(
    client,
    `INSERT INTO foundation_v2.review_batches
      (review_batch_id, tenant_key, test_namespace, source_release_id, batch_state, reviewer_ref, writer_job_id)
     VALUES ($1,$2,$3,$4,'approved_for_golden_slice',$5,$6)`,
    [REVIEW_BATCH_ID, TENANT_KEY, TEST_NAMESPACE, SOURCE_RELEASE_ID, REVIEWER_REF, REVIEW_EXECUTION_ID],
  );
}

async function insertReviewDecisions(client) {
  await q(
    client,
    `
    INSERT INTO foundation_v2.review_decisions
      (review_decision_id, review_batch_id, candidate_id, tenant_key, test_namespace, review_decision,
       decision_reason, reviewer_ref, writer_job_id)
    SELECT kc.candidate_id || ':review-dry-run-v1',
           $3,
           kc.candidate_id,
           kc.tenant_key,
           kc.test_namespace,
           CASE
             WHEN kc.candidate_state = 'quarantined' THEN 'quarantined'
             WHEN no.identity_resolution_state = 'rejected' THEN 'rejected'
             WHEN no.identity_resolution_state IN ('duplicate_candidate','orphan_endpoint') THEN 'deferred'
             WHEN no.normalized_payload->>'downstream_row_disposition' IN ('orphan_endpoint','ambiguous_endpoint','duplicate_business_key') THEN 'deferred'
             ELSE 'accepted'
           END AS review_decision,
           CASE
             WHEN kc.candidate_state = 'quarantined' THEN 'review dry run preserves quarantined candidate; no canonical promotion'
             WHEN no.identity_resolution_state = 'rejected' THEN 'review dry run rejects unresolved identity candidate; no canonical promotion'
             WHEN no.identity_resolution_state IN ('duplicate_candidate','orphan_endpoint') THEN 'review dry run defers unresolved identity or relationship endpoint; no canonical promotion'
             WHEN no.normalized_payload->>'downstream_row_disposition' IN ('orphan_endpoint','ambiguous_endpoint','duplicate_business_key') THEN 'review dry run defers unresolved downstream disposition; no canonical promotion'
             ELSE 'review dry run accepts candidate for later governed apply; no canonical promotion in this wave'
           END AS decision_reason,
           $4,
           $5
      FROM foundation_v2.knowledge_candidates kc
      JOIN foundation_v2.normalized_objects no USING (tenant_key, test_namespace, normalized_object_id)
     WHERE kc.tenant_key=$1
       AND kc.test_namespace=$2
       AND kc.candidate_state='pending_review'
     ORDER BY kc.candidate_id
    `,
    [TENANT_KEY, TEST_NAMESPACE, REVIEW_BATCH_ID, REVIEWER_REF, REVIEW_EXECUTION_ID],
  );
}

async function insertGateResult(client, inputCount, outputCount) {
  const unexplainedVariance = Number(inputCount || 0) - Number(outputCount || 0);
  await q(
    client,
    `INSERT INTO foundation_v2.gate_results
      (gate_result_id, tenant_key, test_namespace, gate_id, transition, input_count, output_count,
       unexplained_variance, gate_status, failure_classification, repair_owner, rerun_scope, proof_uri, writer_job_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'passed',NULL,'foundation-v2-agent','review-dry-run',$9,$10)`,
    [
      `${SOURCE_RELEASE_ID}:${J5_GATE_ID}`,
      TENANT_KEY,
      TEST_NAMESPACE,
      J5_GATE_ID,
      J5_GATE_TRANSITION,
      Number(inputCount || 0),
      Number(outputCount || 0),
      unexplainedVariance,
      `proof://foundation-v2/${REVIEW_EXECUTION_ID}/${J5_GATE_ID}`,
      REVIEW_EXECUTION_ID,
    ],
  );
}

async function verifiedManifest(client, status, extra) {
  const sourceCounts = await sourceVolumeCounts(client);
  const candidateCounts = await candidateReadinessCounts(client);
  const actualCounts = await reviewCountsReadback(client);
  const decisionSummary = await reviewDecisionSummary(client);
  const familyReconciliationRows = await sourceFamilyReviewReconciliation(client);
  const candidateTypeRows = await candidateTypeReviewReconciliation(client);
  const forbiddenCounts = await forbiddenDownstreamCounts(client);
  const candidateStateRows = await candidateStateSummary(client);
  const exact =
    exactSourceCounts(sourceCounts) &&
    exactCandidateReadiness(candidateCounts) &&
    exactReviewCounts(actualCounts) &&
    Object.values(forbiddenCounts).every((value) => Number(value || 0) === 0);
  return manifest(status, {
    ...extra,
    source_counts: sourceCounts,
    candidate_counts: candidateCounts,
    actual_counts: actualCounts,
    exact_match: exact,
    decision_summary: decisionSummary,
    family_reconciliation: familyReconciliationRows,
    candidate_type_reconciliation: candidateTypeRows,
    candidate_state_summary: candidateStateRows,
    forbidden_downstream_counts: forbiddenCounts,
    earliest_broken_transition: exact ? null : earliestBrokenTransition(sourceCounts, candidateCounts, actualCounts, forbiddenCounts),
  });
}

async function sourceVolumeCounts(client) {
  const [counts] = await rows(
    client,
    `
    SELECT
      (SELECT count(*)::int FROM foundation_v2.source_files WHERE tenant_key=$1 AND test_namespace=$2 AND source_release_id=$3) AS source_files,
      (SELECT count(*)::int FROM foundation_v2.source_records WHERE tenant_key=$1 AND test_namespace=$2 AND source_release_id=$3) AS source_records,
      (SELECT count(*)::int FROM foundation_v2.source_field_values WHERE tenant_key=$1 AND test_namespace=$2 AND source_release_id=$3) AS source_field_values,
      (SELECT count(*)::int FROM foundation_v2.parser_executions WHERE tenant_key=$1 AND test_namespace=$2 AND source_release_id=$3) AS parser_executions,
      (SELECT count(*)::int FROM foundation_v2.gate_results WHERE tenant_key=$1 AND test_namespace=$2 AND gate_id = ANY($4::text[])) AS source_volume_gates
    `,
    [TENANT_KEY, TEST_NAMESPACE, SOURCE_RELEASE_ID, SOURCE_VOLUME_GATE_IDS],
  );
  return numericObject(counts);
}

async function candidateReadinessCounts(client) {
  const [counts] = await rows(
    client,
    `
    SELECT
      (SELECT count(*)::int FROM foundation_v2.normalized_objects WHERE tenant_key=$1 AND test_namespace=$2) AS normalized_objects,
      (SELECT count(*)::int FROM foundation_v2.knowledge_candidates WHERE tenant_key=$1 AND test_namespace=$2) AS knowledge_candidates,
      (SELECT count(*)::int FROM foundation_v2.knowledge_candidates WHERE tenant_key=$1 AND test_namespace=$2 AND candidate_state='pending_review') AS pending_review_candidates,
      (SELECT count(*)::int FROM foundation_v2.gate_results WHERE tenant_key=$1 AND test_namespace=$2 AND gate_id = ANY($3::text[])) AS normalization_gates
    `,
    [TENANT_KEY, TEST_NAMESPACE, NORMALIZATION_GATE_IDS],
  );
  return numericObject(counts);
}

async function reviewCountsReadback(client) {
  const [counts] = await rows(
    client,
    `
    SELECT
      (SELECT count(*)::int FROM foundation_v2.review_batches WHERE tenant_key=$1 AND test_namespace=$2 AND review_batch_id=$3) AS review_batches,
      (SELECT count(*)::int FROM foundation_v2.review_decisions WHERE tenant_key=$1 AND test_namespace=$2 AND review_batch_id=$3) AS review_decisions,
      (SELECT count(*)::int FROM foundation_v2.gate_results WHERE tenant_key=$1 AND test_namespace=$2 AND gate_id=$4) AS review_gates
    `,
    [TENANT_KEY, TEST_NAMESPACE, REVIEW_BATCH_ID, J5_GATE_ID],
  );
  return numericObject(counts);
}

async function j5Readback(client) {
  const [summary] = await rows(
    client,
    `
    SELECT
      (SELECT count(*)::int FROM foundation_v2.knowledge_candidates WHERE tenant_key=$1 AND test_namespace=$2) AS knowledge_candidates,
      (SELECT count(*)::int FROM foundation_v2.review_decisions WHERE tenant_key=$1 AND test_namespace=$2 AND review_batch_id=$3) AS review_decisions,
      (SELECT count(*)::int FROM foundation_v2.review_decisions WHERE tenant_key=$1 AND test_namespace=$2 AND review_batch_id=$3 AND review_decision='accepted') AS accepted,
      (SELECT count(*)::int FROM foundation_v2.review_decisions WHERE tenant_key=$1 AND test_namespace=$2 AND review_batch_id=$3 AND review_decision='deferred') AS deferred,
      (SELECT count(*)::int FROM foundation_v2.review_decisions WHERE tenant_key=$1 AND test_namespace=$2 AND review_batch_id=$3 AND review_decision='rejected') AS rejected,
      (SELECT count(*)::int FROM foundation_v2.review_decisions WHERE tenant_key=$1 AND test_namespace=$2 AND review_batch_id=$3 AND review_decision='quarantined') AS quarantined,
      (SELECT count(*)::int FROM foundation_v2.knowledge_candidates WHERE tenant_key=$1 AND test_namespace=$2 AND candidate_state='pending_review') AS still_pending_candidates
    `,
    [TENANT_KEY, TEST_NAMESPACE, REVIEW_BATCH_ID],
  );
  const result = numericObject(summary);
  return {
    status:
      result.knowledge_candidates === SOURCE_VOLUME_COUNTS.source_records &&
      result.review_decisions === result.knowledge_candidates &&
      result.still_pending_candidates === result.knowledge_candidates
        ? "HEALTHCARE_FOUNDATION_V2_J5_REVIEW_DRY_RUN_PASSED"
        : "HEALTHCARE_FOUNDATION_V2_J5_REVIEW_DRY_RUN_FAILED",
    ...result,
  };
}

async function reviewDecisionSummary(client) {
  return rows(
    client,
    `
    SELECT review_decision, count(*)::int AS candidates
      FROM foundation_v2.review_decisions
     WHERE tenant_key=$1 AND test_namespace=$2 AND review_batch_id=$3
     GROUP BY review_decision
     ORDER BY review_decision
    `,
    [TENANT_KEY, TEST_NAMESPACE, REVIEW_BATCH_ID],
  );
}

async function sourceFamilyReviewReconciliation(client) {
  return rows(
    client,
    `
    SELECT sf.file_name,
           regexp_replace(regexp_replace(sf.file_name, '\\.csv$', ''), '[^a-zA-Z0-9]+', '_', 'g') AS source_family,
           count(DISTINCT sr.source_record_id)::int AS source_records,
           count(DISTINCT kc.candidate_id)::int AS knowledge_candidates,
           count(DISTINCT rd.review_decision_id)::int AS review_decisions,
           count(DISTINCT rd.review_decision_id) FILTER (WHERE rd.review_decision='accepted')::int AS accepted,
           count(DISTINCT rd.review_decision_id) FILTER (WHERE rd.review_decision='deferred')::int AS deferred,
           count(DISTINCT rd.review_decision_id) FILTER (WHERE rd.review_decision='rejected')::int AS rejected,
           count(DISTINCT rd.review_decision_id) FILTER (WHERE rd.review_decision='quarantined')::int AS quarantined
      FROM foundation_v2.source_files sf
      JOIN foundation_v2.source_records sr USING (tenant_key, test_namespace, source_file_id)
      JOIN foundation_v2.normalized_objects no USING (tenant_key, test_namespace, source_record_id)
      JOIN foundation_v2.knowledge_candidates kc USING (tenant_key, test_namespace, normalized_object_id)
      LEFT JOIN foundation_v2.review_decisions rd USING (tenant_key, test_namespace, candidate_id)
     WHERE sf.tenant_key=$1
       AND sf.test_namespace=$2
       AND sf.source_release_id=$3
     GROUP BY sf.file_name
     ORDER BY sf.file_name
    `,
    [TENANT_KEY, TEST_NAMESPACE, SOURCE_RELEASE_ID],
  );
}

async function candidateTypeReviewReconciliation(client) {
  return rows(
    client,
    `
    SELECT kc.candidate_type,
           no.identity_resolution_state,
           coalesce(no.normalized_payload->>'downstream_row_disposition', 'unknown') AS row_disposition,
           count(*)::int AS knowledge_candidates,
           count(rd.review_decision_id)::int AS review_decisions,
           count(*) FILTER (WHERE rd.review_decision='accepted')::int AS accepted,
           count(*) FILTER (WHERE rd.review_decision='deferred')::int AS deferred,
           count(*) FILTER (WHERE rd.review_decision='rejected')::int AS rejected,
           count(*) FILTER (WHERE rd.review_decision='quarantined')::int AS quarantined
      FROM foundation_v2.knowledge_candidates kc
      JOIN foundation_v2.normalized_objects no USING (tenant_key, test_namespace, normalized_object_id)
      LEFT JOIN foundation_v2.review_decisions rd USING (tenant_key, test_namespace, candidate_id)
     WHERE kc.tenant_key=$1 AND kc.test_namespace=$2
     GROUP BY kc.candidate_type, no.identity_resolution_state, coalesce(no.normalized_payload->>'downstream_row_disposition', 'unknown')
     ORDER BY kc.candidate_type, no.identity_resolution_state, row_disposition
    `,
    [TENANT_KEY, TEST_NAMESPACE],
  );
}

async function candidateStateSummary(client) {
  return rows(
    client,
    `
    SELECT candidate_state, count(*)::int AS candidates
      FROM foundation_v2.knowledge_candidates
     WHERE tenant_key=$1 AND test_namespace=$2
     GROUP BY candidate_state
     ORDER BY candidate_state
    `,
    [TENANT_KEY, TEST_NAMESPACE],
  );
}

async function forbiddenDownstreamCounts(client) {
  const [counts] = await rows(
    client,
    `
    SELECT
      (SELECT count(*)::int FROM foundation_v2.canonical_objects WHERE tenant_key=$1 AND test_namespace=$2) AS canonical_objects,
      (SELECT count(*)::int FROM foundation_v2.domain_publications WHERE tenant_key=$1 AND test_namespace=$2) AS domain_publications,
      (SELECT count(*)::int FROM foundation_v2.publication_members WHERE tenant_key=$1 AND test_namespace=$2) AS publication_members,
      (SELECT count(*)::int FROM foundation_v2.baselines WHERE tenant_key=$1 AND test_namespace=$2) AS baselines,
      (SELECT count(*)::int FROM foundation_v2.baseline_object_memberships WHERE tenant_key=$1 AND test_namespace=$2) AS baseline_object_memberships,
      (SELECT count(*)::int FROM foundation_v2.projection_authority WHERE tenant_key=$1 AND test_namespace=$2) AS projection_authority,
      (SELECT count(*)::int FROM foundation_v2.projection_rows WHERE tenant_key=$1 AND test_namespace=$2) AS projection_rows,
      (SELECT count(*)::int FROM foundation_v2.cube_parity_results WHERE tenant_key=$1 AND test_namespace=$2) AS cube_parity_results,
      (SELECT count(*)::int FROM foundation_v2.product_binding_proofs WHERE tenant_key=$1 AND test_namespace=$2) AS product_binding_proofs,
      (SELECT count(*)::int FROM foundation_v2.ava_packet_proofs WHERE tenant_key=$1 AND test_namespace=$2) AS ava_packet_proofs
    `,
    [TENANT_KEY, TEST_NAMESPACE],
  );
  return numericObject(counts);
}

function exactSourceCounts(counts) {
  return Object.entries(SOURCE_VOLUME_COUNTS).every(([key, value]) => Number(counts[key] || 0) === value);
}

function exactCandidateReadiness(counts) {
  return (
    Number(counts.normalized_objects || 0) === SOURCE_VOLUME_COUNTS.source_records &&
    Number(counts.knowledge_candidates || 0) === SOURCE_VOLUME_COUNTS.source_records &&
    Number(counts.pending_review_candidates || 0) === SOURCE_VOLUME_COUNTS.source_records &&
    Number(counts.normalization_gates || 0) === EXPECTED_NORMALIZATION_GATES
  );
}

function exactReviewCounts(counts) {
  return (
    Number(counts.review_batches || 0) === 1 &&
    Number(counts.review_decisions || 0) === SOURCE_VOLUME_COUNTS.source_records &&
    Number(counts.review_gates || 0) === 1
  );
}

function earliestBrokenTransition(sourceCounts, candidateCounts, reviewCounts, forbiddenCounts) {
  if (!exactSourceCounts(sourceCounts)) return "SOURCE_VOLUME_READBACK";
  if (!exactCandidateReadiness(candidateCounts)) return "J4_CANDIDATE_READBACK";
  if (Number(reviewCounts.review_batches || 0) !== 1) return "J5_REVIEW_BATCH";
  if (Number(reviewCounts.review_decisions || 0) !== SOURCE_VOLUME_COUNTS.source_records) return "J5_REVIEW_DECISIONS";
  if (Number(reviewCounts.review_gates || 0) !== 1) return "J5_REVIEW_GATE";
  if (!Object.values(forbiddenCounts).every((value) => Number(value || 0) === 0)) return "FORBIDDEN_DOWNSTREAM_MUTATION";
  return null;
}

function writeProofSet(outDir, result) {
  writeJson(proofRef(outDir, "HEALTHCARE_REVIEW_DRY_RUN.json"), result);
  if (Array.isArray(result.family_reconciliation)) {
    writeCsv(
      proofRef(outDir, "HEALTHCARE_REVIEW_DRY_RUN_FAMILY_RECONCILIATION.csv"),
      ["file_name", "source_family", "source_records", "knowledge_candidates", "review_decisions", "accepted", "deferred", "rejected", "quarantined"],
      result.family_reconciliation,
    );
  }
  if (Array.isArray(result.candidate_type_reconciliation)) {
    writeCsv(
      proofRef(outDir, "HEALTHCARE_REVIEW_DRY_RUN_DECISION_SUMMARY.csv"),
      ["candidate_type", "identity_resolution_state", "row_disposition", "knowledge_candidates", "review_decisions", "accepted", "deferred", "rejected", "quarantined"],
      result.candidate_type_reconciliation,
    );
  }
}

function manifest(status, extra) {
  return {
    status,
    generated_at: new Date().toISOString(),
    tenant_key: TENANT_KEY,
    test_namespace: TEST_NAMESPACE,
    source_release_id: SOURCE_RELEASE_ID,
    foundation_release_alias: FOUNDATION_RELEASE_ALIAS,
    execution_id: REVIEW_EXECUTION_ID,
    review_batch_id: REVIEW_BATCH_ID,
    review_mode: "dry_run_decision_only_no_canonical_promotion",
    expected_counts: SOURCE_VOLUME_COUNTS,
    expected_review_decisions: SOURCE_VOLUME_COUNTS.source_records,
    expected_review_gates: 1,
    ...extra,
  };
}

function runSelfTest() {
  const script = fs.readFileSync(new URL(import.meta.url), "utf8");
  const forbiddenWrites = [
    "canonical_objects",
    "domain_publications",
    "publication_members",
    "baselines",
    "baseline_object_memberships",
    "projection_authority",
    "projection_rows",
    "cube_parity_results",
    "product_binding_proofs",
    "ava_packet_proofs",
  ];
  const defects = [];
  for (const table of forbiddenWrites) {
    if (new RegExp(`INSERT\\s+INTO\\s+foundation_v2\\.${table}`, "i").test(script)) defects.push(`unexpected insert into ${table}`);
  }
  if (/UPDATE\s+foundation_v2\.knowledge_candidates/i.test(script)) defects.push("unexpected candidate-state update");
  if (!script.includes("INSERT INTO foundation_v2.review_batches")) defects.push("missing review batch insert");
  if (!script.includes("INSERT INTO foundation_v2.review_decisions")) defects.push("missing review decision insert");
  if (!script.includes(J5_GATE_ID)) defects.push("missing J5 review gate id");
  if (!script.includes("dry_run_decision_only_no_canonical_promotion")) defects.push("missing dry-run promotion boundary");
  if (!script.includes(TERMINAL_STATUS)) defects.push("missing terminal status");
  if (defects.length > 0) throw new Error(`Self-test failed: ${defects.join("; ")}`);
  return {
    status: "HEALTHCARE_FOUNDATION_V2_REVIEW_DRY_RUN_SELF_TEST_PASSED",
    forbidden_downstream_writes_checked: forbiddenWrites,
    source_volume_expected_counts_sha256: sha256(stableJson(SOURCE_VOLUME_COUNTS)),
    review_batch_id: REVIEW_BATCH_ID,
  };
}

function numericObject(row) {
  return Object.fromEntries(Object.entries(row).map(([key, value]) => [key, Number(value || 0)]));
}

async function setContext(client, roleName) {
  await client.query("SET LOCAL row_security = on");
  await q(client, "SELECT set_config('app.tenant_key', $1, true)", [TENANT_KEY]);
  await q(client, "SELECT set_config('app.client_key', $1, true)", [TENANT_KEY]);
  await q(client, "SELECT set_config('app.foundation_v2_test_namespace', $1, true)", [TEST_NAMESPACE]);
  await q(client, "SELECT set_config('app.foundation_v2_source_release_id', $1, true)", [SOURCE_RELEASE_ID]);
  await q(client, "SELECT set_config('app.foundation_v2_release_alias', $1, true)", [FOUNDATION_RELEASE_ALIAS]);
  await client.query(`SET LOCAL ROLE ${quoteIdent(roleName)}`);
}

async function q(client, sql, params = []) {
  return client.query(sql, params);
}

async function rows(client, sql, params = []) {
  return (await client.query(sql, params)).rows;
}

function assertGate(actual, expected, details) {
  if (actual !== expected) throw new Error(`Gate ${expected} failed: ${JSON.stringify(details)}`);
}

function quoteIdent(value) {
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(value)) throw new Error(`Invalid SQL identifier: ${value}`);
  return `"${value.replace(/"/g, '""')}"`;
}

function maybeEmitProofBundle() {
  if (args.emitProofBundle) emitProofBundle(args.outDir);
}
