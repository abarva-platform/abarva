// Source File Cabinet — Postgres metadata registry for artifacts.
//
// Versioning: a new artifact for the same (event, artifact_type, group) is inserted at
// version N+1 with lifecycle 'current'; the prior 'current' rows are flipped to
// 'superseded' and back-linked. The default File Cabinet view shows current only;
// history is opt-in. The DB client is injectable so versioning/mapping is unit-tested
// without the data plane.

import 'server-only';

import { getAzureWriteFluentClient } from '@/lib/data-plane/postgresCompat';
import type {
  ArtifactGroup,
  ListArtifactsFilter,
  SourceArtifactRecord,
} from './types';

type DbClient = ReturnType<typeof getAzureWriteFluentClient>;

function arr(v: unknown): string[] {
  return Array.isArray(v) ? v.map(String) : [];
}

function rowToRecord(row: Record<string, unknown>): SourceArtifactRecord {
  const numOrNull = (v: unknown) => (v === null || v === undefined ? null : Number(v));
  const strOrNull = (v: unknown) => (typeof v === 'string' && v.length ? v : null);
  return {
    id: String(row.id),
    clientId: String(row.client_id),
    tenantKey: String(row.tenant_key),
    sourceEventId: String(row.source_event_id),
    sourcingStage: strOrNull(row.sourcing_stage),
    artifactGroup: row.artifact_group as ArtifactGroup,
    artifactType: String(row.artifact_type),
    artifactFamily: strOrNull(row.artifact_family),
    title: String(row.title),
    description: strOrNull(row.description),
    fileName: String(row.file_name),
    fileFormat: row.file_format as SourceArtifactRecord['fileFormat'],
    blobContainer: String(row.blob_container),
    blobPath: String(row.blob_path),
    fileSize: numOrNull(row.file_size),
    version: Number(row.version ?? 1),
    status: row.status as SourceArtifactRecord['status'],
    generatedBy: strOrNull(row.generated_by),
    generatedAt: String(row.generated_at),
    sourceBasis: strOrNull(row.source_basis),
    confidence: strOrNull(row.confidence),
    citationReady: row.citation_ready === true,
    evidenceFamiliesUsed: arr(row.evidence_families_used),
    sourceRegisterId: strOrNull(row.source_register_id),
    contextBundleTraceId: strOrNull(row.context_bundle_trace_id),
    approvalState: strOrNull(row.approval_state),
    approvedBy: strOrNull(row.approved_by),
    approvedAt: strOrNull(row.approved_at),
    maestroOverrideId: strOrNull(row.maestro_override_id),
    missingInputs: arr(row.missing_inputs),
    clientCompleteItems: arr(row.client_complete_items),
    assumptions: arr(row.assumptions),
    supersedesArtifactId: strOrNull(row.supersedes_artifact_id),
    supersededByArtifactId: strOrNull(row.superseded_by_artifact_id),
    lifecycleState: row.lifecycle_state as SourceArtifactRecord['lifecycleState'],
    blobSha256: strOrNull(row.blob_sha256),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

/** Current live rows for an (event, artifact_type, group) — drives next version + supersede. */
export async function getCurrentArtifacts(
  sourceEventId: string,
  artifactType: string,
  artifactGroup: ArtifactGroup,
  db: DbClient = getAzureWriteFluentClient(),
): Promise<SourceArtifactRecord[]> {
  const { data, error } = await db
    .from('source_artifacts')
    .select('*')
    .eq('source_event_id', sourceEventId)
    .eq('artifact_type', artifactType)
    .eq('artifact_group', artifactGroup)
    .eq('lifecycle_state', 'current');
  if (error) throw new Error(`source_artifacts current read failed: ${error.message}`);
  return (Array.isArray(data) ? data : []).map((r) => rowToRecord(r as Record<string, unknown>));
}

export interface InsertArtifactRow {
  clientId: string;
  tenantKey: string;
  sourceEventId: string;
  sourcingStage: string | null;
  artifactGroup: ArtifactGroup;
  artifactType: string;
  artifactFamily: string | null;
  title: string;
  description: string | null;
  fileName: string;
  fileFormat: string;
  blobContainer: string;
  blobPath: string;
  fileSize: number | null;
  version: number;
  status: string;
  generatedBy: string | null;
  sourceBasis: string | null;
  confidence: string | null;
  citationReady: boolean;
  evidenceFamiliesUsed: string[];
  sourceRegisterId: string | null;
  contextBundleTraceId: string | null;
  missingInputs: string[];
  clientCompleteItems: string[];
  assumptions: string[];
  supersedesArtifactId: string | null;
  blobSha256: string | null;
}

export async function insertSourceArtifact(
  row: InsertArtifactRow,
  db: DbClient = getAzureWriteFluentClient(),
): Promise<SourceArtifactRecord> {
  const { data, error } = await db
    .from('source_artifacts')
    .insert({
      client_id: row.clientId,
      tenant_key: row.tenantKey,
      source_event_id: row.sourceEventId,
      sourcing_stage: row.sourcingStage,
      artifact_group: row.artifactGroup,
      artifact_type: row.artifactType,
      artifact_family: row.artifactFamily,
      title: row.title,
      description: row.description,
      file_name: row.fileName,
      file_format: row.fileFormat,
      blob_container: row.blobContainer,
      blob_path: row.blobPath,
      file_size: row.fileSize,
      version: row.version,
      status: row.status,
      generated_by: row.generatedBy,
      source_basis: row.sourceBasis,
      confidence: row.confidence,
      citation_ready: row.citationReady,
      evidence_families_used: row.evidenceFamiliesUsed,
      source_register_id: row.sourceRegisterId,
      context_bundle_trace_id: row.contextBundleTraceId,
      missing_inputs: row.missingInputs,
      client_complete_items: row.clientCompleteItems,
      assumptions: row.assumptions,
      supersedes_artifact_id: row.supersedesArtifactId,
      blob_sha256: row.blobSha256,
      lifecycle_state: 'current',
    })
    .select('*')
    .single();
  if (error) throw new Error(`source_artifacts insert failed: ${error.message}`);
  return rowToRecord(data as Record<string, unknown>);
}

/** Flip prior current rows to superseded and back-link them to the new version. */
export async function supersedePriorVersions(
  sourceEventId: string,
  artifactType: string,
  artifactGroup: ArtifactGroup,
  newArtifactId: string,
  db: DbClient = getAzureWriteFluentClient(),
): Promise<void> {
  const { error } = await db
    .from('source_artifacts')
    .update({ lifecycle_state: 'superseded', status: 'superseded', superseded_by_artifact_id: newArtifactId, updated_at: new Date().toISOString() })
    .eq('source_event_id', sourceEventId)
    .eq('artifact_type', artifactType)
    .eq('artifact_group', artifactGroup)
    .eq('lifecycle_state', 'current')
    .neq('id', newArtifactId);
  if (error) throw new Error(`source_artifacts supersede failed: ${error.message}`);
}

/** All artifacts for an event (File Cabinet). Current-only unless includeHistory. */
export async function listSourceArtifacts(
  sourceEventId: string,
  clientId: string,
  filter: ListArtifactsFilter = {},
  db: DbClient = getAzureWriteFluentClient(),
): Promise<SourceArtifactRecord[]> {
  let q = db
    .from('source_artifacts')
    .select('*')
    .eq('source_event_id', sourceEventId)
    .eq('client_id', clientId);
  if (!filter.includeHistory) q = q.eq('lifecycle_state', 'current');
  if (filter.artifactGroup) q = q.eq('artifact_group', filter.artifactGroup);
  if (filter.status) q = q.eq('status', filter.status);
  const { data, error } = await q.order('created_at', { ascending: false });
  if (error) throw new Error(`source_artifacts list failed: ${error.message}`);
  return (Array.isArray(data) ? data : []).map((r) => rowToRecord(r as Record<string, unknown>));
}

export async function getSourceArtifact(
  id: string,
  clientId: string,
  db: DbClient = getAzureWriteFluentClient(),
): Promise<SourceArtifactRecord | null> {
  const { data, error } = await db
    .from('source_artifacts')
    .select('*')
    .eq('id', id)
    .eq('client_id', clientId)
    .maybeSingle();
  if (error) throw new Error(`source_artifacts get failed: ${error.message}`);
  return data ? rowToRecord(data as Record<string, unknown>) : null;
}
