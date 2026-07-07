// =============================================================================
// Context & Corpus Governance — tenant coverage aggregation (PR-6, pure core)
// -----------------------------------------------------------------------------
// End-to-end coverage: joins the readiness ledger (PR-3 governed_object_readiness)
// into one per-canonical-tenant view — how many governed objects each tenant has,
// how many are agent-ready / indexed / fenced / unreviewed, and the governance
// percentage. EVERY canonical tenant (+ corpus_global) is represented; a tenant
// with no ledger rows is flagged "NO DATA FOUND" — the SkyHarbor guarantee, now
// applied to readiness, not just raw counts.
// =============================================================================

import { CANONICAL_TENANT_KEYS } from "@/config/tenants/CANONICAL_TENANTS";
import {
  AGENT_READINESS,
  CORPUS_GLOBAL_SCOPE,
  RETRIEVABLE_STATES,
  type AgentReadiness,
} from "./context-corpus-policy";

/** One readiness-ledger group: (client_key × status × retrievability) count. */
export interface LedgerGroup {
  client_key: string;
  agent_readiness_status: string;
  retrievability: string;
  count: number;
}

export interface TenantCoverage {
  client_key: string;
  present: boolean;
  total: number;
  agent_ready: number;
  retrievable: number;
  blocked: number;
  restricted: number;
  not_reviewed: number;
  committed_not_indexed: number;
  /** agent_ready / total, 0..100, rounded. */
  governed_pct: number;
}

export interface TenantCoverageReport {
  scopes: string[];
  tenants: TenantCoverage[];
  missing_tenants: string[];
  grand_total: number;
  grand_agent_ready: number;
}

function emptyCoverage(client_key: string): TenantCoverage {
  return {
    client_key,
    present: false,
    total: 0,
    agent_ready: 0,
    retrievable: 0,
    blocked: 0,
    restricted: 0,
    not_reviewed: 0,
    committed_not_indexed: 0,
    governed_pct: 0,
  };
}

const KNOWN_STATUSES = new Set<string>(AGENT_READINESS);

export function aggregateTenantCoverage(
  groups: LedgerGroup[],
): TenantCoverageReport {
  const scopes = [...CANONICAL_TENANT_KEYS, CORPUS_GLOBAL_SCOPE];
  const byScope = new Map<string, TenantCoverage>();
  for (const key of scopes) byScope.set(key, emptyCoverage(key));

  for (const g of groups) {
    const cov = byScope.get(g.client_key) ?? emptyCoverage(g.client_key);
    byScope.set(g.client_key, cov);
    cov.present = cov.present || g.count > 0;
    cov.total += g.count;
    if (RETRIEVABLE_STATES.has(g.retrievability as never)) {
      cov.retrievable += g.count;
    }
    // Bucket by known status; unknown statuses still count toward total.
    const status = g.agent_readiness_status as AgentReadiness;
    if (KNOWN_STATUSES.has(status)) {
      if (status === "agent_ready") cov.agent_ready += g.count;
      else if (status === "blocked" || status === "quarantined")
        cov.blocked += g.count;
      else if (status === "restricted") cov.restricted += g.count;
      else if (status === "committed_not_indexed")
        cov.committed_not_indexed += g.count;
      else if (status === "not_reviewed") cov.not_reviewed += g.count;
    }
  }

  let grand = 0;
  let grandReady = 0;
  for (const cov of byScope.values()) {
    cov.governed_pct =
      cov.total > 0 ? Math.round((cov.agent_ready / cov.total) * 100) : 0;
    grand += cov.total;
    grandReady += cov.agent_ready;
  }

  const missing_tenants = (CANONICAL_TENANT_KEYS as readonly string[]).filter(
    (k) => !byScope.get(k)?.present,
  );

  return {
    scopes,
    tenants: [...byScope.values()],
    missing_tenants,
    grand_total: grand,
    grand_agent_ready: grandReady,
  };
}

export function renderTenantCoverageMarkdown(
  report: TenantCoverageReport,
  generatedAt: string,
): string {
  const lines: string[] = [];
  lines.push("# Context & Corpus Tenant Coverage (end-to-end) — 2026-06-08");
  lines.push("");
  lines.push(
    `Generated: ${generatedAt} · source: readiness ledger (governed_object_readiness) · ` +
      `grand total: ${report.grand_total} · agent-ready: ${report.grand_agent_ready}`,
  );
  lines.push("");
  lines.push(
    "| Scope | Present | Total | Agent-ready | Retrievable | Not-reviewed | Committed-not-indexed | Restricted | Blocked | Governed % |",
  );
  lines.push("|---|---|---|---|---|---|---|---|---|---|");
  for (const t of report.tenants) {
    lines.push(
      `| ${t.client_key} | ${t.present ? "yes" : "**NO DATA FOUND**"} | ${t.total} | ` +
        `${t.agent_ready} | ${t.retrievable} | ${t.not_reviewed} | ${t.committed_not_indexed} | ` +
        `${t.restricted} | ${t.blocked} | ${t.governed_pct}% |`,
    );
  }
  lines.push("");
  if (report.missing_tenants.length > 0) {
    lines.push(
      `> ⚠️ Canonical tenants with NO readiness rows: ${report.missing_tenants.join(", ")}. ` +
        "Present in CANONICAL_TENANTS but no governed objects in the ledger — run the PR-3 backfill, then re-run this report.",
    );
    lines.push("");
  }
  return lines.join("\n");
}
