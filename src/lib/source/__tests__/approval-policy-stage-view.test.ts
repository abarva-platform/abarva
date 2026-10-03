import { SAMPLE_SCOPE_STAGE } from "@/components/source/canvas/analytics/sample-view-model";
import { SAMPLE_STRATEGY_STAGE } from "@/components/source/canvas/analytics/strategy-sample-view-model";
import { applySourceApprovalPolicyToStageView } from "../approval-policy-stage-view";

describe("Source approval policy stage view", () => {
  it("presents Strategy as an Event Owner decision without sponsor sign-off for SELF", () => {
    const strategy = {
      ...SAMPLE_STRATEGY_STAGE,
      gate: {
        ...SAMPLE_STRATEGY_STAGE.gate,
        action: {
          eventId: "event-1",
          rationale: "Strategy gate confirmed — sponsor sign-off, value target set, archetype confirmed.",
          confirmationKeys: ["strategyMemoReviewed", "valueTargetConfirmed", "archetypeRigorConfirmed"],
        },
      },
    };
    const view = applySourceApprovalPolicyToStageView(strategy, "self_v1");
    const task = view.tasks.find((item) => item.id === "strategy.confirm");
    expect(task?.title).toBe("Confirm strategy");
    expect(task?.cta).toBe("Confirm strategy");
    expect(task?.guide).not.toMatch(/sponsor/i);
    expect(task?.rows?.some((row) => row.key === "Sponsor")).toBe(false);
    expect(view.purpose).not.toMatch(/sponsor/i);
    expect(view.gate.approver).toBe("Event Owner");
    expect(view.gate.confirms[0].label).toBe("Event Owner decision");
    expect(view.gate.confirms).toHaveLength(3);
    expect(view.gate.action?.rationale).not.toMatch(/sponsor sign-off/i);
    expect(applySourceApprovalPolicyToStageView(SAMPLE_STRATEGY_STAGE, null)).toBe(SAMPLE_STRATEGY_STAGE);
  });

  it("replaces the sponsor-signature checklist dependency for an explicit SELF event", () => {
    const view = applySourceApprovalPolicyToStageView(SAMPLE_SCOPE_STAGE, "self_v1");
    expect(view.tasks.some((task) => task.id === "scope.sponsor")).toBe(false);
    expect(view.tasks.map((task) => task.id)).toEqual(
      SAMPLE_SCOPE_STAGE.tasks.filter((task) => task.id !== "scope.sponsor").map((task) => task.id),
    );
    expect(view.gate.approver).toBe("Event Owner");
  });

  it("preserves the historical signed-scope view when policy is missing", () => {
    expect(applySourceApprovalPolicyToStageView(SAMPLE_SCOPE_STAGE, null)).toBe(SAMPLE_SCOPE_STAGE);
  });

  it("fails closed instead of treating an unknown policy as SELF", () => {
    expect(() => applySourceApprovalPolicyToStageView(SAMPLE_SCOPE_STAGE, "unknown")).toThrow(
      "Unknown Source approval policy",
    );
  });
});
