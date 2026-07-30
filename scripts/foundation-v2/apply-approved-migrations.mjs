#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { Client } from "pg";
import {
  EXPECTED_IDENTITY_CONTROL_MIGRATION_SHA256,
  EXPECTED_MIGRATION_SHA256,
  EXPECTED_WRITE_POLICY_MIGRATION_SHA256,
  IDENTITY_CONTROL_MIGRATION_NAME,
  MIGRATION_NAME,
  REPO_ROOT,
  WRITE_POLICY_MIGRATION_NAME,
  databaseUrl,
  emitProofBundle,
  postgresClientOptions,
  sha256,
  writeJson,
  writeMarkdown,
} from "./golden-slice-support.mjs";

const APPROVED_MIGRATIONS = [
  [MIGRATION_NAME, EXPECTED_MIGRATION_SHA256],
  [WRITE_POLICY_MIGRATION_NAME, EXPECTED_WRITE_POLICY_MIGRATION_SHA256],
  [IDENTITY_CONTROL_MIGRATION_NAME, EXPECTED_IDENTITY_CONTROL_MIGRATION_SHA256],
];

const args = parseArgs(process.argv.slice(2));

await main(args).catch((error) => {
  console.error(JSON.stringify({ status: "FOUNDATION_V2_APPROVED_MIGRATIONS_FAILED", error: error.message }, null, 2));
  process.exit(1);
});

async function main(options) {
  const url = databaseUrl();
  if (!url) throw new Error("ABARVA_AZURE_DATABASE_URL, AZURE_DATABASE_URL or DATABASE_URL is required");
  const client = new Client(postgresClientOptions(url, "foundation-v2-approved-migrations"));
  await client.connect();
  try {
    await ensureMigrationLedger(client);
    const migrations = readApprovedMigrations();
    const before = await migrationReadback(client, migrations);
    const defects = migrationDefects(migrations, before);
    const applied = [];
    if (defects.length === 0 && options.mode === "apply") {
      for (const migration of migrations) {
        const readback = before.find((row) => row.name === migration.name);
        if (readback?.present) continue;
        await client.query(migration.sql);
        await client.query(
          `INSERT INTO schema_migrations(name, sha256, applied_at)
           VALUES ($1, $2, now())
           ON CONFLICT (name) DO UPDATE SET sha256 = EXCLUDED.sha256`,
          [migration.name, migration.sha256],
        );
        applied.push(migration.name);
      }
    }
    const after = await migrationReadback(client, migrations);
    const pendingAfter = after.filter((row) => !row.present).map((row) => row.name);
    const finalDefects = [...defects];
    if (options.mode === "apply" && pendingAfter.length > 0) {
      finalDefects.push(`approved migrations still pending after apply: ${pendingAfter.join(", ")}`);
    }
    const proof = {
      status:
        finalDefects.length > 0
          ? "FOUNDATION_V2_APPROVED_MIGRATIONS_FAILED"
          : options.mode === "dry"
            ? "FOUNDATION_V2_APPROVED_MIGRATIONS_DRY_RUN_PASSED"
            : "FOUNDATION_V2_APPROVED_MIGRATIONS_APPLIED",
      generated_at: new Date().toISOString(),
      mode: options.mode,
      database_target: sanitizedDatabaseTarget(url),
      approved_migration_count: migrations.length,
      pending_before: before.filter((row) => !row.present).map((row) => row.name),
      applied,
      pending_after: pendingAfter,
      defects: finalDefects,
      migrations: after,
      full_repo_migration_runner_used: false,
      offline_augmentation_approved: false,
      full_reload_approved: false,
      baseline_activation_approved: false,
      provider_cutover_approved: false,
    };
    writeJson(path.join(options.outDir, "FOUNDATION_V2_APPROVED_MIGRATIONS_PROOF.json"), proof);
    writeMarkdown(path.join(options.outDir, "FOUNDATION_V2_APPROVED_MIGRATIONS_PROOF.md"), migrationMarkdown(proof));
    console.log(JSON.stringify(proof, null, 2));
    if (options.emitProofBundle) emitProofBundle(options.outDir);
    if (proof.status === "FOUNDATION_V2_APPROVED_MIGRATIONS_FAILED") process.exitCode = 1;
  } finally {
    await client.end();
  }
}

function readApprovedMigrations() {
  return APPROVED_MIGRATIONS.map(([name, expectedSha256]) => {
    const migrationPath = path.join(REPO_ROOT, "supabase/migrations", name);
    const sql = fs.readFileSync(migrationPath, "utf8");
    const actualSha256 = sha256(sql);
    return {
      name,
      path: path.relative(REPO_ROOT, migrationPath),
      expected_sha256: expectedSha256,
      sha256: actualSha256,
      sql,
    };
  });
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

async function migrationReadback(client, migrations) {
  const names = migrations.map((migration) => migration.name);
  const result = await client.query("SELECT name, sha256, applied_at FROM schema_migrations WHERE name = ANY($1)", [names]);
  return migrations.map((migration) => {
    const row = result.rows.find((candidate) => candidate.name === migration.name);
    return {
      name: migration.name,
      path: migration.path,
      present: Boolean(row),
      sha256: row?.sha256 || null,
      expected_sha256: migration.expected_sha256,
      file_sha256: migration.sha256,
      applied_at: row?.applied_at || null,
    };
  });
}

function migrationDefects(migrations, readback) {
  const defects = [];
  for (const migration of migrations) {
    if (migration.sha256 !== migration.expected_sha256) {
      defects.push(`approved migration file hash mismatch: ${migration.name}`);
    }
    const row = readback.find((candidate) => candidate.name === migration.name);
    if (row?.present && row.sha256 !== migration.expected_sha256) {
      defects.push(`applied migration ledger hash mismatch: ${migration.name}`);
    }
  }
  return defects;
}

function parseArgs(argv) {
  const parsed = {
    mode: process.env.FOUNDATION_V2_MIGRATION_MODE || "dry",
    outDir:
      process.env.FOUNDATION_V2_MIGRATION_OUT_DIR ||
      `/tmp/foundation-v2-approved-migrations-${new Date().toISOString().replace(/[:.]/g, "-")}`,
    emitProofBundle:
      process.env.EMIT_ACA_PROOF_BUNDLE === "true" || process.env.FOUNDATION_V2_EMIT_PROOF_BUNDLE === "true",
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = () => {
      index += 1;
      if (index >= argv.length) throw new Error(`${arg} requires a value`);
      return argv[index];
    };
    if (arg === "--mode") parsed.mode = next();
    else if (arg === "--out-dir") parsed.outDir = path.resolve(process.cwd(), next());
    else if (arg === "--emit-proof-bundle") parsed.emitProofBundle = true;
    else throw new Error(`Unknown argument ${arg}`);
  }
  if (!["dry", "apply"].includes(parsed.mode)) throw new Error("--mode must be dry or apply");
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

function migrationMarkdown(proof) {
  return `# Foundation V2 Approved Migration Proof

Status: ${proof.status}

- Mode: \`${proof.mode}\`
- Approved migration count: ${proof.approved_migration_count}
- Pending before: ${proof.pending_before.length}
- Applied: ${proof.applied.length}
- Pending after: ${proof.pending_after.length}
- Defects: ${proof.defects.length}

This proof is limited to the approved Foundation V2 golden-slice schema migrations. It does not approve full reload, offline augmentation, publication, baseline activation, provider cutover, product UI cutover, or production aVa activation.
`;
}
