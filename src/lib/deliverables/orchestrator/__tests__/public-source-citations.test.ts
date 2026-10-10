import { getArtifactBrief } from "../artifact-brief-registry";
import { amsRfpRequest, goodDocument } from "../__fixtures__/ams-rfp";
import { buildPassPrompt } from "../prompt-builder";
import { validateDeliverableQuality } from "../quality-validator";
import { figureLineagePolicy, judgeFigureSentence } from "../numeric-lineage-tokens";
import { validatePublicSourceCitations } from "../public-source-citations";
import { renderDeliverableHtml } from "@/lib/programs/deliverables/orchestrated/render-html";
import {
  renderDeliverableDocx,
  renderDeliverableExcelCompanion,
  renderDeliverableHtml as renderQueuedHtml,
  renderDeliverablePdf,
  renderDeliverablePptx,
} from "../renderers";
import { Packer } from "docx";
import JSZip from "jszip";
import { renderToBuffer } from "@react-pdf/renderer";
import type { PublicCitationSource, RenderableDeliverable } from "../types";

const SOURCES: PublicCitationSource[] = [
  {
    citationNumber: 1,
    url: "https://example.org/program-rule",
    title: "Program rule",
    publisher: "Public agency",
    publishedAt: "2026-01-02",
    retrievedAt: "2026-10-10T10:00:00Z",
    excerpt: "The published threshold is 20% for the program.",
    claim: "Published program threshold",
  },
  {
    citationNumber: 2,
    url: "https://example.org/study",
    title: "Unused study",
    publisher: "Research group",
    publishedAt: null,
    retrievedAt: "2026-10-09T10:00:00Z",
    excerpt: "The study sample has 40 participants.",
    claim: "Sample size",
  },
];

function documentWith(sentence: string): RenderableDeliverable {
  const doc = goodDocument();
  doc.generatedSections[0] = {
    ...doc.generatedSections[0],
    bodyMarkdown: `${doc.generatedSections[0].bodyMarkdown}\n${sentence}`,
    rawBodyMarkdown: `${doc.generatedSections[0].bodyMarkdown}\n${sentence}`,
  };
  return doc;
}

function request() {
  return amsRfpRequest({
    module: "moves",
    publicSources: SOURCES,
    clientDisplayName: "Demo Client",
    initiativeDisplayName: "Demo Move",
  });
}

