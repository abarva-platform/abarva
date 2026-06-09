// =============================================================================
// Context & Corpus Governance — inventory aggregation (PR-2, pure core)
// -----------------------------------------------------------------------------
// Pure, DB-free aggregation of dataset probes into a tenant-coverage inventory.
// The scanner (src/scripts/governance/inventory-scan.ts) collects InventoryProbe
// rows from the live stores (run as an ACA job — the private DB is unreachable
// from a workstation) and feeds them here. Iterating CANONICAL_TENANT_KEYS is the
// no-exceptions guarantee: every canonical tenant appears in the report, or is
// explicitly flagged as "no data found" — SkyHarbor can never be silently missing.
// =============================================================================

import { CANONICAL_TENANT_KEYS } from "@/config/tenants/CANONICAL_TENANTS";
import { CORPUS_GLOBAL_SCOPE } from "./context-corpus-policy";

/** One probe = one (store × scope) cell counted in the live DB. */
export interface InventoryProbe {
  client_key: string; // canonical tenant key or corpus_global
  source_layer: string;
  store: string; // table name
  total: number;
  missing_source_basis: number;
  missing_confidence: number;
  missing_tenant_id: number;
  missing_classification: number;
  not_indexed: number; // retrievability ∈ {not_indexed, committed_not_indexed}
  agent_ready: number;
  blocked: number;
}

export interface TenantRollup {
  client_key: string;
  present: boolean; // any data found for this tenant
  total: number;
  agent_ready: number;
  blocked: number;
  missing_fields: number;
  not_indexed: number;
  stores: number;
}

export interface InventoryReport {
  generated_for: string;
  scopes: string[]; // canonical keys + corpus_global, in order
  tenants: TenantRollup[];
  missing_tenants: string[]; // canonical keys with NO data found
  store_totals: Array<{ store: string; total: number }>;
  grand_total: number;
}

function emptyRollup(client_key: string): TenantRollup {
  return {
    client_key,
    present: false,
    total: 0,
    agent_ready: 0,
    blocked: 0,
    missing_fields: 0,
    not_indexed: 0,
    stores: 0,
  };
}

/**
 * Roll probes up per scope. EVERY canonical tenant key (+ corpus_global) is
 * represented; a scope with no probes is `present:false` and listed in
 * `missing_tenants` — never silently dropped.
 */
export function aggregateInventory(probes: InventoryProbe[]): InventoryReport {
  const scopes = [...CANONICAL_TENANT_KEYS, CORPUS_GLOBAL_SCOPE];
  const byScope = new Map<string, TenantRollup>();
  for (const key of scopes) byScope.set(key, emptyRollup(key));

  const storeTotals = new Map<string, number>();
  let grand = 0;

  for (const p of probes) {
    // Unknown (non-canonical) scopes still roll up so drift is visible.
    const roll = byScope.get(p.client_key) ?? emptyRollup(p.client_key);
    byScope.set(p.client_key, roll);
    roll.present = roll.present || p.total > 0;
    roll.total += p.total;
    roll.agent_ready += p.agent_ready;
    roll.blocked += p.blocked;
    roll.not_indexed += p.not_indexed;
    roll.missing_fields +=
      p.missing_source_basis +
      p.missing_confidence +
      p.missing_tenant_id +
      p.missing_classification;
    if (p.total > 0) roll.stores += 1;
    storeTotals.set(p.store, (storeTotals.get(p.store) ?? 0) + p.total);
    grand += p.total;
  }

  const tenants = [...byScope.values()];
  const missing_tenants = (CANONICAL_TENANT_KEYS as readonly string[]).filter(
    (k) => !byScope.get(k)?.present,
  );

  return {
    generated_for: "all canonical tenants + corpus_global",
    scopes,
    tenants,
    missing_tenants,
    store_totals: [...storeTotals.entries()]
      .map(([store, total]) => ({ store, total }))
      .sort((a, b) => b.total - a.total),
    grand_total: grand,
  };
}

export function renderInventoryReportMarkdown(
  report: InventoryReport,
  generatedAt: string,
): string {
  const lines: string[] = [];
  lines.push("# Context & Corpus Inventory Report (2026-06-08)");
  lines.push("");
  lines.push(
    `Generated: ${generatedAt} · scope: ${report.generated_for} · grand total objects: ${report.grand_total}`,
  );
  lines.push("");
  lines.push("## Per-scope coverage (every canonical tenant + corpus_global)");
  lines.push("");
  lines.push(
    "| Scope | Present | Total | Agent-ready | Blocked | Not-indexed | Missing-field count | Stores |",
  );
  lines.push("|---|---|---|---|---|---|---|---|");
  for (const t of report.tenants) {
    lines.push(
      `| ${t.client_key} | ${t.present ? "yes" : "**NO DATA FOUND**"} | ${t.total} | ${t.agent_ready} | ${t.blocked} | ${t.not_indexed} | ${t.missing_fields} | ${t.stores} |`,
    );
  }
  lines.push("");
  if (report.missing_tenants.length > 0) {
    lines.push(
      `> ⚠️ Canonical tenants with NO data found: ${report.missing_tenants.join(", ")}. ` +
        "These are present in CANONICAL_TENANTS but have no governed objects in the scanned stores — not omitted, explicitly flagged.",
    );
    lines.push("");
  }
  lines.push("## Per-store totals");
  lines.push("");
  lines.push("| Store | Total |");
  lines.push("|---|---|");
  for (const s of report.store_totals)
    lines.push(`| ${s.store} | ${s.total} |`);
  lines.push("");
  return lines.join("\n");
}
