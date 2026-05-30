import ExcelJS from 'exceljs';
import { parseCursorWorkbook, CursorParseError } from '../parse';
import {
  CURSOR_COLUMNS,
  CURSOR_HEADER_ORDER,
  CURSOR_SHEET_NAME,
} from '../schema';
import { buildSampleRows } from '@/scripts/templates/tower/cursor/build-sample';

async function makeWorkbookBuffer(opts: {
  rows: Array<Record<string, unknown>>;
  banner?: string;
  headerOrder?: string[];
  sheetName?: string;
  missingColumn?: string;
}): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(opts.sheetName ?? CURSOR_SHEET_NAME);
  let nextRow = 1;
  if (opts.banner) {
    ws.getRow(nextRow).getCell(1).value = opts.banner;
    nextRow += 1;
  }
  const headers = (opts.headerOrder ?? CURSOR_HEADER_ORDER.slice()).filter(
    (h) => h !== opts.missingColumn,
  );
  ws.getRow(nextRow).values = headers as ExcelJS.CellValue[];
  const headerRowIdx = nextRow;
  nextRow += 1;
  for (const row of opts.rows) {
    ws.getRow(nextRow).values = headers.map(
      (h) => (row as Record<string, unknown>)[h],
    ) as ExcelJS.CellValue[];
    nextRow += 1;
  }
  void headerRowIdx;
  return Buffer.from(await wb.xlsx.writeBuffer());
}

describe('parseCursorWorkbook', () => {
  test('parses a well-formed workbook with synthetic banner row', async () => {
    const buf = await makeWorkbookBuffer({
      banner: 'SYNTHETIC · do not use as production telemetry',
      rows: [
        {
          team: 'Platform Engineering',
          period_start: '2025-10-01',
          period_end: '2025-10-31',
          seats_assigned: 24,
          active_users: 21,
          completions_shown: 184320,
          completions_accepted: 52608,
          monthly_cost_usd: 960,
        },
        {
          team: 'Store Systems',
          period_start: '2025-10-01',
          period_end: '2025-10-31',
          seats_assigned: 14,
          active_users: 11,
          completions_shown: 92400,
          completions_accepted: 24024,
          monthly_cost_usd: 560,
        },
      ],
    });

    const { rows, warnings } = await parseCursorWorkbook(buf);
    expect(rows).toHaveLength(2);
    expect(warnings).toEqual([]);
    expect(rows[0]).toMatchObject({
      team: 'Platform Engineering',
      period_start: '2025-10-01',
      seats_assigned: 24,
      active_users: 21,
    });
    // Row index reflects ACTUAL source row (banner row = 1, header = 2, first data = 3)
    expect(rows[0]._row_index).toBe(3);
  });

  test('tolerates reordered header columns', async () => {
    const reordered = [
      'period_start',
      'period_end',
      'team',
      'monthly_cost_usd',
      'seats_assigned',
      'active_users',
      'completions_shown',
      'completions_accepted',
    ];
    const buf = await makeWorkbookBuffer({
      headerOrder: reordered,
      rows: [
        {
          team: 'E-Commerce',
          period_start: '2025-11-01',
          period_end: '2025-11-30',
          seats_assigned: 22,
          active_users: 20,
          completions_shown: 200000,
          completions_accepted: 60000,
          monthly_cost_usd: 880,
        },
      ],
    });
    const { rows } = await parseCursorWorkbook(buf);
    expect(rows).toHaveLength(1);
    expect(rows[0].team).toBe('E-Commerce');
    expect(rows[0].seats_assigned).toBe(22);
  });

  test('rejects when a required column is missing', async () => {
    const buf = await makeWorkbookBuffer({
      missingColumn: 'monthly_cost_usd',
      rows: [
        {
          team: 'Platform Engineering',
          period_start: '2025-10-01',
          period_end: '2025-10-31',
          seats_assigned: 24,
          active_users: 21,
          completions_shown: 100,
          completions_accepted: 20,
        },
      ],
    });
    await expect(parseCursorWorkbook(buf)).rejects.toBeInstanceOf(CursorParseError);
  });

  test('rejects a non-YYYY-MM-DD date', async () => {
    const buf = await makeWorkbookBuffer({
      rows: [
        {
          team: 'X',
          period_start: '10/01/2025',
          period_end: '2025-10-31',
          seats_assigned: 1,
          active_users: 1,
          completions_shown: 1,
          completions_accepted: 1,
          monthly_cost_usd: 40,
        },
      ],
    });
    await expect(parseCursorWorkbook(buf)).rejects.toThrow(/YYYY-MM-DD/);
  });

  test('strips fully blank rows', async () => {
    const buf = await makeWorkbookBuffer({
      rows: [
        {
          team: 'A',
          period_start: '2025-10-01',
          period_end: '2025-10-31',
          seats_assigned: 1,
          active_users: 1,
          completions_shown: 100,
          completions_accepted: 25,
          monthly_cost_usd: 40,
        },
        { team: '', period_start: '', period_end: '', seats_assigned: '', active_users: '', completions_shown: '', completions_accepted: '', monthly_cost_usd: '' },
        {
          team: 'B',
          period_start: '2025-10-01',
          period_end: '2025-10-31',
          seats_assigned: 2,
          active_users: 2,
          completions_shown: 200,
          completions_accepted: 50,
          monthly_cost_usd: 80,
        },
      ],
    });
    const { rows } = await parseCursorWorkbook(buf);
    expect(rows.map((r) => r.team)).toEqual(['A', 'B']);
  });

  test('the schema lists exactly 8 columns per the brief', () => {
    expect(CURSOR_COLUMNS.map((c) => c.key)).toEqual([
      'team',
      'period_start',
      'period_end',
      'seats_assigned',
      'active_users',
      'completions_shown',
      'completions_accepted',
      'monthly_cost_usd',
    ]);
  });

  test('parses the generated sample-filled.xlsx end-to-end', async () => {
    // Re-uses the sample generator to produce a deterministic buffer.
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet(CURSOR_SHEET_NAME);
    ws.getRow(1).getCell(1).value = 'SYNTHETIC · Northwind Retail';
    ws.getRow(2).values = CURSOR_HEADER_ORDER.slice() as ExcelJS.CellValue[];
    const sample = buildSampleRows();
    sample.forEach((row, idx) => {
      ws.getRow(idx + 3).values = CURSOR_COLUMNS.map(
        (c) => (row as unknown as Record<string, unknown>)[c.key],
      ) as ExcelJS.CellValue[];
    });
    const buf = Buffer.from(await wb.xlsx.writeBuffer());
    const { rows } = await parseCursorWorkbook(buf);
    expect(rows).toHaveLength(120); // 10 teams × 12 months
    expect(new Set(rows.map((r) => r.team)).size).toBe(10);
  });
});
