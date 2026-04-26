// ACT7 · AI Productivity / DORA Read Model
//
// Operationalizes the Productivity & DORA dimension of the AI Control
// Tower contract (ACT1). Projects a deterministic, cross-tenant set of
// productivity and DORA metric entries that the Tower can compose into
// Atlas brief content, scorecards, and pressure cards.
//
// This is a deterministic seed-only read model. There are no:
//
// - live integrations,
// - external API calls,
// - migrations,
// - LLM / model invocations,
// - timestamp-dependent values,
// - random values,
// - tenant database lookups,
// - imports from Source / Sentinel / Atlas / Nexus / Agent runtime,
//   auth, or supabase.
//
// Every entry carries `liveTelemetry: false`. Every entry's
// `measurementSource` is a seed-tagged source. No record claims that
// any data was captured from a live pipeline. Future ACT7.x slices
// will:
//
// - bind these records to per-tenant captured productivity feeds,
// - replace the seed with a connector-backed projection (e.g. real
//   GitHub Actions metrics, Jira / incident-report pipelines),
// - persist edits and audit trails through Steward,
// - feed the seed into Atlas brief composition (ACT9).
//
// Until then, this module is the only canonical source for AI
// productivity / DORA shape across the Tower surface.

// ---------------------------------------------------------------------
// Canonical enums
// ---------------------------------------------------------------------

/**
 * Canonical DORA metric keys. Mirrors the DORA / "Accelerate" research
 * taxonomy as referenced by the AI Control Tower contract.
 */
export const DORA_METRICS = [
  'deployment_frequency',
  'lead_time_for_changes',
  'change_failure_rate',
  'mean_time_to_recovery',
] as const;

export type DoraMetric = (typeof DORA_METRICS)[number];

/**
 * Canonical productivity metric keys. These complement the DORA
 * metrics with engineering-system signals the Tower uses to assess AI
 * productivity uplift (or drag) without claiming a dollar number.
 */
export const PRODUCTIVITY_METRICS = [
  'pr_cycle_time',
  'pr_merge_rate',
  'review_turnaround',
  'defect_leakage',
  'rework_ratio',
  'spike_to_ship_ratio',
] as const;

export type ProductivityMetric = (typeof PRODUCTIVITY_METRICS)[number];

/**
 * Canonical metric performance band. Mirrors the DORA elite / high /
 * medium / low taxonomy and is reused for productivity entries so
 * Atlas can render a single banded judgement across both metric kinds.
 */
export const METRIC_BANDS = ['elite', 'high', 'medium', 'low'] as const;

export type MetricBand = (typeof METRIC_BANDS)[number];

/**
 * Canonical metric trend. `unknown` represents a metric whose trend
 * cannot be defended from the seed without inventing data.
 */
export const METRIC_TRENDS = [
  'improving',
  'flat',
  'declining',
  'unknown',
] as const;

export type MetricTrend = (typeof METRIC_TRENDS)[number];

/**
 * Canonical metric measurement source. Every value is a seed-tagged
 * source. The Tower refuses to claim that any of these came from a
 * live pipeline.
 */
export const METRIC_MEASUREMENT_SOURCES = [
  'seed_only',
  'manual_capture',
  'gh_actions_seed',
  'jira_seed',
  'incident_report_seed',
] as const;

export type MetricMeasurementSource =
  (typeof METRIC_MEASUREMENT_SOURCES)[number];

/**
 * Canonical metric kind. The Tower distinguishes DORA metrics from the
 * broader productivity set so the Atlas brief can render the two
 * groupings separately.
 */
export const METRIC_KINDS = ['dora', 'productivity'] as const;

export type MetricKind = (typeof METRIC_KINDS)[number];

/**
 * Canonical metric unit. Constrained so callers cannot invent free-form
 * units and so summary aggregation can rely on the unit space.
 */
export const METRIC_UNITS = [
  'per_day',
  'hours',
  'percent',
  'days',
] as const;

export type MetricUnit = (typeof METRIC_UNITS)[number];

// ---------------------------------------------------------------------
// Public record shape
// ---------------------------------------------------------------------

/**
 * Single canonical productivity / DORA inventory record. Every field is
 * deterministic. All linked ids are seed ids that resolve only against
 * other deterministic seeds.
 *
 * `teamLabel` is a role-based label rather than a real team name so the
 * seed cannot be mistaken for live tenant data. `liveTelemetry` is
 * always `false`.
 */
