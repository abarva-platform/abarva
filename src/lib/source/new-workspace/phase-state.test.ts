import {
  isPastSourceNewPhases,
  sourceNewCurrentPhase,
  sourceNewPhaseState,
  sourceNewPhaseStateLabel,
  sourceNewStageLabel,
  type SourceNewPhaseEvidence,
} from "./phase-state";

const nothingRecorded: SourceNewPhaseEvidence = {
  request: false,
  define: false,
  suppliers: false,
  rfi: false,
};

describe("sourceNewCurrentPhase", () => {
  it("places an unreviewed request in the request phase", () => {
    expect(sourceNewCurrentPhase({ currentStage: "intake", lifecycle: "waiting_on_client" })).toBe("request");
  });

  it("never makes suppliers the current phase, because no stage owns it", () => {
    const stages = ["intake", "strategy", "sourcing_strategy", "scope", "rfp", "rfp_rfi_package", "responses"];
    for (const currentStage of stages) {
      expect(sourceNewCurrentPhase({ currentStage, lifecycle: "active" })).not.toBe("suppliers");
    }
  });

  it("does not place an event whose stage is past the market package", () => {
    expect(sourceNewCurrentPhase({ currentStage: "evaluation", lifecycle: "active" })).toBeNull();
  });
});

describe("isPastSourceNewPhases", () => {
  it("is true only for canonical stages after rfp", () => {
    expect(isPastSourceNewPhases({ currentStage: "responses", lifecycle: "active" })).toBe(true);
    expect(isPastSourceNewPhases({ currentStage: "value", lifecycle: "active" })).toBe(true);
    expect(isPastSourceNewPhases({ currentStage: "rfp", lifecycle: "active" })).toBe(false);
    expect(isPastSourceNewPhases({ currentStage: "strategy", lifecycle: "active" })).toBe(false);
  });

  it("does not treat an unrecognised stage as advanced", () => {
    expect(isPastSourceNewPhases({ currentStage: "not_a_stage", lifecycle: "active" })).toBe(false);
  });

  it("keeps an unreviewed request behind the phases whatever its stage says", () => {
    expect(isPastSourceNewPhases({ currentStage: "evaluation", lifecycle: "waiting_on_client" })).toBe(false);
  });
});

describe("sourceNewPhaseState", () => {
  const activeMarketPackage = { currentStage: "rfp", lifecycle: "active" };

  it("does not call a supplier phase past merely because the event moved on", () => {
    expect(sourceNewPhaseState("suppliers", activeMarketPackage, nothingRecorded)).toBe("no_record");
    expect(sourceNewPhaseStateLabel("no_record")).toBe("No record");
  });

  it("reports a behind phase as recorded only when that phase holds something", () => {
    expect(sourceNewPhaseState("suppliers", activeMarketPackage, { ...nothingRecorded, suppliers: true }))
      .toBe("recorded");
  });

  it("never reports a behind phase as complete or approved", () => {
    const labels = (["recorded", "no_record"] as const).map(sourceNewPhaseStateLabel);
    for (const label of labels) {
      expect(label).not.toMatch(/complete|approved|done/i);
    }
  });

  it("locks phases the event has not reached", () => {
    expect(sourceNewPhaseState("rfi", { currentStage: "strategy", lifecycle: "active" }, nothingRecorded))
      .toBe("not_open");
    expect(sourceNewPhaseState("suppliers", { currentStage: "strategy", lifecycle: "active" }, nothingRecorded))
      .toBe("not_open");
  });

  it("marks the request phase as needing review while intake approval is outstanding", () => {
    expect(sourceNewPhaseState("request", { currentStage: "intake", lifecycle: "waiting_on_client" }, nothingRecorded))
      .toBe("review_needed");
  });

  it("does not lock any phase once the event is past the four phases", () => {
    const event = { currentStage: "evaluation", lifecycle: "active" };
    const evidence: SourceNewPhaseEvidence = { request: true, define: true, suppliers: false, rfi: true };
    expect(sourceNewPhaseState("request", event, evidence)).toBe("recorded");
    expect(sourceNewPhaseState("define", event, evidence)).toBe("recorded");
    expect(sourceNewPhaseState("suppliers", event, evidence)).toBe("no_record");
    expect(sourceNewPhaseState("rfi", event, evidence)).toBe("recorded");
  });

  it("does not lock a phase for an unrecognised stage either", () => {
    const event = { currentStage: "not_a_stage", lifecycle: "active" };
    expect(sourceNewPhaseState("define", event, nothingRecorded)).toBe("no_record");
    expect(sourceNewPhaseState("rfi", event, { ...nothingRecorded, rfi: true })).toBe("recorded");
  });
});

describe("sourceNewStageLabel", () => {
  it("never renders a raw stage key", () => {
    expect(sourceNewStageLabel("rfp_rfi_package")).toBe("Market package");
    expect(sourceNewStageLabel("rfp")).toBe("Market package");
    expect(sourceNewStageLabel("executive_decision")).toBe("Executive Decision");
    expect(sourceNewStageLabel("evaluation")).toBe("Evaluation");
  });

  it("says nothing is recorded rather than echoing an unknown key", () => {
    expect(sourceNewStageLabel("some_internal_key")).toBe("Not recorded");
  });

  it("does not name a solicitation motion the stage key cannot establish", () => {
    for (const stage of ["rfp", "rfp_rfi_package"]) {
      expect(sourceNewStageLabel(stage)).not.toMatch(/\bRFI\b|\bRFP\b/);
    }
  });
});
