#!/usr/bin/env node
import { execFileSync, spawn } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const testPath = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(testPath), "../../..");
const args = parseArgs(process.argv.slice(2));
const migrationPath = path.join(repoRoot, "supabase/migrations/20260730120000_foundation_v2_golden_slice_core.sql");
const writePolicyMigrationPath = path.join(
  repoRoot,
  "supabase/migrations/20260730133000_foundation_v2_golden_slice_write_policies.sql",
);
const identityControlMigrationPath = path.join(
  repoRoot,
  "supabase/migrations/20260730152000_foundation_v2_golden_slice_identity_controls.sql",
);
const identityControlMigrationSql = readFileSync(identityControlMigrationPath, "utf8");
const proofOutput = args["proof-output"] ? path.resolve(process.cwd(), args["proof-output"]) : null;
const workDir = mkdtempSync(path.join(tmpdir(), "foundation-v2-pg-"));
const dataDir = path.join(workDir, "data");
const socketDir = path.join(workDir, "socket");
const port = String(15432 + Math.floor(Math.random() * 1000));
let postgresProcess;

try {
  assertIdentityMigrationHardeningIsProviderSafe(identityControlMigrationSql);

  requireCommand("initdb");
  requireCommand("postgres");
  requireCommand("pg_ctl");
  requireCommand("pg_isready");
  requireCommand("psql");

  mkdirSync(socketDir, { recursive: true });
  execFileSync("initdb", ["-D", dataDir, "-A", "trust", "-U", "postgres"], {
    stdio: "pipe",
  });

  postgresProcess = spawn(
    "postgres",
    ["-D", dataDir, "-k", socketDir, "-p", port, "-c", "listen_addresses="],
    { stdio: "pipe" },
  );
  await waitForReady();

  execFileSync("psql", ["-h", socketDir, "-p", port, "-U", "postgres", "-d", "postgres", "-v", "ON_ERROR_STOP=1", "-f", migrationPath], {
    encoding: "utf8",
    stdio: "pipe",
  });
  execFileSync(
    "psql",
    ["-h", socketDir, "-p", port, "-U", "postgres", "-d", "postgres", "-v", "ON_ERROR_STOP=1", "-f", writePolicyMigrationPath],
    {
      encoding: "utf8",
      stdio: "pipe",
    },
  );
  execFileSync(
    "psql",
    ["-h", socketDir, "-p", port, "-U", "postgres", "-d", "postgres", "-v", "ON_ERROR_STOP=1", "-f", identityControlMigrationPath],
    {
      encoding: "utf8",
      stdio: "pipe",
    },
  );

  const inspection = JSON.parse(execFileSync(
    "psql",
    [
      "-h",
      socketDir,
      "-p",
      port,
      "-U",
      "postgres",
      "-d",
      "postgres",
      "-v",
      "ON_ERROR_STOP=1",
      "-At",
      "-c",
      inspectionSql(),
    ],
    { encoding: "utf8" },
  ));

  const failures = [];
  if (inspection.table_count !== 21) {
    failures.push(`expected 21 foundation_v2 tables, found ${inspection.table_count}`);
  }
  if (inspection.tables_without_rls !== 0) {
    failures.push(`expected all foundation_v2 tables to have RLS enabled, found ${inspection.tables_without_rls} without RLS`);
  }
  if (inspection.tables_without_force_rls !== 0) {
    failures.push(`expected all foundation_v2 tables to FORCE RLS, found ${inspection.tables_without_force_rls} without FORCE RLS`);
  }
  if (inspection.composite_fk_count < 18) {
    failures.push(`expected at least 18 composite tenant/test FKs, found ${inspection.composite_fk_count}`);
  }
  if (inspection.required_nonempty_constraint_count < 100) {
    failures.push(`expected broad non-empty required text constraints, found ${inspection.required_nonempty_constraint_count}`);
  }
  if (inspection.policy_with_admin_bypass_count !== 0) {
    failures.push(`expected zero policies with internal-admin bypass, found ${inspection.policy_with_admin_bypass_count}`);
  }
  if (inspection.product_pass_guard_count !== 1) {
    failures.push(`expected product render passed unsupported-claim guard, found ${inspection.product_pass_guard_count}`);
  }
  if (inspection.writer_insert_policy_count !== 21) {
    failures.push(`expected 21 writer INSERT policies, found ${inspection.writer_insert_policy_count}`);
  }
  if (inspection.writer_role_count !== 1) {
    failures.push(`expected constrained no-login writer role, found ${inspection.writer_role_count}`);
  }
  if (inspection.reader_role_count !== 1) {
    failures.push(`expected constrained no-login reader role, found ${inspection.reader_role_count}`);
  }
  if (inspection.unpinned_writer_policy_count !== 0) {
    failures.push(`expected zero unpinned writer policies, found ${inspection.unpinned_writer_policy_count}`);
  }

  if (failures.length > 0) {
    console.error(JSON.stringify({ status: "FAIL", failures, inspection }, null, 2));
    process.exit(1);
  }

  const proof = {
    status: "PASS",
    generated_at: new Date().toISOString(),
    migrationPath,
    writePolicyMigrationPath,
    identityControlMigrationPath,
    database_scope: "temporary_local_postgresql_only",
    azure_or_shared_database_mutated: false,
    temporary_cluster_shutdown: true,
    port,
    inspection,
  };
  if (proofOutput) {
    mkdirSync(path.dirname(proofOutput), { recursive: true });
    writeFileSync(proofOutput, `${JSON.stringify(proof, null, 2)}\n`);
  }
  console.log(JSON.stringify(proof, null, 2));
} finally {
  if (postgresProcess) {
    postgresProcess.kill("SIGTERM");
    await new Promise((resolve) => postgresProcess.once("exit", resolve));
  }
  rmSync(workDir, { recursive: true, force: true });
}

