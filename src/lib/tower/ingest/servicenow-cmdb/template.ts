import ExcelJS from 'exceljs';

import {
  CMDB_CI_COLUMNS,
  CMDB_DEPENDENCY_COLUMNS,
  CMDB_DEPENDENCY_TYPES,
  CMDB_LIFECYCLE_STATES,
  CMDB_CRITICALITY_LEVELS,
  CMDB_SHEET_CIS,
  CMDB_SHEET_DEPS,
  CMDB_SHEET_HOWTO,
  CMDB_SHEET_SCHEMA,
} from './schema';
import { buildSyntheticNorthwindCmdb } from './sample';

const SYNTHETIC_BANNER =
  'SYNTHETIC NORTHWIND RETAIL DATA — for product demos and tests only. NOT a real customer CMDB extract. Replace before any production use.';

const BLANK_BANNER =
  'BLANK TEMPLATE — fill the Configuration Items and Dependencies sheets, then upload via Tower → Connectors → ServiceNow CMDB.';

interface BuildOptions {
  /** When true, include the synthetic Northwind sample rows. */
  filled: boolean;
}

function applyHeaderRow(
  sheet: ExcelJS.Worksheet,
  headers: ReadonlyArray<{ header: string; required: boolean }>,
): void {
  const row = sheet.getRow(1);
  headers.forEach((column, idx) => {
    const cell = row.getCell(idx + 1);
    cell.value = column.header;
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: column.required ? 'FF1F3A52' : 'FF42627F' },
    };
    cell.alignment = { horizontal: 'left', vertical: 'middle' };
  });
  row.height = 22;
  sheet.views = [{ state: 'frozen', ySplit: 1 }];
}

function applyBanner(sheet: ExcelJS.Worksheet, message: string, span: number): void {
  sheet.insertRow(1, [message]);
  sheet.mergeCells(1, 1, 1, span);
  const cell = sheet.getCell(1, 1);
  cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  cell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFB91C1C' },
  };
  cell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
  sheet.getRow(1).height = 32;
}

/**
 * Build a ServiceNow CMDB ingest workbook.
 *
 * Two variants:
 *   - `{ filled: false }`  → blank template, headers + How-to + Schema only.
 *   - `{ filled: true }`   → blank template + ~200 synthetic Northwind rows
 *                             and ~400 dependency edges, with the synthetic
 *                             banner on every data sheet.
 *
 * Both variants have identical sheet structure so the parser only has one
 * shape to support.
 */
