// PR-P1 · Pure aggregation + markdown rendering for the promotion preview.
// No I/O, no server-only — safe to import anywhere (script, test, local render).
import type { PromotionEvaluation } from "./promotion-evaluator";
import { CANONICAL_TENANTS } from "@/config/tenants/CANONICAL_TENANTS";

// Derive the SkyHarbor canonical key from the canonical source (never hand-typed).
const SKY_KEY =
  CANONICAL_TENANTS.find((t) => /sky\s?harbor/i.test(t.name))?.key ?? "";

export interface PreviewData {
  total: number;
  byTenant: Record<string, number>;
  byObjectType: Record<string, number>;
  byRecommendation: Record<string, number>;
  byTenantRecommendation: Record<string, Record<string, number>>;
  failureReasons: Record<string, number>;
  skyharbor: { total: number; byRecommendation: Record<string, number>; byObjectType: Record<string, number> };
  topPromote: Array<Pick<PromotionEvaluation, "object_table" | "object_id" | "client_key" | "source_layer">>;
  topBlocked: Array<Pick<PromotionEvaluation, "object_table" | "object_id" | "client_key" | "recommendation"> & { reason: string }>;
}


/** Pure aggregation over evaluated rows. */
export function buildPreviewData(evals: PromotionEvaluation[]): PreviewData {
  const inc = (m: Record<string, number>, k: string) => (m[k] = (m[k] ?? 0) + 1);
  const d: PreviewData = {
    total: evals.length,
    byTenant: {}, byObjectType: {}, byRecommendation: {}, byTenantRecommendation: {},
    failureReasons: {},
    skyharbor: { total: 0, byRecommendation: {}, byObjectType: {} },
    topPromote: [], topBlocked: [],
  };
  for (const e of evals) {
    inc(d.byTenant, e.client_key);
    inc(d.byObjectType, e.object_table);
    inc(d.byRecommendation, e.recommendation);
    (d.byTenantRecommendation[e.client_key] ??= {});
    inc(d.byTenantRecommendation[e.client_key], e.recommendation);
    for (const r of e.failure_reasons) {
      const key = r.replace(/"[^"]*"/g, '"…"').replace(/=\w+/g, "=…").replace(/CHG-MH-\d+|row-\d+/g, "…");
      inc(d.failureReasons, key);
    }
    if (e.client_key === SKY_KEY) {
      d.skyharbor.total += 1;
      inc(d.skyharbor.byRecommendation, e.recommendation);
      inc(d.skyharbor.byObjectType, e.object_table);
    }
    // WS-F: the rows eligible to be promoted are promotion_candidates (every
    // criterion met, awaiting governed sign-off). agent_ready rows are already
    // promoted, so they are not re-listed as promotion targets.
    if (e.recommendation === "promotion_candidate" && d.topPromote.length < 25)
      d.topPromote.push({ object_table: e.object_table, object_id: e.object_id, client_key: e.client_key, source_layer: e.source_layer });
    if (e.recommendation === "blocked" && d.topBlocked.length < 25)
      d.topBlocked.push({ object_table: e.object_table, object_id: e.object_id, client_key: e.client_key, recommendation: e.recommendation, reason: e.failure_reasons[0] ?? "" });
  }
  return d;
}

