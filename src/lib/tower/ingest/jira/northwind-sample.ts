/**
 * Deterministic Northwind Retail Jira sample.
 *
 * Generates ~800 plausible issues across 10 teams over a 90-day window
 * ending on `asOf`. Used by both:
 *   - the workbook builder (so the published template ships sample-filled)
 *   - tests (so parser tests run against a realistic batch shape).
 *
 * Determinism: a 32-bit Mulberry seed + a fixed `asOf` date produce
 * byte-stable output between builds. The seed is hard-coded for that reason.
 */

import { JIRA_ISSUE_TYPES, JIRA_STATUSES, type JiraIssueType, type JiraStatus } from './parse';

export interface SampleRow {
  issue_key: string;
  issue_type: JiraIssueType;
  epic_key: string;
  team: string;
  status: JiraStatus;
  story_points: number | '';
  created_at: string;
  started_at: string | '';
  completed_at: string | '';
  cycle_time_hours: number | '';
}

// Teams chosen to feel like a mid-size retail eng org. Names map to the
// kind of squads a CIO would recognize on a Jira board.
const TEAMS = [
  'Storefront',
  'Checkout',
  'Catalog',
  'Search',
  'Promotions',
  'Loyalty',
  'Fulfillment',
  'Pricing',
  'Identity',
  'Platform',
];

// Epic titles → epic_key prefix. We use NW (Northwind) as the project key.
const EPICS: Array<{ key: string; team: string; title: string }> = [
  { key: 'NW-1', team: 'Storefront', title: 'PDP performance lift' },
  { key: 'NW-2', team: 'Storefront', title: 'Mobile-first PLP redesign' },
  { key: 'NW-3', team: 'Checkout', title: 'One-click guest checkout' },
  { key: 'NW-4', team: 'Checkout', title: 'Wallet + BNPL expansion' },
  { key: 'NW-5', team: 'Catalog', title: 'Master data dedup' },
  { key: 'NW-6', team: 'Catalog', title: 'Variant taxonomy v2' },
  { key: 'NW-7', team: 'Search', title: 'Vector recall upgrade' },
  { key: 'NW-8', team: 'Search', title: 'Typo + synonym graph' },
  { key: 'NW-9', team: 'Promotions', title: 'Real-time pricing rules' },
  { key: 'NW-10', team: 'Loyalty', title: 'Tiered rewards refactor' },
  { key: 'NW-11', team: 'Loyalty', title: 'Gamified streaks' },
  { key: 'NW-12', team: 'Fulfillment', title: 'BOPIS GA rollout' },
  { key: 'NW-13', team: 'Fulfillment', title: 'Carrier allocation v3' },
  { key: 'NW-14', team: 'Pricing', title: 'Markdown optimization' },
  { key: 'NW-15', team: 'Identity', title: 'Passwordless GA' },
  { key: 'NW-16', team: 'Identity', title: 'Fraud scoring v2' },
  { key: 'NW-17', team: 'Platform', title: 'Service mesh hardening' },
  { key: 'NW-18', team: 'Platform', title: 'Observability uplift' },
  { key: 'NW-19', team: 'Platform', title: 'CI cycle-time reduction' },
  { key: 'NW-20', team: 'Storefront', title: 'A11y conformance push' },
];

