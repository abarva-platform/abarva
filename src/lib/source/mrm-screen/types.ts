// Source · MRM-readiness vendor screen · Wave C1 · shared types.
//
// First Capital (FedNow / model-risk scenario, Slice 5.3) surfaced a
// regulated-AI sourcing gap: SR 11-7 model-risk-management readiness is
// a *hard pass/fail gate* a vendor must clear BEFORE it enters the TCO
// comparison — it is not a weighted scorecard line. A vendor that cannot
// support model validation, explainability, or drift monitoring is
// screened out up front; no amount of attractive pricing buys it back in.
//
// This module encodes the SR 11-7 readiness criteria as a gating screen
// (see FIRSTCAPITAL-LOOP-WIRING-GAPS.md · GAP-5). It is the regulatory
// counterpart to the TCO iceberg (SOURCE-SOURCING-METHODOLOGY.md §5):
// the iceberg models cost, this screen models whether the vendor is even
// eligible to be costed at all.
//
// Pure: no I/O, no DB, no model calls.

// ── SR 11-7 criteria ─────────────────────────────────────────────────────────

/**
 * The SR 11-7 MRM-readiness criteria, encoded from the Federal Reserve /
 * OCC Supervisory Guidance on Model Risk Management (SR 11-7 / OCC
 * 2011-12) as it applies to a *vendor-supplied* model. SR 11-7 §VII
 * ("Other Aspects of a Sound Model Risk Management Framework") is
 * explicit that vendor and third-party models are in scope and that the
 * acquiring institution remains responsible for validation — so a vendor
 * that cannot supply the inputs validation needs is not bankable.
 *
 * Each id maps to a concrete SR 11-7 obligation the customer's MRM
 * function must discharge, expressed as a question the vendor must be
 * able to answer "yes" to.
 */
export const MRM_CRITERION_IDS = [
  'independent_validation_support',
  'conceptual_soundness_evidence',
  'ongoing_monitoring_drift',
  'outcomes_analysis_backtesting',
  'explainability_documentation',
  'data_lineage_quality',
  'change_management_versioning',
  'mrm_governance_roles',
] as const;

export type MrmCriterionId = (typeof MRM_CRITERION_IDS)[number];

/**
 * How a single criterion is graded against a vendor's evidence:
 * - `met`        — the vendor supplies what SR 11-7 validation needs.
 * - `partial`    — supplied with material gaps; conditional, not a pass.
 * - `not_met`    — the vendor cannot support the obligation.
 * - `not_assessed` — no evidence was gathered; treated as a fail for a
 *                  gating criterion (you cannot pass a hard gate on the
 *                  absence of evidence).
 */
export const MRM_CRITERION_GRADES = [
  'met',
  'partial',
  'not_met',
  'not_assessed',
] as const;

export type MrmCriterionGrade = (typeof MRM_CRITERION_GRADES)[number];

/**
 * The encoded definition of one SR 11-7 readiness criterion. This is the
 * methodology — the expert framework — not customer data. The customer's
 * grounded vendor evidence is graded *against* these definitions.
 */
export interface MrmCriterionDefinition {
  readonly id: MrmCriterionId;
  /** Short label for the Source UI. */
  readonly label: string;
  /** The SR 11-7 section / obligation this criterion encodes. */
  readonly sr117Reference: string;
  /** What a senior MRM reviewer is actually checking for. */
  readonly question: string;
  /**
   * Why failing this screens the vendor out — the regulated-AI risk the
   * institution inherits if it sources a vendor that cannot meet it.
   */
  readonly whyGating: string;
  /**
   * Whether `partial` is tolerable. A `critical` criterion must be fully
   * `met` to pass; a non-critical criterion may pass on `partial` with a
   * recorded condition. Per SR 11-7, validation, monitoring and
   * outcomes-analysis support are critical — without them the institution
   * cannot discharge its own non-delegable MRM duty.
   */
  readonly critical: boolean;
}

// ── Vendor evidence (graded input) ───────────────────────────────────────────

/** One vendor's graded answer to one criterion. */
export interface MrmCriterionAssessment {
  readonly criterionId: MrmCriterionId;
  readonly grade: MrmCriterionGrade;
  /**
   * The grounded evidence the grade rests on — a contract clause, a
   * model card, a validation-pack excerpt. Empty string when
   * `not_assessed`.
   */
  readonly evidenceNote: string;
}

/** The screen input for one vendor under evaluation in a Source event. */
export interface MrmVendorScreenInput {
  readonly vendorId: string;
  readonly vendorName: string;
  /** Graded assessments; missing criteria are treated as `not_assessed`. */
  readonly assessments: readonly MrmCriterionAssessment[];
}

// ── Screen output ────────────────────────────────────────────────────────────

/**
 * The pass/fail verdict for one vendor.
 * - `pass`        — every criterion is `met` (or non-critical `partial`).
 * - `conditional` — non-critical gaps only; the vendor proceeds to TCO
 *                   with recorded conditions that must close before award.
 * - `fail`        — one or more critical criteria are not fully met; the
 *                   vendor is screened out before TCO comparison.
 */
export const MRM_SCREEN_VERDICTS = ['pass', 'conditional', 'fail'] as const;

export type MrmScreenVerdict = (typeof MRM_SCREEN_VERDICTS)[number];

/** The graded result for one criterion, with its encoded definition joined in. */
export interface MrmCriterionResult {
  readonly criterionId: MrmCriterionId;
  readonly label: string;
  readonly sr117Reference: string;
  readonly grade: MrmCriterionGrade;
  readonly critical: boolean;
  /** True when this criterion blocks a pass (critical and not fully met). */
  readonly isBlocker: boolean;
  readonly evidenceNote: string;
}

/** The full screen result for one vendor. */
export interface MrmVendorScreenResult {
  readonly vendorId: string;
  readonly vendorName: string;
  readonly verdict: MrmScreenVerdict;
  /** Per-criterion graded results, criticals first. */
  readonly criteria: readonly MrmCriterionResult[];
  /** Criterion ids that block a pass — empty when `pass`. */
  readonly blockingCriterionIds: readonly MrmCriterionId[];
  /** Non-critical gaps recorded as conditions — empty when `pass`. */
  readonly conditionCriterionIds: readonly MrmCriterionId[];
  /**
   * Whether this vendor is allowed into the TCO comparison. `fail`
   * vendors are NOT — that is the whole point of a gating screen.
   */
  readonly eligibleForTco: boolean;
  /** One-line expert readout for the Source UI. */
  readonly readout: string;
}

/** The screen result across every vendor in a Source event. */
export interface MrmScreenView {
  readonly sourceEventId: string;
  /** Per-vendor results, failed vendors last so eligible ones read first. */
  readonly vendors: readonly MrmVendorScreenResult[];
  readonly summary: MrmScreenSummary;
}

/** Aggregated rollup over the per-vendor screen results. */
export interface MrmScreenSummary {
  readonly vendorsScreened: number;
  readonly passCount: number;
  readonly conditionalCount: number;
  readonly failCount: number;
  /** Vendors allowed into TCO comparison = pass + conditional. */
  readonly eligibleForTcoCount: number;
}
