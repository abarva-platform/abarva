import JSZip from "jszip";
import { Packer } from "docx";
import {
  purposeFixture,
  purposeChartFixture,
} from "../__fixtures__/purpose-pages";
import {
  renderPurposeDeck,
  validatePurposeInspection,
  purposeDensity,
} from "../purpose-page-renderer";
import { renderDeliverableDocx, renderDeliverablePptx } from "../renderers";
import { inspectDeck } from "../deck-inspection";
import { planPurposePages, purposeCitations } from "../purpose-page-plan";

describe("purpose page rendered objects", () => {
  it("keeps native table rows inside the body above the takeaway", async () => {
    const doc = purposeFixture();
    doc.exhibits = [];
    doc.nextActions = [];
    doc.tables = [
      {
        key: "limits",
        title: "Control boundaries",
        pageShape: "register",
        targetFormat: "pptx",
        columns: ["Control", "Prohibited", "Alternative", "Owner"],
        rows: Array.from({ length: 5 }, () => [
          "Human review",
          "No automatic record write or direct member message",
          "Draft for review before a deliberate human confirmation",
          "Accountable product owner",
        ]),
      },
    ];
    doc.deckSlides = [
      {
        key: "limits",
        governingMessage: "Control boundaries remain explicit",
        pageIntent: {
          question: "What requires review?",
          scopeNote: "No approval recorded.",
          tableKey: "limits",
          takeaway: "Confirm the accountable reviewer.",
        },
      },
    ];
    const zip = await JSZip.loadAsync(await renderPurposeDeck(doc));
    for (const name of Object.keys(zip.files).filter((n) =>
      /^ppt\/slides\/slide\d+\.xml$/.test(n),
    )) {
      const xml = await zip.file(name)!.async("string");
      for (const table of xml.matchAll(/<a:tbl>([\s\S]*?)<\/a:tbl>/g)) {
        const height = [...table[1]!.matchAll(/<a:tr h="(\d+)"/g)].reduce(
          (n, m) => n + Number(m[1]) / 914400,
          0,
        );
        expect(height).toBeLessThanOrEqual(4.101);
      }
    }
  });
  it("allocates readable process label height before the detail without hiding a step", async () => {
    const doc = purposeFixture();
    doc.tables = [];
    doc.nextActions = [];
    const labels = [
      "Verify caller in CRM",
      "Search claims status",
      "Check eligibility",
      "Consult approved knowledge",
      "Key and verify summary",
    ];
    doc.exhibits = [
      {
        key: "flow",
        title: "Recorded workflow",
        description: "Synthetic process",
        kind: "flow",
        targetFormat: "pptx",
        data: {
          kind: "flow",
          nodes: labels.map((label, i) => ({
            id: `s${i}`,
            label,
            role: "Agent",
          })),
          edges: labels
            .slice(1)
            .map((_, i) => ({ from: `s${i}`, to: `s${i + 1}` })),
        },
      },
    ];
    doc.deckSlides = [
      {
        key: "flow",
        governingMessage: "Each handoff retains human accountability",
        exhibitKey: "flow",
      },
    ];
    const result = await inspectDeck(await renderPurposeDeck(doc));
    labels.forEach((label, i) =>
      expect(result.slides[1]!.namedText?.[`purpose:process:${i}`]).toBe(label),
    );
  });
  it("renders explicit status labels, labelled conclusions and display-size figures", async () => {
    const doc = purposeFixture();
    doc.exhibits = [];
    doc.nextActions = [];
    doc.tables = [
      {
        key: "decision-status",
        title: "Decision",
        targetFormat: "pptx",
        pageShape: "labelled_statements",
        columns: ["Label", "Statement"],
        rowTones: ["candidate", "condition", "later"],
        rows: [
          ["Design candidate", "Review this option [1]."],
          ["Conditions to close", "Agree the baseline [2]."],
          ["Later approval", "Build remains outside this decision [1]."],
        ],
      },
      {
        key: "values",
        title: "Definitions",
        targetFormat: "pptx",
        pageShape: "big_numbers",
        valueUnits: ["duration:sec", "duration:sec"],
        columns: ["Measure", "Value", "Basis"],
        rows: [
          ["Recorded", "638 sec", "Recorded definition [1]."],
          [
            "Reference",
            "~703 sec",
            "Competing definition; not an improvement [2].",
          ],
        ],
        rowTones: ["candidate", "condition"],
      },
    ];
    doc.deckSlides = doc.tables.map((t) => ({
      key: t.key,
      governingMessage:
        t.key === "values"
          ? "Definitions must agree before comparison"
          : "The proposed decision retains its conditions",
      pageIntent: {
        question: "What needs resolving?",
        scopeNote: "No benefit is established.",
        tableKey: t.key,
        takeawayLabel: "Required resolution",
        takeaway: "Agree the denominator before proceeding [1].",
      },
    }));
    const pages = planPurposePages(doc),
      buffer = await renderPurposeDeck(doc),
      inspection = await inspectDeck(buffer);
    expect(inspection.slides[1]!.namedText?.["purpose:statement-label:1"]).toBe(
      "Conditions to close",
    );
    expect(
      inspection.slides[2]!.purposeText?.find(
        (t) => t.name === "purpose:number:0",
      )?.fontSize,
    ).toBe(54);
    const zip = await JSZip.loadAsync(buffer);
    expect(await zip.file("ppt/slides/slide3.xml")!.async("string")).toContain(
      "9C650E",
    );
    for (const [slideNo, from, error] of [
      [2, "Required resolution", "takeaway_label_missing"],
      [2, "Conditions to close", "statement_semantics_missing"],
      [3, 'sz="5400"', "display_number_missing"],
    ] as const) {
      const broken = await JSZip.loadAsync(buffer),
        file = `ppt/slides/slide${slideNo}.xml`;
      const xml = await broken.file(file)!.async("string");
      expect(xml).toContain(from);
      broken.file(
        file,
        xml.replace(from, from.startsWith("sz=") ? 'sz="2400"' : "REMOVED"),
      );
      expect(() => validatePurposeInspection(inspection, pages)).not.toThrow();
      const mutated = await inspectDeck(
        await broken.generateAsync({ type: "nodebuffer" }),
      );
      expect(() => validatePurposeInspection(mutated, pages)).toThrow(error);
    }
  });
  it("renders page-specific framing and declared citation IDs, including paired native charts", async () => {
    const doc = purposeFixture();
    doc.sourceRegister[0]!.referenceId = "C01";
    doc.sourceRegister[1]!.referenceId = "E01";
    doc.subtitle = "Scope for review [1] [2].";
    doc.presentationCover = {
      edition: "Review draft",
      date: "16 October 2026",
      classification: "Synthetic scenario",
    };
    doc.deckSlides![0]!.pageIntent = {
      ...doc.deckSlides![0]!.pageIntent!,
      section: "WHAT",
      takeaway: "The scope is a proposal; the owner must decide [1].",
    };
    const first = purposeChartFixture(),
      second = {
        ...purposeChartFixture(),
        key: "second",
        metric: "Separate measure",
      };
    doc.deckSlides!.push({
      key: "paired",
      governingMessage: "Two measures retain separate units",
      citationsUsed: [1],
      pageIntent: {
        question: "What changed?",
        scopeNote: "No causal change is established.",
        chartKeys: [first.key, second.key],
        section: "WHY",
      },
    });
    const pages = planPurposePages(doc, [first, second]);
    const buffer = await renderPurposeDeck(doc, [first, second]);
    const inspection = await inspectDeck(buffer);
    expect(inspection.slides[0]!.namedText?.["purpose:scope"]).toBe(
      "Scope for review [C01, E01].",
    );
    expect(
      inspection.slides[1]!.namedText?.["purpose:annotation:takeaway"],
    ).toContain("[C01]");
    expect(inspection.slides[1]!.namedText?.["purpose:section"]).toBe(
      "WHAT  /  DISCOVERY",
    );
    expect(inspection.slides[0]!.namedText?.["purpose:edition"]).toContain(
      "16 October 2026",
    );
    expect(inspection.slides.find((s) => s.chartCount === 2)).toBeDefined();
    for (const [from, error] of [
      ["WHAT  /  DISCOVERY", "section_missing"],
      [
        "The scope is a proposal; the owner must decide [C01].",
        "takeaway_missing",
      ],
      ["Synthetic scenario", "classification_missing"],
    ]) {
      const zip = await JSZip.loadAsync(buffer);
      const original = await zip.file("ppt/slides/slide2.xml")!.async("string");
      expect(original).toContain(from);
      zip.file("ppt/slides/slide2.xml", original.replace(from!, "REMOVED"));
      expect(() => validatePurposeInspection(inspection, pages)).not.toThrow();
      const damaged = await inspectDeck(
        await zip.generateAsync({ type: "nodebuffer" }),
      );
      expect(() => validatePurposeInspection(damaged, pages)).toThrow(error);
    }
  });
  it("keeps a full-source evidence footer readable without dropping references", async () => {
    const doc = purposeFixture();
    doc.sourceRegister = Array.from({ length: 17 }, (_, i) => ({
      ...doc.sourceRegister[0]!,
      citationNumber: i + 1,
      referenceId: `E${String(i + 1).padStart(2, "0")}`,
      label: `Evidence ${i + 1}`,
    }));
    doc.deckSlides![0]!.citationsUsed = doc.sourceRegister.map(
      (s) => s.citationNumber,
    );
    const report = await inspectDeck(
      await renderPurposeDeck(doc, [purposeChartFixture()]),
    );
    const sources = report.slides[1]!.namedText?.["purpose:sources"] || "";
    expect(sources).toContain("E01");
    expect(sources).toContain("E17");
    expect(() =>
      validatePurposeInspection(
        report,
        planPurposePages(doc, [purposeChartFixture()]),
      ),
    ).not.toThrow();
  });
  it("flags sparse content independently of background or frame size", () => {
    const page = planPurposePages(purposeFixture())[1]!;
    expect(
      purposeDensity({
        ...page,
        items: [{ label: "Owner", detail: "Confirm scope." }],
      }).reviewRequired,
    ).toBe(true);
    expect(
      purposeDensity({
        ...page,
        items: [{ label: "Owner", detail: "Evidence ".repeat(80) }],
      }).reviewRequired,
    ).toBe(false);
  });
  it("keeps Charter tables, source labels, readable type and a blank authority record", async () => {
    const doc = purposeFixture();
    doc.deliverableType = "charter";
    doc.exhibits = [];
    doc.tables = [];
    doc.sourceRegister[0]!.referenceId = "C01";
    doc.subtitle = "Bounded discovery proposal [1].";
    doc.generatedSections = [
      {
        key: "success_measures",
        title: "Outcomes and measures",
        bodyMarkdown:
          "| Outcome | Evidence needed |\n|---|---|\n| Less rework | Agreed baseline [1] |",
        groundingMode: "mixed",
        citationsUsed: [1],
      },
    ];
    const zip = await JSZip.loadAsync(
      await Packer.toBuffer(renderDeliverableDocx(doc)),
    );
    const xml = await zip.file("word/document.xml")!.async("string");
    expect(xml.match(/<w:tbl>/g)?.length).toBe(2);
    expect(xml).toContain("[C01]");
    expect(xml).toContain("Bounded discovery proposal [C01].");
    expect(xml).toContain('w:ascii="Arial"');
    expect(xml).toContain("Reading guide:");
    expect(xml).toContain("Guidance (not a recorded decision)");
    expect(xml).toContain(
      "Authorize with conditions / Request revision / Hold",
    );
    expect(xml).toContain("Use in this document");
    expect(xml).not.toContain("Required next steps");
    expect(await zip.file("word/header1.xml")!.async("string")).toContain(
      "P1 CHARTER",
    );
    expect(await zip.file("word/footer1.xml")!.async("string")).toContain(
      "Human approval required",
    );
  });
  it("keeps cited scope headers without turning equal scope columns into a label table", async () => {
    const doc = purposeFixture();
    doc.deliverableType = "charter";
    doc.exhibits = [];
    doc.tables = [];
    doc.generatedSections = [
      {
        key: "scope",
        title: "Scope boundary",
        bodyMarkdown:
          "| In Scope [1] | Out of Scope [1] |\n|---|---|\n| Review evidence | Commit funding |",
        groundingMode: "mixed",
        citationsUsed: [1],
      },
    ];
    const zip = await JSZip.loadAsync(
      await Packer.toBuffer(renderDeliverableDocx(doc)),
    );
    const xml = await zip.file("word/document.xml")!.async("string");
    const scopeTable = xml.match(/<w:tbl>[\s\S]*?<\/w:tbl>/)![0];
    expect(
      [...scopeTable.matchAll(/<w:gridCol w:w="(\d+)"/g)].map((m) =>
        Number(m[1]),
      ),
    ).toEqual([5040, 5040]);
    expect(scopeTable).toContain("In Scope [1]");
    expect(scopeTable).toContain("Out of Scope [1]");
  });
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
    const chartPath = Object.keys(zip.files).find((name) =>
      /^ppt\/charts\/chart\d+\.xml$/.test(name),
    )!;
    const chartXml = await zip.file(chartPath)!.async("string");
    expect(chartXml).toContain('rot="0"');
    expect(chartXml).not.toContain("<c:title>");
    expect(
      inspection.slides.some((s) =>
        s.namedText?.["purpose:annotation:chart-unit:0"]?.includes(chart.unit),
      ),
    ).toBe(true);
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
      if (page.sources.length)
        expect(slide.namedText?.["purpose:sources"]).toContain(
          purposeCitations(
            page.sources.map((id) => `[${id}]`).join(" "),
            page.referenceLabels!,
          ),
        );
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
    for (const family of ["decision", "role", "process"]) {
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
        from: /cy="2011680"/g,
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
      xml.indexOf("Review and authorization"),
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
