// Tower · Claude Code developer usage ingest — parser.
//
// Accepts either .xlsx (via exceljs) or .csv (via papaparse).
// XLSX: reads the first sheet whose name starts with "Data" (case-insensitive),
// falling back to the first worksheet. Header row is the first non-empty row.
// CSV: standard header parser, comma-delimited, UTF-8.

import ExcelJS from 'exceljs';
import Papa from 'papaparse';
import {
  CLAUDE_CODE_COLUMN_ORDER,
  CLAUDE_CODE_NUMERIC_COLUMNS,
  CLAUDE_CODE_REQUIRED_COLUMNS,
  type ClaudeCodeColumn,
  type ClaudeCodeUsageRow,
  type ParseResult,
} from './types';

const NUMERIC_SET = new Set<string>(CLAUDE_CODE_NUMERIC_COLUMNS);
const REQUIRED_SET = new Set<string>(CLAUDE_CODE_REQUIRED_COLUMNS);

// Map header strings → canonical column keys. Accept a variety of common
// variants so a hand-curated console export still maps cleanly.
function normalizeHeader(raw: unknown): ClaudeCodeColumn | null {
  if (raw == null) return null;
  const h = String(raw).trim().toLowerCase().replace(/[\s\-]+/g, '_');
  const aliases: Record<string, ClaudeCodeColumn> = {
    team: 'team',
    team_name: 'team',
    developer: 'developer_id',
    developer_id: 'developer_id',
    user: 'developer_id',
    user_id: 'developer_id',
    period_start: 'period_start',
    start: 'period_start',
    month_start: 'period_start',
    period_end: 'period_end',
    end: 'period_end',
    month_end: 'period_end',
    sessions: 'sessions',
    session_count: 'sessions',
    prompt_tokens: 'prompt_tokens',
    input_tokens: 'prompt_tokens',
    output_tokens: 'output_tokens',
    completion_tokens: 'output_tokens',
    monthly_cost_usd: 'monthly_cost_usd',
    cost_usd: 'monthly_cost_usd',
    cost: 'monthly_cost_usd',
    primary_use_case: 'primary_use_case',
    use_case: 'primary_use_case',
  };
  return aliases[h] ?? null;
}

function toIsoDate(value: unknown): string | null {
  if (value == null || value === '') return null;
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return value.toISOString().slice(0, 10);
  }
  const s = String(value).trim();
  // Already an ISO date.
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  // Excel may surface dates as serial numbers when read as raw values; exceljs
  // already converts to Date in most paths so this is a defensive parse.
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

