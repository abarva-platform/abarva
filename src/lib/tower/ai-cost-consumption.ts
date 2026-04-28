// ACT6 · AI Cost / Consumption Read Model
//
// Operationalizes the AI Cost & Consumption dimension of the AI Control
// Tower contract (ACT1). Projects a deterministic, cross-tenant
// inventory of license, token, API call, and (seed-only) USD cost
// records keyed by canonical scope (tenant / program / workflow / user)
// so the Tower can compose Atlas brief content, scorecards, and
// pressure cards in later slices.
//
// This is a deterministic seed-only read model. There are no:
//
// - live integrations,
// - external API calls,
// - migrations,
// - LLM / model invocations,
// - timestamp-dependent values,
// - random values,
// - real billing data,
// - tenant database lookups,
// - imports from Source / Sentinel / Atlas / Nexus / Agent runtime,
//   auth, or supabase.
//
// Future ACT6.x slices will:
//
// - bind these records to per-tenant captured Model Gateway audit
//   records and license inventories,
// - replace the seed with a connector-backed projection,
// - persist edits and audit trails through Steward,
// - feed the seed into Atlas brief composition (ACT9).
//
// Until then, this module is the only canonical source for AI cost /
// consumption shape across the Tower surface.
//
// ---------------------------------------------------------------------
// No-fabrication contract
// ---------------------------------------------------------------------
//
// Every numeric value is a *seed projection*, not a live, audited
// number. Provider labels are placeholder strings (`provider_alpha`,
// `provider_beta`, `provider_gamma`) — the Tower never claims
// endorsement of a real provider here. USD-denominated entries use
// round-number placeholders (0 / 100 / 500 / 1000 / 2500 / 5000) so the
// surface never renders a fabricated dollar narrative.

// ---------------------------------------------------------------------
// Canonical enums
// ---------------------------------------------------------------------

/**
 * Canonical cost / consumption scopes. Mirrors the four levels at which
 * the Tower expects to slice consumption: enterprise tenant, AI
 * program, individual workflow, and individual user.
 */
export const AI_COST_CONSUMPTION_SCOPES = [
  'tenant',
  'program',
  'workflow',
  'user',
] as const;

export type AiCostConsumptionScope =
  (typeof AI_COST_CONSUMPTION_SCOPES)[number];

/**
 * Canonical measurement units. Tracks license seats, input/output token
 * volume, raw API call volume, and a seed-only USD cost. The
 * `'usd_cost'` unit explicitly tags a dollar-denominated seed
 * projection so the Tower surface never renders the number as an
 * audited fact.
 */
export const AI_COST_UNITS = [
  'licenses',
  'tokens_input',
  'tokens_output',
  'api_calls',
  'usd_cost',
] as const;

export type AiCostUnit = (typeof AI_COST_UNITS)[number];

/**
 * Canonical utilization labels. Captures whether the seed entry's
 * measured consumption is below, within, above, or beyond its budget
 * envelope.
 *
 * Thresholds (test-enforced):
 *
 * - `underused`     → ratio  < 0.5
 * - `normal`        → 0.5 ≤ ratio ≤ 0.85
 * - `high`          → 0.85 < ratio ≤ 1.0
 * - `over_budget`   → ratio  > 1.0
 *
 * When the budget is `0` and consumption is `0`, the result is
 * `'normal'`. When the budget is `0` and consumption is positive, the
 * result is `'over_budget'`.
 */
export const AI_COST_UTILIZATION_LEVELS = [
  'underused',
  'normal',
  'high',
  'over_budget',
] as const;

export type AiCostUtilization = (typeof AI_COST_UTILIZATION_LEVELS)[number];

// ---------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------

/**
 * A single canonical AI cost / consumption ledger entry. Every field is
 * deterministic. All linked ids are seed ids that resolve only against
 * other deterministic seeds.
 */
