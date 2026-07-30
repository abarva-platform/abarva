import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

export const LANE_CONFIGS = {
  airline: {
    domain: "airline",
    database_schema: "foundation_v2",
    execution_namespace: "foundation-v2-golden-slice-v1",
    writer_role: "foundation_v2_golden_slice_writer",
    reader_role: "foundation_v2_golden_slice_reader",
    tenant_key: "skyharbor-air",
    release_alias: "airline-demo-new",
    source_release_id: "airline-demo-new-foundation-v2-golden-slice-v1",
    publication_namespace: "foundation-v2-airline-publication-gs-v1",
    baseline_namespace: "foundation-v2-airline-baseline-gs-v1",
    projection_namespace: "foundation-v2-airline-projection-gs-v1",
    cube_namespace: "foundation_v2_airline_gs",
    terminal_status: "FOUNDATION_V2_GOLDEN_SLICE_CERTIFIED",
  },
  healthcare: {
    domain: "healthcare",
    database_schema: "foundation_v2_healthcare_gs",
    execution_namespace: "foundation-v2-healthcare-progressive-golden-slice-v1",
    writer_role: "foundation_v2_healthcare_gs_writer",
    reader_role: "foundation_v2_healthcare_gs_reader",
    tenant_key: "healthcare-demo-new",
    release_alias: "healthcare-demo-new-foundation-v2-progressive-golden-slice-v1",
    source_release_id: "healthcare-demo-new-foundation-v2-progressive-golden-slice-v1",
    publication_namespace: "foundation-v2-healthcare-publication-gs-v1",
    baseline_namespace: "foundation-v2-healthcare-baseline-gs-v1",
    projection_namespace: "foundation-v2-healthcare-projection-gs-v1",
    cube_namespace: "foundation_v2_healthcare_gs",
    terminal_status: "HEALTHCARE_FOUNDATION_V2_PROGRESSIVE_DB_GOLDEN_SLICE_CERTIFIED",
  },
};

export const FOUNDATION_V2_CONTEXT = buildExecutionContext();
export const DATABASE_SCHEMA = FOUNDATION_V2_CONTEXT.database_schema;
export const EXECUTION_NAMESPACE = FOUNDATION_V2_CONTEXT.execution_namespace;
export const PUBLICATION_NAMESPACE = FOUNDATION_V2_CONTEXT.publication_namespace;
export const BASELINE_NAMESPACE = FOUNDATION_V2_CONTEXT.baseline_namespace;
export const PROJECTION_NAMESPACE = FOUNDATION_V2_CONTEXT.projection_namespace;
export const CUBE_NAMESPACE = FOUNDATION_V2_CONTEXT.cube_namespace;
export const TERMINAL_STATUS = FOUNDATION_V2_CONTEXT.terminal_status;
export const FOUNDATION_RELEASE_ALIAS = FOUNDATION_V2_CONTEXT.release_alias;
export const TENANT_KEY = FOUNDATION_V2_CONTEXT.tenant_key;
export const TEST_NAMESPACE = EXECUTION_NAMESPACE;
export const SOURCE_RELEASE_ID = FOUNDATION_V2_CONTEXT.source_release_id;
export const RELEASE_VERSION = "v1";
export const ISOLATION_SCOPE = "ISOLATED_FOUNDATION_V2_GOLDEN_SLICE_ONLY";
export const WRITER_ROLE = FOUNDATION_V2_CONTEXT.writer_role;
export const READER_ROLE = FOUNDATION_V2_CONTEXT.reader_role;
export const EXPECTED_FIXTURE_SHA256 =
  process.env.FOUNDATION_V2_EXPECTED_FIXTURE_SHA256 ||
  "d4bb8fe59cd22c95bc470074d4dba4d45754fb80b9245c54bf3ec9b488d0bc62";
export const EXPECTED_MIGRATION_SHA256 =
  "4f0f696495fa09ea54159ee2eab40aeac522de2965644978be9d865b7149dd7f";
export const MIGRATION_NAME = "20260730120000_foundation_v2_golden_slice_core.sql";
export const EXPECTED_WRITE_POLICY_MIGRATION_SHA256 =
  "4f8ecd6a9a5fabd7a3e8b40eb79bbb2742348d294444db241b8748d81b4e354d";
export const WRITE_POLICY_MIGRATION_NAME = "20260730133000_foundation_v2_golden_slice_write_policies.sql";
export const EXPECTED_IDENTITY_CONTROL_MIGRATION_SHA256 =
  "63c2ecb1ca149ea7c06fe6433d0775040699f106798be5beba4d115d9f365f9e";
export const IDENTITY_CONTROL_MIGRATION_NAME = "20260730152000_foundation_v2_golden_slice_identity_controls.sql";
export const DEFAULT_EXECUTION_ID = `${SOURCE_RELEASE_ID}:execution-v1`;
export const MANAGED_IDENTITY_DB_SCOPE = "https://ossrdbms-aad.database.windows.net/.default";

