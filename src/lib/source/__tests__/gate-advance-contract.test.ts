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
    expect(verdict.readiness.ok).toBe(true);
  });

  it("requires computed readiness when closing the terminal stage", () => {
    const verdict = evaluateSourceGateAdvanceContract({
      currentStage: "value",
      targetStage: null,
      isTerminalClosure: true,
      confirmations: WORKED_STAGE_CONFIRMED,
      criteria: [
        criterion({
          criterionId: "GATE-VAL-01",
          fromStage: "value",
          toStage: "closed",
          state: "pending",
        }),
      ],
      reason: REVIEW_REASON,
    });

    expect(verdict.ok).toBe(false);
    expect(verdict.status).toBe(409);
    expect(verdict.error).toBe("gate_criterion_open");
  });

  // C-604. The contract used to accept `allowComputedReadinessBypass: true` and
  // return `ok` for a stage whose criteria were still open. No production route
  // ever passed it -- both the stage route and the event approval route call this
  // contract without the field -- so what was removed is the affordance, not a
  // live behaviour. These two cases drive the real contract with the field STILL
  // SET, through a cast, so reinstating the condition goes red rather than
  // silently returning to the old behaviour.
  //
  // What these two cases do NOT prove, said plainly rather than left implied: a
  // bypass reintroduced under a DIFFERENT field name would pass them, because
  // they can only send a name that exists. No test can send a field nobody has
  // written yet. The case above them -- an open criterion with confirmations and
  // no extra input at all -- is the one that catches an unconditional bypass;
  // between them the uncovered shape is exactly "a new opt-in nobody passes".
  it("has no input that converts an open gate criterion into an approval", () => {
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
      ...({ allowComputedReadinessBypass: true } as Record<string, unknown>),
    });

    expect(verdict.ok).toBe(false);
    expect(verdict.status).toBe(409);
    expect(verdict.error).toBe("gate_criterion_open");
    expect(verdict.blocker?.code).toBe("gate_criterion_open");
  });

  it("still requires human confirmations when a bypass-shaped input is sent", () => {
    const verdict = evaluateSourceGateAdvanceContract({
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
      ...({ allowComputedReadinessBypass: true } as Record<string, unknown>),
    });

    expect(verdict.ok).toBe(false);
    expect(verdict.status).toBe(422);
    expect(verdict.error).toBe("confirmations_required");
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
