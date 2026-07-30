#!/usr/bin/env node
import { mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  EXPECTED_FIXTURE_SHA256,
  EXPECTED_IDENTITY_CONTROL_MIGRATION_SHA256,
  EXPECTED_MIGRATION_SHA256,
  EXPECTED_WRITE_POLICY_MIGRATION_SHA256,
  IDENTITY_CONTROL_MIGRATION_NAME,
  MIGRATION_NAME,
  WRITE_POLICY_MIGRATION_NAME,
  buildFixturePlan,
  readFixtureSet,
} from "../golden-slice-support.mjs";

const testPath = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(testPath), "../../..");
const fixturePath = path.join(repoRoot, "fixtures/foundation-v2/golden-slice/fixture-matrix.json");
const outDir = mkdtempSync(path.join(tmpdir(), "foundation-v2-golden-slice-db-test-"));
const failures = [];

const { fixtureSet, fixtureSha256 } = readFixtureSet(fixturePath);
if (fixtureSha256 !== EXPECTED_FIXTURE_SHA256) failures.push(`fixture hash mismatch ${fixtureSha256}`);
const plan = buildFixturePlan(fixtureSet, fixtureSha256, "unit-test-execution");
if (plan.rows.length !== 21) failures.push(`expected 21 rows, got ${plan.rows.length}`);
if (plan.expected_layer_totals.L0_source_rows !== 21) failures.push("L0 expected total mismatch");
if (plan.expected_layer_totals.L12_ava_outputs !== 12) failures.push("L12 expected total mismatch");
if (plan.source_field_rows.length !== plan.expected_layer_totals.L2_parsed_rows * 3) {
  failures.push("source field rows do not reconcile to parsed rows");
}
if (plan.baseline_id.includes("knowledge-baseline-v1")) failures.push("baseline id resembles V1 active baseline");
if (new Set(plan.rows.map((row) => row.canonical_object_id)).size !== 21) {
  failures.push("expected object ids should stay unique across fixtures");
}

for (const [script, mode] of [
  ["scripts/foundation-v2/execute-golden-slice-db.mjs", "self-test"],
  ["scripts/foundation-v2/verify-golden-slice-db.mjs", "self-test"],
  ["scripts/foundation-v2/bootstrap-db-identity.mjs", "self-test"],
]) {
  const result = spawnSync(
    "node",
    [path.join(repoRoot, script), "--mode", mode, "--out-dir", outDir, "--execution-id", "unit-test-execution"],
    { cwd: repoRoot, encoding: "utf8" },
  );
  if (result.status !== 0) {
    failures.push(`${script} ${mode} failed: ${result.stderr || result.stdout}`);
  }
}

const aadWrapperSource = readFileSync(path.join(repoRoot, "scripts/foundation-v2/run-golden-slice-db-aad.mjs"), "utf8");
for (const requiredTokenBinding of [
  "IDENTITY_ENDPOINT",
  "IDENTITY_HEADER",
  "X-IDENTITY-HEADER",
  "https://ossrdbms-aad.database.windows.net",
  "foundation-v2:migrate:dry",
  "foundation-v2:migrate:apply",
]) {
  if (!aadWrapperSource.includes(requiredTokenBinding)) {
    failures.push(`AAD wrapper missing ACA token binding marker ${requiredTokenBinding}`);
  }
}
const bootstrapSource = readFileSync(path.join(repoRoot, "scripts/foundation-v2/bootstrap-db-identity.mjs"), "utf8");
for (const requiredBootstrapMarker of [
  "SECURITY LABEL FOR",
  "pgaadauth_security_label",
  "pg_shseclabel",
  "aadauth,oid=",
]) {
  if (!bootstrapSource.includes(requiredBootstrapMarker)) {
    failures.push(`DB identity bootstrap missing Entra security-label fallback marker ${requiredBootstrapMarker}`);
  }
}

