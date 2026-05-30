import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import ExcelJS from 'exceljs';
import {
  CURSOR_COLUMNS,
  CURSOR_HEADER_ORDER,
  CURSOR_HOWTO_SHEET,
  CURSOR_SCHEMA_SHEET,
  CURSOR_SHEET_NAME,
} from '../schema';
import { parseCursorWorkbook } from '../parse';
import { validateCursorRows } from '../validate';

const TEMPLATE = resolve(
  process.cwd(),
  'public/templates/tower/cursor/template.xlsx',
);
const SAMPLE = resolve(
  process.cwd(),
  'public/templates/tower/cursor/sample-filled.xlsx',
);

describe('Cursor template artifacts', () => {
  test('template.xlsx exists with the three required sheets', async () => {
    expect(existsSync(TEMPLATE)).toBe(true);
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(readFileSync(TEMPLATE) as unknown as ArrayBuffer);
    const sheets = wb.worksheets.map((w) => w.name);
    expect(sheets).toEqual(
      expect.arrayContaining([CURSOR_SHEET_NAME, CURSOR_HOWTO_SHEET, CURSOR_SCHEMA_SHEET]),
    );
  });

  test('template Data sheet has all 8 columns in canonical order', async () => {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(readFileSync(TEMPLATE) as unknown as ArrayBuffer);
    const ws = wb.getWorksheet(CURSOR_SHEET_NAME)!;
    const headers: string[] = [];
    ws.getRow(3).eachCell((cell, colNumber) => {
      headers[colNumber - 1] = String(cell.value ?? '');
    });
    expect(headers.filter(Boolean)).toEqual(CURSOR_HEADER_ORDER);
  });

  test('sample-filled.xlsx parses + validates with 120 valid rows', async () => {
    expect(existsSync(SAMPLE)).toBe(true);
    const { rows } = await parseCursorWorkbook(readFileSync(SAMPLE));
    expect(rows).toHaveLength(120);
    const { valid, issues } = validateCursorRows(rows);
    const errors = issues.filter((i) => i.severity === 'error');
    expect(errors).toEqual([]); // zero errors in the canonical sample
    expect(valid).toHaveLength(120);
  });

  test('sample carries the synthetic-data banner row', async () => {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(readFileSync(SAMPLE) as unknown as ArrayBuffer);
    const ws = wb.getWorksheet(CURSOR_SHEET_NAME)!;
    const banner = String(ws.getRow(1).getCell(1).value ?? '');
    expect(banner.toLowerCase()).toContain('synthetic');
  });

  test('every column carries an example value (no empty examples)', () => {
    for (const col of CURSOR_COLUMNS) {
      expect(col.example).not.toBe('');
    }
  });
});
