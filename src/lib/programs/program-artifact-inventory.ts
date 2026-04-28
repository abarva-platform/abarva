// PDEL · Program Deliverables / Artifacts Read Model.
//
// Pure deterministic projection of a tenant + program seed into the
// list of artifacts that the future Program detail surface (and the
// future deliverable canvas) can render.
//
// No live runtime, no upload pipeline, no parse engine, no model
// calls, no Date.now() reads, no random IDs, no migrations.
//
// This module does NOT import:
//   - src/lib/source/**, src/app/(maestro)/source/**
//   - src/lib/sentinel/**, src/lib/atlas/**, src/lib/nexus/**
//   - src/lib/agent/**, src/components/agent/**
//   - src/app/programs/**, src/app/(maestro)/preview/**, src/app/demo/**
//   - src/lib/programs/mock.ts
//   - src/lib/auth/**
//   - supabase/**

import type {
  DeliverableSeedPlan,
  ProgramSeedPlan,
  TenantSeedPlan,
} from '@/lib/programs/enhancement-seed-planner';

// ---------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------

export type ProgramArtifactType =
  | 'generated_deliverable'
  | 'uploaded_document'
  | 'workshop_notes'
  | 'spreadsheet'
  | 'presentation'
  | 'evidence_artifact'
  | 'decision_record'
  | 'dataset'
  | 'html_deliverable';

export type ProgramArtifactStatus =
  | 'draft'
  | 'in_review'
  | 'signed_off'
  | 'archived'
  | 'pending';

export type ProgramArtifactPhaseBucket =
  | 'origination'
  | 'charter'
  | 'diagnose'
  | 'design'
  | 'execute'
  | 'verify'
  | 'cross_phase';

/** How the artifact can be rendered in the canvas today. */
export type ProgramDeliverableRenderMode =
  | 'html_render'
  | 'markdown_render'
  | 'pdf_preview'
  | 'spreadsheet_table'
  | 'presentation_thumbnails'
  | 'note_list'
  | 'data_inspector'
  | 'no_render';

export type ProgramArtifactFileChip =
  | 'DOC'
  | 'PDF'
  | 'XLS'
  | 'PPT'
  | 'NOTE'
  | 'HTML'
  | 'DATA';

export type ProgramArtifactEvidenceUsability =
  | 'usable'
  | 'partial'
  | 'not_usable';

export interface ProgramArtifact {
  id: string;
  programCode: string;
  programSlug: string;
  tenantKey: string;
  tenantRouteSlug: string;
  routeHref: string;
  type: ProgramArtifactType;
  fileChip: ProgramArtifactFileChip;
  title: string;
  description: string;
  phaseBucket: ProgramArtifactPhaseBucket;
  /** Spec phase number (1-5) or null when cross-phase. */
  phaseSpec: number | null;
  status: ProgramArtifactStatus;
  renderMode: ProgramDeliverableRenderMode;
  /** Whether this artifact is renderable in the canvas today. */
  renderableInCanvas: boolean;
  /** Whether the artifact carries a download URL today. */
  downloadable: boolean;
  /** Honest evidence-usability state. */
  evidenceUsability: ProgramArtifactEvidenceUsability;
  /** Single sentence honest caption naming any limit on the artifact. */
  honestFallback: string;
  createdFrom: 'deterministic_seed';
}

export interface ProgramArtifactInventorySummary {
  programCode: string;
  totalArtifacts: number;
  byType: Record<ProgramArtifactType, number>;
  byPhase: Record<ProgramArtifactPhaseBucket, number>;
  byStatus: Record<ProgramArtifactStatus, number>;
  renderableCount: number;
  downloadableCount: number;
  usableEvidenceCount: number;
}

export interface ProgramArtifactInventory {
  tenant: TenantSeedPlan;
  program: ProgramSeedPlan;
  artifacts: ReadonlyArray<ProgramArtifact>;
  summary: ProgramArtifactInventorySummary;
  generatedFrom: 'deterministic_seed';
}

// ---------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------

/**
 * Build the deterministic artifact inventory for a tenant + program.
 * Pure: same input → identical output.
 */
export function buildProgramArtifactInventory(
  tenant: TenantSeedPlan,
  program: ProgramSeedPlan,
): ProgramArtifactInventory {
  const artifacts = composeArtifacts(tenant, program);
  const summary = summarizeProgramArtifacts(artifacts, program.code);
  return {
    tenant,
    program,
    artifacts,
    summary,
    generatedFrom: 'deterministic_seed',
  };
}

