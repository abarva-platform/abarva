import "server-only";

import crypto from "node:crypto";

import { getObjectStorageAdapter } from "@/lib/data-plane/objectStorage";
import {
  getAzureWriteFluentClient,
  type PostgresCompatClient,
} from "@/lib/data-plane/postgresCompat";
import type { SegmentKey } from "@/lib/ingestion/azure-landing-zone-types";
import type { ParsedIngestionDocument } from "@/lib/ingestion/document-upload-parser";

const BULK_CONTEXT_BUCKET = "context-uploads";
const REVIEW_SCHEMA = "abarva.context-bulk-upload.document-review.v1";
const CHUNK_TARGET_CHARS = 1_600;
const CHUNK_OVERLAP_CHARS = 160;

export interface BulkDocumentReviewCandidate {
  candidateId: string;
  chunkIndex: number;
  sourcePath: string;
  excerpt: string;
  tokenEstimate: number;
  locator: {
    document: string;
    chunk: number;
    pageCount?: number | null;
    slideCount?: number;
    worksheetCount?: number;
  };
  reviewStatus: "needs_operator_review" | "approved" | "rejected";
}

export interface BulkDocumentReviewArtifact {
  schema: typeof REVIEW_SCHEMA;
  jobId: string;
  clientId: string;
  tenantKey: string;
  fileName: string;
  templateId: string;
  segmentKey: SegmentKey;
  sha256: string;
  blobPath: string;
  dataClassification: string;
  generatedAt: string;
  status: "needs_operator_review" | "committed";
  parser: {
    parseMethod: string;
    warnings: string[];
    metadata: ParsedIngestionDocument["metadata"];
  };
  candidates: BulkDocumentReviewCandidate[];
  approval: {
    required: true;
    approvedBy: string | null;
    approvedAt: string | null;
    rejectedCandidateIds: string[];
  };
  embeddingHandoff: {
    status: "pending_embed_job";
    command: string;
    searchableWhen: string;
  };
}

export interface BulkDocumentReviewLocation {
  bucket: string;
  path: string;
}

export interface BulkDocumentCommitResult {
  status: "inserted" | "skipped_no_database_url";
  chunksInserted: number;
  approvedCandidates: number;
  embeddingHandoff: BulkDocumentReviewArtifact["embeddingHandoff"];
  detail: string;
}

function safeSlug(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 96) || "document"
  );
}

function estimateTokens(text: string): number {
  return Math.max(1, Math.ceil(text.length / 4));
}

function chunkText(text: string): string[] {
  const normalized = text.replace(/\r\n/g, "\n").trim();
  if (!normalized) return [];
  const chunks: string[] = [];
  let offset = 0;
  while (offset < normalized.length) {
    const targetEnd = Math.min(normalized.length, offset + CHUNK_TARGET_CHARS);
    const nextBreak = normalized.lastIndexOf("\n\n", targetEnd);
    const end =
      nextBreak > offset + Math.floor(CHUNK_TARGET_CHARS * 0.5)
        ? nextBreak
        : targetEnd;
    chunks.push(normalized.slice(offset, end).trim());
    if (end >= normalized.length) break;
    offset = Math.max(0, end - CHUNK_OVERLAP_CHARS);
  }
  return chunks.filter(Boolean);
}

function reviewPath(args: {
  tenantKey: string;
  jobId: string;
  fileName: string;
  sha256: string;
}): string {
  return [
    safeSlug(args.tenantKey),
    "_reviews",
    args.jobId,
    `${safeSlug(args.fileName)}-${args.sha256.slice(0, 12)}.json`,
  ].join("/");
}

export function bulkDocumentReviewArtifactLocation(args: {
  tenantKey: string;
  jobId: string;
  fileName: string;
  sha256: string;
}): BulkDocumentReviewLocation {
  return {
    bucket: BULK_CONTEXT_BUCKET,
    path: reviewPath(args),
  };
}

