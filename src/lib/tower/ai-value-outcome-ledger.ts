// ACT4 · AI Value / Outcome Ledger Read Model
//
// Operationalizes the value-and-outcome dimension of the AI Control
// Tower contract (ACT1). Projects a deterministic, cross-tenant ledger
// of AI value claims that the Tower can compose into Atlas brief
// content, scorecards, and pressure cards in later slices.
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
// Future ACT4.x slices will:
//
// - bind these records to per-tenant captured value claims,
// - replace the seed with a connector-backed projection,
// - persist edits and audit trails through Steward,
// - feed the seed into Atlas brief composition (ACT9).
//
// Until then, this module is the only canonical source for AI value /
// outcome ledger shape across the Tower surface.
//
// ---------------------------------------------------------------------
// No-fabrication contract
// ---------------------------------------------------------------------
//
// Every numeric value is a *seed projection*, not a live, audited
// dollar number. Every dollar-denominated entry uses the
// `'usd_seed'` measurement unit so downstream renderers can mark the
// value as a seed projection rather than an audited fact. Strings
// describe scope and method; they never claim a fabricated dollar
// uplift, branded vendor outcome, or "industry average" benchmark.
//
// Atlas refuses to claim a defended dollar number for any entry whose
// `readiness` is not `'measured_in_pilot'` or
// `'measured_in_production'`, and even then renders the value as a
// seed projection until per-tenant binding lands in ACT4.x.

// ---------------------------------------------------------------------
// Canonical enums
// ---------------------------------------------------------------------

/**
 * Canonical value categories. Mirrors the seven outcome buckets
 * referenced in the ACT1 Atlas brief shape. Atlas refuses to surface a
 * value claim whose category is outside this tuple.
 */
export const VALUE_LEDGER_CATEGORIES = [
  'cost_avoidance',
  'productivity',
  'revenue_lift',
  'risk_reduction',
  'customer_experience',
  'employee_experience',
  'compliance',
] as const;

export type ValueLedgerCategory = (typeof VALUE_LEDGER_CATEGORIES)[number];

/**
 * Canonical measurement units.
 *
 * The `'usd_seed'` unit explicitly tags a dollar-denominated seed
 * projection so the Tower surface never renders the number as an
 * audited fact. The remaining units are non-monetary outcome
 * measurements.
 */
export const VALUE_MEASUREMENT_UNITS = [
  'usd_seed',
  'percent',
  'hours_saved_per_week',
  'tickets_per_day',
  'nps_delta',
  'incidents_per_quarter',
] as const;

export type ValueMeasurementUnit = (typeof VALUE_MEASUREMENT_UNITS)[number];

/**
 * Canonical readiness states for a value claim.
 *
 * Ordered: projected_only → baseline_pending → baseline_set →
 * in_pilot_measurement → measured_in_pilot → measured_in_production →
 * declined.
 *
 * Atlas refuses to defend a dollar number for any state other than
 * `'measured_in_pilot'` or `'measured_in_production'`.
 */
export const VALUE_READINESS_STATES = [
  'projected_only',
  'baseline_pending',
  'baseline_set',
  'in_pilot_measurement',
  'measured_in_pilot',
  'measured_in_production',
  'declined',
] as const;

export type ValueReadinessState = (typeof VALUE_READINESS_STATES)[number];

/**
 * Canonical confidence labels for the counterfactual narrative. The
 * counterfactual is the comparison condition (what would have happened
 * absent the AI initiative); confidence describes how rigorously the
 * comparison is established.
 */
export const VALUE_COUNTERFACTUAL_CONFIDENCE_LEVELS = [
  'low',
  'medium',
  'high',
] as const;

export type ValueCounterfactualConfidence =
  (typeof VALUE_COUNTERFACTUAL_CONFIDENCE_LEVELS)[number];

/**
 * Canonical governance review statuses for a value claim.
 */
export const VALUE_GOVERNANCE_REVIEW_STATUSES = [
  'not_started',
  'in_review',
  'approved',
  'flagged',
] as const;

export type ValueGovernanceReviewStatus =
  (typeof VALUE_GOVERNANCE_REVIEW_STATUSES)[number];

// ---------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------

/**
 * A single canonical value / outcome ledger entry. Every field is
 * deterministic. All linked ids are seed ids that resolve only against
 * other deterministic seeds.
 */
