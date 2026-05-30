import {
  ATTRITION_REASON_ENUM,
  type AttritionReason,
  type WorkdayFunction,
  type WorkdayWorkforceRow,
} from './types';

// Deterministic PRNG so re-runs produce identical synthetic rows.
function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(rng: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

const LOCATIONS = [
  'Seattle, WA',
  'Austin, TX',
  'Columbus, OH',
  'Atlanta, GA',
  'Toronto, ON',
  'Remote-US',
  'Remote-CA',
  'Distribution Center · Reno',
  'Distribution Center · Memphis',
];

const LEVELS = ['IC1', 'IC2', 'IC3', 'IC4', 'IC5', 'M3', 'M4', 'M5', 'M6', 'M7'];

// Function-weighted distribution biased toward a retail org shape:
// Stores + Supply Chain dominate, corporate functions trail.
const FUNCTION_WEIGHTS: ReadonlyArray<{ fn: WorkdayFunction; weight: number; subs: string[] }> = [
  { fn: 'Stores', weight: 38, subs: ['Store Associate', 'Store Lead', 'District Manager', 'Visual Merchandising'] },
  { fn: 'Customer Care', weight: 14, subs: ['Tier 1 Voice', 'Tier 2 Email', 'Chat Support', 'Workforce Mgmt'] },
  { fn: 'Supply Chain', weight: 12, subs: ['DC Operations', 'Inbound Logistics', 'Last Mile', 'Planning'] },
  { fn: 'Merchandising', weight: 8, subs: ['Buying', 'Planning', 'Allocation', 'Vendor Mgmt'] },
  { fn: 'IT', weight: 7, subs: ['Platform Eng', 'Store Tech', 'Cybersecurity', 'Service Desk'] },
  { fn: 'Marketing', weight: 5, subs: ['Brand', 'Loyalty', 'Performance', 'Content'] },
  { fn: 'Finance', weight: 5, subs: ['FP&A', 'Treasury', 'Accounting', 'Audit'] },
  { fn: 'HR', weight: 4, subs: ['Talent Acquisition', 'L&D', 'Comp & Benefits', 'HRBP'] },
  { fn: 'Data & Analytics', weight: 4, subs: ['BI', 'Data Eng', 'Data Science', 'ML Platform'] },
  { fn: 'Legal', weight: 2, subs: ['Corporate', 'Privacy', 'Employment'] },
  { fn: 'Other', weight: 1, subs: ['Executive Office'] },
];

function weightedFunction(rng: () => number): { fn: WorkdayFunction; sub: string } {
  const total = FUNCTION_WEIGHTS.reduce((s, w) => s + w.weight, 0);
  let r = rng() * total;
  for (const w of FUNCTION_WEIGHTS) {
    if ((r -= w.weight) <= 0) return { fn: w.fn, sub: pick(rng, w.subs) };
  }
  const last = FUNCTION_WEIGHTS[FUNCTION_WEIGHTS.length - 1];
  return { fn: last.fn, sub: last.subs[0] };
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function daysBetween(start: Date, end: Date): number {
  return Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

export interface SyntheticOptions {
  fteCount?: number;          // default 1000
  contractorCount?: number;   // default 80
  asOfDate?: string;          // default 2026-05-30
  seed?: number;              // default 42
  idPrefix?: string;          // default EMP-NW-
}

/**
 * Generate synthetic Northwind Retail workforce rows.
 *
 * Output discipline (P0): synthetic generator IDs ONLY, e.g. `EMP-NW-00001`.
 * No real names, emails, or any other PII.
 *
 * Distribution targets:
 * - ~1000 FTE + ~80 contractors (configurable).
 * - Function mix biased to retail shape (Stores ~38%, Supply Chain 12%, etc.)
 * - Tenures range 0–9 years.
 * - Quarterly attrition events totaling ~12% annualised for FTE and ~28% for
 *   contractors over the past 6 quarters.
 */
export function generateNorthwindWorkforce(opts: SyntheticOptions = {}): WorkdayWorkforceRow[] {
  const fteCount = opts.fteCount ?? 1000;
  const contractorCount = opts.contractorCount ?? 80;
  const asOf = opts.asOfDate ?? '2026-05-30';
  const rng = mulberry32(opts.seed ?? 42);
  const prefix = opts.idPrefix ?? 'EMP-NW-';
  const asOfDate = new Date(`${asOf}T00:00:00Z`);

  // 9 years of history so we have realistic tenure spread.
  const oldestHire = new Date(asOfDate);
  oldestHire.setUTCFullYear(oldestHire.getUTCFullYear() - 9);

  const rows: WorkdayWorkforceRow[] = [];
  let seq = 0;

  const makeOne = (isContractor: boolean): WorkdayWorkforceRow => {
    seq += 1;
    const employee_id = `${prefix}${String(seq).padStart(5, '0')}`;
    const { fn, sub } = weightedFunction(rng);
    // Contractor tenure is shorter on average (max ~2 years).
    const maxTenureDays = isContractor ? 730 : daysBetween(oldestHire, asOfDate);
    const tenureDays = Math.floor(rng() * maxTenureDays);
    const start = new Date(asOfDate);
    start.setUTCDate(start.getUTCDate() - tenureDays);

    // Attrition probability:
    //   FTE: ~12% annualised × (tenureYears).
    //   Contractors: ~28% annualised × (tenureYears, capped).
    const tenureYears = tenureDays / 365;
    const baseAttritionRate = isContractor ? 0.28 : 0.12;
    const attritionProb = Math.min(0.85, baseAttritionRate * Math.max(0.5, tenureYears));
    let attrition_date: string | null = null;
    let attrition_reason: AttritionReason | null = null;
    if (rng() < attritionProb) {
      // Pick a quarter-boundary attrition date between hire and as-of.
      const possibleDays = daysBetween(start, asOfDate);
      if (possibleDays > 30) {
        const dayOffset = 30 + Math.floor(rng() * (possibleDays - 30));
        const attrDate = new Date(start);
        attrDate.setUTCDate(attrDate.getUTCDate() + dayOffset);
        // Snap to end-of-quarter for "plausible quarterly attrition".
        const m = attrDate.getUTCMonth();
        const quarterEndMonth = m - (m % 3) + 2; // 2,5,8,11
        attrDate.setUTCMonth(quarterEndMonth);
        const lastDay = new Date(Date.UTC(attrDate.getUTCFullYear(), attrDate.getUTCMonth() + 1, 0)).getUTCDate();
        attrDate.setUTCDate(lastDay);
        if (attrDate <= asOfDate) {
          attrition_date = isoDate(attrDate);
          // Reason distribution: 60% voluntary, 15% involuntary, 20% end_of_contract for contractors / 5% for FTE, rest other.
          const r = rng();
          if (isContractor) {
            attrition_reason = r < 0.45 ? 'end_of_contract' : r < 0.75 ? 'voluntary' : r < 0.9 ? 'involuntary' : 'other';
          } else {
            attrition_reason = r < 0.6 ? 'voluntary' : r < 0.8 ? 'involuntary' : r < 0.95 ? 'other' : pick(rng, ATTRITION_REASON_ENUM);
          }
        }
      }
    }

    return {
      employee_id,
      function: fn,
      sub_function: sub,
      location: pick(rng, LOCATIONS),
      level: isContractor ? 'Contractor' : pick(rng, LEVELS),
      contractor_flag: isContractor,
      start_date: isoDate(start),
      attrition_date,
      attrition_reason,
    };
  };

  for (let i = 0; i < fteCount; i += 1) rows.push(makeOne(false));
  for (let i = 0; i < contractorCount; i += 1) rows.push(makeOne(true));

  return rows;
}
