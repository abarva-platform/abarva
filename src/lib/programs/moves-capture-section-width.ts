import type { PhaseCaptureSection } from "@/lib/programs/phase-capture-contract";

/**
 * Per-phase section width for the v2 capture grid (`MovesCaptureFlow`,
 * `.mcf-v2`), from a Claude Design review of the heavy-prose phases P3-P5.
 *
 * A section is full-width ("wide") when its answer is tabular, multi-part, or a
 * long narrative — a roadmap, a business case, a funding ask, a RACI/owner
 * matrix, a metrics table, or the recommendation band — so that every 2-3
 * question step resolves to a clean rectangle with no lone half-cell. The
 * layout rule the verdicts enforce: within a step a wide section may only lead
 * or trail (never sit mid-step), so each step is either an all-wide stack, a
 * comparable `[pair]`, or `[pair] + [wide]` / `[wide] + [pair]`.
 *
 * Sections not listed render single-column. A structured editor (the facts /
 * estimate-model / business-change / solution-route editors) is ALWAYS wide,
 * handled in `captureSectionSpan` so a plain "default" here can never narrow
 * one. P1/P2 are intentionally absent: they keep the component's own default
 * (structured wide, plain single-column), unchanged from the grid's first ship.
 */
export const PHASE_WIDE_CAPTURE_SECTIONS: Record<number, ReadonlySet<string>> = {
  3: new Set([
    "solution_approach",
    "recommendation",
    "controls_governance",
    "architecture_integration",
    "evidence_confidence",
  ]),
  4: new Set([
    "roadmap_sequencing",
    "estimates_capacity",
    "value_plan",
    "funding_governance",
    "recommendation",
  ]),
  5: new Set([
    "mobilization_plan",
    "launch_readiness",
    "value_proof_rules",
    "governance_cadence",
    "first_90_days",
  ]),
};

/**
 * The width hint for one capture section in one phase, for `MovesCaptureFlow`'s
 * `sectionSpan` prop. A structured editor is always wide; a section listed for
 * its phase is wide; everything else is single-column. Never returns "default"
 * for a structured section, so it cannot override the component's auto-wide.
 */
export function captureSectionSpan(
  phase: number,
  section: Pick<PhaseCaptureSection, "key" | "structured">,
): "wide" | "default" {
  const wide =
    Boolean(section.structured) ||
    Boolean(PHASE_WIDE_CAPTURE_SECTIONS[phase]?.has(section.key));
  return wide ? "wide" : "default";
}