const thisFile = fileURLToPath(import.meta.url);
export const REPO_ROOT = findRepoRoot(path.dirname(thisFile));
export const DEFAULT_FIXTURE_PATH = path.join(
  REPO_ROOT,
  "fixtures/foundation-v2/golden-slice/fixture-matrix.json",
);
export const RELEASE_CONTRACT_PATH = process.env.FOUNDATION_V2_RELEASE_CONTRACT
  ? path.resolve(process.cwd(), process.env.FOUNDATION_V2_RELEASE_CONTRACT)
  : path.join(REPO_ROOT, "fixtures/foundation-v2/golden-slice/release-contract.json");

export const LAYERS = [
  ["L0", "L0_source_rows"],
  ["L1", "L1_landed_rows"],
  ["L2", "L2_parsed_rows"],
  ["L3", "L3_normalized_records"],
  ["L4", "L4_candidates"],
  ["L5", "L5_review_decisions"],
  ["L6", "L6_canonical_objects"],
  ["L7", "L7_publication_items"],
  ["L8", "L8_baseline_memberships"],
  ["L9", "L9_projection_rows"],
  ["L10", "L10_cube_outputs"],
  ["L11", "L11_product_claims"],
  ["L12", "L12_ava_outputs"],
];

export const TRANSITIONS = [
  ["F2-GATE-L0-L1", "L0->L1", "L0_source_rows", "L1_landed_rows"],
  ["F2-GATE-L1-L2", "L1->L2", "L1_landed_rows", "L2_parsed_rows"],
  ["F2-GATE-L2-L3", "L2->L3", "L2_parsed_rows", "L3_normalized_records"],
  ["F2-GATE-L3-L4", "L3->L4", "L3_normalized_records", "L4_candidates"],
  ["F2-GATE-L4-L5", "L4->L5", "L4_candidates", "L5_review_decisions"],
  ["F2-GATE-L5-L6", "L5->L6", "L5_review_decisions", "L6_canonical_objects"],
  ["F2-GATE-L6-L7", "L6->L7", "L6_canonical_objects", "L7_publication_items"],
  ["F2-GATE-L7-L8", "L7->L8", "L7_publication_items", "L8_baseline_memberships"],
  ["F2-GATE-L8-L9", "L8->L9", "L8_baseline_memberships", "L9_projection_rows"],
  ["F2-GATE-L9-L10", "L9->L10", "L9_projection_rows", "L10_cube_outputs"],
  ["F2-GATE-L10-L11", "L10->L11", "L10_cube_outputs", "L11_product_claims"],
  ["F2-GATE-L9-L12", "L9/L10->L12", "L9_projection_rows", "L12_ava_outputs"],
];

const REQUIRED_FIXTURE_NAMES = new Set([
  "accepted_source_row",
  "deferred_row",
  "rejected_row",
  "duplicate_row",
  "malformed_row",
  "contradiction",
  "restricted_evidence",
  "stale_evidence",
  "missing_metric_observation",
  "executive_perspective",
  "current_state",
  "proposed_target",
  "approved_target",
  "relationship",
  "metric_calculation",
  "deterministic_insight_trigger",
  "deterministic_insight_non_trigger",
  "claude_narrative_draft",
  "module_handoff",
  "postgresql_cube_parity",
  "product_render_gate",
]);

