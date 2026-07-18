import {
  evaluateCriterionMetReadiness,
  evaluateStagePromotionReadiness,
  isArtifactHumanReviewed,
  validateApprovalReason,
  verifiedGateCriterionForDisplay,
} from "../source-governance-enforcement";
import type {
  SourceEventArtifactState,
  SourceEventEvidence,
  SourceEventGateCriterion,
} from "../canvas-substrate";

const REVIEW_REASON =
  "Sponsor reviewed the evidence bundle and approves this gate.";

describe("Source governance enforcement", () => {
  it("requires a meaningful human approval reason", () => {
    expect(validateApprovalReason("").ok).toBe(false);
    expect(validateApprovalReason("ok").ok).toBe(false);
    expect(validateApprovalReason(REVIEW_REASON).ok).toBe(true);
  });

  it("blocks marking a gate met when linked artifacts are empty stubs", () => {
    const verdict = evaluateCriterionMetReadiness({
      criterion: criterion({ criterionId: "GATE-STRATEGY-01" }),
      artifacts: [
        artifact({
          artifactCode: "d01_strategy_memo",
          status: "not_started",
          body: null,
        }),
      ],
      evidence: strategyEvidenceReady(),
      reason: REVIEW_REASON,
    });

    expect(verdict.ok).toBe(false);
    expect(verdict.blockers.map((blocker) => blocker.code)).toContain(
      "linked_artifact_not_committed",
    );
  });

  it("blocks marking a gate met when required evidence is not ready", () => {
    const verdict = evaluateCriterionMetReadiness({
      criterion: criterion({ criterionId: "GATE-STRATEGY-01" }),
      artifacts: [
        artifact({
          artifactCode: "d01_strategy_memo",
          status: "approved",
          body: "Approved strategy memo body.",
        }),
      ],
      evidence: [
        evidence({
          requirementId: "EVID-SRC-STR-INCUMBENT",
          currentState: "Not Requested",
        }),
        evidence({
          requirementId: "EVID-SRC-STR-SPONSOR-COMMIT",
          currentState: "Loaded",
        }),
      ],
      reason: REVIEW_REASON,
    });

    expect(verdict.ok).toBe(false);
    expect(verdict.blockers.map((blocker) => blocker.code)).toContain(
      "required_evidence_not_ready",
    );
  });

  it("allows marking a gate met when reason, artifact, and evidence are ready", () => {
    const verdict = evaluateCriterionMetReadiness({
      criterion: criterion({ criterionId: "GATE-STRATEGY-01" }),
      artifacts: [
        artifact({
          artifactCode: "d01_strategy_memo",
          status: "approved",
          body: "Approved strategy memo body.",
        }),
      ],
      evidence: strategyEvidenceReady(),
      reason: REVIEW_REASON,
    });

    expect(verdict.ok).toBe(true);
  });

  it("blocks a hard gate when required evidence is only client-stated", () => {
    const verdict = evaluateCriterionMetReadiness({
      criterion: criterion({ criterionId: "GATE-STRATEGY-01" }),
      artifacts: [
        artifact({
          artifactCode: "d01_strategy_memo",
          status: "approved",
          body: "Approved strategy memo body.",
        }),
      ],
      evidence: strategyEvidenceReady({
        incumbent: {
          currentState: "Available",
          sourceArtifactId: null,
        },
      }),
      reason: REVIEW_REASON,
    });

    expect(verdict.ok).toBe(false);
    expect(verdict.blockers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "required_evidence_unverified",
          detail: expect.stringContaining("client-stated answer"),
        }),
      ]),
    );
  });

  it("allows a hard gate when client-stated evidence has explicit usable-evidence review", () => {
    const verdict = evaluateCriterionMetReadiness({
      criterion: criterion({ criterionId: "GATE-STRATEGY-01" }),
      artifacts: [
        artifact({
          artifactCode: "d01_strategy_memo",
          status: "approved",
          body: "Approved strategy memo body.",
        }),
      ],
      evidence: strategyEvidenceReady({
        incumbent: {
          currentState: "Usable Evidence",
          sourceArtifactId: null,
        },
      }),
      reason: REVIEW_REASON,
    });

    expect(verdict.ok).toBe(true);
  });

  it("does not apply the client-stated provenance hold to soft criteria", () => {
    const verdict = evaluateCriterionMetReadiness({
      criterion: criterion({
        criterionId: "GATE-EVAL-03",
        fromStage: "evaluation",
        toStage: "pricing",
      }),
      artifacts: [
        artifact({
          artifactCode: "d18_disqualification_log",
          stage: "evaluation",
          status: "approved",
          body: "Reviewed disqualification rationale.",
        }),
      ],
      evidence: [
        evidence({
          requirementId: "EVID-SRC-EVAL-RATER-SCORES",
          stage: "evaluation",
          currentState: "Available",
          sourceArtifactId: null,
        }),
        evidence({
          requirementId: "EVID-SRC-EVAL-WEIGHT-RATIONALE",
          stage: "evaluation",
          currentState: "Available",
          sourceArtifactId: null,
        }),
      ],
      reason: REVIEW_REASON,
    });

    expect(verdict.ok).toBe(true);
  });

  it("allows a hard gate when required evidence is backed by uploaded or processed artifacts", () => {
    const verdict = evaluateCriterionMetReadiness({
      criterion: criterion({ criterionId: "GATE-STRATEGY-01" }),
      artifacts: [
        artifact({
          artifactCode: "d01_strategy_memo",
          status: "approved",
          body: "Approved strategy memo body.",
        }),
      ],
      evidence: strategyEvidenceReady({
        incumbent: {
          currentState: "Available",
          sourceArtifactId: "artifact-incumbent-contract",
        },
      }),
      reason: REVIEW_REASON,
    });

    expect(verdict.ok).toBe(true);
  });

  it("does not treat an AI-only generated body as human-reviewed artifact evidence", () => {
    expect(
      isArtifactHumanReviewed(
        artifact({
          artifactCode: "d01_strategy_memo",
          status: "approved",
          body: "AI generated strategy outline.",
          bodyGenerationMetadata: {
            model: "gpt-5.1",
            generatedAt: "2026-06-01T00:00:00.000Z",
          },
        }),
      ),
    ).toBe(false);

    expect(
      isArtifactHumanReviewed(
        artifact({
          artifactCode: "d01_strategy_memo",
          status: "approved",
          body: "AI generated strategy outline with human edits.",
          bodyGenerationMetadata: {
            model: "gpt-5.1",
            generatedAt: "2026-06-01T00:00:00.000Z",
            humanEditedAt: "2026-06-01T00:05:00.000Z",
          },
        }),
      ),
    ).toBe(true);
  });

  it("blocks non-adjacent stage promotion even when criteria are met", () => {
    const verdict = evaluateStagePromotionReadiness({
      currentStage: "strategy",
      targetStage: "evaluation",
      criteria: [
        criterion({ criterionId: "GATE-STRATEGY-01", state: "met" }),
        criterion({ criterionId: "GATE-STRATEGY-02", state: "met" }),
        criterion({ criterionId: "GATE-STRATEGY-03", state: "met" }),
      ],
      reason: REVIEW_REASON,
    });

    expect(verdict.ok).toBe(false);
    expect(verdict.blockers.map((blocker) => blocker.code)).toContain(
      "non_adjacent_stage_promotion",
    );
  });

  it("blocks adjacent promotion while required criteria are still open", () => {
    const verdict = evaluateStagePromotionReadiness({
      currentStage: "strategy",
      targetStage: "scope",
      criteria: [
        criterion({ criterionId: "GATE-STRATEGY-01", state: "met" }),
        criterion({ criterionId: "GATE-STRATEGY-02", state: "pending" }),
        criterion({ criterionId: "GATE-STRATEGY-03", state: "met" }),
      ],
      reason: REVIEW_REASON,
    });

    expect(verdict.ok).toBe(false);
    expect(verdict.blockers.map((blocker) => blocker.code)).toContain(
      "gate_criterion_open",
    );
  });

  it("allows adjacent promotion when all required criteria are met", () => {
    const verdict = evaluateStagePromotionReadiness({
      currentStage: "strategy",
      targetStage: "scope",
      criteria: [
        criterion({ criterionId: "GATE-STRATEGY-01", state: "met" }),
        criterion({ criterionId: "GATE-STRATEGY-02", state: "met" }),
        criterion({ criterionId: "GATE-STRATEGY-03", state: "met" }),
      ],
      reason: REVIEW_REASON,
    });

    expect(verdict.ok).toBe(true);
  });

  it("blocks adjacent promotion when legacy met criteria lack verified artifacts, evidence, or reason", () => {
    const verdict = evaluateStagePromotionReadiness({
      currentStage: "strategy",
      targetStage: "scope",
      criteria: [
        criterion({
          criterionId: "GATE-STRATEGY-01",
          state: "met",
          notes: null,
        }),
        criterion({
          criterionId: "GATE-STRATEGY-02",
          state: "met",
          notes: null,
        }),
        criterion({
          criterionId: "GATE-STRATEGY-03",
          state: "met",
          notes: null,
        }),
      ],
      artifacts: [
        artifact({
          artifactCode: "d01_strategy_memo",
          status: "not_started",
          body: null,
        }),
      ],
      evidence: [
        evidence({
          requirementId: "EVID-SRC-STR-INCUMBENT",
          currentState: "Not Requested",
        }),
      ],
      reason: REVIEW_REASON,
    });

    expect(verdict.ok).toBe(false);
    expect(verdict.blockers.map((blocker) => blocker.code)).toContain(
      "gate_criterion_unverified",
    );
  });

  it("does not display legacy invalid met criteria as met", () => {
    const display = verifiedGateCriterionForDisplay({
      criterion: criterion({
        criterionId: "GATE-STRATEGY-01",
        state: "met",
        notes: null,
      }),
      artifacts: [
        artifact({
          artifactCode: "d01_strategy_memo",
          status: "not_started",
          body: null,
        }),
      ],
      evidence: [
        evidence({
          requirementId: "EVID-SRC-STR-INCUMBENT",
          currentState: "Not Requested",
        }),
      ],
    });

    expect(display.state).toBe("pending");
    expect(display.reviewedAt).toBeNull();
    expect(display.notes).toContain("Previously marked met");
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
    fromStage: "strategy",
    toStage: "scope",
    state: "pending",
    reviewerUserId: null,
    reviewedAt: null,
    notes: null,
    evidenceArtifactIds: [],
    waiverApprovalId: null,
    createdAt: "2026-06-01T00:00:00.000Z",
    updatedAt: "2026-06-01T00:00:00.000Z",
    ...rest,
  };
}

