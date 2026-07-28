#!/usr/bin/env node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";

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
    outDir: "",
    fixture: "",
    fromDb: env.ABARVA_REVIEW_LEDGER_FROM_DB === "true",
    approveBatchClass: "",
    samplesPerBatch: Number(env.ABARVA_REVIEW_LEDGER_SAMPLES_PER_BATCH || 5),
    emitProofBundle: env.EMIT_ACA_PROOF_BUNDLE === "true",
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
    else if (token === "--out-dir") args.outDir = next();
    else if (token === "--fixture") args.fixture = next();
    else if (token === "--from-db") args.fromDb = true;
    else if (token === "--approve-batch-class") args.approveBatchClass = next();
    else if (token === "--samples-per-batch") args.samplesPerBatch = Number(next());
    else if (token === "--emit-proof-bundle") args.emitProofBundle = true;
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

function dbConnectionConfig(env = process.env) {
  if (env.DATABASE_URL) {
    return { connectionString: env.DATABASE_URL };
  }
  const missing = ["PGHOST", "PGUSER", "PGDATABASE", "PGPASSWORD"].filter((key) => !env[key]);
  if (missing.length > 0) {
    throw new Error(`DB-backed review package requires DATABASE_URL or PGHOST/PGUSER/PGDATABASE/PGPASSWORD. Missing: ${missing.join(", ")}`);
  }
  return {
    host: env.PGHOST,
    port: env.PGPORT ? Number(env.PGPORT) : 5432,
    user: env.PGUSER,
    password: env.PGPASSWORD,
    database: env.PGDATABASE,
    ssl: env.PGSSLMODE === "disable" ? false : { rejectUnauthorized: false },
  };
}

async function readCandidatesFromDb(args, env = process.env) {
  const { Client } = await import("pg");
  const client = new Client(dbConnectionConfig(env));
  await client.connect();
  try {
    const entities = await client.query(
      `
          SELECT c.candidate_ref AS "candidateRef",
            'entity_candidate' AS "candidateType",
            c.source_version_ref AS "sourceVersionRef",
            c.entity_type AS "entityType",
            c.display_name AS "displayName",
            c.candidate_payload AS "candidatePayload",
            to_jsonb(c)->'evidence_refs' AS "evidenceRefs",
            to_jsonb(c)->>'candidate_content_hash' AS "storedCandidateContentHash",
            c.confidence,
            c.review_state AS "reviewState",
            s.source_family AS "sourceFamily",
            s.source_ref AS "sourceRef"
          FROM working.entity_candidate c
          LEFT JOIN source_registry.source_version v
            ON v.tenant_key=c.tenant_key AND v.source_version_ref=c.source_version_ref
          LEFT JOIN source_registry.source s
            ON s.tenant_key=v.tenant_key AND s.source_ref=v.source_ref
          WHERE c.tenant_key=$1
          ORDER BY c.candidate_ref
        `,
      [args.tenant],
    );
    const facts = await client.query(
      `
          SELECT c.candidate_ref AS "candidateRef",
            'fact_candidate' AS "candidateType",
            c.source_version_ref AS "sourceVersionRef",
            c.subject_candidate_ref AS "subjectCandidateRef",
            c.fact_type AS "factType",
            c.fact_value AS "factValue",
            to_jsonb(c)->'evidence_refs' AS "evidenceRefs",
            to_jsonb(c)->>'candidate_content_hash' AS "storedCandidateContentHash",
            c.confidence,
            c.review_state AS "reviewState",
            s.source_family AS "sourceFamily",
            s.source_ref AS "sourceRef"
          FROM working.fact_candidate c
          LEFT JOIN source_registry.source_version v
            ON v.tenant_key=c.tenant_key AND v.source_version_ref=c.source_version_ref
          LEFT JOIN source_registry.source s
            ON s.tenant_key=v.tenant_key AND s.source_ref=v.source_ref
          WHERE c.tenant_key=$1
          ORDER BY c.candidate_ref
        `,
      [args.tenant],
    );
    const relationships = await client.query(
      `
          SELECT c.candidate_ref AS "candidateRef",
            'relationship_candidate' AS "candidateType",
            c.source_version_ref AS "sourceVersionRef",
            c.from_candidate_ref AS "fromCandidateRef",
            c.to_candidate_ref AS "toCandidateRef",
            c.relationship_type_ref AS "relationshipTypeRef",
            c.current_target_state AS "currentTargetState",
            to_jsonb(c)->'evidence_refs' AS "evidenceRefs",
            to_jsonb(c)->>'candidate_content_hash' AS "storedCandidateContentHash",
            c.confidence,
            c.review_state AS "reviewState",
            s.source_family AS "sourceFamily",
            s.source_ref AS "sourceRef"
          FROM working.relationship_candidate c
          LEFT JOIN source_registry.source_version v
            ON v.tenant_key=c.tenant_key AND v.source_version_ref=c.source_version_ref
          LEFT JOIN source_registry.source s
            ON s.tenant_key=v.tenant_key AND s.source_ref=v.source_ref
          WHERE c.tenant_key=$1
          ORDER BY c.candidate_ref
        `,
      [args.tenant],
    );
    return [...entities.rows, ...facts.rows, ...relationships.rows];
  } finally {
    await client.end();
  }
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

function inc(map, key, amount = 1) {
  const normalizedKey = String(key || "unknown");
  map[normalizedKey] = (map[normalizedKey] ?? 0) + amount;
}

function firstNonEmpty(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null && String(value).trim()) return String(value).trim();
  }
  return "";
}

