// ─────────────────────────────────────────────────────────────────────────────
// Deterministic file → rows parser — the byte-parsing half of structured-map
// intake. Turns an uploaded CSV / XLSX into the SAME `{ headers, rows }` shape the
// structured-map (`mapTemplateUploadToFacts`) already consumes. NO LLM: CSV via
// papaparse (`header: true`), XLSX via exceljs (first worksheet, first row =
// headers). This is the ONLY new step between "a file landed" and the existing,
// tested map+validate+write path — so a file becomes typed facts with no inference.
//
// Cell coercion is intentionally conservative and mirrors the map's own tolerance:
// a numeric-LOOKING cell (optionally `$`, thousands separators, a trailing `%`, a
// parenthesised negative) becomes a `number`; an empty cell becomes `null`;
// anything else stays a `string`. The map re-coerces numeric-unit columns itself
// (`coerceNumericCell`) and rejects a present-but-uncoercible cell loudly, so this
// parser never has to guess a unit — it only produces faithful cell primitives.
// ─────────────────────────────────────────────────────────────────────────────

import Papa from "papaparse";
import ExcelJS from "exceljs";
import type { ParsedTemplateRow, ParsedTemplateUpload } from "./structured-map";

/** The file kinds this parser accepts. */
export type ParsableFileKind = "csv" | "xlsx";

/** A cleanly-parsed cell primitive: number for numeric-looking, string, or null. */
export type ParsedCell = string | number | null;

/**
 * Resolve the file kind from a mime type and/or filename extension. Returns the
 * kind or `null` when the input is not a supported CSV / XLSX file. Both signals
 * are consulted because browser mime types are unreliable (a `.csv` may arrive as
 * `application/vnd.ms-excel`, an `.xlsx` as `application/octet-stream`).
 */
export function resolveParsableFileKind(args: {
  filename?: string | null;
  mimeType?: string | null;
}): ParsableFileKind | null {
  const name = (args.filename ?? "").toLowerCase().trim();
  const mime = (args.mimeType ?? "").toLowerCase().trim();

  const isXlsxExt = name.endsWith(".xlsx");
  const isCsvExt = name.endsWith(".csv");

  const XLSX_MIME =
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  const CSV_MIMES = new Set(["text/csv", "application/csv"]);
  // `application/vnd.ms-excel` is ambiguous (legacy .xls AND browser-labelled
  // .csv), so the extension wins for it.

  if (isXlsxExt || mime === XLSX_MIME) return "xlsx";
  if (isCsvExt || CSV_MIMES.has(mime)) return "csv";
  return null;
}

/**
 * Coerce a raw cell string to a parsed primitive. Empty / whitespace → null; a
 * numeric-looking token (tolerating `$`, thousands separators, a trailing `%`, a
 * parenthesised negative, surrounding whitespace) → number; everything else → the
 * trimmed string. Deliberately conservative: never invents a value, so the
 * downstream map's per-column unit validation stays the single source of truth.
 */
export function coerceParsedCell(raw: unknown): ParsedCell {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === "number") return Number.isFinite(raw) ? raw : null;
  if (typeof raw === "boolean") return String(raw);

  const trimmed = String(raw).trim();
  if (trimmed.length === 0) return null;

  const negative = /^\((.*)\)$/.test(trimmed);
  const inner = negative ? trimmed.replace(/^\((.*)\)$/, "$1") : trimmed;
  const cleaned = inner.replace(/[$,\s]/g, "").replace(/%$/, "");
  if (cleaned.length > 0 && /^[+-]?\d*\.?\d+$/.test(cleaned)) {
    const parsed = Number(cleaned);
    if (Number.isFinite(parsed)) return negative ? -Math.abs(parsed) : parsed;
  }
  return trimmed;
}

/** De-duplicate + trim a header list, dropping fully empty header cells. */
function normalizeHeaders(raw: readonly unknown[]): string[] {
  const headers: string[] = [];
  for (const h of raw) {
    const label = h === null || h === undefined ? "" : String(h).trim();
    if (label.length === 0) continue;
    headers.push(label);
  }
  return headers;
}

/** Build one row object from a header list + an aligned cell list. */
function rowFromCells(
  headers: readonly string[],
  cells: readonly unknown[],
): ParsedTemplateRow {
  const row: Record<string, ParsedCell> = {};
  headers.forEach((header, i) => {
    row[header] = coerceParsedCell(cells[i]);
  });
  return row;
}

