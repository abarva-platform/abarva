// =============================================================================
// Context & Corpus Governance — readiness backfill (PR-3, DB IO; ACA-job runner)
// -----------------------------------------------------------------------------
// Seeds the governed_object_readiness sidecar (migration 20260608160000) with
// one row per governed object across all stores. Dry-run by default: it counts
// the proposed state per store×scope and writes a report, WITHOUT touching the
// DB. With --commit it upserts the conservative initial state into the sidecar
// (idempotent on (object_table, object_id, client_key)). It NEVER mutates a
// source row, and NEVER auto-promotes anything to agent_ready (see
// src/lib/governance/readiness-backfill.ts for the gating invariant).
//
// The private Azure DB is unreachable from a workstation — run this as a
// Container Apps Job in the VNet (runbook in docs/governance). Source-row
// signals (grounding / index / cite-verification) are not yet columns on the
// source tables, so the backfill seeds the conservative floor (not_reviewed /
// committed_not_indexed / restricted / blocked) and later slices promote with
// evidence. Conservative, not flattering — by design.
//
//   npx tsx src/scripts/governance/readiness-backfill.ts [--commit] [--out <path>]
// =============================================================================

import fs from "node:fs/promises";
import path from "node:path";
import Module from "node:module";
import { CANONICAL_TENANT_KEYS } from "@/config/tenants/CANONICAL_TENANTS";
import { CORPUS_GLOBAL_SCOPE } from "@/lib/governance/context-corpus-policy";
import {
  computeProposedReadiness,
  emptyStatusCounts,
  renderBackfillReportMarkdown,
  summarizeBackfill,
  type BackfillCell,
} from "@/lib/governance/readiness-backfill";

// Mirror the inventory scanner's store catalog (PR-2). tenantColumn null = shared corpus.
const STORES: Array<{
  table: string;
  source_layer: string;
  fromSql?: string;
  tenantColumn: string | null;
  tenantValue?: "client_id" | "tenant_key";
  idColumn: string;
}> = [
  {
    table: "enterprise_context_chunks",
    source_layer: "tenant_context",
    tenantColumn: "client_id",
    tenantValue: "client_id",
    idColumn: "id",
  },
  {
    table: "ai_initiatives",
    source_layer: "move",
    tenantColumn: "client_id",
    tenantValue: "client_id",
    idColumn: "initiative_id",
  },
  {
    table: "data_inventory_records",
    source_layer: "metric",
    tenantColumn: "client_id",
    tenantValue: "client_id",
    idColumn: "id",
  },
  {
    table: "program_evidence_items",
    source_layer: "uploaded_evidence",
    tenantColumn: "tenant_key",
    tenantValue: "tenant_key",
    idColumn: "id",
  },
  {
    table: "deliverables_v2",
    source_layer: "artifact",
    fromSql: "deliverables_v2 d JOIN engagements e ON e.id = d.engagement_id",
    tenantColumn: "e.client_id",
    tenantValue: "client_id",
    idColumn: "d.id",
  },
  {
    table: "genome_patterns",
    source_layer: "pattern",
    tenantColumn: null,
    idColumn: "id",
  },
  {
    table: "pattern_packs",
    source_layer: "pattern",
    tenantColumn: null,
    idColumn: "id",
  },
  {
    table: "knowledge_sources",
    source_layer: "industry_corpus",
    tenantColumn: null,
    idColumn: "id",
  },
];

/** Conservative signal set for an existing, un-governed source row. */
function conservativeSignals(client_key: string, source_layer: string) {
  return {
    source_layer,
    client_key,
    has_tenant_id: client_key !== CORPUS_GLOBAL_SCOPE, // count rows are scoped, so present
    has_source_basis: false, // not yet a column on source rows
    has_confidence: false,
    classification: "internal" as const,
    retrievable: false, // index membership not yet proven per-row
    cite_render_verified: false,
  };
}

