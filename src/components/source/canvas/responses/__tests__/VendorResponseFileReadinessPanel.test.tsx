import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { buildVendorResponseMveProfiles } from "@/lib/source/proposal-intelligence";
import type { SourceVendorResponseCompleteness } from "@/lib/source/vendor-response-types";
import { VendorResponseFileReadinessPanel } from "../VendorResponseFileReadinessPanel";

function makeReadiness(): SourceVendorResponseCompleteness {
  return {
    eventId: "evt-1",
    eventName: "Managed services sourcing event",
    generatedAt: "2026-08-11T00:00:00.000Z",
    stage: "responses",
    summary: {
      totalVendors: 2,
      complete: 1,
      partiallyComplete: 1,
      incomplete: 0,
      notComparable: 0,
      blocked: 0,
    },
    comparabilityReadiness: "partially_complete",
    blockers: [],
    recommendedNextAction:
      "Collect missing sections and resolve evidence quality before comparison.",
    records: [
      {
        vendorId: "vendor-a-incumbent-profile",
        vendorName: "Vendor A",
        responseStatus: "submitted",
        receivedAt: "2026-08-01T00:00:00.000Z",
        requiredSections: ["Pricing template", "SLA response"],
        submittedSections: ["Pricing template", "SLA response"],
        missingSections: [],
        assumptions: ["Buyer provides access"],
        exclusions: ["None material"],
        pricingTemplateStatus: "complete",
        transitionPlanStatus: "complete",
        securityResponseStatus: "complete",
        automationRoadmapStatus: "complete",
        evidenceStatus: "Parsed",
        comparabilityStatus: "comparable",
        blockers: [],
        completenessStatus: "complete",
        rationale: ["Response is complete and has a comparable structure."],
        recommendedNextAction:
          "Vendor A: compare with peers after confirming pricing unit consistency.",
        nexusGuidance:
          "Vendor A: compare with peers after confirming pricing unit consistency.",
        sentinelEvidenceNotes: [],
        stewardGateNotes: [
          "Vendor is not blocked by steward gate at this time.",
        ],
        atlasExecutiveImplication:
          "Vendor A: response quality is sufficient for proposal comparison.",
      },
      {
        vendorId: "vendor-b-scale-profile",
        vendorName: "Vendor B",
        responseStatus: "submitted",
        receivedAt: "2026-08-02T00:00:00.000Z",
        requiredSections: ["Pricing template", "SLA response"],
        submittedSections: ["SLA response"],
        missingSections: ["Pricing template"],
        assumptions: [],
        exclusions: ["Demand volatility exception"],
        pricingTemplateStatus: "incomplete",
        transitionPlanStatus: "complete",
        securityResponseStatus: "complete",
        automationRoadmapStatus: "incomplete",
        evidenceStatus: "Low Confidence",
        comparabilityStatus: "partially_comparable",
        blockers: ["Vendor B: pricing template is not complete."],
        completenessStatus: "partially_complete",
        rationale: ["Evidence quality is weak."],
        recommendedNextAction: "Vendor B: pricing template is not complete.",
        nexusGuidance:
          "Vendor B: complete required sections and close blockers before comparison.",
        sentinelEvidenceNotes: [
          "Vendor B: evidence usability is low confidence for commercial claims.",
        ],
        stewardGateNotes: [
          "Do not move this vendor to evaluation until required sections are complete.",
        ],
        atlasExecutiveImplication:
          "Vendor B: comparability confidence is reduced.",
      },
    ],
  };
}

describe("VendorResponseFileReadinessPanel", () => {
  it("renders required file families, ownership, parse status, citations, and next action", () => {
    const profileSet = buildVendorResponseMveProfiles({
      id: "skyh-test-event",
      code: "SKYH-SKYHARBOR-AMS-OUTSOURCING-2026",
      name: "Managed services sourcing event",
      accountName: "Demo account",
    });

    const html = renderToStaticMarkup(
      createElement(VendorResponseFileReadinessPanel, {
        readiness: makeReadiness(),
        profileSet,
      }),
    );

    expect(html).toContain("What exactly must be uploaded for each vendor?");
    expect(html).toContain("scoring-readiness ledger");
    expect(html).toContain("Minimum package: 2 required files per vendor");
    expect(html).toContain(
      "one main proposal package plus one pricing workbook",
    );
    expect(html).toContain(
      "they are not separate required uploads unless the buyer marks them required",
    );
    expect(html).toContain("Vendors");
    expect(html).toContain("Required done");
    expect(html).toContain("Open required");
    expect(html).toContain("Cited items");
    expect(html).toContain("Main proposal package");
    expect(html).toContain("Pricing workbook");
    expect(html).toContain("SLA commitments");
    expect(html).toContain("Staffing and location model");
    expect(html).toContain("Transition plan");
    expect(html).toContain("Exceptions and assumptions");
    expect(html).toContain("Proof exhibits");
    expect(html).toContain("Conditional");
    expect(html).toContain("Vendor response lead");
    expect(html).toContain("Commercial lead");
    expect(html).toContain("PDF or DOCX");
    expect(html).toContain("XLSX, CSV");
    expect(html).toContain("Vendor B");
    expect(html).toContain("Partial");
    expect(html).toContain("Low confidence");
    expect(html).toContain("Review pricing workbook extraction.");
    expect(html).toContain("Done");
    expect(html).toContain(
      "Conditional means the content must be citable somewhere in the proposal package",
    );
    expect(html).not.toMatch(/Northstar|TitanTech|CloudBridge|DataPeak/i);
  });
});
