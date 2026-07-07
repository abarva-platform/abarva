import { buildSourceWorkspaceProgression } from "../source-progression";
import type {
  SourceEventArtifactState,
  SourceEventGateCriterion,
  SourceEventGateCriterionState,
} from "@/lib/source/canvas-substrate";

function criterion(
  criterionId: string,
  state: SourceEventGateCriterionState,
): SourceEventGateCriterion {
  return {
    id: `row-${criterionId}`,
    sourceEventId: "evt",
    tenantKey: "skyharbor",
    criterionId,
    fromStage: "strategy",
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

function artifact(
  artifactCode: string,
  status: SourceEventArtifactState["status"],
  body: string | null,
): SourceEventArtifactState {
  return {
    id: `row-${artifactCode}`,
    sourceEventId: "evt",
    tenantKey: "skyharbor",
    artifactCode,
    stage: "strategy",
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

const GEN = ["d01_strategy_memo", "d05_scope_memo", "d09_rfp_pack"];
const EVENT_HREF = "/source/events/evt-1";

describe("buildSourceWorkspaceProgression", () => {
  it("maps upload/generate needs to explorer intent hrefs; prepare stays blocked", () => {
    const prog = buildSourceWorkspaceProgression({
      stage: "strategy",
      criteria: [
        criterion("GATE-STRATEGY-01", "pending"),
        criterion("GATE-STRATEGY-02", "pending"),
        criterion("GATE-STRATEGY-03", "pending"),
      ],
      evidence: [],
      artifacts: [],
      eventHref: EVENT_HREF,
      generatableCodes: GEN,
    });

    expect(prog.allClear).toBe(false);
    const upload = prog.needs.find((n) => n.kind === "upload");
    expect(upload?.href).toMatch(/intent=upload&stage=strategy/);

    const generate = prog.needs.find(
      (n) => n.kind === "generate" && n.id === "d01_strategy_memo",
    );
    expect(generate?.href).toMatch(/intent=generate&stage=strategy/);

    const prepare = prog.needs.find((n) => n.kind === "prepare");
    expect(prepare?.blocked).toBe(true);
    expect(prepare?.href).toBeUndefined();
  });

  it("approve and advance point back to the event canvas", () => {
    const approveView = buildSourceWorkspaceProgression({
      stage: "strategy",
      criteria: [
        criterion("GATE-STRATEGY-01", "pending"),
        criterion("GATE-STRATEGY-02", "met"),
        criterion("GATE-STRATEGY-03", "met"),
      ],
      evidence: [],
      artifacts: [artifact("d01_strategy_memo", "needs_review", "body")],
      eventHref: EVENT_HREF,
      generatableCodes: GEN,
    });
    const approve = approveView.needs.find((n) => n.kind === "approve");
    expect(approve?.href).toBe(EVENT_HREF);

    const advanceView = buildSourceWorkspaceProgression({
      stage: "strategy",
      criteria: [
        criterion("GATE-STRATEGY-01", "met"),
        criterion("GATE-STRATEGY-02", "met"),
        criterion("GATE-STRATEGY-03", "met"),
      ],
      evidence: [],
      artifacts: [],
      eventHref: EVENT_HREF,
      generatableCodes: GEN,
    });
    expect(advanceView.allClear).toBe(true);
    expect(advanceView.needs).toHaveLength(1);
    expect(advanceView.needs[0].kind).toBe("advance");
    expect(advanceView.needs[0].href).toBe(EVENT_HREF);
  });
});
