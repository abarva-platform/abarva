// Tower · Slice 3.2 — Executive Action Queue view model.
//
// Turns Tower from a dashboard into an operator: given the portfolio's
// outcome readings, this module ranks the interventions a CXO should act
// on this week.
//
// The queue is a pure function over the AI value / outcome ledger
// (`ai-value-outcome-ledger.ts`). The closed executive-action trigger
// taxonomy is owned by Slice 0.3 (`../taxonomy/outcome-taxonomy.ts`);
// this module consumes that canonical set rather than defining its own.
// What stays local here is the queue-specific derivation: mapping a
// `ValueLedgerEntry` to its single most material trigger plus the
// operator-facing copy and the action-queue severity bucket.
//
// Determinism contract (the QA gate depends on this):
//
// - No live clocks, no randomness, no network IO, no DB writes.
// - The output queue is a STABLE sort by severity rank, then by a
//   deterministic tiebreaker (`triggerId` then `entryId`), so repeated
//   calls on the same input return a byte-identical ordering.

import {
  buildAiValueOutcomeLedger,
  type ValueLedgerEntry,
} from '@/lib/tower/ai-value-outcome-ledger';
import {
  EXECUTIVE_ACTIONS,
  type ExecutiveAction as ExecutiveActionTriggerType,
} from '@/lib/tower/taxonomy/outcome-taxonomy';

// ---------------------------------------------------------------------
// Closed trigger taxonomy (canonical — sourced from Slice 0.3)
// ---------------------------------------------------------------------

/**
 * Closed set of executive-action trigger types. Each maps a portfolio
 * condition to the intervention a CXO should make. This is re-exported
 * from the canonical Slice 0.3 taxonomy (`EXECUTIVE_ACTIONS`) so the
 * action queue and the outcome taxonomy never drift; the array's order
 * is the deterministic tiebreaker for the queue's stable sort.
 *
 * The action queue surfaces a subset of these triggers — `reallocate_spend`
 * is derived by the outcome-taxonomy builders rather than the ledger-driven
 * queue — but the type is the full canonical superset.
 */
export const EXECUTIVE_ACTION_TRIGGERS = EXECUTIVE_ACTIONS;

export type ExecutiveActionTrigger = ExecutiveActionTriggerType;

/**
 * Severity rank — lower number is more urgent and sorts first. The
 * queue is a stable sort over this rank, so the integer values are the
 * load-bearing ordering contract.
 */
export const SEVERITY_RANK = {
  critical: 0,
  high: 1,
  elevated: 2,
  watch: 3,
} as const;

export type ActionSeverity = keyof typeof SEVERITY_RANK;

/**
 * A single ranked executive action. Carries the triggering condition,
 * why it matters, the implied action, and a severity rank.
 */
export interface ExecutiveAction {
  /** Stable id of the form `eaq-{triggerId}-{entryId}`. */
  readonly id: string;
  /** Closed trigger type. */
  readonly trigger: ExecutiveActionTrigger;
  /** Human-readable trigger label. */
  readonly triggerLabel: string;
  /** Ledger entry id this action derives from. */
  readonly entryId: string;
  /** Initiative the action concerns. */
  readonly initiative: string;
  /** Canonical program key, if the ledger entry carries one. */
  readonly programKey?: string;
  /** The portfolio condition that fired the trigger. */
  readonly condition: string;
  /** Why a CXO should care — the executive stakes. */
  readonly whyItMatters: string;
  /** The implied next action — what to do, not another status meeting. */
  readonly impliedAction: string;
  /** Severity bucket. */
  readonly severity: ActionSeverity;
  /** Integer severity rank (lower sorts first). */
  readonly severityRank: number;
}

/** Per-trigger queue counts; every trigger key is present (zero allowed). */
export type TriggerCounts = Readonly<Record<ExecutiveActionTrigger, number>>;

export interface ExecutiveActionQueue {
  /** Ranked, deterministically ordered actions. */
  readonly actions: readonly ExecutiveAction[];
  /** Total actionable items (excludes `no_action`). */
  readonly actionableCount: number;
  /** Count of `critical` severity actions. */
  readonly criticalCount: number;
  /** Per-trigger counts. */
  readonly byTrigger: TriggerCounts;
  /** One-line operator framing for the panel header. */
  readonly headline: string;
  /** Honesty disclaimer — the queue is seed-derived. */
  readonly disclaimer: string;
  /** Provenance marker. */
  readonly deterministicSeed: true;
}

// ---------------------------------------------------------------------
// Trigger derivation
// ---------------------------------------------------------------------

