// S4 — Build sample-filled.xlsx for Northwind Retail.
//
// Synthetic, deterministic data for the Synthetic Pilot Rehearsal tenant.
// 10 teams × 12 months = 120 rows. Plausible Cursor distributions:
//   • seats_assigned grows month-over-month as teams roll out the tool.
//   • active_users ≈ 75–95% of seats once a team is past month 2.
//   • completions_shown ≈ 6k–14k per active user per month (Cursor median band).
//   • acceptance rate ≈ 22–34% (lower for ops-heavy teams, higher for platform).
//   • monthly_cost_usd = seats_assigned × $40 (Business plan list).
//
// The Data sheet carries a clearly-labeled SYNTHETIC banner row so no one
// confuses it with real production telemetry.
//
// Output: public/templates/tower/cursor/sample-filled.xlsx

import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import ExcelJS from 'exceljs';
import {
  CURSOR_COLUMNS,
  CURSOR_SAMPLE_FILENAME,
  CURSOR_SHEET_NAME,
  CURSOR_TEMPLATE_VERSION,
} from '@/lib/tower/ingest/cursor/schema';

const HEADER_FILL = 'FF0A0A0A';
const HEADER_TEXT = 'FFF5F5F0';
const REQUIRED_FILL = 'FF2DD4C8';
const BANNER_FILL = 'FFFEF3C7'; // amber-100 — "synthetic data" warning
const BANNER_TEXT = 'FF92400E'; // amber-900

const DEFAULT_OUTPUT = resolve(
  process.cwd(),
  'public/templates/tower/cursor',
  CURSOR_SAMPLE_FILENAME,
);

interface TeamProfile {
  team: string;
  startSeats: number;
  growthPerMonth: number;
  activationCurve: number[]; // ratio of seats that are active in month i
  completionsPerActiveUserBase: number;
  acceptanceRateBase: number;
  perSeatMonthlyUsd: number;
}

const TEAMS: TeamProfile[] = [
  { team: 'Platform Engineering', startSeats: 18, growthPerMonth: 1, activationCurve: [0.6, 0.78, 0.86, 0.9, 0.92, 0.94, 0.94, 0.95, 0.95, 0.95, 0.94, 0.94], completionsPerActiveUserBase: 13200, acceptanceRateBase: 0.33, perSeatMonthlyUsd: 40 },
  { team: 'Store Systems', startSeats: 14, growthPerMonth: 1, activationCurve: [0.5, 0.66, 0.74, 0.8, 0.84, 0.86, 0.88, 0.88, 0.88, 0.88, 0.86, 0.86], completionsPerActiveUserBase: 9600, acceptanceRateBase: 0.26, perSeatMonthlyUsd: 40 },
  { team: 'E-Commerce', startSeats: 22, growthPerMonth: 1, activationCurve: [0.62, 0.74, 0.82, 0.86, 0.9, 0.92, 0.92, 0.92, 0.92, 0.92, 0.9, 0.9], completionsPerActiveUserBase: 11800, acceptanceRateBase: 0.3, perSeatMonthlyUsd: 40 },
  { team: 'Data & Analytics', startSeats: 12, growthPerMonth: 1, activationCurve: [0.5, 0.7, 0.8, 0.86, 0.88, 0.9, 0.9, 0.9, 0.92, 0.92, 0.92, 0.92], completionsPerActiveUserBase: 10400, acceptanceRateBase: 0.31, perSeatMonthlyUsd: 40 },
  { team: 'Supply Chain Tech', startSeats: 10, growthPerMonth: 0, activationCurve: [0.4, 0.55, 0.66, 0.72, 0.78, 0.8, 0.8, 0.82, 0.82, 0.82, 0.82, 0.8], completionsPerActiveUserBase: 8200, acceptanceRateBase: 0.24, perSeatMonthlyUsd: 40 },
  { team: 'Merchandising Apps', startSeats: 8, growthPerMonth: 0, activationCurve: [0.4, 0.55, 0.65, 0.7, 0.74, 0.76, 0.78, 0.78, 0.78, 0.78, 0.78, 0.78], completionsPerActiveUserBase: 7600, acceptanceRateBase: 0.22, perSeatMonthlyUsd: 40 },
  { team: 'Customer Care Eng', startSeats: 9, growthPerMonth: 1, activationCurve: [0.55, 0.66, 0.74, 0.78, 0.82, 0.84, 0.86, 0.86, 0.86, 0.86, 0.86, 0.84], completionsPerActiveUserBase: 9000, acceptanceRateBase: 0.27, perSeatMonthlyUsd: 40 },
  { team: 'Infrastructure & SRE', startSeats: 12, growthPerMonth: 1, activationCurve: [0.66, 0.78, 0.84, 0.88, 0.9, 0.92, 0.92, 0.92, 0.94, 0.94, 0.94, 0.92], completionsPerActiveUserBase: 12200, acceptanceRateBase: 0.32, perSeatMonthlyUsd: 40 },
  { team: 'Security Engineering', startSeats: 6, growthPerMonth: 0, activationCurve: [0.5, 0.66, 0.74, 0.78, 0.82, 0.84, 0.84, 0.84, 0.84, 0.84, 0.84, 0.82], completionsPerActiveUserBase: 8800, acceptanceRateBase: 0.28, perSeatMonthlyUsd: 40 },
  { team: 'Mobile Apps', startSeats: 11, growthPerMonth: 1, activationCurve: [0.58, 0.72, 0.8, 0.84, 0.88, 0.9, 0.9, 0.9, 0.9, 0.9, 0.88, 0.88], completionsPerActiveUserBase: 10800, acceptanceRateBase: 0.29, perSeatMonthlyUsd: 40 },
];

