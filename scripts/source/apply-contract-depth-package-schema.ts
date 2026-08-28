import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";

import { config as loadEnv } from "dotenv";
import { Client } from "pg";

import {
  computeFileSha256,
  scanForDestructivePatterns,
} from "../../src/scripts/run-migrations";
import { postgresClientOptions } from "../../src/scripts/postgres-client-options";

loadEnv({ path: path.resolve(process.cwd(), ".env.local") });
loadEnv();

const SOURCE_SCHEMA_MIGRATIONS = Object.freeze([
  "20260828184000_source_contract_depth_package_layer2.sql",
]);

const REQUIRED_TABLES = Object.freeze([
  "contract_depth_package_load_run",
  "contract_depth_adapter_row",
]);

interface Args {
  readonly apply: boolean;
}

interface MigrationBody {
  readonly filename: string;
  readonly filepath: string;
  readonly sql: string;
  readonly sha256: string;
}

function parseArgs(): Args {
  const argv = process.argv.slice(2);
  return {
    apply:
      argv.includes("--apply") ||
      process.env.SOURCE_CONTRACT_DEPTH_PACKAGE_SCHEMA_APPLY === "true",
  };
}

function databaseUrl(): string {
  const url =
    process.env.SOURCE_CONTEXT_DATABASE_URL ||
    process.env.AZURE_LAB_DATABASE_URL ||
    process.env.LAB_DATABASE_URL ||
    process.env.ABARVA_AZURE_DATABASE_URL ||
    process.env.AZURE_DATABASE_URL ||
    process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "Missing SOURCE_CONTEXT_DATABASE_URL, AZURE_LAB_DATABASE_URL, LAB_DATABASE_URL, ABARVA_AZURE_DATABASE_URL, AZURE_DATABASE_URL, or DATABASE_URL.",
    );
  }
  return url;
}

function readMigrationBodies(): MigrationBody[] {
  const migrationsDir = path.resolve(process.cwd(), "supabase/migrations");
  return SOURCE_SCHEMA_MIGRATIONS.map((filename) => {
    const filepath = path.join(migrationsDir, filename);
    const sql = readFileSync(filepath, "utf8");
    const destructiveFindings = scanForDestructivePatterns(filename, sql);
    if (destructiveFindings.length > 0) {
      throw new Error(
        `Refusing Source contract-depth schema apply because ${filename} contains destructive SQL: ${destructiveFindings
          .map((finding) => `${finding.pattern} line ${finding.line}`)
          .join(", ")}`,
      );
    }
    return {
      filename,
      filepath,
      sql,
      sha256: computeFileSha256(sql),
    };
  });
}

function combinedHash(migrations: readonly MigrationBody[]): string {
  return createHash("sha256")
    .update(
      migrations
        .map((migration) => `${migration.filename}:${migration.sha256}`)
        .join("\n"),
      "utf8",
    )
    .digest("hex");
}

async function assertRequiredTables(client: Client): Promise<void> {
  const result = await client.query<{ table_name: string }>(
    `SELECT table_name
       FROM information_schema.tables
      WHERE table_schema = 'source'
        AND table_name = ANY($1::text[])
      ORDER BY table_name`,
    [REQUIRED_TABLES],
  );
  const found = new Set(result.rows.map((row) => row.table_name));
  const missing = REQUIRED_TABLES.filter((tableName) => !found.has(tableName));
  if (missing.length > 0) {
    throw new Error(`Missing Source contract-depth package tables: ${missing.join(", ")}`);
  }
}

async function main(): Promise<void> {
  const args = parseArgs();
  const migrations = readMigrationBodies();
  const plan = {
    event: "source_contract_depth_package_schema_plan",
    apply: args.apply,
    migration_count: migrations.length,
    combined_sha256: combinedHash(migrations),
    migrations: migrations.map((migration) => ({
      filename: migration.filename,
      sha256: migration.sha256,
    })),
    required_tables: REQUIRED_TABLES,
    note: "Focused additive Source schema apply for package-backed Layer 2 adapter rows. It does not alter product read models.",
  };

  if (!args.apply) {
    console.log(JSON.stringify(plan, null, 2));
    return;
  }

  const client = new Client(
    postgresClientOptions(databaseUrl(), "source-contract-depth-package-schema"),
  );
  await client.connect();
  const applied: Array<{ filename: string; sha256: string }> = [];
  try {
    for (const migration of migrations) {
      await client.query(migration.sql);
      applied.push({
        filename: migration.filename,
        sha256: migration.sha256,
      });
    }
    await assertRequiredTables(client);
  } finally {
    await client.end();
  }

  console.log(
    JSON.stringify(
      {
        event: "source_contract_depth_package_schema_applied",
        applied: true,
        migration_count: applied.length,
        combined_sha256: combinedHash(migrations),
        migrations: applied,
        required_table_count: REQUIRED_TABLES.length,
        required_tables: REQUIRED_TABLES,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
