import { createHash } from "node:crypto";
import type { ReviewedEvidenceExtraction } from "@/lib/programs/evidence-review-contract";

export interface ApprovedMoveEvidenceRevisionRow {
  id: string;
  phase: number | null;
  evidenceType: string;
  attachmentId: string | null;
  createdAt: string | null;
  reviewUpdatedAt: string | null;
  title: string;
  confidence: number | string | null;
  summary: string;
  extractedText: string | null;
  extractedStructured: Record<string, unknown>;
  reviewedExtraction: ReviewedEvidenceExtraction | null;
}

function canonicalValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalValue);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, nested]) => [key, canonicalValue(nested)]),
  );
}

export function approvedMoveEvidenceRevision(args: {
  tenantKey: string;
  moveId: string;
  rows: readonly ApprovedMoveEvidenceRevisionRow[];
}): string {
  const evidence = args.rows
    .map((row) => ({
      id: row.id,
      phase: row.phase,
      evidenceType: row.evidenceType,
      attachmentId: row.attachmentId,
      createdAt: row.createdAt,
      reviewUpdatedAt: row.reviewUpdatedAt,
      title: row.title,
      confidence: row.confidence,
      summary: row.summary,
      extractedText: row.extractedText,
      extractedStructured: canonicalValue(row.extractedStructured),
      reviewedExtraction: canonicalValue(row.reviewedExtraction),
    }))
    .sort((a, b) => a.id.localeCompare(b.id));

  return createHash("sha256")
    .update(
      JSON.stringify({
        version: 1,
        tenantKey: args.tenantKey,
        moveId: args.moveId,
        evidence,
      }),
    )
    .digest("hex");
}
