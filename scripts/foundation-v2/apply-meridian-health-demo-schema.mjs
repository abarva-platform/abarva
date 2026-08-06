#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

import {
  databaseUrl,
  emitProofBundle,
  postgresClientOptions,
  sha256,
  writeJson,
  writeMarkdown,
} from "./golden-slice-support.mjs";

const MIGRATION_NAME = "20260805230000_foundation_v2_meridian_health_demo_source_volume.sql";
const EXPECTED_MIGRATION_SHA256 = "fafd2cb062985b8dea12728621f4aa37c7879aafe360cb3234eb6b4c9a98eb6b";
const DATABASE_SCHEMA = "foundation_v2_meridian_health_demo";
const TENANT_KEY = "meridian_health_global";
const TEST_NAMESPACE = "meridian-health-source-volume-v1";
const SOURCE_RELEASE_ID = "meridian-health-source-v1-202608:source-volume-v1:05889e763f88";
const TABLES = [
  "source_releases",
  "source_files",
  "source_file_context",
  "source_records",
  "source_field_values",
  "parser_executions",
  "gate_results",
];

const args = parseArgs(process.argv.slice(2));

await main().catch((error) => {
  console.error(JSON.stringify({ status: "MERIDIAN_HEALTH_DEMO_SCHEMA_FAILED", error: error.message }, null, 2));
  process.exit(1);
});

async function main() {
  const migrationPath = path.resolve("supabase/migrations", MIGRATION_NAME);
  const sql = fs.readFileSync(migrationPath, "utf8");
  const fileSha256 = sha256(sql);
  if (fileSha256 !== EXPECTED_MIGRATION_SHA256) {
    throw new Error(`Meridian Health schema migration SHA mismatch: expected ${EXPECTED_MIGRATION_SHA256}, got ${fileSha256}`);
  }

  const url = databaseUrl();
  if (!url) throw new Error("ABARVA_AZURE_DATABASE_URL, AZURE_DATABASE_URL or DATABASE_URL is required");
  const { Client } = await import("pg");
  const client = new Client(postgresClientOptions(url, "meridian-health-demo-schema"));
  await client.connect();
  try {
    await ensureMigrationLedger(client);
    const before = await migrationLedgerReadback(client);
    const applied = [];
    const forceReapply =
      process.env.MERIDIAN_HEALTH_DEMO_SCHEMA_FORCE_REAPPLY === "true" ||
      process.env.MERIDIAN_HEALTH_LAYER1_SCHEMA_FORCE_REAPPLY === "true";
    if (args.mode === "apply" && (!before.present || (forceReapply && before.sha256 !== EXPECTED_MIGRATION_SHA256))) {
      await client.query(sql);
      await client.query(
        `INSERT INTO schema_migrations(name, sha256, applied_at)
         VALUES ($1, $2, now())
         ON CONFLICT (name) DO UPDATE SET sha256 = EXCLUDED.sha256, applied_at = EXCLUDED.applied_at`,
        [MIGRATION_NAME, fileSha256],
      );
      applied.push(MIGRATION_NAME);
    }
    const after = await migrationLedgerReadback(client);
    const readback = await schemaReadback(client);
    const defects = schemaDefects(after, readback);
    const proof = {
      status:
        defects.length > 0
          ? "MERIDIAN_HEALTH_DEMO_SCHEMA_FAILED"
          : args.mode === "dry"
            ? "MERIDIAN_HEALTH_DEMO_SCHEMA_DRY_RUN_PASSED"
            : "MERIDIAN_HEALTH_DEMO_SCHEMA_APPLIED",
      generated_at: new Date().toISOString(),
      mode: args.mode,
      mutation_executed: args.mode === "apply" && applied.length > 0,
      force_reapply_requested: forceReapply,
      migration_name: MIGRATION_NAME,
      migration_sha256: fileSha256,
      pending_before: before.present ? [] : [MIGRATION_NAME],
      applied,
      pending_after: after.present ? [] : [MIGRATION_NAME],
      contract: {
        database_schema: DATABASE_SCHEMA,
        tenant_key: TENANT_KEY,
        test_namespace: TEST_NAMESPACE,
        source_release_id: SOURCE_RELEASE_ID,
        tables: TABLES,
      },
      database_target: sanitizedDatabaseTarget(url),
      migration_ledger: after,
      readback,
      defects,
      no_source_volume_rows_loaded: readback.row_counts.every((row) => Number(row.row_count) === 0),
    };
    writeJson(path.join(args.outDir, "MERIDIAN_HEALTH_DEMO_SCHEMA_PROOF.json"), proof);
    writeMarkdown(path.join(args.outDir, "MERIDIAN_HEALTH_DEMO_SCHEMA_PROOF.md"), schemaMarkdown(proof));
    console.log(JSON.stringify(proof, null, 2));
    if (args.emitProofBundle) emitProofBundle(args.outDir);
    if (proof.status === "MERIDIAN_HEALTH_DEMO_SCHEMA_FAILED") process.exitCode = 1;
  } finally {
    await client.end();
  }
}

