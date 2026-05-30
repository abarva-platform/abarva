// Tower · Claude Code parser tests.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import ExcelJS from 'exceljs';
import { parseClaudeCodeCsv, parseClaudeCodeXlsx } from '../parse';

function fixturesPath(filename: string): string {
  return join(process.cwd(), 'public', 'templates', 'tower', 'claude-code', filename);
}

describe('parseClaudeCodeCsv', () => {
  it('parses a minimal well-formed CSV', () => {
    const csv = [
      'team,developer_id,period_start,period_end,sessions,prompt_tokens,output_tokens,monthly_cost_usd,primary_use_case',
      'platform,dev_a,2025-06-01,2025-06-30,100,500000,200000,5.50,feature_development',
      'platform,dev_b,2025-06-01,2025-06-30,40,200000,90000,2.10,bug_fix',
    ].join('\n');
    const result = parseClaudeCodeCsv(csv);
    expect(result.rows).toHaveLength(2);
    expect(result.rows[0]).toMatchObject({
      team: 'platform',
      developer_id: 'dev_a',
      period_start: '2025-06-01',
      period_end: '2025-06-30',
      sessions: 100,
      prompt_tokens: 500_000,
      output_tokens: 200_000,
      monthly_cost_usd: 5.5,
      primary_use_case: 'feature_development',
    });
  });

  it('accepts common header aliases (input_tokens → prompt_tokens, user_id → developer_id)', () => {
    const csv = [
      'team_name,user_id,start,end,session_count,input_tokens,completion_tokens,cost_usd,use_case',
      'platform,dev_x,2025-06-01,2025-06-30,12,100000,40000,1.10,tests',
    ].join('\n');
    const result = parseClaudeCodeCsv(csv);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].developer_id).toBe('dev_x');
    expect(result.rows[0].prompt_tokens).toBe(100_000);
    expect(result.rows[0].output_tokens).toBe(40_000);
    expect(result.rows[0].monthly_cost_usd).toBe(1.1);
  });

  it('emits a warning on missing required column', () => {
    const csv = ['developer_id,period_start,period_end', 'dev_x,2025-06-01,2025-06-30'].join('\n');
    const result = parseClaudeCodeCsv(csv);
    expect(result.rows).toHaveLength(0);
    expect(result.warnings.some((w) => /missing required column/.test(w))).toBe(true);
  });

  it('strips currency/commas from numeric values', () => {
    const csv = [
      'team,developer_id,period_start,period_end,sessions,prompt_tokens,output_tokens,monthly_cost_usd',
      'platform,dev_a,2025-06-01,2025-06-30,"100","1,200,000","450,000","$32.75"',
    ].join('\n');
    const result = parseClaudeCodeCsv(csv);
    expect(result.rows[0].prompt_tokens).toBe(1_200_000);
    expect(result.rows[0].output_tokens).toBe(450_000);
    expect(result.rows[0].monthly_cost_usd).toBe(32.75);
  });
});

describe('parseClaudeCodeXlsx', () => {
  it('parses the generated sample-filled workbook', async () => {
    const buf = readFileSync(fixturesPath('sample-filled.xlsx'));
    const result = await parseClaudeCodeXlsx(buf);
    expect(result.warnings).toHaveLength(0);
    // Sample is 28 devs × 12 months = 336 rows.
    expect(result.rows.length).toBeGreaterThanOrEqual(50);
    expect(result.rows.length).toBeLessThanOrEqual(500);
    for (const row of result.rows.slice(0, 5)) {
      expect(row.developer_id).toMatch(/^nw_dev_\d{3}$/);
      expect(row.period_start).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(row.period_end).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it('locates the Data sheet even when README/Schema sheets precede it', async () => {
    const wb = new ExcelJS.Workbook();
    wb.addWorksheet('README');
    const data = wb.addWorksheet('Data');
    data.columns = [
      { header: 'team', key: 'team' },
      { header: 'developer_id', key: 'developer_id' },
      { header: 'period_start', key: 'period_start' },
      { header: 'period_end', key: 'period_end' },
      { header: 'sessions', key: 'sessions' },
    ];
    data.addRow({
      team: 'platform',
      developer_id: 'dev_y',
      period_start: '2025-07-01',
      period_end: '2025-07-31',
      sessions: 12,
    });
    wb.addWorksheet('Schema');
    const buf = (await wb.xlsx.writeBuffer()) as ArrayBuffer;
    const result = await parseClaudeCodeXlsx(buf);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].developer_id).toBe('dev_y');
  });
});