export interface AiCostConsumptionEntry {
  /** Stable seed id of the form `cost-seed-{n}`. */
  readonly id: string;
  /** Canonical scope this entry rolls up to. */
  readonly scope: AiCostConsumptionScope;
  /**
   * Stable scope identifier. For `tenant` scope this is the tenant
   * slug; for `program` scope this is a canonical programKey; for
   * `workflow` scope this is a canonical workflow seed id; for `user`
   * scope this is a deterministic role-based label (no real person
   * names).
   */
  readonly scopeKey: string;
  /** Human-readable label for the scope. */
  readonly scopeLabel: string;
  /** Canonical programKey, when the entry is program-anchored. */
  readonly programKey?: string;
  /**
   * Placeholder provider label. Always one of `provider_alpha`,
   * `provider_beta`, or `provider_gamma`. Never a real vendor name.
   */
  readonly providerLabel: 'provider_alpha' | 'provider_beta' | 'provider_gamma';
  /** Canonical measurement unit. */
  readonly unit: AiCostUnit;
  /** Seed-projected consumption value (numeric, finite, ≥ 0). */
  readonly consumption: number;
  /** Seed-projected budget envelope (numeric, finite, ≥ 0). */
  readonly budget: number;
  /** Seed-flagged USD cost projection (round number; 0 when N/A). */
  readonly usdCostSeed: number;
  /** Free-form deterministic notes (≥ 1 per entry). */
  readonly notes: readonly string[];
  /** Provenance flag — every seed entry carries this. */
  readonly seed_value: true;
  /** Provenance marker. Always `'deterministic_ai_cost_consumption_seed'`. */
  readonly createdFrom: 'deterministic_ai_cost_consumption_seed';
}

/**
 * Aggregated cost / consumption summary. All count records expose every
 * canonical key (zero allowed) so the Tower surface can render a
 * complete histogram even when buckets are empty.
 */
export interface AiCostConsumptionSummary {
  readonly totalEntries: number;
  readonly byScope: Readonly<Record<AiCostConsumptionScope, number>>;
  readonly byUnit: Readonly<Record<AiCostUnit, number>>;
  readonly byUtilization: Readonly<Record<AiCostUtilization, number>>;
  readonly totalUsdCostSeed: number;
  readonly overBudgetCount: number;
  readonly uniqueScopeKeys: readonly string[];
}

/**
 * Optional explicit budget override, used to compute utilization for
 * an entry against an external envelope rather than the entry's own
 * `budget` field.
 */
export interface AiCostBudget {
  readonly scope: AiCostConsumptionScope;
  readonly scopeKey: string;
  readonly unit: AiCostUnit;
  readonly budget: number;
}

// ---------------------------------------------------------------------
// Deterministic seed
// ---------------------------------------------------------------------

/**
 * Build a numbered seed id. Single source of truth so callers cannot
 * accidentally diverge id formats.
 */
function costSeedId(n: number): string {
  return `cost-seed-${n}`;
}

/**
 * Canonical AI cost / consumption seed.
 *
 * Field-by-field determinism: every value is a string literal or a
 * literal numeric / boolean. There is no reliance on the host
 * environment's clock, randomness, or environment variables.
 *
 * Distribution (test-enforced):
 *
 * - ≥ 16 entries.
 * - All 4 canonical scopes represented (≥ 1 each).
 * - All 5 canonical units represented (≥ 1 each).
 * - All 4 utilization levels reachable from the seed when paired
 *   against each entry's own `budget` (≥ 1 each).
 * - ≥ 2 entries are over budget.
 * - ≥ 2 entries link a canonical programKey from mock.ts.
 * - Every entry carries `seed_value: true`,
 *   `createdFrom: 'deterministic_ai_cost_consumption_seed'`, and a
 *   placeholder provider label (no real vendor names).
 * - Every USD cost is a round-number placeholder
 *   (one of 0 / 100 / 500 / 1000 / 2500 / 5000).
 */
