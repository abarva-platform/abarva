#!/usr/bin/env node
import {
  DEFAULT_EXECUTION_ID,
  FOUNDATION_RELEASE_ALIAS,
  IDENTITY_CONTROL_MIGRATION_NAME,
  ISOLATION_SCOPE,
  MIGRATION_NAME,
  SOURCE_RELEASE_ID,
  TENANT_KEY,
  TEST_NAMESPACE,
  WRITER_ROLE,
  WRITE_POLICY_MIGRATION_NAME,
  bindFoundationV2SqlContext,
  buildFixturePlan,
  createManifest,
  emitProofBundle,
  expectedPersistenceFingerprint,
  expectedTransitionResults,
  expectedMigrationLedgerReadback,
  GATE_RESULT_ORDER_SQL,
  foundationPostgresClientOptions,
  migrationLedgerName,
  parseArgs,
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
let probeCounter = 0;

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

  const { Client } = await importPg();
  const client = new Client(await foundationPostgresClientOptions("foundation-v2-golden-slice-executor"));
  bindFoundationV2SqlContext(client);
  await client.connect();
  try {
    if (options.mode === "schema-readback") {
      const schema = await schemaReadback(client);
      writeJson(proofRef(options.outDir, "FOUNDATION_V2_GOLDEN_SLICE_SCHEMA_READBACK.json"), schema);
      writeSecurityProof(options.outDir, schema);
      if (options.emitProofBundle) printCompactResult("schema-readback", schema);
      console.log(JSON.stringify(schema, null, 2));
      if (options.emitProofBundle) emitProofBundle(options.outDir);
      if (options.emitProofBundle) printCompactResult("schema-readback", schema);
      if (schema.status !== "FOUNDATION_V2_SCHEMA_READBACK_PASSED") process.exitCode = 1;
      return;
    }
    if (options.mode === "preflight") {
      const proof = await preflight(client, plan);
      writeJson(proofRef(options.outDir, "FOUNDATION_V2_GOLDEN_SLICE_PREFLIGHT.json"), proof);
      if (options.emitProofBundle) printCompactResult("preflight", proof);
      console.log(JSON.stringify(proof, null, 2));
      if (options.emitProofBundle) emitProofBundle(options.outDir);
      if (options.emitProofBundle) printCompactResult("preflight", proof);
      if (proof.status !== "FOUNDATION_V2_GOLDEN_SLICE_PREFLIGHT_PASSED") process.exitCode = 1;
      return;
    }
    if (options.mode !== "apply") throw new Error(`Unsupported mode ${options.mode}`);
    const result = await applyGoldenSlice(client, plan, options.outDir);
    if (options.emitProofBundle) printCompactResult("apply", result);
    console.log(JSON.stringify(result, null, 2));
    if (options.emitProofBundle) emitProofBundle(options.outDir);
    if (options.emitProofBundle) printCompactResult("apply", result);
  } finally {
    await client.end();
  }
}

function printCompactResult(mode, result) {
  console.log(
    JSON.stringify({
      foundation_v2_compact_result: mode,
      status: result.status,
      defects: compactDefects(result),
      summary: compactSummary(result),
    }),
  );
}

function compactDefects(result) {
  if (Array.isArray(result.defects)) return result.defects;
  if (result.status === "FOUNDATION_V2_SCHEMA_READBACK_PASSED") return [];
  if (result.summary) return schemaReadbackDefects(result);
  return [];
}

function compactSummary(result) {
  if (!result.summary) {
    return {
      tenant_key: result.tenant_key,
      test_namespace: result.test_namespace,
      row_variance: result.row_variance,
      field_variance: result.field_variance,
      first_broken_transition: result.first_broken_transition,
    };
  }
  return {
    table_count: result.summary.table_count,
    rls_tables: result.summary.rls_tables,
    insert_policy_count: result.summary.insert_policy_count,
    writer_insert_policies: result.summary.writer_insert_policies,
    pinned_writer_insert_policies: result.summary.pinned_writer_insert_policies,
    policies_with_admin_bypass: result.summary.policies_with_admin_bypass,
    writer_role_present: result.summary.writer_role_present,
    writer_role_can_login: result.summary.writer_role_can_login,
    writer_role_bypassrls: result.summary.writer_role_bypassrls,
    writer_role_inherit: result.summary.writer_role_inherit,
    force_rls_tables: result.summary.force_rls_tables,
    writer_owned_tables: result.summary.writer_owned_tables,
    row_security: result.summary.row_security,
    can_set_writer_role: result.summary.can_set_writer_role,
    session_user: result.summary.session_user,
    session_user_is_superuser: result.summary.session_user_is_superuser,
    session_user_bypassrls: result.summary.session_user_bypassrls,
    active_role_after_set_role: result.summary.active_role_after_set_role,
    migration_present: result.migration?.present,
    migration_sha256: result.migration?.sha256,
    write_policy_migration_present: result.write_policy_migration?.present,
    write_policy_migration_sha256: result.write_policy_migration?.sha256,
  };
}

