import type { RuleEvaluationContext, RuleResult } from "../types";
import {
  evidenceLabel,
  freshnessFor,
  loadActiveRecords,
  moneyLabel,
  numberValue,
  textValue,
} from "./context-records";

export async function evaluate(
  ctx: RuleEvaluationContext,
): Promise<RuleResult> {
  const { rows, errors } = await loadActiveRecords(ctx, ["service_level"]);
  if (errors?.length) return { fired: false, insights: [], errors };

  const breached = rows
    .map((row) => {
      const payload = row.payload ?? {};
      return {
        row,
        breachCount: numberValue(payload, "breach_count") ?? 0,
        creditAtRisk: numberValue(payload, "credit_at_risk_usd") ?? 0,
      };
    })
    .filter((item) => item.breachCount > 0)
    .sort(
      (a, b) =>
        b.creditAtRisk - a.creditAtRisk || b.breachCount - a.breachCount,
    )
    .slice(0, 6);

  const insights = breached.map(({ row, breachCount, creditAtRisk }) => {
    const payload = row.payload ?? {};
    const serviceName = textValue(payload, "service_name") ?? row.title;
    const metric = textValue(payload, "metric") ?? "SLA metric";
    const actual = textValue(payload, "actual") ?? "unknown actual";
    const target = textValue(payload, "target") ?? "unknown target";
    const freshness = freshnessFor(row);
    return {
      clientId: ctx.clientId,
      tenantKey: ctx.tenantKey,
      headline: `${serviceName} is breaching ${metric} with ${moneyLabel(creditAtRisk)} at risk`,
      soWhat: `${serviceName} has ${breachCount} breach${breachCount === 1 ? "" : "es"} against ${metric}: actual ${actual}, target ${target}. This is a live service-quality issue, not a fixture card.`,
      domain: "Service",
      materiality: creditAtRisk >= 500_000 ? ("high" as const) : ("medium" as const),
      derivedFromRecordIds: [row.id],
      derivedFromFactIds: [],
      ruleId: "sla-breach-worsening",
      evidence: evidenceLabel(row),
      confidence: freshness === "fresh" ? ("high" as const) : ("medium" as const),
      freshnessStatus: freshness,
      lifecycleState: freshness === "fresh" ? ("active" as const) : ("review_required" as const),
      action: "Open service review",
      entityName: serviceName,
      entityType: "service",
    };
  });

  return { fired: insights.length > 0, insights };
}