export function renderPreviewMarkdown(d: PreviewData, generatedAt: string): string {
  const rows = (m: Record<string, number>) =>
    Object.entries(m).sort((a, b) => b[1] - a[1]).map(([k, v]) => `| ${k} | ${v} |`).join("\n");
  const L: string[] = [];
  L.push("# Agent-Ready Promotion Preview (PR-P1 · read-only) — 2026-05-09");
  L.push("");
  L.push(`> Generated ${generatedAt} by \`src/scripts/governance/promotion-preview.ts\` over the`);
  L.push("> `governed_object_readiness` sidecar. **READ-ONLY: no source rows mutated, no promotions performed.**");
  L.push("> Recommendations mirror `evaluateGovernedObject` / `computeProposedReadiness`. agent_ready is an");
  L.push("> earned, evidenced transition (PR-P2) — never automatic.");
  L.push("");
  L.push(`## Totals\n\n- **Total rows evaluated: ${d.total}**\n`);
  L.push("## By recommendation\n\n| Recommendation | Count |\n|---|---:|\n" + rows(d.byRecommendation) + "\n");
  L.push("## By tenant / client\n\n| Client | Count |\n|---|---:|\n" + rows(d.byTenant) + "\n");
  L.push("## By object type\n\n| Object table | Count |\n|---|---:|\n" + rows(d.byObjectType) + "\n");
  L.push("## Recommendation by tenant\n\n| Client | agent_ready | promotion_candidate | restricted | blocked | remain_not_reviewed |\n|---|---:|---:|---:|---:|---:|");
  for (const [c, m] of Object.entries(d.byTenantRecommendation).sort()) {
    L.push(`| ${c} | ${m.agent_ready ?? 0} | ${m.promotion_candidate ?? 0} | ${m.restricted ?? 0} | ${m.blocked ?? 0} | ${m.remain_not_reviewed ?? 0} |`);
  }
  L.push("");
  L.push("## Failure reasons (why rows are not agent_ready)\n\n| Reason | Count |\n|---|---:|\n" + rows(d.failureReasons) + "\n");
  L.push("## SkyHarbor Air (tenant-specific)\n");
  L.push(`- Rows: **${d.skyharbor.total}**`);
  L.push("- By recommendation:\n\n| Recommendation | Count |\n|---|---:|\n" + rows(d.skyharbor.byRecommendation));
  L.push("\n- By object type:\n\n| Object table | Count |\n|---|---:|\n" + rows(d.skyharbor.byObjectType) + "\n");
  L.push(`## Top ${d.topPromote.length} promotion candidates (eligible — awaiting governed sign-off)\n`);
  L.push("| Object table | Object id | Client | Source layer |\n|---|---|---|---|");
  for (const r of d.topPromote) L.push(`| ${r.object_table} | ${r.object_id} | ${r.client_key} | ${r.source_layer} |`);
  if (d.topPromote.length === 0) L.push("| _(none — no row currently clears every criterion incl. the cite-render gate)_ | | | |");
  L.push("");
  L.push(`## Top ${d.topBlocked.length} blocked rows with reasons\n`);
  L.push("| Object table | Object id | Client | Reason |\n|---|---|---|---|");
  for (const r of d.topBlocked) L.push(`| ${r.object_table} | ${r.object_id} | ${r.client_key} | ${r.reason} |`);
  if (d.topBlocked.length === 0) L.push("| _(none blocked)_ | | | |");
  L.push("");
  L.push("## SQL / update plan PR-P2 WOULD use (NOT executed here)\n");
  L.push("Promotion is gated, stamped, reversible. For each row the evaluator returns `promotion_candidate`");
  L.push("(every required criterion true, not yet approved), the governed promotion runs inside a");
  L.push("transaction, idempotent, capturing the reverse statement first. agent_ready is reached only");
  L.push("through this step — never directly from ingestion. Never promotes restricted/blocked/quarantined/PHI/PII rows.");
  L.push("");
  L.push("```sql");
  L.push("-- forward (only rows passing ALL criteria)");
  L.push("UPDATE public.governed_object_readiness");
  L.push("   SET agent_readiness_status = 'agent_ready', policy_version = $1,");
  L.push("       promoted_at = now(), promoted_by_job = $2,");
  L.push("       promotion_reason = 'grounded, retrievable, cite-render-verified'");
  L.push(" WHERE id = $3 AND agent_readiness_status = 'not_reviewed'");
  L.push("   AND cited_render_verified_at IS NOT NULL");
  L.push("   AND retrievability IN ('fts_indexed','search_indexed')");
  L.push("   AND source_basis IS NOT NULL AND confidence_level IS NOT NULL;");
  L.push("-- reverse (captured per row before forward)");
  L.push("UPDATE public.governed_object_readiness SET agent_readiness_status = 'not_reviewed',");
  L.push("       promoted_at = NULL, promoted_by_job = NULL, promotion_reason = NULL WHERE id = $1;");
  L.push("```");
  L.push("");
  L.push("`promoted_at` / `promoted_by_job` / `promotion_reason` columns are added by the PR-P2 migration;");
  L.push("they do not exist yet (this preview performs no DDL and no writes).");
  return L.join("\n") + "\n";
}
