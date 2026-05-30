// Build the ServiceNow ITSM bundle template (.xlsx) for the Tower onboarding
// surface. Sheets: Data (synthetic Northwind sample) · How to fill · Schema.
//
// Run:
//   npx tsx src/scripts/tower/build-servicenow-itsm-template.ts
//
// Writes to public/templates/tower/servicenow-itsm/template.xlsx.

import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import ExcelJS from 'exceljs';

import {
  ITSM_COLUMN_SPECS,
  ITSM_TEMPLATE_VERSION,
  type ItsmColumnSpec,
} from '../../lib/tower/ingest/servicenow-itsm/template-schema';
import {
  SYNTHETIC_BANNER,
  buildNorthwindSampleRecords,
} from '../../lib/tower/ingest/servicenow-itsm/sample';
import type { ItsmRecord } from '../../lib/tower/ingest/servicenow-itsm/types';

const HEADER_FILL = 'FF0A0A0A';
const HEADER_TEXT = 'FFF5F5F0';
const REQUIRED_FILL = 'FF2DD4C8';
const BANNER_FILL = 'FFFFF1B8';

function dataValidationFor(col: ItsmColumnSpec): ExcelJS.DataValidation | null {
  if (col.type === 'enum' && col.enumValues) {
    return {
      type: 'list',
      allowBlank: !col.required,
      formulae: [`"${col.enumValues.join(',')}"`],
      showErrorMessage: true,
      errorTitle: `Invalid ${col.label}`,
      error: `Must be one of: ${col.enumValues.join(', ')}`,
    };
  }
  if (col.type === 'number') {
    return {
      type: 'decimal',
      allowBlank: !col.required,
      operator: 'greaterThanOrEqual',
      formulae: [0],
      showErrorMessage: true,
      errorTitle: `Invalid ${col.label}`,
      error: 'Must be a non-negative number.',
    };
  }
  return null;
}

function rowValueFor(col: ItsmColumnSpec, record: ItsmRecord): string {
  const raw = (record as unknown as Record<string, unknown>)[col.key];
  if (raw == null) return '';
  if (typeof raw === 'boolean') return raw ? 'true' : 'false';
  return String(raw);
}

function writeDataSheet(wb: ExcelJS.Workbook, records: ItsmRecord[]): void {
  const ws = wb.addWorksheet('Data', { views: [{ state: 'frozen', ySplit: 3 }] });
  const cols = ITSM_COLUMN_SPECS;

  ws.getRow(1).values = [SYNTHETIC_BANNER];
  ws.mergeCells(1, 1, 1, cols.length);
  const banner = ws.getRow(1).getCell(1);
  banner.value = SYNTHETIC_BANNER;
  banner.font = { bold: true, size: 11, color: { argb: 'FF6B5300' } };
  banner.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BANNER_FILL } };
  banner.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true, indent: 1 };
  ws.getRow(1).height = 36;

  ws.getRow(2).values = [
    `ServiceNow ITSM bundle · template v${ITSM_TEMPLATE_VERSION} · required columns highlighted teal`,
  ];
  ws.mergeCells(2, 1, 2, cols.length);
  const sub = ws.getRow(2).getCell(1);
  sub.font = { italic: true, size: 11, color: { argb: 'FF706D66' } };
  sub.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  ws.getRow(2).height = 22;

  ws.getRow(3).values = cols.map((c) => c.label);
  ws.getRow(3).eachCell((cell, colNumber) => {
    const col = cols[colNumber - 1];
    cell.font = { bold: true, size: 11, color: { argb: HEADER_TEXT } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: col.required ? REQUIRED_FILL : HEADER_FILL },
    };
    cell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  });
  ws.getRow(3).height = 26;

  records.forEach((rec, idx) => {
    const row = ws.getRow(4 + idx);
    row.values = cols.map((c) => rowValueFor(c, rec));
  });

  cols.forEach((col, idx) => {
    const column = ws.getColumn(idx + 1);
    column.width = Math.max(col.label.length + 4, 16);
    const validation = dataValidationFor(col);
    if (validation) {
      const lastRow = 4 + records.length + 50; // headroom for additions
      for (let r = 4; r <= lastRow; r += 1) {
        ws.getCell(r, idx + 1).dataValidation = validation;
      }
    }
  });
}

