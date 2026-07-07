// Read-only audit: "What datasets are loaded today, by type / category?"
//
// Pulls a consolidated, cross-table inventory of loaded/ingested data from
// the Azure Postgres data plane and groups it by each table's natural
// type / category column (domain, rung, segment, content_type, source_type,
// record_type, load_intent, ...). It is strictly SELECT-only and degrades
// gracefully: any table or column that does not exist in the target plane
// is skipped with a note, so the same script works across planes / tenants.
//
// Connection string (first that is set wins):
//   ABARVA_AZURE_DATABASE_URL  →  DATABASE_URL
//
// Optional tenant filter (only applied to tables that expose `tenant_key`):
//   --tenant=<tenant_key>      e.g. --tenant=apex-retail
//   (falls back to ABARVA_ACTIVE_CLIENT_KEY / ABARVA_CLIENT_KEY)
//
// Run:
//   set -a; source .env.local; set +a
//   npx tsx src/scripts/audit/report-loaded-datasets.ts
//   npx tsx src/scripts/audit/report-loaded-datasets.ts --tenant=apex-retail
//   npm run audit:loaded-datasets

import { config as loadEnv } from "dotenv";
import { Client } from "pg";
import { postgresClientOptions } from "../postgres-client-options";

loadEnv({ path: ".env.local" });
loadEnv(); // .env fallback

interface ReportSection {
  /** Logical label shown in the report. */
  title: string;
  /** Physical table name. */
  table: string;
  /** Columns we want to group by (the "type / category" axes). Missing columns are dropped. */
  groupBy: readonly string[];
  /** Optional numeric column to SUM per group (e.g. row_count / record_count). */
  sum?: string;
  /** One-line description of what "loaded" means for this table. */
  note: string;
}

// Each section maps a loaded-data table to its natural type/category axes.
// Column names are validated against information_schema at runtime, so a
// drifted / partial schema simply skips the unknown axis instead of erroring.
const SECTIONS: readonly ReportSection[] = [
  {
    title: "Admin dataset registry (trust inventory)",
    table: "admin_datasets",
    groupBy: ["domain", "rung"],
    sum: "row_count",
    note: "Steward-facing datasets by business domain and trust rung.",
  },
  {
    title: "Loaded substrate segments",
    table: "data_inventory_segments",
    groupBy: ["family_number", "segment_name", "health_state"],
    sum: "record_count",
    note: "Tenant substrate categories (segments) actually loaded, with record counts.",
  },
  {
    title: "Ingestion runs",
    table: "data_ingestion_runs",
    groupBy: ["source_label"],
    sum: "records_loaded",
    note: "Historical load runs and how many records each pulled in.",
  },
  {
    title: "Knowledge sources",
    table: "knowledge_sources",
    groupBy: ["content_type"],
    note: "Industry knowledge corpus by content type (regulation, framework, benchmark, ...).",
  },
  {
    title: "Corpus patterns",
    table: "corpus_patterns",
    groupBy: ["category"],
    note: "Pattern corpus by category.",
  },
  {
    title: "Genome patterns",
    table: "genome_patterns",
    groupBy: ["pattern_type", "vertical"],
    note: "Transformation genome patterns by type and vertical.",
  },
  {
    title: "Cross-industry data sources",
    table: "data_sources",
    groupBy: ["source_type"],
    note: "Demo data-platform inventory by source type (warehouse, lake, feed, ...).",
  },
  {
    title: "Enterprise context sources",
    table: "enterprise_context_sources",
    groupBy: ["source_type"],
    note: "Client-internal context sources by type.",
  },
  {
    title: "Enterprise context records",
    table: "enterprise_context_records",
    groupBy: ["record_type", "record_subtype"],
    note: "Structured client context records by type / subtype.",
  },
  {
    title: "Pilot ingestion upload runs",
    table: "pilot_ingestion_upload_runs",
    groupBy: ["source_system", "load_intent", "status"],
    note: "Governed upload/load pipeline runs by source system, intent and status.",
  },
  {
    title: "Pilot ingestion file manifests",
    table: "pilot_ingestion_file_manifests",
    groupBy: ["manifest_role", "mime_type", "storage_state"],
    note: "Uploaded files by role, MIME type and storage state.",
  },
];

const IDENT_RE = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

function resolveConnectionString(): string | null {
  const candidates = [
    process.env.ABARVA_AZURE_DATABASE_URL?.trim(),
    process.env.DATABASE_URL?.trim(),
  ].filter((v): v is string => Boolean(v));
  return candidates[0] ?? null;
}

function resolveTenant(): string | null {
  const flag = process.argv.find((a) => a.startsWith("--tenant="));
  if (flag) return flag.slice("--tenant=".length).trim() || null;
  return (
    process.env.ABARVA_ACTIVE_CLIENT_KEY?.trim() ||
    process.env.ABARVA_CLIENT_KEY?.trim() ||
    null
  );
}

async function tableExists(client: Client, table: string): Promise<boolean> {
  const { rows } = await client.query<{ exists: boolean }>(
    `SELECT EXISTS (
       SELECT 1 FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name = $1
     ) AS exists`,
    [table],
  );
  return rows[0]?.exists ?? false;
}

