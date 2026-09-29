import "server-only";

import { getAzureReadFluentClient } from "@/lib/data-plane/postgresCompat";
import { reviewedExtractionFromStoredSourceRef } from "@/lib/programs/evidence-review-contract";
import {
  approvedMoveEvidenceRevision,
  type ApprovedMoveEvidenceRevisionRow,
} from "@/lib/programs/approved-move-evidence-revision";

export interface ApprovedMoveEvidenceSnapshot {
  revision: string;
  approvedEvidenceCount: number;
  rows: ApprovedMoveEvidenceRevisionRow[];
}

const MAX_APPROVED_EVIDENCE_ROWS = 80;

function objectValue(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function stringOrNull(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function numberOrNull(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) {
    return Number(value);
  }
  return null;
}

function toRevisionRow(
  review: Record<string, unknown>,
  evidence: Record<string, unknown>,
): ApprovedMoveEvidenceRevisionRow | null {
  const id = stringOrNull(evidence.id);
  if (!id) return null;
  return {
    id,
    phase: numberOrNull(evidence.phase),
    evidenceType: stringOrNull(evidence.evidence_type) ?? "uploaded_artifact",
    attachmentId: stringOrNull(evidence.attachment_id),
    createdAt: stringOrNull(evidence.created_at),
    reviewUpdatedAt:
      stringOrNull(review.reviewed_at) ??
      stringOrNull(review.updated_at) ??
      stringOrNull(review.created_at),
    title: stringOrNull(evidence.title) ?? "Untitled Move evidence",
    confidence: (evidence.confidence as number | string | null) ?? null,
    summary: stringOrNull(evidence.summary) ?? "",
    extractedText: stringOrNull(evidence.extracted_text),
    extractedStructured: objectValue(evidence.extracted_structured),
    reviewedExtraction: reviewedExtractionFromStoredSourceRef(
      review.source_ref,
    ),
  };
}

export async function loadApprovedMoveEvidenceSnapshot(args: {
  tenantKey: string;
  moveId: string;
}): Promise<ApprovedMoveEvidenceSnapshot | null> {
  if (!args.tenantKey || !args.moveId) return null;
  const db = getAzureReadFluentClient();
  const { data: reviews, error: reviewError } = await db
    .from("program_evidence_reviews")
    .select("evidence_id, decision, source_ref, reviewed_at, updated_at, created_at")
    .eq("tenant_key", args.tenantKey)
    .eq("program_id", args.moveId)
    .eq("decision", "approved")
    .order("updated_at", { ascending: false })
    .limit(MAX_APPROVED_EVIDENCE_ROWS + 1);
  if (reviewError || !Array.isArray(reviews)) return null;

  const reviewRows = reviews as Array<Record<string, unknown>>;
  if (reviewRows.length > MAX_APPROVED_EVIDENCE_ROWS) return null;
  const evidenceIds = reviewRows
    .map((row) => stringOrNull(row.evidence_id))
    .filter((id): id is string => Boolean(id));
  if (evidenceIds.length === 0) {
    const rows: ApprovedMoveEvidenceRevisionRow[] = [];
    return {
      revision: approvedMoveEvidenceRevision({ ...args, rows }),
      approvedEvidenceCount: 0,
      rows,
    };
  }

  const { data: evidence, error: evidenceError } = await db
    .from("program_evidence_items")
    .select(
      "id, tenant_key, program_id, attachment_id, phase, evidence_type, title, summary, extracted_text, extracted_structured, confidence, created_at",
    )
    .eq("tenant_key", args.tenantKey)
    .eq("program_id", args.moveId)
    .in("id", evidenceIds);
  if (evidenceError || !Array.isArray(evidence)) return null;

  const evidenceById = new Map(
    (evidence as Array<Record<string, unknown>>).map((row) => [
      stringOrNull(row.id),
      row,
    ]),
  );
  const rows = reviewRows.flatMap((review) => {
    const id = stringOrNull(review.evidence_id);
    const item = id ? evidenceById.get(id) : null;
    if (!item) return [];
    const row = toRevisionRow(review, item);
    return row ? [row] : [];
  });
  if (rows.length !== evidenceIds.length) return null;

  return {
    revision: approvedMoveEvidenceRevision({ ...args, rows }),
    approvedEvidenceCount: rows.length,
    rows,
  };
}
