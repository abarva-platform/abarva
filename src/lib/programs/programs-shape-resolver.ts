// programs-shape-resolver.ts
//
// WorkingPaneShapeResolver for the programs-detail surface.
// Implements Shell Layout Spec v2 §7 for Programs phases P0-P6.
//
// Each phase returns a WorkingPaneShape with:
//   stageLabel     — human-readable phase label ("P2 · Design", etc.)
//   isGateStage    — true for P2 (Design Review) and P4 (Test Sign-off)
//   primaryArtifact — undefined (children fallback = existing work pane)
//   stageTransitionAffordance — undefined (existing gate modal handles it)
//
// Waves 7+ will replace the undefined primaryArtifact with structured
// per-phase artifact components.
//
// Shell Layout Spec v2 §7.3 · April 2026

import type { WorkingPaneShapeResolver } from '@/lib/shell/working-pane-shape';
import {
  PROGRAM_PHASE_LABELS,
  PROGRAM_GATE_STAGES,
} from '@/lib/shell/working-pane-shape';

// ── Programs shape resolver ───────────────────────────────────────────────────

export const programsShapeResolver: WorkingPaneShapeResolver = (
  surface,
  stage,
  _context,
) => {
  // Only handle programs-detail surface.
  if (surface !== 'programs-detail') return null;
  // Only handle P-prefix stages.
  if (!stage || !stage.startsWith('P')) return null;

  const phaseLabel = PROGRAM_PHASE_LABELS[stage] ?? stage;
  const stageLabel = `${stage} · ${phaseLabel}`;
  const isGateStage = PROGRAM_GATE_STAGES.has(stage);

  return {
    stageLabel,
    isGateStage,
    // primaryArtifact intentionally absent — WorkingPaneContainer renders
    // children (existing work pane content) in this slot.
    // stageTransitionAffordance intentionally absent — existing gate modal
    // (GateRibbon + GateApproveModal) handles phase advancement.
  };
};