describe("approved outside source citations", () => {
  it("keeps the flag-off prompt byte identical to the pre-source request", () => {
    const req = amsRfpRequest();
    const brief = getArtifactBrief(req);
    const before = buildPassPrompt("architect", {
      req,
      brief,
      evidence: req.governedEvidenceBundle,
    });
    const after = buildPassPrompt("architect", {
      req: { ...req, publicSources: undefined },
      brief,
      evidence: req.governedEvidenceBundle,
    });
    expect(after).toEqual(before);
    expect(after.user).not.toContain("OUTSIDE PUBLIC SOURCES");
  });

  it("fences only approved source fields apart from client evidence", () => {
    const req = request();
    const prompt = buildPassPrompt("architect", {
      req,
      brief: getArtifactBrief(req),
      evidence: req.governedEvidenceBundle,
    }).user;
    expect(prompt).toContain("OUTSIDE PUBLIC SOURCES — not facts about the client");
    expect(prompt).toContain("```outside-public-sources\n[S:1]");
    expect(prompt).toContain('"excerpt":"The published threshold is 20% for the program."');
    expect(prompt).toContain("[S:2]");
    expect(prompt).toContain("A public figure cannot become this client's baseline");
  });

  it("accepts a figure in its cited excerpt and blocks an invented one", () => {
    const req = request();
    expect(validatePublicSourceCitations(documentWith("The published threshold is 20% [S:1]."), req)).toEqual([]);
    expect(validatePublicSourceCitations(documentWith("This public program rule sets 20% [S:1]."), req)).toEqual([]);
    const invalid = validateDeliverableQuality(
      documentWith("The published threshold is 30% [S:1]."),
      req,
    );
    expect(invalid.blockers.join(" ")).toMatch(/does not support figure.*30%/);
    expect(judgeFigureSentence("The threshold is 20% [S:1].", figureLineagePolicy(req)).supported).toBe(true);
  });

  it("blocks an unapproved or cross-Move source number even without a figure", () => {
    const result = validateDeliverableQuality(documentWith("The rule applies [S:3]."), request());
    expect(result.blockers.join(" ")).toContain("[S:3]");
    expect(result.pass).toBe(false);
  });

  it("refuses malformed public citation numbers", () => {
    const result = validatePublicSourceCitations(documentWith("The rule applies [S:01]."), request());
    expect(result.join(" ")).toContain("[S:01]");
  });

  it("blocks public figures as client targets until a matching register row is cited", () => {
    const req = request();
    const sentence = "Demo Client target is 20% [S:1].";
    expect(validatePublicSourceCitations(documentWith(sentence), req).join(" ")).toMatch(/Record the client working figure.*\[A:ID\]/);
    req.approvedAssumptions = [{
      key: "V1",
      registerId: "V1",
      statement: "Working target",
      figure: "20%",
      basis: "Team review",
      mustValidate: true,
    }];
    req.assumptionRegisterEnforced = true;
    expect(validatePublicSourceCitations(documentWith("Demo Client target is 20% [S:1] [A:V1]."), req)).toEqual([]);
    req.approvedAssumptions[0].figure = "10%";
    expect(validatePublicSourceCitations(documentWith("Demo Client target is 20% [S:1] [A:V1]."), req).join(" ")).toMatch(/Record the client working figure/);
  });

  it("blocks laundering a matching outside figure into a client target by omitting [S:n]", () => {
    const req = request();
    expect(validatePublicSourceCitations(documentWith("Demo Client target is 20%."), req).join(" ")).toMatch(/Record the client working figure/);
  });

  it("does not let external benchmark wording bypass the source check", () => {
    const req = request();
    const doc = documentWith("An outside benchmark suggests 30% for sensitivity only [S:1].");
    expect(validateDeliverableQuality(doc, req).blockers.join(" ")).toMatch(/does not support figure/);
  });

  it("renders a final plain-text Sources table with cited rows only", () => {
    const doc = documentWith("The published threshold is 20% [S:1].");
    doc.publicSources = SOURCES;
    const html = renderDeliverableHtml(doc, "2026-10-10");
    expect(html).toContain('<section id="public-sources"><h2>Sources</h2>');
    expect(html).toContain("<td>[S:1]</td><td>Program rule</td><td>Public agency</td><td>2026-01-02</td><td>2026-10-10</td><td>https://example.org/program-rule</td>");
    expect(html).not.toContain("Unused study");
    expect(html).not.toContain('<a href="https://example.org/program-rule"');
    expect(html.indexOf('id="public-sources"')).toBeGreaterThan(html.indexOf('id="source-register"'));
  });

  it("carries only cited sources into queued HTML, DOCX, XLSX, PDF and PPTX exports", async () => {
    const doc = documentWith("The published threshold is 20% [S:1].");
    doc.publicSources = SOURCES;
    const html = renderQueuedHtml(doc);
    expect(html).toContain("<h2>Sources</h2>");
    expect(html).toContain("https://example.org/program-rule");
    expect(html).not.toContain("Unused study");

    const docx = await Packer.toBuffer(renderDeliverableDocx(doc));
    const docxZip = await JSZip.loadAsync(docx);
    const docxText = await docxZip.file("word/document.xml")!.async("string");
    expect(docxText).toContain("https://example.org/program-rule");
    expect(docxText).not.toContain("Unused study");

    const workbook = renderDeliverableExcelCompanion(doc);
    const sheet = workbook?.getWorksheet("Sources");
    expect(sheet?.getCell("A2").value).toBe("[S:1]");
    expect(sheet?.getCell("F2").value).toBe("https://example.org/program-rule");
    expect(sheet?.getCell("A3").value).toBeNull();

    const pdf = await renderToBuffer(renderDeliverablePdf(doc));
    expect(pdf.length).toBeGreaterThan(2000);

    const pptx = await renderDeliverablePptx(doc);
    const pptxZip = await JSZip.loadAsync(pptx);
    const slides = Object.keys(pptxZip.files).filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name));
    const last = slides.sort((a, b) => Number(a.match(/\d+/)?.[0]) - Number(b.match(/\d+/)?.[0])).at(-1);
    const lastSlide = await pptxZip.file(last!)!.async("string");
    expect(lastSlide).toContain("Sources");
    expect(lastSlide).toContain("https://example.org/program-rule");
    expect(lastSlide).not.toContain("Unused study");
  });
});
