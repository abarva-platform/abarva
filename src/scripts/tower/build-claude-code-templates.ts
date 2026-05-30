// Tower · Claude Code template generator.
//
// Produces two artefacts under public/templates/tower/claude-code:
//   • template.xlsx       — blank template with header, README, and dropdown.
//   • sample-filled.xlsx  — Northwind Retail synthetic fill (12 months × ~30 devs).
//
// Both workbooks have three sheets:
//   1. README — usage notes + provenance.
//   2. Data — the rows the ingest CLI consumes.
//   3. Schema — column reference (type, required, description).
//
// All numbers in sample-filled.xlsx are synthetic. The README sheet carries a
// prominent "SYNTHETIC DATA — NOT FOR INVOICING" banner.

import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import ExcelJS from 'exceljs';
import { CLAUDE_CODE_COLUMN_ORDER } from '@/lib/tower/ingest/claude-code/types';

const HEADER_FILL = 'FF0A0A0A';
const HEADER_TEXT = 'FFF5F5F0';
const REQUIRED_FILL = 'FF2DD4C8';
const BANNER_FILL = 'FFFFC857';

const COLUMN_META: Record<string, { required: boolean; type: 'string' | 'date' | 'integer' | 'currency'; description: string; example: string }> = {
  team: { required: true, type: 'string', description: 'Squad or product team the developer rolls up to.', example: 'platform-checkout' },
  developer_id: { required: true, type: 'string', description: 'Stable Anthropic Console developer/key ID.', example: 'dev_amaranth_42' },
  period_start: { required: true, type: 'date', description: 'First day of the billing month (YYYY-MM-DD).', example: '2025-06-01' },
  period_end: { required: true, type: 'date', description: 'Last day of the billing month (YYYY-MM-DD).', example: '2025-06-30' },
  sessions: { required: false, type: 'integer', description: 'Number of Claude Code sessions in the period.', example: '184' },
  prompt_tokens: { required: false, type: 'integer', description: 'Total prompt (input) tokens.', example: '850000' },
  output_tokens: { required: false, type: 'integer', description: 'Total output tokens.', example: '420000' },
  monthly_cost_usd: { required: false, type: 'currency', description: 'Monthly USD spend attributed to this developer.', example: '184.50' },
  primary_use_case: { required: false, type: 'string', description: 'Free text: dominant use category for the period.', example: 'feature_development' },
};

function writeReadme(wb: ExcelJS.Workbook, opts: { synthetic: boolean; rowCount: number }) {
  const ws = wb.addWorksheet('README', { views: [{ state: 'normal' }] });
  ws.getColumn(1).width = 4;
  ws.getColumn(2).width = 110;

  const lines: Array<{ text: string; bold?: boolean; size?: number; color?: string; fill?: string }> = [
    { text: 'AbarVa Tower · Claude Code Per-Developer Usage', bold: true, size: 16 },
    { text: 'Source: Anthropic Console → Usage (org admin) + per-API-key tagging.' },
    { text: '' },
  ];
  if (opts.synthetic) {
    lines.push({
      text: 'SYNTHETIC DATA — NOT FOR INVOICING. Generated for product demo only.',
      bold: true,
      size: 12,
      color: 'FF7A1A1A',
      fill: BANNER_FILL,
    });
    lines.push({ text: '' });
  }
  lines.push(
    { text: 'How to use this workbook', bold: true, size: 13 },
    { text: '1. Open the Data sheet.' },
    { text: '2. Replace example rows with your own Claude Code export.' },
    { text: '3. Required columns: team, developer_id, period_start, period_end.' },
    { text: '4. Save and feed to ingest CLI:' },
    { text: '     npx tsx src/scripts/tower/ingest-claude-code.ts --file <path> --tenant <client-key>' },
    { text: '   Add --dry-run to preview without writing.' },
    { text: '' },
    { text: 'Idempotency', bold: true, size: 13 },
    { text: 'Re-running the same file is a no-op. The CLI upserts on the natural key' },
    { text: '(tool, tenant_client_key, developer_id, period_start).' },
    { text: '' },
    { text: 'Where to get the data', bold: true, size: 13 },
    { text: '· Anthropic Console → Usage tab (org admin view).' },
    { text: '· Pivot by API key, then map each key → developer/team in your IAM.' },
    { text: '· Export monthly; one row per developer × month.' },
    { text: '' },
    { text: `Rows in this Data sheet: ${opts.rowCount}`, color: 'FF706D66' },
  );

  lines.forEach((line, idx) => {
    const row = ws.getRow(idx + 2);
    const cell = row.getCell(2);
    cell.value = line.text;
    cell.font = {
      bold: !!line.bold,
      size: line.size ?? 11,
      color: { argb: line.color ?? 'FF0A0A0A' },
    };
    if (line.fill) {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: line.fill } };
    }
    cell.alignment = { vertical: 'middle', horizontal: 'left' };
    row.height = line.size && line.size > 13 ? 30 : 20;
  });
}

