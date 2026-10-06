// The deck slide-count band is judged only when a deck is produced.
//
// A document-primary deliverable can carry latent deckSlides the synthesis
// volunteered. Judging those against the deck band blocked a DOCX business
// case for "3 slides; needs at least 10" — a band its writer was never given
// and its output never shows.

import { validateDeliverableQuality } from "../quality-validator";
import { amsRfpRequest, goodDocument } from "../__fixtures__/ams-rfp";
import { SLIDE_BANDS } from "@/lib/deliverables/slide-contract";
import type { DeliverableIntelligenceRequest } from "../types";

function docWithSlides(count: number) {
  const doc = goodDocument();
  doc.deckSlides = Array.from({ length: count }, (_, i) => ({
    key: `s${i}`,
    title: `Slide ${i}`,
    governingMessage: `Point ${i} stands on its own as a message.`,
    points: ["supporting point"],
    speakerNotes: "",
    citationsUsed: [],
  }));
  return doc;
}

const businessCaseReq = (
  outputFormats: DeliverableIntelligenceRequest["outputFormats"],
): DeliverableIntelligenceRequest =>
  amsRfpRequest({
    module: "moves",
    deliverableType: "business_case",
    outputFormats,
  });

describe("slide-count band applies only to a produced deck", () => {
  it("business_case has a band, so this is a real guard", () => {
    expect(SLIDE_BANDS.business_case?.min).toBeGreaterThanOrEqual(10);
  });

  it("does not judge latent deck slides on a document-primary (docx) build", () => {
    const res = validateDeliverableQuality(
      docWithSlides(3),
      businessCaseReq(["docx"]),
    );
    expect(res.blockers.join(" ")).not.toMatch(/slides?;|needs at least/i);
  });

  it("judges the band when pptx is produced — too few", () => {
    const res = validateDeliverableQuality(
      docWithSlides(3),
      businessCaseReq(["pptx"]),
    );
    expect(res.blockers.join(" ")).toMatch(/needs at least 10/);
  });

  it("passes the band when the pptx deck is within it", () => {
    const res = validateDeliverableQuality(
      docWithSlides(12),
      businessCaseReq(["docx", "pptx"]),
    );
    expect(res.blockers.join(" ")).not.toMatch(
      /needs at least|slides against a ceiling/,
    );
  });
});
