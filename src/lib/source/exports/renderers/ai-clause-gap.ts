// Source · Stage-6 AI Clause Gap Checklist xlsx renderer.
//
// Methodology §6: most procurement orgs have ZERO AI-contract
// expertise. This artifact ships the canonical clause library and
// scores the vendor's contract draft against it. Each clause carries:
//   - Why it matters (so the artifact educates the buyer).
//   - Default required language summary.
//   - Buyer-fillable status (Present / Partial / Missing / N/A).
//   - Risk if missing (Critical / High / Medium).
//
// Structure (3 sheets):
//   1. Cover                  — event metadata + how-to-use
//   2. AI Clause Library      — main grid; one row per clause; buyer
//                                fills status + notes; formula-driven
//                                summary at the foot.
//   3. Gap Summary            — counts by status × risk-if-missing
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

export type AiClauseRiskIfMissing = 'critical' | 'high' | 'medium';
export type AiClauseStatus = 'present' | 'partial' | 'missing' | 'n/a';

export interface AiClauseRow {
  id: string;
  /** Clause label per methodology §6. */
  clause: string;
  /** One-sentence rationale — why it matters. */
  whyItMatters: string;
  /** Default required language summary. */
  requiredLanguage: string;
  /** Risk if missing. */
  riskIfMissing: AiClauseRiskIfMissing;
  /** Initial buyer status — typically 'missing' for a fresh review. */
  status: AiClauseStatus;
  /** Initial notes (e.g. "vendor disagreed on output ownership"). */
  notes: string;
}

export interface AiClauseGapPayload {
  tenantName: string;
  eventCode: string;
  eventName: string;
  issuedBy?: string;
  generatedAt: string;
  /** Vendor under review. Empty allowed when authored pre-vendor. */
  vendorName: string;
  /** Locked clause library — one row per clause from methodology §6. */
  clauses: ReadonlyArray<AiClauseRow>;
}

export function buildAiClauseGapWorkbook(
  payload: AiClauseGapPayload,
): ExcelJS.Workbook {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'AbarVa · Sentinel';
  workbook.created = new Date(payload.generatedAt);
  workbook.title = `AI Clause Gap · ${payload.eventCode}`;

  buildCoverSheet(workbook, {
    title: `AI Clause Gap Checklist · ${payload.eventName}`,
    eventCode: payload.eventCode,
    eventName: payload.eventName,
    tenantName: payload.tenantName,
    issuedBy: payload.issuedBy,
    generatedAt: payload.generatedAt,
    instructions: [
      'Sheet 2 (AI Clause Library) — methodology §6 clause library. One row per clause; buyer fills Status + Notes after reviewing the vendor draft.',
      'Status values: Present / Partial / Missing / N/A (only when the clause is not relevant to this vendor).',
      'Critical-risk clauses left Missing or Partial MUST be redlined before signature. The Gap Summary sheet counts them.',
      `Reviewing vendor: ${payload.vendorName || '(buyer fills before circulating)'}`,
    ],
  });

  buildClauseLibrarySheet(workbook, payload.clauses, payload.vendorName);
  buildGapSummarySheet(workbook, payload.clauses.length);

  return workbook;
}

function buildClauseLibrarySheet(
  workbook: ExcelJS.Workbook,
  rows: ReadonlyArray<AiClauseRow>,
  vendorName: string,
): ExcelJS.Worksheet {
  const sheet = workbook.addWorksheet('AI Clause Library', {
    views: [{ showGridLines: true, state: 'frozen', xSplit: 1, ySplit: 1 }],
  });
  sheet.columns = [
    { header: 'Clause ID', key: 'id', width: 14 },
    { header: 'Clause', key: 'clause', width: 32 },
    { header: 'Why it matters', key: 'whyItMatters', width: 44 },
    { header: 'Required language (summary)', key: 'requiredLanguage', width: 44 },
    { header: 'Risk if missing', key: 'riskIfMissing', width: 14 },
    { header: `Status (${vendorName || 'vendor'})`, key: 'status', width: 16 },
    { header: 'Notes', key: 'notes', width: 36 },
  ];
  applyHeaderRow(sheet.getRow(1));

  let rowNum = 2;
  for (const row of rows) {
    const r = sheet.addRow({
      id: safeCell(row.id),
      clause: safeCell(row.clause),
      whyItMatters: safeCell(row.whyItMatters),
      requiredLanguage: safeCell(row.requiredLanguage),
      riskIfMissing: row.riskIfMissing,
      status: row.status,
      notes: safeCell(row.notes),
    });
    r.getCell('whyItMatters').alignment = { wrapText: true, vertical: 'top' };
    r.getCell('requiredLanguage').alignment = { wrapText: true, vertical: 'top' };
    r.height = 48;
    if (row.riskIfMissing === 'critical') {
      r.getCell('riskIfMissing').fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: SOURCE_XLSX.ERROR_FILL },
      };
    } else if (row.riskIfMissing === 'high') {
      r.getCell('riskIfMissing').fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: SOURCE_XLSX.WARNING_FILL },
      };
    }
    // Status data validation
    sheet.getCell(`F${rowNum}`).dataValidation = {
      type: 'list',
      allowBlank: false,
      formulae: ['"present,partial,missing,n/a"'],
      showErrorMessage: true,
      errorStyle: 'stop',
      errorTitle: 'Clause status',
      error: 'Use one of: present / partial / missing / n/a.',
    };
    if (row.status === 'missing' || row.status === 'partial') {
      r.getCell('status').fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: SOURCE_XLSX.WARNING_FILL },
      };
    }
    rowNum += 1;
  }
  return sheet;
}

function buildGapSummarySheet(
  workbook: ExcelJS.Workbook,
  clauseCount: number,
): ExcelJS.Worksheet {
  const sheet = workbook.addWorksheet('Gap Summary', {
    views: [{ showGridLines: false }],
  });
  sheet.columns = [
    { header: 'Metric', key: 'metric', width: 50 },
    { header: 'Value', key: 'value', width: 16 },
  ];
  applyHeaderRow(sheet.getRow(1));
  const lastRow = 1 + Math.max(clauseCount, 1);
  const statusRange = `'AI Clause Library'!F2:F${lastRow}`;
  const riskRange = `'AI Clause Library'!E2:E${lastRow}`;

  const rows: Array<[string, ExcelJS.CellValue]> = [
    ['Total clauses in library', clauseCount],
    ['Present', { formula: `COUNTIF(${statusRange},"present")` }],
    ['Partial', { formula: `COUNTIF(${statusRange},"partial")` }],
    ['Missing', { formula: `COUNTIF(${statusRange},"missing")` }],
    ['N/A', { formula: `COUNTIF(${statusRange},"n/a")` }],
    ['Critical-risk × Missing (must redline)', {
      formula: `SUMPRODUCT((${riskRange}="critical")*(${statusRange}="missing"))`,
    }],
    ['Critical-risk × Partial (must redline)', {
      formula: `SUMPRODUCT((${riskRange}="critical")*(${statusRange}="partial"))`,
    }],
    ['High-risk × Missing', {
      formula: `SUMPRODUCT((${riskRange}="high")*(${statusRange}="missing"))`,
    }],
  ];
  for (const [metric, value] of rows) {
    const r = sheet.addRow({ metric, value });
    applyLockedRow(r);
    r.getCell('metric').font = { bold: true };
  }
  return sheet;
}
