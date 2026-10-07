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
  sourceNewMarketPackageLabel,
  sourceNewNextAction,
  sourceNewHistoricalGapPhases,
  sourceNewPhaseState,
  sourceNewPhaseIsSkipped,
  sourceNewSkippedPhases,
  sourceNewJourneyForEvent,
  SOURCE_NEW_PHASE_STAGE_KEYS,
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

describe("sourceNewMarketPackageLabel acceptance dependency", () => {
  // The live read path cannot hand this function a motion without acceptance:
  // `resolveAuthority` returns `unavailable` and the page maps that to a null
  // motion. That fence is asserted in its own suites. These cases exist so the
  // dependency is stated *here* as well — the function names a motion only on
  // the evidence that the motion was accepted, rather than on the fence being
  // somewhere upstream and nothing saying so.
  const accepted = {
    solicitationMotionAcceptedAt: "2026-03-12T00:00:00Z",
    solicitationMotionAcceptedByUserId: "user-1",
  };

  it("names the motion once both acceptance fields are recorded", () => {
    expect(
      sourceNewMarketPackageLabel({ solicitationMotion: "rfp", ...accepted }),
    ).toBe("RFP");
    expect(
      sourceNewMarketPackageLabel({ solicitationMotion: "rfi", ...accepted }),
    ).toBe("RFI");
  });

  it("stays neutral when a motion is asserted with no acceptance at all", () => {
    for (const motion of ["rfi", "rfp"] as const) {
      expect(sourceNewMarketPackageLabel({ solicitationMotion: motion })).toBe(
        "Market package",
      );
    }
  });

  it("stays neutral when a motion carries an acceptance time but no accepting user", () => {
    for (const motion of ["rfi", "rfp"] as const) {
      expect(
        sourceNewMarketPackageLabel({
          solicitationMotion: motion,
          solicitationMotionAcceptedAt: accepted.solicitationMotionAcceptedAt,
          solicitationMotionAcceptedByUserId: null,
        }),
      ).toBe("Market package");
    }
  });

  it("stays neutral when a motion carries an accepting user but no acceptance time", () => {
    for (const motion of ["rfi", "rfp"] as const) {
      expect(
        sourceNewMarketPackageLabel({
          solicitationMotion: motion,
          solicitationMotionAcceptedAt: null,
          solicitationMotionAcceptedByUserId:
            accepted.solicitationMotionAcceptedByUserId,
        }),
      ).toBe("Market package");
    }
  });

  // Whitespace is not a signature. `resolveAuthority` already trims before it
  // decides, so a blank-but-present acceptance field must not read as accepted
  // here either, or the two layers would disagree about the same row.
  it("does not read a whitespace-only acceptance field as acceptance", () => {
    expect(
      sourceNewMarketPackageLabel({
        solicitationMotion: "rfp",
        solicitationMotionAcceptedAt: "   ",
        solicitationMotionAcceptedByUserId: "user-1",
      }),
    ).toBe("Market package");
    expect(
      sourceNewMarketPackageLabel({
        solicitationMotion: "rfp",
        solicitationMotionAcceptedAt: accepted.solicitationMotionAcceptedAt,
        solicitationMotionAcceptedByUserId: "  ",
      }),
    ).toBe("Market package");
  });

  it("carries the same dependency into the phase label and the next action", () => {
    const unaccepted = {
      currentStage: "rfp",
      lifecycle: "active",
      solicitationMotion: "rfp" as const,
    };

    expect(sourceNewCurrentPhaseLabel(unaccepted)).toBe("Market package");
    expect(sourceNewNextAction(unaccepted).label).toBe("Open market package");

    expect(sourceNewCurrentPhaseLabel({ ...unaccepted, ...accepted })).toBe("RFP");
    expect(sourceNewNextAction({ ...unaccepted, ...accepted }).label).toBe(
      "Open RFP",
    );
  });
});

/**
 * A phase the event's journey never visits used to read "Later", which tells an
 * operator to expect work that will never arrive. A renegotiation does not go
 * to market, and the rail said it would.
 *
 * The journey resolver already decides this: `contract_optimization` declares
 * `skippedStageKeys` including `rfp`, which is the only canonical stage the
 * market-package phase stands for. Nothing is inferred here that the resolver
 * does not already decide.
 */
