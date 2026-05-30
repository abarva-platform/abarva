// Parser for the GitHub → DORA Tower workbook.
//
// Reads the `Data` sheet, normalizes per-column cell values to a stable
// shape, and returns one raw row per data row plus any structural
// errors. No domain validation happens here — that's the validator's
// job. This module is pure and deterministic so it can be unit-tested
// against the committed template/sample fixtures.

import ExcelJS from 'exceljs';

import {
  GITHUB_DORA_COLUMNS,
  type GithubDoraColumn,
  type GithubDoraRawRow,
  type GithubDoraRowError,
} from './schema';

const DATA_SHEET_NAME = 'Data';

/**
 * Cells we treat as "this row was left blank". A row that's blank in
 * every required column is silently skipped — workbook authors leave
 * trailing blanks all the time.
 */
function isBlank(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string' && value.trim().length === 0) return true;
  return false;
}

/**
 * Coerce an exceljs cell value to a plain string. ExcelJS returns rich
 * objects for hyperlinks / formulas / errors — we collapse all of them
 * down to a string so the validator can reason about a single shape.
 */
function coerceString(value: unknown): string | undefined {
  if (value === null || value === undefined) return undefined;
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number') return String(value);
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (value instanceof Date) {
    // ISO date in UTC, no time component.
    const yyyy = value.getUTCFullYear().toString().padStart(4, '0');
    const mm = (value.getUTCMonth() + 1).toString().padStart(2, '0');
    const dd = value.getUTCDate().toString().padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
  if (typeof value === 'object') {
    const obj = value as { text?: unknown; result?: unknown; richText?: unknown };
    if (typeof obj.text === 'string') return obj.text.trim();
    if (typeof obj.result === 'string') return obj.result.trim();
    if (typeof obj.result === 'number') return String(obj.result);
    if (Array.isArray(obj.richText)) {
      return obj.richText
        .map((r: { text?: unknown }) =>
          typeof r?.text === 'string' ? r.text : '',
        )
        .join('')
        .trim();
    }
  }
  return undefined;
}

function coerceNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const s = coerceString(value);
  if (s === undefined) return undefined;
  if (s.length === 0) return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}

