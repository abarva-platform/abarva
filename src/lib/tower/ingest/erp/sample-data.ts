// Tower · ERP ingest · synthetic sample dataset.
//
// Northwind Retail (fictional). 75 programs × 12 monthly periods +
// 30 synthetic vendor names. Every figure is fabricated and labelled
// SYNTHETIC in the workbook banner. Used for:
//   • Filling the sample workbook shipped under public/templates/tower/erp/
//   • Seeding a test tenant from the CLI with --tenant=northwind
//
// Determinism: a tiny seeded RNG keeps the same numbers across runs so
// CI diffs stay clean and the sample workbook is reproducible.

import type { ErpProgramFinancialRow, ErpVendorRow } from './parse';

export const SYNTHETIC_BANNER =
  '⚠ SYNTHETIC SAMPLE DATA — Northwind Retail. All program IDs, vendor names, and amounts are fabricated for illustration. Delete before uploading real ERP data.';

// ── Seeded RNG (Mulberry32) — deterministic, dependency-free ─────────
function rng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// 30 plausible-sounding fictional vendor names. Mixed: marquee
// hyperscalers omitted (no Microsoft, no Oracle) to keep it clearly
// fictional. Names lean on retail-tech adjacent themes.
const VENDOR_NAMES: string[] = [
  'Lumen Forge Systems',
  'Northstar Cloud Group',
  'Ironclad Analytics',
  'Trellis & Pine Software',
  'Cobalt River Partners',
  'Wayfinder Data Co',
  'Larkspur Labs',
  'Stonebridge Integrations',
  'Aurora Retail Tech',
  'Meridian Platform Works',
  'Halcyon Edge Computing',
  'Bellwether Networks',
  'Driftwood AI',
  'Capstone Studio',
  'Granite Peak Consulting',
  'Pinecrest Engineering',
  'Riverstone Software',
  'Echelon Solutions',
  'Solstice Cloud',
  'Vellum Analytics',
  'Talon Systems',
  'Quartz Insights',
  'Beacon Hill Devops',
  'Ashford Data Studio',
  'Cascade Field Services',
  'Helix Retail OS',
  'Fjord Compute Group',
  'Wren & Vale Studio',
  'Harbor Light Ops',
  'Saltwater Software',
];

const COST_CENTERS = [
  'CC-1100 · Stores Ops',
  'CC-1200 · Merchandising',
  'CC-2100 · Supply Chain',
  'CC-3100 · Digital & eCom',
  'CC-4100 · Finance',
  'CC-5100 · Technology',
  'CC-6100 · HR & People',
];

const GL_ACCOUNTS = [
  '6210 · IT Services',
  '6220 · SaaS Subscriptions',
  '6230 · Cloud Infrastructure',
  '6310 · Professional Services',
  '6510 · Hardware Capex',
  '6520 · Software Capex',
];

const PROGRAM_NAME_BASES = [
  'POS Modernization',
  'Demand Forecasting',
  'Store Associate App',
  'Loyalty Personalization',
  'Returns Automation',
  'Loss Prevention AI',
  'Markdown Optimization',
  'Supply Visibility',
  'Inventory Counting',
  'Customer Care Copilot',
  'Network Edge Refresh',
  'Identity Modernization',
  'Data Platform Migration',
  'eCom Search Rerank',
  'Marketing Mix Modeling',
];

export interface SyntheticDataset {
  vendors: ErpVendorRow[];
  financials: ErpProgramFinancialRow[];
  // Mapping a row carries for downstream callers that want labels.
  program_labels: Record<string, string>;
}

function fmt(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function monthPeriod(year: number, monthIndex: number): { start: string; end: string } {
  const start = new Date(Date.UTC(year, monthIndex, 1));
  const end = new Date(Date.UTC(year, monthIndex + 1, 0));
  return { start: fmt(start), end: fmt(end) };
}

function roundCents(n: number): number {
  return Math.round(n * 100) / 100;
}

export function buildSyntheticNorthwindDataset(
  options: { programCount?: number; seed?: number; baseYear?: number } = {},
): SyntheticDataset {
  const seed = options.seed ?? 0x4e525400; // "NRT\0"
  const programCount = Math.min(Math.max(options.programCount ?? 75, 50), 200);
  const baseYear = options.baseYear ?? 2025;
  const random = rng(seed);

  // ── Vendors ────────────────────────────────────────────────────────
  const vendors: ErpVendorRow[] = VENDOR_NAMES.map((name, i) => {
    const ttmBase = 250_000 + Math.floor(random() * 4_750_000);
    return {
      vendor_id: `VEN-${String(i + 1).padStart(4, '0')}`,
      vendor_name: name,
      cost_center: COST_CENTERS[Math.floor(random() * COST_CENTERS.length)],
      gl_account: GL_ACCOUNTS[Math.floor(random() * GL_ACCOUNTS.length)],
      ttm_spend_usd: roundCents(ttmBase),
    };
  });

  // ── Programs ───────────────────────────────────────────────────────
  const program_labels: Record<string, string> = {};
  const financials: ErpProgramFinancialRow[] = [];

  for (let p = 0; p < programCount; p += 1) {
    const program_id = `NWP-${String(p + 1).padStart(4, '0')}`;
    const label = `${PROGRAM_NAME_BASES[p % PROGRAM_NAME_BASES.length]} · Wave ${
      Math.floor(p / PROGRAM_NAME_BASES.length) + 1
    }`;
    program_labels[program_id] = label;

    // Monthly budget is steady; actual varies ±15%.
    const monthlyBudget = 40_000 + Math.floor(random() * 360_000);
    // Capex share varies by program type — POS / network refresh
    // typically heavier capex; SaaS / personalization typically opex.
    const capexShare = 0.05 + random() * 0.55;
    const primaryVendor = vendors[Math.floor(random() * vendors.length)];
    const costCenter = COST_CENTERS[Math.floor(random() * COST_CENTERS.length)];
    const glAccount = GL_ACCOUNTS[Math.floor(random() * GL_ACCOUNTS.length)];

    for (let m = 0; m < 12; m += 1) {
      const { start, end } = monthPeriod(baseYear, m);
      const variance = 0.85 + random() * 0.3; // ±15%
      const actual = roundCents(monthlyBudget * variance);
      const capex = roundCents(actual * capexShare);
      const opex = roundCents(actual - capex);

      financials.push({
        program_id,
        period_start: start,
        period_end: end,
        budget_usd: roundCents(monthlyBudget),
        actual_usd: actual,
        capex_usd: capex,
        opex_usd: opex,
        vendor_id: primaryVendor.vendor_id,
        cost_center: costCenter,
        gl_account: glAccount,
      });
    }
  }

  return { vendors, financials, program_labels };
}
