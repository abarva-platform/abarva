// source-shape-resolver.ts
//
// WorkingPaneShapeResolver for the source-detail surface.
// Implements Shell Layout Spec v2 §7 for Source event stages S1-S7.
//
// Each stage returns a WorkingPaneShape with:
//   stageLabel     — human-readable stage label ("S7 · BAFO", etc.)
//   isGateStage    — true for S3 (Shortlist), S6 (Initial Bid), S7 (BAFO)
//   primaryArtifact — undefined (children fallback = existing work pane)
//   stageTransitionAffordance — undefined (future Wave 8)
//
// Shell Layout Spec v2 §7.4 · April 2026

import type { WorkingPaneShapeResolver } from '@/lib/shell/working-pane-shape';
import {
  SOURCE_STAGE_LABELS,
  SOURCE_GATE_STAGES,
} from '@/lib/shell/working-pane-shape';

// ── Source shape resolver ─────────────────────────────────────────────────────

export const sourceShapeResolver: WorkingPaneShapeResolver = (
  surface,
  stage,
  _context,
) => {
  // Only handle source-detail surface.
  if (surface !== 'source-detail') return null;
  // Only handle S-prefix stages.
  if (!stage || !stage.startsWith('S')) return null;

  const stageLabel = SOURCE_STAGE_LABELS[stage]
    ? `${stage} · ${SOURCE_STAGE_LABELS[stage]}`
    : stage;
  const isGateStage = SOURCE_GATE_STAGES.has(stage);

  return {
    stageLabel,
    isGateStage,
    // primaryArtifact intentionally absent — WorkingPaneContainer renders
    // children (existing work pane content) in this slot.
    // stageTransitionAffordance deferred to Wave 8.
  };
};
