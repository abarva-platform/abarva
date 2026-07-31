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
const NORMALIZE_EXECUTION_ID = `${SOURCE_RELEASE_ID}:normalization-identity-candidates-v1`;
const NORMALIZE_VERSION = "normalization-identity-candidates-v1";
const GATES = [
  ["F2-HEALTHCARE-J3A-NORMALIZATION", "J3A source rows to normalized records", SOURCE_VOLUME_COUNTS.source_records, SOURCE_VOLUME_COUNTS.source_records],
  ["F2-HEALTHCARE-J3B-IDENTITY", "J3B normalized records to classified identities", SOURCE_VOLUME_COUNTS.source_records, SOURCE_VOLUME_COUNTS.source_records],
  ["F2-HEALTHCARE-J3C-RELATIONSHIPS", "J3C relationship source rows to classified relationship candidates", null, null],
  ["F2-HEALTHCARE-J4-CANDIDATES", "J4 normalized records to knowledge candidates", SOURCE_VOLUME_COUNTS.source_records, SOURCE_VOLUME_COUNTS.source_records],
];
const SOURCE_VOLUME_GATE_IDS = ["F2-SOURCE-VOLUME-L0-L1", "F2-SOURCE-VOLUME-L1-L2"];
const PRIMARY_KEY_BY_FILE = {
  "application-platform-inventory.csv": "application_id",
  "assumptions-register.csv": "assumption_id",
  "bafo-questions.csv": "bafo_question_id",
  "bafo-responses.csv": "bafo_response_id",
  "bi-report-catalog.csv": "report_id",
  "business-process-nodes.csv": "process_id",
  "change-orders.csv": "change_order_id",
  "cloud-infrastructure-inventory.csv": "infra_id",
  "conflicts-moderation.csv": "moderation_id",
  "control-catalog.csv": "control_id",
  "data-analytics-ai-landscape.csv": "data_product_id",
  "epic-module-environment-inventory.csv": "epic_asset_id",
  "evaluation-criteria.csv": "criteria_id",
  "evaluator-scores.csv": "score_id",
  "exceptions-register.csv": "exception_id",
  "executive-decisions.csv": "decision_id",
  "incidents-tickets.csv": "incident_id",
  "interface-feed-inventory.csv": "interface_id",
  "invoice-lines.csv": "invoice_line_id",
  "kpi-stars-hedis-catalog.csv": "kpi_id",
  "pricing-lines.csv": "pricing_line_id",
  "procurement-proposal-evidence.csv": "proposal_id",
  "program-portfolio.csv": "program_id",
  "proposal-facts.csv": "fact_id",
  "proposal-requirements.csv": "requirement_id",
  "proposal-responses.csv": "response_id",
  "rate-cards.csv": "rate_card_id",
  "reconstruction-ledger.csv": "truth_object_id",
  "relationship-load-template.csv": "relationship_id",
  "revised-pricing.csv": "revised_pricing_id",
  "risk-register.csv": "risk_id",
  "service-volume-baseline.csv": "volume_id",
  "sla-observations.csv": "sla_observation_id",
  "sql-server-analytics-estate.csv": "sql_asset_id",
  "staffing-pyramids.csv": "staffing_id",
  "technology-workforce-roster.csv": "workforce_id",
  "transition-commitments.csv": "transition_commitment_id",
  "value-commitments.csv": "value_commitment_id",
  "vendor-contract-register.csv": "contract_id",
  "vendor-register.csv": "vendor_id",
};

const args = parseArgs(process.argv.slice(2));

