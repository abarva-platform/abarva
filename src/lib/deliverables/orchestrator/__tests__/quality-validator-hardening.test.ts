// PR-C: truncation + tenant-casing blockers on top of the existing validator.

import { validateDeliverableQuality } from "../quality-validator";
import { amsRfpRequest, goodDocument } from "../__fixtures__/ams-rfp";

describe("quality validator — truncation + tenant casing", () => {
  it("a clean board document still passes", () => {
    const res = validateDeliverableQuality(goodDocument(), amsRfpRequest());
    expect(res.pass).toBe(true);
    expect(res.blockers).toHaveLength(0);
  });

  it("blocks a section that ends mid-sentence (likely truncation)", () => {
    const doc = goodDocument();
    const longUnterminated =
      "This section develops the analysis at length and continues describing the operating model and dependencies across many teams " +
      "without ever reaching a terminal punctuation mark because the model ran out of output tokens partway through the final clause and";
    doc.generatedSections[0].bodyMarkdown = longUnterminated;
    const res = validateDeliverableQuality(doc, amsRfpRequest());
    expect(res.pass).toBe(false);
    expect(res.blockers.join(" ")).toMatch(/truncat/i);
  });

  it("does not flag a short section as truncated", () => {
    const doc = goodDocument();
    doc.generatedSections[0].bodyMarkdown = "Brief intro without a period";
    const res = validateDeliverableQuality(doc, amsRfpRequest());
    expect(res.blockers.join(" ")).not.toMatch(/truncat/i);
  });

  it("blocks a raw tenant slug as the display name", () => {
    const doc = goodDocument();
    doc.clientDisplayName = "skyharbor";
    const res = validateDeliverableQuality(doc, amsRfpRequest());
    expect(res.pass).toBe(false);
    expect(res.blockers.join(" ")).toMatch(/raw slug/i);

    doc.clientDisplayName = "apex_retail";
    expect(
      validateDeliverableQuality(doc, amsRfpRequest()).blockers.join(" "),
    ).toMatch(/raw slug/i);
  });

  it("accepts a proper client display name", () => {
    const doc = goodDocument();
    doc.clientDisplayName = "SkyHarbor Air";
    const res = validateDeliverableQuality(doc, amsRfpRequest());
    expect(res.blockers.join(" ")).not.toMatch(/raw slug/i);
  });
});
