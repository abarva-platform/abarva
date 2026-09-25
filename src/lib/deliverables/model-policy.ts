// Deliverable generation — the single place a model is named.
//
// WHY THIS FILE EXISTS
//
// The model was previously a string literal at six call sites in v2-generator.ts
// plus an env fallback in moves-generate-deps.ts. When the fleet moved to
// opus-4-8, five of those were updated and the Moves composer was left on
// opus-4-7 — and it stayed behind through two subsequent PRs, because nothing
// could see the difference. A hardcoded literal has no owner.
//
// One constant, one override, one test that forbids any other path from naming
// a model. Bumping the fleet is now a one-line change.

/**
 * The model every client-facing deliverable is generated with.
 *
 * Deliverables are the product. They go in front of a CFO, a board and a
 * procurement lead, and the quality difference between model generations shows
 * up in exactly the judgement this pipeline cannot measure for itself. This
 * path does not economise on model choice.
 */
export const DELIVERABLE_MODEL = 'claude-opus-5' as const;

/**
 * Per-pass token budgets.
 *
 * These have never been the binding constraint on deck quality — a 33-slide
 * board deck carries roughly 12,700 tokens of visible prose, comfortably inside
 * one major pass. Raising them does not make a deck better; giving the renderer
 * real exhibit data does. They are here so the number has an owner, not because
 * it is the lever.
 */
export const DELIVERABLE_MAX_TOKENS = {
  /** Section and narrative generation — the long passes. */
  major: 32_000,
  /** Short structured passes: classification, shaping, repair. */
  minor: 4_000,
} as const;

/**
 * Resolve the generation model.
 *
 * The env override exists for a controlled experiment or an incident rollback,
 * not for per-caller preference. A caller that wants a different model for its
 * own reasons should change `DELIVERABLE_MODEL` and move the whole fleet, so
 * the decision is visible in one diff.
 */
export function deliverableModel(): string {
  const override = process.env.ABARVA_DELIVERABLE_MODEL?.trim();
  return override && override.length > 0 ? override : DELIVERABLE_MODEL;
}
