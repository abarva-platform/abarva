// PDEL7 · Deliverable Canvas Viewer view-model.
//
// Pure deterministic view-model that projects a (tenant, program, artifact)
// triple into a single-deliverable viewer shape. The future deliverable
// detail surface renders from this contract.
//
// No live runtime, no upload pipeline, no parse engine, no model calls,
// no Date.now reads, no random IDs, no migrations. No live download or
// export — every action is disabled with an honest reason.
//
// This module does NOT import:
//   - src/lib/source/**, src/app/(maestro)/source/**
//   - src/lib/sentinel/**, src/lib/atlas/**, src/lib/nexus/**
//   - src/lib/agent/**, src/components/agent/**
//   - src/app/programs/**, src/app/(maestro)/preview/**, src/app/demo/**
//   - src/lib/programs/mock.ts
//   - src/lib/auth/**
//   - supabase/**

import {
  buildProgramArtifactInventory,
  type ProgramArtifact,
  type ProgramArtifactStatus,
  type ProgramDeliverableRenderMode,
} from '@/lib/programs/program-artifact-inventory';
import {
  buildAllProgramsSeedPlan,
  type ProgramSeedPlan,
  type TenantSeedPlan,
} from '@/lib/programs/enhancement-seed-planner';

// ---------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------

export type DeliverableViewerRenderMode =
  | 'html'
  | 'markdown'
  | 'rich_text_placeholder';

export type DeliverableViewerActionKey =
  | 'edit'
  | 'regenerate'
  | 'download'
  | 'approve';

export type DeliverableViewerEvidenceStatus =
  | 'usable'
  | 'partial'
  | 'not_usable';

export type DeliverableViewerGenerationLabel = 'generated' | 'uploaded';

export interface DeliverableViewerAction {
  key: DeliverableViewerActionKey;
  enabled: false;
  /** Short label naming the deferred future destination. */
  futureLabel: string;
  /** Honest sub-caption explaining why the action is not yet available. */
  reason: string;
}

export interface DeliverableViewerView {
  /** Stable artifact id (matches ProgramArtifact.id from PDEL inventory). */
  artifactId: string;
  /** Human-readable deliverable title. */
  title: string;
  /** Phase label (e.g. "Charter", "Diagnose"). */
  phase: string;
  /** Artifact-type label (e.g. "Generated deliverable"). */
  artifactType: string;
  /** Render mode the viewer should use. */
  renderMode: DeliverableViewerRenderMode;
  /** Lifecycle status carried from the PDEL inventory. */
  status: ProgramArtifactStatus;
  /** Optional version label; null when versioning is not yet wired. */
  versionLabel: string | null;
  /** Honest evidence-usability state. */
  evidenceStatus: DeliverableViewerEvidenceStatus;
  /** Deterministic list of unmet inputs / deferred bindings. */
  missingInputs: string[];
  /** Whether this deliverable was generated or uploaded. */
  generationLabel: DeliverableViewerGenerationLabel;
  /** Deterministic seed body the viewer renders (already escape-safe text). */
  previewBody: string;
  /** All four future actions, every one disabled. */
  disabledActions: DeliverableViewerAction[];
  /** Honest disclaimer caption (deterministic seed naming). */
  honestDisclaimer: string;
  createdFrom: 'deterministic_deliverable_view_seed';
}

// ---------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------

const HONEST_DISCLAIMER =
  'Composed deterministically from the program seed. No live retrieval, no model invocation, no live edit, no live regenerate, and no live download — every action is deferred to a later slice.';

const RICH_TEXT_PLACEHOLDER_BODY =
  'Rich-text preview is not yet wired for this artifact type.';

const FUTURE_LABEL: Record<DeliverableViewerActionKey, string> = {
  edit: 'future',
  regenerate: 'future',
  download: 'future',
  approve: 'future',
};