function writeSchema(wb: ExcelJS.Workbook) {
  const ws = wb.addWorksheet('Schema');
  ws.columns = [
    { header: 'column', key: 'column', width: 20 },
    { header: 'required', key: 'required', width: 10 },
    { header: 'type', key: 'type', width: 12 },
    { header: 'description', key: 'description', width: 60 },
    { header: 'example', key: 'example', width: 22 },
  ];
  ws.getRow(1).eachCell((cell) => {
    cell.font = { bold: true, color: { argb: HEADER_TEXT } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_FILL } };
  });
  for (const col of CLAUDE_CODE_COLUMN_ORDER) {
    const meta = COLUMN_META[col];
    ws.addRow({
      column: col,
      required: meta.required ? 'yes' : 'no',
      type: meta.type,
      description: meta.description,
      example: meta.example,
    });
  }
}

interface SampleRow {
  team: string;
  developer_id: string;
  period_start: string;
  period_end: string;
  sessions: number;
  prompt_tokens: number;
  output_tokens: number;
  monthly_cost_usd: number;
  primary_use_case: string;
}

function writeDataSheet(wb: ExcelJS.Workbook, rows: SampleRow[]) {
  const ws = wb.addWorksheet('Data', {
    views: [{ state: 'frozen', ySplit: 1 }],
  });
  ws.columns = CLAUDE_CODE_COLUMN_ORDER.map((c) => ({
    header: c,
    key: c,
    width: Math.max(c.length + 4, 16),
  }));
  ws.getRow(1).eachCell((cell, colNumber) => {
    const col = CLAUDE_CODE_COLUMN_ORDER[colNumber - 1];
    const required = COLUMN_META[col].required;
    cell.font = { bold: true, color: { argb: HEADER_TEXT } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: required ? REQUIRED_FILL : HEADER_FILL },
    };
  });
  for (const row of rows) ws.addRow(row);

  // Apply numeric format for currency.
  ws.getColumn('monthly_cost_usd').numFmt = '"$"#,##0.00';
  ws.getColumn('sessions').numFmt = '#,##0';
  ws.getColumn('prompt_tokens').numFmt = '#,##0';
  ws.getColumn('output_tokens').numFmt = '#,##0';
}

