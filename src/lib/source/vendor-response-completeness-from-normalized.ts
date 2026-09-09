import { REQUIRED_RESPONSE_SECTIONS } from "./vendor-response-completeness";
import type {
  NormalizedRequirementResponse,
  NormalizedVendorResponsePackage,
} from "./vendor-response-matrix";
import type { SourceVendorResponseSeedInput } from "./vendor-response-types";

const SECTION_MATCHERS: Record<
  (typeof REQUIRED_RESPONSE_SECTIONS)[number],
  (row: NormalizedRequirementResponse) => boolean
> = {
  "Executive response": (row) => row.responseType === "Narrative",
  "Scope confirmation": (row) => row.category === "service scope",
  "Pricing template": (row) =>
    row.responseType === "Pricing" || row.category === "commercial and pricing",
  "Assumptions and exclusions": (row) => Boolean(row.exceptionRef),
  "Transition plan": (row) =>
    row.responseType === "Transition" || row.category === "transition",
  "Delivery model": (row) =>
    row.responseType === "Staffing" || row.category === "staffing and location",
  "SLA response": (row) =>
    row.responseType === "SLA / KPI" || row.category === "SLA and performance",
  "Security and compliance response": (row) =>
    row.responseType === "Security" || row.category === "security and compliance",
  "Automation / productivity roadmap": (row) =>
    row.category === "automation and productivity",
  "References and evidence": (row) =>
    Boolean(
      row.evidenceRefs?.length ||
        row.pricingRef ||
        row.slaRef ||
        row.exceptionRef,
    ),
};

export function deriveVendorResponseSeedInputsFromNormalized(
  packages: readonly NormalizedVendorResponsePackage[],
): SourceVendorResponseSeedInput[] {
  return packages.map((responsePackage) => {
    const { analytics, rows } = responsePackage;
    const submittedSections = REQUIRED_RESPONSE_SECTIONS.filter((section) =>
      rows.some(
        (row) =>
          SECTION_MATCHERS[section](row) &&
          Boolean(row.responseDisposition && row.responseNarrative?.trim()),
      ),
    );
    const hasEvidence = rows.some((row) => SECTION_MATCHERS["References and evidence"](row));

    return {
      vendorId: responsePackage.vendorId,
      vendorName: responsePackage.vendorName,
      responseStatus: "submitted",
      receivedAt: responsePackage.receivedAt || null,
      requiredSections: [...REQUIRED_RESPONSE_SECTIONS],
      submittedSections,
      assumptions: unique(
        rows.map((row) => row.exceptionRef).filter(isText),
      ),
      exclusions: unique(
        rows
          .filter(
            (row) =>
              row.responseDisposition === "Exception" ||
              row.responseDisposition === "Partially Comply",
          )
          .map((row) => row.exceptionRef)
          .filter(isText),
      ),
      pricingTemplateStatus: scoreStatus(analytics.pricingTraceabilityScore),
      transitionPlanStatus: sectionStatus(
        rows,
        SECTION_MATCHERS["Transition plan"],
      ),
      securityResponseStatus: sectionStatus(
        rows,
        SECTION_MATCHERS["Security and compliance response"],
      ),
      automationRoadmapStatus: sectionStatus(
        rows,
        SECTION_MATCHERS["Automation / productivity roadmap"],
      ),
      evidenceStatus: hasEvidence
        ? analytics.evidenceCoverageScore === 100
          ? "Parsed"
          : "Low Confidence"
        : "Missing",
      evidenceUsability: hasEvidence
        ? analytics.evidenceCoverageScore === 100
          ? "usable"
          : "low_confidence"
        : "not_available",
      responseRiskLevel:
        analytics.readyForEvaluation === "yes"
          ? "low"
          : analytics.readyForEvaluation === "conditional"
            ? "medium"
            : "high",
    };
  });
}

function sectionStatus(
  rows: readonly NormalizedRequirementResponse[],
  matcher: (row: NormalizedRequirementResponse) => boolean,
): "complete" | "incomplete" | "missing" {
  const relevant = rows.filter(matcher);
  if (relevant.length === 0) return "missing";
  return relevant.every(
    (row) => row.responseDisposition && row.responseNarrative?.trim(),
  )
    ? "complete"
    : "incomplete";
}

function scoreStatus(score: number): "complete" | "incomplete" | "missing" {
  if (score === 100) return "complete";
  if (score > 0) return "incomplete";
  return "missing";
}

function isText(value: string | null | undefined): value is string {
  return Boolean(value?.trim());
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}
