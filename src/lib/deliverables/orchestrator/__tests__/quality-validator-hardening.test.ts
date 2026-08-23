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

  it("does not flag a long section that ends on a markdown table or list (decomposed sections legitimately do)", () => {
    const tableEnding =
      "## Risks, Issues and Dependencies\nThe programme carries the following risks, each with an owner and a mitigation, tracked through the steering cadence and reviewed at every gate as the operating model and dependencies evolve across the delivery teams over time.\n\n" +
      "| Risk | Owner | Mitigation |\n| --- | --- | --- |\n| Transition risk | PMO | Phased cutover with coexistence |\n| Data quality | CDO | Profiling and remediation backlog |";
    const listEnding =
      "## Recommended Next Steps\nWe recommend proceeding to fund the shaping work given the validated scope and the costed range, and to mobilise the first wave at the primary hub while the foundation is established for later waves and reuse across the estate.\n\n" +
      "- Issue the RFP to the shortlisted vendors\n- Brief vendors and open the evaluation window\n- Stand up programme governance and decision rights";
    const d1 = goodDocument();
    d1.generatedSections[0].bodyMarkdown = tableEnding;
    const d2 = goodDocument();
    d2.generatedSections[0].bodyMarkdown = listEnding;
    expect(
      validateDeliverableQuality(d1, amsRfpRequest()).blockers.join(" "),
    ).not.toMatch(/truncat/i);
    expect(
      validateDeliverableQuality(d2, amsRfpRequest()).blockers.join(" "),
    ).not.toMatch(/truncat/i);
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

  it("blocks visible placeholder labels in client-facing visual sections", () => {
    const doc = goodDocument();
    doc.generatedSections[0].bodyMarkdown +=
      "\n\n## Visual Exhibits\n\nBuild / Buy matrix\n\nplaceholder: matrix";

    const res = validateDeliverableQuality(doc, amsRfpRequest());

    expect(res.pass).toBe(false);
    expect(res.blockers.join(" ")).toMatch(/visible exhibit placeholder/i);
  });

  it("blocks placeholder exhibit metadata before export", () => {
    const doc = goodDocument();
    doc.exhibits[0] = {
      ...doc.exhibits[0],
      title: "Process diagram placeholder",
      description: "Visual to be inserted after review.",
    };

    const res = validateDeliverableQuality(doc, amsRfpRequest());

    expect(res.pass).toBe(false);
    expect(res.blockers.join(" ")).toMatch(/visible exhibit placeholder/i);
  });
});