const AI_COST_CONSUMPTION_SEED: readonly AiCostConsumptionEntry[] = [
  // -------------------------------------------------------------------
  // Scope: tenant — enterprise-wide license rollups
  // -------------------------------------------------------------------
  {
    id: costSeedId(1),
    scope: 'tenant',
    scopeKey: 'tenant-apex-retail',
    scopeLabel: 'Apex Retail (enterprise tenant)',
    providerLabel: 'provider_alpha',
    unit: 'licenses',
    consumption: 380,
    budget: 500,
    usdCostSeed: 5000,
    notes: [
      'seed projection only; license count is a deterministic seed value, not an audited contract figure.',
    ],
    seed_value: true,
    createdFrom: 'deterministic_ai_cost_consumption_seed',
  },
  {
    id: costSeedId(2),
    scope: 'tenant',
    scopeKey: 'tenant-meridian',
    scopeLabel: 'Meridian (enterprise tenant)',
    providerLabel: 'provider_beta',
    unit: 'licenses',
    consumption: 260,
    budget: 250,
    usdCostSeed: 2500,
    notes: [
      'seed projection only; over-budget by deterministic margin to surface utilization helper.',
    ],
    seed_value: true,
    createdFrom: 'deterministic_ai_cost_consumption_seed',
  },
  {
    id: costSeedId(3),
    scope: 'tenant',
    scopeKey: 'tenant-apex-retail',
    scopeLabel: 'Apex Retail (enterprise tenant)',
    providerLabel: 'provider_gamma',
    unit: 'usd_cost',
    consumption: 1000,
    budget: 2500,
    usdCostSeed: 1000,
    notes: [
      'seed projection only; usd_cost is round-number placeholder, not an audited bill.',
    ],
    seed_value: true,
    createdFrom: 'deterministic_ai_cost_consumption_seed',
  },

  // -------------------------------------------------------------------
  // Scope: program — programKey-anchored consumption
  // -------------------------------------------------------------------
  {
    id: costSeedId(4),
    scope: 'program',
    scopeKey: 'contact-center-ai',
    scopeLabel: 'Contact Center AI program',
    programKey: 'contact-center-ai',
    providerLabel: 'provider_alpha',
    unit: 'tokens_input',
    consumption: 800000,
    budget: 1000000,
    usdCostSeed: 500,
    notes: [
      'seed projection only; token volume is a deterministic seed projection.',
    ],
    seed_value: true,
    createdFrom: 'deterministic_ai_cost_consumption_seed',
  },
  {
    id: costSeedId(5),
    scope: 'program',
    scopeKey: 'contact-center-ai',
    scopeLabel: 'Contact Center AI program',
    programKey: 'contact-center-ai',
    providerLabel: 'provider_alpha',
    unit: 'tokens_output',
    consumption: 200000,
    budget: 250000,
    usdCostSeed: 500,
    notes: [
      'seed projection only; output token volume is a deterministic seed projection.',
    ],
    seed_value: true,
    createdFrom: 'deterministic_ai_cost_consumption_seed',
  },
  {
    id: costSeedId(6),
    scope: 'program',
    scopeKey: 'demand-forecasting-ai',
    scopeLabel: 'Demand Forecasting AI program',
    programKey: 'demand-forecasting-ai',
    providerLabel: 'provider_beta',
    unit: 'api_calls',
    consumption: 95000,
    budget: 100000,
    usdCostSeed: 1000,
    notes: [
      'seed projection only; high utilization band exercises calculateAiCostUtilization.',
    ],
    seed_value: true,
    createdFrom: 'deterministic_ai_cost_consumption_seed',
  },
  {
    id: costSeedId(7),
    scope: 'program',
    scopeKey: 'unified-customer-data-platform',
    scopeLabel: 'Unified Customer Data Platform program',
    programKey: 'unified-customer-data-platform',
    providerLabel: 'provider_gamma',
    unit: 'usd_cost',
    consumption: 500,
    budget: 2500,
    usdCostSeed: 500,
    notes: [
      'seed projection only; usd_cost is a round-number placeholder.',
    ],
    seed_value: true,
    createdFrom: 'deterministic_ai_cost_consumption_seed',
  },
  {
    id: costSeedId(8),
    scope: 'program',
    scopeKey: 'store-associate-productivity',
    scopeLabel: 'Store Associate Productivity program',
    programKey: 'store-associate-productivity',
    providerLabel: 'provider_alpha',
    unit: 'licenses',
    consumption: 120,
    budget: 100,
    usdCostSeed: 1000,
    notes: [
      'seed projection only; over-budget to exercise getOverBudgetEntries.',
    ],
    seed_value: true,
    createdFrom: 'deterministic_ai_cost_consumption_seed',
  },

  // -------------------------------------------------------------------
  // Scope: workflow — workflow-keyed consumption
  // -------------------------------------------------------------------
  {
    id: costSeedId(9),
    scope: 'workflow',
    scopeKey: 'workflow-seed-contact-center-deflection',
    scopeLabel: 'Contact center self-service deflection workflow',
    programKey: 'contact-center-ai',
    providerLabel: 'provider_alpha',
    unit: 'api_calls',
    consumption: 40000,
    budget: 100000,
    usdCostSeed: 500,
    notes: [
      'seed projection only; underused band exercises calculateAiCostUtilization.',
    ],
    seed_value: true,
    createdFrom: 'deterministic_ai_cost_consumption_seed',
  },
  {
    id: costSeedId(10),
    scope: 'workflow',
    scopeKey: 'workflow-seed-engineering-pr-summary',
    scopeLabel: 'Engineering pull-request summary drafting workflow',
    providerLabel: 'provider_beta',
    unit: 'tokens_input',
    consumption: 600000,
    budget: 1000000,
    usdCostSeed: 500,
    notes: [
      'seed projection only; normal-band utilization sample.',
    ],
    seed_value: true,
    createdFrom: 'deterministic_ai_cost_consumption_seed',
  },
  {
    id: costSeedId(11),
    scope: 'workflow',
    scopeKey: 'workflow-seed-procurement-contract-review',
    scopeLabel: 'Procurement contract review drafting workflow',
    providerLabel: 'provider_beta',
    unit: 'tokens_output',
    consumption: 150000,
    budget: 200000,
    usdCostSeed: 500,
    notes: [
      'seed projection only; output token volume is a deterministic seed projection.',
    ],
    seed_value: true,
    createdFrom: 'deterministic_ai_cost_consumption_seed',
  },
  {
    id: costSeedId(12),
    scope: 'workflow',
    scopeKey: 'workflow-seed-finance-anomaly-narrative',
    scopeLabel: 'Finance period close anomaly narrative drafting workflow',
    providerLabel: 'provider_gamma',
    unit: 'usd_cost',
    consumption: 100,
    budget: 500,
    usdCostSeed: 100,
    notes: [
      'seed projection only; underused band exercises calculateAiCostUtilization.',
    ],
    seed_value: true,
    createdFrom: 'deterministic_ai_cost_consumption_seed',
  },

  // -------------------------------------------------------------------
  // Scope: user — role-based labels (no real person names)
  // -------------------------------------------------------------------
  {
    id: costSeedId(13),
    scope: 'user',
    scopeKey: 'role-engineering-power-user-cohort',
    scopeLabel: 'Engineering power-user cohort (role label)',
    providerLabel: 'provider_alpha',
    unit: 'tokens_input',
    consumption: 1100000,
    budget: 1000000,
    usdCostSeed: 1000,
    notes: [
      'seed projection only; cohort identifier is a role label, not a real person.',
      'over-budget by deterministic margin to exercise getOverBudgetEntries.',
    ],
    seed_value: true,
    createdFrom: 'deterministic_ai_cost_consumption_seed',
  },
  {
    id: costSeedId(14),
    scope: 'user',
    scopeKey: 'role-support-agent-cohort',
    scopeLabel: 'Support agent cohort (role label)',
    providerLabel: 'provider_alpha',
    unit: 'api_calls',
    consumption: 25000,
    budget: 50000,
    usdCostSeed: 500,
    notes: [
      'seed projection only; cohort identifier is a role label, not a real person.',
    ],
    seed_value: true,
    createdFrom: 'deterministic_ai_cost_consumption_seed',
  },
  {
    id: costSeedId(15),
    scope: 'user',
    scopeKey: 'role-finance-analyst-cohort',
    scopeLabel: 'Finance analyst cohort (role label)',
    providerLabel: 'provider_beta',
    unit: 'licenses',
    consumption: 30,
    budget: 40,
    usdCostSeed: 100,
    notes: [
      'seed projection only; cohort identifier is a role label, not a real person.',
    ],
    seed_value: true,
    createdFrom: 'deterministic_ai_cost_consumption_seed',
  },
  {
    id: costSeedId(16),
    scope: 'user',
    scopeKey: 'role-knowledge-worker-cohort',
    scopeLabel: 'Knowledge worker cohort (role label)',
    providerLabel: 'provider_gamma',
    unit: 'tokens_output',
    consumption: 0,
    budget: 100000,
    usdCostSeed: 0,
    notes: [
      'seed projection only; zero-consumption row exercises underused band and zero-cost path.',
    ],
    seed_value: true,
    createdFrom: 'deterministic_ai_cost_consumption_seed',
  },
];

