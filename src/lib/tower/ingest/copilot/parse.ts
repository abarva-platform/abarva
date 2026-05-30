// Tower ingest · GitHub Copilot usage + cost · parser.
//
// Pure, deterministic, no I/O. Takes an exceljs Workbook (already loaded
// from buffer or disk by the caller) and returns rows plus parse notes.
// Designed to be called from both the CLI and a future API route.

import type ExcelJS from 'exceljs';
import {
  COPILOT_COLUMNS,
  COPILOT_HEADER_ORDER,
  type CopilotUsageRow,
} from './schema';

export interface CopilotParseResult {
  rows: CopilotUsageRow[];
  /** Rows that failed shape checks during parsing (will be re-validated). */
  parseErrors: Array<{ rowNumber: number; reason: string }>;
  /** Soft notes — e.g. derived acceptance rate, header reordering. */
  notes: string[];
}

const DATA_SHEET_NAMES = ['Data', 'data'];

/** Locate the data sheet by name, falling back to the first non-readme sheet. */
function resolveDataSheet(wb: ExcelJS.Workbook): ExcelJS.Worksheet {
  for (const name of DATA_SHEET_NAMES) {
    const ws = wb.getWorksheet(name);
    if (ws) return ws;
  }
  // Fallback: first worksheet whose name isn't a documentation sheet.
  const skip = new Set(['How to fill', 'Schema', 'README']);
  for (const ws of wb.worksheets) {
    if (!skip.has(ws.name)) return ws;
  }
  throw new Error('Workbook contains no Data sheet.');
}

function cellString(cell: ExcelJS.Cell | undefined): string {
  if (!cell) return '';
  const v = cell.value;
  if (v === null || v === undefined) return '';
  if (typeof v === 'string') return v.trim();
  if (typeof v === 'number') return String(v);
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  if (v instanceof Date) return formatDate(v);
  // Rich text / formula / hyperlink shapes.
  if (typeof v === 'object') {
    if ('text' in v && typeof (v as { text: unknown }).text === 'string') {
      return String((v as { text: string }).text).trim();
    }
    if ('result' in v && (v as { result: unknown }).result !== undefined) {
      const r = (v as { result: unknown }).result;
      if (typeof r === 'string' || typeof r === 'number') return String(r).trim();
      if (r instanceof Date) return formatDate(r);
    }
    if ('richText' in v && Array.isArray((v as { richText: Array<{ text: string }> }).richText)) {
      return (v as { richText: Array<{ text: string }> }).richText
        .map((r) => r.text)
        .join('')
        .trim();
    }
  }
  return String(v).trim();
}

