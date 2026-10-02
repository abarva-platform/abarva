import {
  ESTIMATE_CAPTURE_SECTION_KEY,
  estimateCaptureStatement,
} from "../estimate-capture-evidence";
import {
  extractUnsupportedFigureClaims,
  repairEvidenceBackedUncitedFigures,
} from "../section-generation";
import { evaluateEstimateModel } from "@/lib/programs/estimate-model";
import { untracedFigures } from "../numeric-lineage-tokens";
import { validateDeliverableQuality } from "../quality-validator";
import { goodDocument, amsRfpRequest } from "../__fixtures__/ams-rfp";
import type { GovernedEvidenceItem } from "../types";

function line(
  pairId: string,
  workPackage: string,
  deliveryModel: "internal" | "vendor",
  hours: [number, number, number],
  ratePerHour: number,
  aiEligiblePct: number,
  humanReviewHours: number,
) {
  return {
    pairId,
    workPackage,
    role: "Engineer",
    deliveryModel,
    lowHours: hours[0],
    baseHours: hours[1],
    highHours: hours[2],
    ratePerHour,
    rateSource: "Planning rate",
    inputBasis: "assumption",
    evidenceReference: "",
    assumption: "Planning assumption.",
    confidence: "low",
    aiEligiblePct,
    aiToolAssumption: aiEligiblePct > 0 ? "Scaffolding and tests only." : "",
    humanReviewHours,
  };
}

function model(overrides: Record<string, unknown> = {}): string {
  return JSON.stringify({
    currency: "USD",
    reviewer: "Estimate reviewer",
    reviewConfirmed: true,
    sourceNotes: "",
    rows: [
      line("p1", "Connectors", "internal", [300, 420, 560], 150, 15, 20),
      line("p1", "Connectors", "vendor", [280, 360, 480], 190, 15, 18),
      line("p2", "Controls", "internal", [64, 80, 104], 165, 0, 0),
      line("p2", "Controls", "vendor", [56, 72, 96], 220, 0, 0),
    ],
    ...overrides,
  });
}

function asEvidence(statement: string): GovernedEvidenceItem[] {
  return [
    {
      citationNumber: 7,
      label: "P4 capture: reviewed estimate model",
      statement,
      evidenceFamily: `phase_capture:${ESTIMATE_CAPTURE_SECTION_KEY}`,
      confidence: "high",
      disclosureTier: "internal_only",
      provenanceRef: "test:estimate",
    },
  ];
}

