import { REQUIRED_RESPONSE_SECTIONS } from "./vendor-response-completeness";
import type {
  NormalizedRequirementResponse,
  NormalizedVendorResponsePackage,
} from "./vendor-response-matrix";
import type { SourceVendorResponseSeedInput } from "./vendor-response-types";
import type { VendorResponseProfileSet } from "./proposal-intelligence/mve-profile";
import type {
  VendorExtractionCard,
  VendorResponseExhibitKind,
  VendorResponseExhibitStatus,
  VendorResponseProfile,
  VendorResponseSectionMapRow,
} from "./proposal-intelligence/types";

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
    row.responseType === "Security" ||
    row.category === "security and compliance",
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
    const hasEvidence = rows.some((row) =>
      SECTION_MATCHERS["References and evidence"](row),
    );

    return {
      vendorId: responsePackage.vendorId,
      vendorName: responsePackage.vendorName,
      responseStatus: "submitted",
      receivedAt: responsePackage.receivedAt || null,
      requiredSections: [...REQUIRED_RESPONSE_SECTIONS],
      submittedSections,
      assumptions: unique(rows.map((row) => row.exceptionRef).filter(isText)),
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

export function deriveVendorResponseProfilesFromNormalized(args: {
  packages: readonly NormalizedVendorResponsePackage[];
  event: { id: string; name?: string | null };
  tenantKey: string;
}): VendorResponseProfileSet | null {
  if (args.packages.length === 0) return null;
  const profiles = args.packages.map((responsePackage) =>
    profileFromNormalized(responsePackage, args.event.id, args.tenantKey),
  );
  return {
    sourceEventId: args.event.id,
    tenantKey: args.tenantKey,
    eventName: args.event.name ?? "Source vendor response event",
    generatedAt:
      args.packages
        .map((responsePackage) => responsePackage.receivedAt)
        .filter(Boolean)
        .sort()
        .at(-1) ?? new Date(0).toISOString(),
    profileCount: profiles.length,
    profiles,
  };
}

function profileFromNormalized(
  responsePackage: NormalizedVendorResponsePackage,
  sourceEventId: string,
  tenantKey: string,
): VendorResponseProfile {
  const sectionMap = buildSectionMap(responsePackage);
  const evidenceProvided = unique(
    responsePackage.rows.flatMap((row) => rowEvidenceReferences(row)),
  );
  const exceptionRows = responsePackage.rows.filter(
    (row) =>
      row.responseDisposition === "Exception" ||
      row.responseDisposition === "Partially Comply",
  );
  const unsupportedRows = responsePackage.rows.filter(
    (row) => row.evidenceRequired && rowEvidenceReferences(row).length === 0,
  );
  const extractionCards = buildExtractionCards(responsePackage);
  const answeredSections = sectionMap.filter(
    (section) => section.status !== "missing",
  ).length;
  const partialSections = sectionMap
    .filter(
      (section) =>
        section.status === "partial" || section.status === "exception",
    )
    .map((section) => section.rfpSection);
  const missingSections = sectionMap
    .filter((section) => section.status === "missing")
    .map((section) => section.rfpSection);
  const firstNarrative = (
    predicate: (row: NormalizedRequirementResponse) => boolean,
  ) =>
    responsePackage.rows.find(
      (row) => predicate(row) && Boolean(row.responseNarrative?.trim()),
    )?.responseNarrative ?? null;
  const pricingRows = responsePackage.rows.filter(
    (row) => row.responseType === "Pricing" || Boolean(row.pricingRef),
  );
  const ready = responsePackage.analytics.readyForEvaluation;

  return {
    sourceEventId,
    tenantKey,
    vendorId: responsePackage.vendorId,
    vendorName: responsePackage.vendorName,
    responseVersion: 1,
    syntheticDemo: responsePackage.syntheticDemo === true,
    packageSummary: `${responsePackage.rows.length} normalized requirement responses parsed from ${responsePackage.originalName}; ${exceptionRows.length} disclosed exception or partial-compliance row(s).`,
    narrativePageEquivalent: `${responsePackage.rows.length} normalized requirement rows`,
    responseCompleteness: {
      percent: responsePackage.analytics.requirementCoverageScore,
      completeSections: answeredSections,
      totalSections: sectionMap.length,
      missingSections,
      partialSections,
    },
    majorClaims: unique(
      responsePackage.rows
        .filter((row) => row.requirementLevel === "Scored")
        .map((row) => row.responseNarrative)
        .filter(isText)
        .map((value) => compact(value, 220)),
    ).slice(0, 8),
    evidenceProvided,
    pricingSummary: {
      yearOneRunCostUsd: null,
      transitionCostUsd: null,
      oneTimeCostUsd: null,
      optionalCostUsd: null,
      fiveYearTcoUsd: null,
      pricingBasis:
        pricingRows.length > 0
          ? `${pricingRows.length} normalized rows cite the submitted pricing schedule. Numeric bid values remain unclaimed until pricing facts are parsed and accepted.`
          : "No normalized pricing references were parsed.",
    },
    productivityCommitment:
      firstNarrative((row) => row.category === "automation and productivity") ??
      "No productivity commitment was parsed.",
    staffingModelSummary:
      firstNarrative((row) => row.category === "staffing and location") ??
      "No staffing model was parsed.",
    slaCommitments:
      firstNarrative(
        (row) =>
          row.category === "SLA and performance" ||
          row.responseType === "SLA / KPI",
      ) ?? "No SLA commitment was parsed.",
    assumptionsExclusions: unique(
      responsePackage.rows.map((row) => row.exceptionRef).filter(isText),
    ),
    commercialExceptions: exceptionRows.map(
      (row) =>
        `${row.requirementId}: ${compact(row.responseNarrative ?? row.requirement, 220)}`,
    ),
    transitionCommitments:
      firstNarrative(
        (row) =>
          row.category === "transition" || row.responseType === "Transition",
      ) ?? "No transition commitment was parsed.",
    unsupportedClaims: unsupportedRows.map(
      (row) => `${row.requirementId}: ${compact(row.requirement, 180)}`,
    ),
    clarificationQuestions: unique([
      ...responsePackage.analytics.clarificationQuestions,
      ...exceptionRows.map(
        (row) =>
          `Clarify ${row.requirementId}, state the accepted alternative, and quantify any price, SLA, scope, or risk effect.`,
      ),
    ]),
    negotiationLevers: exceptionRows.map(
      (row) => `${row.requirementId}: ${compact(row.requirement, 190)}`,
    ),
    readyForEvaluation: ready,
    readyReason:
      ready === "yes"
        ? "The normalized response is complete and traceable enough to enter evaluator-owned scoring; cited exhibits and numeric price facts remain subject to review."
        : ready === "conditional"
          ? "The normalized response can enter evaluation only with the listed evidence and clarification holdbacks."
          : "The normalized response is not ready for evaluator-owned scoring.",
    sectionMap,
    exhibits: buildExhibits(responsePackage),
    extractionCards,
  };
}

function buildSectionMap(
  responsePackage: NormalizedVendorResponsePackage,
): VendorResponseSectionMapRow[] {
  const grouped = new Map<string, NormalizedRequirementResponse[]>();
  for (const row of responsePackage.rows) {
    const rows = grouped.get(row.section) ?? [];
    rows.push(row);
    grouped.set(row.section, rows);
  }
  return [...grouped.entries()].map(([section, rows], index) => {
    const missing = rows.filter(
      (row) => !row.responseDisposition || !row.responseNarrative?.trim(),
    );
    const exceptions = rows.filter(
      (row) => row.responseDisposition === "Exception",
    );
    const partial = rows.filter(
      (row) => row.responseDisposition === "Partially Comply",
    );
    const status: VendorResponseSectionMapRow["status"] =
      missing.length > 0
        ? "missing"
        : exceptions.length > 0
          ? "exception"
          : partial.length > 0
            ? "partial"
            : "complete";
    return {
      sectionNumber: index + 1,
      rfpSection: section,
      responseReference: `${responsePackage.originalName} · ${rows[0]?.requirementId}-${rows.at(-1)?.requirementId}`,
      status,
      notes: `${rows.length} requirement row(s); ${exceptions.length} exception(s); ${partial.length} partial response(s); ${missing.length} missing response(s).`,
    };
  });
}

const EXHIBIT_RULES: Array<{
  kind: VendorResponseExhibitKind;
  label: string;
  matches: (row: NormalizedRequirementResponse) => boolean;
}> = [
  {
    kind: "claim_register",
    label: "Requirement response and claim register",
    matches: (row) => rowEvidenceReferences(row).length > 0,
  },
  {
    kind: "productivity_commitments",
    label: "Automation and productivity commitments",
    matches: (row) => row.category === "automation and productivity",
  },
  {
    kind: "pricing_workbook",
    label: "Pricing workbook references",
    matches: (row) => Boolean(row.pricingRef),
  },
  {
    kind: "staffing_location_model",
    label: "Staffing and location model",
    matches: (row) => row.category === "staffing and location",
  },
  {
    kind: "sla_commitments",
    label: "SLA and service-credit commitments",
    matches: (row) => Boolean(row.slaRef),
  },
  {
    kind: "assumptions_exclusions",
    label: "Assumptions and exclusions register",
    matches: (row) => Boolean(row.exceptionRef),
  },
  {
    kind: "transition_milestones",
    label: "Transition milestones",
    matches: (row) => row.category === "transition",
  },
  {
    kind: "commercial_exceptions",
    label: "Commercial exception register",
    matches: (row) => row.responseDisposition === "Exception",
  },
  {
    kind: "evidence_index",
    label: "Requirement-level evidence index",
    matches: (row) => rowEvidenceReferences(row).length > 0,
  },
];

function buildExhibits(
  responsePackage: NormalizedVendorResponsePackage,
): VendorResponseExhibitStatus[] {
  return EXHIBIT_RULES.map((rule) => {
    const rows = responsePackage.rows.filter(rule.matches);
    const references = unique(
      rows.flatMap((row) => rowEvidenceReferences(row)),
    );
    const status: VendorResponseExhibitStatus["status"] =
      rows.length === 0
        ? "missing"
        : references.length > 0
          ? "complete"
          : "partial";
    return {
      kind: rule.kind,
      label: rule.label,
      status,
      evidenceReference:
        references.length > 0
          ? `${responsePackage.originalName} · ${references.slice(0, 2).join("; ")}`
          : null,
      issue:
        status === "missing"
          ? `No ${rule.label.toLowerCase()} rows were parsed.`
          : status === "partial"
            ? `${rule.label} is described but not externally referenced.`
            : null,
    };
  });
}

function buildExtractionCards(
  responsePackage: NormalizedVendorResponsePackage,
): VendorExtractionCard[] {
  const rowsToUse: NormalizedRequirementResponse[] = [];
  const representedTypes = new Set<VendorExtractionCard["type"]>();
  for (const row of responsePackage.rows) {
    const type = extractionCardType(row);
    const isException =
      row.responseDisposition === "Exception" ||
      row.responseDisposition === "Partially Comply";
    if (!isException && representedTypes.has(type)) continue;
    rowsToUse.push(row);
    representedTypes.add(type);
    if (rowsToUse.length >= 18) break;
  }
  return rowsToUse.map((row, index) => {
    const references = rowEvidenceReferences(row);
    const hasNarrative = Boolean(row.responseNarrative?.trim());
    const status: VendorExtractionCard["structuredExhibitStatus"] =
      !hasNarrative
        ? "missing"
        : references.length > 0
          ? "supported"
          : "partial";
    const isException =
      row.responseDisposition === "Exception" ||
      row.responseDisposition === "Partially Comply";
    return {
      cardId: `${responsePackage.vendorId}-normalized-${String(index + 1).padStart(2, "0")}`,
      type: extractionCardType(row),
      title: `${row.requirementId} · ${row.section}`,
      extractedValue: compact(
        row.responseNarrative ?? "No response narrative parsed.",
        260,
      ),
      evidenceReference:
        references.length > 0
          ? `${responsePackage.originalName} · ${references.join("; ")}`
          : `${responsePackage.originalName} · ${row.requirementId}`,
      confidence: references.length > 0 ? "high" : "medium",
      structuredExhibitStatus: status,
      missingFields: [
        ...(!hasNarrative ? ["response narrative"] : []),
        ...(row.evidenceRequired && references.length === 0
          ? ["required evidence reference"]
          : []),
      ],
      finding: isException
        ? `${row.responseDisposition}: ${compact(row.requirement, 190)}`
        : `${row.responseDisposition ?? "Not answered"}: response is linked to ${references.length} evidence reference(s).`,
      recommendedAction: isException
        ? "Resolve the exception before final scoring and quantify any commercial, service, transition, or risk effect."
        : "Use the cited normalized row in evaluator-owned scoring; verify the referenced exhibit before final score acceptance.",
    };
  });
}

function extractionCardType(
  row: NormalizedRequirementResponse,
): VendorExtractionCard["type"] {
  if (
    row.responseDisposition === "Exception" ||
    row.responseDisposition === "Partially Comply"
  ) {
    return "exception";
  }
  if (
    row.responseType === "Pricing" ||
    row.category === "commercial and pricing"
  ) {
    return "pricing";
  }
  if (
    row.responseType === "SLA / KPI" ||
    row.category === "SLA and performance"
  ) {
    return "sla";
  }
  if (
    row.responseType === "Staffing" ||
    row.category === "staffing and location"
  ) {
    return "staffing";
  }
  if (row.responseType === "Transition" || row.category === "transition") {
    return "transition";
  }
  if (row.category === "automation and productivity") return "productivity";
  return "claim";
}

function rowEvidenceReferences(row: NormalizedRequirementResponse): string[] {
  return unique(
    [
      ...(row.evidenceRefs ?? []),
      row.pricingRef,
      row.slaRef,
      row.exceptionRef,
    ].filter(isText),
  );
}

function compact(value: string, max: number): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized.length <= max
    ? normalized
    : `${normalized.slice(0, Math.max(0, max - 1)).trimEnd()}…`;
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
