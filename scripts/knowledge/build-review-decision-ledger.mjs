#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

import {
  REVIEW_POLICY_VERSION,
  buildDecisionRowsForBatch,
  buildReviewBatches,
  createReviewSummary,
} from "./processing/review-decision-policy.mjs";

function parseArgs(argv = process.argv.slice(2), env = process.env) {
  const args = {
    tenant: env.ABARVA_TENANT_KEY || "",
    releaseId: env.ABARVA_RELEASE_ID || env.ABARVA_SOURCE_RELEASE_ID || "",
    validationRunRef: env.ABARVA_VALIDATION_RUN_REF || "",
    sourceVersionRef: env.ABARVA_SOURCE_VERSION_REF || "",
    policyVersion: env.ABARVA_REVIEW_POLICY_VERSION || REVIEW_POLICY_VERSION,
    reviewer: env.ABARVA_REVIEWER_IDENTITY || "",
    mode: env.ABARVA_REVIEW_LEDGER_MODE || "dry-run",
    out: "",
    fixture: "",
    approveBatchClass: "",
  };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    const next = () => {
      const value = argv[i + 1];
      if (!value || value.startsWith("--")) throw new Error(`Missing value for ${token}`);
      i += 1;
      return value;
    };
    if (token === "--tenant") args.tenant = next();
    else if (token === "--release-id") args.releaseId = next();
    else if (token === "--validation-run-ref") args.validationRunRef = next();
    else if (token === "--source-version-ref") args.sourceVersionRef = next();
    else if (token === "--policy-version") args.policyVersion = next();
    else if (token === "--reviewer") args.reviewer = next();
    else if (token === "--mode") args.mode = next();
    else if (token === "--out") args.out = next();
    else if (token === "--fixture") args.fixture = next();
    else if (token === "--approve-batch-class") args.approveBatchClass = next();
    else throw new Error(`Unknown argument: ${token}`);
  }
  return args;
}

function requireValue(value, name) {
  if (!String(value ?? "").trim()) throw new Error(`${name} is required`);
}

function readFixture(file) {
  const parsed = JSON.parse(fs.readFileSync(file, "utf8"));
  if (Array.isArray(parsed)) return parsed;
  return [
    ...(parsed.entityCandidates || parsed.entity_candidates || []).map((row) => ({ ...row, candidateType: "entity_candidate" })),
    ...(parsed.factCandidates || parsed.fact_candidates || []).map((row) => ({ ...row, candidateType: "fact_candidate" })),
    ...(parsed.relationshipCandidates || parsed.relationship_candidates || []).map((row) => ({ ...row, candidateType: "relationship_candidate" })),
  ];
}

function sqlString(value) {
  if (value === null || value === undefined) return "NULL";
  return `'${String(value).replaceAll("'", "''")}'`;
}

function sqlArray(values = []) {
  if (!values.length) return "ARRAY[]::text[]";
  return `ARRAY[${values.map(sqlString).join(",")}]::text[]`;
}