describe("the reviewed estimate as a citable evidence statement", () => {
  const totals = evaluateEstimateModel(model()).totals;
  const usd = (n: number) => n.toLocaleString("en-US");

  it("carries the calculated figures, which the saved inputs do not contain", () => {
    const saved = model();
    const statement = estimateCaptureStatement(
      ESTIMATE_CAPTURE_SECTION_KEY,
      saved,
    );
    // Not vacuous: the totals are calculated, so they are absent from what was saved.
    expect(saved).not.toContain(usd(totals.internal.baseCost));
    expect(statement).toContain(usd(totals.internal.baseCost));
    expect(statement).toContain(usd(totals.vendor.highCost));
    expect(statement).toContain("Reviewed by: Estimate reviewer");
  });

  it("lets a table of the calculated totals be traced to the estimate", () => {
    const statement = estimateCaptureStatement(
      ESTIMATE_CAPTURE_SECTION_KEY,
      model(),
    )!;
    const table = [
      "| Delivery case | Low | Base | High |",
      "|---|---|---|---|",
      `| Internal | USD ${usd(totals.internal.lowCost)} | USD ${usd(totals.internal.baseCost)} | USD ${usd(totals.internal.highCost)} |`,
      `| Vendor | USD ${usd(totals.vendor.lowCost)} | USD ${usd(totals.vendor.baseCost)} | USD ${usd(totals.vendor.highCost)} |`,
    ].join("\n");

    // Without the estimate in evidence the table is an unsupported claim.
    expect(extractUnsupportedFigureClaims(table)).toHaveLength(1);
    expect(repairEvidenceBackedUncitedFigures(table, [])).toBe(table);

    const cited = repairEvidenceBackedUncitedFigures(
      table,
      asEvidence(statement),
    );
    expect(cited).toContain("[7]");
    expect(extractUnsupportedFigureClaims(cited)).toEqual([]);
  });

  it("traces hours and rates in the forms a document writes them", () => {
    // Observed: with the costs traced, two tables were still blocked. Total
    // hours over a thousand are written with a separator, and a rate is
    // written with its currency symbol; the estimate held them as "1560" and
    // "USD 150", which match neither.
    const large = model({
      rows: [
        line("p1", "Connectors", "internal", [1200, 1560, 2040], 150, 0, 0),
        line("p1", "Connectors", "vendor", [1100, 1400, 1900], 190, 0, 0),
      ],
    });
    const statement = estimateCaptureStatement(
      ESTIMATE_CAPTURE_SECTION_KEY,
      large,
    )!;
    expect(statement).toContain("1,200/1,560/2,040");
    expect(statement).toContain("$150/h");

    const table = [
      "| Scenario | Effort hours (low/base/high) | Planning rate |",
      "|---|---|---|",
      "| Internal | 1,200 / 1,560 / 2,040 | $150 |",
      "| Vendor | 1,100 / 1,400 / 1,900 | $190 |",
    ].join("\n");
    expect(extractUnsupportedFigureClaims(table)).toHaveLength(1);

    const cited = repairEvidenceBackedUncitedFigures(
      table,
      asEvidence(statement),
    );
    expect(cited).toContain("[7]");
    expect(extractUnsupportedFigureClaims(cited)).toEqual([]);

    // An hours figure the estimate does not contain is still unsupported.
    const wrong = table.replace("1,560", "1,650");
    expect(
      repairEvidenceBackedUncitedFigures(wrong, asEvidence(statement)),
    ).toBe(wrong);
  });

  it("still leaves a figure that is not in the estimate unsupported", () => {
    const statement = estimateCaptureStatement(
      ESTIMATE_CAPTURE_SECTION_KEY,
      model(),
    )!;
    // One figure changed by a dollar, and one derived by subtraction.
    const altered = `| Internal | USD ${usd(totals.internal.baseCost + 1)} |`;
    const derived = `The vendor case costs USD ${usd(
      totals.vendor.baseCost - totals.internal.baseCost,
    )} more than the internal case.`;

    for (const text of [altered, derived]) {
      const result = repairEvidenceBackedUncitedFigures(
        text,
        asEvidence(statement),
      );
      expect(result).toBe(text);
      expect(extractUnsupportedFigureClaims(result)).toHaveLength(1);
    }
  });

  it("gives no calculated figures for an estimate that is not reviewed and confirmed", () => {
    expect(
      estimateCaptureStatement(
        ESTIMATE_CAPTURE_SECTION_KEY,
        model({ reviewConfirmed: false }),
      ),
    ).toBeNull();
    expect(
      estimateCaptureStatement(
        ESTIMATE_CAPTURE_SECTION_KEY,
        model({ reviewer: "" }),
      ),
    ).toBeNull();
    expect(
      estimateCaptureStatement(ESTIMATE_CAPTURE_SECTION_KEY, "not json"),
    ).toBeNull();
  });

  it("applies only to the estimate section", () => {
    expect(estimateCaptureStatement("value_plan", model())).toBeNull();
  });
});

describe("a blocked figure is named", () => {
  const statement = "Scenario cost $107,943 low, $143,848 base; rate $150/h.";
  const evidence: GovernedEvidenceItem[] = [
    {
      citationNumber: 3,
      label: "Reviewed estimate",
      statement,
      evidenceFamily: "phase_capture:estimates_capacity",
      confidence: "high",
      disclosureTier: "internal_only",
      provenanceRef: "test:estimate",
    },
  ];

  it("lists only the figures that match no evidence, as written", () => {
    const table =
      "| Internal | USD 107,943 | USD 143,848 | | Difference | USD 35,905 | 33% |";
    expect(untracedFigures(table, evidence)).toEqual(["35,905", "33%"]);
    expect(untracedFigures("USD 107,943 at $150", evidence)).toEqual([]);
    expect(untracedFigures(table, [])).toEqual([
      "107,943",
      "143,848",
      "35,905",
      "33%",
    ]);
  });

  it("puts them in the quality gate's blocker", () => {
    const doc = goodDocument();
    doc.generatedSections = [
      {
        ...doc.generatedSections[0],
        // Ends with a full stop so the claim is this table alone: the gate
        // reads up to the next sentence end, across section boundaries.
        bodyMarkdown:
          "| Internal | USD 107,943 | USD 143,848 | | Difference | USD 35,905 | Planning only.",
        rawBodyMarkdown:
          "| Internal | USD 107,943 | USD 143,848 | | Difference | USD 35,905 | Planning only.",
      },
      ...doc.generatedSections.slice(1),
    ];
    const req = { ...amsRfpRequest(), governedEvidenceBundle: evidence };
    const result = validateDeliverableQuality(doc, req);
    const blocker = result.blockers.find((b) =>
      /unsupported client-fact claim/.test(b),
    );
    expect(blocker).toContain("[figures with no match in evidence: 35,905]");
  });
});
