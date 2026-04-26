// ACT11 · Adoption × Cost × Productivity Correlation Read Model
//
// Operationalizes the cross-dimension correlation surface of the AI
// Control Tower contract (ACT1). Projects a deterministic, cross-
// tenant set of structural correlation pairings between the existing
// Tower read models — AI adoption (ACT3), AI cost (ACT8 / cost rails),
// AI productivity / DORA (ACT7), and AI value realization (ACT4) —
// that the Tower can compose into Atlas brief content, scorecards,
// and pressure cards in later slices.
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
// - statistical inference (no Pearson / Spearman / regression / etc.),
// - imports from Source / Sentinel / Atlas / Nexus / Agent runtime,
//   auth, or supabase.
//
// The "correlation" expressed here is *structural pairing* between two
// signal kinds — not a statistical coefficient. The seed records the
// expected qualitative relationship (positive / negative / neutral /
// unknown) and a banded strength (weak / moderate / strong / unknown)
// so the Tower surface can describe how two dimensions move together
// without inventing a coefficient. Atlas refuses to render a numeric
// correlation coefficient against this seed; only the banded
// `direction` and `strength` are surfaced.
//
// Future ACT11.x slices will:
//
// - bind these pairings to per-tenant captured signal pairs,
// - replace the seed with a connector-backed projection,
// - persist edits and audit trails through Steward,
// - feed the seed into Atlas brief composition (ACT9).
//
// Until then, this module is the only canonical source for the
// adoption × cost × productivity correlation shape across the Tower
// surface.
//
// ---------------------------------------------------------------------
// No-fabrication contract
// ---------------------------------------------------------------------
//
// 1. No statistical inference. Every pairing is a structural seed
//    pairing, not a computed coefficient.
// 2. No invented dollar amounts. Every cost reference is keyed by a
//    canonical signal id; no entry inlines a `$`-prefixed narrative.
// 3. No vendor brand claims. Tool references go through the canonical
//    `AiToolKey` space (ACT3) and program / use-case references go
//    through the canonical seed string spaces (ACT2 / ACT4).
// 4. No live telemetry claim. Every pairing carries
//    `seed_value: true` and
//    `createdFrom: 'deterministic_adoption_cost_productivity_correlation_seed'`.

// ---------------------------------------------------------------------
// Canonical enums
// ---------------------------------------------------------------------

/**
 * The four canonical signal kinds the correlation read model pairs.
 *
 * - `adoption` — AI adoption / usage signal (mirrors ACT3).
 * - `cost` — AI cost / spend signal (mirrors the cost rails). The
 *   cost signal is keyed by a deterministic seed id, not a dollar
 *   number.
 * - `productivity_dora` — productivity / DORA signal (mirrors ACT7).
 * - `value_realization` — value / outcome ledger signal (mirrors ACT4).
 */
export const CORRELATION_SIGNAL_KINDS = [
  'adoption',
  'cost',
  'productivity_dora',
  'value_realization',
] as const;

export type CorrelationSignalKind = (typeof CORRELATION_SIGNAL_KINDS)[number];

/**
 * Canonical correlation direction. The four-way taxonomy lets the Tower
 * surface render an honest `unknown` instead of inventing a sign.
 */
export const CORRELATION_DIRECTIONS = [
  'positive',
  'negative',
  'neutral',
  'unknown',
] as const;

export type CorrelationDirection = (typeof CORRELATION_DIRECTIONS)[number];

/**
 * Canonical correlation strength band. Banded rather than numeric so
 * Atlas cannot render a fabricated coefficient. `unknown` is a
 * first-class state for pairings whose strength cannot be defended
 * from the seed.
 */
export const CORRELATION_STRENGTHS = [
  'weak',
  'moderate',
  'strong',
  'unknown',
] as const;

export type CorrelationStrength = (typeof CORRELATION_STRENGTHS)[number];

// ---------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------

/**
 * A single canonical correlation pairing. Each pairing names the two
 * signal kinds it relates and the canonical seed ids of the two
 * underlying signals. The `direction` and `strength` are banded labels
 * rather than numeric coefficients.
 */
