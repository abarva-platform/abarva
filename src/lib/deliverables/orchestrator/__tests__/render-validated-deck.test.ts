import { goodDocument } from "../__fixtures__/ams-rfp";
import { renderValidatedDeck } from "../render-validated-deck";

const placeholderSlide = {
  key: "executive-answer",
  title: "Executive Answer",
  governingMessage: "Give the conclusion before the evidence.",
  points: ["the finding in one statement"],
};

describe("renderValidatedDeck", () => {
  it("falls back to substantive document sections when authored slides are placeholders", async () => {
    const doc = goodDocument();
    doc.generatedSections = [
      {
        key: "operating-baseline",
        title: "Operating Baseline",
        bodyMarkdown:
          "The current operational baseline reflects a defined review period and a consistent unit of measure. A separate process log identifies manual validation steps that shape the proposed opportunity. No investment or target benefit is established.",
        groundingMode: "mixed",
        citationsUsed: [],
      },
    ];
    doc.tables = [];
    doc.exhibits = [];
    doc.deckSlides = [placeholderSlide];

    const result = await renderValidatedDeck(doc);

    expect(result.usedSectionFallback).toBe(true);
    expect(result.verdict.ok).toBe(true);
    const renderedText = result.inspection.slides
      .flatMap((slide) => slide.textRuns)
      .join(" ");
    expect(renderedText).toContain(
      "The current operational baseline reflects a defined review period",
    );
    expect(renderedText).not.toContain("the finding in one statement");
  }, 60_000);

  it("leaves the quality verdict failed when no substantive section fallback exists", async () => {
    const doc = goodDocument();
    doc.generatedSections = [];
    doc.deckSlides = [placeholderSlide];

    const result = await renderValidatedDeck(doc);

    expect(result.usedSectionFallback).toBe(false);
    expect(result.verdict.ok).toBe(false);
    expect(
      result.verdict.findings.some((finding) => finding.kind === "thin_slide"),
    ).toBe(true);
  }, 60_000);
});