await main().catch((error) => {
  console.error(
    JSON.stringify(
      {
        status: "HEALTHCARE_FOUNDATION_V2_NORMALIZATION_IDENTITY_AND_CANDIDATES_FAILED",
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
    writeJson(proofRef(args.outDir, "HEALTHCARE_NORMALIZE_CANDIDATES_SELF_TEST.json"), result);
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  const { Client } = await import("pg");
  const client = new Client(await foundationPostgresClientOptions("foundation-v2-healthcare-normalize-candidates"));
  bindFoundationV2SqlContext(client);
  await client.connect();
  try {
    if (args.mode === "preflight") {
      const result = await preflight(client);
      writeProofSet(args.outDir, result);
      console.log(JSON.stringify(result, null, 2));
      maybeEmitProofBundle();
      if (result.status !== "HEALTHCARE_FOUNDATION_V2_NORMALIZATION_PREFLIGHT_PASSED") process.exitCode = 1;
      return;
    }
    if (args.mode === "verify") {
      const result = await verify(client);
      writeProofSet(args.outDir, result);
      console.log(JSON.stringify(result, null, 2));
      maybeEmitProofBundle();
      if (result.status !== "HEALTHCARE_FOUNDATION_V2_NORMALIZATION_IDENTITY_AND_CANDIDATES_VERIFIED") process.exitCode = 1;
      return;
    }
    if (args.mode !== "apply") throw new Error(`Unsupported mode ${args.mode}`);
    const result = await apply(client);
    writeProofSet(args.outDir, result);
    console.log(JSON.stringify(result, null, 2));
    maybeEmitProofBundle();
    if (result.status !== "HEALTHCARE_FOUNDATION_V2_NORMALIZATION_IDENTITY_AND_CANDIDATES_VERIFIED") process.exitCode = 1;
  } finally {
    await client.end();
  }
}

function parseArgs(argv) {
  const parsed = {
    mode: process.env.FOUNDATION_V2_NORMALIZE_MODE || "preflight",
    outDir: process.env.FOUNDATION_V2_NORMALIZE_OUT_DIR || path.join(os.tmpdir(), "healthcare-normalize-candidates"),
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
    const existingCounts = await downstreamCounts(client);
    await client.query("ROLLBACK");
    const sourceReady = exactSourceCounts(sourceCounts);
    const existingExact = exactDownstreamCounts(existingCounts);
    const existingTotal = Object.values(existingCounts).reduce((sum, value) => sum + Number(value || 0), 0);
    const status =
      sourceReady && (existingTotal === 0 || existingExact)
        ? "HEALTHCARE_FOUNDATION_V2_NORMALIZATION_PREFLIGHT_PASSED"
        : "HEALTHCARE_FOUNDATION_V2_NORMALIZATION_PREFLIGHT_FAILED";
    return manifest(status, {
      source_counts: sourceCounts,
      source_exact_match: sourceReady,
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
  const startedAt = new Date().toISOString();
  await client.query("BEGIN");
  try {
    await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [`foundation-v2:${TENANT_KEY}:${TEST_NAMESPACE}:normalize-candidates`]);
    await setContext(client, WRITER_ROLE);
    const sourceCounts = await sourceVolumeCounts(client);
    if (!exactSourceCounts(sourceCounts)) throw new Error(`Source-volume counts are not verified: ${JSON.stringify(sourceCounts)}`);
    const existingCounts = await downstreamCounts(client);
    const existingTotal = Object.values(existingCounts).reduce((sum, value) => sum + Number(value || 0), 0);
    if (existingTotal > 0) {
      if (!exactDownstreamCounts(existingCounts)) {
        throw new Error(`Existing normalization/candidate rows do not match expected counts: ${JSON.stringify(existingCounts)}`);
      }
      await client.query("ROLLBACK");
      return await verifiedManifest(client, "HEALTHCARE_FOUNDATION_V2_NORMALIZATION_IDENTITY_AND_CANDIDATES_ALREADY_VERIFIED", {
        started_at: startedAt,
        completed_at: new Date().toISOString(),
        source_counts: sourceCounts,
        actual_counts: existingCounts,
      });
    }

    await insertNormalizedObjects(client);
    const j3a = await j3aReadback(client);
    assertGate(j3a.status, "HEALTHCARE_FOUNDATION_V2_J3A_NORMALIZATION_PASSED", j3a);
    await insertGateResult(client, GATES[0][0], GATES[0][1], j3a.source_records, j3a.normalized_objects);

    const j3b = await j3bReadback(client);
    assertGate(j3b.status, "HEALTHCARE_FOUNDATION_V2_J3B_IDENTITY_RESOLUTION_PASSED", j3b);
    await insertGateResult(client, GATES[1][0], GATES[1][1], j3b.normalized_objects, j3b.classified_identities);

    const j3c = await j3cReadback(client);
    assertGate(j3c.status, "HEALTHCARE_FOUNDATION_V2_J3C_RELATIONSHIP_RESOLUTION_PASSED", j3c);
    await insertGateResult(client, GATES[2][0], GATES[2][1], j3c.relationship_source_rows, j3c.relationship_classified_rows);

    await insertCandidates(client);
    const j4 = await j4Readback(client);
    assertGate(j4.status, "HEALTHCARE_FOUNDATION_V2_J4_CANDIDATE_GENERATION_PASSED", j4);
    await insertGateResult(client, GATES[3][0], GATES[3][1], j4.normalized_objects, j4.knowledge_candidates);

    const result = await verifiedManifest(client, "HEALTHCARE_FOUNDATION_V2_NORMALIZATION_IDENTITY_AND_CANDIDATES_VERIFIED", {
      started_at: startedAt,
      completed_at: new Date().toISOString(),
      source_counts: sourceCounts,
      j3a,
      j3b,
      j3c,
      j4,
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
    const result = await verifiedManifest(client, "HEALTHCARE_FOUNDATION_V2_NORMALIZATION_IDENTITY_AND_CANDIDATES_VERIFIED", {});
    await client.query("ROLLBACK");
    if (!result.exact_match) {
      result.status = "HEALTHCARE_FOUNDATION_V2_NORMALIZATION_IDENTITY_AND_CANDIDATES_VERIFY_FAILED";
    }
    return result;
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  }
}

async function verifiedManifest(client, status, extra) {
  const sourceCounts = await sourceVolumeCounts(client);
  const actualCounts = await downstreamCounts(client);
  const familyReconciliation = await sourceFamilyReconciliation(client);
  const fieldReconciliation = await fieldDispositionReconciliation(client);
  const businessKeyReconciliation = await businessKeyReconciliation(client);
  const identityClassifications = await identityClassificationSummary(client);
  const relationshipReconciliation = await relationshipResolutionSummary(client);
  const exact = exactSourceCounts(sourceCounts) && exactDownstreamCounts(actualCounts) && fieldReconciliation.exact_match;
  return manifest(status, {
    ...extra,
    source_counts: sourceCounts,
    actual_counts: actualCounts,
    exact_match: exact,
    family_reconciliation: familyReconciliation,
    field_reconciliation: fieldReconciliation,
    business_key_reconciliation: businessKeyReconciliation,
    identity_classifications: identityClassifications,
    relationship_reconciliation: relationshipReconciliation,
    earliest_broken_transition: exact ? null : earliestBrokenTransition(sourceCounts, actualCounts, fieldReconciliation),
  });
}

async function insertNormalizedObjects(client) {
  await q(
    client,
    `
    INSERT INTO foundation_v2.normalized_objects
      (normalized_object_id, source_record_id, tenant_key, test_namespace, object_type, business_key,
       identity_resolution_state, normalized_payload, content_hash, writer_job_id)
    WITH field_rollup AS (
      SELECT sr.source_record_id,
             sr.source_file_id,
             sr.source_release_id,
             sr.tenant_key,
             sr.test_namespace,
             sr.source_row_number,
             sr.source_row_hash,
             sf.file_name,
             sf.source_uri,
             ${fileObjectTypeSql("sf.file_name")} AS object_type,
             ${primaryKeyNameSql("sf.file_name")} AS primary_key_name,
             nullif(max(sfv.normalized_value) FILTER (WHERE sfv.source_field_name = ${primaryKeyNameSql("sf.file_name")}), '') AS declared_business_key,
             jsonb_object_agg(sfv.source_field_name, sfv.normalized_value ORDER BY sfv.source_field_id) AS row_fields,
             jsonb_agg(
               jsonb_build_object(
                 'source_field_value_id', sfv.source_field_value_id,
                 'source_field_name', sfv.source_field_name,
                 'downstream_disposition',
                   CASE
                     WHEN sfv.source_field_name = ${primaryKeyNameSql("sf.file_name")} THEN 'USED_AS_BUSINESS_KEY'
                     WHEN sfv.source_field_name IN ('from_source_native_id','to_source_native_id','from_application_id','to_application_id','relationship_type') THEN 'USED_AS_RELATIONSHIP_KEY'
                     ELSE 'PRESERVED_IN_NORMALIZED_PAYLOAD'
                   END
               )
               ORDER BY sfv.source_field_id
             ) AS field_dispositions,
             count(*)::int AS field_count
        FROM foundation_v2.source_records sr
        JOIN foundation_v2.source_files sf USING (tenant_key, test_namespace, source_file_id)
        JOIN foundation_v2.source_field_values sfv USING (tenant_key, test_namespace, source_record_id)
       WHERE sr.tenant_key=$1
         AND sr.test_namespace=$2
         AND sr.source_release_id=$3
       GROUP BY sr.source_record_id, sr.source_file_id, sr.source_release_id, sr.tenant_key, sr.test_namespace,
                sr.source_row_number, sr.source_row_hash, sf.file_name, sf.source_uri
    ),
    key_inventory AS (
      SELECT object_type, declared_business_key AS business_key, count(*)::int AS key_count
        FROM field_rollup
       WHERE declared_business_key IS NOT NULL
       GROUP BY object_type, declared_business_key
    ),
    relationship_rollup AS (
      SELECT fr.source_record_id,
             CASE
               WHEN fr.file_name = 'relationship-load-template.csv' THEN fr.row_fields->>'from_source_native_id'
               WHEN fr.file_name = 'interface-feed-inventory.csv' THEN fr.row_fields->>'from_application_id'
               ELSE NULL
             END AS from_key,
             CASE
               WHEN fr.file_name = 'relationship-load-template.csv' THEN fr.row_fields->>'to_source_native_id'
               WHEN fr.file_name = 'interface-feed-inventory.csv' THEN fr.row_fields->>'to_application_id'
               ELSE NULL
             END AS to_key
        FROM field_rollup fr
       WHERE fr.file_name IN ('relationship-load-template.csv', 'interface-feed-inventory.csv')
    ),
    relationship_state AS (
      SELECT rr.source_record_id,
             rr.from_key,
             rr.to_key,
             coalesce((SELECT sum(key_count)::int FROM key_inventory WHERE business_key = rr.from_key), 0) AS from_match_count,
             coalesce((SELECT sum(key_count)::int FROM key_inventory WHERE business_key = rr.to_key), 0) AS to_match_count
        FROM relationship_rollup rr
    ),
    classified AS (
      SELECT fr.*,
             coalesce(ki.key_count, 0) AS business_key_match_count,
             rs.from_key,
             rs.to_key,
             coalesce(rs.from_match_count, 0) AS relationship_from_match_count,
             coalesce(rs.to_match_count, 0) AS relationship_to_match_count,
             CASE
               WHEN fr.declared_business_key IS NULL THEN 'unresolved_business_key'
               WHEN fr.file_name IN ('relationship-load-template.csv', 'interface-feed-inventory.csv')
                    AND (coalesce(rs.from_match_count, 0) = 0 OR coalesce(rs.to_match_count, 0) = 0) THEN 'orphan_endpoint'
               WHEN fr.file_name IN ('relationship-load-template.csv', 'interface-feed-inventory.csv')
                    AND (coalesce(rs.from_match_count, 0) > 1 OR coalesce(rs.to_match_count, 0) > 1) THEN 'ambiguous_endpoint'
               WHEN coalesce(ki.key_count, 0) > 1 THEN 'duplicate_business_key'
               ELSE 'candidate_identity'
             END AS downstream_row_disposition
        FROM field_rollup fr
        LEFT JOIN key_inventory ki
          ON ki.object_type = fr.object_type
         AND ki.business_key = fr.declared_business_key
        LEFT JOIN relationship_state rs USING (source_record_id)
    )
    SELECT source_record_id || ':normalized-v1',
           source_record_id,
           tenant_key,
           test_namespace,
           object_type,
           coalesce(declared_business_key, source_record_id),
           CASE
             WHEN downstream_row_disposition = 'unresolved_business_key' THEN 'rejected'
             WHEN downstream_row_disposition IN ('orphan_endpoint', 'ambiguous_endpoint') THEN 'orphan_endpoint'
             WHEN downstream_row_disposition = 'duplicate_business_key' THEN 'duplicate_candidate'
             ELSE 'new_candidate'
           END,
           jsonb_build_object(
             'normalization_version', $4::text,
             'source_release_id', source_release_id,
             'source_file_id', source_file_id,
             'source_file_name', file_name,
             'source_uri', source_uri,
             'source_row_number', source_row_number,
             'source_row_hash', source_row_hash,
             'primary_key_name', primary_key_name,
             'declared_business_key', declared_business_key,
             'downstream_row_disposition', downstream_row_disposition,
             'field_count', field_count,
             'fields', row_fields,
             'field_dispositions', field_dispositions,
             'relationship_resolution', jsonb_build_object(
               'from_key', from_key,
               'to_key', to_key,
               'from_match_count', relationship_from_match_count,
               'to_match_count', relationship_to_match_count
             )
           ),
           source_row_hash,
           $5::text
      FROM classified
    `,
    [TENANT_KEY, TEST_NAMESPACE, SOURCE_RELEASE_ID, NORMALIZE_VERSION, NORMALIZE_EXECUTION_ID],
  );
}

async function insertCandidates(client) {
  await q(
    client,
    `
    INSERT INTO foundation_v2.knowledge_candidates
      (candidate_id, normalized_object_id, tenant_key, test_namespace, candidate_type, candidate_business_key,
       review_policy_class, evidence_count, candidate_state, content_hash, writer_job_id)
    SELECT no.normalized_object_id || ':candidate-v1',
           no.normalized_object_id,
           no.tenant_key,
           no.test_namespace,
           CASE
             WHEN no.normalized_payload->>'downstream_row_disposition' IN ('orphan_endpoint', 'ambiguous_endpoint') THEN 'relationship_candidate'
             WHEN no.object_type IN ('relationship_load_template', 'interface_feed_inventory') THEN 'relationship_candidate'
             WHEN no.object_type IN ('invoice_lines', 'pricing_lines', 'rate_cards', 'revised_pricing', 'service_volume_baseline', 'sla_observations',
                                     'evaluator_scores', 'proposal_facts', 'proposal_responses', 'transition_commitments', 'value_commitments',
                                     'staffing_pyramids', 'change_orders', 'bafo_responses', 'executive_decisions') THEN 'evidence_fact_candidate'
             WHEN no.object_type IN ('risk_register', 'control_catalog', 'conflicts_moderation', 'exceptions_register', 'incidents_tickets') THEN 'control_risk_candidate'
             ELSE 'enterprise_object_candidate'
           END,
           no.business_key,
           CASE
             WHEN no.identity_resolution_state = 'duplicate_candidate' THEN 'duplicate_resolution_review'
             WHEN no.identity_resolution_state IN ('orphan_endpoint', 'rejected') THEN 'unresolved_identity_review'
             ELSE 'source_volume_candidate_review'
           END,
           coalesce((no.normalized_payload->>'field_count')::int, 0),
           'pending_review',
           no.content_hash,
           $3
      FROM foundation_v2.normalized_objects no
     WHERE no.tenant_key=$1
       AND no.test_namespace=$2
    `,
    [TENANT_KEY, TEST_NAMESPACE, NORMALIZE_EXECUTION_ID],
  );
}

async function insertGateResult(client, gateId, transition, inputCount, outputCount) {
  const unexplainedVariance = Number(inputCount || 0) - Number(outputCount || 0);
  await q(
    client,
    `INSERT INTO foundation_v2.gate_results
      (gate_result_id, tenant_key, test_namespace, gate_id, transition, input_count, output_count,
       unexplained_variance, gate_status, failure_classification, repair_owner, rerun_scope, proof_uri, writer_job_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'passed',NULL,'foundation-v2-agent','normalization-identity-candidates',$9,$10)`,
    [
      `${SOURCE_RELEASE_ID}:${gateId}`,
      TENANT_KEY,
      TEST_NAMESPACE,
      gateId,
      transition,
      Number(inputCount || 0),
      Number(outputCount || 0),
      unexplainedVariance,
      `proof://foundation-v2/${NORMALIZE_EXECUTION_ID}/${gateId}`,
      NORMALIZE_EXECUTION_ID,
    ],
  );
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

async function downstreamCounts(client) {
  const [counts] = await rows(
    client,
    `
    SELECT
      (SELECT count(*)::int FROM foundation_v2.normalized_objects WHERE tenant_key=$1 AND test_namespace=$2) AS normalized_objects,
      (SELECT count(*)::int FROM foundation_v2.knowledge_candidates WHERE tenant_key=$1 AND test_namespace=$2) AS knowledge_candidates,
      (SELECT count(*)::int FROM foundation_v2.gate_results WHERE tenant_key=$1 AND test_namespace=$2 AND gate_id = ANY($3::text[])) AS normalization_gates
    `,
    [TENANT_KEY, TEST_NAMESPACE, GATES.map(([gateId]) => gateId)],
  );
  return numericObject(counts);
}

async function j3aReadback(client) {
  const [result] = await rows(
    client,
    `
    SELECT
      (SELECT count(*)::int FROM foundation_v2.source_records WHERE tenant_key=$1 AND test_namespace=$2 AND source_release_id=$3) AS source_records,
      (SELECT count(*)::int FROM foundation_v2.normalized_objects WHERE tenant_key=$1 AND test_namespace=$2) AS normalized_objects
    `,
    [TENANT_KEY, TEST_NAMESPACE, SOURCE_RELEASE_ID],
  );
  const summary = numericObject(result);
  return {
    status:
      summary.source_records === SOURCE_VOLUME_COUNTS.source_records && summary.normalized_objects === summary.source_records
        ? "HEALTHCARE_FOUNDATION_V2_J3A_NORMALIZATION_PASSED"
        : "HEALTHCARE_FOUNDATION_V2_J3A_NORMALIZATION_FAILED",
    ...summary,
  };
}

async function j3bReadback(client) {
  const [result] = await rows(
    client,
    `
    SELECT count(*)::int AS normalized_objects,
           count(*) FILTER (WHERE identity_resolution_state IN ('new_candidate','duplicate_candidate','orphan_endpoint','rejected'))::int AS classified_identities,
           count(*) FILTER (WHERE identity_resolution_state = 'rejected')::int AS unresolved_records,
           count(*) FILTER (WHERE identity_resolution_state = 'duplicate_candidate')::int AS duplicate_records,
           count(*) FILTER (WHERE identity_resolution_state = 'orphan_endpoint')::int AS ambiguous_or_orphan_relationship_records
      FROM foundation_v2.normalized_objects
     WHERE tenant_key=$1 AND test_namespace=$2
    `,
    [TENANT_KEY, TEST_NAMESPACE],
  );
  const summary = numericObject(result);
  return {
    status:
      summary.normalized_objects === SOURCE_VOLUME_COUNTS.source_records &&
      summary.classified_identities === summary.normalized_objects
        ? "HEALTHCARE_FOUNDATION_V2_J3B_IDENTITY_RESOLUTION_PASSED"
        : "HEALTHCARE_FOUNDATION_V2_J3B_IDENTITY_RESOLUTION_FAILED",
    ...summary,
  };
}

async function j3cReadback(client) {
  const [result] = await rows(
    client,
    `
    SELECT count(*) FILTER (WHERE sf.file_name IN ('relationship-load-template.csv','interface-feed-inventory.csv'))::int AS relationship_source_rows,
           count(*) FILTER (
             WHERE sf.file_name IN ('relationship-load-template.csv','interface-feed-inventory.csv')
               AND no.normalized_payload ? 'relationship_resolution'
           )::int AS relationship_classified_rows,
           count(*) FILTER (
             WHERE sf.file_name IN ('relationship-load-template.csv','interface-feed-inventory.csv')
               AND no.normalized_payload->>'downstream_row_disposition' = 'candidate_identity'
           )::int AS resolved_relationship_rows,
           count(*) FILTER (
             WHERE sf.file_name IN ('relationship-load-template.csv','interface-feed-inventory.csv')
               AND no.normalized_payload->>'downstream_row_disposition' IN ('orphan_endpoint','ambiguous_endpoint')
           )::int AS unresolved_or_ambiguous_relationship_rows
      FROM foundation_v2.source_records sr
      JOIN foundation_v2.source_files sf USING (tenant_key, test_namespace, source_file_id)
      JOIN foundation_v2.normalized_objects no USING (tenant_key, test_namespace, source_record_id)
     WHERE sr.tenant_key=$1 AND sr.test_namespace=$2 AND sr.source_release_id=$3
    `,
    [TENANT_KEY, TEST_NAMESPACE, SOURCE_RELEASE_ID],
  );
  const summary = numericObject(result);
  return {
    status:
      summary.relationship_source_rows === summary.relationship_classified_rows
        ? "HEALTHCARE_FOUNDATION_V2_J3C_RELATIONSHIP_RESOLUTION_PASSED"
        : "HEALTHCARE_FOUNDATION_V2_J3C_RELATIONSHIP_RESOLUTION_FAILED",
    ...summary,
  };
}

async function j4Readback(client) {
  const [result] = await rows(
    client,
    `
    SELECT
      (SELECT count(*)::int FROM foundation_v2.normalized_objects WHERE tenant_key=$1 AND test_namespace=$2) AS normalized_objects,
      (SELECT count(*)::int FROM foundation_v2.knowledge_candidates WHERE tenant_key=$1 AND test_namespace=$2) AS knowledge_candidates,
      (SELECT count(*)::int FROM foundation_v2.knowledge_candidates WHERE tenant_key=$1 AND test_namespace=$2 AND candidate_state='pending_review') AS pending_review_candidates
    `,
    [TENANT_KEY, TEST_NAMESPACE],
  );
  const summary = numericObject(result);
  return {
    status:
      summary.normalized_objects === SOURCE_VOLUME_COUNTS.source_records &&
      summary.knowledge_candidates === summary.normalized_objects &&
      summary.pending_review_candidates === summary.knowledge_candidates
        ? "HEALTHCARE_FOUNDATION_V2_J4_CANDIDATE_GENERATION_PASSED"
        : "HEALTHCARE_FOUNDATION_V2_J4_CANDIDATE_GENERATION_FAILED",
    ...summary,
  };
}

async function sourceFamilyReconciliation(client) {
  return rows(
    client,
    `
    SELECT sf.file_name,
           ${fileObjectTypeSql("sf.file_name")} AS source_family,
           count(DISTINCT sr.source_record_id)::int AS source_records,
           count(DISTINCT no.normalized_object_id)::int AS normalized_objects,
           count(DISTINCT kc.candidate_id)::int AS knowledge_candidates,
           count(sfv.source_field_value_id)::int AS source_field_values
      FROM foundation_v2.source_files sf
      JOIN foundation_v2.source_records sr USING (tenant_key, test_namespace, source_file_id)
      JOIN foundation_v2.source_field_values sfv USING (tenant_key, test_namespace, source_record_id)
      LEFT JOIN foundation_v2.normalized_objects no USING (tenant_key, test_namespace, source_record_id)
      LEFT JOIN foundation_v2.knowledge_candidates kc USING (tenant_key, test_namespace, normalized_object_id)
     WHERE sf.tenant_key=$1
       AND sf.test_namespace=$2
       AND sf.source_release_id=$3
     GROUP BY sf.file_name
     ORDER BY sf.file_name
    `,
    [TENANT_KEY, TEST_NAMESPACE, SOURCE_RELEASE_ID],
  );
}

async function fieldDispositionReconciliation(client) {
  const [result] = await rows(
    client,
    `
    SELECT
      (SELECT count(*)::int FROM foundation_v2.source_field_values WHERE tenant_key=$1 AND test_namespace=$2 AND source_release_id=$3) AS source_field_values,
      (SELECT coalesce(sum(jsonb_array_length(normalized_payload->'field_dispositions')),0)::int
         FROM foundation_v2.normalized_objects
        WHERE tenant_key=$1 AND test_namespace=$2) AS downstream_field_dispositions
    `,
    [TENANT_KEY, TEST_NAMESPACE, SOURCE_RELEASE_ID],
  );
  const summary = numericObject(result);
  summary.exact_match = summary.source_field_values === summary.downstream_field_dispositions;
  return summary;
}

async function businessKeyReconciliation(client) {
  return rows(
    client,
    `
    SELECT object_type,
           count(*)::int AS normalized_objects,
           count(DISTINCT business_key)::int AS distinct_business_keys,
           count(*) FILTER (WHERE business_key = source_record_id)::int AS fallback_source_record_keys,
           count(*) FILTER (WHERE identity_resolution_state = 'duplicate_candidate')::int AS duplicate_candidate_rows,
           count(*) FILTER (WHERE identity_resolution_state = 'rejected')::int AS unresolved_business_key_rows
      FROM foundation_v2.normalized_objects
     WHERE tenant_key=$1 AND test_namespace=$2
     GROUP BY object_type
     ORDER BY object_type
    `,
    [TENANT_KEY, TEST_NAMESPACE],
  );
}

async function identityClassificationSummary(client) {
  return rows(
    client,
    `
    SELECT identity_resolution_state, count(*)::int AS records
      FROM foundation_v2.normalized_objects
     WHERE tenant_key=$1 AND test_namespace=$2
     GROUP BY identity_resolution_state
     ORDER BY identity_resolution_state
    `,
    [TENANT_KEY, TEST_NAMESPACE],
  );
}

async function relationshipResolutionSummary(client) {
  return rows(
    client,
    `
    SELECT no.normalized_payload->>'downstream_row_disposition' AS relationship_disposition,
           count(*)::int AS rows
      FROM foundation_v2.normalized_objects no
      JOIN foundation_v2.source_records sr USING (tenant_key, test_namespace, source_record_id)
      JOIN foundation_v2.source_files sf USING (tenant_key, test_namespace, source_file_id)
     WHERE no.tenant_key=$1
       AND no.test_namespace=$2
       AND sf.file_name IN ('relationship-load-template.csv','interface-feed-inventory.csv')
     GROUP BY no.normalized_payload->>'downstream_row_disposition'
     ORDER BY relationship_disposition
    `,
    [TENANT_KEY, TEST_NAMESPACE],
  );
}

function exactSourceCounts(counts) {
  return Object.entries(SOURCE_VOLUME_COUNTS).every(([key, value]) => Number(counts[key] || 0) === value);
}

function exactDownstreamCounts(counts) {
  return (
    Number(counts.normalized_objects || 0) === SOURCE_VOLUME_COUNTS.source_records &&
    Number(counts.knowledge_candidates || 0) === SOURCE_VOLUME_COUNTS.source_records &&
    Number(counts.normalization_gates || 0) === GATES.length
  );
}

function earliestBrokenTransition(sourceCounts, actualCounts, fieldReconciliation) {
  if (!exactSourceCounts(sourceCounts)) return "SOURCE_VOLUME_READBACK";
  if (Number(actualCounts.normalized_objects || 0) !== SOURCE_VOLUME_COUNTS.source_records) return "J3A_NORMALIZATION";
  if (!fieldReconciliation.exact_match) return "J3A_FIELD_DISPOSITIONS";
  if (Number(actualCounts.knowledge_candidates || 0) !== SOURCE_VOLUME_COUNTS.source_records) return "J4_CANDIDATE_GENERATION";
  if (Number(actualCounts.normalization_gates || 0) !== GATES.length) return "J3_J4_GATE_RESULTS";
  return null;
}

function writeProofSet(outDir, result) {
  writeJson(proofRef(outDir, "HEALTHCARE_NORMALIZATION_IDENTITY_CANDIDATES.json"), result);
  if (Array.isArray(result.family_reconciliation)) {
    writeCsv(
      proofRef(outDir, "HEALTHCARE_NORMALIZATION_FAMILY_RECONCILIATION.csv"),
      ["file_name", "source_family", "source_records", "normalized_objects", "knowledge_candidates", "source_field_values"],
      result.family_reconciliation,
    );
  }
  if (Array.isArray(result.business_key_reconciliation)) {
    writeCsv(
      proofRef(outDir, "HEALTHCARE_NORMALIZATION_BUSINESS_KEYS.csv"),
      ["object_type", "normalized_objects", "distinct_business_keys", "fallback_source_record_keys", "duplicate_candidate_rows", "unresolved_business_key_rows"],
      result.business_key_reconciliation,
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
    execution_id: NORMALIZE_EXECUTION_ID,
    normalize_version: NORMALIZE_VERSION,
    expected_counts: SOURCE_VOLUME_COUNTS,
    expected_normalized_objects: SOURCE_VOLUME_COUNTS.source_records,
    expected_knowledge_candidates: SOURCE_VOLUME_COUNTS.source_records,
    expected_normalization_gates: GATES.length,
    ...extra,
  };
}

function runSelfTest() {
  const script = fs.readFileSync(new URL(import.meta.url), "utf8");
  const forbiddenWrites = ["canonical_objects", "domain_publications", "publication_members", "baselines", "baseline_object_memberships"];
  const defects = [];
  for (const table of forbiddenWrites) {
    if (new RegExp(`INSERT\\s+INTO\\s+foundation_v2\\.${table}`, "i").test(script)) defects.push(`unexpected insert into ${table}`);
  }
  for (const fileName of Object.keys(PRIMARY_KEY_BY_FILE)) {
    if (!script.includes(fileName)) defects.push(`missing primary-key mapping for ${fileName}`);
  }
  if (!script.includes("field_dispositions")) defects.push("missing explicit field disposition payload");
  if (!script.includes("downstream_row_disposition")) defects.push("missing explicit row disposition payload");
  if (!script.includes("$4::text")) defects.push("missing explicit normalization-version SQL cast");
  if (!script.includes("HEALTHCARE_FOUNDATION_V2_NORMALIZATION_IDENTITY_AND_CANDIDATES_VERIFIED")) {
    defects.push("missing terminal status");
  }
  if (defects.length > 0) throw new Error(`Self-test failed: ${defects.join("; ")}`);
  return {
    status: "HEALTHCARE_FOUNDATION_V2_NORMALIZATION_SELF_TEST_PASSED",
    forbidden_canonical_writes_checked: forbiddenWrites,
    primary_key_mappings: Object.keys(PRIMARY_KEY_BY_FILE).length,
    source_volume_expected_counts_sha256: sha256(stableJson(SOURCE_VOLUME_COUNTS)),
  };
}

function fileObjectTypeSql(fileNameExpression) {
  return `regexp_replace(regexp_replace(${fileNameExpression}, '\\.csv$', ''), '[^a-zA-Z0-9]+', '_', 'g')`;
}

function primaryKeyNameSql(fileNameExpression) {
  const cases = Object.entries(PRIMARY_KEY_BY_FILE)
    .map(([fileName, primaryKey]) => `WHEN ${fileNameExpression} = ${quoteLiteral(fileName)} THEN ${quoteLiteral(primaryKey)}`)
    .join(" ");
  return `(CASE ${cases} ELSE 'source_record_id' END)`;
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

function quoteLiteral(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}

function maybeEmitProofBundle() {
  if (args.emitProofBundle) emitProofBundle(args.outDir);
}