/**
 * Group an artifact list by phase bucket. Pure.
 */
export function groupArtifactsByPhase(
  artifacts: ReadonlyArray<ProgramArtifact>,
): Record<ProgramArtifactPhaseBucket, ReadonlyArray<ProgramArtifact>> {
  const out: Record<ProgramArtifactPhaseBucket, ProgramArtifact[]> = {
    origination: [],
    charter: [],
    diagnose: [],
    design: [],
    execute: [],
    verify: [],
    cross_phase: [],
  };
  for (const a of artifacts) out[a.phaseBucket].push(a);
  return out;
}

/**
 * Aggregate counts. Pure.
 */
export function summarizeProgramArtifacts(
  artifacts: ReadonlyArray<ProgramArtifact>,
  programCode: string,
): ProgramArtifactInventorySummary {
  const byType = emptyByType();
  const byPhase = emptyByPhase();
  const byStatus = emptyByStatus();
  let renderableCount = 0;
  let downloadableCount = 0;
  let usableEvidenceCount = 0;
  for (const a of artifacts) {
    byType[a.type] += 1;
    byPhase[a.phaseBucket] += 1;
    byStatus[a.status] += 1;
    if (a.renderableInCanvas) renderableCount += 1;
    if (a.downloadable) downloadableCount += 1;
    if (a.evidenceUsability === 'usable') usableEvidenceCount += 1;
  }
  return {
    programCode,
    totalArtifacts: artifacts.length,
    byType,
    byPhase,
    byStatus,
    renderableCount,
    downloadableCount,
    usableEvidenceCount,
  };
}

/**
 * Filter to artifacts that can be rendered in the canvas today.
 * Pure.
 */
export function getRenderableDeliverables(
  artifacts: ReadonlyArray<ProgramArtifact>,
): ReadonlyArray<ProgramArtifact> {
  return artifacts.filter((a) => a.renderableInCanvas);
}

// ---------------------------------------------------------------------
// Internal composition
// ---------------------------------------------------------------------

function composeArtifacts(
  tenant: TenantSeedPlan,
  program: ProgramSeedPlan,
): ReadonlyArray<ProgramArtifact> {
  const out: ProgramArtifact[] = [];
  const programRouteHref = `/tenant/${tenant.routeSlug}/programs/${program.programSlug}`;

  // 1. One generated_deliverable per seeded deliverable.
  for (const d of program.deliverables) {
    out.push(buildDeliverableArtifact(tenant, program, d, programRouteHref));
  }

  // 2. One workshop_notes artifact per active phase (origination, charter,
  //    diagnose, design, execute, verify) covered by program deliverables.
  const phasesWithDeliverables = uniquePhaseBuckets(program.deliverables);
  for (const bucket of phasesWithDeliverables) {
    out.push(
      buildWorkshopNotesArtifact(tenant, program, bucket, programRouteHref),
    );
  }

  // 3. One uploaded_document representing the seed source (charter PDF).
  out.push(buildSeedUploadedDocument(tenant, program, programRouteHref));

  // 4. One decision_record per signed_off deliverable.
  for (const d of program.deliverables) {
    if (d.status === 'signed_off') {
      out.push(buildDecisionRecord(tenant, program, d, programRouteHref));
    }
  }

  // 5. One evidence_artifact for programs at or beyond Diagnose
  //    (currentPhaseSpec >= 2 in the spec phase numbering — Diagnose).
  if (program.currentPhaseSpec >= 2) {
    out.push(buildEvidenceArtifact(tenant, program, programRouteHref));
  }

  // 6. One dataset artifact for programs at or beyond Diagnose.
  if (program.currentPhaseSpec >= 2) {
    out.push(buildDatasetArtifact(tenant, program, programRouteHref));
  }

  // 7. One spreadsheet for programs at or beyond Design.
  if (program.currentPhaseSpec >= 3) {
    out.push(buildSpreadsheetArtifact(tenant, program, programRouteHref));
  }

  // 8. One presentation (steering deck) for programs at or beyond Design.
  if (program.currentPhaseSpec >= 3) {
    out.push(buildPresentationArtifact(tenant, program, programRouteHref));
  }

  return out.sort(compareArtifacts);
}

