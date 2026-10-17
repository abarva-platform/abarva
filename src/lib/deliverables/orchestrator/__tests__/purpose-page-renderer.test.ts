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
import {
  planPurposePages,
  purposeCitations,
  purposeChartHeadline,
  purposeScopeLayout,
  purposeUpstreamReferences,
} from "../purpose-page-plan";

describe("purpose page rendered objects", () => {
  it("keeps distinct upstream locators without repeating an identical ID and locator", () => {
    const same = {
      id: "decision-log",
      locator: "decision-log",
      availability: "not_supplied" as const,
    };
    const refs = {
      upstreamReferences: [same, same, { ...same, locator: "section A" }],
    };
    expect(purposeUpstreamReferences(refs, "\n")).toBe(
      "\nUpstream:\ndecision-log, section A (not supplied)",
    );
    expect(purposeUpstreamReferences({})).toBe("");
  });
  it("carries the declared scalar period and upstream locator into native exports", async () => {
    const doc = purposeFixture();
    doc.exhibits = [];
    doc.nextActions = [];
    doc.tables = [
      {
        key: "scope",
        title: "Recorded basis",
        targetFormat: "pptx",
        columns: ["Measure", "Recorded value"],
        rows: [["Submitted claims", "[1]"]],
        numericCells: [
          {
            row: 0,
            column: 1,
            value: 618000,
            type: { kind: "count", unit: "claims" },
            measurementPeriod: {
              label: "Trailing year",
              sourceCitation: 1,
              sourceQuote: "Trailing year",
            },
          },
        ],
      },
    ];
    doc.sourceRegister[0]!.upstreamReferences = [
      {
        id: "session-a",
        locator: "minutes 10 to 15",
        availability: "not_supplied",
      },
    ];
    doc.deckSlides = [
      {
        key: "basis",
        governingMessage: "The annual measure has its own reporting window",
        pageIntent: {
          question: "What period does the measure cover?",
          scopeNote: "",
          tableKey: "scope",
        },
        citationsUsed: [1],
      },
    ];
    const deck = await inspectDeck(await renderPurposeDeck(doc));
    expect(deck.slides.flatMap((s) => s.textRuns).join(" ")).toContain(
      "Trailing year",
    );
    expect(deck.slides.flatMap((s) => s.textRuns).join(" ")).toContain(
      "minutes 10 to 15",
    );
    doc.deliverableType = "charter";
    doc.purposePageDesign = true;
    const zip = await JSZip.loadAsync(
      await Packer.toBuffer(renderDeliverableDocx(doc)),
    );
    const xml = await zip.file("word/document.xml")!.async("string");
    expect(xml).toContain("618,000 (Trailing year)");
    expect(xml).toContain("session-a, minutes 10 to 15 (not supplied)");
  });
  it("reserves room for a bounded-axis disclosure beside two native charts", async () => {
    const doc = purposeFixture();
    doc.tables = [];
    doc.exhibits = [];
    doc.nextActions = [];
    const chart = purposeChartFixture();
    chart.unit = "Percent of eligible contacts";
    chart.period = "July 2025 to June 2026";
    chart.points = [74.8, 72.9, 75.7].map((value, i) => ({
      label: `Month ${i}`,
      value,
      sourceRow: `row ${i}`,
    }));
    const second = { ...chart, key: "second" };
    doc.deckSlides = [
      {
        key: "trend",
        governingMessage: purposeChartHeadline([chart, second]),
        pageIntent: {
          question: "What changed?",
          scopeNote: chart.interpretation,
          chartKeys: [chart.key, second.key],
        },
      },
    ];
    const inspection = await inspectDeck(
      await renderPurposeDeck(doc, [chart, second]),
    );
    const caption = inspection.slides[1]!.purposeText!.find(
      (box) => box.name === "purpose:annotation:chart-unit:1",
    )!;
    expect(caption.text).toContain("axis starts at");
    expect(caption.text).toContain("Trend: holds broadly steady.");
    expect(caption.heightIn).toBeGreaterThan(0.44);
    expect(caption.fontSize).toBe(13);
  });
  it("balances a long labelled control list without orphaning its first or last item", async () => {
    const doc = purposeFixture();
    doc.deliverableType = "charter";
    doc.exhibits = [];
    doc.tables = [];
    doc.generatedSections = [
      {
        key: "authorization_conditions",
        title: "Proposed controls",
        groundingMode: "mixed",
        citationsUsed: [1],
        bodyMarkdown: Array.from(
          { length: 6 },
          (_, i) =>
            `- **Control ${i}:** Keep the stated decision boundary and its permitted alternative explicit; the responsible role reviews the evidence before any implementation. Preserve the original restriction and its scope [1].`,
        ).join("\n"),
      },
    ];
    const zip = await JSZip.loadAsync(
      await Packer.toBuffer(renderDeliverableDocx(doc)),
    );
    const xml = await zip.file("word/document.xml")!.async("string");
    const bullets = [...xml.matchAll(/<w:p[ >][\s\S]*?<\/w:p>/g)]
      .map((m) => m[0])
      .filter((p) => /Control [0-5]:/.test(p));
    expect(bullets).toHaveLength(6);
    expect(bullets[0]).toContain("<w:keepNext/>");
    expect(bullets[1]).toContain('<w:keepNext w:val="false"/>');
    expect(bullets[4]).toContain("<w:keepNext/>");
    expect(bullets.at(-1)).toContain('<w:keepNext w:val="false"/>');
  });
  it("names the actual charter sections each source supports", async () => {
    const doc = purposeFixture();
    doc.deliverableType = "charter";
    doc.exhibits = [];
    doc.tables = [];
    doc.generatedSections = [
      {
        key: "scope",
        title: "Scope boundary",
        bodyMarkdown: "The planned review covers service handoffs [1].",
        groundingMode: "mixed",
        citationsUsed: [1],
      },
    ];
    const zip = await JSZip.loadAsync(
      await Packer.toBuffer(renderDeliverableDocx(doc)),
    );
    const xml = await zip.file("word/document.xml")!.async("string");
    expect(xml).toContain("1. Scope boundary");
    expect(xml).toContain("Used in: section 1.");
  });
  it("compacts status statements into one native table while retaining their semantic colour and labels", async () => {
    const doc = purposeFixture();
    doc.exhibits = [];
    doc.nextActions = [];
    const tones = [
      "candidate",
      "candidate",
      "risk",
      "condition",
      "later",
    ] as const;
    doc.tables = [
      {
        key: "status",
        title: "Decision",
        targetFormat: "pptx",
        pageShape: "labelled_statements",
        columns: ["Position", "Basis"],
        rowTones: [...tones],
        rows: tones.map((_, i) => [
          `Position ${i}`,
          "Review the documented operating alternatives and the accountable owner before choosing the next route for delivery [1].",
        ]),
      },
    ];
    doc.deckSlides = [
      {
        key: "status",
        governingMessage: "The decision retains each condition",
        pageIntent: {
          question: "What is proposed?",
          scopeNote: "For review.",
          tableKey: "status",
          takeaway: "Confirm the evidence.",
        },
      },
    ];
    const pages = planPurposePages(doc).filter((p) =>
      p.id.startsWith("status"),
    );
    expect(pages).toHaveLength(1);
    expect(pages[0]!.semanticStatusColumn).toBe(true);
    // Each row keeps its own label; the state travels as the row's colour, not as a slash prefix.
    expect(pages[0]!.rows!.map((r) => r[0])).toEqual(
      tones.map((_, i) => `Position ${i}`),
    );
    expect(pages[0]!.rows!.some((r) => r[0]!.includes("/"))).toBe(false);
    const zip = await JSZip.loadAsync(await renderPurposeDeck(doc));
    const xml = await zip.file("ppt/slides/slide2.xml")!.async("string");
    expect(xml).toContain('val="AE3547"');
    expect(xml).toContain('val="9C650E"');
    for (const row of doc.tables[0]!.rows)
      expect(xml).toContain(row[1].replace(" [1]", ""));
    const inspection = await inspectDeck(await renderPurposeDeck(doc));
    expect(inspection.slides[1].namedText?.["purpose:sources"]).toBe("[1]");
  });
  it("keeps row-level attribution in a Source column when a table mixes sources", async () => {
    const doc = purposeFixture();
    doc.exhibits = [];
    doc.nextActions = [];
    doc.tables = [
      {
        key: "sources",
        title: "Evidence",
        targetFormat: "pptx",
        columns: ["Finding", "Basis"],
        rows: [
          ["Workflow", "Recorded handoff [1]."],
          ["Definition", "Recorded definition [1]."],
          ["Comparison", "Separate observation [2]."],
        ],
      },
    ];
    doc.deckSlides = [
      {
        key: "sources",
        governingMessage: "Separate findings retain their source",
        pageIntent: {
          question: "What supports the findings?",
          scopeNote: "Recorded observations only.",
          tableKey: "sources",
        },
      },
    ];
    const zip = await JSZip.loadAsync(await renderPurposeDeck(doc));
    const xml = await zip.file("ppt/slides/slide2.xml")!.async("string");
    const cells = [...xml.matchAll(/<a:t>([^<]*)<\/a:t>/g)].map((m) => m[1]);
    expect(cells).toEqual(
      expect.arrayContaining([
        "Source",
        "Recorded handoff.",
        "Separate observation.",
      ]),
    );
    // The codes leave the sentences and each row keeps its own in the final column.
    expect(cells.some((cell) => /handoff \[/.test(cell!))).toBe(false);
    const source = cells.indexOf("Source");
    const codes = cells.filter(
      (cell, i) => i > source && /^\[[^\]]+\]$/.test(cell!),
    );
    expect(codes).toHaveLength(3);
    expect(new Set(codes).size).toBe(2);
  });
  it("reserves a readable second scope line without moving short-note pages", async () => {
    const doc = purposeFixture();
    doc.exhibits = [];
    doc.tables = [];
    doc.nextActions = [];
    const scope =
      "This page describes the recorded review conditions and the questions to resolve before the next decision; it does not establish a causal relationship, a funding approval or a validated financial result.";
    doc.deckSlides = [
      {
        key: "scope",
        governingMessage: "Review conditions remain explicit",
        points: ["Confirm the evidence before deciding [1]."],
        pageIntent: { question: "What remains to review?", scopeNote: scope },
      },
    ];
    const pages = planPurposePages(doc);
    const page = pages.find((p) => p.id.startsWith("scope"))!;
    expect(purposeScopeLayout(page).bodyTop).toBeCloseTo(1.87);
    expect(
      purposeScopeLayout({ ...page, scope: "For review." }).bodyTop,
    ).toBeCloseTo(1.65);
    const inspection = await inspectDeck(await renderPurposeDeck(doc));
    const slide = inspection.slides[pages.indexOf(page)]!;
    const scopeBox = slide.purposeText!.find(
      (b) => b.name === "purpose:scope",
    )!;
    expect(scopeBox.text).toBe(scope);
    expect(scopeBox.heightIn).toBeCloseTo(0.55);
    expect(scopeBox.fontSize).toBeGreaterThanOrEqual(12);
    const damaged = structuredClone(inspection);
    damaged.slides[pages.indexOf(page)]!.purposeText!.find(
      (b) => b.name === "purpose:scope",
    )!.heightIn = 0.36;
    expect(() => validatePurposeInspection(damaged, pages)).toThrow(
      "text_does_not_fit",
    );
  });
  it("preserves decision labels and native bullets in a structured charter recommendation", async () => {
    const doc = purposeFixture();
    doc.deliverableType = "charter";
    doc.purposePageDesign = true;
    doc.exhibits = [];
    doc.tables = [];
    doc.recommendation =
      "Review the next decision.\n\n- **Proceed:** when evidence is reviewed [1].\n- **Hold:** if access remains unresolved.\n- **Revise:** if the scope changes.";
    const zip = await JSZip.loadAsync(
      await Packer.toBuffer(renderDeliverableDocx(doc)),
    );
    const xml = await zip.file("word/document.xml")!.async("string");
    const paragraphs = [...xml.matchAll(/<w:p[ >][\s\S]*?<\/w:p>/g)].map(
      (match) => match[0],
    );
    for (const label of ["Proceed:", "Hold:", "Revise:"]) {
      const paragraph = paragraphs.find((p) => p.includes(`>${label}<`));
      expect(paragraph).toContain("<w:numPr>");
      expect(paragraph).toContain("<w:b/>");
    }
    expect(xml).not.toContain("**Proceed");
  });
  it("uses native bullets and keeps a compact seven-role table together", async () => {
    const doc = purposeFixture();
    doc.deliverableType = "charter";
    doc.purposePageDesign = true;
    doc.exhibits = [];
    doc.tables = [];
    doc.recommendation = "Review the evidence before the next decision.";
    doc.actionRegister = [
      {
        owner: "Sponsor",
        action: "Review the draft",
        evidence: "Reviewed record",
      },
    ];
    doc.generatedSections = [
      {
        key: "sponsorship_governance",
        title: "Decision owners",
        groundingMode: "mixed",
        citationsUsed: [1],
        bodyMarkdown:
          "- **Review:** Confirm scope before approval [1].\n- **Evidence:** Review the baseline [1].\n\n| Role | Responsibility |\n| --- | --- |\n" +
          Array.from(
            { length: 7 },
            (_, i) => `| Role ${i + 1} | Review assigned evidence [1]. |`,
          ).join("\n"),
      },
    ];
    const zip = await JSZip.loadAsync(
      await Packer.toBuffer(renderDeliverableDocx(doc)),
    );
    const xml = await zip.file("word/document.xml")!.async("string");
    const paragraphs = [...xml.matchAll(/<w:p[ >][\s\S]*?<\/w:p>/g)].map(
      (x) => x[0],
    );
    expect(paragraphs.find((p) => p.includes(doc.recommendation))).toContain(
      "<w:keepNext/>",
    );
    for (const term of ["Review:", "Evidence:"]) {
      const bullet = paragraphs.find((p) => p.includes(`>${term}<`));
      expect(bullet).toContain("<w:numPr>");
      expect(bullet).not.toContain(">- </w:t>");
    }
    expect(paragraphs.find((p) => p.includes(">Review:<"))).toContain(
      "<w:keepNext/>",
    );
    expect(paragraphs.find((p) => p.includes(">Evidence:<"))).toContain(
      '<w:keepNext w:val="false"/>',
    );
    const table = [...xml.matchAll(/<w:tbl>[\s\S]*?<\/w:tbl>/g)]
      .map((x) => x[0])
      .find((x) => x.includes(">Role 7<"))!;
    const rows = [...table.matchAll(/<w:tr>[\s\S]*?<\/w:tr>/g)].map(
      (x) => x[0],
    );
    expect(rows).toHaveLength(8);
    expect(rows.slice(0, -1).every((row) => row.includes("<w:keepNext"))).toBe(
      true,
    );
    expect(rows.at(-1)).toMatch(/<w:keepNext w:val="false"\/>/);
  });
  it("keeps a governance table's closing paragraph attached to its last row", async () => {
    const doc = purposeFixture();
    doc.deliverableType = "charter";
    doc.exhibits = [];
    doc.tables = [];
    doc.generatedSections = [
      {
        key: "sponsorship_governance",
        title: "Governance",
        groundingMode: "mixed",
        citationsUsed: [1],
        bodyMarkdown:
          "| Role | Responsibility |\n| --- | --- |\n| Sponsor | Review the scope [1]. |\n\nThe sponsor confirms the review cadence.",
      },
    ];
    const zip = await JSZip.loadAsync(
      await Packer.toBuffer(renderDeliverableDocx(doc)),
    );
    const xml = await zip.file("word/document.xml")!.async("string");
    const table = [...xml.matchAll(/<w:tbl>[\s\S]*?<\/w:tbl>/g)]
      .map((x) => x[0])
      .find((x) => x.includes("Review the scope"))!;
    const row = [...table.matchAll(/<w:tr>[\s\S]*?<\/w:tr>/g)].at(-1)![0];
    expect(row).toContain("<w:keepNext/>");
    const after = xml.slice(xml.indexOf(table) + table.length);
    expect(after.match(/<w:p[ >][\s\S]*?<\/w:p>/)?.[0]).toContain(
      "<w:keepNext/>",
    );
  });
  it("lets a substantial charter table flow while retaining its first and last pair", async () => {
    const doc = purposeFixture();
    doc.deliverableType = "charter";
    doc.exhibits = [];
    doc.tables = [];
    doc.generatedSections = [
      {
        key: "scope",
        title: "Scope boundaries",
        groundingMode: "mixed",
        citationsUsed: [1],
        bodyMarkdown:
          "| In scope | Out of scope |\n| --- | --- |\n" +
          Array.from(
            { length: 6 },
            (_, i) =>
              `| Scope ${i}: ${"A recorded boundary with a material qualification. ".repeat(3)} | Subject to a separate decision [1]. |`,
          ).join("\n"),
      },
    ];
    const zip = await JSZip.loadAsync(
      await Packer.toBuffer(renderDeliverableDocx(doc)),
    );
    const xml = await zip.file("word/document.xml")!.async("string");
    const table = [...xml.matchAll(/<w:tbl>[\s\S]*?<\/w:tbl>/g)].find((m) =>
      m[0].includes("Scope 0:"),
    )![0];
    const rows = [...table.matchAll(/<w:tr>[\s\S]*?<\/w:tr>/g)].map(
      (m) => m[0],
    );
    expect(rows).toHaveLength(7);
    expect(rows[0]).toContain("<w:keepNext/>");
    expect(rows[1]).toContain("<w:keepNext/>");
    expect(rows[3]).toContain('<w:keepNext w:val="false"/>');
    expect(rows[5]).toContain("<w:keepNext/>");
    expect(rows[6]).toContain('<w:keepNext w:val="false"/>');
    expect(rows.every((row) => row.includes("<w:cantSplit/>"))).toBe(true);
  });
  it("lets evidence flow after either a long or short charter instead of forcing a blank tail", async () => {
    const doc = purposeFixture();
    doc.deliverableType = "charter";
    doc.purposePageDesign = true;
    doc.exhibits = [];
    doc.tables = [];
    doc.generatedSections = [
      {
        key: "scope",
        title: "Scope",
        bodyMarkdown: "Review the bounded business question. ".repeat(90),
        citationsUsed: [1],
        groundingMode: "mixed",
      },
      {
        key: "known_constraints_dependencies",
        title: "Inputs and acceptance",
        bodyMarkdown:
          "| Input | Acceptance |\n| --- | --- |\n" +
          "| Record | Confirm its owner and period. |\n".repeat(5),
        citationsUsed: [1],
        groundingMode: "mixed",
      },
    ];
    const xml = async () =>
      (await JSZip.loadAsync(await Packer.toBuffer(renderDeliverableDocx(doc))))
        .file("word/document.xml")!
        .async("string");
    expect(await xml()).not.toMatch(/<w:pageBreakBefore(?:\/>| w:val="true")/);
    doc.generatedSections[0]!.bodyMarkdown =
      "Review the bounded business question.";
    expect(await xml()).not.toMatch(/<w:pageBreakBefore(?:\/>| w:val="true")/);
  });
  it("renders short scope columns as independent lists without a row pairing", async () => {
    const doc = purposeFixture();
    doc.deliverableType = "charter";
    doc.purposePageDesign = true;
    doc.tables = [];
    doc.exhibits = [];
    doc.generatedSections = [
      {
        key: "scope",
        title: "Scope",
        groundingMode: "mixed",
        citationsUsed: [1],
        bodyMarkdown:
          "| In scope, as requested | Excluded from Discovery |\n| --- | --- |\n| Review context [1] | Build approval [1] |\n| Define the baseline [1] | Production access [1] |",
      },
    ];
    const xml = await (
      await JSZip.loadAsync(await Packer.toBuffer(renderDeliverableDocx(doc)))
    )
      .file("word/document.xml")!
      .async("string");
    const scope = xml.match(/<w:tbl>[\s\S]*?<\/w:tbl>/)![0];
    expect(scope.match(/<w:tr>/g)).toHaveLength(2);
    expect(scope).toContain("Review context [1]");
    expect(scope).toContain("Define the baseline [1]");
    expect(scope).toContain("Production access [1]");
    expect(
      [...scope.matchAll(/<w:gridCol w:w="(\d+)"/g)].map((m) => Number(m[1])),
    ).toEqual([5040, 5040]);
  });
  it("lets charter sources follow the decision record without a forced blank continuation", async () => {
    const doc = purposeFixture();
    doc.deliverableType = "charter";
    doc.purposePageDesign = true;
    doc.exhibits = [];
    doc.sourceRegister = Array.from({ length: 5 }, (_, i) => ({
      citationNumber: i + 1,
      label: `Reviewed input ${i + 1}`,
      confidence: "low" as const,
      evidenceFamily: "Planning",
      reviewStatus: "Owner review pending",
      useAndLimitation: "Planning input; human approval remains separate.",
    }));
    const zip = await JSZip.loadAsync(
      await Packer.toBuffer(renderDeliverableDocx(doc)),
    );
    const xml = await zip.file("word/document.xml")!.async("string");
    const sourceHeading = [...xml.matchAll(/<w:p[ >][\s\S]*?<\/w:p>/g)].find(
      (p) => />\d+\. Source register</.test(p[0]),
    )?.[0];
    expect(sourceHeading).toBeDefined();
    expect(sourceHeading).not.toMatch(
      /<w:pageBreakBefore(?:\/>| w:val="true")/,
    );
    expect(xml.match(/Owner review pending/g)).toHaveLength(1);
    expect(xml).not.toContain("human approval remains separate");
    const decisionTable = [...xml.matchAll(/<w:tbl>[\s\S]*?<\/w:tbl>/g)]
      .map((match) => match[0])
      .find((value) => value.includes(">Decision record<"))!;
    const lastRow = [...decisionTable.matchAll(/<w:tr>[\s\S]*?<\/w:tr>/g)].at(
      -1,
    )?.[0];
    expect(lastRow).toContain('<w:keepNext w:val="false"/>');
  });
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
  it("uses a vertical native flow when recorded role descriptions cannot fit horizontal lanes", async () => {
    const doc = purposeFixture();
    doc.tables = [];
    doc.nextActions = [];
    const detail =
      "The accountable operational team reviews the recorded input and sends the result to its owner.";
    doc.exhibits = [
      {
        key: "flow",
        title: "Workflow",
        description: "Recorded handoffs",
        kind: "flow",
        targetFormat: "pptx",
        data: {
          kind: "flow",
          nodes: Array.from({ length: 5 }, (_, i) => ({
            id: `n${i}`,
            label: `Recorded step ${i}`,
            role: detail,
          })),
          edges: Array.from({ length: 4 }, (_, i) => ({
            from: `n${i}`,
            to: `n${i + 1}`,
          })),
        },
      },
    ];
    doc.deckSlides = [
      {
        key: "flow",
        governingMessage: "Recorded handoffs retain accountable owners",
        exhibitKey: "flow",
      },
    ];
    const inspection = await inspectDeck(await renderPurposeDeck(doc));
    const slide = inspection.slides[1]!;
    expect(slide.tableCount).toBe(0);
    for (let i = 0; i < 5; i++)
      expect(slide.namedText?.[`purpose:process-detail:${i}`]).toBe(detail);
    const steps = slide.purposeText!.filter((b) =>
      /^purpose:process:\d$/.test(b.name),
    );
    expect(steps).toHaveLength(5);
    expect(
      steps
        .slice(1)
        .every((b, i) => b.yIn >= steps[i]!.yIn + steps[i]!.heightIn),
    ).toBe(true);
  });
  it("draws recorded handoffs as a flow with one exception line, not a From/To table", async () => {
    const doc = purposeFixture();
    doc.tables = [];
    doc.nextActions = [];
    const labels = ["CRM context", "Claim status", "Eligibility", "Record"];
    doc.exhibits = [
      {
        key: "flow",
        title: "Recorded workflow",
        description: "Synthetic process",
        kind: "flow",
        targetFormat: "pptx",
        data: {
          kind: "flow",
          nodes: [
            ...labels.map((label, i) => ({
              id: `s${i}`,
              label,
              role: "Agent",
            })),
            { id: "x", label: "Supervisor review", role: "Supervisor" },
          ],
          edges: [
            ...labels.slice(1).map((_, i) => ({
              from: `s${i}`,
              to: `s${i + 1}`,
              label: "Declared connection",
            })),
            { from: "s2", to: "x", label: "Eligibility unclear" },
          ],
        },
      },
    ];
    doc.deckSlides = [
      {
        key: "flow",
        governingMessage: "Each handoff retains human accountability",
        exhibitKey: "flow",
        points: ["A separately recorded case starts in another queue [2]."],
      },
    ];
    const result = await inspectDeck(await renderPurposeDeck(doc));
    const named = result.slides[1]!.namedText ?? {};
    labels.forEach((label, i) =>
      expect(named[`purpose:process:${i}`]).toBe(label),
    );
    expect(named["purpose:process:exception"]).toBe(
      "Exception path: Eligibility → Supervisor review (Supervisor) (Eligibility unclear) A separately recorded case starts in another queue [2].",
    );
    expect(planPurposePages(doc)[1]!.sources).toContain(2);
    delete result.slides[1]!.namedText!["purpose:process:exception"];
    expect(() =>
      validatePurposeInspection(result, planPurposePages(doc)),
    ).toThrow("process_evidence_missing");
    expect(JSON.stringify(result.slides[1])).not.toContain(
      "Declared connection",
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
      "CONDITIONS TO CLOSE",
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
      [2, "CONDITIONS TO CLOSE", "statement_semantics_missing"],
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
    const first = { ...purposeChartFixture(), title: "Observed demand" },
      second = {
        ...purposeChartFixture(),
        key: "second",
        title: "Separate measure",
        metric: "Separate measure",
      };
    doc.deckSlides!.push({
      key: "paired",
      governingMessage: purposeChartHeadline([first, second]),
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
      doc.deckSlides![0]!.pageIntent!.question,
    );
    expect(
      inspection.slides[1]!.namedText?.["purpose:annotation:takeaway"],
    ).toContain("[C01]");
    expect(inspection.slides[1]!.namedText?.["purpose:section"]).toBe(
      "WHAT  /  P2 DISCOVERY",
    );
    expect(inspection.slides[0]!.namedText?.["purpose:edition"]).toContain(
      "16 October 2026",
    );
    expect(inspection.slides.find((s) => s.chartCount === 2)).toBeDefined();
    for (const [from, error] of [
      ["WHAT  /  P2 DISCOVERY", "section_missing"],
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
      useAndLimitation: "Definition and scope.",
    }));
    doc.deckSlides![0]!.citationsUsed = doc.sourceRegister.map(
      (s) => s.citationNumber,
    );
    const report = await inspectDeck(
      await renderPurposeDeck(doc, [purposeChartFixture()]),
    );
    const sources = report.slides[1]!.namedText?.["purpose:sources"] || "";
    expect(sources).toContain("E01");
    expect(sources).toContain("+12");
    expect(report.slides[1]!.namedText?.["purpose:page-number"]).toMatch(
      /^2 \/ \d+$/,
    );
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
    expect(xml.match(/<w:tbl>/g)?.length).toBe(4);
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
    expect(xml).toContain("<w:titlePg");
    const rels = await zip
      .file("word/_rels/document.xml.rels")!
      .async("string");
    for (const type of ["first", "default"]) {
      const id = xml.match(
        new RegExp(
          `<w:headerReference[^>]*w:type="${type}"[^>]*r:id="([^"]+)"`,
        ),
      )?.[1];
      expect(id).toBeDefined();
      const target = rels.match(
        new RegExp(`<Relationship[^>]*Id="${id}"[^>]*Target="([^"]+)"`),
      )?.[1];
      expect(target).toBeDefined();
      const header = await zip.file(`word/${target}`)!.async("string");
      expect(header.includes("<w:drawing>")).toBe(type === "first");
    }
    expect(await zip.file("word/footer1.xml")!.async("string")).toContain(
      "Human approval required",
    );
    expect(await zip.file("word/footer2.xml")!.async("string")).toContain(
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
          "| In Scope (requested) [1] | Out of Scope (not authorized) [1] |\n|---|---|\n| Review evidence | Commit funding |",
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
    expect(scopeTable).toContain("In Scope (requested) [1]");
    expect(scopeTable).toContain("Out of Scope (not authorized) [1]");
  });
  it("discloses a bounded line axis in the caption and native chart XML", async () => {
    const chart = purposeChartFixture();
    chart.points = [72.9, 74, 75.7].map((value, i) => ({
      label: `M${i}`,
      value,
      sourceRow: `row ${i}`,
    }));
    chart.axisMin = undefined;
    chart.axisMax = undefined;
    const bytes = await renderPurposeDeck(purposeFixture(), [chart]);
    const inspection = await inspectDeck(bytes);
    const caption = inspection.slides.find((s) => s.chartCount)?.namedText?.[
      "purpose:annotation:chart-unit:0"
    ];
    expect(caption).toContain("axis starts at 72");
    const zip = await JSZip.loadAsync(bytes);
    const path = Object.keys(zip.files).find((name) =>
      /^ppt\/charts\/chart\d+\.xml$/.test(name),
    )!;
    const xml = await zip.file(path)!.async("string");
    expect(xml).toContain('<c:min val="72"/>');
    expect(xml).toContain('<c:max val="76"/>');
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
    const slides = (await inspectDeck(await renderDeliverablePptx(doc))).slides;
    expect(slides[0]!.objectNames).toContain("purpose:brand");
    expect(
      slides
        .slice(1)
        .every((slide) => !slide.objectNames?.includes("purpose:brand")),
    ).toBe(true);
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
      xml.indexOf("Next decision and review"),
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