function rawJson(candidate) {
  return stableJson(candidate.raw ?? candidate);
}

function inferDomain(candidate) {
  const raw = candidate.raw ?? {};
  const content = candidate.content ?? {};
  const payload = content.payload ?? raw.candidatePayload ?? raw.candidate_payload ?? {};
  const factValue = content.factValue ?? raw.factValue ?? raw.fact_value ?? {};
  return firstNonEmpty(
    raw.domain,
    raw.domain_key,
    payload.domain,
    payload.domain_key,
    payload.business_domain,
    payload.function,
    payload.business_function,
    factValue.domain,
    factValue.domain_key,
    content.entityType,
    raw.entityType,
    raw.entity_type,
    raw.factType,
    raw.fact_type,
    raw.relationshipTypeRef,
    raw.relationship_type_ref,
  );
}

function inferSourceFamily(candidate) {
  const raw = candidate.raw ?? {};
  const payload = candidate.content?.payload ?? raw.candidatePayload ?? raw.candidate_payload ?? {};
  return firstNonEmpty(raw.sourceFamily, raw.source_family, payload.source_family, raw.sourceRef, raw.source_ref, candidate.sourceVersionRef);
}

function inferIdentityResolution(candidate) {
  const serialized = rawJson(candidate);
  if (/probabilistic|ambiguous|candidate_match|fuzzy|needs[_ -]?review|inferred/i.test(serialized)) return "probabilistic_or_review";
  if (Number(candidate.confidence ?? 0) >= 0.86) return "deterministic";
  return "needs_review";
}

function inferEvidenceCompleteness(candidate) {
  return candidate.sourceVersionRef && candidate.evidenceRefs?.length > 0 ? "complete" : "incomplete";
}

function inferCurrentTargetState(candidate) {
  const raw = candidate.raw ?? {};
  const factValue = candidate.content?.factValue ?? raw.factValue ?? raw.fact_value ?? {};
  return firstNonEmpty(candidate.content?.currentTargetState, raw.currentTargetState, raw.current_target_state, factValue.current_target_state, factValue.state);
}

function inferDerivationBasis(candidate) {
  return /model[-_ ]?derived|claude|llm|generated_model|ai[-_ ]?enriched|synthetic[-_ ]?only|interpreted|inferred/i.test(rawJson(candidate))
    ? "interpreted_or_model_derived"
    : "source_derived";
}

