import { SAMPLE_SCOPE_STAGE } from "@/components/source/canvas/analytics/sample-view-model";
import { applySourceApprovalPolicyToStageView } from "../approval-policy-stage-view";

describe("Source approval policy stage view", () => {
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