function formatDate(d: Date): string {
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function parseInteger(raw: string): number | null {
  if (!raw) return null;
  const cleaned = raw.replace(/[, _]/g, '');
  if (!/^-?\d+$/.test(cleaned)) {
    // Allow "1234.0" style.
    const f = Number.parseFloat(cleaned);
    if (Number.isFinite(f) && Math.abs(f - Math.round(f)) < 1e-9) return Math.round(f);
    return null;
  }
  return Number.parseInt(cleaned, 10);
}

function parseNumber(raw: string): number | null {
  if (!raw) return null;
  const cleaned = raw.replace(/[$,\s]/g, '');
  const f = Number.parseFloat(cleaned);
  return Number.isFinite(f) ? f : null;
}

function parsePercent(raw: string): number | null {
  if (!raw) return null;
  const cleaned = raw.replace(/[%\s]/g, '');
  const f = Number.parseFloat(cleaned);
  if (!Number.isFinite(f)) return null;
  // ExcelJS reads "45%" as 0.45. Promote sub-1 fractions to whole percent.
  return f > 0 && f < 1 ? f * 100 : f;
}

function parseDate(raw: string): string | null {
  if (!raw) return null;
  // Already ISO?
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return null;
  return formatDate(d);
}

interface HeaderMap {
  /** column key → 1-based excel column number */
  byKey: Map<keyof CopilotUsageRow, number>;
  /** 1-based row number where the canonical header lives. */
  headerRowNumber: number;
  notes: string[];
}

/**
 * Locate the header row. Templates may carry an optional "SYNTHETIC DATA"
 * or other banner row above the header — scan the first few rows for one
 * that contains the required "Team" column label.
 */
function findHeaderRow(ws: ExcelJS.Worksheet): number {
  const target = 'team';
  const lastRowToScan = Math.min(5, ws.actualRowCount || 5);
  for (let r = 1; r <= lastRowToScan; r += 1) {
    const row = ws.getRow(r);
    let found = false;
    row.eachCell({ includeEmpty: false }, (cell) => {
      if (cellString(cell).trim().toLowerCase() === target) found = true;
    });
    if (found) return r;
  }
  return 1;
}

function buildHeaderMap(ws: ExcelJS.Worksheet): HeaderMap {
  const headerRowNumber = findHeaderRow(ws);
  const headerRow = ws.getRow(headerRowNumber);
  const byLabel = new Map<string, number>();
  headerRow.eachCell({ includeEmpty: false }, (cell, col) => {
    const label = cellString(cell);
    if (label) byLabel.set(label.trim().toLowerCase(), col);
  });

  const byKey = new Map<keyof CopilotUsageRow, number>();
  const notes: string[] = [];
  for (const spec of COPILOT_COLUMNS) {
    const found = byLabel.get(spec.label.toLowerCase());
    if (found) {
      byKey.set(spec.key, found);
    } else if (spec.required) {
      throw new Error(`Required column missing from Data sheet: "${spec.label}"`);
    } else {
      notes.push(`Optional column missing: ${spec.label} (will derive when possible)`);
    }
  }

  // Detect header reorder (cosmetic, not an error).
  const actualOrder = Array.from(byLabel.entries())
    .sort((a, b) => a[1] - b[1])
    .map(([label]) => label);
  const canonical = COPILOT_HEADER_ORDER.map((l) => l.toLowerCase());
  const matchesCanonical = canonical.every((l, idx) => actualOrder[idx] === l);
  if (!matchesCanonical) notes.push('Header columns are not in canonical order — proceeding by name match.');

  return { byKey, headerRowNumber, notes };
}

function readCell(
  ws: ExcelJS.Worksheet,
  rowNumber: number,
  col: number | undefined,
): string {
  if (!col) return '';
  return cellString(ws.getRow(rowNumber).getCell(col));
}

/** Parse an exceljs Workbook into Copilot usage rows. Pure — no I/O. */
export function parseCopilotWorkbook(wb: ExcelJS.Workbook): CopilotParseResult {
  const ws = resolveDataSheet(wb);
  const header = buildHeaderMap(ws);

  const rows: CopilotUsageRow[] = [];
  const parseErrors: CopilotParseResult['parseErrors'] = [];
  const notes: string[] = [...header.notes];

  const lastRow = ws.actualRowCount;
  for (let r = header.headerRowNumber + 1; r <= lastRow; r += 1) {
    const teamRaw = readCell(ws, r, header.byKey.get('team'));
    // Skip blank rows entirely — common at the bottom of templates.
    if (!teamRaw) {
      const nonBlank = COPILOT_COLUMNS.some((spec) => {
        const col = header.byKey.get(spec.key);
        return col && readCell(ws, r, col).length > 0;
      });
      if (!nonBlank) continue;
      parseErrors.push({ rowNumber: r, reason: 'Missing required column: Team' });
      continue;
    }

    const periodStart = parseDate(readCell(ws, r, header.byKey.get('period_start')));
    const periodEnd = parseDate(readCell(ws, r, header.byKey.get('period_end')));
    if (!periodStart || !periodEnd) {
      parseErrors.push({ rowNumber: r, reason: 'Period Start / Period End must be valid dates (YYYY-MM-DD).' });
      continue;
    }

    const activeUsers = parseInteger(readCell(ws, r, header.byKey.get('active_users')));
    const totalSuggestions = parseInteger(readCell(ws, r, header.byKey.get('total_suggestions')));
    const acceptedSuggestions = parseInteger(readCell(ws, r, header.byKey.get('accepted_suggestions')));
    const monthlyCost = parseNumber(readCell(ws, r, header.byKey.get('monthly_cost_usd')));
    const seatsAssigned = parseInteger(readCell(ws, r, header.byKey.get('seats_assigned')));
    const seatsUsed = parseInteger(readCell(ws, r, header.byKey.get('seats_used')));

    if (
      activeUsers === null ||
      totalSuggestions === null ||
      acceptedSuggestions === null ||
      monthlyCost === null ||
      seatsAssigned === null ||
      seatsUsed === null
    ) {
      parseErrors.push({ rowNumber: r, reason: 'One or more required numeric cells could not be parsed.' });
      continue;
    }

    let acceptanceRate = parsePercent(readCell(ws, r, header.byKey.get('acceptance_rate_pct')));
    if (acceptanceRate === null && totalSuggestions > 0) {
      acceptanceRate = Math.round((acceptedSuggestions / totalSuggestions) * 1000) / 10;
    }

    rows.push({
      team: teamRaw,
      period_start: periodStart,
      period_end: periodEnd,
      active_users: activeUsers,
      total_suggestions: totalSuggestions,
      accepted_suggestions: acceptedSuggestions,
      acceptance_rate_pct: acceptanceRate,
      monthly_cost_usd: monthlyCost,
      seats_assigned: seatsAssigned,
      seats_used: seatsUsed,
    });
  }

  return { rows, parseErrors, notes };
}

/** Convenience wrapper for tests: build a result from an in-memory rows array. */
export function rowsToResult(rows: CopilotUsageRow[]): CopilotParseResult {
  return { rows, parseErrors: [], notes: [] };
}
