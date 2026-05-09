// Source · structured-data docx helpers
//
// Slice 5 introduces a second docx pattern alongside the narrative one
// (Slice 3.x). Where narrative-docx walks a markdown body, structured-
// docx renders typed payloads (AppInventoryPayload / ResponseChecklist
// Payload / ScorecardPayload) as docx tables + sections — mirroring
// the xlsx sheet structure but in Word format.
//
// Goal: every active Source artifact has a docx surface in addition to
// its native xlsx, so the buyer can choose by use case (xlsx for in-
// place editing, docx for offline review + redlining + sharing).
//
// The shared infrastructure here is purely about table styling. Each
// per-artifact renderer composes these helpers + the existing
// docx-base helpers (cover blocks, headings, paragraphs).

import 'server-only';

import {
  AlignmentType,
  BorderStyle,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
  type IRunOptions,
} from 'docx';

import { SOURCE_DOCX } from './docx-base';

/** Word doesn't execute formulas, but we still defend against null. */
function safeCellString(value: string | undefined | null): string {
  return value == null ? '' : String(value);
}

/**
 * Build a 2-column key/value table. Used for cover-style metadata
 * blocks (e.g. tier definitions, format expectations, sign-off fields).
 *
 * Each row is { label, value } where label is bold-styled and value
 * is regular text. When `editableValues=true`, value cells get a soft
 * highlight + are not protected (vendor-fillable).
 */
export function buildKeyValueTable(args: {
  rows: ReadonlyArray<{ label: string; value: string }>;
  labelWidth?: number; // percent
  editableValues?: boolean;
  headerRow?: { left: string; right: string };
}): Table {
  const labelWidth = args.labelWidth ?? 30;
  const valueWidth = 100 - labelWidth;

  const rows: TableRow[] = [];
  if (args.headerRow) {
    rows.push(
      new TableRow({
        tableHeader: true,
        children: [
          headerCell(args.headerRow.left, labelWidth),
          headerCell(args.headerRow.right, valueWidth),
        ],
      }),
    );
  }
  for (const row of args.rows) {
    rows.push(
      new TableRow({
        children: [
          labelCell(row.label, labelWidth),
          args.editableValues
            ? editableCell(row.value, valueWidth)
            : valueCell(row.value, valueWidth),
        ],
      }),
    );
  }
  return new Table({
    rows,
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: standardBorders(),
  });
}

/**
 * Build a multi-column table from typed rows. Pass column definitions
 * (header label, width %, optional 'locked' / 'editable' marker) and a
 * row mapper. The mapper returns the cell strings in column order.
 *
 * Width must sum to 100 across columns.
 */
export interface MultiColumnDefinition<T> {
  header: string;
  widthPercent: number;
  /** Style hint: 'locked' (gray), 'editable' (amber), 'default' (white). */
  style?: 'locked' | 'editable' | 'default';
  /** Cell value extractor. */
  extract: (row: T) => string;
}

export function buildMultiColumnTable<T>(args: {
  columns: ReadonlyArray<MultiColumnDefinition<T>>;
  rows: ReadonlyArray<T>;
  /**
   * Optional row-level style override — return 'warning' for rows that
   * the buyer should attend to (unclassified tier, missing data, etc).
   */
  rowStyle?: (row: T) => 'warning' | undefined;
}): Table {
  const headerRow = new TableRow({
    tableHeader: true,
    children: args.columns.map((c) => headerCell(c.header, c.widthPercent)),
  });
  const dataRows = args.rows.map((row) => {
    const rowFlag = args.rowStyle?.(row);
    return new TableRow({
      children: args.columns.map((col) => {
        const text = col.extract(row);
        if (rowFlag === 'warning') {
          return warningCell(text, col.widthPercent);
        }
        if (col.style === 'editable') {
          return editableCell(text, col.widthPercent);
        }
        if (col.style === 'locked') {
          return lockedCell(text, col.widthPercent);
        }
        return valueCell(text, col.widthPercent);
      }),
    });
  });
  return new Table({
    rows: [headerRow, ...dataRows],
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: standardBorders(),
  });
}

