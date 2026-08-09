import {
  SOURCE_JOURNEYS,
  adaptStageViewToSourceJourney,
  coerceStageToSourceJourney,
  getSourceJourneyForEvent,
  nextSourceStageForJourney,
  resolveSourceSourcingMotion,
  sourceJourneyLabelForStage,
  sourceJourneyStageKeys,
} from "../sourcing-motion-journeys";
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
    expect(coerceStageToSourceJourney(journey, "responses", "responses")).toBe(
      "pricing",
    );
    expect(coerceStageToSourceJourney(journey, "selection", "selection")).toBe(
      "transition",
    );
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
});
