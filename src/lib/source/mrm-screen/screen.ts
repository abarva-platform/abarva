// Source · MRM-readiness vendor screen · Wave C1 · the screen itself.
//
// Pure transforms that grade a vendor's evidence against the encoded
// SR 11-7 criteria (criteria.ts) and produce a pass/fail verdict. This
// is a *gating* screen: it runs BEFORE the TCO comparison and removes
// failing vendors from it entirely. A vendor that cannot support
// SR 11-7 model validation is not bought back by attractive pricing.
//
// No clock, no randomness, no I/O.

import { MRM_CRITERIA, getMrmCriterion } from './criteria';
import {
  type MrmCriterionAssessment,
  type MrmCriterionGrade,
  type MrmCriterionId,
  type MrmCriterionResult,
  type MrmScreenSummary,
  type MrmScreenVerdict,
  type MrmScreenView,
  type MrmVendorScreenInput,
  type MrmVendorScreenResult,
} from './types';

/**
 * Whether a grade clears a *critical* criterion. Critical criteria must
 * be fully `met` — `partial`, `not_met` and `not_assessed` all block.
 * You cannot pass a hard regulatory gate on partial or absent evidence.
 */
function gradeClearsCritical(grade: MrmCriterionGrade): boolean {
  return grade === 'met';
}

/**
 * Whether a grade clears a *non-critical* criterion outright. `met`
 * clears; `partial` clears only as a recorded condition; `not_met` and
 * `not_assessed` block.
 */
function gradeClearsNonCritical(grade: MrmCriterionGrade): boolean {
  return grade === 'met';
}

/** Order weight per grade — worst sorts first within criticality. */
const GRADE_ORDER: Record<MrmCriterionGrade, number> = {
  not_met: 3,
  not_assessed: 2,
  partial: 1,
  met: 0,
};

/**
 * Grade one vendor's evidence against every encoded SR 11-7 criterion.
 * Criteria with no supplied assessment are treated as `not_assessed`.
 */
function gradeCriteria(
  input: MrmVendorScreenInput,
): MrmCriterionResult[] {
  const byId = new Map<MrmCriterionId, MrmCriterionAssessment>(
    input.assessments.map((a) => [a.criterionId, a]),
  );

  return MRM_CRITERIA.map((def): MrmCriterionResult => {
    const assessment = byId.get(def.id);
    const grade: MrmCriterionGrade = assessment?.grade ?? 'not_assessed';
    const cleared = def.critical
      ? gradeClearsCritical(grade)
      : gradeClearsNonCritical(grade);
    return {
      criterionId: def.id,
      label: def.label,
      sr117Reference: def.sr117Reference,
      grade,
      critical: def.critical,
      isBlocker: def.critical && !cleared,
      evidenceNote: assessment?.evidenceNote ?? '',
    };
  }).sort((a, b) => {
    // Criticals first, then worst grade first, then stable by id.
    if (a.critical !== b.critical) return a.critical ? -1 : 1;
    const g = GRADE_ORDER[b.grade] - GRADE_ORDER[a.grade];
    if (g !== 0) return g;
    return a.criterionId.localeCompare(b.criterionId);
  });
}

/**
 * Derive the verdict from the graded criteria.
 *
 * - `fail`        — any critical criterion is not fully `met`.
 * - `conditional` — no critical blockers, but one or more non-critical
 *                   criteria are `partial`, `not_met` or `not_assessed`.
 * - `pass`        — every criterion is fully `met`.
 */
function deriveVerdict(criteria: readonly MrmCriterionResult[]): MrmScreenVerdict {
  const hasCriticalBlocker = criteria.some((c) => c.isBlocker);
  if (hasCriticalBlocker) return 'fail';
  const hasNonCriticalGap = criteria.some(
    (c) => !c.critical && c.grade !== 'met',
  );
  return hasNonCriticalGap ? 'conditional' : 'pass';
}

