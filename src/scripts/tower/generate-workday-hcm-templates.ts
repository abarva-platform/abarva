/**
 * Build the Workday HCM template + Northwind sample workbook.
 *
 * Outputs:
 *   - public/templates/tower/workday-hcm/template.xlsx
 *   - public/templates/tower/workday-hcm/sample-filled.xlsx
 *
 * Run once to (re)build the template assets when the column shape changes:
 *   npx tsx src/scripts/tower/generate-workday-hcm-templates.ts
 */

import { mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import ExcelJS from 'exceljs';
import { generateNorthwindWorkforce } from '@/lib/tower/ingest/workday-hcm/synthetic';
import {
  ATTRITION_REASON_ENUM,
  WORKDAY_FUNCTION_ENUM,
  type WorkdayWorkforceRow,
} from '@/lib/tower/ingest/workday-hcm/types';

interface ColumnSpec {
  key: keyof WorkdayWorkforceRow;
  required: boolean;
  type: 'string' | 'boolean' | 'date' | 'enum';
  pii: boolean;
  description: string;
  example: string;
}

const COLUMNS: ColumnSpec[] = [
  { key: 'employee_id', required: true, type: 'string', pii: true,
    description: 'Synthetic / redacted worker ID. NEVER the raw Workday WID for real customer data. Use a deterministic hash or a generator prefix (e.g. EMP-NW-00001).',
    example: 'EMP-NW-00001' },
  { key: 'function', required: true, type: 'enum', pii: false,
    description: `Top-level org function. Must match exactly one of: ${WORKDAY_FUNCTION_ENUM.join(', ')}.`,
    example: 'Stores' },
  { key: 'sub_function', required: false, type: 'string', pii: false,
    description: 'Optional sub-function / job family. Free text.',
    example: 'Store Associate' },
  { key: 'location', required: false, type: 'string', pii: false,
    description: 'Site or region code. Free text. Use a coarse label for restricted-data compliance.',
    example: 'Columbus, OH' },
  { key: 'level', required: false, type: 'string', pii: false,
    description: 'Career level / grade. Free text.',
    example: 'IC3' },
  { key: 'contractor_flag', required: true, type: 'boolean', pii: false,
    description: 'TRUE for contingent / contractor workers, FALSE for FTE.',
    example: 'FALSE' },
  { key: 'start_date', required: true, type: 'date', pii: false,
    description: 'Hire or contract-start date in ISO YYYY-MM-DD.',
    example: '2022-08-15' },
  { key: 'attrition_date', required: false, type: 'date', pii: false,
    description: 'Termination / contract-end date in ISO YYYY-MM-DD. Leave blank for active workers. Must be >= start_date.',
    example: '2025-12-31' },
  { key: 'attrition_reason', required: false, type: 'enum', pii: false,
    description: `Reason for attrition. One of: ${ATTRITION_REASON_ENUM.join(', ')}. Blank if active.`,
    example: 'voluntary' },
];

function styleHeaderRow(row: ExcelJS.Row) {
  row.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  row.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1F2937' },
  };
  row.alignment = { vertical: 'middle' };
}

function addInstructionsSheet(wb: ExcelJS.Workbook, isSample: boolean) {
  const sheet = wb.addWorksheet('Instructions');
  sheet.columns = [{ width: 28 }, { width: 110 }];
  const rows: Array<[string, string]> = [
    ['Pack', 'Tower ingest · Workday HCM'],
    ['Template version', '1.0'],
    ['Source system', 'Workday HCM'],
    ['Extract path', 'Workday → Report Writer (RAAS) → CSV/XLSX export'],
    ['Data classification', 'RESTRICTED — handle as PII; do NOT email; do NOT upload to public locations.'],
    ['PII handling', 'Real customer data must be redacted in Layer 2 BEFORE this file is created. employee_id must be a synthetic / hashed identifier, never a raw worker WID. No names, no emails.'],
    ['Idempotency', 'The Tower ingest is keyed on (client_id, employee_id, as_of_date). Re-running the same extract on the same as-of date will upsert, not duplicate.'],
    ['Workbook contents', isSample
      ? 'SAMPLE-FILLED workbook — Northwind Retail synthetic data. Fictional. Safe to share internally.'
      : 'Empty template. Populate the Data sheet. Read How-to-fill before you start.'],
  ];
  rows.forEach((r, i) => {
    sheet.getRow(i + 1).values = r;
    sheet.getRow(i + 1).getCell(1).font = { bold: true };
  });
  if (isSample) {
    const banner = sheet.getRow(rows.length + 2);
    banner.values = ['SYNTHETIC DATA BANNER', 'Northwind Retail does not exist. All employee IDs (EMP-NW-*) are generated. No real worker data is present.'];
    banner.font = { bold: true, color: { argb: 'FFB91C1C' } };
    banner.getCell(1).fill = {
      type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF2F2' },
    };
    banner.getCell(2).fill = {
      type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF2F2' },
    };
  }
}

