import type { ApprovalsInboxItem } from "@/lib/source/approvals-inbox";
import { buildApprovalWorkspaceDecisions } from "@/lib/source/approval-workspace-decisions";

const item = (
  overrides: Partial<ApprovalsInboxItem> = {},
): ApprovalsInboxItem => ({
  kind: "stage_gate",
  eventId: "evt-1",
  eventCode: "SRC-APPROVAL-2026",
  eventName: "Sourcing event",
  ask: "Approve advancing out of Scope.",
  readiness: "All 7 gate items met - ready to approve.",
  status: "ready",
  stageKey: "scope",
  stageLabel: "Scope",
  estimatedValueUsd: null,
  href: "/source/events/evt-1?stage=scope&workspace=approvals",
  actionLabel: "Approve now",
  versionKey: "evt-1:scope",
  versionLabel: "Scope",
  requiredReviewerRole: "Source stage approver",
  ...overrides,
});

function decision(
  overrides: Parameters<typeof buildApprovalWorkspaceDecisions>[0],
) {
  return buildApprovalWorkspaceDecisions(overrides)[0]!.decisions[0]!;
}

const base = {
  eventId: "evt-1",
  eventCode: "SRC-APPROVAL-2026",
  eventName: "Sourcing event",
  currentStageKey: "scope",
  stageLabel: "Scope",
  currentStageItem: item(),
  approvalRecorded: false,
  workflowComplete: true,
  artifactsReady: true,
  gateActionArmed: true,
  approvalRationale: "Reviewed evidence and approved the current gate.",
};

describe("buildApprovalWorkspaceDecisions", () => {
  it("blocks a stale event/version binding", () => {
    const result = decision({
      ...base,
      currentStageItem: item({
        stageKey: "rfp",
        stageLabel: "RFP",
        versionKey: "evt-1:rfp",
        versionLabel: "RFP",
      }),
    });

    expect(result.status).toBe("blocked");
    expect(result.primaryAction.enabled).toBe(false);
    expect(result.blockers.map((blocker) => blocker.code)).toContain(
      "stale_version",
    );
  });

  it("fails closed when no authoritative version binding is available", () => {
    const result = decision({
      ...base,
      currentStageItem: item({ versionKey: null, versionLabel: null }),
    });

    expect(result.status).toBe("blocked");
    expect(result.primaryAction.enabled).toBe(false);
    expect(result.blockers.map((blocker) => blocker.code)).toContain(
      "stale_version",
    );
    expect(result.blockers[0]?.detail).toMatch(/No authoritative/i);
  });

  it("blocks when the reviewer role is missing", () => {
    const result = decision({
      ...base,
      currentStageItem: item({ requiredReviewerRole: "" }),
    });

    expect(result.status).toBe("blocked");
    expect(result.primaryAction.enabled).toBe(false);
    expect(result.blockers.map((blocker) => blocker.code)).toContain(
      "reviewer_role_missing",
    );
  });

  it("blocks an armed action with insufficient rationale", () => {
    const result = decision({
      ...base,
      approvalRationale: "short",
    });

    expect(result.status).toBe("blocked");
    expect(result.primaryAction.enabled).toBe(false);
    expect(result.blockers.map((blocker) => blocker.code)).toContain(
      "approval_reason_required",
    );
  });

  it("blocks an unauthorized viewer even when the decision looks ready", () => {
    const result = decision({
      ...base,
      gateActionArmed: false,
    });

    expect(result.status).toBe("blocked");
    expect(result.primaryAction.enabled).toBe(false);
    expect(result.blockers.map((blocker) => blocker.code)).toContain(
      "unauthorized_viewer",
    );
  });

  it("enables exactly one primary action when the readiness contract is satisfied", () => {
    const group = buildApprovalWorkspaceDecisions(base)[0]!;
    const enabledActions = group.decisions.filter(
      (row) => row.primaryAction.enabled,
    );

    expect(group.key).toBe("evt-1:evt-1:scope");
    expect(group.versionLabel).toBe("Scope");
    expect(enabledActions).toHaveLength(1);
    expect(enabledActions[0]).toMatchObject({
      status: "ready",
      primaryAction: { label: "Approve now", enabled: true },
    });
  });
});
