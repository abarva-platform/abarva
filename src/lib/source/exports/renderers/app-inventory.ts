// Source · d04 Application Inventory & Tiering template
//
// Buyer-side inventory of every application in scope, classified by
// tier (1 = mission-critical, 2 = important, 3 = standard). This is
// the load-bearing artifact that downstream pricing (d19), response
// checklist (d11), and scorecard (d16) reach back to: a vendor cannot
// price what the buyer hasn't inventoried.
//
// Structure (4 sheets):
//   1. Cover               — event metadata, owner, instructions
//   2. Tier Definitions    — locked rubric so all tier columns mean the
//                            same thing (RTO / RPO / criticality)
//   3. Application Inventory — main editable grid; one row per app
//   4. Inventory Summary   — locked, formula-driven counts and
//                            workload totals by tier (COUNTIF + SUMIF)
//
// The renderer is pure (payload → ExcelJS.Workbook). The payload binder
// pulls candidate apps from d05 scope memo bullets when authored, or
// falls back to a small default set keyed off the event archetype.

import 'server-only';

import ExcelJS from 'exceljs';

import {
  SOURCE_XLSX,
  applyHeaderRow,
  applyLockedRow,
  buildCoverSheet,
  safeCell,
} from './xlsx-base';

/** One row in the Application Inventory sheet. Buyer fills tier + owner. */
export interface AppInventoryRow {
  /** Stable id (e.g. "A-EPIC-CIS"). */
  id: string;
  /** Plain-language name (e.g. "Epic CIS"). */
  name: string;
  /** Tier 1 / 2 / 3 — leave 0 to indicate "not yet classified". */
  tier: 1 | 2 | 3 | 0;
  /** Business owner / application steward. */
  owner: string;
  /** Tech stack summary (e.g. "Cache MUMPS / Java"). */
  techStack: string;
  /** Hosting today (e.g. "Newark colo · 12 VMs"). */
  hostingToday: string;
  /** Annual workload count (incidents, transactions, sessions, etc). */
  annualWorkloadCount: number;
  /** Whether this app is in scope for the sourcing event. */
  inScope: boolean;
  /** Free-form note column. */
  notes?: string;
}

/** One row in the Tier Definitions sheet (locked). */
export interface AppInventoryTierDefinition {
  tier: 1 | 2 | 3;
  label: string;
  criterion: string;
  recoveryObjective: string;
  examples: string;
}

export interface AppInventoryPayload {
  tenantName: string;
  eventCode: string;
  eventName: string;
  issuedBy?: string;
  /** ISO 8601 of generation. */
  generatedAt: string;
  /** Tier rubric — defaults supplied by the binder when absent. */
  tierDefinitions: ReadonlyArray<AppInventoryTierDefinition>;
  /** Inventory rows. */
  rows: ReadonlyArray<AppInventoryRow>;
}

/** Build the workbook. Pure (payload) → Workbook; the route serializes. */
export function buildAppInventoryWorkbook(
  payload: AppInventoryPayload,
): ExcelJS.Workbook {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'AbarVa · Sentinel';
  workbook.created = new Date(payload.generatedAt);
  workbook.title = `Application Inventory · ${payload.eventCode}`;

  buildCoverSheet(workbook, {
    title: `Application Inventory · ${payload.eventName}`,
    eventCode: payload.eventCode,
    eventName: payload.eventName,
    tenantName: payload.tenantName,
    issuedBy: payload.issuedBy,
    generatedAt: payload.generatedAt,
    instructions: [
      'Sheet 2 (Tier Definitions) is the locked rubric. Every Tier value in Sheet 3 must map to one of these rows.',
      'Sheet 3 (Application Inventory) is the editable inventory. One row per application. Tier 0 means "not yet classified" — review before publishing.',
      'In-scope column drives downstream pricing: applications marked N here will not be priced by vendors in d19.',
      'Sheet 4 (Inventory Summary) is locked and formula-driven; do not overwrite.',
      'Add rows by inserting before the last data row to keep summary formulas intact.',
    ],
  });
  // Inventory lead slot on the Cover sheet.
  const cover = workbook.getWorksheet('Cover');
  if (cover) {
    cover.addRow([]);
    const r = cover.addRow(['Inventory lead', '']);
    r.getCell(1).font = { bold: true, color: { argb: SOURCE_XLSX.HEADER_FILL } };
    r.getCell(2).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: SOURCE_XLSX.WARNING_FILL },
    };
  }

  buildTierDefinitionsSheet(workbook, payload.tierDefinitions);
  buildApplicationInventorySheet(workbook, payload.rows);
  buildInventorySummarySheet(workbook, payload.rows.length);

  return workbook;
}

function buildTierDefinitionsSheet(
  workbook: ExcelJS.Workbook,
  rows: ReadonlyArray<AppInventoryTierDefinition>,
): ExcelJS.Worksheet {
  const sheet = workbook.addWorksheet('Tier Definitions', {
    views: [{ showGridLines: true, state: 'frozen', ySplit: 1 }],
  });
  sheet.columns = [
    { header: 'Tier', key: 'tier', width: 8 },
    { header: 'Label', key: 'label', width: 22 },
    { header: 'Criticality criterion', key: 'criterion', width: 60 },
    { header: 'Recovery objective', key: 'recovery', width: 28 },
    { header: 'Examples', key: 'examples', width: 40 },
  ];
  applyHeaderRow(sheet.getRow(1));

  for (const def of rows) {
    const r = sheet.addRow({
      tier: def.tier,
      label: safeCell(def.label),
      criterion: safeCell(def.criterion),
      recovery: safeCell(def.recoveryObjective),
      examples: safeCell(def.examples),
    });
    applyLockedRow(r);
    r.getCell('criterion').alignment = { wrapText: true, vertical: 'top' };
    r.getCell('examples').alignment = { wrapText: true, vertical: 'top' };
    r.height = 36;
  }
  return sheet;
}