export function buildBulkDocumentReviewArtifact(args: {
  jobId: string;
  clientId: string;
  tenantKey: string;
  fileName: string;
  templateId: string;
  segmentKey: SegmentKey;
  sha256: string;
  blobPath: string;
  dataClassification: string;
  document: ParsedIngestionDocument;
  generatedAt?: string;
}): BulkDocumentReviewArtifact {
  const generatedAt = args.generatedAt ?? new Date().toISOString();
  const candidates = chunkText(args.document.text).map(
    (excerpt, index): BulkDocumentReviewCandidate => {
      const sourcePath = `bulk-document://${args.tenantKey}/${args.jobId}/${encodeURIComponent(args.fileName)}#chunk=${index + 1}`;
      return {
        candidateId: crypto
          .createHash("sha256")
          .update(`${args.jobId}:${args.fileName}:${index}:${excerpt}`)
          .digest("hex")
          .slice(0, 16),
        chunkIndex: index,
        sourcePath,
        excerpt,
        tokenEstimate: estimateTokens(excerpt),
        locator: {
          document: args.fileName,
          chunk: index + 1,
          pageCount: args.document.metadata.pageCount,
          slideCount: args.document.metadata.slideCount,
          worksheetCount: args.document.metadata.worksheetCount,
        },
        reviewStatus: "needs_operator_review",
      };
    },
  );

  return {
    schema: REVIEW_SCHEMA,
    jobId: args.jobId,
    clientId: args.clientId,
    tenantKey: args.tenantKey,
    fileName: args.fileName,
    templateId: args.templateId,
    segmentKey: args.segmentKey,
    sha256: args.sha256,
    blobPath: args.blobPath,
    dataClassification: args.dataClassification,
    generatedAt,
    status: "needs_operator_review",
    parser: {
      parseMethod: args.document.parseMethod,
      warnings: args.document.warnings,
      metadata: args.document.metadata,
    },
    candidates,
    approval: {
      required: true,
      approvedBy: null,
      approvedAt: null,
      rejectedCandidateIds: [],
    },
    embeddingHandoff: {
      status: "pending_embed_job",
      command: `npm run embed:pending-chunks -- --tenant ${args.tenantKey}`,
      searchableWhen:
        "after approved document chunks are committed, embedded, and upserted to the search index",
    },
  };
}

export async function persistBulkDocumentReviewArtifact(
  artifact: BulkDocumentReviewArtifact,
): Promise<BulkDocumentReviewLocation> {
  const location = bulkDocumentReviewArtifactLocation({
    tenantKey: artifact.tenantKey,
    jobId: artifact.jobId,
    fileName: artifact.fileName,
    sha256: artifact.sha256,
  });
  await getObjectStorageAdapter().upload(
    location.bucket,
    location.path,
    JSON.stringify(artifact, null, 2),
    {
      contentType: "application/json",
      upsert: true,
      metadata: {
        tenantKey: artifact.tenantKey,
        clientId: artifact.clientId,
        jobId: artifact.jobId,
        templateId: artifact.templateId,
        sourceSystem: "admin_bulk_context_upload_review",
      },
    },
  );
  return location;
}

export async function readBulkDocumentReviewArtifact(args: {
  clientId: string;
  tenantKey: string;
  bucket: string;
  path: string;
}): Promise<BulkDocumentReviewArtifact> {
  const bytes = await getObjectStorageAdapter().download(
    args.bucket,
    args.path,
  );
  const parsed = JSON.parse(
    bytes.toString("utf8"),
  ) as BulkDocumentReviewArtifact;
  if (
    parsed.schema !== REVIEW_SCHEMA ||
    parsed.clientId !== args.clientId ||
    parsed.tenantKey !== args.tenantKey
  ) {
    throw new Error("bulk_document_review_tenant_mismatch");
  }
  return parsed;
}

function databaseConfigured(): boolean {
  return Boolean(
    process.env.ABARVA_AZURE_DATABASE_URL?.trim() ||
    process.env.DATABASE_URL?.trim(),
  );
}

