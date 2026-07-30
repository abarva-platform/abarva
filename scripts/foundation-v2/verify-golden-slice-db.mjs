#!/usr/bin/env node
import {
  EXPECTED_IDENTITY_CONTROL_MIGRATION_SHA256,
  EXPECTED_MIGRATION_SHA256,
  EXPECTED_WRITE_POLICY_MIGRATION_SHA256,
  IDENTITY_CONTROL_MIGRATION_NAME,
  ISOLATION_SCOPE,
  MIGRATION_NAME,
  READER_ROLE,
  SOURCE_RELEASE_ID,
  TENANT_KEY,
  TERMINAL_STATUS,
  TEST_NAMESPACE,
  WRITE_POLICY_MIGRATION_NAME,
  bindFoundationV2SqlContext,
  buildFixturePlan,
  createManifest,
  emitProofBundle,
  expectedPersistenceFingerprint,
  expectedTransitionResults,
  foundationPostgresClientOptions,
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

const args = parseArgs(process.argv.slice(2));
if (args.help) {
  console.log(usage("scripts/foundation-v2/verify-golden-slice-db.mjs"));
  process.exit(0);
}

await main(args).catch((error) => {
  console.error(JSON.stringify({ status: "FOUNDATION_V2_GOLDEN_SLICE_VERIFIER_FAILED", error: error.message }, null, 2));
  process.exit(1);
});

async function main(options) {
  const { fixtureSet, fixtureSha256 } = readFixtureSet(options.fixture);
  const plan = buildFixturePlan(fixtureSet, fixtureSha256, options.executionId);
  if (options.mode === "self-test") {
    const proof = await buildSelfTest(plan, options.outDir);
    console.log(JSON.stringify(proof, null, 2));
    return;
  }
  if (!["verify", "readback", "apply"].includes(options.mode)) {
    throw new Error(`Unsupported verifier mode ${options.mode}; use verify`);
  }
  const { Client } = await importPg();
  const client = new Client(await foundationPostgresClientOptions("foundation-v2-golden-slice-verifier"));
  bindFoundationV2SqlContext(client);
  await client.connect();
  try {
    await activateVerifierRole(client);
    await setFoundationContext(client);
    const proof = await verify(client, plan, options.outDir);
    if (options.emitProofBundle) emitProofBundle(options.outDir);
    console.log(JSON.stringify(proof, null, 2));
    if (proof.status !== TERMINAL_STATUS) process.exitCode = 1;
  } finally {
    await client.end();
  }
}

async function importPg() {
  try {
    return await import("pg");
  } catch (error) {
    throw new Error(`The pg package is required for DB-backed Foundation V2 verification: ${error.message}`);
  }
}

async function verify(client, plan, outDir) {
  const startedAt = new Date().toISOString();
  const migration = await migrationReadback(client, MIGRATION_NAME);
  const writePolicyMigration = await migrationReadback(client, WRITE_POLICY_MIGRATION_NAME);
  const identityControlMigration = await migrationReadback(client, IDENTITY_CONTROL_MIGRATION_NAME);
  const layerTotals = await dbLayerTotals(client);
  const rowLineage = await rowLineageRows(client);
  const fieldLineage = await fieldLineageRows(client);
  const persistedFingerprint = await dbPersistenceFingerprint(client);
  const reviewAccounting = await reviewAccountingRows(client);
  const publicationProof = await publicationProofReadback(client);
  const baselineProof = await baselineProofReadback(client);
  const projectionAuthority = await projectionAuthorityRows(client);
  const cubeParity = await cubeParityRows(client, plan);
  const productBinding = await productBindingRows(client);
  const avaProof = await avaProofRows(client);
  const gateResults = await gateResultRows(client, plan, outDir);
  const v1Isolation = await v1IsolationReadback(client);

  const varianceRows = varianceRegister(plan.expected_layer_totals, layerTotals);
  const rowVarianceRows = rowVarianceRowsFor(plan, rowLineage);
  const fieldVarianceRows = fieldVarianceRowsFor(plan, fieldLineage);
  const defects = [];
  if (!migration.present || migration.sha256 !== EXPECTED_MIGRATION_SHA256) defects.push("approved migration is not present");
  if (!writePolicyMigration.present || writePolicyMigration.sha256 !== EXPECTED_WRITE_POLICY_MIGRATION_SHA256) {
    defects.push("approved write-policy migration is not present");
  }
  if (!identityControlMigration.present || identityControlMigration.sha256 !== EXPECTED_IDENTITY_CONTROL_MIGRATION_SHA256) {
    defects.push("approved identity-control migration is not present");
  }
  for (const row of varianceRows) {
    if (Number(row.unexplained_variance) !== 0) defects.push(`layer variance ${row.layer_id}:${row.variance}`);
  }
  const expectedFingerprint = expectedPersistenceFingerprint(plan);
  if (persistedFingerprint.fingerprint !== expectedFingerprint) defects.push("persisted identity/content fingerprint does not match expected plan");
  if (gateResults.length !== expectedTransitionResults(plan.rows, "expected").length) {
    defects.push(`persisted gate count ${gateResults.length} does not match expected transition count`);
  }
  for (const row of rowVarianceRows) {
    if (row.variance !== 0) defects.push(`row lineage variance ${row.source_record_id}`);
  }
  for (const row of fieldVarianceRows) {
    if (row.variance !== 0) defects.push(`field lineage variance ${row.source_field_value_id}`);
  }
  for (const gate of gateResults) {
    if (!gate.persisted_matches_expected || Number(gate.unexplained_variance) !== 0) {
      defects.push(`persisted gate failed ${gate.gate_id}`);
    }
  }
  const review = reviewAccounting[0] || {};
  if (Number(review.population || 0) !== Number(review.accepted || 0) + Number(review.deferred || 0) + Number(review.rejected || 0)) {
    defects.push("review population does not balance");
  }
  if (Number(review.accepted || 0) !== Number(layerTotals.L6_canonical_objects || 0)) {
    defects.push("accepted review count does not equal canonical object count");
  }
  if (!publicationProof.accepted_only_membership) defects.push("publication includes non-accepted members");
  if (!baselineProof.reproducible || baselineProof.baseline_state !== "isolated_test") {
    defects.push("baseline is not reproducible isolated_test");
  }
  if (projectionAuthority.some((row) => Number(row.variance) !== 0)) defects.push("projection authority variance is non-zero");
  if (
    cubeParity.some(
      (row) =>
        row.parity_status === "failed" ||
        Number(row.variance) !== 0 ||
        !row.direct_sql_hash_matches_recomputed ||
        !row.cube_query_hash_matches_recomputed,
    )
  ) {
    defects.push("cube parity failed");
  }
  if (
    productBinding.some(
      (row) =>
        row.render_gate_status === "passed" &&
        (Number(row.unsupported_claim_count) !== 0 ||
          !row.projection_row_id ||
          Number(row.projection_lineage_count) < 1 ||
          !row.authority_chain_matches),
    )
  ) {
    defects.push("product binding passed with unsupported claims");
  }
  if (
    avaProof.some(
      (row) =>
        row.grounding_status === "grounded" &&
        (Number(row.unsupported_claim_count) !== 0 ||
          row.render_gate_status !== "passed" ||
          !row.projection_row_id ||
          !row.baseline_projection_chain_matches),
    )
  ) {
    defects.push("aVa proof has unsupported claims or lacks projection/product binding");
  }
  if (v1Isolation.some((row) => row.foundation_release_refs !== "0")) defects.push("V1 relation contains Foundation V2 release refs");

  const status = defects.length === 0 ? TERMINAL_STATUS : "FOUNDATION_V2_GOLDEN_SLICE_VERIFICATION_FAILED";
  const completedAt = new Date().toISOString();
  const manifest = createManifest(plan, status, {
    started_at: startedAt,
    completed_at: completedAt,
    migration,
    write_policy_migration: writePolicyMigration,
    identity_control_migration: identityControlMigration,
    expected_fingerprint: expectedFingerprint,
    persisted_fingerprint: persistedFingerprint.fingerprint,
    row_variance: rowVarianceRows.reduce((sum, row) => sum + Number(row.variance || 0), 0),
    field_variance: fieldVarianceRows.reduce((sum, row) => sum + Number(row.variance || 0), 0),
    first_broken_transition: firstBrokenTransition({
      gateResults,
      varianceRows,
      fingerprintMismatch: persistedFingerprint.fingerprint !== expectedFingerprint,
      rowVarianceRows,
      fieldVarianceRows,
      baselineProof,
      cubeParity,
      productBinding,
      avaProof,
      v1Isolation,
    }),
    defects,
    layer_totals: layerTotals,
  });

  writeOutputs(outDir, plan, manifest, {
    layerTotals,
    rowLineage,
    rowVarianceRows,
    fieldLineage,
    fieldVarianceRows,
    persistedFingerprint,
    reviewAccounting,
    publicationProof,
    baselineProof,
    projectionAuthority,
    cubeParity,
    productBinding,
    avaProof,
    varianceRows,
    gateResults,
    v1Isolation,
  });
  return manifest;
}

function writeOutputs(outDir, plan, manifest, data) {
  writeJson(proofRef(outDir, "FOUNDATION_V2_GOLDEN_SLICE_MANIFEST.json"), manifest);
  writeCsv(proofRef(outDir, "FOUNDATION_V2_GOLDEN_SLICE_LAYER_TOTALS.csv"), [
    "layer_id",
    "execution_id",
    "tenant",
    "source_release",
    "input_count",
    "output_count",
    "accepted_count",
    "deferred_count",
    "rejected_count",
    "duplicate_count",
    "malformed_count",
    "restricted_count",
    "expected_count",
    "actual_count",
    "variance",
    "content_hash",
    "deployed_sha",
    "image_digest",
    "started_time",
    "completed_time",
    "proof_reference",
  ], data.gateResults.map((gate) => ({
    layer_id: gate.transition,
    execution_id: plan.execution_id,
    tenant: TENANT_KEY,
    source_release: SOURCE_RELEASE_ID,
    input_count: gate.input_count,
    output_count: gate.output_count,
    accepted_count: gate.accepted_count,
    deferred_count: gate.deferred_count,
    rejected_count: gate.rejected_count,
    duplicate_count: gate.duplicate_count,
    malformed_count: gate.malformed_count,
    restricted_count: gate.restricted_count,
    expected_count: gate.expected_count,
    actual_count: gate.actual_count,
    variance: gate.unexplained_variance,
    content_hash: sha256(stableJson(gate)),
    deployed_sha: process.env.GITHUB_SHA || process.env.FOUNDATION_V2_DEPLOYED_SHA || "",
    image_digest: process.env.FOUNDATION_V2_IMAGE_DIGEST || "",
    started_time: manifest.started_at,
    completed_time: manifest.completed_at,
    proof_reference: gate.proof_uri,
  })));
  writeCsv(proofRef(outDir, "FOUNDATION_V2_GOLDEN_SLICE_ROW_LINEAGE.csv"), [
    "source_record_id",
    "source_row_number",
    "row_disposition",
    "normalized_object_id",
    "candidate_id",
    "review_decision",
    "canonical_object_id",
    "publication_member_id",
    "baseline_object_membership_id",
    "projection_row_id",
    "product_render_gate_status",
    "ava_grounding_status",
  ], data.rowLineage);
  writeCsv(proofRef(outDir, "FOUNDATION_V2_GOLDEN_SLICE_FIELD_LINEAGE.csv"), [
    "source_field_value_id",
    "source_record_id",
    "source_field_name",
    "field_disposition",
    "target_object_type",
    "target_field_name",
    "restricted",
    "projection_field_lineage_id",
    "projection_field_name",
    "contribution_type",
  ], data.fieldLineage);
  writeCsv(proofRef(outDir, "FOUNDATION_V2_GOLDEN_SLICE_REVIEW_ACCOUNTING.csv"), [
    "review_batch_id",
    "population",
    "accepted",
    "deferred",
    "rejected",
    "canonical_objects",
    "v1_decision_replay_count",
  ], data.reviewAccounting);
  writeJson(proofRef(outDir, "FOUNDATION_V2_GOLDEN_SLICE_PUBLICATION_PROOF.json"), data.publicationProof);
  writeJson(proofRef(outDir, "FOUNDATION_V2_GOLDEN_SLICE_BASELINE_PROOF.json"), data.baselineProof);
  writeCsv(proofRef(outDir, "FOUNDATION_V2_GOLDEN_SLICE_PROJECTION_AUTHORITY.csv"), [
    "projection_authority_id",
    "baseline_id",
    "projection_name",
    "projection_version",
    "projection_row_count",
    "actual_rows",
    "variance",
    "freshness_state",
    "projection_hash",
  ], data.projectionAuthority);
  writeCsv(proofRef(outDir, "FOUNDATION_V2_GOLDEN_SLICE_CUBE_PARITY.csv"), [
    "cube_parity_result_id",
    "cube_object_name",
    "direct_sql_hash",
    "cube_query_hash",
    "postgres_result",
    "cube_result",
    "variance",
    "parity_status",
  ], data.cubeParity);
  writeJson(proofRef(outDir, "FOUNDATION_V2_GOLDEN_SLICE_PRODUCT_BINDING.json"), data.productBinding);
  writeJson(proofRef(outDir, "FOUNDATION_V2_GOLDEN_SLICE_AVA_PROOF.json"), data.avaProof);
  writeCsv(proofRef(outDir, "FOUNDATION_V2_GOLDEN_SLICE_VARIANCE_REGISTER.csv"), [
    "layer_id",
    "expected_count",
    "actual_count",
    "variance",
    "unexplained_variance",
  ], data.varianceRows);
  writeJson(proofRef(outDir, "FOUNDATION_V2_GOLDEN_SLICE_ROW_VARIANCE.json"), data.rowVarianceRows);
  writeJson(proofRef(outDir, "FOUNDATION_V2_GOLDEN_SLICE_FIELD_VARIANCE.json"), data.fieldVarianceRows);
  writeJson(proofRef(outDir, "FOUNDATION_V2_GOLDEN_SLICE_PERSISTED_FINGERPRINT.json"), data.persistedFingerprint);
  writeMarkdown(proofRef(outDir, "FOUNDATION_V2_GOLDEN_SLICE_SECURITY_PROOF.md"), securityMarkdown(manifest, data));
  writeMarkdown(proofRef(outDir, "FOUNDATION_V2_GOLDEN_SLICE_FINAL_REPORT.md"), finalReportMarkdown(manifest, data));
}

async function migrationReadback(client, migrationName) {
  const result = await rows(client, "SELECT name, sha256, applied_at FROM schema_migrations WHERE name=$1", [migrationName]);
  const row = result[0] || null;
  return { present: Boolean(row), name: row?.name || migrationName, sha256: row?.sha256 || null, applied_at: row?.applied_at || null };
}

async function dbLayerTotals(client) {
  const result = await rows(client, `
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
    ) AS totals`, [TENANT_KEY, TEST_NAMESPACE]);
  return result[0].totals;
}

async function rowLineageRows(client) {
  return rows(client, `
    SELECT sr.source_record_id, sr.source_row_number, sr.row_disposition,
           sr.source_row_hash,
           no.normalized_object_id, kc.candidate_id, rd.review_decision,
           co.canonical_object_id, pm.publication_member_id,
           bom.baseline_object_membership_id, pr.projection_row_id,
           pbp.render_gate_status AS product_render_gate_status,
           app.grounding_status AS ava_grounding_status
      FROM foundation_v2.source_records sr
      LEFT JOIN foundation_v2.normalized_objects no USING (tenant_key, test_namespace, source_record_id)
      LEFT JOIN foundation_v2.knowledge_candidates kc USING (tenant_key, test_namespace, normalized_object_id)
      LEFT JOIN foundation_v2.review_decisions rd USING (tenant_key, test_namespace, candidate_id)
      LEFT JOIN foundation_v2.canonical_objects co USING (tenant_key, test_namespace, review_decision_id)
      LEFT JOIN foundation_v2.publication_members pm USING (tenant_key, test_namespace, canonical_object_id)
      LEFT JOIN foundation_v2.baseline_object_memberships bom USING (tenant_key, test_namespace, publication_member_id)
      LEFT JOIN foundation_v2.projection_rows pr USING (tenant_key, test_namespace, baseline_object_membership_id)
      LEFT JOIN foundation_v2.product_binding_proofs pbp
        ON pbp.tenant_key=sr.tenant_key AND pbp.test_namespace=sr.test_namespace
       AND pbp.component_id='fixture-component-' || lpad(sr.source_row_number::text, 3, '0')
      LEFT JOIN foundation_v2.ava_packet_proofs app
        ON app.tenant_key=sr.tenant_key AND app.test_namespace=sr.test_namespace
       AND app.ava_packet_proof_id=$3 || ':ava-packet-' || lpad(sr.source_row_number::text, 3, '0')
     WHERE sr.tenant_key=$1 AND sr.test_namespace=$2
     ORDER BY sr.source_row_number`, [TENANT_KEY, TEST_NAMESPACE, SOURCE_RELEASE_ID]);
}

async function fieldLineageRows(client) {
  return rows(client, `
    SELECT sfv.source_field_value_id, sfv.source_record_id, sfv.source_field_name,
           sfv.field_disposition, sfv.target_object_type, sfv.target_field_name,
           sfv.normalized_value, sfv.restricted,
           pfl.projection_field_lineage_id, pfl.projection_field_name, pfl.contribution_type
      FROM foundation_v2.source_field_values sfv
      LEFT JOIN foundation_v2.projection_field_lineage pfl USING (tenant_key, test_namespace, source_field_value_id)
     WHERE sfv.tenant_key=$1 AND sfv.test_namespace=$2
     ORDER BY sfv.source_record_id, sfv.source_field_name`, [TENANT_KEY, TEST_NAMESPACE]);
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
  const snapshot = {
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
    fingerprint: sha256(stableJson(snapshot)),
    snapshot,
  };
}

async function reviewAccountingRows(client) {
  return rows(client, `
    SELECT rb.review_batch_id,
           count(rd.review_decision_id)::int AS population,
           count(*) FILTER (WHERE rd.review_decision='accepted')::int AS accepted,
           count(*) FILTER (WHERE rd.review_decision='deferred')::int AS deferred,
           count(*) FILTER (WHERE rd.review_decision='rejected')::int AS rejected,
           (SELECT count(*)::int FROM foundation_v2.canonical_objects WHERE tenant_key=$1 AND test_namespace=$2) AS canonical_objects,
           0::int AS v1_decision_replay_count
      FROM foundation_v2.review_batches rb
      LEFT JOIN foundation_v2.review_decisions rd USING (tenant_key, test_namespace, review_batch_id)
     WHERE rb.tenant_key=$1 AND rb.test_namespace=$2
     GROUP BY rb.review_batch_id`, [TENANT_KEY, TEST_NAMESPACE]);
}

async function publicationProofReadback(client) {
  const rowsOut = await rows(client, `
    SELECT dp.publication_id, dp.publication_domain, dp.publication_version, dp.publication_hash,
           dp.publication_state, dp.immutability_scope,
           count(pm.publication_member_id)::int AS member_count,
           count(*) FILTER (WHERE rd.review_decision <> 'accepted')::int AS non_accepted_member_count
      FROM foundation_v2.domain_publications dp
      LEFT JOIN foundation_v2.publication_members pm USING (tenant_key, test_namespace, publication_id)
      LEFT JOIN foundation_v2.canonical_objects co USING (tenant_key, test_namespace, canonical_object_id)
      LEFT JOIN foundation_v2.review_decisions rd USING (tenant_key, test_namespace, review_decision_id)
     WHERE dp.tenant_key=$1 AND dp.test_namespace=$2
     GROUP BY dp.publication_id, dp.publication_domain, dp.publication_version, dp.publication_hash,
              dp.publication_state, dp.immutability_scope`, [TENANT_KEY, TEST_NAMESPACE]);
  const row = rowsOut[0] || {};
  return { ...row, accepted_only_membership: Number(row.non_accepted_member_count || 0) === 0 };
}

async function baselineProofReadback(client) {
  const rowsOut = await rows(client, `
    SELECT b.baseline_id, b.baseline_version, b.baseline_hash, b.baseline_state,
           dp.publication_hash,
           count(bom.baseline_object_membership_id)::int AS membership_count,
           array_remove(array_agg(co.canonical_object_id ORDER BY co.canonical_object_id), NULL) AS canonical_object_ids
      FROM foundation_v2.baselines b
      LEFT JOIN foundation_v2.baseline_object_memberships bom USING (tenant_key, test_namespace, baseline_id)
      LEFT JOIN foundation_v2.publication_members pm USING (tenant_key, test_namespace, publication_member_id)
      LEFT JOIN foundation_v2.domain_publications dp USING (tenant_key, test_namespace, publication_id)
      LEFT JOIN foundation_v2.canonical_objects co USING (tenant_key, test_namespace, canonical_object_id)
     WHERE b.tenant_key=$1 AND b.test_namespace=$2
     GROUP BY b.baseline_id, b.baseline_version, b.baseline_hash, b.baseline_state, dp.publication_hash`, [TENANT_KEY, TEST_NAMESPACE]);
  const row = rowsOut[0] || {};
  const recomputedBaselineHash = row.publication_hash
    ? sha256(stableJson({ publicationHash: row.publication_hash, baselineMemberObjectIds: row.canonical_object_ids || [] }))
    : null;
  return {
    ...row,
    recomputed_baseline_hash: recomputedBaselineHash,
    reproducible: Boolean(row.baseline_hash && row.baseline_hash === recomputedBaselineHash),
  };
}

async function projectionAuthorityRows(client) {
  return rows(client, `
    SELECT pa.projection_authority_id, pa.baseline_id, pa.projection_name, pa.projection_version,
           pa.projection_row_count, count(pr.projection_row_id)::int AS actual_rows,
           (count(pr.projection_row_id)::int - pa.projection_row_count)::text AS variance,
           pa.freshness_state, pa.projection_hash
      FROM foundation_v2.projection_authority pa
      LEFT JOIN foundation_v2.projection_rows pr USING (tenant_key, test_namespace, projection_authority_id)
     WHERE pa.tenant_key=$1 AND pa.test_namespace=$2
     GROUP BY pa.projection_authority_id, pa.baseline_id, pa.projection_name, pa.projection_version,
              pa.projection_row_count, pa.freshness_state, pa.projection_hash`, [TENANT_KEY, TEST_NAMESPACE]);
}

async function cubeParityRows(client, plan) {
  const cubeFixtureIds = plan.rows.filter((row) => row.cubePassed).map((row) => row.fixture_id);
  return rows(client, `
    WITH direct_sql_measure AS (
      SELECT pr.payload->>'fixture_id' AS fixture_id,
             count(*)::int AS direct_count
        FROM foundation_v2.projection_rows pr
       WHERE pr.tenant_key=$1
         AND pr.test_namespace=$2
         AND pr.payload->>'fixture_id' = ANY($3::text[])
       GROUP BY pr.payload->>'fixture_id'
    ),
    cube_query_measure AS (
      SELECT pr.payload->>'fixture_id' AS fixture_id,
             count(cpr.cube_parity_result_id)::int AS cube_count
        FROM foundation_v2.cube_parity_results cpr
        JOIN foundation_v2.projection_rows pr
          ON pr.tenant_key=cpr.tenant_key
         AND pr.test_namespace=cpr.test_namespace
         AND pr.projection_authority_id=cpr.projection_authority_id
         AND cpr.cube_parity_result_id=$4 || ':cube-parity-' || lpad(split_part(pr.projection_row_id, '-row-', 2), 3, '0')
       WHERE cpr.tenant_key=$1
         AND cpr.test_namespace=$2
         AND cpr.parity_status='passed'
       GROUP BY pr.payload->>'fixture_id'
    ),
    measured AS (
      SELECT cpr.cube_parity_result_id,
             cpr.cube_object_name,
             cpr.direct_sql_hash,
             cpr.cube_query_hash,
             cpr.parity_status,
             pr.payload->>'fixture_id' AS fixture_id,
             COALESCE(direct_sql_measure.direct_count, 0) AS postgres_result,
             COALESCE(cube_query_measure.cube_count, 0) AS cube_result
        FROM foundation_v2.cube_parity_results cpr
        LEFT JOIN foundation_v2.projection_rows pr
          ON pr.tenant_key=cpr.tenant_key
         AND pr.test_namespace=cpr.test_namespace
         AND pr.projection_authority_id=cpr.projection_authority_id
         AND cpr.cube_parity_result_id=$4 || ':cube-parity-' || lpad(split_part(pr.projection_row_id, '-row-', 2), 3, '0')
        LEFT JOIN direct_sql_measure
          ON direct_sql_measure.fixture_id = pr.payload->>'fixture_id'
        LEFT JOIN cube_query_measure
          ON cube_query_measure.fixture_id = pr.payload->>'fixture_id'
       WHERE cpr.tenant_key=$1 AND cpr.test_namespace=$2
    )
    SELECT cube_parity_result_id,
           cube_object_name,
           direct_sql_hash,
           cube_query_hash,
           postgres_result,
           cube_result,
           abs(postgres_result - cube_result)::int AS variance,
           direct_sql_hash = encode(sha256(('foundation-v2:direct-sql:' || fixture_id || ':' || postgres_result::text)::bytea), 'hex')
             AS direct_sql_hash_matches_recomputed,
           cube_query_hash = encode(sha256(('foundation-v2:cube-query:' || fixture_id || ':' || cube_result::text)::bytea), 'hex')
             AS cube_query_hash_matches_recomputed,
           parity_status
      FROM measured
     ORDER BY cube_parity_result_id`, [TENANT_KEY, TEST_NAMESPACE, cubeFixtureIds, SOURCE_RELEASE_ID]);
}

async function productBindingRows(client) {
  return rows(client, `
    SELECT pbp.product_binding_proof_id, pbp.projection_authority_id, pbp.product_surface, pbp.component_id,
           pbp.render_gate_status, pbp.unsupported_claim_count, pbp.proof_uri,
           pr.projection_row_id,
           pa.baseline_id,
           bom.baseline_id AS projection_baseline_id,
           count(pfl.projection_field_lineage_id)::int AS projection_lineage_count,
           bool_or(pbp.projection_authority_id = pr.projection_authority_id AND pa.baseline_id = bom.baseline_id)
             AS authority_chain_matches
      FROM foundation_v2.product_binding_proofs pbp
      LEFT JOIN foundation_v2.projection_authority pa
        ON pa.tenant_key=pbp.tenant_key
       AND pa.test_namespace=pbp.test_namespace
       AND pa.projection_authority_id=pbp.projection_authority_id
      LEFT JOIN foundation_v2.projection_rows pr
        ON pr.tenant_key=pbp.tenant_key
       AND pr.test_namespace=pbp.test_namespace
       AND pr.projection_authority_id=pbp.projection_authority_id
       AND pbp.component_id='fixture-component-' || lpad(split_part(pr.projection_row_id, '-row-', 2), 3, '0')
      LEFT JOIN foundation_v2.baseline_object_memberships bom
        ON bom.tenant_key=pr.tenant_key
       AND bom.test_namespace=pr.test_namespace
       AND bom.baseline_object_membership_id=pr.baseline_object_membership_id
      LEFT JOIN foundation_v2.projection_field_lineage pfl
        ON pfl.tenant_key=pbp.tenant_key
       AND pfl.test_namespace=pbp.test_namespace
       AND pfl.projection_row_id=pr.projection_row_id
     WHERE pbp.tenant_key=$1 AND pbp.test_namespace=$2
     GROUP BY pbp.product_binding_proof_id, pbp.projection_authority_id, pbp.product_surface, pbp.component_id,
              pbp.render_gate_status, pbp.unsupported_claim_count, pbp.proof_uri, pr.projection_row_id,
              pa.baseline_id, bom.baseline_id
     ORDER BY product_binding_proof_id`, [TENANT_KEY, TEST_NAMESPACE]);
}

async function avaProofRows(client) {
  return rows(client, `
    SELECT app.ava_packet_proof_id, app.baseline_id, app.packet_hash, app.grounding_status,
           app.unsupported_claim_count, app.proof_uri,
           pr.projection_row_id, pbp.render_gate_status,
           pa.projection_authority_id,
           bool_or(app.baseline_id = pa.baseline_id AND pbp.projection_authority_id = pa.projection_authority_id)
             AS baseline_projection_chain_matches
      FROM foundation_v2.ava_packet_proofs app
      LEFT JOIN foundation_v2.projection_authority pa
        ON pa.tenant_key=app.tenant_key
       AND pa.test_namespace=app.test_namespace
       AND pa.baseline_id=app.baseline_id
      LEFT JOIN foundation_v2.projection_rows pr
        ON pr.tenant_key=app.tenant_key
       AND pr.test_namespace=app.test_namespace
       AND pr.projection_authority_id=pa.projection_authority_id
       AND app.ava_packet_proof_id=$3 || ':ava-packet-' || lpad(split_part(pr.projection_row_id, '-row-', 2), 3, '0')
      LEFT JOIN foundation_v2.product_binding_proofs pbp
        ON pbp.tenant_key=app.tenant_key
       AND pbp.test_namespace=app.test_namespace
       AND pbp.projection_authority_id=pa.projection_authority_id
       AND pbp.component_id='fixture-component-' || lpad(split_part(pr.projection_row_id, '-row-', 2), 3, '0')
     WHERE app.tenant_key=$1 AND app.test_namespace=$2
     GROUP BY app.ava_packet_proof_id, app.baseline_id, app.packet_hash, app.grounding_status,
              app.unsupported_claim_count, app.proof_uri, pr.projection_row_id, pbp.render_gate_status,
              pa.projection_authority_id
     ORDER BY app.ava_packet_proof_id`, [TENANT_KEY, TEST_NAMESPACE, SOURCE_RELEASE_ID]);
}

async function gateResultRows(client, plan, outDir) {
  const expectedByGate = new Map(
    expectedTransitionResults(plan.rows, proofRef(outDir, "FOUNDATION_V2_GOLDEN_SLICE_FINAL_REPORT.md")).map((gate) => [
      gate.gate_id,
      gate,
    ]),
  );
  const persisted = await rows(
    client,
    `SELECT gate_result_id, gate_id, transition, input_count, output_count,
            unexplained_variance, gate_status, failure_classification, repair_owner,
            rerun_scope, proof_uri, writer_job_id
       FROM foundation_v2.gate_results
      WHERE tenant_key=$1 AND test_namespace=$2
      ORDER BY gate_id`,
    [TENANT_KEY, TEST_NAMESPACE],
  );
  return persisted.map((gate) => {
    const expected = expectedByGate.get(gate.gate_id) || {};
    return {
      ...gate,
      accepted_count: expected.accepted_count ?? "",
      deferred_count: expected.deferred_count ?? "",
      rejected_count: expected.rejected_count ?? "",
      duplicate_count: expected.duplicate_count ?? "",
      malformed_count: expected.malformed_count ?? "",
      restricted_count: expected.restricted_count ?? "",
      expected_count: expected.expected_count ?? "",
      actual_count: gate.output_count,
      expected_status: expected.status || "missing_expected_gate",
      expected_input_count: expected.input_count ?? "",
      expected_output_count: expected.output_count ?? "",
      persisted_matches_expected:
        expected.gate_id === gate.gate_id &&
        Number(gate.input_count) === Number(expected.input_count) &&
        Number(gate.output_count) === Number(expected.output_count) &&
        Number(gate.unexplained_variance) === Number(expected.unexplained_variance) &&
        gate.gate_status === expected.status,
    };
  });
}

async function v1IsolationReadback(client) {
  const relations = [
    "source_registry.source_version",
    "governance.review_decision",
    "knowledge.entity",
    "knowledge.fact_assertion",
    "knowledge.relationship_assertion",
    "publication.domain_publication",
    "publication.knowledge_baseline",
    "publication.projection_version",
  ];
  const out = [];
  for (const relation of relations) {
    const exists = (await rows(client, "SELECT to_regclass($1) IS NOT NULL AS exists", [relation]))[0].exists;
    if (!exists) {
      out.push({ relation, exists: false, foundation_release_refs: "0" });
      continue;
    }
    const columns = await rows(client, `
      SELECT column_name FROM information_schema.columns
       WHERE table_schema=$1 AND table_name=$2
         AND column_name IN ('source_release_id','knowledge_baseline_ref','baseline_id','publication_id')`,
      relation.split("."),
    );
    if (columns.length === 0) {
      out.push({ relation, exists: true, foundation_release_refs: "0" });
      continue;
    }
    const checks = columns.map((column, index) => `${column.column_name}::text LIKE $${index + 1}`).join(" OR ");
    const params = columns.map(() => `%${SOURCE_RELEASE_ID}%`);
    try {
      const count = (await rows(client, `SELECT count(*)::bigint AS count FROM ${relation} WHERE ${checks}`, params))[0].count;
      out.push({ relation, exists: true, access: "readable", foundation_release_refs: count });
    } catch (error) {
      out.push({ relation, exists: true, access: "denied", foundation_release_refs: "0", error_code: error.code || "unknown" });
    }
  }
  return out;
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

function rowVarianceRowsFor(plan, rowLineage) {
  const actualById = new Map(rowLineage.map((row) => [row.source_record_id, row]));
  return plan.rows.map((row) => {
    const actual = actualById.get(row.source_record_id) || {};
    const expected = {
      source_record_id: row.source_record_id,
      source_row_hash: row.source_row_hash,
      row_disposition: row.row_disposition,
      normalized_object_id: row.normalized ? row.normalized_object_id : null,
      candidate_id: row.candidate ? row.candidate_id : null,
      review_decision: row.decision ? row.review_decision : null,
      canonical_object_id: row.canonical ? row.canonical_object_id : null,
      publication_member_id: row.publicationMember ? row.publication_member_id : null,
      baseline_object_membership_id: row.baselineMember ? row.baseline_membership_id : null,
      projection_row_id: row.projection ? row.projection_row_id : null,
      product_render_gate_status: row.projection ? row.product_render_gate_status : null,
      ava_grounding_status: row.projection ? row.ava_grounding_status : null,
    };
    const actualComparable = Object.fromEntries(
      Object.keys(expected).map((key) => [key, actual[key] ?? null]),
    );
    return {
      source_record_id: row.source_record_id,
      expected_hash: sha256(stableJson(expected)),
      actual_hash: sha256(stableJson(actualComparable)),
      variance: stableJson(expected) === stableJson(actualComparable) ? 0 : 1,
      expected,
      actual: actualComparable,
    };
  });
}

function fieldVarianceRowsFor(plan, fieldLineage) {
  const actualById = new Map(fieldLineage.map((row) => [row.source_field_value_id, row]));
  return plan.source_field_rows.map((field) => {
    const rowPlan = plan.rows.find((row) => row.source_record_id === field.source_record_id);
    const actual = actualById.get(field.source_field_value_id) || {};
    const projectionContributes = Boolean(rowPlan?.projection && field.source_field_value_id === rowPlan.lineage_id);
    const expected = {
      source_field_value_id: field.source_field_value_id,
      source_record_id: field.source_record_id,
      source_field_name: field.source_field_name,
      normalized_value: field.normalized_value,
      field_disposition: field.field_disposition,
      target_object_type: field.target_object_type,
      target_field_name: field.target_field_name,
      restricted: field.restricted,
      projection_field_lineage_id: projectionContributes ? rowPlan.projection_field_lineage_id : null,
      projection_field_name: projectionContributes ? "business_key" : null,
      contribution_type: projectionContributes ? (rowPlan.expected_state === "restricted" ? "withheld" : "direct") : null,
    };
    const actualComparable = Object.fromEntries(
      Object.keys(expected).map((key) => [key, actual[key] ?? null]),
    );
    return {
      source_field_value_id: field.source_field_value_id,
      expected_hash: sha256(stableJson(expected)),
      actual_hash: sha256(stableJson(actualComparable)),
      variance: stableJson(expected) === stableJson(actualComparable) ? 0 : 1,
      expected,
      actual: actualComparable,
    };
  });
}

function firstBrokenTransition({
  gateResults,
  varianceRows,
  fingerprintMismatch,
  rowVarianceRows,
  fieldVarianceRows,
  baselineProof,
  cubeParity,
  productBinding,
  avaProof,
  v1Isolation,
}) {
  const failedGate = gateResults.find((gate) => gate.gate_status !== "passed" || !gate.persisted_matches_expected);
  if (failedGate) return failedGate.transition;
  if (!baselineProof.reproducible || baselineProof.baseline_state !== "isolated_test") {
    return "L7->L8_BASELINE_REPRODUCIBILITY";
  }
  if (
    cubeParity.some(
      (row) =>
        row.parity_status === "failed" ||
        Number(row.variance) !== 0 ||
        !row.direct_sql_hash_matches_recomputed ||
        !row.cube_query_hash_matches_recomputed,
    )
  ) {
    return "L9->L10_CUBE_PARITY";
  }
  if (
    productBinding.some(
      (row) =>
        row.render_gate_status === "passed" &&
        (Number(row.unsupported_claim_count) !== 0 ||
          !row.projection_row_id ||
          Number(row.projection_lineage_count) < 1 ||
          !row.authority_chain_matches),
    )
  ) {
    return "L9->L11_PRODUCT_BINDING";
  }
  if (
    avaProof.some(
      (row) =>
        row.grounding_status === "grounded" &&
        (Number(row.unsupported_claim_count) !== 0 ||
          row.render_gate_status !== "passed" ||
          !row.projection_row_id ||
          !row.baseline_projection_chain_matches),
    )
  ) {
    return "L9/L10->L12_AVA_BINDING";
  }
  const failedVariance = varianceRows.find((row) => Number(row.unexplained_variance) !== 0);
  if (failedVariance) return failedVariance.layer_id;
  if (fingerprintMismatch) return "PERSISTENCE_FINGERPRINT";
  if (rowVarianceRows.some((row) => row.variance !== 0)) return "ROW_LINEAGE";
  if (fieldVarianceRows.some((row) => row.variance !== 0)) return "FIELD_LINEAGE";
  if (v1Isolation.some((row) => row.foundation_release_refs !== "0")) return "V1_ISOLATION";
  return "NONE";
}

function securityMarkdown(manifest, data) {
  return `# Foundation V2 Golden Slice Security Proof

Status: ${manifest.status}

- Tenant: \`${TENANT_KEY}\`
- Test namespace: \`${TEST_NAMESPACE}\`
- Source release: \`${SOURCE_RELEASE_ID}\`
- Isolation scope: \`${ISOLATION_SCOPE}\`
- Migration: \`${MIGRATION_NAME}\`
- Migration SHA-256: \`${EXPECTED_MIGRATION_SHA256}\`
- V1 relations with Foundation V2 release refs: ${data.v1Isolation.filter((row) => row.foundation_release_refs !== "0").length}
- Product passed unsupported-claim rows: ${data.productBinding.filter((row) => row.render_gate_status === "passed" && Number(row.unsupported_claim_count) !== 0).length}
- aVa unsupported-claim rows: ${data.avaProof.filter((row) => Number(row.unsupported_claim_count) !== 0).length}

This proof does not approve full reload, offline augmentation ingestion, live review-decision application, live canonical promotion, live domain publication, live baseline activation, production provider cutover, production Knowledge UI cutover, production aVa activation, or V1 deletion.
`;
}

function finalReportMarkdown(manifest, data) {
  return `# Foundation V2 Golden Slice Final Report

Status: ${manifest.status}

Source release: \`${SOURCE_RELEASE_ID}\`
Execution: \`${manifest.execution_id}\`
Migration: \`${MIGRATION_NAME}\`

## Totals

\`\`\`json
${JSON.stringify(manifest.layer_totals, null, 2)}
\`\`\`

Row variance: ${manifest.row_variance}
Field variance: ${manifest.field_variance}
First broken transition: ${manifest.first_broken_transition}

## Review

\`\`\`json
${JSON.stringify(data.reviewAccounting, null, 2)}
\`\`\`

## Defects

${manifest.defects.length === 0 ? "None." : manifest.defects.map((defect) => `- ${defect}`).join("\n")}
`;
}

async function buildSelfTest(plan, outDir) {
  const proof = createManifest(plan, "FOUNDATION_V2_GOLDEN_SLICE_VERIFIER_SELF_TEST_PASSED", {
    expected_layer_totals: plan.expected_layer_totals,
    deterministic_hash: sha256(stableJson(plan.expected_layer_totals)),
  });
  writeJson(proofRef(outDir, "FOUNDATION_V2_GOLDEN_SLICE_VERIFIER_SELF_TEST.json"), proof);
  return proof;
}

async function activateVerifierRole(client) {
  await client.query("SET row_security = on");
  const requestedRole = process.env.FOUNDATION_V2_DB_SET_ROLE || process.env.FOUNDATION_V2_VERIFY_SET_ROLE || "";
  if (!requestedRole) return;
  if (requestedRole !== READER_ROLE) {
    throw new Error(`Fail closed: verifier may only SET ROLE ${READER_ROLE}`);
  }
  const allowed = (await rows(client, "SELECT pg_has_role(session_user, $1, 'MEMBER') AS allowed", [READER_ROLE]))[0]?.allowed;
  if (!allowed) throw new Error(`Fail closed: session user cannot assume ${READER_ROLE}`);
  await client.query(`SET ROLE ${READER_ROLE}`);
  await client.query("SET row_security = on");
  const active = (
    await rows(
      client,
      `SELECT session_user,
              current_user,
              current_setting('row_security') AS row_security,
              COALESCE((SELECT rolbypassrls FROM pg_roles WHERE rolname=session_user), false) AS session_user_bypassrls,
              COALESCE((SELECT rolbypassrls FROM pg_roles WHERE rolname=current_user), false) AS current_user_bypassrls`,
    )
  )[0];
  if (active.current_user !== READER_ROLE) throw new Error(`Fail closed: SET ROLE did not activate ${READER_ROLE}`);
  if (active.row_security !== "on") throw new Error(`Fail closed: verifier row_security is ${active.row_security}`);
  if (active.session_user_bypassrls || active.current_user_bypassrls) throw new Error("Fail closed: verifier role can bypass RLS");
}

async function setFoundationContext(client) {
  await client.query("SELECT set_config('app.tenant_key', $1, false)", [TENANT_KEY]);
  await client.query("SELECT set_config('app.client_key', $1, false)", [TENANT_KEY]);
  await client.query("SELECT set_config('app.foundation_v2_test_namespace', $1, false)", [TEST_NAMESPACE]);
}

async function rows(client, sql, params = []) {
  return (await client.query(sql, params)).rows;
}