export interface ProductivityDoraEntry {
  /** Stable seed id of the form "dora-seed-{team}-{metric}". */
  readonly id: string;
  /** Role-based team label. Never a real team name. */
  readonly teamLabel: string;
  /** Optional linked program seed slug. */
  readonly programKey?: string;
  /** Optional linked AI use case seed key. */
  readonly aiUseCaseKey?: string;
  /** Distinguishes DORA metrics from the broader productivity set. */
  readonly metricKind: MetricKind;
  /** The metric being reported. */
  readonly metric: DoraMetric | ProductivityMetric;
  /** The unit the metric values are expressed in. */
  readonly unit: MetricUnit;
  /** Current value (deterministic literal, no clock dependency). */
  readonly currentValue: number;
  /** Baseline value (deterministic literal). */
  readonly baselineValue: number;
  /** Current minus baseline (deterministic literal). */
  readonly delta: number;
  /** Banded judgement (elite / high / medium / low). */
  readonly band: MetricBand;
  /** Banded trend (improving / flat / declining / unknown). */
  readonly trend: MetricTrend;
  /** Seed-tagged measurement source. */
  readonly measurementSource: MetricMeasurementSource;
  /** Free-form notes; ≥ 1 entry; never empty strings. */
  readonly notes: readonly string[];
  /** Always false. The Tower never claims live telemetry from this seed. */
  readonly liveTelemetry: false;
  /** Provenance marker. Always 'deterministic_productivity_dora_seed'. */
  readonly createdFrom: 'deterministic_productivity_dora_seed';
}

/**
 * Aggregated productivity / DORA summary. Counts reconcile to
 * `totalEntries` for the per-band and per-trend breakdowns.
 */
export interface ProductivityDoraSummary {
  readonly totalEntries: number;
  /** metric key → count (covers DORA + productivity). */
  readonly byMetric: Readonly<Record<string, number>>;
  readonly byBand: Readonly<Record<MetricBand, number>>;
  readonly byTrend: Readonly<Record<MetricTrend, number>>;
  readonly doraCount: number;
  readonly productivityCount: number;
  readonly uniqueTeams: readonly string[];
  readonly uniquePrograms: readonly string[];
}

// ---------------------------------------------------------------------
// Deterministic seed
// ---------------------------------------------------------------------

/**
 * Build a stable seed id from a team slug and metric key. Single source
 * of truth so callers cannot accidentally diverge id formats.
 */
function seedId(teamSlug: string, metric: string): string {
  return `dora-seed-${teamSlug}-${metric}`;
}

/**
 * The canonical productivity / DORA seed.
 *
 * Distribution constraints (test-enforced):
 *
 * - ≥ 20 entries.
 * - All 4 DORA metrics covered (≥ 1 each).
 * - All 6 productivity metrics covered (≥ 1 each).
 * - All 4 bands represented (≥ 1 each).
 * - All 4 trends represented (≥ 1 each).
 * - ≥ 3 declining entries.
 * - ≥ 5 unique team labels.
 * - Every entry has `liveTelemetry: false`.
 * - Every entry has a seed-tagged `measurementSource`.
 * - No string field claims live telemetry.
 */
