import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  buildVendorBafoInstructionPack,
  buildVendorChallengeIntelligence,
  buildVendorEvaluationDecisionView,
  buildVendorResponseMveProfiles,
} from "@/lib/source/proposal-intelligence";
import { VendorEvaluationScorecardPanel } from "../VendorEvaluationScorecardPanel";

describe("VendorEvaluationScorecardPanel", () => {
  it("renders normalized vendor comparison and scorecard for Vendor A/B/C", () => {
    const profileSet = buildVendorResponseMveProfiles({
      id: "skyh-test-event",
      code: "SKYH-SKYHARBOR-AMS-OUTSOURCING-2026",
      name: "SkyHarbor AMS Outsourcing RFP",
      accountName: "SkyHarbor Air",
    });
    const intelligence = buildVendorChallengeIntelligence(profileSet);
    const bafoPack = buildVendorBafoInstructionPack(intelligence);
    const decisionView = buildVendorEvaluationDecisionView(
      profileSet,
      intelligence,
      bafoPack,
    );

    const html = renderToStaticMarkup(
      createElement(VendorEvaluationScorecardPanel, { decisionView }),
    );

    expect(html).toContain("Normalized Vendor Comparison");
    expect(html).toContain("Evaluation Scorecard");
    expect(html).toContain("Executive Tradeoff Summary");
    expect(html).toContain("How the score is defended");
    expect(html).toContain("BAFO Improvement Scenario");
    expect(html).toMatch(/weighted/i);
    expect(html).toContain("Vendor A");
    expect(html).toContain("Vendor B");
    expect(html).toContain("Vendor C");
    expect(html).toMatch(/Weighted score|5-year TCO|Transition risk/i);
    expect(html).not.toMatch(/Northstar|TitanTech|CloudBridge|DataPeak|BlueMaster|ArcVault/i);
    expect(html).not.toMatch(/source_events|Sourcing Artifacts|Mode:|Current state:/i);
  });
});
