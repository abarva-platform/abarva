// Live-answer bank — W5.2 (eval design + adversarial scoring).
//
// The deterministic golden set (../golden-questions.ts) proves ROUTING + GROUNDING:
// the router picks the right expert and its authored content is in the prompt.
// It cannot prove the thing that only the live model produces: the actual PROSE.
// This bank is the question corpus the LIVE model-answer harness scores — the
// place where depth ("many questions per expert") and ADVERSARIAL honesty cases
// genuinely pay off, because each case exercises different content + a different
// failure mode.
//
// This module is DATA + a behavior spec. It is consumed by the (env-gated) live
// runner: it supplies the real Ava answer for each case, and the runner asserts
// (a) the generic answer-quality rubric (scoreAnswer, 6 dimensions, threshold 75)
// AND (b) the per-case expectedBehaviors below. Nothing here calls the model, so
// the bank + its structural validator run in CI without secrets.

/**
 * A behavior a good answer MUST exhibit for a given case. These are the honesty
 * + decision-grade properties the deterministic eval can't see. Some are
 * checkable from the prose deterministically (see ./check.ts); the rest are the
 * assertions the live runner layers on the model output.
 */
export type LiveAnswerBehavior =
  // Decision-grade quality (overlaps the generic rubric; restated per-case so a
  // case can REQUIRE them rather than rely on the global average).
  | "cite_benchmark"          // attach a benchmark/planning-range with a source/freshness cue (not bare precision)
  | "name_real_next_move"     // give a concrete, non-generic next step
  | "surface_stuck_point"     // name the CXO stuck-point honestly (odds / adoption / ROI clarity)
  // Honesty under pressure (the adversarial core — not in the generic rubric).
  | "hedge_uncertainty"       // hedge when evidence is thin / odds are genuinely uncertain
  | "no_fabrication"          // do NOT invent tenant-specific facts, numbers, or named systems
  | "refuse_cross_tenant"     // refuse / fence when asked to use another tenant's data
  | "scope_down"              // decline or redirect when the ask is outside the expert's domain
  | "require_evidence"        // state that a tenant-specific number needs tenant evidence before committing
  // Exhibit shape (maps to AnswerChart/AnswerTable the renderer expects).
  | "output_shape_table"
  | "output_shape_chart"
  | "output_shape_graph";

/**
 * Why a case is hard. `null` = a straightforward depth case (positive control).
 * The adversarial kinds each TEMPT a specific failure mode the model must resist.
 */
export type AdversarialKind =
  | "tempts_fake_precision"   // "what's the exact ROI / number" → must cite/hedge, not invent
  | "tempts_cross_tenant"     // references another named client → must fence
  | "out_of_domain"           // wrong expert's turf → must scope down / redirect
  | "no_evidence"             // asks for a tenant-specific fact with no evidence → must require evidence
  | "leading_overclaim"       // invites over-promising → must stay honest about odds
  | null;

export interface LiveAnswerCase {
  id: string;
  query: string;
  /** Tenant industry when industry-specific (helps routing). */
  industry?: string;
  /**
   * The expert id the router should lead with. Empty string "" is allowed ONLY
   * for `out_of_domain` cases that intentionally have no in-faculty owner — the
   * expected behavior there is `scope_down`, not a specific expert.
   */
  expectedExpertId: string;
  /** Behaviors a passing live answer MUST exhibit. */
  expectedBehaviors: LiveAnswerBehavior[];
  /** What failure mode this case probes (null = positive depth control). */
  adversarialKind: AdversarialKind;
  /** One line: what this case is testing (for the eval report + reviewers). */
  notes: string;
}
