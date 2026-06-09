// =============================================================================
// Context & Corpus Governance — inventory scanner (PR-2, DB IO; ACA-job runner)
// -----------------------------------------------------------------------------
// Read-only. Counts governed-object stores per canonical tenant (+ corpus_global)
// and writes docs/governance/CONTEXT_CORPUS_INVENTORY_REPORT_<date>.md via the
// pure aggregation in src/lib/governance/inventory.ts.
//
// The private Azure DB is unreachable from a workstation, so run this as a
// Container Apps Job in the VNet (see docs/governance — runbook). Never writes
// to the DB. Per-store probing is defensive: a missing table or column degrades
// to a recorded probe error, never a crashed scan.
//
//   npx tsx src/scripts/governance/inventory-scan.ts [--out <path>]
// =============================================================================

import fs from "node:fs/promises";
import path from "node:path";
import Module from "node:module";
import { CANONICAL_TENANT_KEYS } from "@/config/tenants/CANONICAL_TENANTS";
import {
  aggregateInventory,
  renderInventoryReportMarkdown,
  type InventoryProbe,
} from "@/lib/governance/inventory";
import { CORPUS_GLOBAL_SCOPE } from "@/lib/governance/context-corpus-policy";

// Store catalog: table + the layer + the tenant column (null = shared corpus).
// Extend as governed columns land (PR-3) so the granular missing-field counts
// light up; today this proves coverage (totals per store per tenant).
const STORES: Array<{
  table: string;
  source_layer: string;
  fromSql?: string;
  tenantColumn: string | null;
  tenantValue?: "client_id" | "tenant_key";
}> = [
  {
    table: "enterprise_context_chunks",
    source_layer: "tenant_context",
    tenantColumn: "client_id",
    tenantValue: "client_id",
  },
  {
    table: "ai_initiatives",
    source_layer: "move",
    tenantColumn: "client_id",
    tenantValue: "client_id",
  },
  {
    table: "data_inventory_records",
    source_layer: "metric",
    tenantColumn: "client_id",
    tenantValue: "client_id",
  },
  {
    table: "program_evidence_items",
    source_layer: "uploaded_evidence",
    tenantColumn: "tenant_key",
    tenantValue: "tenant_key",
  },
  {
    table: "deliverables_v2",
    source_layer: "artifact",
    fromSql: "deliverables_v2 d JOIN engagements e ON e.id = d.engagement_id",
    tenantColumn: "e.client_id",
    tenantValue: "client_id",
  },
  { table: "genome_patterns", source_layer: "pattern", tenantColumn: null },
  { table: "pattern_packs", source_layer: "pattern", tenantColumn: null },
  {
    table: "knowledge_sources",
    source_layer: "industry_corpus",
    tenantColumn: null,
  },
];

function emptyProbe(
  client_key: string,
  store: string,
  source_layer: string,
): InventoryProbe {
  return {
    client_key,
    store,
    source_layer,
    total: 0,
    missing_source_basis: 0,
    missing_confidence: 0,
    missing_tenant_id: 0,
    missing_classification: 0,
    not_indexed: 0,
    agent_ready: 0,
    blocked: 0,
  };
}

async function main(): Promise<void> {
  // server-only shim so the read adapter imports cleanly under tsx.
  const m = Module as unknown as {
    _load: (r: string, p: unknown, i: boolean) => unknown;
  };
  const orig = m._load;
  m._load = (r, p, i) => (r === "server-only" ? {} : orig.call(m, r, p, i));
  const { azureRead } = await import("@/lib/data-plane/azureRead");

  const outIdx = process.argv.indexOf("--out");
  const outPath = path.resolve(
    outIdx >= 0
      ? process.argv[outIdx + 1]
      : "docs/governance/CONTEXT_CORPUS_INVENTORY_REPORT_2026-06-08.md",
  );

  // Resolve canonical key -> clientId via the clients table (best-effort).
  const clientRows = await azureRead
    .query<{
      id: string;
      key: string;
    }>(
      "SELECT id, COALESCE(tenant_key, slug) AS key FROM clients WHERE COALESCE(tenant_key, slug) IS NOT NULL",
      [],
      { missingTable: "empty" },
    )
    .catch(() => [] as Array<{ id: string; key: string }>);
  const keyToId = new Map(clientRows.map((r) => [r.key, r.id]));

  const probes: InventoryProbe[] = [];
  const errors: string[] = [];

  for (const store of STORES) {
    if (store.tenantColumn === null) {
      // Shared corpus store -> corpus_global scope.
      try {
        const rows = await azureRead.query<{ n: number }>(
          `SELECT COUNT(*)::int AS n FROM ${store.table}`,
          [],
          { missingTable: "empty" },
        );
        const probe = emptyProbe(
          CORPUS_GLOBAL_SCOPE,
          store.table,
          store.source_layer,
        );
        probe.total = rows[0]?.n ?? 0;
        probes.push(probe);
      } catch (e) {
        errors.push(`${store.table} (corpus): ${(e as Error).message}`);
      }
      continue;
    }
    for (const key of CANONICAL_TENANT_KEYS) {
      const tenantValue =
        store.tenantValue === "tenant_key" ? key : (keyToId.get(key) ?? key);
      const fromSql = store.fromSql ?? store.table;
      try {
        const rows = await azureRead.query<{ n: number }>(
          `SELECT COUNT(*)::int AS n FROM ${fromSql} WHERE ${store.tenantColumn} = $1`,
          [tenantValue],
          { missingTable: "empty" },
        );
        const probe = emptyProbe(key, store.table, store.source_layer);
        probe.total = rows[0]?.n ?? 0;
        probes.push(probe);
      } catch (e) {
        errors.push(`${store.table} (${key}): ${(e as Error).message}`);
      }
    }
  }

  const report = aggregateInventory(probes);
  let md = renderInventoryReportMarkdown(report, new Date().toISOString());
  if (errors.length > 0) {
    md +=
      `\n## Probe errors (store/column not present — extend STORES as schema lands)\n\n` +
      errors.map((e) => `- ${e}`).join("\n") +
      "\n";
  }
  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await fs.writeFile(outPath, md);
  console.log(
    `inventory report written: ${outPath} (${report.grand_total} objects; ${report.missing_tenants.length} tenants with no data)`,
  );
}

void main();
