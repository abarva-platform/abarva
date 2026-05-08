// Source · d20 Pricing Trap Log xlsx
//
// The trap log is where Sentinel surfaces all the pricing surprises a
// vendor's d19 submission introduces — the buyer evaluates each, marks
// resolution status, and the log feeds the d22 BAFO question pack and
// d24 decision brief.
//
// Structure (4 sheets):
//   1. Cover               — event metadata + scoring instructions
//   2. Severity Definitions — locked P0/P1/P2 rubric
//   3. Trap Log            — main editable grid; one row per trap
//   4. Resolution Summary  — formula-driven counts by severity x status
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
} from './xlsx-base';

/** Severity tiers for traps. P0 = deal-shaping, P1 = material, P2 = noted. */
export type TrapSeverity = 'P0' | 'P1' | 'P2';

/** One row in the Trap Log. Resolution columns are buyer-fillable. */
export interface TrapLogRow {
  /** Stable id (e.g. "T-EGRESS-01"). */
  id: string;
  /** Severity tier — P0 (deal-shaping) / P1 (material) / P2 (noted). */
  severity: TrapSeverity;
  /** Category (Egress / Lock-in / SLA carve-out / Transition / etc.). */
  category: string;
  /** Plain-language description of the trap. */
  description: string;
  /** Vendor whose submission surfaced the trap (or "all" / "n/a"). */
  surfacedFor: string;
  /** Sentinel agent / human evaluator that surfaced the trap. */
  surfacedBy: string;
}

export interface TrapSeverityDefinition {
  severity: TrapSeverity;
  label: string;
  /** What it means + what the buyer should do about it. */
  rubric: string;
}

export interface TrapLogPayload {
  tenantName: string;
  eventCode: string;
  eventName: string;
  issuedBy?: string;
  /** ISO 8601 of generation. */
  generatedAt: string;
  /** Locked severity rubric. */
  severityDefinitions: ReadonlyArray<TrapSeverityDefinition>;
  /** Trap rows. */
  rows: ReadonlyArray<TrapLogRow>;
}

export function buildTrapLogWorkbook(payload: TrapLogPayload): ExcelJS.Workbook {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'AbarVa · Sentinel';
  workbook.created = new Date(payload.generatedAt);
  workbook.title = `Pricing Trap Log · ${payload.eventCode}`;

  buildCoverSheet(workbook, {
    title: `Pricing Trap Log · ${payload.eventName}`,
    eventCode: payload.eventCode,
    eventName: payload.eventName,
    tenantName: payload.tenantName,
    issuedBy: payload.issuedBy,
    generatedAt: payload.generatedAt,
    instructions: [
      'Sheet 2 (Severity Definitions) is the locked rubric. Every trap must be tagged with one of P0 / P1 / P2.',
      'Sheet 3 (Trap Log) is the main grid. Buyer fills the right-hand columns: Resolution Status / Resolution Owner / Resolution Date / Notes. Use Y/N/Pending values for status.',
      'Sheet 4 (Resolution Summary) is formula-driven; do not overwrite. Re-export this artifact to refresh counts after the trap log changes.',
      'Cross-references: open P0 + P1 traps flow into d22 BAFO Question Pack as required questions.',
    ],
  });

  buildSeverityDefinitionsSheet(workbook, payload.severityDefinitions);
  buildTrapLogSheet(workbook, payload.rows);
  buildResolutionSummarySheet(workbook, payload.rows.length);

  return workbook;
}

function buildSeverityDefinitionsSheet(
  workbook: ExcelJS.Workbook,
  rows: ReadonlyArray<TrapSeverityDefinition>,
): ExcelJS.Worksheet {
  const sheet = workbook.addWorksheet('Severity Definitions', {
    views: [{ showGridLines: true, state: 'frozen', ySplit: 1 }],
  });
  sheet.columns = [
    { header: 'Severity', key: 'severity', width: 12 },
    { header: 'Label', key: 'label', width: 24 },
    { header: 'Rubric', key: 'rubric', width: 80 },
  ];
  applyHeaderRow(sheet.getRow(1));
  for (const def of rows) {
    const r = sheet.addRow({
      severity: safeCell(def.severity),
      label: safeCell(def.label),
      rubric: safeCell(def.rubric),
    });
    applyLockedRow(r);
    r.getCell('rubric').alignment = { wrapText: true, vertical: 'top' };
    r.height = 36;
  }
  return sheet;
}

