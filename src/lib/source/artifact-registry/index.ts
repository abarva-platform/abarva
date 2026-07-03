// Source · Artifact Registry · server helpers
//
// First runtime brick for Source document intelligence. Callers upload bytes
// to the `source-artifacts` bucket, then persist a registry row here. Parser,
// chunking, vector, graph, and generation jobs consume these rows later.

import "server-only";

import { getAzureWriteFluentClient } from "@/lib/data-plane/postgresCompat";
import { selectSourceArtifactsWriteAdapter } from "@/lib/data-plane/write-adapters/sourceArtifactsWriteAdapter";
import { recordContextRefreshEvent } from "@/lib/intelligence/refresh-events";
import {
  parseDisclosureFlag,
  serializeDisclosureFlag,
  type ArtifactDisclosureFlag,
} from "../disclosure-flag";
import { isSourceStageKey } from "../constants";
import type { SourceStageKey } from "../types";
import {
  isAllowedSourceArtifactMimeType,
  isWithinSourceArtifactSizeLimit,
  MAX_SOURCE_ARTIFACT_SIZE_BYTES,
  SOURCE_ARTIFACT_MIME_ALLOWLIST,
} from "./mime";
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
} from "./types";
import type {
  ArtifactFileFormat,
  ArtifactGroup,
  ArtifactStatus,
} from "../file-cabinet/types";

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
} from "./types";
export { toSourceArtifactRegistryChipRef } from "./types";
export {
  isAllowedSourceArtifactMimeType,
  isWithinSourceArtifactSizeLimit,
  MAX_SOURCE_ARTIFACT_SIZE_BYTES,
  SOURCE_ARTIFACT_MIME_ALLOWLIST,
} from "./mime";

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
  /**
   * GAP-9 · optional disclosure-classification flag persisted alongside the
   * registry row. Omit (or pass the default flag) and the
   * `disclosure_classification` column stays NULL.
   */
  disclosureFlag?: ArtifactDisclosureFlag;
  createdBy?: string;
  supersedesArtifactVersionId?: string;
  fileCabinet?: {
    clientId: string;
    sourcingStage?: string | null;
    artifactGroup: ArtifactGroup;
    artifactType: string;
    artifactFamily?: string | null;
    title: string;
    description?: string | null;
    fileName: string;
    fileFormat: ArtifactFileFormat;
    blobContainer: string;
    blobPath: string;
    fileSize: number;
    version: number;
    status: ArtifactStatus;
    generatedBy?: string | null;
    sourceBasis?: string | null;
    confidence?: string | null;
    citationReady?: boolean;
    evidenceFamiliesUsed?: string[];
    sourceRegisterId?: string | null;
    contextBundleTraceId?: string | null;
    missingInputs?: string[];
    clientCompleteItems?: string[];
    assumptions?: string[];
    supersedesArtifactId?: string | null;
    blobSha256?: string | null;
    isClientFinal?: boolean;
    isCurrentAuthoritative?: boolean;
    sourceGeneratedArtifactId?: string | null;
    clientFinalUploadedBy?: string | null;
    clientFinalUploadedAt?: string | null;
    clientFinalAcceptedBy?: string | null;
    clientFinalAcceptedAt?: string | null;
    clientFinalNote?: string | null;
    clientFinalReviewMeetingDate?: string | null;
    clientFinalStakeholderGroup?: string | null;
    clientFinalChangeSummary?: Record<string, unknown>;
  };
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
  /**
   * GAP-9 · update the disclosure flag — e.g. counsel marks an artifact
   * privileged, or an inheritance rule propagates a classification. Pass
   * `null` to clear the flag back to NULL (unmarked).
   */
  disclosureFlag?: ArtifactDisclosureFlag | null;
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
  disclosure_classification: unknown;
  evidence_state: SourceArtifactEvidenceState;
  approval_state: SourceArtifactApprovalState;
  is_client_final?: boolean | null;
  is_current_authoritative?: boolean | null;
  source_generated_artifact_id?: string | null;
  client_final_uploaded_by?: string | null;
  client_final_uploaded_at?: string | null;
  client_final_accepted_by?: string | null;
  client_final_accepted_at?: string | null;
  client_final_note?: string | null;
  client_final_review_meeting_date?: string | null;
  client_final_stakeholder_group?: string | null;
  client_final_change_summary?: Record<string, unknown> | null;
  cited_source_artifact_ids?: string[] | null;
  version: number | string;
  supersedes_artifact_version_id: string | null;
  created_by: string;
  validated_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