function toNumber(value: unknown): number | null {
  if (value == null || value === '') return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  const cleaned = String(value).replace(/[$,\s]/g, '');
  if (cleaned === '') return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function toStr(value: unknown): string | null {
  if (value == null) return null;
  const s = String(value).trim();
  return s === '' ? null : s;
}

function buildRow(record: Record<ClaudeCodeColumn, unknown>, warnings: string[], rowIndex: number): ClaudeCodeUsageRow | null {
  const team = toStr(record.team);
  const developer_id = toStr(record.developer_id);
  const period_start = toIsoDate(record.period_start);
  const period_end = toIsoDate(record.period_end);
  if (!team || !developer_id || !period_start || !period_end) {
    warnings.push(`row ${rowIndex}: missing required field (team/developer_id/period_start/period_end)`);
    return null;
  }
  return {
    team,
    developer_id,
    period_start,
    period_end,
    sessions: toNumber(record.sessions),
    prompt_tokens: toNumber(record.prompt_tokens),
    output_tokens: toNumber(record.output_tokens),
    monthly_cost_usd: toNumber(record.monthly_cost_usd),
    primary_use_case: toStr(record.primary_use_case),
  };
}

export async function parseClaudeCodeXlsx(buffer: Buffer | ArrayBuffer | Uint8Array): Promise<ParseResult> {
  const wb = new ExcelJS.Workbook();
  // exceljs' .load expects Buffer | ArrayBuffer; normalise to ArrayBuffer.
  let data: ArrayBuffer;
  if (buffer instanceof ArrayBuffer) {
    data = buffer;
  } else {
    // Buffer / Uint8Array share the same byte layout; copy into a fresh
    // ArrayBuffer so we don't leak the underlying Node Buffer pool.
    const view = buffer as Uint8Array;
    const copy = new ArrayBuffer(view.byteLength);
    new Uint8Array(copy).set(view);
    data = copy;
  }
  await wb.xlsx.load(data);

  const dataSheet =
    wb.worksheets.find((ws) => /^data/i.test(ws.name)) ?? wb.worksheets[0];

  if (!dataSheet) {
    return { rows: [], warnings: ['workbook has no worksheets'] };
  }

  const warnings: string[] = [];
  // Locate the header row: first row whose first cell maps to a known column.
  let headerRowIdx = 1;
  let columnMap = new Map<number, ClaudeCodeColumn>();
  for (let i = 1; i <= Math.min(10, dataSheet.rowCount); i += 1) {
    const row = dataSheet.getRow(i);
    const trial = new Map<number, ClaudeCodeColumn>();
    row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      const key = normalizeHeader(cell.value);
      if (key) trial.set(colNumber, key);
    });
    if (trial.size >= CLAUDE_CODE_REQUIRED_COLUMNS.length) {
      headerRowIdx = i;
      columnMap = trial;
      break;
    }
  }

  if (columnMap.size === 0) {
    return {
      rows: [],
      warnings: ['could not locate header row with required columns'],
    };
  }

  // Verify required headers all present.
  const presentKeys = new Set(columnMap.values());
  const missing = CLAUDE_CODE_REQUIRED_COLUMNS.filter((c) => !presentKeys.has(c));
  if (missing.length) {
    return {
      rows: [],
      warnings: [`missing required column(s): ${missing.join(', ')}`],
    };
  }

  const rows: ClaudeCodeUsageRow[] = [];
  let inputRowIndex = 0;
  for (let i = headerRowIdx + 1; i <= dataSheet.rowCount; i += 1) {
    const xlRow = dataSheet.getRow(i);
    if (!xlRow.hasValues) continue;
    inputRowIndex += 1;
    const record: Partial<Record<ClaudeCodeColumn, unknown>> = {};
    columnMap.forEach((key, colNumber) => {
      const cell = xlRow.getCell(colNumber);
      // Prefer the rendered/typed value; exceljs surfaces dates as Date,
      // numerics as number, etc.
      record[key] = cell.value;
    });
    const built = buildRow(record as Record<ClaudeCodeColumn, unknown>, warnings, inputRowIndex);
    if (built) rows.push(built);
  }

  return { rows, warnings };
}

export function parseClaudeCodeCsv(csvText: string): ParseResult {
  const warnings: string[] = [];
  const parsed = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
  });
  if (parsed.errors.length > 0) {
    warnings.push(
      `csv errors: ${parsed.errors
        .slice(0, 3)
        .map((e) => e.message)
        .join('; ')}`,
    );
  }
  const headerSourceRow = parsed.data[0] ?? {};
  const headerKeys = Object.keys(headerSourceRow);
  const headerMap = new Map<string, ClaudeCodeColumn>();
  for (const h of headerKeys) {
    const key = normalizeHeader(h);
    if (key) headerMap.set(h, key);
  }
  const presentKeys = new Set(headerMap.values());
  const missing = CLAUDE_CODE_REQUIRED_COLUMNS.filter((c) => !presentKeys.has(c));
  if (missing.length) {
    return {
      rows: [],
      warnings: [`missing required column(s): ${missing.join(', ')}`],
    };
  }
  const rows: ClaudeCodeUsageRow[] = [];
  parsed.data.forEach((rawRow, idx) => {
    const record: Partial<Record<ClaudeCodeColumn, unknown>> = {};
    for (const [srcKey, val] of Object.entries(rawRow)) {
      const k = headerMap.get(srcKey);
      if (k) record[k] = val;
    }
    const built = buildRow(record as Record<ClaudeCodeColumn, unknown>, warnings, idx + 1);
    if (built) rows.push(built);
  });
  return { rows, warnings };
}

/** Re-export the canonical column order for downstream tooling. */
export { CLAUDE_CODE_COLUMN_ORDER, NUMERIC_SET as CLAUDE_CODE_NUMERIC_KEYS, REQUIRED_SET as CLAUDE_CODE_REQUIRED_KEYS };