const TRIGGER_LABEL: Record<ExecutiveActionTrigger, string> = {
  value_leakage: 'Value leakage',
  verify_value_claim: 'Unverified value claim',
  drive_adoption: 'Adoption gap',
  reallocate_spend: 'Spend reallocation',
  escalate_dependency: 'Dependency blocker',
  open_renewal_review: 'Renewal risk',
  sponsor_intervention: 'Sponsor gap',
  no_action: 'No action required',
};

/**
 * A derived (trigger, severity) verdict for a ledger entry, plus the
 * three operator strings. Returns `no_action` when the entry is
 * earning as projected and needs no intervention.
 */
interface TriggerVerdict {
  readonly trigger: ExecutiveActionTrigger;
  readonly severity: ActionSeverity;
  readonly condition: string;
  readonly whyItMatters: string;
  readonly impliedAction: string;
}

function fmtPct(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return `${rounded > 0 ? '+' : ''}${rounded}%`;
}

/**
 * Map one ledger entry to its single most material executive action.
 *
 * The checks are evaluated in fixed priority order; the first match
 * wins so each entry yields exactly one verdict. This keeps the queue
 * one-action-per-initiative and the priority order deterministic.
 *
 * The trigger type returned is a member of the canonical Slice 0.3
 * `EXECUTIVE_ACTIONS` taxonomy. This is the action queue's own
 * derivation over a `ValueLedgerEntry`; it is distinct from the
 * outcome-taxonomy `deriveExecutiveAction`, which classifies an
 * `OutcomeReading` instead.
 */
export function deriveExecutiveAction(entry: ValueLedgerEntry): TriggerVerdict {
  const measured =
    entry.readiness === 'measured_in_pilot' ||
    entry.readiness === 'measured_in_production';

  // 1. Value leakage — measured and materially under-earning vs projection.
  if (
    measured &&
    entry.variancePercent !== null &&
    entry.variancePercent <= -15
  ) {
    return {
      trigger: 'value_leakage',
      severity: 'critical',
      condition: `Realized value is ${fmtPct(
        entry.variancePercent,
      )} against projection while live in ${
        entry.readiness === 'measured_in_production' ? 'production' : 'pilot'
      }.`,
      whyItMatters:
        'A high-value initiative that is not earning its projection is a leak, not a status line. The gap compounds every quarter it goes unaddressed.',
      impliedAction: `Commission a value-leakage review with the ${entry.measurementOwnerRole}; pinpoint whether the gap is adoption, scope, or counterfactual error before the next funding cycle.`,
    };
  }

  // 2. Sponsor gap — value claim flagged in governance review.
  if (entry.governanceReviewStatus === 'flagged') {
    return {
      trigger: 'sponsor_intervention',
      severity: 'high',
      condition: 'The value claim is flagged in governance review.',
      whyItMatters:
        'A flagged claim cannot be defended to the board and can stall the initiative. It needs an executive sponsor to clear the blocker, not another review cycle.',
      impliedAction: `Have the executive sponsor convene the steering committee with the ${entry.measurementOwnerRole} to resolve the governance flag this week.`,
    };
  }

  // 3. Adoption gap — measured but realized falls short of a non-zero baseline.
  if (
    measured &&
    entry.variancePercent !== null &&
    entry.variancePercent < 0 &&
    entry.variancePercent > -15
  ) {
    return {
      trigger: 'drive_adoption',
      severity: 'elevated',
      condition: `Realized value trails projection by ${fmtPct(
        entry.variancePercent,
      )} — a soft adoption shortfall.`,
      whyItMatters:
        'A modest shortfall now becomes a missed business case if adoption does not close the gap before the value window closes.',
      impliedAction: `Task the ${entry.measurementOwnerRole} with an adoption push — usage targets, enablement, and a check-in before the next Tower review.`,
    };
  }

  // 4. Renewal risk — declined value claim still consuming a commitment.
  if (entry.readiness === 'declined') {
    return {
      trigger: 'open_renewal_review',
      severity: 'high',
      condition: 'The value claim is declined — the initiative is not delivering defensible value.',
      whyItMatters:
        'A declined initiative still consumes budget, vendor commitment, and leadership attention. Renewal or sunset is an executive decision, not a default.',
      impliedAction: `Open a renewal / sunset review for this initiative; decide explicitly whether to retire it or re-baseline before the next commitment date.`,
    };
  }

  // 5. Dependency blocker — projected-only with no baseline captured.
  if (entry.readiness === 'projected_only' && entry.baselineValue === null) {
    return {
      trigger: 'escalate_dependency',
      severity: 'elevated',
      condition: 'The initiative is projected-only with no baseline captured.',
      whyItMatters:
        'Without a baseline, the value claim can never be verified — the initiative is blocked on a measurement dependency before it can earn trust.',
      impliedAction: `Escalate the baseline-capture dependency to the ${entry.measurementOwnerRole}; a baseline must land before pilot scoping can proceed.`,
    };
  }

  // 6. Verify value claim — projected but not yet measured.
  if (!measured) {
    return {
      trigger: 'verify_value_claim',
      severity: 'watch',
      condition: `The value claim is at the "${entry.readiness.replace(
        /_/g,
        ' ',
      )}" stage and is not yet measured.`,
      whyItMatters:
        'Projected value is not earned value. Until it is measured, it cannot be claimed to the board — and unverified claims erode credibility.',
      impliedAction: `Confirm the measurement plan with the ${entry.measurementOwnerRole} and set a date to move this claim into measurement.`,
    };
  }

  // 7. No action — measured and earning at or above projection.
  return {
    trigger: 'no_action',
    severity: 'watch',
    condition: 'Realized value is at or above projection.',
    whyItMatters: 'The initiative is earning as expected; keep tracking.',
    impliedAction: 'No executive action required this cycle.',
  };
}