const executorProof = JSON.parse(
  readFileSync(path.join(outDir, "FOUNDATION_V2_GOLDEN_SLICE_EXECUTOR_SELF_TEST.json"), "utf8"),
);
if (executorProof.status !== "FOUNDATION_V2_GOLDEN_SLICE_EXECUTOR_SELF_TEST_PASSED") {
  failures.push(`executor proof status ${executorProof.status}`);
}
const verifierProof = JSON.parse(
  readFileSync(path.join(outDir, "FOUNDATION_V2_GOLDEN_SLICE_VERIFIER_SELF_TEST.json"), "utf8"),
);
if (verifierProof.status !== "FOUNDATION_V2_GOLDEN_SLICE_VERIFIER_SELF_TEST_PASSED") {
  failures.push(`verifier proof status ${verifierProof.status}`);
}

let dbReplay = null;
try {
  dbReplay = runDbReplay();
} catch (error) {
  failures.push(`DB replay failed: ${error.message}`);
}

let approvedMigrationApplyReplay = null;
try {
  approvedMigrationApplyReplay = runApprovedMigrationApplyReplay();
} catch (error) {
  failures.push(`approved migration apply replay failed: ${error.message}`);
}

if (failures.length > 0) {
  console.error(JSON.stringify({ status: "FAIL", outDir, failures }, null, 2));
  process.exit(1);
}

console.log(
  JSON.stringify(
    {
      status: "PASS",
      outDir,
      fixtureSha256,
      expectedLayerTotals: plan.expected_layer_totals,
      sourceFieldRows: plan.source_field_rows.length,
      dbReplay,
      approvedMigrationApplyReplay,
    },
    null,
    2,
  ),
);