const SELECT_COLUMNS = [
  "id",
  "tenant_key",
  "source_event_id",
  "source_event_row_id",
  "stage_key",
  "artifact_family",
  "artifact_kind",
  "source_origin",
  "source_format",
  "original_name",
  "blob_uri",
  "uploader_user_id",
  "mime_type",
  "size_bytes",
  "sha256",
  "parse_status",
  "embedding_status",
  "graph_status",
  "classification_status",
  "data_classification",
  "disclosure_classification",
  "evidence_state",
  "approval_state",
  "is_client_final",
  "is_current_authoritative",
  "source_generated_artifact_id",
  "client_final_uploaded_by",
  "client_final_uploaded_at",
  "client_final_accepted_by",
  "client_final_accepted_at",
  "client_final_note",
  "client_final_review_meeting_date",
  "client_final_stakeholder_group",
  "client_final_change_summary",
  "cited_source_artifact_ids",
  "version",
  "supersedes_artifact_version_id",
  "created_by",
  "validated_by",
  "created_at",
  "updated_at",
  "deleted_at",
].join(", ");

function rowToRecord(row: SourceArtifactRow): SourceArtifactRegistryRecord {
  const changeSummary =
    row.client_final_change_summary &&
    typeof row.client_final_change_summary === "object" &&
    !Array.isArray(row.client_final_change_summary)
      ? row.client_final_change_summary
      : {};
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
    sizeBytes:
      typeof row.size_bytes === "string"
        ? Number(row.size_bytes)
        : row.size_bytes,
    sha256: row.sha256,
    parseStatus: row.parse_status,
    embeddingStatus: row.embedding_status,
    graphStatus: row.graph_status,
    classificationStatus: row.classification_status,
    dataClassification: row.data_classification,
    ...(parseDisclosureFlag(row.disclosure_classification)
      ? { disclosureFlag: parseDisclosureFlag(row.disclosure_classification) }
      : {}),
    evidenceState: row.evidence_state,
    approvalState: row.approval_state,
    isClientFinal: row.is_client_final === true,
    isCurrentAuthoritative: row.is_current_authoritative === true,
    sourceGeneratedArtifactId: row.source_generated_artifact_id ?? null,
    clientFinalUploadedBy: row.client_final_uploaded_by ?? null,
    clientFinalUploadedAt: row.client_final_uploaded_at ?? null,
    clientFinalAcceptedBy: row.client_final_accepted_by ?? null,
    clientFinalAcceptedAt: row.client_final_accepted_at ?? null,
    clientFinalNote: row.client_final_note ?? null,
    clientFinalReviewMeetingDate: row.client_final_review_meeting_date ?? null,
    clientFinalStakeholderGroup: row.client_final_stakeholder_group ?? null,
    clientFinalChangeSummary: changeSummary,
    citedSourceArtifactIds: Array.isArray(row.cited_source_artifact_ids)
      ? row.cited_source_artifact_ids.map(String)
      : [],
    version:
      typeof row.version === "string" ? Number(row.version) : row.version,
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
    throw new Error(
      `[source-artifacts] stageKey "${stageKey}" is not supported`,
    );
  }
}