async function ensureMigrationLedger(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now(),
      sha256 text
    )
  `);
}

async function migrationLedgerReadback(client) {
  const result = await client.query("SELECT name, sha256, applied_at FROM schema_migrations WHERE name = $1", [MIGRATION_NAME]);
  const row = result.rows[0];
  return {
    name: MIGRATION_NAME,
    present: Boolean(row),
    sha256: row?.sha256 || null,
    expected_sha256: EXPECTED_MIGRATION_SHA256,
    applied_at: row?.applied_at || null,
  };
}

async function schemaReadback(client) {
  const schema = await client.query("SELECT schema_name FROM information_schema.schemata WHERE schema_name = $1", [DATABASE_SCHEMA]);
  const tables = await client.query(
    `SELECT table_name
       FROM information_schema.tables
      WHERE table_schema = $1
        AND table_name = ANY($2::text[])
      ORDER BY table_name`,
    [DATABASE_SCHEMA, TABLES],
  );
  const rls = await client.query(
    `SELECT c.relname AS table_name, c.relrowsecurity, c.relforcerowsecurity
       FROM pg_class c
       JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = $1
        AND c.relname = ANY($2::text[])
      ORDER BY c.relname`,
    [DATABASE_SCHEMA, TABLES],
  );
  const policies = await client.query(
    `SELECT schemaname, tablename, policyname, roles, cmd
       FROM pg_policies
      WHERE schemaname = $1
      ORDER BY tablename, policyname`,
    [DATABASE_SCHEMA],
  );
  const roles = await client.query(
    `SELECT rolname, rolcanlogin, rolsuper, rolcreatedb, rolcreaterole, rolreplication, rolbypassrls, rolinherit
       FROM pg_roles
      WHERE rolname = ANY($1::text[])
      ORDER BY rolname`,
    [["foundation_v2_meridian_health_demo_writer", "foundation_v2_meridian_health_demo_reader"]],
  );
  const rowCounts = [];
  for (const table of TABLES) {
    const count = await client.query(`SELECT count(*)::int AS row_count FROM ${quoteIdent(DATABASE_SCHEMA)}.${quoteIdent(table)}`);
    rowCounts.push({ table_name: table, row_count: Number(count.rows[0].row_count) });
  }
  const skyharborRows = [];
  for (const table of TABLES) {
    const count = await client.query(
      `SELECT count(*)::int AS row_count FROM ${quoteIdent(DATABASE_SCHEMA)}.${quoteIdent(table)} WHERE tenant_key LIKE 'skyharbor%'`,
    );
    skyharborRows.push({ table_name: table, row_count: Number(count.rows[0].row_count) });
  }
  return {
    schema_present: schema.rows.length === 1,
    tables: tables.rows.map((row) => row.table_name),
    rls: rls.rows,
    policies: policies.rows,
    roles: roles.rows,
    row_counts: rowCounts,
    skyharbor_row_counts: skyharborRows,
  };
}

function schemaDefects(migrationLedger, readback) {
  const defects = [];
  if (!migrationLedger.present) defects.push("migration_not_applied");
  if (migrationLedger.present && migrationLedger.sha256 !== EXPECTED_MIGRATION_SHA256) defects.push("migration_sha_mismatch");
  if (!readback.schema_present) defects.push("schema_missing");
  for (const table of TABLES) {
    if (!readback.tables.includes(table)) defects.push(`table_missing:${table}`);
    const rls = readback.rls.find((row) => row.table_name === table);
    if (!rls?.relrowsecurity) defects.push(`rls_not_enabled:${table}`);
    if (!rls?.relforcerowsecurity) defects.push(`rls_not_forced:${table}`);
    if (Number(readback.skyharbor_row_counts.find((row) => row.table_name === table)?.row_count || 0) !== 0) {
      defects.push(`skyharbor_rows_present:${table}`);
    }
  }
  const roleNames = new Set(readback.roles.map((row) => row.rolname));
  for (const role of ["foundation_v2_meridian_health_demo_writer", "foundation_v2_meridian_health_demo_reader"]) {
    if (!roleNames.has(role)) defects.push(`role_missing:${role}`);
  }
  for (const role of readback.roles) {
    if (role.rolcanlogin) defects.push(`role_can_login:${role.rolname}`);
    if (role.rolsuper) defects.push(`role_superuser:${role.rolname}`);
    if (role.rolbypassrls) defects.push(`role_bypassrls:${role.rolname}`);
    if (role.rolinherit) defects.push(`role_inherit:${role.rolname}`);
  }
  return defects;
}

function parseArgs(argv) {
  const parsed = {
    mode: process.env.MERIDIAN_HEALTH_DEMO_SCHEMA_MODE || "dry",
    outDir:
      process.env.MERIDIAN_HEALTH_DEMO_SCHEMA_OUT_DIR ||
      `/tmp/meridian-health-demo-schema-${new Date().toISOString().replace(/[:.]/g, "-")}`,
    emitProofBundle:
      process.env.EMIT_ACA_PROOF_BUNDLE === "true" ||
      process.env.MERIDIAN_HEALTH_DEMO_SCHEMA_EMIT_PROOF_BUNDLE === "true",
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
  if (!["dry", "apply"].includes(parsed.mode)) throw new Error("--mode must be dry or apply");
  fs.mkdirSync(parsed.outDir, { recursive: true });
  return parsed;
}

function sanitizedDatabaseTarget(url) {
  const parsed = new URL(url);
  return {
    host: parsed.hostname,
    port: parsed.port || "5432",
    database: parsed.pathname.replace(/^\//, ""),
    sslmode: parsed.searchParams.get("sslmode") || "",
  };
}

function schemaMarkdown(proof) {
  return `# Meridian Health Schema Proof

Status: ${proof.status}

- Mode: \`${proof.mode}\`
- Migration: \`${proof.migration_name}\`
- SHA-256: \`${proof.migration_sha256}\`
- Applied this run: ${proof.applied.length}
- Tables: ${proof.readback.tables.length}
- Policies: ${proof.readback.policies.length}
- Defects: ${proof.defects.length}
- Source-volume rows loaded by this step: ${proof.no_source_volume_rows_loaded ? "no" : "yes"}

This proof is limited to the isolated Meridian Health Layer 1 schema/RLS substrate. It does not load source data, create canonical objects, publish projections, refresh Cube, activate a tenant, or update product runtime.
`;
}

function quoteIdent(value) {
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(value)) throw new Error(`Invalid SQL identifier: ${value}`);
  return `"${value.replace(/"/g, '""')}"`;
}