function stableJson(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map((item) => stableJson(item)).join(",")}]`;
  return `{${Object.keys(value)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`)
    .join(",")}}`;
}

function sha256Value(value) {
  return crypto.createHash("sha256").update(stableJson(value)).digest("hex");
}

function insertSqlForPolicy(pkg) {
  const payload = {
    schemaVersion: pkg.schemaVersion,
    candidateClasses: ["auto_accept_eligible", "batch_review_required", "individual_review_required", "reject", "defer"],
    acceptanceGuard: [
      "candidate_hash_match",
      "approved_policy",
      "approved_batch",
      "authorized_reviewer",
      "validation_run_match",
      "source_version_match",
      "evidence_lineage",
    ],
  };
  return `INSERT INTO governance.review_policy (
  policy_version, policy_status, approved_by, approved_at, policy_payload, content_hash
) VALUES (
  ${sqlString(pkg.policyVersion)}, 'active', ${sqlString(pkg.reviewerIdentity)}, now(), ${sqlString(JSON.stringify(payload))}::jsonb, ${sqlString(sha256Value(payload))}
) ON CONFLICT (policy_version) DO UPDATE SET
  policy_status=EXCLUDED.policy_status,
  approved_by=EXCLUDED.approved_by,
  approved_at=EXCLUDED.approved_at,
  policy_payload=EXCLUDED.policy_payload,
  content_hash=EXCLUDED.content_hash;`;
}

function insertSqlForBatch(batch) {
  const manifest = batch.candidates.map((candidate) => ({
    candidate_ref: candidate.candidateRef,
    candidate_content_hash: candidate.candidateContentHash,
    reasons: candidate.classification.reasons,
  }));
  return `INSERT INTO governance.review_batch (
  tenant_key, review_batch_ref, policy_version, candidate_class, candidate_type, candidate_count,
  candidate_hash_manifest, batch_content_hash, batch_state, validation_run_ref, source_version_ref,
  evidence_refs
) VALUES (
  ${sqlString(batch.tenantKey)}, ${sqlString(batch.reviewBatchRef)}, ${sqlString(batch.policyVersion)},
  ${sqlString(batch.candidateClass)}, ${sqlString(batch.candidateType)}, ${batch.candidateCount},
  ${sqlString(JSON.stringify(manifest))}::jsonb, ${sqlString(batch.batchContentHash)}, ${sqlString(batch.approved ? "approved" : "generated")},
  ${sqlString(batch.validationRunRef)}, ${sqlString(batch.sourceVersionRef)}, ${sqlArray([...new Set(batch.candidates.flatMap((candidate) => candidate.evidenceRefs))])}
) ON CONFLICT (tenant_key, review_batch_ref) DO UPDATE SET
  candidate_hash_manifest=EXCLUDED.candidate_hash_manifest,
  batch_content_hash=EXCLUDED.batch_content_hash,
  batch_state=EXCLUDED.batch_state,
  validation_run_ref=EXCLUDED.validation_run_ref,
  source_version_ref=EXCLUDED.source_version_ref,
  evidence_refs=EXCLUDED.evidence_refs;`;
}

function insertSqlForApproval(batch, reviewerIdentity) {
  const approvalRef = `approval:${batch.reviewBatchRef.split(":").slice(-4).join(":")}`;
  return `INSERT INTO governance.review_batch_approval (
  tenant_key, review_batch_ref, approval_ref, reviewer_identity, approval_basis,
  policy_version, validation_run_ref, batch_content_hash
) VALUES (
  ${sqlString(batch.tenantKey)}, ${sqlString(batch.reviewBatchRef)}, ${sqlString(approvalRef)}, ${sqlString(reviewerIdentity)},
  ${sqlString(`${batch.candidateClass}_approved`)}, ${sqlString(batch.policyVersion)}, ${sqlString(batch.validationRunRef)}, ${sqlString(batch.batchContentHash)}
) ON CONFLICT (tenant_key, approval_ref) DO UPDATE SET
  reviewer_identity=EXCLUDED.reviewer_identity,
  approval_basis=EXCLUDED.approval_basis,
  policy_version=EXCLUDED.policy_version,
  validation_run_ref=EXCLUDED.validation_run_ref,
  batch_content_hash=EXCLUDED.batch_content_hash,
  approved_at=now();`;
}

function insertSqlForDecision(row) {
  return `INSERT INTO governance.review_decision (
  tenant_key, review_ref, reviewed_object_schema, reviewed_object_ref, review_state, reviewer_ref,
  reason_code, reason_detail, candidate_type, candidate_ref, candidate_content_hash, decision,
  decision_basis, policy_version, review_batch_ref, reviewer_identity, reviewed_at, validation_run_ref,
  source_version_ref, evidence_refs
) VALUES (
  ${sqlString(row.tenantKey)}, ${sqlString(row.reviewRef)}, ${sqlString(row.reviewedObjectSchema)}, ${sqlString(row.reviewedObjectRef)},
  ${sqlString(row.reviewState)}, ${sqlString(row.reviewerIdentity)}, ${sqlString(row.decisionBasis)}, ${sqlString(row.decisionBasis)},
  ${sqlString(row.candidateType)}, ${sqlString(row.candidateRef)}, ${sqlString(row.candidateContentHash)}, ${sqlString(row.decision)},
  ${sqlString(row.decisionBasis)}, ${sqlString(row.policyVersion)}, ${sqlString(row.reviewBatchRef)}, ${sqlString(row.reviewerIdentity)}, now(),
  ${sqlString(row.validationRunRef)}, ${sqlString(row.sourceVersionRef)}, ${sqlArray(row.evidenceRefs)}
) ON CONFLICT (tenant_key, review_ref) DO UPDATE SET
  candidate_content_hash=EXCLUDED.candidate_content_hash,
  decision=EXCLUDED.decision,
  decision_basis=EXCLUDED.decision_basis,
  policy_version=EXCLUDED.policy_version,
  review_batch_ref=EXCLUDED.review_batch_ref,
  reviewer_identity=EXCLUDED.reviewer_identity,
  reviewed_at=now(),
  validation_run_ref=EXCLUDED.validation_run_ref,
  source_version_ref=EXCLUDED.source_version_ref,
  evidence_refs=EXCLUDED.evidence_refs,
  decided_at=now();`;
}

async function applyLedgerSql(args, pkg) {
  if (process.env.ABARVA_REVIEW_LEDGER_APPLY_ACK !== "APPLY_REVIEW_LEDGER") {
    throw new Error("--mode apply requires ABARVA_REVIEW_LEDGER_APPLY_ACK=APPLY_REVIEW_LEDGER");
  }
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("--mode apply requires DATABASE_URL");
  }
  const { Client } = await import("pg");
  const client = new Client({ connectionString: databaseUrl });
  await client.connect();
  try {
    await client.query("BEGIN");
    await client.query(pkg.sql);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  } finally {
    await client.end();
  }
  return {
    tenantKey: args.tenant,
    releaseId: args.releaseId,
    policyVersion: args.policyVersion,
    batches: pkg.batches.length,
    decisions: pkg.decisionRows.length,
  };
}

