import type { RuleEvaluationContext, RuleResult } from "../types";
import type { InsightFreshness } from "../types";
import {
  daysUntil,
  evidenceLabel,
  freshnessFor,
  loadActiveRecords,
  moneyLabel,
  numberValue,
  textValue,
} from "./context-records";

function isBenchmarkMissing(value: string | null | undefined): boolean {
  const normalized = String(value ?? "")
    .trim()
    .toUpperCase();
  return normalized === "" || normalized === "NO" || normalized === "FALSE";
}

export async function evaluate(
  ctx: RuleEvaluationContext,
): Promise<RuleResult> {
  const { rows, errors } = await loadActiveRecords(ctx, ["contract", "vendor"]);
  if (errors?.length) return { fired: false, insights: [], errors };

  const candidates = rows
    .map((row) => {
      const payload = row.payload ?? {};
      const renewalDate = textValue(payload, "renewal_date", "contract_end_date");
      const days = daysUntil(renewalDate);
      const benchmarkPresent = textValue(payload, "benchmark_present");
      return { row, payload, renewalDate, days, benchmarkPresent };
    })
    .filter(({ days, benchmarkPresent }) => {
      return (
        days !== null &&
        days >= 0 &&
        days <= 180 &&
        isBenchmarkMissing(benchmarkPresent)
      );
    })
    .sort((a, b) => {
      const bValue = numberValue(b.payload, "annual_value_usd", "annual_cost_usd") ?? 0;
      const aValue = numberValue(a.payload, "annual_value_usd", "annual_cost_usd") ?? 0;
      return bValue - aValue;
    })
    .slice(0, 6);

  const insights = candidates.map(({ row, payload, renewalDate, days }) => {
    const vendorName = textValue(payload, "vendor_name") ?? row.title;
    const value = moneyLabel(numberValue(payload, "annual_value_usd", "annual_cost_usd"));
    const freshness: InsightFreshness = freshnessFor(row);
    return (
      {
      clientId: ctx.clientId,
      tenantKey: ctx.tenantKey,
      headline: `${vendorName} has a ${value} renewal in ${days ?? "unknown"} days with no benchmark fact`,
      soWhat: `${vendorName} renews on ${renewalDate ?? "an unknown date"}. The live contract record has no benchmark_present fact, so sourcing leverage is weak until comparison data is loaded or approved.`,
      domain: "Vendor",
      materiality: "high" as const,
      derivedFromRecordIds: [row.id],
      derivedFromFactIds: [],
      ruleId: "renewal-window-no-benchmark",
      evidence: evidenceLabel(row),
      confidence:
        freshness === "fresh" ? ("high" as const) : ("medium" as const),
      freshnessStatus: freshness,
      lifecycleState:
        freshness === "fresh"
          ? ("active" as const)
          : ("review_required" as const),
      action: "Shape into Move",
      entityName: vendorName,
      entityType: "vendor",
      }
    );
  });

  return { fired: insights.length > 0, insights };
}
