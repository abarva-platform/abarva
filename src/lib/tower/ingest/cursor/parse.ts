// S4 — Cursor usage + cost ingest
// Pure xlsx → row[] parser. No DB, no fs, no network.
//
// Reads the `Data` sheet of the Cursor template / sample-filled / exported
// workbook. Tolerant of header order (Cursor's CSV exports occasionally
// reorder columns) but strict about column *presence*. Strips the synthetic
// banner row and any blank rows. Trims strings, normalizes dates to
// YYYY-MM-DD, coerces numeric cells to plain `number`.
//
// Returns RAW rows. Field-level validation (ranges, cross-field invariants,
// natural-key uniqueness) lives in ./validate so the parser can stay
// deterministic and dependency-free.

import ExcelJS from 'exceljs';
import {
  CURSOR_COLUMNS,
  CURSOR_HEADER_ORDER,
  CURSOR_SHEET_NAME,
  type CursorColumnSpec,
} from './schema';

export interface CursorRawRow {
  team: string;
  period_start: string;
  period_end: string;
  seats_assigned: number;
  active_users: number;
  completions_shown: number;
  completions_accepted: number;
  monthly_cost_usd: number;
  _row_index: number; // 1-based source row for error reporting
}

export interface CursorParseResult {
  rows: CursorRawRow[];
  warnings: string[];
}

export class CursorParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CursorParseError';
  }
}

function isBlankCell(value: ExcelJS.CellValue): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  return false;
}

function asString(value: ExcelJS.CellValue): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' || typeof value === 'boolean')
    return String(value).trim();
  if (value instanceof Date) return formatDate(value);
  if (typeof value === 'object') {
    const obj = value as unknown as Record<string, unknown>;
    if ('text' in obj) {
      const text = obj.text;
      return typeof text === 'string' ? text.trim() : '';
    }
    if ('result' in obj) {
      const result = obj.result;
      return result === null || result === undefined ? '' : String(result).trim();
    }
  }
  return String(value).trim();
}

function asNumber(value: ExcelJS.CellValue, column: string, rowIdx: number): number {
  if (value === null || value === undefined || value === '') {
    throw new CursorParseError(`row ${rowIdx}: column "${column}" is required (non-numeric/blank)`);
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      throw new CursorParseError(`row ${rowIdx}: column "${column}" is not finite`);
    }
    return value;
  }
  if (typeof value === 'string') {
    // Tolerate $1,234.56, " 42 ", etc. — common when CSV is hand-edited in Excel.
    const cleaned = value.replace(/[$,\s]/g, '');
    if (cleaned === '') {
      throw new CursorParseError(`row ${rowIdx}: column "${column}" is blank`);
    }
    const n = Number(cleaned);
    if (!Number.isFinite(n)) {
      throw new CursorParseError(`row ${rowIdx}: column "${column}" not a number ("${value}")`);
    }
    return n;
  }
  if (typeof value === 'object' && value !== null) {
    const obj = value as unknown as Record<string, unknown>;
    if ('result' in obj) {
      return asNumber((obj.result as ExcelJS.CellValue) ?? null, column, rowIdx);
    }
  }
  throw new CursorParseError(`row ${rowIdx}: column "${column}" has unsupported type`);
}

function asDate(value: ExcelJS.CellValue, column: string, rowIdx: number): string {
  if (value === null || value === undefined || value === '') {
    throw new CursorParseError(`row ${rowIdx}: column "${column}" is required (date)`);
  }
  if (value instanceof Date) return formatDate(value);
  if (typeof value === 'string') {
    const trimmed = value.trim();
    // Strict YYYY-MM-DD shape; we want to fail loudly on US/EU ambiguous input.
    if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      throw new CursorParseError(
        `row ${rowIdx}: column "${column}" must be YYYY-MM-DD ("${trimmed}")`,
      );
    }
    const d = new Date(`${trimmed}T00:00:00Z`);
    if (Number.isNaN(d.getTime())) {
      throw new CursorParseError(`row ${rowIdx}: column "${column}" is not a real date ("${trimmed}")`);
    }
    return trimmed;
  }
  if (typeof value === 'number') {
    // ExcelJS sometimes hands us serial dates as numbers when the workbook
    // doesn't carry a date format. Convert from Excel epoch.
    const ms = Math.round((value - 25569) * 86400 * 1000);
    const d = new Date(ms);
    if (Number.isNaN(d.getTime())) {
      throw new CursorParseError(`row ${rowIdx}: column "${column}" serial date invalid`);
    }
    return formatDate(d);
  }
  throw new CursorParseError(`row ${rowIdx}: column "${column}" unsupported date type`);
}