export interface ValueLedgerEntry {
  /** Stable seed id of the form `value-seed-{n}`. */
  readonly id: string;
  /** Human-readable initiative name. */
  readonly initiative: string;
  /** Canonical program key (mock.ts), if applicable. */
  readonly programKey?: string;
  /** Canonical AI use case key (`ai-use-case-seed-{n}`), if applicable. */
  readonly aiUseCaseKey?: string;
  /** Canonical value category. */
  readonly category: ValueLedgerCategory;
  /** Canonical measurement unit. */
  readonly measurementUnit: ValueMeasurementUnit;
  /** Seed projection value (numeric). */
  readonly projectedValue: number;
  /** Realized seed value, or null when not yet measured. */
  readonly realizedValue: number | null;
  /** Baseline seed value, or null when no baseline is captured yet. */
  readonly baselineValue: number | null;
  /** `realizedValue - projectedValue`, or null when realized is null. */
  readonly varianceAbs: number | null;
  /** `(realizedValue - projectedValue) / projectedValue * 100`, or null. */
  readonly variancePercent: number | null;
  /** Role label for the measurement owner (no personal identifiers). */
  readonly measurementOwnerRole: string;
  /** Narrative description of the comparison condition. */
  readonly counterfactual: string;
  /** Confidence label for the counterfactual narrative. */
  readonly counterfactualConfidence: ValueCounterfactualConfidence;
  /** Canonical readiness state for the value claim. */
  readonly readiness: ValueReadinessState;
  /** EVID3-style claim id list (may be empty). */
  readonly evidenceLinkedClaimIds: readonly string[];
  /** Canonical governance review status. */
  readonly governanceReviewStatus: ValueGovernanceReviewStatus;
  /** Free-form notes (≥ 1 deterministic note per entry). */
  readonly notes: readonly string[];
  /** Provenance flag — every seed entry carries this. */
  readonly seed_value: true;
  /** Provenance marker. Always `'deterministic_value_outcome_ledger_seed'`. */
  readonly createdFrom: 'deterministic_value_outcome_ledger_seed';
}

/**
 * Aggregated ledger summary. All count records expose every canonical
 * key (zero allowed) so the Tower surface can render a complete
 * histogram even when buckets are empty.
 */
export interface ValueOutcomeLedgerSummary {
  readonly totalEntries: number;
  readonly byCategory: Readonly<Record<ValueLedgerCategory, number>>;
  readonly byReadiness: Readonly<Record<ValueReadinessState, number>>;
  readonly byMeasurementUnit: Readonly<Record<ValueMeasurementUnit, number>>;
  readonly measuredCount: number;
  readonly projectedOnlyCount: number;
  readonly flaggedGovernanceCount: number;
  readonly uniqueInitiatives: readonly string[];
}

// ---------------------------------------------------------------------
// Deterministic seed
// ---------------------------------------------------------------------

/**
 * Build a numbered seed id. Single source of truth so callers cannot
 * accidentally diverge id formats.
 */
function valueSeedId(n: number): string {
  return `value-seed-${n}`;
}

/**
 * Build a numbered claim seed id used by the EVID3 evaluator.
 *
 * The actual EVID3 evaluator works with any string id; this helper
 * exists so the seed never embeds a free-form `E-###` style citation
 * that the no-fabrication tests would reject.
 */
function claimSeedId(suffix: string): string {
  return `claim-seed-${suffix}`;
}

/**
 * The canonical value / outcome ledger seed. Sixteen+ records spread
 * across all seven categories and all seven readiness states.
 *
 * Field-by-field determinism: every value is a string literal or a
 * literal numeric / boolean. There is no reliance on the host
 * environment's clock, randomness, or environment variables.
 *
 * Distribution (test-enforced):
 *
 * - ≥ 1 entry per canonical category (all 7 categories represented).
 * - ≥ 1 entry per canonical readiness state (all 7 states represented).
 * - ≥ 4 entries with `realizedValue !== null` (computed variance).
 * - ≥ 2 entries with `governanceReviewStatus === 'flagged'`.
 * - ≥ 2 entries linked to `programKey` (canonical seed strings).
 * - ≥ 2 entries linked to `aiUseCaseKey` (canonical seed strings).
 * - Every entry carries `seed_value: true` and
 *   `createdFrom: 'deterministic_value_outcome_ledger_seed'`.
 * - Every dollar value uses the `'usd_seed'` measurement unit.
 * - No string field invents a dollar narrative.
 * - No string field carries a branded vendor endorsement.
 *
 * Variance fields (`varianceAbs`, `variancePercent`) are computed
 * statically below so the seed remains a simple value table.
 */
