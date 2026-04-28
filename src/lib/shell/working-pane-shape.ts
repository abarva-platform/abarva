// working-pane-shape.ts
//
// Stage-aware working pane contract — Shell Layout Spec v2 §7.
//
// WorkingPaneShape is the typed descriptor that each stage produces.
// WorkingPaneContainer (in components/shell) reads the current stage
// from AtlasPageState and calls the supplied shapeResolver to produce
// this shape, then renders it.
//
// Waves 5 and 6 provide concrete shapeResolver implementations for
// Programs (P0-P6) and Source (S1-S7) respectively.
//
// Shell Layout Spec v2 §7.1 · April 2026

import type { ReactNode } from 'react';
import type { SurfaceId, StageId } from './atlas-page-state';

// ── Shape descriptor ──────────────────────────────────────────────────────────

/**
 * Describes what the working pane should render for a given surface + stage.
 *
 * primaryArtifact    — main content; fills available space.
 *                      When omitted, WorkingPaneContainer renders its
 *                      children prop instead (backward-compat fallback).
 * secondaryArtifact  — optional supplemental panel; rendered below primary
 *                      with a max-height constraint.
 * stageTransitionAffordance — optional gate / advance affordance rendered at
 *                      the bottom of the pane; null for non-gate stages.
 * stageLabel         — short human-readable label for the current stage
 *                      ("P2 · Design", "S7 · BAFO", etc.).
 * isGateStage        — true when this stage requires an explicit approval
 *                      gate before advancing (e.g. P2→P3, P4→P5 in Programs).
 */
export interface WorkingPaneShape {
  /** When absent, WorkingPaneContainer's children fill the primary slot. */
  primaryArtifact?: ReactNode;
  secondaryArtifact?: ReactNode;
  stageTransitionAffordance?: ReactNode;
  stageLabel: string;
  isGateStage: boolean;
}

// ── Resolver function type ────────────────────────────────────────────────────

/**
 * A function that maps (surface, stage) → WorkingPaneShape.
 * Each surface provides its own implementation in Waves 5 and 6.
 * Returns null for unknown combinations — WorkingPaneContainer falls back
 * to rendering the raw children prop in that case.
 */
export type WorkingPaneShapeResolver = (
  surface: SurfaceId,
  stage: StageId | null,
  context: Record<string, unknown>,
) => WorkingPaneShape | null;

// ── Null resolver (default, replaced by surface-specific resolvers) ────────────

/**
 * The default no-op resolver. Returns null so WorkingPaneContainer renders
 * its raw children — identical to pre-Wave-4 behaviour, ensuring backward
 * compatibility during the rollout.
 */
export const nullWorkingPaneShapeResolver: WorkingPaneShapeResolver = () => null;

// ── Stage label helpers ───────────────────────────────────────────────────────

/** Human label for Programs phases P0-P6. */
export const PROGRAM_PHASE_LABELS: Record<string, string> = {
  P0: 'Discovery',
  P1: 'Assess',
  P2: 'Design',
  P3: 'Build',
  P4: 'Test',
  P5: 'Activate',
  P6: 'Operate',
};

/** Human label for Source event stages S1-S7. */
export const SOURCE_STAGE_LABELS: Record<string, string> = {
  S1: 'Plan',
  S2: 'RFI',
  S3: 'Shortlist',
  S4: 'RFP',
  S5: 'Q&A',
  S6: 'Initial Bid',
  S7: 'BAFO',
};

/** Gate stages for Programs (approval required to advance). */
export const PROGRAM_GATE_STAGES = new Set<string>(['P2', 'P4']);

/** Gate stages for Source events (approval required to advance). */
export const SOURCE_GATE_STAGES = new Set<string>(['S3', 'S6', 'S7']);
