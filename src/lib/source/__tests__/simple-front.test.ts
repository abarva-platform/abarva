import { resolveSimpleStageScreen } from "@/lib/source/simple-front";
import type {
  SourceEventArtifactState,
  SourceEventEvidence,
  SourceEventGateCriterion,
} from "@/lib/source/canvas-substrate";

function artifact(
  overrides: Partial<SourceEventArtifactState> = {},
): SourceEventArtifactState {
  return {
    id: "artifact-1",
    sourceEventId: "event-1",
    tenantKey: "skyharbor",
    artifactCode: "d05_scope_memo",
    stage: "scope",
    family: "scope_document",
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
    createdAt: "2026-06-17T00:00:00Z",
    updatedAt: "2026-06-17T00:00:00Z",
    ...overrides,
  };
}

function criterion(
  overrides: Partial<SourceEventGateCriterion> = {},
): SourceEventGateCriterion {
  return {
    id: "criterion-1",
    sourceEventId: "event-1",
    tenantKey: "skyharbor",
    criterionId: "GATE-SCOPE-01",
    fromStage: "scope",
    toStage: "rfp",
    state: "pending",
    reviewerUserId: null,
    reviewedAt: null,
    notes: null,
    evidenceArtifactIds: [],
    waiverApprovalId: null,
    createdAt: "2026-06-17T00:00:00Z",
    updatedAt: "2026-06-17T00:00:00Z",
    ...overrides,
  };
}

function evidence(
  overrides: Partial<SourceEventEvidence> = {},
): SourceEventEvidence {
  return {
    id: "evidence-1",
    sourceEventId: "event-1",
    tenantKey: "skyharbor",
    requirementId: "EVID-SRC-SCOPE-APP-INV",
    stage: "scope",
    currentState: "Not Requested",
    sourceArtifactId: null,
    notes: null,
    lastSyncedAt: null,
    createdAt: "2026-06-17T00:00:00Z",
    updatedAt: "2026-06-17T00:00:00Z",
    ...overrides,
  };
}

describe("resolveSimpleStageScreen", () => {
  it("resolves Scope with empty substrate rows", () => {
    expect(() =>
      resolveSimpleStageScreen(
        {
          artifactStates: [],
          gateCriterionStates: [],
          evidenceStates: [],
        },
        "scope",
      ),
    ).not.toThrow();

    const vm = resolveSimpleStageScreen(
      {
        artifactStates: [],
        gateCriterionStates: [],
        evidenceStates: [],
      },
      "scope",
    );

    expect(vm.required).toHaveLength(3);
    expect(vm.deliverable.artifactCode).toBe("d05_scope_memo");
    expect(vm.nextStep).toEqual({ label: "Issue the RFP", stage: "rfp" });
  });

  it("resolves Strategy with empty substrate rows", () => {
    expect(() =>
      resolveSimpleStageScreen(
        {
          artifactStates: [],
          gateCriterionStates: [],
          evidenceStates: [],
        },
        "strategy",
      ),
    ).not.toThrow();

    const vm = resolveSimpleStageScreen(
      {
        artifactStates: [],
        gateCriterionStates: [],
        evidenceStates: [],
      },
      "strategy",
    );

    expect(vm.required.length).toBeLessThanOrEqual(3);
    expect(vm.deliverable.artifactCode).toBe("d01_strategy_memo");
    expect(vm.nextStep).toEqual({ label: "Issue the Scope", stage: "scope" });
  });

  it("returns at most three Scope asks, the d05 deliverable, and the RFP next step", () => {
    const vm = resolveSimpleStageScreen(
      {
        artifactStates: [artifact()],
        gateCriterionStates: [criterion()],
        evidenceStates: [
          evidence(),
          evidence({
            id: "evidence-2",
            requirementId: "EVID-SRC-SCOPE-ORG",
          }),
          evidence({
            id: "evidence-3",
            requirementId: "EVID-SRC-SCOPE-TICKET-HISTORY",
          }),
          evidence({
            id: "evidence-4",
            requirementId: "EVID-SRC-SCOPE-FY-CONTRACT",
          }),
        ],
      },
      "scope",
    );

    expect(vm.stageLabel).toBe("Scope");
    expect(vm.required).toHaveLength(3);
    expect(vm.extras.length).toBeGreaterThanOrEqual(1);
    expect(vm.extras.map((row) => row.requirementId)).not.toEqual(
      expect.arrayContaining(vm.required.map((row) => row.requirementId)),
    );
    expect(vm.deliverable).toEqual({
      artifactCode: "d05_scope_memo",
      name: "Scope Memo with Boundaries",
    });
    expect(vm.nextStep).toEqual({ label: "Issue the RFP", stage: "rfp" });
  });

  it("returns the Strategy d01 deliverable and Scope next step", () => {
    const vm = resolveSimpleStageScreen(
      {
        artifactStates: [
          artifact({
            artifactCode: "d01_strategy_memo",
            stage: "strategy",
            family: "sourcing_strategy",
          }),
        ],
        gateCriterionStates: [
          criterion({
            criterionId: "GATE-STRATEGY-01",
            fromStage: "strategy",
            toStage: "scope",
          }),
        ],
        evidenceStates: [
          evidence({
            requirementId: "EVID-SRC-STR-INCUMBENT",
            stage: "strategy",
          }),
        ],
      },
      "strategy",
    );

    expect(vm.required.length).toBeLessThanOrEqual(3);
    expect(vm.deliverable.artifactCode).toBe("d01_strategy_memo");
    expect(vm.nextStep).toEqual({ label: "Issue the Scope", stage: "scope" });
  });
});