function runDbReplay() {
  for (const command of ["initdb", "pg_ctl", "createdb", "psql"]) requireCommand(command);
  const workDir = mkdtempSync("/tmp/f2-db-exec-");
  const dataDir = path.join(workDir, "pgdata");
  const proofDir = path.join(workDir, "proof");
  const port = randomPostgresPort();
  const database = "foundation_v2_replay";
  mkdirSync(proofDir, { recursive: true });
  try {
    run("initdb", ["-D", dataDir, "--no-locale", "--encoding=UTF8", "-U", "postgres"]);
    run("pg_ctl", ["-D", dataDir, "-o", `-p ${port} -k ${workDir}`, "-l", path.join(workDir, "postgres.log"), "start"]);
    run("createdb", ["-h", workDir, "-p", port, "-U", "postgres", database]);
    psql(workDir, port, database, [
      "-c",
      "CREATE TABLE schema_migrations(name text PRIMARY KEY, sha256 text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now())",
    ]);
    psql(workDir, port, database, ["-f", path.join(repoRoot, "supabase/migrations/20260730120000_foundation_v2_golden_slice_core.sql")]);
    psql(workDir, port, database, [
      "-f",
      path.join(repoRoot, "supabase/migrations/20260730133000_foundation_v2_golden_slice_write_policies.sql"),
    ]);
    psql(workDir, port, database, [
      "-f",
      path.join(repoRoot, "supabase/migrations/20260730152000_foundation_v2_golden_slice_identity_controls.sql"),
    ]);
    psql(workDir, port, database, [
      "-c",
      `INSERT INTO schema_migrations(name, sha256) VALUES ('${MIGRATION_NAME}','${EXPECTED_MIGRATION_SHA256}'), ('${WRITE_POLICY_MIGRATION_NAME}','${EXPECTED_WRITE_POLICY_MIGRATION_SHA256}'), ('${IDENTITY_CONTROL_MIGRATION_NAME}','${EXPECTED_IDENTITY_CONTROL_MIGRATION_SHA256}')`,
    ]);
    psql(workDir, port, database, [
      "-c",
      "CREATE ROLE foundation_v2_local_operator LOGIN NOINHERIT PASSWORD 'local-only'; CREATE ROLE foundation_v2_local_reader LOGIN NOINHERIT PASSWORD 'local-only'; CREATE ROLE foundation_v2_plain_operator LOGIN NOINHERIT PASSWORD 'local-only'; GRANT foundation_v2_golden_slice_writer TO foundation_v2_local_operator; GRANT foundation_v2_golden_slice_reader TO foundation_v2_local_reader; GRANT SELECT ON schema_migrations TO foundation_v2_local_operator, foundation_v2_plain_operator",
    ]);

    const operatorUrl = `postgresql://foundation_v2_local_operator:local-only@localhost:${port}/${database}?host=${workDir}&sslmode=disable`;
    const readerUrl = `postgresql://foundation_v2_local_reader:local-only@localhost:${port}/${database}?host=${workDir}&sslmode=disable`;
    const superuserUrl = `postgresql://postgres@localhost:${port}/${database}?host=${workDir}&sslmode=disable`;
    const env = { ...process.env, DATABASE_URL: operatorUrl };
    const verifierEnv = { ...process.env, DATABASE_URL: readerUrl, FOUNDATION_V2_DB_SET_ROLE: "foundation_v2_golden_slice_reader" };
    const statuses = {
      schema: runJson("scripts/foundation-v2/execute-golden-slice-db.mjs", ["--mode", "schema-readback", "--out-dir", proofDir], env)
        .status,
      preflight: runJson("scripts/foundation-v2/execute-golden-slice-db.mjs", ["--mode", "preflight", "--out-dir", proofDir], env).status,
      apply: runJson("scripts/foundation-v2/execute-golden-slice-db.mjs", ["--mode", "apply", "--out-dir", proofDir], env).status,
      verify: runJson("scripts/foundation-v2/verify-golden-slice-db.mjs", ["--mode", "verify", "--out-dir", proofDir], verifierEnv).status,
      idempotency: runJson("scripts/foundation-v2/execute-golden-slice-db.mjs", ["--mode", "apply", "--out-dir", path.join(proofDir, "idempotency")], env).status,
    };
    assertStatus(statuses.schema, "FOUNDATION_V2_SCHEMA_READBACK_PASSED", "schema replay");
    assertStatus(statuses.preflight, "FOUNDATION_V2_GOLDEN_SLICE_PREFLIGHT_PASSED", "preflight replay");
    assertStatus(statuses.apply, "FOUNDATION_V2_GOLDEN_SLICE_EXECUTOR_APPLIED", "apply replay");
    assertStatus(statuses.verify, "FOUNDATION_V2_GOLDEN_SLICE_CERTIFIED", "verify replay");
    assertStatus(statuses.idempotency, "FOUNDATION_V2_GOLDEN_SLICE_ALREADY_APPLIED_EXACT_MATCH", "idempotency replay");
    const proofTailCapturable = assertEmitProofTailCapturable(env, path.join(proofDir, "emit-proof-tail"));

    const superuserReadback = spawnSync(
      "node",
      [path.join(repoRoot, "scripts/foundation-v2/execute-golden-slice-db.mjs"), "--mode", "schema-readback", "--out-dir", path.join(proofDir, "superuser-negative")],
      { cwd: repoRoot, env: { ...process.env, DATABASE_URL: superuserUrl }, encoding: "utf8" },
    );
    if (superuserReadback.status === 0) throw new Error("superuser schema readback unexpectedly passed");

    const wrongTenant = spawnSync(
      "psql",
      [
        "-h",
        workDir,
        "-p",
        port,
        "-U",
        "foundation_v2_local_operator",
        "-d",
        database,
        "-v",
        "ON_ERROR_STOP=1",
        "-c",
        "BEGIN; SELECT set_config('app.tenant_key','wrong-tenant',true); SELECT set_config('app.foundation_v2_test_namespace','foundation-v2-golden-slice-v1',true); SELECT set_config('app.foundation_v2_source_release_id','airline-demo-new-foundation-v2-golden-slice-v1',true); SELECT set_config('app.foundation_v2_release_alias','airline-demo-new',true); SET LOCAL ROLE foundation_v2_golden_slice_writer; INSERT INTO foundation_v2.source_releases(source_release_id, tenant_key, test_namespace, release_version, release_hash, source_release_state, isolation_scope, v1_component_classification, writer_job_id) VALUES ('airline-demo-new-foundation-v2-golden-slice-v1:bad','wrong-tenant','foundation-v2-golden-slice-v1','bad','aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa','isolated_golden_slice','ISOLATED_FOUNDATION_V2_GOLDEN_SLICE_ONLY','SUPERSEDE_WITH_V2','bad'); COMMIT;",
      ],
      { encoding: "utf8" },
    );
    if (wrongTenant.status === 0) throw new Error("wrong-tenant writer INSERT unexpectedly passed");

    const plainOperatorReadback = spawnSync(
      "node",
      [path.join(repoRoot, "scripts/foundation-v2/execute-golden-slice-db.mjs"), "--mode", "schema-readback", "--out-dir", path.join(proofDir, "plain-role-negative")],
      {
        cwd: repoRoot,
        env: {
          ...process.env,
          DATABASE_URL: `postgresql://foundation_v2_plain_operator:local-only@localhost:${port}/${database}?host=${workDir}&sslmode=disable`,
        },
        encoding: "utf8",
      },
    );
    if (plainOperatorReadback.status === 0) throw new Error("plain non-writer schema readback unexpectedly passed");

    const missingNamespace = spawnSync(
      "psql",
      [
        "-h",
        workDir,
        "-p",
        port,
        "-U",
        "foundation_v2_local_operator",
        "-d",
        database,
        "-v",
        "ON_ERROR_STOP=1",
        "-c",
        "BEGIN; SELECT set_config('app.tenant_key','skyharbor-air',true); SELECT set_config('app.foundation_v2_source_release_id','airline-demo-new-foundation-v2-golden-slice-v1',true); SELECT set_config('app.foundation_v2_release_alias','airline-demo-new',true); SET LOCAL ROLE foundation_v2_golden_slice_writer; INSERT INTO foundation_v2.source_releases(source_release_id, tenant_key, test_namespace, release_version, release_hash, source_release_state, isolation_scope, v1_component_classification, writer_job_id) VALUES ('airline-demo-new-foundation-v2-golden-slice-v1:missing-ns','skyharbor-air','foundation-v2-golden-slice-v1','bad','bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb','isolated_golden_slice','ISOLATED_FOUNDATION_V2_GOLDEN_SLICE_ONLY','SUPERSEDE_WITH_V2','bad'); COMMIT;",
      ],
      { encoding: "utf8" },
    );
    if (missingNamespace.status === 0) throw new Error("missing-namespace writer INSERT unexpectedly passed");

    psql(workDir, port, database, ["-c", "UPDATE foundation_v2.gate_results SET gate_status='failed' WHERE gate_id='F2-GATE-L0-L1'"]);
    const tamperedApply = spawnSync(
      "node",
      [path.join(repoRoot, "scripts/foundation-v2/execute-golden-slice-db.mjs"), "--mode", "apply", "--out-dir", path.join(proofDir, "tamper-negative")],
      { cwd: repoRoot, env, encoding: "utf8" },
    );
    if (tamperedApply.status === 0) throw new Error("tampered idempotency replay unexpectedly passed");

    return {
      statuses,
      negatives: {
        proof_tail_capturable: proofTailCapturable,
        superuser_schema_readback_failed: true,
        wrong_tenant_insert_failed: true,
        non_writer_schema_readback_failed: true,
        missing_namespace_insert_failed: true,
        tampered_idempotency_failed: true,
        cube_tamper_detected: runTamperVerifierCase("cube", "UPDATE foundation_v2.cube_parity_results SET parity_status='not_applicable' WHERE parity_status='passed'", "L9->L10_CUBE_PARITY"),
        product_authority_tamper_detected: runTamperVerifierCase(
          "product-authority",
          "INSERT INTO foundation_v2.projection_authority(projection_authority_id, baseline_id, tenant_key, test_namespace, projection_name, projection_version, projection_hash, projection_row_count, freshness_state, writer_job_id) SELECT 'wrong-authority', baseline_id, tenant_key, test_namespace, 'golden_slice_knowledge_preview', 'wrong', 'dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd', 0, 'fresh', 'tamper' FROM foundation_v2.baselines LIMIT 1; UPDATE foundation_v2.product_binding_proofs SET projection_authority_id='wrong-authority' WHERE render_gate_status='passed'",
          "L9->L11_PRODUCT_BINDING",
        ),
        ava_baseline_tamper_detected: runTamperVerifierCase(
          "ava-baseline",
          "INSERT INTO foundation_v2.baselines(baseline_id, tenant_key, test_namespace, baseline_version, baseline_hash, baseline_state, writer_job_id) SELECT 'wrong-baseline', tenant_key, test_namespace, 'wrong', 'eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', 'isolated_test', 'tamper' FROM foundation_v2.baselines LIMIT 1; UPDATE foundation_v2.ava_packet_proofs SET baseline_id='wrong-baseline' WHERE grounding_status='grounded'",
          "L9/L10->L12_AVA_BINDING",
        ),
        baseline_hash_tamper_detected: runTamperVerifierCase(
          "baseline-hash",
          "UPDATE foundation_v2.baselines SET baseline_hash='cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc'",
          "L7->L8_BASELINE_REPRODUCIBILITY",
        ),
        field_lineage_tamper_detected: runTamperVerifierCase(
          "field-lineage",
          "UPDATE foundation_v2.projection_field_lineage SET contribution_type='excluded' WHERE contribution_type='direct'",
          "FIELD_LINEAGE",
        ),
      },
    };
  } finally {
    run("pg_ctl", ["-D", dataDir, "stop", "-m", "fast"], { allowFailure: true });
    rmSync(workDir, { recursive: true, force: true });
  }
}

