import type {
  NormalizedRequirementResponse,
  NormalizedResponseQualityAnalytics,
} from "../vendor-response-matrix";

export function analyzeNormalizedResponseQuality(
  rows: readonly NormalizedRequirementResponse[],
): NormalizedResponseQualityAnalytics {
  if (rows.length === 0) {
    return {
      requirementCount: 0,
      requirementCoverageScore: 0,
      mandatoryCompletenessScore: 0,
      evidenceCoverageScore: 0,
      pricingTraceabilityScore: 0,
      slaTraceabilityScore: 0,
      exceptionDisclosureScore: 0,
      criterionLinkageScore: 0,
      readyForEvaluation: "no",
      nonConformances: ["No normalized requirement-response rows were supplied."],
      clarificationQuestions: [
        "Submit the issued requirement-response matrix before evaluation.",
      ],
    };
  }

  const duplicateIds = duplicateRequirementIds(rows);
  const addressedRows = rows.filter(isAddressed);
  const mandatoryRows = rows.filter(
    (row) => row.requirementLevel === "Mandatory",
  );
  const evidenceRows = rows.filter((row) => row.evidenceRequired);
  const pricingRows = rows.filter(requiresPricingReference);
  const slaRows = rows.filter(requiresSlaReference);
  const exceptionRows = rows.filter(requiresExceptionDisclosure);
  const scoredRows = rows.filter((row) => row.requirementLevel === "Scored");
  const nonConformances: string[] = [];
  const clarificationQuestions: string[] = [];

  for (const id of duplicateIds) {
    nonConformances.push(`Duplicate requirement ID: ${id}.`);
  }

  for (const row of rows) {
    const label = `${row.requirementId} (${row.category})`;
    if (!row.responseDisposition) {
      nonConformances.push(`${label}: response disposition is missing.`);
      clarificationQuestions.push(
        `${row.requirementId}: select Comply, Partially Comply, Exception, or Not Applicable.`,
      );
    }
    if (!hasText(row.responseNarrative)) {
      nonConformances.push(`${label}: response narrative is missing.`);
      clarificationQuestions.push(
        `${row.requirementId}: provide a requirement-specific response narrative.`,
      );
    }
    if (
      row.responseDisposition === "Comply" &&
      row.evidenceRequired &&
      !hasEvidence(row)
    ) {
      nonConformances.push(
        `${label}: Comply is unsupported because required evidence is not referenced.`,
      );
      clarificationQuestions.push(
        `${row.requirementId}: cite the exhibit, page, workbook row, or other evidence supporting compliance.`,
      );
    }
    if (
      row.requirementLevel === "Mandatory" &&
      row.responseDisposition === "Not Applicable"
    ) {
      nonConformances.push(
        `${label}: mandatory requirement is marked Not Applicable and needs buyer review.`,
      );
      clarificationQuestions.push(
        `${row.requirementId}: explain why the mandatory requirement is not applicable and identify the requested buyer waiver.`,
      );
    }
    if (requiresExceptionDisclosure(row) && !hasText(row.exceptionRef)) {
      nonConformances.push(
        `${label}: ${row.responseDisposition} lacks an assumption or exception reference.`,
      );
      clarificationQuestions.push(
        `${row.requirementId}: link the response to a complete assumption or commercial exception row.`,
      );
    }
    if (requiresPricingReference(row) && !hasText(row.pricingRef)) {
      nonConformances.push(`${label}: pricing reference is missing.`);
      clarificationQuestions.push(
        `${row.requirementId}: link the response to the normalized pricing workbook row.`,
      );
    }
    if (requiresSlaReference(row) && !hasText(row.slaRef)) {
      nonConformances.push(`${label}: SLA / KPI reference is missing.`);
      clarificationQuestions.push(
        `${row.requirementId}: link the response to the SLA commitment table row.`,
      );
    }
    if (
      row.requirementLevel === "Scored" &&
      !hasText(row.evaluationCriterionId)
    ) {
      nonConformances.push(`${label}: evaluation criterion ID is missing.`);
      clarificationQuestions.push(
        `${row.requirementId}: map the scored response to its issued evaluation criterion ID.`,
      );
    }
    if (!hasText(row.vendorOwner)) {
      nonConformances.push(`${label}: vendor owner is missing.`);
      clarificationQuestions.push(
        `${row.requirementId}: identify the vendor owner accountable for this response.`,
      );
    }
  }

  const requirementCoverageScore = percentage(addressedRows.length, rows.length);
  const mandatoryCompletenessScore = percentage(
    mandatoryRows.filter(isMandatoryComplete).length,
    mandatoryRows.length,
    100,
  );
  const evidenceCoverageScore = percentage(
    evidenceRows.filter(hasEvidence).length,
    evidenceRows.length,
    100,
  );
  const pricingTraceabilityScore = percentage(
    pricingRows.filter((row) => hasText(row.pricingRef)).length,
    pricingRows.length,
    100,
  );
  const slaTraceabilityScore = percentage(
    slaRows.filter((row) => hasText(row.slaRef)).length,
    slaRows.length,
    100,
  );
  const exceptionDisclosureScore = percentage(
    exceptionRows.filter((row) => hasText(row.exceptionRef)).length,
    exceptionRows.length,
    100,
  );
  const criterionLinkageScore = percentage(
    scoredRows.filter((row) => hasText(row.evaluationCriterionId)).length,
    scoredRows.length,
    100,
  );

  const allCriticalChecksPass =
    mandatoryCompletenessScore === 100 &&
    evidenceCoverageScore === 100 &&
    pricingTraceabilityScore === 100 &&
    slaTraceabilityScore === 100 &&
    exceptionDisclosureScore === 100 &&
    criterionLinkageScore === 100 &&
    duplicateIds.length === 0;

  return {
    requirementCount: rows.length,
    requirementCoverageScore,
    mandatoryCompletenessScore,
    evidenceCoverageScore,
    pricingTraceabilityScore,
    slaTraceabilityScore,
    exceptionDisclosureScore,
    criterionLinkageScore,
    readyForEvaluation:
      requirementCoverageScore === 100 && allCriticalChecksPass
        ? "yes"
        : requirementCoverageScore >= 70 && mandatoryCompletenessScore >= 70
          ? "conditional"
          : "no",
    nonConformances: unique(nonConformances),
    clarificationQuestions: unique(clarificationQuestions),
  };
}

