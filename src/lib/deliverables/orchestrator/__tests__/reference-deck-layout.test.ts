import { layoutReferenceTable, referenceCellLines, referenceCellTextHeight } from "../reference-deck-layout";
import { buildReferenceDeckPdf } from "../reference-deck-pdf";
import type { ReferenceDeckSpec } from "../reference-deck-model";
import { Document, Page, Text, View, Svg, Path } from "@react-pdf/renderer";
import { isValidElement, type ReactNode } from "react";

const statement = "The analyst checks eligibility and supporting documentation before routing the decision to the accountable operations owner for review and resolution.";

describe("readable reference tables", () => {
  it("emits readable PDF table text with room for the complete paragraph", () => {
    const spec: ReferenceDeckSpec = { edition: "investment", client: "Synthetic", program: "Synthetic scope", useCase: "Synthetic scope",
      sponsorRole: "Sponsor", monthYear: "October", sourcesCheckedTo: "2026-10-10", sources: {}, figureLedger: [],
      slides: [{ archetype: "assumptions", section: "VALIDATE", actionTitle: "Reviewed evidence identifies the next decision.",
        answer: "Confirm the source before relying on this conclusion.", blocks: [{ kind: "table", columns: ["ID", "Assumption"], rows: [["Working basis", statement]] }] }] };
    const primitives = new Set<unknown>([Document, Page, Text, View, Svg, Path]);
    const found: { style: Record<string, number>; rowHeight: number }[] = [];
    const walk = (node: ReactNode, rowHeight = 0): void => {
      if (Array.isArray(node)) { node.forEach((child) => walk(child, rowHeight)); return; }
      if (!isValidElement<Record<string, unknown>>(node)) return;
      if (typeof node.type === "function" && !primitives.has(node.type)) {
        walk((node.type as (props: Record<string, unknown>) => ReactNode)(node.props), rowHeight); return;
      }
      const style = node.props.style as Record<string, number> | undefined;
      const height = typeof style?.height === "number" ? style.height : rowHeight;
      if (node.type === Text && node.props.children === statement) found.push({ style: style ?? {}, rowHeight });
      walk(node.props.children as ReactNode, height);
    };
    walk(buildReferenceDeckPdf(spec));
    expect(found).toHaveLength(1);
    expect(found[0]!.style.fontSize).toBeGreaterThanOrEqual(10);
    expect(found[0]!.style.width).toBeGreaterThan(400);
    expect(found[0]!.rowHeight).toBeGreaterThan(40);
  });

  it("gives long prose room while retaining every cell and its figure binding", () => {
    const figure = { display: "$1,200", sourceId: "[A:V1]", workbookCell: "Deck Figures!B2" };
    const block = { kind: "table" as const, columns: ["ID", "Assumption", "Working figure", "Owner", "Status"],
      rows: [["[A:V1]", statement, figure, "Operations improvement lead", "Open"],
        ["[A:V2]", "Check timing", figure, "Operations lead", "Open"]] };
    const layout = layoutReferenceTable(block);
    expect(layout.columnWidths[1]).toBeGreaterThan(layout.columnWidths[0]! * 2);
    expect(layout.rowHeights[1]).toBeGreaterThan(layout.rowHeights[2]!);
    expect(layout.cells[1]).toEqual(["[A:V1]", statement, "$1,200", "Operations improvement lead", "Open"]);
    expect(layout.height).toBeLessThan(4.2);
    expect(block.rows[0]?.[2]).toBe(figure);
    expect(layout.fontSize).toBe(11);
  });

  it("accounts for explicit paragraphs, unbroken identifiers and wide characters", () => {
    expect(referenceCellLines("First line\nSecond line", 4, 11)).toBe(2);
    expect(referenceCellLines("W".repeat(80), 1, 11)).toBeGreaterThan(referenceCellLines("i".repeat(80), 1, 11));
    expect(referenceCellLines("A".repeat(80), 1, 11)).toBeGreaterThan(5);
    expect(referenceCellLines(statement, 4, 11)).toBeLessThan(referenceCellLines(statement, 2, 11));
    expect(referenceCellTextHeight(statement, 4, 11)).toBeGreaterThan(0.37);
    expect(referenceCellLines(statement, 0, 11)).toBe(Infinity);
  });

  it("keeps dense tables readable and rejects missing or uneven columns", () => {
    const layout = layoutReferenceTable({ kind: "table", columns: ["Driver", "Basis", "Unit hours", "Confidence", "Low", "Plan", "High", "Source"],
      rows: [["Interface", "Unit-hour driver", "Confirmed hours", "Medium", "To confirm", "To confirm", "To confirm", "Approved estimate"]] });
    expect(layout.fontSize).toBe(10);
    expect(layout.columnWidths.reduce((sum, width) => sum + width, 0)).toBeCloseTo(11.9);
    expect(() => layoutReferenceTable({ kind: "table", columns: [], rows: [] })).toThrow("reference_deck_table_shape_invalid");
    expect(() => layoutReferenceTable({ kind: "table", columns: ["Basis"], rows: [["One", "Two"]] })).toThrow("reference_deck_table_shape_invalid");
  });
});