function runApprovedMigrationApplyReplay() {
  for (const command of ["initdb", "pg_ctl", "createdb", "psql"]) requireCommand(command);
  const workDir = mkdtempSync("/tmp/f2-approved-migrations-");
  const dataDir = path.join(workDir, "pgdata");
  const proofDir = path.join(workDir, "proof");
  const port = randomPostgresPort();
  const database = "foundation_v2_migration_apply_replay";
  mkdirSync(proofDir, { recursive: true });
  try {
    run("initdb", ["-D", dataDir, "--no-locale", "--encoding=UTF8", "-U", "postgres"]);
    run("pg_ctl", ["-D", dataDir, "-o", `-p ${port} -k ${workDir}`, "-l", path.join(workDir, "postgres.log"), "start"]);
    run("createdb", ["-h", workDir, "-p", port, "-U", "postgres", database]);
    psql(workDir, port, database, [
      "-c",
      "CREATE TABLE schema_migrations(name text PRIMARY KEY, sha256 text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now())",
    ]);
    psql(workDir, port, database, ["-f", path.join(repoRoot, "supabase/migrations/20260730120000_foundation_v2_golden_slice_core.sql")]);
    psql(workDir, port, database, [
      "-f",
      path.join(repoRoot, "supabase/migrations/20260730133000_foundation_v2_golden_slice_write_policies.sql"),
    ]);
    psql(workDir, port, database, [
      "-c",
      `INSERT INTO schema_migrations(name, sha256) VALUES ('${MIGRATION_NAME}','${EXPECTED_MIGRATION_SHA256}'), ('${WRITE_POLICY_MIGRATION_NAME}','${EXPECTED_WRITE_POLICY_MIGRATION_SHA256}')`,
    ]);

    const proof = runJson("scripts/foundation-v2/apply-approved-migrations.mjs", [], {
      ...process.env,
      DATABASE_URL: `postgresql://postgres@localhost:${port}/${database}?host=${workDir}&sslmode=disable`,
      FOUNDATION_V2_MIGRATION_MODE: "apply",
      FOUNDATION_V2_MIGRATION_OUT_DIR: proofDir,
      FOUNDATION_V2_EMIT_PROOF_BUNDLE: "false",
    });

    assertStatus(proof.status, "FOUNDATION_V2_APPROVED_MIGRATIONS_APPLIED", "approved migration apply replay");
    if (proof.pending_before.length !== 1 || proof.pending_before[0] !== IDENTITY_CONTROL_MIGRATION_NAME) {
      throw new Error(`unexpected pending_before ${JSON.stringify(proof.pending_before)}`);
    }
    if (proof.applied.length !== 1 || proof.applied[0] !== IDENTITY_CONTROL_MIGRATION_NAME) {
      throw new Error(`unexpected applied migrations ${JSON.stringify(proof.applied)}`);
    }
    if (proof.pending_after.length !== 0) {
      throw new Error(`expected pending_after zero, got ${JSON.stringify(proof.pending_after)}`);
    }
    if (proof.defects.length !== 0) {
      throw new Error(`expected zero defects, got ${JSON.stringify(proof.defects)}`);
    }

    return {
      status: proof.status,
      pending_before: proof.pending_before,
      applied: proof.applied,
      pending_after: proof.pending_after,
    };
  } finally {
    run("pg_ctl", ["-D", dataDir, "stop", "-m", "fast"], { allowFailure: true });
    rmSync(workDir, { recursive: true, force: true });
  }
}