function artifact(
  overrides: Partial<SourceEventArtifactState> &
    Pick<SourceEventArtifactState, "artifactCode">,
): SourceEventArtifactState {
  const { artifactCode, ...rest } = overrides;
  return {
    id: `artifact-${artifactCode}`,
    sourceEventId: "event-1",
    tenantKey: "apex-retail",
    artifactCode,
    stage: "strategy",
    family: "sourcing_strategy",
    tier: "stub",
    status: "not_started",
    requirementLevel: "required",
    gateDefining: true,
    linkedArtifactId: null,
    notes: null,
    body: null,
    bodyFormat: "markdown",
    bodyAuthoredBy: null,
    bodyUpdatedAt: null,
    bodyGenerationMetadata: null,
    createdAt: "2026-06-01T00:00:00.000Z",
    updatedAt: "2026-06-01T00:00:00.000Z",
    ...rest,
  };
}

function evidence(
  overrides: Partial<SourceEventEvidence> &
    Pick<SourceEventEvidence, "requirementId">,
): SourceEventEvidence {
  const { requirementId, ...rest } = overrides;
  return {
    id: `evidence-${requirementId}`,
    sourceEventId: "event-1",
    tenantKey: "apex-retail",
    requirementId,
    stage: "strategy",
    currentState: "Not Requested",
    sourceArtifactId: null,
    notes: null,
    lastSyncedAt: null,
    createdAt: "2026-06-01T00:00:00.000Z",
    updatedAt: "2026-06-01T00:00:00.000Z",
    ...rest,
  };
}

function strategyEvidenceReady(overrides?: {
  incumbent?: Partial<SourceEventEvidence>;
  sponsorCommit?: Partial<SourceEventEvidence>;
}): SourceEventEvidence[] {
  return [
    evidence({
      requirementId: "EVID-SRC-STR-INCUMBENT",
      currentState: "Available",
      sourceArtifactId: "artifact-incumbent-contract",
      ...overrides?.incumbent,
    }),
    evidence({
      requirementId: "EVID-SRC-STR-SPONSOR-COMMIT",
      currentState: "Loaded",
      sourceArtifactId: "artifact-sponsor-commitment",
      ...overrides?.sponsorCommit,
    }),
  ];
}
