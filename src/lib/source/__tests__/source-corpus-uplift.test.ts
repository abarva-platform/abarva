import { corpus } from "@/lib/intelligence";
import {
  SOURCE_GOLDEN_EVENT_IDS,
  buildSourceBafoNegotiationPlan,
  buildSourcePricingNormalization,
  getSourceEventSeed,
  getSourcePatternSectionsSeed,
} from "@/lib/source";
import type { SourcePricingVendorInput } from "@/lib/source/pricing-normalization-types";
import type { SourceVendorResponseSeedInput } from "@/lib/source/vendor-response-types";

const REQUIRED_SECTIONS = [
  "Executive response",
  "Scope confirmation",
  "Pricing template",
  "Assumptions and exclusions",
  "Transition plan",
  "Delivery model",
  "SLA response",
  "Security and compliance response",
  "Automation / productivity roadmap",
  "References and evidence",
];

function getApexAmsEvent() {
  const event = getSourceEventSeed(
    SOURCE_GOLDEN_EVENT_IDS.apexRetailAmsOutsourcing2026,
  );
  expect(event).toBeTruthy();
  return event as NonNullable<typeof event>;
}

function pricingInputs(): SourcePricingVendorInput[] {
  return [
    {
      vendorId: "wipro",
      vendorName: "Wipro",
      currency: "USD",
      annualRunCostUsd: 29_800_000,
      transitionCostUsd: 1_200_000,
      oneTimeSetupCostUsd: 450_000,
      optionalServicesUsd: 650_000,
      excludedServicesUsd: 4_800_000,
      changeOrderExposureUsd: 1_400_000,
      optionals: ["Automation factory", "AIOps runbooks"],
      exclusions: [
        "Minor enhancements and release support are excluded unless separately priced.",
        "Third-party API support and change-control work are excluded.",
      ],
      supportHoursPerWeek: 650,
      applicationCount: 74,
      ticketVolumePerMonth: 4_600,
      automationProductivityAssumptionPercent: 18,
      rateEscalationPercent: 7,
      offshorePercent: 72,
      onshorePercent: 28,
      assumptions: [
        "Q4 holiday volume remains within current run baseline.",
        "Store-system emergency changes are handled through standard change control.",
      ],
      securityComplianceNotes: [
        "PCI channel obligations require final responsibility matrix.",
      ],
      evidenceUsability: "usable",
      evidenceStatus: "Available",
      responseStatus: "submitted",
      responseRiskLevel: "medium",
      completenessStatus: "complete",
    },
    {
      vendorId: "infosys",
      vendorName: "Infosys",
      currency: "USD",
      annualRunCostUsd: 27_900_000,
      transitionCostUsd: 900_000,
      oneTimeSetupCostUsd: 300_000,
      optionalServicesUsd: 900_000,
      excludedServicesUsd: 2_900_000,
      changeOrderExposureUsd: 1_900_000,
      optionals: ["Benchmarking workshop"],
      exclusions: ["Tooling maintenance is excluded from base run price."],
      supportHoursPerWeek: 590,
      applicationCount: 74,
      ticketVolumePerMonth: 3_900,
      automationProductivityAssumptionPercent: 24,
      rateEscalationPercent: 9,
      offshorePercent: 64,
      onshorePercent: 36,
      assumptions: ["Ticket volumes are priced at steady-state levels."],
      securityComplianceNotes: ["Subcontractor access list pending."],
      evidenceUsability: "low_confidence",
      evidenceStatus: "Parsed",
      responseStatus: "submitted",
      responseRiskLevel: "high",
      completenessStatus: "partially_complete",
    },
  ];
}

function vendorResponses(): SourceVendorResponseSeedInput[] {
  return pricingInputs().map((vendor) => ({
    vendorId: vendor.vendorId,
    vendorName: vendor.vendorName,
    responseStatus: vendor.responseStatus ?? "submitted",
    receivedAt: "2026-05-15T00:00:00.000Z",
    requiredSections: REQUIRED_SECTIONS,
    submittedSections: REQUIRED_SECTIONS,
    assumptions: vendor.assumptions,
    exclusions: vendor.exclusions,
    pricingTemplateStatus: "complete",
    transitionPlanStatus: "complete",
    securityResponseStatus:
      vendor.vendorId === "infosys" ? "incomplete" : "complete",
    automationRoadmapStatus:
      vendor.vendorId === "infosys" ? "incomplete" : "complete",
    evidenceStatus: vendor.evidenceStatus ?? "Available",
    evidenceUsability: vendor.evidenceUsability ?? "usable",
    responseRiskLevel: vendor.responseRiskLevel ?? "medium",
  }));
}