function runTamperVerifierCase(name, tamperSql, expectedFirstBrokenTransition) {
  const workDir = mkdtempSync(`/tmp/f2-${name}-`);
  const dataDir = path.join(workDir, "pgdata");
  const proofDir = path.join(workDir, "proof");
  const port = randomPostgresPort();
  const database = "foundation_v2_replay";
  mkdirSync(proofDir, { recursive: true });
  try {
    run("initdb", ["-D", dataDir, "--no-locale", "--encoding=UTF8", "-U", "postgres"]);
    run("pg_ctl", ["-D", dataDir, "-o", `-p ${port} -k ${workDir}`, "-l", path.join(workDir, "postgres.log"), "start"]);
    run("createdb", ["-h", workDir, "-p", port, "-U", "postgres", database]);
    psql(workDir, port, database, [
      "-c",
      "CREATE TABLE schema_migrations(name text PRIMARY KEY, sha256 text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now())",
    ]);
    psql(workDir, port, database, ["-f", path.join(repoRoot, "supabase/migrations/20260730120000_foundation_v2_golden_slice_core.sql")]);
    psql(workDir, port, database, [
      "-f",
      path.join(repoRoot, "supabase/migrations/20260730133000_foundation_v2_golden_slice_write_policies.sql"),
    ]);
    psql(workDir, port, database, [
      "-f",
      path.join(repoRoot, "supabase/migrations/20260730152000_foundation_v2_golden_slice_identity_controls.sql"),
    ]);
    psql(workDir, port, database, [
      "-c",
      `INSERT INTO schema_migrations(name, sha256) VALUES ('${MIGRATION_NAME}','${EXPECTED_MIGRATION_SHA256}'), ('${WRITE_POLICY_MIGRATION_NAME}','${EXPECTED_WRITE_POLICY_MIGRATION_SHA256}'), ('${IDENTITY_CONTROL_MIGRATION_NAME}','${EXPECTED_IDENTITY_CONTROL_MIGRATION_SHA256}')`,
    ]);
    psql(workDir, port, database, [
      "-c",
      "CREATE ROLE foundation_v2_local_operator LOGIN NOINHERIT PASSWORD 'local-only'; CREATE ROLE foundation_v2_local_reader LOGIN NOINHERIT PASSWORD 'local-only'; GRANT foundation_v2_golden_slice_writer TO foundation_v2_local_operator; GRANT foundation_v2_golden_slice_reader TO foundation_v2_local_reader; GRANT SELECT ON schema_migrations TO foundation_v2_local_operator",
    ]);
    const env = {
      ...process.env,
      DATABASE_URL: `postgresql://foundation_v2_local_operator:local-only@localhost:${port}/${database}?host=${workDir}&sslmode=disable`,
    };
    const verifierEnv = {
      ...process.env,
      DATABASE_URL: `postgresql://foundation_v2_local_reader:local-only@localhost:${port}/${database}?host=${workDir}&sslmode=disable`,
      FOUNDATION_V2_DB_SET_ROLE: "foundation_v2_golden_slice_reader",
    };
    runJson("scripts/foundation-v2/execute-golden-slice-db.mjs", ["--mode", "apply", "--out-dir", proofDir], env);
    psql(workDir, port, database, ["-c", tamperSql]);
    const verifier = spawnSync(
      "node",
      [path.join(repoRoot, "scripts/foundation-v2/verify-golden-slice-db.mjs"), "--mode", "verify", "--out-dir", path.join(proofDir, "tampered")],
      { cwd: repoRoot, env: verifierEnv, encoding: "utf8" },
    );
    if (verifier.status === 0) throw new Error(`${name} tamper verifier unexpectedly passed`);
    const json = JSON.parse(verifier.stdout);
    if (json.first_broken_transition !== expectedFirstBrokenTransition) {
      throw new Error(
        `${name} first broken transition ${json.first_broken_transition}; expected ${expectedFirstBrokenTransition}`,
      );
    }
    return true;
  } finally {
    run("pg_ctl", ["-D", dataDir, "stop", "-m", "fast"], { allowFailure: true });
    rmSync(workDir, { recursive: true, force: true });
  }
}

