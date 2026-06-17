import type { RuleEvaluationContext, RuleResult } from "../types";
import {
  boolValue,
  evidenceLabel,
  freshnessFor,
  loadActiveRecords,
  textValue,
} from "./context-records";

export async function evaluate(
  ctx: RuleEvaluationContext,
): Promise<RuleResult> {
  const { rows, errors } = await loadActiveRecords(ctx, [
    "ai_tooling_model_inventory",
  ]);
  if (errors?.length) return { fired: false, insights: [], errors };

  const riskyTools = rows
    .filter((row) => {
      const payload = row.payload ?? {};
      return (
        textValue(payload, "risk_classification") === "high" ||
        boolValue(payload, "regulated_workflow_flag")
      );
    })
    .slice(0, 6);

  const insights = riskyTools.map((row) => {
    const payload = row.payload ?? {};
    const toolName = textValue(payload, "tool_name") ?? row.title;
    const workflow = textValue(payload, "workflow") ?? "unknown workflow";
    const modelName = textValue(payload, "model_name") ?? "unknown model";
    const regulated = boolValue(payload, "regulated_workflow_flag");
    const freshness = freshnessFor(row);
    return {
      clientId: ctx.clientId,
      tenantKey: ctx.tenantKey,
      headline: `${toolName} is in a ${regulated ? "regulated" : "high-risk"} workflow without adoption/value-case facts`,
      soWhat: `${toolName} is mapped to ${workflow} on ${modelName}, but the live record does not include active_users_pct or value_case_assumption. The value case cannot be trusted until usage and assumption facts are loaded.`,
      domain: "AI Value",
      materiality: "high" as const,
      derivedFromRecordIds: [row.id],
      derivedFromFactIds: [],
      ruleId: "adoption-below-value-case",
      evidence: evidenceLabel(row),
      confidence: freshness === "fresh" ? ("high" as const) : ("medium" as const),
      freshnessStatus: freshness,
      lifecycleState: "blocked_by_gap" as const,
      action: "Load adoption proof",
      entityName: toolName,
      entityType: "ai_tool",
    };
  });

  return { fired: insights.length > 0, insights };
}
