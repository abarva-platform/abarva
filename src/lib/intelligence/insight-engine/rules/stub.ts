import type { RuleEvaluationContext, RuleResult } from "../types";

export async function evaluateNoop(
  _ctx: RuleEvaluationContext,
): Promise<RuleResult> {
  void _ctx;
  return { fired: false, insights: [] };
}
