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

  const materialClaims = rows
    .map((row) => {
      const payload = row.payload ?? {};
      const committed = numberValue(payload, "committed_usd") ?? 0;
      const status = textValue(payload, "status") ?? "";
      return { row, committed, status };
    })
    .filter(
      ({ committed, status }) =>
        committed >= 25_000_000 && ["at_risk", "proposed"].includes(status),
    )
    .sort((a, b) => b.committed - a.committed)
    .slice(0, 4);

  const insights = materialClaims.map(({ row, committed, status }) => {
    const payload = row.payload ?? {};
    const title = textValue(payload, "title") ?? row.title;
    const sponsor = textValue(payload, "sponsor_role") ?? "unknown sponsor";
    const freshness = freshnessFor(row);
    return {
      clientId: ctx.clientId,
      tenantKey: ctx.tenantKey,
      headline: `${title} is a material ${status.replace(/_/g, " ")} initiative needing decision proof`,
      soWhat: `${title} carries ${moneyLabel(committed)} of committed spend under ${sponsor}. It is not decision-grade until the missing approval/value evidence is loaded or reviewed.`,
      domain: "Strategy",
      materiality: "high" as const,
      derivedFromRecordIds: [row.id],
      derivedFromFactIds: [],
      ruleId: "material-claim-unapproved",
      evidence: evidenceLabel(row),
      confidence: "medium" as const,
      freshnessStatus: freshness,
      lifecycleState: "review_required" as const,
      action: "Review claim",
      entityName: title,
      entityType: "initiative",
    };
  });

  return { fired: insights.length > 0, insights };
}
