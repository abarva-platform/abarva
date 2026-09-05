import {
  buildSourceAvaModuleHandoffForRuntime,
  shouldEmitSourceAvaModuleHandoff,
} from "../module-handoff-runtime";

const BLOCKED_EVENT = {
  id: "src-event-1",
  code: "SRC-DEMO-PA-001",
  name: "Prior Authorization Automation Sourcing",
  currentStageKey: "rfp" as const,
  blocker: "Security questionnaire evidence is still missing",
  nextAction: "Upload the security questionnaire evidence before releasing the RFP",
};

describe("Source aVa runtime module handoff", () => {
  it("requires both Source analytics and Moves aVa hardening", () => {
    expect(
      shouldEmitSourceAvaModuleHandoff({
        sourceAnalyticsEnabled: true,
        movesAvaHardeningEnabled: true,
      }),
    ).toBe(true);
    expect(
      shouldEmitSourceAvaModuleHandoff({
        sourceAnalyticsEnabled: true,
        movesAvaHardeningEnabled: false,
      }),
    ).toBe(false);
    expect(
      shouldEmitSourceAvaModuleHandoff({
        sourceAnalyticsEnabled: false,
        movesAvaHardeningEnabled: true,
      }),
    ).toBe(false);
  });

  it("builds a structured Source-to-Moves P0 handoff from runtime event state", () => {
    const handoff = buildSourceAvaModuleHandoffForRuntime({
      sourceAnalyticsEnabled: true,
      movesAvaHardeningEnabled: true,
      tenant: "Demo Tenant",
      event: BLOCKED_EVENT,
      question: "I found a prior-auth automation opportunity, what next?",
      surface: "/source/events/src-event-1",
    });

    expect(handoff).toMatchObject({
      fromSurface: "source",
      toSurface: "moves",
      intent: "source_opportunity_to_moves_p0",
      targetRoute: "/strategic-moves/new",
      payload: {
        movePhase: 0,
        movePhaseLabel: "P0 Originate",
        prefill: {
          candidateIdea: "Prior-auth automation opportunity",
          proposedMoveTitle: "Prior-auth Automation Opportunity",
          originatingSurface: "source",
        },
        sourceContext: {
          eventCode: "SRC-DEMO-PA-001",
          eventName: "Prior Authorization Automation Sourcing",
          currentStageLabel: "RFP",
          blocker: "Security questionnaire evidence is still missing",
          nextAction: "Upload the security questionnaire evidence before releasing the RFP",
          gateSummary: null,
          citationLabels: ["[S1]", "[B1]", "[A1]"],
        },
      },
    });
  });

  it("does not emit a handoff for non-handoff questions", () => {
    expect(
      buildSourceAvaModuleHandoffForRuntime({
        sourceAnalyticsEnabled: true,
        movesAvaHardeningEnabled: true,
        tenant: "Demo Tenant",
        event: BLOCKED_EVENT,
        question: "Which vendors answered the pricing question?",
      }),
    ).toBeNull();
  });
});
