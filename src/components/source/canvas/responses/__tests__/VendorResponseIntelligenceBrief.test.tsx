/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom";
import { render, screen, within } from "@testing-library/react";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  buildVendorBafoInstructionPack,
  buildVendorChallengeIntelligence,
  buildVendorEvaluationDecisionView,
  buildVendorResponseParseReportsFromProfiles,
  buildVendorResponseMveProfiles,
} from "@/lib/source/proposal-intelligence";
import type {
  CommercialLeverageSeed,
  VendorChallengeIntelligence,
} from "@/lib/source/proposal-intelligence";
import { VendorResponseIntelligenceBrief } from "../VendorResponseIntelligenceBrief";

function severityFixture(
  severities: CommercialLeverageSeed["confidence"][],
): VendorChallengeIntelligence {
  return {
    sourceEventId: "synthetic-event",
    tenantKey: "synthetic-test",
    generatedAt: "2026-10-10T00:00:00.000Z",
    challengeCount: severities.length,
    leverageSeedCount: severities.length,
    challengeLog: severities.map((severity, index) => ({
      challengeId: `challenge-${index}`,
      vendorId: `vendor-${index}`,
      vendorName: `Vendor ${index + 1}`,
      issueCategory: "unsupported_claim",
      finding: "Commercial commitment needs validation.",
      evidenceLabel: "",
      severity,
      whyItMatters: "The commitment is unconfirmed.",
      clarificationQuestion: "Confirm the commercial commitment.",
      scoringImplication: "Review before scoring.",
      readyForEvaluation: "conditional",
    })),
    leverageSeeds: severities.map((severity, index) => ({
      seedId: `seed-${index}`,
      vendorId: `vendor-${index}`,
      vendorName: `Vendor ${index + 1}`,
      leverType: "proposal_claim_not_supported",
      finding: "Commercial commitment needs validation.",
      evidenceLabel: "",
      buyerRisk: "The commitment is unconfirmed.",
      recommendedAsk: "Confirm the commercial commitment.",
      bafoLanguage: "Confirm the commercial commitment.",
      confidence: severity,
      estimatedImpact: "Qualitative negotiation opportunity",
    })),
  };
}

describe("VendorResponseIntelligenceBrief", () => {
  it.each([
    ["mixed severity", ["high", "medium", "low"], "1/3"],
    ["no high severity", ["medium", "low"], "0/2"],
    ["no leverage seeds", [], "0/0"],
  ] as const)(
    "counts high-severity leverage for %s",
    (_label, severities, ratio) => {
      render(
        <VendorResponseIntelligenceBrief
          challengeIntelligence={severityFixture([...severities])}
        />,
      );

      const tile = screen.getByText("High-severity leverage").parentElement!;
      expect(within(tile).getByText(ratio)).toBeInTheDocument();
      expect(
        within(tile).getByText(
          "Leverage seeds rated high severity out of all leverage seeds.",
        ),
      ).toBeInTheDocument();
      expect(screen.queryByText("Evidenced impact")).not.toBeInTheDocument();
      expect(
        screen.queryByText(/commercial impact backed by cited evidence/i),
      ).not.toBeInTheDocument();
    },
  );

  it.each(["high", "medium", "low"] as const)(
    "labels %s severity without implying verified impact or booking",
    (severity) => {
      const challengeIntelligence = severityFixture([severity]);
      if (severity === "low") {
        challengeIntelligence.leverageSeeds[0].confidence = "medium";
      }
      render(
        <VendorResponseIntelligenceBrief
          challengeIntelligence={challengeIntelligence}
        />,
      );

      const impactCell = screen
        .getByText("Qualitative negotiation opportunity")
        .closest("td")!;
      expect(
        within(impactCell).getByText(`Severity: ${severity}`),
      ).toBeInTheDocument();
      expect(screen.getByText("No cite")).toBeInTheDocument();
      expect(screen.queryByText("Evidenced")).not.toBeInTheDocument();
      expect(screen.queryByText("Test, do not book")).not.toBeInTheDocument();
      expect(
        screen.getByTestId("source-vendor-response-intelligence-brief"),
      ).not.toHaveTextContent(
        /booking|booked|saving|unevidenced|evidence-backed/i,
      );
    },
  );

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
    // The metric tiles report decision counts, not activity counts.
    expect(html).toContain("Blocks a score");
    expect(html).toContain("Leverage only");
    expect(html).toContain("High-severity leverage");
    expect(html).toContain("What changes the decision");
    expect(html).toContain("Ask before BAFO");
    expect(html).toContain("Scoring disposition");
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

    expect(html).toContain("Cited packages");
    expect(html).toContain("parsed with citations and a missing-input ledger");
    expect(html).toContain("paragraph");
    expect(html).toContain("Parsed reports are vendor-isolated");
    expect(html).toContain("Missing before score lock");
  });
});
