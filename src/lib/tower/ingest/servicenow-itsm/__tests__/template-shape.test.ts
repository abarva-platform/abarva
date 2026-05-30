// Template shape tests — slice S6.
//
// Builds the workbook in-memory and asserts:
//   · Sheets: Data, How to fill, Schema.
//   · Data sheet header row matches the canonical column order.
//   · Synthetic banner cell is present at row 1.
//   · Sample row count >= 500.

import ExcelJS from 'exceljs';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { buildServiceNowItsmTemplate } from '../../../../../scripts/tower/build-servicenow-itsm-template';
import { ITSM_COLUMN_SPECS } from '../template-schema';

describe('ServiceNow ITSM template workbook', () => {
  let tmp: string;
  let outPath: string;

  beforeAll(async () => {
    tmp = mkdtempSync(join(tmpdir(), 'snow-itsm-template-'));
    outPath = await buildServiceNowItsmTemplate(tmp);
  });

  afterAll(() => {
    rmSync(tmp, { recursive: true, force: true });
  });

  it('contains Data, How to fill, and Schema sheets', async () => {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.readFile(outPath);
    const names = wb.worksheets.map((ws) => ws.name);
    expect(names).toEqual(expect.arrayContaining(['Data', 'How to fill', 'Schema']));
  });

  it('Data sheet header row matches canonical column order', async () => {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.readFile(outPath);
    const ws = wb.getWorksheet('Data');
    expect(ws).toBeDefined();
    if (!ws) return;
    const headerRow = ws.getRow(3);
    const headers: string[] = [];
    headerRow.eachCell({ includeEmpty: false }, (cell) => {
      headers.push(String(cell.value ?? '').trim());
    });
    expect(headers).toEqual(ITSM_COLUMN_SPECS.map((c) => c.label));
  });

  it('row 1 carries a synthetic-data banner', async () => {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.readFile(outPath);
    const ws = wb.getWorksheet('Data');
    expect(ws).toBeDefined();
    if (!ws) return;
    const banner = String(ws.getCell(1, 1).value ?? '');
    expect(banner.toUpperCase()).toContain('SYNTHETIC');
  });

  it('Data sheet ships at least 500 sample records', async () => {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.readFile(outPath);
    const ws = wb.getWorksheet('Data');
    expect(ws).toBeDefined();
    if (!ws) return;
    // rowCount includes empty rows at the tail; count rows that have a non-empty
    // record_number cell, starting at row 4.
    let dataRows = 0;
    for (let r = 4; r <= ws.rowCount; r += 1) {
      const cell = ws.getRow(r).getCell(1).value;
      if (cell != null && String(cell).trim().length > 0) dataRows += 1;
    }
    expect(dataRows).toBeGreaterThanOrEqual(500);
  });
});