const PRODUCTIVITY_DORA_SEED: readonly ProductivityDoraEntry[] = [
  // -----------------------------------------------------------------
  // Customer Support Engineering
  // -----------------------------------------------------------------
  {
    id: seedId('cse', 'deployment_frequency'),
    teamLabel: 'Customer Support Engineering',
    programKey: 'contact-center-ai',
    aiUseCaseKey: 'ai-use-case-seed-11',
    metricKind: 'dora',
    metric: 'deployment_frequency',
    unit: 'per_day',
    currentValue: 1.4,
    baselineValue: 0.8,
    delta: 0.6,
    band: 'high',
    trend: 'improving',
    measurementSource: 'gh_actions_seed',
    notes: [
      'Seed value based on the deterministic placeholder distribution.',
      'No live deployment counter is wired into this entry.',
    ],
    liveTelemetry: false,
    createdFrom: 'deterministic_productivity_dora_seed',
  },
  {
    id: seedId('cse', 'lead_time_for_changes'),
    teamLabel: 'Customer Support Engineering',
    programKey: 'contact-center-ai',
    metricKind: 'dora',
    metric: 'lead_time_for_changes',
    unit: 'hours',
    currentValue: 36,
    baselineValue: 48,
    delta: -12,
    band: 'high',
    trend: 'improving',
    measurementSource: 'gh_actions_seed',
    notes: [
      'Lower is better; the delta is current minus baseline.',
      'Seed values; no live capture is present.',
    ],
    liveTelemetry: false,
    createdFrom: 'deterministic_productivity_dora_seed',
  },
  {
    id: seedId('cse', 'pr_cycle_time'),
    teamLabel: 'Customer Support Engineering',
    metricKind: 'productivity',
    metric: 'pr_cycle_time',
    unit: 'hours',
    currentValue: 22,
    baselineValue: 30,
    delta: -8,
    band: 'high',
    trend: 'improving',
    measurementSource: 'gh_actions_seed',
    notes: [
      'PR cycle time measured from open to merge, lower is better.',
      'Deterministic seed; no live PR feed is connected.',
    ],
    liveTelemetry: false,
    createdFrom: 'deterministic_productivity_dora_seed',
  },

  // -----------------------------------------------------------------
  // Platform Squad
  // -----------------------------------------------------------------
  {
    id: seedId('platform', 'deployment_frequency'),
    teamLabel: 'Platform Squad',
    metricKind: 'dora',
    metric: 'deployment_frequency',
    unit: 'per_day',
    currentValue: 3.2,
    baselineValue: 3.0,
    delta: 0.2,
    band: 'elite',
    trend: 'flat',
    measurementSource: 'gh_actions_seed',
    notes: [
      'Daily deploy cadence is in the elite band per the DORA taxonomy.',
      'Seed-only; no live deploy meter is connected.',
    ],
    liveTelemetry: false,
    createdFrom: 'deterministic_productivity_dora_seed',
  },
  {
    id: seedId('platform', 'change_failure_rate'),
    teamLabel: 'Platform Squad',
    metricKind: 'dora',
    metric: 'change_failure_rate',
    unit: 'percent',
    currentValue: 8,
    baselineValue: 12,
    delta: -4,
    band: 'elite',
    trend: 'improving',
    measurementSource: 'incident_report_seed',
    notes: [
      'Lower is better; deterministic placeholder distribution.',
      'No live incident pipeline is reading into this entry.',
    ],
    liveTelemetry: false,
    createdFrom: 'deterministic_productivity_dora_seed',
  },
  {
    id: seedId('platform', 'mean_time_to_recovery'),
    teamLabel: 'Platform Squad',
    metricKind: 'dora',
    metric: 'mean_time_to_recovery',
    unit: 'hours',
    currentValue: 1.5,
    baselineValue: 2.0,
    delta: -0.5,
    band: 'elite',
    trend: 'improving',
    measurementSource: 'incident_report_seed',
    notes: [
      'Lower is better; seed value for MTTR.',
      'No live incident pipeline is connected.',
    ],
    liveTelemetry: false,
    createdFrom: 'deterministic_productivity_dora_seed',
  },
  {
    id: seedId('platform', 'review_turnaround'),
    teamLabel: 'Platform Squad',
    metricKind: 'productivity',
    metric: 'review_turnaround',
    unit: 'hours',
    currentValue: 6,
    baselineValue: 8,
    delta: -2,
    band: 'high',
    trend: 'improving',
    measurementSource: 'gh_actions_seed',
    notes: [
      'Time from PR ready-for-review to first reviewer comment.',
      'Seed-only; no live review pipeline is connected.',
    ],
    liveTelemetry: false,
    createdFrom: 'deterministic_productivity_dora_seed',
  },

  // -----------------------------------------------------------------
  // Data Platform Team
  // -----------------------------------------------------------------
  {
    id: seedId('data-platform', 'deployment_frequency'),
    teamLabel: 'Data Platform Team',
    metricKind: 'dora',
    metric: 'deployment_frequency',
    unit: 'per_day',
    currentValue: 0.5,
    baselineValue: 0.6,
    delta: -0.1,
    band: 'medium',
    trend: 'declining',
    measurementSource: 'gh_actions_seed',
    notes: [
      'Lower than baseline; the entry is flagged as declining.',
      'Deterministic seed; no live deploy meter is connected.',
    ],
    liveTelemetry: false,
    createdFrom: 'deterministic_productivity_dora_seed',
  },
  {
    id: seedId('data-platform', 'lead_time_for_changes'),
    teamLabel: 'Data Platform Team',
    metricKind: 'dora',
    metric: 'lead_time_for_changes',
    unit: 'days',
    currentValue: 6,
    baselineValue: 5,
    delta: 1,
    band: 'medium',
    trend: 'declining',
    measurementSource: 'gh_actions_seed',
    notes: [
      'Lead time has lengthened against the baseline.',
      'Seed-only; no live integration is wired.',
    ],
    liveTelemetry: false,
    createdFrom: 'deterministic_productivity_dora_seed',
  },
  {
    id: seedId('data-platform', 'defect_leakage'),
    teamLabel: 'Data Platform Team',
    metricKind: 'productivity',
    metric: 'defect_leakage',
    unit: 'percent',
    currentValue: 14,
    baselineValue: 10,
    delta: 4,
    band: 'low',
    trend: 'declining',
    measurementSource: 'jira_seed',
    notes: [
      'Defects escaping to production as a fraction of merged changes.',
      'Seed-only; no live Jira pipeline is connected.',
    ],
    liveTelemetry: false,
    createdFrom: 'deterministic_productivity_dora_seed',
  },
  {
    id: seedId('data-platform', 'rework_ratio'),
    teamLabel: 'Data Platform Team',
    metricKind: 'productivity',
    metric: 'rework_ratio',
    unit: 'percent',
    currentValue: 22,
    baselineValue: 18,
    delta: 4,
    band: 'low',
    trend: 'declining',
    measurementSource: 'gh_actions_seed',
    notes: [
      'Share of merged changes whose code was rewritten within 30 days.',
      'Deterministic placeholder; no live PR pipeline is connected.',
    ],
    liveTelemetry: false,
    createdFrom: 'deterministic_productivity_dora_seed',
  },

  // -----------------------------------------------------------------
  // Risk & Compliance Engineering
  // -----------------------------------------------------------------
  {
    id: seedId('risk-eng', 'change_failure_rate'),
    teamLabel: 'Risk & Compliance Engineering',
    metricKind: 'dora',
    metric: 'change_failure_rate',
    unit: 'percent',
    currentValue: 18,
    baselineValue: 18,
    delta: 0,
    band: 'medium',
    trend: 'flat',
    measurementSource: 'incident_report_seed',
    notes: [
      'Change failure rate is flat against the baseline.',
      'Seed-only; no live incident pipeline is connected.',
    ],
    liveTelemetry: false,
    createdFrom: 'deterministic_productivity_dora_seed',
  },
  {
    id: seedId('risk-eng', 'mean_time_to_recovery'),
    teamLabel: 'Risk & Compliance Engineering',
    metricKind: 'dora',
    metric: 'mean_time_to_recovery',
    unit: 'hours',
    currentValue: 8,
    baselineValue: 10,
    delta: -2,
    band: 'medium',
    trend: 'improving',
    measurementSource: 'incident_report_seed',
    notes: [
      'Lower is better.',
      'Deterministic placeholder; no live MTTR feed is connected.',
    ],
    liveTelemetry: false,
    createdFrom: 'deterministic_productivity_dora_seed',
  },
  {
    id: seedId('risk-eng', 'review_turnaround'),
    teamLabel: 'Risk & Compliance Engineering',
    metricKind: 'productivity',
    metric: 'review_turnaround',
    unit: 'hours',
    currentValue: 24,
    baselineValue: 24,
    delta: 0,
    band: 'medium',
    trend: 'flat',
    measurementSource: 'manual_capture',
    notes: [
      'Review turnaround captured manually each sprint by the team lead.',
      'No live review pipeline is connected.',
    ],
    liveTelemetry: false,
    createdFrom: 'deterministic_productivity_dora_seed',
  },

  // -----------------------------------------------------------------
  // Sales Engineering
  // -----------------------------------------------------------------
  {
    id: seedId('sales-eng', 'pr_merge_rate'),
    teamLabel: 'Sales Engineering',
    metricKind: 'productivity',
    metric: 'pr_merge_rate',
    unit: 'percent',
    currentValue: 72,
    baselineValue: 70,
    delta: 2,
    band: 'medium',
    trend: 'flat',
    measurementSource: 'manual_capture',
    notes: [
      'Share of opened PRs that reach merge.',
      'Captured manually; no live PR pipeline is connected.',
    ],
    liveTelemetry: false,
    createdFrom: 'deterministic_productivity_dora_seed',
  },
  {
    id: seedId('sales-eng', 'spike_to_ship_ratio'),
    teamLabel: 'Sales Engineering',
    metricKind: 'productivity',
    metric: 'spike_to_ship_ratio',
    unit: 'percent',
    currentValue: 42,
    baselineValue: 35,
    delta: 7,
    band: 'medium',
    trend: 'improving',
    measurementSource: 'manual_capture',
    notes: [
      'Share of spikes that translate into a shipped change.',
      'Captured manually; no live experiment pipeline is connected.',
    ],
    liveTelemetry: false,
    createdFrom: 'deterministic_productivity_dora_seed',
  },

  // -----------------------------------------------------------------
  // Internal Tools Squad
  // -----------------------------------------------------------------
  {
    id: seedId('internal-tools', 'pr_cycle_time'),
    teamLabel: 'Internal Tools Squad',
    metricKind: 'productivity',
    metric: 'pr_cycle_time',
    unit: 'hours',
    currentValue: 14,
    baselineValue: 16,
    delta: -2,
    band: 'high',
    trend: 'improving',
    measurementSource: 'gh_actions_seed',
    notes: [
      'Lower is better.',
      'Seed-only; no live PR pipeline is connected.',
    ],
    liveTelemetry: false,
    createdFrom: 'deterministic_productivity_dora_seed',
  },
  {
    id: seedId('internal-tools', 'pr_merge_rate'),
    teamLabel: 'Internal Tools Squad',
    metricKind: 'productivity',
    metric: 'pr_merge_rate',
    unit: 'percent',
    currentValue: 88,
    baselineValue: 84,
    delta: 4,
    band: 'high',
    trend: 'improving',
    measurementSource: 'gh_actions_seed',
    notes: [
      'Share of opened PRs that reach merge.',
      'Seed-only; no live PR pipeline is connected.',
    ],
    liveTelemetry: false,
    createdFrom: 'deterministic_productivity_dora_seed',
  },

  // -----------------------------------------------------------------
  // Mobile App Team
  // -----------------------------------------------------------------
  {
    id: seedId('mobile', 'deployment_frequency'),
    teamLabel: 'Mobile App Team',
    metricKind: 'dora',
    metric: 'deployment_frequency',
    unit: 'per_day',
    currentValue: 0.05,
    baselineValue: 0.08,
    delta: -0.03,
    band: 'low',
    trend: 'unknown',
    measurementSource: 'manual_capture',
    notes: [
      'App store cadence is captured manually each release.',
      'Trend cannot be defended from the seed without inventing data.',
    ],
    liveTelemetry: false,
    createdFrom: 'deterministic_productivity_dora_seed',
  },
  {
    id: seedId('mobile', 'rework_ratio'),
    teamLabel: 'Mobile App Team',
    metricKind: 'productivity',
    metric: 'rework_ratio',
    unit: 'percent',
    currentValue: 28,
    baselineValue: 25,
    delta: 3,
    band: 'low',
    trend: 'declining',
    measurementSource: 'manual_capture',
    notes: [
      'Share of merged changes that were rewritten within 30 days.',
      'Captured manually; no live PR pipeline is connected.',
    ],
    liveTelemetry: false,
    createdFrom: 'deterministic_productivity_dora_seed',
  },
  {
    id: seedId('mobile', 'defect_leakage'),
    teamLabel: 'Mobile App Team',
    metricKind: 'productivity',
    metric: 'defect_leakage',
    unit: 'percent',
    currentValue: 9,
    baselineValue: 9,
    delta: 0,
    band: 'medium',
    trend: 'unknown',
    measurementSource: 'jira_seed',
    notes: [
      'Defects escaping to the app store as a fraction of merged changes.',
      'Trend cannot be defended; flagged as unknown.',
    ],
    liveTelemetry: false,
    createdFrom: 'deterministic_productivity_dora_seed',
  },

  // -----------------------------------------------------------------
  // Search Relevance Team (extra coverage)
  // -----------------------------------------------------------------
  {
    id: seedId('search', 'spike_to_ship_ratio'),
    teamLabel: 'Search Relevance Team',
    metricKind: 'productivity',
    metric: 'spike_to_ship_ratio',
    unit: 'percent',
    currentValue: 55,
    baselineValue: 50,
    delta: 5,
    band: 'high',
    trend: 'improving',
    measurementSource: 'jira_seed',
    notes: [
      'Share of spikes that translate into a shipped change.',
      'Seed-only; no live experiment pipeline is connected.',
    ],
    liveTelemetry: false,
    createdFrom: 'deterministic_productivity_dora_seed',
  },
  {
    id: seedId('search', 'lead_time_for_changes'),
    teamLabel: 'Search Relevance Team',
    metricKind: 'dora',
    metric: 'lead_time_for_changes',
    unit: 'hours',
    currentValue: 60,
    baselineValue: 60,
    delta: 0,
    band: 'medium',
    trend: 'flat',
    measurementSource: 'gh_actions_seed',
    notes: [
      'Lead time is flat against the baseline.',
      'Seed-only; no live integration is wired.',
    ],
    liveTelemetry: false,
    createdFrom: 'deterministic_productivity_dora_seed',
  },
];