function assertEmitProofTailCapturable(env, proofDir) {
  const result = run(
    "node",
    [
      path.join(repoRoot, "scripts/foundation-v2/execute-golden-slice-db.mjs"),
      "--mode",
      "schema-readback",
      "--out-dir",
      proofDir,
      "--emit-proof-bundle",
    ],
    { env },
  );
  const lines = result.stdout.trim().split(/\n/);
  const last = JSON.parse(lines.at(-1));
  if (last.foundation_v2_compact_result !== "schema-readback") {
    throw new Error(`last proof-tail line was not compact schema readback: ${lines.at(-1)}`);
  }
  if (last.status !== "FOUNDATION_V2_SCHEMA_READBACK_PASSED") {
    throw new Error(`proof-tail compact status ${last.status}`);
  }
  const endMarkerIndex = lines.lastIndexOf("__SEMANTIC2_PROOF_TGZ_END__");
  if (endMarkerIndex !== lines.length - 2) {
    throw new Error("proof bundle marker is not immediately before compact tail summary");
  }
  const beginMarkerIndex = lines.lastIndexOf("__SEMANTIC2_PROOF_TGZ_BEGIN__");
  if (beginMarkerIndex < 0 || beginMarkerIndex >= endMarkerIndex) {
    throw new Error("proof bundle begin marker missing before end marker");
  }
  return true;
}

function requireCommand(command) {
  run("sh", ["-lc", `command -v ${command}`]);
}

function run(command, args, { env = process.env, allowFailure = false } = {}) {
  const result = spawnSync(command, args, { cwd: repoRoot, env, encoding: "utf8" });
  if (!allowFailure && result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} failed: ${result.stderr || result.stdout}`);
  }
  return result;
}

function psql(socketDir, port, database, args) {
  return run("psql", ["-h", socketDir, "-p", port, "-U", "postgres", "-d", database, "-v", "ON_ERROR_STOP=1", ...args]);
}

function runJson(script, args, env) {
  const result = run("node", [path.join(repoRoot, script), ...args], { env });
  return JSON.parse(result.stdout);
}

function assertStatus(actual, expected, label) {
  if (actual !== expected) throw new Error(`${label} status ${actual}; expected ${expected}`);
}

function randomPostgresPort() {
  return String(20000 + Math.floor(Math.random() * 25000));
}
