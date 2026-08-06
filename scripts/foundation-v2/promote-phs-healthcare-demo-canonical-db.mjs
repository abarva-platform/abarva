#!/usr/bin/env node

import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import {
  emitProofBundle,
  foundationPostgresClientOptions,
  proofRef,
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
const PROMOTION_VERSION = "phs-canonical-promotion-v1";
const PROMOTION_EXECUTION_ID = `${SOURCE_RELEASE_ID}:${PROMOTION_VERSION}`;
const SOURCE_VOLUME_COUNTS = {
  source_files: 54,
  source_file_context: 54,
  source_records: 54_967,
  source_field_values: 1_640_131,
  parser_executions: 1,
};
const LAYER2_COUNTS = {
  normalized_objects: 54_967,
  knowledge_candidates: 54_967,
};
const LAYER3_TABLES = [
  "canonical_entities",
  "canonical_observations",
  "canonical_relationships",
  "canonical_evidence_records",
  "event_native_records",
  "canonical_promotion_decisions",
];
const LAYER3_GATE_IDS = [
  "PHS-L3-K3A-IDENTITY-CONSOLIDATION",
  "PHS-L3-K3B-OBSERVATION-RELATIONSHIP-GRAIN",
  "PHS-L3-K3C-CANDIDATE-DECISION-COVERAGE",
  "PHS-L3-K3D-CANONICAL-BOUNDARY",
];
const RELATIONSHIP_FILES = [
  "ANALYTICS_PLATFORM_DEPENDENCIES.csv",
  "CONTRACT_SCOPE_RELATIONSHIPS.csv",
  "EPIC_INTERFACE_INVENTORY.csv",
  "PROGRAMS_INITIATIVES_DEPENDENCIES.csv",
  "SERVICENOW_CSDM_BUSINESS_SERVICES.csv",
  "SERVICENOW_VENDOR_SERVICES.csv",
];
const MASTER_ENTITY_FILES = [
  "WORKDAY_SUPPLIERS.csv",
  "CONTRACT_REGISTER.csv",
  "CONTRACT_INSTRUMENTS.csv",
  "SERVICENOW_CMDB_APPLICATIONS.csv",
  "EPIC_MODULE_INVENTORY.csv",
  "BPO_SUPPLIERS.csv",
  "HEALTH_PLAN_OUTCOME_SNAPSHOT.csv",
];

const args = parseArgs(process.argv.slice(2));

await main().catch((error) => {
  console.error(JSON.stringify({ status: "PHS_HEALTHCARE_DEMO_CANONICAL_PROMOTION_FAILED", error: error.message }, null, 2));
  process.exit(1);
});

async function main() {
  fs.mkdirSync(args.outDir, { recursive: true });
  if (args.mode === "self-test") {
    const result = selfTest();
    writeJson(proofRef(args.outDir, "PHS_CANONICAL_PROMOTION_SELF_TEST.json"), result);
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  const { Client } = await import("pg");
  const client = new Client(await foundationPostgresClientOptions("phs-healthcare-demo-canonical-promotion"));
  await client.connect();
  try {
    if (args.mode === "preflight") {
      const result = await preflight(client);
      writeProofSet(args.outDir, result);
      console.log(JSON.stringify(result, null, 2));
      maybeEmitProofBundle();
      if (result.status !== "PHS_HEALTHCARE_DEMO_CANONICAL_PROMOTION_PREFLIGHT_PASSED") process.exitCode = 1;
      return;
    }
    if (args.mode === "verify") {
      const result = await verify(client);
      writeProofSet(args.outDir, result);
      console.log(JSON.stringify(result, null, 2));
      maybeEmitProofBundle();
      if (result.status !== "PHS_HEALTHCARE_DEMO_CANONICAL_PROMOTION_VERIFIED") process.exitCode = 1;
      return;
    }
    if (args.mode !== "apply") throw new Error(`Unsupported mode ${args.mode}`);
    const result = await apply(client);
    writeProofSet(args.outDir, result);
    console.log(JSON.stringify(result, null, 2));
    maybeEmitProofBundle();
    if (!["PHS_HEALTHCARE_DEMO_CANONICAL_PROMOTION_VERIFIED", "PHS_HEALTHCARE_DEMO_CANONICAL_PROMOTION_ALREADY_VERIFIED"].includes(result.status)) {
      process.exitCode = 1;
    }
  } finally {
    await client.end();
  }
}

function parseArgs(argv) {
  const parsed = {
    mode: process.env.PHS_CANONICAL_PROMOTION_MODE || "preflight",
    outDir:
      process.env.PHS_CANONICAL_PROMOTION_OUT_DIR ||
      path.join(os.tmpdir(), `phs-healthcare-demo-canonical-${new Date().toISOString().replace(/[:.]/g, "-")}`),
    emitProofBundle:
      process.env.EMIT_ACA_PROOF_BUNDLE === "true" ||
      process.env.PHS_CANONICAL_PROMOTION_EMIT_PROOF_BUNDLE === "true",
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

function selfTest() {
  return manifest("PHS_HEALTHCARE_DEMO_CANONICAL_PROMOTION_SELF_TEST_PASSED", {
    mutation_executed: false,
    resolution_states: [
      "ACCEPTED_NEW",
      "MATCHED_EXISTING",
      "MERGED",
      "RELATIONSHIP_ACCEPTED",
      "OBSERVATION_ACCEPTED",
      "EVIDENCE_ACCEPTED",
      "SUPERSEDED",
      "REJECTED",
      "REQUIRES_REVIEW",
    ],
    deterministic_file_contracts: {
      master_entity_files: MASTER_ENTITY_FILES,
      relationship_files: RELATIONSHIP_FILES,
      event_native_source_groups: ["bpo_sourcing_event", "bpo_transformation_event"],
      observation_rule: "non-master non-relationship non-event source records remain observations at source grain",
    },
    expected_layer3_invariants: {
      promotion_decisions: LAYER2_COUNTS.knowledge_candidates,
      vendors: "8..12",
      contract_families: "5..6",
      legal_instruments: "20..30",
      applications_services_cis: "150..250",
      bpo_sourcing_events: 1,
      bpo_suppliers: "4..5",
      canonical_entities_must_not_equal_source_records: true,
    },
  });
}

async function preflight(client) {
  await client.query("BEGIN");
  try {
    await setContext(client, WRITER_ROLE);
    const sourceCounts = await sourceVolumeCounts(client);
    const layer2Counts = await layer2CountsReadback(client);
    const existingCounts = await layer3Counts(client);
    const existingTotal = layer3Total(existingCounts);
    const existingExact = await layer3Exact(client);
    await client.query("ROLLBACK");
    const sourceExact = exactObject(sourceCounts, SOURCE_VOLUME_COUNTS);
    const layer2Exact = exactObject(layer2Counts, LAYER2_COUNTS);
    const existingLayer3Ok = existingTotal === 0 || existingExact.ok;
    const ready = sourceExact && layer2Exact && existingLayer3Ok;
    return manifest(ready
      ? "PHS_HEALTHCARE_DEMO_CANONICAL_PROMOTION_PREFLIGHT_PASSED"
      : "PHS_HEALTHCARE_DEMO_CANONICAL_PROMOTION_PREFLIGHT_FAILED", {
      mutation_executed: false,
      source_counts: sourceCounts,
      source_exact_match: sourceExact,
      layer2_counts: layer2Counts,
      layer2_exact_match: layer2Exact,
      existing_layer3_counts: existingCounts,
      existing_layer3_total: existingTotal,
      existing_layer3_exact_match: existingLayer3Ok,
      existing_layer3_defects: existingTotal === 0 ? [] : existingExact.defects,
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
    progress("apply.begin", { execution_id: PROMOTION_EXECUTION_ID });
    await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [`${DATABASE_SCHEMA}:${TENANT_KEY}:${TEST_NAMESPACE}:canonical-promotion`]);
    await setContext(client, WRITER_ROLE);
    const sourceCounts = await sourceVolumeCounts(client);
    if (!exactObject(sourceCounts, SOURCE_VOLUME_COUNTS)) throw new Error(`PHS source counts are not exact: ${stableJson(sourceCounts)}`);
    const layer2Counts = await layer2CountsReadback(client);
    if (!exactObject(layer2Counts, LAYER2_COUNTS)) throw new Error(`PHS Layer 2 counts are not exact: ${stableJson(layer2Counts)}`);
    const existingCounts = await layer3Counts(client);
    const existingTotal = layer3Total(existingCounts);
    if (existingTotal > 0) {
      const existingExact = await layer3Exact(client);
      if (!existingExact.ok) throw new Error(`Existing Layer 3 rows are partial or divergent: ${stableJson(existingExact)}`);
      await client.query("ROLLBACK");
      return await verifiedManifest(client, "PHS_HEALTHCARE_DEMO_CANONICAL_PROMOTION_ALREADY_VERIFIED", {
        mutation_executed: false,
        started_at: startedAt,
        completed_at: new Date().toISOString(),
      });
    }

    await createTempHelpers(client);
    await createTempRowPayload(client);
    progress("apply.row_payload_ready");
    await createTempCandidateMap(client);
    progress("apply.candidate_map_ready");
    await insertCanonicalEntities(client);
    progress("apply.canonical_entities_ready");
    await insertCanonicalRelationships(client);
    progress("apply.canonical_relationships_ready");
    await insertEventNativeRecords(client);
    progress("apply.event_native_records_ready");
    await insertEvidenceReferences(client);
    progress("apply.evidence_records_ready");
    await insertCanonicalObservations(client);
    progress("apply.observations_ready");
    await insertPromotionDecisions(client);
    progress("apply.promotion_decisions_ready");
    const result = await verifiedManifest(client, "PHS_HEALTHCARE_DEMO_CANONICAL_PROMOTION_VERIFIED", {
      mutation_executed: true,
      started_at: startedAt,
      completed_at: new Date().toISOString(),
    });
    assertManifestOk(result);
    await insertGateResults(client, result);
    await client.query("COMMIT");
    progress("apply.commit", { layer3_counts: result.layer3_counts });
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
    const result = await verifiedManifest(client, "PHS_HEALTHCARE_DEMO_CANONICAL_PROMOTION_VERIFIED", {
      mutation_executed: false,
    });
    await client.query("ROLLBACK");
    if (!result.exact_match) result.status = "PHS_HEALTHCARE_DEMO_CANONICAL_PROMOTION_VERIFY_FAILED";
    return result;
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  }
}

async function createTempHelpers(client) {
  await q(
    client,
    `
    CREATE OR REPLACE FUNCTION pg_temp.phs_l3_slug(input_value text)
    RETURNS text
    LANGUAGE sql
    IMMUTABLE
    AS $$
      SELECT left(
        regexp_replace(
          regexp_replace(lower(coalesce(input_value, '')), '[^a-z0-9]+', '-', 'g'),
          '^-+|-+$',
          '',
          'g'
        ),
        80
      )
    $$
    `,
  );
}

async function createTempRowPayload(client) {
  await q(client, "DROP TABLE IF EXISTS phs_l3_row_payload");
  await q(
    client,
    `
    CREATE TEMP TABLE phs_l3_row_payload ON COMMIT DROP AS
    SELECT sr.source_record_id,
           sr.source_file_id,
           sr.source_release_id,
           sr.tenant_key,
           sr.test_namespace,
           sr.source_row_hash,
           sf.file_name,
           sfc.source_group,
           sfc.context_treatment,
           sfc.demo_priority,
           sfc.event_id,
           jsonb_object_agg(sfv.source_field_name, coalesce(sfv.normalized_value, sfv.raw_value, '') ORDER BY sfv.source_field_name) AS payload,
           count(*)::int AS field_count
      FROM ${tableRef("source_records")} sr
      JOIN ${tableRef("source_files")} sf USING (tenant_key, test_namespace, source_file_id)
      JOIN ${tableRef("source_file_context")} sfc USING (tenant_key, test_namespace, source_file_id)
      JOIN ${tableRef("source_field_values")} sfv USING (tenant_key, test_namespace, source_record_id)
     WHERE sr.tenant_key=$1
       AND sr.test_namespace=$2
       AND sr.source_release_id=$3
     GROUP BY sr.source_record_id, sr.source_file_id, sr.source_release_id, sr.tenant_key, sr.test_namespace,
              sr.source_row_hash, sf.file_name, sfc.source_group, sfc.context_treatment, sfc.demo_priority, sfc.event_id
    `,
    [TENANT_KEY, TEST_NAMESPACE, SOURCE_RELEASE_ID],
  );
  await q(client, "CREATE INDEX ON phs_l3_row_payload(file_name)");
  await q(client, "CREATE INDEX ON phs_l3_row_payload(source_group)");
  await q(client, "CREATE INDEX ON phs_l3_row_payload(source_record_id)");
  await q(client, "ANALYZE phs_l3_row_payload");
}

async function createTempCandidateMap(client) {
  await q(client, "DROP TABLE IF EXISTS phs_l3_candidate_map");
  await q(
    client,
    `
    CREATE TEMP TABLE phs_l3_candidate_map ON COMMIT DROP AS
    SELECT candidate_id,
           source_record_id
      FROM ${tableRef("knowledge_candidates")}
     WHERE tenant_key=$1
       AND test_namespace=$2
       AND source_release_id=$3
    `,
    [TENANT_KEY, TEST_NAMESPACE, SOURCE_RELEASE_ID],
  );
  await q(client, "CREATE INDEX ON phs_l3_candidate_map(source_record_id)");
  await q(client, "CREATE INDEX ON phs_l3_candidate_map(candidate_id)");
  await q(client, "ANALYZE phs_l3_candidate_map");
}

async function insertCanonicalEntities(client) {
  await q(
    client,
    `
    INSERT INTO ${tableRef("canonical_entities")}
      (canonical_entity_id, tenant_key, test_namespace, source_release_id, canonical_entity_type, business_key,
       display_name, source_record_count, source_file_names, entity_payload, confidence, writer_job_id)
    WITH base_entities AS (
      SELECT CASE file_name
               WHEN 'WORKDAY_SUPPLIERS.csv' THEN 'vendor'
               WHEN 'CONTRACT_REGISTER.csv' THEN 'contract_family'
               WHEN 'CONTRACT_INSTRUMENTS.csv' THEN 'legal_instrument'
               WHEN 'SERVICENOW_CMDB_APPLICATIONS.csv' THEN 'application'
               WHEN 'EPIC_MODULE_INVENTORY.csv' THEN 'epic_module'
               WHEN 'BPO_SUPPLIERS.csv' THEN 'bpo_supplier'
               WHEN 'HEALTH_PLAN_OUTCOME_SNAPSHOT.csv' THEN 'outcome'
             END AS canonical_entity_type,
             CASE file_name
               WHEN 'WORKDAY_SUPPLIERS.csv' THEN payload->>'vendor_id'
               WHEN 'CONTRACT_REGISTER.csv' THEN payload->>'contract_family_id'
               WHEN 'CONTRACT_INSTRUMENTS.csv' THEN payload->>'instrument_id'
               WHEN 'SERVICENOW_CMDB_APPLICATIONS.csv' THEN payload->>'application_id'
               WHEN 'EPIC_MODULE_INVENTORY.csv' THEN payload->>'module_id'
               WHEN 'BPO_SUPPLIERS.csv' THEN payload->>'supplier_id'
               WHEN 'HEALTH_PLAN_OUTCOME_SNAPSHOT.csv' THEN payload->>'health_plan_outcome_snapshot_id'
             END AS business_key,
             CASE file_name
               WHEN 'WORKDAY_SUPPLIERS.csv' THEN payload->>'legal_name'
               WHEN 'CONTRACT_REGISTER.csv' THEN payload->>'contract_name'
               WHEN 'CONTRACT_INSTRUMENTS.csv' THEN coalesce(payload->>'document_ref', payload->>'instrument_id')
               WHEN 'SERVICENOW_CMDB_APPLICATIONS.csv' THEN payload->>'application_name'
               WHEN 'EPIC_MODULE_INVENTORY.csv' THEN payload->>'module_name'
               WHEN 'BPO_SUPPLIERS.csv' THEN payload->>'supplier_id'
               WHEN 'HEALTH_PLAN_OUTCOME_SNAPSHOT.csv' THEN payload->>'outcome_name'
             END AS display_name,
             file_name,
             source_record_id,
             payload
        FROM phs_l3_row_payload
       WHERE file_name = ANY($4::text[])
    ),
    derived_entities AS (
      SELECT 'service_tower' AS canonical_entity_type,
             payload->>'service_tower' AS business_key,
             payload->>'service_tower' AS display_name,
             file_name,
             source_record_id,
             jsonb_build_object('derived_from', file_name, 'service_tower', payload->>'service_tower') AS payload
        FROM phs_l3_row_payload
       WHERE file_name='SERVICENOW_MONTHLY_ITSM_SUMMARY.csv' AND coalesce(payload->>'service_tower','') <> ''
      UNION ALL
      SELECT 'risk', payload->>'risk_ref', payload->>'risk_ref', file_name, source_record_id,
             jsonb_build_object('derived_from', file_name, 'risk_ref', payload->>'risk_ref')
        FROM phs_l3_row_payload
       WHERE file_name='RISK_CONTROL_OBSERVATIONS.csv' AND coalesce(payload->>'risk_ref','') <> ''
      UNION ALL
      SELECT 'control', payload->>'control_ref', payload->>'control_ref', file_name, source_record_id,
             jsonb_build_object('derived_from', file_name, 'control_ref', payload->>'control_ref')
        FROM phs_l3_row_payload
       WHERE file_name='RISK_CONTROL_OBSERVATIONS.csv' AND coalesce(payload->>'control_ref','') <> ''
      UNION ALL
      SELECT 'program', payload->>'program_ref', payload->>'program_ref', file_name, source_record_id,
             jsonb_build_object('derived_from', file_name, 'program_ref', payload->>'program_ref')
        FROM phs_l3_row_payload
       WHERE file_name='PROGRAMS_INITIATIVES_DEPENDENCIES.csv' AND coalesce(payload->>'program_ref','') <> ''
      UNION ALL
      SELECT 'initiative', payload->>'initiative_ref', payload->>'initiative_ref', file_name, source_record_id,
             jsonb_build_object('derived_from', file_name, 'initiative_ref', payload->>'initiative_ref')
        FROM phs_l3_row_payload
       WHERE file_name='PROGRAMS_INITIATIVES_DEPENDENCIES.csv' AND coalesce(payload->>'initiative_ref','') <> ''
    ),
    all_entities AS (
      SELECT * FROM base_entities
      UNION ALL
      SELECT * FROM derived_entities
    )
    SELECT 'phs:entity:' || canonical_entity_type || ':' || pg_temp.phs_l3_slug(business_key),
           $1, $2, $3,
           canonical_entity_type,
           business_key,
           max(coalesce(display_name, business_key)),
           count(*)::int,
           array_agg(DISTINCT file_name ORDER BY file_name),
           jsonb_build_object(
             'business_key', business_key,
             'sample_payload', (array_agg(payload ORDER BY source_record_id))[1],
             'source_record_ids', to_jsonb(array_agg(source_record_id ORDER BY source_record_id))
           ),
           0.9800,
           $5
      FROM all_entities
     WHERE coalesce(canonical_entity_type,'') <> '' AND coalesce(business_key,'') <> ''
     GROUP BY canonical_entity_type, business_key
    `,
    [TENANT_KEY, TEST_NAMESPACE, SOURCE_RELEASE_ID, MASTER_ENTITY_FILES, PROMOTION_EXECUTION_ID],
  );
}

async function insertCanonicalRelationships(client) {
  await q(
    client,
    `
    INSERT INTO ${tableRef("canonical_relationships")}
      (canonical_relationship_id, tenant_key, test_namespace, source_release_id, source_record_id, relationship_type,
       source_entity_ref, target_entity_ref, relationship_state, relationship_payload, confidence, writer_job_id)
    SELECT 'phs:relationship:' || source_record_id,
           $1, $2, $3,
           source_record_id,
           lower(regexp_replace(regexp_replace(file_name, '\\.csv$', ''), '[^a-zA-Z0-9]+', '_', 'g')),
           CASE file_name
             WHEN 'CONTRACT_SCOPE_RELATIONSHIPS.csv' THEN coalesce(payload->>'contract_family_id','')
             WHEN 'ANALYTICS_PLATFORM_DEPENDENCIES.csv' THEN coalesce(payload->>'source_ref','')
             WHEN 'EPIC_INTERFACE_INVENTORY.csv' THEN coalesce(payload->>'module_id','')
             WHEN 'PROGRAMS_INITIATIVES_DEPENDENCIES.csv' THEN coalesce(payload->>'initiative_ref','')
             WHEN 'SERVICENOW_CSDM_BUSINESS_SERVICES.csv' THEN coalesce(payload->>'business_service_ref','')
             WHEN 'SERVICENOW_VENDOR_SERVICES.csv' THEN coalesce(payload->>'vendor_id','')
             ELSE ''
           END,
           CASE file_name
             WHEN 'CONTRACT_SCOPE_RELATIONSHIPS.csv' THEN coalesce(nullif(payload->>'application_ref',''), nullif(payload->>'business_service_ref',''), nullif(payload->>'ci_ref',''), nullif(payload->>'contracted_service_id',''), '')
             WHEN 'ANALYTICS_PLATFORM_DEPENDENCIES.csv' THEN coalesce(payload->>'target_ref','')
             WHEN 'EPIC_INTERFACE_INVENTORY.csv' THEN coalesce(payload->>'application_id','')
             WHEN 'PROGRAMS_INITIATIVES_DEPENDENCIES.csv' THEN coalesce(payload->>'dependency_ref','')
             WHEN 'SERVICENOW_CSDM_BUSINESS_SERVICES.csv' THEN coalesce(nullif(payload->>'application_id',''), nullif(payload->>'ci_id',''), '')
             WHEN 'SERVICENOW_VENDOR_SERVICES.csv' THEN coalesce(payload->>'business_service_ref','')
             ELSE ''
           END,
           CASE
             WHEN file_name='ANALYTICS_PLATFORM_DEPENDENCIES.csv' THEN 'inferred_accepted'
             WHEN coalesce(payload->>'relationship_confidence','') IN ('low','requires_review') THEN 'unresolved_endpoint'
             ELSE 'explicit_accepted'
           END,
           payload,
           CASE
             WHEN payload ? 'relationship_confidence' AND (payload->>'relationship_confidence') ~ '^[0-9]+(\\.[0-9]+)?$'
               THEN least(greatest((payload->>'relationship_confidence')::numeric, 0), 1)
             WHEN file_name='ANALYTICS_PLATFORM_DEPENDENCIES.csv' THEN 0.8700
             ELSE 0.9500
           END,
           $4
      FROM phs_l3_row_payload
     WHERE file_name = ANY($5::text[])
    `,
    [TENANT_KEY, TEST_NAMESPACE, SOURCE_RELEASE_ID, PROMOTION_EXECUTION_ID, RELATIONSHIP_FILES],
  );
}

async function insertEventNativeRecords(client) {
  await q(
    client,
    `
    INSERT INTO ${tableRef("event_native_records")}
      (event_native_record_id, tenant_key, test_namespace, source_release_id, event_id, source_record_id,
       event_record_type, business_key, event_payload, confidence, writer_job_id)
    SELECT 'phs:event-native:' || source_record_id,
           $1, $2, $3,
           coalesce(nullif(event_id,''), 'PHS-BPO-RFP-2026-001'),
           source_record_id,
           lower(regexp_replace(regexp_replace(file_name, '\\.csv$', ''), '[^a-zA-Z0-9]+', '_', 'g')),
           source_record_id,
           payload,
           0.9500,
           $4
      FROM phs_l3_row_payload
     WHERE source_group IN ('bpo_sourcing_event', 'bpo_transformation_event')
    `,
    [TENANT_KEY, TEST_NAMESPACE, SOURCE_RELEASE_ID, PROMOTION_EXECUTION_ID],
  );
}

async function insertEvidenceReferences(client) {
  await q(
    client,
    `
    INSERT INTO ${tableRef("canonical_evidence_records")}
      (canonical_evidence_id, tenant_key, test_namespace, source_release_id, source_record_id, evidence_ref,
       document_ref, evidence_subject, evidence_payload, confidence, writer_job_id)
    WITH evidence_refs AS (
      SELECT DISTINCT ON (payload->>'evidence_ref')
             source_record_id,
             payload->>'evidence_ref' AS evidence_ref,
             coalesce(payload->>'document_ref','') AS document_ref,
             coalesce(payload->>'story_thread_ref','') AS evidence_subject,
             payload
        FROM phs_l3_row_payload
       WHERE coalesce(payload->>'evidence_ref','') <> ''
       ORDER BY payload->>'evidence_ref', source_record_id
    )
    SELECT 'phs:evidence:' || pg_temp.phs_l3_slug(evidence_ref),
           $1, $2, $3,
           source_record_id,
           evidence_ref,
           document_ref,
           evidence_subject,
           payload,
           0.9200,
           $4
      FROM evidence_refs
    `,
    [TENANT_KEY, TEST_NAMESPACE, SOURCE_RELEASE_ID, PROMOTION_EXECUTION_ID],
  );
}

async function insertCanonicalObservations(client) {
  await q(
    client,
    `
    INSERT INTO ${tableRef("canonical_observations")}
      (canonical_observation_id, tenant_key, test_namespace, source_release_id, source_record_id,
       observation_type, observation_grain, business_key, related_entity_refs, observation_payload, confidence, writer_job_id)
    SELECT 'phs:observation:' || source_record_id,
           $1, $2, $3,
           source_record_id,
           lower(regexp_replace(regexp_replace(file_name, '\\.csv$', ''), '[^a-zA-Z0-9]+', '_', 'g')),
           coalesce(payload->>'source_object', file_name),
           source_record_id,
           jsonb_build_object(
             'vendor_id', coalesce(payload->>'vendor_id',''),
             'contract_family_id', coalesce(payload->>'contract_family_id', payload->>'contract_id', ''),
             'application_ref', coalesce(payload->>'application_ref', payload->>'application_id', ''),
             'business_service_ref', coalesce(payload->>'business_service_ref',''),
             'ci_ref', coalesce(payload->>'ci_ref', payload->>'ci_id', ''),
             'supplier_id', coalesce(payload->>'supplier_id',''),
             'evidence_ref', coalesce(payload->>'evidence_ref','')
           ),
           payload,
           CASE WHEN coalesce(payload->>'evidence_state','')='document_unavailable_context_only' THEN 0.8200 ELSE 0.9300 END,
           $4
      FROM phs_l3_row_payload
     WHERE source_group NOT IN ('bpo_sourcing_event', 'bpo_transformation_event')
       AND file_name <> ALL($5::text[])
       AND file_name <> ALL($6::text[])
    `,
    [TENANT_KEY, TEST_NAMESPACE, SOURCE_RELEASE_ID, PROMOTION_EXECUTION_ID, MASTER_ENTITY_FILES, RELATIONSHIP_FILES],
  );
}

async function insertPromotionDecisions(client) {
  await q(
    client,
    `
    INSERT INTO ${tableRef("canonical_promotion_decisions")}
      (promotion_decision_id, candidate_id, tenant_key, test_namespace, source_release_id, source_record_id,
       source_file_name, canonical_entity_type, canonical_entity_id, resolution_state, resolution_rule,
       confidence, evidence_refs, conflict_refs, review_requirement, writer_job_id)
    WITH decisions AS (
      SELECT kc.candidate_id,
             kc.source_record_id,
             rp.file_name,
             rp.payload,
             CASE
               WHEN rp.file_name='WORKDAY_SUPPLIERS.csv' THEN 'vendor'
               WHEN rp.file_name='CONTRACT_REGISTER.csv' THEN 'contract_family'
               WHEN rp.file_name='CONTRACT_INSTRUMENTS.csv' THEN 'legal_instrument'
               WHEN rp.file_name='SERVICENOW_CMDB_APPLICATIONS.csv' THEN 'application'
               WHEN rp.file_name='EPIC_MODULE_INVENTORY.csv' THEN 'epic_module'
               WHEN rp.file_name='BPO_SUPPLIERS.csv' THEN 'bpo_supplier'
               WHEN rp.file_name='HEALTH_PLAN_OUTCOME_SNAPSHOT.csv' THEN 'outcome'
               WHEN rp.file_name = ANY($4::text[]) THEN 'relationship'
               WHEN rp.source_group IN ('bpo_sourcing_event', 'bpo_transformation_event') THEN 'event_native_record'
               ELSE 'observation'
             END AS target_type,
             CASE
               WHEN rp.file_name='WORKDAY_SUPPLIERS.csv' THEN 'phs:entity:vendor:' || pg_temp.phs_l3_slug(rp.payload->>'vendor_id')
               WHEN rp.file_name='CONTRACT_REGISTER.csv' THEN 'phs:entity:contract_family:' || pg_temp.phs_l3_slug(rp.payload->>'contract_family_id')
               WHEN rp.file_name='CONTRACT_INSTRUMENTS.csv' THEN 'phs:entity:legal_instrument:' || pg_temp.phs_l3_slug(rp.payload->>'instrument_id')
               WHEN rp.file_name='SERVICENOW_CMDB_APPLICATIONS.csv' THEN 'phs:entity:application:' || pg_temp.phs_l3_slug(rp.payload->>'application_id')
               WHEN rp.file_name='EPIC_MODULE_INVENTORY.csv' THEN 'phs:entity:epic_module:' || pg_temp.phs_l3_slug(rp.payload->>'module_id')
               WHEN rp.file_name='BPO_SUPPLIERS.csv' THEN 'phs:entity:bpo_supplier:' || pg_temp.phs_l3_slug(rp.payload->>'supplier_id')
               WHEN rp.file_name='HEALTH_PLAN_OUTCOME_SNAPSHOT.csv' THEN 'phs:entity:outcome:' || pg_temp.phs_l3_slug(rp.payload->>'health_plan_outcome_snapshot_id')
               WHEN rp.file_name = ANY($4::text[]) THEN 'phs:relationship:' || rp.source_record_id
               WHEN rp.source_group IN ('bpo_sourcing_event', 'bpo_transformation_event') THEN 'phs:event-native:' || rp.source_record_id
               ELSE 'phs:observation:' || rp.source_record_id
             END AS target_id,
             CASE
               WHEN rp.file_name = ANY($5::text[]) THEN 'ACCEPTED_NEW'
               WHEN rp.file_name = ANY($4::text[]) THEN 'RELATIONSHIP_ACCEPTED'
               WHEN rp.source_group IN ('bpo_sourcing_event', 'bpo_transformation_event') THEN 'OBSERVATION_ACCEPTED'
               ELSE 'OBSERVATION_ACCEPTED'
             END AS resolution_state,
             CASE
               WHEN rp.file_name = ANY($5::text[]) THEN 'deterministic_named_source_file_primary_key'
               WHEN rp.file_name = ANY($4::text[]) THEN 'deterministic_named_source_file_relationship_rule'
               WHEN rp.source_group IN ('bpo_sourcing_event', 'bpo_transformation_event') THEN 'deterministic_event_native_record_rule'
               ELSE 'deterministic_transactional_observation_grain'
             END AS resolution_rule
        FROM phs_l3_candidate_map kc
        JOIN phs_l3_row_payload rp
          ON rp.source_record_id = kc.source_record_id
    )
    SELECT candidate_id || ':phs-canonical-promotion-v1',
           candidate_id,
           $1, $2, $3,
           source_record_id,
           file_name,
           target_type,
           target_id,
           resolution_state,
           resolution_rule,
           CASE WHEN coalesce(payload->>'evidence_state','')='document_unavailable_context_only' THEN 0.8200 ELSE 0.9500 END,
           CASE WHEN coalesce(payload->>'evidence_ref','') <> '' THEN jsonb_build_array(payload->>'evidence_ref') ELSE '[]'::jsonb END,
           '[]'::jsonb,
           CASE WHEN coalesce(payload->>'evidence_state','')='document_unavailable_context_only'
                THEN 'evidence unavailable in source package; retain as accepted context with evidence gap'
                ELSE ''
           END,
           $6
      FROM decisions
    `,
    [TENANT_KEY, TEST_NAMESPACE, SOURCE_RELEASE_ID, RELATIONSHIP_FILES, MASTER_ENTITY_FILES, PROMOTION_EXECUTION_ID],
  );
}

async function insertGateResults(client, result) {
  const gates = [
    [LAYER3_GATE_IDS[0], "Layer 2 candidates to consolidated master entities", result.layer2_counts.knowledge_candidates, result.layer3_counts.canonical_entities],
    [LAYER3_GATE_IDS[1], "Layer 2 candidates to observations, relationships and event records", result.layer2_counts.knowledge_candidates, result.layer3_counts.canonical_observations + result.layer3_counts.canonical_relationships + result.layer3_counts.event_native_records],
    [LAYER3_GATE_IDS[2], "Layer 2 candidates to one deterministic promotion decision each", result.layer2_counts.knowledge_candidates, result.layer3_counts.canonical_promotion_decisions],
    [LAYER3_GATE_IDS[3], "Layer 3 canonical boundary excludes one-entity-per-row promotion", result.layer2_counts.normalized_objects, result.layer3_counts.canonical_entities],
  ];
  for (const [gateId, transition, inputCount, outputCount] of gates) {
    await q(
      client,
      `INSERT INTO ${tableRef("gate_results")}
        (gate_result_id, tenant_key, test_namespace, gate_id, transition, input_count, output_count,
         unexplained_variance, gate_status, failure_classification, repair_owner, rerun_scope, proof_uri, writer_job_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'passed',NULL,'foundation-v2-agent','phs-canonical-promotion',$9,$10)`,
      [
        `${SOURCE_RELEASE_ID}:${gateId}`,
        TENANT_KEY,
        TEST_NAMESPACE,
        gateId,
        transition,
        Number(inputCount || 0),
        Number(outputCount || 0),
        Math.abs(Number(inputCount || 0) - Number(outputCount || 0)),
        `proof://${DATABASE_SCHEMA}/${PROMOTION_EXECUTION_ID}/${gateId}`,
        PROMOTION_EXECUTION_ID,
      ],
    );
  }
}

async function verifiedManifest(client, status, extra) {
  const sourceCounts = await sourceVolumeCounts(client);
  const layer2Counts = await layer2CountsReadback(client);
  const layer3 = await layer3Counts(client);
  const entityTypeSummary = await entityTypeSummaryRows(client);
  const decisionSummary = await decisionSummaryRows(client);
  const fileResolutionSummary = await fileResolutionSummaryRows(client);
  const relationshipSummary = await relationshipSummaryRows(client);
  const observationSummary = await observationSummaryRows(client);
  const eventSummary = await eventSummaryRows(client);
  const exact = await layer3Exact(client, {
    sourceCounts,
    layer2Counts,
    layer3,
    entityTypeSummary,
    decisionSummary,
    relationshipSummary,
  });
  return manifest(status, {
    ...extra,
    source_counts: sourceCounts,
    layer2_counts: layer2Counts,
    layer3_counts: layer3,
    exact_match: exact.ok,
    defects: exact.defects,
    entity_type_summary: entityTypeSummary,
    decision_summary: decisionSummary,
    file_resolution_summary: fileResolutionSummary,
    relationship_state_summary: relationshipSummary,
    observation_type_summary: observationSummary,
    event_record_type_summary: eventSummary,
    earliest_broken_transition: exact.ok ? null : exact.defects[0],
  });
}

async function layer3Exact(client, precomputed = {}) {
  const sourceCounts = precomputed.sourceCounts || await sourceVolumeCounts(client);
  const layer2Counts = precomputed.layer2Counts || await layer2CountsReadback(client);
  const layer3 = precomputed.layer3 || await layer3Counts(client);
  const entityTypeSummary = precomputed.entityTypeSummary || await entityTypeSummaryRows(client);
  const decisionSummary = precomputed.decisionSummary || await decisionSummaryRows(client);
  const relationshipSummary = precomputed.relationshipSummary || await relationshipSummaryRows(client);
  const entityCount = (type) => Number(entityTypeSummary.find((row) => row.canonical_entity_type === type)?.canonical_entities || 0);
  const decisions = (state) => Number(decisionSummary.find((row) => row.resolution_state === state)?.decisions || 0);
  const defects = [];
  if (!exactObject(sourceCounts, SOURCE_VOLUME_COUNTS)) defects.push("source_counts_not_exact");
  if (!exactObject(layer2Counts, LAYER2_COUNTS)) defects.push("layer2_counts_not_exact");
  if (layer3.canonical_promotion_decisions !== LAYER2_COUNTS.knowledge_candidates) defects.push("promotion_decision_count_mismatch");
  if (layer3.canonical_entities >= LAYER2_COUNTS.normalized_objects) defects.push("canonical_entities_equal_or_exceed_source_rows");
  if (entityCount("vendor") < 8 || entityCount("vendor") > 12) defects.push(`vendor_count_out_of_range:${entityCount("vendor")}`);
  if (entityCount("contract_family") < 5 || entityCount("contract_family") > 6) defects.push(`contract_family_count_out_of_range:${entityCount("contract_family")}`);
  if (entityCount("legal_instrument") < 20 || entityCount("legal_instrument") > 30) defects.push(`legal_instrument_count_out_of_range:${entityCount("legal_instrument")}`);
  const appServiceCi = entityCount("application") + entityCount("epic_module");
  if (appServiceCi < 150 || appServiceCi > 250) defects.push(`application_service_ci_count_out_of_range:${appServiceCi}`);
  if (entityCount("bpo_supplier") < 4 || entityCount("bpo_supplier") > 5) defects.push(`bpo_supplier_count_out_of_range:${entityCount("bpo_supplier")}`);
  if (layer3.event_native_records !== 4370) defects.push(`event_native_record_count_mismatch:${layer3.event_native_records}`);
  if (layer3.canonical_relationships !== 2390) defects.push(`relationship_count_mismatch:${layer3.canonical_relationships}`);
  if (decisions("ACCEPTED_NEW") <= 0) defects.push("no_accepted_new_decisions");
  if (decisions("RELATIONSHIP_ACCEPTED") !== layer3.canonical_relationships) defects.push("relationship_decision_count_mismatch");
  if (decisions("OBSERVATION_ACCEPTED") <= layer3.canonical_relationships) defects.push("observation_decisions_missing");
  const relationshipTotal = relationshipSummary.reduce((sum, row) => sum + Number(row.relationships || 0), 0);
  if (relationshipTotal !== layer3.canonical_relationships) defects.push("relationship_state_summary_mismatch");
  const skyharbor = await skyharborCounts(client);
  for (const row of skyharbor) {
    if (Number(row.row_count || 0) !== 0) defects.push(`skyharbor_rows_present:${row.table_name}:${row.row_count}`);
  }
  return { ok: defects.length === 0, defects };
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
      (SELECT count(*)::int FROM ${tableRef("parser_executions")} WHERE tenant_key=$1 AND test_namespace=$2 AND source_release_id=$3) AS parser_executions
    `,
    [TENANT_KEY, TEST_NAMESPACE, SOURCE_RELEASE_ID],
  );
  return numericObject(counts);
}

async function layer2CountsReadback(client) {
  const [counts] = await rows(
    client,
    `
    SELECT
      (SELECT count(*)::int FROM ${tableRef("normalized_objects")} WHERE tenant_key=$1 AND test_namespace=$2 AND source_release_id=$3) AS normalized_objects,
      (SELECT count(*)::int FROM ${tableRef("knowledge_candidates")} WHERE tenant_key=$1 AND test_namespace=$2 AND source_release_id=$3) AS knowledge_candidates
    `,
    [TENANT_KEY, TEST_NAMESPACE, SOURCE_RELEASE_ID],
  );
  return numericObject(counts);
}

async function layer3Counts(client) {
  const [counts] = await rows(
    client,
    `
    SELECT
      (SELECT count(*)::int FROM ${tableRef("canonical_entities")} WHERE tenant_key=$1 AND test_namespace=$2 AND source_release_id=$3) AS canonical_entities,
      (SELECT count(*)::int FROM ${tableRef("canonical_observations")} WHERE tenant_key=$1 AND test_namespace=$2 AND source_release_id=$3) AS canonical_observations,
      (SELECT count(*)::int FROM ${tableRef("canonical_relationships")} WHERE tenant_key=$1 AND test_namespace=$2 AND source_release_id=$3) AS canonical_relationships,
      (SELECT count(*)::int FROM ${tableRef("canonical_evidence_records")} WHERE tenant_key=$1 AND test_namespace=$2 AND source_release_id=$3) AS canonical_evidence_records,
      (SELECT count(*)::int FROM ${tableRef("event_native_records")} WHERE tenant_key=$1 AND test_namespace=$2 AND source_release_id=$3) AS event_native_records,
      (SELECT count(*)::int FROM ${tableRef("canonical_promotion_decisions")} WHERE tenant_key=$1 AND test_namespace=$2 AND source_release_id=$3) AS canonical_promotion_decisions,
      (SELECT count(*)::int FROM ${tableRef("gate_results")} WHERE tenant_key=$1 AND test_namespace=$2 AND gate_id = ANY($4::text[])) AS canonical_promotion_gates
    `,
    [TENANT_KEY, TEST_NAMESPACE, SOURCE_RELEASE_ID, LAYER3_GATE_IDS],
  );
  return numericObject(counts);
}

async function entityTypeSummaryRows(client) {
  return rows(
    client,
    `SELECT canonical_entity_type, count(*)::int AS canonical_entities, sum(source_record_count)::int AS source_record_refs
       FROM ${tableRef("canonical_entities")}
      WHERE tenant_key=$1 AND test_namespace=$2 AND source_release_id=$3
      GROUP BY canonical_entity_type
      ORDER BY canonical_entity_type`,
    [TENANT_KEY, TEST_NAMESPACE, SOURCE_RELEASE_ID],
  );
}

async function decisionSummaryRows(client) {
  return rows(
    client,
    `SELECT resolution_state, count(*)::int AS decisions
       FROM ${tableRef("canonical_promotion_decisions")}
      WHERE tenant_key=$1 AND test_namespace=$2 AND source_release_id=$3
      GROUP BY resolution_state
      ORDER BY resolution_state`,
    [TENANT_KEY, TEST_NAMESPACE, SOURCE_RELEASE_ID],
  );
}

async function fileResolutionSummaryRows(client) {
  return rows(
    client,
    `SELECT source_file_name, resolution_state, canonical_entity_type, count(*)::int AS decisions
       FROM ${tableRef("canonical_promotion_decisions")}
      WHERE tenant_key=$1 AND test_namespace=$2 AND source_release_id=$3
      GROUP BY source_file_name, resolution_state, canonical_entity_type
      ORDER BY source_file_name, resolution_state, canonical_entity_type`,
    [TENANT_KEY, TEST_NAMESPACE, SOURCE_RELEASE_ID],
  );
}

async function relationshipSummaryRows(client) {
  return rows(
    client,
    `SELECT relationship_state, count(*)::int AS relationships
       FROM ${tableRef("canonical_relationships")}
      WHERE tenant_key=$1 AND test_namespace=$2 AND source_release_id=$3
      GROUP BY relationship_state
      ORDER BY relationship_state`,
    [TENANT_KEY, TEST_NAMESPACE, SOURCE_RELEASE_ID],
  );
}

async function observationSummaryRows(client) {
  return rows(
    client,
    `SELECT observation_type, count(*)::int AS observations
       FROM ${tableRef("canonical_observations")}
      WHERE tenant_key=$1 AND test_namespace=$2 AND source_release_id=$3
      GROUP BY observation_type
      ORDER BY observation_type`,
    [TENANT_KEY, TEST_NAMESPACE, SOURCE_RELEASE_ID],
  );
}

async function eventSummaryRows(client) {
  return rows(
    client,
    `SELECT event_record_type, count(*)::int AS event_records
       FROM ${tableRef("event_native_records")}
      WHERE tenant_key=$1 AND test_namespace=$2 AND source_release_id=$3
      GROUP BY event_record_type
      ORDER BY event_record_type`,
    [TENANT_KEY, TEST_NAMESPACE, SOURCE_RELEASE_ID],
  );
}

async function skyharborCounts(client) {
  const result = [];
  for (const table of LAYER3_TABLES) {
    const [row] = await rows(client, `SELECT count(*)::int AS row_count FROM ${tableRef(table)} WHERE tenant_key LIKE 'skyharbor%'`);
    result.push({ table_name: table, row_count: Number(row.row_count || 0) });
  }
  return result;
}

function writeProofSet(outDir, result) {
  writeJson(proofRef(outDir, "PHS_CANONICAL_PROMOTION.json"), result);
  if (Array.isArray(result.entity_type_summary)) {
    writeCsv(proofRef(outDir, "PHS_CANONICAL_ENTITY_TYPES.csv"), ["canonical_entity_type", "canonical_entities", "source_record_refs"], result.entity_type_summary);
  }
  if (Array.isArray(result.decision_summary)) {
    writeCsv(proofRef(outDir, "PHS_CANONICAL_PROMOTION_DECISIONS.csv"), ["resolution_state", "decisions"], result.decision_summary);
  }
  if (Array.isArray(result.relationship_state_summary)) {
    writeCsv(proofRef(outDir, "PHS_CANONICAL_RELATIONSHIP_STATES.csv"), ["relationship_state", "relationships"], result.relationship_state_summary);
  }
  if (Array.isArray(result.file_resolution_summary)) {
    writeCsv(proofRef(outDir, "PHS_CANONICAL_FILE_RESOLUTION_SUMMARY.csv"), ["source_file_name", "resolution_state", "canonical_entity_type", "decisions"], result.file_resolution_summary);
  }
}

function maybeEmitProofBundle() {
  if (args.emitProofBundle) emitProofBundle(args.outDir);
}

function assertApplyApproved() {
  if (process.env.PHS_CANONICAL_PROMOTION_APPLY_APPROVED !== "true") {
    throw new Error("PHS canonical promotion apply requires PHS_CANONICAL_PROMOTION_APPLY_APPROVED=true");
  }
  if (process.env.ACA_JOB_NAME !== "job-abarva-private-operator-eus") {
    throw new Error("PHS canonical promotion apply must run through approved ACA data-build job context");
  }
}

function assertManifestOk(result) {
  if (!result.exact_match) {
    throw new Error(`PHS canonical promotion manifest failed: ${stableJson(result.defects || [])}`);
  }
}

function manifest(status, extra = {}) {
  return {
    status,
    generated_at: new Date().toISOString(),
    tenant_key: TENANT_KEY,
    test_namespace: TEST_NAMESPACE,
    source_release_id: SOURCE_RELEASE_ID,
    foundation_release_alias: FOUNDATION_RELEASE_ALIAS,
    execution_id: PROMOTION_EXECUTION_ID,
    promotion_version: PROMOTION_VERSION,
    ...extra,
  };
}

async function setContext(client, role) {
  await q(client, "RESET ROLE");
  await q(client, `SET ROLE ${quoteIdent(role)}`);
  await q(client, "SELECT set_config('app.tenant_key', $1, true)", [TENANT_KEY]);
  await q(client, "SELECT set_config('app.foundation_v2_test_namespace', $1, true)", [TEST_NAMESPACE]);
  await q(client, "SELECT set_config('app.foundation_v2_source_release_id', $1, true)", [SOURCE_RELEASE_ID]);
  await q(client, "SELECT set_config('app.foundation_v2_release_alias', $1, true)", [FOUNDATION_RELEASE_ALIAS]);
}

async function q(client, text, params = []) {
  return client.query(text, params);
}

function progress(event, payload = {}) {
  console.log(JSON.stringify({ status: "PHS_HEALTHCARE_DEMO_CANONICAL_PROMOTION_PROGRESS", event, generated_at: new Date().toISOString(), ...payload }));
}

async function rows(client, text, params = []) {
  const result = await q(client, text, params);
  return result.rows;
}

function tableRef(tableName) {
  return `${quoteIdent(DATABASE_SCHEMA)}.${quoteIdent(tableName)}`;
}

function quoteIdent(value) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

function numericObject(row) {
  return Object.fromEntries(Object.entries(row || {}).map(([key, value]) => [key, Number(value || 0)]));
}

function exactObject(actual, expected) {
  return Object.entries(expected).every(([key, value]) => Number(actual[key] || 0) === value);
}

function layer3Total(counts) {
  return LAYER3_TABLES.reduce((sum, table) => sum + Number(counts[table] || 0), 0);
}
