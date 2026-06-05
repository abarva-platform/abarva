import { expect, test } from "@playwright/test";
import { artifactDisplayName } from "../../../src/lib/source/artifact-display-names";
import { resolveStageNextMove } from "../../../src/lib/source/stage-next-move";
import type {
  SourceEventArtifactState,
  SourceEventGateCriterion,
} from "../../../src/lib/source/canvas-substrate";

test.describe("Source Strategy stage refit contract", () => {
  test("uses humanized Strategy outputs and CIO-facing gate labels", () => {
    const view = resolveStageNextMove({
      stage: "strategy",
      artifacts: [strategyArtifact("d01_strategy_memo")],
      criteria: [
        strategyCriterion("GATE-STRATEGY-01"),
        strategyCriterion("GATE-STRATEGY-02"),
        strategyCriterion("GATE-STRATEGY-03"),
      ],
    });

    expect(artifactDisplayName("d01_strategy_memo", "Sourcing Strategy Memo")).toBe(
      "Sourcing Strategy Memo",
    );
    expect(artifactDisplayName("d02_value_target", "Value Target Brief")).toBe(
      "Value Target Brief",
    );
    expect(
      artifactDisplayName(
        "d03_archetype_decision",
        "Archetype Decision Record",
      ),
    ).toBe("Archetype Decision Record");
    expect(view.title).toBe("Draft your Sourcing Strategy Memo");
    expect(view.primaryLabel).toBe("Draft with Sentinel");
    expect(view.gates.map((gate) => gate.label)).toEqual([
      "Sponsor sign-off",
      "Value target set",
      "Archetype confirmed",
    ]);
  });
});

function strategyArtifact(
  artifactCode: string,
  overrides: Partial<SourceEventArtifactState> = {},
): SourceEventArtifactState {
  return {
    id: `${artifactCode}-row`,
    sourceEventId: "evt-1",
    tenantKey: "apexretail",
    artifactCode,
    stage: "strategy",
    family: "sourcing_strategy",
    tier: "stub",
    status: "not_started",
    requirementLevel: artifactCode === "d03_archetype_decision" ? "optional" : "required",
    gateDefining: artifactCode !== "d03_archetype_decision",
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

function strategyCriterion(
  criterionId: string,
  overrides: Partial<SourceEventGateCriterion> = {},
): SourceEventGateCriterion {
  return {
    id: `${criterionId}-row`,
    sourceEventId: "evt-1",
    tenantKey: "apexretail",
    criterionId,
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
