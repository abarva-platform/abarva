// Tower ingest · GitHub Copilot · workbook generators.
//
// Two workbooks:
//   1. template.xlsx       — empty, validated headers, "How to fill", "Schema".
//   2. sample-filled.xlsx  — same structure + plausible Northwind Retail data
//                            with a clear "SYNTHETIC DATA — for demo only"
//                            banner row.
//
// Used by both a build-time generator and tests (the template-shape test
// regenerates into a temp dir and round-trips through the parser).

import ExcelJS from 'exceljs';
import {
  COPILOT_COLUMNS,
  COPILOT_INGEST_VERSION,
  type CopilotColumnSpec,
  type CopilotUsageRow,
} from './schema';

// AbarVa Design System v2 — keep palette muted, brand-aligned.
const HEADER_FILL = 'FF0A0A0A';
const HEADER_TEXT = 'FFF5F5F0';
const REQUIRED_FILL = 'FF2DD4C8';
const BANNER_FILL = 'FFFCE7B6';
const BANNER_TEXT = 'FF6B4F00';
const SECTION_FILL = 'FFF8F7F4';

function applyDataValidation(ws: ExcelJS.Worksheet, col: CopilotColumnSpec, columnNumber: number) {
  const validation: ExcelJS.DataValidation | null = (() => {
    if (col.type === 'integer') {
      return {
        type: 'whole',
        allowBlank: !col.required,
        operator: 'greaterThanOrEqual',
        formulae: [0],
        showErrorMessage: true,
        errorTitle: `Invalid ${col.label}`,
        error: 'Must be a non-negative whole number.',
      } as ExcelJS.DataValidation;
    }
    if (col.type === 'number') {
      return {
        type: 'decimal',
        allowBlank: !col.required,
        operator: 'greaterThanOrEqual',
        formulae: [0],
        showErrorMessage: true,
        errorTitle: `Invalid ${col.label}`,
        error: 'Must be a non-negative number.',
      } as ExcelJS.DataValidation;
    }
    if (col.type === 'percent') {
      return {
        type: 'decimal',
        allowBlank: true,
        operator: 'between',
        formulae: [0, 100],
        showErrorMessage: true,
        errorTitle: `Invalid ${col.label}`,
        error: 'Must be between 0 and 100.',
      } as ExcelJS.DataValidation;
    }
    if (col.type === 'date') {
      return {
        type: 'date',
        allowBlank: !col.required,
        operator: 'greaterThan',
        formulae: [new Date('1990-01-01')],
        showErrorMessage: true,
        errorTitle: `Invalid ${col.label}`,
        error: 'Must be a date (YYYY-MM-DD).',
      } as ExcelJS.DataValidation;
    }
    return null;
  })();

  if (!validation) return;
  for (let row = 2; row <= 500; row += 1) {
    ws.getCell(row, columnNumber).dataValidation = validation;
  }
}

function writeDataSheet(wb: ExcelJS.Workbook, rows: CopilotUsageRow[] = []) {
  const ws = wb.addWorksheet('Data', {
    views: [{ state: 'frozen', ySplit: 1 }],
  });

  ws.getRow(1).values = COPILOT_COLUMNS.map((c) => c.label);
  ws.getRow(1).eachCell((cell, colNumber) => {
    const col = COPILOT_COLUMNS[colNumber - 1];
    cell.font = { bold: true, size: 11, color: { argb: HEADER_TEXT } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: col.required ? REQUIRED_FILL : HEADER_FILL },
    };
    cell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    cell.border = { bottom: { style: 'medium', color: { argb: HEADER_FILL } } };
    if (col.description) {
      cell.note = { texts: [{ text: col.description }] };
    }
  });
  ws.getRow(1).height = 26;

  COPILOT_COLUMNS.forEach((col, idx) => {
    const column = ws.getColumn(idx + 1);
    const labelWidth = col.label.length + 6;
    const descWidth = Math.min(col.description.length / 4, 30);
    column.width = Math.max(labelWidth, descWidth, 16);
    applyDataValidation(ws, col, idx + 1);
  });

  rows.forEach((row, idx) => {
    const r = ws.getRow(idx + 2);
    r.values = COPILOT_COLUMNS.map((c) => row[c.key] ?? '');
    r.eachCell((cell, colNumber) => {
      const col = COPILOT_COLUMNS[colNumber - 1];
      if (col.type === 'date') cell.numFmt = 'yyyy-mm-dd';
      if (col.type === 'number') cell.numFmt = '#,##0.00';
      if (col.type === 'integer') cell.numFmt = '#,##0';
      if (col.type === 'percent') cell.numFmt = '0.0';
      cell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    });
  });

  return ws;
}