function buildTrapLogSheet(
  workbook: ExcelJS.Workbook,
  rows: ReadonlyArray<TrapLogRow>,
): ExcelJS.Worksheet {
  const sheet = workbook.addWorksheet('Trap Log', {
    views: [{ showGridLines: true, state: 'frozen', xSplit: 0, ySplit: 1 }],
  });
  sheet.columns = [
    { header: 'Trap ID', key: 'id', width: 16 },
    { header: 'Severity (P0/P1/P2)', key: 'severity', width: 18 },
    { header: 'Category', key: 'category', width: 22 },
    { header: 'Description', key: 'description', width: 50 },
    { header: 'Surfaced for', key: 'surfacedFor', width: 18 },
    { header: 'Surfaced by', key: 'surfacedBy', width: 18 },
    { header: 'Resolution status', key: 'status', width: 18 },
    { header: 'Resolution owner', key: 'owner', width: 18 },
    { header: 'Resolution date', key: 'date', width: 16 },
    { header: 'Notes', key: 'notes', width: 36 },
  ];
  applyHeaderRow(sheet.getRow(1));

  let rowNum = 2;
  for (const row of rows) {
    const r = sheet.addRow({
      id: safeCell(row.id),
      severity: safeCell(row.severity),
      category: safeCell(row.category),
      description: safeCell(row.description),
      surfacedFor: safeCell(row.surfacedFor),
      surfacedBy: safeCell(row.surfacedBy),
      status: '', // buyer fills
      owner: '',
      date: '',
      notes: '',
    });
    r.getCell('description').alignment = { wrapText: true, vertical: 'top' };
    // Highlight P0 rows so they jump out.
    if (row.severity === 'P0') {
      r.getCell('severity').fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: SOURCE_XLSX.ERROR_FILL },
      };
    } else if (row.severity === 'P1') {
      r.getCell('severity').fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: SOURCE_XLSX.WARNING_FILL },
      };
    }
    // Buyer-editable cells highlighted.
    for (const col of ['status', 'owner', 'date', 'notes'] as const) {
      r.getCell(col).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: SOURCE_XLSX.WARNING_FILL },
      };
    }
    // Resolution-status data validation.
    sheet.getCell(`G${rowNum}`).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: ['"Open,Pending,Resolved,Accepted,Rejected"'],
      showErrorMessage: true,
      errorStyle: 'warning',
      errorTitle: 'Resolution status',
      error: 'Use Open / Pending / Resolved / Accepted / Rejected.',
    };
    // Severity data validation (re-confirms vs the rubric).
    sheet.getCell(`B${rowNum}`).dataValidation = {
      type: 'list',
      allowBlank: false,
      formulae: ['"P0,P1,P2"'],
      showErrorMessage: true,
      errorStyle: 'stop',
      errorTitle: 'Severity must be P0 / P1 / P2',
      error: 'Reference Sheet 2 for the rubric.',
    };
    rowNum += 1;
  }
  return sheet;
}

function buildResolutionSummarySheet(
  workbook: ExcelJS.Workbook,
  trapCount: number,
): ExcelJS.Worksheet {
  const sheet = workbook.addWorksheet('Resolution Summary', {
    views: [{ showGridLines: false }],
  });
  sheet.columns = [
    { header: 'Metric', key: 'metric', width: 36 },
    { header: 'Value', key: 'value', width: 16 },
  ];
  applyHeaderRow(sheet.getRow(1));

  const lastRow = 1 + Math.max(trapCount, 1);
  const sevRange = `'Trap Log'!B2:B${lastRow}`;
  const statusRange = `'Trap Log'!G2:G${lastRow}`;

  const summaryRows: Array<[string, ExcelJS.CellValue]> = [
    ['Total traps logged', { formula: `COUNTA(${sevRange})` }],
    ['P0 (deal-shaping)', { formula: `COUNTIF(${sevRange},"P0")` }],
    ['P1 (material)', { formula: `COUNTIF(${sevRange},"P1")` }],
    ['P2 (noted)', { formula: `COUNTIF(${sevRange},"P2")` }],
    ['Open + Pending', { formula: `COUNTIF(${statusRange},"Open")+COUNTIF(${statusRange},"Pending")` }],
    ['Resolved + Accepted', { formula: `COUNTIF(${statusRange},"Resolved")+COUNTIF(${statusRange},"Accepted")` }],
    ['Rejected', { formula: `COUNTIF(${statusRange},"Rejected")` }],
  ];
  for (const [metric, value] of summaryRows) {
    const r = sheet.addRow({ metric, value });
    applyLockedRow(r);
    r.getCell('metric').font = { bold: true };
  }
  return sheet;
}
