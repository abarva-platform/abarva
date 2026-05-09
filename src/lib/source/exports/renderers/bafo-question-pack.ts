// Source · d22 BAFO Question Pack xlsx
//
// Per-vendor questions targeting open traps + value-uplift opportunities,
// distributed at the start of each BAFO round. Vendors fill the response
// columns; buyer scores each response and references back to d20 (trap
// log) and d24 (decision brief).
//
// Structure (5 sheets):
//   1. Cover                  — event metadata + per-vendor BAFO round
//                                kickoff instructions
//   2. Vendors (locked)       — shortlisted vendors from d12
//   3. Trap-driven Questions  — required questions sourced from open
//                                P0/P1 traps in d20
//   4. Value-uplift Questions — opportunity-driven questions targeting
//                                potential differentiation
//   5. Vendor Response Grid   — per-vendor answer columns; auto-pivots
//                                from the question rows above
//
// Pure: payload → ExcelJS.Workbook.

import 'server-only';

import ExcelJS from 'exceljs';

import {
  SOURCE_XLSX,
  applyHeaderRow,
  applyLockedRow,
  buildCoverSheet,
  safeCell,
} from '@/lib/exports-shared/xlsx-base';

export interface BafoQuestion {
  /** Stable id — TQ-* for trap-driven, VQ-* for value-uplift. */
  id: string;
  /** Source: trap id (e.g. T-EGRESS-01) for trap-driven; category for value-uplift. */
  source: string;
  /** Severity inherited from the source trap (or `n/a` for value questions). */
  severity: 'P0' | 'P1' | 'P2' | 'n/a';
  /** Plain-language question text. */
  question: string;
  /** Expected response shape (e.g. "yes/no + redline" / "$ value + scope"). */
  responseFormat: string;
}

export interface BafoQuestionPackPayload {
  tenantName: string;
  eventCode: string;
  eventName: string;
  issuedBy?: string;
  /** ISO 8601 of generation. */
  generatedAt: string;
  /** Round indicator (e.g. "BAFO Round 1"). */
  roundLabel?: string;
  /** Vendors invited to BAFO (typically the d16-passing subset of d12). */
  vendors: ReadonlyArray<string>;
  /** Trap-driven questions — one row per open P0/P1. */
  trapQuestions: ReadonlyArray<BafoQuestion>;
  /** Value-uplift questions — one row per opportunity category. */
  valueQuestions: ReadonlyArray<BafoQuestion>;
}

export function buildBafoQuestionPackWorkbook(
  payload: BafoQuestionPackPayload,
): ExcelJS.Workbook {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'AbarVa · Sentinel';
  workbook.created = new Date(payload.generatedAt);
  workbook.title = `BAFO Question Pack · ${payload.eventCode}`;

  buildCoverSheet(workbook, {
    title: `BAFO Question Pack · ${payload.eventName}`,
    eventCode: payload.eventCode,
    eventName: payload.eventName,
    tenantName: payload.tenantName,
    issuedBy: payload.issuedBy,
    generatedAt: payload.generatedAt,
    instructions: [
      'Distributed to every vendor on the BAFO shortlist at round kickoff. Each vendor receives the same set of questions on Sheets 3 + 4.',
      'Sheet 2 (Vendors) is the locked list of vendors invited to this BAFO round.',
      'Sheet 3 (Trap-driven Questions) — one row per open P0/P1 trap from d20. These are required for response completeness.',
      'Sheet 4 (Value-uplift Questions) — opportunity-driven; affirmative answers strengthen scoring but do not gate completeness.',
      'Sheet 5 (Vendor Response Grid) — vendors fill their answer columns; buyer scores each response 1-5 in the right-hand columns.',
    ],
  });
  // Round indicator on the cover.
  if (payload.roundLabel) {
    const cover = workbook.getWorksheet('Cover');
    if (cover) {
      cover.addRow([]);
      const r = cover.addRow(['BAFO round', safeCell(payload.roundLabel)]);
      r.getCell(1).font = {
        bold: true,
        color: { argb: SOURCE_XLSX.HEADER_FILL },
      };
    }
  }

  buildVendorsSheet(workbook, payload.vendors);
  buildQuestionsSheet(workbook, 'Trap-driven Questions', payload.trapQuestions, 'trap');
  buildQuestionsSheet(workbook, 'Value-uplift Questions', payload.valueQuestions, 'value');
  buildVendorResponseGridSheet(workbook, payload);

  return workbook;
}

function buildVendorsSheet(
  workbook: ExcelJS.Workbook,
  vendors: ReadonlyArray<string>,
): ExcelJS.Worksheet {
  const sheet = workbook.addWorksheet('Vendors', {
    views: [{ showGridLines: true, state: 'frozen', ySplit: 1 }],
  });
  sheet.columns = [
    { header: '#', key: 'idx', width: 8 },
    { header: 'Vendor', key: 'vendor', width: 36 },
  ];
  applyHeaderRow(sheet.getRow(1));
  for (let i = 0; i < vendors.length; i++) {
    const r = sheet.addRow({ idx: i + 1, vendor: safeCell(vendors[i] ?? '') });
    applyLockedRow(r);
  }
  return sheet;
}

