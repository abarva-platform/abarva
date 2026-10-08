// PR-4 proof: the RenderableDeliverable renders to board-grade DOCX (packs to a real
// .docx buffer), an Excel companion for wide tables, a clean AbarVa-styled HTML
// preview with the source register and no leaked internal ids, and (MOVES-QUALITY-001)
// a board-grade PDF via @react-pdf/renderer.
import { Packer } from "docx";
import JSZip from "jszip";
import { judgeRenderedDocx } from "../doc-quality";
import { judgeSheetQuality } from "../sheet-quality";
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
import { extractOfficeText } from "../../shared/office-text-extract";
import { scanClientReadiness } from "../../shared/client-readiness-scan";

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

  it("keeps table rows together, anchors table headings, and weights narrative columns", async () => {
    const doc = goodDocument();
    doc.generatedSections = [];
    doc.sourceRegister = Array.from({ length: 12 }, (_, index) => ({
      citationNumber: index + 1,
      label: `Approved source record ${index + 1} with a long descriptive title`,
      evidenceFamily: "business_interview",
      confidence: "high",
    }));
    doc.tables = [
      {
        key: "risk_register",
        title: "Risk Register",
        columns: [
          "#",
          "Type",
          "Description",
          "Evidence Position",
          "Owner",
          "Mitigation / Resolution Path",
        ],
        rows: [
          [
            "1",
            "Issue",
            "Sponsor authority and scope acceptance remain unconfirmed.",
            "[6][22]",
            "Client input required: sponsor",
            "Confirm the accountable decision owner before the discovery work begins.",
          ],
        ],
        targetFormat: "docx",
      },
    ];

    const buf = await Packer.toBuffer(renderDeliverableDocx(doc));
    const zip = await JSZip.loadAsync(buf);
    const documentXml = await zip.file("word/document.xml")!.async("string");
    const tableXml = (
      documentXml.match(/<w:tbl>[\s\S]*?<\/w:tbl>/g) ?? []
    ).find((table) => table.includes("MITIGATION / RESOLUTION PATH"));

    expect(tableXml).toBeDefined();
    const rows = tableXml?.match(/<w:tr(?:\s[^>]*)?>[\s\S]*?<\/w:tr>/g) ?? [];
    expect(rows).toHaveLength(2);
    expect(rows.every((row) => row.includes("<w:cantSplit/>"))).toBe(true);
    expect(rows[0]).toContain("<w:tblHeader/>");
    expect(rows[1]).toContain('<w:sz w:val="18"/>');

    const headerWidths = [
      ...(rows[0]?.matchAll(/<w:tcW[^>]*w:w="(\d+)%?"[^>]*\/>/g) ?? []),
    ].map((match) => Number(match[1]));
    expect(headerWidths).toHaveLength(6);
    expect(headerWidths[0]).toBeLessThan(headerWidths[2]);
    expect(headerWidths[1]).toBeGreaterThanOrEqual(13);
    expect(headerWidths[3]).toBeGreaterThanOrEqual(11);
    expect(headerWidths[2]).toBeGreaterThan(headerWidths[4]);

    const gridWidths = [
      ...(tableXml?.matchAll(/<w:gridCol w:w="(\d+)"\/>/g) ?? []),
    ].map((match) => Number(match[1]));
    expect(gridWidths).toHaveLength(6);
    expect(gridWidths[0]).toBeLessThan(gridWidths[2]);
    expect(gridWidths[2]).toBeGreaterThan(gridWidths[4]);
    expect(gridWidths.reduce((sum, width) => sum + width, 0)).toBe(10000);

    const heading = documentXml.match(
      /<w:p>[\s\S]*?<w:t[^>]*>Risk Register<\/w:t>[\s\S]*?<\/w:p>/,
    )?.[0];
    expect(heading).toContain("<w:keepNext/>");

    const sourceTable = (
      documentXml.match(/<w:tbl>[\s\S]*?<\/w:tbl>/g) ?? []
    ).find((table) => table.includes("Approved source record"));
    expect(sourceTable).toBeDefined();
    const sourceRows =
      sourceTable?.match(/<w:tr(?:\s[^>]*)?>[\s\S]*?<\/w:tr>/g) ?? [];
    expect(sourceRows).toHaveLength(13);
    expect(sourceRows.every((row) => row.includes("<w:cantSplit/>"))).toBe(
      true,
    );
    const sourceHeading = documentXml.match(
      /<w:p>[\s\S]*?<w:t[^>]*>Source Register<\/w:t>[\s\S]*?<\/w:p>/,
    )?.[0];
    expect(sourceHeading).toContain("<w:keepNext/>");
    expect(sourceHeading).toContain("<w:pageBreakBefore/>");
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

  it("suppresses a numbered copy of the section title", async () => {
    const doc = goodDocument();
    doc.generatedSections = [
      {
        key: "opportunity_context",
        title: "Opportunity, Context & Intended Outcomes",
        bodyMarkdown:
          "## 2. Opportunity, Context & Intended Outcomes\n\nThe evidence-bounded charter summary.",
        groundingMode: "mixed",
        citationsUsed: [],
      },
    ];

    const buf = await Packer.toBuffer(renderDeliverableDocx(doc));
    const zip = await JSZip.loadAsync(buf);
    const documentXml = await zip.file("word/document.xml")!.async("string");
    const occurrences =
      documentXml.match(/Opportunity, Context &amp; Intended Outcomes/g) ?? [];

    expect(occurrences).toHaveLength(1);
    expect(documentXml).toContain("The evidence-bounded charter summary.");
  });

  it("flows a charter through tables and the recommendation without stranded page breaks", async () => {
    const doc = goodDocument();
    doc.deliverableType = "charter";

    const buf = await Packer.toBuffer(renderDeliverableDocx(doc));
    const zip = await JSZip.loadAsync(buf);
    const documentXml = await zip.file("word/document.xml")!.async("string");
    const explicitPageBreaks =
      documentXml.match(/<w:pageBreakBefore\s*\/>/g) ?? [];

    expect(documentXml).toContain("Risks, Issues &amp; Dependencies");
    expect(documentXml).toContain("Recommendation");
    expect(documentXml).toContain("Source Register");
    expect(explicitPageBreaks).toHaveLength(0);
  });

  it("avoids forced page breaks that leave mostly empty pages", async () => {
    const buf = await Packer.toBuffer(renderDeliverableDocx(goodDocument()));
    const zip = await JSZip.loadAsync(buf);
    const documentXml = await zip.file("word/document.xml")!.async("string");
    const explicitPageBreaks =
      documentXml.match(/<w:pageBreakBefore\s*\/>/g) ?? [];

    expect(explicitPageBreaks).toHaveLength(0);
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
  it("builds a cover, styled table, and visual exhibit sheet", async () => {
    const wb = renderDeliverableExcelCompanion(goodDocument());
    expect(wb).not.toBeNull();
    // goodDocument has one xlsx table (Application Inventory) and one docx table (risk register)
    expect(wb!.worksheets).toHaveLength(3);
    expect(wb!.worksheets[0].name).toBe("Cover");
    expect(wb!.worksheets[1].name).toMatch(/Application Inventory/);
    expect(wb!.worksheets[1].getCell("A1").fill).toMatchObject({
      type: "pattern",
      pattern: "solid",
    });
    expect(wb!.worksheets[2].getImages()).toHaveLength(1);
    expect(judgeSheetQuality(wb!, 1).findings).toEqual([]);
    expect(judgeSheetQuality(wb!, 2).findings).toContain(
      "empty_figure:expected_2:actual_1",
    );
    const buf = await wb!.xlsx.writeBuffer();
    expect(buf.byteLength).toBeGreaterThan(1000);
  });

  it("rejects a workbook whose data sheet has become empty", () => {
    const wb = renderDeliverableExcelCompanion(goodDocument())!;
    wb.worksheets[1].spliceRows(2, wb.worksheets[1].rowCount - 1);
    expect(judgeSheetQuality(wb).findings).toContain(
      "empty_sheet:Application Inventory",
    );
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
    expect(html).toMatch(/FBFAF7/); // AbarVa cream background token
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

  it("does not print generic renderer vocabulary on exhibit visuals", () => {
    const doc = goodDocument();
    doc.exhibits = [
      {
        key: "journey",
        title: "Executive Journey",
        kind: "flow",
        description:
          "Intake aligns demand; triage routes the right owner; approval records the decision",
        targetFormat: "pptx",
        data: {
          kind: "flow",
          nodes: [
            { id: "intake", label: "Intake aligns demand" },
            { id: "triage", label: "Triage routes the right owner" },
            { id: "approval", label: "Approval records the decision" },
          ],
          edges: [
            { from: "intake", to: "triage" },
            { from: "triage", to: "approval" },
          ],
        },
      },
      {
        key: "choices",
        title: "Decision Matrix",
        kind: "matrix",
        description:
          "Reuse accepted pattern; isolate material exceptions; escalate unresolved gaps; confirm control owner",
        targetFormat: "pptx",
        data: {
          kind: "matrix",
          axes: { x: "Option", y: "Decision implication" },
          cells: [
            {
              x: "Reuse accepted pattern",
              y: "Lower delivery risk",
              label: "Reuse accepted pattern",
            },
            {
              x: "Isolate material exceptions",
              y: "Focused governance",
              label: "Isolate material exceptions",
            },
            {
              x: "Escalate unresolved gaps",
              y: "Executive decision needed",
              label: "Escalate unresolved gaps",
            },
            {
              x: "Confirm control owner",
              y: "Named accountability",
              label: "Confirm control owner",
            },
          ],
        },
      },
    ];

    const out = renderDeliverableHtml(doc);

    // This test's name was always right and two of its assertions were not:
    // it pinned "Start" and "Step 2", which ARE generic renderer vocabulary.
    // They came from a flow renderer that flattened nodes AND edges into one
    // list of strings and numbered the result. Edges are now edges.

    // The flow draws its nodes as boxes and its edges as arrows between them.
    // Labels wrap across <text> lines rather than being cut mid-word, so assert
    // the words survived rather than a contiguous string. "decisio" would mean
    // the old character-slice is back.
    for (const word of [
      "Intake",
      "aligns",
      "demand",
      "Approval",
      "records",
      "decision",
    ]) {
      expect(out).toContain(word);
    }
    expect(out).not.toMatch(/decisio</);
    expect(out).toMatch(/data-declared-edge="[^\"]+"[^>]*marker-end/);
    expect(out).not.toContain("Start");
    expect(out).not.toContain("Step 2");
    // There must be exactly one box per NODE. Three nodes and two edges means
    // three boxes — if edges are being flattened into the node list again this
    // becomes five, and an arrow assertion alone would not notice.
    const nodeBoxes = [...out.matchAll(/<rect x="\d+" y="28" width="152"/g)];
    expect(nodeBoxes).toHaveLength(3);

    // The matrix labels both axes and places a cell by its own x/y, not by its
    // index in the array. Two cells with different axis values must not share a
    // quadrant origin.
    expect(out).toContain("Decision implication");
    expect(out).toContain(">Option<");
    // The fixture's two cells have different x-axis values, so one belongs in
    // the LEFT half and one in the RIGHT. Asserting only that the two origins
    // differ is too weak — the y values differ regardless of whether x is
    // computed or hardcoded, so index-placement would pass it.
    expect(out).toMatch(/<rect x="36" y="\d+" width="300"/);
    expect(out).toMatch(/<rect x="378" y="\d+" width="300"/);

    expect(out).not.toContain(">flow</text>");
    expect(out).not.toContain("Implication: matrix");
  });

  it("does not draw a generic exhibit when structured exhibit data is missing", () => {
    const doc = goodDocument();
    doc.exhibits = [
      {
        key: "missing_payload",
        title: "Missing Payload Exhibit",
        kind: "flow",
        description:
          "Intake aligns demand; triage routes the right owner; approval records the decision",
        targetFormat: "pptx",
      },
    ];

    const out = renderDeliverableHtml(doc);

    expect(out).not.toMatch(/class="visual-exhibit"/);
    expect(out).not.toMatch(/<svg class="exhibit-svg"/);
    expect(out).not.toContain("Missing Payload Exhibit");
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
        data: {
          kind: "roadmap",
          lanes: [
            {
              label: "Governance & Controls",
              items: [{ label: "Governance cadence set", start: "Mobilize" }],
            },
            {
              label: "Technology",
              items: [
                {
                  label: "Core platform integration proven",
                  start: "Establish Foundation",
                },
              ],
            },
            {
              label: "AI / Automation",
              items: [
                {
                  label: "Agent-assist deployed to one function",
                  start: "Deliver Priority Outcomes",
                },
              ],
            },
            {
              label: "Change & Adoption",
              items: [{ label: "Enterprise adoption program", start: "Scale" }],
            },
          ],
        },
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

  it("does not invent decision gates or dependencies absent from structured data", () => {
    const html = renderDeliverableHtml(docWithRoadmapExhibit());
    expect(html).not.toMatch(/data-legend="true"/);
    expect(html).not.toMatch(/decision gate/);
    expect(html).not.toMatch(/dependency/);
    expect(html).toMatch(/Governance cadence set/);
  });

  it("keeps declared lanes, horizons, and every item beyond the default grid", () => {
    const doc = docWithRoadmapExhibit();
    const roadmap = doc.exhibits[0]!;
    if (!roadmap.data || roadmap.data.kind !== "roadmap")
      throw new Error("fixture");
    roadmap.data.lanes.push({
      label: "Finance",
      items: [
        { label: "Budget model", start: "Q1" },
        { label: "Funding review", start: "Q1" },
        { label: "Spend baseline", start: "Q1" },
      ],
    });
    const html = renderDeliverableHtml(doc);
    for (const label of [
      "Finance",
      "Q1",
      "Budget model",
      "Funding review",
      "Spend baseline",
    ])
      expect(html).toContain(label);
  });
});

describe("HTML renderer — complete structured exhibit data", () => {
  it("keeps matrix cells and value-tree branches beyond old display caps", () => {
    const doc = goodDocument();
    doc.exhibits = [
      {
        key: "matrix_all",
        title: "Full matrix",
        kind: "matrix",
        description: "Declared cells",
        targetFormat: "pptx",
        data: {
          kind: "matrix",
          cells: Array.from({ length: 9 }, (_, index) => ({
            x: "One",
            y: "One",
            label: `Cell ${index + 1}`,
          })),
        },
      },
      {
        key: "tree_all",
        title: "Full tree",
        kind: "chart",
        description: "Declared drivers",
        targetFormat: "pptx",
        data: {
          kind: "value_tree",
          root: { label: "Outcome" },
          branches: Array.from({ length: 7 }, (_, index) => ({
            label: `Branch ${index + 1}`,
            children: Array.from({ length: 5 }, (_, childIndex) => ({
              label: `Driver ${index + 1}-${childIndex + 1}`,
            })),
          })),
        },
      },
    ];
    const html = renderDeliverableHtml(doc);
    expect(html).toContain("Cell 9");
    expect(html).toContain("Branch 7");
    expect(html).toContain("Driver 7-5");
  });
});

describe("DOCX renderer — visual exhibits", () => {
  it("rejects a declared figure missing from the packaged document", async () => {
    const doc = goodDocument();
    const buf = await Packer.toBuffer(renderDeliverableDocx(doc));
    expect((await judgeRenderedDocx(buf, doc)).findings).toEqual([]);
    const missingFigure = {
      ...doc,
      exhibits: [...doc.exhibits, doc.exhibits[0]!],
    };
    expect((await judgeRenderedDocx(buf, missingFigure)).findings).toEqual(
      expect.arrayContaining([expect.stringMatching(/^empty_figure:/)]),
    );
  });

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

  it("fails closed when a declared exhibit cannot rasterise", async () => {
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

    expect(() => renderWithBrokenRasteriser(freshGoodDocument())).toThrow(
      /docx_exhibit_rasterisation_failed:tower_scope_map/,
    );

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

  it("fails closed when a declared PDF exhibit cannot rasterise", async () => {
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
    expect(() => renderWithBrokenRasteriser(freshGoodDocument())).toThrow(
      /pdf_exhibit_rasterisation_failed:tower_scope_map/,
    );

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

  it("uses authored deck slides instead of deriving PPTX slides from section prose", async () => {
    const doc = goodDocument();
    doc.deckSlides = [
      {
        key: "decision-story",
        title: "Decision Story",
        governingMessage:
          "Approve the sourcing package because the service scope is decision-ready",
        points: [
          "Use the tower scope as the vendor-facing sizing spine.",
          "Keep transition constraints in the open-input list until confirmed.",
        ],
        exhibitKey: "tower_scope_map",
        speakerNotes:
          "Evidence traceability stays in speaker notes, not bullets.",
        citationsUsed: [1, 2],
      },
    ];

    const buf = await renderDeliverablePptx(doc);
    const zip = await JSZip.loadAsync(buf);
    const slides = await slideXmlFiles(buf);
    const inDeckTables = doc.tables.filter((t) => t.targetFormat !== "xlsx");
    expect(slides).toHaveLength(
      1 + doc.deckSlides.length + inDeckTables.length + 1,
    );
    const authoredSlide = slides.find((s) =>
      s.includes("Approve the sourcing package"),
    );
    expect(authoredSlide).toBeDefined();
    expect(authoredSlide).toContain("Use the tower scope");
    expect(authoredSlide).toContain("Service Tower Scope Map");
    expect(slides.join("\n")).not.toContain("Executive Overview");

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

  it("keeps document-length prose out of PPTX slide faces", async () => {
    const doc = goodDocument();
    doc.generatedSections = [
      {
        key: "dense_section",
        title: "Dense Section",
        bodyMarkdown: [
          [
            "This opening paragraph is intentionally long so the renderer must treat it as a governing slide message",
            "rather than reflowing the entire document paragraph onto the presentation face where it would overflow",
            "and look like a landscape document instead of an executive deck.",
          ].join(" "),
          "",
          [
            "- This supporting bullet is also intentionally long and includes the unique token",
            "unchecked-overflow-tail-token that should never appear on the slide face because a point of this length",
            "is document prose rather than a slide point, and so it has to be held off the face in full rather than",
            "printed there or cut down to a stump.",
          ].join(" "),
          "- A concise supporting point remains visible.",
        ].join("\n"),
        groundingMode: "mixed",
        citationsUsed: [],
      },
    ];

    const slides = await slideXmlFiles(await renderDeliverablePptx(doc));
    const denseSlide = slides.find((s) => s.includes("Dense Section"));

    expect(denseSlide).toBeDefined();
    expect(denseSlide).toContain("A concise supporting point remains visible");
    expect(denseSlide).not.toContain("unchecked-overflow-tail-token");
    expect(denseSlide).not.toContain(
      "look like a landscape document instead of an executive deck",
    );
    // Held off the face means absent, not amputated: no stump of either long
    // claim, and nothing ending in an ellipsis.
    expect(denseSlide).not.toContain("This opening paragraph is intentionally");
    expect(denseSlide).not.toContain("This supporting bullet is also");
    expect(denseSlide).not.toMatch(/\.{3}|…/);
  });

  // The section fallback used to cut every point at a word cap and print the
  // stump with an ellipsis, and to promote a paragraph label to the headline.
  // These run the rendered FILE through the same extractor and scanner that
  // sign-off uses, so the renderer and the gate are proven against each other
  // rather than each against its own fixture.
  function defectShapedDocument() {
    const doc = goodDocument();
    doc.deckSlides = [];
    doc.generatedSections = [
      {
        key: "findings",
        title: "Discovery Findings",
        bodyMarkdown: [
          "**Section verdict.** The readout supports a bounded design phase while the investment decision is held.",
          "",
          "- The value hypothesis is excluded from scoring because the planning-stage annual value figure has no certified baseline behind it.",
          "- Handle time and first-contact resolution are reported on different definitions across the two source extracts and must not be blended.",
          "- Section boundary. The evidence base is synthetic, which limits every quantitative statement in this readout.",
        ].join("\n"),
        groundingMode: "mixed",
        citationsUsed: [],
      },
    ];
    return doc;
  }

  it("prints fallback slide points whole and never promotes a scaffolding label", async () => {
    const buf = await renderDeliverablePptx(defectShapedDocument());
    const slides = await slideXmlFiles(buf);
    const slide = slides.find((s) => s.includes("Discovery Findings"));

    expect(slide).toBeDefined();
    expect(slide).toContain(
      "The readout supports a bounded design phase while the investment decision is held.",
    );
    expect(slide).toContain("has no certified baseline behind it.");
    expect(slide).toContain("and must not be blended.");
    expect(slide).toContain(
      "The evidence base is synthetic, which limits every quantitative statement in this readout.",
    );
    // Three points, three bullet glyphs: the list is visibly a list.
    expect(slide!.match(/<a:buChar /g) ?? []).toHaveLength(3);
    expect(slide).not.toMatch(/Section (?:verdict|boundary)/);
    expect(slide).not.toMatch(/\.{3}|…/);
  });

  it("a fallback deck passes the sign-off scanner's truncation and scaffolding rules", async () => {
    const buf = await renderDeliverablePptx(defectShapedDocument());
    const extracted = await extractOfficeText(new Uint8Array(buf), "pptx");
    expect(extracted.ok).toBe(true);
    if (!extracted.ok) return;

    // Not vacuous: the authored input carries the scaffolding, so a clean
    // result below is the renderer's doing and not an innocent fixture.
    const authored = defectShapedDocument()
      .generatedSections.map((section) => section.bodyMarkdown)
      .join("\n");
    expect(scanClientReadiness(authored).findings.map((f) => f.kind)).toContain(
      "authoring_scaffold_label",
    );
    expect(extracted.text).toContain("has no certified baseline behind it.");

    const found = scanClientReadiness(extracted.text).findings.map(
      (f) => f.kind,
    );
    expect(found).not.toContain("truncated_claim");
    expect(found).not.toContain("authoring_scaffold_label");
  });

  it("carries a claim too long for the face in the speaker notes, in full", async () => {
    const doc = goodDocument();
    doc.deckSlides = [];
    const longTail =
      "held-in-full-tail-token " +
      Array.from({ length: 70 }, (_, i) => `detail${i}`).join(" ");
    doc.generatedSections = [
      {
        key: "s",
        title: "Long Point Section",
        bodyMarkdown: `The opening claim stands.\n\n- A long point about ${longTail}.\n- A short point stays.`,
        groundingMode: "mixed",
        citationsUsed: [],
      },
    ];
    const zip = await JSZip.loadAsync(await renderDeliverablePptx(doc));
    const slideNames = Object.keys(zip.files).filter((f) =>
      /^ppt\/slides\/slide\d+\.xml$/.test(f),
    );
    let face = "";
    for (const name of slideNames) {
      const xml = await zip.file(name)!.async("string");
      if (xml.includes("Long Point Section")) face = xml;
    }
    expect(face).toContain("A short point stays.");
    expect(face).not.toContain("held-in-full-tail-token");

    const notes = (
      await Promise.all(
        Object.keys(zip.files)
          .filter((f) => /^ppt\/notesSlides\/notesSlide\d+\.xml$/.test(f))
          .map((f) => zip.file(f)!.async("string")),
      )
    ).join("\n");
    expect(notes).toContain("held-in-full-tail-token");
    expect(notes).toContain("detail69");
  });

  it("the cover does not assert a grade the status line beneath it denies", async () => {
    const slides = await slideXmlFiles(
      await renderDeliverablePptx(goodDocument()),
    );
    expect(slides[0]).toContain("not approved");
    expect(slides[0]).toContain("WORKING DRAFT FOR REVIEW");
    expect(slides[0].toUpperCase()).not.toContain("BOARD-GRADE DELIVERABLE");

    const html = renderDeliverableHtml(goodDocument());
    expect(html).toContain("Working draft for review");
    expect(html.toLowerCase()).not.toContain("board-grade deliverable");

    const docZip = await JSZip.loadAsync(
      await Packer.toBuffer(renderDeliverableDocx(goodDocument())),
    );
    const documentXml = await docZip.file("word/document.xml")!.async("string");
    // The DOCX eyebrow helper uppercases its text.
    expect(documentXml).toContain("WORKING DRAFT FOR REVIEW");
    expect(documentXml.toLowerCase()).not.toContain("board-grade deliverable");
  });

  it("does not repeat the governing sentence as a bullet when markdown emphasis differs", async () => {
    const doc = goodDocument();
    doc.generatedSections = [
      {
        key: "solution",
        title: "Service & Component Design",
        bodyMarkdown: [
          "The design works *within* the accepted architecture and keeps clinical approval as the control point.",
          "",
          "- The design works within the accepted architecture and keeps clinical approval as the control point.",
          "- Reconciliation resolves source authority before care-gap ranking.",
        ].join("\n"),
        groundingMode: "mixed",
        citationsUsed: [],
      },
    ];

    const slides = await slideXmlFiles(await renderDeliverablePptx(doc));
    const solutionSlide = slides.find((s) =>
      s.includes("Service &amp; Component Design"),
    );

    expect(solutionSlide).toBeDefined();
    expect(solutionSlide).toContain(
      "Reconciliation resolves source authority before care-gap ranking",
    );
    expect(
      solutionSlide!.match(
        /The design works within the accepted architecture/g,
      ) ?? [],
    ).toHaveLength(1);
  });

  it("fails the deck when a declared exhibit cannot be rasterised", async () => {
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

    await expect(
      renderWithBrokenRasteriser(freshGoodDocument()),
    ).rejects.toThrow("simulated rasteriser failure");

    jest.dontMock(
      "@/lib/programs/expert-kernel/exports/board-grade/svg-raster",
    );
    jest.resetModules();
  });
});
