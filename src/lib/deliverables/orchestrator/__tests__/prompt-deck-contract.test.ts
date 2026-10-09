// The deck story contract reaches the generator — the writer is told the same
// decision-journey bar the validator judges it on.

import { deckStoryContractInstruction } from "../prompt-builder";
import { amsRfpRequest } from "../__fixtures__/ams-rfp";
import type { DeliverableIntelligenceRequest } from "../types";

const req = (
  deliverableType: string,
  outputFormats: DeliverableIntelligenceRequest["outputFormats"],
): DeliverableIntelligenceRequest =>
  amsRfpRequest({ module: "moves", deliverableType, outputFormats });

describe("deckStoryContractInstruction", () => {
  it("states the deck's decision-journey contract when a deck is produced", () => {
    const text = deckStoryContractInstruction(req("business_case", ["pptx"]));
    expect(text).toContain("DECK STORY CONTRACT");
    expect(text).toContain("REF_DECK_P4_BUSINESS_CASE");
    // It carries the quality bars the validator also enforces/advises on.
    expect(text).toMatch(/TITLES: every slide title must state the conclusion/);
    expect(text).toMatch(/One primary message per slide/);
    expect(text).toMatch(/DENSITY:/);
  });

  it("is silent for a document-only build (no deck to govern)", () => {
    expect(deckStoryContractInstruction(req("business_case", ["docx"]))).toBe("");
  });

  it("is silent for a deliverable type with no deck contract", () => {
    expect(deckStoryContractInstruction(req("charter", ["pptx"]))).toBe("");
  });

  it("gives the architecture deck its six-beat page-budget contract", () => {
    const text = deckStoryContractInstruction(
      req("target_state_architecture", ["pptx"]),
    );
    expect(text).toContain("REF_DECK_P3_ARCHITECTURE");
    expect(text).toContain("at most 6 narrative and in-deck table pages combined");
    expect(text).toContain("at most 3 supporting points per page");
  });
});
