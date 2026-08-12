import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  buildVendorBafoInstructionPack,
  buildVendorChallengeIntelligence,
  buildVendorEvaluationDecisionView,
  buildVendorResponseParseReportsFromProfiles,
  buildVendorResponseMveProfiles,
} from "@/lib/source/proposal-intelligence";
import { VendorResponseIntelligenceBrief } from "../VendorResponseIntelligenceBrief";

describe("VendorResponseIntelligenceBrief", () => {
  it("summarizes produced insights, evidence used, missing inputs, and BAFO leverage", () => {
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
      createElement(VendorResponseIntelligenceBrief, {
        profileSet,
        challengeIntelligence,
        bafoInstructionPack,
        evaluationDecisionView,
      }),
    );

    expect(html).toContain("Proposal intelligence brief");
    expect(html).toContain("What Source learned before scoring");
    expect(html).toContain("Response profiles");
    expect(html).toContain("Challenges found");
    expect(html).toContain("BAFO asks");
    expect(html).toContain("Evidence used");
    expect(html).toContain("Missing before score lock");
    expect(html).toContain("Leverage path");
    expect(html).toContain("Vendor A");
    expect(html).toContain("Vendor B");
    expect(html).toContain("Vendor C");
    expect(html).toMatch(/pricing credit|price-down|service-credit|coverage/i);
    expect(html).toContain(
      "Client scoring still requires parsed, vendor-isolated files with cited evidence.",
    );
    expect(html).not.toMatch(/Northstar|TitanTech|CloudBridge|DataPeak/i);
  });

  it("uses parser reports as the evidence source when response packages are parsed", () => {
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
    const parseReports =
      buildVendorResponseParseReportsFromProfiles(profileSet);

    const html = renderToStaticMarkup(
      createElement(VendorResponseIntelligenceBrief, {
        profileSet,
        challengeIntelligence,
        bafoInstructionPack,
        parseReports,
      }),
    );

    expect(html).toContain("Parsed reports");
    expect(html).toContain("vendor packages parsed with citations");
    expect(html).toContain("paragraph");
    expect(html).toContain("Parsed reports are vendor-isolated");
    expect(html).toContain("Missing before score lock");
  });
});
