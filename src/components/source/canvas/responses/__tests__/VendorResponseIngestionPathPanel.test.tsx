import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  buildVendorResponseMveProfiles,
  buildVendorResponseParseReport,
  buildVendorResponseParseReportsFromProfiles,
  type VendorResponseParseReport,
} from "@/lib/source/proposal-intelligence";
import { VendorResponseIngestionPathPanel } from "../VendorResponseIngestionPathPanel";

describe("VendorResponseIngestionPathPanel", () => {
  it("explains how parsed long proposals become scoring and decision evidence", () => {
    const profileSet = buildVendorResponseMveProfiles({
      id: "skyh-test-event",
      code: "SKYH-SKYHARBOR-AMS-OUTSOURCING-2026",
      name: "Managed services sourcing event",
      accountName: "Demo account",
    });
    const parseReports =
      buildVendorResponseParseReportsFromProfiles(profileSet);

    const html = renderToStaticMarkup(
      createElement(VendorResponseIngestionPathPanel, { parseReports }),
    );

    expect(html).toContain("Long response intake");
    expect(html).toContain("How 75-100 page proposals become score evidence");
    expect(html).toContain("Vendor package intake");
    expect(html).toContain("Vendor isolation");
    expect(html).toContain("Parse and section map");
    expect(html).toContain("Citation inventory");
    expect(html).toContain("Score gate");
    expect(html).toContain("Decision outputs");
    expect(html).toContain("Parser citations");
    expect(html).toContain("AI is not the parser");
    expect(html).toContain(
      "BAFO asks, CXO conditions, and value proof guardrails",
    );
    expect(html).not.toMatch(/Northstar|TitanTech|CloudBridge|DataPeak/i);
  });

  it("shows the intake path before vendor packages are parsed", () => {
    const html = renderToStaticMarkup(
      createElement(VendorResponseIngestionPathPanel, {}),
    );

    expect(html).toContain("Awaiting packages");
    expect(html).toContain(
      "Load one main proposal and one pricing workbook for each vendor.",
    );
    expect(html).toContain(
      "Do not score claims until citations are available.",
    );
    expect(html).toContain(
      "Parse vendor packages before generating leverage or value proof.",
    );
  });

  it.each([undefined, []])(
    "withholds scoring when response reports are %s",
    (parseReports) => {
      const html = renderToStaticMarkup(
        createElement(VendorResponseIngestionPathPanel, { parseReports }),
      );

      expect(html).toContain("No response evidence");
      expect(html).toContain(
        "Load and parse vendor response packages before scoring.",
      );
      expect(html).not.toContain("0 blockers, 0 holdbacks");
      expect(html).not.toContain("Proceed to evaluator scoring.");
      expect(html).not.toContain("Ready to score");
    },
  );

  it.each(["not_ready", "score_with_caveats"] as const)(
    "withholds scoring for %s even without counted missing inputs",
    (scoreReadiness) => {
      const html = renderToStaticMarkup(
        createElement(VendorResponseIngestionPathPanel, {
          parseReports: [report(scoreReadiness)],
        }),
      );

      expect(html).toContain("Score evidence incomplete");
      expect(html).toContain(
        "Resolve score readiness for every vendor before scoring.",
      );
      expect(html).not.toContain("0 blockers, 0 holdbacks");
      expect(html).not.toContain("Proceed to evaluator scoring.");
    },
  );

  it("requires every response report to be ready", () => {
    const html = renderToStaticMarkup(
      createElement(VendorResponseIngestionPathPanel, {
        parseReports: [report("ready_to_score"), report("not_ready")],
      }),
    );

    expect(html).toContain("Score evidence incomplete");
    expect(html).not.toContain("Ready to score");
    expect(html).not.toContain("Proceed to evaluator scoring.");
  });

  it.each(["not_ready", "ready_to_score"] as const)(
    "preserves evidence-gap instructions even when readiness is %s",
    (scoreReadiness) => {
      const blocked = report(scoreReadiness);
      blocked.missingInputs = [
        {
          missingId: "missing-pricing",
          severity: "blocker",
          ownerRole: "Vendor response lead",
          request: "Provide pricing evidence.",
          scoringImpact: "Commercial comparison is blocked.",
        },
        {
          missingId: "weak-transition",
          severity: "holdback",
          ownerRole: "Evaluation lead",
          request: "Review transition evidence.",
          scoringImpact: "Transition score needs review.",
        },
      ];
      const html = renderToStaticMarkup(
        createElement(VendorResponseIngestionPathPanel, {
          parseReports: [blocked],
        }),
      );

      expect(html).toContain("1 blockers, 1 holdbacks");
      expect(html).toContain(
        "Close required evidence gaps or accept visible caveats.",
      );
      expect(html).not.toContain("Proceed to evaluator scoring.");
    },
  );

  it("allows the scoring instruction for a non-empty all-ready response set", () => {
    const html = renderToStaticMarkup(
      createElement(VendorResponseIngestionPathPanel, {
        parseReports: [report("ready_to_score"), report("ready_to_score")],
      }),
    );

    expect(html).toContain("Ready to score");
    expect(html).toContain("Proceed to evaluator scoring.");
    expect(html).not.toContain("No response evidence");
  });

  it("preserves holdback-only caveats without a blocker", () => {
    const held = report("score_with_caveats");
    held.missingInputs = [
      {
        missingId: "weak-transition",
        severity: "holdback",
        ownerRole: "Evaluation lead",
        request: "Review transition evidence.",
        scoringImpact: "Transition score needs review.",
      },
    ];
    const html = renderToStaticMarkup(
      createElement(VendorResponseIngestionPathPanel, {
        parseReports: [held],
      }),
    );

    expect(html).toContain("0 blockers, 1 holdbacks");
    expect(html).toContain(
      "Close required evidence gaps or accept visible caveats.",
    );
    expect(html).not.toContain("Proceed to evaluator scoring.");
  });
});

function report(
  scoreReadiness: VendorResponseParseReport["scoreReadiness"],
): VendorResponseParseReport {
  const parsed = buildVendorResponseParseReport({
    sourceEventId: "test-score-gate",
    tenantKey: "test-tenant",
    vendorName: "Fixture supplier",
    responseVersion: 1,
    requiredSections: ["Service delivery"],
    documents: [
      {
        fileName: "proposal.txt",
        role: "response_package",
        text: "Service delivery: named service leads provide managed support.",
      },
      {
        fileName: "pricing.txt",
        role: "pricing_workbook",
        text: "Pricing: a fixed fee includes the agreed service scope.",
      },
    ],
  });
  return {
    ...parsed,
    scoreReadiness,
    missingInputs: [],
    health: { ...parsed.health, scoreReadiness },
  };
}