function writeHowToFillSheet(wb: ExcelJS.Workbook): void {
  const ws = wb.addWorksheet('How to fill', { views: [{ state: 'normal' }] });
  ws.getColumn(1).width = 4;
  ws.getColumn(2).width = 110;

  const lines: Array<{ text: string; bold?: boolean; size?: number; color?: string }> = [
    { text: 'ServiceNow ITSM · How to fill', bold: true, size: 16 },
    { text: `Template v${ITSM_TEMPLATE_VERSION}`, size: 11, color: 'FF706D66' },
    { text: '' },
    { text: '1. Replace the sample rows', bold: true, size: 13 },
    { text: 'The Data sheet ships with synthetic records for "Northwind Retail" so the' },
    { text: 'workbook is testable end-to-end. Delete every sample row before uploading' },
    { text: 'real data — the synthetic banner row stays at the top.' },
    { text: '' },
    { text: '2. Source the extract from ServiceNow', bold: true, size: 13 },
    { text: 'Three options, by ease of access:' },
    { text: '   a. Scheduled CSV export from the incident / problem / change tables.' },
    { text: '   b. Table API: /api/now/table/incident, /api/now/table/problem, /api/now/table/change_request' },
    { text: '   c. Reports → Export → CSV for a custom view spanning the past 90 days.' },
    { text: 'Concatenate the three table extracts into the Data sheet — one row per record.' },
    { text: '' },
    { text: '3. Field mapping (ServiceNow → template column)', bold: true, size: 13 },
    { text: '   number              → record_number' },
    { text: '   sys_class_name      → record_type   (incident | problem | change_request)' },
    { text: '   priority            → priority      ("1"-"4" or "P1"-"P4")' },
    { text: '   business_service    → service' },
    { text: '   assignment_group    → assignment_group' },
    { text: '   opened_at           → opened_at     (ISO8601 UTC preferred)' },
    { text: '   closed_at           → closed_at     (blank if still open)' },
    { text: '   calendar_duration   → mttr_minutes  (or leave blank; computed from timestamps)' },
    { text: '   close_code          → change_success (only for change_request rows)' },
    { text: '' },
    { text: '4. Validation rules', bold: true, size: 13 },
    { text: '· priority must be P1, P2, P3, or P4.' },
    { text: '· record_type must be incident, problem, or change.' },
    { text: '· opened_at is required and must be a valid date.' },
    { text: '· closed_at, when present, must be on or after opened_at.' },
    { text: '· mttr_minutes is computed if blank and both timestamps are present.' },
    { text: '· change_success applies only to change records — left blank for incident/problem.' },
    { text: '' },
    { text: '5. Upload', bold: true, size: 13 },
    { text: 'Drop the workbook into the Tower upload zone. The parser routes the Data sheet' },
    { text: 'into the tower_itsm_records table and reports any row-level errors back to you.' },
  ];

  lines.forEach((line, idx) => {
    const row = ws.getRow(idx + 2);
    const cell = row.getCell(2);
    cell.value = line.text;
    cell.font = {
      bold: !!line.bold,
      size: line.size ?? 11,
      color: { argb: line.color ?? 'FF0A0A0A' },
    };
    cell.alignment = { vertical: 'middle', horizontal: 'left' };
    row.height = line.size && line.size > 13 ? 28 : 18;
  });
}

function writeSchemaSheet(wb: ExcelJS.Workbook): void {
  const ws = wb.addWorksheet('Schema', { views: [{ state: 'normal' }] });
  ws.columns = [
    { header: 'column', key: 'column', width: 22 },
    { header: 'type', key: 'type', width: 12 },
    { header: 'required', key: 'required', width: 12 },
    { header: 'enum / format', key: 'enum', width: 28 },
    { header: 'description', key: 'description', width: 64 },
    { header: 'example', key: 'example', width: 24 },
  ];
  ws.getRow(1).eachCell((cell) => {
    cell.font = { bold: true, color: { argb: HEADER_TEXT } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_FILL } };
    cell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  });
  ITSM_COLUMN_SPECS.forEach((col) => {
    ws.addRow({
      column: col.label,
      type: col.type,
      required: col.required ? 'yes' : 'no',
      enum: col.enumValues ? col.enumValues.join(' | ') : col.type === 'date' ? 'ISO8601' : '',
      description: col.description,
      example: col.example,
    });
  });
}

export async function buildServiceNowItsmTemplate(outDir: string): Promise<string> {
  mkdirSync(outDir, { recursive: true });
  const records = buildNorthwindSampleRecords();

  const wb = new ExcelJS.Workbook();
  wb.creator = 'AbarVa · Tower · ServiceNow ITSM';
  wb.created = new Date();
  wb.description = `AbarVa Tower · ServiceNow ITSM template v${ITSM_TEMPLATE_VERSION}`;

  writeDataSheet(wb, records);
  writeHowToFillSheet(wb);
  writeSchemaSheet(wb);

  const outPath = join(outDir, 'template.xlsx');
  await wb.xlsx.writeFile(outPath);
  return outPath;
}

async function main(): Promise<void> {
  const outDir = join(process.cwd(), 'public', 'templates', 'tower', 'servicenow-itsm');
  const path = await buildServiceNowItsmTemplate(outDir);
  console.log(`  wrote ${path}`);
}

if (require.main === module) {
  main().catch((err) => {
    console.error('FAILED:', err);
    process.exit(1);
  });
}