export async function buildServiceNowCmdbWorkbook(
  options: BuildOptions,
): Promise<ExcelJS.Workbook> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'AbarVa Tower';
  workbook.created = new Date('2026-05-30T00:00:00Z'); // deterministic for tests
  workbook.modified = workbook.created;

  // --- Configuration Items sheet ------------------------------------------
  const ciSheet = workbook.addWorksheet(CMDB_SHEET_CIS);
  for (const col of CMDB_CI_COLUMNS) {
    ciSheet.columns = [
      ...(ciSheet.columns ?? []),
      { header: col.header, key: col.key, width: Math.max(16, col.header.length + 4) },
    ];
  }
  applyHeaderRow(ciSheet, CMDB_CI_COLUMNS);

  // --- Dependencies sheet --------------------------------------------------
  const depSheet = workbook.addWorksheet(CMDB_SHEET_DEPS);
  for (const col of CMDB_DEPENDENCY_COLUMNS) {
    depSheet.columns = [
      ...(depSheet.columns ?? []),
      { header: col.header, key: col.key, width: Math.max(20, col.header.length + 4) },
    ];
  }
  applyHeaderRow(depSheet, CMDB_DEPENDENCY_COLUMNS);

  // --- Fill with synthetic data ------------------------------------------
  if (options.filled) {
    const sample = buildSyntheticNorthwindCmdb();
    for (const ci of sample.cis) {
      ciSheet.addRow({
        ciSysId: ci.ciSysId,
        ciName: ci.ciName,
        ciType: ci.ciType,
        ciClass: ci.ciClass,
        lifecycleState: ci.lifecycleState,
        ownerTeam: ci.ownerTeam,
        businessService: ci.businessService,
        criticality: ci.criticality,
        environment: ci.environment,
      });
    }
    for (const edge of sample.dependencies) {
      depSheet.addRow({
        sourceCiSysId: edge.sourceCiSysId,
        targetCiSysId: edge.targetCiSysId,
        dependencyType: edge.dependencyType,
      });
    }
  }

  // Banner sits in row 1; header is then row 2. The parser only reads
  // column headers from row 1, so we set the banner AFTER columns are
  // built then re-bold row 2 as the header.
  applyBanner(ciSheet, options.filled ? SYNTHETIC_BANNER : BLANK_BANNER, CMDB_CI_COLUMNS.length);
  applyBanner(depSheet, options.filled ? SYNTHETIC_BANNER : BLANK_BANNER, CMDB_DEPENDENCY_COLUMNS.length);

  // After insertRow(1), the header row moved to row 2 — restyle + re-freeze.
  const ciHeaderRow = ciSheet.getRow(2);
  ciHeaderRow.eachCell((cell, colNumber) => {
    const col = CMDB_CI_COLUMNS[colNumber - 1];
    if (!col) return;
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: col.required ? 'FF1F3A52' : 'FF42627F' },
    };
  });
  const depHeaderRow = depSheet.getRow(2);
  depHeaderRow.eachCell((cell, colNumber) => {
    const col = CMDB_DEPENDENCY_COLUMNS[colNumber - 1];
    if (!col) return;
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: col.required ? 'FF1F3A52' : 'FF42627F' },
    };
  });
  ciSheet.views = [{ state: 'frozen', ySplit: 2 }];
  depSheet.views = [{ state: 'frozen', ySplit: 2 }];

  // --- How to fill ---------------------------------------------------------
  const howto = workbook.addWorksheet(CMDB_SHEET_HOWTO);
  howto.columns = [{ header: 'Step', key: 'step', width: 8 }, { header: 'Instruction', key: 'instruction', width: 110 }];
  howto.getRow(1).font = { bold: true };
  const howtoRows: Array<[string, string]> = [
    ['1', 'In ServiceNow, export the cmdb_ci table via Table API or a scheduled export. Filter to non-retired CIs if you only want the live portfolio.'],
    ['2', 'In ServiceNow, export the cmdb_rel_ci relationships table. Each row in that table corresponds to one row in the "Dependencies" sheet of this workbook.'],
    ['3', 'Map the ServiceNow columns to the headers on the "Configuration Items" sheet. Column order does not matter — the parser uses header names.'],
    ['4', `Allowed lifecycle_state values: ${CMDB_LIFECYCLE_STATES.join(', ')}.`],
    ['5', `Allowed criticality values: ${CMDB_CRITICALITY_LEVELS.join(', ')}.`],
    ['6', `Allowed dependency_type values: ${CMDB_DEPENDENCY_TYPES.join(', ')}.`],
    ['7', 'Every source_ci_sys_id and target_ci_sys_id in the Dependencies sheet must appear as a ci_sys_id on the Configuration Items sheet. The validator rejects orphan edges before write.'],
    ['8', 'Save the workbook and upload via Tower → Connectors → ServiceNow CMDB, or use the CLI: `npm exec tsx src/scripts/tower/ingest-servicenow-cmdb.ts -- --file <path> --client-id <tenant> --dry-run`.'],
    ['9', 'The ingest is idempotent. Re-uploading the same workbook is safe — rows are upserted by ci_sys_id and edges are upserted by (source, target, type).'],
    ['10', 'See docs/templates/tower/servicenow-cmdb/README.md for the enterprise runbook, the production extract pattern, and the rollback procedure.'],
  ];
  for (const [step, instruction] of howtoRows) {
    howto.addRow({ step, instruction });
  }
  howto.getColumn('instruction').alignment = { wrapText: true, vertical: 'top' };

  // --- Schema reference ----------------------------------------------------
  const schema = workbook.addWorksheet(CMDB_SHEET_SCHEMA);
  schema.columns = [
    { header: 'Sheet', key: 'sheet', width: 22 },
    { header: 'Column', key: 'column', width: 24 },
    { header: 'Required', key: 'required', width: 10 },
    { header: 'Description', key: 'description', width: 60 },
    { header: 'Example', key: 'example', width: 38 },
  ];
  schema.getRow(1).font = { bold: true };
  for (const col of CMDB_CI_COLUMNS) {
    schema.addRow({
      sheet: CMDB_SHEET_CIS,
      column: col.header,
      required: col.required ? 'yes' : 'no',
      description: col.description,
      example: col.example,
    });
  }
  for (const col of CMDB_DEPENDENCY_COLUMNS) {
    schema.addRow({
      sheet: CMDB_SHEET_DEPS,
      column: col.header,
      required: col.required ? 'yes' : 'no',
      description: col.description,
      example: col.example,
    });
  }
  schema.getColumn('description').alignment = { wrapText: true, vertical: 'top' };

  return workbook;
}

export async function writeServiceNowCmdbWorkbook(
  outputPath: string,
  options: BuildOptions,
): Promise<void> {
  const workbook = await buildServiceNowCmdbWorkbook(options);
  await workbook.xlsx.writeFile(outputPath);
}
