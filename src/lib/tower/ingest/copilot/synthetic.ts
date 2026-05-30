// Tower ingest · GitHub Copilot · synthetic Northwind Retail dataset.
//
// Deterministic generator (seeded PRNG) so the committed sample-filled.xlsx
// stays byte-identical across CI runs. Produces 10 engineering teams × 12
// monthly periods = 120 rows. Acceptance rates in the 25-45% band, which
// matches what Microsoft and independent studies report as typical.

import type { CopilotUsageRow } from './schema';

const NORTHWIND_TEAMS: Array<{ name: string; seats: number; baselineActive: number }> = [
  { name: 'Storefront Web', seats: 18, baselineActive: 16 },
  { name: 'Mobile Apps', seats: 14, baselineActive: 12 },
  { name: 'Checkout & Payments', seats: 12, baselineActive: 11 },
  { name: 'Inventory Platform', seats: 16, baselineActive: 14 },
  { name: 'Search & Recommendations', seats: 10, baselineActive: 9 },
  { name: 'Data Platform', seats: 14, baselineActive: 12 },
  { name: 'Internal Tools', seats: 8, baselineActive: 6 },
  { name: 'Site Reliability', seats: 10, baselineActive: 9 },
  { name: 'Customer Care Engineering', seats: 9, baselineActive: 7 },
  { name: 'Security Engineering', seats: 7, baselineActive: 5 },
];

const COPILOT_BUSINESS_SEAT_PRICE_USD = 19; // public list price as of 2026-05

// Deterministic PRNG — mulberry32 from a string seed.
function hashSeed(seed: string): number {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i += 1) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function lastDayOfMonth(year: number, monthZeroIdx: number): number {
  return new Date(Date.UTC(year, monthZeroIdx + 1, 0)).getUTCDate();
}

function isoDate(year: number, monthZeroIdx: number, day: number): string {
  const mm = String(monthZeroIdx + 1).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

export interface SyntheticOptions {
  /** Seed for deterministic output. Default: stable. */
  seed?: string;
  /** First month covered. Default: 2025-06-01. */
  startYear?: number;
  startMonthZeroIdx?: number;
  /** Number of monthly periods to emit. Default: 12. */
  monthsToCover?: number;
}

/** Generate plausible Northwind Retail Copilot usage data. Deterministic. */
export function generateNorthwindCopilotRows(opts: SyntheticOptions = {}): CopilotUsageRow[] {
  const seed = opts.seed ?? 'northwind-copilot-2026-05';
  const startYear = opts.startYear ?? 2025;
  const startMonth = opts.startMonthZeroIdx ?? 5; // June (0-indexed)
  const monthsToCover = opts.monthsToCover ?? 12;
  const rnd = mulberry32(hashSeed(seed));

  const rows: CopilotUsageRow[] = [];

  for (const team of NORTHWIND_TEAMS) {
    // Each team has its own acceptance baseline within the 25-45% band so the
    // dataset has cross-team variance even before noise.
    const teamAcceptanceBaseline = 0.27 + rnd() * 0.15; // 0.27 .. 0.42
    // Suggestion volume per active user per month — varies by team.
    const suggestionsPerUserPerMonth = 280 + Math.floor(rnd() * 320); // 280..600

    for (let m = 0; m < monthsToCover; m += 1) {
      const totalMonths = startMonth + m;
      const year = startYear + Math.floor(totalMonths / 12);
      const monthZeroIdx = totalMonths % 12;
      const periodStart = isoDate(year, monthZeroIdx, 1);
      const periodEnd = isoDate(year, monthZeroIdx, lastDayOfMonth(year, monthZeroIdx));

      // Light seasonal + growth signal: adoption climbs ~1.5% per month, dips in Dec.
      const adoptionGrowth = 1 + m * 0.015;
      const decemberDip = monthZeroIdx === 11 ? 0.88 : 1;
      const activeUsers = clamp(
        Math.round(team.baselineActive * adoptionGrowth * decemberDip + (rnd() - 0.5) * 2),
        0,
        team.seats,
      );

      const seatsAssigned = team.seats;
      const seatsUsed = clamp(activeUsers + (rnd() < 0.4 ? 1 : 0), 0, seatsAssigned);

      const totalSuggestions =
        Math.round(activeUsers * suggestionsPerUserPerMonth * (0.9 + rnd() * 0.2));
      const acceptanceRate = clamp(teamAcceptanceBaseline + (rnd() - 0.5) * 0.06, 0.22, 0.48);
      const acceptedSuggestions = Math.round(totalSuggestions * acceptanceRate);

      const monthlyCostUsd = round2(seatsAssigned * COPILOT_BUSINESS_SEAT_PRICE_USD);

      rows.push({
        team: team.name,
        period_start: periodStart,
        period_end: periodEnd,
        active_users: activeUsers,
        total_suggestions: totalSuggestions,
        accepted_suggestions: acceptedSuggestions,
        acceptance_rate_pct: Math.round(acceptanceRate * 1000) / 10,
        monthly_cost_usd: monthlyCostUsd,
        seats_assigned: seatsAssigned,
        seats_used: seatsUsed,
      });
    }
  }

  return rows;
}