export function buildLedgerPackage(args, candidates) {
  const approvedClasses = new Set(
    String(args.approveBatchClass || "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
  );
  const batches = buildReviewBatches({
    tenantKey: args.tenant,
    candidates,
    policyVersion: args.policyVersion,
    validationRunRef: args.validationRunRef,
    sourceVersionRef: args.sourceVersionRef,
    options: {
      semanticValidationPassed: true,
      sourceReleaseFrozen: true,
      tenantFencePassed: true,
    },
  });
  const annotatedBatches = batches.map((batch) => ({
    ...batch,
    approved: approvedClasses.has(batch.candidateClass),
  }));
  const decisionRows = annotatedBatches.flatMap((batch) =>
    buildDecisionRowsForBatch({
      batch,
      decision: batch.approved ? "accepted" : batch.candidateClass === "reject" ? "rejected" : "deferred",
      reviewerIdentity: args.reviewer,
      decisionBasis: batch.approved ? `${batch.candidateClass}_approved` : `${batch.candidateClass}_queued`,
    }),
  );
  const approvalSql = annotatedBatches
    .filter((batch) => batch.approved)
    .map((batch) => insertSqlForApproval(batch, args.reviewer));
  const pkgForPolicy = {
    schemaVersion: "review-decision-ledger-package/v1",
    policyVersion: args.policyVersion,
    reviewerIdentity: args.reviewer,
  };
  return {
    schemaVersion: "review-decision-ledger-package/v1",
    tenantKey: args.tenant,
    releaseId: args.releaseId,
    policyVersion: args.policyVersion,
    validationRunRef: args.validationRunRef,
    sourceVersionRef: args.sourceVersionRef,
    mode: args.mode,
    summary: createReviewSummary(annotatedBatches),
    batches: annotatedBatches,
    decisionRows,
    sql: [
      insertSqlForPolicy(pkgForPolicy),
      ...annotatedBatches.map(insertSqlForBatch),
      ...approvalSql,
      ...decisionRows.map(insertSqlForDecision),
    ].join("\n\n"),
  };
}

async function main() {
  const args = parseArgs();
  requireValue(args.tenant, "--tenant");
  requireValue(args.releaseId, "--release-id");
  requireValue(args.validationRunRef, "--validation-run-ref");
  requireValue(args.reviewer, "--reviewer");
  if (!["dry-run", "apply"].includes(args.mode)) throw new Error("--mode must be dry-run or apply");
  if (!args.fixture) throw new Error("--fixture is required for this deterministic package builder");

  const candidates = readFixture(args.fixture);
  const pkg = buildLedgerPackage(args, candidates);
  const output = JSON.stringify(pkg, null, 2);
  if (args.out) {
    fs.mkdirSync(path.dirname(args.out), { recursive: true });
    fs.writeFileSync(args.out, output);
  } else {
    console.log(output);
  }
  if (args.mode === "apply") {
    const result = await applyLedgerSql(args, pkg);
    console.error(JSON.stringify({ applied: true, ...result }, null, 2));
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error?.stack ?? error);
    process.exit(1);
  });
}
