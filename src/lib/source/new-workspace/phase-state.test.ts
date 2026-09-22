import {
  SOURCE_NEW_EXTERNAL_CHECKPOINT_ORDER,
  SOURCE_NEW_PHASE_ORDER,
  isPastSourceNewPhases,
  sourceNewCategoryDisplay,
  sourceNewCurrentPhaseLabel,
  sourceNewCurrentPhase,
  sourceNewEventTypeLabel,
  sourceNewFilePhase,
  sourceNewLifecycleLabel,
  sourceNewNextAction,
  sourceNewHistoricalGapPhases,
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

describe("Source New external checkpoint contract", () => {
  it("keeps the external flow to request intake plus four event phases", () => {
    expect(SOURCE_NEW_EXTERNAL_CHECKPOINT_ORDER).toEqual([
      "request_intake",
      "request",
      "define",
      "suppliers",
      "rfi",
    ]);
    expect(SOURCE_NEW_EXTERNAL_CHECKPOINT_ORDER).toHaveLength(5);
    expect(SOURCE_NEW_PHASE_ORDER).toEqual([
      "request",
      "define",
      "suppliers",
      "rfi",
    ]);
  });
});

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

describe("Source New operator context", () => {
  it("projects scope into the reader-facing Define phase and action", () => {
    const event = { currentStage: "scope", lifecycle: "active" };

    expect(sourceNewCurrentPhaseLabel(event)).toBe("Define");
    expect(sourceNewNextAction(event)).toEqual({
      label: "Open scope and strategy",
      detail:
        "Review scope, baseline and decision requirements in the governed event.",
    });
  });

  it("uses neutral package wording when solicitation authority is absent", () => {
    const event = { currentStage: "rfp", lifecycle: "active" };

    expect(sourceNewCurrentPhaseLabel(event)).toBe("Market package");
    expect(sourceNewNextAction(event).label).toBe("Open market package");
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
    const labels = (["recorded", "historical_gap", "no_record"] as const).map(
      sourceNewPhaseStateLabel,
    );
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

  it("calls a missing phase on a completed event a historical gap", () => {
    const event = { currentStage: "value", lifecycle: "completed" };
    const evidence: SourceNewPhaseEvidence = {
      request: true,
      define: true,
      suppliers: false,
      rfi: true,
    };

    expect(sourceNewPhaseState("suppliers", event, evidence)).toBe(
      "historical_gap",
    );
  });

  it("does not lock a phase for an unrecognised stage either", () => {
    const event = { currentStage: "not_a_stage", lifecycle: "active" };
    expect(sourceNewPhaseState("define", event, nothingRecorded)).toBe("no_record");
    expect(sourceNewPhaseState("rfi", event, { ...nothingRecorded, rfi: true })).toBe("recorded");
  });
});

describe("sourceNewHistoricalGapPhases", () => {
  it("returns every missing governed phase on a completed event", () => {
    expect(
      sourceNewHistoricalGapPhases(
        { currentStage: "value", lifecycle: "completed" },
        {
          request: true,
          define: false,
          suppliers: false,
          rfi: true,
        },
      ),
    ).toEqual(["define", "suppliers"]);
  });

  it("does not turn an active-event evidence gap into completion review", () => {
    expect(
      sourceNewHistoricalGapPhases(
        { currentStage: "evaluation", lifecycle: "active" },
        nothingRecorded,
      ),
    ).toEqual([]);
  });
});

describe("sourceNewLifecycleLabel", () => {
  it("uses the canonical dictionary for waiting states", () => {
    expect(sourceNewLifecycleLabel("waiting_on_executive_decision")).toBe("Waiting on Executive Decision");
    expect(sourceNewLifecycleLabel("waiting_on_vendor")).toBe("Waiting on Vendor");
    expect(sourceNewLifecycleLabel("at_risk")).toBe("At Risk");
  });

  it("keeps the two states this workspace speaks about in its own words", () => {
    expect(sourceNewLifecycleLabel("waiting_on_client")).toBe("Awaiting intake review");
    expect(sourceNewLifecycleLabel("active")).toBe("Active event");
  });

  it("does not present an unrecognised lifecycle value as a state", () => {
    expect(sourceNewLifecycleLabel("some_new_state")).toBe("Not recorded");
  });
});

describe("sourceNewCategoryDisplay", () => {
  it("shows a governed category by its taxonomy label, not its id", () => {
    expect(sourceNewCategoryDisplay("ams")).toEqual({
      text: "Application Managed Services (AMS)",
      note: null,
    });
  });

  it("keeps an ungoverned recorded value visible and says it is ungoverned", () => {
    const shown = sourceNewCategoryDisplay("application_managed_services");
    expect(shown.text).toBe("Application Managed Services");
    expect(shown.note).toMatch(/not one of the governed sourcing categories/);
  });

  it("does not confuse nothing recorded with a category the taxonomy does not know", () => {
    expect(sourceNewCategoryDisplay(null)).toEqual({ text: "Not established", note: null });
    expect(sourceNewCategoryDisplay("   ")).toEqual({ text: "Not established", note: null });
  });
});

describe("sourceNewEventTypeLabel", () => {
  it("title-cases the recorded event type", () => {
    expect(sourceNewEventTypeLabel("managed_services")).toBe("Managed Services");
    expect(sourceNewEventTypeLabel("competitive-sourcing")).toBe("Competitive Sourcing");
  });

  it("says nothing is recorded for an empty value", () => {
    expect(sourceNewEventTypeLabel("   ")).toBe("Not recorded");
  });
});

describe("sourceNewFilePhase", () => {
  it("files an artifact from a stage outside these phases rather than dropping it", () => {
    expect(sourceNewFilePhase({ sourcingStage: "evaluation", artifactType: "score_summary" })).toBe("other");
    expect(sourceNewFilePhase({ sourcingStage: null, artifactType: "meeting_notes" })).toBe("other");
    expect(sourceNewFilePhase({ sourcingStage: "not_a_stage", artifactType: "notes" })).toBe("other");
  });

  it("keeps the phase mapping it already had", () => {
    expect(sourceNewFilePhase({ sourcingStage: "intake", artifactType: "request_form" })).toBe("request");
    expect(sourceNewFilePhase({ sourcingStage: "scope", artifactType: "scope_note" })).toBe("define");
    expect(sourceNewFilePhase({ sourcingStage: "sourcing_strategy", artifactType: "strategy" })).toBe("define");
    expect(sourceNewFilePhase({ sourcingStage: "rfp_rfi_package", artifactType: "package" })).toBe("rfi");
  });

  it("files an NDA with supplier work whatever stage recorded it", () => {
    expect(sourceNewFilePhase({ sourcingStage: "evaluation", artifactType: "nda_executed" })).toBe("suppliers");
    expect(sourceNewFilePhase({ sourcingStage: null, artifactType: "mutual_NDA" })).toBe("suppliers");
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
