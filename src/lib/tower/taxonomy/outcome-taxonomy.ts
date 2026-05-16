// Slice 0.3 · Tower Outcome Taxonomy — typed contracts + pure builders
//
// CANONICAL ROLE — outcome CLASSIFICATION + executive-action layer.
//
// The Tower track maintains two value-confidence modules with a
// declared, complementary relationship:
//
// - THIS FILE is the canonical outcome CLASSIFICATION + executive-action
//   layer. It owns the outcome concepts, severities, the coarse 3-rung
//   executive confidence summary (`VALUE_RUNGS`), and the
//   `deriveExecutiveAction` / `classifyOutcomeReading` builders.
// - `src/lib/tower/ai-value-outcome-ledger.ts` is the canonical value
//   LEDGER / data model. It owns the value-claim record shape, the
//   categories / units, the fine-grained 7-state operational readiness
//   ladder (`VALUE_READINESS_STATES`), and the variance builders.
//
// The only concept modelled in both is value confidence, at two
// deliberate granularities (this file's 3-rung summary vs the ledger's
// 7-state ladder). The single, documented conversion between them lives
// in `src/lib/tower/taxonomy/value-confidence-bridge.ts` — no consumer
// should re-derive that rollup ad hoc.
//
// Encodes the taxonomy of portfolio outcome concepts the Tower surface
// (Atlas-fronted CXO portfolio command room) reasons over. Tower must be
// able to explain *why a metric matters* and *which executive action it
// implies* — this module is the canonical encoding of that reasoning.
//
// This is a deterministic, pure-function module. There are no:
//
// - live integrations or external API calls,
// - migrations or tenant database lookups,
// - LLM / model invocations,
// - timestamp-dependent or random values,
// - imports from Source / Sentinel / Atlas / Nexus / Agent runtime,
//   auth, supabase, or the data-plane.
//
// The companion doc is docs/strategy/TOWER-OUTCOME-TAXONOMY.md. The
// executive-action *queue UI* (ranking + rendering) is deliberately out
// of scope here — it lands as Slice 3.2.
//
// ---------------------------------------------------------------------
// No-fabrication contract
// ---------------------------------------------------------------------
//
// Builders classify a *caller-supplied* metric reading into a taxonomy
// entry. They never invent dollar amounts, adoption percentages, or
// vendor outcomes. A reading whose evidence does not support a value
// claim is classified as `projected` value, never `verified`.

// ---------------------------------------------------------------------
// Canonical enums
// ---------------------------------------------------------------------

/**
 * The portfolio outcome concepts the Tower taxonomy covers. Each concept
 * is documented in TOWER-OUTCOME-TAXONOMY.md with its meaning, source,
 * CXO relevance, and implied executive action.
 */
export const OUTCOME_CONCEPTS = [
  'projected_value',
  'tracked_value',
  'verified_value',
  'adoption',
  'spend_at_risk',
  'renewal_risk',
  'dependency_risk',
] as const;

export type OutcomeConcept = (typeof OUTCOME_CONCEPTS)[number];

/**
 * The three value-confidence rungs. A value claim climbs the ladder as
 * evidence strengthens: `projected` (modelled, pre-pilot), `tracked`
 * (instrumented telemetry, pilot-grade), `verified` (audited against
 * the evidence ledger, production-grade).
 */
export const VALUE_RUNGS = ['projected', 'tracked', 'verified'] as const;
export type ValueRung = (typeof VALUE_RUNGS)[number];

/**
 * Tenant context surfaces a taxonomy entry is sourced from. These mirror
 * the named context packs Tower reads; the builders never query them
 * directly — callers pass already-retrieved readings.
 */
export const TENANT_CONTEXT_SOURCES = [
  'program_inventory',
  'operating_telemetry',
  'vendor_contracts',
  'evidence_ledger',
  'org_directory',
] as const;
export type TenantContextSource = (typeof TENANT_CONTEXT_SOURCES)[number];

/**
 * Severity bands for a classified outcome reading. `on_track` needs no
 * executive action; the remaining bands escalate.
 */
export const OUTCOME_SEVERITIES = [
  'on_track',
  'watch',
  'at_risk',
  'critical',
] as const;
export type OutcomeSeverity = (typeof OUTCOME_SEVERITIES)[number];