const ACTION_REASONS: Record<DeliverableViewerActionKey, string> = {
  edit: 'Edit is not yet available; the deliverable editor is deferred to a future slice.',
  regenerate:
    'Regenerate is not yet available; the model invocation seam is deferred to a future slice.',
  download:
    'Download is not yet available; export pipeline is deferred to a future slice.',
  approve:
    'Approve is not yet available; Steward gate sign-off is deferred to a future slice.',
};

const ACTION_KEYS_IN_ORDER: ReadonlyArray<DeliverableViewerActionKey> = [
  'edit',
  'regenerate',
  'download',
  'approve',
];

const PHASE_LABELS: Record<string, string> = {
  origination: 'Origination',
  charter: 'Charter',
  diagnose: 'Diagnose',
  design: 'Design',
  execute: 'Execute',
  verify: 'Verify',
  cross_phase: 'Cross-phase',
};

// ---------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------

/**
 * Build the deterministic viewer view-model for a single deliverable.
 * Pure: same (programId, artifactId) → identical output.
 *
 * Returns `null` when no canonical (program, artifact) pair matches the
 * supplied identifiers; callers render a defensive fallback.
 */
export function buildDeliverableCanvasView(
  programId: string,
  artifactId: string,
): DeliverableViewerView | null {
  const located = locateProgram(programId);
  if (!located) return null;

  const { tenant, program } = located;
  const inventory = buildProgramArtifactInventory(tenant, program);
  const artifact =
    inventory.artifacts.find((entry) => entry.id === artifactId) ?? null;
  if (!artifact) return null;

  const renderMode = toDeliverableViewerRenderMode(artifact.renderMode);
  const previewBody = buildPreviewBody(artifact, program, renderMode);
  const disabledActions = ACTION_KEYS_IN_ORDER.map<DeliverableViewerAction>(
    (key) => ({
      key,
      enabled: false,
      futureLabel: FUTURE_LABEL[key],
      reason: ACTION_REASONS[key],
    }),
  );

  return {
    artifactId: artifact.id,
    title: artifact.title,
    phase: phaseLabelFor(artifact.phaseBucket),
    artifactType: artifactTypeLabel(artifact.type),
    renderMode,
    status: artifact.status,
    versionLabel: null,
    evidenceStatus: artifact.evidenceUsability,
    missingInputs: missingInputsFor(artifact),
    generationLabel: generationLabelFor(artifact),
    previewBody,
    disabledActions,
    honestDisclaimer: HONEST_DISCLAIMER,
    createdFrom: 'deterministic_deliverable_view_seed',
  };
}

// ---------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------

function locateProgram(
  programId: string,
): { tenant: TenantSeedPlan; program: ProgramSeedPlan } | null {
  const plan = buildAllProgramsSeedPlan();
  for (const tenant of plan.tenants) {
    for (const program of tenant.programs) {
      if (program.programSlug === programId) return { tenant, program };
    }
  }
  for (const tenant of plan.tenants) {
    for (const program of tenant.programs) {
      if (program.code === programId) return { tenant, program };
    }
  }
  for (const tenant of plan.tenants) {
    for (const program of tenant.programs) {
      if (program.graphNodeId === programId) return { tenant, program };
    }
  }
  return null;
}

function toDeliverableViewerRenderMode(
  mode: ProgramDeliverableRenderMode,
): DeliverableViewerRenderMode {
  switch (mode) {
    case 'html_render':
      return 'html';
    case 'markdown_render':
    case 'note_list':
      return 'markdown';
    case 'pdf_preview':
    case 'spreadsheet_table':
    case 'presentation_thumbnails':
    case 'data_inspector':
    case 'no_render':
      return 'rich_text_placeholder';
  }
}

function buildPreviewBody(
  artifact: ProgramArtifact,
  program: ProgramSeedPlan,
  renderMode: DeliverableViewerRenderMode,
): string {
  if (renderMode === 'html') return htmlPreviewBody(artifact, program);
  if (renderMode === 'markdown') return markdownPreviewBody(artifact, program);
  return RICH_TEXT_PLACEHOLDER_BODY;
}

