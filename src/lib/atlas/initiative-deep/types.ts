// Atlas deep-retrieval — types for `getInitiativeDeepView`.
//
// Wave-2 retrieval layer. Pure shape — no LLM, no composition. Atlas's
// composition agent (Wave 3) will call `getInitiativeDeepView()` alongside
// the IAC's `getArchetype()` (Wave 1, sibling lane) and synthesise the answer
// to a CIO question like "tell me about AR-02 Copilot."
//
// HONESTY DISCIPLINE (mirrors the Atlas P0 cross-tenant fix and the broader
// Atlas audit close): every figure surfaced is either a measured value from
// real tenant data OR a planning range from the kernel — NEVER an invented
// number. When a join returns nothing, fields are honest `null` / empty
// arrays. The shape carries explicit confidence tiers so the composer can
// tell the reader where each figure stands.
//
// TENANT SCOPE is a P0 invariant: every join is filtered by `client_id`.

import type { AtlasTenancyCtx } from '@/lib/atlas/types';

export type { AtlasTenancyCtx };

export type ConfidenceTier = 'high' | 'medium' | 'low';

/** One baseline / KPI row, e.g. `containment_rate`. */
export interface InitiativeBaselineMetric {
  /** Stable machine key — slug-cased KPI name. */
  key: string;
  /** Display label as recorded in `ai_initiative_kpis.kpi_name`. */
  label: string;
  /** The measured value at the latest reading, or null when unrecorded. */
  measured: number | null;
  /** The target value the initiative commits to, or null when not set. */
  target: number | null;
  /** Recorded unit (e.g. 'percent', 'USD per contact'), or '' when absent. */
  unit: string;
  /** YYYY-MM quarter (or month) of the latest reading. Empty when none. */
  asOf: string;
}

/** A labelled planning range, e.g. the kernel's value-forecast band. */
export interface PlanningRange {
  /** Always 'planning-range' — the composer should label it as such. */
  label: 'planning-range';
  low: number;
  high: number;
  unit: string;
}

/** Value attestation for a single initiative. */
export interface InitiativeValueAttestation {
  /** The planning range from the kernel value forecast, or null when n/a. */
  projectedRange: PlanningRange | null;
  /** The measured value from `ai_initiatives.measured_value_usd`. Null when unrecorded. */
  measured: number | null;
  /**
   * Attainment percent vs. the committed (annual) value, when both sides are
   * available. Honest `null` otherwise — never a fabricated 0.
   */
  attainmentPct: number | null;
  /** Confidence in the attestation given the data we had. */
  confidenceTier: ConfidenceTier;
}

/** One kill-criterion line from the kernel. */
export interface InitiativeKillCriterion {
  name: string;
  condition: string;
}

/** The kernel business-case skeleton — null when kernel can't compute. */
export interface InitiativeBusinessCaseSkeleton {
  verdict: 'fund' | 'shape' | 'kill' | 'hold' | null;
  reasoning: string | null;
  killCriteria: InitiativeKillCriterion[];
}

/** A gate that has been passed (recorded approval). */
export interface InitiativeGatePassed {
  name: string;
  /** ISO date the gate was passed. Empty when unrecorded. */
  passedOn: string;
  /** Role of the approver. Empty when unrecorded. */
  approverRole: string;
}

/** Next gate due, when known. */
export interface InitiativeGateUpcoming {
  name: string;
  /** ISO date due, or null when unknown. */
  dueBy: string | null;
}

export interface InitiativeGates {
  passed: InitiativeGatePassed[];
  upcoming: InitiativeGateUpcoming | null;
}

/** A signal affecting the initiative. */
export interface InitiativeSignal {
  signalId: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  summary: string;
}

/** Position of the initiative within its tenant's portfolio. */
export interface InitiativePortfolioPosition {
  /**
   * Within-tenant percentile of this initiative's value attainment, 0–100.
   * Null when there are too few peers OR this initiative has no measured value.
   */
  valueAttainmentPercentileInTenant: number | null;
  confidenceTier: ConfidenceTier;
}

/** A claim-and-source anchor for downstream citation rendering. */
export interface InitiativeEvidenceAnchor {
  claim: string;
  source: string;
  /** ISO date (YYYY-MM-DD) of the source. Empty when unrecorded. */
  date: string;
}

/**
 * The deep-retrieval view for ONE named initiative within ONE tenant.
 *
 * Every field is either a measured value, a planning range, an honest `null`,
 * or an empty array. The composer at Wave 3 reads these directly — there is
 * no further hidden mapping or fallback inside this shape.
 */
export interface InitiativeDeepView {
  initiativeId: string;
  /** Tenant display id, e.g. 'AR-02'. */
  code: string;
  name: string;
  /** IAC archetype key when known — falls back to the ai_categories id. */
  archetypeKey: string;
  /** 'pilot' | 'scaled' | 'sunset' | 'multi_year_strategic_bet' | 'in_strategic_move' | other */
  status: string;
  /** Owner display label, typically "<name> · <title>". */
  ownerLabel: string;

  baselineMetrics: InitiativeBaselineMetric[];

  valueAttestation: InitiativeValueAttestation;

  /** Null when the initiative is not a Move or the kernel cannot bind a pack. */
  businessCaseSkeleton: InitiativeBusinessCaseSkeleton | null;

  gates: InitiativeGates;

  signals: InitiativeSignal[];

  portfolioPosition: InitiativePortfolioPosition;

  evidenceAnchors: InitiativeEvidenceAnchor[];
}
