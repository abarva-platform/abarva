// PDEL5 · Program Artifact Canvas View.
//
// Pure deterministic view-model helper that projects a (tenant, program)
// seed inventory into a canvas-shaped view: list metadata + an optional
// selection. The future canvas component renders from this contract.
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
  type ProgramArtifactFileChip,
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

export type CanvasRenderMode =
  | 'html'
  | 'markdown'
  | 'pdf_export_later'
  | 'docx_export_later'
  | 'ppt_export_later';

export type CanvasActionKey = 'edit' | 'regenerate' | 'download' | 'approve';

export interface CanvasAction {
  key: CanvasActionKey;
  enabled: boolean;
  reason: string;
}

export interface CanvasPreview {
  mode: 'html' | 'markdown' | 'placeholder';
  body: string;
}

export interface ProgramArtifactCanvasSelection {
  artifactId: string;
  title: string;
  phase: string;
  artifactType: string;
  fileChip: ProgramArtifactFileChip;
  renderMode: CanvasRenderMode;
  evidenceUsable: boolean;
  missingInputs: string[];
  origin: 'generated' | 'uploaded' | 'workshop_note';
  preview: CanvasPreview;
  actions: CanvasAction[];
}

export interface ProgramArtifactCanvasListEntry {
  artifactId: string;
  title: string;
  phase: string;
  artifactType: string;
  fileChip: ProgramArtifactFileChip;
  renderMode: CanvasRenderMode;
  evidenceUsable: boolean;
  isSelected: boolean;
}

export interface ProgramArtifactCanvasView {
  programId: string;
  programCode: string;
  programName: string;
  artifactCount: number;
  /** Count of artifacts whose render mode is `html` or `markdown`. */
  renderableCount: number;
  list: ProgramArtifactCanvasListEntry[];
  selected: ProgramArtifactCanvasSelection | null;
  honestDisclaimer: string;
  createdFrom: 'deterministic_seed';
}

// ---------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------

const HONEST_DISCLAIMER =
  'Composed deterministically from the program seed. No live retrieval, no model invocation, and no live download — export and edit pipelines are deferred to later PDEL slices.';

const PLACEHOLDER_PREVIEW_BODY =
  'Preview not yet rendered for this artifact type.';

const ACTION_REASONS: Record<CanvasActionKey, string> = {
  edit: 'Edit deferred to PDEL7',
  regenerate: 'Regenerate deferred to PDEL7',
  download: 'Download deferred to PDEL5b/PDEL6',
  approve: 'Approve flows through Steward gate (deferred)',
};