// ---------------------------------------------------------------------
// Public helpers
// ---------------------------------------------------------------------

/**
 * Build the canonical productivity / DORA inventory. Result is a
 * frozen, deterministic list — repeated calls return byte-equal data.
 */
export function buildProductivityDoraEntries(): readonly ProductivityDoraEntry[] {
  return PRODUCTIVITY_DORA_SEED;
}

/**
 * Initialize a per-band record where every canonical band is present
 * with count 0.
 */
function emptyBandCounts(): Record<MetricBand, number> {
  const out: Record<MetricBand, number> = {
    elite: 0,
    high: 0,
    medium: 0,
    low: 0,
  };
  return out;
}

/**
 * Initialize a per-trend record where every canonical trend is present
 * with count 0.
 */
function emptyTrendCounts(): Record<MetricTrend, number> {
  const out: Record<MetricTrend, number> = {
    improving: 0,
    flat: 0,
    declining: 0,
    unknown: 0,
  };
  return out;
}

/**
 * Sort a list of strings ascending without mutating the input.
 */
function sortedAscending(values: readonly string[]): readonly string[] {
  return [...values].sort((a, b) => a.localeCompare(b));
}

/**
 * Build the deterministic summary for an inventory list. When no list
 * is provided, summarizes the canonical seed.
 *
 * Reconciliation guarantees:
 *
 * - `Object.values(byBand).reduce(...)` equals `totalEntries`.
 * - `Object.values(byTrend).reduce(...)` equals `totalEntries`.
 * - `doraCount + productivityCount` equals `totalEntries`.
 * - `uniqueTeams` and `uniquePrograms` are sorted ascending and
 *   contain no duplicates.
 */
