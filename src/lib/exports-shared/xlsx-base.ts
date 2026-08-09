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

/** Add a first-tab workbook guide with audience, purpose, tabs, and rules. */
export function buildGuideSheet(
  workbook: ExcelJS.Workbook,
  guide: {
    title: string;
    audience: "vendor" | "internal";
    purpose: string;
    completionRules: string[];
    tabDescriptions: Array<{ tab: string; purpose: string; audience?: "vendor" | "internal" }>;
    notForVendor?: string[];
  },
): ExcelJS.Worksheet {
  const sheet = workbook.addWorksheet("Guide", {
    views: [{ showGridLines: false }],
  });
  sheet.columns = [{ width: 26 }, { width: 90 }];

  const titleRow = sheet.addRow([guide.title]);
  titleRow.font = { size: 18, bold: true, color: { argb: SOURCE_XLSX.HEADER_FILL } };
  sheet.addRow([]);

  const purpose = sheet.addRow(["Purpose", safeCell(guide.purpose)]);
  purpose.getCell(1).font = { bold: true, color: { argb: SOURCE_XLSX.HEADER_FILL } };
  purpose.getCell(2).alignment = { wrapText: true, vertical: "top" };

  const audience = sheet.addRow([
    "Audience",
    guide.audience === "vendor" ? "Vendor-facing response workbook" : "Internal client review workbook",
  ]);
  audience.getCell(1).font = { bold: true, color: { argb: SOURCE_XLSX.HEADER_FILL } };

  sheet.addRow([]);
  const rulesHeader = sheet.addRow(["Completion Rules"]);
  rulesHeader.font = { bold: true, color: { argb: SOURCE_XLSX.HEADER_FILL } };
  for (const rule of guide.completionRules) {
    const row = sheet.addRow(["", `• ${safeCell(rule)}`]);
    row.getCell(2).alignment = { wrapText: true, vertical: "top" };
  }

  sheet.addRow([]);
  const tabHeader = sheet.addRow(["Tab", "Purpose"]);
  applyHeaderRow(tabHeader);
  for (const tab of guide.tabDescriptions) {
    const audienceLabel = tab.audience
      ? ` (${tab.audience === "vendor" ? "vendor-facing" : "internal-only"})`
      : "";
    const row = sheet.addRow([safeCell(tab.tab), safeCell(`${tab.purpose}${audienceLabel}`)]);
    row.getCell(1).font = { bold: true };
    row.getCell(2).alignment = { wrapText: true, vertical: "top" };
  }

  if (guide.notForVendor?.length) {
    sheet.addRow([]);
    const internalHeader = sheet.addRow(["Not Vendor-Facing"]);
    internalHeader.font = { bold: true, color: { argb: SOURCE_XLSX.HEADER_FILL } };
    for (const item of guide.notForVendor) {
      const row = sheet.addRow(["", `• ${safeCell(item)}`]);
      row.getCell(2).alignment = { wrapText: true, vertical: "top" };
    }
  }

  return sheet;
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
    /**
     * Optional governance/status notice (e.g. "AI-prepared draft...").
     * Generic text in — callers own the copy; this only owns the visual
     * treatment (amber-highlighted row) so every structured workbook shows
     * its draft/final status the same way.
     */
    governanceNotice?: { message: string; detail?: string | null } | null;
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
    ['Company', cover.tenantName],
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

  if (cover.governanceNotice) {
    sheet.addRow([]);
    const noticeText = cover.governanceNotice.detail
      ? `${cover.governanceNotice.message} ${cover.governanceNotice.detail}`
      : cover.governanceNotice.message;
    const r = sheet.addRow(['Status', safeCell(noticeText)]);
    r.eachCell({ includeEmpty: false }, (cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: SOURCE_XLSX.WARNING_FILL },
      };
    });
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
