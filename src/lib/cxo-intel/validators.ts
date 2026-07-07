import type { CxoIntelFileSchema } from "./schemas";

export type CxoIntelValidationTone = "green" | "amber" | "red";

export interface CxoIntelParsedCsv {
  headers: string[];
  rows: Array<Record<string, string>>;
}

export interface CxoIntelFileValidation {
  fileName: string;
  tone: CxoIntelValidationTone;
  rowCount: number;
  greenRows: number;
  amberRows: number;
  redRows: number;
  missingRequiredColumns: string[];
  extraColumns: string[];
  issues: string[];
}

function normalizeHeader(value: string): string {
  return value.trim().replace(/^\uFEFF/, "").toLowerCase();
}

function splitCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];
    if (char === '"' && next === '"') {
      current += '"';
      i += 1;
      continue;
    }
    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (char === "," && !inQuotes) {
      cells.push(current.trim());
      current = "";
      continue;
    }
    current += char;
  }
  cells.push(current.trim());
  return cells;
}

export function parseCxoIntelCsv(text: string): CxoIntelParsedCsv {
  const lines = text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .filter((line) => line.trim().length > 0);
  if (lines.length === 0) return { headers: [], rows: [] };

  const headers = splitCsvLine(lines[0]!).map(normalizeHeader);
  const rows = lines.slice(1).map((line) => {
    const cells = splitCsvLine(line);
    return headers.reduce<Record<string, string>>((acc, header, index) => {
      acc[header] = cells[index]?.trim() ?? "";
      return acc;
    }, {});
  });

  return { headers, rows };
}

function looksLikeDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) || /^\d{6}$/.test(value);
}

function looksLikeNumber(value: string): boolean {
  if (!value) return false;
  return /^-?\d+(\.\d+)?$/.test(value.replace(/[$,%\s]/g, ""));
}

function issueForCell(column: string, value: string): string | null {
  if (!value.trim()) return null;
  if (/(date|start|end|period|renewal)/.test(column) && !looksLikeDate(value)) {
    return `${column} should use YYYY-MM-DD or YYYYMM`;
  }
  if (/(usd|cost|fees|premium|limit|retention|count|pct|share|fte|days|year)/.test(column) && !looksLikeNumber(value)) {
    return `${column} should be numeric`;
  }
  if (/email/.test(column) && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)) {
    return `${column} should look like an email`;
  }
  return null;
}

export function validateCxoIntelCsv(
  schema: CxoIntelFileSchema,
  parsed: CxoIntelParsedCsv,
): CxoIntelFileValidation {
  const headerSet = new Set(parsed.headers);
  const allowedColumns = new Set([...schema.requiredColumns, ...schema.optionalColumns]);
  const missingRequiredColumns = schema.requiredColumns.filter((column) => !headerSet.has(column));
  const extraColumns = parsed.headers.filter((header) => !allowedColumns.has(header));
  const issues: string[] = [];

  if (parsed.headers.length === 0) issues.push("File is empty or missing a header row.");
  for (const column of missingRequiredColumns) {
    issues.push(`Missing required column: ${column}`);
  }

  let amberRows = 0;
  let redRows = 0;
  for (const [rowIndex, row] of parsed.rows.entries()) {
    const missingInRow = schema.requiredColumns.filter((column) => !row[column]?.trim());
    if (missingInRow.length > 0) {
      redRows += 1;
      issues.push(`Row ${rowIndex + 2}: missing ${missingInRow.join(", ")}`);
      continue;
    }

    const rowIssues = schema.requiredColumns
      .map((column) => issueForCell(column, row[column] ?? ""))
      .filter((issue): issue is string => Boolean(issue));
    if (rowIssues.length > 0) {
      amberRows += 1;
      issues.push(`Row ${rowIndex + 2}: ${rowIssues.slice(0, 2).join("; ")}`);
    }
  }

  if (extraColumns.length > 0) {
    issues.push(`Extra columns will be preserved in row_payload: ${extraColumns.join(", ")}`);
  }

  const rowCount = parsed.rows.length;
  const redFromHeaders = missingRequiredColumns.length > 0 ? rowCount || 1 : 0;
  const totalRedRows = Math.max(redRows, redFromHeaders);
  const greenRows = Math.max(0, rowCount - amberRows - totalRedRows);
  const tone: CxoIntelValidationTone =
    missingRequiredColumns.length > 0 || totalRedRows > 0
      ? "red"
      : amberRows > 0 || extraColumns.length > 0
        ? "amber"
        : "green";

  return {
    fileName: schema.fileName,
    tone,
    rowCount,
    greenRows,
    amberRows,
    redRows: totalRedRows,
    missingRequiredColumns,
    extraColumns,
    issues: issues.slice(0, 8),
  };
}