export function summarizeProductivityDora(
  entries: readonly ProductivityDoraEntry[] = PRODUCTIVITY_DORA_SEED,
): ProductivityDoraSummary {
  const byMetric: Record<string, number> = {};
  const byBand = emptyBandCounts();
  const byTrend = emptyTrendCounts();
  const teams = new Set<string>();
  const programs = new Set<string>();
  let doraCount = 0;
  let productivityCount = 0;

  for (const entry of entries) {
    byMetric[entry.metric] = (byMetric[entry.metric] ?? 0) + 1;
    byBand[entry.band] += 1;
    byTrend[entry.trend] += 1;
    teams.add(entry.teamLabel);
    if (entry.programKey !== undefined && entry.programKey.length > 0) {
      programs.add(entry.programKey);
    }
    if (entry.metricKind === 'dora') {
      doraCount += 1;
    } else {
      productivityCount += 1;
    }
  }

  return {
    totalEntries: entries.length,
    byMetric,
    byBand,
    byTrend,
    doraCount,
    productivityCount,
    uniqueTeams: sortedAscending([...teams]),
    uniquePrograms: sortedAscending([...programs]),
  };
}

/**
 * Filter to DORA entries only. Returns items in input order.
 */
export function getDoraEntries(
  entries: readonly ProductivityDoraEntry[] = PRODUCTIVITY_DORA_SEED,
): readonly ProductivityDoraEntry[] {
  return entries.filter((entry) => entry.metricKind === 'dora');
}

/**
 * Filter to productivity entries only. Returns items in input order.
 */
export function getProductivityEntries(
  entries: readonly ProductivityDoraEntry[] = PRODUCTIVITY_DORA_SEED,
): readonly ProductivityDoraEntry[] {
  return entries.filter((entry) => entry.metricKind === 'productivity');
}

/**
 * Return entries that are either trending downward or are sitting in
 * the low band. These are the entries Atlas surfaces as productivity
 * gaps so the Tower can render attention rather than a fabricated
 * uplift number.
 */
export function getDecliningOrLowBandEntries(
  entries: readonly ProductivityDoraEntry[] = PRODUCTIVITY_DORA_SEED,
): readonly ProductivityDoraEntry[] {
  return entries.filter(
    (entry) => entry.trend === 'declining' || entry.band === 'low',
  );
}
