export interface ResolveMovesAvaVisibleEvidenceCountInput {
  liveLinkedEvidenceCount: number | null | undefined;
  pageEvidenceCount: number | null | undefined;
}

function cleanCount(value: number | null | undefined): number {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? Math.floor(value)
    : 0;
}

export function resolveMovesAvaVisibleEvidenceCount({
  liveLinkedEvidenceCount,
  pageEvidenceCount,
}: ResolveMovesAvaVisibleEvidenceCountInput): number {
  return Math.max(
    cleanCount(liveLinkedEvidenceCount),
    cleanCount(pageEvidenceCount),
  );
}
