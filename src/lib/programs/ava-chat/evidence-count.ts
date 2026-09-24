export interface ResolveMovesAvaVisibleEvidenceCountInput {
  liveLinkedEvidenceCount: number | null | undefined;
  pageEvidenceCount: number | null | undefined;
  surfaceContextEvidenceCount?: number | null | undefined;
}

function cleanCount(value: number | null | undefined): number {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? Math.floor(value)
    : 0;
}

export function resolveMovesAvaVisibleEvidenceCount({
  liveLinkedEvidenceCount,
  pageEvidenceCount,
  surfaceContextEvidenceCount,
}: ResolveMovesAvaVisibleEvidenceCountInput): number {
  return Math.max(
    cleanCount(liveLinkedEvidenceCount),
    cleanCount(pageEvidenceCount),
    cleanCount(surfaceContextEvidenceCount),
  );
}
