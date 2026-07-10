import { evaluateSourceGateAdvanceContract } from "../gate-advance-contract";
import type { SourceEventGateCriterion } from "../canvas-substrate";

const REVIEW_REASON =
  "Sponsor reviewed the evidence bundle and approves this gate.";

const WORKED_STAGE_CONFIRMED = {
  evidenceComplete: true,
  exclusionsReviewed: true,
  stageFinal: true,
};

describe("evaluateSourceGateAdvanceContract", () => {
  it("rejects a legacy-style promotion with computed readiness but no human confirmations", () => {
    const verdict = evaluateSourceGateAdvanceContract({
      currentStage: "scope",
      targetStage: "rfp",
      confirmations: {},
      criteria: [
        criterion({
          criterionId: "GATE-SCOPE-01",
          fromStage: "scope",
          toStage: "rfp",
          state: "met",
        }),
      ],
      reason: REVIEW_REASON,
    });

    expect(verdict.ok).toBe(false);
    expect(verdict.status).toBe(422);
    expect(verdict.error).toBe("confirmations_required");
    expect(verdict.missingConfirmations).toEqual([
      "evidenceComplete",
      "exclusionsReviewed",
      "stageFinal",
    ]);
  });

  it("rejects an analytics-style approval when computed readiness is not met", () => {
    const verdict = evaluateSourceGateAdvanceContract({
      currentStage: "scope",
      targetStage: "rfp",
      confirmations: WORKED_STAGE_CONFIRMED,
      criteria: [
        criterion({
          criterionId: "GATE-SCOPE-01",
          fromStage: "scope",
          toStage: "rfp",
          state: "pending",
        }),
      ],
      reason: REVIEW_REASON,
    });

    expect(verdict.ok).toBe(false);
    expect(verdict.status).toBe(409);
    expect(verdict.error).toBe("gate_criterion_open");
  });

  it("allows a stage advance only when confirmations and computed readiness both pass", () => {
    const verdict = evaluateSourceGateAdvanceContract({
      currentStage: "scope",
      targetStage: "rfp",
      confirmations: WORKED_STAGE_CONFIRMED,
      criteria: [
        criterion({
          criterionId: "GATE-SCOPE-01",
          fromStage: "scope",
          toStage: "rfp",
          state: "met",
        }),
      ],
      reason: REVIEW_REASON,
    });

    expect(verdict.ok).toBe(true);
    expect(verdict.bypassedGovernanceBlockers).toEqual([]);
  });

  it("preserves pilot computed-readiness bypass without bypassing confirmations", () => {
    const withConfirmations = evaluateSourceGateAdvanceContract({
      currentStage: "scope",
      targetStage: "rfp",
      confirmations: WORKED_STAGE_CONFIRMED,
      criteria: [
        criterion({
          criterionId: "GATE-SCOPE-01",
          fromStage: "scope",
          toStage: "rfp",
          state: "pending",
        }),
      ],
      reason: REVIEW_REASON,
      allowComputedReadinessBypass: true,
    });
    expect(withConfirmations.ok).toBe(true);
    expect(withConfirmations.bypassedGovernanceBlockers).toHaveLength(1);

    const withoutConfirmations = evaluateSourceGateAdvanceContract({
      currentStage: "scope",
      targetStage: "rfp",
      confirmations: {},
      criteria: [
        criterion({
          criterionId: "GATE-SCOPE-01",
          fromStage: "scope",
          toStage: "rfp",
          state: "pending",
        }),
      ],
      reason: REVIEW_REASON,
      allowComputedReadinessBypass: true,
    });
    expect(withoutConfirmations.ok).toBe(false);
    expect(withoutConfirmations.error).toBe("confirmations_required");
  });
});

function criterion(
  overrides: Partial<SourceEventGateCriterion> &
    Pick<SourceEventGateCriterion, "criterionId">,
): SourceEventGateCriterion {
  const { criterionId, ...rest } = overrides;
  return {
    id: `state-${criterionId}`,
    sourceEventId: "event-1",
    tenantKey: "apex-retail",
    criterionId,
    fromStage: "scope",
    toStage: "rfp",
    state: "pending",
    reviewerUserId: null,
    reviewedAt: null,
    notes: REVIEW_REASON,
    evidenceArtifactIds: [],
    waiverApprovalId: null,
    createdAt: "2026-06-01T00:00:00.000Z",
    updatedAt: "2026-06-01T00:00:00.000Z",
    ...rest,
  };
}
