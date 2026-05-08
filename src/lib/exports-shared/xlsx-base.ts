// Source · xlsx renderer base utilities
//
// Shared style tokens + helpers used by every Source xlsx generator.
// Mirrors the Programs xlsx pattern (lib/programs/exports/renderers/)
// without taking a hard dependency on it — Source has its own brand
// register and column conventions.

import 'server-only';

import ExcelJS from 'exceljs';

// ── Brand tokens ───────────────────────────────────────────────────────────
// Match the AbarVa Source surface palette so the downloaded workbook
// looks consistent with the canvas. ARGB 8-char hex (Excel format).
export const SOURCE_XLSX = {
  HEADER_FILL: 'FF0C1A3A', // ink (deep navy)
  HEADER_TEXT: 'FFFAF7F1', // cream
  BAND_FILL: 'FFF8F7F4', // page bg
  ACCENT_FILL: 'FF2DD4C8', // sentinel teal
  LOCKED_FILL: 'FFE8E5DC', // assumption-set sheet (read-only)
  WARNING_FILL: 'FFFFF4D6', // soft amber
  ERROR_FILL: 'FFFADBDB', // soft red
  MUTED_TEXT: 'FF706D66',
  RULE_LINE: 'FFD8D5CC',
} as const;

/** Excel treats =, +, -, @ as formula prefixes. Coerce to literal. */
export function safeCell(value: string | undefined | null): string {
  if (value == null) return '';
  if (value.length === 0) return value;
  const first = value.charAt(0);
  if (first === '=' || first === '+' || first === '-' || first === '@') {
    return `'${value}`;
  }
  return value;
}

/** Apply the standard Source header row styling (dark fill, light text). */
export function applyHeaderRow(row: ExcelJS.Row): void {
  row.eachCell({ includeEmpty: false }, (cell) => {
    cell.font = { bold: true, color: { argb: SOURCE_XLSX.HEADER_TEXT } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: SOURCE_XLSX.HEADER_FILL },
    };
    cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
    cell.border = {
      top: { style: 'thin', color: { argb: SOURCE_XLSX.HEADER_FILL } },
      bottom: { style: 'thin', color: { argb: SOURCE_XLSX.HEADER_FILL } },
      left: { style: 'thin', color: { argb: SOURCE_XLSX.HEADER_FILL } },
      right: { style: 'thin', color: { argb: SOURCE_XLSX.HEADER_FILL } },
    };
  });
  row.height = 28;
}

/** Apply the locked-row styling (read-only assumption set rows). */
export function applyLockedRow(row: ExcelJS.Row): void {
  row.eachCell({ includeEmpty: false }, (cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: SOURCE_XLSX.LOCKED_FILL },
    };
    cell.protection = { locked: true };
  });
}

/** Add a Cover sheet with event metadata + instructions. */
export function buildCoverSheet(
  workbook: ExcelJS.Workbook,
  cover: {
    title: string;
    eventCode: string;
    eventName: string;
    tenantName: string;
    issuedBy?: string;
    instructions: string[];
    generatedAt: string;
  },
): ExcelJS.Worksheet {
  const sheet = workbook.addWorksheet('Cover', {
    views: [{ showGridLines: false }],
  });
  sheet.columns = [{ width: 22 }, { width: 80 }];

  const titleRow = sheet.addRow([cover.title]);
  titleRow.font = { size: 18, bold: true, color: { argb: SOURCE_XLSX.HEADER_FILL } };
  sheet.addRow([]);

  const labelRows: Array<[string, string]> = [
    ['Tenant', cover.tenantName],
    ['Event', cover.eventName],
    ['Event code', cover.eventCode],
    ['Issued by', cover.issuedBy ?? '—'],
    ['Generated at', cover.generatedAt],
  ];
  for (const [label, value] of labelRows) {
    const r = sheet.addRow([label, safeCell(value)]);
    r.getCell(1).font = { bold: true, color: { argb: SOURCE_XLSX.HEADER_FILL } };
    r.getCell(2).alignment = { wrapText: true, vertical: 'middle' };
  }

  sheet.addRow([]);
  const instrHeader = sheet.addRow(['Instructions']);
  instrHeader.font = { bold: true, color: { argb: SOURCE_XLSX.HEADER_FILL } };
  for (const line of cover.instructions) {
    const r = sheet.addRow(['', `• ${safeCell(line)}`]);
    r.getCell(2).alignment = { wrapText: true, vertical: 'top' };
  }
  return sheet;
}

/** XLSX MIME (Open Office XML spreadsheet). */
export const XLSX_CONTENT_TYPE =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
