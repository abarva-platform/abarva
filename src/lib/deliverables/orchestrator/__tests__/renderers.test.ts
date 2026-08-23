// PR-4 proof: the RenderableDeliverable renders to board-grade DOCX (packs to a real
// .docx buffer), an Excel companion for wide tables, a clean AbarVa-styled HTML
// preview with the source register and no leaked internal ids, and (MOVES-QUALITY-001)
// a board-grade PDF via @react-pdf/renderer.
import { Packer } from "docx";
import JSZip from "jszip";
import { renderToBuffer } from "@react-pdf/renderer";
import {
  renderDeliverableDocx,
  renderDeliverableExcelCompanion,
  renderDeliverableHtml,
  renderDeliverablePdf,
  renderDeliverablePptx,
} from "../renderers";
import { scanForInternalLeaks } from "../source-register";
import { goodDocument } from "../__fixtures__/ams-rfp";

describe("DOCX renderer", () => {
  it("produces a valid .docx buffer with the title in metadata", async () => {
    const doc = renderDeliverableDocx(goodDocument());
    const buf = await Packer.toBuffer(doc);
    expect(buf.length).toBeGreaterThan(2000);
    // .docx is a zip — starts with PK
    expect(buf.subarray(0, 2).toString("latin1")).toBe("PK");
  });

  it("renders client-to-complete reason labels, not internal reason codes", async () => {
    const buf = await Packer.toBuffer(renderDeliverableDocx(goodDocument()));
    const zip = await JSZip.loadAsync(buf);
    const documentXml = await zip.file("word/document.xml")!.async("string");

    expect(documentXml).toContain("Procurement approval required");
    expect(documentXml).not.toContain("procurement_signoff");
    expect(documentXml).not.toContain("client_judgment");
  });

  it("renders Source Register family labels instead of raw generated-artifact keys", async () => {
    const sourceDoc = goodDocument();
    sourceDoc.sourceRegister = [
      {
        citationNumber: 1,
        label: "Delivery Handoff Pack",
        evidenceFamily: "generated_artifact:handoff_package",
        confidence: "high",
      },
      {
        citationNumber: 2,
        label: "Value Measurement Model",
        evidenceFamily: "generated_artifact:tower_metrics_plan",
        confidence: "high",
      },
    ];

    const buf = await Packer.toBuffer(renderDeliverableDocx(sourceDoc));
    const zip = await JSZip.loadAsync(buf);
    const documentXml = await zip.file("word/document.xml")!.async("string");

    expect(documentXml).toContain("Handoff Package");
    expect(documentXml).toContain("Tower Metrics Plan");
    expect(documentXml).not.toContain("generated_artifact:");
    expect(documentXml).not.toContain("tower_metrics_plan");
  });
});

describe("DOCX/HTML/PDF renderers — duplicate section-heading suppression", () => {
  // Regression coverage: the renderer owns the section heading (heading1(section.title) /
  // <h2>${section.title}</h2> / PdfText). Models occasionally repeat that exact title as
  // the first Markdown line of section.bodyMarkdown, which without suppression renders
  // as a visibly duplicated heading in every export format.
  function docWithRepeatedHeading() {
    const doc = goodDocument();
    doc.generatedSections = [
      {
        key: "exec_overview",
        title: "Executive Overview",
        bodyMarkdown:
          "## Executive Overview\n\nReal section body content follows the repeated heading.",
        groundingMode: "mixed",
        citationsUsed: [],
      },
    ];
    return doc;
  }

  it("DOCX: does not render the section title a second time as a body paragraph", async () => {
    const buf = await Packer.toBuffer(
      renderDeliverableDocx(docWithRepeatedHeading()),
    );
    const zip = await JSZip.loadAsync(buf);
    const documentXml = await zip.file("word/document.xml")!.async("string");
    const occurrences = (documentXml.match(/Executive Overview/g) ?? []).length;
    // Exactly once: the renderer's own heading1(section.title). Not twice
    // (heading + duplicated first Markdown line).
    expect(occurrences).toBe(1);
  });

  it("HTML: does not render the section title a second time inside the section body", () => {
    const html = renderDeliverableHtml(docWithRepeatedHeading());
    const occurrences = (html.match(/Executive Overview/g) ?? []).length;
    expect(occurrences).toBe(1);
    expect(html).toMatch(/Real section body content/);
  });

  it("PDF: does not render the section title a second time inside the section body", async () => {
    const buf = await renderToBuffer(
      renderDeliverablePdf(docWithRepeatedHeading()),
    );
    const text = buf.toString("latin1");
    const occurrences = (text.match(/Executive Overview/g) ?? []).length;
    expect(occurrences).toBe(1);
  });

  it("leaves the body untouched when the first Markdown line is a DIFFERENT heading", async () => {
    const doc = goodDocument();
    doc.generatedSections = [
      {
        key: "exec_overview",
        title: "Executive Overview",
        bodyMarkdown: "## A Different Sub-heading\n\nBody content.",
        groundingMode: "mixed",
        citationsUsed: [],
      },
    ];
    const html = renderDeliverableHtml(doc);
    expect(html).toMatch(/A Different Sub-heading/);
  });
});

