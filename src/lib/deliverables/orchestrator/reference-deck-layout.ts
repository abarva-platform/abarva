import type { ReferenceBlock, ReferenceCell } from "./reference-deck-model";

type Table = Extract<ReferenceBlock, { kind: "table" }>;
export const REFERENCE_TABLE_PADDING_X = 0.12;
export const REFERENCE_TABLE_PADDING_Y = 0.09;

const display = (cell: ReferenceCell): string => typeof cell === "string" ? cell : cell.display;

// Conservative advance widths for the Arial/Helvetica table face, in ems.
// Leave slack for font substitution instead of relying on editor-triggered autofit.
function advance(character: string): number {
  if (/\s/u.test(character)) return 0.3;
  if (/[ilI.,:;'!|]/u.test(character)) return 0.3;
  if (/[MWmw@%]/u.test(character)) return 0.95;
  if (/[A-Z]/u.test(character)) return 0.72;
  if (/[\u0020-\u007e]/u.test(character)) return 0.59;
  return 1;
}

const widthEm = (text: string): number => Array.from(text).reduce((sum, character) => sum + advance(character), 0);

/** Estimate wrapped lines without deleting or abbreviating any cell content. */
export function referenceCellLines(text: string, widthIn: number, fontSize: number): number {
  const capacity = widthIn * 72 / fontSize;
  if (!Number.isFinite(capacity) || capacity <= 0) return Infinity;
  return text.split(/\r?\n/u).reduce((count, paragraph) => {
    let lines = 1;
    let used = 0;
    for (const word of paragraph.trim().split(/\s+/u).filter(Boolean)) {
      const units = widthEm(word);
      if (used && used + 0.3 + units > capacity) { lines++; used = 0; }
      // PowerPoint can wrap an unbroken identifier; allow for each full line.
      const fullLines = Math.max(0, Math.ceil(units / capacity) - 1);
      lines += fullLines;
      used = fullLines ? units - fullLines * capacity : used + (used ? 0.3 : 0) + units;
    }
    return count + lines;
  }, 0);
}

export function referenceCellTextHeight(text: string, widthIn: number, fontSize: number): number {
  return referenceCellLines(text, widthIn, fontSize) * fontSize * 1.28 / 72 + 0.035;
}

/** Content-weighted columns and wrapped row heights shared by both file formats. */
export function layoutReferenceTable(block: Table, widthIn = 11.9) {
  const fontSize = block.columns.length >= 7 ? 10 : 11;
  const headerFontSize = 10;
  const cells = [block.columns, ...block.rows.map((row) => row.map(display))];
  if (!block.columns.length || cells.some((row) => row.length !== block.columns.length))
    throw new Error("reference_deck_table_shape_invalid");
  const weights = block.columns.map((_, column) => {
    const longest = Math.max(...cells.map((row) => widthEm(row[column]!)));
    return Math.max(2.8, Math.min(12, Math.sqrt(longest) * (longest > 50 ? 1.2 : 1)));
  });
  const totalWeight = weights.reduce((sum, value) => sum + value, 0);
  const columnWidths = weights.map((weight) => widthIn * weight / totalWeight);
  const rowHeights = cells.map((row, index) => Math.max(0.4, ...row.map((value, column) =>
    referenceCellTextHeight(value, columnWidths[column]! - REFERENCE_TABLE_PADDING_X * 2,
      index === 0 ? headerFontSize : fontSize) + REFERENCE_TABLE_PADDING_Y * 2)));
  return { cells, columnWidths, rowHeights, fontSize, headerFontSize,
    height: rowHeights.reduce((sum, height) => sum + height, 0) };
}
