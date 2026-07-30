#!/usr/bin/env node
import {
  DEFAULT_EXECUTION_ID,
  EXPECTED_MIGRATION_SHA256,
  EXPECTED_WRITE_POLICY_MIGRATION_SHA256,
  ISOLATION_SCOPE,
  MIGRATION_NAME,
  SOURCE_RELEASE_ID,
  TENANT_KEY,
  TEST_NAMESPACE,
  WRITER_ROLE,
  WRITE_POLICY_MIGRATION_NAME,
  buildFixturePlan,
  createManifest,
  databaseUrl,
  emitProofBundle,
  expectedPersistenceFingerprint,
  expectedTransitionResults,
  parseArgs,
  postgresClientOptions,
  proofRef,
  readFixtureSet,
  sha256,
  stableJson,
  usage,
  writeCsv,
  writeJson,
  writeMarkdown,
} from "./golden-slice-support.mjs";

const FOUNDATION_TABLES = [
  "source_releases",
  "source_files",
  "source_records",
  "source_field_values",
  "parser_executions",
  "normalized_objects",
  "knowledge_candidates",
  "review_batches",
  "review_decisions",
  "canonical_objects",
  "domain_publications",
  "publication_members",
  "baselines",
  "baseline_object_memberships",
  "projection_authority",
  "projection_rows",
  "projection_field_lineage",
  "cube_parity_results",
  "product_binding_proofs",
  "ava_packet_proofs",
  "gate_results",
];
const V1_RELATIONS = [
  "source_registry.source_version",
  "governance.review_decision",
  "knowledge.entity",
  "knowledge.fact_assertion",
  "knowledge.relationship_assertion",
  "publication.domain_publication",
  "publication.knowledge_baseline",
  "publication.projection_version",
  "consumption.enterprise_brief_v1",
];

const args = parseArgs(process.argv.slice(2));
if (args.help) {
  console.log(usage("scripts/foundation-v2/execute-golden-slice-db.mjs"));
  process.exit(0);
}

await main(args).catch((error) => {
  console.error(
    JSON.stringify(
      {
        status: "FOUNDATION_V2_GOLDEN_SLICE_EXECUTOR_FAILED",
        error: error.message,
        defects: error.defects || [],
      },
      null,
      2,
    ),
  );
  process.exit(1);
});

async function main(options) {
  const { fixtureSet, fixtureSha256 } = readFixtureSet(options.fixture);
  const plan = buildFixturePlan(fixtureSet, fixtureSha256, options.executionId || DEFAULT_EXECUTION_ID);

  if (options.mode === "self-test") {
    runSelfTest(plan, options.outDir);
    return;
  }

  const url = databaseUrl();
  if (!url) throw new Error("ABARVA_AZURE_DATABASE_URL, AZURE_DATABASE_URL or DATABASE_URL is required");
  const { Client } = await importPg();
  const client = new Client(postgresClientOptions(url, "foundation-v2-golden-slice-executor"));
  await client.connect();
  try {
    if (options.mode === "schema-readback") {
      const schema = await schemaReadback(client);
      writeJson(proofRef(options.outDir, "FOUNDATION_V2_GOLDEN_SLICE_SCHEMA_READBACK.json"), schema);
      writeSecurityProof(options.outDir, schema);
      if (options.emitProofBundle) emitProofBundle(options.outDir);
      console.log(JSON.stringify(schema, null, 2));
      if (schema.status !== "FOUNDATION_V2_SCHEMA_READBACK_PASSED") process.exitCode = 1;
      return;
    }
    if (options.mode === "preflight") {
      const proof = await preflight(client, plan);
      writeJson(proofRef(options.outDir, "FOUNDATION_V2_GOLDEN_SLICE_PREFLIGHT.json"), proof);
      if (options.emitProofBundle) emitProofBundle(options.outDir);
      console.log(JSON.stringify(proof, null, 2));
      if (proof.status !== "FOUNDATION_V2_GOLDEN_SLICE_PREFLIGHT_PASSED") process.exitCode = 1;
      return;
    }
    if (options.mode !== "apply") throw new Error(`Unsupported mode ${options.mode}`);
    const result = await applyGoldenSlice(client, plan, options.outDir);
    if (options.emitProofBundle) emitProofBundle(options.outDir);
    console.log(JSON.stringify(result, null, 2));
  } finally {
    await client.end();
  }
}

async function importPg() {
  try {
    return await import("pg");
  } catch (error) {
    throw new Error(`The pg package is required for DB-backed Foundation V2 execution: ${error.message}`);
  }
}

async function preflight(client, plan) {
  const schema = await schemaReadback(client);
  const migration = await migrationReadback(client, MIGRATION_NAME);
  const writePolicyMigration = await migrationReadback(client, WRITE_POLICY_MIGRATION_NAME);
  await client.query("BEGIN");
  let existing;
  try {
    await activateWriterRole(client);
    existing = await existingCounts(client);
    await client.query("ROLLBACK");
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  }
  const defects = [];
  if (!migration.present) defects.push(`missing migration ${MIGRATION_NAME}`);
  if (migration.sha256 !== EXPECTED_MIGRATION_SHA256) {
    defects.push(`migration sha mismatch ${migration.sha256 || "missing"}`);
  }
  if (!writePolicyMigration.present) defects.push(`missing migration ${WRITE_POLICY_MIGRATION_NAME}`);
  if (writePolicyMigration.sha256 !== EXPECTED_WRITE_POLICY_MIGRATION_SHA256) {
    defects.push(`write policy migration sha mismatch ${writePolicyMigration.sha256 || "missing"}`);
  }
  if (schema.summary.table_count !== FOUNDATION_TABLES.length) {
    defects.push(`expected ${FOUNDATION_TABLES.length} tables, found ${schema.summary.table_count}`);
  }
  if (schema.status !== "FOUNDATION_V2_SCHEMA_READBACK_PASSED") defects.push("schema readback failed");
  const existingTotal = Object.values(existing).reduce((sum, value) => sum + Number(value || 0), 0);
  return createManifest(plan, defects.length === 0 ? "FOUNDATION_V2_GOLDEN_SLICE_PREFLIGHT_PASSED" : "FOUNDATION_V2_GOLDEN_SLICE_PREFLIGHT_FAILED", {
    defects,
    schema_summary: schema.summary,
    migration,
    write_policy_migration: writePolicyMigration,
    existing_counts: existing,
    existing_total: existingTotal,
  });
}