/**
 * Canonical executive actions Tower can imply. These are the closed set
 * of interventions a CXO is asked to take; the executive action queue
 * (Slice 3.2) ranks instances of these.
 *
 * This is the single canonical home for the executive-action trigger
 * taxonomy. Slice 3.2's executive action queue consumes this set rather
 * than defining its own.
 *
 * `reallocate_spend` and `value_leakage` are two framings of the same
 * underlying CXO concern (committed spend not backed by value):
 * `reallocate_spend` is the forward-looking action the outcome-taxonomy
 * builders derive from a `spend_at_risk` reading, while `value_leakage`
 * is the trigger the action queue surfaces when a *measured* initiative
 * is materially under-earning its projection. Both are first-class
 * members of the closed set; the action queue carries logic and tests
 * for `value_leakage` specifically.
 */
export const EXECUTIVE_ACTIONS = [
  'no_action',
  'verify_value_claim',
  'drive_adoption',
  'reallocate_spend',
  'value_leakage',
  'open_renewal_review',
  'escalate_dependency',
  'sponsor_intervention',
] as const;
export type ExecutiveAction = (typeof EXECUTIVE_ACTIONS)[number];

// ---------------------------------------------------------------------
// Typed taxonomy contracts
// ---------------------------------------------------------------------

/**
 * The static, encoded definition of one outcome concept. This is the
 * "why it matters" knowledge — independent of any specific reading.
 */
export interface OutcomeConceptDefinition {
  readonly concept: OutcomeConcept;
  /** One-line plain-English meaning. */
  readonly meaning: string;
  /** Which tenant context surfaces supply the inputs. */
  readonly sourcedFrom: readonly TenantContextSource[];
  /** Why a CXO cares — the executive stake. */
  readonly cxoRelevance: string;
  /** The action implied when this concept crosses an action threshold. */
  readonly impliedAction: ExecutiveAction;
}

/**
 * A caller-supplied metric reading to be classified. The builders are
 * pure over this input. `normalizedScore` is a 0..1 health score where
 * 1 is healthy; callers compute it from raw telemetry upstream.
 */
export interface OutcomeReading {
  readonly concept: OutcomeConcept;
  /** Stable identifier of the program / use case / vendor the reading is about. */
  readonly subjectId: string;
  /** 0..1 health score; 1 = fully healthy, 0 = fully impaired. */
  readonly normalizedScore: number;
  /**
   * Evidence strength behind the reading. Drives the value rung and
   * gates whether a value claim may be called `verified`.
   */
  readonly evidenceStrength: ValueRung;
  /** Optional days-to-event, used by renewal-risk classification. */
  readonly daysToEvent?: number;
}

/**
 * The result of classifying a reading: its severity band, the value
 * rung (for value concepts), the implied executive action, and a
 * deterministic human-readable rationale Tower can render verbatim.
 */
export interface OutcomeClassification {
  readonly concept: OutcomeConcept;
  readonly subjectId: string;
  readonly severity: OutcomeSeverity;
  readonly valueRung: ValueRung | null;
  readonly impliedAction: ExecutiveAction;
  readonly rationale: string;
}

// ---------------------------------------------------------------------
// Encoded concept definitions
// ---------------------------------------------------------------------

export const OUTCOME_CONCEPT_DEFINITIONS: Readonly<
  Record<OutcomeConcept, OutcomeConceptDefinition>
