// Deck story-contract quality checks are ADVISORY on first wiring — they warn,
// they never block — so activating a previously-unenforced bar cannot invert
// the gate on a deck that was acceptable before.

import { validateDeliverableQuality } from "../quality-validator";
import { amsRfpRequest, goodDocument } from "../__fixtures__/ams-rfp";
import type {
  DeliverableIntelligenceRequest,
  RenderableDeckSlide,
} from "../types";

function deck(slides: RenderableDeckSlide[]) {
  const doc = goodDocument();
  doc.deckSlides = slides;
  return doc;
}

const argumentSlide = (i: number, extra?: Partial<RenderableDeckSlide>): RenderableDeckSlide => ({
  key: `s${i}`,
  title: `Slide ${i}`,
  governingMessage: `A shared foundation lets four later use cases reuse governed entities (${i}).`,
  points: ["one supporting point"],
  exhibitKey: "exhibit_1",
  speakerNotes: "",
  citationsUsed: [],
  ...extra,
});

const pptxBusinessCase = (): DeliverableIntelligenceRequest =>
  amsRfpRequest({
    module: "moves",
    deliverableType: "business_case",
    outputFormats: ["pptx"],
  });

describe("deck story-contract quality is advisory, not blocking", () => {
  it("warns when slides lead with a label instead of an argument — and does not block", () => {
    const slides = [
      argumentSlide(1, { governingMessage: "Architecture" }),
      argumentSlide(2, { governingMessage: "Financials" }),
      ...Array.from({ length: 10 }, (_, i) => argumentSlide(i + 3)),
    ];
    const res = validateDeliverableQuality(deck(slides), pptxBusinessCase());
    expect(res.warnings.join(" ")).toMatch(/lead with a label/i);
    expect(res.warnings.join(" ")).toContain('"Architecture"');
    // Never a blocker.
    expect(res.blockers.join(" ")).not.toMatch(/lead with a label/i);
  });

  it("does not warn when every slide leads with an argument", () => {
    const slides = Array.from({ length: 12 }, (_, i) => argumentSlide(i + 1));
    const res = validateDeliverableQuality(deck(slides), pptxBusinessCase());
    expect(res.warnings.join(" ")).not.toMatch(/lead with a label/i);
  });

  it("warns on a slide too dense for a room", () => {
    const wall = Array.from({ length: 140 }, (_, i) => `word${i}`).join(" ");
    const slides = [
      argumentSlide(1, { governingMessage: wall }),
      ...Array.from({ length: 11 }, (_, i) => argumentSlide(i + 2)),
    ];
    const res = validateDeliverableQuality(deck(slides), pptxBusinessCase());
    expect(res.warnings.join(" ")).toMatch(/too dense/i);
    expect(res.blockers.join(" ")).not.toMatch(/too dense/i);
  });

  it("warns on a slide carrying more than the supporting-point ceiling", () => {
    const slides = [
      argumentSlide(1, {
        points: ["a", "b", "c", "d", "e", "f"],
      }),
      ...Array.from({ length: 11 }, (_, i) => argumentSlide(i + 2)),
    ];
    const res = validateDeliverableQuality(deck(slides), pptxBusinessCase());
    expect(res.warnings.join(" ")).toMatch(/more than .* supporting points/i);
  });

  it("warns when a diagram-expecting deck links no exhibit, and is quiet once one does", () => {
    const noExhibits = Array.from({ length: 12 }, (_, i) =>
      argumentSlide(i + 1, { exhibitKey: undefined }),
    );
    const withExhibit = Array.from({ length: 12 }, (_, i) =>
      argumentSlide(i + 1, { exhibitKey: i === 0 ? "exhibit_1" : undefined }),
    );
    const resNo = validateDeliverableQuality(deck(noExhibits), pptxBusinessCase());
    const resYes = validateDeliverableQuality(deck(withExhibit), pptxBusinessCase());
    expect(resNo.warnings.join(" ")).toMatch(/calls for at least one diagram/i);
    expect(resYes.warnings.join(" ")).not.toMatch(/calls for at least one diagram/i);
  });

  it("does not run deck checks for a document-primary (docx) build", () => {
    const slides = [argumentSlide(1, { governingMessage: "Architecture" })];
    const res = validateDeliverableQuality(
      deck(slides),
      amsRfpRequest({
        module: "moves",
        deliverableType: "business_case",
        outputFormats: ["docx"],
      }),
    );
    expect(res.warnings.join(" ")).not.toMatch(/lead with a label/i);
  });
});