describe("Source sourcing corpus uplift pilot", () => {
  it("loads the Source-1 pricing and gaming patterns into the intelligence corpus", () => {
    expect(corpus.patternsById.get("PAT-SRC-PNG-001")).toMatchObject({
      title: "AMS Transition Cost Burial",
      category: "pricing_intelligence",
      vendorClass: "service",
    });
    expect(
      corpus.patternsById.get("PAT-SRC-PNG-007")?.industryVariants?.[0],
    ).toMatchObject({
      industry: "retail_cpg",
    });
    expect(
      corpus.patternsById.get("PAT-SRC-PNG-011")?.standardClauses?.[0],
    ).toMatchObject({
      clauseArea: "Benchmarking and exit",
    });
    expect(corpus.patternsById.get("PAT-SRC-BAFO-003")).toMatchObject({
      title: "Transition Holdback and Warranty",
      category: "contract_intelligence",
    });
    expect(
      corpus.patternsById.get("PAT-SRC-BAFO-008")?.standardClauses?.[0],
    ).toMatchObject({
      clauseArea: "Benchmarking",
    });
  });

  it("injects Apex AMS relevant pattern sections without applying them to unrelated events", () => {
    const apexEvent = getApexAmsEvent();
    const digitalEvent = getSourceEventSeed(
      SOURCE_GOLDEN_EVENT_IDS.digitalAppBuild,
    );
    expect(digitalEvent).toBeTruthy();

    const apexSections = getSourcePatternSectionsSeed(apexEvent);
    expect(apexSections.map((section) => section.id)).toEqual(
      expect.arrayContaining([
        "PAT-SRC-PNG-001",
        "PAT-SRC-PNG-007",
        "PAT-SRC-PNG-009",
        "PAT-SRC-PNG-011",
        "PAT-SRC-BAFO-003",
        "PAT-SRC-BAFO-008",
        "PAT-SRC-VPF-NO-EVIDENCE-NO-NUMBER",
        "PAT-SRC-RFP-EVAL-018",
        "PAT-SRC-ART-PRICING-WORKBOOK",
        "PAT-SRC-CGV-SAVINGS-CLAIM-GATE",
      ]),
    );
    expect(apexSections.map((section) => section.summary).join(" ")).toMatch(
      /Q4|transition-inclusive|BAFO/,
    );

    expect(
      getSourcePatternSectionsSeed(
        digitalEvent as NonNullable<typeof digitalEvent>,
      ),
    ).toEqual([]);
  });

  it("surfaces retail AMS pricing traps as pattern-level pressure points, not savings claims", () => {
    const event = getApexAmsEvent();
    const readiness = buildSourcePricingNormalization({
      event: {
        ...event,
        pricingInputs: pricingInputs(),
        vendorResponses: vendorResponses().map((response) => ({
          vendorId: response.vendorId,
          vendorName: response.vendorName,
          evidenceUsability: response.evidenceUsability,
          evidenceStatus: response.evidenceStatus,
          pricingTemplateStatus: response.pricingTemplateStatus,
          transitionPlanStatus: response.transitionPlanStatus,
          securityResponseStatus: response.securityResponseStatus,
          automationRoadmapStatus: response.automationRoadmapStatus,
          responseStatus: response.responseStatus,
        })),
      },
    });

    const trapText = readiness.traps
      .map((trap) => `${trap.category}: ${trap.signal}`)
      .join("\n");

    expect(trapText).toContain("Corpus: AMS transition cost burial");
    expect(trapText).toContain("Corpus: retail peak support");
    expect(trapText).toContain("Corpus: scope exclusion recapture");
    expect(trapText).toContain(
      "Corpus: benchmarking and exit value protection",
    );
    expect(readiness.summaryNarrative).not.toMatch(/realized savings/i);
    expect(readiness.atlasExecutiveImplication).not.toMatch(/\$[0-9]/);
  });

  it("turns Source-1 and Retail-1 corpus into BAFO asks and assumption locks", () => {
    const event = getApexAmsEvent();
    const plan = buildSourceBafoNegotiationPlan({
      event: {
        ...event,
        pricingInputs: pricingInputs(),
        vendorResponses: vendorResponses(),
      },
    });

    const askText = plan.vendorNegotiationPlans
      .flatMap((vendor) => vendor.recommendedAsks)
      .join("\n");
    const assumptionText = plan.assumptionLockList.join("\n");

    expect(askText).toMatch(/BAFO trade envelope/i);
    expect(askText).toMatch(/Q4 retail peak support/i);
    expect(askText).toMatch(/automation savings/i);
    expect(askText).toMatch(/annual benchmark rights/i);
    expect(askText).toMatch(/transition holdback/i);
    expect(askText).toMatch(/payment-term concession/i);
    expect(askText).toMatch(/SLA credit step-ups/i);
    expect(askText).toMatch(/subcontractors, delivery locations/i);
    expect(assumptionText).toMatch(/Retail Q4 peak/i);
    expect(assumptionText).toMatch(/Run-rate savings remain provisional/i);
    expect(assumptionText).toMatch(
      /Transition holdback, stabilization warranty/i,
    );
  });
});