function buildApplicationInventorySheet(
  workbook: ExcelJS.Workbook,
  rows: ReadonlyArray<AppInventoryRow>,
): ExcelJS.Worksheet {
  const sheet = workbook.addWorksheet('Application Inventory', {
    views: [{ showGridLines: true, state: 'frozen', ySplit: 1 }],
  });
  sheet.columns = [
    { header: 'App ID', key: 'id', width: 16 },
    { header: 'Application name', key: 'name', width: 32 },
    { header: 'Tier (1-3)', key: 'tier', width: 12 },
    { header: 'Business owner', key: 'owner', width: 24 },
    { header: 'Tech stack', key: 'techStack', width: 28 },
    { header: 'Hosting today', key: 'hostingToday', width: 28 },
    { header: 'Annual workload count', key: 'workload', width: 22 },
    { header: 'In-scope (Y/N)', key: 'inScope', width: 14 },
    { header: 'Notes', key: 'notes', width: 40 },
  ];
  applyHeaderRow(sheet.getRow(1));

  let rowNum = 2;
  for (const row of rows) {
    const tierCellValue = row.tier === 0 ? '' : row.tier;
    const r = sheet.addRow({
      id: safeCell(row.id),
      name: safeCell(row.name),
      tier: tierCellValue,
      owner: safeCell(row.owner),
      techStack: safeCell(row.techStack),
      hostingToday: safeCell(row.hostingToday),
      workload: row.annualWorkloadCount,
      inScope: row.inScope ? 'Y' : 'N',
      notes: safeCell(row.notes ?? ''),
    });
    r.getCell('name').alignment = { wrapText: true, vertical: 'top' };
    r.getCell('techStack').alignment = { wrapText: true, vertical: 'top' };
    r.getCell('hostingToday').alignment = { wrapText: true, vertical: 'top' };
    r.getCell('notes').alignment = { wrapText: true, vertical: 'top' };
    // Tier-cell color hint for unclassified rows.
    if (row.tier === 0) {
      r.getCell('tier').fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: SOURCE_XLSX.WARNING_FILL },
      };
    }
    // Data-validation: Tier ∈ {1,2,3}; In-scope ∈ {Y,N}.
    sheet.getCell(`C${rowNum}`).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: ['"1,2,3"'],
      showErrorMessage: true,
      errorStyle: 'warning',
      errorTitle: 'Tier must be 1, 2, or 3',
      error: 'Use the Tier Definitions sheet to choose the right tier.',
    };
    sheet.getCell(`H${rowNum}`).dataValidation = {
      type: 'list',
      allowBlank: false,
      formulae: ['"Y,N"'],
      showErrorMessage: true,
      errorStyle: 'stop',
      errorTitle: 'In-scope must be Y or N',
      error: 'Use Y for in-scope, N for out-of-scope.',
    };
    rowNum += 1;
  }

  return sheet;
}

function buildInventorySummarySheet(
  workbook: ExcelJS.Workbook,
  inventoryRowCount: number,
): ExcelJS.Worksheet {
  const sheet = workbook.addWorksheet('Inventory Summary', {
    views: [{ showGridLines: false }],
  });
  sheet.columns = [
    { header: 'Metric', key: 'metric', width: 36 },
    { header: 'Value', key: 'value', width: 18 },
  ];
  applyHeaderRow(sheet.getRow(1));

  // Reference the inventory sheet by name so renaming it would break,
  // but the locked-cover instructions tell users not to rename.
  const lastRow = 1 + Math.max(inventoryRowCount, 1);
  const tierRange = `'Application Inventory'!C2:C${lastRow}`;
  const inScopeRange = `'Application Inventory'!H2:H${lastRow}`;
  const workloadRange = `'Application Inventory'!G2:G${lastRow}`;

  const summaryRows: Array<[string, ExcelJS.CellValue]> = [
    ['Total applications inventoried', { formula: `COUNTA(${tierRange})` }],
    ['Tier 1 count (mission-critical)', { formula: `COUNTIF(${tierRange},1)` }],
    ['Tier 2 count (important)', { formula: `COUNTIF(${tierRange},2)` }],
    ['Tier 3 count (standard)', { formula: `COUNTIF(${tierRange},3)` }],
    ['In-scope count', { formula: `COUNTIF(${inScopeRange},"Y")` }],
    ['Out-of-scope count', { formula: `COUNTIF(${inScopeRange},"N")` }],
    ['Total annual workload (in-scope)', { formula: `SUMIFS(${workloadRange},${inScopeRange},"Y")` }],
  ];
  for (const [metric, value] of summaryRows) {
    const r = sheet.addRow({ metric, value });
    applyLockedRow(r);
    r.getCell('metric').font = { bold: true };
  }

  return sheet;
}
