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
  const { rows, errors } = await loadActiveRecords(ctx, ["initiative"]);
  if (errors?.length) return { fired: false, insights: [], errors };

  const gaps = rows
    .map((row) => {
      const payload = row.payload ?? {};
      const committed = numberValue(payload, "committed_usd") ?? 0;
      const projected = numberValue(payload, "projected_value_usd");
      const status = textValue(payload, "status") ?? "";
      const gap =
        projected === null ? committed : Math.max(0, committed - projected);
      return { row, committed, projected, status, gap };
    })
    .filter(
      (item) =>
        item.committed > 0 &&
        (item.projected === null ||
          item.projected < item.committed ||
          ["at_risk", "proposed"].includes(item.status)),
    )
    .sort((a, b) => b.gap - a.gap || b.committed - a.committed)
    .slice(0, 6);

  const insights = gaps.map(({ row, committed, projected, status, gap }) => {
    const title = textValue(row.payload, "title") ?? row.title;
    const freshness = freshnessFor(row);
    return {
      clientId: ctx.clientId,
      tenantKey: ctx.tenantKey,
      headline: `${title} has ${moneyLabel(committed)} committed with value proof gap`,
      soWhat:
        projected === null
          ? `${title} has committed spend but no projected_value_usd fact in the live initiative row.`
          : `${title} is ${status || "not marked complete"} with a ${moneyLabel(gap)} gap between committed spend and projected value.`,
      domain: "Cost",
      materiality: committed >= 25_000_000 ? ("high" as const) : ("medium" as const),
      derivedFromRecordIds: [row.id],
      derivedFromFactIds: [],
      ruleId: "value-coverage-gap",
      evidence: evidenceLabel(row),
      confidence: "medium" as const,
      freshnessStatus: freshness,
      lifecycleState: "blocked_by_gap" as const,
      action: "Load value proof",
      entityName: title,
      entityType: "initiative",
    };
  });

  return { fired: insights.length > 0, insights };
}
