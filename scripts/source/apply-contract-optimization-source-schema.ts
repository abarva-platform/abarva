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
  "20260808213000_source_contract_optimization_v11_portability.sql",
  "20260809143000_source_contract_optimization_opportunity_spine.sql",
  "20260809161500_source_contract_optimization_fact_assertions.sql",
]);

const REQUIRED_TABLES = Object.freeze([
  "contract_optimization_decision_record",
  "contract_optimization_evidence_observation",
  "optimization_opportunity",
  "opportunity_evidence",
  "calculation_rule",
  "calculation_run",
  "calculation_input",
  "calculation_output",
  "opportunity_valuation",
  "evidence_requirement",
  "opportunity_requirement_status",
  "evidence_request",
  "opportunity_stage_event",
  "opportunity_overlap",
  "optimization_baseline",
  "optimization_case",
  "case_opportunity",
  "approval_request",
  "approval_decision",
  "negotiated_outcome",
  "finance_realization",
  "finance_realization_evidence",
  "source_record_snapshot",
  "evidence_entity_link",
  "canonical_fact_assertion",
  "fact_conflict",
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
      process.env.SOURCE_CONTRACT_OPTIMIZATION_SCHEMA_APPLY === "true",
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
        `Refusing source schema apply because ${filename} contains destructive SQL: ${destructiveFindings
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
    throw new Error(
      `Missing source optimization tables: ${missing.join(", ")}`,
    );
  }
}

async function main(): Promise<void> {
  const args = parseArgs();
  const migrations = readMigrationBodies();
  const plan = {
    event: "source_contract_optimization_source_schema_plan",
    apply: args.apply,
    migration_count: migrations.length,
    combined_sha256: combinedHash(migrations),
    migrations: migrations.map((migration) => ({
      filename: migration.filename,
      sha256: migration.sha256,
    })),
    required_tables: REQUIRED_TABLES,
    note: "Focused Source operator schema apply. It executes vetted additive Source DDL only and intentionally does not mutate schema_migrations, so unrelated tenant migration drift cannot be re-recorded by this SkyHarbor job.",
  };

  if (!args.apply) {
    console.log(JSON.stringify(plan, null, 2));
    return;
  }

  const client = new Client(
    postgresClientOptions(databaseUrl(), "source-contract-optimization-schema"),
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
        event: "source_contract_optimization_source_schema_applied",
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