const VALUE_LEDGER_SEED_BASE: readonly Omit<
  ValueLedgerEntry,
  'varianceAbs' | 'variancePercent'
>[] = [
  // -------------------------------------------------------------------
  // Category: cost_avoidance
  // -------------------------------------------------------------------
  {
    id: valueSeedId(1),
    initiative: 'Customer support deflection via self-service assistant',
    programKey: 'contact-center-ai',
    aiUseCaseKey: 'ai-use-case-seed-13',
    category: 'cost_avoidance',
    measurementUnit: 'usd_seed',
    projectedValue: 1200000,
    realizedValue: 1080000,
    baselineValue: 0,
    measurementOwnerRole: 'VP Customer Experience',
    counterfactual:
      'Comparison condition is the prior-quarter ticket volume served exclusively by tier-1 agents in the same regions; baseline cost-per-contact is held constant for the comparison.',
    counterfactualConfidence: 'medium',
    readiness: 'measured_in_production',
    evidenceLinkedClaimIds: [
      claimSeedId('contact-center-ai-deflection-1'),
      claimSeedId('contact-center-ai-deflection-2'),
    ],
    governanceReviewStatus: 'approved',
    notes: [
      'seed projection only; per-tenant binding lands in ACT4.x.',
      'cost-per-contact baseline is a deterministic seed value, not an audited rate.',
    ],
    seed_value: true,
    createdFrom: 'deterministic_value_outcome_ledger_seed',
  },
  {
    id: valueSeedId(2),
    initiative: 'Procurement contract review cycle compression',
    aiUseCaseKey: 'ai-use-case-seed-1',
    category: 'cost_avoidance',
    measurementUnit: 'hours_saved_per_week',
    projectedValue: 80,
    realizedValue: null,
    baselineValue: 120,
    measurementOwnerRole: 'Chief Procurement Officer',
    counterfactual:
      'Comparison condition is the legal-team manual contract review cadence captured in the discovery brief; no in-pilot measurement is available yet.',
    counterfactualConfidence: 'low',
    readiness: 'projected_only',
    evidenceLinkedClaimIds: [],
    governanceReviewStatus: 'not_started',
    notes: [
      'seed projection only; baseline awaits Procurement Steering Committee confirmation.',
    ],
    seed_value: true,
    createdFrom: 'deterministic_value_outcome_ledger_seed',
  },

  // -------------------------------------------------------------------
  // Category: productivity
  // -------------------------------------------------------------------
  {
    id: valueSeedId(3),
    initiative: 'Engineering code completion adoption uplift',
    aiUseCaseKey: 'ai-use-case-seed-10',
    category: 'productivity',
    measurementUnit: 'percent',
    projectedValue: 18,
    realizedValue: 15,
    baselineValue: 0,
    measurementOwnerRole: 'VP Engineering Productivity',
    counterfactual:
      'Comparison condition is the matched-cohort change-lead-time DORA baseline captured before broad rollout; cohort selection is documented in the seed evidence claim.',
    counterfactualConfidence: 'medium',
    readiness: 'measured_in_production',
    evidenceLinkedClaimIds: [
      claimSeedId('engineering-code-completion-dora-1'),
    ],
    governanceReviewStatus: 'approved',
    notes: [
      'seed projection only; the % uplift is a deterministic seed value, not an industry benchmark.',
    ],
    seed_value: true,
    createdFrom: 'deterministic_value_outcome_ledger_seed',
  },
  {
    id: valueSeedId(4),
    initiative: 'Engineering pull-request review summary pilot',
    aiUseCaseKey: 'ai-use-case-seed-5',
    category: 'productivity',
    measurementUnit: 'hours_saved_per_week',
    projectedValue: 24,
    realizedValue: null,
    baselineValue: null,
    measurementOwnerRole: 'VP Engineering',
    counterfactual:
      'Comparison condition is the Engineering Productivity Council baseline cycle time; baseline capture is in flight for the upcoming review window.',
    counterfactualConfidence: 'low',
    readiness: 'baseline_pending',
    evidenceLinkedClaimIds: [],
    governanceReviewStatus: 'in_review',
    notes: [
      'seed projection only; baseline must be captured before pilot scoping.',
    ],
    seed_value: true,
    createdFrom: 'deterministic_value_outcome_ledger_seed',
  },

  // -------------------------------------------------------------------
  // Category: revenue_lift
  // -------------------------------------------------------------------
  {
    id: valueSeedId(5),
    initiative: 'Operations demand forecast scaled across stores',
    programKey: 'demand-forecasting-ai',
    aiUseCaseKey: 'ai-use-case-seed-14',
    category: 'revenue_lift',
    measurementUnit: 'usd_seed',
    projectedValue: 2400000,
    realizedValue: 2520000,
    baselineValue: 0,
    measurementOwnerRole: 'VP Supply Chain',
    counterfactual:
      'Comparison condition is the prior forecasting model held constant on the same demand window; the seed assumes equivalent promotional cadence.',
    counterfactualConfidence: 'high',
    readiness: 'measured_in_production',
    evidenceLinkedClaimIds: [
      claimSeedId('demand-forecasting-ai-uplift-1'),
      claimSeedId('demand-forecasting-ai-uplift-2'),
    ],
    governanceReviewStatus: 'approved',
    notes: [
      'seed projection only; revenue uplift figure is a deterministic seed value, not an audited finance number.',
    ],
    seed_value: true,
    createdFrom: 'deterministic_value_outcome_ledger_seed',
  },
  {
    id: valueSeedId(6),
    initiative: 'Customer support response suggestion baseline capture',
    programKey: 'contact-center-ai',
    aiUseCaseKey: 'ai-use-case-seed-9',
    category: 'revenue_lift',
    measurementUnit: 'percent',
    projectedValue: 6,
    realizedValue: null,
    baselineValue: 4,
    measurementOwnerRole: 'Director of Support Operations',
    counterfactual:
      'Comparison condition is the prior-quarter cross-sell attach rate held constant on the same customer cohort; baseline is recorded but pilot measurement has not begun.',
    counterfactualConfidence: 'medium',
    readiness: 'baseline_set',
    evidenceLinkedClaimIds: [],
    governanceReviewStatus: 'in_review',
    notes: [
      'seed projection only; cross-sell figures are deterministic seed values.',
    ],
    seed_value: true,
    createdFrom: 'deterministic_value_outcome_ledger_seed',
  },

  // -------------------------------------------------------------------
  // Category: risk_reduction
  // -------------------------------------------------------------------
  {
    id: valueSeedId(7),
    initiative: 'Risk control narrative drafting pilot',
    aiUseCaseKey: 'ai-use-case-seed-7',
    category: 'risk_reduction',
    measurementUnit: 'incidents_per_quarter',
    projectedValue: -12,
    realizedValue: -9,
    baselineValue: 36,
    measurementOwnerRole: 'Chief Risk Officer',
    counterfactual:
      'Comparison condition is the prior-quarter manual control narrative cadence with the same control population; the seed assumes equivalent regulatory scope.',
    counterfactualConfidence: 'medium',
    readiness: 'measured_in_pilot',
    evidenceLinkedClaimIds: [
      claimSeedId('risk-control-narrative-pilot-1'),
    ],
    governanceReviewStatus: 'in_review',
    notes: [
      'seed projection only; incident counts are deterministic seed values, not audited.',
      'negative numbers represent incident reductions versus baseline.',
    ],
    seed_value: true,
    createdFrom: 'deterministic_value_outcome_ledger_seed',
  },
  {
    id: valueSeedId(8),
    initiative: 'HR resume screening fairness remediation (declined)',
    aiUseCaseKey: 'ai-use-case-seed-17',
    category: 'risk_reduction',
    measurementUnit: 'incidents_per_quarter',
    projectedValue: -6,
    realizedValue: null,
    baselineValue: 18,
    measurementOwnerRole: 'Chief Human Resources Officer',
    counterfactual:
      'Comparison condition would have been the matched-cohort screening throughput against the prior manual review baseline; the value claim is declined until fairness evidence is captured.',
    counterfactualConfidence: 'low',
    readiness: 'declined',
    evidenceLinkedClaimIds: [],
    governanceReviewStatus: 'flagged',
    notes: [
      'seed projection only; the value claim is declined pending responsible-AI fairness evidence.',
      'no realized number is recorded because the use case is held at the responsible-AI gate.',
    ],
    seed_value: true,
    createdFrom: 'deterministic_value_outcome_ledger_seed',
  },

  // -------------------------------------------------------------------
  // Category: customer_experience
  // -------------------------------------------------------------------
  {
    id: valueSeedId(9),
    initiative: 'Customer support self-service NPS uplift',
    programKey: 'contact-center-ai',
    aiUseCaseKey: 'ai-use-case-seed-13',
    category: 'customer_experience',
    measurementUnit: 'nps_delta',
    projectedValue: 8,
    realizedValue: 6,
    baselineValue: 32,
    measurementOwnerRole: 'SVP Customer Experience',
    counterfactual:
      'Comparison condition is the prior-quarter NPS cohort with the same channel mix and tenure distribution; the seed assumes equivalent survey response coverage.',
    counterfactualConfidence: 'medium',
    readiness: 'measured_in_production',
    evidenceLinkedClaimIds: [
      claimSeedId('customer-support-self-service-nps-1'),
    ],
    governanceReviewStatus: 'approved',
    notes: [
      'seed projection only; NPS delta is a deterministic seed value, not a survey-platform reading.',
    ],
    seed_value: true,
    createdFrom: 'deterministic_value_outcome_ledger_seed',
  },
  {
    id: valueSeedId(10),
    initiative: 'Customer support voice transcript quality scoring (discovery)',
    programKey: 'contact-center-ai',
    aiUseCaseKey: 'ai-use-case-seed-21',
    category: 'customer_experience',
    measurementUnit: 'percent',
    projectedValue: 12,
    realizedValue: null,
    baselineValue: null,
    measurementOwnerRole: 'Director of Quality Assurance',
    counterfactual:
      'Comparison condition would be the manual QA sample population on the same call mix; consent posture and recording governance must be confirmed before a baseline can be captured.',
    counterfactualConfidence: 'low',
    readiness: 'projected_only',
    evidenceLinkedClaimIds: [],
    governanceReviewStatus: 'in_review',
    notes: [
      'seed projection only; awaits consent and recording governance review before any baseline.',
    ],
    seed_value: true,
    createdFrom: 'deterministic_value_outcome_ledger_seed',
  },

  // -------------------------------------------------------------------
  // Category: employee_experience
  // -------------------------------------------------------------------
  {
    id: valueSeedId(11),
    initiative: 'Operations field service knowledge assistant time recovery',
    aiUseCaseKey: 'ai-use-case-seed-6',
    category: 'employee_experience',
    measurementUnit: 'hours_saved_per_week',
    projectedValue: 14,
    realizedValue: 11,
    baselineValue: 0,
    measurementOwnerRole: 'VP Field Operations',
    counterfactual:
      'Comparison condition is the matched-cohort field service ticket cycle time captured before assistant rollout; the seed assumes equivalent territory mix.',
    counterfactualConfidence: 'medium',
    readiness: 'measured_in_pilot',
    evidenceLinkedClaimIds: [
      claimSeedId('operations-field-service-pilot-1'),
    ],
    governanceReviewStatus: 'approved',
    notes: [
      'seed projection only; hours-saved figure is a deterministic seed value, not a payroll reading.',
    ],
    seed_value: true,
    createdFrom: 'deterministic_value_outcome_ledger_seed',
  },
  {
    id: valueSeedId(12),
    initiative: 'HR onboarding policy assistant adoption baseline',
    aiUseCaseKey: 'ai-use-case-seed-2',
    category: 'employee_experience',
    measurementUnit: 'tickets_per_day',
    projectedValue: -25,
    realizedValue: null,
    baselineValue: 80,
    measurementOwnerRole: 'VP People Operations',
    counterfactual:
      'Comparison condition is the prior-quarter HR support ticket volume on the same employee population; baseline volume is recorded but pilot measurement has not begun.',
    counterfactualConfidence: 'low',
    readiness: 'baseline_set',
    evidenceLinkedClaimIds: [],
    governanceReviewStatus: 'in_review',
    notes: [
      'seed projection only; ticket counts are deterministic seed values.',
      'negative numbers represent ticket volume reductions versus baseline.',
    ],
    seed_value: true,
    createdFrom: 'deterministic_value_outcome_ledger_seed',
  },

  // -------------------------------------------------------------------
  // Category: compliance
  // -------------------------------------------------------------------
  {
    id: valueSeedId(13),
    initiative: 'Engineering code completion governance attestation cadence',
    aiUseCaseKey: 'ai-use-case-seed-10',
    category: 'compliance',
    measurementUnit: 'incidents_per_quarter',
    projectedValue: 0,
    realizedValue: 0,
    baselineValue: 2,
    measurementOwnerRole: 'VP Engineering Productivity',
    counterfactual:
      'Comparison condition is the prior-quarter governance attestation outcome held constant on the same review scope; the seed assumes equivalent attestation breadth.',
    counterfactualConfidence: 'high',
    readiness: 'measured_in_production',
    evidenceLinkedClaimIds: [
      claimSeedId('engineering-code-completion-attestation-1'),
    ],
    governanceReviewStatus: 'approved',
    notes: [
      'seed projection only; attestation incident counts are deterministic seed values.',
    ],
    seed_value: true,
    createdFrom: 'deterministic_value_outcome_ledger_seed',
  },
  {
    id: valueSeedId(14),
    initiative: 'Finance forecast assistant data access blocker (flagged)',
    aiUseCaseKey: 'ai-use-case-seed-18',
    category: 'compliance',
    measurementUnit: 'incidents_per_quarter',
    projectedValue: 0,
    realizedValue: null,
    baselineValue: null,
    measurementOwnerRole: 'Chief Financial Officer',
    counterfactual:
      'Comparison condition would be the prior-quarter forecast review attestation cadence on the same finance scope; the value claim is held until data access is approved.',
    counterfactualConfidence: 'low',
    readiness: 'projected_only',
    evidenceLinkedClaimIds: [],
    governanceReviewStatus: 'flagged',
    notes: [
      'seed projection only; the value claim is held until data access is approved.',
      'flagged for governance review until the Finance Steering Committee approves data scope.',
    ],
    seed_value: true,
    createdFrom: 'deterministic_value_outcome_ledger_seed',
  },

  // -------------------------------------------------------------------
  // Surplus rows to broaden category and readiness coverage and to
  // bring the seed beyond the 16-minimum required by the spec.
  // -------------------------------------------------------------------
  {
    id: valueSeedId(15),
    initiative: 'Procurement vendor risk briefing pilot measurement',
    aiUseCaseKey: 'ai-use-case-seed-8',
    category: 'productivity',
    measurementUnit: 'hours_saved_per_week',
    projectedValue: 18,
    realizedValue: 14,
    baselineValue: 0,
    measurementOwnerRole: 'Director of Vendor Risk',
    counterfactual:
      'Comparison condition is the prior-quarter vendor risk briefing cadence held constant on the same vendor portfolio; the seed assumes equivalent briefing scope.',
    counterfactualConfidence: 'medium',
    readiness: 'in_pilot_measurement',
    evidenceLinkedClaimIds: [
      claimSeedId('procurement-vendor-risk-briefing-pilot-1'),
    ],
    governanceReviewStatus: 'in_review',
    notes: [
      'seed projection only; hours-saved figures are deterministic seed values.',
    ],
    seed_value: true,
    createdFrom: 'deterministic_value_outcome_ledger_seed',
  },
  {
    id: valueSeedId(16),
    initiative: 'Marketing campaign sentiment monitor (retired)',
    aiUseCaseKey: 'ai-use-case-seed-15',
    category: 'customer_experience',
    measurementUnit: 'percent',
    projectedValue: 4,
    realizedValue: null,
    baselineValue: null,
    measurementOwnerRole: 'VP Marketing Analytics',
    counterfactual:
      'Comparison condition would have been the prior-quarter campaign sentiment volume held constant on the same campaign mix; the value claim is declined because the use case is retired.',
    counterfactualConfidence: 'low',
    readiness: 'declined',
    evidenceLinkedClaimIds: [],
    governanceReviewStatus: 'approved',
    notes: [
      'seed projection only; the value claim is declined because the use case is retired.',
    ],
    seed_value: true,
    createdFrom: 'deterministic_value_outcome_ledger_seed',
  },
  {
    id: valueSeedId(17),
    initiative: 'Operations safety incident summary pilot',
    aiUseCaseKey: 'ai-use-case-seed-19',
    category: 'risk_reduction',
    measurementUnit: 'incidents_per_quarter',
    projectedValue: -8,
    realizedValue: -5,
    baselineValue: 24,
    measurementOwnerRole: 'VP Operations Safety',
    counterfactual:
      'Comparison condition is the prior-quarter incident summary cadence held constant on the same site population; the seed assumes equivalent reporting completeness.',
    counterfactualConfidence: 'medium',
    readiness: 'measured_in_pilot',
    evidenceLinkedClaimIds: [
      claimSeedId('operations-safety-incident-summary-pilot-1'),
    ],
    governanceReviewStatus: 'in_review',
    notes: [
      'seed projection only; incident counts are deterministic seed values.',
    ],
    seed_value: true,
    createdFrom: 'deterministic_value_outcome_ledger_seed',
  },
  {
    id: valueSeedId(18),
    initiative: 'Finance invoice extraction productivity capture',
    aiUseCaseKey: 'ai-use-case-seed-12',
    category: 'productivity',
    measurementUnit: 'hours_saved_per_week',
    projectedValue: 32,
    realizedValue: null,
    baselineValue: 48,
    measurementOwnerRole: 'VP Finance Operations',
    counterfactual:
      'Comparison condition is the prior-quarter invoice processing cycle held constant on the same vendor mix; baseline cycle time is recorded but pilot measurement has not been promoted to production capture yet.',
    counterfactualConfidence: 'medium',
    readiness: 'in_pilot_measurement',
    evidenceLinkedClaimIds: [],
    governanceReviewStatus: 'flagged',
    notes: [
      'seed projection only; cycle times are deterministic seed values.',
      'flagged for governance review until pilot measurement is promoted to production capture.',
    ],
    seed_value: true,
    createdFrom: 'deterministic_value_outcome_ledger_seed',
  },
];