function buildDeliverableArtifact(
  tenant: TenantSeedPlan,
  program: ProgramSeedPlan,
  d: DeliverableSeedPlan,
  programRouteHref: string,
): ProgramArtifact {
  // outputFormat is markdown for every seed; the canvas renders it as
  // HTML. We label these as html_deliverable for the chip and
  // generated_deliverable for the type.
  const phaseBucket = phaseBucketForSpec(d.phaseSpec);
  const renderableInCanvas = d.renderTier !== 'stub';
  return {
    id: `art:${tenant.tenantKey}:${program.programSlug}:deliverable:${d.instanceKey}`,
    programCode: program.code,
    programSlug: program.programSlug,
    tenantKey: tenant.tenantKey,
    tenantRouteSlug: tenant.routeSlug,
    routeHref: `${programRouteHref}/deliverables/${d.deliverableCode.toLowerCase()}-${d.deliverableSlug.replace(/^d\d+-/, '')}`,
    type: 'generated_deliverable',
    fileChip: 'HTML',
    title: `${d.deliverableCode} · ${d.title}`,
    description: `${d.requirement === 'required' ? 'Required' : 'Recommended'} deliverable at ${d.renderTier} fidelity tier.`,
    phaseBucket,
    phaseSpec: d.phaseSpec,
    status: d.status,
    renderMode: renderableInCanvas ? 'html_render' : 'no_render',
    renderableInCanvas,
    downloadable: false,
    evidenceUsability: deliverableEvidenceUsability(d),
    honestFallback:
      d.renderTier === 'stub'
        ? 'Stub-tier deliverable; promote to Outline before rendering in the canvas.'
        : `Renders deterministically as HTML; no live retrieval, no model invocation.`,
    createdFrom: 'deterministic_seed',
  };
}

function buildWorkshopNotesArtifact(
  tenant: TenantSeedPlan,
  program: ProgramSeedPlan,
  bucket: ProgramArtifactPhaseBucket,
  programRouteHref: string,
): ProgramArtifact {
  return {
    id: `art:${tenant.tenantKey}:${program.programSlug}:workshop:${bucket}`,
    programCode: program.code,
    programSlug: program.programSlug,
    tenantKey: tenant.tenantKey,
    tenantRouteSlug: tenant.routeSlug,
    routeHref: programRouteHref,
    type: 'workshop_notes',
    fileChip: 'NOTE',
    title: `${labelForBucket(bucket)} workshop notes`,
    description: `Notes captured during the ${labelForBucket(bucket).toLowerCase()} workshop.`,
    phaseBucket: bucket,
    phaseSpec: specForBucket(bucket),
    status: 'draft',
    renderMode: 'note_list',
    renderableInCanvas: true,
    downloadable: false,
    evidenceUsability: 'partial',
    honestFallback:
      'Captured deterministically from the seed; no live transcription or summarization.',
    createdFrom: 'deterministic_seed',
  };
}

function buildSeedUploadedDocument(
  tenant: TenantSeedPlan,
  program: ProgramSeedPlan,
  programRouteHref: string,
): ProgramArtifact {
  return {
    id: `art:${tenant.tenantKey}:${program.programSlug}:upload:charter-pdf`,
    programCode: program.code,
    programSlug: program.programSlug,
    tenantKey: tenant.tenantKey,
    tenantRouteSlug: tenant.routeSlug,
    routeHref: programRouteHref,
    type: 'uploaded_document',
    fileChip: 'PDF',
    title: `${program.code} · Charter (uploaded)`,
    description: 'Operator-uploaded charter PDF representing the program origin artifact.',
    phaseBucket: 'charter',
    phaseSpec: 1,
    status: 'in_review',
    renderMode: 'pdf_preview',
    renderableInCanvas: false,
    downloadable: false,
    evidenceUsability: 'partial',
    honestFallback:
      'Upload pipeline is deferred; this row represents a seeded charter placeholder, not a parsed PDF.',
    createdFrom: 'deterministic_seed',
  };
}

function buildDecisionRecord(
  tenant: TenantSeedPlan,
  program: ProgramSeedPlan,
  d: DeliverableSeedPlan,
  programRouteHref: string,
): ProgramArtifact {
  return {
    id: `art:${tenant.tenantKey}:${program.programSlug}:decision:${d.instanceKey}`,
    programCode: program.code,
    programSlug: program.programSlug,
    tenantKey: tenant.tenantKey,
    tenantRouteSlug: tenant.routeSlug,
    routeHref: programRouteHref,
    type: 'decision_record',
    fileChip: 'DOC',
    title: `${d.deliverableCode} · decision record`,
    description: `Decision sign-off captured for ${d.deliverableCode}.`,
    phaseBucket: phaseBucketForSpec(d.phaseSpec),
    phaseSpec: d.phaseSpec,
    status: 'signed_off',
    renderMode: 'markdown_render',
    renderableInCanvas: true,
    downloadable: false,
    evidenceUsability: 'usable',
    honestFallback: 'Decision record is authored deterministically; no audit-row binding yet.',
    createdFrom: 'deterministic_seed',
  };
}

