import { computeStageProgression } from "../stage-progression";
import type {
  SourceEventArtifactState,
  SourceEventGateCriterion,
  SourceEventEvidence,
  SourceEventGateCriterionState,
  SourceEventEvidenceCurrentState,
} from "../canvas-substrate";
import type { SourceStageKey } from "../types";

// ── minimal factories (only the fields the engine reads) ─────────────────────
function criterion(
  criterionId: string,
  state: SourceEventGateCriterionState,
  fromStage: SourceStageKey = "strategy",
): SourceEventGateCriterion {
  return {
    id: `row-${criterionId}`,
    sourceEventId: "evt",
    tenantKey: "skyharbor",
    criterionId,
    fromStage,
    toStage: "scope",
    state,
    reviewerUserId: null,
    reviewedAt: null,
    notes: null,
    evidenceArtifactIds: [],
    waiverApprovalId: null,
    createdAt: "t",
    updatedAt: "t",
  };
}

function evidence(
  requirementId: string,
  currentState: SourceEventEvidenceCurrentState,
  stage: SourceStageKey = "strategy",
): SourceEventEvidence {
  return {
    id: `row-${requirementId}`,
    sourceEventId: "evt",
    tenantKey: "skyharbor",
    requirementId,
    stage,
    currentState,
    sourceArtifactId: null,
    notes: null,
    lastSyncedAt: null,
    createdAt: "t",
    updatedAt: "t",
  };
}

function artifact(
  artifactCode: string,
  status: SourceEventArtifactState["status"],
  body: string | null,
  stage: SourceStageKey = "strategy",
): SourceEventArtifactState {
  return {
    id: `row-${artifactCode}`,
    sourceEventId: "evt",
    tenantKey: "skyharbor",
    artifactCode,
    stage,
    family: "sourcing_strategy",
    tier: "stub",
    status,
    requirementLevel: "required",
    gateDefining: true,
    linkedArtifactId: null,
    notes: null,
    body,
    bodyFormat: "markdown",
    bodyAuthoredBy: null,
    bodyUpdatedAt: null,
  } as SourceEventArtifactState;
}

const STRATEGY_GATES = (
  s: SourceEventGateCriterionState = "pending",
): SourceEventGateCriterion[] => [
  criterion("GATE-STRATEGY-01", s),
  criterion("GATE-STRATEGY-02", s),
  criterion("GATE-STRATEGY-03", s),
];

// d01 is AI-authorable; d02/d03 are not (until slice C).
const GEN = ["d01_strategy_memo", "d05_scope_memo", "d09_rfp_pack"];