async function applyGoldenSlice(client, plan, outDir) {
  const startedAt = new Date().toISOString();
  let transactionOpen = false;
  let committed = false;
  await client.query("BEGIN");
  transactionOpen = true;
  try {
    await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [`foundation-v2:${TENANT_KEY}:${TEST_NAMESPACE}`]);
    await setFoundationContext(client);
    const migration = await migrationReadback(client, MIGRATION_NAME);
    if (!migration.present || migration.sha256 !== EXPECTED_MIGRATION_SHA256) {
      throw new Error(`Fail closed: migration ${MIGRATION_NAME} not present with approved SHA`);
    }
    const writePolicyMigration = await migrationReadback(client, WRITE_POLICY_MIGRATION_NAME);
    if (!writePolicyMigration.present || writePolicyMigration.sha256 !== EXPECTED_WRITE_POLICY_MIGRATION_SHA256) {
      throw new Error(`Fail closed: migration ${WRITE_POLICY_MIGRATION_NAME} not present with approved SHA`);
    }
    const v1Before = await v1IsolationSnapshot(client);
    await activateWriterRole(client);

    const existing = await existingCounts(client);
    const existingTotal = Object.values(existing).reduce((sum, value) => sum + Number(value || 0), 0);
    if (existingTotal > 0) {
      const exact = await existingExecutionReadback(client, plan);
      if (!exact.exact_match) {
        throw new Error(`Fail closed: existing non-identical golden-slice execution ${JSON.stringify(exact)}`);
      }
      await client.query("ROLLBACK");
      transactionOpen = false;
      const already = createManifest(plan, "FOUNDATION_V2_GOLDEN_SLICE_ALREADY_APPLIED_EXACT_MATCH", {
        started_at: startedAt,
        completed_at: new Date().toISOString(),
        existing_execution: exact,
      });
      writeApplyProof(outDir, plan, already, [], exact.layer_totals || {});
      return already;
    }

    await insertPlan(client, plan);
    const layerTotals = await dbLayerTotals(client);
    const varianceRows = varianceRegister(plan.expected_layer_totals, layerTotals);
    const unexplained = varianceRows.reduce((sum, row) => sum + Number(row.variance || 0), 0);
    if (unexplained !== 0) {
      throw new Error(`Fail closed: layer variance after write ${JSON.stringify(varianceRows)}`);
    }
    await client.query("RESET ROLE");
    const v1After = await v1IsolationSnapshot(client);
    const v1Changed = v1Before.filter((before) => {
      const after = v1After.find((row) => row.relation === before.relation);
      return after && after.row_count !== before.row_count;
    });
    if (v1Changed.length > 0) {
      throw new Error(`Fail closed: V1 relation counts changed ${JSON.stringify(v1Changed)}`);
    }
    await client.query("COMMIT");
    committed = true;
    transactionOpen = false;

    const completedAt = new Date().toISOString();
    const result = createManifest(plan, "FOUNDATION_V2_GOLDEN_SLICE_EXECUTOR_APPLIED", {
      started_at: startedAt,
      completed_at: completedAt,
      row_variance: 0,
      field_variance: 0,
      v1_before: v1Before,
      v1_after: v1After,
      layer_totals: layerTotals,
    });
    writeApplyProof(outDir, plan, result, varianceRows, layerTotals);
    return result;
  } catch (error) {
    if (transactionOpen && !committed) {
      await client.query("ROLLBACK").catch(() => {});
      transactionOpen = false;
    }
    writeJson(proofRef(outDir, "FOUNDATION_V2_GOLDEN_SLICE_APPLY_FAILURE.json"), {
      status: committed
        ? "FOUNDATION_V2_GOLDEN_SLICE_EXECUTOR_PROOF_EMISSION_FAILED_AFTER_COMMIT"
        : "FOUNDATION_V2_GOLDEN_SLICE_EXECUTOR_ROLLED_BACK",
      error: error.message,
      execution_id: plan.execution_id,
      tenant_key: TENANT_KEY,
      test_namespace: TEST_NAMESPACE,
      source_release_id: SOURCE_RELEASE_ID,
      committed,
      rolled_back: !committed,
      failed_at: new Date().toISOString(),
    });
    throw error;
  }
}

