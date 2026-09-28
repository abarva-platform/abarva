import type { StageAnalyticsView } from "@/components/source/canvas/analytics/view-model";
import { resolveSourceApprovalPolicy } from "./approval-policy";

export function applySourceApprovalPolicyToStageView(
  view: StageAnalyticsView,
  policyCode: string | null | undefined,
): StageAnalyticsView {
  const policy = resolveSourceApprovalPolicy(policyCode);
  if (!policy.selfApprovalAllowed) return view;
  const isStrategy = view.stageKey === "strategy";
  return {
    ...view,
    purpose: isStrategy ? "Confirm the sourcing mandate and decision basis before work begins." : view.purpose,
    tasks: view.stageKey === "scope"
      ? view.tasks.filter((task) => task.id !== "scope.sponsor")
      : isStrategy
        ? view.tasks.map((task) => task.id === "strategy.confirm"
          ? {
              ...task,
              title: "Confirm strategy",
              subtitle: "Mandate · value thesis",
              guide: "Review the mandate and value thesis. Confirming records your Event Owner decision; artifact review and stage approval remain separate.",
              rows: task.rows?.filter((row) => row.key !== "Sponsor"),
              cta: "Confirm strategy",
            }
          : task)
        : view.tasks,
    gate: {
      ...view.gate,
      approver: "Event Owner",
      confirms: isStrategy
        ? view.gate.confirms.map((confirm) => confirm.label === "Sponsor sign-off"
          ? { ...confirm, label: "Event Owner decision", detail: "The Event Owner confirms the strategy for this event." }
          : confirm)
        : view.gate.confirms,
      action: isStrategy && view.gate.action
        ? {
            ...view.gate.action,
            rationale: "Strategy gate confirmed by Event Owner — value target set, archetype confirmed.",
          }
        : view.gate.action,
    },
  };
}