export interface CorrelationPairing {
  /** Stable seed id of the form `correlation-seed-{n}`. */
  readonly id: string;
  /** First signal kind in the pairing. */
  readonly leftKind: CorrelationSignalKind;
  /** Second signal kind in the pairing. */
  readonly rightKind: CorrelationSignalKind;
  /** Canonical seed id of the left signal. */
  readonly leftSignalId: string;
  /** Canonical seed id of the right signal. */
  readonly rightSignalId: string;
  /** Optional canonical program key (mock.ts), if scoped. */
  readonly programKey?: string;
  /** Optional canonical AI use case key, if scoped. */
  readonly aiUseCaseKey?: string;
  /** Banded direction label (positive / negative / neutral / unknown). */
  readonly direction: CorrelationDirection;
  /** Banded strength label (weak / moderate / strong / unknown). */
  readonly strength: CorrelationStrength;
  /**
   * Short narrative naming the structural pairing. Never claims a
   * statistical coefficient.
   */
  readonly rationale: string;
  /** Free-form notes (≥ 1 deterministic note per entry). */
  readonly notes: readonly string[];
  /** Provenance flag — every seed pairing carries this. */
  readonly seed_value: true;
  /** Provenance marker. */
  readonly createdFrom: 'deterministic_adoption_cost_productivity_correlation_seed';
}

/**
 * Aggregated correlation summary. All count records expose every
 * canonical key (zero allowed) so the Tower surface can render a
 * complete histogram even when buckets are empty.
 */
export interface CorrelationSummary {
  readonly totalPairings: number;
  readonly byDirection: Readonly<Record<CorrelationDirection, number>>;
  readonly byStrength: Readonly<Record<CorrelationStrength, number>>;
  readonly bySignalKind: Readonly<Record<CorrelationSignalKind, number>>;
  readonly strongCount: number;
  readonly unknownDirectionCount: number;
  readonly uniquePairKinds: readonly string[];
}

// ---------------------------------------------------------------------
// Deterministic seed
// ---------------------------------------------------------------------

/**
 * Build a numbered seed id. Single source of truth so callers cannot
 * accidentally diverge id formats.
 */
function correlationSeedId(n: number): string {
  return `correlation-seed-${n}`;
}

/**
 * The canonical correlation pairings seed. The seed pairs the four
 * canonical signal kinds across all four direction labels and all four
 * strength bands.
 *
 * Distribution (test-enforced):
 *
 * - All four signal kinds appear as the `leftKind` or `rightKind` of
 *   at least one pairing.
 * - All four direction labels are represented at least once.
 * - All four strength bands are represented at least once.
 * - Every pairing carries `seed_value: true` and
 *   `createdFrom: 'deterministic_adoption_cost_productivity_correlation_seed'`.
 * - No pairing fabricates a numeric coefficient or dollar narrative.
 *
 * Pairing keys (`{leftKind}__{rightKind}`) are kept in input order to
 * preserve byte-equal determinism across calls.
 */