function validateRegisterInput(input: RegisterSourceArtifactInput): void {
  if (!input.tenantKey)
    throw new Error("[source-artifacts] tenantKey is required");
  if (!input.sourceEventId)
    throw new Error("[source-artifacts] sourceEventId is required");
  if (!input.artifactKind)
    throw new Error("[source-artifacts] artifactKind is required");
  if (!input.originalName)
    throw new Error("[source-artifacts] originalName is required");
  if (!input.blobUri) throw new Error("[source-artifacts] blobUri is required");
  if (!input.uploaderUserId)
    throw new Error("[source-artifacts] uploaderUserId is required");
  if (!input.sha256) throw new Error("[source-artifacts] sha256 is required");
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
  // Physical insert goes through the data-plane write seam (Slice 3f) so both
  // callers — the artifacts/generate and artifacts/upload routes — migrate at
  // once. Supabase stays the default; Azure is opt-in via `ABARVA_DATA_PLANE`.
  // Validation, MIME/size guardrails and row→record mapping stay helper-side.
  const written = await selectSourceArtifactsWriteAdapter().insertArtifact(
    {
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
      data_classification: input.dataClassification ?? "Confidential",
      disclosure_classification: serializeDisclosureFlag(input.disclosureFlag),
      created_by: input.createdBy ?? input.uploaderUserId,
      supersedes_artifact_version_id: input.supersedesArtifactVersionId ?? null,
      ...(input.fileCabinet
        ? {
            client_id: input.fileCabinet.clientId,
            sourcing_stage: input.fileCabinet.sourcingStage ?? null,
            artifact_group: input.fileCabinet.artifactGroup,
            artifact_type: input.fileCabinet.artifactType,
            artifact_family:
              input.fileCabinet.artifactFamily ?? input.artifactFamily,
            title: input.fileCabinet.title,
            description: input.fileCabinet.description ?? null,
            file_name: input.fileCabinet.fileName,
            file_format: input.fileCabinet.fileFormat,
            blob_container: input.fileCabinet.blobContainer,
            blob_path: input.fileCabinet.blobPath,
            file_size: input.fileCabinet.fileSize,
            version: input.fileCabinet.version,
            status: input.fileCabinet.status,
            generated_by: input.fileCabinet.generatedBy ?? null,
            source_basis: input.fileCabinet.sourceBasis ?? null,
            confidence: input.fileCabinet.confidence ?? null,
            citation_ready: input.fileCabinet.citationReady ?? false,
            evidence_families_used:
              input.fileCabinet.evidenceFamiliesUsed ?? [],
            source_register_id: input.fileCabinet.sourceRegisterId ?? null,
            context_bundle_trace_id:
              input.fileCabinet.contextBundleTraceId ?? null,
            missing_inputs: input.fileCabinet.missingInputs ?? [],
            client_complete_items: input.fileCabinet.clientCompleteItems ?? [],
            assumptions: input.fileCabinet.assumptions ?? [],
            supersedes_artifact_id:
              input.fileCabinet.supersedesArtifactId ?? null,
            lifecycle_state: "current",
            blob_sha256: input.fileCabinet.blobSha256 ?? input.sha256,
            is_client_final: input.fileCabinet.isClientFinal ?? false,
            is_current_authoritative:
              input.fileCabinet.isCurrentAuthoritative ?? false,
            source_generated_artifact_id:
              input.fileCabinet.sourceGeneratedArtifactId ?? null,
            client_final_uploaded_by:
              input.fileCabinet.clientFinalUploadedBy ?? null,
            client_final_uploaded_at:
              input.fileCabinet.clientFinalUploadedAt ?? null,
            client_final_accepted_by:
              input.fileCabinet.clientFinalAcceptedBy ?? null,
            client_final_accepted_at:
              input.fileCabinet.clientFinalAcceptedAt ?? null,
            client_final_note: input.fileCabinet.clientFinalNote ?? null,
            client_final_review_meeting_date:
              input.fileCabinet.clientFinalReviewMeetingDate ?? null,
            client_final_stakeholder_group:
              input.fileCabinet.clientFinalStakeholderGroup ?? null,
            client_final_change_summary:
              input.fileCabinet.clientFinalChangeSummary ?? {},
          }
        : {}),
    },
    SELECT_COLUMNS,
  );
  if (!written.ok || !written.data) {
    throw new Error(
      written.error ?? "[source-artifacts] registry insert failed",
    );
  }
  const record = rowToRecord(written.data as unknown as SourceArtifactRow);
  await recordContextRefreshEvent({
    clientId: input.fileCabinet?.clientId ?? input.tenantKey,
    tenantKey: input.tenantKey,
    triggeredBy: "source_artifact",
    sourceLabel: input.originalName,
    rowsSeen: 1,
    rowsAccepted: 0,
    approvalRequired: true,
    affectedSurfaces: ["source", "change-log"],
    receiptUrl: input.blobUri,
  }).catch((error) => {
    console.warn("[source-artifacts] refresh event failed", {
      tenantKey: input.tenantKey,
      artifactKind: input.artifactKind,
      error: error instanceof Error ? error.message : String(error),
    });
  });
  return record;
}

