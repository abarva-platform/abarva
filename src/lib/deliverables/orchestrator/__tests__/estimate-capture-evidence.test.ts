import {
  ESTIMATE_CAPTURE_SECTION_KEY,
  estimateCaptureStatement,
} from "../estimate-capture-evidence";
import {
  extractUnsupportedFigureClaims,
  repairEvidenceBackedUncitedFigures,
} from "../section-generation";
import { evaluateEstimateModel } from "@/lib/programs/estimate-model";
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
