// Source · Artifact Registry · isomorphic type contracts
//
// Uploaded files and generated Source work products are first-class
// knowledge objects. These types mirror the source_artifacts registry
// rows that feed later parser, chunking, vector, graph, and agent-context
// jobs without importing server-only code into UI/test surfaces.

import type { SourceStageKey } from '../types';

export type SourceArtifactFamily =
  | 'rfi'
  | 'rfp'
  | 'bafo'
  | 'scorecard'
  | 'pricing_workbook'
  | 'proposal'
  | 'meeting_notes'
  | 'workshop_output'
  | 'decision_brief'
  | 'transition_risk_register'
  | 'value_ledger'
  | 'sourcing_strategy'
  | 'scope_document'
  | 'other';

export type SourceArtifactOrigin =
  | 'uploaded'
  | 'generated'
  | 'reuploaded'
  | 'imported'
  | 'note_capture';

export type SourceArtifactFormat =
  | 'pdf'
  | 'docx'
  | 'xlsx'
  | 'pptx'
  | 'html'
  | 'markdown'
  | 'csv'
  | 'txt'
  | 'image'
  | 'audio'
  | 'video'
  | 'unknown';

export type SourceParseStatus = 'pending' | 'parsing' | 'parsed' | 'failed' | 'needs_review';
export type SourceEmbeddingStatus = 'pending' | 'embedded' | 'failed' | 'not_applicable';
export type SourceGraphStatus = 'pending' | 'projected' | 'failed' | 'not_applicable';
export type SourceClassificationStatus = 'pending' | 'classified' | 'ambiguous' | 'rejected';
export type SourceDataClassification = 'Public' | 'Internal' | 'Confidential' | 'Restricted';
export type SourceArtifactEvidenceState =
  | 'unparsed'
  | 'parsed_uncited'
  | 'cited'
  | 'challenged'
  | 'superseded';
export type SourceArtifactApprovalState =
  | 'not_required'
  | 'draft'
  | 'in_review'
  | 'approved'
  | 'rejected'
  | 'locked';

export interface SourceArtifactRegistryRecord {
  id: string;
  tenantKey: string;
  sourceEventId: string;
  sourceEventRowId: string | null;
  stageKey: SourceStageKey;
  artifactFamily: SourceArtifactFamily;
  artifactKind: string;
  sourceOrigin: SourceArtifactOrigin;
  sourceFormat: SourceArtifactFormat;
  originalName: string;
  blobUri: string;
  uploaderUserId: string;
  mimeType: string;
  sizeBytes: number;
  sha256: string;
  parseStatus: SourceParseStatus;
  embeddingStatus: SourceEmbeddingStatus;
  graphStatus: SourceGraphStatus;
  classificationStatus: SourceClassificationStatus;
  dataClassification: SourceDataClassification;
  evidenceState: SourceArtifactEvidenceState;
  approvalState: SourceArtifactApprovalState;
  version: number;
  supersedesArtifactVersionId: string | null;
  createdBy: string;
  validatedBy: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface SourceArtifactRegistryChipRef {
  id: string;
  sourceEventId: string;
  stageKey: SourceStageKey;
  originalName: string;
  artifactFamily: SourceArtifactFamily;
  artifactKind: string;
  parseStatus: SourceParseStatus;
  embeddingStatus: SourceEmbeddingStatus;
  graphStatus: SourceGraphStatus;
  evidenceState: SourceArtifactEvidenceState;
  approvalState: SourceArtifactApprovalState;
}

export function toSourceArtifactRegistryChipRef(
  record: SourceArtifactRegistryRecord,
): SourceArtifactRegistryChipRef {
  return {
    id: record.id,
    sourceEventId: record.sourceEventId,
    stageKey: record.stageKey,
    originalName: record.originalName,
    artifactFamily: record.artifactFamily,
    artifactKind: record.artifactKind,
    parseStatus: record.parseStatus,
    embeddingStatus: record.embeddingStatus,
    graphStatus: record.graphStatus,
    evidenceState: record.evidenceState,
    approvalState: record.approvalState,
  };
}
