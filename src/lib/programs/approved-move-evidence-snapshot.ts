import "server-only";

import { getAzureReadFluentClient } from "@/lib/data-plane/postgresCompat";
import { reviewedExtractionFromStoredSourceRef } from "@/lib/programs/evidence-review-contract";
import {
  approvedMoveEvidenceRevision,
  type ApprovedMoveEvidenceRevisionRow,
} from "@/lib/programs/approved-move-evidence-revision";

export interface ApprovedMoveEvidenceSnapshot {
  tenantKey: string;
  moveId: string;
  revision: string;
  approvedEvidenceCount: number;
  rows: ApprovedMoveEvidenceRevisionRow[];
  latestEvidenceActivityAt: string | null;
  revisionByPhase: Record<number, string>;
  latestEvidenceActivityAtByPhase: Record<number, string | null>;
}

const MAX_APPROVED_EVIDENCE_ROWS = 80;
const MAX_REVIEW_ACTIVITY_ROWS = 500;

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
  if (
    typeof value === "string" &&
    value.trim() &&
    Number.isFinite(Number(value))
  ) {
    return Number(value);
  }
  return null;
}

function latestReviewTimestamp(
  rows: readonly Record<string, unknown>[],
): string | null {
  let latest: string | null = null;
  let latestTime = Number.NEGATIVE_INFINITY;
  for (const row of rows) {
    for (const field of ["reviewed_at", "updated_at", "created_at"]) {
      const timestamp = stringOrNull(row[field]);
      const time = timestamp ? Date.parse(timestamp) : Number.NaN;
      if (Number.isFinite(time) && time > latestTime) {
        latest = timestamp;
        latestTime = time;
      }
    }
  }
  return latest;
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
  const [reviewResult, reviewActivityResult] = await Promise.all([
    db
      .from("program_evidence_reviews")
      .select(
        "evidence_id, decision, source_ref, reviewed_at, updated_at, created_at",
      )
      .eq("tenant_key", args.tenantKey)
      .eq("program_id", args.moveId)
      .eq("decision", "approved")
      .order("updated_at", { ascending: false })
      .limit(MAX_APPROVED_EVIDENCE_ROWS + 1),
    db
      .from("program_evidence_reviews")
      .select("evidence_id, decision, updated_at, reviewed_at, created_at")
      .eq("tenant_key", args.tenantKey)
      .eq("program_id", args.moveId)
      .limit(MAX_REVIEW_ACTIVITY_ROWS + 1),
  ]);
  if (
    reviewResult.error ||
    reviewActivityResult.error ||
    !Array.isArray(reviewResult.data) ||
    !Array.isArray(reviewActivityResult.data)
  ) {
    return null;
  }

  const reviewRows = reviewResult.data as Array<Record<string, unknown>>;
  if (reviewRows.length > MAX_APPROVED_EVIDENCE_ROWS) return null;
  const reviewActivityRows = reviewActivityResult.data as Array<
    Record<string, unknown>
  >;
  if (reviewActivityRows.length > MAX_REVIEW_ACTIVITY_ROWS) return null;
  const relevantActivityRows = reviewActivityRows.filter(
    (row) => row.decision !== "pending",
  );
  const evidenceIds = reviewRows
    .map((row) => stringOrNull(row.evidence_id))
    .concat(
      relevantActivityRows.map((row) => stringOrNull(row.evidence_id)),
    )
    .filter((id): id is string => Boolean(id));
  const uniqueEvidenceIds = [...new Set(evidenceIds)];
  if (uniqueEvidenceIds.length === 0) {
    const rows: ApprovedMoveEvidenceRevisionRow[] = [];
    return {
      tenantKey: args.tenantKey,
      moveId: args.moveId,
      revision: approvedMoveEvidenceRevision({ ...args, rows }),
      approvedEvidenceCount: 0,
      rows,
      latestEvidenceActivityAt: null,
      revisionByPhase: Object.fromEntries(
        [1, 2, 3, 4, 5].map((phase) => [
          phase,
          approvedMoveEvidenceRevision({ ...args, rows }),
        ]),
      ),
      latestEvidenceActivityAtByPhase: Object.fromEntries(
        [1, 2, 3, 4, 5].map((phase) => [phase, null]),
      ),
    };
  }

  const { data: evidence, error: evidenceError } = await db
    .from("program_evidence_items")
    .select(
      "id, tenant_key, program_id, attachment_id, phase, evidence_type, title, summary, extracted_text, extracted_structured, confidence, created_at",
    )
    .eq("tenant_key", args.tenantKey)
    .eq("program_id", args.moveId)
    .in("id", uniqueEvidenceIds);
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
  if (
    rows.length !==
    new Set(reviewRows.map((row) => stringOrNull(row.evidence_id))).size
  ) {
    return null;
  }
  const activityEvidenceById = new Map(
    (evidence as Array<Record<string, unknown>>).map((row) => [
      stringOrNull(row.id),
      row,
    ]),
  );
  const latestEvidenceActivityAtByPhase = Object.fromEntries(
    [1, 2, 3, 4, 5].map((phase) => {
      const scopedActivityRows = relevantActivityRows.filter((activity) => {
        const evidenceId = stringOrNull(activity.evidence_id);
        const item = evidenceId ? activityEvidenceById.get(evidenceId) : null;
        const evidencePhase = item ? numberOrNull(item.phase) : null;
        return evidencePhase === null || evidencePhase === phase;
      });
      return [
        phase,
        latestReviewTimestamp([
          ...scopedActivityRows,
          ...rows
            .filter((row) => row.phase === null || row.phase === phase)
            .map((row) => ({ created_at: row.createdAt })),
        ]),
      ];
    }),
  ) as Record<number, string | null>;
  const latestEvidenceActivityAt = latestReviewTimestamp([
    ...relevantActivityRows,
    ...rows.map((row) => ({ created_at: row.createdAt })),
  ]);
  const revisionByPhase = Object.fromEntries(
    [1, 2, 3, 4, 5].map((phase) => [
      phase,
      approvedMoveEvidenceRevision({
        ...args,
        rows: rows.filter((row) => row.phase === null || row.phase === phase),
      }),
    ]),
  );

  return {
    tenantKey: args.tenantKey,
    moveId: args.moveId,
    revision: approvedMoveEvidenceRevision({ ...args, rows }),
    approvedEvidenceCount: rows.length,
    rows,
    latestEvidenceActivityAt,
    revisionByPhase,
    latestEvidenceActivityAtByPhase,
  };
}

