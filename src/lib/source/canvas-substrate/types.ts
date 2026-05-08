// Canvas substrate · TypeScript view-model types
//
// Mirrors the per-event state tables in
// supabase/migrations/20260507230000_source_canvas_per_event_substrate.sql.
// Catalog data (canonical artifact specs / gate criteria / evidence reqs)
// is in src/lib/source/canonical-specs/ — these types describe the *mutable
// per-event state* that derives from those catalogs.

import type { SourceStageKey } from '../types';
import type { SourceArtifactFamily } from '../artifact-registry/types';
import type { ArtifactRequirementLevel, ArtifactDefaultTier } from '../canonical-specs';

// ── Per-event artifact state ────────────────────────────────────────────────

export type SourceEventArtifactStatus =
  | 'not_started'
  | 'drafting'
  | 'needs_review'
  | 'approved'
  | 'locked'
  | 'superseded';

export interface SourceEventArtifactStateRow {
  id: string;
  source_event_id: string;
  tenant_key: string;
  artifact_code: string;
  stage_key: SourceStageKey;
  artifact_family: SourceArtifactFamily;
  tier: ArtifactDefaultTier;
  status: SourceEventArtifactStatus;
  requirement_level: ArtifactRequirementLevel;
  gate_defining: boolean;
  linked_artifact_id: string | null;
  notes: string | null;
  body: string | null;
  body_format: 'markdown' | 'html' | 'plain';
  body_authored_by: string | null;
  body_updated_at: string | null;
  created_at: string;
  updated_at: string;
}

// View-model (camelCase, used by UI + API).
export interface SourceEventArtifactState {
  id: string;
  sourceEventId: string;
  tenantKey: string;
  artifactCode: string;
  stage: SourceStageKey;
  family: SourceArtifactFamily;
  tier: ArtifactDefaultTier;
  status: SourceEventArtifactStatus;
  requirementLevel: ArtifactRequirementLevel;
  gateDefining: boolean;
  linkedArtifactId: string | null;
  notes: string | null;
  body: string | null;
  bodyFormat: 'markdown' | 'html' | 'plain';
  bodyAuthoredBy: string | null;
  bodyUpdatedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// ── Per-event gate-criterion state ──────────────────────────────────────────

export type SourceEventGateCriterionState =
  | 'pending'
  | 'met'
  | 'not_met'
  | 'waived'
  | 'deferred';

export interface SourceEventGateCriterionStateRow {
  id: string;
  source_event_id: string;
  tenant_key: string;
  criterion_id: string;
  from_stage: SourceStageKey;
  to_stage: SourceStageKey | 'closed';
  state: SourceEventGateCriterionState;
  reviewer_user_id: string | null;
  reviewed_at: string | null;
  notes: string | null;
  evidence_artifact_ids: string[];
  waiver_approval_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface SourceEventGateCriterion {
  id: string;
  sourceEventId: string;
  tenantKey: string;
  criterionId: string;
  fromStage: SourceStageKey;
  toStage: SourceStageKey | 'closed';
  state: SourceEventGateCriterionState;
  reviewerUserId: string | null;
  reviewedAt: string | null;
  notes: string | null;
  evidenceArtifactIds: string[];
  waiverApprovalId: string | null;
  createdAt: string;
  updatedAt: string;
}

// ── Per-event evidence state ────────────────────────────────────────────────
// The seven-state readiness ramp from the dossier. Stored as the
// human-readable label so it round-trips to UI cleanly.

export type SourceEventEvidenceCurrentState =
  | 'Not Requested'
  | 'Loaded'
  | 'Parsed'
  | 'Available'
  | 'Usable Evidence'
  | 'Stale'
  | 'Low Confidence';

export interface SourceEventEvidenceStateRow {
  id: string;
  source_event_id: string;
  tenant_key: string;
  requirement_id: string;
  stage_key: SourceStageKey;
  current_state: SourceEventEvidenceCurrentState;
  source_artifact_id: string | null;
  notes: string | null;
  last_synced_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SourceEventEvidence {
  id: string;
  sourceEventId: string;
  tenantKey: string;
  requirementId: string;
  stage: SourceStageKey;
  currentState: SourceEventEvidenceCurrentState;
  sourceArtifactId: string | null;
  notes: string | null;
  lastSyncedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// ── Row → view-model transformers ───────────────────────────────────────────

export function artifactStateRowToView(
  row: SourceEventArtifactStateRow,
): SourceEventArtifactState {
  return {
    id: row.id,
    sourceEventId: row.source_event_id,
    tenantKey: row.tenant_key,
    artifactCode: row.artifact_code,
    stage: row.stage_key,
    family: row.artifact_family,
    tier: row.tier,
    status: row.status,
    requirementLevel: row.requirement_level,
    gateDefining: row.gate_defining,
    linkedArtifactId: row.linked_artifact_id,
    notes: row.notes,
    body: row.body ?? null,
    bodyFormat: row.body_format ?? 'markdown',
    bodyAuthoredBy: row.body_authored_by ?? null,
    bodyUpdatedAt: row.body_updated_at ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function gateCriterionStateRowToView(
  row: SourceEventGateCriterionStateRow,
): SourceEventGateCriterion {
  return {
    id: row.id,
    sourceEventId: row.source_event_id,
    tenantKey: row.tenant_key,
    criterionId: row.criterion_id,
    fromStage: row.from_stage,
    toStage: row.to_stage,
    state: row.state,
    reviewerUserId: row.reviewer_user_id,
    reviewedAt: row.reviewed_at,
    notes: row.notes,
    evidenceArtifactIds: row.evidence_artifact_ids,
    waiverApprovalId: row.waiver_approval_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function evidenceStateRowToView(
  row: SourceEventEvidenceStateRow,
): SourceEventEvidence {
  return {
    id: row.id,
    sourceEventId: row.source_event_id,
    tenantKey: row.tenant_key,
    requirementId: row.requirement_id,
    stage: row.stage_key,
    currentState: row.current_state,
    sourceArtifactId: row.source_artifact_id,
    notes: row.notes,
    lastSyncedAt: row.last_synced_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
