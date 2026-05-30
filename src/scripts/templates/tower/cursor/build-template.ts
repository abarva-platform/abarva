// S4 — Build the empty Cursor team-usage template.xlsx.
//
// 3 sheets:
//   1. Data           — typed columns, header row, data validation (decimal/date).
//   2. How to fill    — operator runbook (export path + paste instructions).
//   3. Schema         — typed column dictionary so an analyst can audit headers.
//
// Output: public/templates/tower/cursor/template.xlsx

import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import ExcelJS from 'exceljs';
import {
  CURSOR_COLUMNS,
  CURSOR_HOWTO_SHEET,
  CURSOR_SCHEMA_SHEET,
  CURSOR_SHEET_NAME,
  CURSOR_TEMPLATE_FILENAME,
  CURSOR_TEMPLATE_VERSION,
  type CursorColumnSpec,
} from '@/lib/tower/ingest/cursor/schema';

const HEADER_FILL = 'FF0A0A0A';
const HEADER_TEXT = 'FFF5F5F0';
const REQUIRED_FILL = 'FF2DD4C8';
const PANEL_FILL = 'FFF8F7F4';

const DEFAULT_OUTPUT = resolve(
  process.cwd(),
  'public/templates/tower/cursor',
  CURSOR_TEMPLATE_FILENAME,
);

function dataValidation(col: CursorColumnSpec): ExcelJS.DataValidation | null {
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
  if (col.type === 'date') {
    return {
      type: 'date',
      allowBlank: !col.required,
      operator: 'greaterThan',
      formulae: [new Date('1990-01-01')],
      showErrorMessage: true,
      errorTitle: `Invalid ${col.label}`,
      error: 'Must be a date (YYYY-MM-DD).',
    };
  }
  return null;
}

function writeDataSheet(wb: ExcelJS.Workbook): void {
  const ws = wb.addWorksheet(CURSOR_SHEET_NAME, {
    views: [{ state: 'frozen', ySplit: 3 }],
  });

  ws.getRow(1).values = [
    `Cursor team usage + cost · one row per team × month · template v${CURSOR_TEMPLATE_VERSION}`,
  ];
  ws.mergeCells(1, 1, 1, CURSOR_COLUMNS.length);
  const titleCell = ws.getRow(1).getCell(1);
  titleCell.font = { bold: true, size: 13, color: { argb: HEADER_TEXT } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_FILL } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  ws.getRow(1).height = 28;

  ws.getRow(2).values = [
    'Required columns are highlighted teal. Cell rules enforce date / non-negative number. Delete this banner before uploading.',
  ];
  ws.mergeCells(2, 1, 2, CURSOR_COLUMNS.length);
  const subCell = ws.getRow(2).getCell(1);
  subCell.font = { italic: true, size: 11, color: { argb: 'FF706D66' } };
  subCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  ws.getRow(2).height = 22;

  ws.getRow(3).values = CURSOR_COLUMNS.map((c) => c.label);
  ws.getRow(3).eachCell((cell, colNumber) => {
    const col = CURSOR_COLUMNS[colNumber - 1];
    cell.font = { bold: true, size: 11, color: { argb: HEADER_TEXT } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: col.required ? REQUIRED_FILL : HEADER_FILL },
    };
    cell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    cell.border = { bottom: { style: 'medium', color: { argb: HEADER_FILL } } };
  });
  ws.getRow(3).height = 26;

  CURSOR_COLUMNS.forEach((col, idx) => {
    const column = ws.getColumn(idx + 1);
    const labelWidth = col.label.length + 4;
    column.width = Math.max(labelWidth, 18);
    const validation = dataValidation(col);
    if (validation) {
      for (let row = 4; row <= 1000; row += 1) {
        ws.getCell(row, idx + 1).dataValidation = validation;
      }
    }
  });
}

function writeHowToSheet(wb: ExcelJS.Workbook): void {
  const ws = wb.addWorksheet(CURSOR_HOWTO_SHEET);
  ws.getColumn(1).width = 4;
  ws.getColumn(2).width = 110;

  const lines: Array<{ text: string; bold?: boolean; size?: number; color?: string }> = [
    { text: 'Cursor team usage + cost — how to fill', bold: true, size: 16 },
    { text: `Template v${CURSOR_TEMPLATE_VERSION} · maintained by AbarVa Control Tower`, color: 'FF706D66' },
    { text: '' },
    { text: 'Step 1 — export usage from Cursor Admin', bold: true, size: 12 },
    { text: 'Sign in at https://cursor.com → Settings → Teams. For each team:' },
    { text: '• Open the Usage tab.' },
    { text: '• Set the date range to the calendar month you are reporting (Day 1 → last day).' },
    { text: '• Click "Export CSV" — this gives you seats_assigned, active_users, completions_shown,' },
    { text: '  completions_accepted for the team for that month.' },
    { text: '' },
    { text: 'Step 2 — pull cost from the billing portal', bold: true, size: 12 },
    { text: 'Settings → Billing → Invoices. Open the invoice for the same month and read the' },
    { text: 'per-team line item. That dollar number is monthly_cost_usd.' },
    { text: '' },
    { text: 'Step 3 — paste into the Data sheet', bold: true, size: 12 },
    { text: 'One row per team × month. Use YYYY-MM-DD for dates. Do not change the header row.' },
    { text: 'Re-uploading the same month is safe — the loader keys on (team, period_start) and' },
    { text: 'overwrites the existing row.' },
    { text: '' },
    { text: 'Cross-checks the loader will enforce', bold: true, size: 12 },
    { text: '• active_users ≤ seats_assigned' },
    { text: '• completions_accepted ≤ completions_shown' },
    { text: '• period_end ≥ period_start' },
    { text: '• team name + period_start must be unique within a single upload' },
    { text: '' },
    { text: 'When to file this', bold: true, size: 12 },
    { text: 'Monthly, within 7 days of the billing close.' },
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
    row.height = line.size && line.size > 13 ? 26 : 18;
  });

  ws.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PANEL_FILL } };
}

function writeSchemaSheet(wb: ExcelJS.Workbook): void {
  const ws = wb.addWorksheet(CURSOR_SCHEMA_SHEET);
  ws.getRow(1).values = ['column', 'required', 'type', 'description', 'example'];
  ws.getRow(1).eachCell((cell) => {
    cell.font = { bold: true, color: { argb: HEADER_TEXT } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_FILL } };
    cell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  });
  ws.getColumn(1).width = 22;
  ws.getColumn(2).width = 12;
  ws.getColumn(3).width = 10;
  ws.getColumn(4).width = 80;
  ws.getColumn(5).width = 26;

  CURSOR_COLUMNS.forEach((col, idx) => {
    const row = ws.getRow(idx + 2);
    row.values = [col.label, col.required ? 'yes' : 'no', col.type, col.description, col.example];
    row.height = 20;
  });
}

export async function buildCursorTemplate(outPath: string = DEFAULT_OUTPUT): Promise<string> {
  mkdirSync(dirname(outPath), { recursive: true });
  const wb = new ExcelJS.Workbook();
  wb.creator = 'AbarVa · Control Tower';
  wb.created = new Date();
  wb.description = `Cursor team usage + cost template v${CURSOR_TEMPLATE_VERSION}`;
  writeDataSheet(wb);
  writeHowToSheet(wb);
  writeSchemaSheet(wb);
  await wb.xlsx.writeFile(outPath);
  return outPath;
}

if (require.main === module) {
  buildCursorTemplate().then((p) => {
    console.log(`[cursor-template] wrote ${p}`);
  });
}
