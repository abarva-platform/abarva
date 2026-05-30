// Parser unit tests.

import ExcelJS from 'exceljs';
import { parseCopilotWorkbook } from '../parse';
import { buildEmptyTemplateWorkbook, buildSampleFilledWorkbook } from '../template-builder';
import { generateNorthwindCopilotRows } from '../synthetic';
import { COPILOT_COLUMNS } from '../schema';

describe('parseCopilotWorkbook', () => {
  it('parses a workbook built from in-memory rows back into the same rows', async () => {
    const rows = generateNorthwindCopilotRows({ monthsToCover: 2 });
    const wb = buildSampleFilledWorkbook(rows);
    const buf = await wb.xlsx.writeBuffer();
    const wb2 = new ExcelJS.Workbook();
    await wb2.xlsx.load(buf as ArrayBuffer);

    const result = parseCopilotWorkbook(wb2);
    expect(result.rows).toHaveLength(rows.length);
    expect(result.parseErrors).toHaveLength(0);

    // Spot-check first row round-trip.
    const first = result.rows[0];
    expect(first.team).toBe(rows[0].team);
    expect(first.period_start).toBe(rows[0].period_start);
    expect(first.period_end).toBe(rows[0].period_end);
    expect(first.active_users).toBe(rows[0].active_users);
    expect(first.total_suggestions).toBe(rows[0].total_suggestions);
    expect(first.accepted_suggestions).toBe(rows[0].accepted_suggestions);
    expect(first.monthly_cost_usd).toBeCloseTo(rows[0].monthly_cost_usd, 2);
    expect(first.seats_assigned).toBe(rows[0].seats_assigned);
    expect(first.seats_used).toBe(rows[0].seats_used);
  });

  it('parses an empty template as zero rows with no errors', async () => {
    const wb = buildEmptyTemplateWorkbook();
    const buf = await wb.xlsx.writeBuffer();
    const wb2 = new ExcelJS.Workbook();
    await wb2.xlsx.load(buf as ArrayBuffer);
    const result = parseCopilotWorkbook(wb2);
    expect(result.rows).toHaveLength(0);
    expect(result.parseErrors).toHaveLength(0);
  });

  it('derives acceptance_rate_pct when the column is blank', async () => {
    // Build a workbook with a single row and clear the acceptance rate cell.
    const wb = buildEmptyTemplateWorkbook();
    const ws = wb.getWorksheet('Data');
    if (!ws) throw new Error('Data sheet missing');
    const row = ws.getRow(2);
    const cols = COPILOT_COLUMNS.map((c) => c.key);
    const get = (key: string) => cols.indexOf(key as never) + 1;
    row.getCell(get('team')).value = 'Storefront Web';
    row.getCell(get('period_start')).value = '2026-04-01';
    row.getCell(get('period_end')).value = '2026-04-30';
    row.getCell(get('active_users')).value = 10;
    row.getCell(get('total_suggestions')).value = 1000;
    row.getCell(get('accepted_suggestions')).value = 350;
    // leave acceptance_rate_pct blank
    row.getCell(get('monthly_cost_usd')).value = 380;
    row.getCell(get('seats_assigned')).value = 12;
    row.getCell(get('seats_used')).value = 11;
    row.commit();

    const buf = await wb.xlsx.writeBuffer();
    const wb2 = new ExcelJS.Workbook();
    await wb2.xlsx.load(buf as ArrayBuffer);
    const result = parseCopilotWorkbook(wb2);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].acceptance_rate_pct).toBeCloseTo(35.0, 1);
  });

  it('throws when a required column is missing from the Data sheet', async () => {
    const wb = buildEmptyTemplateWorkbook();
    const ws = wb.getWorksheet('Data');
    if (!ws) throw new Error('Data sheet missing');
    ws.getRow(1).getCell(1).value = 'Squad'; // rename "Team" → not recognised
    const buf = await wb.xlsx.writeBuffer();
    const wb2 = new ExcelJS.Workbook();
    await wb2.xlsx.load(buf as ArrayBuffer);
    expect(() => parseCopilotWorkbook(wb2)).toThrow(/Required column missing/);
  });
});