async function insertPlan(client, plan) {
  await q(
    client,
    `INSERT INTO foundation_v2.source_releases
      (source_release_id, tenant_key, test_namespace, release_version, release_hash, source_release_state,
       isolation_scope, v1_component_classification, writer_job_id)
     VALUES ($1,$2,$3,$4,$5,'isolated_golden_slice',$6,'SUPERSEDE_WITH_V2',$7)`,
    [SOURCE_RELEASE_ID, TENANT_KEY, TEST_NAMESPACE, plan.release_version, plan.release_hash, ISOLATION_SCOPE, plan.execution_id],
  );
  await q(
    client,
    `INSERT INTO foundation_v2.source_files
      (source_file_id, source_release_id, tenant_key, test_namespace, source_uri, file_name,
       content_sha256, row_count, field_count, writer_job_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
    [
      plan.source_file_id,
      SOURCE_RELEASE_ID,
      TENANT_KEY,
      TEST_NAMESPACE,
      `fixture://${SOURCE_RELEASE_ID}/fixture-matrix.json`,
      "fixture-matrix.json",
      plan.source_file_hash,
      plan.rows.length,
      plan.source_field_rows.length,
      plan.execution_id,
    ],
  );

  for (const row of plan.rows) {
    await q(
      client,
      `INSERT INTO foundation_v2.source_records
        (source_record_id, source_file_id, source_release_id, tenant_key, test_namespace, source_row_number,
         source_row_hash, row_disposition, row_disposition_reason, writer_job_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [
        row.source_record_id,
        plan.source_file_id,
        SOURCE_RELEASE_ID,
        TENANT_KEY,
        TEST_NAMESPACE,
        Number(row.ordinal),
        row.source_row_hash,
        row.row_disposition,
        `fixture:${row.fixture_name}:${row.expected_state}`,
        plan.execution_id,
      ],
    );
  }

  for (const field of plan.source_field_rows) {
    await q(
      client,
      `INSERT INTO foundation_v2.source_field_values
        (source_field_value_id, source_record_id, source_file_id, source_release_id, tenant_key, test_namespace,
         source_field_id, source_field_name, raw_value, normalized_value, field_disposition, target_object_type,
         target_field_name, adapter_rule_id, evidence_ref, restricted, writer_job_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`,
      [
        field.source_field_value_id,
        field.source_record_id,
        plan.source_file_id,
        SOURCE_RELEASE_ID,
        TENANT_KEY,
        TEST_NAMESPACE,
        field.source_field_id,
        field.source_field_name,
        field.raw_value,
        field.normalized_value,
        field.field_disposition,
        field.target_object_type,
        field.target_field_name,
        field.adapter_rule_id,
        field.evidence_ref,
        field.restricted,
        plan.execution_id,
      ],
    );
  }

  await q(
    client,
    `INSERT INTO foundation_v2.parser_executions
      (parser_execution_id, source_release_id, tenant_key, test_namespace, parser_contract_version,
       input_file_count, output_record_count, output_field_count, rejected_record_count, parser_status, writer_job_id)
     VALUES ($1,$2,$3,$4,'foundation-v2-golden-slice-parser-v1',$5,$6,$7,$8,'passed',$9)`,
    [
      `${SOURCE_RELEASE_ID}:parser-execution-001`,
      SOURCE_RELEASE_ID,
      TENANT_KEY,
      TEST_NAMESPACE,
      1,
      plan.expected_layer_totals.L2_parsed_rows,
      plan.source_field_rows.length,
      plan.rows.filter((row) => row.row_disposition === "MALFORMED").length,
      plan.execution_id,
    ],
  );

  for (const row of plan.rows.filter((candidate) => candidate.normalized)) {
    await q(
      client,
      `INSERT INTO foundation_v2.normalized_objects
        (normalized_object_id, source_record_id, tenant_key, test_namespace, object_type, business_key,
         identity_resolution_state, normalized_payload, content_hash, writer_job_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9,$10)`,
      [
        row.normalized_object_id,
        row.source_record_id,
        TENANT_KEY,
        TEST_NAMESPACE,
        objectType(row.source_family),
        row.object_id,
        "resolved",
        stableJson({ fixture_id: row.fixture_id, fixture_name: row.fixture_name, expected_state: row.expected_state }),
        row.content_hash,
        plan.execution_id,
      ],
    );
  }

  for (const row of plan.rows.filter((candidate) => candidate.candidate)) {
    await q(
      client,
      `INSERT INTO foundation_v2.knowledge_candidates
        (candidate_id, normalized_object_id, tenant_key, test_namespace, candidate_type, candidate_business_key,
         review_policy_class, evidence_count, candidate_state, content_hash, writer_job_id)
       VALUES ($1,$2,$3,$4,$5,$6,'isolated_fixture_review',$7,$8,$9,$10)`,
      [
        row.candidate_id,
        row.normalized_object_id,
        TENANT_KEY,
        TEST_NAMESPACE,
        objectType(row.source_family),
        row.object_id,
        3,
        row.candidate_state,
        row.content_hash,
        plan.execution_id,
      ],
    );
  }

  await q(
    client,
    `INSERT INTO foundation_v2.review_batches
      (review_batch_id, tenant_key, test_namespace, source_release_id, batch_state, reviewer_ref, writer_job_id)
     VALUES ($1,$2,$3,$4,'approved_for_golden_slice','foundation-v2-isolated-reviewer',$5)`,
    [plan.review_batch_id, TENANT_KEY, TEST_NAMESPACE, SOURCE_RELEASE_ID, plan.execution_id],
  );

  for (const row of plan.rows.filter((candidate) => candidate.decision)) {
    await q(
      client,
      `INSERT INTO foundation_v2.review_decisions
        (review_decision_id, review_batch_id, candidate_id, tenant_key, test_namespace, review_decision,
         decision_reason, reviewer_ref, writer_job_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,'foundation-v2-isolated-reviewer',$8)`,
      [
        row.review_decision_id,
        plan.review_batch_id,
        row.candidate_id,
        TENANT_KEY,
        TEST_NAMESPACE,
        row.review_decision,
        `approved fixture outcome:${row.expected_state}`,
        plan.execution_id,
      ],
    );
  }

  for (const row of plan.rows.filter((candidate) => candidate.canonical)) {
    await q(
      client,
      `INSERT INTO foundation_v2.canonical_objects
        (canonical_object_id, review_decision_id, tenant_key, test_namespace, object_type, business_key,
         authority_state, review_state, content_hash, writer_job_id)
       VALUES ($1,$2,$3,$4,$5,$6,'accepted','accepted',$7,$8)`,
      [
        row.canonical_object_id,
        row.review_decision_id,
        TENANT_KEY,
        TEST_NAMESPACE,
        objectType(row.source_family),
        row.object_id,
        row.content_hash,
        plan.execution_id,
      ],
    );
  }

  await q(
    client,
    `INSERT INTO foundation_v2.domain_publications
      (publication_id, tenant_key, test_namespace, publication_domain, publication_version, publication_hash,
       publication_state, immutability_scope, writer_job_id)
     VALUES ($1,$2,$3,'golden_slice_knowledge','v1',$4,'isolated_test','append_only',$5)`,
    [plan.publication_id, TENANT_KEY, TEST_NAMESPACE, plan.publication_hash, plan.execution_id],
  );

  for (const row of plan.rows.filter((candidate) => candidate.publicationMember)) {
    await q(
      client,
      `INSERT INTO foundation_v2.publication_members
        (publication_member_id, publication_id, canonical_object_id, tenant_key, test_namespace,
         member_hash, inclusion_reason, writer_job_id)
       VALUES ($1,$2,$3,$4,$5,$6,'accepted_fixture_only',$7)`,
      [
        row.publication_member_id,
        plan.publication_id,
        row.canonical_object_id,
        TENANT_KEY,
        TEST_NAMESPACE,
        sha256(`publication-member:${row.canonical_object_id}:${plan.publication_hash}`),
        plan.execution_id,
      ],
    );
  }

  await q(
    client,
    `INSERT INTO foundation_v2.baselines
      (baseline_id, tenant_key, test_namespace, baseline_version, baseline_hash, baseline_state, writer_job_id)
     VALUES ($1,$2,$3,'v1',$4,'isolated_test',$5)`,
    [plan.baseline_id, TENANT_KEY, TEST_NAMESPACE, plan.baseline_hash, plan.execution_id],
  );

  for (const row of plan.rows.filter((candidate) => candidate.baselineMember)) {
    await q(
      client,
      `INSERT INTO foundation_v2.baseline_object_memberships
        (baseline_object_membership_id, baseline_id, publication_member_id, tenant_key, test_namespace,
         membership_hash, inclusion_reason, writer_job_id)
       VALUES ($1,$2,$3,$4,$5,$6,'isolated_publication_member',$7)`,
      [
        row.baseline_membership_id,
        plan.baseline_id,
        row.publication_member_id,
        TENANT_KEY,
        TEST_NAMESPACE,
        sha256(`baseline-membership:${row.publication_member_id}:${plan.baseline_hash}`),
        plan.execution_id,
      ],
    );
  }

  await q(
    client,
    `INSERT INTO foundation_v2.projection_authority
      (projection_authority_id, baseline_id, tenant_key, test_namespace, projection_name,
       projection_version, projection_hash, projection_row_count, freshness_state, writer_job_id)
     VALUES ($1,$2,$3,$4,'golden_slice_knowledge_preview','v1',$5,$6,'fresh',$7)`,
    [
      plan.projection_authority_id,
      plan.baseline_id,
      TENANT_KEY,
      TEST_NAMESPACE,
      plan.projection_hash,
      plan.expected_layer_totals.L9_projection_rows,
      plan.execution_id,
    ],
  );

  for (const row of plan.rows.filter((candidate) => candidate.projection)) {
    await q(
      client,
      `INSERT INTO foundation_v2.projection_rows
        (projection_row_id, projection_authority_id, baseline_object_membership_id, tenant_key, test_namespace,
         projection_name, row_hash, availability_state, payload, writer_job_id)
       VALUES ($1,$2,$3,$4,$5,'golden_slice_knowledge_preview',$6,$7,$8::jsonb,$9)`,
      [
        row.projection_row_id,
        plan.projection_authority_id,
        row.baseline_membership_id,
        TENANT_KEY,
        TEST_NAMESPACE,
        sha256(`projection-row:${row.baseline_membership_id}:${row.content_hash}`),
        row.projection_availability_state,
        stableJson({
          fixture_id: row.fixture_id,
          fixture_name: row.fixture_name,
          accepted_fact: row.productPassed,
          proposed_is_approved: false,
          restricted: row.expected_state === "restricted",
        }),
        plan.execution_id,
      ],
    );
    await q(
      client,
      `INSERT INTO foundation_v2.projection_field_lineage
        (projection_field_lineage_id, projection_row_id, source_field_value_id, canonical_object_id,
         tenant_key, test_namespace, projection_field_name, contribution_type, writer_job_id)
       VALUES ($1,$2,$3,$4,$5,$6,'business_key',$7,$8)`,
      [
        row.projection_field_lineage_id,
        row.projection_row_id,
        row.lineage_id,
        row.canonical_object_id,
        TENANT_KEY,
        TEST_NAMESPACE,
        row.expected_state === "restricted" ? "withheld" : "direct",
        plan.execution_id,
      ],
    );
  }

  for (const row of plan.rows.filter((candidate) => candidate.projection)) {
    await q(
      client,
      `INSERT INTO foundation_v2.cube_parity_results
        (cube_parity_result_id, projection_authority_id, tenant_key, test_namespace, cube_object_name,
         direct_sql_hash, cube_query_hash, parity_status, writer_job_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [
        row.cube_parity_result_id,
        plan.projection_authority_id,
        TENANT_KEY,
        TEST_NAMESPACE,
        `golden_slice_measure_${row.ordinal}`,
        sha256(`foundation-v2:direct-sql:${row.fixture_id}:${row.cubePassed ? 1 : 0}`),
        sha256(`foundation-v2:cube-query:${row.fixture_id}:${row.cubePassed ? 1 : 0}`),
        row.cubePassed ? "passed" : "not_applicable",
        plan.execution_id,
      ],
    );
    await q(
      client,
      `INSERT INTO foundation_v2.product_binding_proofs
        (product_binding_proof_id, projection_authority_id, tenant_key, test_namespace, product_surface,
         component_id, render_gate_status, unsupported_claim_count, proof_uri, writer_job_id)
       VALUES ($1,$2,$3,$4,'knowledge_preview',$5,$6,0,$7,$8)`,
      [
        row.product_binding_proof_id,
        plan.projection_authority_id,
        TENANT_KEY,
        TEST_NAMESPACE,
        `fixture-component-${row.ordinal}`,
        row.product_render_gate_status,
        `proof://foundation-v2/${plan.execution_id}/L11/${row.fixture_id}`,
        plan.execution_id,
      ],
    );
    await q(
      client,
      `INSERT INTO foundation_v2.ava_packet_proofs
        (ava_packet_proof_id, baseline_id, tenant_key, test_namespace, packet_hash, grounding_status,
         unsupported_claim_count, proof_uri, writer_job_id)
       VALUES ($1,$2,$3,$4,$5,$6,0,$7,$8)`,
      [
        row.ava_packet_proof_id,
        plan.baseline_id,
        TENANT_KEY,
        TEST_NAMESPACE,
        sha256(`ava:${row.fixture_id}:${row.ava_grounding_status}`),
        row.ava_grounding_status,
        `proof://foundation-v2/${plan.execution_id}/L12/${row.fixture_id}`,
        plan.execution_id,
      ],
    );
  }

  const gates = expectedTransitionResults(plan.rows, `proof://foundation-v2/${plan.execution_id}/gate-results`);
  for (const gate of gates) {
    await q(
      client,
      `INSERT INTO foundation_v2.gate_results
        (gate_result_id, tenant_key, test_namespace, gate_id, transition, input_count, output_count,
         unexplained_variance, gate_status, failure_classification, repair_owner, rerun_scope, proof_uri, writer_job_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'foundation-v2-agent','earliest_failed_transition',$11,$12)`,
      [
        `${SOURCE_RELEASE_ID}:${gate.gate_id}`,
        TENANT_KEY,
        TEST_NAMESPACE,
        gate.gate_id,
        gate.transition,
        gate.input_count,
        gate.output_count,
        gate.unexplained_variance,
        gate.status,
        gate.status === "passed" ? null : "UNEXPLAINED_VARIANCE",
        gate.proof_uri,
        plan.execution_id,
      ],
    );
  }
}

async function schemaReadback(client) {
  const tables = await rows(
    client,
    `SELECT c.relname AS table_name,
            c.relrowsecurity AS rls_enabled,
            has_table_privilege(current_user, format('foundation_v2.%I', c.relname), 'INSERT') AS current_user_can_insert,
            has_table_privilege(current_user, format('foundation_v2.%I', c.relname), 'SELECT') AS current_user_can_select
       FROM pg_class c
       JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'foundation_v2'
        AND c.relkind = 'r'
      ORDER BY c.relname`,
  );
  const columns = await rows(
    client,
    `SELECT table_name, column_name, data_type, is_nullable, ordinal_position
       FROM information_schema.columns
      WHERE table_schema = 'foundation_v2'
      ORDER BY table_name, ordinal_position`,
  );
  const constraints = await rows(
    client,
    `SELECT con.conname AS constraint_name,
            rel.relname AS table_name,
            con.contype AS constraint_type,
            pg_get_constraintdef(con.oid) AS definition
       FROM pg_constraint con
       JOIN pg_class rel ON rel.oid = con.conrelid
       JOIN pg_namespace n ON n.oid = rel.relnamespace
      WHERE n.nspname = 'foundation_v2'
      ORDER BY rel.relname, con.conname`,
  );
  const indexes = await rows(
    client,
    `SELECT tablename AS table_name, indexname AS index_name, indexdef AS definition
       FROM pg_indexes
      WHERE schemaname = 'foundation_v2'
      ORDER BY tablename, indexname`,
  );
  const policies = await rows(
    client,
    `SELECT c.relname AS table_name,
            p.polname AS policy_name,
            p.polcmd AS policy_command,
            ARRAY(
              SELECT rol.rolname
                FROM pg_roles rol
               WHERE rol.oid = ANY(p.polroles)
               ORDER BY rol.rolname
            ) AS policy_roles,
            pg_get_expr(p.polqual, p.polrelid) AS using_expression,
            pg_get_expr(p.polwithcheck, p.polrelid) AS with_check_expression
       FROM pg_policy p
       JOIN pg_class c ON c.oid = p.polrelid
       JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'foundation_v2'
      ORDER BY c.relname, p.polname`,
  );
  const writerRoleRows = await rows(
    client,
    `SELECT rolname, rolcanlogin
       FROM pg_roles
      WHERE rolname = 'foundation_v2_golden_slice_writer'`,
  );
  const writerRoleReadback = await writerRoleReadbackRows(client);
  const migration = await migrationReadback(client, MIGRATION_NAME);
  const writePolicyMigration = await migrationReadback(client, WRITE_POLICY_MIGRATION_NAME);
  const v1 = await v1IsolationSnapshot(client);
  const writerRole = writerRoleRows[0] || null;
  const summary = {
    table_count: tables.length,
    column_count: columns.length,
    primary_key_count: constraints.filter((constraint) => constraint.constraint_type === "p").length,
    foreign_key_count: constraints.filter((constraint) => constraint.constraint_type === "f").length,
    unique_constraint_count: constraints.filter((constraint) => constraint.constraint_type === "u").length,
    check_constraint_count: constraints.filter((constraint) => constraint.constraint_type === "c").length,
    index_count: indexes.length,
    rls_tables: tables.filter((table) => table.rls_enabled).length,
    policies_with_admin_bypass: policies.filter((policy) => /internal-admin/i.test(policy.using_expression || "")).length,
    insert_policy_count: policies.filter((policy) => policy.policy_name === "foundation_v2_tenant_insert").length,
    writer_insert_policies: policies.filter(
      (policy) =>
        policy.policy_name === "foundation_v2_tenant_insert" &&
        policy.policy_command === "a" &&
        (policy.policy_roles || []).includes("foundation_v2_golden_slice_writer") &&
        /app\.tenant_key/.test(policy.with_check_expression || "") &&
        /app\.foundation_v2_test_namespace/.test(policy.with_check_expression || ""),
    ).length,
    pinned_writer_insert_policies: policies.filter(
      (policy) =>
        policy.policy_name === "foundation_v2_tenant_insert" &&
        policy.policy_command === "a" &&
        (policy.policy_roles || []).includes("foundation_v2_golden_slice_writer") &&
        /tenant_key = 'skyharbor-air'/.test(policy.with_check_expression || "") &&
        /test_namespace = 'foundation-v2-golden-slice-v1'/.test(policy.with_check_expression || "") &&
        /app\.foundation_v2_source_release_id/.test(policy.with_check_expression || "") &&
        /app\.foundation_v2_release_alias/.test(policy.with_check_expression || "") &&
        /airline-demo-new-foundation-v2-golden-slice-v1/.test(policy.with_check_expression || "") &&
        /airline-demo-new/.test(policy.with_check_expression || ""),
    ).length,
    writer_role_present: Boolean(writerRole),
    writer_role_can_login: Boolean(writerRole?.rolcanlogin),
    session_user: writerRoleReadback.session_user,
    session_user_is_superuser: writerRoleReadback.session_user_is_superuser,
    session_user_bypassrls: writerRoleReadback.session_user_bypassrls,
    can_set_writer_role: writerRoleReadback.can_set_writer_role,
    active_role_after_set_role: writerRoleReadback.active_role_after_set_role,
    v1_relations_checked: v1.length,
  };
  return {
    status:
      summary.table_count === FOUNDATION_TABLES.length &&
      summary.rls_tables === FOUNDATION_TABLES.length &&
      summary.policies_with_admin_bypass === 0 &&
      summary.insert_policy_count === FOUNDATION_TABLES.length &&
      summary.writer_insert_policies === FOUNDATION_TABLES.length &&
      summary.pinned_writer_insert_policies === FOUNDATION_TABLES.length &&
      summary.writer_role_present &&
      !summary.writer_role_can_login &&
      summary.can_set_writer_role &&
      !summary.session_user_is_superuser &&
      !summary.session_user_bypassrls &&
      summary.active_role_after_set_role === WRITER_ROLE &&
      migration.present &&
      migration.sha256 === EXPECTED_MIGRATION_SHA256 &&
      writePolicyMigration.present &&
      writePolicyMigration.sha256 === EXPECTED_WRITE_POLICY_MIGRATION_SHA256
        ? "FOUNDATION_V2_SCHEMA_READBACK_PASSED"
        : "FOUNDATION_V2_SCHEMA_READBACK_FAILED",
    generated_at: new Date().toISOString(),
    tenant_key: TENANT_KEY,
    test_namespace: TEST_NAMESPACE,
    migration,
    write_policy_migration: writePolicyMigration,
    summary,
    tables,
    columns,
    constraints,
    indexes,
    policies,
    v1_isolation_snapshot: v1,
  };
}

async function migrationReadback(client, migrationName) {
  const result = await rows(
    client,
    "SELECT name, sha256, applied_at FROM schema_migrations WHERE name=$1",
    [migrationName],
  );
  const row = result[0] || null;
  return {
    present: Boolean(row),
    name: row?.name || migrationName,
    sha256: row?.sha256 || null,
    applied_at: row?.applied_at || null,
  };
}

async function existingCounts(client) {
  const output = {};
  for (const table of FOUNDATION_TABLES) {
    output[table] = Number(
      (
        await rows(
          client,
          `SELECT count(*)::int AS count FROM foundation_v2.${table} WHERE tenant_key=$1 AND test_namespace=$2`,
          [TENANT_KEY, TEST_NAMESPACE],
        )
      )[0].count,
    );
  }
  return output;
}

async function existingExecutionReadback(client, plan) {
  const writerRows = await rows(
    client,
    `SELECT writer_job_id, count(*)::int AS row_count
       FROM foundation_v2.source_releases
      WHERE tenant_key=$1 AND test_namespace=$2 AND source_release_id=$3
      GROUP BY writer_job_id`,
    [TENANT_KEY, TEST_NAMESPACE, SOURCE_RELEASE_ID],
  );
  const layerTotals = await dbLayerTotals(client);
  const variance = varianceRegister(plan.expected_layer_totals, layerTotals);
  const persistedFingerprint = await dbPersistenceFingerprint(client);
  const expectedFingerprint = expectedPersistenceFingerprint(plan);
  return {
    writer_job_ids: writerRows.map((row) => row.writer_job_id),
    layer_totals: layerTotals,
    variance,
    expected_fingerprint: expectedFingerprint,
    persisted_fingerprint: persistedFingerprint.fingerprint,
    persisted_identity_snapshot: persistedFingerprint.snapshot,
    exact_match:
      writerRows.length === 1 &&
      writerRows[0].writer_job_id === plan.execution_id &&
      variance.every((row) => Number(row.variance) === 0) &&
      persistedFingerprint.fingerprint === expectedFingerprint,
  };
}

async function activateWriterRole(client) {
  await setFoundationContext(client);
  const role = await writerRoleReadbackRows(client, { probeSetRole: false });
  if (!role.can_set_writer_role) {
    throw new Error(`Fail closed: current DB session cannot assume ${WRITER_ROLE}`);
  }
  if (role.session_user_is_superuser || role.session_user_bypassrls) {
    throw new Error(`Fail closed: writer session user may bypass RLS ${JSON.stringify(role)}`);
  }
  if (!/^[a-z_][a-z0-9_]*$/.test(WRITER_ROLE)) throw new Error(`Invalid writer role ${WRITER_ROLE}`);
  await client.query(`SET LOCAL ROLE ${WRITER_ROLE}`);
  await setFoundationContext(client);
  const active = await rows(client, "SELECT current_user, current_role");
  if (active[0]?.current_user !== WRITER_ROLE || active[0]?.current_role !== WRITER_ROLE) {
    throw new Error(`Fail closed: SET ROLE did not activate ${WRITER_ROLE}`);
  }
}

async function writerRoleReadbackRows(client, { probeSetRole = true } = {}) {
  const session = (
    await rows(
      client,
      `SELECT current_user,
              session_user,
              current_setting('role', true) AS active_set_role,
              pg_has_role(current_user, $1, 'MEMBER') AS can_set_writer_role,
              COALESCE((SELECT rolcanlogin FROM pg_roles WHERE rolname=$1), false) AS writer_role_can_login,
              COALESCE((SELECT rolbypassrls FROM pg_roles WHERE rolname=$1), false) AS writer_role_bypassrls,
              COALESCE((SELECT rolsuper FROM pg_roles WHERE rolname=session_user), false) AS session_user_is_superuser,
              COALESCE((SELECT rolbypassrls FROM pg_roles WHERE rolname=session_user), false) AS session_user_bypassrls`,
      [WRITER_ROLE],
    )
  )[0];
  let activeRoleAfterSetRole = null;
  if (probeSetRole && session?.can_set_writer_role && !session.session_user_is_superuser && !session.session_user_bypassrls) {
    await client.query("BEGIN");
    try {
      await setFoundationContext(client);
      await client.query(`SET LOCAL ROLE ${WRITER_ROLE}`);
      activeRoleAfterSetRole = (await rows(client, "SELECT current_role"))[0]?.current_role || null;
      await client.query("ROLLBACK");
    } catch (error) {
      await client.query("ROLLBACK").catch(() => {});
      activeRoleAfterSetRole = `ERROR:${error.message}`;
    }
  }
  return {
    ...session,
    active_role_after_set_role: activeRoleAfterSetRole,
  };
}

async function dbPersistenceFingerprint(client) {
  const release = (
    await rows(
      client,
      `SELECT source_release_id, release_hash
         FROM foundation_v2.source_releases
        WHERE tenant_key=$1 AND test_namespace=$2 AND source_release_id=$3`,
      [TENANT_KEY, TEST_NAMESPACE, SOURCE_RELEASE_ID],
    )
  )[0];
  const sourceFile = (
    await rows(
      client,
      `SELECT source_file_id, content_sha256
         FROM foundation_v2.source_files
        WHERE tenant_key=$1 AND test_namespace=$2 AND source_release_id=$3
        ORDER BY source_file_id
        LIMIT 1`,
      [TENANT_KEY, TEST_NAMESPACE, SOURCE_RELEASE_ID],
    )
  )[0];
  const baseline = (
    await rows(
      client,
      `SELECT baseline_hash
         FROM foundation_v2.baselines
        WHERE tenant_key=$1 AND test_namespace=$2
        ORDER BY baseline_id
        LIMIT 1`,
      [TENANT_KEY, TEST_NAMESPACE],
    )
  )[0];
  const projection = (
    await rows(
      client,
      `SELECT projection_hash
         FROM foundation_v2.projection_authority
        WHERE tenant_key=$1 AND test_namespace=$2
        ORDER BY projection_authority_id
        LIMIT 1`,
      [TENANT_KEY, TEST_NAMESPACE],
    )
  )[0];
  const rowSnapshot = await rows(
    client,
    `SELECT sr.source_record_id,
            sr.source_row_hash,
            sr.row_disposition,
            no.normalized_object_id,
            kc.candidate_id,
            rd.review_decision_id,
            co.canonical_object_id,
            pm.publication_member_id,
            bom.baseline_object_membership_id AS baseline_membership_id,
            pr.projection_row_id,
            cpr.cube_parity_result_id,
            pbp.product_binding_proof_id,
            app.ava_packet_proof_id,
            COALESCE(co.content_hash, kc.content_hash, no.content_hash) AS content_hash
       FROM foundation_v2.source_records sr
       LEFT JOIN foundation_v2.normalized_objects no USING (tenant_key, test_namespace, source_record_id)
       LEFT JOIN foundation_v2.knowledge_candidates kc USING (tenant_key, test_namespace, normalized_object_id)
       LEFT JOIN foundation_v2.review_decisions rd USING (tenant_key, test_namespace, candidate_id)
       LEFT JOIN foundation_v2.canonical_objects co USING (tenant_key, test_namespace, review_decision_id)
       LEFT JOIN foundation_v2.publication_members pm USING (tenant_key, test_namespace, canonical_object_id)
       LEFT JOIN foundation_v2.baseline_object_memberships bom USING (tenant_key, test_namespace, publication_member_id)
       LEFT JOIN foundation_v2.projection_rows pr USING (tenant_key, test_namespace, baseline_object_membership_id)
       LEFT JOIN foundation_v2.cube_parity_results cpr
         ON cpr.tenant_key=sr.tenant_key AND cpr.test_namespace=sr.test_namespace
        AND cpr.cube_parity_result_id=$3 || ':cube-parity-' || lpad(sr.source_row_number::text, 3, '0')
       LEFT JOIN foundation_v2.product_binding_proofs pbp
         ON pbp.tenant_key=sr.tenant_key AND pbp.test_namespace=sr.test_namespace
        AND pbp.product_binding_proof_id=$3 || ':product-binding-' || lpad(sr.source_row_number::text, 3, '0')
       LEFT JOIN foundation_v2.ava_packet_proofs app
         ON app.tenant_key=sr.tenant_key AND app.test_namespace=sr.test_namespace
        AND app.ava_packet_proof_id=$3 || ':ava-packet-' || lpad(sr.source_row_number::text, 3, '0')
      WHERE sr.tenant_key=$1 AND sr.test_namespace=$2
      ORDER BY sr.source_record_id`,
    [TENANT_KEY, TEST_NAMESPACE, SOURCE_RELEASE_ID],
  );
  const sourceFields = await rows(
    client,
    `SELECT source_field_value_id, source_record_id, source_field_id, source_field_name,
            normalized_value, field_disposition, restricted
       FROM foundation_v2.source_field_values
      WHERE tenant_key=$1 AND test_namespace=$2
      ORDER BY source_record_id,
               CASE source_field_name
                 WHEN 'business_key' THEN 1
                 WHEN 'evidence_ref' THEN 2
                 WHEN 'state' THEN 3
                 ELSE 99
               END,
               source_field_value_id`,
    [TENANT_KEY, TEST_NAMESPACE],
  );
  const reviewDecisions = await rows(
    client,
    `SELECT review_decision_id, candidate_id, review_decision
       FROM foundation_v2.review_decisions
      WHERE tenant_key=$1 AND test_namespace=$2
      ORDER BY review_decision_id`,
    [TENANT_KEY, TEST_NAMESPACE],
  );
  const cubeParityResults = await rows(
    client,
    `SELECT cube_parity_result_id, projection_authority_id, cube_object_name, direct_sql_hash, cube_query_hash, parity_status
       FROM foundation_v2.cube_parity_results
      WHERE tenant_key=$1 AND test_namespace=$2
      ORDER BY cube_parity_result_id`,
    [TENANT_KEY, TEST_NAMESPACE],
  );
  const productBindingProofs = await rows(
    client,
    `SELECT product_binding_proof_id, projection_authority_id, component_id, render_gate_status, unsupported_claim_count
       FROM foundation_v2.product_binding_proofs
      WHERE tenant_key=$1 AND test_namespace=$2
      ORDER BY product_binding_proof_id`,
    [TENANT_KEY, TEST_NAMESPACE],
  );
  const avaPacketProofs = await rows(
    client,
    `SELECT ava_packet_proof_id, baseline_id, packet_hash, grounding_status, unsupported_claim_count
       FROM foundation_v2.ava_packet_proofs
      WHERE tenant_key=$1 AND test_namespace=$2
      ORDER BY ava_packet_proof_id`,
    [TENANT_KEY, TEST_NAMESPACE],
  );
  const gateResults = await rows(
    client,
    `SELECT gate_id, transition, input_count, output_count, unexplained_variance, gate_status
       FROM foundation_v2.gate_results
      WHERE tenant_key=$1 AND test_namespace=$2
      ORDER BY gate_id`,
    [TENANT_KEY, TEST_NAMESPACE],
  );
  const querySets = {
    tenant_key: TENANT_KEY,
    test_namespace: TEST_NAMESPACE,
    source_release_id: SOURCE_RELEASE_ID,
    release_hash: release?.release_hash || null,
    source_file_id: sourceFile?.source_file_id || null,
    source_file_hash: sourceFile?.content_sha256 || null,
    baseline_hash: baseline?.baseline_hash || null,
    projection_hash: projection?.projection_hash || null,
    rows: rowSnapshot,
    source_field_rows: sourceFields,
    review_decisions: reviewDecisions,
    cube_parity_results: cubeParityResults,
    product_binding_proofs: productBindingProofs,
    ava_packet_proofs: avaPacketProofs,
    gate_results: gateResults,
  };
  return {
    fingerprint: sha256(stableJson(querySets)),
    snapshot: querySets,
  };
}

async function dbLayerTotals(client) {
  const sql = `
    SELECT json_build_object(
      'L0_source_rows', (SELECT count(*)::int FROM foundation_v2.source_records WHERE tenant_key=$1 AND test_namespace=$2),
      'L1_landed_rows', (SELECT count(*)::int FROM foundation_v2.source_records WHERE tenant_key=$1 AND test_namespace=$2),
      'L2_parsed_rows', (SELECT count(DISTINCT source_record_id)::int FROM foundation_v2.source_field_values WHERE tenant_key=$1 AND test_namespace=$2),
      'L3_normalized_records', (SELECT count(*)::int FROM foundation_v2.normalized_objects WHERE tenant_key=$1 AND test_namespace=$2),
      'L4_candidates', (SELECT count(*)::int FROM foundation_v2.knowledge_candidates WHERE tenant_key=$1 AND test_namespace=$2),
      'L5_review_decisions', (SELECT count(*)::int FROM foundation_v2.review_decisions WHERE tenant_key=$1 AND test_namespace=$2),
      'L6_canonical_objects', (SELECT count(*)::int FROM foundation_v2.canonical_objects WHERE tenant_key=$1 AND test_namespace=$2),
      'L7_publication_items', (SELECT count(*)::int FROM foundation_v2.publication_members WHERE tenant_key=$1 AND test_namespace=$2),
      'L8_baseline_memberships', (SELECT count(*)::int FROM foundation_v2.baseline_object_memberships WHERE tenant_key=$1 AND test_namespace=$2),
      'L9_projection_rows', (SELECT count(*)::int FROM foundation_v2.projection_rows WHERE tenant_key=$1 AND test_namespace=$2),
      'L10_cube_outputs', (SELECT count(*)::int FROM foundation_v2.cube_parity_results WHERE tenant_key=$1 AND test_namespace=$2 AND parity_status='passed'),
      'L11_product_claims', (SELECT count(*)::int FROM foundation_v2.product_binding_proofs WHERE tenant_key=$1 AND test_namespace=$2 AND render_gate_status='passed'),
      'L12_ava_outputs', (SELECT count(*)::int FROM foundation_v2.ava_packet_proofs WHERE tenant_key=$1 AND test_namespace=$2 AND grounding_status='grounded')
    ) AS totals`;
  return (await rows(client, sql, [TENANT_KEY, TEST_NAMESPACE]))[0].totals;
}

function varianceRegister(expected, actual) {
  return Object.keys(expected).map((layer) => ({
    layer_id: layer,
    expected_count: expected[layer],
    actual_count: actual[layer] ?? 0,
    variance: (actual[layer] ?? 0) - expected[layer],
    unexplained_variance: Math.abs((actual[layer] ?? 0) - expected[layer]),
  }));
}

async function v1IsolationSnapshot(client) {
  const output = [];
  for (const relation of V1_RELATIONS) {
    const exists = await relationExists(client, relation);
    if (!exists) {
      output.push({ relation, exists: false, row_count: null });
      continue;
    }
    const result = await rows(client, `SELECT count(*)::bigint AS count FROM ${relation}`);
    output.push({ relation, exists: true, row_count: result[0].count });
  }
  return output;
}

async function relationExists(client, relation) {
  const result = await rows(client, "SELECT to_regclass($1) IS NOT NULL AS exists", [relation]);
  return result[0].exists;
}

async function setFoundationContext(client) {
  await q(client, "SELECT set_config('app.tenant_key', $1, true)", [TENANT_KEY]);
  await q(client, "SELECT set_config('app.client_key', $1, true)", [TENANT_KEY]);
  await q(client, "SELECT set_config('app.foundation_v2_test_namespace', $1, true)", [TEST_NAMESPACE]);
  await q(client, "SELECT set_config('app.foundation_v2_source_release_id', $1, true)", [SOURCE_RELEASE_ID]);
  await q(client, "SELECT set_config('app.foundation_v2_release_alias', $1, true)", ["airline-demo-new"]);
}

function writeApplyProof(outDir, plan, manifest, varianceRows, layerTotals) {
  writeJson(proofRef(outDir, "FOUNDATION_V2_GOLDEN_SLICE_MANIFEST.json"), manifest);
  writeCsv(proofRef(outDir, "FOUNDATION_V2_GOLDEN_SLICE_LAYER_TOTALS.csv"), [
    "layer_id",
    "execution_id",
    "tenant",
    "source_release",
    "expected_count",
    "actual_count",
    "variance",
  ], Object.entries(layerTotals).map(([layer, actual]) => ({
    layer_id: layer,
    execution_id: plan.execution_id,
    tenant: TENANT_KEY,
    source_release: SOURCE_RELEASE_ID,
    expected_count: plan.expected_layer_totals[layer],
    actual_count: actual,
    variance: actual - plan.expected_layer_totals[layer],
  })));
  writeCsv(proofRef(outDir, "FOUNDATION_V2_GOLDEN_SLICE_VARIANCE_REGISTER.csv"), [
    "layer_id",
    "expected_count",
    "actual_count",
    "variance",
    "unexplained_variance",
  ], varianceRows);
  writeJson(proofRef(outDir, "FOUNDATION_V2_GOLDEN_SLICE_EXECUTOR_APPLY_PROOF.json"), {
    ...manifest,
    deterministic_content_hash: sha256(stableJson({ manifest, layerTotals, varianceRows })),
  });
}

function writeSecurityProof(outDir, schema) {
  writeMarkdown(
    proofRef(outDir, "FOUNDATION_V2_GOLDEN_SLICE_SECURITY_PROOF.md"),
    `# Foundation V2 Golden Slice Security Proof

Status: ${schema.status}

- Tenant key: \`${TENANT_KEY}\`
- Test namespace: \`${TEST_NAMESPACE}\`
- Foundation V2 tables: ${schema.summary.table_count}
- RLS-enabled tables: ${schema.summary.rls_tables}
- INSERT tenant policies: ${schema.summary.insert_policy_count}
- Pinned writer INSERT policies: ${schema.summary.pinned_writer_insert_policies}
- Writer role present: ${schema.summary.writer_role_present}
- Writer role can login: ${schema.summary.writer_role_can_login}
- Can SET ROLE to writer: ${schema.summary.can_set_writer_role}
- Session user is superuser: ${schema.summary.session_user_is_superuser}
- Session user BYPASSRLS: ${schema.summary.session_user_bypassrls}
- Active role after SET ROLE proof: ${schema.summary.active_role_after_set_role}
- Policies with internal-admin bypass: ${schema.summary.policies_with_admin_bypass}
- V1 relations checked: ${schema.summary.v1_relations_checked}

This proof is schema readback only. It does not approve full reload, active baseline activation, live provider cutover, V1 mutation, or production aVa activation.
`,
  );
}

function runSelfTest(plan, outDir) {
  const gates = expectedTransitionResults(plan.rows, "self-test");
  const failures = [];
  if (plan.rows.length !== 21) failures.push(`expected 21 plan rows, got ${plan.rows.length}`);
  if (plan.source_field_rows.length !== plan.expected_layer_totals.L2_parsed_rows * 3) {
    failures.push("field row total does not match parsed-row field contract");
  }
  if (gates.some((gate) => gate.unexplained_variance !== 0)) failures.push("gate unexplained variance is non-zero");
  if (plan.baseline_id.includes("knowledge-baseline-v1")) failures.push("baseline id looks like live V1 baseline");
  const proof = createManifest(plan, failures.length === 0 ? "FOUNDATION_V2_GOLDEN_SLICE_EXECUTOR_SELF_TEST_PASSED" : "FOUNDATION_V2_GOLDEN_SLICE_EXECUTOR_SELF_TEST_FAILED", {
    failures,
    field_rows: plan.source_field_rows.length,
    gate_results: gates,
  });
  writeJson(proofRef(outDir, "FOUNDATION_V2_GOLDEN_SLICE_EXECUTOR_SELF_TEST.json"), proof);
  console.log(JSON.stringify(proof, null, 2));
  if (failures.length > 0) process.exit(1);
}

function objectType(sourceFamily) {
  return sourceFamily.replaceAll("_and_", "_").replaceAll("_", "-").slice(0, 64);
}

async function q(client, sql, params = []) {
  return client.query(sql, params);
}

async function rows(client, sql, params = []) {
  return (await client.query(sql, params)).rows;
}
