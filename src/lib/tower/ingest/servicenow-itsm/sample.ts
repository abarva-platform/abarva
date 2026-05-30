// Sample / synthetic record generator for the Northwind Retail ITSM extract.
//
// Deterministic (seeded PRNG) so the bundled template.xlsx and tests stay
// reproducible. ~500 records across ~12 services × past 90 days with
// plausible MTTR distributions per priority.

import type { ItsmRecord, Priority, RecordType } from './types';

export const NORTHWIND_SERVICES = [
  'POS Checkout',
  'E-Commerce Storefront',
  'Order Management',
  'Inventory Sync',
  'Warehouse Management',
  'Customer Loyalty',
  'Payments Gateway',
  'Identity / SSO',
  'Email & Collaboration',
  'Network — Store Wi-Fi',
  'Data Warehouse',
  'HR & Payroll',
] as const;

export const NORTHWIND_ASSIGNMENT_GROUPS = [
  'NWR-Retail-Apps',
  'NWR-Ecom-Apps',
  'NWR-Supply-Chain-Apps',
  'NWR-Network-Ops',
  'NWR-Identity-Ops',
  'NWR-Data-Platform',
  'NWR-Workplace-IT',
  'NWR-Payments-Eng',
] as const;

const PRIORITY_WEIGHTS: Array<{ p: Priority; w: number }> = [
  { p: 'P1', w: 4 },
  { p: 'P2', w: 18 },
  { p: 'P3', w: 48 },
  { p: 'P4', w: 30 },
];

const RECORD_TYPE_WEIGHTS: Array<{ t: RecordType; w: number }> = [
  { t: 'incident', w: 78 },
  { t: 'change', w: 18 },
  { t: 'problem', w: 4 },
];

// Mulberry32 PRNG — small, deterministic, no deps.
function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickWeighted<T>(rand: () => number, items: Array<{ w: number } & T>): T {
  const total = items.reduce((acc, it) => acc + it.w, 0);
  let r = rand() * total;
  for (const it of items) {
    r -= it.w;
    if (r <= 0) return it;
  }
  return items[items.length - 1];
}

function pickOne<T>(rand: () => number, list: readonly T[]): T {
  return list[Math.floor(rand() * list.length)];
}

/**
 * MTTR distributions (in minutes), aligned with the brief:
 *   - P1 → minutes (median ~45 min, p90 ~4h)
 *   - P2 → hours   (median ~6h,   p90 ~24h)
 *   - P3 → days    (median ~2d,   p90 ~6d)
 *   - P4 → days    (median ~5d,   p90 ~14d)
 */
function sampleMttrMinutes(rand: () => number, p: Priority): number {
  switch (p) {
    case 'P1':
      return Math.round(15 + rand() * (4 * 60 - 15));
    case 'P2':
      return Math.round(60 + rand() * (24 * 60 - 60));
    case 'P3':
      return Math.round(6 * 60 + rand() * (6 * 24 * 60 - 6 * 60));
    case 'P4':
    default:
      return Math.round(24 * 60 + rand() * (14 * 24 * 60 - 24 * 60));
  }
}

function formatIso(d: Date): string {
  return d.toISOString();
}

export interface SampleOptions {
  count?: number;
  seed?: number;
  asOf?: Date;
  windowDays?: number;
}

/**
 * Build a deterministic set of synthetic Northwind Retail ITSM records.
 * Defaults: 500 records, 90-day window ending at `asOf`, seed 42.
 */
export function buildNorthwindSampleRecords(opts: SampleOptions = {}): ItsmRecord[] {
  const count = opts.count ?? 500;
  const seed = opts.seed ?? 42;
  const asOf = opts.asOf ?? new Date('2026-05-30T00:00:00Z');
  const windowDays = opts.windowDays ?? 90;
  const rand = mulberry32(seed);

  const records: ItsmRecord[] = [];
  const counters: Record<RecordType, number> = { incident: 0, problem: 0, change: 0 };
  const prefix: Record<RecordType, string> = {
    incident: 'INC',
    problem: 'PRB',
    change: 'CHG',
  };

  for (let i = 0; i < count; i += 1) {
    const recordType = pickWeighted(rand, RECORD_TYPE_WEIGHTS).t;
    const priority = pickWeighted(rand, PRIORITY_WEIGHTS).p;
    const service = pickOne(rand, NORTHWIND_SERVICES);
    const assignmentGroup = pickOne(rand, NORTHWIND_ASSIGNMENT_GROUPS);

    counters[recordType] += 1;
    const number = `${prefix[recordType]}${String(1000000 + counters[recordType]).slice(1)}`;

    const ageDays = rand() * windowDays;
    const opened = new Date(asOf.getTime() - ageDays * 24 * 60 * 60 * 1000);

    // ~8% of records still open (no closed_at).
    const stillOpen = rand() < 0.08;
    let closed: Date | null = null;
    let mttr: number | null = null;
    if (!stillOpen) {
      mttr = sampleMttrMinutes(rand, priority);
      closed = new Date(opened.getTime() + mttr * 60000);
      // Don't allow close in the future.
      if (closed.getTime() > asOf.getTime()) {
        closed = new Date(asOf.getTime());
        mttr = Math.round((closed.getTime() - opened.getTime()) / 60000);
      }
    }

    let changeSuccess: boolean | null = null;
    if (recordType === 'change' && closed) {
      // ~88% of changes succeed.
      changeSuccess = rand() < 0.88;
    }

    records.push({
      record_number: number,
      record_type: recordType,
      priority,
      service,
      assignment_group: assignmentGroup,
      opened_at: formatIso(opened),
      closed_at: closed ? formatIso(closed) : null,
      mttr_minutes: mttr,
      change_success: changeSuccess,
    });
  }

  // Stable sort by opened_at descending so the CSV preview reads naturally.
  records.sort((a, b) => (a.opened_at < b.opened_at ? 1 : a.opened_at > b.opened_at ? -1 : 0));
  return records;
}

export const SYNTHETIC_BANNER = [
  'SYNTHETIC SAMPLE DATA — NOT REAL CUSTOMER OR PRODUCTION DATA.',
  'Northwind Retail is a fictional reference tenant. Replace this sheet with',
  'a real ServiceNow ITSM extract (see docs/templates/tower/servicenow-itsm/README.md)',
  'before uploading to a live Tower instance.',
].join(' ');
