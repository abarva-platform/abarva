// The unsupported-figure blocker must actually be able to fire.
//
// Before this, `repairUncitedFigures` ran twice BEFORE validation and appended
// "[ASSUMPTION TO VALIDATE: ...]" to every uncited figure — and that tag is one
// of the gate's own "supported" markers. The blocker was therefore structurally
// unreachable: an invented $4.7M passed simply because it had been relabelled.
//
// The rule these tests encode: a figure the model DECLARED as an assumption is
// legitimate; a figure it was caught inventing must fail.

import { validateDeliverableQuality } from "../quality-validator";
import { repairUncitedFigures } from "../section-generation";
import { amsRfpRequest, goodDocument } from "../__fixtures__/ams-rfp";
import type {
  DeliverableIntelligenceRequest,
  RenderableDeliverable,
  RenderableSection,
} from "../types";

/** A section as the pipeline builds it: repaired for rendering, raw preserved. */
function section(bodyMarkdown: string): RenderableSection {
  return {
    key: "investment_case",
    title: "Investment case",
    bodyMarkdown: repairUncitedFigures(bodyMarkdown),
    rawBodyMarkdown: bodyMarkdown,
    groundingMode: "mixed",
    citationsUsed: [1],
  };
}

/**
 * A known-good document with one section swapped for the claim under test, so
 * the only thing that can trip the gate is that claim.
 */
function docWith(bodyMarkdown: string): RenderableDeliverable {
  const doc = goodDocument();
  return {
    ...doc,
    generatedSections: [
      ...doc.generatedSections.map((s) => ({
        ...s,
        rawBodyMarkdown: s.bodyMarkdown,
      })),
      section(bodyMarkdown),
    ],
  };
}

function blockersFor(bodyMarkdown: string): string[] {
  const req: DeliverableIntelligenceRequest = amsRfpRequest();
  return validateDeliverableQuality(docWith(bodyMarkdown), req).blockers;
}

function hasUnsupportedBlocker(bodyMarkdown: string): boolean {
  return blockersFor(bodyMarkdown).some((b) => /unsupported/i.test(b));
}

describe("invented figures fail", () => {
  it("blocks an invented savings number", () => {
    expect(
      hasUnsupportedBlocker(
        "The programme will deliver $4.7M in annual savings once adoption completes.",
      ),
    ).toBe(true);
  });

  it("blocks an invented implementation cost", () => {
    expect(
      hasUnsupportedBlocker(
        "Total implementation cost is $2,400,000 across the three delivery waves.",
      ),
    ).toBe(true);
  });

  it("blocks an invented ROI percentage", () => {
    expect(
      hasUnsupportedBlocker("The initiative returns 340% over the horizon."),
    ).toBe(true);
  });

  it("blocks an invented timeline date", () => {
    expect(hasUnsupportedBlocker("Go-live is committed for 2027-03-31.")).toBe(
      true,
    );
  });

  it("blocks an invented fiscal-year claim", () => {
    expect(
      hasUnsupportedBlocker("Benefits begin accruing in FY2027 at the latest."),
    ).toBe(true);
  });
});

describe("legitimate quantitative statements pass", () => {
  it("allows a figure the model explicitly declared as an assumption", () => {
    expect(
      hasUnsupportedBlocker(
        "Annual benefit is modelled at $3.1M [ASSUMPTION TO VALIDATE: benefit rate not yet confirmed by finance].",
      ),
    ).toBe(false);
  });

  it("allows a correctly cited figure", () => {
    expect(
      hasUnsupportedBlocker(
        "Contracted spend for the tower is $1,850,000 [1].",
      ),
    ).toBe(false);
  });

  it("allows a figure marked as an open input", () => {
    expect(
      hasUnsupportedBlocker(
        "Run cost is not yet established (open input — see Open Inputs Required).",
      ),
    ).toBe(false);
  });

  it("allows a figure marked for client completion", () => {
    expect(
      hasUnsupportedBlocker(
        "Headcount baseline is $0 pending confirmation [CLIENT TO COMPLETE].",
      ),
    ).toBe(false);
  });

  it("allows prose with no quantitative claim at all", () => {
    expect(
      hasUnsupportedBlocker(
        "The recommended approach reuses governed entities rather than rebuilding them.",
      ),
    ).toBe(false);
  });
});

describe("the repair pass no longer launders the claim past the gate", () => {
  const invented =
    "The programme will deliver $4.7M in annual savings once adoption completes.";

  it("still tags the figure for the reader", () => {
    // Repair is not removed — it remains valuable for what a reader sees.
    expect(section(invented).bodyMarkdown).toMatch(/\[ASSUMPTION TO VALIDATE/);
  });

  it("but the gate judges the untagged original and blocks", () => {
    expect(hasUnsupportedBlocker(invented)).toBe(true);
  });

  it("would have passed under the old behaviour, proving the change bites", () => {
    // Scanning the REPAIRED text is exactly what used to happen. Assert that it
    // silently passes, so this test fails loudly if anyone reintroduces it.
    const repaired = repairUncitedFigures(invented);
    const asIfValidatedAfterRepair: RenderableSection = {
      key: "sec",
      title: "Investment case",
      bodyMarkdown: repaired,
      rawBodyMarkdown: repaired,
      groundingMode: "mixed",
      citationsUsed: [1],
    };
    const base = goodDocument();
    const doc = {
      ...base,
      generatedSections: [
        ...base.generatedSections.map((s) => ({
          ...s,
          rawBodyMarkdown: s.bodyMarkdown,
        })),
        asIfValidatedAfterRepair,
      ],
    };
    const result = validateDeliverableQuality(doc, amsRfpRequest());
    expect(result.blockers.some((b) => /unsupported/i.test(b))).toBe(false);
  });
});

describe("backward compatibility", () => {
  it("falls back to bodyMarkdown when a section carries no raw text", () => {
    const base = goodDocument();
    const doc = {
      ...base,
      generatedSections: [
        ...base.generatedSections,
        {
          key: "investment_case",
          title: "Investment case",
          bodyMarkdown: "Savings of $9.9M are expected.",
          groundingMode: "mixed" as const,
          citationsUsed: [1],
        },
      ],
    };
    const result = validateDeliverableQuality(doc, amsRfpRequest());
    expect(result.blockers.some((b) => /unsupported/i.test(b))).toBe(true);
  });
});
