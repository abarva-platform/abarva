import JSZip from "jszip";
import { amsRfpRequest } from "../__fixtures__/ams-rfp";
import { purposeFixture } from "../__fixtures__/purpose-pages";
import { assembleDeliverable } from "../section-generation";
import { preserveRootCauseTable, isRootCauseTable } from "../root-cause-table";
import { renderPurposeDeck } from "../purpose-page-renderer";
import { renderDeliverablePptx } from "../renderers";
import { renderedContractExhibitsFromDocument } from "../../quality/deliverable-key-map";
import type { RenderableSection, RenderableTable } from "../types";

const markdown = [
  "Observed gaps remain hypotheses, not confirmed causes.",
  "| Symptom (observed) | Likely root cause | Cited evidence | Confidence | Implication for next phase |",
  "| --- | --- | --- | --- | --- |",
  "| Unowned handoff | Ownership may be unclear | Register [1] | Low; unvalidated | Confirm owner before design |",
  "| Untraced field | Mapping may be incomplete | Field A \\| B [2] | Unknown | Validate lineage first |",
].join("\n");

function section(bodyMarkdown = markdown): RenderableSection {
  return {
    key: "symptom_cause_table",
    title: "Observed gaps require causal validation",
    bodyMarkdown,
    groundingMode: "mixed",
    citationsUsed: [1, 2],
  };
}

function extract(body = markdown, type = "root_cause_worksheet") {
  const tables: RenderableTable[] = [];
  preserveRootCauseTable(type, [section(body)], tables);
  return tables;
}

describe("root-cause table preservation", () => {
  it("keeps actual cells, citations, escaped pipes, and uncertainty through assembly", () => {
    const req = amsRfpRequest({
      module: "moves",
      deliverableType: "root_cause_worksheet",
      clientDisplayName: "Synthetic organization",
      initiativeDisplayName: "Synthetic diagnostic",
      governedEvidenceBundle: [],
      approvedAssumptions: [],
      clientCompleteItems: [],
      missingEvidence: [],
    });
    const doc = assembleDeliverable(
      req,
      [section()],
      { title: "Diagnostic", tables: [] },
      [],
    );
    expect(doc.tables.find(isRootCauseTable)?.rows).toEqual([
      [
        "Unowned handoff",
        "Ownership may be unclear",
        "Register [1]",
        "Low; unvalidated",
        "Confirm owner before design",
      ],
      [
        "Untraced field",
        "Mapping may be incomplete",
        "Field A | B [2]",
        "Unknown",
        "Validate lineage first",
      ],
    ]);
    expect(
      renderedContractExhibitsFromDocument(doc, "root_cause_worksheet"),
    ).toContain("symptom_cause_table");
  });

  it.each([
    "A symptom_cause_table is required.",
    markdown.split("\n").slice(0, 3).join("\n"),
    markdown.replace("Cited evidence", "Description"),
    markdown.replace("| Register [1] |", "| |"),
    markdown.replace("| Unknown | Validate lineage first |", "| Unknown |"),
    "```markdown\n" + markdown + "\n```",
  ])("does not manufacture a table from incomplete content", (body) => {
    expect(extract(body)).toEqual([]);
  });

  it("does not change other deliverables or replace an existing valid native table", () => {
    expect(extract(markdown, "discovery_report")).toEqual([]);
    const tables = extract();
    const original = tables[0];
    preserveRootCauseTable("root_cause", [section()], tables);
    expect(tables).toHaveLength(1);
    expect(tables[0]).toBe(original);
  });

  it("does not count a slide key, empty table, or workbook-only table as the matrix", () => {
    const doc = purposeFixture();
    doc.exhibits = [];
    doc.deckSlides = [
      {
        key: "what_is_not_working",
        exhibitKey: "symptom_cause_table",
        title: "Symptoms",
        governingMessage: "Symptoms require evidence",
      },
    ];
    doc.tables = [];
    expect(
      renderedContractExhibitsFromDocument(doc, "root_cause_worksheet"),
    ).not.toContain("symptom_cause_table");
    doc.tables = extract();
    doc.tables[0]!.rows = [];
    expect(
      renderedContractExhibitsFromDocument(doc, "root_cause_worksheet"),
    ).not.toContain("symptom_cause_table");
    doc.tables = extract();
    doc.tables[0]!.targetFormat = "xlsx";
    expect(
      renderedContractExhibitsFromDocument(doc, "root_cause_worksheet"),
    ).not.toContain("symptom_cause_table");
  });

  it.each([renderPurposeDeck, renderDeliverablePptx])(
    "exports the recovered matrix as an editable PowerPoint table (%#)",
    async (render) => {
      const doc = purposeFixture();
      doc.deliverableType = "root_cause_worksheet";
      doc.tables = extract();
      doc.generatedSections = [section()];
      doc.exhibits = [];
      doc.deckSlides = [
        {
          key: "diagnostic",
          governingMessage:
            "The diagnostic separates observations from hypotheses",
          points: [
            "The evidence records a gap; its cause remains unvalidated.",
          ],
          pageIntent: {
            question: "What is established?",
            scopeNote: "Synthetic diagnostic; no causal approval recorded.",
            takeaway: "Validate the hypotheses before design.",
          },
        },
      ];
      delete doc.purposePageDesign;
      const zip = await JSZip.loadAsync(await render(doc));
      const nativeTables = (
        await Promise.all(
          Object.keys(zip.files)
            .filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name))
            .map((name) => zip.file(name)!.async("string")),
        )
      ).flatMap((xml) =>
        [...xml.matchAll(/<a:tbl>([\s\S]*?)<\/a:tbl>/g)].map(
          (match) => match[1],
        ),
      );
      expect(nativeTables.join("\n")).toContain("Unowned handoff");
      expect(nativeTables.join("\n")).toContain("Register [1]");
      expect(nativeTables.join("\n")).toContain("Low; unvalidated");
      expect(nativeTables.join("\n")).toContain("Validate lineage first");
    },
  );
});
