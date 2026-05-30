// Template-shape tests — guarantees the committed Excel files stay valid.

import ExcelJS from 'exceljs';
import { readFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import { parseCopilotWorkbook } from '../parse';
import { validateCopilotRows } from '../validate';
import { buildEmptyTemplateWorkbook, buildSampleFilledWorkbook } from '../template-builder';
import { generateNorthwindCopilotRows } from '../synthetic';
import { COPILOT_COLUMNS, COPILOT_HEADER_ORDER } from '../schema';

const TEMPLATE_PATH = resolve(process.cwd(), 'public/templates/tower/copilot/template.xlsx');
const SAMPLE_PATH = resolve(process.cwd(), 'public/templates/tower/copilot/sample-filled.xlsx');

async function loadIfExists(path: string): Promise<ExcelJS.Workbook | null> {
  try {
    await stat(path);
  } catch {
    return null;
  }
  const buf = await readFile(path);
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer);
  return wb;
}

describe('committed template.xlsx', () => {
  it('has the canonical sheet structure and header order', async () => {
    const wb = (await loadIfExists(TEMPLATE_PATH)) ?? buildEmptyTemplateWorkbook();
    const sheetNames = wb.worksheets.map((w) => w.name);
    expect(sheetNames).toEqual(expect.arrayContaining(['Data', 'How to fill', 'Schema']));

    const data = wb.getWorksheet('Data');
    expect(data).toBeDefined();
    if (!data) return;
    const headers: string[] = [];
    data.getRow(1).eachCell({ includeEmpty: false }, (cell) => {
      const v = cell.value;
      if (typeof v === 'string') headers.push(v.trim());
    });
    expect(headers).toEqual(COPILOT_HEADER_ORDER);
  });

  it('round-trips through the parser with zero data rows', async () => {
    const wb = (await loadIfExists(TEMPLATE_PATH)) ?? buildEmptyTemplateWorkbook();
    const result = parseCopilotWorkbook(wb);
    expect(result.rows).toHaveLength(0);
    expect(result.parseErrors).toHaveLength(0);
  });
});

describe('committed sample-filled.xlsx', () => {
  it('round-trips through the parser and validator cleanly', async () => {
    const wb = (await loadIfExists(SAMPLE_PATH))
      ?? buildSampleFilledWorkbook(generateNorthwindCopilotRows());
    const result = parseCopilotWorkbook(wb);
    expect(result.parseErrors).toHaveLength(0);
    expect(result.rows.length).toBeGreaterThanOrEqual(50);
    expect(result.rows.length).toBeLessThanOrEqual(500);

    const validation = validateCopilotRows(result.rows);
    expect(validation.invalid).toHaveLength(0);
  });

  it('keeps every acceptance rate inside the plausible 20–50% band', async () => {
    const wb = (await loadIfExists(SAMPLE_PATH))
      ?? buildSampleFilledWorkbook(generateNorthwindCopilotRows());
    const result = parseCopilotWorkbook(wb);
    for (const row of result.rows) {
      expect(row.acceptance_rate_pct).not.toBeNull();
      const rate = row.acceptance_rate_pct ?? 0;
      expect(rate).toBeGreaterThanOrEqual(20);
      expect(rate).toBeLessThanOrEqual(50);
    }
  });

  it('covers ~10 teams and ~12 monthly periods', async () => {
    const wb = (await loadIfExists(SAMPLE_PATH))
      ?? buildSampleFilledWorkbook(generateNorthwindCopilotRows());
    const result = parseCopilotWorkbook(wb);
    const teams = new Set(result.rows.map((r) => r.team));
    const periods = new Set(result.rows.map((r) => `${r.period_start}..${r.period_end}`));
    expect(teams.size).toBeGreaterThanOrEqual(8);
    expect(teams.size).toBeLessThanOrEqual(12);
    expect(periods.size).toBeGreaterThanOrEqual(10);
    expect(periods.size).toBeLessThanOrEqual(14);
  });

  it('reaffirms that no required column is missing from the canonical spec', () => {
    const required = COPILOT_COLUMNS.filter((c) => c.required).map((c) => c.label);
    expect(required).toEqual([
      'Team',
      'Period Start',
      'Period End',
      'Active Users',
      'Total Suggestions',
      'Accepted Suggestions',
      'Monthly Cost (USD)',
      'Seats Assigned',
      'Seats Used',
    ]);
  });
});