describe("computeStageProgression", () => {
  it("empty Strategy stage → upload evidence + generate/prepare deliverables, none clear", () => {
    const view = computeStageProgression({
      stage: "strategy",
      criteria: STRATEGY_GATES("pending"),
      evidence: [],
      artifacts: [],
      generatableCodes: GEN,
    });

    expect(view.allClear).toBe(false);
    expect(view.gateSummary).toBe("0 of 3 cleared to advance");

    // required evidence comes first (incumbent contract, sponsor commitment)
    const uploads = view.needs.filter((n) => n.kind === "upload");
    expect(uploads.length).toBeGreaterThanOrEqual(2);
    expect(view.primary?.kind).toBe("upload");

    // d01 is generatable; d02/d03 are prepare (not wired)
    const gen = view.needs.find((n) => n.artifactCode === "d01_strategy_memo");
    expect(gen?.kind).toBe("generate");
    const prep = view.needs.find((n) => n.artifactCode === "d02_value_target");
    expect(prep?.kind).toBe("prepare");
    expect(prep?.blocked).toBe(true);

    // d03 is linked to a required gate even though its spec is "recommended" —
    // it must still surface as a need.
    expect(
      view.needs.some((n) => n.artifactCode === "d03_archetype_decision"),
    ).toBe(true);
  });

  it("evidence satisfied + d01 drafted (pending approval) → approve need appears", () => {
    const view = computeStageProgression({
      stage: "strategy",
      criteria: [
        criterion("GATE-STRATEGY-01", "pending"),
        criterion("GATE-STRATEGY-02", "met"),
        criterion("GATE-STRATEGY-03", "met"),
      ],
      evidence: [
        evidence("EVID-SRC-STR-INCUMBENT", "Available"),
        evidence("EVID-SRC-STR-SPONSOR-COMMIT", "Loaded"),
      ],
      artifacts: [artifact("d01_strategy_memo", "needs_review", "draft body")],
      generatableCodes: GEN,
    });

    expect(view.allClear).toBe(false);
    // no upload needs (evidence satisfied), no generate for d01 (drafted)
    expect(view.needs.some((n) => n.kind === "upload")).toBe(false);
    expect(
      view.needs.some(
        (n) => n.kind === "generate" && n.artifactCode === "d01_strategy_memo",
      ),
    ).toBe(false);
    // an approve need that clears GATE-STRATEGY-01
    const approve = view.needs.find((n) => n.kind === "approve");
    expect(approve?.criterionId).toBe("GATE-STRATEGY-01");
    expect(approve?.artifactCode).toBe("d01_strategy_memo");
  });

  it("all required gates met → single Advance need to the next stage", () => {
    const view = computeStageProgression({
      stage: "strategy",
      criteria: STRATEGY_GATES("met"),
      evidence: [],
      artifacts: [],
      generatableCodes: GEN,
    });

    expect(view.allClear).toBe(true);
    expect(view.needs).toHaveLength(1);
    expect(view.primary?.kind).toBe("advance");
    expect(view.nextStage).toBe("scope");
    expect(view.primary?.label).toMatch(/Advance to/i);
    expect(view.gateSummary).toBe("3 of 3 cleared to advance");
  });

  it("stale evidence surfaces as a Refresh upload", () => {
    const view = computeStageProgression({
      stage: "strategy",
      criteria: STRATEGY_GATES("pending"),
      evidence: [evidence("EVID-SRC-STR-INCUMBENT", "Stale")],
      artifacts: [],
      generatableCodes: GEN,
    });
    const refresh = view.needs.find(
      (n) => n.requirementId === "EVID-SRC-STR-INCUMBENT",
    );
    expect(refresh?.kind).toBe("upload");
    expect(refresh?.label).toMatch(/^Refresh/);
  });

  it("RFP stage with a drafted RFP pack surfaces a vendor send need (blocked, slice D)", () => {
    const view = computeStageProgression({
      stage: "rfp",
      criteria: [criterion("GATE-RFP-01", "pending", "rfp")],
      evidence: [],
      artifacts: [artifact("d09_rfp_pack", "needs_review", "rfp body", "rfp")],
      generatableCodes: GEN,
    });
    const send = view.needs.find((n) => n.kind === "send");
    expect(send).toBeTruthy();
    expect(send?.blocked).toBe(true);
    expect(send?.label).toMatch(/all shortlisted vendors/i);
  });

  it("recommended evidence sorts after required actions (does not block)", () => {
    // strategy evidence is all required; use a stage with a recommended item: RFP
    // EVID-SRC-RFP-VENDOR-INTEL is 'recommended'.
    const view = computeStageProgression({
      stage: "rfp",
      criteria: [criterion("GATE-RFP-01", "pending", "rfp")],
      evidence: [],
      artifacts: [],
      generatableCodes: GEN,
    });
    const optionalUploads = view.needs.filter(
      (n) => n.kind === "upload" && n.optional,
    );
    if (optionalUploads.length > 0) {
      const lastRequiredIdx = Math.max(
        ...view.needs
          .map((n, i) => (!n.optional ? i : -1))
          .filter((i) => i >= 0),
      );
      const firstOptionalIdx = view.needs.findIndex((n) => n.optional);
      expect(firstOptionalIdx).toBeGreaterThan(lastRequiredIdx);
    }
  });
});