function htmlPreviewBody(
  artifact: ProgramArtifact,
  program: ProgramSeedPlan,
): string {
  // Even though the component never injects raw HTML, we keep the seed
  // body escape-safe so callers (or future markdown→HTML pipelines) can
  // render it without re-escaping.
  const safeTitle = escapeHtml(artifact.title);
  const safeProgram = escapeHtml(program.name);
  const safePhase = escapeHtml(phaseLabelFor(artifact.phaseBucket));
  const safeFallback = escapeHtml(artifact.honestFallback);
  const safeDescription = escapeHtml(artifact.description);
  return [
    `<section data-deliverable-preview="html">`,
    `<header><h2>${safeTitle}</h2>`,
    `<p class="meta">${safeProgram} · ${safePhase}</p></header>`,
    `<p>${safeDescription}</p>`,
    `<aside class="honest-fallback">${safeFallback}</aside>`,
    `</section>`,
  ].join('');
}

function markdownPreviewBody(
  artifact: ProgramArtifact,
  program: ProgramSeedPlan,
): string {
  return [
    `# ${artifact.title}`,
    ``,
    `${program.name} · ${phaseLabelFor(artifact.phaseBucket)}`,
    ``,
    artifact.description,
    ``,
    `> ${artifact.honestFallback}`,
  ].join('\n');
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function missingInputsFor(artifact: ProgramArtifact): string[] {
  const out: string[] = [];
  if (artifact.evidenceUsability !== 'usable') {
    out.push('Evidence registry binding deferred (no usable E-id citations yet).');
  }
  if (!artifact.renderableInCanvas) {
    out.push('Renderer for this artifact type is not yet wired into the canvas.');
  }
  if (artifact.type === 'uploaded_document') {
    out.push('Upload + parse pipeline deferred; this row is a charter placeholder.');
  }
  if (artifact.type === 'spreadsheet') {
    out.push('Baseline / target / realized capture deferred to value ledger slice.');
  }
  if (artifact.type === 'presentation') {
    out.push('Steering deck export to PPT deferred to export pipeline.');
  }
  if (artifact.type === 'dataset') {
    out.push('Dataset inspector deferred to ADM4 / explorer wiring.');
  }
  return out;
}

function generationLabelFor(
  artifact: ProgramArtifact,
): DeliverableViewerGenerationLabel {
  return artifact.type === 'uploaded_document' ? 'uploaded' : 'generated';
}

function phaseLabelFor(bucket: ProgramArtifact['phaseBucket']): string {
  return PHASE_LABELS[bucket] ?? 'Cross-phase';
}

function artifactTypeLabel(type: ProgramArtifact['type']): string {
  switch (type) {
    case 'generated_deliverable':
      return 'Generated deliverable';
    case 'uploaded_document':
      return 'Uploaded document';
    case 'workshop_notes':
      return 'Workshop notes';
    case 'spreadsheet':
      return 'Spreadsheet';
    case 'presentation':
      return 'Presentation';
    case 'evidence_artifact':
      return 'Evidence artifact';
    case 'decision_record':
      return 'Decision record';
    case 'dataset':
      return 'Dataset';
    case 'html_deliverable':
      return 'HTML deliverable';
  }
}

// ---------------------------------------------------------------------
// Re-exports for test introspection
// ---------------------------------------------------------------------

export const DELIVERABLE_VIEWER_ACTION_KEYS: ReadonlyArray<DeliverableViewerActionKey> =
  ACTION_KEYS_IN_ORDER;

export const DELIVERABLE_VIEWER_ACTION_REASONS: Readonly<
  Record<DeliverableViewerActionKey, string>
> = ACTION_REASONS;

export const DELIVERABLE_VIEWER_HONEST_DISCLAIMER = HONEST_DISCLAIMER;

export const DELIVERABLE_VIEWER_RICH_TEXT_PLACEHOLDER_BODY =
  RICH_TEXT_PLACEHOLDER_BODY;

export const DELIVERABLE_VIEWER_RENDER_MODES: ReadonlyArray<DeliverableViewerRenderMode> =
  ['html', 'markdown', 'rich_text_placeholder'];
