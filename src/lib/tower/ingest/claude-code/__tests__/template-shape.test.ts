// Tower · Claude Code template shape tests.
//
// Sanity-check the produced workbooks so a generator regression is caught.

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import ExcelJS from 'exceljs';
import { parseClaudeCodeXlsx } from '../parse';
import { validateClaudeCodeRows } from '../validate';
import { findTowerIngestSource } from '../../registry';

const TEMPLATE_DIR = join(process.cwd(), 'public', 'templates', 'tower', 'claude-code');
const TEMPLATE_PATH = join(TEMPLATE_DIR, 'template.xlsx');
const SAMPLE_PATH = join(TEMPLATE_DIR, 'sample-filled.xlsx');

describe('Claude Code template files', () => {
  it('template.xlsx exists with README + Data + Schema sheets', async () => {
    expect(existsSync(TEMPLATE_PATH)).toBe(true);
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(readFileSync(TEMPLATE_PATH) as unknown as ArrayBuffer);
    const names = wb.worksheets.map((ws) => ws.name);
    expect(names).toEqual(expect.arrayContaining(['README', 'Data', 'Schema']));
  });

  it('sample-filled.xlsx parses, validates, and contains 50–500 rows', async () => {
    expect(existsSync(SAMPLE_PATH)).toBe(true);
    const result = await parseClaudeCodeXlsx(readFileSync(SAMPLE_PATH));
    expect(result.rows.length).toBeGreaterThanOrEqual(50);
    expect(result.rows.length).toBeLessThanOrEqual(500);
    const v = validateClaudeCodeRows(result.rows);
    expect(v.ok).toBe(true);
  });

  it('sample-filled.xlsx README sheet carries a synthetic-data banner', async () => {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(readFileSync(SAMPLE_PATH) as unknown as ArrayBuffer);
    const readme = wb.getWorksheet('README');
    expect(readme).toBeDefined();
    let foundBanner = false;
    readme!.eachRow((r) => {
      r.eachCell((cell) => {
        const v = String(cell.value ?? '');
        if (/SYNTHETIC DATA/i.test(v) && /NOT FOR INVOICING/i.test(v)) {
          foundBanner = true;
        }
      });
    });
    expect(foundBanner).toBe(true);
  });

  it('Northwind sample spans ~30 developers across all 12 months', async () => {
    const result = await parseClaudeCodeXlsx(readFileSync(SAMPLE_PATH));
    const devs = new Set(result.rows.map((r) => r.developer_id));
    const periods = new Set(result.rows.map((r) => r.period_start));
    expect(devs.size).toBeGreaterThanOrEqual(20);
    expect(devs.size).toBeLessThanOrEqual(40);
    expect(periods.size).toBe(12);
  });

  it('registry exposes a claude-code entry pointing at the per-developer table and CLI', () => {
    const entry = findTowerIngestSource('claude-code');
    expect(entry).toBeDefined();
    expect(entry?.targetTable).toBe('tower_claude_code_usage');
    expect(entry?.cliScript).toBe('ingest-claude-code');
    expect(entry?.templatePath).toBe('/templates/tower/claude-code/template.xlsx');
  });
});
