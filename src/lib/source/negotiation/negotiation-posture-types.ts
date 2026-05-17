// Slice 1.5 — Negotiation posture generator
//
// Types for turning two upstream sourcing artifacts — a should-cost estimate
// (Slice 1.3) and a proposal-normalization matrix (Slice 1.4) — into
// executive-grade commercial negotiation advice: the levers worth pulling,
// the walk-away risks, the concessions worth trading, incumbent leverage, and
// the AI-sourcing contract clauses to press (methodology §6).
//
// Standalone module. Does not import from or modify any shared Source file.

import type { ShouldCostEstimate } from '../should-cost/should-cost-model';
import type { ProposalNormalizationMatrix } from '../proposal-normalization/proposal-normalization-types';

// ── Input ────────────────────────────────────────────────────────────────────

/**
 * Optional commercial framing the buyer brings to the table. Every field is
 * optional — the generator degrades gracefully and simply produces fewer or
 * weaker levers when context is thin.
 */
export interface NegotiationContext {
  /** Vendor the buyer (tentatively) intends to award to — anchors the posture. */
  preferredVendorId?: string;
  /**
   * Incumbent vendor, if this sourcing event is a re-compete. Drives the
   * incumbent-leverage analysis (switching cost vs. competitive tension).
   */
  incumbentVendorId?: string;
  /**
   * Whether a credible, deal-ready alternative exists. Competitive tension is
   * the single strongest lever; without it the posture weakens materially.
   */
  hasCredibleAlternative?: boolean;
  /**
   * Buyer's budget ceiling in USD, if fixed. When the should-cost midpoint
   * exceeds it, that gap becomes a walk-away risk and a lever.
   */
  budgetCeilingUsd?: number;
  /** Months until the buyer must have a signed contract — timing leverage. */
  decisionWindowMonths?: number;
  /** Whether the buyer can credibly publish a multi-year commitment. */
  multiYearCommitmentPossible?: boolean;
  /** Whether the buyer is a referenceable, marquee logo for the vendor. */
  referenceValueHigh?: boolean;
}

export interface NegotiationPostureInput {
  /** Free-text identifier for the deal being negotiated. */
  dealLabel: string;
  /** Should-cost estimate from Slice 1.3. */
  shouldCost: ShouldCostEstimate;
  /** Proposal-normalization matrix from Slice 1.4. */
  proposalMatrix: ProposalNormalizationMatrix;
  /** Optional commercial framing the buyer brings. */
  context?: NegotiationContext;
  /** ISO timestamp; defaults to a fixed value so the module stays pure. */
  generatedAt?: string;
}

// ── Output ───────────────────────────────────────────────────────────────────

/** How hard a lever can be pushed given the buyer's actual position. */
export type LeverStrength = 'strong' | 'moderate' | 'weak';

/** Where a negotiation lever draws its force from. */
export type LeverKind =
  | 'should_cost_gap' // the quote vs. true-cost or vs. should-cost gap
  | 'competitive_tension' // a credible alternative on the table
  | 'commercial_model' // consumption caps, fixed-price conversion, escalation
  | 'term_divergence' // a normalized term where this vendor is the outlier
  | 'multi_year' // a longer commitment traded for price
  | 'reference_value' // marquee-logo / case-study value to the vendor
  | 'timing'; // decision-window pressure on either side

/** One negotiation lever the buyer can pull, with the script to use it. */
export interface NegotiationLever {
  kind: LeverKind;
  /** Short imperative headline — the lever named. */
  title: string;
  strength: LeverStrength;
  /** The grounded rationale — what in the artifacts makes this real. */
  rationale: string;
  /** The ask, phrased the way the buyer should put it on the table. */
  ask: string;
  /** Estimated USD value at stake, when quantifiable; null when not. */
  estimatedValueUsd: number | null;
}

/** A risk that should make the buyer willing to walk away from the table. */
export interface WalkAwayRisk {
  title: string;
  /** Why this is a genuine walk-away trigger, grounded in the artifacts. */
  rationale: string;
  /** What the buyer should require before signing, to retire the risk. */
  mitigationAsk: string;
  /** 'high' risks are non-negotiable; 'moderate' are firm-but-tradeable. */
  severity: 'high' | 'moderate';
}

/** A concession the buyer can offer — cheap to give, valuable to the vendor. */
export interface ConcessionToTrade {
  title: string;
  /** Why this costs the buyer little. */
  buyerCost: string;
  /** Why the vendor values it — what the buyer should demand in return. */
  vendorValue: string;
  /** The specific counter-ask this concession should be exchanged for. */
  tradeFor: string;
}

/** The incumbent-leverage read — switching cost vs. competitive tension. */
export interface IncumbentLeverage {
  /** Whether this event has an incumbent at all. */
  hasIncumbent: boolean;
  /** Who holds the leverage on balance. */
  leverageHolder: 'buyer' | 'vendor' | 'balanced';
  /** The grounded read of why. */
  assessment: string;
  /** What the buyer should do with that read. */
  recommendedPlay: string;
}

/** An AI-sourcing contract clause to press, cross-referenced to §6. */
export interface ClauseIssue {
  /** Clause name as it appears in methodology §6. */
  clause: string;
  /** Why it matters — the §6 rationale, made specific to this deal. */
  whyItMatters: string;
  /** Whether the proposal matrix shows this term as exposed/undisclosed. */
  surfacedByMatrix: boolean;
  /** The contractual ask the buyer should table. */
  ask: string;
  /** 'must_have' clauses block signature; 'should_have' are strongly advised. */
  priority: 'must_have' | 'should_have';
}

export interface NegotiationPosture {
  dealLabel: string;
  modelVersion: '1.0';
  generatedAt: string;
  /** The opening commercial position the buyer should take into the room. */
  headline: string;
  /** Top negotiation levers, strongest first — capped at five. */
  levers: NegotiationLever[];
  /** Risks that justify walking away, highest severity first. */
  walkAwayRisks: WalkAwayRisk[];
  /** Concessions worth trading for a better deal. */
  concessions: ConcessionToTrade[];
  /** The incumbent-leverage read. */
  incumbentLeverage: IncumbentLeverage;
  /** AI-sourcing clause issues to press, must-haves first. */
  clauseIssues: ClauseIssue[];
  /** The single most important move — the partner's one-line counsel. */
  recommendedOpening: string;
}