function buildEvidenceArtifact(
  tenant: TenantSeedPlan,
  program: ProgramSeedPlan,
  programRouteHref: string,
): ProgramArtifact {
  return {
    id: `art:${tenant.tenantKey}:${program.programSlug}:evidence:diagnose-bundle`,
    programCode: program.code,
    programSlug: program.programSlug,
    tenantKey: tenant.tenantKey,
    tenantRouteSlug: tenant.routeSlug,
    routeHref: programRouteHref,
    type: 'evidence_artifact',
    fileChip: 'DOC',
    title: `${program.code} · evidence bundle`,
    description: 'Bundle of evidence references collected during Diagnose phase.',
    phaseBucket: 'diagnose',
    phaseSpec: 2,
    status: 'in_review',
    renderMode: 'markdown_render',
    renderableInCanvas: true,
    downloadable: false,
    evidenceUsability: 'partial',
    honestFallback:
      'Evidence bundle references are seeded; real E-id citations are deferred until the registry slice lands.',
    createdFrom: 'deterministic_seed',
  };
}

function buildDatasetArtifact(
  tenant: TenantSeedPlan,
  program: ProgramSeedPlan,
  programRouteHref: string,
): ProgramArtifact {
  return {
    id: `art:${tenant.tenantKey}:${program.programSlug}:dataset:diagnose-snapshot`,
    programCode: program.code,
    programSlug: program.programSlug,
    tenantKey: tenant.tenantKey,
    tenantRouteSlug: tenant.routeSlug,
    routeHref: programRouteHref,
    type: 'dataset',
    fileChip: 'DATA',
    title: `${program.code} · diagnose dataset snapshot`,
    description: 'Tabular dataset snapshot referenced by the Diagnose deliverables.',
    phaseBucket: 'diagnose',
    phaseSpec: 2,
    status: 'draft',
    renderMode: 'data_inspector',
    renderableInCanvas: false,
    downloadable: false,
    evidenceUsability: 'partial',
    honestFallback:
      'Dataset snapshot is referenced but not parsed; real data view is deferred until ADM4 / explorer wiring.',
    createdFrom: 'deterministic_seed',
  };
}

function buildSpreadsheetArtifact(
  tenant: TenantSeedPlan,
  program: ProgramSeedPlan,
  programRouteHref: string,
): ProgramArtifact {
  return {
    id: `art:${tenant.tenantKey}:${program.programSlug}:spreadsheet:value-ledger`,
    programCode: program.code,
    programSlug: program.programSlug,
    tenantKey: tenant.tenantKey,
    tenantRouteSlug: tenant.routeSlug,
    routeHref: programRouteHref,
    type: 'spreadsheet',
    fileChip: 'XLS',
    title: `${program.code} · value ledger (working)`,
    description: 'Spreadsheet capturing baseline / target / realized entries.',
    phaseBucket: 'design',
    phaseSpec: 3,
    status: 'draft',
    renderMode: 'spreadsheet_table',
    renderableInCanvas: false,
    downloadable: false,
    evidenceUsability: 'partial',
    honestFallback:
      'Value-ledger spreadsheet is a deterministic placeholder; baseline / target capture is deferred.',
    createdFrom: 'deterministic_seed',
  };
}

function buildPresentationArtifact(
  tenant: TenantSeedPlan,
  program: ProgramSeedPlan,
  programRouteHref: string,
): ProgramArtifact {
  return {
    id: `art:${tenant.tenantKey}:${program.programSlug}:presentation:steering-deck`,
    programCode: program.code,
    programSlug: program.programSlug,
    tenantKey: tenant.tenantKey,
    tenantRouteSlug: tenant.routeSlug,
    routeHref: programRouteHref,
    type: 'presentation',
    fileChip: 'PPT',
    title: `${program.code} · steering deck`,
    description: 'Steering committee deck draft sourced from Design / Execute deliverables.',
    phaseBucket: 'design',
    phaseSpec: 3,
    status: 'in_review',
    renderMode: 'presentation_thumbnails',
    renderableInCanvas: false,
    downloadable: false,
    evidenceUsability: 'partial',
    honestFallback:
      'Steering deck is a deterministic placeholder; real export to PPT is deferred.',
    createdFrom: 'deterministic_seed',
  };
}

// ---------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------

