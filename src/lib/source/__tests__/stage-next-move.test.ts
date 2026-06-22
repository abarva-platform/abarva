import { resolveStageNextMove } from "../stage-next-move";
import type {
  SourceEventArtifactState,
  SourceEventGateCriterion,
} from "../canvas-substrate";

function artifact(
  overrides: Partial<SourceEventArtifactState> = {},
): SourceEventArtifactState {
  return {
    id: "artifact-1",
    sourceEventId: "evt-1",
    tenantKey: "apexretail",
    artifactCode: "d01_strategy_memo",
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
    createdAt: "2026-06-04T00:00:00.000Z",
    updatedAt: "2026-06-04T00:00:00.000Z",
    ...overrides,
  };
}

function criterion(
  overrides: Partial<SourceEventGateCriterion> = {},
): SourceEventGateCriterion {
  return {
    id: "criterion-1",
    sourceEventId: "evt-1",
    tenantKey: "apexretail",
    criterionId: "GATE-STRATEGY-01",
    fromStage: "strategy",
    toStage: "scope",
    state: "pending",
    reviewerUserId: null,
    reviewedAt: null,
    notes: null,
    evidenceArtifactIds: [],
    waiverApprovalId: null,
    createdAt: "2026-06-04T00:00:00.000Z",
    updatedAt: "2026-06-04T00:00:00.000Z",
    ...overrides,
  };
}

describe("resolveStageNextMove", () => {
  it("leads empty Strategy with the memo drafting action", () => {
    const view = resolveStageNextMove({
      stage: "strategy",
      artifacts: [artifact()],
      criteria: [criterion()],
    });

    expect(view.title).toBe("Draft your Sourcing Strategy Memo");
    expect(view.primaryLabel).toBe("Draft with Ava");
    expect(view.primaryTarget).toBe("document");
    // The draft move exposes its target artifact so "Draft with Ava" can
    // run governed generation in place (no navigation).
    expect(view.draftArtifactCode).toBe("d01_strategy_memo");
    expect(view.gateSummary).toBe("0 of 1 cleared to advance");
    expect(view.gates[0]?.label).toBe("Sponsor sign-off");
  });

  it("does not set draftArtifactCode once the deliverable exists (gate move)", () => {
    const view = resolveStageNextMove({
      stage: "strategy",
      artifacts: [
        artifact({
          body: "# Sourcing Strategy Memo\n\nApproved working draft.",
        }),
      ],
      criteria: [criterion()],
    });

    expect(view.primaryTarget).toBe("gate");
    expect(view.draftArtifactCode).toBeUndefined();
  });

  it("routes authored Strategy work to the gate checklist while gates remain open", () => {
    const view = resolveStageNextMove({
      stage: "strategy",
      artifacts: [
        artifact({
          body: "# Sourcing Strategy Memo\n\nApproved working draft.",
          status: "needs_review",
        }),
      ],
      criteria: [criterion()],
    });

    expect(view.title).toBe(
      "Clear gates: sponsor sign-off, value target, archetype",
    );
    expect(view.primaryLabel).toBe("Open gate checklist");
    expect(view.primaryTarget).toBe("gate");
  });

  it("turns into an advance action when every gate is met or waived", () => {
    const view = resolveStageNextMove({
      stage: "strategy",
      artifacts: [
        artifact({
          body: "# Sourcing Strategy Memo\n\nApproved working draft.",
          status: "approved",
        }),
      ],
      criteria: [
        criterion({ state: "met" }),
        criterion({
          id: "criterion-2",
          criterionId: "GATE-STRATEGY-02",
          state: "waived",
        }),
      ],
    });

    expect(view.title).toBe("Advance to Scope");
    expect(view.primaryTarget).toBe("advance");
    expect(view.primaryLabel).toBe("Advance to Scope");
    expect(view.gateSummary).toBe("2 of 2 cleared to advance");
  });
});
