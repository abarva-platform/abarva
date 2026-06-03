import {
  evaluateSetupAiGovernanceRequest,
  summarizeSetupAiGovernance,
  type SetupAiGovernanceRequest,
} from "../setup-ai-governance";

function request(overrides: Partial<SetupAiGovernanceRequest>): SetupAiGovernanceRequest {
  return {
    id: "setup-ai-1",
    backlogId: "T244",
    tenantKey: "apexretail",
    domain: "tenant_configuration",
    aiSummary: "Suggest enabling stricter approval policy for Source awards.",
    evidenceIds: ["ev-1"],
    detectedAt: "2026-06-03T12:00:00.000Z",
    state: "admin_review_required",
    adminUserId: null,
    adminReason: null,
    triageAcknowledgedAt: null,
    ...overrides,
  };
}

describe("setup AI governance", () => {
  it("blocks AI-suggested tenant config changes without admin approval and reason", () => {
    const decision = evaluateSetupAiGovernanceRequest(request({ backlogId: "T244" }));

    expect(decision.canApply).toBe(false);
    expect(decision.missing).toEqual([
      "admin_approval",
      "admin_user_id",
      "admin_reason",
    ]);
    expect(decision.requiredHumanAction).toMatch(/Admin approval/);
  });

  it("allows setup config application only after approval evidence is complete", () => {
    const decision = evaluateSetupAiGovernanceRequest(
      request({
        backlogId: "T244",
        state: "approved",
        adminUserId: "admin-1",
        adminReason: "Matches the approved pilot policy for Source awards.",
      }),
    );

    expect(decision.canApply).toBe(true);
    expect(decision.canRemediate).toBe(false);
    expect(decision.missing).toEqual([]);
    expect(decision.auditEvidence).toContain("admin_reason");
  });

  it("blocks AI-detected anomaly remediation until human triage acknowledgement is complete", () => {
    const decision = evaluateSetupAiGovernanceRequest(
      request({
        backlogId: "T245",
        domain: "anomaly_remediation",
        state: "admin_review_required",
      }),
    );

    expect(decision.canRemediate).toBe(false);
    expect(decision.missing).toEqual([
      "triage_acknowledgement",
      "triage_admin_user_id",
      "triage_reason",
      "triage_acknowledged_at",
    ]);
    expect(decision.requiredHumanAction).toMatch(/Human triage acknowledgement/);
  });

  it("summarizes blocked approval and triage queues", () => {
    const summary = summarizeSetupAiGovernance([
      request({ id: "approval-blocked", backlogId: "T244" }),
      request({
        id: "triage-ready",
        backlogId: "T245",
        domain: "anomaly_remediation",
        state: "triage_acknowledged",
        adminUserId: "admin-1",
        adminReason: "Confirmed the anomaly is a duplicate field mapping.",
        triageAcknowledgedAt: "2026-06-03T13:00:00.000Z",
      }),
    ]);

    expect(summary).toMatchObject({
      total: 2,
      blockedTotal: 1,
      readyToApplyTotal: 1,
      approvalRequiredTotal: 1,
      triageRequiredTotal: 0,
    });
  });
});
