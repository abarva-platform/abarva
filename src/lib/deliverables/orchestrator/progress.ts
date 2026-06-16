// Human-facing progress stages for the multi-pass deliverable orchestrator.
//
// The orchestrator runs six passes that take ~30–60s end to end. Rather than a
// spinner, the UI shows a progress band with a percent and a plain-English label
// for the stage in flight — so the wait tells the value story (planning →
// grounding → drafting → pressure-testing → polishing → formatting).
//
// This module is pure: it maps a completed pass to a {pct, label} so the run
// ledger can persist progress and the poll endpoint can surface it. No I/O.

import type { GenerationPass } from "./types";

export interface GenerationProgress {
  /** the pass that just completed */
  pass: GenerationPass;
  /** 1-based count of passes completed so far */
  completed: number;
  /** total passes in the sequence */
  total: number;
  /** 0..100 cumulative percent after this pass completed */
  pct: number;
  /** plain-English band label for the pass that just completed */
  label: string;
  /** plain-English label for the next pass (what's happening now), or null at the end */
  nextLabel: string | null;
}

interface Stage {
  pass: GenerationPass;
  label: string;
}

/** Ordered to match the pass sequence in orchestrator.ts. */
export const GENERATION_STAGES: readonly Stage[] = [
  { pass: "architect", label: "Planning the structure" },
  { pass: "evidence_grounding", label: "Grounding in your evidence" },
  { pass: "full_draft", label: "Writing the first draft" },
  { pass: "red_team", label: "Pressure-testing for gaps" },
  { pass: "board_grade_rewrite", label: "Polishing to board-grade" },
  { pass: "render_package", label: "Formatting the final document" },
];

export const TOTAL_GENERATION_STAGES = GENERATION_STAGES.length;

export function stageLabel(pass: GenerationPass): string {
  return GENERATION_STAGES.find((s) => s.pass === pass)?.label ?? pass;
}

/**
 * Build a progress event for the pass that just completed. `completedCount` is
 * 1-based (1 after the first pass). Percent is cumulative; `nextLabel` names the
 * pass now in flight (null once the final pass has completed).
 */
export function buildGenerationProgress(
  pass: GenerationPass,
  completedCount: number,
): GenerationProgress {
  const total = TOTAL_GENERATION_STAGES;
  const completed = Math.min(Math.max(completedCount, 1), total);
  const pct = Math.round((completed / total) * 100);
  const next = GENERATION_STAGES[completed]; // completed is 1-based → index === next stage
  return {
    pass,
    completed,
    total,
    pct,
    label: stageLabel(pass),
    nextLabel: next ? next.label : null,
  };
}