const ACTION_KEYS_IN_ORDER: ReadonlyArray<CanvasActionKey> = [
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
 * Build the deterministic canvas view-model for a program. Pure: same
 * inputs → identical output.
 *
 * `programId` is matched against `program.programSlug` across all
 * canonical demo tenants (the seed slug is unique per program). When no
 * program matches, returns an empty view with a `not_found` disclaimer.
 *
 * `selectedArtifactId` is matched against `artifact.id` from the
 * inventory; if the id is unknown the view is returned without a
 * selection.
 */
export function buildProgramArtifactCanvasView(
  programId: string,
  selectedArtifactId?: string,
): ProgramArtifactCanvasView {
  const located = locateProgram(programId);
  if (!located) {
    return {
      programId,
      programCode: '',
      programName: '',
      artifactCount: 0,
      renderableCount: 0,
      list: [],
      selected: null,
      honestDisclaimer: HONEST_DISCLAIMER,
      createdFrom: 'deterministic_seed',
    };
  }

  const { tenant, program } = located;
  const inventory = buildProgramArtifactInventory(tenant, program);
  const artifacts = inventory.artifacts;

  const list = artifacts.map((artifact) =>
    toListEntry(artifact, selectedArtifactId),
  );
  const renderableCount = list.filter(
    (entry) => entry.renderMode === 'html' || entry.renderMode === 'markdown',
  ).length;

  const selectedArtifact =
    selectedArtifactId !== undefined
      ? artifacts.find((artifact) => artifact.id === selectedArtifactId) ?? null
      : null;

  const selected = selectedArtifact
    ? toSelection(selectedArtifact, program)
    : null;

  return {
    programId,
    programCode: program.code,
    programName: program.name,
    artifactCount: artifacts.length,
    renderableCount,
    list,
    selected,
    honestDisclaimer: HONEST_DISCLAIMER,
    createdFrom: 'deterministic_seed',
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
  // Secondary lookup by code (e.g. `P-001`) — the seed normalizes both.
  for (const tenant of plan.tenants) {
    for (const program of tenant.programs) {
      if (program.code === programId) return { tenant, program };
    }
  }
  // Tertiary lookup by graphNodeId, kept deterministic for callers that
  // pass the seed graph identifier.
  for (const tenant of plan.tenants) {
    for (const program of tenant.programs) {
      if (program.graphNodeId === programId) return { tenant, program };
    }
  }
  return null;
}

function toListEntry(
  artifact: ProgramArtifact,
  selectedArtifactId: string | undefined,
): ProgramArtifactCanvasListEntry {
  return {
    artifactId: artifact.id,
    title: artifact.title,
    phase: phaseLabelFor(artifact.phaseBucket),
    artifactType: artifactTypeLabel(artifact.type),
    fileChip: artifact.fileChip,
    renderMode: toCanvasRenderMode(artifact.renderMode, artifact.fileChip),
    evidenceUsable: artifact.evidenceUsability === 'usable',
    isSelected: selectedArtifactId === artifact.id,
  };
}

function toSelection(
  artifact: ProgramArtifact,
  program: ProgramSeedPlan,
): ProgramArtifactCanvasSelection {
  const renderMode = toCanvasRenderMode(artifact.renderMode, artifact.fileChip);
  const preview = toPreview(artifact, renderMode, program);
  const actions = ACTION_KEYS_IN_ORDER.map((key) => ({
    key,
    enabled: false,
    reason: ACTION_REASONS[key],
  }));
  return {
    artifactId: artifact.id,
    title: artifact.title,
    phase: phaseLabelFor(artifact.phaseBucket),
    artifactType: artifactTypeLabel(artifact.type),
    fileChip: artifact.fileChip,
    renderMode,
    evidenceUsable: artifact.evidenceUsability === 'usable',
    missingInputs: missingInputsFor(artifact),
    origin: originFor(artifact),
    preview,
    actions,
  };
}

function toCanvasRenderMode(
  mode: ProgramDeliverableRenderMode,
  chip: ProgramArtifactFileChip,
): CanvasRenderMode {
  switch (mode) {
    case 'html_render':
      return 'html';
    case 'markdown_render':
      return 'markdown';
    case 'pdf_preview':
      return 'pdf_export_later';
    case 'spreadsheet_table':
      return 'docx_export_later';
    case 'presentation_thumbnails':
      return 'ppt_export_later';
    case 'note_list':
      return 'markdown';
    case 'data_inspector':
      return 'docx_export_later';
    case 'no_render':
      // Stub-tier deliverables fall back to a deferred-export label,
      // chosen by the chip type so the UI can still surface a hint.
      return chipFallbackRenderMode(chip);
  }
}

function chipFallbackRenderMode(chip: ProgramArtifactFileChip): CanvasRenderMode {
  switch (chip) {
    case 'PDF':
      return 'pdf_export_later';
    case 'XLS':
    case 'DATA':
      return 'docx_export_later';
    case 'PPT':
      return 'ppt_export_later';
    case 'DOC':
    case 'NOTE':
      return 'markdown';
    case 'HTML':
      return 'html';
  }
}

function toPreview(
  artifact: ProgramArtifact,
  renderMode: CanvasRenderMode,
  program: ProgramSeedPlan,
): CanvasPreview {
  if (renderMode === 'html') {
    return { mode: 'html', body: htmlPreviewBody(artifact, program) };
  }
  if (renderMode === 'markdown') {
    return { mode: 'markdown', body: markdownPreviewBody(artifact, program) };
  }
  return { mode: 'placeholder', body: PLACEHOLDER_PREVIEW_BODY };
}

function htmlPreviewBody(
  artifact: ProgramArtifact,
  program: ProgramSeedPlan,
): string {
  const safeTitle = escapeHtml(artifact.title);
  const safeProgram = escapeHtml(program.name);
  const safePhase = escapeHtml(phaseLabelFor(artifact.phaseBucket));
  const safeFallback = escapeHtml(artifact.honestFallback);
  const safeDescription = escapeHtml(artifact.description);
  return [
    `<section data-canvas-preview="html">`,
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

function originFor(
  artifact: ProgramArtifact,
): 'generated' | 'uploaded' | 'workshop_note' {
  if (artifact.type === 'uploaded_document') return 'uploaded';
  if (artifact.type === 'workshop_notes') return 'workshop_note';
  return 'generated';
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

export const PROGRAM_ARTIFACT_CANVAS_ACTION_KEYS: ReadonlyArray<CanvasActionKey> =
  ACTION_KEYS_IN_ORDER;

export const PROGRAM_ARTIFACT_CANVAS_ACTION_REASONS: Readonly<
  Record<CanvasActionKey, string>
> = ACTION_REASONS;

export const PROGRAM_ARTIFACT_CANVAS_HONEST_DISCLAIMER = HONEST_DISCLAIMER;

export const PROGRAM_ARTIFACT_CANVAS_PLACEHOLDER_PREVIEW_BODY =
  PLACEHOLDER_PREVIEW_BODY;