async function existingColumns(
  client: Client,
  table: string,
  wanted: readonly string[],
): Promise<Set<string>> {
  const { rows } = await client.query<{ column_name: string }>(
    `SELECT column_name FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = $1`,
    [table],
  );
  const present = new Set(rows.map((r) => r.column_name));
  return new Set(wanted.filter((c) => present.has(c)));
}

function quoteIdent(value: string): string {
  if (!IDENT_RE.test(value)) {
    throw new Error(`unsafe_identifier: ${value}`);
  }
  return `"${value}"`;
}

function fmtNum(n: number | string | null | undefined): string {
  if (n === null || n === undefined) return "—";
  const value = typeof n === "string" ? Number(n) : n;
  if (!Number.isFinite(value)) return "—";
  return value.toLocaleString("en-US");
}

async function reportSection(
  client: Client,
  section: ReportSection,
  tenant: string | null,
): Promise<void> {
  console.log("");
  console.log("─".repeat(80));
  console.log(`▸ ${section.title}  ·  ${section.table}`);
  console.log(`  ${section.note}`);

  if (!(await tableExists(client, section.table))) {
    console.log("  (table not present in this plane — skipped)");
    return;
  }

  const cols = await existingColumns(client, section.table, [
    ...section.groupBy,
    ...(section.sum ? [section.sum] : []),
    "tenant_key",
  ]);

  const groupCols = section.groupBy.filter((c) => cols.has(c));
  const hasTenant = cols.has("tenant_key");
  const sumCol = section.sum && cols.has(section.sum) ? section.sum : null;

  const params: unknown[] = [];
  let whereClause = "";
  if (tenant && hasTenant) {
    params.push(tenant);
    whereClause = ` WHERE "tenant_key" = $${params.length}`;
  }

  // Total row count first.
  const totalRes = await client.query<{ n: string }>(
    `SELECT count(*)::bigint AS n FROM ${quoteIdent(section.table)}${whereClause}`,
    params,
  );
  const total = Number(totalRes.rows[0]?.n ?? 0);
  const tenantTag = tenant && hasTenant ? ` (tenant=${tenant})` : "";
  console.log(`  total rows: ${fmtNum(total)}${tenantTag}`);

  if (total === 0) {
    console.log("  (no rows loaded)");
    return;
  }

  if (groupCols.length === 0) {
    console.log("  (no type/category columns available to group by)");
    return;
  }

  const selectCols = groupCols.map(quoteIdent).join(", ");
  const sumSelect = sumCol
    ? `, sum(${quoteIdent(sumCol)})::bigint AS total`
    : "";
  const sql =
    `SELECT ${selectCols}, count(*)::bigint AS n${sumSelect} ` +
    `FROM ${quoteIdent(section.table)}${whereClause} ` +
    `GROUP BY ${selectCols} ` +
    `ORDER BY n DESC LIMIT 200`;

  const { rows } = await client.query<Record<string, string | null>>(
    sql,
    params,
  );

  const header =
    groupCols.map((c) => c).join(" · ") +
    "  →  count" +
    (sumCol ? `  (Σ ${sumCol})` : "");
  console.log("");
  console.log(`  ${header}`);
  console.log("  " + "·".repeat(76));
  for (const row of rows) {
    const label = groupCols
      .map((c) =>
        row[c] === null || row[c] === "" ? "(null)" : String(row[c]),
      )
      .join(" · ");
    const count = fmtNum(row["n"]);
    const sumPart = sumCol ? `   (Σ ${fmtNum(row["total"])})` : "";
    console.log(`  ${label.padEnd(54)} ${count.padStart(10)}${sumPart}`);
  }
}

async function main(): Promise<void> {
  const connectionString = resolveConnectionString();
  if (!connectionString) {
    console.error("");
    console.error("✗ No database connection string found.");
    console.error("  Set ABARVA_AZURE_DATABASE_URL or DATABASE_URL.");
    console.error(
      "  In a Cloud Agent, add it under Cursor Dashboard → Cloud Agents → Secrets,",
    );
    console.error(
      "  or locally export it / put it in .env.local before running.",
    );
    console.error("");
    process.exit(1);
    return;
  }

  const tenant = resolveTenant();

  const client = new Client(
    postgresClientOptions(connectionString, "audit-report-loaded-datasets"),
  );
  await client.connect();

  let host = "(unknown)";
  try {
    host = new URL(connectionString).host;
  } catch {
    /* ignore unparseable URL */
  }

  console.log("");
  console.log("═".repeat(80));
  console.log(" Loaded datasets — by type / category");
  console.log(`  host: ${host}`);
  console.log(`  tenant filter: ${tenant ?? "(none — all tenants)"}`);
  console.log(`  generated: ${new Date().toISOString()}`);
  console.log("═".repeat(80));

  try {
    for (const section of SECTIONS) {
      try {
        await reportSection(client, section, tenant);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.log(`  ! section error (${section.table}): ${message}`);
      }
    }
  } finally {
    await client.end();
  }

  console.log("");
  console.log("═".repeat(80));
  console.log(" Done. (read-only — no rows were modified)");
  console.log("═".repeat(80));
  console.log("");
}

void main();
