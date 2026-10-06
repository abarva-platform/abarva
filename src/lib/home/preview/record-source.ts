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

export function homePriorInterpretationLabel(
  source: HomeRecordRenderSource,
  narrativeDate: string,
): string {
  return source.contextVersion?.coherence === "stored_narrative"
    ? `Prior reviewed interpretation - generated ${narrativeDate}; not reconciled with current rows`
    : `Earlier interpretation - generated ${narrativeDate}; lineage not verified against current rows`;
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

export function homeSourceDateCoverageLabel(
  source: HomeRecordRenderSource,
): string | null {
  if (source.kind !== "ecl_serving_projection") return null;
  return homeSourceDateCoverageLabelForVersion(source.contextVersion);
}

export function homeSourceDateCoverageLabelForVersion(
  version: HomeContextVersion | undefined,
): string | null {
  const dates = version?.sourceDateCoverage;
  if (!dates) return null;
  const span =
    dates.earliest === dates.latest
      ? dates.earliest
      : `${dates.earliest} to ${dates.latest}`;
  return `Registered source dates: ${span} (${dates.datedFiles} of ${dates.totalFiles} files); data currency not attested`;
}

export function homeSourceFileReviewLabelForVersion(
  version: HomeContextVersion | undefined,
): string {
  const review = version?.sourceFileReview;
  if (!review) return "Source-file quality unavailable";
  if (review.totalFiles === 0)
    return "No source files registered for this record";
  if (review.acceptedFiles === review.totalFiles)
    return `Source-file quality: ${review.totalFiles} of ${review.totalFiles} accepted`;
  // Stated beside the accepted count, never folded into it: a file with no recorded approval is
  // not a smaller kind of accepted.
  const notReviewed = review.notReviewedFiles
    ? `; ${review.notReviewedFiles} not reviewed`
    : "";
  const partial = review.partialFiles ? `; ${review.partialFiles} partial` : "";
  const blocked = review.blockedFiles ? `; ${review.blockedFiles} blocked` : "";
  const superseded = review.supersededFiles
    ? `; ${review.supersededFiles} superseded`
    : "";
  return `Source-file quality: ${review.acceptedFiles} of ${review.totalFiles} accepted${notReviewed}${partial}${blocked}${superseded}`;
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