function buildQuestionsSheet(
  workbook: ExcelJS.Workbook,
  sheetName: string,
  questions: ReadonlyArray<BafoQuestion>,
  kind: 'trap' | 'value',
): ExcelJS.Worksheet {
  const sheet = workbook.addWorksheet(sheetName, {
    views: [{ showGridLines: true, state: 'frozen', ySplit: 1 }],
  });
  sheet.columns = [
    { header: 'Question ID', key: 'id', width: 14 },
    { header: kind === 'trap' ? 'Trap source' : 'Opportunity', key: 'source', width: 22 },
    { header: 'Severity', key: 'severity', width: 12 },
    { header: 'Question', key: 'question', width: 70 },
    { header: 'Response format', key: 'format', width: 30 },
  ];
  applyHeaderRow(sheet.getRow(1));

  for (const q of questions) {
    const r = sheet.addRow({
      id: safeCell(q.id),
      source: safeCell(q.source),
      severity: safeCell(q.severity),
      question: safeCell(q.question),
      format: safeCell(q.responseFormat),
    });
    applyLockedRow(r);
    r.getCell('question').alignment = { wrapText: true, vertical: 'top' };
    if (q.severity === 'P0') {
      r.getCell('severity').fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: SOURCE_XLSX.ERROR_FILL },
      };
    } else if (q.severity === 'P1') {
      r.getCell('severity').fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: SOURCE_XLSX.WARNING_FILL },
      };
    }
    r.height = 30;
  }
  return sheet;
}

function buildVendorResponseGridSheet(
  workbook: ExcelJS.Workbook,
  payload: BafoQuestionPackPayload,
): ExcelJS.Worksheet {
  const sheet = workbook.addWorksheet('Vendor Response Grid', {
    views: [{ showGridLines: true, state: 'frozen', xSplit: 2, ySplit: 2 }],
  });

  const allQuestions = [...payload.trapQuestions, ...payload.valueQuestions];
  const vendors = payload.vendors;

  // Header row 1: vendor labels (each spans 2 cols: response + score)
  const headerRow1: ExcelJS.CellValue[] = ['', ''];
  const headerRow2: ExcelJS.CellValue[] = ['Question ID', 'Severity'];
  for (const v of vendors) {
    headerRow1.push(v, '');
    headerRow2.push('Response', 'Score (1-5)');
  }
  const r1 = sheet.addRow(headerRow1);
  const r2 = sheet.addRow(headerRow2);
  applyHeaderRow(r1);
  applyHeaderRow(r2);
  for (let i = 0; i < vendors.length; i++) {
    const startCol = 3 + i * 2;
    const startAddr = sheet.getCell(1, startCol).address;
    const endAddr = sheet.getCell(1, startCol + 1).address;
    sheet.mergeCells(`${startAddr}:${endAddr}`);
  }

  // Column widths.
  sheet.getColumn(1).width = 14;
  sheet.getColumn(2).width = 12;
  for (let i = 0; i < vendors.length; i++) {
    sheet.getColumn(3 + i * 2).width = 30;
    sheet.getColumn(4 + i * 2).width = 14;
  }

  // One row per question.
  let rowNum = 3;
  for (const q of allQuestions) {
    const cells: ExcelJS.CellValue[] = [safeCell(q.id), safeCell(q.severity)];
    for (let v = 0; v < vendors.length; v++) {
      cells.push(''); // response
      cells.push(''); // score
    }
    const r = sheet.addRow(cells);
    // Lock first 2 columns.
    r.getCell(1).protection = { locked: true };
    r.getCell(2).protection = { locked: true };
    r.getCell(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: SOURCE_XLSX.LOCKED_FILL },
    };
    r.getCell(2).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: SOURCE_XLSX.LOCKED_FILL },
    };
    if (q.severity === 'P0') {
      r.getCell(2).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: SOURCE_XLSX.ERROR_FILL },
      };
    } else if (q.severity === 'P1') {
      r.getCell(2).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: SOURCE_XLSX.WARNING_FILL },
      };
    }
    // Highlight vendor-editable cells + score-validation.
    for (let v = 0; v < vendors.length; v++) {
      const respCol = 3 + v * 2;
      const scoreCol = 4 + v * 2;
      r.getCell(respCol).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: SOURCE_XLSX.WARNING_FILL },
      };
      r.getCell(respCol).alignment = { wrapText: true, vertical: 'top' };
      sheet.getCell(rowNum, scoreCol).dataValidation = {
        type: 'whole',
        operator: 'between',
        allowBlank: true,
        formulae: [1, 5],
        showErrorMessage: true,
        errorStyle: 'warning',
        errorTitle: 'Score range',
        error: 'Use 1-5.',
      };
    }
    rowNum += 1;
  }

  // Totals row — average score per vendor.
  const totalsRowNum = rowNum;
  const totalsCells: ExcelJS.CellValue[] = ['AVERAGE', ''];
  for (let v = 0; v < vendors.length; v++) {
    const scoreColLetter = colLetter(4 + v * 2);
    totalsCells.push('');
    totalsCells.push({
      formula: `IFERROR(AVERAGE(${scoreColLetter}3:${scoreColLetter}${totalsRowNum - 1}),"")`,
    });
  }
  const totalsRow = sheet.addRow(totalsCells);
  totalsRow.font = { bold: true };
  for (let v = 0; v < vendors.length; v++) {
    const scoreCol = 4 + v * 2;
    totalsRow.getCell(scoreCol).numFmt = '0.0';
    totalsRow.getCell(scoreCol).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: SOURCE_XLSX.ACCENT_FILL },
    };
  }
  return sheet;
}

function colLetter(idx: number): string {
  let s = '';
  let n = idx;
  while (n > 0) {
    const m = (n - 1) % 26;
    s = String.fromCharCode(65 + m) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}