> = {
  projected_value: {
    concept: 'projected_value',
    meaning:
      'Modelled benefit a program is expected to deliver, estimated before any instrumented evidence exists.',
    sourcedFrom: ['program_inventory'],
    cxoRelevance:
      'Sets the investment thesis; an unverified projection left unchecked becomes an inflated value claim.',
    impliedAction: 'verify_value_claim',
  },
  tracked_value: {
    concept: 'tracked_value',
    meaning:
      'Benefit observed through live operating telemetry during a pilot — instrumented but not yet audited.',
    sourcedFrom: ['operating_telemetry', 'program_inventory'],
    cxoRelevance:
      'Shows whether the thesis is holding in the field before scaling spend.',
    impliedAction: 'verify_value_claim',
  },
  verified_value: {
    concept: 'verified_value',
    meaning:
      'Benefit confirmed against the evidence ledger and reconciled to finance — a production-grade value fact.',
    sourcedFrom: ['evidence_ledger', 'operating_telemetry'],
    cxoRelevance:
      'The only value rung a CXO can defend to the board or the CFO without caveat.',
    impliedAction: 'no_action',
  },
  adoption: {
    concept: 'adoption',
    meaning:
      'Share of the eligible population actively using the deployed AI capability in real workflows.',
    sourcedFrom: ['operating_telemetry'],
    cxoRelevance:
      'Value cannot be realized without adoption; low adoption strands the entire investment.',
    impliedAction: 'drive_adoption',
  },
  spend_at_risk: {
    concept: 'spend_at_risk',
    meaning:
      'Committed program and consumption spend that is not currently backed by tracked or verified value.',
    sourcedFrom: ['vendor_contracts', 'program_inventory', 'evidence_ledger'],
    cxoRelevance:
      'Quantifies the budget a CXO should consider reallocating away from non-earning bets.',
    impliedAction: 'reallocate_spend',
  },
  renewal_risk: {
    concept: 'renewal_risk',
    meaning:
      'Exposure that a vendor contract will auto-renew or lapse on unfavourable terms before a value decision is made.',
    sourcedFrom: ['vendor_contracts', 'evidence_ledger'],
    cxoRelevance:
      'A renewal window that closes without review locks in cost and forfeits negotiation leverage.',
    impliedAction: 'open_renewal_review',
  },
  dependency_risk: {
    concept: 'dependency_risk',
    meaning:
      'Exposure from an upstream dependency — data, platform, sponsor, or another program — that can block delivery.',
    sourcedFrom: ['program_inventory', 'org_directory'],
    cxoRelevance:
      'A blocked dependency stalls value realization regardless of how well the program itself is run.',
    impliedAction: 'escalate_dependency',
  },
};

// ---------------------------------------------------------------------
// Thresholds (encoded, deterministic)
// ---------------------------------------------------------------------

/**
 * Health-score band edges. A reading at or above `watch` is on track;
 * below `critical` is critical. Shared by all score-driven concepts so
 * Tower classification is consistent across the portfolio.
 */
export const SEVERITY_THRESHOLDS = {
  /** score >= this => on_track */
  onTrack: 0.75,
  /** score >= this (and < onTrack) => watch */
  watch: 0.5,
  /** score >= this (and < watch) => at_risk; below => critical */
  atRisk: 0.25,
} as const;

/** Renewal windows narrower than this many days are treated as urgent. */
export const RENEWAL_URGENT_WINDOW_DAYS = 90;

// ---------------------------------------------------------------------
// Pure builders
// ---------------------------------------------------------------------

