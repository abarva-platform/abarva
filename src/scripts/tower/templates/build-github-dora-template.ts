// Build the GitHub → DORA Tower workbook artifacts.
//
// Produces two .xlsx files under `public/templates/tower/github-dora/`:
//
//   - `template.xlsx`        — empty template with headers + cell
//                              validation + "How to fill" + "Schema".
//   - `sample-filled.xlsx`   — same template, prefilled with a plausible
//                              synthetic Northwind Retail dataset
//                              (~12 teams × 12 monthly periods).
//
// Run:
//
//   npx tsx src/scripts/tower/templates/build-github-dora-template.ts
//
// Both files are deterministic — re-running produces byte-equal output
// modulo exceljs internal zip metadata. Tests load these committed
// artifacts and assert they parse cleanly under the canonical schema.

import path from 'node:path';
import fs from 'node:fs/promises';
import ExcelJS from 'exceljs';

import {
  GITHUB_DORA_COLUMN_SPECS,
  type GithubDoraColumn,
  type GithubDoraRow,
} from '../../../lib/tower/ingest/github-dora/schema';

// ---------------------------------------------------------------------
// Output paths
// ---------------------------------------------------------------------

const OUTPUT_DIR = path.resolve(
  process.cwd(),
  'public/templates/tower/github-dora',
);
const TEMPLATE_FILE = path.join(OUTPUT_DIR, 'template.xlsx');
const SAMPLE_FILE = path.join(OUTPUT_DIR, 'sample-filled.xlsx');

// ---------------------------------------------------------------------
// Style constants — kept inline so the builder has no UI dependencies.
// ---------------------------------------------------------------------

const HEADER_FILL: ExcelJS.FillPattern = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FF1F2937' }, // slate-800
};

const HEADER_FONT: Partial<ExcelJS.Font> = {
  bold: true,
  color: { argb: 'FFFFFFFF' },
  name: 'DM Sans',
  size: 11,
};

const BANNER_FILL: ExcelJS.FillPattern = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFFEF3C7' }, // amber-100
};

const BANNER_FONT: Partial<ExcelJS.Font> = {
  bold: true,
  italic: true,
  color: { argb: 'FF92400E' }, // amber-800
  name: 'DM Sans',
  size: 11,
};

const SECTION_HEADER_FONT: Partial<ExcelJS.Font> = {
  bold: true,
  name: 'Georgia',
  size: 13,
  color: { argb: 'FF111827' },
};

const SUBTLE_FONT: Partial<ExcelJS.Font> = {
  name: 'DM Sans',
  size: 10,
  color: { argb: 'FF4B5563' },
};

// ---------------------------------------------------------------------
// Sheet builders
// ---------------------------------------------------------------------

function validationForSpec(spec: typeof GITHUB_DORA_COLUMN_SPECS[number]): ExcelJS.DataValidation {
  if (spec.excelType === 'date') {
    return {
      type: 'date' as const,
      operator: 'greaterThan' as const,
      formulae: ['DATE(2000,1,1)'],
      showErrorMessage: true,
      errorTitle: 'Invalid date',
      error: `${spec.header} must be a date on or after 2000-01-01.`,
      promptTitle: spec.header,
      prompt: spec.description,
    };
  }
  if (spec.excelType === 'number' || spec.excelType === 'integer') {
    const isPercent = (spec.unit ?? '').toLowerCase().includes('percent');
    return {
      type: 'decimal' as const,
      operator: isPercent
        ? ('between' as const)
        : ('greaterThanOrEqual' as const),
      formulae: isPercent ? [0, 100] : [0],
      showErrorMessage: true,
      errorTitle: 'Out of range',
      error: isPercent
        ? `${spec.header} must be between 0 and 100.`
        : `${spec.header} must be >= 0.`,
      promptTitle: spec.header,
      prompt: spec.description,
    };
  }
  return {
    type: 'textLength' as const,
    operator: 'greaterThan' as const,
    formulae: [0],
    showErrorMessage: true,
    errorTitle: 'Required',
    error: `${spec.header} is required.`,
    promptTitle: spec.header,
    prompt: spec.description,
  };
}

