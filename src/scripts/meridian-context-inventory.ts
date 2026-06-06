/**
 * Read-only context-layer inventory for a tenant — answers "what is actually
 * loaded across dimensions" against the live Azure Postgres context layer
 * (`enterprise_context_chunks`).
 *
 * Designed to run via the proven Azure private operator runner
 * (`job-abarva-private-operator-eus`) INSIDE the VNet, where the private
 * Postgres (10.43.1.4 / abarva_control) is reachable. It performs SELECTs only
 * — no writes — and prints a single JSON object (so it lands in Log Analytics
 * the same way the operator proof does).
 *
 * Connection: prefers `ABARVA_AZURE_DATABASE_URL` (post-PR #3231), then
 * `AZURE_DATABASE_URL`, then `DATABASE_URL`.
 *
 * Run (inside VNet / operator):
 *   npx tsx src/scripts/meridian-context-inventory.ts --tenant meridian-health
 */

import { Client } from "pg";
import path from "node:path";
import { config as loadEnv } from "dotenv";
import { postgresClientOptions } from "./postgres-client-options";

loadEnv({ path: path.resolve(process.cwd(), ".env.local") });
loadEnv();

const TENANT_ALIASES: Record<string, string[]> = {
  "meridian-health": ["meridian-health", "meridian"],
  "apex-retail": ["apex-retail", "apexretail"],
  "first-capital": ["first-capital", "arcturus"],
  "skyharbor-air": ["skyharbor-air", "skyharbor"],
};

function arg(name: string, fallback: string): string {
  const i = process.argv.indexOf(name);
  return i >= 0 ? (process.argv[i + 1] ?? fallback) : fallback;
}

function resolveConnectionString(): string {
  const cs =
    process.env.ABARVA_AZURE_DATABASE_URL ||
    process.env.AZURE_DATABASE_URL ||
    process.env.DATABASE_URL;
  if (!cs) {
    throw new Error(
      "No database URL: set ABARVA_AZURE_DATABASE_URL (preferred), AZURE_DATABASE_URL, or DATABASE_URL.",
    );
  }
  return cs;
}

async function main(): Promise<void> {
  const tenant = arg("--tenant", "meridian-health");
  const aliases = TENANT_ALIASES[tenant] ?? [tenant];
  const client = new Client(
    postgresClientOptions(
      resolveConnectionString(),
      "meridian-context-inventory",
    ),
  );
  await client.connect();
  try {
    const where = "tenant_key = any($1::text[])";

    const totals = (
      await client.query(
        `select
           count(*)::int as total,
           count(*) filter (where embedding_status <> 'pending')::int as embedded,
           count(*) filter (where embedding_status = 'pending')::int as pending,
           count(distinct source_doc)::int as source_docs,
           count(distinct source_segment_id)::int as segments
         from enterprise_context_chunks where ${where}`,
        [aliases],
      )
    ).rows[0];

    const bySegment = (
      await client.query(
        `select source_segment_id,
                count(*)::int as chunks,
                count(*) filter (where embedding_status <> 'pending')::int as embedded,
                count(*) filter (where embedding_status = 'pending')::int as pending
         from enterprise_context_chunks where ${where}
         group by source_segment_id order by chunks desc`,
        [aliases],
      )
    ).rows;

    const bySourceDoc = (
      await client.query(
        `select source_doc, source_segment_id, count(*)::int as chunks
         from enterprise_context_chunks where ${where}
         group by source_doc, source_segment_id order by chunks desc limit 80`,
        [aliases],
      )
    ).rows;

    const byFileType = (
      await client.query(
        `select lower(coalesce(nullif(regexp_replace(source_doc, '^.*\\.', ''), source_doc), 'none')) as file_type,
                count(*)::int as chunks
         from enterprise_context_chunks where ${where}
         group by 1 order by chunks desc`,
        [aliases],
      )
    ).rows;

    // Surface vendor / AMS / contract evidence (e.g. the AMS vendor contracts).
    const vendorRows = (
      await client.query(
        `select source_doc, source_segment_id, count(*)::int as chunks
         from enterprise_context_chunks
         where ${where}
           and (source_doc ilike '%vendor%' or source_doc ilike '%ams%'
                or source_doc ilike '%contract%' or source_segment_id = 'it_financials')
         group by source_doc, source_segment_id order by chunks desc limit 40`,
        [aliases],
      )
    ).rows;

    // Surface data/analytics/technology evidence (current-state platform).
    const techRows = (
      await client.query(
        `select source_doc, source_segment_id, count(*)::int as chunks
         from enterprise_context_chunks
         where ${where}
           and (source_segment_id = 'it_landscape'
                or source_doc ilike '%cmdb%' or source_doc ilike '%application%'
                or source_doc ilike '%data%' or source_doc ilike '%estate%')
         group by source_doc, source_segment_id order by chunks desc limit 40`,
        [aliases],
      )
    ).rows;

    console.log(
      JSON.stringify(
        {
          ok: true,
          kind: "abarva-context-inventory",
          tenant,
          aliases,
          totals,
          by_segment: bySegment,
          by_file_type: byFileType,
          source_docs: bySourceDoc,
          vendor_ams_evidence: vendorRows,
          technology_evidence: techRows,
        },
        null,
        2,
      ),
    );
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(JSON.stringify({ ok: false, error: String(err) }));
  process.exit(1);
});
