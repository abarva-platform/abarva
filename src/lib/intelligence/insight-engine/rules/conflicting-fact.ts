import type { RuleEvaluationContext, RuleResult } from "../types";
import {
  evidenceLabel,
  freshnessFor,
  loadActiveRecords,
  numberValue,
  textValue,
} from "./context-records";

export async function evaluate(
  ctx: RuleEvaluationContext,
): Promise<RuleResult> {
  const { rows, errors } = await loadActiveRecords(ctx, ["cmdb_application"], 800);
  if (errors?.length) return { fired: false, insights: [], errors };

  const splitOwnership = rows
    .filter((row) => {
      const payload = row.payload ?? {};
      return (
        textValue(payload, "criticality") === "tier1" &&
        textValue(payload, "ams_vendor") &&
        textValue(payload, "ams_vendor") !== "Internal" &&
        textValue(payload, "owner_role")
      );
    })
    .map((row) => ({
      row,
      annualRunCost:
        numberValue(row.payload, "annual_run_cost_usd", "annual_cost_usd") ?? 0,
    }))
    .sort((a, b) => b.annualRunCost - a.annualRunCost)
    .slice(0, 6);

  const insights = splitOwnership.map(({ row }) => {
    const payload = row.payload ?? {};
    const appName = textValue(payload, "name") ?? row.title;
    const owner = textValue(payload, "owner_role") ?? "unknown owner";
    const vendor = textValue(payload, "ams_vendor") ?? "unknown vendor";
    const systemOfRecord =
      textValue(payload, "system_of_record") ?? "unknown system of record";
    const freshness = freshnessFor(row);
    return {
      clientId: ctx.clientId,
      tenantKey: ctx.tenantKey,
      headline: `${appName} has split ownership across ${owner} and ${vendor}`,
      soWhat: `${appName} is tier1, owned by ${owner}, operated by ${vendor}, and tracked in ${systemOfRecord}. That split needs explicit accountability before move or renewal decisions.`,
      domain: "Data quality",
      materiality: "medium" as const,
      derivedFromRecordIds: [row.id],
      derivedFromFactIds: [],
      ruleId: "conflicting-fact",
      evidence: evidenceLabel(row),
      confidence: freshness === "fresh" ? ("high" as const) : ("medium" as const),
      freshnessStatus: freshness,
      lifecycleState: "active" as const,
      action: "Reconcile ownership",
      entityName: appName,
      entityType: "application",
    };
  });

  return { fired: insights.length > 0, insights };
}
