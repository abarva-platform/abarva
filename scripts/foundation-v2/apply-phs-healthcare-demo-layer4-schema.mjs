#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

import {
  databaseUrl,
  emitProofBundle,
  postgresClientOptions,
  proofRef,
  sha256,
  writeJson,
} from "./golden-slice-support.mjs";

const MIGRATION_NAME = "20260806132000_foundation_v2_phs_demo_layer4_projections.sql";
const DATABASE_SCHEMA = "foundation_v2_phs_demo";
const TENANT_KEY = "phs_health_demo_global";
const TEST_NAMESPACE = "phs-healthcare-demo-source-volume-v1";
const SOURCE_RELEASE_ID = "phs-health-source-v1-202608:source-volume-v1:447910ac3c16";
const LAYER4_TABLES = ["event_context_snapshots", "projection_authority", "projection_rows", "projection_field_lineage"];
const args = parseArgs(process.argv.slice(2));

await main().catch((error) => {
  console.error(JSON.stringify({ status: "PHS_HEALTHCARE_DEMO_LAYER4_SCHEMA_FAILED", error: error.message }, null, 2));
  process.exit(1);
});

async function main() {
  const migrationPath = path.resolve("supabase/migrations", MIGRATION_NAME);
  const sql = fs.readFileSync(migrationPath, "utf8");
  const migrationSha256 = sha256(sql);
  const url = databaseUrl();
  if (!url) throw new Error("ABARVA_AZURE_DATABASE_URL, AZURE_DATABASE_URL or DATABASE_URL is required");
  const { Client } = await import("pg");
  const client = new Client(postgresClientOptions(url, "phs-healthcare-demo-layer4-schema"));
  await client.connect();
  try {
    await ensureMigrationLedger(client);
    const before = await migrationLedgerReadback(client, migrationSha256);
    const applied = [];
    if (args.mode === "apply" && !before.present) {
      await client.query(sql);
      await client.query(
        `INSERT INTO schema_migrations(name, sha256, applied_at)
         VALUES ($1, $2, now())
         ON CONFLICT (name) DO UPDATE SET sha256 = EXCLUDED.sha256, applied_at = EXCLUDED.applied_at`,
        [MIGRATION_NAME, migrationSha256],
      );
      applied.push(MIGRATION_NAME);
    }
    const after = await migrationLedgerReadback(client, migrationSha256);
    const readback = await schemaReadback(client);
    const defects = schemaDefects(after, readback);
    const proof = {
      status:
        defects.length > 0
          ? "PHS_HEALTHCARE_DEMO_LAYER4_SCHEMA_FAILED"
          : args.mode === "dry"
            ? "PHS_HEALTHCARE_DEMO_LAYER4_SCHEMA_DRY_RUN_PASSED"
            : "PHS_HEALTHCARE_DEMO_LAYER4_SCHEMA_APPLIED",
      generated_at: new Date().toISOString(),
      mode: args.mode,
      mutation_executed: args.mode === "apply" && applied.length > 0,
      migration_name: MIGRATION_NAME,
      migration_sha256: migrationSha256,
      pending_before: before.present ? [] : [MIGRATION_NAME],
      applied,
      pending_after: after.present ? [] : [MIGRATION_NAME],
      contract: {
        database_schema: DATABASE_SCHEMA,
        tenant_key: TENANT_KEY,
        test_namespace: TEST_NAMESPACE,
        source_release_id: SOURCE_RELEASE_ID,
        tables: LAYER4_TABLES,
      },
      migration_ledger: after,
      readback,
      defects,
      product_activation_executed: false,
      cube_refresh_executed: false,
    };
    writeJson(proofRef(args.outDir, "PHS_LAYER4_SCHEMA_PROOF.json"), proof);
    console.log(JSON.stringify(proof, null, 2));
    if (args.emitProofBundle) emitProofBundle(args.outDir);
    if (proof.status === "PHS_HEALTHCARE_DEMO_LAYER4_SCHEMA_FAILED") process.exitCode = 1;
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

async function migrationLedgerReadback(client, expectedSha256) {
  const result = await client.query("SELECT name, sha256, applied_at FROM schema_migrations WHERE name = $1", [MIGRATION_NAME]);
  const row = result.rows[0];
  return {
    name: MIGRATION_NAME,
    present: Boolean(row),
    sha256: row?.sha256 || null,
    expected_sha256: expectedSha256,
    applied_at: row?.applied_at || null,
  };
}

async function schemaReadback(client) {
  const tables = await client.query(
    `SELECT table_name
       FROM information_schema.tables
      WHERE table_schema=$1 AND table_name=ANY($2::text[])
      ORDER BY table_name`,
    [DATABASE_SCHEMA, LAYER4_TABLES],
  );
  const rls = await client.query(
    `SELECT c.relname AS table_name, c.relrowsecurity, c.relforcerowsecurity
       FROM pg_class c
       JOIN pg_namespace n ON n.oid=c.relnamespace
      WHERE n.nspname=$1 AND c.relname=ANY($2::text[])
      ORDER BY c.relname`,
    [DATABASE_SCHEMA, LAYER4_TABLES],
  );
  const policies = await client.query(
    `SELECT tablename, policyname, cmd
       FROM pg_policies
      WHERE schemaname=$1 AND tablename=ANY($2::text[])
      ORDER BY tablename, policyname`,
    [DATABASE_SCHEMA, LAYER4_TABLES],
  );
  const roles = await client.query(
    `SELECT rolname, rolcanlogin, rolsuper, rolbypassrls, rolinherit
       FROM pg_roles
      WHERE rolname=ANY($1::text[])
      ORDER BY rolname`,
    [["foundation_v2_phs_demo_writer", "foundation_v2_phs_demo_reader"]],
  );
  return {
    tables: tables.rows.map((row) => row.table_name),
    rls: rls.rows,
    policies: policies.rows,
    roles: roles.rows,
  };
}

function schemaDefects(migrationLedger, readback) {
  const defects = [];
  if (!migrationLedger.present) defects.push("migration_not_applied");
  if (migrationLedger.present && migrationLedger.sha256 !== migrationLedger.expected_sha256) defects.push("migration_sha_mismatch");
  for (const table of LAYER4_TABLES) {
    if (!readback.tables.includes(table)) defects.push(`table_missing:${table}`);
    const rls = readback.rls.find((row) => row.table_name === table);
    if (!rls?.relrowsecurity) defects.push(`rls_not_enabled:${table}`);
    if (!rls?.relforcerowsecurity) defects.push(`rls_not_forced:${table}`);
    const tablePolicies = readback.policies.filter((row) => row.tablename === table);
    for (const cmd of ["SELECT", "INSERT", "DELETE"]) {
      if (!tablePolicies.some((row) => row.cmd === cmd)) defects.push(`policy_missing:${table}:${cmd}`);
    }
  }
  const roleNames = new Set(readback.roles.map((row) => row.rolname));
  for (const role of ["foundation_v2_phs_demo_writer", "foundation_v2_phs_demo_reader"]) {
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
    mode: process.env.PHS_LAYER4_SCHEMA_MODE || "dry",
    outDir:
      process.env.PHS_LAYER4_SCHEMA_OUT_DIR ||
      path.join("/tmp", `phs-healthcare-demo-layer4-schema-${new Date().toISOString().replace(/[:.]/g, "-")}`),
    emitProofBundle:
      process.env.EMIT_ACA_PROOF_BUNDLE === "true" ||
      process.env.PHS_LAYER4_SCHEMA_EMIT_PROOF_BUNDLE === "true",
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