// Deterministic PRNG so re-running generation produces byte-stable output.
function mulberry32(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildNorthwindSample(): SampleRow[] {
  const rand = mulberry32(20260530);
  const teams = [
    'platform-checkout',
    'inventory-svc',
    'customer-loyalty',
    'data-platform',
    'mobile-shopper',
    'merchant-tools',
    'fulfillment-ops',
  ];
  const useCases = [
    'feature_development',
    'bug_fix',
    'refactor',
    'tests',
    'code_review',
    'documentation',
    'data_pipeline',
  ];
  // ~30 developers across teams.
  const developers: Array<{ team: string; id: string }> = [];
  let devCounter = 1;
  for (const team of teams) {
    const headcount = 3 + Math.floor(rand() * 3); // 3–5 per team
    for (let i = 0; i < headcount; i += 1) {
      developers.push({ team, id: `nw_dev_${String(devCounter).padStart(3, '0')}` });
      devCounter += 1;
    }
  }
  const months: Array<{ start: string; end: string }> = [];
  for (let m = 0; m < 12; m += 1) {
    // Jun 2025 → May 2026 inclusive.
    const date = new Date(Date.UTC(2025, 5 + m, 1));
    const next = new Date(Date.UTC(2025, 5 + m + 1, 1));
    const end = new Date(next.getTime() - 86_400_000);
    months.push({
      start: date.toISOString().slice(0, 10),
      end: end.toISOString().slice(0, 10),
    });
  }
  const rows: SampleRow[] = [];
  for (const dev of developers) {
    // Pick a baseline activity tier.
    const tier = rand();
    const baseTokens = tier < 0.25 ? 250_000 : tier < 0.75 ? 1_200_000 : 3_000_000;
    for (const m of months) {
      // Ramp: cooler early months, busier mid-year, cool around holidays.
      const monthIdx = months.indexOf(m);
      const ramp = 0.55 + 0.6 * Math.sin((monthIdx / 12) * Math.PI);
      const noise = 0.7 + rand() * 0.6;
      const prompt = Math.round(baseTokens * ramp * noise);
      const output = Math.round(prompt * (0.35 + rand() * 0.25));
      const sessions = Math.round(40 + rand() * 220);
      // Loose anchor: ~$3 per 1M input + $15 per 1M output tokens.
      const cost = (prompt / 1_000_000) * 3 + (output / 1_000_000) * 15;
      rows.push({
        team: dev.team,
        developer_id: dev.id,
        period_start: m.start,
        period_end: m.end,
        sessions,
        prompt_tokens: prompt,
        output_tokens: output,
        monthly_cost_usd: Math.round(cost * 100) / 100,
        primary_use_case: useCases[Math.floor(rand() * useCases.length)],
      });
    }
  }
  return rows;
}

function buildTemplateRows(): SampleRow[] {
  // Three example rows kept in the blank template to anchor the format.
  return [
    {
      team: 'platform-checkout',
      developer_id: 'dev_example_001',
      period_start: '2025-06-01',
      period_end: '2025-06-30',
      sessions: 184,
      prompt_tokens: 850_000,
      output_tokens: 420_000,
      monthly_cost_usd: 8.85,
      primary_use_case: 'feature_development',
    },
    {
      team: 'data-platform',
      developer_id: 'dev_example_002',
      period_start: '2025-06-01',
      period_end: '2025-06-30',
      sessions: 96,
      prompt_tokens: 410_000,
      output_tokens: 180_000,
      monthly_cost_usd: 3.93,
      primary_use_case: 'data_pipeline',
    },
    {
      team: 'merchant-tools',
      developer_id: 'dev_example_003',
      period_start: '2025-06-01',
      period_end: '2025-06-30',
      sessions: 312,
      prompt_tokens: 2_100_000,
      output_tokens: 980_000,
      monthly_cost_usd: 21.0,
      primary_use_case: 'refactor',
    },
  ];
}

async function buildWorkbook(rows: SampleRow[], synthetic: boolean, outPath: string) {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'AbarVa · Tower';
  wb.created = new Date('2026-05-30T00:00:00Z');
  wb.description = synthetic
    ? 'Synthetic Northwind Retail Claude Code usage sample (NOT FOR INVOICING).'
    : 'AbarVa Tower · Claude Code per-developer usage template.';

  writeReadme(wb, { synthetic, rowCount: rows.length });
  writeDataSheet(wb, rows);
  writeSchema(wb);

  await wb.xlsx.writeFile(outPath);
}

async function main() {
  const outDir = join(process.cwd(), 'public', 'templates', 'tower', 'claude-code');
  mkdirSync(outDir, { recursive: true });

  const templatePath = join(outDir, 'template.xlsx');
  await buildWorkbook(buildTemplateRows(), false, templatePath);
  console.log(`  wrote ${templatePath}`);

  const samplePath = join(outDir, 'sample-filled.xlsx');
  const sampleRows = buildNorthwindSample();
  await buildWorkbook(sampleRows, true, samplePath);
  console.log(`  wrote ${samplePath} (${sampleRows.length} rows)`);
}

main().catch((err) => {
  console.error('FAILED:', err);
  process.exit(1);
});