export function approvedMoveEvidenceRevisionForPhase(
  snapshot: ApprovedMoveEvidenceSnapshot,
  phase: number,
): string {
  return snapshot.revisionByPhase[phase] ?? "";
}

export function isApprovedMoveEvidenceBasisCurrent(args: {
  snapshot: ApprovedMoveEvidenceSnapshot | null;
  phase: number;
  recordedRevision: string | null;
  scope?: string | null;
  generatedAt?: string | null;
}): boolean {
  const { snapshot, phase, recordedRevision } = args;
  if (!snapshot || !recordedRevision || phase < 1 || phase > 5) return false;

  const currentPhaseRevision = approvedMoveEvidenceRevisionForPhase(
    snapshot,
    phase,
  );
  const generatedAt = args.generatedAt ? Date.parse(args.generatedAt) : NaN;
  if (!Number.isFinite(generatedAt)) return false;
  const hasPhaseActivity = Object.prototype.hasOwnProperty.call(
    snapshot.latestEvidenceActivityAtByPhase,
    phase,
  );
  if (!hasPhaseActivity) return false;
  const latestRelevantActivity =
    snapshot.latestEvidenceActivityAtByPhase[phase] ?? null;
  const latestRelevantActivityAt = latestRelevantActivity
    ? Date.parse(latestRelevantActivity)
    : null;
  if (
    latestRelevantActivityAt !== null &&
    (!Number.isFinite(latestRelevantActivityAt) ||
      latestRelevantActivityAt > generatedAt)
  ) {
    return false;
  }
  if (args.scope === "phase") {
    return Boolean(currentPhaseRevision && recordedRevision === currentPhaseRevision);
  }
  if (recordedRevision === snapshot.revision) return true;

  // Legacy artifacts only recorded the whole-Move hash. Keep them usable when
  // timestamps prove all changed evidence belongs to other phases; absent or
  // ambiguous lineage remains blocked.
  const latestOverallActivity = snapshot.latestEvidenceActivityAt;
  const latestOverallActivityAt = latestOverallActivity
    ? Date.parse(latestOverallActivity)
    : NaN;
  if (
    !Number.isFinite(latestOverallActivityAt) ||
    latestOverallActivityAt <= generatedAt
  ) {
    return false;
  }
  if (!latestRelevantActivity) return true;
  const latestActivityAt = Date.parse(latestRelevantActivity);
  return Number.isFinite(latestActivityAt) && latestActivityAt <= generatedAt;
}
