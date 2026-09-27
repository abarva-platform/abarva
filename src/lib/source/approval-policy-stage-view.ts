import type { StageAnalyticsView } from "@/components/source/canvas/analytics/view-model";
import { resolveSourceApprovalPolicy } from "./approval-policy";

export function applySourceApprovalPolicyToStageView(
  view: StageAnalyticsView,
  policyCode: string | null | undefined,
): StageAnalyticsView {
  const policy = resolveSourceApprovalPolicy(policyCode);
  if (!policy.selfApprovalAllowed) return view;
  return {
    ...view,
    tasks: view.stageKey === "scope"
      ? view.tasks.filter((task) => task.id !== "scope.sponsor")
      : view.tasks,
    gate: { ...view.gate, approver: "Event Owner" },
  };
}