function coerceDate(value: unknown): string | undefined {
  // Cell may already be a Date (when typed as date) or a YYYY-MM-DD
  // string (when typed as text). Both collapse to ISO date.
  if (value instanceof Date) {
    return coerceString(value);
  }
  const s = coerceString(value);
  if (s === undefined) return undefined;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  // ExcelJS sometimes hands back ISO datetime strings. Strip the time.
  const parsed = new Date(s);
  if (Number.isNaN(parsed.getTime())) return s; // let validator complain
  const yyyy = parsed.getUTCFullYear().toString().padStart(4, '0');
  const mm = (parsed.getUTCMonth() + 1).toString().padStart(2, '0');
  const dd = parsed.getUTCDate().toString().padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export interface GithubDoraParseResult {
  readonly rows: readonly GithubDoraRawRow[];
  readonly errors: readonly GithubDoraRowError[];
}

/**
 * Parse the committed GitHub → DORA workbook. Pure: no I/O beyond the
 * passed-in buffer.
 *
 * Behaviour:
 *   - Reads sheet `Data` only.
 *   - Header row (row 1) is matched case-insensitively against the
 *     canonical schema. Unknown / missing headers surface as structural
 *     errors.
 *   - Wholly-blank data rows are skipped silently.
 *   - Each non-blank data row is emitted as a `GithubDoraRawRow` with
 *     dates collapsed to `YYYY-MM-DD` strings and numbers coerced.
 */
export async function parseGithubDoraWorkbook(
  buffer: ArrayBuffer | Buffer | Uint8Array,
): Promise<GithubDoraParseResult> {
  const workbook = new ExcelJS.Workbook();
  // exceljs accepts Buffer; coerce both ArrayBuffer and Uint8Array.
  // The `as unknown as Buffer` cast bridges the
  // `Buffer<ArrayBufferLike>` vs `Buffer` mismatch under @types/node 22.
  const bufferInput =
    buffer instanceof ArrayBuffer
      ? Buffer.from(buffer)
      : buffer instanceof Uint8Array
        ? Buffer.from(buffer.buffer, buffer.byteOffset, buffer.byteLength)
        : buffer;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (workbook.xlsx as any).load(bufferInput);

  const sheet = workbook.getWorksheet(DATA_SHEET_NAME);
  if (!sheet) {
    return {
      rows: [],
      errors: [
        {
          rowNumber: 0,
          column: '__row__',
          message: `workbook is missing required sheet "${DATA_SHEET_NAME}"`,
        },
      ],
    };
  }

  const errors: GithubDoraRowError[] = [];

  // Build a header → column-index map from row 1.
  const headerRow = sheet.getRow(1);
  const headerIndex = new Map<GithubDoraColumn, number>();
  for (let col = 1; col <= headerRow.cellCount; col += 1) {
    const raw = coerceString(headerRow.getCell(col).value);
    if (!raw) continue;
    const normalized = raw.toLowerCase();
    const match = GITHUB_DORA_COLUMNS.find(
      (c) => c.toLowerCase() === normalized,
    );
    if (match && !headerIndex.has(match)) {
      headerIndex.set(match, col);
    }
  }

  const missingHeaders = GITHUB_DORA_COLUMNS.filter(
    (c) => !headerIndex.has(c),
  );
  for (const missing of missingHeaders) {
    errors.push({
      rowNumber: 1,
      column: missing,
      message: `header "${missing}" is missing from sheet "${DATA_SHEET_NAME}"`,
    });
  }

  if (missingHeaders.length > 0) {
    return { rows: [], errors };
  }

  const rows: GithubDoraRawRow[] = [];

  // Detect a synthetic-data banner row immediately under the header.
  // We use the schema banner copy verbatim so authors can't accidentally
  // shadow it with a real row that happens to start with "SYNTHETIC".
  const bannerRowNumber = detectBannerRow(sheet, headerIndex);

  const lastRow = sheet.actualRowCount;
  for (let r = 2; r <= lastRow; r += 1) {
    if (r === bannerRowNumber) continue;
    const row = sheet.getRow(r);
    const rawValues: Record<GithubDoraColumn, unknown> = {} as Record<
      GithubDoraColumn,
      unknown
    >;
    for (const col of GITHUB_DORA_COLUMNS) {
      const idx = headerIndex.get(col)!;
      rawValues[col] = row.getCell(idx).value;
    }

    // Blank row: every value blank → skip.
    const everyBlank = GITHUB_DORA_COLUMNS.every((c) => isBlank(rawValues[c]));
    if (everyBlank) continue;

    rows.push({
      rowNumber: r,
      repo: coerceString(rawValues.repo),
      team: coerceString(rawValues.team),
      period_start: coerceDate(rawValues.period_start),
      period_end: coerceDate(rawValues.period_end),
      deployment_frequency_per_day: coerceNumber(
        rawValues.deployment_frequency_per_day,
      ),
      lead_time_for_changes_hours: coerceNumber(
        rawValues.lead_time_for_changes_hours,
      ),
      change_failure_rate_pct: coerceNumber(rawValues.change_failure_rate_pct),
      mttr_hours: coerceNumber(rawValues.mttr_hours),
      sample_size_deploys: coerceNumber(rawValues.sample_size_deploys),
    });
  }

  return { rows, errors };
}

/**
 * The sample-filled workbook places a "SYNTHETIC DATA — for demo only"
 * banner in the row immediately under the headers (row 2) so a CIO
 * opening the file can never mistake it for a real extract. We skip
 * that row during parse so it doesn't surface as a malformed row.
 */
function detectBannerRow(
  sheet: ExcelJS.Worksheet,
  headerIndex: Map<GithubDoraColumn, number>,
): number | null {
  const candidate = sheet.getRow(2);
  const repoIdx = headerIndex.get('repo');
  if (repoIdx === undefined) return null;
  const cell = coerceString(candidate.getCell(repoIdx).value);
  if (!cell) return null;
  return cell.toUpperCase().startsWith('SYNTHETIC DATA') ? 2 : null;
}