describe("renderers — malformed section-object body recovery", () => {
  function docWithSectionObjectBody() {
    const doc = goodDocument();
    doc.generatedSections = [
      {
        key: "dependencies_risks",
        title: "Dependencies, Risks & Controls",
        bodyMarkdown: [
          "This risk-control narrative is carried into the appendix.",
          "```json",
          "```json",
          JSON.stringify({
            key: "dependencies_risks",
            title: "Dependencies, Risks & Controls",
            bodyMarkdown:
              "## Dependencies, Risks & Controls\n\nMitigation owners are named before mobilization.",
            groundingMode: "mixed",
            citationsUsed: [1],
          }),
          "```",
          "```",
        ].join("\n"),
        groundingMode: "mixed",
        citationsUsed: [1],
      },
    ];
    return doc;
  }

  it("HTML renders nested prose, not raw section object keys", () => {
    const html = renderDeliverableHtml(docWithSectionObjectBody());

    expect(html).toMatch(/Mitigation owners are named before mobilization/);
    expect(html).toMatch(/risk-control narrative is carried/);
    expect(html).not.toMatch(/dependencies_risks/);
    expect(html).not.toMatch(/bodyMarkdown/);
    expect(html).not.toMatch(/```json/);
  });

  it("DOCX renders nested prose, not raw section object keys", async () => {
    const buf = await Packer.toBuffer(
      renderDeliverableDocx(docWithSectionObjectBody()),
    );
    const zip = await JSZip.loadAsync(buf);
    const documentXml = await zip.file("word/document.xml")!.async("string");

    expect(documentXml).not.toMatch(/dependencies_risks/);
    expect(documentXml).not.toMatch(/bodyMarkdown/);
    expect(documentXml).not.toMatch(/```json/);
  });

  it("PPTX renders nested prose, not raw section object keys", async () => {
    const buf = await renderDeliverablePptx(docWithSectionObjectBody());
    const zip = await JSZip.loadAsync(buf);
    const slideXml = (
      await Promise.all(
        Object.keys(zip.files)
          .filter((file) => /^ppt\/slides\/slide\d+\.xml$/.test(file))
          .map((file) => zip.file(file)!.async("string")),
      )
    ).join("\n");

    expect(slideXml).toMatch(/Mitigation owners are named before mobilization/);
    expect(slideXml).toMatch(/risk-control narrative is carried/);
    expect(slideXml).not.toMatch(/dependencies_risks/);
    expect(slideXml).not.toMatch(/bodyMarkdown/);
  });
});

describe("Excel companion", () => {
  it("builds a workbook with one sheet per xlsx-flagged table", async () => {
    const wb = renderDeliverableExcelCompanion(goodDocument());
    expect(wb).not.toBeNull();
    // goodDocument has one xlsx table (Application Inventory) and one docx table (risk register)
    expect(wb!.worksheets).toHaveLength(1);
    expect(wb!.worksheets[0].name).toMatch(/Application Inventory/);
    const buf = await wb!.xlsx.writeBuffer();
    expect(buf.byteLength).toBeGreaterThan(1000);
  });

  it("returns null when there are no xlsx tables", () => {
    const doc = goodDocument();
    doc.tables = doc.tables.map((t) => ({
      ...t,
      targetFormat: "docx" as const,
    }));
    expect(renderDeliverableExcelCompanion(doc)).toBeNull();
  });
});

