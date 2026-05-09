// Source · d11 Response Checklist template
//
// Vendor-facing checklist of every required and optional response item
// from the RFP package (d09). Vendors mark Y/N + cite their evidence
// pointer (filename + page). Procurement uses this to gate response
// completeness (d15).
//
// Structure (5 sheets):
//   1. Cover                  — event metadata, vendor name slot,
//                               submission deadline placeholder
//   2. Mandatory Items        — locked Item / Section / Requirement
//                               columns; vendor fills Confirmed (Y/N) +
//                               Evidence pointer + Note
//   3. Optional / Recommended — same shape, lower priority
//   4. Format Expectations    — locked: file types, naming conventions,
//                               page limits, redactions
//   5. Submission Sign-off    — vendor sign-off block (officer name,
//                               title, certification statements)
//
// The renderer is pure (payload → ExcelJS.Workbook). The payload binder
// extracts mandatory + optional items from the d09 RFP body when
// authored, or falls back to a baseline checklist keyed off the
// archetype.

import 'server-only';

import ExcelJS from 'exceljs';

import {
  SOURCE_XLSX,
  applyHeaderRow,
  applyLockedRow,
  buildCoverSheet,
  safeCell,
} from '@/lib/exports-shared/xlsx-base';

/** One row in either the Mandatory or Optional Items sheet. */
export interface ResponseChecklistItem {
  /** Stable id (e.g. "M-PRICING-01" or "O-SECURITY-03"). */
  id: string;
  /** Section in the RFP this item ties back to (e.g. "Pricing"). */
  section: string;
  /** Plain-language requirement text. */
  requirement: string;
}

/** Format-expectation row (locked). */
export interface FormatExpectation {
  topic: string;
  requirement: string;
}

export interface ResponseChecklistPayload {
  tenantName: string;
  eventCode: string;
  eventName: string;
  issuedBy?: string;
  /** ISO 8601 of generation. */
  generatedAt: string;
  /** Submission deadline ISO; renders as a cover-sheet line. */
  submissionDeadline?: string;
  /** Mandatory items vendors MUST address. */
  mandatoryItems: ReadonlyArray<ResponseChecklistItem>;
  /** Optional / recommended items vendors should consider. */
  optionalItems: ReadonlyArray<ResponseChecklistItem>;
  /** Format expectations (locked). */
  formatExpectations: ReadonlyArray<FormatExpectation>;
  /** Certification statements to surface in the Sign-off sheet. */
  certifications: ReadonlyArray<string>;
}

/** Build the workbook. */
export function buildResponseChecklistWorkbook(
  payload: ResponseChecklistPayload,
): ExcelJS.Workbook {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'AbarVa · Sentinel';
  workbook.created = new Date(payload.generatedAt);
  workbook.title = `Response Checklist · ${payload.eventCode}`;

  buildCoverSheet(workbook, {
    title: `Response Checklist · ${payload.eventName}`,
    eventCode: payload.eventCode,
    eventName: payload.eventName,
    tenantName: payload.tenantName,
    issuedBy: payload.issuedBy,
    generatedAt: payload.generatedAt,
    instructions: [
      'Vendor of record: fill the Vendor name slot below before completing the checklist.',
      'Sheet 2 (Mandatory Items) — every row is required. Confirmed = Y, with an Evidence pointer (filename + page) for each.',
      'Sheet 3 (Optional Items) — recommended; affirmative answers strengthen scoring (d16) but do not gate response completeness (d15).',
      'Sheet 4 (Format Expectations) is locked. Submissions outside these conventions may be rejected.',
      'Sheet 5 (Sign-off) — an authorized officer must complete the certification statements before submission.',
    ],
  });
  // Vendor name slot + submission deadline.
  const cover = workbook.getWorksheet('Cover');
  if (cover) {
    cover.addRow([]);
    const r = cover.addRow(['Vendor name', '']);
    r.getCell(1).font = { bold: true, color: { argb: SOURCE_XLSX.HEADER_FILL } };
    r.getCell(2).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: SOURCE_XLSX.WARNING_FILL },
    };

    if (payload.submissionDeadline) {
      const d = cover.addRow(['Submission deadline', safeCell(payload.submissionDeadline)]);
      d.getCell(1).font = { bold: true, color: { argb: SOURCE_XLSX.HEADER_FILL } };
    }
  }

  buildItemsSheet(workbook, 'Mandatory Items', payload.mandatoryItems, true);
  buildItemsSheet(workbook, 'Optional Items', payload.optionalItems, false);
  buildFormatExpectationsSheet(workbook, payload.formatExpectations);
  buildSignoffSheet(workbook, payload.certifications);

  return workbook;
}

