// exports-shared · Structured DOCX table primitives.
//
// `buildKeyValueTable` and `buildMultiColumnTable` — the two generic
// table builders that underpin every data table in the DOCX renderers.
// Zero coupling to any product module.
//
// Extracted from the repeated `headerCell` / `dataCell` + inline Table
// patterns in src/lib/programs/exports/renderers/{discovery-report,
// meeting-notes, outcome-report, pilot-result-report,
// workshop-facilitator-guide}.ts in the journey-kit-phase3 wave.

import {
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx';

import { SANS_BODY_FONT } from './docx-base';

// ── Primitive cell builders ──────────────────────────────────────────────

/** Options for `makeHeaderCell`. */
export interface HeaderCellOptions {
  /** Column fill override (default: '#0A0A0A'). */
  fill?: string;
  /** Column width in DXA (default: 1500). */
  widthDxa?: number;
}

/**
 * Build a dark-header table cell with white bold text.
 *
 * `fill` and `widthDxa` are configurable so the same helper works for
 * narrow reference columns and wide narrative columns.
 */
export function makeHeaderCell(
  text: string,
  opts?: HeaderCellOptions,
): TableCell {
  const fill = opts?.fill ?? '0A0A0A';
  const width = opts?.widthDxa ?? 1500;
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    shading: { fill },
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text,
            bold: true,
            size: 20,
            color: 'F5F5F0',
            font: SANS_BODY_FONT,
          }),
        ],
      }),
    ],
  });
}

/** Options for `makeDataCell`. */
export interface DataCellOptions {
  bold?: boolean;
  /** Text color override (6-char hex, no #). */
  color?: string;
  /** Column width in DXA (default: 1500). */
  widthDxa?: number;
}

/**
 * Build a standard data cell.
 *
 * Accepts optional bold, color, and width overrides so the same
 * primitive can cover metric-id columns, decision-rights columns,
 * and wide narrative columns.
 */
export function makeDataCell(
  text: string,
  opts?: DataCellOptions,
): TableCell {
  const width = opts?.widthDxa ?? 1500;
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text,
            bold: opts?.bold === true,
            color: opts?.color,
            size: 20,
            font: SANS_BODY_FONT,
          }),
        ],
      }),
    ],
  });
}

// ── Generic table builders ───────────────────────────────────────────────

/** One column spec for `buildMultiColumnTable`. */
export interface ColumnSpec {
  /** Header label text. */
  header: string;
  /** Width in DXA. */
  widthDxa?: number;
}

/**
 * Build a multi-column table from a headers definition and row data.
 *
 * @param columnSpecs - Column definitions (in order).
 * @param rows - Array of rows; each row is an array of cell values
 *   (in the same column order as `columnSpecs`).
 * @param opts.boldFirstColumn - If true, first-column data cells are bold.
 *
 * @example
 * ```ts
 * const table = buildMultiColumnTable(
 *   [{ header: 'Metric', widthDxa: 2400 }, { header: 'Value', widthDxa: 3200 }],
 *   [['Revenue', '$2.4B'], ['NPS', '42']],
 * );
 * ```
 */
export function buildMultiColumnTable(
  columnSpecs: ReadonlyArray<ColumnSpec>,
  rows: ReadonlyArray<ReadonlyArray<string>>,
  opts?: { boldFirstColumn?: boolean },
): Table {
  const headerRow = new TableRow({
    tableHeader: true,
    children: columnSpecs.map((cs) =>
      makeHeaderCell(cs.header, { widthDxa: cs.widthDxa }),
    ),
  });

  const dataRows = rows.map((cells) =>
    new TableRow({
      children: cells.map((text, colIdx) =>
        makeDataCell(text, {
          widthDxa: columnSpecs[colIdx]?.widthDxa,
          bold: opts?.boldFirstColumn === true && colIdx === 0,
        }),
      ),
    }),
  );

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [headerRow, ...dataRows],
  });
}

/**
 * Build a two-column key/value table.
 *
 * The first column (label) is bold; the second column (value) is plain.
 * Useful for metadata sections like sponsor blocks and program summaries.
 *
 * @param entries - Array of `[label, value]` pairs.
 * @param opts.labelWidthDxa - Width of the label column (default: 2200).
 * @param opts.valueWidthDxa - Width of the value column (default: 4600).
 *
 * @example
 * ```ts
 * const table = buildKeyValueTable([
 *   ['Sponsor', 'James Wright (CTO)'],
 *   ['Charter date', '2026-03-01'],
 * ]);
 * ```
 */
export function buildKeyValueTable(
  entries: ReadonlyArray<readonly [string, string]>,
  opts?: { labelWidthDxa?: number; valueWidthDxa?: number },
): Table {
  const labelWidth = opts?.labelWidthDxa ?? 2200;
  const valueWidth = opts?.valueWidthDxa ?? 4600;

  const headerRow = new TableRow({
    tableHeader: true,
    children: [
      makeHeaderCell('Field', { widthDxa: labelWidth }),
      makeHeaderCell('Value', { widthDxa: valueWidth }),
    ],
  });

  const dataRows = entries.map(
    ([label, value]) =>
      new TableRow({
        children: [
          makeDataCell(label, { bold: true, widthDxa: labelWidth }),
          makeDataCell(value, { widthDxa: valueWidth }),
        ],
      }),
  );

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [headerRow, ...dataRows],
  });
}
