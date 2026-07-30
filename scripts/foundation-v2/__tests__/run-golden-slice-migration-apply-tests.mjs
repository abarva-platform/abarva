#!/usr/bin/env node
import { execFileSync, spawn } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const testPath = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(testPath), "../../..");
const args = parseArgs(process.argv.slice(2));
const migrationPath = path.join(repoRoot, "supabase/migrations/20260730120000_foundation_v2_golden_slice_core.sql");
const proofOutput = args["proof-output"] ? path.resolve(process.cwd(), args["proof-output"]) : null;
const workDir = mkdtempSync(path.join(tmpdir(), "foundation-v2-pg-"));
const dataDir = path.join(workDir, "data");
const socketDir = path.join(workDir, "socket");
const port = String(15432 + Math.floor(Math.random() * 1000));
let postgresProcess;

try {
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

  if (failures.length > 0) {
    console.error(JSON.stringify({ status: "FAIL", failures, inspection }, null, 2));
    process.exit(1);
  }

  const proof = {
    status: "PASS",
    generated_at: new Date().toISOString(),
    migrationPath,
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
  SELECT c.oid, c.relname, c.relrowsecurity
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
  SELECT p.polname, pg_get_expr(p.polqual, p.polrelid) AS qual
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
  'composite_fk_count', (SELECT count(*) FROM composite_fks),
  'required_nonempty_constraint_count', (SELECT count(*) FROM nonempty_constraints),
  'policy_with_admin_bypass_count', (SELECT count(*) FROM policies WHERE qual LIKE '%internal-admin%'),
  'product_pass_guard_count', (SELECT count(*) FROM product_pass_guard)
)::text;
`;
}