function addHowToFillSheet(wb: ExcelJS.Workbook) {
  const sheet = wb.addWorksheet('How to fill');
  sheet.columns = [
    { header: 'column', key: 'column', width: 22 },
    { header: 'required', key: 'required', width: 10 },
    { header: 'type', key: 'type', width: 10 },
    { header: 'PII', key: 'pii', width: 6 },
    { header: 'description', key: 'description', width: 80 },
    { header: 'example', key: 'example', width: 18 },
  ];
  styleHeaderRow(sheet.getRow(1));
  COLUMNS.forEach((c) => {
    const r = sheet.addRow({
      column: c.key,
      required: c.required ? 'yes' : 'no',
      type: c.type,
      pii: c.pii ? 'YES' : '',
      description: c.description,
      example: c.example,
    });
    if (c.pii) {
      r.getCell('pii').font = { bold: true, color: { argb: 'FFB91C1C' } };
      r.getCell('column').font = { bold: true, color: { argb: 'FFB91C1C' } };
    }
  });
  // Trailing note row.
  const note = sheet.addRow({
    column: '',
    required: '',
    type: '',
    pii: '',
    description:
      'Columns marked PII=YES carry restricted data. Real customer extracts MUST pass through Layer-2 redaction before this template is filled. Synthetic IDs only.',
    example: '',
  });
  note.font = { italic: true, color: { argb: 'FFB91C1C' } };
}

function addDataSheet(wb: ExcelJS.Workbook, rows: WorkdayWorkforceRow[]) {
  const sheet = wb.addWorksheet('Data');
  sheet.columns = COLUMNS.map((c) => ({
    header: c.key,
    key: c.key,
    width: Math.max(14, c.key.length + 4),
  }));
  styleHeaderRow(sheet.getRow(1));
  rows.forEach((r) => {
    sheet.addRow({
      employee_id: r.employee_id,
      function: r.function,
      sub_function: r.sub_function ?? '',
      location: r.location ?? '',
      level: r.level ?? '',
      contractor_flag: r.contractor_flag ? 'TRUE' : 'FALSE',
      start_date: r.start_date,
      attrition_date: r.attrition_date ?? '',
      attrition_reason: r.attrition_reason ?? '',
    });
  });
  sheet.views = [{ state: 'frozen', ySplit: 1 }];
}

async function writeWorkbook(path: string, rows: WorkdayWorkforceRow[], isSample: boolean) {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'AbarVa Tower ingest';
  wb.created = new Date('2026-05-30T00:00:00Z');
  wb.title = isSample ? 'Workday HCM — Northwind synthetic sample' : 'Workday HCM — template';
  wb.description = isSample
    ? 'Synthetic Northwind Retail workforce sample. No real worker data.'
    : 'Empty Workday HCM ingest template for Tower.';
  addInstructionsSheet(wb, isSample);
  addHowToFillSheet(wb);
  addDataSheet(wb, rows);
  mkdirSync(dirname(path), { recursive: true });
  await wb.xlsx.writeFile(path);
  console.log(`wrote ${path} (rows=${rows.length})`);
}

async function main() {
  const baseDir = resolve(process.cwd(), 'public/templates/tower/workday-hcm');
  await writeWorkbook(resolve(baseDir, 'template.xlsx'), [], false);
  const sampleRows = generateNorthwindWorkforce({ asOfDate: '2026-05-30' });
  await writeWorkbook(resolve(baseDir, 'sample-filled.xlsx'), sampleRows, true);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