export function parseArgs(argv) {
  const args = {
    mode: "apply",
    outDir: process.env.FOUNDATION_V2_GOLDEN_SLICE_OUT_DIR || defaultOutDir(),
    fixture: process.env.FOUNDATION_V2_GOLDEN_SLICE_FIXTURE || DEFAULT_FIXTURE_PATH,
    executionId: process.env.FOUNDATION_V2_EXECUTION_ID || DEFAULT_EXECUTION_ID,
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
    if (arg === "--mode") args.mode = next();
    else if (arg === "--out-dir") args.outDir = path.resolve(process.cwd(), next());
    else if (arg === "--fixture") args.fixture = path.resolve(process.cwd(), next());
    else if (arg === "--execution-id") args.executionId = next();
    else if (arg === "--emit-proof-bundle") args.emitProofBundle = true;
    else if (arg === "--no-emit-proof-bundle") args.emitProofBundle = false;
    else if (arg === "--help" || arg === "-h") args.help = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return args;
}

export function usage(scriptName) {
  return `Usage: node ${scriptName} [--mode schema-readback|preflight|apply|self-test] [options]

Options:
  --fixture <path>          Approved fixture matrix JSON.
  --out-dir <path>          Proof output directory.
  --execution-id <id>       Deterministic golden-slice execution id.
  --emit-proof-bundle       Emit proof bundle markers for the ACA wrapper.
`;
}

export function readFixtureSet(fixturePath) {
  const raw = fs.readFileSync(fixturePath, "utf8");
  const fixtureSha256 = sha256(raw);
  const fixtureSet = JSON.parse(raw);
  const defects = validateFixtureSet(fixtureSet, fixtureSha256);
  if (defects.length > 0) {
    const error = new Error(`Fixture validation failed: ${defects.join("; ")}`);
    error.defects = defects;
    throw error;
  }
  return { fixtureSet, fixtureSha256 };
}

export function validateFixtureSet(fixtureSet, fixtureSha256 = null) {
  const defects = [];
  if (fixtureSha256 && fixtureSha256 !== EXPECTED_FIXTURE_SHA256) {
    defects.push(`fixture sha mismatch: ${fixtureSha256}`);
  }
  if (fixtureSet.isolation_scope !== ISOLATION_SCOPE) {
    defects.push(`fixture isolation scope is ${fixtureSet.isolation_scope}`);
  }
  const fixtures = fixtureSet.fixtures || [];
  if (fixtures.length !== 21) defects.push(`expected 21 fixtures, found ${fixtures.length}`);
  const names = new Set(fixtures.map((fixture) => fixture.fixture_name));
  for (const name of REQUIRED_FIXTURE_NAMES) {
    if (!names.has(name)) defects.push(`missing fixture ${name}`);
  }
  const ids = new Set();
  const objectIds = new Set();
  for (const fixture of fixtures) {
    if (ids.has(fixture.fixture_id)) defects.push(`duplicate fixture id ${fixture.fixture_id}`);
    ids.add(fixture.fixture_id);
    if (!fixture.source_family) defects.push(`${fixture.fixture_id} missing source family`);
    if (!Array.isArray(fixture.expected_object_ids) || fixture.expected_object_ids.length < 2) {
      defects.push(`${fixture.fixture_id} missing expected object and lineage ids`);
    } else {
      for (const objectId of fixture.expected_object_ids) {
        if (!/^(obj|lineage)-[A-F0-9]{10}$/.test(objectId)) {
          defects.push(`${fixture.fixture_id} invalid expected id ${objectId}`);
        }
        if (objectIds.has(objectId)) defects.push(`duplicate expected id ${objectId}`);
        objectIds.add(objectId);
      }
    }
    for (const [, layerKey] of LAYERS) {
      const value = fixture.counts?.[layerKey];
      if (!Number.isInteger(value) || value < 0) {
        defects.push(`${fixture.fixture_id} invalid ${layerKey}: ${value}`);
      }
    }
  }
  return defects;
}

export function expectedLayerTotals(fixtures) {
  return Object.fromEntries(
    LAYERS.map(([, layerKey]) => [
      layerKey,
      fixtures.reduce((total, fixture) => total + fixture.counts[layerKey], 0),
    ]),
  );
}

export function expectedTransitionResults(fixtures, proofRef, deployed = {}) {
  const totals = expectedLayerTotals(fixtures);
  return TRANSITIONS.map(([gateId, transition, inputLayer, outputLayer]) => {
    const inputCount = totals[inputLayer];
    const outputCount = totals[outputLayer];
    const unexplainedVariance = expectedUnexplainedVariance(fixtures, inputLayer, outputLayer);
    return {
      gate_id: gateId,
      transition,
      input_layer: inputLayer,
      output_layer: outputLayer,
      input_count: inputCount,
      output_count: outputCount,
      expected_count: outputCount,
      actual_count: outputCount,
      accepted_count: countByDecision(fixtures, "accepted", outputLayer),
      deferred_count: countByDecision(fixtures, "deferred", outputLayer),
      rejected_count: countByDecision(fixtures, "rejected", outputLayer),
      duplicate_count: fixtures.filter((fixture) => fixture.expected_state === "duplicate_suppressed").length,
      malformed_count: fixtures.filter((fixture) => fixture.fixture_name === "malformed_row").length,
      restricted_count: fixtures.filter((fixture) => fixture.expected_state === "restricted").length,
      unexplained_variance: unexplainedVariance,
      variance: unexplainedVariance,
      status: unexplainedVariance === 0 ? "passed" : "failed",
      proof_uri: proofRef,
      deployed_sha: deployed.deployedSha || "",
      image_digest: deployed.imageDigest || "",
    };
  });
}

export function buildFixturePlan(fixtureSet, fixtureSha256, executionId) {
  const fixtures = fixtureSet.fixtures;
  const tenantDeclaration = readTenantDeclaration();
  const releaseHash = sha256(
    stableJson({
      fixture_set_id: fixtureSet.fixture_set_id,
      fixture_sha256: fixtureSha256,
      source_release_id: SOURCE_RELEASE_ID,
      test_namespace: TEST_NAMESPACE,
    }),
  );
  const publicationHash = sha256(`publication:${releaseHash}`);
  const baselineMemberObjectIds = fixtures
    .filter((fixture) => fixture.counts.L8_baseline_memberships > 0)
    .map((fixture) => fixture.expected_object_ids[0])
    .sort();
  const baselineHash = sha256(stableJson({ publicationHash, baselineMemberObjectIds }));
  const projectionHash = sha256(`projection:${baselineHash}:${fixtures.length}`);
  const sourceFileId = `${SOURCE_RELEASE_ID}:source-file-001`;
  const reviewBatchId = `${SOURCE_RELEASE_ID}:review-batch-001`;
  const publicationId = `${SOURCE_RELEASE_ID}:publication-001`;
  const baselineId = `${SOURCE_RELEASE_ID}:baseline-001`;
  const projectionAuthorityId = `${SOURCE_RELEASE_ID}:projection-authority-001`;

  const rows = fixtures.map((fixture, index) => {
    const ordinal = String(index + 1).padStart(3, "0");
    const objectId = fixture.expected_object_ids[0];
    const lineageId = fixture.expected_object_ids[1];
    const parsed = fixture.counts.L2_parsed_rows > 0;
    const normalized = fixture.counts.L3_normalized_records > 0;
    const candidate = fixture.counts.L4_candidates > 0;
    const decision = fixture.counts.L5_review_decisions > 0;
    const canonical = fixture.counts.L6_canonical_objects > 0;
    const publicationMember = fixture.counts.L7_publication_items > 0;
    const baselineMember = fixture.counts.L8_baseline_memberships > 0;
    const projection = fixture.counts.L9_projection_rows > 0;
    const cubePassed = fixture.counts.L10_cube_outputs > 0;
    const productPassed = fixture.counts.L11_product_claims > 0;
    const avaGrounded = fixture.counts.L12_ava_outputs > 0;
    const reviewDecision = reviewDecisionFor(fixture);
    return {
      ...fixture,
      ordinal,
      object_id: objectId,
      lineage_id: lineageId,
      source_record_id: `${SOURCE_RELEASE_ID}:source-record-${ordinal}`,
      source_row_hash: sha256(`source-row:${fixture.fixture_id}:${stableJson(fixture.counts)}`),
      normalized_object_id: `${SOURCE_RELEASE_ID}:normalized-${ordinal}`,
      candidate_id: `${SOURCE_RELEASE_ID}:candidate-${ordinal}`,
      review_decision_id: `${SOURCE_RELEASE_ID}:review-decision-${ordinal}`,
      canonical_object_id: objectId,
      publication_member_id: `${SOURCE_RELEASE_ID}:publication-member-${ordinal}`,
      baseline_membership_id: `${SOURCE_RELEASE_ID}:baseline-membership-${ordinal}`,
      projection_row_id: `${SOURCE_RELEASE_ID}:projection-row-${ordinal}`,
      projection_field_lineage_id: `${SOURCE_RELEASE_ID}:projection-field-lineage-${ordinal}`,
      cube_parity_result_id: `${SOURCE_RELEASE_ID}:cube-parity-${ordinal}`,
      product_binding_proof_id: `${SOURCE_RELEASE_ID}:product-binding-${ordinal}`,
      ava_packet_proof_id: `${SOURCE_RELEASE_ID}:ava-packet-${ordinal}`,
      parsed,
      normalized,
      candidate,
      decision,
      canonical,
      publicationMember,
      baselineMember,
      projection,
      cubePassed,
      productPassed,
      avaGrounded,
      review_decision: reviewDecision,
      candidate_state: reviewDecision === "accepted" ? "accepted" : reviewDecision,
      row_disposition: rowDispositionFor(fixture),
      projection_availability_state: availabilityFor(fixture, productPassed),
      product_render_gate_status: productPassed ? "passed" : "withheld",
      ava_grounding_status: avaGrounded ? "grounded" : "refused_missing_evidence",
      content_hash: sha256(`fixture:${fixture.fixture_id}:${objectId}`),
    };
  });

  const sourceFieldRows = rows.flatMap((row) => {
    if (!row.parsed) return [];
    const fields = [
      ["business_key", "USED_AS_BUSINESS_KEY", row.object_id, "entity", "business_key", false],
      ["evidence_ref", "PRESERVED_AS_EVIDENCE", `evidence:${row.fixture_id}`, "evidence", "evidence_ref", row.expected_state === "restricted"],
      ["state", "NORMALIZED_TO_CANONICAL_FIELD", row.expected_state, "entity", "state", false],
    ];
    return fields.map(([fieldName, disposition, rawValue, objectType, targetField, restricted], index) => ({
      source_field_value_id:
        fieldName === "business_key" ? row.lineage_id : `${row.lineage_id}:${String(index + 1).padStart(2, "0")}`,
      source_record_id: row.source_record_id,
      source_field_id: `${row.fixture_id}:${fieldName}`,
      source_field_name: fieldName,
      raw_value: rawValue,
      normalized_value: rawValue,
      field_disposition: restricted ? "RESTRICTED" : disposition,
      target_object_type: objectType,
      target_field_name: targetField,
      adapter_rule_id: `foundation-v2-golden-slice:${fieldName}`,
      evidence_ref: `evidence:${row.fixture_id}`,
      restricted,
      fixture_id: row.fixture_id,
    }));
  });

  return {
    execution_id: executionId,
    tenant_key: TENANT_KEY,
    foundation_release_alias: FOUNDATION_RELEASE_ALIAS,
    tenant_declaration: tenantDeclaration,
    test_namespace: TEST_NAMESPACE,
    source_release_id: SOURCE_RELEASE_ID,
    release_version: RELEASE_VERSION,
    isolation_scope: ISOLATION_SCOPE,
    fixture_sha256: fixtureSha256,
    release_hash: releaseHash,
    source_file_id: sourceFileId,
    review_batch_id: reviewBatchId,
    publication_id: publicationId,
    publication_hash: publicationHash,
    baseline_id: baselineId,
    baseline_hash: baselineHash,
    projection_authority_id: projectionAuthorityId,
    projection_hash: projectionHash,
    source_file_hash: sha256(`source-file:${releaseHash}:${sourceFieldRows.length}`),
    rows,
    source_field_rows: sourceFieldRows,
    expected_layer_totals: expectedLayerTotals(fixtures),
  };
}

export function createManifest(plan, status, extra = {}) {
  return {
    status,
    generated_at: new Date().toISOString(),
    tenant_key: TENANT_KEY,
    foundation_release_alias: FOUNDATION_RELEASE_ALIAS,
    tenant_declaration: plan.tenant_declaration,
    test_namespace: TEST_NAMESPACE,
    source_release_id: SOURCE_RELEASE_ID,
    release_version: RELEASE_VERSION,
    isolation_scope: ISOLATION_SCOPE,
    execution_id: plan.execution_id,
    fixture_sha256: plan.fixture_sha256,
    migration_name: MIGRATION_NAME,
    migration_sha256: EXPECTED_MIGRATION_SHA256,
    write_policy_migration_name: WRITE_POLICY_MIGRATION_NAME,
    write_policy_migration_sha256: EXPECTED_WRITE_POLICY_MIGRATION_SHA256,
    identity_control_migration_name: IDENTITY_CONTROL_MIGRATION_NAME,
    identity_control_migration_sha256: EXPECTED_IDENTITY_CONTROL_MIGRATION_SHA256,
    full_reload_approved: false,
    production_provider_cutover_approved: false,
    live_baseline_activation_approved: false,
    v1_mutation_approved: false,
    expected_layer_totals: plan.expected_layer_totals,
    ...extra,
  };
}

export function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

export function writeCsv(file, headers, rows) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const lines = [
    headers.map(csvEscape).join(","),
    ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(",")),
  ];
  fs.writeFileSync(file, `${lines.join("\n")}\n`);
}