export async function commitApprovedBulkDocumentReviewArtifact(args: {
  artifact: BulkDocumentReviewArtifact;
  approvedBy: string;
  approvedCandidateIds?: string[];
  rejectedCandidateIds?: string[];
  committedAt?: string;
  db?: PostgresCompatClient;
}): Promise<{
  artifact: BulkDocumentReviewArtifact;
  result: BulkDocumentCommitResult;
}> {
  const approvedIds = new Set(
    args.approvedCandidateIds && args.approvedCandidateIds.length > 0
      ? args.approvedCandidateIds
      : args.artifact.candidates.map((candidate) => candidate.candidateId),
  );
  const rejectedIds = new Set(args.rejectedCandidateIds ?? []);
  const approvedCandidates = args.artifact.candidates.filter(
    (candidate) =>
      approvedIds.has(candidate.candidateId) &&
      !rejectedIds.has(candidate.candidateId),
  );
  const committedAt = args.committedAt ?? new Date().toISOString();
  const reviewedArtifact: BulkDocumentReviewArtifact = {
    ...args.artifact,
    candidates: args.artifact.candidates.map((candidate) => ({
      ...candidate,
      reviewStatus: rejectedIds.has(candidate.candidateId)
        ? "rejected"
        : approvedIds.has(candidate.candidateId)
          ? "approved"
          : candidate.reviewStatus,
    })),
    approval: {
      required: true,
      approvedBy: args.approvedBy,
      approvedAt: committedAt,
      rejectedCandidateIds: [...rejectedIds],
    },
  };

  if (!databaseConfigured() && !args.db) {
    await persistBulkDocumentReviewArtifact(reviewedArtifact);
    return {
      artifact: reviewedArtifact,
      result: {
        status: "skipped_no_database_url",
        chunksInserted: 0,
        approvedCandidates: approvedCandidates.length,
        embeddingHandoff: reviewedArtifact.embeddingHandoff,
        detail:
          "No ABARVA_AZURE_DATABASE_URL or DATABASE_URL is configured; review approvals were recorded but chunks were not written.",
      },
    };
  }

  const uploadId = [
    "bulk-doc",
    safeSlug(args.artifact.tenantKey),
    args.artifact.jobId,
    args.artifact.sha256.slice(0, 12),
  ].join(":");
  const chunkRows = approvedCandidates.map((candidate) => ({
    client_id: args.artifact.clientId,
    tenant_key: args.artifact.tenantKey,
    chunk_id: `${uploadId}:chunk-${candidate.chunkIndex + 1}`,
    source_system: "admin_bulk_context_upload_review",
    source_segment_id: args.artifact.segmentKey,
    source_record_id: candidate.candidateId,
    source_doc: args.artifact.fileName,
    source_path: candidate.sourcePath,
    chunk_index: candidate.chunkIndex,
    chunk_text: candidate.excerpt,
    token_count: candidate.tokenEstimate,
    embedding_status: "pending",
    embedding_model: null,
    embedding_error: null,
    provenance: {
      loader: "admin-bulk-document-review",
      upload_id: uploadId,
      job_id: args.artifact.jobId,
      tenant_key: args.artifact.tenantKey,
      client_id: args.artifact.clientId,
      source_doc: args.artifact.fileName,
      source_blob_path: args.artifact.blobPath,
      parser: args.artifact.parser,
      approved_by: args.approvedBy,
      approved_at: committedAt,
      data_classification: args.artifact.dataClassification,
    },
    chunk_metadata: {
      record_kind: "bulk_document_review_chunk",
      template_id: args.artifact.templateId,
      segment_key: args.artifact.segmentKey,
      review_job_id: args.artifact.jobId,
      review_candidate_id: candidate.candidateId,
      locator: candidate.locator,
    },
  }));

  const db = args.db ?? getAzureWriteFluentClient();
  const { error, count } = await db
    .from("enterprise_context_chunks")
    .upsert(chunkRows, { onConflict: "tenant_key,chunk_id" });
  if (error)
    throw new Error(`bulk_document_review_commit_failed:${error.message}`);

  const committedArtifact: BulkDocumentReviewArtifact = {
    ...reviewedArtifact,
    status: "committed",
  };
  await persistBulkDocumentReviewArtifact(committedArtifact);
  return {
    artifact: committedArtifact,
    result: {
      status: "inserted",
      chunksInserted: count ?? chunkRows.length,
      approvedCandidates: approvedCandidates.length,
      embeddingHandoff: committedArtifact.embeddingHandoff,
      detail:
        "Approved document review chunks were written with embedding_status=pending.",
    },
  };
}