// ---------------------------------------------------------------------
// Queue builder
// ---------------------------------------------------------------------

function emptyTriggerCounts(): Record<ExecutiveActionTrigger, number> {
  return {
    value_leakage: 0,
    verify_value_claim: 0,
    drive_adoption: 0,
    reallocate_spend: 0,
    escalate_dependency: 0,
    open_renewal_review: 0,
    sponsor_intervention: 0,
    no_action: 0,
  };
}

/**
 * Build the executive action queue from the AI value / outcome ledger.
 *
 * When no entries list is supplied the canonical ledger seed is used.
 *
 * Ordering contract (deterministic, QA-gated):
 *
 * 1. Primary key: `severityRank` ascending (critical → watch).
 * 2. Tiebreaker 1: `trigger` order in `EXECUTIVE_ACTION_TRIGGERS`.
 * 3. Tiebreaker 2: `entryId` ascending (`localeCompare`).
 *
 * `no_action` verdicts are excluded from the queue — the queue is the
 * list of things to do, not the full portfolio.
 */
export function buildExecutiveActionQueue(
  entries: readonly ValueLedgerEntry[] = buildAiValueOutcomeLedger(),
): ExecutiveActionQueue {
  const triggerOrder = new Map<ExecutiveActionTrigger, number>(
    EXECUTIVE_ACTION_TRIGGERS.map((trigger, index) => [trigger, index]),
  );

  const actions: ExecutiveAction[] = entries
    .map((entry): ExecutiveAction => {
      const verdict = deriveExecutiveAction(entry);
      return {
        id: `eaq-${verdict.trigger}-${entry.id}`,
        trigger: verdict.trigger,
        triggerLabel: TRIGGER_LABEL[verdict.trigger],
        entryId: entry.id,
        initiative: entry.initiative,
        ...(entry.programKey ? { programKey: entry.programKey } : {}),
        condition: verdict.condition,
        whyItMatters: verdict.whyItMatters,
        impliedAction: verdict.impliedAction,
        severity: verdict.severity,
        severityRank: SEVERITY_RANK[verdict.severity],
      };
    })
    .filter((action) => action.trigger !== 'no_action')
    .sort((a, b) => {
      if (a.severityRank !== b.severityRank) {
        return a.severityRank - b.severityRank;
      }
      const triggerDelta =
        (triggerOrder.get(a.trigger) ?? 0) - (triggerOrder.get(b.trigger) ?? 0);
      if (triggerDelta !== 0) return triggerDelta;
      return a.entryId.localeCompare(b.entryId);
    });

  const byTrigger = emptyTriggerCounts();
  let criticalCount = 0;
  for (const action of actions) {
    byTrigger[action.trigger] += 1;
    if (action.severity === 'critical') criticalCount += 1;
  }
  // Count entries that resolved to `no_action` for completeness.
  byTrigger.no_action = entries.length - actions.length;

  const headline =
    actions.length === 0
      ? 'No executive action required this cycle — the portfolio is earning as projected.'
      : `${actions.length} intervention${
          actions.length === 1 ? '' : 's'
        } need a CXO decision this week` +
        (criticalCount > 0 ? ` · ${criticalCount} critical` : '') +
        '.';

  return {
    actions,
    actionableCount: actions.length,
    criticalCount,
    byTrigger,
    headline,
    disclaimer:
      'Deterministic seed · The action queue is derived from the AI value / outcome ledger seed. ' +
      'Live ledger binding and per-tenant outcome readings land with Slice 3.1.',
    deterministicSeed: true,
  };
}
