// Read-only audit: detect ai_control substrate ledger↔schema drift.
//
// Catches the exact class of failure that blocked the Tower mart write — the
// migration ledger records 20260616170000_ai_control_tower_substrate as
// applied, but its tables are absent. A governed data build that assumes the
// substrate exists then fails mid-run (fail-closed) instead of at a checkpoint.
//
// Usage:
//   npx tsx src/scripts/audit-ai-control-schema-drift.ts
//   (reads ABARVA_AZURE_DATABASE_URL -> TARGET_DATABASE_URL -> DATABASE_URL)
//
// Exits 0 when every required ai_control table exists. Exits 1 on drift, with a
// clear message naming the missing tables and whether the ledger claims the
// migration is applied. SELECT-only; never mutates.

import path from "node:path";
import { config as loadEnv } from "dotenv";
import { Client } from "pg";

import { postgresClientOptions } from "./postgres-client-options";

const ORIGINAL_MIGRATION = "20260616170000_ai_control_tower_substrate";

// The substrate tables a governed AI Control / Tower write depends on. Order
// mirrors 20260616170000; refresh_runs first because everything FKs to it.
const REQUIRED_TABLES = [
  "ai_control_refresh_runs",
  "ai_control_sources",
  "ai_control_initiatives",
  "ai_control_tool_usage_monthly",
  "ai_control_persona_productivity",
  "ai_control_dora_metrics",
  "ai_control_agent_outcomes",
  "ai_control_benefit_realization",
  "ai_control_spend_contracts",
  "ai_control_risk_governance",
  "ai_control_actions",
  "ai_control_evidence_items",
] as const;

async function main(): Promise<void> {
  loadEnv({ path: path.resolve(process.cwd(), ".env.local") });
  loadEnv();

  const connectionString =
    process.env.ABARVA_AZURE_DATABASE_URL?.trim() ||
    process.env.TARGET_DATABASE_URL?.trim() ||
    process.env.DATABASE_URL?.trim();
  if (!connectionString) {
    console.error(
      "audit-ai-control-schema-drift: set ABARVA_AZURE_DATABASE_URL or DATABASE_URL.",
    );
    process.exit(2);
  }

  const client = new Client(
    postgresClientOptions(connectionString, "audit-ai-control-schema-drift"),
  );
  await client.connect();
  try {
    // to_regclass returns NULL when the relation does not exist — no error, so
    // one round-trip checks every table.
    const regclassSelect = REQUIRED_TABLES.map(
      (t, i) => `to_regclass('public.${t}') AS t${i}`,
    ).join(", ");
    const { rows } = await client.query<Record<string, string | null>>(
      `SELECT ${regclassSelect}`,
    );
    const present: string[] = [];
    const missing: string[] = [];
    REQUIRED_TABLES.forEach((t, i) => {
      (rows[0][`t${i}`] ? present : missing).push(t);
    });

    const ledger = await client.query<{ name: string }>(
      `SELECT name FROM schema_migrations WHERE name LIKE $1`,
      [`%${ORIGINAL_MIGRATION}%`],
    );
    const ledgerClaimsApplied = ledger.rows.length > 0;

    console.log(
      JSON.stringify(
        {
          required: REQUIRED_TABLES.length,
          present: present.length,
          missing,
          original_migration_in_ledger: ledgerClaimsApplied,
        },
        null,
        2,
      ),
    );

    if (missing.length === 0) {
      console.log("✓ ai_control substrate is intact; no drift.");
      return;
    }

    console.error(
      `\nSCHEMA DRIFT: ${missing.length}/${REQUIRED_TABLES.length} ai_control tables are MISSING: ${missing.join(", ")}.`,
    );
    if (ledgerClaimsApplied) {
      console.error(
        `The ledger records ${ORIGINAL_MIGRATION} as applied, but the tables above do not exist — ledger↔schema drift. ` +
          `Apply the idempotent repair migration (20260722220000_ai_control_substrate_drift_repair) via the governed db:migrate job; ` +
          `do not hand-edit schema_migrations.`,
      );
    } else {
      console.error(
        `${ORIGINAL_MIGRATION} is NOT in the ledger — run the governed db:migrate job to apply the substrate.`,
      );
    }
    process.exit(1);
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? (err.stack ?? err.message) : err);
  process.exit(1);
});