/**
 * Apply per-column cell validation across a row range. Splits the work
 * by column so the same validation object is reused.
 */
function applyColumnValidations(
  sheet: ExcelJS.Worksheet,
  startRow: number,
  endRow: number,
): void {
  for (let i = 0; i < GITHUB_DORA_COLUMN_SPECS.length; i += 1) {
    const spec = GITHUB_DORA_COLUMN_SPECS[i]!;
    const colIdx = i + 1;
    const validation = validationForSpec(spec);
    for (let r = startRow; r <= endRow; r += 1) {
      sheet.getCell(r, colIdx).dataValidation = validation;
    }
  }
}

function buildDataSheet(
  workbook: ExcelJS.Workbook,
  options: { withSyntheticBanner: boolean },
): ExcelJS.Worksheet {
  const sheet = workbook.addWorksheet('Data', {
    views: [{ state: 'frozen', ySplit: options.withSyntheticBanner ? 2 : 1 }],
  });

  sheet.columns = GITHUB_DORA_COLUMN_SPECS.map((spec) => ({
    header: spec.header,
    key: spec.key,
    width: Math.max(spec.header.length + 4, 22),
  }));

  // Header row styling.
  const headerRow = sheet.getRow(1);
  headerRow.eachCell((cell) => {
    cell.fill = HEADER_FILL;
    cell.font = HEADER_FONT;
    cell.alignment = { vertical: 'middle', horizontal: 'left' };
  });
  headerRow.height = 22;

  // Optional synthetic-data banner.
  if (options.withSyntheticBanner) {
    const bannerRow = sheet.getRow(2);
    bannerRow.getCell(1).value = 'SYNTHETIC DATA — for demo only';
    bannerRow.getCell(2).value =
      'Northwind Retail · fictional · do not use as a real baseline';
    bannerRow.eachCell((cell) => {
      cell.fill = BANNER_FILL;
      cell.font = BANNER_FONT;
    });
    sheet.mergeCells(2, 2, 2, GITHUB_DORA_COLUMN_SPECS.length);
    bannerRow.height = 20;
  }

  // Per-column number / date display format.
  for (let i = 0; i < GITHUB_DORA_COLUMN_SPECS.length; i += 1) {
    const spec = GITHUB_DORA_COLUMN_SPECS[i]!;
    const col = sheet.getColumn(i + 1);
    if (spec.excelType === 'date') col.numFmt = 'yyyy-mm-dd';
    else if (spec.excelType === 'integer') col.numFmt = '0';
    else if (spec.excelType === 'number') col.numFmt = '0.00';
  }

  return sheet;
}

function buildHowToFillSheet(workbook: ExcelJS.Workbook): void {
  const sheet = workbook.addWorksheet('How to fill');
  sheet.columns = [
    { header: 'Column', key: 'column', width: 36 },
    { header: 'Required', key: 'required', width: 12 },
    { header: 'Unit', key: 'unit', width: 18 },
    { header: 'GitHub field', key: 'github', width: 48 },
    { header: 'Description', key: 'description', width: 72 },
    { header: 'Example', key: 'example', width: 32 },
  ];

  const top = sheet.getRow(1);
  top.eachCell((cell) => {
    cell.fill = HEADER_FILL;
    cell.font = HEADER_FONT;
  });
  top.height = 22;

  // Intro block above the column reference (inserted as a banner row).
  sheet.insertRow(1, [
    'AI Control Tower — GitHub → DORA workbook',
  ]);
  sheet.mergeCells(1, 1, 1, 6);
  sheet.getRow(1).getCell(1).font = SECTION_HEADER_FONT;
  sheet.getRow(1).height = 24;

  sheet.insertRow(2, [
    'Refresh cadence: weekly. Granularity: one row per (repo, monthly period). ' +
      'Owner: AI Control Tower — Platform Squad. SLA: data populated by 12:00 UTC every Monday.',
  ]);
  sheet.mergeCells(2, 1, 2, 6);
  sheet.getRow(2).getCell(1).font = SUBTLE_FONT;
  sheet.getRow(2).getCell(1).alignment = { wrapText: true, vertical: 'top' };
  sheet.getRow(2).height = 32;

  // Re-style the (now shifted) header row.
  const headerRow = sheet.getRow(3);
  headerRow.eachCell((cell) => {
    cell.fill = HEADER_FILL;
    cell.font = HEADER_FONT;
  });
  headerRow.height = 22;

  for (const spec of GITHUB_DORA_COLUMN_SPECS) {
    sheet.addRow({
      column: spec.header,
      required: spec.required ? 'yes' : 'no',
      unit: spec.unit ?? '—',
      github: spec.githubField,
      description: spec.description,
      example: spec.example,
    });
  }

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber <= 3) return;
    row.alignment = { vertical: 'top', wrapText: true };
  });
}