async function main(): Promise<void> {
  const commit = process.argv.includes("--commit");
  const m = Module as unknown as {
    _load: (r: string, p: unknown, i: boolean) => unknown;
  };
  const orig = m._load;
  m._load = (r, p, i) => (r === "server-only" ? {} : orig.call(m, r, p, i));

  const outIdx = process.argv.indexOf("--out");
  const outPath = path.resolve(
    outIdx >= 0
      ? process.argv[outIdx + 1]
      : "docs/governance/CONTEXT_CORPUS_READINESS_BACKFILL_2026-06-08.md",
  );

  const { azureRead } = await import("@/lib/data-plane/azureRead");

  const clientRows = await azureRead
    .query<{ id: string; key: string }>(
      "SELECT id, COALESCE(tenant_key, slug) AS key FROM clients WHERE COALESCE(tenant_key, slug) IS NOT NULL",
      [],
      {
        missingTable: "empty",
      },
    )
    .catch(() => [] as Array<{ id: string; key: string }>);
  const keyToId = new Map(clientRows.map((r) => [r.key, r.id]));

  const cells: BackfillCell[] = [];
  const errors: string[] = [];

  async function countCell(
    client_key: string,
    store: (typeof STORES)[number],
    whereSql: string,
    params: unknown[],
  ): Promise<void> {
    try {
      const fromSql = store.fromSql ?? store.table;
      const rows = await azureRead.query<{ n: number }>(
        `SELECT COUNT(*)::int AS n FROM ${fromSql}${whereSql}`,
        params,
        { missingTable: "empty" },
      );
      const total = rows[0]?.n ?? 0;
      const proposal = computeProposedReadiness(
        conservativeSignals(client_key, store.source_layer),
      );
      const by_status = emptyStatusCounts();
      by_status[proposal.agent_readiness_status] = total;
      cells.push({
        client_key,
        store: store.table,
        source_layer: store.source_layer,
        total,
        by_status,
      });
    } catch (e) {
      errors.push(`${store.table} (${client_key}): ${(e as Error).message}`);
    }
  }

  for (const store of STORES) {
    if (store.tenantColumn === null) {
      await countCell(CORPUS_GLOBAL_SCOPE, store, "", []);
      continue;
    }
    for (const key of CANONICAL_TENANT_KEYS) {
      const tenantValue =
        store.tenantValue === "tenant_key" ? key : (keyToId.get(key) ?? key);
      await countCell(key, store, ` WHERE ${store.tenantColumn} = $1`, [
        tenantValue,
      ]);
    }
  }

  const summary = summarizeBackfill(cells);

  if (commit) {
    // Upsert one sidecar row per source object inside a real transaction.
    // azureRead blocks mutations, so the write path uses the transactional
    // session seam. Reads source ids only; NEVER mutates source rows.
    // Idempotent on the identity unique index; an already-promoted/fenced row
    // (agent_ready / restricted / quarantined / retired) is left untouched.
    const { createTxSession } =
      await import("@/lib/data-plane/read-adapters/azureSession");
    const tx = createTxSession("governance-readiness-backfill");
    let upserted = 0;
    for (const store of STORES) {
      const scopes =
        store.tenantColumn === null
          ? [
              {
                key: CORPUS_GLOBAL_SCOPE,
                filterValue: null as string | null,
                tenantId: null as string | null,
              },
            ]
          : CANONICAL_TENANT_KEYS.map((key) => ({
              key,
              filterValue:
                store.tenantValue === "tenant_key"
                  ? key
                  : (keyToId.get(key) ?? key),
              tenantId: keyToId.get(key) ?? key,
            }));
      for (const scope of scopes) {
        try {
          const fromSql = store.fromSql ?? store.table;
          const where =
            store.tenantColumn === null
              ? ""
              : ` WHERE ${store.tenantColumn} = $1`;
          const params = store.tenantColumn === null ? [] : [scope.filterValue];
          const ids = await azureRead.query<{ oid: string }>(
            `SELECT ${store.idColumn}::text AS oid FROM ${fromSql}${where}`,
            params,
            { missingTable: "empty" },
          );
          const proposal = computeProposedReadiness(
            conservativeSignals(scope.key, store.source_layer),
          );
          await tx(async (run) => {
            for (const row of ids) {
              await run(
                `INSERT INTO governed_object_readiness
                   (object_table, object_id, client_key, tenant_id, source_layer,
                    agent_readiness_status, retrievability, backfill_reason)
                 VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
                 ON CONFLICT (object_table, object_id, client_key) DO UPDATE SET
                   agent_readiness_status = EXCLUDED.agent_readiness_status,
                   retrievability = EXCLUDED.retrievability,
                   backfill_reason = EXCLUDED.backfill_reason,
                   updated_at = now()
                 WHERE governed_object_readiness.agent_readiness_status NOT IN
                   ('agent_ready','restricted','quarantined','retired')`,
                [
                  store.table,
                  row.oid,
                  scope.key,
                  scope.tenantId,
                  store.source_layer,
                  proposal.agent_readiness_status,
                  proposal.retrievability,
                  proposal.reason,
                ],
              );
              upserted += 1;
            }
          });
        } catch (e) {
          errors.push(
            `commit ${store.table} (${scope.key}): ${(e as Error).message}`,
          );
        }
      }
    }
    console.log(
      `readiness backfill committed: ${upserted} sidecar rows upserted`,
    );
  }

  let md = renderBackfillReportMarkdown(
    summary,
    new Date().toISOString(),
    commit ? "commit" : "dry-run",
  );
  if (errors.length > 0) {
    md +=
      `\n## Errors (store/column not present, or DB unreachable)\n\n` +
      errors.map((e) => `- ${e}`).join("\n") +
      "\n";
  }
  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await fs.writeFile(outPath, md);
  console.log(
    `readiness backfill report written: ${outPath} ` +
      `(${summary.total_objects} objects; auto-promoted ${summary.auto_promoted})`,
  );
}

void main();
