import type { HomeRecordRenderSource } from "./types";

export function homeRecordSourceLabel(source: HomeRecordRenderSource): string {
  if (source.kind === "reviewed_snapshot_fallback")
    return "Reviewed stored record fallback";
  if (source.kind === "reviewed_snapshot") return "Reviewed stored record";
  return source.contextVersion?.coherence === "coherent"
    ? "Live governed record"
    : "Live governed rows";
}

export function homeNarrativeStatusLabel(
  source: HomeRecordRenderSource,
): string {
  if (source.kind !== "ecl_serving_projection")
    return "Reviewed stored narrative";
  switch (source.contextVersion?.coherence) {
    case "coherent":
      return "Narrative aligned with served record";
    case "stored_narrative":
      return "Reviewed narrative; live rows may differ";
    default:
      return "Narrative lineage not verified";
  }
}
