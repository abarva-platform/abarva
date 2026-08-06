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

const MIGRATION_NAME = "20260806041000_foundation_v2_phs_demo_canonical_promotion.sql";
const EXPECTED_MIGRATION_SHA256 = "b3d0fb1548df1ee8f98113b692af8290063f8a133a39ed6f7e2d95e627d753f9";
const DATABASE_SCHEMA = "foundation_v2_phs_demo";
const TENANT_KEY = "phs_health_demo_global";
const TEST_NAMESPACE = "phs-healthcare-demo-source-volume-v1";
const SOURCE_RELEASE_ID = "phs-health-source-v1-202608:source-volume-v1:447910ac3c16";
const LAYER3_TABLES = [
  "canonical_entities",
  "canonical_observations",
  "canonical_relationships",
  "canonical_evidence_records",
  "event_native_records",
  "canonical_promotion_decisions",
];
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

const args = parseArgs(process.argv.slice(2));

await main().catch((error) => {
  console.error(JSON.stringify({ status: "PHS_HEALTHCARE_DEMO_LAYER3_SCHEMA_FAILED", error: error.message }, null, 2));
  process.exit(1);
});

async function main() {
  const migrationPath = path.resolve("supabase/migrations", MIGRATION_NAME);
  const sql = fs.readFileSync(migrationPath, "utf8");
  const fileSha256 = sha256(sql);
  if (fileSha256 !== EXPECTED_MIGRATION_SHA256) {
    throw new Error(`PHS Layer 3 schema migration SHA mismatch: expected ${EXPECTED_MIGRATION_SHA256}, got ${fileSha256}`);
  }

  const url = databaseUrl();
  if (!url) throw new Error("ABARVA_AZURE_DATABASE_URL, AZURE_DATABASE_URL or DATABASE_URL is required");
  const { Client } = await import("pg");
  const client = new Client(postgresClientOptions(url, "phs-healthcare-demo-layer3-schema"));
  await client.connect();
  try {
    await ensureMigrationLedger(client);
    const before = await migrationLedgerReadback(client);
    const applied = [];
    if (args.mode === "apply" && !before.present) {
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
    const layer3Total = readback.layer3_row_counts.reduce((sum, row) => sum + Number(row.row_count || 0), 0);
    const proof = {
      status:
        defects.length > 0
          ? "PHS_HEALTHCARE_DEMO_LAYER3_SCHEMA_FAILED"
          : args.mode === "dry"
            ? "PHS_HEALTHCARE_DEMO_LAYER3_SCHEMA_DRY_RUN_PASSED"
            : "PHS_HEALTHCARE_DEMO_LAYER3_SCHEMA_APPLIED",
      generated_at: new Date().toISOString(),
      mode: args.mode,
      mutation_executed: args.mode === "apply" && applied.length > 0,
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
        tables: LAYER3_TABLES,
      },
      database_target: sanitizedDatabaseTarget(url),
      migration_ledger: after,
      readback,
      defects,
      canonical_promotion_executed: layer3Total > 0,
      canonical_promotion_current_rows: layer3Total,
      product_activation_executed: false,
      cube_refresh_executed: false,
    };
    writeJson(path.join(args.outDir, "PHS_HEALTHCARE_DEMO_LAYER3_SCHEMA_PROOF.json"), proof);
    writeMarkdown(path.join(args.outDir, "PHS_HEALTHCARE_DEMO_LAYER3_SCHEMA_PROOF.md"), schemaMarkdown(proof));
    console.log(JSON.stringify(proof, null, 2));
    if (args.emitProofBundle) emitProofBundle(args.outDir);
    if (proof.status === "PHS_HEALTHCARE_DEMO_LAYER3_SCHEMA_FAILED") process.exitCode = 1;
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
    [DATABASE_SCHEMA, LAYER3_TABLES],
  );
  const rls = await client.query(
    `SELECT c.relname AS table_name, c.relrowsecurity, c.relforcerowsecurity
       FROM pg_class c
       JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = $1
        AND c.relname = ANY($2::text[])
      ORDER BY c.relname`,
    [DATABASE_SCHEMA, LAYER3_TABLES],
  );
  const policies = await client.query(
    `SELECT schemaname, tablename, policyname, roles, cmd
       FROM pg_policies
      WHERE schemaname = $1
        AND tablename = ANY($2::text[])
      ORDER BY tablename, policyname`,
    [DATABASE_SCHEMA, LAYER3_TABLES],
  );
  const roles = await client.query(
    `SELECT rolname, rolcanlogin, rolsuper, rolcreatedb, rolcreaterole, rolreplication, rolbypassrls, rolinherit
       FROM pg_roles
      WHERE rolname = ANY($1::text[])
      ORDER BY rolname`,
    [["foundation_v2_phs_demo_writer", "foundation_v2_phs_demo_reader"]],
  );
  const sourceCounts = await client.query(
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
  const layer2Counts = await client.query(
    `
    SELECT
      (SELECT count(*)::int FROM ${tableRef("normalized_objects")} WHERE tenant_key=$1 AND test_namespace=$2 AND source_release_id=$3) AS normalized_objects,
      (SELECT count(*)::int FROM ${tableRef("knowledge_candidates")} WHERE tenant_key=$1 AND test_namespace=$2 AND source_release_id=$3) AS knowledge_candidates
    `,
    [TENANT_KEY, TEST_NAMESPACE, SOURCE_RELEASE_ID],
  );
  const layer3RowCounts = [];
  const skyharborRows = [];
  for (const table of LAYER3_TABLES) {
    const count = await client.query(
      `SELECT count(*)::int AS row_count FROM ${tableRef(table)} WHERE tenant_key=$1 AND test_namespace=$2 AND source_release_id=$3`,
      [TENANT_KEY, TEST_NAMESPACE, SOURCE_RELEASE_ID],
    );
    layer3RowCounts.push({ table_name: table, row_count: Number(count.rows[0].row_count) });
    const skyharbor = await client.query(`SELECT count(*)::int AS row_count FROM ${tableRef(table)} WHERE tenant_key LIKE 'skyharbor%'`);
    skyharborRows.push({ table_name: table, row_count: Number(skyharbor.rows[0].row_count) });
  }
  return {
    schema_present: schema.rows.length === 1,
    tables: tables.rows.map((row) => row.table_name),
    rls: rls.rows,
    policies: policies.rows,
    roles: roles.rows,
    source_counts: numericObject(sourceCounts.rows[0]),
    layer2_counts: numericObject(layer2Counts.rows[0]),
    layer3_row_counts: layer3RowCounts,
    skyharbor_row_counts: skyharborRows,
  };
}

function schemaDefects(migrationLedger, readback) {
  const defects = [];
  if (!migrationLedger.present) defects.push("migration_not_applied");
  if (migrationLedger.present && migrationLedger.sha256 !== EXPECTED_MIGRATION_SHA256) defects.push("migration_sha_mismatch");
  if (!readback.schema_present) defects.push("schema_missing");
  for (const table of LAYER3_TABLES) {
    if (!readback.tables.includes(table)) defects.push(`table_missing:${table}`);
    const rls = readback.rls.find((row) => row.table_name === table);
    if (!rls?.relrowsecurity) defects.push(`rls_not_enabled:${table}`);
    if (!rls?.relforcerowsecurity) defects.push(`rls_not_forced:${table}`);
    const tablePolicies = readback.policies.filter((row) => row.tablename === table);
    if (!tablePolicies.some((row) => row.cmd === "SELECT")) defects.push(`select_policy_missing:${table}`);
    if (!tablePolicies.some((row) => row.cmd === "INSERT")) defects.push(`insert_policy_missing:${table}`);
    if (Number(readback.skyharbor_row_counts.find((row) => row.table_name === table)?.row_count || 0) !== 0) {
      defects.push(`skyharbor_rows_present:${table}`);
    }
  }
  for (const [key, expected] of Object.entries(SOURCE_VOLUME_COUNTS)) {
    if (Number(readback.source_counts[key] || 0) !== expected) defects.push(`source_count_mismatch:${key}:${readback.source_counts[key]}:expected:${expected}`);
  }
  for (const [key, expected] of Object.entries(LAYER2_COUNTS)) {
    if (Number(readback.layer2_counts[key] || 0) !== expected) defects.push(`layer2_count_mismatch:${key}:${readback.layer2_counts[key]}:expected:${expected}`);
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
    mode: process.env.PHS_HEALTHCARE_DEMO_LAYER3_SCHEMA_MODE || "dry",
    outDir:
      process.env.PHS_HEALTHCARE_DEMO_LAYER3_SCHEMA_OUT_DIR ||
      `/tmp/phs-healthcare-demo-layer3-schema-${new Date().toISOString().replace(/[:.]/g, "-")}`,
    emitProofBundle:
      process.env.EMIT_ACA_PROOF_BUNDLE === "true" ||
      process.env.PHS_HEALTHCARE_DEMO_LAYER3_SCHEMA_EMIT_PROOF_BUNDLE === "true",
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
  return `# PHS Healthcare Demo Layer 3 Schema Proof

Status: ${proof.status}

- Mode: \`${proof.mode}\`
- Migration: \`${proof.migration_name}\`
- SHA-256: \`${proof.migration_sha256}\`
- Applied this run: ${proof.applied.length}
- Layer 3 tables: ${proof.readback.tables.length}
- Policies: ${proof.readback.policies.length}
- Current Layer 3 rows: ${proof.canonical_promotion_current_rows}
- Defects: ${proof.defects.length}

This proof is limited to the isolated Layer 3 canonical promotion substrate. It does not bulk-copy candidates into shared canonical tables, activate product projections, refresh Cube, bind runtime surfaces, or promote PHS data beyond the PHS demo schema.
`;
}

function tableRef(tableName) {
  return `${quoteIdent(DATABASE_SCHEMA)}.${quoteIdent(tableName)}`;
}

function quoteIdent(value) {
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(value)) throw new Error(`Invalid SQL identifier: ${value}`);
  return `"${value.replace(/"/g, '""')}"`;
}

function numericObject(row) {
  return Object.fromEntries(Object.entries(row || {}).map(([key, value]) => [key, Number(value || 0)]));
}