function isAddressed(row: NormalizedRequirementResponse): boolean {
  return Boolean(row.responseDisposition && hasText(row.responseNarrative));
}

function isMandatoryComplete(row: NormalizedRequirementResponse): boolean {
  if (!isAddressed(row) || row.responseDisposition === "Not Applicable") {
    return false;
  }
  if (row.evidenceRequired && !hasEvidence(row)) return false;
  if (requiresExceptionDisclosure(row) && !hasText(row.exceptionRef)) {
    return false;
  }
  if (requiresPricingReference(row) && !hasText(row.pricingRef)) return false;
  if (requiresSlaReference(row) && !hasText(row.slaRef)) return false;
  return true;
}

function requiresPricingReference(row: NormalizedRequirementResponse): boolean {
  return row.responseType === "Pricing" || row.category === "commercial and pricing";
}

function requiresSlaReference(row: NormalizedRequirementResponse): boolean {
  return row.responseType === "SLA / KPI" || row.category === "SLA and performance";
}

function requiresExceptionDisclosure(
  row: NormalizedRequirementResponse,
): boolean {
  return (
    row.responseDisposition === "Partially Comply" ||
    row.responseDisposition === "Exception" ||
    row.responseDisposition === "Not Applicable"
  );
}

function hasEvidence(row: NormalizedRequirementResponse): boolean {
  return Boolean(
    row.evidenceRefs?.some(hasText) ||
      hasText(row.pricingRef) ||
      hasText(row.slaRef) ||
      hasText(row.exceptionRef),
  );
}

function duplicateRequirementIds(
  rows: readonly NormalizedRequirementResponse[],
): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const row of rows) {
    if (seen.has(row.requirementId)) duplicates.add(row.requirementId);
    seen.add(row.requirementId);
  }
  return [...duplicates].sort();
}

function percentage(
  numerator: number,
  denominator: number,
  emptyValue = 0,
): number {
  if (denominator === 0) return emptyValue;
  return Math.round((numerator / denominator) * 100);
}

function hasText(value: string | null | undefined): value is string {
  return Boolean(value?.trim());
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}