function buildItemsSheet(
  workbook: ExcelJS.Workbook,
  sheetName: string,
  rows: ReadonlyArray<ResponseChecklistItem>,
  mandatory: boolean,
): ExcelJS.Worksheet {
  const sheet = workbook.addWorksheet(sheetName, {
    views: [{ showGridLines: true, state: 'frozen', ySplit: 1 }],
  });
  sheet.columns = [
    { header: 'Item ID', key: 'id', width: 18 },
    { header: 'Section', key: 'section', width: 22 },
    { header: 'Requirement', key: 'requirement', width: 60 },
    { header: 'Confirmed (Y/N)', key: 'confirmed', width: 16 },
    { header: 'Evidence pointer (filename + page)', key: 'evidence', width: 40 },
    { header: 'Vendor note', key: 'note', width: 40 },
  ];
  applyHeaderRow(sheet.getRow(1));

  let rowNum = 2;
  for (const item of rows) {
    const r = sheet.addRow({
      id: safeCell(item.id),
      section: safeCell(item.section),
      requirement: safeCell(item.requirement),
      confirmed: '',
      evidence: '',
      note: '',
    });
    // Lock the first three columns (the buyer's contract).
    r.getCell('id').protection = { locked: true };
    r.getCell('section').protection = { locked: true };
    r.getCell('requirement').protection = { locked: true };
    r.getCell('id').fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: SOURCE_XLSX.LOCKED_FILL },
    };
    r.getCell('section').fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: SOURCE_XLSX.LOCKED_FILL },
    };
    r.getCell('requirement').fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: SOURCE_XLSX.LOCKED_FILL },
    };
    r.getCell('requirement').alignment = { wrapText: true, vertical: 'top' };
    // Vendor-editable cells highlighted.
    r.getCell('confirmed').fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: SOURCE_XLSX.WARNING_FILL },
    };
    r.getCell('evidence').fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: SOURCE_XLSX.WARNING_FILL },
    };
    r.getCell('note').fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: SOURCE_XLSX.WARNING_FILL },
    };
    // Data-validation: Confirmed ∈ {Y,N} (mandatory) or {Y,N,N/A} (optional).
    sheet.getCell(`D${rowNum}`).dataValidation = {
      type: 'list',
      allowBlank: !mandatory,
      formulae: [mandatory ? '"Y,N"' : '"Y,N,N/A"'],
      showErrorMessage: true,
      errorStyle: mandatory ? 'stop' : 'warning',
      errorTitle: 'Confirmed value',
      error: mandatory
        ? 'Mandatory items require Y or N.'
        : 'Use Y, N, or N/A for optional items.',
    };
    rowNum += 1;
  }

  return sheet;
}

function buildFormatExpectationsSheet(
  workbook: ExcelJS.Workbook,
  rows: ReadonlyArray<FormatExpectation>,
): ExcelJS.Worksheet {
  const sheet = workbook.addWorksheet('Format Expectations', {
    views: [{ showGridLines: false, state: 'frozen', ySplit: 1 }],
  });
  sheet.columns = [
    { header: 'Topic', key: 'topic', width: 32 },
    { header: 'Requirement', key: 'requirement', width: 80 },
  ];
  applyHeaderRow(sheet.getRow(1));

  for (const row of rows) {
    const r = sheet.addRow({
      topic: safeCell(row.topic),
      requirement: safeCell(row.requirement),
    });
    applyLockedRow(r);
    r.getCell('requirement').alignment = { wrapText: true, vertical: 'top' };
    r.height = 32;
  }
  return sheet;
}

function buildSignoffSheet(
  workbook: ExcelJS.Workbook,
  certifications: ReadonlyArray<string>,
): ExcelJS.Worksheet {
  const sheet = workbook.addWorksheet('Submission Sign-off', {
    views: [{ showGridLines: false }],
    properties: { defaultColWidth: 28 },
  });
  sheet.columns = [
    { header: 'Field', key: 'field', width: 36 },
    { header: 'Vendor input', key: 'value', width: 60 },
  ];
  applyHeaderRow(sheet.getRow(1));

  const fields: Array<[string, string]> = [
    ['Vendor legal name', ''],
    ['Authorized signing officer (name + title)', ''],
    ['Officer email', ''],
    ['Officer phone', ''],
    ['Submission date', ''],
  ];
  for (const [field, val] of fields) {
    const r = sheet.addRow([safeCell(field), safeCell(val)]);
    r.getCell(1).font = { bold: true };
    r.getCell(2).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: SOURCE_XLSX.WARNING_FILL },
    };
  }

  sheet.addRow([]);
  const certHeader = sheet.addRow(['Certification statements', '']);
  certHeader.getCell(1).font = {
    bold: true,
    color: { argb: SOURCE_XLSX.HEADER_FILL },
  };

  for (const cert of certifications) {
    const r = sheet.addRow([safeCell(cert), '']);
    r.getCell(1).alignment = { wrapText: true, vertical: 'top' };
    r.getCell(2).dataValidation = {
      type: 'list',
      allowBlank: false,
      formulae: ['"Confirmed,Declined"'],
      showErrorMessage: true,
      errorStyle: 'stop',
      errorTitle: 'Certification',
      error: 'Each certification must be Confirmed or Declined.',
    };
    r.getCell(2).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: SOURCE_XLSX.WARNING_FILL },
    };
    r.height = 32;
  }
  return sheet;
}