interface SampleRow {
  team: string;
  period_start: string;
  period_end: string;
  seats_assigned: number;
  active_users: number;
  completions_shown: number;
  completions_accepted: number;
  monthly_cost_usd: number;
}

function lastDayOfMonth(year: number, month0: number): Date {
  return new Date(Date.UTC(year, month0 + 1, 0));
}

function fmt(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// Deterministic pseudo-jitter for plausible variance without breaking
// build reproducibility. Seeded by team name + month index.
function jitter(seed: string, lo: number, hi: number): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const r = ((h >>> 0) % 10000) / 10000; // 0..1
  return lo + r * (hi - lo);
}

export function buildSampleRows(): SampleRow[] {
  // 12 monthly periods ending at the most recent completed month before
  // the brief's "today" of 2026-05-30 → so the latest period is 2026-04.
  // First period: 2025-05. This gives the demo a year of trailing data.
  const months: Array<{ year: number; month0: number }> = [];
  for (let i = 11; i >= 0; i -= 1) {
    const d = new Date(Date.UTC(2026, 4 - i, 1)); // May 2025 .. Apr 2026
    months.push({ year: d.getUTCFullYear(), month0: d.getUTCMonth() });
  }

  const rows: SampleRow[] = [];
  for (const team of TEAMS) {
    for (let mi = 0; mi < months.length; mi += 1) {
      const { year, month0 } = months[mi];
      const periodStart = new Date(Date.UTC(year, month0, 1));
      const periodEnd = lastDayOfMonth(year, month0);

      const seats = team.startSeats + team.growthPerMonth * mi;
      const activeRatio = team.activationCurve[mi] ?? team.activationCurve[team.activationCurve.length - 1];
      // ± 2 users of jitter, clamped.
      const activeJitterBase = jitter(`${team.team}|active|${mi}`, -2, 2);
      const active = clamp(
        Math.round(seats * activeRatio + activeJitterBase),
        0,
        seats,
      );

      const completionsPerUser =
        team.completionsPerActiveUserBase * (1 + jitter(`${team.team}|shown|${mi}`, -0.08, 0.08));
      const completionsShown = Math.max(0, Math.round(active * completionsPerUser));

      const acceptance =
        team.acceptanceRateBase * (1 + jitter(`${team.team}|accept|${mi}`, -0.06, 0.06));
      const completionsAccepted = clamp(
        Math.round(completionsShown * acceptance),
        0,
        completionsShown,
      );

      const cost = +(seats * team.perSeatMonthlyUsd).toFixed(2);

      rows.push({
        team: team.team,
        period_start: fmt(periodStart),
        period_end: fmt(periodEnd),
        seats_assigned: seats,
        active_users: active,
        completions_shown: completionsShown,
        completions_accepted: completionsAccepted,
        monthly_cost_usd: cost,
      });
    }
  }
  return rows;
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

export async function buildCursorSample(outPath: string = DEFAULT_OUTPUT): Promise<string> {
  mkdirSync(dirname(outPath), { recursive: true });
  const wb = new ExcelJS.Workbook();
  wb.creator = 'AbarVa · Control Tower';
  wb.created = new Date();
  wb.description = `Cursor sample-filled (SYNTHETIC, Northwind Retail) v${CURSOR_TEMPLATE_VERSION}`;

  const ws = wb.addWorksheet(CURSOR_SHEET_NAME, {
    views: [{ state: 'frozen', ySplit: 3 }],
  });

  // Row 1 — synthetic-data banner. Loud and impossible to miss.
  ws.getRow(1).values = [
    'SYNTHETIC · Northwind Retail (rehearsal tenant — NOT a real customer) · do not use as production telemetry',
  ];
  ws.mergeCells(1, 1, 1, CURSOR_COLUMNS.length);
  const banner = ws.getRow(1).getCell(1);
  banner.font = { bold: true, size: 12, color: { argb: BANNER_TEXT } };
  banner.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BANNER_FILL } };
  banner.alignment = { vertical: 'middle', horizontal: 'center' };
  ws.getRow(1).height = 28;

  // Row 2 — meta.
  ws.getRow(2).values = [
    `10 teams × 12 monthly periods · template v${CURSOR_TEMPLATE_VERSION} · generated by src/scripts/templates/tower/cursor/build-sample.ts`,
  ];
  ws.mergeCells(2, 1, 2, CURSOR_COLUMNS.length);
  const meta = ws.getRow(2).getCell(1);
  meta.font = { italic: true, size: 10, color: { argb: 'FF706D66' } };
  meta.alignment = { vertical: 'middle', horizontal: 'center' };
  ws.getRow(2).height = 20;

  // Row 3 — header.
  ws.getRow(3).values = CURSOR_COLUMNS.map((c) => c.label);
  ws.getRow(3).eachCell((cell, colNumber) => {
    const col = CURSOR_COLUMNS[colNumber - 1];
    cell.font = { bold: true, size: 11, color: { argb: HEADER_TEXT } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: col.required ? REQUIRED_FILL : HEADER_FILL },
    };
    cell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    cell.border = { bottom: { style: 'medium', color: { argb: HEADER_FILL } } };
  });
  ws.getRow(3).height = 24;

  CURSOR_COLUMNS.forEach((c, idx) => {
    ws.getColumn(idx + 1).width = Math.max(c.label.length + 4, 18);
  });

  const rows = buildSampleRows();
  rows.forEach((row, idx) => {
    const r = ws.getRow(idx + 4);
    r.values = CURSOR_COLUMNS.map(
      (c) => (row as unknown as Record<string, unknown>)[c.key],
    ) as ExcelJS.CellValue[];
  });

  await wb.xlsx.writeFile(outPath);
  return outPath;
}

if (require.main === module) {
  buildCursorSample().then((p) => {
    console.log(`[cursor-sample] wrote ${p}`);
  });
}