function buildSchemaSheet(workbook: ExcelJS.Workbook): void {
  const sheet = workbook.addWorksheet('Schema');
  sheet.columns = [
    { header: 'order', key: 'order', width: 8 },
    { header: 'key', key: 'key', width: 36 },
    { header: 'type', key: 'type', width: 14 },
    { header: 'required', key: 'required', width: 12 },
    { header: 'unit', key: 'unit', width: 18 },
    { header: 'db_column', key: 'db_column', width: 36 },
    { header: 'db_table', key: 'db_table', width: 24 },
  ];

  const top = sheet.getRow(1);
  top.eachCell((cell) => {
    cell.fill = HEADER_FILL;
    cell.font = HEADER_FONT;
  });
  top.height = 22;

  for (let i = 0; i < GITHUB_DORA_COLUMN_SPECS.length; i += 1) {
    const spec = GITHUB_DORA_COLUMN_SPECS[i]!;
    sheet.addRow({
      order: i + 1,
      key: spec.key,
      type: spec.excelType,
      required: spec.required ? 'yes' : 'no',
      unit: spec.unit ?? '—',
      db_column: spec.key,
      db_table: 'tower_dora_metrics',
    });
  }
}

// ---------------------------------------------------------------------
// Synthetic Northwind Retail sample
// ---------------------------------------------------------------------

interface TeamProfile {
  readonly team: string;
  readonly repo: string;
  // Mean deploys/day, lead time (h), cfr (%), mttr (h).
  readonly meanDfpd: number;
  readonly meanLtCh: number;
  readonly meanCfrPct: number;
  readonly meanMttrH: number;
  // Deterministic "drift" applied month-over-month so the series isn't
  // a flat line. Sign and amplitude per team — never randomized.
  readonly drift: {
    readonly dfpd: number;
    readonly ltCh: number;
    readonly cfrPct: number;
    readonly mttrH: number;
  };
}