function clamp01(n: number): number {
  if (Number.isNaN(n)) return 0;
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

/** Maps a 0..1 health score to a severity band. */
export function classifySeverity(normalizedScore: number): OutcomeSeverity {
  const score = clamp01(normalizedScore);
  if (score >= SEVERITY_THRESHOLDS.onTrack) return 'on_track';
  if (score >= SEVERITY_THRESHOLDS.watch) return 'watch';
  if (score >= SEVERITY_THRESHOLDS.atRisk) return 'at_risk';
  return 'critical';
}

/**
 * Derives the value rung for a value concept. A claim may only be called
 * `verified` when its evidence strength is `verified`; otherwise it is
 * demoted to the strongest rung the evidence supports. Non-value
 * concepts return null.
 */
export function deriveValueRung(reading: OutcomeReading): ValueRung | null {
  if (
    reading.concept !== 'projected_value' &&
    reading.concept !== 'tracked_value' &&
    reading.concept !== 'verified_value'
  ) {
    return null;
  }
  const conceptRung: ValueRung =
    reading.concept === 'verified_value'
      ? 'verified'
      : reading.concept === 'tracked_value'
        ? 'tracked'
        : 'projected';
  // The rung is the *weaker* of the concept's nominal rung and the
  // evidence actually supplied — evidence can never inflate a claim.
  const order: Record<ValueRung, number> = {
    projected: 0,
    tracked: 1,
    verified: 2,
  };
  return order[reading.evidenceStrength] < order[conceptRung]
    ? reading.evidenceStrength
    : conceptRung;
}

/**
 * Derives the implied executive action for a classified reading.
 *
 * - An `on_track` reading implies `no_action`.
 * - A value concept that is not yet `verified` implies `verify_value_claim`.
 * - Renewal risk inside the urgent window escalates to a renewal review
 *   even when the score band is only `watch`.
 * - Otherwise the concept's encoded `impliedAction` applies, with a
 *   `critical` adoption gap escalating to a `sponsor_intervention`.
 */
export function deriveExecutiveAction(
  reading: OutcomeReading,
  severity: OutcomeSeverity,
  valueRung: ValueRung | null,
): ExecutiveAction {
  if (
    reading.concept === 'renewal_risk' &&
    typeof reading.daysToEvent === 'number' &&
    reading.daysToEvent <= RENEWAL_URGENT_WINDOW_DAYS &&
    severity !== 'on_track'
  ) {
    return 'open_renewal_review';
  }

  if (severity === 'on_track') {
    // A verified value claim that is on track needs nothing. An on-track
    // but still-unverified value claim still owes the CXO a verification.
    if (valueRung !== null && valueRung !== 'verified') {
      return 'verify_value_claim';
    }
    return 'no_action';
  }

  if (valueRung !== null && valueRung !== 'verified') {
    return 'verify_value_claim';
  }

  if (reading.concept === 'adoption' && severity === 'critical') {
    return 'sponsor_intervention';
  }

  return OUTCOME_CONCEPT_DEFINITIONS[reading.concept].impliedAction;
}

function actionPhrase(action: ExecutiveAction): string {
  switch (action) {
    case 'no_action':
      return 'no executive action required';
    case 'verify_value_claim':
      return 'commission a value verification before this claim is reported';
    case 'drive_adoption':
      return 'fund an adoption push to recover stranded value';
    case 'reallocate_spend':
      return 'review whether committed spend should be reallocated';
    case 'value_leakage':
      return 'commission a value-leakage review of the under-earning initiative';
    case 'open_renewal_review':
      return 'open a renewal review before the contract window closes';
    case 'escalate_dependency':
      return 'escalate the blocking dependency to the accountable owner';
    case 'sponsor_intervention':
      return 'request a sponsor intervention to unblock adoption';
  }
}

/**
 * Classifies a single metric reading into its full taxonomy entry:
 * severity band, value rung, implied executive action, and a
 * deterministic rationale Tower can render verbatim.
 *
 * Pure and deterministic — identical input yields byte-equal output.
 */
export function classifyOutcomeReading(
  reading: OutcomeReading,
): OutcomeClassification {
  const definition = OUTCOME_CONCEPT_DEFINITIONS[reading.concept];
  const severity = classifySeverity(reading.normalizedScore);
  const valueRung = deriveValueRung(reading);
  const impliedAction = deriveExecutiveAction(reading, severity, valueRung);

  const rungClause =
    valueRung !== null ? ` Value confidence is ${valueRung}.` : '';
  const rationale =
    `${definition.meaning} This reading for ${reading.subjectId} is ` +
    `${severity.replace('_', ' ')}.${rungClause} Because ` +
    `${definition.cxoRelevance.charAt(0).toLowerCase()}${definition.cxoRelevance.slice(1)} ` +
    `the implied step is to ${actionPhrase(impliedAction)}.`;

  return {
    concept: reading.concept,
    subjectId: reading.subjectId,
    severity,
    valueRung,
    impliedAction,
    rationale,
  };
}

/** Classifies a batch of readings, preserving input order. Deterministic. */
export function classifyOutcomeReadings(
  readings: readonly OutcomeReading[],
): OutcomeClassification[] {
  return readings.map(classifyOutcomeReading);
}

/** Looks up the encoded definition for an outcome concept. */
export function getOutcomeConceptDefinition(
  concept: OutcomeConcept,
): OutcomeConceptDefinition {
  return OUTCOME_CONCEPT_DEFINITIONS[concept];
}
