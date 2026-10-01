import type { HomeContextVersion, HomeRecordRenderSource } from "./types";

const FAMILY_LABELS: Record<string, string> = {
  ai_use_cases: "AI use cases",
  applications_systems: "applications",
  current_state_architecture: "architecture summaries",
  current_state_data_flow: "data flows",
  data_assets_integrations: "data workloads",
  infrastructure_platforms: "platforms",
  metrics_outcomes: "metrics",
  org_ownership: "organization and ownership",
  programs_initiatives: "programs",
  risks_controls: "risks and controls",
  vendor_contracts: "contracts",
  what_has_been_loaded: "source inventory",
};

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

export function homeSourceCoverageLabel(
  source: HomeRecordRenderSource,
): string | null {
  const coverage = source.contextVersion?.sourceCoverage;
  if (source.kind !== "ecl_serving_projection" || !coverage?.totalRecordRows)
    return null;
  return `Source-linked: ${coverage.linkedRecordRows.toLocaleString()} of ${coverage.totalRecordRows.toLocaleString()} record rows`;
}

export function homeSourceFileReviewLabel(
  source: HomeRecordRenderSource,
): string | null {
  if (source.kind !== "ecl_serving_projection") return null;
  return homeSourceFileReviewLabelForVersion(source.contextVersion);
}

export function homeSourceFileReviewLabelForVersion(
  version: HomeContextVersion | undefined,
): string {
  const review = version?.sourceFileReview;
  if (!review) return "Source file review unavailable";
  if (review.totalFiles === 0)
    return "No source files registered for this record";
  if (review.acceptedFiles === review.totalFiles)
    return `Source files accepted: ${review.totalFiles} of ${review.totalFiles}`;
  const blocked = review.blockedFiles ? `; ${review.blockedFiles} blocked` : "";
  return `Source review incomplete: ${review.acceptedFiles} of ${review.totalFiles} files accepted${blocked}`;
}

export function homeSourceCoverageGapLabel(
  source: HomeRecordRenderSource,
): string | null {
  if (source.kind !== "ecl_serving_projection") return null;
  return homeSourceCoverageGapLabelForVersion(source.contextVersion);
}

export function homeSourceCoverageGapLabelForVersion(
  version: HomeContextVersion | undefined,
): string | null {
  const coverage = version?.sourceCoverage;
  if (!coverage?.totalRecordRows) return null;
  const gaps = coverage.families
    .filter((family) => family.linkedRows < family.totalRows)
    .map(
      (family) =>
        FAMILY_LABELS[family.pageKey] ?? family.pageKey.replaceAll("_", " "),
    );
  if (gaps.length === 0) return null;
  return `Row-level source links remain incomplete for ${gaps.join(", ")}.`;
}
