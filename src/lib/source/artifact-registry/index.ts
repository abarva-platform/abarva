// Source · Artifact Registry · server helpers
//
// First runtime brick for Source document intelligence. Callers upload bytes
// to the `source-artifacts` bucket, then persist a registry row here. Parser,
// chunking, vector, graph, and generation jobs consume these rows later.

import 'server-only';

import { getServerSupabase } from '@/lib/supabase-server';
import { isSourceStageKey } from '../constants';
import type { SourceStageKey } from '../types';
import {
  isAllowedSourceArtifactMimeType,
  isWithinSourceArtifactSizeLimit,
  MAX_SOURCE_ARTIFACT_SIZE_BYTES,
  SOURCE_ARTIFACT_MIME_ALLOWLIST,
} from './mime';
import type {
  SourceArtifactApprovalState,
  SourceArtifactEvidenceState,
  SourceArtifactFamily,
  SourceArtifactFormat,
  SourceArtifactOrigin,
  SourceArtifactRegistryRecord,
  SourceClassificationStatus,
  SourceDataClassification,
  SourceEmbeddingStatus,
  SourceGraphStatus,
  SourceParseStatus,
} from './types';

export type {
  SourceArtifactApprovalState,
  SourceArtifactEvidenceState,
  SourceArtifactFamily,
  SourceArtifactFormat,
  SourceArtifactOrigin,
  SourceArtifactRegistryChipRef,
  SourceArtifactRegistryRecord,
  SourceClassificationStatus,
  SourceDataClassification,
  SourceEmbeddingStatus,
  SourceGraphStatus,
  SourceParseStatus,
} from './types';
export { toSourceArtifactRegistryChipRef } from './types';
export {
  isAllowedSourceArtifactMimeType,
  isWithinSourceArtifactSizeLimit,
  MAX_SOURCE_ARTIFACT_SIZE_BYTES,
  SOURCE_ARTIFACT_MIME_ALLOWLIST,
} from './mime';

export interface RegisterSourceArtifactInput {
  artifactId?: string;
  tenantKey: string;
  sourceEventId: string;
  sourceEventRowId?: string;
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
  dataClassification?: SourceDataClassification;
  createdBy?: string;
  supersedesArtifactVersionId?: string;
}

export interface UpdateSourceArtifactProcessingStateInput {
  artifactId: string;
  parseStatus?: SourceParseStatus;
  embeddingStatus?: SourceEmbeddingStatus;
  graphStatus?: SourceGraphStatus;
  classificationStatus?: SourceClassificationStatus;
  evidenceState?: SourceArtifactEvidenceState;
  approvalState?: SourceArtifactApprovalState;
  validatedBy?: string | null;
}

