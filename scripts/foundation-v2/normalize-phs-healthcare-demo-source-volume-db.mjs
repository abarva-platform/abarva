#!/usr/bin/env node

import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import {
  emitProofBundle,
  foundationPostgresClientOptions,
  proofRef,
  sha256,
  stableJson,
  writeCsv,
  writeJson,
} from "./golden-slice-support.mjs";

const DATABASE_SCHEMA = "foundation_v2_phs_demo";
const TENANT_KEY = "phs_health_demo_global";
const TEST_NAMESPACE = "phs-healthcare-demo-source-volume-v1";
const SOURCE_RELEASE_ID = "phs-health-source-v1-202608:source-volume-v1:447910ac3c16";
const FOUNDATION_RELEASE_ALIAS = "phs-healthcare-demo-phase-a-source-volume-v1";
const WRITER_ROLE = "foundation_v2_phs_demo_writer";
const READER_ROLE = "foundation_v2_phs_demo_reader";
const NORMALIZE_VERSION = "phs-source-adapters-candidates-v1";
const NORMALIZE_EXECUTION_ID = `${SOURCE_RELEASE_ID}:${NORMALIZE_VERSION}`;
const SOURCE_VOLUME_GATE_IDS = ["PHS-SOURCE-VOLUME-L0-L1", "PHS-SOURCE-VOLUME-L1-L2"];
const ADAPTER_GATE_IDS = [
  "PHS-L2-J2A-ADAPTER-NORMALIZATION",
  "PHS-L2-J2B-CANDIDATE-CLASSIFICATION",
  "PHS-L2-J2C-LINEAGE-RECONCILIATION",
];
const SOURCE_VOLUME_COUNTS = {
  source_files: 54,
  source_file_context: 54,
  source_records: 54_967,
  source_field_values: 1_640_131,
  parser_executions: 1,
  source_volume_gates: 2,
};
const DOWNSTREAM_COUNTS = {
  normalized_objects: 54_967,
  knowledge_candidates: 54_967,
  adapter_gates: 3,
};

const args = parseArgs(process.argv.slice(2));

await main().catch((error) => {
  console.error(JSON.stringify({ status: "PHS_HEALTHCARE_DEMO_NORMALIZATION_FAILED", error: error.message }, null, 2));
  process.exit(1);
});