// ── Cell builders ──────────────────────────────────────────────────────────

function headerCell(text: string, widthPercent: number): TableCell {
  return new TableCell({
    width: { size: widthPercent, type: WidthType.PERCENTAGE },
    shading: { fill: SOURCE_DOCX.HEADER_COLOR, type: 'clear', color: 'auto' },
    children: [
      new Paragraph({
        spacing: { before: 60, after: 60 },
        alignment: AlignmentType.LEFT,
        children: [
          new TextRun({
            text: safeCellString(text),
            font: SOURCE_DOCX.BODY_FONT,
            size: 20,
            bold: true,
            color: 'FAF7F1',
          }),
        ],
      }),
    ],
  });
}

function labelCell(text: string, widthPercent: number): TableCell {
  return new TableCell({
    width: { size: widthPercent, type: WidthType.PERCENTAGE },
    shading: { fill: 'E8E5DC', type: 'clear', color: 'auto' },
    children: [
      new Paragraph({
        spacing: { before: 40, after: 40 },
        children: [
          new TextRun({
            text: safeCellString(text),
            font: SOURCE_DOCX.BODY_FONT,
            size: 20,
            bold: true,
            color: SOURCE_DOCX.HEADER_COLOR,
          }),
        ],
      }),
    ],
  });
}

function valueCell(
  text: string,
  widthPercent: number,
  runOpts: Partial<IRunOptions> = {},
): TableCell {
  return new TableCell({
    width: { size: widthPercent, type: WidthType.PERCENTAGE },
    children: [
      new Paragraph({
        spacing: { before: 40, after: 40 },
        children: [
          new TextRun({
            text: safeCellString(text),
            font: SOURCE_DOCX.BODY_FONT,
            size: 20,
            ...runOpts,
          }),
        ],
      }),
    ],
  });
}

function lockedCell(text: string, widthPercent: number): TableCell {
  return new TableCell({
    width: { size: widthPercent, type: WidthType.PERCENTAGE },
    shading: { fill: 'E8E5DC', type: 'clear', color: 'auto' },
    children: [
      new Paragraph({
        spacing: { before: 40, after: 40 },
        children: [
          new TextRun({
            text: safeCellString(text),
            font: SOURCE_DOCX.BODY_FONT,
            size: 20,
          }),
        ],
      }),
    ],
  });
}

function editableCell(text: string, widthPercent: number): TableCell {
  return new TableCell({
    width: { size: widthPercent, type: WidthType.PERCENTAGE },
    shading: { fill: 'FFF4D6', type: 'clear', color: 'auto' },
    children: [
      new Paragraph({
        spacing: { before: 40, after: 40 },
        children: [
          new TextRun({
            text: safeCellString(text),
            font: SOURCE_DOCX.BODY_FONT,
            size: 20,
          }),
        ],
      }),
    ],
  });
}

function warningCell(text: string, widthPercent: number): TableCell {
  return new TableCell({
    width: { size: widthPercent, type: WidthType.PERCENTAGE },
    shading: { fill: 'FFF4D6', type: 'clear', color: 'auto' },
    children: [
      new Paragraph({
        spacing: { before: 40, after: 40 },
        children: [
          new TextRun({
            text: safeCellString(text),
            font: SOURCE_DOCX.BODY_FONT,
            size: 20,
            color: '7A5800',
          }),
        ],
      }),
    ],
  });
}

function standardBorders() {
  return {
    top: { style: BorderStyle.SINGLE, size: 4, color: 'D8D5CC' },
    bottom: { style: BorderStyle.SINGLE, size: 4, color: 'D8D5CC' },
    left: { style: BorderStyle.SINGLE, size: 4, color: 'D8D5CC' },
    right: { style: BorderStyle.SINGLE, size: 4, color: 'D8D5CC' },
    insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: 'ECE9E0' },
    insideVertical: { style: BorderStyle.SINGLE, size: 2, color: 'ECE9E0' },
  };
}