describe("HTML preview", () => {
  const html = renderDeliverableHtml(goodDocument());

  it("is self-contained and includes title, recommendation, and source register", () => {
    expect(html).toMatch(/<!doctype html>/i);
    expect(html).toMatch(/Airline Demo/);
    expect(html).toMatch(/Recommendation/);
    expect(html).toMatch(/Source Register/);
    expect(html).toMatch(/F8F7F4/); // AbarVa cream background
  });

  it("leaks no internal ids/tags into the rendered HTML body", () => {
    expect(scanForInternalLeaks(html)).toHaveLength(0);
  });

  it("renders authored markdown structure (lists, sub-headings, bold) — not flat <p>-per-line", () => {
    const doc = goodDocument();
    doc.generatedSections = [
      {
        key: "structured",
        title: "1. Structured Section",
        bodyMarkdown:
          "### Sub-heading\n\nAn intro line with **bold emphasis**.\n\n- First bullet\n- Second bullet\n\n1. Step one\n2. Step two",
        groundingMode: "mixed",
        citationsUsed: [],
      },
    ];
    const out = renderDeliverableHtml(doc);
    // Real structural markup survives.
    expect(out).toMatch(/<h4>Sub-heading<\/h4>/);
    expect(out).toMatch(/<strong>bold emphasis<\/strong>/);
    expect(out).toMatch(/<ul>\s*<li>First bullet<\/li>/);
    expect(out).toMatch(/<ol>\s*<li>Step one<\/li>/);
    // The old flattening would have wrapped every line in <p> with the markers stripped.
    expect(out).not.toMatch(/<p>- First bullet<\/p>/);
    expect(out).not.toMatch(/<p>### Sub-heading<\/p>/);
  });

  it("uses the canonical clean table recipe — no navy header fill, status-pill confidence", () => {
    // No anti-pattern navy/teal in the deliverable styling.
    expect(html).not.toMatch(/#0C1A3A/i);
    expect(html).not.toMatch(/#2DD4C8/i);
    // Muted uppercase table header + fresh-green recommendation rule.
    expect(html).toMatch(/text-transform:uppercase/);
    expect(html).toMatch(/border-left:3px solid var\(--fresh\)/);
    // Confidence rendered as a status pill, not raw text in a bare cell.
    expect(html).toMatch(/class="pill pill-fresh"/);
  });

  it("renders declared exhibits as visible SVG-backed exhibit blocks", () => {
    expect(html).toMatch(/class="visual-exhibit"/);
    expect(html).toMatch(/Service Tower Scope Map/);
    expect(html).toMatch(/<svg class="exhibit-svg"/);
  });

  it("carries the required document-status disclaimer — not approved until human sign-off", () => {
    expect(html).toMatch(/Document Status/);
    expect(html).toMatch(/AI-generated working draft — not approved/);
    expect(html).toMatch(/Obtain named human approval/);
    expect(html).toMatch(
      /must not be treated as an approved client deliverable/i,
    );
  });

  it("renders client-to-complete reason labels, not internal reason codes", () => {
    expect(html).toMatch(/Procurement approval required/);
    expect(html).not.toMatch(/procurement_signoff|client_judgment/);
  });

  it("renders Source Register family labels instead of raw generated-artifact keys", () => {
    const sourceDoc = goodDocument();
    sourceDoc.sourceRegister = [
      {
        citationNumber: 1,
        label: "Delivery Handoff Pack",
        evidenceFamily: "generated_artifact:handoff_package",
        confidence: "high",
      },
      {
        citationNumber: 2,
        label: "Financial Model Input Register",
        evidenceFamily: "generated_artifact:financial_model",
        confidence: "high",
      },
    ];

    const sourceHtml = renderDeliverableHtml(sourceDoc);

    expect(sourceHtml).toMatch(/Handoff Package/);
    expect(sourceHtml).toMatch(/Financial Model/);
    expect(sourceHtml).not.toMatch(/generated_artifact:/);
    expect(sourceHtml).not.toMatch(/financial_model/);
  });
});

describe("HTML renderer — roadmap exhibit (REF_EXECUTIVE_ROADMAP)", () => {
  function docWithRoadmapExhibit() {
    const doc = goodDocument();
    doc.exhibits = [
      {
        key: "executive_roadmap",
        title: "Executive Transition Roadmap",
        kind: "roadmap",
        description:
          "Governance cadence set. Core platform integration proven. Agent-assist deployed to one function. Enterprise adoption program.",
        targetFormat: "docx",
      },
    ];
    return doc;
  }

  it("renders the horizons × workstreams grid, not the generic flow/timeline fallback", () => {
    const html = renderDeliverableHtml(docWithRoadmapExhibit());
    expect(html).toMatch(/data-kind="roadmap"/);
    expect(html).toMatch(/Mobilize/);
    expect(html).toMatch(/Establish Foundation/);
    expect(html).toMatch(/Deliver Priority Outcomes/);
    expect(html).toMatch(/Scale and Optimize/);
    expect(html).toMatch(/Business &amp; Process/);
    expect(html).toMatch(/Governance &amp; Controls/);
  });

  it("renders decision-gate diamonds and a dependency/gate legend", () => {
    const html = renderDeliverableHtml(docWithRoadmapExhibit());
    expect(html).toMatch(/data-legend="true"/);
    expect(html).toMatch(/decision gate/);
    expect(html).toMatch(/dependency/);
    // gate diamond path + fill color, same palette as the agent-orchestration gates
    expect(html).toMatch(/fill="#FDF6E3" stroke="#E8CF8A"/);
  });
});

describe("DOCX renderer — visual exhibits", () => {
  it("embeds a rasterised image for each declared exhibit, with its title and description as text", async () => {
    const buf = await Packer.toBuffer(renderDeliverableDocx(goodDocument()));
    const zip = await JSZip.loadAsync(buf);

    const documentXml = await zip.file("word/document.xml")!.async("string");
    expect(documentXml).toMatch(/Visual Exhibits/);
    expect(documentXml).toMatch(/Service Tower Scope Map/);
    expect(documentXml).toMatch(/Towers × services\./);

    // A real PNG was embedded as a media part, not just referenced in prose.
    const mediaFiles = Object.keys(zip.files).filter((f) =>
      /^word\/media\/.*\.png$/.test(f),
    );
    expect(mediaFiles.length).toBeGreaterThan(0);
    const pngBytes = await zip.file(mediaFiles[0])!.async("nodebuffer");
    // PNG magic number.
    expect(pngBytes.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");

    const relsXml = await zip
      .file("word/_rels/document.xml.rels")!
      .async("string");
    expect(relsXml).toMatch(
      /Type="[^"]*\/relationships\/image"[^/]*Target="media\/[^"]+\.png"/,
    );
  });

  it("falls back to a text notice (not a thrown error) when rasterisation fails", async () => {
    jest.resetModules();
    jest.doMock(
      "@/lib/programs/expert-kernel/exports/board-grade/svg-raster",
      () => ({
        rasteriseSvg: () => {
          throw new Error("simulated rasteriser failure");
        },
      }),
    );
    const { renderDeliverableDocx: renderWithBrokenRasteriser } =
      await import("../renderers");
    const { goodDocument: freshGoodDocument } =
      await import("../__fixtures__/ams-rfp");

    const buf = await Packer.toBuffer(
      renderWithBrokenRasteriser(freshGoodDocument()),
    );
    const zip = await JSZip.loadAsync(buf);
    const documentXml = await zip.file("word/document.xml")!.async("string");
    expect(documentXml).toMatch(/exhibit could not be rendered as an image/);
    const mediaFiles = Object.keys(zip.files).filter((f) =>
      /^word\/media\//.test(f),
    );
    expect(mediaFiles).toHaveLength(0);

    jest.dontMock(
      "@/lib/programs/expert-kernel/exports/board-grade/svg-raster",
    );
    jest.resetModules();
  });
});

describe("DOCX renderer — document status disclaimer", () => {
  it("the cover carries the not-approved status paragraph and the footer repeats it", async () => {
    const buf = await Packer.toBuffer(renderDeliverableDocx(goodDocument()));
    const zip = await JSZip.loadAsync(buf);
    const documentXml = await zip.file("word/document.xml")!.async("string");
    const footerFiles = Object.keys(zip.files).filter((f) =>
      /word\/footer\d*\.xml/.test(f),
    );
    const footerXml = (
      await Promise.all(footerFiles.map((f) => zip.file(f)!.async("string")))
    ).join("\n");
    expect(documentXml).toMatch(/AI-generated working draft — not approved/);
    expect(footerXml).toMatch(/AI-generated working draft/);
    expect(footerXml).toMatch(/approved re-upload are required/);
  });
});

describe("PDF renderer (MOVES-QUALITY-001)", () => {
  it("produces a valid PDF buffer with title, recommendation, sections, tables, and source register", async () => {
    const buf = await renderToBuffer(renderDeliverablePdf(goodDocument()));
    const text = buf.toString("latin1");

    expect(text.startsWith("%PDF-")).toBe(true);
    expect(text).toContain("Airline Demo");
    expect(text).toContain("Recommendation");
    expect(text).toContain("Executive Overview");
    // "Application Inventory" is the xlsx-flagged table — correctly excluded
    // from the PDF/DOCX body (Excel companion only); the docx-targeted table
    // is the one that belongs in-document.
    expect(text).toContain("Risks, Issues");
    expect(text).toContain("Source Register");
  });

  it("renders each declared exhibit's title and description alongside its image", async () => {
    const buf = await renderToBuffer(renderDeliverablePdf(goodDocument()));
    const text = buf.toString("latin1");
    expect(text).toContain("Visual Exhibits");
    expect(text).toContain("Service Tower Scope Map");
    expect(text).toContain("Towers × services.");
  });

  it("falls back to a text notice (not a thrown error) when rasterisation fails", async () => {
    jest.resetModules();
    jest.doMock(
      "@/lib/programs/expert-kernel/exports/board-grade/svg-raster",
      () => ({
        rasteriseSvg: () => {
          throw new Error("simulated rasteriser failure");
        },
      }),
    );
    const { renderDeliverablePdf: renderWithBrokenRasteriser } =
      await import("../renderers");
    const { goodDocument: freshGoodDocument } =
      await import("../__fixtures__/ams-rfp");
    const { renderToBuffer: freshRenderToBuffer } =
      await import("@react-pdf/renderer");

    const buf = await freshRenderToBuffer(
      renderWithBrokenRasteriser(freshGoodDocument()),
    );
    const text = buf.toString("latin1");
    expect(text.startsWith("%PDF-")).toBe(true);
    expect(text).toContain("exhibit could not be rendered as an image");

    jest.dontMock(
      "@/lib/programs/expert-kernel/exports/board-grade/svg-raster",
    );
    jest.resetModules();
  });

  it("carries the required document-status disclaimer, identical wording to DOCX/HTML", async () => {
    const buf = await renderToBuffer(renderDeliverablePdf(goodDocument()));
    const text = buf.toString("latin1");
    expect(text).toContain("AI-generated working draft");
    expect(text).toContain("Obtain named human approval");
    expect(text).toContain(
      "must not be treated as an approved client deliverable",
    );
  });
});

describe("PPTX renderer (MOVES-QUALITY-003 / Track D)", () => {
  async function slideXmlFiles(buf: Buffer): Promise<string[]> {
    const zip = await JSZip.loadAsync(buf);
    const slideFiles = Object.keys(zip.files)
      .filter((f) => /^ppt\/slides\/slide\d+\.xml$/.test(f))
      .sort((a, b) => {
        const na = Number(a.match(/slide(\d+)\.xml/)![1]);
        const nb = Number(b.match(/slide(\d+)\.xml/)![1]);
        return na - nb;
      });
    return Promise.all(slideFiles.map((f) => zip.file(f)!.async("string")));
  }

  it("produces a valid .pptx buffer (a real zip) with one slide per section + exhibit + in-deck table, plus a title and closing slide", async () => {
    const doc = goodDocument();
    const buf = await renderDeliverablePptx(doc);
    expect(buf.subarray(0, 2).toString("latin1")).toBe("PK");

    const slides = await slideXmlFiles(buf);
    const inDeckTables = doc.tables.filter((t) => t.targetFormat !== "xlsx");
    // title + one per section + one per exhibit + one per in-deck table + closing
    expect(slides).toHaveLength(
      1 +
        doc.generatedSections.length +
        doc.exhibits.length +
        inDeckTables.length +
        1,
    );
  });

  it("the title slide carries the deliverable title, client/initiative, and the AI-draft disclosure", async () => {
    const slides = await slideXmlFiles(
      await renderDeliverablePptx(goodDocument()),
    );
    const title = slides[0];
    expect(title).toContain("AMS / IT Outsourcing RFP");
    expect(title).toContain("Airline Demo");
    expect(title).toContain("AI-generated working draft");
    expect(title).toMatch(
      /must not be treated as an approved client deliverable/i,
    );
  });

  it("renders each declared exhibit as its own slide with a rasterised image and its title/description", async () => {
    const buf = await renderDeliverablePptx(goodDocument());
    const zip = await JSZip.loadAsync(buf);
    const slides = await slideXmlFiles(buf);
    const exhibitSlide = slides.find((s) =>
      s.includes("Service Tower Scope Map"),
    );
    expect(exhibitSlide).toBeDefined();
    expect(exhibitSlide).toContain("Towers");

    const mediaFiles = Object.keys(zip.files).filter((f) =>
      /^ppt\/media\/.*\.png$/i.test(f),
    );
    expect(mediaFiles.length).toBeGreaterThan(0);
  });

  it("renders an in-deck (non-xlsx) table as a native table slide", async () => {
    const slides = await slideXmlFiles(
      await renderDeliverablePptx(goodDocument()),
    );
    const tableSlide = slides.find((s) => s.includes("Risks, Issues"));
    expect(tableSlide).toBeDefined();
    expect(tableSlide).toContain("Transition window");
  });

  it("the closing slide carries the recommendation, next actions, and client-to-complete checklist", async () => {
    const slides = await slideXmlFiles(
      await renderDeliverablePptx(goodDocument()),
    );
    const closing = slides[slides.length - 1];
    expect(closing).toContain("Next Actions");
    expect(closing).toContain("Confirm evaluation weights");
    expect(closing).toContain("Client-to-Complete Checklist");
    expect(closing).toContain("Final evaluation weights");
  });

  it("falls back to a text notice (not a thrown error) when exhibit rasterisation fails", async () => {
    jest.resetModules();
    jest.doMock(
      "@/lib/programs/expert-kernel/exports/board-grade/svg-raster",
      () => ({
        rasteriseSvg: () => {
          throw new Error("simulated rasteriser failure");
        },
      }),
    );
    const { renderDeliverablePptx: renderWithBrokenRasteriser } =
      await import("../renderers");
    const { goodDocument: freshGoodDocument } =
      await import("../__fixtures__/ams-rfp");

    const buf = await renderWithBrokenRasteriser(freshGoodDocument());
    expect(buf.subarray(0, 2).toString("latin1")).toBe("PK");
    const zip = await JSZip.loadAsync(buf);
    const slides = await slideXmlFiles(buf);
    const exhibitSlide = slides.find((s) =>
      s.includes("Service Tower Scope Map"),
    );
    expect(exhibitSlide).toContain("exhibit could not be rendered as an image");
    const mediaFiles = Object.keys(zip.files).filter((f) =>
      /^ppt\/media\/.+\.(png|jpe?g)$/i.test(f),
    );
    expect(mediaFiles).toHaveLength(0);

    jest.dontMock(
      "@/lib/programs/expert-kernel/exports/board-grade/svg-raster",
    );
    jest.resetModules();
  });
});