function formatDate(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function findHeaderRow(ws: ExcelJS.Worksheet): {
  headerRowIndex: number;
  columnIndex: Record<string, number>;
} {
  // Search the first 10 rows for a row that contains all required headers.
  // This skips a synthetic-banner row, blank rows, or branded title rows.
  const required = CURSOR_COLUMNS.filter((c) => c.required).map((c) => c.label);
  for (let r = 1; r <= Math.min(10, ws.rowCount); r += 1) {
    const row = ws.getRow(r);
    const values = new Map<string, number>();
    row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      const text = asString(cell.value).toLowerCase();
      if (text) values.set(text, colNumber);
    });
    if (required.every((label) => values.has(label.toLowerCase()))) {
      const columnIndex: Record<string, number> = {};
      for (const col of CURSOR_COLUMNS) {
        const idx = values.get(col.label.toLowerCase());
        if (idx) columnIndex[col.key] = idx;
      }
      return { headerRowIndex: r, columnIndex };
    }
  }
  throw new CursorParseError(
    `header row not found in sheet "${ws.name}" — expected columns: ${CURSOR_HEADER_ORDER.join(', ')}`,
  );
}

export async function parseCursorWorkbook(
  buffer: ArrayBuffer | Buffer,
): Promise<CursorParseResult> {
  const wb = new ExcelJS.Workbook();
  // ExcelJS .load expects a Buffer-like; cast widens to accept Node Buffer
  // subclasses (NonSharedBuffer) that arise from readFileSync.
  await wb.xlsx.load(buffer as unknown as ArrayBuffer);

  const ws =
    wb.getWorksheet(CURSOR_SHEET_NAME) ?? wb.worksheets.find((w) => w.name.toLowerCase() === CURSOR_SHEET_NAME.toLowerCase());
  if (!ws) {
    throw new CursorParseError(`sheet "${CURSOR_SHEET_NAME}" not found in workbook`);
  }

  const { headerRowIndex, columnIndex } = findHeaderRow(ws);
  const warnings: string[] = [];

  // Surface missing OPTIONAL columns as warnings (currently all required, but
  // keeps the parser future-proof when we add optional columns).
  for (const col of CURSOR_COLUMNS) {
    if (!columnIndex[col.key]) {
      if (col.required) {
        throw new CursorParseError(`required column "${col.label}" missing`);
      }
      warnings.push(`optional column "${col.label}" not present`);
    }
  }

  const rows: CursorRawRow[] = [];
  for (let r = headerRowIndex + 1; r <= ws.rowCount; r += 1) {
    const row = ws.getRow(r);
    // Skip fully blank rows.
    let blank = true;
    row.eachCell({ includeEmpty: false }, (cell) => {
      if (!isBlankCell(cell.value)) blank = false;
    });
    if (blank) continue;

    const pick = (col: CursorColumnSpec): ExcelJS.CellValue => {
      const idx = columnIndex[col.key];
      return idx ? row.getCell(idx).value : null;
    };

    try {
      const parsed: CursorRawRow = {
        team: asString(pick(byKey('team'))),
        period_start: asDate(pick(byKey('period_start')), 'period_start', r),
        period_end: asDate(pick(byKey('period_end')), 'period_end', r),
        seats_assigned: asNumber(pick(byKey('seats_assigned')), 'seats_assigned', r),
        active_users: asNumber(pick(byKey('active_users')), 'active_users', r),
        completions_shown: asNumber(pick(byKey('completions_shown')), 'completions_shown', r),
        completions_accepted: asNumber(pick(byKey('completions_accepted')), 'completions_accepted', r),
        monthly_cost_usd: asNumber(pick(byKey('monthly_cost_usd')), 'monthly_cost_usd', r),
        _row_index: r,
      };
      if (!parsed.team) {
        throw new CursorParseError(`row ${r}: column "team" is required`);
      }
      rows.push(parsed);
    } catch (err) {
      if (err instanceof CursorParseError) throw err;
      throw new CursorParseError(`row ${r}: ${(err as Error).message}`);
    }
  }

  return { rows, warnings };
}

function byKey(key: string): CursorColumnSpec {
  const found = CURSOR_COLUMNS.find((c) => c.key === key);
  if (!found) throw new Error(`unknown column key: ${key}`);
  return found;
}