/**
 * Compute variance fields deterministically for a base entry. When the
 * realized value is null the variance is null. We define the variance
 * percent as `(realizedValue - projectedValue) / projectedValue * 100`,
 * and refuse to divide by zero (returns null when `projectedValue`
 * is `0` and `realizedValue` is non-zero, otherwise returns `0`).
 */
function deriveVariance(entry: {
  readonly projectedValue: number;
  readonly realizedValue: number | null;
}): { varianceAbs: number | null; variancePercent: number | null } {
  if (entry.realizedValue === null) {
    return { varianceAbs: null, variancePercent: null };
  }
  const varianceAbs = entry.realizedValue - entry.projectedValue;
  if (entry.projectedValue === 0) {
    return {
      varianceAbs,
      variancePercent: varianceAbs === 0 ? 0 : null,
    };
  }
  const variancePercent = (varianceAbs / entry.projectedValue) * 100;
  return { varianceAbs, variancePercent };
}

/**
 * The frozen, fully-resolved seed. Variance fields are computed from
 * the base seed at module-load and embedded so the public list is a
 * single, self-contained source of truth.
 */
const VALUE_LEDGER_SEED: readonly ValueLedgerEntry[] = VALUE_LEDGER_SEED_BASE.map(
  (entry): ValueLedgerEntry => {
    const { varianceAbs, variancePercent } = deriveVariance(entry);
    return {
      ...entry,
      varianceAbs,
      variancePercent,
    };
  },
);