const CORRELATION_PAIRINGS_SEED: readonly CorrelationPairing[] = [
  // -------------------------------------------------------------------
  // adoption × productivity_dora
  // -------------------------------------------------------------------
  {
    id: correlationSeedId(1),
    leftKind: 'adoption',
    rightKind: 'productivity_dora',
    leftSignalId: 'ai-adoption-seed-github_copilot',
    rightSignalId: 'dora-seed-engineering-platform-pr_cycle_time',
    programKey: 'contact-center-ai',
    aiUseCaseKey: 'ai-use-case-seed-10',
    direction: 'positive',
    strength: 'moderate',
    rationale:
      'Pairs broad code-completion adoption with the engineering-platform PR cycle time signal; structural pairing only, not a fitted coefficient.',
    notes: [
      'seed projection only; per-tenant adoption + DORA binding lands in ACT11.x.',
      'direction reflects the structural expectation that broader adoption tracks shorter cycle times in the seed.',
    ],
    seed_value: true,
    createdFrom: 'deterministic_adoption_cost_productivity_correlation_seed',
  },
  {
    id: correlationSeedId(2),
    leftKind: 'adoption',
    rightKind: 'productivity_dora',
    leftSignalId: 'ai-adoption-seed-cursor',
    rightSignalId: 'dora-seed-engineering-platform-deployment_frequency',
    direction: 'positive',
    strength: 'weak',
    rationale:
      'Pairs cursor adoption with deployment frequency; weak structural pairing because adoption is uneven across teams in the seed.',
    notes: [
      'seed projection only; weak band reflects partial adoption in the ACT3 seed.',
    ],
    seed_value: true,
    createdFrom: 'deterministic_adoption_cost_productivity_correlation_seed',
  },

  // -------------------------------------------------------------------
  // adoption × cost
  // -------------------------------------------------------------------
  {
    id: correlationSeedId(3),
    leftKind: 'adoption',
    rightKind: 'cost',
    leftSignalId: 'ai-adoption-seed-microsoft_copilot_m365',
    rightSignalId: 'ai-cost-seed-microsoft_copilot_m365',
    direction: 'positive',
    strength: 'strong',
    rationale:
      'Pairs broad M365 Copilot adoption with the matching seat-cost signal; structural pairing only — cost is keyed by seed id, not a dollar number.',
    notes: [
      'seed projection only; strength reflects deterministic 1:1 keying between adoption seat counts and cost seed ids.',
    ],
    seed_value: true,
    createdFrom: 'deterministic_adoption_cost_productivity_correlation_seed',
  },
  {
    id: correlationSeedId(4),
    leftKind: 'adoption',
    rightKind: 'cost',
    leftSignalId: 'ai-adoption-seed-claude_code',
    rightSignalId: 'ai-cost-seed-claude_code',
    direction: 'positive',
    strength: 'moderate',
    rationale:
      'Pairs claude_code adoption with token / seat cost signal; pairing reflects the seed expectation that more usage tracks more spend.',
    notes: [
      'seed projection only; cost field references the canonical seed id and never inlines a dollar narrative.',
    ],
    seed_value: true,
    createdFrom: 'deterministic_adoption_cost_productivity_correlation_seed',
  },

  // -------------------------------------------------------------------
  // adoption × value_realization
  // -------------------------------------------------------------------
  {
    id: correlationSeedId(5),
    leftKind: 'adoption',
    rightKind: 'value_realization',
    leftSignalId: 'ai-adoption-seed-servicenow_ai_agents',
    rightSignalId: 'value-seed-1',
    programKey: 'contact-center-ai',
    aiUseCaseKey: 'ai-use-case-seed-13',
    direction: 'positive',
    strength: 'strong',
    rationale:
      'Pairs ServiceNow AI agent adoption with the contact-center deflection value claim; structural pairing only.',
    notes: [
      'seed projection only; strong band reflects deterministic ACT4 readiness state of measured_in_production.',
    ],
    seed_value: true,
    createdFrom: 'deterministic_adoption_cost_productivity_correlation_seed',
  },
  {
    id: correlationSeedId(6),
    leftKind: 'adoption',
    rightKind: 'value_realization',
    leftSignalId: 'ai-adoption-seed-erp_agents_generic',
    rightSignalId: 'value-seed-14',
    direction: 'unknown',
    strength: 'unknown',
    rationale:
      'Pairs ERP agent adoption with the finance forecast assistant data-access blocker; the value claim is held until governance approves data scope.',
    notes: [
      'seed projection only; the pairing direction is unknown because the value claim is governance-flagged in ACT4.',
      'unknown strength reflects the lack of a defended baseline in the underlying ACT4 entry.',
    ],
    seed_value: true,
    createdFrom: 'deterministic_adoption_cost_productivity_correlation_seed',
  },

  // -------------------------------------------------------------------
  // cost × productivity_dora
  // -------------------------------------------------------------------
  {
    id: correlationSeedId(7),
    leftKind: 'cost',
    rightKind: 'productivity_dora',
    leftSignalId: 'ai-cost-seed-github_copilot',
    rightSignalId: 'dora-seed-engineering-platform-pr_cycle_time',
    direction: 'negative',
    strength: 'moderate',
    rationale:
      'Pairs Copilot seat cost with PR cycle time; the seed expectation is that higher tool spend tracks shorter cycle time, so the directional sign is negative when cycle time is the dependent metric.',
    notes: [
      'seed projection only; the negative direction is the structural sign of cost-vs-time, not a fitted slope.',
    ],
    seed_value: true,
    createdFrom: 'deterministic_adoption_cost_productivity_correlation_seed',
  },
  {
    id: correlationSeedId(8),
    leftKind: 'cost',
    rightKind: 'productivity_dora',
    leftSignalId: 'ai-cost-seed-custom_internal_agents',
    rightSignalId: 'dora-seed-platform-engineering-change_failure_rate',
    direction: 'neutral',
    strength: 'weak',
    rationale:
      'Pairs custom internal agent cost with change failure rate; the seed expectation is that internal agent investment is neutral on failure rate at current adoption.',
    notes: [
      'seed projection only; neutral direction reflects no defended directional signal in the seed.',
    ],
    seed_value: true,
    createdFrom: 'deterministic_adoption_cost_productivity_correlation_seed',
  },

  // -------------------------------------------------------------------
  // cost × value_realization
  // -------------------------------------------------------------------
  {
    id: correlationSeedId(9),
    leftKind: 'cost',
    rightKind: 'value_realization',
    leftSignalId: 'ai-cost-seed-servicenow_ai_agents',
    rightSignalId: 'value-seed-1',
    programKey: 'contact-center-ai',
    direction: 'positive',
    strength: 'strong',
    rationale:
      'Pairs ServiceNow AI agent cost envelope with the contact-center deflection value claim; structural pairing only.',
    notes: [
      'seed projection only; the strong band reflects the measured_in_production readiness of the underlying ACT4 entry.',
    ],
    seed_value: true,
    createdFrom: 'deterministic_adoption_cost_productivity_correlation_seed',
  },
  {
    id: correlationSeedId(10),
    leftKind: 'cost',
    rightKind: 'value_realization',
    leftSignalId: 'ai-cost-seed-codex',
    rightSignalId: 'value-seed-3',
    aiUseCaseKey: 'ai-use-case-seed-10',
    direction: 'negative',
    strength: 'moderate',
    rationale:
      'Pairs codex tool cost with engineering productivity uplift value claim; the seed expectation is that higher per-seat cost reduces realized net value at constant uplift.',
    notes: [
      'seed projection only; direction reflects the structural ratio of cost to realized productivity uplift.',
    ],
    seed_value: true,
    createdFrom: 'deterministic_adoption_cost_productivity_correlation_seed',
  },

  // -------------------------------------------------------------------
  // productivity_dora × value_realization
  // -------------------------------------------------------------------
  {
    id: correlationSeedId(11),
    leftKind: 'productivity_dora',
    rightKind: 'value_realization',
    leftSignalId: 'dora-seed-engineering-platform-lead_time_for_changes',
    rightSignalId: 'value-seed-3',
    aiUseCaseKey: 'ai-use-case-seed-10',
    direction: 'positive',
    strength: 'strong',
    rationale:
      'Pairs lead-time-for-changes with engineering productivity uplift value claim; structural pairing only.',
    notes: [
      'seed projection only; strong band reflects deterministic ACT4 measured_in_production readiness.',
    ],
    seed_value: true,
    createdFrom: 'deterministic_adoption_cost_productivity_correlation_seed',
  },
  {
    id: correlationSeedId(12),
    leftKind: 'productivity_dora',
    rightKind: 'value_realization',
    leftSignalId: 'dora-seed-engineering-platform-defect_leakage',
    rightSignalId: 'value-seed-13',
    aiUseCaseKey: 'ai-use-case-seed-10',
    direction: 'neutral',
    strength: 'weak',
    rationale:
      'Pairs defect leakage with engineering compliance attestation cadence; weak structural pairing because the value claim is attestation-cadence rather than defect-volume.',
    notes: [
      'seed projection only; neutral direction reflects an attestation cadence whose defect signal is weak in the seed.',
    ],
    seed_value: true,
    createdFrom: 'deterministic_adoption_cost_productivity_correlation_seed',
  },

  // -------------------------------------------------------------------
  // productivity_dora × adoption (back-edge for symmetry coverage)
  // -------------------------------------------------------------------
  {
    id: correlationSeedId(13),
    leftKind: 'productivity_dora',
    rightKind: 'adoption',
    leftSignalId: 'dora-seed-engineering-platform-mean_time_to_recovery',
    rightSignalId: 'ai-adoption-seed-claude_code',
    direction: 'unknown',
    strength: 'unknown',
    rationale:
      'Pairs mean-time-to-recovery with claude_code adoption; the seed cannot defend a directional signal because incident reports are seed-only.',
    notes: [
      'seed projection only; unknown reflects an honest absence of defended pairing.',
    ],
    seed_value: true,
    createdFrom: 'deterministic_adoption_cost_productivity_correlation_seed',
  },

  // -------------------------------------------------------------------
  // value_realization × cost (back-edge with negative-strong cell)
  // -------------------------------------------------------------------
  {
    id: correlationSeedId(14),
    leftKind: 'value_realization',
    rightKind: 'cost',
    leftSignalId: 'value-seed-8',
    rightSignalId: 'ai-cost-seed-erp_agents_generic',
    direction: 'negative',
    strength: 'strong',
    rationale:
      'Pairs the declined HR resume screening fairness value claim with ERP agent cost; the value claim is declined so any cost is a loss.',
    notes: [
      'seed projection only; strong negative direction reflects an ACT4 readiness state of declined.',
    ],
    seed_value: true,
    createdFrom: 'deterministic_adoption_cost_productivity_correlation_seed',
  },
];