interface SourceArtifactRow {
  id: string;
  tenant_key: string;
  source_event_id: string;
  source_event_row_id: string | null;
  stage_key: SourceStageKey;
  artifact_family: SourceArtifactFamily;
  artifact_kind: string;
  source_origin: SourceArtifactOrigin;
  source_format: SourceArtifactFormat;
  original_name: string;
  blob_uri: string;
  uploader_user_id: string;
  mime_type: string;
  size_bytes: number | string;
  sha256: string;
  parse_status: SourceParseStatus;
  embedding_status: SourceEmbeddingStatus;
  graph_status: SourceGraphStatus;
  classification_status: SourceClassificationStatus;
  data_classification: SourceDataClassification;
  evidence_state: SourceArtifactEvidenceState;
  approval_state: SourceArtifactApprovalState;
  version: number | string;
  supersedes_artifact_version_id: string | null;
  created_by: string;
  validated_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

const SELECT_COLUMNS = [
  'id',
  'tenant_key',
  'source_event_id',
  'source_event_row_id',
  'stage_key',
  'artifact_family',
  'artifact_kind',
  'source_origin',
  'source_format',
  'original_name',
  'blob_uri',
  'uploader_user_id',
  'mime_type',
  'size_bytes',
  'sha256',
  'parse_status',
  'embedding_status',
  'graph_status',
  'classification_status',
  'data_classification',
  'evidence_state',
  'approval_state',
  'version',
  'supersedes_artifact_version_id',
  'created_by',
  'validated_by',
  'created_at',
  'updated_at',
  'deleted_at',
].join(', ');

function rowToRecord(row: SourceArtifactRow): SourceArtifactRegistryRecord {
  return {
    id: row.id,
    tenantKey: row.tenant_key,
    sourceEventId: row.source_event_id,
    sourceEventRowId: row.source_event_row_id,
    stageKey: row.stage_key,
    artifactFamily: row.artifact_family,
    artifactKind: row.artifact_kind,
    sourceOrigin: row.source_origin,
    sourceFormat: row.source_format,
    originalName: row.original_name,
    blobUri: row.blob_uri,
    uploaderUserId: row.uploader_user_id,
    mimeType: row.mime_type,
    sizeBytes: typeof row.size_bytes === 'string' ? Number(row.size_bytes) : row.size_bytes,
    sha256: row.sha256,
    parseStatus: row.parse_status,
    embeddingStatus: row.embedding_status,
    graphStatus: row.graph_status,
    classificationStatus: row.classification_status,
    dataClassification: row.data_classification,
    evidenceState: row.evidence_state,
    approvalState: row.approval_state,
    version: typeof row.version === 'string' ? Number(row.version) : row.version,
    supersedesArtifactVersionId: row.supersedes_artifact_version_id,
    createdBy: row.created_by,
    validatedBy: row.validated_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

function assertSourceStageKey(stageKey: SourceStageKey): void {
  if (!isSourceStageKey(stageKey)) {
    throw new Error(`[source-artifacts] stageKey "${stageKey}" is not supported`);
  }
}

function validateRegisterInput(input: RegisterSourceArtifactInput): void {
  if (!input.tenantKey) throw new Error('[source-artifacts] tenantKey is required');
  if (!input.sourceEventId) throw new Error('[source-artifacts] sourceEventId is required');
  if (!input.artifactKind) throw new Error('[source-artifacts] artifactKind is required');
  if (!input.originalName) throw new Error('[source-artifacts] originalName is required');
  if (!input.blobUri) throw new Error('[source-artifacts] blobUri is required');
  if (!input.uploaderUserId) throw new Error('[source-artifacts] uploaderUserId is required');
  if (!input.sha256) throw new Error('[source-artifacts] sha256 is required');
  assertSourceStageKey(input.stageKey);
  if (!isAllowedSourceArtifactMimeType(input.mimeType)) {
    throw new Error(
      `[source-artifacts] mimeType "${input.mimeType}" is not in the allowlist (${SOURCE_ARTIFACT_MIME_ALLOWLIST.length} types)`,
    );
  }
  if (!isWithinSourceArtifactSizeLimit(input.sizeBytes)) {
    throw new Error(
      `[source-artifacts] sizeBytes ${input.sizeBytes} exceeds 0 < size <= ${MAX_SOURCE_ARTIFACT_SIZE_BYTES}`,
    );
  }
}

export async function registerSourceArtifactUpload(
  input: RegisterSourceArtifactInput,
): Promise<SourceArtifactRegistryRecord> {
  validateRegisterInput(input);
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from('source_artifacts')
    .insert({
      ...(input.artifactId ? { id: input.artifactId } : {}),
      tenant_key: input.tenantKey,
      source_event_id: input.sourceEventId,
      source_event_row_id: input.sourceEventRowId ?? null,
      stage_key: input.stageKey,
      artifact_family: input.artifactFamily,
      artifact_kind: input.artifactKind,
      source_origin: input.sourceOrigin,
      source_format: input.sourceFormat,
      original_name: input.originalName,
      blob_uri: input.blobUri,
      uploader_user_id: input.uploaderUserId,
      mime_type: input.mimeType,
      size_bytes: input.sizeBytes,
      sha256: input.sha256,
      data_classification: input.dataClassification ?? 'Confidential',
      created_by: input.createdBy ?? input.uploaderUserId,
      supersedes_artifact_version_id: input.supersedesArtifactVersionId ?? null,
    })
    .select(SELECT_COLUMNS)
    .single();

  if (error) throw error;
  return rowToRecord(data as unknown as SourceArtifactRow);
}

export async function listSourceArtifactsForEvent(
  tenantKey: string,
  sourceEventId: string,
): Promise<SourceArtifactRegistryRecord[]> {
  if (!tenantKey) throw new Error('[source-artifacts] tenantKey is required');
  if (!sourceEventId) throw new Error('[source-artifacts] sourceEventId is required');
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from('source_artifacts')
    .select(SELECT_COLUMNS)
    .eq('tenant_key', tenantKey)
    .eq('source_event_id', sourceEventId)
    .is('deleted_at', null)
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return ((data as unknown as SourceArtifactRow[] | null) ?? []).map(rowToRecord);
}

export async function listSourceArtifactsForStage(
  tenantKey: string,
  sourceEventId: string,
  stageKey: SourceStageKey,
): Promise<SourceArtifactRegistryRecord[]> {
  assertSourceStageKey(stageKey);
  if (!tenantKey) throw new Error('[source-artifacts] tenantKey is required');
  if (!sourceEventId) throw new Error('[source-artifacts] sourceEventId is required');
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from('source_artifacts')
    .select(SELECT_COLUMNS)
    .eq('tenant_key', tenantKey)
    .eq('source_event_id', sourceEventId)
    .eq('stage_key', stageKey)
    .is('deleted_at', null)
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return ((data as unknown as SourceArtifactRow[] | null) ?? []).map(rowToRecord);
}

export async function getSourceArtifactRegistryRecord(
  artifactId: string,
): Promise<SourceArtifactRegistryRecord | null> {
  if (!artifactId) throw new Error('[source-artifacts] artifactId is required');
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from('source_artifacts')
    .select(SELECT_COLUMNS)
    .eq('id', artifactId)
    .maybeSingle();

  if (error) throw error;
  return data ? rowToRecord(data as unknown as SourceArtifactRow) : null;
}

export async function updateSourceArtifactProcessingState(
  input: UpdateSourceArtifactProcessingStateInput,
): Promise<SourceArtifactRegistryRecord> {
  if (!input.artifactId) throw new Error('[source-artifacts] artifactId is required');
  const patch: Record<string, string | null> = {};
  if (input.parseStatus) patch.parse_status = input.parseStatus;
  if (input.embeddingStatus) patch.embedding_status = input.embeddingStatus;
  if (input.graphStatus) patch.graph_status = input.graphStatus;
  if (input.classificationStatus) patch.classification_status = input.classificationStatus;
  if (input.evidenceState) patch.evidence_state = input.evidenceState;
  if (input.approvalState) patch.approval_state = input.approvalState;
  if ('validatedBy' in input) patch.validated_by = input.validatedBy ?? null;
  if (Object.keys(patch).length === 0) {
    throw new Error('[source-artifacts] at least one processing state must be provided');
  }

  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from('source_artifacts')
    .update(patch)
    .eq('id', input.artifactId)
    .is('deleted_at', null)
    .select(SELECT_COLUMNS)
    .single();

  if (error) throw error;
  return rowToRecord(data as unknown as SourceArtifactRow);
}

export async function softDeleteSourceArtifact(
  artifactId: string,
  actingUserId: string,
): Promise<SourceArtifactRegistryRecord> {
  if (!artifactId) throw new Error('[source-artifacts] artifactId is required');
  if (!actingUserId) throw new Error('[source-artifacts] actingUserId is required');
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from('source_artifacts')
    .update({ deleted_at: new Date().toISOString(), validated_by: actingUserId })
    .eq('id', artifactId)
    .is('deleted_at', null)
    .select(SELECT_COLUMNS)
    .single();

  if (error) throw error;
  return rowToRecord(data as unknown as SourceArtifactRow);
}

const MAX_SOURCE_ARTIFACT_BLOB_PATH_LENGTH = 240;
const CONTROL_CHAR_RE = new RegExp(
  `[${String.fromCharCode(0)}-${String.fromCharCode(0x1f)}${String.fromCharCode(0x7f)}]`,
  'g',
);

export function buildSourceArtifactBlobPath(args: {
  tenantKey: string;
  sourceEventId: string;
  artifactId: string;
  filename: string;
}): string {
  const { tenantKey, sourceEventId, artifactId, filename } = args;
  if (!tenantKey) throw new Error('[source-artifacts] tenantKey is required');
  if (!sourceEventId) throw new Error('[source-artifacts] sourceEventId is required');
  if (!artifactId) throw new Error('[source-artifacts] artifactId is required');
  if (!filename || !filename.trim()) {
    throw new Error('[source-artifacts] filename is required and cannot be empty');
  }

  let safe = filename.replace(CONTROL_CHAR_RE, '');
  safe = safe.replace(/[/\\]/g, '_');
  safe = safe.replace(/\s+/g, '_');
  safe = safe.replace(/^[._]+/, '').replace(/[._]+$/, '');
  if (!safe) {
    throw new Error('[source-artifacts] filename produced an empty sanitized name');
  }

  const dotIndex = safe.lastIndexOf('.');
  if (dotIndex > 0 && dotIndex < safe.length - 1) {
    safe = `${safe.slice(0, dotIndex)}.${safe.slice(dotIndex + 1).toLowerCase()}`;
  }

  const prefix = `${tenantKey}/${sourceEventId}/${artifactId}/`;
  if (prefix.length + safe.length <= MAX_SOURCE_ARTIFACT_BLOB_PATH_LENGTH) {
    return `${prefix}${safe}`;
  }

  const room = MAX_SOURCE_ARTIFACT_BLOB_PATH_LENGTH - prefix.length;
  if (room <= 0) {
    throw new Error(
      `[source-artifacts] prefix already exceeds ${MAX_SOURCE_ARTIFACT_BLOB_PATH_LENGTH} chars`,
    );
  }

  const extIndex = safe.lastIndexOf('.');
  if (extIndex > 0 && extIndex < safe.length - 1) {
    const ext = safe.slice(extIndex);
    if (ext.length < room) {
      return `${prefix}${safe.slice(0, room - ext.length)}${ext}`;
    }
  }
  return `${prefix}${safe.slice(0, room)}`;
}
