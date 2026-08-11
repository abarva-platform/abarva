import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { buildVendorResponseMveProfiles } from "@/lib/source/proposal-intelligence";
import type { SourceVendorResponseCompleteness } from "@/lib/source/vendor-response-types";
import { VendorResponsePackageCockpit } from "../VendorResponsePackageCockpit";

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

describe("VendorResponsePackageCockpit", () => {
  it("renders package readiness and proposal health without claiming full parser proof", () => {
    const profileSet = buildVendorResponseMveProfiles({
      id: "skyh-test-event",
      code: "SKYH-SKYHARBOR-AMS-OUTSOURCING-2026",
      name: "Managed services sourcing event",
      accountName: "Demo account",
    });

    const html = renderToStaticMarkup(
      createElement(VendorResponsePackageCockpit, {
        readiness: makeReadiness(),
        profileSet,
      }),
    );

    expect(html).toContain("Responses package cockpit");
    expect(html).toContain(
      "What vendors submitted, what parsed, what can be scored",
    );
    expect(html).toContain("Required before scoring");
    expect(html).toContain("Accepted formats: PDF, DOCX, XLSX, CSV.");
    expect(html).toContain("Main proposal");
    expect(html).toContain("Pricing template");
    expect(html).toContain("Proof exhibits");
    expect(html).toContain("Optional");
    expect(html).toContain("Vendor A");
    expect(html).toContain("Vendor B");
    expect(html).toContain("Response");
    expect(html).toContain("Pricing");
    expect(html).toContain("SLA");
    expect(html).toContain("Staffing");
    expect(html).toContain("Proposal health");
    expect(html).toContain("Do not score");
    expect(html).toContain(
      "Demo profile: prove with parsed vendor files before client scoring.",
    );
    expect(html).toContain("does not claim full long-form proposal extraction");
    expect(html).not.toMatch(/Northstar|TitanTech|CloudBridge|DataPeak/i);
  });
});