// Mulberry32 — small, deterministic, perfectly good for sample generation.
function mulberry32(seed: number) {
  let s = seed >>> 0;
  return function rng() {
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

function pickWeighted<T>(rng: () => number, items: ReadonlyArray<[T, number]>): T {
  const total = items.reduce((acc, [, w]) => acc + w, 0);
  let r = rng() * total;
  for (const [item, w] of items) {
    r -= w;
    if (r <= 0) return item;
  }
  return items[items.length - 1][0];
}

function isoDate(d: Date): string {
  return d.toISOString().replace(/\.\d{3}Z$/, 'Z');
}

function addHours(d: Date, hours: number): Date {
  return new Date(d.getTime() + hours * 3600_000);
}

function parseAsOf(asOf: string): Date {
  // YYYY-MM-DD → midnight UTC.
  return new Date(`${asOf}T00:00:00Z`);
}

interface SampleConfig {
  asOf: string;
  /** Window in days back from asOf. Default 90. */
  windowDays?: number;
  /** Approximate target row count. Default 800. */
  targetRows?: number;
  /** Mulberry seed. Default 0xC0FFEE. */
  seed?: number;
}

/**
 * Build the Northwind sample.
 *
 * Layout:
 *   - 20 Epic rows up front (one per EPIC).
 *   - ~780 child rows (Story / Bug / Task) distributed across epics with
 *     weights that approximate a real backlog: ~60% Story, ~20% Bug, ~20% Task.
 *
 * Status distribution per child weighted toward Done within the 90d window
 * (~50% Done, 15% In Progress, 10% In Review, 10% Backlog, 7% To Do, 5% Blocked,
 *  3% Cancelled). Done items get plausible `started_at` / `completed_at` /
 * `cycle_time_hours` so the file is realistic for cycle-time analytics.
 */
export function buildNorthwindSampleRows(config: SampleConfig): SampleRow[] {
  const asOfDate = parseAsOf(config.asOf);
  const windowDays = config.windowDays ?? 90;
  const target = config.targetRows ?? 800;
  const rng = mulberry32(config.seed ?? 0xc0ffee);

  const rows: SampleRow[] = [];

  // Epic rows — created near the start of the window, mostly In Progress.
  const epicCreated = addHours(asOfDate, -windowDays * 24 + 24);
  for (const epic of EPICS) {
    const status = pickWeighted<JiraStatus>(rng, [
      ['In Progress', 6],
      ['In Review', 2],
      ['Done', 1],
      ['Backlog', 1],
    ]);
    rows.push({
      issue_key: epic.key,
      issue_type: 'Epic',
      epic_key: '',
      team: epic.team,
      status,
      story_points: '',
      created_at: isoDate(addHours(epicCreated, rng() * 24 * 7)),
      started_at: status !== 'Backlog' ? isoDate(addHours(epicCreated, 24 + rng() * 24 * 14)) : '',
      completed_at:
        status === 'Done' ? isoDate(addHours(asOfDate, -rng() * 24 * 14)) : '',
      cycle_time_hours: '',
    });
  }

  // Child rows.
  const childCount = target - rows.length;
  let nextKey = 21; // NW-21, NW-22, ...

  for (let i = 0; i < childCount; i += 1) {
    const epic = pick(rng, EPICS);
    const team = epic.team;
    const issueType = pickWeighted<JiraIssueType>(rng, [
      ['Story', 60],
      ['Bug', 20],
      ['Task', 20],
    ]);
    const status = pickWeighted<JiraStatus>(rng, [
      ['Done', 50],
      ['In Progress', 15],
      ['In Review', 10],
      ['Backlog', 10],
      ['To Do', 7],
      ['Blocked', 5],
      ['Cancelled', 3],
    ]);
    const storyPoints =
      issueType === 'Task'
        ? pickWeighted<number>(rng, [
            [1, 4],
            [2, 4],
            [3, 2],
          ])
        : pickWeighted<number>(rng, [
            [1, 3],
            [2, 5],
            [3, 6],
            [5, 5],
            [8, 3],
            [13, 1],
          ]);

    // Created somewhere in the window.
    const ageDays = rng() * windowDays;
    const created = addHours(asOfDate, -ageDays * 24);

    let started: Date | null = null;
    let completed: Date | null = null;
    let cycleHours: number | '' = '';

    if (status === 'In Progress' || status === 'In Review' || status === 'Blocked') {
      // Started but not done.
      started = addHours(created, 4 + rng() * 48);
    } else if (status === 'Done') {
      // Plausible cycle-time distribution: log-normal-ish.
      // Stories / Tasks: median ~16h, tail to ~120h.
      // Bugs: median ~6h, tail to ~80h.
      const isBug = issueType === 'Bug';
      const u = rng();
      const v = rng();
      // Box-Muller to get a normal, then exp() for log-normal-like.
      const normal = Math.sqrt(-2 * Math.log(u || 0.0001)) * Math.cos(2 * Math.PI * v);
      const mu = isBug ? Math.log(6) : Math.log(16);
      const sigma = isBug ? 0.8 : 0.9;
      const hours = Math.max(0.5, Math.min(240, Math.exp(mu + sigma * normal)));
      started = addHours(created, 2 + rng() * 24);
      completed = addHours(started, hours);
      // Clamp completed to before asOf.
      if (completed.getTime() > asOfDate.getTime()) {
        completed = addHours(asOfDate, -rng() * 4);
      }
      cycleHours = Number(
        Math.max(0.5, (completed.getTime() - started.getTime()) / 3600_000).toFixed(2),
      );
    } else if (status === 'Cancelled') {
      // Cancelled: maybe started, never completed.
      if (rng() > 0.5) started = addHours(created, 4 + rng() * 24);
    }
    // Backlog / To Do: untouched.

    void team; // team comes from epic.

    rows.push({
      issue_key: `NW-${nextKey}`,
      issue_type: issueType,
      epic_key: epic.key,
      team,
      status,
      story_points: storyPoints,
      created_at: isoDate(created),
      started_at: started ? isoDate(started) : '',
      completed_at: completed ? isoDate(completed) : '',
      cycle_time_hours: cycleHours,
    });
    nextKey += 1;
  }

  // Stable sort: Epics first, then by team, then by key numeric suffix.
  rows.sort((a, b) => {
    if (a.issue_type === 'Epic' && b.issue_type !== 'Epic') return -1;
    if (a.issue_type !== 'Epic' && b.issue_type === 'Epic') return 1;
    if (a.team !== b.team) return a.team.localeCompare(b.team);
    const an = Number(a.issue_key.split('-')[1] ?? '0');
    const bn = Number(b.issue_key.split('-')[1] ?? '0');
    return an - bn;
  });

  return rows;
}

// Re-export the constants the workbook builder uses so the importing
// surface is a single module.
export { JIRA_ISSUE_TYPES, JIRA_STATUSES };
export const NORTHWIND_TEAMS = TEAMS;
export const NORTHWIND_EPICS = EPICS;
