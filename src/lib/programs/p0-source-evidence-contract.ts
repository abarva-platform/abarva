export interface P0SourceEvidenceReview {
  evidence_id?: unknown;
  decision?: unknown;
  phase?: unknown;
  source_ref?: unknown;
}

export interface P0SourceEvidenceItem {
  id?: unknown;
  phase?: unknown;
  title?: unknown;
  summary?: unknown;
  extracted_text?: unknown;
  attachment_id?: unknown;
}

export interface P0SourceEvidenceCoverage {
  approvedSourceFileCount: number;
  pendingReviewCount: number;
  evidenceTitles: string[];
}

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function nonEmpty(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function hasSourceFile(
  review: P0SourceEvidenceReview,
  evidence: P0SourceEvidenceItem,
): boolean {
  const sourceRef = record(review.source_ref);
  const linkedFile =
    nonEmpty(sourceRef.move_artifact_id) ??
    nonEmpty(sourceRef.attachment_id) ??
    nonEmpty(evidence.attachment_id);
  const parsedContent = nonEmpty(evidence.extracted_text);
  return (
    review.phase === 0 &&
    evidence.phase === 0 &&
    Boolean(linkedFile && parsedContent)
  );
}

export function evaluateP0SourceEvidenceCoverage(
  reviews: readonly P0SourceEvidenceReview[],
  evidenceItems: readonly P0SourceEvidenceItem[],
): P0SourceEvidenceCoverage {
  const evidenceById = new Map(
    evidenceItems.map((evidence) => [nonEmpty(evidence.id), evidence]),
  );
  const pendingReviewCount = reviews.filter((review) => {
    if (review.decision !== "pending") return false;
    const id = nonEmpty(review.evidence_id);
    const evidence = id ? evidenceById.get(id) : null;
    return Boolean(evidence && hasSourceFile(review, evidence));
  }).length;
  const sourceFiles = reviews.flatMap((review) => {
    if (review.decision !== "approved") return [];
    const id = nonEmpty(review.evidence_id);
    const evidence = id ? evidenceById.get(id) : null;
    if (!evidence || !hasSourceFile(review, evidence)) return [];
    const sourceRef = record(review.source_ref);
    return [{
      fileId:
        nonEmpty(sourceRef.move_artifact_id) ??
        nonEmpty(sourceRef.attachment_id) ??
        nonEmpty(evidence.attachment_id)!,
      title:
        nonEmpty(sourceRef.filename) ??
        nonEmpty(sourceRef.title) ??
        nonEmpty(evidence.title) ??
        "P0 source file",
    }];
  });
  const uniqueFiles = new Map(sourceFiles.map((file) => [file.fileId, file.title]));
  return {
    approvedSourceFileCount: uniqueFiles.size,
    pendingReviewCount,
    evidenceTitles: [...new Set(uniqueFiles.values())],
  };
}