export async function listSourceArtifactsForEvent(
  tenantKey: string,
  sourceEventId: string,
): Promise<SourceArtifactRegistryRecord[]> {
  if (!tenantKey) throw new Error("[source-artifacts] tenantKey is required");
  if (!sourceEventId)
    throw new Error("[source-artifacts] sourceEventId is required");
  const supabase = getAzureWriteFluentClient();
  const { data, error } = await supabase
    .from("source_artifacts")
    .select(SELECT_COLUMNS)
    .eq("tenant_key", tenantKey)
    .eq("source_event_id", sourceEventId)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return ((data as unknown as SourceArtifactRow[] | null) ?? []).map(
    rowToRecord,
  );
}

export async function listSourceArtifactsForTenant(
  tenantKey: string,
  limit = 300,
): Promise<SourceArtifactRegistryRecord[]> {
  if (!tenantKey) throw new Error("[source-artifacts] tenantKey is required");
  const supabase = getAzureWriteFluentClient();
  const { data, error } = await supabase
    .from("source_artifacts")
    .select(SELECT_COLUMNS)
    .eq("tenant_key", tenantKey)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return ((data as unknown as SourceArtifactRow[] | null) ?? []).map(
    rowToRecord,
  );
}

export async function listSourceArtifactsForSourceEventId(
  sourceEventId: string,
): Promise<SourceArtifactRegistryRecord[]> {
  if (!sourceEventId)
    throw new Error("[source-artifacts] sourceEventId is required");
  const supabase = getAzureWriteFluentClient();
  const { data, error } = await supabase
    .from("source_artifacts")
    .select(SELECT_COLUMNS)
    .or(
      `source_event_id.eq.${sourceEventId},source_event_row_id.eq.${sourceEventId}`,
    )
    .is("deleted_at", null)
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return ((data as unknown as SourceArtifactRow[] | null) ?? []).map(
    rowToRecord,
  );
}

export async function listSourceArtifactsForStage(
  tenantKey: string,
  sourceEventId: string,
  stageKey: SourceStageKey,
): Promise<SourceArtifactRegistryRecord[]> {
  assertSourceStageKey(stageKey);
  if (!tenantKey) throw new Error("[source-artifacts] tenantKey is required");
  if (!sourceEventId)
    throw new Error("[source-artifacts] sourceEventId is required");
  const supabase = getAzureWriteFluentClient();
  const { data, error } = await supabase
    .from("source_artifacts")
    .select(SELECT_COLUMNS)
    .eq("tenant_key", tenantKey)
    .eq("source_event_id", sourceEventId)
    .eq("stage_key", stageKey)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return ((data as unknown as SourceArtifactRow[] | null) ?? []).map(
    rowToRecord,
  );
}

export async function getSourceArtifactRegistryRecord(
  artifactId: string,
): Promise<SourceArtifactRegistryRecord | null> {
  if (!artifactId) throw new Error("[source-artifacts] artifactId is required");
  const supabase = getAzureWriteFluentClient();
  const { data, error } = await supabase
    .from("source_artifacts")
    .select(SELECT_COLUMNS)
    .eq("id", artifactId)
    .maybeSingle();

  if (error) throw error;
  return data ? rowToRecord(data as unknown as SourceArtifactRow) : null;
}

