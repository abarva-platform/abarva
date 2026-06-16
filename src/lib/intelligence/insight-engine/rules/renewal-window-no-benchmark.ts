import type { RuleEvaluationContext, RuleResult } from "../types";
import type { InsightFreshness } from "../types";

interface VendorRenewalRow {
  tenant_key: string;
  record_id: string;
  vendor_name: string;
  contract_end_date: string | null;
  auto_renew: string | null;
  notice_period_days: string | null;
  benchmark_present: string | null;
  annual_value_usd: string | null;
  freshness_status: string | null;
}

function isYes(value: string | null | undefined): boolean {
  return (
    String(value ?? "")
      .trim()
      .toUpperCase() === "YES"
  );
}

function isBenchmarkMissing(value: string | null | undefined): boolean {
  const normalized = String(value ?? "")
    .trim()
    .toUpperCase();
  return normalized === "" || normalized === "NO" || normalized === "FALSE";
}

function daysUntil(dateText: string | null): number | null {
  if (!dateText) return null;
  const timestamp = Date.parse(dateText);
  if (!Number.isFinite(timestamp)) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((timestamp - today.getTime()) / 86_400_000);
}

function moneyLabel(raw: string | null): string {
  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0) return "material";
  if (value >= 1_000_000)
    return `$${(value / 1_000_000).toFixed(value >= 10_000_000 ? 0 : 1)}M`;
  if (value >= 1_000) return `$${Math.round(value / 1_000)}k`;
  return `$${value.toLocaleString()}`;
}

export async function evaluate(
  ctx: RuleEvaluationContext,
): Promise<RuleResult> {
  const result = await ctx.db
    .from<VendorRenewalRow[]>("v_context_vendor_renewals")
    .select(
      "tenant_key,record_id,vendor_name,contract_end_date,auto_renew,notice_period_days,benchmark_present,annual_value_usd,freshness_status",
    )
    .eq("tenant_key", ctx.tenantKey)
    .limit(500);

  if (result.error) {
    return { fired: false, insights: [], errors: [result.error.message] };
  }

  const rows = (result.data ?? []).filter((row) => {
    const days = daysUntil(row.contract_end_date);
    return (
      days !== null &&
      days >= 0 &&
      days <= 120 &&
      isYes(row.auto_renew) &&
      isBenchmarkMissing(row.benchmark_present)
    );
  });

  const insights = rows.map((row) => {
    const days = daysUntil(row.contract_end_date) ?? 0;
    const value = moneyLabel(row.annual_value_usd);
    const freshness: InsightFreshness =
      row.freshness_status === "fresh" ? "fresh" : "attention";
    return {
      clientId: ctx.clientId,
      tenantKey: ctx.tenantKey,
      headline: `You're about to auto-renew a ${value} ${row.vendor_name} contract with no benchmark`,
      soWhat: `${row.vendor_name} auto-renews ${days}d from now. The vendor benchmark dimension is not present, so negotiation leverage is weak unless the missing comparison data is loaded or approved.`,
      domain: "Vendor",
      materiality: "high" as const,
      derivedFromRecordIds: [row.record_id],
      derivedFromFactIds: [],
      ruleId: "renewal-window-no-benchmark",
      evidence: `Vendor Contracts · ${row.contract_end_date ?? "unknown renewal date"}`,
      confidence:
        freshness === "fresh" ? ("high" as const) : ("medium" as const),
      freshnessStatus: freshness,
      lifecycleState:
        freshness === "fresh"
          ? ("active" as const)
          : ("review_required" as const),
      action: "Shape into Move",
      entityName: row.vendor_name,
      entityType: "vendor",
    };
  });

  return { fired: insights.length > 0, insights };
}