function schemaReadbackDefects(schema) {
  const defects = [];
  const summary = schema.summary || {};
  if (summary.table_count !== FOUNDATION_TABLES.length) {
    defects.push(`expected ${FOUNDATION_TABLES.length} tables, found ${summary.table_count}`);
  }
  if (summary.rls_tables !== FOUNDATION_TABLES.length) {
    defects.push(`expected RLS on ${FOUNDATION_TABLES.length} tables, found ${summary.rls_tables}`);
  }
  if (summary.force_rls_tables !== FOUNDATION_TABLES.length) {
    defects.push(`expected FORCE RLS on ${FOUNDATION_TABLES.length} tables, found ${summary.force_rls_tables}`);
  }
  if (summary.policies_with_admin_bypass !== 0) {
    defects.push(`expected zero admin-bypass policies, found ${summary.policies_with_admin_bypass}`);
  }
  if (summary.insert_policy_count !== FOUNDATION_TABLES.length) {
    defects.push(`expected ${FOUNDATION_TABLES.length} insert policies, found ${summary.insert_policy_count}`);
  }
  if (summary.writer_insert_policies !== FOUNDATION_TABLES.length) {
    defects.push(`expected ${FOUNDATION_TABLES.length} writer insert policies, found ${summary.writer_insert_policies}`);
  }
  if (summary.pinned_writer_insert_policies !== FOUNDATION_TABLES.length) {
    defects.push(
      `expected ${FOUNDATION_TABLES.length} pinned writer insert policies, found ${summary.pinned_writer_insert_policies}`,
    );
  }
  if (!summary.writer_role_present) defects.push(`${WRITER_ROLE} role missing`);
  if (summary.writer_role_can_login) defects.push(`${WRITER_ROLE} must not be able to login`);
  if (summary.writer_role_bypassrls) defects.push(`${WRITER_ROLE} must not bypass RLS`);
  if (summary.writer_owned_tables !== 0) defects.push(`${WRITER_ROLE} owns ${summary.writer_owned_tables} Foundation V2 tables`);
  if (summary.row_security !== "on") defects.push(`row_security is ${summary.row_security || "missing"}`);
  if (!summary.can_set_writer_role) defects.push(`current DB session cannot assume ${WRITER_ROLE}`);
  if (summary.session_user_is_superuser) defects.push("current DB session user is superuser");
  if (summary.session_user_bypassrls) defects.push("current DB session user can bypass RLS");
  if (summary.active_role_after_set_role !== WRITER_ROLE) {
    defects.push(`SET ROLE readback was ${summary.active_role_after_set_role || "missing"}`);
  }
  if (!schema.migration?.present) defects.push(`missing migration ${MIGRATION_NAME}`);
  if (schema.migration?.sha256 !== expectedMigrationLedgerReadback(MIGRATION_NAME).ledger_sha256) {
    defects.push(`migration sha mismatch ${schema.migration?.sha256 || "missing"}`);
  }
  if (!schema.write_policy_migration?.present) defects.push(`missing migration ${WRITE_POLICY_MIGRATION_NAME}`);
  if (schema.write_policy_migration?.sha256 !== expectedMigrationLedgerReadback(WRITE_POLICY_MIGRATION_NAME).ledger_sha256) {
    defects.push(`write policy migration sha mismatch ${schema.write_policy_migration?.sha256 || "missing"}`);
  }
  if (!schema.identity_control_migration?.present) defects.push(`missing migration ${IDENTITY_CONTROL_MIGRATION_NAME}`);
  if (schema.identity_control_migration?.sha256 !== expectedMigrationLedgerReadback(IDENTITY_CONTROL_MIGRATION_NAME).ledger_sha256) {
    defects.push(`identity-control migration sha mismatch ${schema.identity_control_migration?.sha256 || "missing"}`);
  }
  return defects;
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
  const identityControlMigration = await migrationReadback(client, IDENTITY_CONTROL_MIGRATION_NAME);
  await client.query("BEGIN");
  let existing;
  let securityPreflight;
  try {
    securityPreflight = await runWriterSecurityPreflight(client);
    existing = await existingCounts(client);
    await client.query("ROLLBACK");
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  }
  const defects = [];
  if (!migration.present) defects.push(`missing migration ${MIGRATION_NAME}`);
  if (migration.sha256 !== expectedMigrationLedgerReadback(MIGRATION_NAME).ledger_sha256) {
    defects.push(`migration sha mismatch ${migration.sha256 || "missing"}`);
  }
  if (!writePolicyMigration.present) defects.push(`missing migration ${WRITE_POLICY_MIGRATION_NAME}`);
  if (writePolicyMigration.sha256 !== expectedMigrationLedgerReadback(WRITE_POLICY_MIGRATION_NAME).ledger_sha256) {
    defects.push(`write policy migration sha mismatch ${writePolicyMigration.sha256 || "missing"}`);
  }
  if (!identityControlMigration.present) defects.push(`missing migration ${IDENTITY_CONTROL_MIGRATION_NAME}`);
  if (identityControlMigration.sha256 !== expectedMigrationLedgerReadback(IDENTITY_CONTROL_MIGRATION_NAME).ledger_sha256) {
    defects.push(`identity-control migration sha mismatch ${identityControlMigration.sha256 || "missing"}`);
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
    identity_control_migration: identityControlMigration,
    security_preflight: securityPreflight,
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
    if (!migration.present || migration.sha256 !== expectedMigrationLedgerReadback(MIGRATION_NAME).ledger_sha256) {
      throw new Error(`Fail closed: migration ${MIGRATION_NAME} not present with approved SHA`);
    }
    const writePolicyMigration = await migrationReadback(client, WRITE_POLICY_MIGRATION_NAME);
    if (!writePolicyMigration.present || writePolicyMigration.sha256 !== expectedMigrationLedgerReadback(WRITE_POLICY_MIGRATION_NAME).ledger_sha256) {
      throw new Error(`Fail closed: migration ${WRITE_POLICY_MIGRATION_NAME} not present with approved SHA`);
    }
    const identityControlMigration = await migrationReadback(client, IDENTITY_CONTROL_MIGRATION_NAME);
    if (!identityControlMigration.present || identityControlMigration.sha256 !== expectedMigrationLedgerReadback(IDENTITY_CONTROL_MIGRATION_NAME).ledger_sha256) {
      throw new Error(`Fail closed: migration ${IDENTITY_CONTROL_MIGRATION_NAME} not present with approved SHA`);
    }
    const v1Before = await v1IsolationSnapshot(client, { inTransaction: true });
    const securityPreflight = await runWriterSecurityPreflight(client);

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
    const v1After = await v1IsolationSnapshot(client, { inTransaction: true });
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
      security_preflight: securityPreflight,
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
  await client.query("SET row_security = on");
  const tables = await rows(
    client,
    `SELECT c.relname AS table_name,
            c.relrowsecurity AS rls_enabled,
            c.relforcerowsecurity AS force_rls_enabled,
            pg_get_userbyid(c.relowner) AS table_owner,
            has_table_privilege(current_user, c.oid, 'INSERT') AS current_user_can_insert,
            has_table_privilege(current_user, c.oid, 'SELECT') AS current_user_can_select
       FROM pg_class c
       JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'foundation_v2'
        AND c.relkind = 'r'
      ORDER BY c.relname`,
  );
  const columns = await rows(
    client,
    `SELECT c.relname AS table_name,
            a.attname AS column_name,
            format_type(a.atttypid, a.atttypmod) AS data_type,
            CASE WHEN a.attnotnull THEN 'NO' ELSE 'YES' END AS is_nullable,
            a.attnum AS ordinal_position
       FROM pg_attribute a
       JOIN pg_class c ON c.oid = a.attrelid
       JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'foundation_v2'
        AND c.relkind = 'r'
        AND a.attnum > 0
        AND NOT a.attisdropped
      ORDER BY c.relname, a.attnum`,
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
    `SELECT c.relname AS table_name,
            i.relname AS index_name,
            pg_get_indexdef(i.oid) AS definition
       FROM pg_index ix
       JOIN pg_class c ON c.oid = ix.indrelid
       JOIN pg_class i ON i.oid = ix.indexrelid
       JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'foundation_v2'
      ORDER BY c.relname, i.relname`,
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
    `SELECT rolname, rolcanlogin, rolsuper, rolcreatedb, rolcreaterole, rolreplication, rolbypassrls, rolinherit
       FROM pg_roles
       WHERE rolname = $1`,
    [WRITER_ROLE],
  );
  const writerRoleReadback = await writerRoleReadbackRows(client);
  const migration = await migrationReadback(client, MIGRATION_NAME);
  const writePolicyMigration = await migrationReadback(client, WRITE_POLICY_MIGRATION_NAME);
  const identityControlMigration = await migrationReadback(client, IDENTITY_CONTROL_MIGRATION_NAME);
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
    force_rls_tables: tables.filter((table) => table.force_rls_enabled).length,
    writer_owned_tables: tables.filter((table) => table.table_owner === WRITER_ROLE).length,
    policies_with_admin_bypass: policies.filter((policy) => /internal-admin/i.test(policy.using_expression || "")).length,
    insert_policy_count: policies.filter((policy) => policy.policy_name === "foundation_v2_tenant_insert").length,
    writer_insert_policies: policies.filter(
      (policy) =>
        policy.policy_name === "foundation_v2_tenant_insert" &&
        policy.policy_command === "a" &&
        (policy.policy_roles || []).includes(WRITER_ROLE) &&
        /app\.tenant_key/.test(policy.with_check_expression || "") &&
        /app\.foundation_v2_test_namespace/.test(policy.with_check_expression || ""),
    ).length,
    pinned_writer_insert_policies: policies.filter(
      (policy) =>
        policy.policy_name === "foundation_v2_tenant_insert" &&
        policy.policy_command === "a" &&
        (policy.policy_roles || []).includes(WRITER_ROLE) &&
        includesSqlLiteral(policy.with_check_expression, "tenant_key", TENANT_KEY) &&
        includesSqlLiteral(policy.with_check_expression, "test_namespace", TEST_NAMESPACE) &&
        /app\.foundation_v2_source_release_id/.test(policy.with_check_expression || "") &&
        /app\.foundation_v2_release_alias/.test(policy.with_check_expression || "") &&
        (policy.with_check_expression || "").includes(SOURCE_RELEASE_ID) &&
        (policy.with_check_expression || "").includes(FOUNDATION_RELEASE_ALIAS),
    ).length,
    writer_role_present: Boolean(writerRole),
    writer_role_can_login: Boolean(writerRole?.rolcanlogin),
    writer_role_superuser: Boolean(writerRole?.rolsuper),
    writer_role_createdb: Boolean(writerRole?.rolcreatedb),
    writer_role_createrole: Boolean(writerRole?.rolcreaterole),
    writer_role_replication: Boolean(writerRole?.rolreplication),
    writer_role_bypassrls: Boolean(writerRole?.rolbypassrls),
    writer_role_inherit: Boolean(writerRole?.rolinherit),
    session_user: writerRoleReadback.session_user,
    row_security: writerRoleReadback.row_security,
    session_user_is_superuser: writerRoleReadback.session_user_is_superuser,
    session_user_createrole: writerRoleReadback.session_user_createrole,
    session_user_createdb: writerRoleReadback.session_user_createdb,
    session_user_replication: writerRoleReadback.session_user_replication,
    session_user_inherit: writerRoleReadback.session_user_inherit,
    session_user_bypassrls: writerRoleReadback.session_user_bypassrls,
    can_set_writer_role: writerRoleReadback.can_set_writer_role,
    active_role_after_set_role: writerRoleReadback.active_role_after_set_role,
    active_role_bypassrls_after_set_role: writerRoleReadback.active_role_bypassrls_after_set_role,
    row_security_after_set_role: writerRoleReadback.row_security_after_set_role,
    v1_relations_checked: v1.length,
  };
  return {
    status:
      summary.table_count === FOUNDATION_TABLES.length &&
      summary.rls_tables === FOUNDATION_TABLES.length &&
      summary.force_rls_tables === FOUNDATION_TABLES.length &&
      summary.writer_owned_tables === 0 &&
      summary.policies_with_admin_bypass === 0 &&
      summary.insert_policy_count === FOUNDATION_TABLES.length &&
      summary.writer_insert_policies === FOUNDATION_TABLES.length &&
      summary.pinned_writer_insert_policies === FOUNDATION_TABLES.length &&
      summary.writer_role_present &&
      !summary.writer_role_can_login &&
      !summary.writer_role_superuser &&
      !summary.writer_role_createdb &&
      !summary.writer_role_createrole &&
      !summary.writer_role_replication &&
      !summary.writer_role_bypassrls &&
      summary.can_set_writer_role &&
      summary.row_security === "on" &&
      !summary.session_user_is_superuser &&
      !summary.session_user_createrole &&
      !summary.session_user_createdb &&
      !summary.session_user_replication &&
      !summary.session_user_bypassrls &&
      summary.active_role_after_set_role === WRITER_ROLE &&
      summary.active_role_bypassrls_after_set_role === false &&
      summary.row_security_after_set_role === "on" &&
      migration.present &&
      migration.sha256 === expectedMigrationLedgerReadback(MIGRATION_NAME).ledger_sha256 &&
      writePolicyMigration.present &&
      writePolicyMigration.sha256 === expectedMigrationLedgerReadback(WRITE_POLICY_MIGRATION_NAME).ledger_sha256 &&
      identityControlMigration.present &&
      identityControlMigration.sha256 === expectedMigrationLedgerReadback(IDENTITY_CONTROL_MIGRATION_NAME).ledger_sha256
        ? "FOUNDATION_V2_SCHEMA_READBACK_PASSED"
        : "FOUNDATION_V2_SCHEMA_READBACK_FAILED",
    generated_at: new Date().toISOString(),
    tenant_key: TENANT_KEY,
    test_namespace: TEST_NAMESPACE,
    migration,
    write_policy_migration: writePolicyMigration,
    identity_control_migration: identityControlMigration,
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
  const ledger = expectedMigrationLedgerReadback(migrationName);
  const result = await rows(
    client,
    "SELECT name, sha256, applied_at FROM schema_migrations WHERE name=$1",
    [migrationLedgerName(migrationName)],
  );
  const row = result[0] || null;
  return {
    present: Boolean(row),
    name: migrationName,
    ledger_name: row?.name || ledger.ledger_name,
    sha256: row?.sha256 || null,
    expected_sha256: ledger.ledger_sha256,
    source_sha256: ledger.source_sha256,
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

function includesSqlLiteral(expression, columnName, expectedValue) {
  const escapedColumnName = escapeRegex(columnName);
  const escapedValue = escapeRegex(expectedValue);
  return new RegExp(`${escapedColumnName}\\s*=\\s*'${escapedValue}'`).test(expression || "");
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function runWriterSecurityPreflight(client) {
  await client.query("SET LOCAL row_security = on");
  await setFoundationContext(client);
  const before = await securityRoleSnapshot(client);
  assertSecurityRoleSnapshot(before, "before SET ROLE", { currentUser: before.session_user });
  if (before.session_user === "abarvaadmin") throw new Error("Fail closed: session user is abarvaadmin");
  if (!before.session_user_can_set_writer_role) throw new Error(`Fail closed: session user cannot assume ${WRITER_ROLE}`);

  await client.query(`SET LOCAL ROLE ${WRITER_ROLE}`);
  await setFoundationContext(client);
  const after = await securityRoleSnapshot(client);
  assertSecurityRoleSnapshot(after, "after SET ROLE", { currentUser: WRITER_ROLE });
  if (after.session_user !== before.session_user) throw new Error("Fail closed: session user changed after SET ROLE");

  const probes = [];
  await client.query("SAVEPOINT foundation_v2_security_preflight_scope");
  try {
    probes.push(
      await probeSql(
        client,
        "permitted isolated source_release write/read",
        `INSERT INTO foundation_v2.source_releases
         (source_release_id, tenant_key, test_namespace, release_version, release_hash,
          source_release_state, isolation_scope, v1_component_classification, writer_job_id)
       VALUES ($1,$2,$3,'security-preflight',$4,'isolated_golden_slice',$5,'SUPERSEDE_WITH_V2','security-preflight')
       ON CONFLICT DO NOTHING`,
        [SOURCE_RELEASE_ID, TENANT_KEY, TEST_NAMESPACE, sha256("foundation-v2-security-preflight"), ISOLATION_SCOPE],
        { expect: "success" },
      ),
    );
    probes.push(
      await probeSql(
        client,
        "permitted isolated source_release read",
        "SELECT count(*)::int AS count FROM foundation_v2.source_releases WHERE tenant_key=$1 AND test_namespace=$2",
        [TENANT_KEY, TEST_NAMESPACE],
        { expect: "success" },
      ),
    );
    probes.push(
      await probeSql(
        client,
        "cross-tenant insert rejected",
        `INSERT INTO foundation_v2.source_releases
         (source_release_id, tenant_key, test_namespace, release_version, release_hash,
          source_release_state, isolation_scope, v1_component_classification, writer_job_id)
       VALUES ($1,'wrong-tenant',$2,'security-preflight-bad',$3,'isolated_golden_slice',$4,'SUPERSEDE_WITH_V2','security-preflight')`,
        [`${SOURCE_RELEASE_ID}:wrong-tenant`, TEST_NAMESPACE, sha256("foundation-v2-security-preflight-bad"), ISOLATION_SCOPE],
        { expect: "failure" },
      ),
    );
    await client.query("SELECT set_config('app.tenant_key', 'wrong-tenant', true)");
    await client.query("SELECT set_config('app.client_key', 'wrong-tenant', true)");
    const crossTenantRead = await probeSql(
      client,
      "cross-tenant read returns zero",
      "SELECT count(*)::int AS count FROM foundation_v2.source_releases WHERE tenant_key=$1 AND test_namespace=$2",
      [TENANT_KEY, TEST_NAMESPACE],
      { expect: "success", expectZeroCount: true },
    );
    probes.push(crossTenantRead);
    await setFoundationContext(client);

    for (const relation of V1_RELATIONS) {
      const existence = await relationExistenceProbeInSavepoint(client, relation);
      if (existence.access === "denied") {
        probes.push({
          label: `V1 existence denied ${relation}`,
          status: "passed",
          expected: "denied",
          observed: existence.error_code,
        });
      } else if (existence.exists) {
        probes.push(
          await probeSql(client, `V1 access denied ${relation}`, `SELECT count(*)::int AS count FROM ${relation}`, [], { expect: "failure" }),
        );
      }
    }

    probes.push(
      await probeSql(client, "ALTER TABLE denied", "ALTER TABLE foundation_v2.source_releases ADD COLUMN forbidden_identity_probe text", [], {
        expect: "failure",
      }),
    );
    probes.push(
      await probeSql(client, "ALTER POLICY denied", "ALTER POLICY foundation_v2_tenant_select ON foundation_v2.source_releases USING (true)", [], {
        expect: "failure",
      }),
    );
    probes.push(
      await probeSql(client, "DISABLE ROW LEVEL SECURITY denied", "ALTER TABLE foundation_v2.source_releases DISABLE ROW LEVEL SECURITY", [], {
        expect: "failure",
      }),
    );
    probes.push(
      await probeSql(client, "role attribute change denied", `ALTER ROLE ${WRITER_ROLE} BYPASSRLS`, [], { expect: "failure" }),
    );
    probes.push(
      await probeSql(client, "role membership grant denied", `GRANT ${WRITER_ROLE} TO ${WRITER_ROLE}`, [], { expect: "failure" }),
    );
    probes.push(
      await probeSql(
        client,
        "active baseline rejected",
        `INSERT INTO foundation_v2.baselines
         (baseline_id, tenant_key, test_namespace, baseline_version, baseline_hash, baseline_state, writer_job_id)
       VALUES ('security-preflight-active-baseline',$1,$2,'active',$3,'active','security-preflight')`,
        [TENANT_KEY, TEST_NAMESPACE, sha256("security-preflight-active-baseline")],
        { expect: "failure" },
      ),
    );

    const failed = probes.filter((probe) => probe.status !== "passed");
    if (failed.length > 0) throw new Error(`Fail closed: security preflight probes failed ${JSON.stringify(failed)}`);
  } finally {
    await client.query("ROLLBACK TO SAVEPOINT foundation_v2_security_preflight_scope");
    await client.query("RELEASE SAVEPOINT foundation_v2_security_preflight_scope");
    await setFoundationContext(client);
  }
  return {
    status: "FOUNDATION_V2_GOLDEN_SLICE_SECURITY_PREFLIGHT_PASSED",
    before_set_role: before,
    after_set_role: after,
    probes,
  };
}

async function securityRoleSnapshot(client) {
  const identity = (
    await rows(
      client,
      `SELECT session_user,
              current_user,
              current_role,
              current_setting('row_security') AS row_security,
              pg_has_role(session_user, $1, 'MEMBER') AS session_user_can_set_writer_role`,
      [WRITER_ROLE],
    )
  )[0];
  const roleRows = await rows(
    client,
    `SELECT rolname, rolsuper, rolcreaterole, rolcreatedb, rolreplication, rolbypassrls, rolinherit, rolcanlogin
       FROM pg_roles
      WHERE rolname IN (session_user, current_user, $1)
      ORDER BY rolname`,
    [WRITER_ROLE],
  );
  const roles = Object.fromEntries(roleRows.map((role) => [role.rolname, role]));
  return { ...identity, roles };
}

function assertSecurityRoleSnapshot(snapshot, label, { currentUser }) {
  const currentRole = snapshot.roles?.[snapshot.current_user];
  if (snapshot.current_user !== currentUser) {
    throw new Error(`Fail closed: ${label} current_user ${snapshot.current_user}, expected ${currentUser}`);
  }
  if (snapshot.row_security !== "on") throw new Error(`Fail closed: ${label} row_security ${snapshot.row_security}`);
  for (const [roleName, role] of Object.entries(snapshot.roles || {})) {
    if (role.rolsuper || role.rolcreaterole || role.rolcreatedb || role.rolreplication || role.rolbypassrls) {
      throw new Error(`Fail closed: ${label} privileged role attributes on ${roleName}`);
    }
  }
  if (!currentRole) throw new Error(`Fail closed: ${label} current role ${snapshot.current_user} is missing from pg_roles`);
  if (snapshot.current_user === WRITER_ROLE && currentRole.rolcanlogin) {
    throw new Error(`Fail closed: ${WRITER_ROLE} can login`);
  }
}

async function probeSql(client, label, sql, params = [], { expect, expectZeroCount = false }) {
  probeCounter += 1;
  const savepoint = `foundation_v2_probe_${probeCounter}`;
  await client.query(`SAVEPOINT ${savepoint}`);
  try {
    const result = await client.query(sql, params);
    if (expect === "failure") {
      await client.query(`ROLLBACK TO SAVEPOINT ${savepoint}`);
      return { label, status: "failed", expected: "failure", observed: "success" };
    }
    if (expectZeroCount && Number(result.rows?.[0]?.count || 0) !== 0) {
      await client.query(`ROLLBACK TO SAVEPOINT ${savepoint}`);
      return { label, status: "failed", expected: "zero_rows", observed: result.rows?.[0]?.count ?? null };
    }
    await client.query(`RELEASE SAVEPOINT ${savepoint}`);
    return { label, status: "passed", expected: "success", observed: result.command || "success" };
  } catch (error) {
    await client.query(`ROLLBACK TO SAVEPOINT ${savepoint}`);
    if (expect === "failure") {
      return { label, status: "passed", expected: "failure", observed: error.code || error.message };
    }
    return { label, status: "failed", expected: "success", observed: error.code || error.message };
  }
}

async function writerRoleReadbackRows(client, { probeSetRole = true } = {}) {
  await client.query("SET row_security = on");
  const session = (
    await rows(
      client,
      `SELECT current_user,
              session_user,
              current_setting('row_security') AS row_security,
              current_setting('role', true) AS active_set_role,
              pg_has_role(current_user, $1, 'MEMBER') AS can_set_writer_role,
              COALESCE((SELECT rolcanlogin FROM pg_roles WHERE rolname=$1), false) AS writer_role_can_login,
              COALESCE((SELECT rolbypassrls FROM pg_roles WHERE rolname=$1), false) AS writer_role_bypassrls,
              COALESCE((SELECT rolsuper FROM pg_roles WHERE rolname=session_user), false) AS session_user_is_superuser,
              COALESCE((SELECT rolcreaterole FROM pg_roles WHERE rolname=session_user), false) AS session_user_createrole,
              COALESCE((SELECT rolcreatedb FROM pg_roles WHERE rolname=session_user), false) AS session_user_createdb,
              COALESCE((SELECT rolreplication FROM pg_roles WHERE rolname=session_user), false) AS session_user_replication,
              COALESCE((SELECT rolinherit FROM pg_roles WHERE rolname=session_user), false) AS session_user_inherit,
              COALESCE((SELECT rolbypassrls FROM pg_roles WHERE rolname=session_user), false) AS session_user_bypassrls`,
      [WRITER_ROLE],
    )
  )[0];
  let activeRoleAfterSetRole = null;
  let activeRoleBypassRlsAfterSetRole = null;
  let rowSecurityAfterSetRole = null;
  if (probeSetRole && session?.can_set_writer_role && !session.session_user_is_superuser && !session.session_user_bypassrls) {
    await client.query("BEGIN");
    try {
      await client.query("SET LOCAL row_security = on");
      await setFoundationContext(client);
      await client.query(`SET LOCAL ROLE ${WRITER_ROLE}`);
      const active = (
        await rows(
          client,
          `SELECT current_role,
                  current_setting('row_security') AS row_security,
                  COALESCE((SELECT rolbypassrls FROM pg_roles WHERE rolname=current_role), false) AS current_role_bypassrls`,
        )
      )[0];
      activeRoleAfterSetRole = active?.current_role || null;
      activeRoleBypassRlsAfterSetRole = active?.current_role_bypassrls ?? null;
      rowSecurityAfterSetRole = active?.row_security || null;
      await client.query("ROLLBACK");
    } catch (error) {
      await client.query("ROLLBACK").catch(() => {});
      activeRoleAfterSetRole = `ERROR:${error.message}`;
      activeRoleBypassRlsAfterSetRole = null;
      rowSecurityAfterSetRole = null;
    }
  }
  return {
    ...session,
    active_role_after_set_role: activeRoleAfterSetRole,
    active_role_bypassrls_after_set_role: activeRoleBypassRlsAfterSetRole,
    row_security_after_set_role: rowSecurityAfterSetRole,
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
      ORDER BY ${GATE_RESULT_ORDER_SQL}`,
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

async function v1IsolationSnapshot(client, { inTransaction = false } = {}) {
  const output = [];
  for (const relation of V1_RELATIONS) {
    const existence = inTransaction
      ? await relationExistenceProbeInSavepoint(client, relation)
      : await relationExistenceProbe(client, relation);
    if (existence.access === "denied") {
      output.push({
        relation,
        exists: true,
        access: "denied",
        row_count: null,
        error_code: existence.error_code,
      });
      continue;
    }
    const exists = existence.exists;
    if (!exists) {
      output.push({ relation, exists: false, row_count: null });
      continue;
    }
    const count = inTransaction ? await relationCountProbeInSavepoint(client, relation) : await relationCountProbe(client, relation);
    output.push(count);
  }
  return output;
}

async function relationCountProbe(client, relation) {
  try {
    const result = await rows(client, `SELECT count(*)::bigint AS count FROM ${relation}`);
    return { relation, exists: true, access: "readable", row_count: result[0].count };
  } catch (error) {
    return { relation, exists: true, access: "denied", row_count: null, error_code: error.code || "unknown" };
  }
}

async function relationCountProbeInSavepoint(client, relation) {
  probeCounter += 1;
  const savepoint = `foundation_v2_relation_count_probe_${probeCounter}`;
  await client.query(`SAVEPOINT ${savepoint}`);
  try {
    const result = await rows(client, `SELECT count(*)::bigint AS count FROM ${relation}`);
    await client.query(`RELEASE SAVEPOINT ${savepoint}`);
    return { relation, exists: true, access: "readable", row_count: result[0].count };
  } catch (error) {
    await client.query(`ROLLBACK TO SAVEPOINT ${savepoint}`);
    return { relation, exists: true, access: "denied", row_count: null, error_code: error.code || "unknown" };
  }
}

async function relationExistenceProbe(client, relation) {
  try {
    const result = await rows(client, "SELECT to_regclass($1) IS NOT NULL AS exists", [relation]);
    return { exists: result[0].exists };
  } catch (error) {
    if (error.code === "42501") return { exists: true, access: "denied", error_code: error.code };
    throw error;
  }
}

async function relationExistenceProbeInSavepoint(client, relation) {
  probeCounter += 1;
  const savepoint = `foundation_v2_relation_probe_${probeCounter}`;
  await client.query(`SAVEPOINT ${savepoint}`);
  try {
    const result = await rows(client, "SELECT to_regclass($1) IS NOT NULL AS exists", [relation]);
    await client.query(`RELEASE SAVEPOINT ${savepoint}`);
    return { exists: result[0].exists };
  } catch (error) {
    await client.query(`ROLLBACK TO SAVEPOINT ${savepoint}`);
    if (error.code === "42501") return { exists: true, access: "denied", error_code: error.code };
    throw error;
  }
}

async function setFoundationContext(client) {
  await q(client, "SELECT set_config('app.tenant_key', $1, true)", [TENANT_KEY]);
  await q(client, "SELECT set_config('app.client_key', $1, true)", [TENANT_KEY]);
  await q(client, "SELECT set_config('app.foundation_v2_test_namespace', $1, true)", [TEST_NAMESPACE]);
  await q(client, "SELECT set_config('app.foundation_v2_source_release_id', $1, true)", [SOURCE_RELEASE_ID]);
  await q(client, "SELECT set_config('app.foundation_v2_release_alias', $1, true)", [FOUNDATION_RELEASE_ALIAS]);
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
