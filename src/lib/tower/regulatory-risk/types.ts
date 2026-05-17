// Tower · Regulatory-scoped risk lens · Wave C1 · shared types.
//
// GAP-7 from FIRSTCAPITAL-LOOP-WIRING-GAPS.md: the Tower risk view
// renders portfolio risk but does not distinguish *regulatory* risk. The
// First Capital scenario's executive headline is that an SR 11-7 model
// validation gate is a *regulatory control gap*, not a schedule slip — a
// CXO must see regulatory exposure as its own lens, not folded into
// generic delivery risk.
//
// This module adds a regulatory dimension on top of the existing Tower
// risk lines: each risk line is classified into a risk *kind*, and the
// regulatory subset is rolled up into its own lens with privileged-
// disclosure scoping carried through. It is a pure re-projection — it
// consumes already-built risk lines, performs no data-plane read.
//
// Pure: no I/O, no DB, no model calls.

import type { DisclosureClassification } from '@/lib/source/disclosure-flag';

// ── Risk kind — the regulatory dimension ─────────────────────────────────────

/**
 * The risk *kind* axis the regulatory lens adds. Generic Tower risk
 * conflates these; the scenario needs them separated.
 * - `delivery`     — schedule, scope, resourcing, execution risk.
 * - `commercial`   — cost, vendor, contract, concentration risk.
 * - `regulatory`   — a control gap measured against a named regulatory
 *                    obligation (SR 11-7, fair lending, BSA/AML, a
 *                    consent order). This is the lens GAP-7 surfaces.
 * - `operational`  — run-state, reliability, security risk.
 */
export const RISK_KINDS = [
  'delivery',
  'commercial',
  'regulatory',
  'operational',
] as const;

export type RiskKind = (typeof RISK_KINDS)[number];

/**
 * Named regulatory regimes a regulatory risk can be scoped to. Encoded
 * so a regulatory risk line is tied to an actual obligation, not free
 * text — the difference between "a control gap" and "a delivery risk".
 */
export const REGULATORY_REGIMES = [
  'sr_11_7_model_risk',
  'bsa_aml',
  'fair_lending',
  'consent_order',
  'data_privacy',
  'other_regulatory',
] as const;

export type RegulatoryRegime = (typeof REGULATORY_REGIMES)[number];

/** Coarse severity for a risk line, shared across kinds. */
export const RISK_SEVERITIES = ['low', 'moderate', 'high', 'critical'] as const;

export type RiskSeverity = (typeof RISK_SEVERITIES)[number];

// ── Input ────────────────────────────────────────────────────────────────────

/**
 * A risk line fed into the regulatory lens. This is the generic Tower
 * risk-line shape — the lens builder classifies and scopes it. Callers
 * project their existing portfolio risk rows into this shape.
 */
export interface TowerRiskLineInput {
  /** Stable id of the risk line. */
  readonly id: string;
  /** The portfolio subject (Move / program) the risk attaches to. */
  readonly subjectRef: string;
  /** Short headline. */
  readonly title: string;
  /** What the risk is and why it matters. */
  readonly detail: string;
  readonly severity: RiskSeverity;
  /**
   * The risk kind, when the caller already knows it. When omitted the
   * lens leaves classification to the caller-supplied `regime` — a line
   * with a `regime` is regulatory; a line without is non-regulatory and
   * its `kind` must be supplied.
   */
  readonly kind?: RiskKind;
  /**
   * The regulatory regime, when this line is a regulatory control gap.
   * Presence of a regime forces `kind === 'regulatory'`.
   */
  readonly regime?: RegulatoryRegime;
  /**
   * Disclosure classification of the risk line itself — the ELT / risk
   * brief line may be legal-privileged (the First Capital scenario marks
   * the consent-order remediation analysis privileged). Defaults to
   * `none` when omitted.
   */
  readonly disclosure?: DisclosureClassification;
}

// ── Output ───────────────────────────────────────────────────────────────────

/** A risk line after classification + disclosure scoping. */
export interface ClassifiedRiskLine {
  readonly id: string;
  readonly subjectRef: string;
  readonly title: string;
  readonly detail: string;
  readonly severity: RiskSeverity;
  readonly kind: RiskKind;
  /** The regulatory regime; null for non-regulatory lines. */
  readonly regime: RegulatoryRegime | null;
  /** True for `kind === 'regulatory'` lines — the lens membership flag. */
  readonly isRegulatory: boolean;
  readonly disclosure: DisclosureClassification;
  /** True when the line carries a legal-privileged disclosure marking. */
  readonly privileged: boolean;
  /**
   * The executive readout — for a regulatory line this names it as a
   * control gap against its regime, NOT a delivery slip.
   */
  readonly executiveReadout: string;
}

/** Rollup of the regulatory subset, by regime and by severity. */
export interface RegulatoryRiskSummary {
  /** Total risk lines fed into the lens. */
  readonly totalRiskLines: number;
  /** Lines classified `regulatory`. */
  readonly regulatoryLineCount: number;
  /** Regulatory lines at `high` or `critical` severity. */
  readonly elevatedRegulatoryCount: number;
  /** Regulatory lines carrying a legal-privileged disclosure marking. */
  readonly privilegedRegulatoryCount: number;
  /** Regulatory line counts keyed by regime (only non-zero regimes). */
  readonly byRegime: Readonly<Partial<Record<RegulatoryRegime, number>>>;
  /** Regulatory line counts keyed by severity. */
  readonly bySeverity: Readonly<Record<RiskSeverity, number>>;
}

/** The Tower regulatory-risk lens view model for one portfolio. */
export interface RegulatoryRiskLensView {
  readonly portfolioRef: string;
  /** Every classified line — the full risk set, regulatory flagged. */
  readonly allLines: readonly ClassifiedRiskLine[];
  /** The regulatory subset, severity-sorted most-severe first. */
  readonly regulatoryLines: readonly ClassifiedRiskLine[];
  readonly summary: RegulatoryRiskSummary;
}