function isCommercialOrDecisionSensitive(candidate) {
  return /commercial[_ -]?term|contract[_ -]?value|rate[_ -]?card|pricing|invoice|bafo|proposal|sourcing[_ -]?decision|award[_ -]?recommendation|decision|approval|kpi|metric[_ -]?definition|target[_ -]?state|outcome[_ -]?target|benefit[_ -]?target/i.test(
    rawJson(candidate),
  );
}

function isHighImpactRelationship(candidate) {
  if (candidate.candidateType !== "relationship_candidate") return false;
  return /depends_on|blocks|governs|owns|is_control_for|feeds|measures|contracted_by|supports_decision/i.test(
    String(candidate.content?.relationshipTypeRef ?? ""),
  );
}

function csvEscape(value) {
  const text = value == null ? "" : String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function writeCsv(file, rows, headers) {
  fs.writeFileSync(file, [headers.join(","), ...rows.map((row) => headers.map((h) => csvEscape(row[h])).join(","))].join("\n") + "\n");
}

function toCountRows(counts, keyName = "key") {
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([key, count]) => ({ [keyName]: key, count }));
}

function compactCandidate(candidate) {
  const raw = candidate.raw ?? {};
  return {
    candidateRef: candidate.candidateRef,
    candidateType: candidate.candidateType,
    candidateContentHash: candidate.candidateContentHash,
    sourceVersionRef: candidate.sourceVersionRef,
    sourceFamily: inferSourceFamily(candidate),
    domain: inferDomain(candidate),
    confidence: candidate.confidence,
    evidenceRefs: candidate.evidenceRefs.slice(0, 8),
    evidenceCount: candidate.evidenceRefs.length,
    displayName: candidate.content?.displayName ?? raw.displayName ?? raw.display_name ?? "",
    entityType: candidate.content?.entityType ?? raw.entityType ?? raw.entity_type ?? "",
    factType: candidate.content?.factType ?? raw.factType ?? raw.fact_type ?? "",
    relationshipTypeRef: candidate.content?.relationshipTypeRef ?? raw.relationshipTypeRef ?? raw.relationship_type_ref ?? "",
    currentTargetState: inferCurrentTargetState(candidate),
    classification: candidate.classification,
  };
}