// ---------------------------------------------------------------------
// Public helpers
// ---------------------------------------------------------------------

/**
 * Build the canonical correlation seed. Result is a frozen,
 * deterministic list — repeated calls return byte-equal data.
 */
export function buildCorrelationSeed(): readonly CorrelationPairing[] {
  return CORRELATION_PAIRINGS_SEED;
}

/**
 * Initialize a per-direction record where every canonical direction is
 * present with count 0.
 */
function emptyDirectionCounts(): Record<CorrelationDirection, number> {
  const out: Record<CorrelationDirection, number> = {
    positive: 0,
    negative: 0,
    neutral: 0,
    unknown: 0,
  };
  return out;
}

/**
 * Initialize a per-strength record where every canonical strength is
 * present with count 0.
 */
function emptyStrengthCounts(): Record<CorrelationStrength, number> {
  const out: Record<CorrelationStrength, number> = {
    weak: 0,
    moderate: 0,
    strong: 0,
    unknown: 0,
  };
  return out;
}

/**
 * Initialize a per-signal-kind record where every canonical signal
 * kind is present with count 0.
 */
function emptySignalKindCounts(): Record<CorrelationSignalKind, number> {
  const out: Record<CorrelationSignalKind, number> = {
    adoption: 0,
    cost: 0,
    productivity_dora: 0,
    value_realization: 0,
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
 * Build a deterministic pair-kind label of the form
 * `{leftKind}__{rightKind}`. Used for `uniquePairKinds`.
 */
function pairKindLabel(p: CorrelationPairing): string {
  return `${p.leftKind}__${p.rightKind}`;
}

/**
 * Build the deterministic summary for a list of pairings. When no
 * pairings list is provided, summarizes the canonical seed.
 *
 * Reconciliation guarantees:
 *
 * - `Object.values(byDirection).reduce(...)` equals `totalPairings`.
 * - `Object.values(byStrength).reduce(...)` equals `totalPairings`.
 * - `Object.values(bySignalKind).reduce(...)` equals
 *   `totalPairings * 2` (each pairing contributes both kinds).
 * - `strongCount` equals `byStrength.strong`.
 * - `unknownDirectionCount` equals `byDirection.unknown`.
 * - `uniquePairKinds` is sorted ascending and contains no duplicates.
 */
export function summarizeCorrelations(
  pairings: readonly CorrelationPairing[] = CORRELATION_PAIRINGS_SEED,
): CorrelationSummary {
  const byDirection = emptyDirectionCounts();
  const byStrength = emptyStrengthCounts();
  const bySignalKind = emptySignalKindCounts();
  const pairKinds = new Set<string>();

  for (const pairing of pairings) {
    byDirection[pairing.direction] += 1;
    byStrength[pairing.strength] += 1;
    bySignalKind[pairing.leftKind] += 1;
    bySignalKind[pairing.rightKind] += 1;
    pairKinds.add(pairKindLabel(pairing));
  }

  return {
    totalPairings: pairings.length,
    byDirection,
    byStrength,
    bySignalKind,
    strongCount: byStrength.strong,
    unknownDirectionCount: byDirection.unknown,
    uniquePairKinds: sortedAscending([...pairKinds]),
  };
}

/**
 * Return pairings whose `strength` is `'strong'`. These are the pairings
 * Atlas can attach a defended (still seed-flagged) directional signal
 * to.
 */
export function getStrongCorrelations(
  pairings: readonly CorrelationPairing[] = CORRELATION_PAIRINGS_SEED,
): readonly CorrelationPairing[] {
  return pairings.filter((pairing) => pairing.strength === 'strong');
}