// ---------------------------------------------------------------------
// Public helpers
// ---------------------------------------------------------------------

/**
 * Build the canonical AI cost / consumption seed. Result is a frozen,
 * deterministic list — repeated calls return byte-equal data.
 */
export function buildAiCostConsumptionSeed(): readonly AiCostConsumptionEntry[] {
  return AI_COST_CONSUMPTION_SEED;
}

/**
 * Initialize a per-scope record where every canonical scope is present
 * with count 0.
 */
function emptyScopeCounts(): Record<AiCostConsumptionScope, number> {
  const out: Record<AiCostConsumptionScope, number> = {
    tenant: 0,
    program: 0,
    workflow: 0,
    user: 0,
  };
  return out;
}

/**
 * Initialize a per-unit record where every canonical unit is present
 * with count 0.
 */
function emptyUnitCounts(): Record<AiCostUnit, number> {
  const out: Record<AiCostUnit, number> = {
    licenses: 0,
    tokens_input: 0,
    tokens_output: 0,
    api_calls: 0,
    usd_cost: 0,
  };
  return out;
}

/**
 * Initialize a per-utilization record where every canonical level is
 * present with count 0.
 */
function emptyUtilizationCounts(): Record<AiCostUtilization, number> {
  const out: Record<AiCostUtilization, number> = {
    underused: 0,
    normal: 0,
    high: 0,
    over_budget: 0,
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
 * Calculate the canonical utilization label for an entry against either
 * the entry's own budget (default) or an explicit override.
 *
 * Pure function — no clock, no randomness, no side-effects.
 */
export function calculateAiCostUtilization(
  entry: AiCostConsumptionEntry,
  budget?: AiCostBudget,
): AiCostUtilization {
  const envelope = budget?.budget ?? entry.budget;
  const consumption = entry.consumption;

  if (envelope === 0) {
    return consumption === 0 ? 'normal' : 'over_budget';
  }

  const ratio = consumption / envelope;

  if (ratio > 1) {
    return 'over_budget';
  }
  if (ratio > 0.85) {
    return 'high';
  }
  if (ratio < 0.5) {
    return 'underused';
  }
  return 'normal';
}

/**
 * Build the deterministic summary for a cost / consumption list. When
 * no entries list is provided, summarizes the canonical seed.
 *
 * Reconciliation guarantees:
 *
 * - `Object.values(byScope).reduce(...)` equals `totalEntries`.
 * - `Object.values(byUnit).reduce(...)` equals `totalEntries`.
 * - `Object.values(byUtilization).reduce(...)` equals `totalEntries`.
 * - `totalUsdCostSeed` equals the sum of `usdCostSeed` across all
 *   entries.
 * - `overBudgetCount` counts entries whose utilization is
 *   `'over_budget'` against their own budget.
 * - `uniqueScopeKeys` is sorted ascending and contains no duplicates.
 */
export function summarizeAiCostConsumption(
  entries: readonly AiCostConsumptionEntry[] = AI_COST_CONSUMPTION_SEED,
): AiCostConsumptionSummary {
  const byScope = emptyScopeCounts();
  const byUnit = emptyUnitCounts();
  const byUtilization = emptyUtilizationCounts();
  const scopeKeys = new Set<string>();
  let totalUsdCostSeed = 0;
  let overBudgetCount = 0;

  for (const entry of entries) {
    byScope[entry.scope] += 1;
    byUnit[entry.unit] += 1;
    const utilization = calculateAiCostUtilization(entry);
    byUtilization[utilization] += 1;
    if (utilization === 'over_budget') {
      overBudgetCount += 1;
    }
    totalUsdCostSeed += entry.usdCostSeed;
    scopeKeys.add(entry.scopeKey);
  }

  return {
    totalEntries: entries.length,
    byScope,
    byUnit,
    byUtilization,
    totalUsdCostSeed,
    overBudgetCount,
    uniqueScopeKeys: sortedAscending([...scopeKeys]),
  };
}

/**
 * Return entries whose consumption exceeds their own budget envelope.
 * The Tower uses these as the "cost pressure" input for Atlas brief
 * composition.
 */
export function getOverBudgetEntries(
  entries: readonly AiCostConsumptionEntry[] = AI_COST_CONSUMPTION_SEED,
): readonly AiCostConsumptionEntry[] {
  return entries.filter(
    (entry) => calculateAiCostUtilization(entry) === 'over_budget',
  );
}