export function buildDryRunReviewPackage(args, candidates) {
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
  const samplesPerBatch = Number.isFinite(args.samplesPerBatch) && args.samplesPerBatch > 0 ? args.samplesPerBatch : 5;
  const counts = {
    byType: {},
    byDomain: {},
    bySourceFamily: {},
    byIdentityResolution: {},
    byEvidenceCompleteness: {},
    byCurrentTargetState: {},
    byDerivationBasis: {},
    commercialAndDecisionSensitive: 0,
    highImpactRelationships: 0,
    eligibleAfterApproval: { auto_accept_eligible: 0, batch_review_required: 0, individual_review_required: 0 },
    proposedDecisions: { accept: 0, reject: 0, defer: 0 },
  };
  const candidateManifest = [];
  const batchSummaries = [];
  const exceptionQueues = {};

  for (const batch of batches) {
    const sampleRows = batch.candidates.slice(0, samplesPerBatch).map(compactCandidate);
    const reasons = {};
    for (const candidate of batch.candidates) {
      inc(counts.byType, candidate.candidateType);
      inc(counts.byDomain, inferDomain(candidate));
      inc(counts.bySourceFamily, inferSourceFamily(candidate));
      inc(counts.byIdentityResolution, inferIdentityResolution(candidate));
      inc(counts.byEvidenceCompleteness, inferEvidenceCompleteness(candidate));
      inc(counts.byCurrentTargetState, inferCurrentTargetState(candidate) || "not_applicable");
      inc(counts.byDerivationBasis, inferDerivationBasis(candidate));
      if (isCommercialOrDecisionSensitive(candidate)) counts.commercialAndDecisionSensitive += 1;
      if (isHighImpactRelationship(candidate)) counts.highImpactRelationships += 1;
      for (const reason of candidate.classification.reasons) inc(reasons, reason);
      candidateManifest.push({
        candidate_ref: candidate.candidateRef,
        candidate_type: candidate.candidateType,
        candidate_content_hash: candidate.candidateContentHash,
        candidate_class: batch.candidateClass,
        source_version_ref: candidate.sourceVersionRef,
        source_family: inferSourceFamily(candidate),
        domain: inferDomain(candidate),
        evidence_count: candidate.evidenceRefs.length,
        confidence: candidate.confidence,
        decision_plan: batch.candidateClass === "reject" ? "reject" : "defer_until_human_approval",
      });
    }
    if (batch.candidateClass in counts.eligibleAfterApproval) {
      counts.eligibleAfterApproval[batch.candidateClass] += batch.candidateCount;
    }
    if (batch.candidateClass === "reject") counts.proposedDecisions.reject += batch.candidateCount;
    else counts.proposedDecisions.defer += batch.candidateCount;
    if (["individual_review_required", "reject", "defer"].includes(batch.candidateClass)) {
      exceptionQueues[batch.candidateClass] = exceptionQueues[batch.candidateClass] || [];
      exceptionQueues[batch.candidateClass].push({
        reviewBatchRef: batch.reviewBatchRef,
        candidateType: batch.candidateType,
        candidateCount: batch.candidateCount,
        reasons,
        samples: sampleRows,
      });
    }
    batchSummaries.push({
      reviewBatchRef: batch.reviewBatchRef,
      candidateClass: batch.candidateClass,
      candidateType: batch.candidateType,
      candidateCount: batch.candidateCount,
      batchContentHash: batch.batchContentHash,
      validationRunRef: batch.validationRunRef,
      sourceVersionRef: batch.sourceVersionRef,
      approved: false,
      proposedDecision: batch.candidateClass === "reject" ? "reject" : "defer_until_human_approval",
      reasonCounts: reasons,
      samples: sampleRows,
    });
  }

  candidateManifest.sort((a, b) => a.candidate_ref.localeCompare(b.candidate_ref) || a.candidate_type.localeCompare(b.candidate_type));
  const packageCore = {
    schemaVersion: "review-decision-dry-run-package/v1",
    tenantKey: args.tenant,
    releaseId: args.releaseId,
    policyVersion: args.policyVersion,
    validationRunRef: args.validationRunRef,
    sourceVersionRefs: [...new Set(candidateManifest.map((row) => row.source_version_ref).filter(Boolean))].sort(),
    generatedAt: new Date().toISOString(),
    candidateCounts: {
      total: candidateManifest.length,
      ...counts,
    },
    summary: createReviewSummary(batches),
    batches: batchSummaries,
    exceptionQueues,
    humanApprovalRequired: true,
    applyAuthorized: false,
    hardStop: "dry_run_only_no_review_decisions_written",
  };
  const candidateManifestHash = sha256Value(candidateManifest);
  const packageHashInput = {
    ...packageCore,
    generatedAt: "omitted-from-content-hash",
    candidateManifestHash,
  };
  const packageContentHash = sha256Value(packageHashInput);
  return {
    ...packageCore,
    packageId: `review-package:${args.tenant}:${args.policyVersion}:${packageContentHash.slice(0, 16)}`,
    packageContentHash,
    candidateManifestHash,
    candidateManifest,
  };
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

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

function renderHtmlReport(pkg) {
  const esc = (value) =>
    String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  const countTable = (title, rows, keyName = "key") => `
    <section>
      <h2>${esc(title)}</h2>
      <table><thead><tr><th>${esc(keyName)}</th><th>Count</th></tr></thead><tbody>
        ${rows.map((row) => `<tr><td>${esc(row[keyName])}</td><td>${esc(row.count)}</td></tr>`).join("")}
      </tbody></table>
    </section>`;
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>Airline Review Package Dry Run</title>
  <style>
    body{font-family:Arial,Helvetica,sans-serif;margin:28px;background:#f7f8fb;color:#12203a}
    h1{font-size:26px;margin:0 0 8px} h2{font-size:18px;margin-top:28px}
    .meta{color:#526070}.guard{background:#fff7ed;border:1px solid #fed7aa;padding:12px;border-radius:8px}
    table{border-collapse:collapse;width:100%;background:white;margin-top:10px}
    th,td{border:1px solid #d8dee9;padding:8px;text-align:left;vertical-align:top}
    th{background:#f1f5f9}.hash{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px}
    .pill{display:inline-block;border:1px solid #cbd5e1;border-radius:999px;padding:2px 8px;margin:2px;background:#fff}
    pre{white-space:pre-wrap;background:#0f172a;color:#e2e8f0;padding:10px;border-radius:8px;overflow:auto}
  </style>
</head>
<body>
  <h1>Airline Review Package Dry Run</h1>
  <p class="meta">Tenant: ${esc(pkg.tenantKey)} · Release: ${esc(pkg.releaseId)} · Policy: ${esc(pkg.policyVersion)}</p>
  <p class="hash">Package ID: ${esc(pkg.packageId)}<br>Package hash: ${esc(pkg.packageContentHash)}<br>Candidate manifest hash: ${esc(pkg.candidateManifestHash)}</p>
  <div class="guard"><strong>Governance stop:</strong> ${esc(pkg.hardStop)}. This package proposes no accepted decisions and requires explicit human batch approval before any mutation.</div>
  ${countTable("Candidate Counts By Type", toCountRows(pkg.candidateCounts.byType, "type"), "type")}
  ${countTable("Candidate Counts By Domain", toCountRows(pkg.candidateCounts.byDomain, "domain"), "domain")}
  ${countTable("Candidate Counts By Source Family", toCountRows(pkg.candidateCounts.bySourceFamily, "source_family"), "source_family")}
  ${countTable("Identity Resolution", toCountRows(pkg.candidateCounts.byIdentityResolution, "basis"), "basis")}
  ${countTable("Evidence Lineage", toCountRows(pkg.candidateCounts.byEvidenceCompleteness, "state"), "state")}
  ${countTable("Current Vs Target State", toCountRows(pkg.candidateCounts.byCurrentTargetState, "state"), "state")}
  ${countTable("Source Vs Interpreted", toCountRows(pkg.candidateCounts.byDerivationBasis, "basis"), "basis")}
  <section>
    <h2>Batch Definitions</h2>
    <table><thead><tr><th>Batch</th><th>Class</th><th>Type</th><th>Count</th><th>Proposed Decision</th><th>Reason Counts</th><th>Samples</th></tr></thead><tbody>
      ${pkg.batches
        .map(
          (batch) => `<tr>
            <td class="hash">${esc(batch.reviewBatchRef)}<br>${esc(batch.batchContentHash)}</td>
            <td>${esc(batch.candidateClass)}</td>
            <td>${esc(batch.candidateType)}</td>
            <td>${esc(batch.candidateCount)}</td>
            <td>${esc(batch.proposedDecision)}</td>
            <td>${Object.entries(batch.reasonCounts).map(([k, v]) => `<span class="pill">${esc(k)}: ${esc(v)}</span>`).join("") || "none"}</td>
            <td><pre>${esc(JSON.stringify(batch.samples, null, 2))}</pre></td>
          </tr>`,
        )
        .join("")}
    </tbody></table>
  </section>
</body>
</html>`;
}

function writeDryRunArtifacts(pkg, outDir) {
  const resolved = path.resolve(outDir);
  fs.mkdirSync(resolved, { recursive: true });
  const summary = {
    schemaVersion: pkg.schemaVersion,
    packageId: pkg.packageId,
    packageContentHash: pkg.packageContentHash,
    candidateManifestHash: pkg.candidateManifestHash,
    tenantKey: pkg.tenantKey,
    releaseId: pkg.releaseId,
    policyVersion: pkg.policyVersion,
    validationRunRef: pkg.validationRunRef,
    sourceVersionRefs: pkg.sourceVersionRefs,
    candidateCounts: pkg.candidateCounts,
    summary: pkg.summary,
    humanApprovalRequired: pkg.humanApprovalRequired,
    applyAuthorized: pkg.applyAuthorized,
    hardStop: pkg.hardStop,
  };
  writeJson(path.join(resolved, "review-package-summary.json"), summary);
  writeJson(path.join(resolved, "review-batches.json"), pkg.batches);
  writeJson(path.join(resolved, "exception-queues.json"), pkg.exceptionQueues);
  fs.writeFileSync(
    path.join(resolved, "candidate-manifest.jsonl"),
    pkg.candidateManifest.map((row) => JSON.stringify(row)).join("\n") + "\n",
  );
  writeCsv(path.join(resolved, "candidate-counts-by-type.csv"), toCountRows(pkg.candidateCounts.byType, "type"), ["type", "count"]);
  writeCsv(path.join(resolved, "candidate-counts-by-domain.csv"), toCountRows(pkg.candidateCounts.byDomain, "domain"), ["domain", "count"]);
  writeCsv(path.join(resolved, "candidate-counts-by-source-family.csv"), toCountRows(pkg.candidateCounts.bySourceFamily, "source_family"), ["source_family", "count"]);
  writeCsv(path.join(resolved, "candidate-manifest-sample.csv"), pkg.candidateManifest.slice(0, 1000), [
    "candidate_ref",
    "candidate_type",
    "candidate_content_hash",
    "candidate_class",
    "source_version_ref",
    "source_family",
    "domain",
    "evidence_count",
    "confidence",
    "decision_plan",
  ]);
  fs.writeFileSync(path.join(resolved, "review-package.html"), renderHtmlReport(pkg));
  fs.writeFileSync(
    path.join(resolved, "README.md"),
    [
      "# Airline Review Package Dry Run",
      "",
      `Package ID: \`${pkg.packageId}\``,
      `Package content hash: \`${pkg.packageContentHash}\``,
      `Candidate manifest hash: \`${pkg.candidateManifestHash}\``,
      "",
      "Status: DRY RUN ONLY. No review decisions, approvals, candidate promotions, publications, projections, or product refreshes were applied.",
      "",
      "Files:",
      "- `review-package-summary.json`",
      "- `review-batches.json`",
      "- `exception-queues.json`",
      "- `candidate-manifest.jsonl`",
      "- `candidate-manifest-sample.csv`",
      "- `review-package.html`",
    ].join("\n") + "\n",
  );
  return resolved;
}

function emitProofBundle(outDir) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "review-package-proof-"));
  const tarPath = path.join(tmp, "proof.tgz");
  const tar = spawnSync("tar", ["-czf", tarPath, "-C", path.dirname(outDir), path.basename(outDir)], { encoding: "utf8" });
  if (tar.status !== 0) throw new Error(tar.stderr || "proof bundle tar failed");
  process.stdout.write("__SEMANTIC2_PROOF_TGZ_BEGIN__\n");
  process.stdout.write(fs.readFileSync(tarPath).toString("base64"));
  process.stdout.write("\n__SEMANTIC2_PROOF_TGZ_END__\n");
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
  if (!args.fixture && !args.fromDb) throw new Error("--fixture or --from-db is required for this deterministic package builder");
  if (args.mode === "apply" && args.fromDb) throw new Error("--from-db supports dry-run package generation only; apply requires an explicit reviewed package fixture");

  const candidates = args.fromDb ? await readCandidatesFromDb(args) : readFixture(args.fixture);
  const pkg = args.fromDb ? buildDryRunReviewPackage(args, candidates) : buildLedgerPackage(args, candidates);
  const output = JSON.stringify(pkg, null, 2);
  if (args.outDir) {
    const outDir = writeDryRunArtifacts(pkg, args.outDir);
    if (args.emitProofBundle) emitProofBundle(outDir);
    console.error(JSON.stringify({ dryRunPackage: true, packageId: pkg.packageId, packageContentHash: pkg.packageContentHash, outDir }, null, 2));
  } else if (args.out) {
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