export async function updateSourceArtifactProcessingState(
  input: UpdateSourceArtifactProcessingStateInput,
): Promise<SourceArtifactRegistryRecord> {
  if (!input.artifactId)
    throw new Error("[source-artifacts] artifactId is required");
  const patch: Record<string, unknown> = {};
  if (input.parseStatus) patch.parse_status = input.parseStatus;
  if (input.embeddingStatus) patch.embedding_status = input.embeddingStatus;
  if (input.graphStatus) patch.graph_status = input.graphStatus;
  if (input.classificationStatus)
    patch.classification_status = input.classificationStatus;
  if (input.evidenceState) patch.evidence_state = input.evidenceState;
  if (input.approvalState) patch.approval_state = input.approvalState;
  if ("validatedBy" in input) patch.validated_by = input.validatedBy ?? null;
  // GAP-9 · disclosure flag round-trip. `null` clears the column; a flag is
  // serialized (a default flag also serializes to NULL — see serde.ts).
  if ("disclosureFlag" in input) {
    patch.disclosure_classification = serializeDisclosureFlag(
      input.disclosureFlag ?? undefined,
    );
  }
  if (Object.keys(patch).length === 0) {
    throw new Error(
      "[source-artifacts] at least one processing state must be provided",
    );
  }

  const supabase = getAzureWriteFluentClient();
  const { data, error } = await supabase
    .from("source_artifacts")
    .update(patch)
    .eq("id", input.artifactId)
    .is("deleted_at", null)
    .select(SELECT_COLUMNS)
    .single();

  if (error) throw error;
  return rowToRecord(data as unknown as SourceArtifactRow);
}

export async function softDeleteSourceArtifact(
  artifactId: string,
  actingUserId: string,
): Promise<SourceArtifactRegistryRecord> {
  if (!artifactId) throw new Error("[source-artifacts] artifactId is required");
  if (!actingUserId)
    throw new Error("[source-artifacts] actingUserId is required");
  const supabase = getAzureWriteFluentClient();
  const { data, error } = await supabase
    .from("source_artifacts")
    .update({
      deleted_at: new Date().toISOString(),
      validated_by: actingUserId,
    })
    .eq("id", artifactId)
    .is("deleted_at", null)
    .select(SELECT_COLUMNS)
    .single();

  if (error) throw error;
  return rowToRecord(data as unknown as SourceArtifactRow);
}

const MAX_SOURCE_ARTIFACT_BLOB_PATH_LENGTH = 240;
const CONTROL_CHAR_RE = new RegExp(
  `[${String.fromCharCode(0)}-${String.fromCharCode(0x1f)}${String.fromCharCode(0x7f)}]`,
  "g",
);

export function buildSourceArtifactBlobPath(args: {
  tenantKey: string;
  sourceEventId: string;
  artifactId: string;
  filename: string;
}): string {
  const { tenantKey, sourceEventId, artifactId, filename } = args;
  if (!tenantKey) throw new Error("[source-artifacts] tenantKey is required");
  if (!sourceEventId)
    throw new Error("[source-artifacts] sourceEventId is required");
  if (!artifactId) throw new Error("[source-artifacts] artifactId is required");
  if (!filename || !filename.trim()) {
    throw new Error(
      "[source-artifacts] filename is required and cannot be empty",
    );
  }

  let safe = filename.replace(CONTROL_CHAR_RE, "");
  safe = safe.replace(/[/\\]/g, "_");
  safe = safe.replace(/\s+/g, "_");
  safe = safe.replace(/^[._]+/, "").replace(/[._]+$/, "");
  if (!safe) {
    throw new Error(
      "[source-artifacts] filename produced an empty sanitized name",
    );
  }

  const dotIndex = safe.lastIndexOf(".");
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

  const extIndex = safe.lastIndexOf(".");
  if (extIndex > 0 && extIndex < safe.length - 1) {
    const ext = safe.slice(extIndex);
    if (ext.length < room) {
      return `${prefix}${safe.slice(0, room - ext.length)}${ext}`;
    }
  }
  return `${prefix}${safe.slice(0, room)}`;
}
