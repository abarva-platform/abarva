import {
  buildApprovalPatternReviewReport,
  type ApprovalDecisionEvent,
} from "../approval-pattern-review";

function approval(overrides: Partial<ApprovalDecisionEvent>): ApprovalDecisionEvent {
  return {
    approvalId: "approval-1",
    tenantKey: "apexretail",
    reviewerUserId: "user-1",
    reviewerLabel: "Finance Reviewer",
    module: "moves",
    action: "approved",
    requestedAt: "2026-04-01T12:00:00.000Z",
    decidedAt: "2026-04-01T12:02:00.000Z",
    rationale: "Reviewed evidence, assumptions, and alternatives.",
    evidenceIds: ["ev-1"],
    highRisk: false,
    ...overrides,
  };
}

describe("approval pattern review", () => {
  it("flags high-risk approvals decided too quickly", () => {
    const report = buildApprovalPatternReviewReport({
      periodStart: "2026-04-01",
      periodEnd: "2026-06-30",
      generatedAt: "2026-07-01T00:00:00.000Z",
      events: [
        approval({
          approvalId: "approval-fast-high-risk",
          highRisk: true,
          requestedAt: "2026-04-01T12:00:00.000Z",
          decidedAt: "2026-04-01T12:00:08.000Z",
        }),
      ],
    });

    expect(report.totalFlags).toBe(1);
    expect(report.eventFlags[0]).toMatchObject({
      approvalId: "approval-fast-high-risk",
      severity: "critical",
      code: "high_risk_fast_approval",
    });
    expect(report.criticalReviewerCount).toBe(1);
    expect(report.escalationSummary).toMatch(/tenant-admin and AbarVa review/);
  });

  it("flags thin rationale and missing evidence on approved decisions", () => {
    const report = buildApprovalPatternReviewReport({
      periodStart: "2026-04-01",
      periodEnd: "2026-06-30",
      events: [
        approval({
          approvalId: "approval-thin",
          rationale: "ok",
          evidenceIds: [],
        }),
      ],
    });

    expect(report.eventFlags.map((flag) => flag.code).sort()).toEqual([
      "missing_evidence",
      "thin_rationale",
    ]);
    expect(report.reviewerSummaries[0]).toMatchObject({
      missingEvidenceCount: 1,
      thinRationaleCount: 1,
      severity: "info",
    });
  });

  it("escalates reviewers with repeated fast approval patterns", () => {
    const events = [1, 2, 3, 4].map((n) =>
      approval({
        approvalId: `approval-${n}`,
        reviewerUserId: "rubber-stamp-user",
        reviewerLabel: "Fast Approver",
        requestedAt: `2026-04-0${n}T12:00:00.000Z`,
        decidedAt: `2026-04-0${n}T12:00:10.000Z`,
      }),
    );

    const report = buildApprovalPatternReviewReport({
      periodStart: "2026-04-01",
      periodEnd: "2026-06-30",
      events,
    });

    expect(report.reviewerSummaries[0]).toMatchObject({
      reviewerUserId: "rubber-stamp-user",
      totalDecisions: 4,
      fastApprovalCount: 4,
      fastApprovalRate: 1,
      severity: "warning",
      flags: ["fast_approval_rate_exceeds_threshold"],
    });
  });

  it("keeps careful reviewers informational", () => {
    const report = buildApprovalPatternReviewReport({
      periodStart: "2026-04-01",
      periodEnd: "2026-06-30",
      events: [
        approval({
          approvalId: "approval-careful",
          requestedAt: "2026-04-01T12:00:00.000Z",
          decidedAt: "2026-04-01T12:04:00.000Z",
        }),
        approval({
          approvalId: "request-more-evidence",
          action: "more_evidence_requested",
          rationale: null,
          evidenceIds: [],
        }),
      ],
    });

    expect(report.totalFlags).toBe(0);
    expect(report.reviewerSummaries[0]).toMatchObject({
      severity: "info",
      approvalCount: 1,
      medianDecisionSeconds: 180,
    });
    expect(report.escalationSummary).toMatch(/No critical reviewer pattern/);
  });
});