/** True when a row object is entirely empty (every cell null) — a blank line. */
function isEmptyRow(row: ParsedTemplateRow): boolean {
  return Object.values(row).every((v) => v === null || v === undefined);
}

/** Parse CSV bytes into headers + rows (deterministic, header-mode). */
function parseCsv(text: string): ParsedTemplateUpload {
  const result = Papa.parse<string[]>(text, {
    header: false,
    skipEmptyLines: "greedy",
  });
  const rows = (result.data ?? []).filter(
    (r): r is string[] => Array.isArray(r),
  );
  if (rows.length === 0) {
    throw new Error("CSV file has no rows");
  }
  const headers = normalizeHeaders(rows[0]);
  if (headers.length === 0) {
    throw new Error("CSV file has no header row");
  }
  const dataRows: ParsedTemplateRow[] = [];
  for (const cells of rows.slice(1)) {
    const row = rowFromCells(headers, cells);
    if (!isEmptyRow(row)) dataRows.push(row);
  }
  return { headers, rows: dataRows };
}

/** Parse XLSX bytes into headers + rows from the FIRST worksheet. */
async function parseXlsx(bytes: Buffer): Promise<ParsedTemplateUpload> {
  const workbook = new ExcelJS.Workbook();
  try {
    const workbookBytes = bytes as unknown as Parameters<
      typeof workbook.xlsx.load
    >[0];
    await workbook.xlsx.load(workbookBytes);
  } catch (err) {
    throw new Error(
      `XLSX file could not be read. Save as a standard .xlsx workbook with a visible first worksheet and a header row. ${
        err instanceof Error ? err.message : String(err)
      }`,
    );
  }
  const sheet = workbook.worksheets[0];
  if (!sheet) {
    throw new Error("XLSX file has no worksheet");
  }

  const rowValues: unknown[][] = [];
  sheet.eachRow({ includeEmpty: false }, (row) => {
    // row.values is 1-indexed (index 0 is unused); slice it to 0-based cells.
    const values = Array.isArray(row.values) ? row.values.slice(1) : [];
    rowValues.push(values.map(cellPrimitive));
  });

  if (rowValues.length === 0) {
    throw new Error("XLSX worksheet has no rows");
  }
  const headers = normalizeHeaders(rowValues[0]);
  if (headers.length === 0) {
    throw new Error("XLSX worksheet has no header row");
  }
  const dataRows: ParsedTemplateRow[] = [];
  for (const cells of rowValues.slice(1)) {
    const row = rowFromCells(headers, cells);
    if (!isEmptyRow(row)) dataRows.push(row);
  }
  return { headers, rows: dataRows };
}

/**
 * Reduce an exceljs cell value to a primitive we can coerce. exceljs returns rich
 * objects for formulas / hyperlinks / rich text; take their computed result /
 * text so the downstream coercion sees a plain value, never `[object Object]`.
 */
function cellPrimitive(value: unknown): unknown {
  if (value === null || value === undefined) return null;
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }
  if (value instanceof Date) return value.toISOString();
  const obj = value as Record<string, unknown>;
  // Formula cell → { formula, result }.
  if ("result" in obj) return cellPrimitive(obj.result);
  // Rich text cell → { richText: [{ text }] }.
  if (Array.isArray(obj.richText)) {
    return obj.richText.map((r) => String((r as { text?: unknown }).text ?? "")).join("");
  }
  // Hyperlink cell → { text, hyperlink }.
  if ("text" in obj) return cellPrimitive(obj.text);
  return null;
}

/**
 * Parse an uploaded file's bytes into the `{ headers, rows }` upload the
 * structured-map consumes. Deterministic, no LLM. Throws a clear Error for an
 * unsupported type or an unparseable file — the caller surfaces it as a 4xx and
 * NOTHING is persisted (a malformed file can never seed a fact).
 */
export async function parseFileToRows(args: {
  bytes: Buffer;
  filename?: string | null;
  mimeType?: string | null;
}): Promise<ParsedTemplateUpload> {
  const kind = resolveParsableFileKind({
    filename: args.filename,
    mimeType: args.mimeType,
  });
  if (!kind) {
    throw new Error(
      `Unsupported file type: only .csv and .xlsx are accepted (got filename='${
        args.filename ?? ""
      }', mime='${args.mimeType ?? ""}')`,
    );
  }
  if (args.bytes.length === 0) {
    throw new Error("File is empty");
  }
  if (kind === "csv") {
    return parseCsv(args.bytes.toString("utf8"));
  }
  return parseXlsx(args.bytes);
}
