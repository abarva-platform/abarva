import { readinessForEvent } from "./step-readiness-adapter";

const base = {
  currentStage: "intake",
  lifecycle: "awaiting_intake_review",
  requestAuthorityVersionId: "ver-1",
  requesterId: "user-requester",
  decisionOwner: "user-owner",
  trigger: "Three managed-service contracts expire in March.",
  category: "ams",
  asOfDate: "2026-10-04",
  requestVersionApproval: { status: "pending", missing: [] } as const,
};

describe("readinessForEvent", () => {
  it("reports needs_work and names the missing requirement when the owner is absent", () => {
    const r = readinessForEvent({ ...base, decisionOwner: null });
    expect(r?.status).toBe("needs_work");
    expect(r?.nextAction.disabled).toBe(true);
    expect(r?.nextAction.disabledReason).toContain("Name the business owner");
  });

  it("enables the action when every requirement is met and the request is not yet accepted", () => {
    const r = readinessForEvent(base);
    expect(r?.status).toBe("ready_to_submit");
    // The negative control for the disabled computation: if this ever reads true,
    // the other cases prove nothing because the button would always be disabled.
    expect(r?.nextAction.disabled).toBe(false);
    expect(r?.nextAction.label).toBe("Accept for planning");
  });

  it("reports complete once the current version is accepted by a named person", () => {
    const r = readinessForEvent({
      ...base,
      requestVersionApproval: { status: "accepted", acceptedBy: "user-owner" },
    });
    expect(r?.status).toBe("complete");
    expect(r?.nextAction.label).toBe("Continue to Define");
  });

  it("returns null for a stage this model does not cover, so the caller can fall back", () => {
    expect(readinessForEvent({ ...base, currentStage: "bafo", lifecycle: "active" })).toBeNull();
  });

  it("carries a reviewer's blockers as a hold, not as missing fields", () => {
    const r = readinessForEvent({
      ...base,
      requestVersionApproval: {
        status: "changes_requested",
        blockers: ["Name the clinical owner before this advances"],
      },
    });
    expect(r?.status).toBe("blocked");
    expect(r?.unmetRequirements).toContain("Name the clinical owner before this advances");
    expect(r?.nextAction.disabled).toBe(true);
  });

  it("blocks rather than advances when the authority version is absent", () => {
    const r = readinessForEvent({ ...base, requestAuthorityVersionId: null });
    expect(r?.status).toBe("needs_work");
    expect(r?.nextAction.disabled).toBe(true);
    expect(r?.unmetRequirements).toContain("Identify the request version");
  });
});
