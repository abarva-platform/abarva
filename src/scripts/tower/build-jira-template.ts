/**
 * Build the sample-filled Jira ingest workbook at
 * `public/templates/tower/jira/template.xlsx` plus a sibling `template.csv`
 * for git-diff readability.
 *
 * Run with:  npx tsx src/scripts/tower/build-jira-template.ts
 *
 * The workbook is intentionally **sample-filled** with synthetic Northwind
 * Retail data (~800 issues across ~10 teams over the past 90 days). The
 * banner row and the README in `docs/templates/tower/jira/README.md` both
 * mark the data as synthetic so a CIO doesn't think the file is theirs.
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import ExcelJS from 'exceljs';
import {
  buildNorthwindSampleRows,
  type SampleRow,
} from '@/lib/tower/ingest/jira/northwind-sample';
import {
  JIRA_ISSUE_TYPES,
  JIRA_STATUSES,
  JIRA_TEMPLATE_COLUMNS,
} from '@/lib/tower/ingest/jira/parse';

const HEADER_FILL = 'FF0A0A0A';
const HEADER_TEXT = 'FFF5F5F0';
const REQUIRED_FILL = 'FF2DD4C8';
const BANNER_FILL = 'FFFFF4CC';

const REQUIRED = new Set([
  'issue_key',
  'issue_type',
  'team',
  'status',
  'created_at',
]);

const COLUMN_DESCRIPTIONS: Record<string, string> = {
  issue_key: 'Jira issue key (e.g. NW-42). Format: ABC-123. REQUIRED.',
  issue_type: 'One of Epic|Story|Bug|Task. REQUIRED.',
  epic_key: 'Parent epic key (REQUIRED for Story rows). Must be an Epic in this file.',
  team: 'Team or squad name. REQUIRED.',
  status: 'One of Backlog|To Do|In Progress|In Review|Blocked|Done|Cancelled. REQUIRED.',
  story_points: 'Integer >= 0. Optional.',
  created_at: 'ISO-8601 (YYYY-MM-DD or full timestamp). REQUIRED.',
  started_at: 'ISO-8601 when issue moved to In Progress. Optional.',
  completed_at: 'ISO-8601 when issue moved to Done. Optional.',
  cycle_time_hours: 'Numeric hours from started_at to completed_at. Optional.',
};

function writeIssuesSheet(wb: ExcelJS.Workbook, rows: SampleRow[]) {
  const ws = wb.addWorksheet('Issues', { views: [{ state: 'frozen', ySplit: 3 }] });
  const cols = JIRA_TEMPLATE_COLUMNS as readonly string[];

  // Row 1: synthetic-data banner. Critical — CIOs scanning the sheet must
  // know at a glance these issue keys are NOT theirs.
  ws.getRow(1).values = [
    'SYNTHETIC SAMPLE DATA — Northwind Retail (fictional). Replace before uploading your own Jira extract. See docs/templates/tower/jira/README.md.',
  ];
  ws.mergeCells(1, 1, 1, cols.length);
  const bannerCell = ws.getRow(1).getCell(1);
  bannerCell.font = { bold: true, size: 12, color: { argb: 'FF8B5E00' } };
  bannerCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BANNER_FILL } };
  bannerCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  ws.getRow(1).height = 32;

  // Row 2: column-help subline.
  ws.getRow(2).values = [
    `Required columns highlighted teal · ${cols.length} columns · ${rows.length} sample rows`,
  ];
  ws.mergeCells(2, 1, 2, cols.length);
  const subCell = ws.getRow(2).getCell(1);
  subCell.font = { italic: true, size: 11, color: { argb: 'FF706D66' } };
  subCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  ws.getRow(2).height = 20;

  // Row 3: headers.
  ws.getRow(3).values = cols as string[];
  ws.getRow(3).eachCell((cell, colNumber) => {
    const colKey = cols[colNumber - 1];
    cell.font = { bold: true, size: 11, color: { argb: HEADER_TEXT } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: REQUIRED.has(colKey) ? REQUIRED_FILL : HEADER_FILL },
    };
    cell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    cell.note = COLUMN_DESCRIPTIONS[colKey];
  });
  ws.getRow(3).height = 26;

  // Data rows.
  for (const row of rows) {
    ws.addRow([
      row.issue_key,
      row.issue_type,
      row.epic_key,
      row.team,
      row.status,
      row.story_points,
      row.created_at,
      row.started_at,
      row.completed_at,
      row.cycle_time_hours,
    ]);
  }

  // Column widths and validation.
  cols.forEach((colKey, idx) => {
    const column = ws.getColumn(idx + 1);
    column.width = Math.max(colKey.length + 4, 14);
  });

  // Enum validation for issue_type + status.
  const issueTypeColIdx = cols.indexOf('issue_type') + 1;
  const statusColIdx = cols.indexOf('status') + 1;
  for (let r = 4; r <= 4 + rows.length + 100; r += 1) {
    ws.getCell(r, issueTypeColIdx).dataValidation = {
      type: 'list',
      allowBlank: false,
      formulae: [`"${JIRA_ISSUE_TYPES.join(',')}"`],
      showErrorMessage: true,
      errorTitle: 'Invalid issue_type',
      error: `Must be one of: ${JIRA_ISSUE_TYPES.join(', ')}`,
    };
    ws.getCell(r, statusColIdx).dataValidation = {
      type: 'list',
      allowBlank: false,
      formulae: [`"${JIRA_STATUSES.join(',')}"`],
      showErrorMessage: true,
      errorTitle: 'Invalid status',
      error: `Must be one of: ${JIRA_STATUSES.join(', ')}`,
    };
  }
}

function writeReadmeSheet(wb: ExcelJS.Workbook, sampleSize: number) {
  const ws = wb.addWorksheet('README', { views: [{ state: 'normal' }] });
  ws.getColumn(1).width = 4;
  ws.getColumn(2).width = 110;

  const lines: Array<{ text: string; bold?: boolean; size?: number; color?: string }> = [
    { text: 'AbarVa Control Tower · Jira Issues Ingest Template', bold: true, size: 18 },
    { text: 'Version 1.0', size: 11, color: 'FF706D66' },
    { text: '' },
    { text: 'SYNTHETIC SAMPLE DATA INCLUDED', bold: true, size: 13, color: 'FF8B5E00' },
    {
      text: `The "Issues" sheet ships pre-populated with ${sampleSize} fictional Northwind Retail issues `,
    },
    {
      text: 'across ~10 teams over a 90-day window. Delete those rows before loading your own data.',
    },
    { text: '' },
    { text: 'Columns', bold: true, size: 13 },
    ...Object.entries(COLUMN_DESCRIPTIONS).map(([k, v]) => ({ text: `· ${k} — ${v}` })),
    { text: '' },
    { text: 'How to extract real Jira data', bold: true, size: 13 },
    { text: '1. UI: Jira → Issues → filter → Export → Excel CSV (current fields).' },
    {
      text: '2. REST: GET /rest/api/3/search?jql=project=NW AND created >= -90d&fields=summary,status,issuetype,customfield_10014,customfield_10010,created,resolutiondate&expand=changelog',
    },
    {
      text: '   Walk the changelog for status transitions to populate started_at + completed_at + cycle_time_hours.',
    },
    { text: '' },
    { text: 'How to upload', bold: true, size: 13 },
    { text: 'CLI: npx tsx src/scripts/tower/ingest-jira.ts --client <client_id> --file <path.xlsx>' },
    { text: '     Append --dry-run to validate without writing.' },
    {
      text: 'API: POST /api/tower/upload with this workbook (classifier routes "Issues" sheet to Jira parser).',
    },
    { text: '' },
    { text: 'Idempotency', bold: true, size: 13 },
    {
      text: 'Upsert key is (client_id, issue_key). Re-running the same export overwrites stale rows.',
    },
  ];

  lines.forEach((line, idx) => {
    const row = ws.getRow(idx + 2);
    const cell = row.getCell(2);
    cell.value = line.text;
    if (line.bold || line.size || line.color) {
      cell.font = {
        bold: !!line.bold,
        size: line.size ?? 11,
        color: { argb: line.color ?? 'FF0A0A0A' },
      };
    }
    cell.alignment = { vertical: 'middle', horizontal: 'left' };
    row.height = line.size && line.size > 13 ? 30 : 18;
  });
}

function writeCsv(rows: SampleRow[]): string {
  const cols = JIRA_TEMPLATE_COLUMNS as readonly string[];
  const banner = [
    '# SYNTHETIC SAMPLE DATA — Northwind Retail (fictional). Replace before uploading.',
    '# AbarVa Control Tower · Jira Issues Ingest Template v1.0',
    '# Required columns marked with *.',
    '# Runbook: docs/templates/tower/jira/README.md',
    '# CLI: npx tsx src/scripts/tower/ingest-jira.ts --client <client_id> --file <path>',
  ];
  const headerLine = cols
    .map((c) => (REQUIRED.has(c) ? `${c}*` : c))
    .join(',');
  const dataLines = rows.map((r) =>
    [
      r.issue_key,
      r.issue_type,
      r.epic_key,
      r.team,
      r.status,
      r.story_points,
      r.created_at,
      r.started_at,
      r.completed_at,
      r.cycle_time_hours,
    ]
      .map((v) => {
        const s = v === null || v === undefined ? '' : String(v);
        if (s.includes(',') || s.includes('"') || s.includes('\n')) {
          return `"${s.replace(/"/g, '""')}"`;
        }
        return s;
      })
      .join(','),
  );
  return [banner.join('\n'), '', headerLine, ...dataLines, ''].join('\n');
}

export async function buildJiraTemplate(outDir: string): Promise<{
  xlsxPath: string;
  csvPath: string;
  rowCount: number;
}> {
  mkdirSync(outDir, { recursive: true });

  // Anchor the generator on 2026-05-30 (today per session context) so the
  // sample is deterministic between builds — eyeball-diffable in PRs.
  const rows = buildNorthwindSampleRows({ asOf: '2026-05-30' });

  const wb = new ExcelJS.Workbook();
  wb.creator = 'AbarVa · Control Tower · Jira Ingest';
  wb.created = new Date('2026-05-30T00:00:00Z');
  wb.description = 'Tower Jira issue ingest template v1.0 (sample-filled, Northwind Retail).';
  writeReadmeSheet(wb, rows.length);
  writeIssuesSheet(wb, rows);

  const xlsxPath = join(outDir, 'template.xlsx');
  await wb.xlsx.writeFile(xlsxPath);

  const csvPath = join(outDir, 'template.csv');
  writeFileSync(csvPath, writeCsv(rows), 'utf8');

  return { xlsxPath, csvPath, rowCount: rows.length };
}

// Entry point when invoked directly.
const invokedDirectly =
  // CommonJS-style (Node will inline this branch dead in tsx ESM, that's fine).
  typeof require !== 'undefined' && require.main === module;
if (invokedDirectly || process.argv[1]?.endsWith('build-jira-template.ts')) {
  const outDir = join(process.cwd(), 'public', 'templates', 'tower', 'jira');
  buildJiraTemplate(outDir)
    .then(({ xlsxPath, csvPath, rowCount }) => {
      console.log(`  wrote ${xlsxPath} (${rowCount} sample rows)`);
      console.log(`  wrote ${csvPath}`);
    })
    .catch((err) => {
      console.error('FAILED:', err);
      process.exit(1);
    });
}