// ---------------------------------------------------------------------
// Public helpers
// ---------------------------------------------------------------------

/**
 * Build the canonical AI value / outcome ledger. Result is a frozen,
 * deterministic list — repeated calls return byte-equal data.
 */
export function buildAiValueOutcomeLedger(): readonly ValueLedgerEntry[] {
  return VALUE_LEDGER_SEED;
}

/**
 * Initialize a per-category record where every canonical category is
 * present with count 0. Used as the starting point for `byCategory`
 * aggregation so callers can rely on every category key existing even
 * when count is zero.
 */
function emptyCategoryCounts(): Record<ValueLedgerCategory, number> {
  const out: Record<ValueLedgerCategory, number> = {
    cost_avoidance: 0,
    productivity: 0,
    revenue_lift: 0,
    risk_reduction: 0,
    customer_experience: 0,
    employee_experience: 0,
    compliance: 0,
  };
  return out;
}

/**
 * Initialize a per-readiness record where every canonical state is
 * present with count 0.
 */
function emptyReadinessCounts(): Record<ValueReadinessState, number> {
  const out: Record<ValueReadinessState, number> = {
    projected_only: 0,
    baseline_pending: 0,
    baseline_set: 0,
    in_pilot_measurement: 0,
    measured_in_pilot: 0,
    measured_in_production: 0,
    declined: 0,
  };
  return out;
}