const NORTHWIND_TEAMS: readonly TeamProfile[] = [
  {
    team: 'checkout-platform',
    repo: 'northwind-retail/checkout-service',
    meanDfpd: 1.4,
    meanLtCh: 36,
    meanCfrPct: 11.0,
    meanMttrH: 4.5,
    drift: { dfpd: 0.04, ltCh: -0.5, cfrPct: -0.15, mttrH: -0.08 },
  },
  {
    team: 'storefront-web',
    repo: 'northwind-retail/storefront-web',
    meanDfpd: 2.2,
    meanLtCh: 22,
    meanCfrPct: 9.5,
    meanMttrH: 3.0,
    drift: { dfpd: 0.05, ltCh: -0.3, cfrPct: -0.12, mttrH: -0.05 },
  },
  {
    team: 'mobile-apps',
    repo: 'northwind-retail/mobile-apps',
    meanDfpd: 0.08,
    meanLtCh: 96,
    meanCfrPct: 15.0,
    meanMttrH: 8.0,
    drift: { dfpd: 0.0, ltCh: 0.5, cfrPct: 0.1, mttrH: 0.1 },
  },
  {
    team: 'fulfillment-ops',
    repo: 'northwind-retail/fulfillment-api',
    meanDfpd: 0.9,
    meanLtCh: 44,
    meanCfrPct: 13.0,
    meanMttrH: 6.0,
    drift: { dfpd: 0.03, ltCh: -0.4, cfrPct: -0.2, mttrH: -0.1 },
  },
  {
    team: 'pricing',
    repo: 'northwind-retail/pricing-engine',
    meanDfpd: 0.6,
    meanLtCh: 60,
    meanCfrPct: 10.0,
    meanMttrH: 5.0,
    drift: { dfpd: 0.02, ltCh: 0.2, cfrPct: -0.05, mttrH: -0.05 },
  },
  {
    team: 'merchandising',
    repo: 'northwind-retail/merchandising-svc',
    meanDfpd: 0.5,
    meanLtCh: 72,
    meanCfrPct: 12.0,
    meanMttrH: 6.5,
    drift: { dfpd: 0.01, ltCh: -0.3, cfrPct: 0.0, mttrH: -0.05 },
  },
  {
    team: 'loyalty',
    repo: 'northwind-retail/loyalty-platform',
    meanDfpd: 0.4,
    meanLtCh: 80,
    meanCfrPct: 14.0,
    meanMttrH: 7.5,
    drift: { dfpd: 0.0, ltCh: 0.0, cfrPct: 0.05, mttrH: 0.0 },
  },
  {
    team: 'data-platform',
    repo: 'northwind-retail/data-platform',
    meanDfpd: 0.3,
    meanLtCh: 110,
    meanCfrPct: 13.0,
    meanMttrH: 9.0,
    drift: { dfpd: 0.005, ltCh: -1.0, cfrPct: -0.05, mttrH: -0.15 },
  },
  {
    team: 'identity',
    repo: 'northwind-retail/identity-service',
    meanDfpd: 0.7,
    meanLtCh: 48,
    meanCfrPct: 7.0,
    meanMttrH: 3.5,
    drift: { dfpd: 0.02, ltCh: -0.4, cfrPct: -0.1, mttrH: -0.05 },
  },
  {
    team: 'search-relevance',
    repo: 'northwind-retail/search-relevance',
    meanDfpd: 1.0,
    meanLtCh: 40,
    meanCfrPct: 8.5,
    meanMttrH: 4.0,
    drift: { dfpd: 0.04, ltCh: -0.4, cfrPct: -0.1, mttrH: -0.06 },
  },
  {
    team: 'payments',
    repo: 'northwind-retail/payments-service',
    meanDfpd: 0.6,
    meanLtCh: 56,
    meanCfrPct: 6.0,
    meanMttrH: 3.0,
    drift: { dfpd: 0.01, ltCh: -0.3, cfrPct: -0.05, mttrH: -0.05 },
  },
  {
    team: 'contact-center-ai',
    repo: 'northwind-retail/contact-center-ai',
    meanDfpd: 1.2,
    meanLtCh: 30,
    meanCfrPct: 9.0,
    meanMttrH: 4.0,
    drift: { dfpd: 0.06, ltCh: -0.5, cfrPct: -0.2, mttrH: -0.08 },
  },
];

// 12 monthly periods, 2025-01 through 2025-12.
const PERIODS: ReadonlyArray<{ start: string; end: string; days: number }> = (
  () => {
    const out: { start: string; end: string; days: number }[] = [];
    for (let month = 1; month <= 12; month += 1) {
      const mm = month.toString().padStart(2, '0');
      // Days-in-month, leap-year safe for 2025 (not a leap year).
      const daysInMonth = new Date(Date.UTC(2025, month, 0)).getUTCDate();
      out.push({
        start: `2025-${mm}-01`,
        end: `2025-${mm}-${daysInMonth.toString().padStart(2, '0')}`,
        days: daysInMonth,
      });
    }
    return out;
  }
)();

function round(value: number, digits: number): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function clamp(value: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, value));
}

/**
 * Build the deterministic synthetic dataset. 12 teams × 12 periods =
 * 144 rows. Drift is applied month-over-month and clamped so values
 * stay in plausible enterprise ranges.
 */