describe("a phase the journey never visits reports itself as off-path", () => {
  const renegotiation = {
    currentStage: "strategy",
    lifecycle: "active",
    sourcingMotion: "contract_optimization",
  };
  const competitive = {
    currentStage: "strategy",
    lifecycle: "active",
    sourcingMotion: "competitive_rfp",
  };
  const noEvidence = {
    request: false,
    define: false,
    suppliers: false,
    rfi: false,
  };

  it("resolves the two journeys apart", () => {
    expect(sourceNewJourneyForEvent(renegotiation).id).toBe("contract_optimization");
    expect(sourceNewJourneyForEvent(competitive).id).toBe("competitive_rfp");
  });

  it("reports the market package off-path for a renegotiation", () => {
    expect(sourceNewPhaseState("rfi", renegotiation, noEvidence)).toBe("off_path");
    expect(sourceNewPhaseStateLabel("off_path")).toBe("Not on this path");
  });

  // The other half: a competitive event must still be told the phase is coming.
  // Without this, "mark everything off-path" would pass the case above.
  it("keeps the market package ahead for a competitive event", () => {
    expect(sourceNewPhaseState("rfi", competitive, noEvidence)).toBe("not_open");
  });

  it("never reports define off-path, because no journey skips both its stages", () => {
    for (const event of [renegotiation, competitive]) {
      expect(sourceNewSkippedPhases(event)).not.toContain("define");
    }
  });

  // `request` and `suppliers` stand for no canonical stage, so a skipped set
  // can say nothing about them. A phase with no stages must never be skipped,
  // or an empty `every` would report every such phase as off-path.
  it("never reports a phase that stands for no stage", () => {
    expect(SOURCE_NEW_PHASE_STAGE_KEYS.request).toHaveLength(0);
    expect(SOURCE_NEW_PHASE_STAGE_KEYS.suppliers).toHaveLength(0);
    for (const phase of ["request", "suppliers"] as const) {
      expect(sourceNewPhaseIsSkipped(phase, ["strategy", "scope", "rfp"])).toBe(false);
      expect(sourceNewSkippedPhases(renegotiation)).not.toContain(phase);
    }
  });

  // A phase counts as skipped only when EVERY stage it stands for is skipped.
  // No journey defined today skips a proper subset, so it is exercised here
  // directly rather than left to an input that cannot distinguish it.
  it("treats a partly-skipped phase as still on the path", () => {
    expect(sourceNewPhaseIsSkipped("define", ["strategy"])).toBe(false);
    expect(sourceNewPhaseIsSkipped("define", ["scope"])).toBe(false);
    expect(sourceNewPhaseIsSkipped("define", ["strategy", "scope"])).toBe(true);
  });

  // Where the event actually is beats what its journey predicted. If a stage
  // resolves to a phase the journey declares skipped, that contradiction must
  // surface rather than hide behind an off-path label.
  it("reports the current phase as current even when the journey skips it", () => {
    const atMarket = {
      currentStage: "rfp",
      lifecycle: "active",
      sourcingMotion: "contract_optimization",
    };
    expect(sourceNewPhaseState("rfi", atMarket, noEvidence)).toBe("current");
  });

  // An unread motion must behave as this surface did before the field existed.
  it("falls back to the resolver when the motion is unread", () => {
    const unread = { currentStage: "strategy", lifecycle: "active" };
    expect(sourceNewPhaseState("rfi", unread, noEvidence)).toBe(
      sourceNewPhaseState("rfi", { ...unread, sourcingMotion: null }, noEvidence),
    );
  });

  /**
   * The boundary that makes this safe to act on.
   *
   * `getSourceJourneyForEvent` infers a motion from free text when none is
   * recorded, and that inference is not strong enough to tell an operator a
   * phase will never happen. "A contract is nearing renewal" resolves to a
   * renegotiation, yet an approaching renewal is the classic trigger for a
   * competitive re-bid, which does go to market. So an INFERRED skip must not
   * reach the rail; only a declared motion may.
   */
  it("refuses to put a phase off-path on an inferred motion", () => {
    const inferredRenegotiation = {
      currentStage: "strategy",
      lifecycle: "active",
      trigger: "A contract is nearing renewal.",
    };
    // Control: the resolver really does infer the skipping journey from this
    // text, so the assertion below is measuring the guard and not a journey
    // that never skipped anything.
    const journey = sourceNewJourneyForEvent(inferredRenegotiation);
    expect(journey.id).toBe("contract_optimization");
    expect(journey.skippedStageKeys).toContain("rfp");

    expect(sourceNewPhaseState("rfi", inferredRenegotiation, noEvidence)).toBe(
      "not_open",
    );
  });

  it("accepts the same skip once the motion is declared", () => {
    const declared = {
      currentStage: "strategy",
      lifecycle: "active",
      trigger: "A contract is nearing renewal.",
      sourcingMotion: "contract_optimization",
    };
    expect(sourceNewPhaseState("rfi", declared, noEvidence)).toBe("off_path");
  });

  it("treats a blank declared motion as unread", () => {
    for (const blank of ["", "   "]) {
      expect(
        sourceNewPhaseState(
          "rfi",
          { currentStage: "strategy", lifecycle: "active", sourcingMotion: blank },
          noEvidence,
        ),
      ).toBe("not_open");
    }
  });
});