/** Compose the one-line expert readout for the Source UI. */
function buildReadout(
  vendorName: string,
  verdict: MrmScreenVerdict,
  blockingLabels: readonly string[],
  conditionLabels: readonly string[],
): string {
  if (verdict === 'pass') {
    return `${vendorName} clears the SR 11-7 MRM-readiness screen on all eight criteria — eligible for TCO comparison.`;
  }
  if (verdict === 'fail') {
    return `${vendorName} fails the SR 11-7 MRM-readiness gate on ${blockingLabels.length} critical criterion(s) — ${blockingLabels.join('; ')}. Screened out before TCO comparison; pricing cannot buy this back.`;
  }
  return `${vendorName} clears the SR 11-7 critical gates but proceeds to TCO with ${conditionLabels.length} recorded condition(s) — ${conditionLabels.join('; ')} — that must close before award.`;
}

/**
 * Run the MRM-readiness screen for one vendor: grade against the encoded
 * SR 11-7 criteria, derive the pass/fail verdict, and decide TCO
 * eligibility. `fail` vendors are NOT eligible for TCO comparison — the
 * screen is a hard gate.
 */
export function screenVendorForMrmReadiness(
  input: MrmVendorScreenInput,
): MrmVendorScreenResult {
  const criteria = gradeCriteria(input);
  const verdict = deriveVerdict(criteria);

  const blockingCriterionIds = criteria
    .filter((c) => c.isBlocker)
    .map((c) => c.criterionId);
  const conditionCriterionIds = criteria
    .filter((c) => !c.critical && c.grade !== 'met')
    .map((c) => c.criterionId);

  const blockingLabels = blockingCriterionIds.map(
    (id) => getMrmCriterion(id)?.label ?? id,
  );
  const conditionLabels = conditionCriterionIds.map(
    (id) => getMrmCriterion(id)?.label ?? id,
  );

  return {
    vendorId: input.vendorId,
    vendorName: input.vendorName,
    verdict,
    criteria,
    blockingCriterionIds,
    conditionCriterionIds,
    eligibleForTco: verdict !== 'fail',
    readout: buildReadout(
      input.vendorName,
      verdict,
      blockingLabels,
      conditionLabels,
    ),
  };
}

/** Verdict sort weight — eligible vendors read first, failures last. */
const VERDICT_ORDER: Record<MrmScreenVerdict, number> = {
  pass: 0,
  conditional: 1,
  fail: 2,
};

/**
 * Build the reconciled summary over a set of per-vendor screen results.
 *
 * Reconciliation guarantee (test-enforced):
 * `passCount + conditionalCount + failCount === vendorsScreened` and
 * `eligibleForTcoCount === passCount + conditionalCount`.
 */
export function summarizeMrmScreen(
  vendors: readonly MrmVendorScreenResult[],
): MrmScreenSummary {
  let passCount = 0;
  let conditionalCount = 0;
  let failCount = 0;
  for (const v of vendors) {
    if (v.verdict === 'pass') passCount += 1;
    else if (v.verdict === 'conditional') conditionalCount += 1;
    else failCount += 1;
  }
  return {
    vendorsScreened: vendors.length,
    passCount,
    conditionalCount,
    failCount,
    eligibleForTcoCount: passCount + conditionalCount,
  };
}

/**
 * Build the full MRM-readiness screen view for one Source event: screen
 * every vendor, sort eligible vendors first (failures last), and
 * reconcile the summary.
 */
export function buildMrmScreenView(args: {
  readonly sourceEventId: string;
  readonly vendors: readonly MrmVendorScreenInput[];
}): MrmScreenView {
  const vendors = args.vendors
    .map(screenVendorForMrmReadiness)
    .sort((a, b) => {
      const order = VERDICT_ORDER[a.verdict] - VERDICT_ORDER[b.verdict];
      if (order !== 0) return order;
      return a.vendorName.localeCompare(b.vendorName);
    });

  return {
    sourceEventId: args.sourceEventId,
    vendors,
    summary: summarizeMrmScreen(vendors),
  };
}

/**
 * The vendors that may proceed into TCO comparison — pass + conditional.
 * This is the explicit gate hand-off: a TCO/compare view should consume
 * this list, not the raw vendor set.
 */
export function vendorsEligibleForTco(
  view: MrmScreenView,
): readonly MrmVendorScreenResult[] {
  return view.vendors.filter((v) => v.eligibleForTco);
}
