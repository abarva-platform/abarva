import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  buildVendorBafoInstructionPack,
  buildVendorChallengeIntelligence,
  buildVendorEvaluationDecisionView,
  buildVendorResponseMveProfiles,
} from "@/lib/source/proposal-intelligence";
import type { SourceVendorResponseCompleteness } from "@/lib/source/vendor-response-types";
import { VendorResponseForwardGate } from "../VendorResponseForwardGate";

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

describe("VendorResponseForwardGate", () => {
  it("keeps Continue disabled until package, evidence, intelligence, and holdbacks are ready", () => {
    const profileSet = buildVendorResponseMveProfiles({
      id: "skyh-test-event",
      code: "SKYH-SKYHARBOR-AMS-OUTSOURCING-2026",
      name: "Managed services sourcing event",
      accountName: "Demo account",
    });
    const challengeIntelligence = buildVendorChallengeIntelligence(profileSet);
    const bafoInstructionPack = buildVendorBafoInstructionPack(
      challengeIntelligence,
    );
    const evaluationDecisionView = buildVendorEvaluationDecisionView(
      profileSet,
      challengeIntelligence,
      bafoInstructionPack,
    );

    const html = renderToStaticMarkup(
      createElement(VendorResponseForwardGate, {
        readiness: makeReadiness(),
        profileSet,
        challengeIntelligence,
        bafoInstructionPack,
        evaluationDecisionView,
      }),
    );

    expect(html).toContain("Can we move from Responses to Evaluation?");
    expect(html).toContain("Continue to Evaluation");
    expect(html).toContain("disabled");
    expect(html).toContain("Required package gaps closed");
    expect(html).toContain("Evidence parsed and cited");
    expect(html).toContain("Score holdbacks resolved");
    expect(html).toContain("Use the BAFO clarification pack");
    expect(html).toContain("Do not move to Evaluation");
    expect(html).not.toMatch(/Northstar|TitanTech|CloudBridge|DataPeak/i);
  });
});
