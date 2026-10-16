import JSZip from "jszip";
import { Packer } from "docx";
import {
  purposeFixture,
  purposeChartFixture,
} from "../__fixtures__/purpose-pages";
import {
  renderPurposeDeck,
  validatePurposeInspection,
} from "../purpose-page-renderer";
import { renderDeliverableDocx, renderDeliverablePptx } from "../renderers";
import { inspectDeck } from "../deck-inspection";
import { planPurposePages } from "../purpose-page-plan";

describe("purpose page rendered objects", () => {
  it("keeps native charts, data workbooks, tables, notes and source references", async () => {
    const doc = purposeFixture(),
      chart = purposeChartFixture();
    const buffer = await renderPurposeDeck(doc, [chart]);
    const zip = await JSZip.loadAsync(buffer),
      inspection = await inspectDeck(buffer);
    expect(inspection.slideCount).toBe(planPurposePages(doc, [chart]).length);
    expect(
      inspection.slides.every(
        (slide) =>
          slide.notesText?.includes("The point:") && !slide.offCanvas.length,
      ),
    ).toBe(true);
    expect(
      inspection.slides.reduce((sum, slide) => sum + slide.tableCount, 0),
    ).toBeGreaterThanOrEqual(2);
    expect(
      inspection.slides.reduce((sum, slide) => sum + slide.chartCount, 0),
    ).toBe(1);
    const chartXml = await zip.file("ppt/charts/chart1.xml")!.async("string");
    for (const point of chart.points)
      expect(chartXml).toContain(`<c:v>${point.value}</c:v>`);
    expect(
      Object.keys(zip.files).filter(
        (name) => name.startsWith("ppt/embeddings/") && name.endsWith(".xlsx"),
      ),
    ).toHaveLength(1);
    const pages = planPurposePages(doc, [chart]);
    pages.forEach((page, i) => {
      const slide = inspection.slides[i]!;
      expect(slide.namedText?.["purpose:title"]).toBe(page.title);
      expect(slide.namedText?.["purpose:scope"]).toBe(page.scope);
      for (const id of page.sources)
        expect(slide.namedText?.["purpose:sources"]).toContain(`[${id}]`);
      expect(slide.namedText?.["purpose:status"]).toContain(
        "Human approval required",
      );
    });
  }, 60_000);
  it("dispatches the new PPTX path only when the server marks P2", async () => {
    const doc = purposeFixture();
    expect(
      (await inspectDeck(await renderDeliverablePptx(doc))).slides[0]!
        .objectNames,
    ).toContain("purpose:brand");
    doc.purposePageDesign = false;
    expect(
      (await inspectDeck(await renderDeliverablePptx(doc))).slides[0]!
        .objectNames,
    ).not.toContain("purpose:brand");
  }, 60_000);
  it("uses genuinely different editable compositions for decisions, roles, options and processes", async () => {
    const inspection = await inspectDeck(
      await renderPurposeDeck(purposeFixture()),
    );
    for (const family of ["decision", "role", "option", "process"]) {
      expect(
        inspection.slides.some((slide) =>
          slide.objectNames?.includes(`purpose:${family}:0`),
        ),
      ).toBe(true);
    }
  });
  it("rejects corrupted rendered geometry, source markers, notes and native objects", async () => {
    const doc = purposeFixture(),
      chart = purposeChartFixture(),
      pages = planPurposePages(doc, [chart]);
    const original = await renderPurposeDeck(doc, [chart]);
    expect(() => planPurposePages(doc, [chart])).not.toThrow();
    const cases = [
      {
        entry: "ppt/slides/slide2.xml",
        from: /Human approval required\./,
        to: "",
        error: "frame_missing",
      },
      {
        entry: "ppt/slides/slide2.xml",
        from: /\[1\]/g,
        to: "",
        error: "citation_missing",
      },
      {
        entry: "ppt/slides/slide2.xml",
        from: /sz="2000"/g,
        to: 'sz="800"',
        error: "text_too_small",
      },
      {
        entry: "ppt/slides/slide2.xml",
        from: /cy="1920240"/g,
        to: 'cy="91440"',
        error: "text_does_not_fit",
      },
      {
        entry: "ppt/slides/slide2.xml",
        from: /x="6368796"/g,
        to: 'x="585216"',
        error: "text_overlap",
      },
      {
        entry: "ppt/slides/slide2.xml",
        from: /x="585216"/g,
        to: 'x="15000000"',
        error: "render_integrity",
      },
      {
        entry: "ppt/slides/slide8.xml",
        from: /<a:tbl>[\s\S]*?<\/a:tbl>/,
        to: "",
        error: "native_table_missing",
      },
      {
        entry: "ppt/slides/slide9.xml",
        from: /<c:chart\b[^>]*\/>/,
        to: "",
        error: "native_chart_missing",
      },
      {
        entry: "ppt/notesSlides/notesSlide2.xml",
        from: /<a:t>[\s\S]*?<\/a:t>/g,
        to: "",
        error: "render_integrity",
      },
    ];
    for (const mutation of cases) {
      const zip = await JSZip.loadAsync(original),
        xml = await zip.file(mutation.entry)!.async("string");
      const changed = xml.replace(mutation.from, mutation.to);
      if (changed === xml)
        throw new Error(`Mutation did not apply: ${mutation.error}`);
      zip.file(mutation.entry, changed);
      const inspected = await inspectDeck(
        await zip.generateAsync({ type: "nodebuffer" }),
      );
      expect(() => validatePurposeInspection(inspected, pages)).toThrow(
        mutation.error,
      );
    }
  }, 60_000);
  it("puts the Charter decision first and keeps the authorization record blank", async () => {
    const doc = purposeFixture();
    doc.deliverableType = "charter";
    doc.exhibits = [];
    doc.tables = [];
    doc.generatedSections = [
      {
        key: "scope",
        title: "Scope boundary",
        bodyMarkdown:
          "Only the approved service perimeter enters discovery [1].",
        citationsUsed: [1],
        groundingMode: "mixed",
      },
      {
        key: "charter_decision",
        title: "Decision requested",
        bodyMarkdown:
          "Authorize discovery only. Build funding remains unapproved [1].",
        citationsUsed: [1],
        groundingMode: "mixed",
      },
    ];
    const buffer = await Packer.toBuffer(renderDeliverableDocx(doc));
    const zip = await JSZip.loadAsync(buffer),
      xml = await zip.file("word/document.xml")!.async("string");
    expect(xml.indexOf("Decision requested")).toBeLessThan(
      xml.indexOf("Scope boundary"),
    );
    expect(xml).toContain("Approver and role");
    expect(xml).toContain("Build funding remains unapproved");
    expect(xml.indexOf("Decision requested")).toBeLessThan(
      xml.indexOf("Required next steps"),
    );
    doc.purposePageDesign = false;
    const legacy = await JSZip.loadAsync(
      await Packer.toBuffer(renderDeliverableDocx(doc)),
    );
    const oldXml = await legacy.file("word/document.xml")!.async("string");
    expect(oldXml.indexOf("Scope boundary")).toBeLessThan(
      oldXml.indexOf("Decision requested"),
    );
    expect(oldXml).not.toContain("Approver and role");
  });
});