function requireCommand(command) {
  execFileSync("sh", ["-lc", `command -v ${command}`], { stdio: "pipe" });
}

function parseArgs(rawArgs) {
  const parsed = {};
  for (let index = 0; index < rawArgs.length; index += 1) {
    const arg = rawArgs[index];
    if (!arg.startsWith("--")) {
      throw new Error(`Unexpected positional argument: ${arg}`);
    }
    const key = arg.slice(2);
    const value = rawArgs[index + 1];
    if (!value || value.startsWith("--")) {
      throw new Error(`Missing value for ${arg}`);
    }
    parsed[key] = value;
    index += 1;
  }
  return parsed;
}

function assertIdentityMigrationHardeningIsProviderSafe(sql) {
  if (/^ALTER ROLE foundation_v2_golden_slice_(writer|reader)\b/m.test(sql)) {
    throw new Error("identity-control migration must not use top-level ALTER ROLE; managed Postgres can deny it");
  }
  if (!sql.includes("EXCEPTION WHEN insufficient_privilege")) {
    throw new Error("identity-control migration must handle ALTER ROLE insufficient_privilege explicitly");
  }
  if (!sql.includes("identity bootstrap readback must verify non-BYPASSRLS execution")) {
    throw new Error("identity-control migration must preserve the bootstrap/readback gate requirement");
  }
}

async function waitForReady() {
  const startedAt = Date.now();
  while (Date.now() - startedAt < 15000) {
    try {
      execFileSync("pg_isready", ["-h", socketDir, "-p", port, "-U", "postgres"], { stdio: "pipe" });
      return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }
  throw new Error("temporary PostgreSQL did not become ready within 15 seconds");
}

function inspectionSql() {
  return String.raw`
WITH tables AS (
  SELECT c.oid, c.relname, c.relrowsecurity, c.relforcerowsecurity
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'foundation_v2'
    AND c.relkind = 'r'
),
composite_fks AS (
  SELECT con.oid
  FROM pg_constraint con
  WHERE con.contype = 'f'
    AND con.connamespace = 'foundation_v2'::regnamespace
    AND cardinality(con.conkey) >= 3
),
nonempty_constraints AS (
  SELECT con.oid
  FROM pg_constraint con
  JOIN tables t ON t.oid = con.conrelid
  WHERE con.contype = 'c'
    AND con.conname LIKE 'f2_%_nonempty'
),
policies AS (
  SELECT p.polname, p.polcmd, pg_get_expr(p.polqual, p.polrelid) AS qual, pg_get_expr(p.polwithcheck, p.polrelid) AS with_check
  FROM pg_policy p
  JOIN tables t ON t.oid = p.polrelid
),
product_pass_guard AS (
  SELECT con.oid
  FROM pg_constraint con
  WHERE con.conrelid = 'foundation_v2.product_binding_proofs'::regclass
    AND pg_get_constraintdef(con.oid) LIKE '%render_gate_status <> ''passed''%'
    AND pg_get_constraintdef(con.oid) LIKE '%unsupported_claim_count = 0%'
)
SELECT json_build_object(
  'table_count', (SELECT count(*) FROM tables),
  'tables_without_rls', (SELECT count(*) FROM tables WHERE NOT relrowsecurity),
  'tables_without_force_rls', (SELECT count(*) FROM tables WHERE NOT relforcerowsecurity),
  'composite_fk_count', (SELECT count(*) FROM composite_fks),
  'required_nonempty_constraint_count', (SELECT count(*) FROM nonempty_constraints),
  'policy_with_admin_bypass_count', (SELECT count(*) FROM policies WHERE qual LIKE '%internal-admin%'),
  'product_pass_guard_count', (SELECT count(*) FROM product_pass_guard),
  'writer_insert_policy_count', (SELECT count(*) FROM policies WHERE polname = 'foundation_v2_tenant_insert' AND polcmd = 'a'),
  'writer_role_count', (
    SELECT count(*) FROM pg_roles
     WHERE rolname = 'foundation_v2_golden_slice_writer'
       AND NOT rolcanlogin
       AND NOT rolsuper
       AND NOT rolcreatedb
       AND NOT rolcreaterole
       AND NOT rolreplication
       AND NOT rolbypassrls
       AND NOT rolinherit
  ),
  'reader_role_count', (
    SELECT count(*) FROM pg_roles
     WHERE rolname = 'foundation_v2_golden_slice_reader'
       AND NOT rolcanlogin
       AND NOT rolsuper
       AND NOT rolcreatedb
       AND NOT rolcreaterole
       AND NOT rolreplication
       AND NOT rolbypassrls
       AND NOT rolinherit
  ),
  'unpinned_writer_policy_count', (
    SELECT count(*)
      FROM policies
     WHERE polname = 'foundation_v2_tenant_insert'
       AND (
         with_check NOT LIKE '%tenant_key = ''skyharbor-air''%'
         OR with_check NOT LIKE '%test_namespace = ''foundation-v2-golden-slice-v1''%'
         OR with_check NOT LIKE '%airline-demo-new-foundation-v2-golden-slice-v1%'
         OR with_check NOT LIKE '%app.foundation_v2_release_alias%'
         OR with_check NOT LIKE '%current_setting(''app.foundation_v2_release_alias''%'
         OR with_check NOT LIKE '%= ''airline-demo-new''%'
       )
  )
)::text;
`;
}
