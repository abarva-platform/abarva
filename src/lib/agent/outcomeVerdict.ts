// Maestro Intake three-outcome pressure-test contract · FM-01 (File 01 P0)
//
// Every program that flows through Maestro Intake must receive a pressure-
// test verdict before it can open a charter. File 01 FM-01 names three
// canonical outcomes:
//
//   GO       — viable in its current framing; proceed to charter
//   REFINE   — viable but scope is hazy; tighten before charter
//   REDIRECT — premise is weak; the program being asked for is not the
//              program that should be built
//
// This is a half-Code / half-Codex item. Codex's Stage 5 composition
// produces the verdict and rationale against the intake turn + tenant
// context + pattern library. Code (this module) defines the shape that
// comes out, and the <OutcomeVerdict> component renders it.
//
// Why this file separate from renderedResponse.ts: that contract is the
// general agent-response shape. The intake verdict is a specific, single-
// purpose structured signal — rendered once at intake conclusion, not in
// every agent turn. Keeping it separate avoids bloating the per-turn
// contract with intake-specific fields.

export type VerdictOutcome = 'GO' | 'REFINE' | 'REDIRECT';

/**
 * Confidence tier reused from the per-turn render contract so UI rendering
 * stays consistent with citation confidence display (§9.3).
 */
export type VerdictConfidence = 'HIGH' | 'MEDIUM' | 'LOW';

export interface VerdictFactor {
  /** Short label, e.g. "Sponsor commitment" or "Data readiness". */
  label: string;
  /** Per-factor signal. */
  signal: 'strong' | 'mixed' | 'weak';
  /** One-line qualifier the agent's reasoning uses to explain the signal. */
  note: string;
}

export interface OutcomeVerdictShape {
  outcome: VerdictOutcome;
  confidence: VerdictConfidence;
  /** Lead sentence — what the agent is telling the user about the program. */
  headline: string;
  /**
   * Rationale prose, 2-4 sentences. Must name specific evidence the agent
   * used (pattern matches, tenant context, intake signals). Generic
   * encouragement ("great idea! let's go!") is a voice-contract violation.
   */
  rationale: string;
  /**
   * Factor decomposition — ≤5 named dimensions the agent weighed. Renders
   * as chips; lets the sponsor see which levers drove the outcome.
   */
  factors: VerdictFactor[];
  /**
   * What to do next, given this outcome. For GO: proceed to charter.
   * For REFINE: the named scope tightening. For REDIRECT: the alternative
   * program shape the agent recommends.
   */
  next_step: {
    label: string;
    /** If set, the next-step chip navigates here instead of triggering a callback. */
    href?: string;
  };
  /**
   * When true, Codex's retrieval returned sparse patterns. The render MUST
   * surface honest disclosure before the verdict (§10.4). Never hide a
   * sparse verdict behind confident styling.
   */
  sparse_retrieval?: boolean;
}

/**
 * Per-outcome display metadata. Kept here (not in the component) so Codex
 * composition can reference the same color/label mapping when producing
 * the verdict shape.
 */
export const OUTCOME_META: Record<VerdictOutcome, { label: string; tone: string; accent: string; dot: string }> = {
  GO: {
    label: 'GO',
    tone: 'viable · proceed to charter',
    accent: '#2DD4BF',
    dot: '#14B8A6',
  },
  REFINE: {
    label: 'REFINE',
    tone: 'viable · scope needs tightening first',
    accent: '#F59E0B',
    dot: '#D97706',
  },
  REDIRECT: {
    label: 'REDIRECT',
    tone: 'premise weak · different program recommended',
    accent: '#F97066',
    dot: '#E04444',
  },
};