export function writeMarkdown(file, text) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text.endsWith("\n") ? text : `${text}\n`);
}

export function proofRef(outDir, fileName) {
  return path.join(outDir, fileName);
}

export function emitProofBundle(outDir) {
  const tgz = path.join(os.tmpdir(), `foundation-v2-golden-slice-proof-${Date.now()}.tgz`);
  const tar = spawnSync("tar", ["-czf", tgz, "-C", outDir, "."], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (tar.status !== 0) {
    throw new Error(`failed to create proof bundle: ${tar.stderr || tar.stdout || "tar failed"}`);
  }
  console.log("__SEMANTIC2_PROOF_TGZ_BEGIN__");
  console.log(fs.readFileSync(tgz).toString("base64"));
  console.log("__SEMANTIC2_PROOF_TGZ_END__");
}

export function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export function stableJson(value) {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

export function postgresClientOptions(connectionString, applicationName) {
  return {
    connectionString,
    ...(applicationName ? { application_name: applicationName } : {}),
    ssl: postgresSslOptions(connectionString),
  };
}

export function expectedPersistenceFingerprint(plan) {
  return sha256(
    stableJson({
      tenant_key: TENANT_KEY,
      test_namespace: TEST_NAMESPACE,
      source_release_id: SOURCE_RELEASE_ID,
      release_hash: plan.release_hash,
      source_file_id: plan.source_file_id,
      source_file_hash: plan.source_file_hash,
      baseline_hash: plan.baseline_hash,
      projection_hash: plan.projection_hash,
      rows: plan.rows.map((row) => ({
        source_record_id: row.source_record_id,
        source_row_hash: row.source_row_hash,
        row_disposition: row.row_disposition,
        normalized_object_id: row.normalized ? row.normalized_object_id : null,
        candidate_id: row.candidate ? row.candidate_id : null,
        review_decision_id: row.decision ? row.review_decision_id : null,
        canonical_object_id: row.canonical ? row.canonical_object_id : null,
        publication_member_id: row.publicationMember ? row.publication_member_id : null,
        baseline_membership_id: row.baselineMember ? row.baseline_membership_id : null,
        projection_row_id: row.projection ? row.projection_row_id : null,
        cube_parity_result_id: row.projection ? row.cube_parity_result_id : null,
        product_binding_proof_id: row.projection ? row.product_binding_proof_id : null,
        ava_packet_proof_id: row.projection ? row.ava_packet_proof_id : null,
        content_hash: row.normalized ? row.content_hash : null,
      })),
      source_field_rows: plan.source_field_rows.map((field) => ({
        source_field_value_id: field.source_field_value_id,
        source_record_id: field.source_record_id,
        source_field_id: field.source_field_id,
        source_field_name: field.source_field_name,
        normalized_value: field.normalized_value,
        field_disposition: field.field_disposition,
        restricted: field.restricted,
      })),
      review_decisions: plan.rows
        .filter((row) => row.decision)
        .map((row) => ({
          review_decision_id: row.review_decision_id,
          candidate_id: row.candidate_id,
          review_decision: row.review_decision,
        })),
      cube_parity_results: plan.rows
        .filter((row) => row.projection)
        .map((row) => ({
          cube_parity_result_id: row.cube_parity_result_id,
          projection_authority_id: plan.projection_authority_id,
          cube_object_name: `golden_slice_measure_${row.ordinal}`,
          direct_sql_hash: sha256(`foundation-v2:direct-sql:${row.fixture_id}:${row.cubePassed ? 1 : 0}`),
          cube_query_hash: sha256(`foundation-v2:cube-query:${row.fixture_id}:${row.cubePassed ? 1 : 0}`),
          parity_status: row.cubePassed ? "passed" : "not_applicable",
        })),
      product_binding_proofs: plan.rows
        .filter((row) => row.projection)
        .map((row) => ({
          product_binding_proof_id: row.product_binding_proof_id,
          projection_authority_id: plan.projection_authority_id,
          component_id: `fixture-component-${row.ordinal}`,
          render_gate_status: row.product_render_gate_status,
          unsupported_claim_count: 0,
        })),
      ava_packet_proofs: plan.rows
        .filter((row) => row.projection)
        .map((row) => ({
          ava_packet_proof_id: row.ava_packet_proof_id,
          baseline_id: plan.baseline_id,
          packet_hash: sha256(`ava:${row.fixture_id}:${row.ava_grounding_status}`),
          grounding_status: row.ava_grounding_status,
          unsupported_claim_count: 0,
        })),
      gate_results: expectedTransitionResults(plan.rows, `proof://foundation-v2/${plan.execution_id}/gate-results`)
        .map((gate) => ({
          gate_id: gate.gate_id,
          transition: gate.transition,
          input_count: gate.input_count,
          output_count: gate.output_count,
          unexplained_variance: gate.unexplained_variance,
          gate_status: gate.status,
        }))
        .sort((a, b) => a.gate_id.localeCompare(b.gate_id)),
    }),
  );
}

export function databaseUrl() {
  return process.env.ABARVA_AZURE_DATABASE_URL || process.env.AZURE_DATABASE_URL || process.env.DATABASE_URL || "";
}

export function managedIdentityDbAuthEnabled() {
  return (
    process.env.FOUNDATION_V2_PG_AUTH === "managed-identity" ||
    process.env.FOUNDATION_V2_USE_MANAGED_IDENTITY_DB_AUTH === "true"
  );
}

export async function foundationPostgresClientOptions(applicationName) {
  if (!managedIdentityDbAuthEnabled()) {
    const url = databaseUrl();
    if (!url) throw new Error("ABARVA_AZURE_DATABASE_URL, AZURE_DATABASE_URL or DATABASE_URL is required");
    return postgresClientOptions(url, applicationName);
  }

  const host = requiredEnv("FOUNDATION_V2_PGHOST");
  const database = requiredEnv("FOUNDATION_V2_PGDATABASE");
  const user = requiredEnv("FOUNDATION_V2_PGUSER");
  const clientId =
    process.env.FOUNDATION_V2_MANAGED_IDENTITY_CLIENT_ID ||
    process.env.AZURE_CLIENT_ID ||
    process.env.MANAGED_IDENTITY_CLIENT_ID ||
    "";
  if (!clientId) {
    throw new Error("FOUNDATION_V2_MANAGED_IDENTITY_CLIENT_ID or AZURE_CLIENT_ID is required for managed-identity DB auth");
  }
  const { ManagedIdentityCredential } = await import("@azure/identity");
  const credential = new ManagedIdentityCredential(clientId);
  const token = await credential.getToken(MANAGED_IDENTITY_DB_SCOPE);
  if (!token?.token) throw new Error("Managed identity did not return a PostgreSQL Entra access token");
  return {
    host,
    port: Number(process.env.FOUNDATION_V2_PGPORT || "5432"),
    database,
    user,
    password: token.token,
    ssl: postgresSslOptions(`postgresql://${encodeURIComponent(user)}@${host}/${database}`),
    application_name: applicationName,
  };
}

export function bindFoundationV2SqlContext(client) {
  const query = client.query.bind(client);
  client.query = (config, values, callback) => {
    if (typeof config === "string") {
      return query(rewriteFoundationV2Sql(config), values, callback);
    }
    if (config && typeof config === "object" && typeof config.text === "string") {
      return query({ ...config, text: rewriteFoundationV2Sql(config.text) }, values, callback);
    }
    return query(config, values, callback);
  };
  return client;
}

export function rewriteFoundationV2Sql(sql) {
  return String(sql)
    .replaceAll("foundation_v2.", `${quoteIdent(DATABASE_SCHEMA)}.`)
    .replaceAll("'foundation_v2'", quoteLiteral(DATABASE_SCHEMA))
    .replaceAll("foundation_v2_golden_slice_writer", WRITER_ROLE)
    .replaceAll("foundation_v2_golden_slice_reader", READER_ROLE)
    .replaceAll("airline-demo-new-foundation-v2-golden-slice-v1", SOURCE_RELEASE_ID)
    .replaceAll("foundation-v2-golden-slice-v1", TEST_NAMESPACE)
    .replaceAll("airline-demo-new", FOUNDATION_RELEASE_ALIAS)
    .replaceAll("skyharbor-air", TENANT_KEY);
}

export function foundationTable(tableName) {
  return `${quoteIdent(DATABASE_SCHEMA)}.${quoteIdent(tableName)}`;
}

export function quoteIdent(value) {
  assertSqlIdentifier(value, "SQL identifier");
  return `"${String(value).replace(/"/g, '""')}"`;
}

export function quoteLiteral(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}

function buildExecutionContext() {
  const domain = process.env.FOUNDATION_V2_DOMAIN || process.env.FOUNDATION_V2_EXECUTION_DOMAIN || "airline";
  const selected = LANE_CONFIGS[domain] || LANE_CONFIGS.airline;
  const context = {
    ...selected,
    domain,
    database_schema: process.env.FOUNDATION_V2_DATABASE_SCHEMA || selected.database_schema,
    execution_namespace: process.env.FOUNDATION_V2_EXECUTION_NAMESPACE || selected.execution_namespace,
    writer_role: process.env.FOUNDATION_V2_WRITER_ROLE || selected.writer_role,
    reader_role: process.env.FOUNDATION_V2_READER_ROLE || selected.reader_role,
    tenant_key: process.env.FOUNDATION_V2_TENANT_KEY || selected.tenant_key,
    release_alias: process.env.FOUNDATION_V2_RELEASE_ALIAS || selected.release_alias,
    source_release_id: process.env.FOUNDATION_V2_SOURCE_RELEASE_ID || selected.source_release_id,
    publication_namespace: process.env.FOUNDATION_V2_PUBLICATION_NAMESPACE || selected.publication_namespace,
    baseline_namespace: process.env.FOUNDATION_V2_BASELINE_NAMESPACE || selected.baseline_namespace,
    projection_namespace: process.env.FOUNDATION_V2_PROJECTION_NAMESPACE || selected.projection_namespace,
    cube_namespace: process.env.FOUNDATION_V2_CUBE_NAMESPACE || selected.cube_namespace,
    terminal_status: process.env.FOUNDATION_V2_TERMINAL_STATUS || selected.terminal_status,
  };
  for (const [key, value] of Object.entries(context)) {
    if (key.endsWith("_schema") || key.endsWith("_role") || key === "cube_namespace") {
      assertSqlIdentifier(value, key);
    }
  }
  return context;
}

function requiredEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function assertSqlIdentifier(value, label) {
  if (!/^[a-z][a-z0-9_]{0,62}$/.test(String(value))) throw new Error(`Invalid ${label}: ${value}`);
}

export function fixtureStateBucket(fixture) {
  if (fixture.expected_state === "deferred" || fixture.expected_state === "proposed_not_approved") return "deferred";
  if (fixture.expected_state === "rejected") return "rejected";
  if (fixture.expected_state === "duplicate_suppressed") return "duplicate";
  if (fixture.fixture_name === "malformed_row") return "malformed";
  if (fixture.expected_state === "restricted") return "restricted";
  return "accepted";
}

function shouldDisablePostgresSsl(connectionString) {
  try {
    const url = new URL(connectionString);
    const sslMode = url.searchParams.get("sslmode")?.toLowerCase();
    if (sslMode === "disable") return true;
    return ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
  } catch {
    return false;
  }
}

function postgresSslOptions(connectionString) {
  if (shouldDisablePostgresSsl(connectionString)) return false;
  if (process.env.FOUNDATION_V2_ALLOW_INSECURE_DB_TLS === "true") {
    return { rejectUnauthorized: false };
  }
  if (process.env.FOUNDATION_V2_DB_CA_FILE) {
    return {
      ca: fs.readFileSync(process.env.FOUNDATION_V2_DB_CA_FILE, "utf8"),
      rejectUnauthorized: true,
    };
  }
  return { rejectUnauthorized: true };
}

function readTenantDeclaration() {
  const registryPath = path.join(REPO_ROOT, "datasets/tenant-inputs/tenant-input-registry.json");
  const registry = JSON.parse(fs.readFileSync(registryPath, "utf8"));
  const tenant = (registry.activeTenants || []).find((entry) => entry.tenantKey === TENANT_KEY);
  if (!tenant) {
    throw new Error(`Tenant ${TENANT_KEY} is not declared in ${path.relative(REPO_ROOT, registryPath)}`);
  }
  const releaseContract = JSON.parse(fs.readFileSync(RELEASE_CONTRACT_PATH, "utf8"));
  const contractDefects = [];
  if (releaseContract.tenant_key !== TENANT_KEY) contractDefects.push("tenant_key");
  if (releaseContract.foundation_release_alias !== FOUNDATION_RELEASE_ALIAS) contractDefects.push("foundation_release_alias");
  if (releaseContract.source_release_id !== SOURCE_RELEASE_ID) contractDefects.push("source_release_id");
  if (releaseContract.test_namespace !== TEST_NAMESPACE) contractDefects.push("test_namespace");
  if (releaseContract.isolation_scope !== ISOLATION_SCOPE) contractDefects.push("isolation_scope");
  if (releaseContract.database_schema && releaseContract.database_schema !== DATABASE_SCHEMA) {
    contractDefects.push("database_schema");
  }
  if (releaseContract.writer_role && releaseContract.writer_role !== WRITER_ROLE) contractDefects.push("writer_role");
  if (releaseContract.reader_role && releaseContract.reader_role !== READER_ROLE) contractDefects.push("reader_role");
  if (releaseContract.allowed_status && releaseContract.allowed_status !== TERMINAL_STATUS) {
    contractDefects.push("allowed_status");
  }
  for (const gate of [
    "full_reload_approved",
    "offline_augmentation_approved",
    "production_provider_cutover_approved",
    "live_baseline_activation_approved",
    "v1_mutation_approved",
  ]) {
    if (releaseContract[gate] !== false) contractDefects.push(gate);
  }
  if (contractDefects.length > 0) {
    throw new Error(
      `Release contract ${path.relative(REPO_ROOT, RELEASE_CONTRACT_PATH)} mismatches: ${contractDefects.join(", ")}`,
    );
  }
  return {
    registry_path: path.relative(REPO_ROOT, registryPath),
    release_contract_path: path.relative(REPO_ROOT, RELEASE_CONTRACT_PATH),
    release_contract_id: releaseContract.contract_id,
    tenant_key: tenant.tenantKey,
    display_name: tenant.displayName,
    canonical_input_root: tenant.canonicalInputRoot,
    release_alias: FOUNDATION_RELEASE_ALIAS,
  };
}

export function findRepoRoot(start) {
  let cursor = start;
  while (true) {
    if (
      fs.existsSync(path.join(cursor, "package.json")) &&
      fs.existsSync(path.join(cursor, "fixtures/foundation-v2/golden-slice/fixture-matrix.json")) &&
      fs.existsSync(path.join(cursor, "fixtures/foundation-v2/golden-slice/release-contract.json")) &&
      fs.existsSync(path.join(cursor, "supabase/migrations", MIGRATION_NAME)) &&
      fs.existsSync(path.join(cursor, "supabase/migrations", WRITE_POLICY_MIGRATION_NAME)) &&
      fs.existsSync(path.join(cursor, "supabase/migrations", IDENTITY_CONTROL_MIGRATION_NAME))
    ) {
      return cursor;
    }
    const parent = path.dirname(cursor);
    if (parent === cursor) throw new Error(`Could not locate repo root from ${start}`);
    cursor = parent;
  }
}

function defaultOutDir() {
  return path.join(os.tmpdir(), `foundation-v2-golden-slice-${new Date().toISOString().replace(/[:.]/g, "-")}`);
}

function expectedUnexplainedVariance(fixtures, inputLayer, outputLayer) {
  return fixtures.reduce((total, fixture) => {
    const input = fixture.counts[inputLayer] || 0;
    const output = fixture.counts[outputLayer] || 0;
    if (output > input && !allowsExpansion(fixture, inputLayer, outputLayer)) return total + output - input;
    return total;
  }, 0);
}

function allowsExpansion(fixture, inputLayer, outputLayer) {
  return (
    inputLayer === "L10_cube_outputs" &&
    outputLayer === "L11_product_claims" &&
    ["executive_perspective", "claude_narrative_draft", "module_handoff"].includes(fixture.fixture_name)
  );
}

function countByDecision(fixtures, decision, layerKey) {
  return fixtures.filter((fixture) => fixture.counts[layerKey] > 0 && reviewDecisionFor(fixture) === decision).length;
}

function reviewDecisionFor(fixture) {
  if ((fixture.counts.L6_canonical_objects || 0) > 0) return "accepted";
  if (fixture.expected_state === "deferred" || fixture.expected_state === "proposed_not_approved") return "deferred";
  if ((fixture.counts.L5_review_decisions || 0) > 0) return "rejected";
  return "rejected";
}

function rowDispositionFor(fixture) {
  if (fixture.expected_state === "duplicate_suppressed") return "DUPLICATE";
  if (fixture.fixture_name === "malformed_row") return "MALFORMED";
  if (fixture.expected_state === "restricted") return "RESTRICTED";
  return "MATCHED";
}

function availabilityFor(fixture, productPassed) {
  if (productPassed) return "available";
  if (fixture.expected_state === "restricted") return "withheld";
  if (fixture.expected_state === "stale") return "stale";
  if (fixture.expected_state === "proposed_not_approved") return "withheld";
  return "unsupported";
}

function csvEscape(value) {
  const text = String(value ?? "");
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}