function writeHowToFillSheet(wb: ExcelJS.Workbook) {
  const ws = wb.addWorksheet('How to fill', { views: [{ state: 'normal' }] });
  ws.getColumn(1).width = 4;
  ws.getColumn(2).width = 110;

  const lines: Array<{ text: string; bold?: boolean; size?: number; color?: string }> = [
    { text: 'AbarVa Control Tower · GitHub Copilot Usage Ingest', bold: true, size: 18 },
    { text: `Template v${COPILOT_INGEST_VERSION} · One row per team-month`, size: 11, color: 'FF706D66' },
    { text: '' },
    { text: 'What this template captures', bold: true, size: 13 },
    { text: 'Per-team, per-month GitHub Copilot adoption and cost. Used by the Control Tower' },
    { text: 'AI Coding Tools lens to track suggestion volume, acceptance rate, seat utilization,' },
    { text: 'and dollar cost across engineering teams over time.' },
    { text: '' },
    { text: 'Where to get the data', bold: true, size: 13 },
    { text: '1. Usage metrics:  GitHub Org → Settings → Copilot → Usage Metrics → "Export CSV".' },
    { text: '   Choose the monthly period and (optionally) split by Team. Each team rolls up to' },
    { text: '   active_users, total_suggestions, accepted_suggestions.' },
    { text: '2. Seat assignment: GitHub Org → Settings → Copilot → Access. Export "Assigned seats".' },
    { text: '3. Cost:           GitHub Billing API (/orgs/{org}/settings/billing/usage) or the' },
    { text: '   monthly Copilot invoice. Allocate per-team by seats_assigned × seat unit price.' },
    { text: '' },
    { text: 'How to fill the Data sheet', bold: true, size: 13 },
    { text: '· Required columns have a teal header. Optional columns have a black header.' },
    { text: '· Dates must be ISO YYYY-MM-DD (e.g. 2026-04-30). The cell validator enforces this.' },
    { text: '· Acceptance Rate % is optional — the pipeline derives it from Accepted / Total' },
    { text: '  when blank. If you provide it and the math disagrees by > 1pp, a warning is logged.' },
    { text: '· Accepted Suggestions must be ≤ Total Suggestions. Seats Used must be ≤ Seats Assigned.' },
    { text: '· One row per (team, period). Re-uploading the same (team, period) updates in place.' },
    { text: '' },
    { text: 'Refresh cadence', bold: true, size: 13 },
    { text: 'Monthly, within the first 5 business days of the next month. Tower will flag any team' },
    { text: 'whose most recent period_end is more than 45 days stale.' },
    { text: '' },
    { text: 'Privacy & PII', bold: true, size: 13 },
    { text: 'This template captures TEAM-level aggregates only. Do not include individual GitHub' },
    { text: 'handles, names, or seat IDs — those belong in a separate identity export with stricter' },
    { text: 'access controls. The DB has no per-user column for this source.' },
    { text: '' },
    { text: 'Need help', bold: true, size: 13 },
    { text: 'Runbook: docs/templates/tower/copilot/README.md' },
    { text: 'Pipeline: npx tsx src/scripts/tower/ingest-copilot.ts --help' },
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

  ws.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: SECTION_FILL } };
}

function writeSchemaSheet(wb: ExcelJS.Workbook) {
  const ws = wb.addWorksheet('Schema', { views: [{ state: 'frozen', ySplit: 1 }] });
  const headers = ['Column', 'Type', 'Required', 'Description'];
  ws.getRow(1).values = headers;
  ws.getRow(1).eachCell((cell) => {
    cell.font = { bold: true, size: 11, color: { argb: HEADER_TEXT } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_FILL } };
    cell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  });
  ws.getRow(1).height = 24;

  ws.getColumn(1).width = 26;
  ws.getColumn(2).width = 12;
  ws.getColumn(3).width = 12;
  ws.getColumn(4).width = 80;

  COPILOT_COLUMNS.forEach((col, idx) => {
    const r = ws.getRow(idx + 2);
    r.values = [col.label, col.type, col.required ? 'yes' : 'no', col.description];
    r.eachCell((cell, c) => {
      cell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1, wrapText: c === 4 };
      if (c === 3 && col.required) {
        cell.font = { bold: true, color: { argb: 'FF0A6B62' } };
      }
    });
    r.height = 22;
  });
}

function writeSyntheticBannerRow(ws: ExcelJS.Worksheet) {
  ws.insertRow(1, ['SYNTHETIC DATA — for demo only · Northwind Retail · do not use for real pricing or vendor negotiations']);
  ws.mergeCells(1, 1, 1, COPILOT_COLUMNS.length);
  const cell = ws.getCell(1, 1);
  cell.font = { bold: true, size: 12, color: { argb: BANNER_TEXT } };
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BANNER_FILL } };
  cell.alignment = { vertical: 'middle', horizontal: 'center' };
  ws.getRow(1).height = 26;
  // The original frozen split was at ySplit:1 (header row 1). After inserting
  // the banner, header is row 2 and banner is row 1 — repin the freeze.
  ws.views = [{ state: 'frozen', ySplit: 2 }];
}

function buildWorkbook(rows: CopilotUsageRow[] = [], opts: { synthetic?: boolean } = {}): ExcelJS.Workbook {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'AbarVa · Control Tower';
  wb.created = new Date('2026-05-25T00:00:00Z'); // Deterministic for diff stability.
  wb.modified = wb.created;
  wb.description = `AbarVa Control Tower · GitHub Copilot ingest template v${COPILOT_INGEST_VERSION}`;

  const data = writeDataSheet(wb, rows);
  if (opts.synthetic) writeSyntheticBannerRow(data);
  writeHowToFillSheet(wb);
  writeSchemaSheet(wb);
  return wb;
}

export function buildEmptyTemplateWorkbook(): ExcelJS.Workbook {
  return buildWorkbook([], { synthetic: false });
}

export function buildSampleFilledWorkbook(rows: CopilotUsageRow[]): ExcelJS.Workbook {
  return buildWorkbook(rows, { synthetic: true });
}
