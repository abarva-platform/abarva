import { plainEnglishMirrorInstruction } from "../prompt-builder";
import { amsRfpRequest } from "../__fixtures__/ams-rfp";
import type { DeliverableIntelligenceRequest } from "../types";

const req = (
  deliverableType: string,
  outputFormats: DeliverableIntelligenceRequest["outputFormats"],
): DeliverableIntelligenceRequest =>
  amsRfpRequest({ module: "moves", deliverableType, outputFormats });

describe("plainEnglishMirrorInstruction", () => {
  it("asks a technical deck for one plain-English mirror slide that restates, not adds", () => {
    const text = plainEnglishMirrorInstruction(
      req("target_state_architecture", ["pptx"]),
    );
    expect(text).toMatch(/PLAIN-ENGLISH MIRROR/);
    expect(text).toMatch(/no jargon/i);
    expect(text).toMatch(/RESTATES only/);
    expect(text).toMatch(/introduce no figure|not already made and grounded/i);
  });

  it("applies to the other jargon-heavy technical decks", () => {
    expect(plainEnglishMirrorInstruction(req("solution_design", ["pptx"]))).not.toBe("");
    expect(
      plainEnglishMirrorInstruction(req("operating_model_design", ["pptx"])),
    ).not.toBe("");
  });

  it("is silent for a non-technical deck and for a document-only build", () => {
    expect(plainEnglishMirrorInstruction(req("business_case", ["pptx"]))).toBe("");
    expect(plainEnglishMirrorInstruction(req("discovery_report", ["pptx"]))).toBe("");
    expect(
      plainEnglishMirrorInstruction(req("target_state_architecture", ["docx"])),
    ).toBe("");
  });
});
