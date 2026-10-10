/** @jest-environment jsdom */
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
      createElement(VendorEvaluationScorecardPanel, {
        decisionView,
        decisionBriefDocxHref:
          "/api/v1/source/skyh-test-event/artifacts/d24_decision_brief/render?format=docx",
        decisionBriefPdfHref:
          "/api/v1/source/skyh-test-event/artifacts/d24_decision_brief/render?format=pdf",
        eventDisplayName: "SkyHarbor Air AMS Outsourcing RFP",
      }),
    );

    expect(html).toContain("Vendor Comparison");
    expect(html).not.toContain("Normalized Vendor Comparison");
    expect(html).toContain("Evaluation Scorecard");
    expect(html).toContain("Executive Tradeoff Summary");
    expect(html).toContain("Executive decision cockpit");
    expect(html).toContain("Risk-adjusted lead");
    expect(html).toContain("Price benchmark");
    expect(html).toContain("Highest transition risk");
    expect(html).toContain("BAFO upside to test");
    expect(html).toContain("Do not award yet");
    expect(html).toContain("Open conditions before award");
    expect(html).toContain("Price ranking withheld");
    expect(html).toContain("How the score is defended");
    expect(html).toContain("BAFO Improvement Scenario");
    expect(html).toContain("Held");
    expect(html).toContain("pending evidence");
    expect(html).toContain("no score uplift is asserted");
    expect(html).not.toContain("+0.0 pts");
    expect(html).toContain("score remains provisional");
    expect(html).toContain("Decision brief");
    expect(html).toContain("DOCX");
    expect(html).toContain("PDF");
    expect(html).toContain("SkyHarbor Air AMS Outsourcing RFP");
    expect(html).toContain("named client reviewers still own final scores");
    expect(html).toContain("Scoreable");
    expect(html).toContain("Needs clarification");
    expect(html).toContain(
      "Ready for named evaluator review. AI suggestion is not final.",
    );
    expect(html).toContain(
      "Resolve the cited evidence gap before final scoring.",
    );
    expect(html).toMatch(/weighted/i);
    expect(html).toContain("Vendor A");
    expect(html).toContain("Vendor B");
    expect(html).toContain("Vendor C");
    expect(html).toMatch(/Weighted score|5-year TCO|Transition risk/i);
    expect(html).not.toMatch(
      /Northstar|TitanTech|CloudBridge|DataPeak|BlueMaster|ArcVault/i,
    );
    expect(html).not.toMatch(
      /source_events|Sourcing Artifacts|Mode:|Current state:|Airline Demo|SKYH-NORMALIZE|Atlas Decision Brief|Steward sign-off|Sentinel Risk/i,
    );
  });

  it("does not name a vendor as a price benchmark when comparison is withheld", () => {
    const profiles = buildVendorResponseMveProfiles({
      id: "skyh-price-test",
      name: "SkyHarbor AMS Outsourcing",
      accountName: "SkyHarbor Air",
    });
    const view = buildVendorEvaluationDecisionView(profiles)!;
    const html = renderToStaticMarkup(
      createElement(VendorEvaluationScorecardPanel, { decisionView: view }),
    );
    const root = document.createElement("div");
    root.innerHTML = html;
    const cockpit = root.querySelector(
      '[aria-label="Executive decision cockpit"]',
    )!;
    const label = Array.from(cockpit.querySelectorAll("span")).find(
      (node) => node.textContent === "Price benchmark",
    )!;
    expect(label.parentElement?.textContent).toContain("Not comparable");
    expect(label.parentElement?.textContent).not.toMatch(/Vendor [ABC]/);
    expect(cockpit.textContent).toContain("Price ranking withheld");
    const commercial = Array.from(root.querySelectorAll("tr")).find((node) =>
      node.textContent?.includes("Commercial value"),
    )!;
    expect(commercial.textContent).toContain("Withheld");
    expect(commercial.textContent).not.toContain("0.0");
  });
});
