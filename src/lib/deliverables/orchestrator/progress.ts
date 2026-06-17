// Human-facing progress stages for the DECOMPOSED deliverable orchestrator.
//
// Generation is no longer six monolithic passes. It is: plan the structure
// (architect) → write each planned section in its own bounded-parallel call
// (section_draft, fired N times) → assemble the doc-level fields (synthesis).
// Total model calls = N + 2, so the band's denominator is dynamic, not a fixed 6.
//
// Rather than a spinner, the UI shows a percent band with a plain-English label
// for the phase in flight, so the wait tells the value story (planning → writing
// section by section → assembling). This module is pure: it maps a completed
// pass (+ the expected total, once known) to a {pct,label}. No I/O.

import type { GenerationPass } from "./types";

export interface GenerationProgress {
  /** the pass that just completed */
  pass: GenerationPass;
  /** 1-based count of model calls completed so far */
  completed: number;
  /** total model calls expected in the run (N sections + architect + synthesis); 0 = not yet known */
  total: number;
  /** 0..100 cumulative percent after this pass completed */
  pct: number;
  /** plain-English band label for the pass that just completed */
  label: string;
  /** plain-English label for the next phase (what's happening now), or null at the end */
  nextLabel: string | null;
}

/**
 * Plain-English label per pass. The decomposed path uses architect →
 * section_draft → synthesis; the remaining entries are the legacy monolithic
 * passes, kept only so an older trace still renders a sensible label.
 */
const PASS_LABELS: Record<GenerationPass, string> = {
  architect: "Planning the structure",
  section_draft: "Writing the document, section by section",
  synthesis: "Assembling the final document",
  // legacy monolithic passes — no longer fired by the decomposed orchestrator
  evidence_grounding: "Grounding in your evidence",
  full_draft: "Writing the first draft",
  red_team: "Pressure-testing for gaps",
  board_grade_rewrite: "Polishing to board-grade",
  render_package: "Formatting the final document",
};

/** The phases shown in the band, in order, for the decomposed run. */
export const GENERATION_PHASES: readonly { pass: GenerationPass; label: string }[] = [
  { pass: "architect", label: PASS_LABELS.architect },
  { pass: "section_draft", label: PASS_LABELS.section_draft },
  { pass: "synthesis", label: PASS_LABELS.synthesis },
];

export function stageLabel(pass: GenerationPass): string {
  return PASS_LABELS[pass] ?? pass;
}

/**
 * Build a progress event for the pass that just completed.
 *
 * `completedCount` is the 1-based number of model calls finished (i.e. the trace
 * length). `total` is the expected call count (architect + N sections + synthesis)
 * — pass it once the plan is known so the percent is real. Before the plan exists
 * (the architect call itself), `total` is omitted and the run reports a small fixed
 * "planning" percent rather than a misleading number.
 */
export function buildGenerationProgress(
  pass: GenerationPass,
  completedCount: number,
  total?: number,
): GenerationProgress {
  const label = stageLabel(pass);
  const completed = Math.max(completedCount, 1);

  // Planning phase — the section count (and therefore the real total) is not yet
  // known. Report a small fixed percent so the band moves without lying.
  if (!total || total < 1) {
    return {
      pass,
      completed,
      total: 0,
      pct: 5,
      label,
      nextLabel: PASS_LABELS.section_draft,
    };
  }

  const capped = Math.min(completed, total);
  const pct = Math.round((capped / total) * 100);

  let nextLabel: string | null;
  if (pass === "synthesis") {
    nextLabel = null;
  } else if (capped >= total - 1) {
    // the last section is done → synthesis is what runs next
    nextLabel = PASS_LABELS.synthesis;
  } else {
    nextLabel = PASS_LABELS.section_draft;
  }

  return { pass, completed: capped, total, pct, label, nextLabel };
}