function phaseBucketForSpec(specPhase: number): ProgramArtifactPhaseBucket {
  // Spec phases 1..5 map to canonical phases 2..6 (Charter..Verify).
  // Origination is canonical phase 1; not directly modeled by a spec
  // phase number in the seed, so we only return charter..verify.
  switch (specPhase) {
    case 1:
      return 'charter';
    case 2:
      return 'diagnose';
    case 3:
      return 'design';
    case 4:
      return 'execute';
    case 5:
      return 'verify';
    default:
      return 'cross_phase';
  }
}

function specForBucket(bucket: ProgramArtifactPhaseBucket): number | null {
  switch (bucket) {
    case 'charter':
      return 1;
    case 'diagnose':
      return 2;
    case 'design':
      return 3;
    case 'execute':
      return 4;
    case 'verify':
      return 5;
    case 'origination':
    case 'cross_phase':
      return null;
  }
}

function labelForBucket(bucket: ProgramArtifactPhaseBucket): string {
  switch (bucket) {
    case 'origination':
      return 'Origination';
    case 'charter':
      return 'Charter';
    case 'diagnose':
      return 'Diagnose';
    case 'design':
      return 'Design';
    case 'execute':
      return 'Execute';
    case 'verify':
      return 'Verify';
    case 'cross_phase':
      return 'Cross-phase';
  }
}

function uniquePhaseBuckets(
  deliverables: ReadonlyArray<DeliverableSeedPlan>,
): ReadonlyArray<ProgramArtifactPhaseBucket> {
  const set = new Set<ProgramArtifactPhaseBucket>();
  for (const d of deliverables) set.add(phaseBucketForSpec(d.phaseSpec));
  return Array.from(set).sort();
}

function deliverableEvidenceUsability(
  d: DeliverableSeedPlan,
): ProgramArtifactEvidenceUsability {
  if (d.renderTier === 'stub') return 'not_usable';
  if (d.status === 'signed_off') return 'usable';
  return 'partial';
}

function compareArtifacts(a: ProgramArtifact, b: ProgramArtifact): number {
  const phaseRankA = phaseRank(a.phaseBucket);
  const phaseRankB = phaseRank(b.phaseBucket);
  if (phaseRankA !== phaseRankB) return phaseRankA - phaseRankB;
  if (a.type !== b.type) return a.type.localeCompare(b.type);
  return a.id.localeCompare(b.id);
}

function phaseRank(bucket: ProgramArtifactPhaseBucket): number {
  switch (bucket) {
    case 'origination':
      return 1;
    case 'charter':
      return 2;
    case 'diagnose':
      return 3;
    case 'design':
      return 4;
    case 'execute':
      return 5;
    case 'verify':
      return 6;
    case 'cross_phase':
      return 7;
  }
}

function emptyByType(): Record<ProgramArtifactType, number> {
  return {
    generated_deliverable: 0,
    uploaded_document: 0,
    workshop_notes: 0,
    spreadsheet: 0,
    presentation: 0,
    evidence_artifact: 0,
    decision_record: 0,
    dataset: 0,
    html_deliverable: 0,
  };
}

function emptyByPhase(): Record<ProgramArtifactPhaseBucket, number> {
  return {
    origination: 0,
    charter: 0,
    diagnose: 0,
    design: 0,
    execute: 0,
    verify: 0,
    cross_phase: 0,
  };
}

function emptyByStatus(): Record<ProgramArtifactStatus, number> {
  return {
    draft: 0,
    in_review: 0,
    signed_off: 0,
    archived: 0,
    pending: 0,
  };
}

// ---------------------------------------------------------------------
// Re-exports for test introspection
// ---------------------------------------------------------------------

export const PROGRAM_ARTIFACT_TYPES_IN_ORDER: ReadonlyArray<ProgramArtifactType> = [
  'generated_deliverable',
  'uploaded_document',
  'workshop_notes',
  'spreadsheet',
  'presentation',
  'evidence_artifact',
  'decision_record',
  'dataset',
  'html_deliverable',
];

export const PROGRAM_ARTIFACT_PHASE_BUCKETS: ReadonlyArray<ProgramArtifactPhaseBucket> = [
  'origination',
  'charter',
  'diagnose',
  'design',
  'execute',
  'verify',
  'cross_phase',
];

export const PROGRAM_ARTIFACT_FILE_CHIPS: ReadonlyArray<ProgramArtifactFileChip> = [
  'DOC',
  'PDF',
  'XLS',
  'PPT',
  'NOTE',
  'HTML',
  'DATA',
];