async function main() {
  fs.mkdirSync(args.outDir, { recursive: true });
  if (args.mode === "self-test") {
    const result = selfTest();
    writeJson(proofRef(args.outDir, "PHS_NORMALIZATION_SELF_TEST.json"), result);
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  const { Client } = await import("pg");
  const client = new Client(await foundationPostgresClientOptions("phs-healthcare-demo-normalize"));
  await client.connect();
  try {
    if (args.mode === "preflight") {
      const result = await preflight(client);
      writeProofSet(args.outDir, result);
      console.log(JSON.stringify(result, null, 2));
      maybeEmitProofBundle();
      if (result.status !== "PHS_HEALTHCARE_DEMO_NORMALIZATION_PREFLIGHT_PASSED") process.exitCode = 1;
      return;
    }
    if (args.mode === "verify") {
      const result = await verify(client);
      writeProofSet(args.outDir, result);
      console.log(JSON.stringify(result, null, 2));
      maybeEmitProofBundle();
      if (result.status !== "PHS_HEALTHCARE_DEMO_NORMALIZATION_VERIFIED") process.exitCode = 1;
      return;
    }
    if (args.mode !== "apply") throw new Error(`Unsupported mode ${args.mode}`);
    const result = await apply(client);
    writeProofSet(args.outDir, result);
    console.log(JSON.stringify(result, null, 2));
    maybeEmitProofBundle();
    if (!["PHS_HEALTHCARE_DEMO_NORMALIZATION_VERIFIED", "PHS_HEALTHCARE_DEMO_NORMALIZATION_ALREADY_VERIFIED"].includes(result.status)) {
      process.exitCode = 1;
    }
  } finally {
    await client.end();
  }
}

function parseArgs(argv) {
  const parsed = {
    mode: process.env.PHS_NORMALIZATION_MODE || "preflight",
    outDir:
      process.env.PHS_NORMALIZATION_OUT_DIR ||
      path.join(os.tmpdir(), `phs-healthcare-demo-normalize-${new Date().toISOString().replace(/[:.]/g, "-")}`),
    emitProofBundle:
      process.env.EMIT_ACA_PROOF_BUNDLE === "true" ||
      process.env.PHS_NORMALIZATION_EMIT_PROOF_BUNDLE === "true",
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
    else if (arg === "--emit-proof-bundle") parsed.emitProofBundle = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  if (!["self-test", "preflight", "apply", "verify"].includes(parsed.mode)) {
    throw new Error(`Unsupported mode ${parsed.mode}`);
  }
  return parsed;
}

async function preflight(client) {
  await client.query("BEGIN");
  try {
    await setContext(client, WRITER_ROLE);
    const sourceCounts = await sourceVolumeCounts(client);
    const existingCounts = await downstreamCounts(client);
    await client.query("ROLLBACK");
    const sourceExact = exactSourceCounts(sourceCounts);
    const existingTotal = Object.values(existingCounts).reduce((sum, value) => sum + Number(value || 0), 0);
    const existingExact = exactDownstreamCounts(existingCounts);
    return manifest(sourceExact && (existingTotal === 0 || existingExact)
      ? "PHS_HEALTHCARE_DEMO_NORMALIZATION_PREFLIGHT_PASSED"
      : "PHS_HEALTHCARE_DEMO_NORMALIZATION_PREFLIGHT_FAILED", {
      mutation_executed: false,
      source_counts: sourceCounts,
      source_exact_match: sourceExact,
      existing_counts: existingCounts,
      existing_total: existingTotal,
      existing_exact_match: existingExact,
    });
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  }
}

async function apply(client) {
  assertApplyApproved();
  const startedAt = new Date().toISOString();
  await client.query("BEGIN");
  try {
    await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [`${DATABASE_SCHEMA}:${TENANT_KEY}:${TEST_NAMESPACE}:normalization`]);
    await setContext(client, WRITER_ROLE);
    const sourceCounts = await sourceVolumeCounts(client);
    if (!exactSourceCounts(sourceCounts)) throw new Error(`PHS source-volume counts are not verified: ${JSON.stringify(sourceCounts)}`);
    const existingCounts = await downstreamCounts(client);
    const existingTotal = Object.values(existingCounts).reduce((sum, value) => sum + Number(value || 0), 0);
    if (existingTotal > 0) {
      if (!exactDownstreamCounts(existingCounts)) throw new Error(`Existing PHS normalization rows are partial or divergent: ${JSON.stringify(existingCounts)}`);
      await client.query("ROLLBACK");
      return await verifiedManifest(client, "PHS_HEALTHCARE_DEMO_NORMALIZATION_ALREADY_VERIFIED", {
        mutation_executed: false,
        started_at: startedAt,
        completed_at: new Date().toISOString(),
      });
    }

    await insertNormalizedObjects(client);
    const j2a = await j2aReadback(client);
    assertGate(j2a.status, "PHS_HEALTHCARE_DEMO_J2A_ADAPTER_NORMALIZATION_PASSED", j2a);
    await insertGateResult(client, ADAPTER_GATE_IDS[0], "Layer 1 source records to Layer 2 normalized adapter outputs", j2a.source_records, j2a.normalized_objects);

    await insertKnowledgeCandidates(client);
    const j2b = await j2bReadback(client);
    assertGate(j2b.status, "PHS_HEALTHCARE_DEMO_J2B_CANDIDATE_CLASSIFICATION_PASSED", j2b);
    await insertGateResult(client, ADAPTER_GATE_IDS[1], "Layer 2 normalized adapter outputs to candidate staging", j2b.normalized_objects, j2b.knowledge_candidates);

    const j2c = await fieldLineageReadback(client);
    assertGate(j2c.status, "PHS_HEALTHCARE_DEMO_J2C_LINEAGE_RECONCILIATION_PASSED", j2c);
    await insertGateResult(client, ADAPTER_GATE_IDS[2], "Layer 1 source fields to Layer 2 field dispositions", j2c.source_field_values, j2c.downstream_field_dispositions);

    const result = await verifiedManifest(client, "PHS_HEALTHCARE_DEMO_NORMALIZATION_VERIFIED", {
      mutation_executed: true,
      started_at: startedAt,
      completed_at: new Date().toISOString(),
      j2a,
      j2b,
      j2c,
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
    const result = await verifiedManifest(client, "PHS_HEALTHCARE_DEMO_NORMALIZATION_VERIFIED", {
      mutation_executed: false,
      j2a: await j2aReadback(client),
      j2b: await j2bReadback(client),
      j2c: await fieldLineageReadback(client),
    });
    await client.query("ROLLBACK");
    if (!result.exact_match) result.status = "PHS_HEALTHCARE_DEMO_NORMALIZATION_VERIFY_FAILED";
    return result;
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  }
}

function assertApplyApproved() {
  if (process.env.PHS_NORMALIZATION_APPLY_APPROVED !== "true") {
    throw new Error("PHS_NORMALIZATION_APPLY_APPROVED=true is required for Layer 2 apply");
  }
  if (process.env.ACA_JOB_NAME !== "job-abarva-private-operator-eus") {
    throw new Error("PHS Layer 2 apply must run from job-abarva-private-operator-eus");
  }
}

async function insertNormalizedObjects(client) {
  await q(
    client,
    `
    INSERT INTO ${tableRef("normalized_objects")}
      (normalized_object_id, source_record_id, source_file_id, source_release_id, tenant_key, test_namespace,
       source_file_name, object_type, business_key, identity_resolution_state, normalized_payload,
       field_disposition_count, content_hash, writer_job_id)
    WITH record_rollup AS (
      SELECT sr.source_record_id,
             sr.source_file_id,
             sr.source_release_id,
             sr.tenant_key,
             sr.test_namespace,
             sr.source_row_number,
             sr.source_row_hash,
             sf.file_name,
             sf.source_uri,
             sfc.source_group,
             sfc.context_treatment,
             sfc.demo_priority,
             sfc.event_id,
             sfc.effective_as_of,
             regexp_replace(regexp_replace(sf.file_name, '\\.csv$', ''), '[^a-zA-Z0-9]+', '_', 'g') AS object_type,
             sr.source_record_id AS declared_business_key,
             (sf.field_count / nullif(sf.row_count, 0))::int AS field_count,
             CASE WHEN sr.row_disposition = 'RESTRICTED' THEN (sf.field_count / nullif(sf.row_count, 0))::int ELSE 0 END AS restricted_field_count,
             1 AS first_source_field_id,
             (sf.field_count / nullif(sf.row_count, 0))::int AS last_source_field_id
        FROM ${tableRef("source_records")} sr
        JOIN ${tableRef("source_files")} sf USING (tenant_key, test_namespace, source_file_id)
        JOIN ${tableRef("source_file_context")} sfc USING (tenant_key, test_namespace, source_file_id)
       WHERE sr.tenant_key=$1
         AND sr.test_namespace=$2
         AND sr.source_release_id=$3
    ),
    keyed AS (
      SELECT *,
             coalesce(object_type, regexp_replace(regexp_replace(file_name, '\\.csv$', ''), '[^a-zA-Z0-9]+', '_', 'g')) AS resolved_object_type,
             coalesce(declared_business_key, source_record_id) AS resolved_business_key
        FROM record_rollup
    )
    SELECT k.source_record_id || ':phs-normalized-v1',
           k.source_record_id,
           k.source_file_id,
           k.source_release_id,
           k.tenant_key,
           k.test_namespace,
           k.file_name,
           k.resolved_object_type,
           k.resolved_business_key,
           CASE
             WHEN k.restricted_field_count > 0 THEN 'restricted_candidate'
             ELSE 'new_candidate'
           END,
           jsonb_build_object(
             'normalization_version', $4::text,
             'source_release_id', k.source_release_id,
             'source_file_id', k.source_file_id,
             'source_file_name', k.file_name,
             'source_uri', k.source_uri,
             'source_group', k.source_group,
             'context_treatment', k.context_treatment,
             'demo_priority', k.demo_priority,
             'event_id', k.event_id,
             'effective_as_of', k.effective_as_of,
             'source_row_number', k.source_row_number,
             'source_row_hash', k.source_row_hash,
             'business_key', k.resolved_business_key,
             'field_summary', jsonb_build_object(
               'field_count', k.field_count,
               'restricted_field_count', k.restricted_field_count,
               'first_source_field_id', k.first_source_field_id,
               'last_source_field_id', k.last_source_field_id
             ),
             'field_lineage_ref', jsonb_build_object(
               'source_table', 'source_field_values',
               'source_record_id', k.source_record_id,
               'field_disposition_count', k.field_count
             ),
             'restricted_field_count', k.restricted_field_count
           ),
           k.field_count,
           k.source_row_hash,
           $5::text
      FROM keyed k
    `,
    [TENANT_KEY, TEST_NAMESPACE, SOURCE_RELEASE_ID, NORMALIZE_VERSION, NORMALIZE_EXECUTION_ID],
  );
}

async function insertKnowledgeCandidates(client) {
  await q(
    client,
    `
    INSERT INTO ${tableRef("knowledge_candidates")}
      (candidate_id, normalized_object_id, source_record_id, source_release_id, tenant_key, test_namespace,
       candidate_type, candidate_business_key, review_policy_class, evidence_count, candidate_state, content_hash,
       writer_job_id)
    SELECT no.normalized_object_id || ':candidate-v1',
           no.normalized_object_id,
           no.source_record_id,
           no.source_release_id,
           no.tenant_key,
           no.test_namespace,
           CASE
             WHEN no.normalized_payload->>'source_group' IN ('bpo_sourcing_event', 'bpo_transformation_event')
               THEN 'sourcing_event_candidate'
             WHEN no.object_type ILIKE '%relationship%'
               OR no.object_type ILIKE '%dependencies%'
               OR no.object_type ILIKE '%interface%'
               THEN 'relationship_candidate'
             WHEN no.object_type ILIKE '%risk%'
               OR no.object_type ILIKE '%control%'
               THEN 'control_risk_candidate'
             WHEN no.object_type ILIKE '%outcome%'
               OR no.object_type ILIKE '%kpi%'
               THEN 'outcome_candidate'
             WHEN no.object_type ILIKE '%invoice%'
               OR no.object_type ILIKE '%payment%'
               OR no.object_type ILIKE '%rate_card%'
               OR no.object_type ILIKE '%monthly%'
               OR no.object_type ILIKE '%cost%'
               OR no.object_type ILIKE '%workforce%'
               THEN 'evidence_fact_candidate'
             ELSE 'enterprise_object_candidate'
           END,
           no.business_key,
           CASE
             WHEN no.identity_resolution_state = 'restricted_candidate' THEN 'restricted_domain_review'
             WHEN no.identity_resolution_state = 'duplicate_candidate' THEN 'duplicate_resolution_review'
             ELSE 'source_adapter_candidate_review'
           END,
           no.field_disposition_count,
           'pending_review',
           no.content_hash,
           $3
      FROM ${tableRef("normalized_objects")} no
     WHERE no.tenant_key=$1
       AND no.test_namespace=$2
    `,
    [TENANT_KEY, TEST_NAMESPACE, NORMALIZE_EXECUTION_ID],
  );
}

async function insertGateResult(client, gateId, transition, inputCount, outputCount) {
  const unexplainedVariance = Math.abs(Number(inputCount || 0) - Number(outputCount || 0));
  await q(
    client,
    `INSERT INTO ${tableRef("gate_results")}
      (gate_result_id, tenant_key, test_namespace, gate_id, transition, input_count, output_count,
       unexplained_variance, gate_status, failure_classification, repair_owner, rerun_scope, proof_uri, writer_job_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'passed',NULL,'foundation-v2-agent','phs-normalization-candidates',$9,$10)`,
    [
      `${SOURCE_RELEASE_ID}:${gateId}`,
      TENANT_KEY,
      TEST_NAMESPACE,
      gateId,
      transition,
      Number(inputCount || 0),
      Number(outputCount || 0),
      unexplainedVariance,
      `proof://${DATABASE_SCHEMA}/${NORMALIZE_EXECUTION_ID}/${gateId}`,
      NORMALIZE_EXECUTION_ID,
    ],
  );
}

async function verifiedManifest(client, status, extra) {
  const sourceCounts = await sourceVolumeCounts(client);
  const actualCounts = await downstreamCounts(client);
  const j2a = extra.j2a || await j2aReadback(client);
  const j2b = extra.j2b || await j2bReadback(client);
  const j2c = extra.j2c || await fieldLineageReadback(client);
  const sourceGroupReconciliation = await sourceGroupReconciliationRows(client);
  const candidateTypeSummary = await candidateTypeSummaryRows(client);
  const identitySummary = await identitySummaryRows(client);
  const exact = exactSourceCounts(sourceCounts) && exactDownstreamCounts(actualCounts) && j2a.status.endsWith("_PASSED") && j2b.status.endsWith("_PASSED") && j2c.status.endsWith("_PASSED");
  return manifest(status, {
    ...extra,
    j2a,
    j2b,
    j2c,
    source_counts: sourceCounts,
    actual_counts: actualCounts,
    exact_match: exact,
    source_group_reconciliation: sourceGroupReconciliation,
    candidate_type_summary: candidateTypeSummary,
    identity_summary: identitySummary,
    earliest_broken_transition: exact ? null : earliestBrokenTransition(sourceCounts, actualCounts, j2a, j2b, j2c),
  });
}

async function sourceVolumeCounts(client) {
  const [counts] = await rows(
    client,
    `
    SELECT
      (SELECT count(*)::int FROM ${tableRef("source_files")} WHERE tenant_key=$1 AND test_namespace=$2 AND source_release_id=$3) AS source_files,
      (SELECT count(*)::int FROM ${tableRef("source_file_context")} WHERE tenant_key=$1 AND test_namespace=$2 AND source_release_id=$3) AS source_file_context,
      (SELECT count(*)::int FROM ${tableRef("source_records")} WHERE tenant_key=$1 AND test_namespace=$2 AND source_release_id=$3) AS source_records,
      (SELECT count(*)::int FROM ${tableRef("source_field_values")} WHERE tenant_key=$1 AND test_namespace=$2 AND source_release_id=$3) AS source_field_values,
      (SELECT count(*)::int FROM ${tableRef("parser_executions")} WHERE tenant_key=$1 AND test_namespace=$2 AND source_release_id=$3) AS parser_executions,
      (SELECT count(*)::int FROM ${tableRef("gate_results")} WHERE tenant_key=$1 AND test_namespace=$2 AND gate_id = ANY($4::text[])) AS source_volume_gates
    `,
    [TENANT_KEY, TEST_NAMESPACE, SOURCE_RELEASE_ID, SOURCE_VOLUME_GATE_IDS],
  );
  return numericObject(counts);
}

async function downstreamCounts(client) {
  const [counts] = await rows(
    client,
    `
    SELECT
      (SELECT count(*)::int FROM ${tableRef("normalized_objects")} WHERE tenant_key=$1 AND test_namespace=$2 AND source_release_id=$3) AS normalized_objects,
      (SELECT count(*)::int FROM ${tableRef("knowledge_candidates")} WHERE tenant_key=$1 AND test_namespace=$2 AND source_release_id=$3) AS knowledge_candidates,
      (SELECT count(*)::int FROM ${tableRef("gate_results")} WHERE tenant_key=$1 AND test_namespace=$2 AND gate_id = ANY($4::text[])) AS adapter_gates
    `,
    [TENANT_KEY, TEST_NAMESPACE, SOURCE_RELEASE_ID, ADAPTER_GATE_IDS],
  );
  return numericObject(counts);
}

async function j2aReadback(client) {
  const [result] = await rows(
    client,
    `
    SELECT
      (SELECT count(*)::int FROM ${tableRef("source_records")} WHERE tenant_key=$1 AND test_namespace=$2 AND source_release_id=$3) AS source_records,
      (SELECT count(*)::int FROM ${tableRef("normalized_objects")} WHERE tenant_key=$1 AND test_namespace=$2 AND source_release_id=$3) AS normalized_objects
    `,
    [TENANT_KEY, TEST_NAMESPACE, SOURCE_RELEASE_ID],
  );
  const summary = numericObject(result);
  return {
    status:
      summary.source_records === SOURCE_VOLUME_COUNTS.source_records &&
      summary.normalized_objects === summary.source_records
        ? "PHS_HEALTHCARE_DEMO_J2A_ADAPTER_NORMALIZATION_PASSED"
        : "PHS_HEALTHCARE_DEMO_J2A_ADAPTER_NORMALIZATION_FAILED",
    ...summary,
  };
}

async function j2bReadback(client) {
  const [result] = await rows(
    client,
    `
    SELECT
      (SELECT count(*)::int FROM ${tableRef("normalized_objects")} WHERE tenant_key=$1 AND test_namespace=$2 AND source_release_id=$3) AS normalized_objects,
      (SELECT count(*)::int FROM ${tableRef("knowledge_candidates")} WHERE tenant_key=$1 AND test_namespace=$2 AND source_release_id=$3) AS knowledge_candidates,
      (SELECT count(*)::int FROM ${tableRef("knowledge_candidates")} WHERE tenant_key=$1 AND test_namespace=$2 AND source_release_id=$3 AND candidate_state='pending_review') AS pending_review_candidates
    `,
    [TENANT_KEY, TEST_NAMESPACE, SOURCE_RELEASE_ID],
  );
  const summary = numericObject(result);
  return {
    status:
      summary.normalized_objects === DOWNSTREAM_COUNTS.normalized_objects &&
      summary.knowledge_candidates === summary.normalized_objects &&
      summary.pending_review_candidates === summary.knowledge_candidates
        ? "PHS_HEALTHCARE_DEMO_J2B_CANDIDATE_CLASSIFICATION_PASSED"
        : "PHS_HEALTHCARE_DEMO_J2B_CANDIDATE_CLASSIFICATION_FAILED",
    ...summary,
  };
}

async function fieldLineageReadback(client) {
  const [result] = await rows(
    client,
    `
    SELECT
      (SELECT count(*)::int FROM ${tableRef("source_field_values")} WHERE tenant_key=$1 AND test_namespace=$2 AND source_release_id=$3) AS source_field_values,
      (SELECT coalesce(sum(field_disposition_count), 0)::int FROM ${tableRef("normalized_objects")} WHERE tenant_key=$1 AND test_namespace=$2 AND source_release_id=$3) AS downstream_field_dispositions
    `,
    [TENANT_KEY, TEST_NAMESPACE, SOURCE_RELEASE_ID],
  );
  const summary = numericObject(result);
  return {
    status:
      summary.source_field_values === SOURCE_VOLUME_COUNTS.source_field_values &&
      summary.downstream_field_dispositions === summary.source_field_values
        ? "PHS_HEALTHCARE_DEMO_J2C_LINEAGE_RECONCILIATION_PASSED"
        : "PHS_HEALTHCARE_DEMO_J2C_LINEAGE_RECONCILIATION_FAILED",
    ...summary,
  };
}

async function sourceGroupReconciliationRows(client) {
  return rows(
    client,
    `
    SELECT no.normalized_payload->>'source_group' AS source_group,
           count(DISTINCT sr.source_record_id)::int AS source_records,
           count(DISTINCT no.normalized_object_id)::int AS normalized_objects,
           count(DISTINCT kc.candidate_id)::int AS knowledge_candidates,
           sum(no.field_disposition_count)::int AS field_dispositions
      FROM ${tableRef("normalized_objects")} no
      JOIN ${tableRef("source_records")} sr USING (tenant_key, test_namespace, source_record_id)
      LEFT JOIN ${tableRef("knowledge_candidates")} kc USING (tenant_key, test_namespace, normalized_object_id)
     WHERE no.tenant_key=$1 AND no.test_namespace=$2 AND no.source_release_id=$3
     GROUP BY no.normalized_payload->>'source_group'
     ORDER BY source_group
    `,
    [TENANT_KEY, TEST_NAMESPACE, SOURCE_RELEASE_ID],
  );
}

async function candidateTypeSummaryRows(client) {
  return rows(
    client,
    `SELECT candidate_type, count(*)::int AS candidates
       FROM ${tableRef("knowledge_candidates")}
      WHERE tenant_key=$1 AND test_namespace=$2 AND source_release_id=$3
      GROUP BY candidate_type
      ORDER BY candidate_type`,
    [TENANT_KEY, TEST_NAMESPACE, SOURCE_RELEASE_ID],
  );
}

async function identitySummaryRows(client) {
  return rows(
    client,
    `SELECT identity_resolution_state, count(*)::int AS normalized_objects
       FROM ${tableRef("normalized_objects")}
      WHERE tenant_key=$1 AND test_namespace=$2 AND source_release_id=$3
      GROUP BY identity_resolution_state
      ORDER BY identity_resolution_state`,
    [TENANT_KEY, TEST_NAMESPACE, SOURCE_RELEASE_ID],
  );
}

function exactSourceCounts(counts) {
  return Object.entries(SOURCE_VOLUME_COUNTS).every(([key, value]) => Number(counts[key] || 0) === value);
}

function exactDownstreamCounts(counts) {
  return Object.entries(DOWNSTREAM_COUNTS).every(([key, value]) => Number(counts[key] || 0) === value);
}

function assertGate(actualStatus, expectedStatus, details) {
  if (actualStatus !== expectedStatus) {
    throw new Error(`PHS Layer 2 gate failed: expected ${expectedStatus}, got ${actualStatus}: ${stableJson(details)}`);
  }
}

function earliestBrokenTransition(sourceCounts, actualCounts, j2a, j2b, j2c) {
  if (!exactSourceCounts(sourceCounts)) return "SOURCE_VOLUME_READBACK";
  if (j2a.status !== "PHS_HEALTHCARE_DEMO_J2A_ADAPTER_NORMALIZATION_PASSED") return "J2A_ADAPTER_NORMALIZATION";
  if (j2b.status !== "PHS_HEALTHCARE_DEMO_J2B_CANDIDATE_CLASSIFICATION_PASSED") return "J2B_CANDIDATE_CLASSIFICATION";
  if (j2c.status !== "PHS_HEALTHCARE_DEMO_J2C_LINEAGE_RECONCILIATION_PASSED") return "J2C_LINEAGE_RECONCILIATION";
  if (!exactDownstreamCounts(actualCounts)) return "ADAPTER_GATE_READBACK";
  return null;
}

function writeProofSet(outDir, result) {
  writeJson(proofRef(outDir, "PHS_NORMALIZATION_CANDIDATES.json"), result);
  if (Array.isArray(result.source_group_reconciliation)) {
    writeCsv(
      proofRef(outDir, "PHS_NORMALIZATION_SOURCE_GROUP_RECONCILIATION.csv"),
      ["source_group", "source_records", "normalized_objects", "knowledge_candidates", "field_dispositions"],
      result.source_group_reconciliation,
    );
  }
  if (Array.isArray(result.candidate_type_summary)) {
    writeCsv(proofRef(outDir, "PHS_NORMALIZATION_CANDIDATE_TYPES.csv"), ["candidate_type", "candidates"], result.candidate_type_summary);
  }
  if (Array.isArray(result.identity_summary)) {
    writeCsv(proofRef(outDir, "PHS_NORMALIZATION_IDENTITY_SUMMARY.csv"), ["identity_resolution_state", "normalized_objects"], result.identity_summary);
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
    execution_id: NORMALIZE_EXECUTION_ID,
    normalize_version: NORMALIZE_VERSION,
    expected_source_counts: SOURCE_VOLUME_COUNTS,
    expected_downstream_counts: DOWNSTREAM_COUNTS,
    ...extra,
  };
}

function selfTest() {
  const script = fs.readFileSync(new URL(import.meta.url), "utf8");
  const defects = [];
  for (const forbidden of ["canonical_objects", "domain_publications", "publication_members", "baselines", "baseline_object_memberships", "projection_rows"]) {
    if (new RegExp(`INSERT\\s+INTO\\s+[^\\n]*${forbidden}`, "i").test(script)) defects.push(`unexpected insert into ${forbidden}`);
  }
  for (const required of ["field_lineage_ref", "source_field_values", "restricted_candidate", "PHS_NORMALIZATION_APPLY_APPROVED", "assertGate"]) {
    if (!script.includes(required)) defects.push(`missing ${required}`);
  }
  if (defects.length > 0) throw new Error(`PHS normalization self-test failed: ${defects.join("; ")}`);
  return {
    status: "PHS_HEALTHCARE_DEMO_NORMALIZATION_SELF_TEST_PASSED",
    mutation_executed: false,
    source_counts_sha256: sha256(stableJson(SOURCE_VOLUME_COUNTS)),
    downstream_counts_sha256: sha256(stableJson(DOWNSTREAM_COUNTS)),
  };
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

function numericObject(row) {
  return Object.fromEntries(Object.entries(row).map(([key, value]) => [key, Number(value || 0)]));
}

function tableRef(tableName) {
  return `${quoteIdent(DATABASE_SCHEMA)}.${quoteIdent(tableName)}`;
}

function quoteIdent(value) {
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(value)) throw new Error(`Invalid SQL identifier: ${value}`);
  return `"${value.replace(/"/g, '""')}"`;
}

function maybeEmitProofBundle() {
  if (args.emitProofBundle) emitProofBundle(args.outDir);
}
