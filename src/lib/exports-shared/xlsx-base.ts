// exports-shared · XLSX base primitives.
//
// Brand tokens, safeCell, locked-row styling, and a generic cover-sheet
// builder shared across all XLSX document renderers. Zero coupling to any
// product module — may be imported by programs/exports, moves/exports, or
// any future module that generates XLSX.
//
// Extracted from src/lib/programs/exports/renderers/okr-baseline.ts and
// src/scripts/templates/generate-xlsx.ts in the journey-kit-phase3 wave.

import ExcelJS from 'exceljs';

// ── Brand tokens ────────────────────────────────────────────────────────

/** Header fill (near-black). */
export const HEADER_FILL = 'FF0A0A0A';
/** Header foreground text (near-white). */
export const HEADER_TEXT = 'FFF5F5F0';
/** Alternating row band fill (warm off-white). */
export const BAND_FILL = 'FFF8F7F4';
/** Accent fill (teal). */
export const ACCENT_FILL = 'FF2DD4C8';
/** Warning / contradiction fill (soft yellow). */
export const CONTRADICTION_FILL = 'FFFFF8C5';
/** Muted text color (warm grey). */
export const MUTED_TEXT = 'FF706D66';

// ── Formula injection guard ─────────────────────────────────────────────

/**
 * Sanitize a cell value to prevent formula injection.
 *
 * Excel treats `=`, `+`, `-`, `@`, and leading tab/CR as formula
 * prefixes. Prefix ambiguous values with a single quote to coerce the
 * cell to a literal string. Empty strings are returned unchanged.
 */
export function safeCell(value: string): string {
  if (value.length === 0) return value;
  const first = value.charAt(0);
  if (first === '=' || first === '+' || first === '-' || first === '@') {
    return `'${value}`;
  }
  return value;
}

// ── Header row styling ──────────────────────────────────────────────────

/**
 * Apply canonical header-row styling to every cell in `row`.
 *
 * Callers add the row first (via `ws.columns` or `ws.addRow`), then call
 * this helper. Height is set to 24pt by convention.
 */
export function styleHeaderRow(row: ExcelJS.Row): void {
  row.eachCell((cell) => {
    cell.font = { bold: true, size: 11, color: { argb: HEADER_TEXT } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: HEADER_FILL },
    };
    cell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    cell.border = { bottom: { style: 'medium', color: { argb: HEADER_FILL } } };
  });
  row.height = 24;
}

/**
 * Apply banding fill to a data row at the given zero-based index.
 *
 * Odd-indexed rows (0-based) receive `BAND_FILL`; even-indexed rows are
 * left unstyled (white default). Callers pass the raw loop index.
 */
export function bandRow(row: ExcelJS.Row, idx: number): void {
  if (idx % 2 === 1) {
    row.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: BAND_FILL },
      };
    });
  }
}

// ── Locked (read-only) sheet protection ─────────────────────────────────

/**
 * Protect a worksheet as read-only.
 *
 * Best-effort — consumers can unprotect with the no-op empty password.
 * Used for cover sheets that should not be edited.
 */
export function lockSheet(ws: ExcelJS.Worksheet): void {
  ws.protect('', {
    selectLockedCells: true,
    selectUnlockedCells: true,
    formatCells: false,
    formatColumns: false,
    formatRows: false,
    insertRows: false,
    deleteRows: false,
    insertColumns: false,
    deleteColumns: false,
    sort: false,
    autoFilter: false,
    pivotTables: false,
  });
}

// ── Cover-sheet builder ──────────────────────────────────────────────────

/** Options for `buildCoverSheet`. */
export interface CoverSheetOptions {
  /** Workbook instance to add the sheet to. */
  workbook: ExcelJS.Workbook;
  /** Primary title text (rendered in Georgia 22pt bold). */
  title: string;
  /** Optional subtitle (rendered in italic muted style). */
  subtitle?: string;
  /** Optional metadata lines rendered below the title block. */
  metaLines?: ReadonlyArray<{ label: string; value: string }>;
  /** Brand subtitle override (default: 'AbarVa'). */
  brandSubtitle?: string;
}

/**
 * Add a canonical cover sheet to `options.workbook`.
 *
 * The sheet is added as the first tab, protected as read-only, and
 * uses the accent fill as its tab color. Callers provide title, optional
 * subtitle, and an array of labeled metadata lines.
 */
export function buildCoverSheet(options: CoverSheetOptions): void {
  const { workbook, title, subtitle, metaLines, brandSubtitle } = options;
  const ws = workbook.addWorksheet('Cover', {
    properties: { tabColor: { argb: ACCENT_FILL } },
    views: [{ state: 'normal', showGridLines: false }],
  });
  ws.getColumn(1).width = 4;
  ws.getColumn(2).width = 110;

  type LineSpec = {
    text: string;
    bold?: boolean;
    size?: number;
    color?: string;
    italic?: boolean;
  };

  const lines: LineSpec[] = [
    { text: title, bold: true, size: 22 },
    ...(subtitle !== undefined
      ? [{ text: subtitle, size: 13, color: MUTED_TEXT, italic: true }]
      : []),
    { text: '' },
    ...(metaLines !== undefined
      ? metaLines.map((ml) => ({
          text: `${ml.label}: ${ml.value}`,
          size: 11,
        }))
      : []),
    { text: '' },
    {
      text: `Generated by ${brandSubtitle ?? 'AbarVa'} at ${new Date().toISOString()}`,
      size: 10,
      color: MUTED_TEXT,
      italic: true,
    },
  ];

  lines.forEach((line, idx) => {
    const row = ws.getRow(idx + 2);
    const cell = row.getCell(2);
    cell.value = safeCell(line.text);
    cell.font = {
      name: line.size !== undefined && line.size >= 18 ? 'Georgia' : 'Calibri',
      bold: !!line.bold,
      italic: !!line.italic,
      size: line.size ?? 11,
      color: { argb: line.color ?? 'FF0A0A0A' },
    };
    cell.alignment = { vertical: 'middle', horizontal: 'left' };
    row.height = line.size !== undefined && line.size >= 18 ? 36 : 22;
  });

  lockSheet(ws);
}