function buildSyntheticRows(): readonly GithubDoraRow[] {
  const rows: GithubDoraRow[] = [];
  for (const team of NORTHWIND_TEAMS) {
    for (let i = 0; i < PERIODS.length; i += 1) {
      const period = PERIODS[i]!;
      const driftIdx = i; // 0..11
      const dfpd = clamp(
        team.meanDfpd + team.drift.dfpd * driftIdx,
        0,
        10,
      );
      const lt = clamp(team.meanLtCh + team.drift.ltCh * driftIdx, 0.5, 240);
      const cfr = clamp(
        team.meanCfrPct + team.drift.cfrPct * driftIdx,
        0,
        100,
      );
      const mttr = clamp(team.meanMttrH + team.drift.mttrH * driftIdx, 0, 48);
      const deploys = Math.max(0, Math.round(dfpd * period.days));

      rows.push({
        repo: team.repo,
        team: team.team,
        period_start: period.start,
        period_end: period.end,
        deployment_frequency_per_day: round(dfpd, 2),
        lead_time_for_changes_hours: round(lt, 2),
        change_failure_rate_pct: round(cfr, 2),
        mttr_hours: round(mttr, 2),
        sample_size_deploys: deploys,
      });
    }
  }
  return rows;
}

// ---------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------

async function buildEmptyTemplate(): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'AbarVa AI Control Tower';
  workbook.created = new Date('2025-01-01T00:00:00Z'); // deterministic
  workbook.modified = workbook.created;
  const dataSheet = buildDataSheet(workbook, { withSyntheticBanner: false });
  // For the empty template, apply validation to a 200-row range so an
  // operator typing into the workbook gets per-cell guardrails.
  applyColumnValidations(dataSheet, 2, 200);
  buildHowToFillSheet(workbook);
  buildSchemaSheet(workbook);

  await workbook.xlsx.writeFile(TEMPLATE_FILE);
}

async function buildSampleFilled(): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'AbarVa AI Control Tower';
  workbook.created = new Date('2025-01-01T00:00:00Z');
  workbook.modified = workbook.created;
  const dataSheet = buildDataSheet(workbook, { withSyntheticBanner: true });
  buildHowToFillSheet(workbook);
  buildSchemaSheet(workbook);

  const rows = buildSyntheticRows();
  // Place data rows starting at row 3 (banner is row 2). Use explicit
  // row numbers so the validation loop below can rely on a known
  // start/end range and so addRow's internal pointer (which can drift
  // after styling banner cells) doesn't move the data into the void.
  const dataStartRow = 3;
  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i]!;
    const target = dataSheet.getRow(dataStartRow + i);
    target.getCell(1).value = row.repo;
    target.getCell(2).value = row.team;
    target.getCell(3).value = row.period_start;
    target.getCell(4).value = row.period_end;
    target.getCell(5).value = row.deployment_frequency_per_day;
    target.getCell(6).value = row.lead_time_for_changes_hours;
    target.getCell(7).value = row.change_failure_rate_pct;
    target.getCell(8).value = row.mttr_hours;
    target.getCell(9).value = row.sample_size_deploys;
    target.alignment = { vertical: 'middle' };
    target.commit();
  }

  // Apply validation only over the populated data range so the file
  // stays compact and authors editing existing rows still get
  // guardrails.
  applyColumnValidations(
    dataSheet,
    dataStartRow,
    dataStartRow + rows.length - 1,
  );

  await workbook.xlsx.writeFile(SAMPLE_FILE);
}

async function main(): Promise<void> {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  await buildEmptyTemplate();
  await buildSampleFilled();
  console.log(
    `[tower:github-dora] wrote\n  ${TEMPLATE_FILE}\n  ${SAMPLE_FILE}`,
  );
}

// Allow this file to be imported without auto-running (handy for tests
// that want to invoke `buildEmptyTemplate` / `buildSampleFilled`
// directly).
export {
  buildEmptyTemplate,
  buildSampleFilled,
  buildSyntheticRows,
  NORTHWIND_TEAMS,
  PERIODS,
  TEMPLATE_FILE,
  SAMPLE_FILE,
};

// When run as a script, kick off the main builder. The check works
// under both `tsx` and `node` because import.meta.url is the file path.
const invokedDirectly = (() => {
  try {
    const fromUrl = new URL(import.meta.url).pathname;
    const fromArgv = process.argv[1]
      ? path.resolve(process.argv[1])
      : '';
    return fromUrl === fromArgv;
  } catch {
    return false;
  }
})();

if (invokedDirectly) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

// Touch unused-import shim so eslint doesn't warn about the type-only
// re-export of GithubDoraColumn (kept for downstream callers).
export type { GithubDoraColumn };