/**
 * Initialize a per-measurement-unit record where every canonical unit
 * is present with count 0.
 */
function emptyMeasurementUnitCounts(): Record<ValueMeasurementUnit, number> {
  const out: Record<ValueMeasurementUnit, number> = {
    usd_seed: 0,
    percent: 0,
    hours_saved_per_week: 0,
    tickets_per_day: 0,
    nps_delta: 0,
    incidents_per_quarter: 0,
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
 * Build the deterministic summary for a ledger. When no entries list
 * is provided, summarizes the canonical seed.
 *
 * Reconciliation guarantees:
 *
 * - `Object.values(byCategory).reduce(...)` equals `totalEntries`.
 * - `Object.values(byReadiness).reduce(...)` equals `totalEntries`.
 * - `Object.values(byMeasurementUnit).reduce(...)` equals `totalEntries`.
 * - `measuredCount` counts entries whose readiness is
 *   `'measured_in_pilot'` or `'measured_in_production'`.
 * - `projectedOnlyCount` equals `byReadiness.projected_only`.
 * - `flaggedGovernanceCount` counts entries whose
 *   `governanceReviewStatus === 'flagged'`.
 * - `uniqueInitiatives` is sorted ascending and contains no duplicates.
 */
export function summarizeAiValueOutcomeLedger(
  entries: readonly ValueLedgerEntry[] = VALUE_LEDGER_SEED,
): ValueOutcomeLedgerSummary {
  const byCategory = emptyCategoryCounts();
  const byReadiness = emptyReadinessCounts();
  const byMeasurementUnit = emptyMeasurementUnitCounts();
  const initiatives = new Set<string>();
  let measuredCount = 0;
  let flaggedGovernanceCount = 0;

  for (const entry of entries) {
    byCategory[entry.category] += 1;
    byReadiness[entry.readiness] += 1;
    byMeasurementUnit[entry.measurementUnit] += 1;
    initiatives.add(entry.initiative);
    if (
      entry.readiness === 'measured_in_pilot' ||
      entry.readiness === 'measured_in_production'
    ) {
      measuredCount += 1;
    }
    if (entry.governanceReviewStatus === 'flagged') {
      flaggedGovernanceCount += 1;
    }
  }

  return {
    totalEntries: entries.length,
    byCategory,
    byReadiness,
    byMeasurementUnit,
    measuredCount,
    projectedOnlyCount: byReadiness.projected_only,
    flaggedGovernanceCount,
    uniqueInitiatives: sortedAscending([...initiatives]),
  };
}

/**
 * Return entries whose `readiness` is `'measured_in_pilot'` or
 * `'measured_in_production'`. These are the entries Atlas can attach
 * a defended (still seed-flagged) value claim to.
 */
export function getMeasuredEntries(
  entries: readonly ValueLedgerEntry[] = VALUE_LEDGER_SEED,
): readonly ValueLedgerEntry[] {
  return entries.filter(
    (entry) =>
      entry.readiness === 'measured_in_pilot' ||
      entry.readiness === 'measured_in_production',
  );
}

/**
 * Return entries whose `readiness` is `'projected_only'`. These are
 * the entries Atlas must surface as projection-only and never as
 * defended value claims.
 */
export function getProjectedOnlyEntries(
  entries: readonly ValueLedgerEntry[] = VALUE_LEDGER_SEED,
): readonly ValueLedgerEntry[] {
  return entries.filter((entry) => entry.readiness === 'projected_only');
}

/**
 * Filter ledger entries by category. Returns the entries in input
 * order.
 */
export function getEntriesByCategory(
  category: ValueLedgerCategory,
  entries: readonly ValueLedgerEntry[] = VALUE_LEDGER_SEED,
): readonly ValueLedgerEntry[] {
  return entries.filter((entry) => entry.category === category);
}

/**
 * Compute the variance fields for an entry. Returns `{ varianceAbs:
 * null, variancePercent: null }` when `realizedValue` is `null`. The
 * `projectedValue` is treated as missing only when its variance would
 * be undefined under division by zero; otherwise the function returns
 * the standard absolute and percent variance.
 *
 * Pure function — no clock, no randomness, no side-effects.
 */
export function computeVariance(
  entry: ValueLedgerEntry,
): { varianceAbs: number | null; variancePercent: number | null } {
  return deriveVariance(entry);
}
