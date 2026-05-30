// Parser tests for the GitHub → DORA Tower workbook.
//
// These tests use the committed template / sample-filled workbooks as
// fixtures, so they double as a contract check: if the template builder
// drifts away from the canonical schema, these tests fail before any
// downstream consumer notices.

import path from 'node:path';
import fs from 'node:fs/promises';

import { parseGithubDoraWorkbook } from '../parse';
import { validateGithubDoraRows } from '../validate';
import { GITHUB_DORA_COLUMNS } from '../schema';
import {
  buildSyntheticRows,
  NORTHWIND_TEAMS,
  PERIODS,
} from '@/scripts/tower/templates/build-github-dora-template';

const TEMPLATE_PATH = path.resolve(
  process.cwd(),
  'public/templates/tower/github-dora/template.xlsx',
);
const SAMPLE_PATH = path.resolve(
  process.cwd(),
  'public/templates/tower/github-dora/sample-filled.xlsx',
);

describe('parseGithubDoraWorkbook', () => {
  it('parses the empty template with no rows and no errors', async () => {
    const buffer = await fs.readFile(TEMPLATE_PATH);
    const result = await parseGithubDoraWorkbook(buffer as unknown as Buffer);
    expect(result.errors).toEqual([]);
    expect(result.rows).toEqual([]);
  });

  it('template.xlsx Data sheet exposes exactly the declared schema columns', async () => {
    // Re-import exceljs lazily to keep the test boundary tight.
    const ExcelJS = (await import('exceljs')).default;
    const wb = new ExcelJS.Workbook();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (wb.xlsx as any).load(await fs.readFile(TEMPLATE_PATH));
    const dataSheet = wb.getWorksheet('Data');
    expect(dataSheet).toBeDefined();
    const header = dataSheet!.getRow(1);
    const headers: string[] = [];
    for (let col = 1; col <= header.cellCount; col += 1) {
      const v = header.getCell(col).value;
      headers.push(typeof v === 'string' ? v : String(v ?? ''));
    }
    expect(headers).toEqual([...GITHUB_DORA_COLUMNS]);

    // "How to fill" + "Schema" sheets exist.
    expect(wb.getWorksheet('How to fill')).toBeDefined();
    expect(wb.getWorksheet('Schema')).toBeDefined();
  });

  it('parses the sample-filled workbook with zero errors', async () => {
    const buffer = await fs.readFile(SAMPLE_PATH);
    const result = await parseGithubDoraWorkbook(buffer);
    expect(result.errors).toEqual([]);
    // 12 teams × 12 months = 144 rows.
    expect(result.rows.length).toBe(
      NORTHWIND_TEAMS.length * PERIODS.length,
    );
    expect(result.rows.length).toBeGreaterThanOrEqual(50);
    expect(result.rows.length).toBeLessThanOrEqual(500);
  });

  it('sample-filled rows validate cleanly against the canonical schema', async () => {
    const buffer = await fs.readFile(SAMPLE_PATH);
    const { rows, errors } = await parseGithubDoraWorkbook(buffer);
    expect(errors).toEqual([]);
    const validation = validateGithubDoraRows(rows);
    expect(validation.errors).toEqual([]);
    expect(validation.validRows.length).toBe(rows.length);

    // Spot-check that the parser output matches what the builder
    // would have produced. We compare a small sample so the test
    // doesn't get noisy when builders evolve.
    const synthetic = buildSyntheticRows();
    const first = validation.validRows[0]!;
    const firstSynth = synthetic[0]!;
    expect(first.repo).toBe(firstSynth.repo);
    expect(first.team).toBe(firstSynth.team);
    expect(first.period_start).toBe(firstSynth.period_start);
    expect(first.period_end).toBe(firstSynth.period_end);
    expect(first.deployment_frequency_per_day).toBeCloseTo(
      firstSynth.deployment_frequency_per_day,
      4,
    );
    expect(first.sample_size_deploys).toBe(firstSynth.sample_size_deploys);
  });

  it('skips the SYNTHETIC DATA banner row in the sample-filled workbook', async () => {
    const buffer = await fs.readFile(SAMPLE_PATH);
    const { rows } = await parseGithubDoraWorkbook(buffer);
    // No parsed row should have a repo cell starting with "SYNTHETIC".
    expect(
      rows.find(
        (r) =>
          typeof r.repo === 'string' &&
          r.repo.toUpperCase().startsWith('SYNTHETIC'),
      ),
    ).toBeUndefined();
  });

  it('reports a structural error when the Data sheet is missing', async () => {
    const ExcelJS = (await import('exceljs')).default;
    const wb = new ExcelJS.Workbook();
    wb.addWorksheet('Other'); // no "Data" sheet
    const buf = await wb.xlsx.writeBuffer();
    const result = await parseGithubDoraWorkbook(buf as ArrayBuffer);
    expect(result.rows).toEqual([]);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]!.message).toMatch(/missing required sheet "Data"/);
  });

  it('reports missing-header errors when headers are wrong', async () => {
    const ExcelJS = (await import('exceljs')).default;
    const wb = new ExcelJS.Workbook();
    const sheet = wb.addWorksheet('Data');
    sheet.addRow(['repo', 'team', 'WRONG', 'period_end']); // missing required columns
    sheet.addRow(['x/y', 'eng', '2025-01-01', '2025-01-31']);
    const buf = await wb.xlsx.writeBuffer();
    const result = await parseGithubDoraWorkbook(buf as ArrayBuffer);
    expect(result.rows).toEqual([]);
    expect(result.errors.length).toBeGreaterThan(0);
    const missing = result.errors.map((e) => e.column).sort();
    expect(missing).toContain('period_start');
    expect(missing).toContain('deployment_frequency_per_day');
  });
});
