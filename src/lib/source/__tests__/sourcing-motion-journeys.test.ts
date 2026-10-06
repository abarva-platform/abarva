import {
  SOURCE_JOURNEYS,
  adaptStageViewToSourceJourney,
  coerceStageToSourceJourney,
  getSourceJourneyForEvent,
  nextSourceStageForJourney,
  resolveSourceSourcingMotion,
  sourceJourneyLabelForStage,
  sourceJourneyStageHref,
  sourceJourneyStageKeys,
} from "../sourcing-motion-journeys";
import {
  SOURCE_NEW_PHASE_ORDER,
  sourceNewCurrentPhase,
} from "@/lib/source/new-workspace/phase-state";
import type { StageAnalyticsView } from "@/components/source/canvas/analytics/view-model";

describe("Source sourcing motion journeys", () => {
  it("keeps competitive sourcing on the full RFP journey", () => {
    const journey = getSourceJourneyForEvent({
      eventName: "Application Managed Services Outsourcing",
      classifiedCategory: "ams",
    });

    expect(journey.id).toBe("competitive_rfp");
    expect(sourceJourneyStageKeys(journey)).toEqual([
      "strategy",
      "scope",
      "rfp",
      "responses",
      "evaluation",
      "pricing",
      "bafo",
      "executive_decision",
      "selection",
      "transition",
      "value",
    ]);
    expect(nextSourceStageForJourney("scope", journey)).toBe("rfp");
  });

  it("uses a shorter negotiation journey for renewal and contract optimization work", () => {
    const journey = getSourceJourneyForEvent({
      eventName: "Salesforce contract renegotiation",
      archetype: "Contract Renewal / Renegotiation",
    });

    expect(journey.id).toBe("contract_optimization");
    expect(sourceJourneyStageKeys(journey)).toEqual([
      "strategy",
      "scope",
      "pricing",
      "bafo",
      "executive_decision",
      "transition",
      "value",
    ]);
    expect(journey.skippedStageKeys).toEqual([
      "rfp",
      "responses",
      "evaluation",
      "selection",
    ]);
    expect(nextSourceStageForJourney("scope", journey)).toBe("pricing");
    expect(nextSourceStageForJourney("pricing", journey)).toBe("bafo");
    expect(nextSourceStageForJourney("value", journey)).toBeNull();
    expect(sourceJourneyLabelForStage(journey, "pricing")).toBe(
      "Commercial Baseline",
    );
    expect(sourceJourneyLabelForStage(journey, "bafo")).toBe(
      "Negotiation Plan",
    );
  });

  it("prefers explicit stored sourcing motion over category and text inference", () => {
    expect(
      resolveSourceSourcingMotion({
        sourcingMotion: "contract_optimization",
        eventName: "Application Managed Services Outsourcing RFP",
        classifiedCategory: "ams",
      }),
    ).toBe("contract_optimization");

    expect(
      resolveSourceSourcingMotion({
        sourcingMotion: "competitive_rfp",
        eventName: "Contract renewal renegotiation",
        classifiedCategory: "saas_renewal",
      }),
    ).toBe("competitive_rfp");
  });

  it("recognizes commercial renegotiation wording from event titles", () => {
    const journey = getSourceJourneyForEvent({
      eventName:
        "CTR-090 commercial renegotiation — benchmarking rights, rate-card re-base, alternatives clause",
      eventCode: "SKYH-CTR090-COMMERCIAL-RENEGOTIATION-2026-20F02DAE",
      eventType: "managed_service",
    });

    expect(journey.id).toBe("contract_optimization");
    expect(sourceJourneyStageKeys(journey)).toHaveLength(7);
  });

  it("does not classify generic AMS managed-service work as renewal", () => {
    const journey = getSourceJourneyForEvent({
      eventName: "Application Managed Services Outsourcing RFP",
      eventType: "managed_service",
      classifiedCategory: "ams",
    });

    expect(journey.id).toBe("competitive_rfp");
  });

  it("keeps AMS events on the full RFP journey when optimization is the trigger but RFP is the work product", () => {
    const journey = getSourceJourneyForEvent({
      eventName: "Application Managed Services (AMS) Sourcing Event",
      eventType: "ams",
      classifiedCategory: "ams",
      triggerDescription:
        "AMS contract optimization is needed now; target is a defensible RFP package.",
    });

    expect(journey.id).toBe("competitive_rfp");
    expect(nextSourceStageForJourney("scope", journey)).toBe("rfp");
  });

  it("maps skipped legacy stages to the next visible checkpoint", () => {
    const journey = SOURCE_JOURNEYS.contract_optimization;

    expect(coerceStageToSourceJourney(journey, "rfp", "rfp")).toBe("pricing");
    expect(
      coerceStageToSourceJourney(
        journey,
        "rfp_rfi_package",
        "rfp_rfi_package",
      ),
    ).toBe("pricing");
    expect(coerceStageToSourceJourney(journey, "responses", "responses")).toBe(
      "pricing",
    );
    expect(
      coerceStageToSourceJourney(
        journey,
        "vendor_responses",
        "vendor_responses",
      ),
    ).toBe("pricing");
    expect(coerceStageToSourceJourney(journey, "selection", "selection")).toBe(
      "transition",
    );
    expect(
      coerceStageToSourceJourney(
        journey,
        "contract_mobilization",
        "contract_mobilization",
      ),
    ).toBe("transition");
  });

  it("builds journey-aware stage links for optimization events", () => {
    expect(
      sourceJourneyStageHref({
        eventId: "evt-1",
        journey: SOURCE_JOURNEYS.contract_optimization,
        stageKey: "rfp",
      }),
    ).toBe("/source/events/evt-1?stage=pricing");
    expect(
      sourceJourneyStageHref({
        eventId: "evt-1",
        journey: SOURCE_JOURNEYS.contract_optimization,
        stageKey: "rfp",
        workspace: "approvals",
      }),
    ).toBe("/source/events/evt-1?stage=pricing&workspace=approvals");
  });

  it("keeps competitive sourcing links on the full eleven-stage rail", () => {
    expect(
      sourceJourneyStageHref({
        eventId: "evt-1",
        journey: SOURCE_JOURNEYS.competitive_rfp,
        stageKey: "rfp",
      }),
    ).toBe("/source/events/evt-1?stage=rfp");
  });

  it("removes RFP language from an optimization-adapted scope view", () => {
    const scopeView: StageAnalyticsView = {
      stageKey: "scope",
      stageName: "Scope",
      purpose:
        "Define the work precisely, from evidence — so the RFP is built on facts, not assumptions.",
      intel: {
        provenance: "sample",
        lead: "The RFP should be built on facts.",
        points: [
          {
            tone: "archetype",
            tag: "Archetype",
            text: "The RFP clause checklist protects value before vendors answer.",
          },
        ],
      },
      tasks: [
        {
          id: "scope.sponsor",
          title: "Sponsor commitment",
          subtitle: "RFP readiness pack",
          type: "provide",
          state: "todo",
          guide: "Upload the signed letter before going into RFP.",
          cta: "Upload letter",
        },
      ],
      gate: {
        approver: "Stage owner",
        confirms: [
          {
            label: "Scope final",
            detail: "The boundary is correct — advance to RFP.",
          },
        ],
        generates: [{ label: "RFP draft", code: "d09" }],
        nextStageName: "RFP",
      },
    };

    const adapted = adaptStageViewToSourceJourney(
      scopeView,
      SOURCE_JOURNEYS.contract_optimization,
    );

    const rendered = JSON.stringify(adapted);
    expect(adapted.gate.nextStageName).toBe("Commercial Baseline");
    expect(rendered).not.toMatch(/\bRFP\b/);
    expect(rendered).toMatch(/negotiation/);
  });

  /**
   * ITEM U-566. Whether the Source New Stage 04 vendor-readiness panel is
   * reached is a journey question, and this is the case that says so.
   *
   * The panel is gated on the `responses` stage, and the last phase the
   * Source New workspace shows is `rfi` — the `rfp` stage. So "is any event
   * MEANT to reach that panel?" is decided here, not in the component: on the
   * competitive journey an event sitting at the market package is ONE governed
   * advance from the stage that mounts it, which makes an unreached panel a
   * seeded-data gap rather than dead code; on the renegotiation journey the
   * stage is not merely later but absent, so the panel is dead there by design
   * and no amount of advancing reaches it.
   *
   * The negative half sweeps every stage of the renegotiation journey rather
   * than one of them, because a single `not.toBe` is satisfied by any other
   * stage and would survive `responses` being inserted elsewhere in the list.
   */
  it("decides from the journey whether an event is meant to reach the Responses stage", () => {
    const competitive = SOURCE_JOURNEYS.competitive_rfp;
    const optimization = SOURCE_JOURNEYS.contract_optimization;

    // The last phase the workspace shows is the `rfp` stage, under its
    // operator name. Nothing past it has a phase of its own.
    expect(SOURCE_NEW_PHASE_ORDER[SOURCE_NEW_PHASE_ORDER.length - 1]).toBe("rfi");
    expect(
      sourceNewCurrentPhase({ currentStage: "rfp", lifecycle: "active" }),
    ).toBe("rfi");

    // Competitive: one governed advance from there is the panel's stage.
    expect(nextSourceStageForJourney("rfp", competitive)).toBe("responses");
    expect(nextSourceStageForJourney("rfp_rfi_package", competitive)).toBe(
      "responses",
    );

    // Renegotiation: the stage is absent from the journey, so no stage on it
    // advances into the panel and the `rfp` stage is not even on the path.
    expect(sourceJourneyStageKeys(optimization)).not.toContain("responses");
    expect(nextSourceStageForJourney("rfp", optimization)).toBeNull();
    for (const key of sourceJourneyStageKeys(optimization)) {
      expect(nextSourceStageForJourney(key, optimization)).not.toBe(
        "responses",
      );
    }
  });
});
