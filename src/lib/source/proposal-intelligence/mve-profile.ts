import type {
  CommercialLeverageSeed,
  VendorBafoInstructionPack,
  VendorBafoQuestion,
  VendorBafoVendorInstruction,
  VendorEvaluationComparisonRow,
  VendorEvaluationDecisionView,
  VendorEvaluationRecommendation,
  VendorEvaluationScorecardRow,
  VendorEvaluationScoreValue,
  VendorEvaluationVendorSummary,
  VendorExtractionCard,
  VendorChallengeIntelligence,
  VendorChallengeIssueCategory,
  VendorChallengeLogEntry,
  VendorResponseExhibitStatus,
  VendorResponsePricingSummary,
  VendorResponseProfile,
  VendorResponseSectionMapRow,
} from "./types";

interface VendorResponsePackageFixture {
  sourceEventId: string;
  tenantKey: string;
  vendorId: string;
  vendorName: string;
  responseVersion: number;
  packageSummary: string;
  narrativePageEquivalent: string;
  sectionMap: VendorResponseSectionMapRow[];
  exhibits: VendorResponseExhibitStatus[];
  extractionCards: VendorExtractionCard[];
  pricingSummary: VendorResponsePricingSummary;
}

export interface VendorResponseProfileSet {
  sourceEventId: string;
  tenantKey: string;
  eventName: string;
  generatedAt: string;
  profileCount: number;
  profiles: VendorResponseProfile[];
}

export interface VendorResponseProfileEventRef {
  id: string;
  code?: string | null;
  name?: string | null;
  accountName?: string | null;
}

const GENERATED_AT = "2026-07-01T00:00:00.000Z";

const REQUIRED_SECTION_COUNT = 15;

const baseSections = (
  rows: Array<
    Omit<VendorResponseSectionMapRow, "responseReference"> & {
      page: string;
    }
  >,
): VendorResponseSectionMapRow[] =>
  rows.map(({ page, ...row }) => ({
    ...row,
    responseReference: `Narrative ${page}`,
  }));

const exhibits = (
  entries: VendorResponseExhibitStatus[],
): VendorResponseExhibitStatus[] => entries;

const card = (
  input: Omit<VendorExtractionCard, "cardId"> & { vendorId: string; n: number },
): VendorExtractionCard => {
  const { vendorId, n, ...rest } = input;
  return {
    cardId: `${vendorId}-mve-${String(n).padStart(2, "0")}`,
    ...rest,
  };
};

const SKYHARBOR_VENDOR_PACKAGES: VendorResponsePackageFixture[] = [
  {
    sourceEventId: "skyharbor-ams-vendor-response-mve",
    tenantKey: "skyharbor-air",
    vendorId: "vendor-a-incumbent-profile",
    vendorName: "Vendor A — incumbent operations profile",
    responseVersion: 1,
    packageSummary:
      "Synthetic demo evidence: 92-page equivalent narrative response plus complete exhibits. Strong operational continuity, but productivity is not fully priced back and transition fees need stronger milestone economics.",
    narrativePageEquivalent: "92-page equivalent",
    sectionMap: baseSections([
      { sectionNumber: 1, rfpSection: "Executive Summary", page: "pp. 1-5", status: "complete", notes: "Clear continuity thesis and incumbent risk posture." },
      { sectionNumber: 2, rfpSection: "Scope Understanding", page: "pp. 6-11", status: "complete", notes: "Matches AMS scope and retained-team boundary." },
      { sectionNumber: 3, rfpSection: "Service Delivery Model", page: "pp. 12-19", status: "complete", notes: "Run model is mature and airline-critical apps are named by tower." },
      { sectionNumber: 4, rfpSection: "Application Support Model", page: "pp. 20-29", status: "complete", notes: "L1/L2/L3 split is described with tooling cadence." },
      { sectionNumber: 5, rfpSection: "Airline Operations Support", page: "pp. 30-38", status: "complete", notes: "Good IROPS and airport operations coverage." },
      { sectionNumber: 6, rfpSection: "Corporate Shared Services Support", page: "pp. 39-45", status: "complete", notes: "Finance and HR support model included." },
      { sectionNumber: 7, rfpSection: "Transition Plan", page: "pp. 46-58", status: "partial", notes: "Milestones exist, but transition fee is not sufficiently at-risk." },
      { sectionNumber: 8, rfpSection: "Staffing Model", page: "pp. 59-65", status: "complete", notes: "Named role pyramid and follow-the-sun coverage." },
      { sectionNumber: 9, rfpSection: "SLA Commitments", page: "pp. 66-72", status: "partial", notes: "Targets are clear; service-credit cap remains weak." },
      { sectionNumber: 10, rfpSection: "Automation / Productivity", page: "pp. 73-80", status: "partial", notes: "Narrative claims 18% productivity, but pricing credit is only partial." },
      { sectionNumber: 11, rfpSection: "Governance", page: "pp. 81-84", status: "complete", notes: "QBR, operational review, and escalation cadence included." },
      { sectionNumber: 12, rfpSection: "Security / Compliance", page: "pp. 85-88", status: "complete", notes: "SOC, incident, and data-handling controls included." },
      { sectionNumber: 13, rfpSection: "Pricing", page: "Workbook", status: "complete", notes: "Workbook provided; normalization adjustment required for transition fee." },
      { sectionNumber: 14, rfpSection: "Assumptions / Exclusions", page: "Appendix B", status: "complete", notes: "Buyer dependency list is explicit." },
      { sectionNumber: 15, rfpSection: "Exceptions", page: "Appendix C", status: "exception", notes: "Exceptions include transition payment timing and SLA credit cap." },
    ]),
    exhibits: exhibits([
      { kind: "claim_register", label: "Vendor Claim Register", status: "complete", evidenceReference: "Vendor A Exhibit CR-1", issue: null },
      { kind: "productivity_commitments", label: "Automation/Productivity Commitment Table", status: "partial", evidenceReference: "Vendor A Exhibit AP-1", issue: "18% narrative claim only returns 8% as contractual price-down." },
      { kind: "pricing_workbook", label: "Pricing Workbook", status: "complete", evidenceReference: "Vendor A Pricing Workbook v1", issue: "Transition fee is front-loaded." },
      { kind: "staffing_location_model", label: "Staffing and Location Model", status: "complete", evidenceReference: "Vendor A Exhibit SL-1", issue: null },
      { kind: "sla_commitments", label: "SLA Commitment Table", status: "partial", evidenceReference: "Vendor A Exhibit SLA-1", issue: "Service credits capped at 4% of monthly fee." },
      { kind: "assumptions_exclusions", label: "Assumptions and Exclusions Log", status: "complete", evidenceReference: "Vendor A Appendix B", issue: null },
      { kind: "transition_milestones", label: "Transition Milestone Plan", status: "partial", evidenceReference: "Vendor A Exhibit TP-1", issue: "Milestone acceptance not tied to enough transition fee." },
      { kind: "commercial_exceptions", label: "Commercial Exceptions Table", status: "complete", evidenceReference: "Vendor A Appendix C", issue: "Two buyer-risk exceptions remain." },
      { kind: "evidence_index", label: "Evidence Attachment Index", status: "complete", evidenceReference: "Vendor A Exhibit EI-1", issue: null },
    ]),
    pricingSummary: {
      yearOneRunCostUsd: 18_600_000,
      transitionCostUsd: 4_800_000,
      oneTimeCostUsd: 1_200_000,
      optionalCostUsd: 2_100_000,
      fiveYearTcoUsd: 96_400_000,
      pricingBasis:
        "Complete workbook with normalized run, transition, optional, and pass-through lines.",
    },
    extractionCards: [
      card({ vendorId: "vendor-a-incumbent-profile", n: 1, type: "productivity", title: "Productivity claim is only partially commercialized", extractedValue: "18% productivity by year 2; 8% priced back", evidenceReference: "Vendor A Narrative 10.2 + Exhibit AP-1", confidence: "high", structuredExhibitStatus: "partial", missingFields: ["full year-by-year price-down mechanism"], finding: "Operational automation story is stronger than the commercial commitment.", recommendedAction: "Require BAFO credit schedule for the remaining productivity delta." }),
      card({ vendorId: "vendor-a-incumbent-profile", n: 2, type: "sla", title: "SLA cap weakens service accountability", extractedValue: "P1 response and restoration targets present; service credits capped at 4%", evidenceReference: "Vendor A Exhibit SLA-1", confidence: "high", structuredExhibitStatus: "partial", missingFields: ["chronic miss multiplier", "earn-back restrictions"], finding: "SLA target is usable, but financial remedy is too light for airline-critical operations.", recommendedAction: "Ask for higher cap and chronic-miss escalator before scoring SLA economics." }),
      card({ vendorId: "vendor-a-incumbent-profile", n: 3, type: "transition", title: "Transition fee needs milestone linkage", extractedValue: "$4.8M transition cost; payment schedule front-loaded", evidenceReference: "Vendor A Pricing Workbook + Exhibit TP-1", confidence: "high", structuredExhibitStatus: "partial", missingFields: ["acceptance holdback"], finding: "Transition risk is lower than peers, but fee economics are vendor-protective.", recommendedAction: "Move at least 30% of transition fees behind accepted KT and stabilization milestones." }),
    ],
  },
  {
    sourceEventId: "skyharbor-ams-vendor-response-mve",
    tenantKey: "skyharbor-air",
    vendorId: "vendor-b-scale-profile",
    vendorName: "Vendor B — scale transformation profile",
    responseVersion: 1,
    packageSummary:
      "Synthetic demo evidence: 108-page equivalent response with aggressive offshore and automation economics. The narrative is compelling, but the structured exhibits leave productivity, staffing, and retained-responsibility gaps.",
    narrativePageEquivalent: "108-page equivalent",
    sectionMap: baseSections([
      { sectionNumber: 1, rfpSection: "Executive Summary", page: "pp. 1-6", status: "complete", notes: "Strong transformation thesis." },
      { sectionNumber: 2, rfpSection: "Scope Understanding", page: "pp. 7-14", status: "partial", notes: "Corporate shared services support is broad but retained obligations are unclear." },
      { sectionNumber: 3, rfpSection: "Service Delivery Model", page: "pp. 15-24", status: "complete", notes: "Global delivery model is detailed." },
      { sectionNumber: 4, rfpSection: "Application Support Model", page: "pp. 25-35", status: "partial", notes: "Application tower scope differs from the RFP baseline." },
      { sectionNumber: 5, rfpSection: "Airline Operations Support", page: "pp. 36-44", status: "partial", notes: "IROPS coverage claim lacks staffed evidence." },
      { sectionNumber: 6, rfpSection: "Corporate Shared Services Support", page: "pp. 45-52", status: "complete", notes: "Finance and HR towers included." },
      { sectionNumber: 7, rfpSection: "Transition Plan", page: "pp. 53-67", status: "complete", notes: "Detailed plan, but heavy dependency on client SMEs." },
      { sectionNumber: 8, rfpSection: "Staffing Model", page: "pp. 68-73", status: "partial", notes: "24x7 coverage claim not reconciled to named FTE/location table." },
      { sectionNumber: 9, rfpSection: "SLA Commitments", page: "pp. 74-81", status: "complete", notes: "SLA framework is complete." },
      { sectionNumber: 10, rfpSection: "Automation / Productivity", page: "pp. 82-93", status: "partial", notes: "22% productivity claim lacks baseline and pricing credit." },
      { sectionNumber: 11, rfpSection: "Governance", page: "pp. 94-98", status: "complete", notes: "Governance structure included." },
      { sectionNumber: 12, rfpSection: "Security / Compliance", page: "pp. 99-102", status: "complete", notes: "Security response complete." },
      { sectionNumber: 13, rfpSection: "Pricing", page: "Workbook", status: "partial", notes: "Pricing is complete but tooling pass-throughs are not capped." },
      { sectionNumber: 14, rfpSection: "Assumptions / Exclusions", page: "Appendix D", status: "exception", notes: "Retained-client workload assumptions are material." },
      { sectionNumber: 15, rfpSection: "Exceptions", page: "Appendix E", status: "exception", notes: "Commercial exceptions shift runbook and demand-risk to buyer." },
    ]),
    exhibits: exhibits([
      { kind: "claim_register", label: "Vendor Claim Register", status: "partial", evidenceReference: "Vendor B Exhibit CR-1", issue: "Automation claim appears in narrative but is incomplete in the register." },
      { kind: "productivity_commitments", label: "Automation/Productivity Commitment Table", status: "partial", evidenceReference: "Vendor B Exhibit AP-1", issue: "No baseline ticket volume and no pricing credit." },
      { kind: "pricing_workbook", label: "Pricing Workbook", status: "complete", evidenceReference: "Vendor B Pricing Workbook v1", issue: "Tooling pass-throughs uncapped." },
      { kind: "staffing_location_model", label: "Staffing and Location Model", status: "partial", evidenceReference: "Vendor B Exhibit SL-1", issue: "24x7 claim not backed by location coverage table." },
      { kind: "sla_commitments", label: "SLA Commitment Table", status: "complete", evidenceReference: "Vendor B Exhibit SLA-1", issue: null },
      { kind: "assumptions_exclusions", label: "Assumptions and Exclusions Log", status: "complete", evidenceReference: "Vendor B Appendix D", issue: "Client SME dependency is broad." },
      { kind: "transition_milestones", label: "Transition Milestone Plan", status: "complete", evidenceReference: "Vendor B Exhibit TP-1", issue: null },
      { kind: "commercial_exceptions", label: "Commercial Exceptions Table", status: "complete", evidenceReference: "Vendor B Appendix E", issue: "Demand volatility exception creates change-order exposure." },
      { kind: "evidence_index", label: "Evidence Attachment Index", status: "partial", evidenceReference: "Vendor B Exhibit EI-1", issue: "Case study evidence is not mapped to airline operations scope." },
    ]),
    pricingSummary: {
      yearOneRunCostUsd: 15_900_000,
      transitionCostUsd: 6_700_000,
      oneTimeCostUsd: 2_600_000,
      optionalCostUsd: 4_400_000,
      fiveYearTcoUsd: 91_800_000,
      pricingBasis:
        "Aggressive run cost with uncapped tooling pass-throughs and retained-work assumptions.",
    },
    extractionCards: [
      card({ vendorId: "vendor-b-scale-profile", n: 1, type: "productivity", title: "Automation claim is unsupported commercially", extractedValue: "22% productivity by year 2", evidenceReference: "Vendor B Narrative 10.1", confidence: "medium", structuredExhibitStatus: "partial", missingFields: ["baseline volume", "measurement method", "price-down mechanism"], finding: "Productivity is a marketing claim until the exhibit and pricing workbook commit it.", recommendedAction: "Require baseline, use-case list, year-by-year impact, and BAFO pricing credit." }),
      card({ vendorId: "vendor-b-scale-profile", n: 2, type: "staffing", title: "24x7 coverage is not staffed", extractedValue: "24x7 follow-the-sun support asserted", evidenceReference: "Vendor B Narrative 5.4 + Exhibit SL-1", confidence: "medium", structuredExhibitStatus: "partial", missingFields: ["named location coverage", "FTE by shift"], finding: "Coverage claim is not backed by the staffing exhibit.", recommendedAction: "Request shift/FTE/location table before giving SLA coverage credit." }),
      card({ vendorId: "vendor-b-scale-profile", n: 3, type: "assumption", title: "Retained responsibilities may erode savings", extractedValue: "Client SMEs provide runbooks, triage support, and demand validation during first 120 days", evidenceReference: "Vendor B Appendix D", confidence: "high", structuredExhibitStatus: "supported", missingFields: ["client effort estimate"], finding: "Savings may be overstated unless retained-client effort is costed.", recommendedAction: "Ask for retained-role RACI and include retained effort in normalized TCO." }),
    ],
  },
  {
    sourceEventId: "skyharbor-ams-vendor-response-mve",
    tenantKey: "skyharbor-air",
    vendorId: "vendor-c-specialist-profile",
    vendorName: "Vendor C — specialist service profile",
    responseVersion: 1,
    packageSummary:
      "Synthetic demo evidence: 76-page equivalent response with strong service discipline and SLA specificity. The package is narrower on ERP/corporate support and carries slower application-rationalization transition assumptions.",
    narrativePageEquivalent: "76-page equivalent",
    sectionMap: baseSections([
      { sectionNumber: 1, rfpSection: "Executive Summary", page: "pp. 1-4", status: "complete", notes: "Focused service-quality thesis." },
      { sectionNumber: 2, rfpSection: "Scope Understanding", page: "pp. 5-10", status: "partial", notes: "Narrower ERP and corporate shared-services coverage." },
      { sectionNumber: 3, rfpSection: "Service Delivery Model", page: "pp. 11-18", status: "complete", notes: "Clear pod model." },
      { sectionNumber: 4, rfpSection: "Application Support Model", page: "pp. 19-27", status: "partial", notes: "Application rationalization support is limited." },
      { sectionNumber: 5, rfpSection: "Airline Operations Support", page: "pp. 28-35", status: "complete", notes: "Airline operational run coverage is strong." },
      { sectionNumber: 6, rfpSection: "Corporate Shared Services Support", page: "pp. 36-40", status: "partial", notes: "Finance/HR/legal support requires optional addendum." },
      { sectionNumber: 7, rfpSection: "Transition Plan", page: "pp. 41-52", status: "partial", notes: "Longer stabilization period than buyer target." },
      { sectionNumber: 8, rfpSection: "Staffing Model", page: "pp. 53-58", status: "complete", notes: "Staffing table is complete." },
      { sectionNumber: 9, rfpSection: "SLA Commitments", page: "pp. 59-64", status: "complete", notes: "Best SLA credit economics of the set." },
      { sectionNumber: 10, rfpSection: "Automation / Productivity", page: "pp. 65-69", status: "partial", notes: "Modest automation claim with measurement, but no broad value upside." },
      { sectionNumber: 11, rfpSection: "Governance", page: "pp. 70-72", status: "complete", notes: "Lean governance, higher buyer participation." },
      { sectionNumber: 12, rfpSection: "Security / Compliance", page: "pp. 73-74", status: "complete", notes: "Security response complete." },
      { sectionNumber: 13, rfpSection: "Pricing", page: "Workbook", status: "complete", notes: "Pricing workbook complete with optional corporate tower addendum." },
      { sectionNumber: 14, rfpSection: "Assumptions / Exclusions", page: "Appendix A", status: "exception", notes: "ERP support and app rationalization have exclusions." },
      { sectionNumber: 15, rfpSection: "Exceptions", page: "Appendix B", status: "exception", notes: "Corporate shared-services support is conditional." },
    ]),
    exhibits: exhibits([
      { kind: "claim_register", label: "Vendor Claim Register", status: "complete", evidenceReference: "Vendor C Exhibit CR-1", issue: null },
      { kind: "productivity_commitments", label: "Automation/Productivity Commitment Table", status: "complete", evidenceReference: "Vendor C Exhibit AP-1", issue: "Commitment is modest: 9% by year 3." },
      { kind: "pricing_workbook", label: "Pricing Workbook", status: "complete", evidenceReference: "Vendor C Pricing Workbook v1", issue: "Corporate support priced as optional." },
      { kind: "staffing_location_model", label: "Staffing and Location Model", status: "complete", evidenceReference: "Vendor C Exhibit SL-1", issue: null },
      { kind: "sla_commitments", label: "SLA Commitment Table", status: "complete", evidenceReference: "Vendor C Exhibit SLA-1", issue: null },
      { kind: "assumptions_exclusions", label: "Assumptions and Exclusions Log", status: "complete", evidenceReference: "Vendor C Appendix A", issue: "ERP and rationalization exclusions create scope risk." },
      { kind: "transition_milestones", label: "Transition Milestone Plan", status: "partial", evidenceReference: "Vendor C Exhibit TP-1", issue: "Stabilization period extends beyond buyer target." },
      { kind: "commercial_exceptions", label: "Commercial Exceptions Table", status: "complete", evidenceReference: "Vendor C Appendix B", issue: "Corporate support addendum exception." },
      { kind: "evidence_index", label: "Evidence Attachment Index", status: "complete", evidenceReference: "Vendor C Exhibit EI-1", issue: null },
    ]),
    pricingSummary: {
      yearOneRunCostUsd: 17_200_000,
      transitionCostUsd: 3_900_000,
      oneTimeCostUsd: 900_000,
      optionalCostUsd: 5_600_000,
      fiveYearTcoUsd: 94_300_000,
      pricingBasis:
        "Complete base workbook, but several corporate shared-services items are optional.",
    },
    extractionCards: [
      card({ vendorId: "vendor-c-specialist-profile", n: 1, type: "sla", title: "SLA economics are strongest", extractedValue: "P1/P2 targets with 8% monthly service-credit cap and chronic miss escalation", evidenceReference: "Vendor C Exhibit SLA-1", confidence: "high", structuredExhibitStatus: "supported", missingFields: [], finding: "Service accountability is stronger than peers.", recommendedAction: "Preserve SLA economics if vendor remains in evaluation." }),
      card({ vendorId: "vendor-c-specialist-profile", n: 2, type: "exception", title: "Corporate support is not fully in base scope", extractedValue: "Finance, HR, and legal support require optional addendum", evidenceReference: "Vendor C Appendix B + Pricing Workbook", confidence: "high", structuredExhibitStatus: "supported", missingFields: ["final included/excluded tower decision"], finding: "Headline base price is not comparable until optional corporate support is normalized.", recommendedAction: "Either include the optional tower in normalized TCO or exclude it from all vendors." }),
      card({ vendorId: "vendor-c-specialist-profile", n: 3, type: "transition", title: "Transition timeline is slower", extractedValue: "Stabilization extends to 26 weeks", evidenceReference: "Vendor C Exhibit TP-1", confidence: "high", structuredExhibitStatus: "partial", missingFields: ["accelerated cutover option"], finding: "Lower transition cost comes with schedule risk.", recommendedAction: "Request accelerated transition option and price impact." }),
    ],
  },
];

function isSkyHarborAmsEvent(event: VendorResponseProfileEventRef): boolean {
  return [event.id, event.code, event.name, event.accountName]
    .filter((value): value is string => Boolean(value))
    .some((value) => /skyh|skyharbor/i.test(value));
}

function completeness(sectionMap: VendorResponseSectionMapRow[]) {
  const completeSections = sectionMap.filter(
    (section) => section.status === "complete",
  ).length;
  const partialSections = sectionMap
    .filter((section) => section.status === "partial")
    .map((section) => section.rfpSection);
  const missingSections = sectionMap
    .filter((section) => section.status === "missing")
    .map((section) => section.rfpSection);
  return {
    percent: Math.round((completeSections / REQUIRED_SECTION_COUNT) * 100),
    completeSections,
    totalSections: REQUIRED_SECTION_COUNT,
    missingSections,
    partialSections,
  };
}

function fieldFromCards(
  cards: VendorExtractionCard[],
  type: VendorExtractionCard["type"],
): string[] {
  return cards
    .filter((extraction) => extraction.type === type)
    .map((extraction) => extraction.extractedValue);
}

function unsupportedClaims(cards: VendorExtractionCard[]): string[] {
  return cards
    .filter(
      (extraction) =>
        extraction.structuredExhibitStatus !== "supported" ||
        extraction.missingFields.length > 0,
    )
    .map((extraction) => extraction.title);
}

function buildProfile(pkg: VendorResponsePackageFixture): VendorResponseProfile {
  const responseCompleteness = completeness(pkg.sectionMap);
  const partialOrMissingExhibits = pkg.exhibits.filter(
    (exhibit) => exhibit.status !== "complete" || exhibit.issue,
  );
  const unsupported = unsupportedClaims(pkg.extractionCards);
  const readyForEvaluation: VendorResponseProfile["readyForEvaluation"] =
    responseCompleteness.missingSections.length > 0 ||
    unsupported.length >= 4
      ? "no"
      : unsupported.length > 0 || partialOrMissingExhibits.length > 0
        ? "conditional"
        : "yes";

  return {
    sourceEventId: pkg.sourceEventId,
    tenantKey: pkg.tenantKey,
    vendorId: pkg.vendorId,
    vendorName: pkg.vendorName,
    responseVersion: pkg.responseVersion,
    syntheticDemo: true,
    packageSummary: pkg.packageSummary,
    narrativePageEquivalent: pkg.narrativePageEquivalent,
    responseCompleteness,
    majorClaims: pkg.extractionCards
      .filter((extraction) =>
        ["claim", "productivity", "sla", "staffing"].includes(
          extraction.type,
        ),
      )
      .map((extraction) => extraction.extractedValue),
    evidenceProvided: [
      ...new Set(
        pkg.extractionCards
          .map((extraction) => extraction.evidenceReference)
          .filter((value): value is string => Boolean(value)),
      ),
    ],
    pricingSummary: pkg.pricingSummary,
    productivityCommitment:
      fieldFromCards(pkg.extractionCards, "productivity")[0] ??
      "No productivity commitment extracted.",
    staffingModelSummary:
      fieldFromCards(pkg.extractionCards, "staffing")[0] ??
      "Staffing model extracted from structured exhibit.",
    slaCommitments:
      fieldFromCards(pkg.extractionCards, "sla")[0] ??
      "SLA commitments extracted from structured exhibit.",
    assumptionsExclusions: fieldFromCards(pkg.extractionCards, "assumption"),
    commercialExceptions: fieldFromCards(pkg.extractionCards, "exception"),
    transitionCommitments:
      fieldFromCards(pkg.extractionCards, "transition")[0] ??
      "Transition plan extracted from milestone exhibit.",
    unsupportedClaims: unsupported,
    clarificationQuestions: pkg.extractionCards.map(
      (extraction) => extraction.recommendedAction,
    ),
    negotiationLevers: pkg.extractionCards.map(
      (extraction) => extraction.finding,
    ),
    readyForEvaluation,
    readyReason:
      readyForEvaluation === "yes"
        ? "Profile is complete enough for evaluation setup."
        : readyForEvaluation === "conditional"
          ? "Profile can enter evaluation only after the listed clarifications are resolved."
          : "Profile should not enter evaluation until missing sections or unsupported claims are corrected.",
    sectionMap: pkg.sectionMap,
    exhibits: pkg.exhibits,
    extractionCards: pkg.extractionCards,
  };
}

export function buildVendorResponseMveProfiles(
  event: VendorResponseProfileEventRef,
): VendorResponseProfileSet | null {
  if (!isSkyHarborAmsEvent(event)) return null;
  const profiles = SKYHARBOR_VENDOR_PACKAGES.map((pkg) => ({
    ...pkg,
    sourceEventId: event.id,
  })).map(buildProfile);
  return {
    sourceEventId: event.id,
    tenantKey: "skyharbor-air",
    eventName: event.name ?? "SkyHarbor AMS Outsourcing",
    generatedAt: GENERATED_AT,
    profileCount: profiles.length,
    profiles,
  };
}

export function buildVendorChallengeIntelligence(
  profileSet: VendorResponseProfileSet | null | undefined,
): VendorChallengeIntelligence | null {
  if (!profileSet?.profiles.length) return null;
  const challengeLog = profileSet.profiles.flatMap((profile) =>
    profile.extractionCards
      .filter((card) => shouldChallengeCard(card))
      .map((card, index) => challengeFromCard(profile, card, index)),
  );
  const leverageSeeds = challengeLog.map((challenge, index) =>
    leverageSeedFromChallenge(challenge, index),
  );

  return {
    sourceEventId: profileSet.sourceEventId,
    tenantKey: profileSet.tenantKey,
    generatedAt: profileSet.generatedAt,
    challengeCount: challengeLog.length,
    leverageSeedCount: leverageSeeds.length,
    challengeLog,
    leverageSeeds,
  };
}

export function buildVendorBafoInstructionPack(
  intelligence: VendorChallengeIntelligence | null | undefined,
): VendorBafoInstructionPack | null {
  if (!intelligence?.challengeLog.length || !intelligence.leverageSeeds.length) {
    return null;
  }
  const challengeByVendor = groupByVendor(intelligence.challengeLog);
  const seedByVendor = groupByVendor(intelligence.leverageSeeds);
  const vendorIds = Array.from(
    new Set([
      ...intelligence.challengeLog.map((challenge) => challenge.vendorId),
      ...intelligence.leverageSeeds.map((seed) => seed.vendorId),
    ]),
  );
  const vendorInstructions = vendorIds.map((vendorId) =>
    bafoInstructionForVendor(
      vendorId,
      challengeByVendor.get(vendorId) ?? [],
      seedByVendor.get(vendorId) ?? [],
    ),
  );
  const questionCount = vendorInstructions.reduce(
    (sum, instruction) => sum + instruction.instructionCount,
    0,
  );
  const scoringHoldbacks = Array.from(
    new Set(
      vendorInstructions
        .flatMap((instruction) => instruction.mustResolveBeforeScoring)
        .slice(0, 8),
    ),
  );

  return {
    sourceEventId: intelligence.sourceEventId,
    tenantKey: intelligence.tenantKey,
    generatedAt: intelligence.generatedAt,
    roundLabel: "BAFO Round 1 instruction pack",
    executiveSummary:
      "Source converts response-profile challenges into vendor-specific BAFO instructions so evaluation does not harden around unsupported claims, non-comparable pricing, weak SLA economics, or unpriced buyer risk.",
    vendorCount: vendorInstructions.length,
    questionCount,
    commonResponseRequirements: [
      "Answer every BAFO item in the order provided; do not replace a requested structured response with narrative only.",
      "For every commercial change, provide the revised price, affected contract clause, implementation dependency, and effective date.",
      "For every productivity or automation claim, provide baseline volume, measurement method, year-by-year commitment, and financial remedy.",
      "For every assumption, exclusion, or exception, mark it as removed, priced, or explicitly accepted as buyer risk.",
      "Provide a redline or exhibit reference for every revised SLA, staffing, transition, or pricing commitment.",
    ],
    completenessCriteria: [
      "Every must-resolve item has a direct response.",
      "Pricing, staffing, SLA, transition, assumptions, and exceptions are internally consistent across narrative and exhibits.",
      "No vendor receives full scoring credit for a claim that remains unpriced, unsupported, or outside the structured exhibits.",
      "Buyer-risk exceptions are either removed, priced, or escalated to executive decision.",
    ],
    scoringHoldbacks,
    vendorInstructions,
  };
}

export function buildVendorEvaluationDecisionView(
  profileSet: VendorResponseProfileSet | null | undefined,
  intelligence?: VendorChallengeIntelligence | null,
  bafoPack?: VendorBafoInstructionPack | null,
): VendorEvaluationDecisionView | null {
  if (!profileSet?.profiles.length) return null;
  const profiles = profileSet.profiles;
  const scorecardRows = buildEvaluationScorecardRows(profiles);
  const vendorSummaries = buildEvaluationVendorSummaries({
    profiles,
    scorecardRows,
    intelligence,
    bafoPack,
  });
  const sorted = [...vendorSummaries].sort(
    (a, b) => b.weightedScore - a.weightedScore,
  );
  const cheapest = [...profiles].sort(
    (a, b) =>
      (a.pricingSummary.fiveYearTcoUsd ?? Number.MAX_SAFE_INTEGER) -
      (b.pricingSummary.fiveYearTcoUsd ?? Number.MAX_SAFE_INTEGER),
  )[0];
  const highestTransitionRisk =
    profiles.find((profile) => profile.vendorId.includes("scale")) ??
    sorted.at(-1) ??
    profiles[0];

  return {
    sourceEventId: profileSet.sourceEventId,
    tenantKey: profileSet.tenantKey,
    generatedAt: profileSet.generatedAt,
    scoreBasis:
      "Default demo evaluation model derived from MVE profiles, challenge log, BAFO holdbacks, pricing summaries, SLA commitments, transition findings, assumptions, exceptions, and evidence completeness. Human scoring remains required before award.",
    vendorCount: profiles.length,
    comparisonRows: buildEvaluationComparisonRows(profiles),
    scorecardRows,
    vendorSummaries,
    executiveTradeoffs: [
      "Vendor A is the risk-adjusted leader: strongest continuity and scope confidence, but BAFO must improve productivity credits, SLA remedies, and transition fee holdbacks.",
      "Vendor B is cheapest on normalized 5-year TCO, but its savings depend on resolving coverage staffing, retained-client effort, and unpriced productivity commitments.",
      "Vendor C has the strongest SLA economics and clean evidence discipline, but its base scope excludes or conditions corporate shared-services support and carries a slower transition posture.",
      "The executive decision is not lowest price versus highest score; it is whether the buyer values lower TCO enough to accept Vendor B's unresolved execution risk, or pays for Vendor A's continuity while forcing sharper BAFO economics.",
    ],
    leadingVendorId: sorted[0]?.vendorId ?? profiles[0].vendorId,
    cheapestVendorId: cheapest?.vendorId ?? profiles[0].vendorId,
    highestTransitionRiskVendorId:
      typeof highestTransitionRisk === "string"
        ? highestTransitionRisk
        : highestTransitionRisk.vendorId,
    recommendedAdvanceVendorIds: vendorSummaries
      .filter((summary) => summary.recommendation !== "hold_until_clarified")
      .map((summary) => summary.vendorId),
  };
}

function buildEvaluationComparisonRows(
  profiles: VendorResponseProfile[],
): VendorEvaluationComparisonRow[] {
  return [
    comparisonRow(profiles, {
      id: "normalized-tco",
      label: "Normalized 5-year TCO",
      decisionUse: "Shows cost position after transition, optional, and one-time lines are visible.",
      value: (profile) => money(profile.pricingSummary.fiveYearTcoUsd),
      caveat: (profile) => profile.pricingSummary.pricingBasis,
      posture: (profile) =>
        profile.vendorId.includes("scale")
          ? "strength"
          : profile.vendorId.includes("specialist")
            ? "watch"
            : "watch",
      evidence: (profile) => profile.pricingSummary.pricingBasis,
    }),
    comparisonRow(profiles, {
      id: "year-one-run",
      label: "Year 1 run cost",
      decisionUse: "Separates ongoing run economics from transition and optional scope.",
      value: (profile) => money(profile.pricingSummary.yearOneRunCostUsd),
      caveat: (profile) =>
        profile.vendorId.includes("scale")
          ? "Lowest run price, but retained effort and pass-throughs need BAFO closure."
          : profile.vendorId.includes("specialist")
            ? "Moderate run price, with optional corporate tower normalization required."
            : "Higher run price reflects continuity and incumbent knowledge.",
      posture: (profile) => (profile.vendorId.includes("scale") ? "strength" : "watch"),
      evidence: (profile) => profile.pricingSummary.pricingBasis,
    }),
    comparisonRow(profiles, {
      id: "transition-risk",
      label: "Transition risk",
      decisionUse: "Highlights whether transition commitments protect knowledge transfer, cutover, and stabilization.",
      value: (profile) => profile.transitionCommitments,
      caveat: (profile) =>
        profile.vendorId.includes("scale")
          ? "Highest risk because client SME dependency and coverage proof remain open."
          : profile.vendorId.includes("specialist")
            ? "Schedule risk remains because stabilization extends beyond buyer target."
            : "Lower operational risk, but fee holdbacks need stronger milestone linkage.",
      posture: (profile) =>
        profile.vendorId.includes("scale")
          ? "risk"
          : profile.vendorId.includes("specialist")
            ? "watch"
            : "strength",
      evidence: (profile) =>
        profile.extractionCards.find((card) => card.type === "transition")
          ?.evidenceReference ?? "Transition milestone exhibit",
    }),
    comparisonRow(profiles, {
      id: "sla-economics",
      label: "SLA economics",
      decisionUse: "Tests whether service promises carry operationally meaningful remedies.",
      value: (profile) => profile.slaCommitments,
      caveat: (profile) =>
        profile.vendorId.includes("specialist")
          ? "Strongest SLA credit cap and chronic-miss escalation."
          : profile.vendorId.includes("incumbent")
            ? "Targets are usable, but credit economics are too light."
            : "SLA framework is complete, but must reconcile to staffed coverage.",
      posture: (profile) => (profile.vendorId.includes("specialist") ? "strength" : "watch"),
      evidence: (profile) =>
        profile.extractionCards.find((card) => card.type === "sla")
          ?.evidenceReference ?? "SLA commitment table",
    }),
    comparisonRow(profiles, {
      id: "automation-productivity",
      label: "Automation/productivity credibility",
      decisionUse: "Distinguishes automation narrative from priced, measured commitments.",
      value: (profile) => profile.productivityCommitment,
      caveat: (profile) =>
        profile.vendorId.includes("scale")
          ? "Biggest upside claim, but baseline and price-down are not committed."
          : profile.vendorId.includes("incumbent")
            ? "Claim is credible operationally but only partially priced back."
            : "More modest claim, with better measurement discipline but lower upside.",
      posture: (profile) =>
        profile.vendorId.includes("scale") || profile.vendorId.includes("incumbent")
          ? "risk"
          : "watch",
      evidence: (profile) =>
        profile.extractionCards.find((card) => card.type === "productivity")
          ?.evidenceReference ?? "Productivity commitment exhibit",
    }),
    comparisonRow(profiles, {
      id: "evaluation-readiness",
      label: "Evaluation readiness",
      decisionUse: "Summarizes whether the vendor can be scored now or only conditionally.",
      value: (profile) => profile.readyForEvaluation,
      caveat: (profile) => profile.readyReason,
      posture: (profile) =>
        profile.readyForEvaluation === "yes"
          ? "strength"
          : profile.readyForEvaluation === "conditional"
            ? "watch"
            : "risk",
      evidence: (profile) =>
        profile.unsupportedClaims.length
          ? profile.unsupportedClaims.slice(0, 2).join("; ")
          : "No major unsupported claims flagged in the MVE profile",
    }),
  ];
}

function comparisonRow(
  profiles: VendorResponseProfile[],
  input: {
    id: string;
    label: string;
    decisionUse: string;
    value: (profile: VendorResponseProfile) => string;
    caveat: (profile: VendorResponseProfile) => string;
    posture: (profile: VendorResponseProfile) => VendorEvaluationComparisonRow["values"][number]["posture"];
    evidence: (profile: VendorResponseProfile) => string;
  },
): VendorEvaluationComparisonRow {
  return {
    comparisonId: input.id,
    label: input.label,
    decisionUse: input.decisionUse,
    values: profiles.map((profile) => ({
      vendorId: profile.vendorId,
      vendorName: profile.vendorName,
      value: input.value(profile),
      posture: input.posture(profile),
      caveat: input.caveat(profile),
      evidenceLabel: input.evidence(profile),
    })),
  };
}

function buildEvaluationScorecardRows(
  profiles: VendorResponseProfile[],
): VendorEvaluationScorecardRow[] {
  const criteria: Array<{
    id: string;
    label: string;
    weight: number;
    guidance: string;
    score: (profile: VendorResponseProfile) => VendorEvaluationScoreValue;
  }> = [
    {
      id: "commercial-value",
      label: "Commercial value",
      weight: 18,
      guidance: "Score cost only after TCO, optional scope, pass-throughs, and retained effort are normalized.",
      score: (profile) =>
        scoreValue(profile, commercialScore(profile), commercialRationale(profile), profile.pricingSummary.pricingBasis),
    },
    {
      id: "scope-fit",
      label: "Scope fit",
      weight: 14,
      guidance: "Score included scope, corporate tower coverage, application support boundaries, and exclusions.",
      score: (profile) =>
        scoreValue(profile, scopeFitScore(profile), scopeFitRationale(profile), profile.sectionMap.find((section) => section.sectionNumber === 2)?.responseReference ?? "Scope response"),
    },
    {
      id: "service-sla-strength",
      label: "Service and SLA strength",
      weight: 14,
      guidance: "Score service targets together with credit economics, chronic-miss handling, and reporting.",
      score: (profile) =>
        scoreValue(profile, slaScore(profile), slaRationale(profile), profile.extractionCards.find((card) => card.type === "sla")?.evidenceReference ?? "SLA commitment table"),
    },
    {
      id: "transition-readiness",
      label: "Transition readiness",
      weight: 12,
      guidance: "Score KT, cutover, stabilization, milestone economics, and client dependency risk.",
      score: (profile) =>
        scoreValue(profile, transitionScore(profile), transitionRationale(profile), profile.extractionCards.find((card) => card.type === "transition")?.evidenceReference ?? "Transition milestone plan"),
    },
    {
      id: "staffing-delivery",
      label: "Staffing and delivery model",
      weight: 10,
      guidance: "Score role mix, shift coverage, location coverage, and critical application support.",
      score: (profile) =>
        scoreValue(profile, staffingScore(profile), staffingRationale(profile), profile.exhibits.find((exhibit) => exhibit.kind === "staffing_location_model")?.evidenceReference ?? "Staffing model exhibit"),
    },
    {
      id: "automation-credibility",
      label: "Automation/productivity credibility",
      weight: 10,
      guidance: "Score only when baseline, measurement method, year-by-year commitment, and commercial remedy are clear.",
      score: (profile) =>
        scoreValue(profile, automationScore(profile), automationRationale(profile), profile.extractionCards.find((card) => card.type === "productivity")?.evidenceReference ?? "Productivity commitment exhibit"),
    },
    {
      id: "pricing-transparency",
      label: "Pricing transparency",
      weight: 8,
      guidance: "Score workbook clarity, pass-through caps, optional scope, and apples-to-apples comparability.",
      score: (profile) =>
        scoreValue(profile, pricingTransparencyScore(profile), pricingTransparencyRationale(profile), profile.exhibits.find((exhibit) => exhibit.kind === "pricing_workbook")?.evidenceReference ?? "Pricing workbook"),
    },
    {
      id: "risk-exceptions",
      label: "Risk and commercial exceptions",
      weight: 8,
      guidance: "Score assumptions, exclusions, redlines, and buyer-risk transfer.",
      score: (profile) =>
        scoreValue(profile, riskExceptionScore(profile), riskExceptionRationale(profile), profile.exhibits.find((exhibit) => exhibit.kind === "commercial_exceptions")?.evidenceReference ?? "Commercial exceptions table"),
    },
    {
      id: "evidence-completeness",
      label: "Evidence completeness",
      weight: 6,
      guidance: "Score section completeness, exhibits, and unresolved unsupported claims.",
      score: (profile) =>
        scoreValue(profile, evidenceScore(profile), evidenceRationale(profile), `${profile.responseCompleteness.completeSections}/${profile.responseCompleteness.totalSections} sections and ${profile.exhibits.length} exhibits checked`),
    },
  ];

  return criteria.map((criterion) => ({
    criterionId: criterion.id,
    label: criterion.label,
    weight: criterion.weight,
    guidance: criterion.guidance,
    scores: profiles.map(criterion.score),
  }));
}

function scoreValue(
  profile: VendorResponseProfile,
  score: number,
  rationale: string,
  evidenceLabel: string,
): VendorEvaluationScoreValue {
  return {
    vendorId: profile.vendorId,
    vendorName: profile.vendorName,
    score,
    rationale,
    evidenceLabel,
    confidence:
      profile.readyForEvaluation === "yes"
        ? "high"
        : profile.readyForEvaluation === "conditional"
          ? "medium"
          : "low",
  };
}

function buildEvaluationVendorSummaries(args: {
  profiles: VendorResponseProfile[];
  scorecardRows: VendorEvaluationScorecardRow[];
  intelligence?: VendorChallengeIntelligence | null;
  bafoPack?: VendorBafoInstructionPack | null;
}): VendorEvaluationVendorSummary[] {
  const totals = args.profiles.map((profile) => {
    const weightedScore = weightedVendorScore(profile.vendorId, args.scorecardRows);
    const openChallenges =
      args.intelligence?.challengeLog.filter(
        (challenge) => challenge.vendorId === profile.vendorId,
      ) ?? [];
    const bafoInstruction =
      args.bafoPack?.vendorInstructions.find(
        (instruction) => instruction.vendorId === profile.vendorId,
      ) ?? null;
    return {
      profile,
      weightedScore,
      openChallenges,
      bafoInstruction,
    };
  });
  const rankByVendor = new Map(
    [...totals]
      .sort((a, b) => b.weightedScore - a.weightedScore)
      .map((entry, index) => [entry.profile.vendorId, index + 1]),
  );

  return totals.map(({ profile, weightedScore, openChallenges, bafoInstruction }) => {
    const recommendation = recommendationForVendor(profile);
    return {
      vendorId: profile.vendorId,
      vendorName: profile.vendorName,
      rank: rankByVendor.get(profile.vendorId) ?? totals.length,
      weightedScore,
      readiness: profile.readyForEvaluation,
      recommendation,
      decisionRationale: decisionRationale(profile, weightedScore),
      tradeoffs: tradeoffsForVendor(profile),
      conditions: [
        ...(bafoInstruction?.mustResolveBeforeScoring ?? []),
        ...openChallenges
          .filter((challenge) => challenge.severity === "high")
          .map((challenge) => challenge.clarificationQuestion),
      ].slice(0, 4),
    };
  });
}

function weightedVendorScore(
  vendorId: string,
  scorecardRows: VendorEvaluationScorecardRow[],
): number {
  const totalWeight = scorecardRows.reduce((sum, row) => sum + row.weight, 0);
  const score = scorecardRows.reduce((sum, row) => {
    const value = row.scores.find((candidate) => candidate.vendorId === vendorId);
    return sum + (value?.score ?? 0) * (row.weight / totalWeight);
  }, 0);
  return Math.round(score * 10) / 10;
}

function recommendationForVendor(
  profile: VendorResponseProfile,
): VendorEvaluationRecommendation {
  if (profile.vendorId.includes("scale")) return "advance_with_conditions";
  if (profile.vendorId.includes("incumbent")) return "advance_to_bafo";
  return "advance_with_conditions";
}

function decisionRationale(profile: VendorResponseProfile, score: number): string {
  if (profile.vendorId.includes("incumbent")) {
    return `Risk-adjusted leader at ${score.toFixed(1)}/10 because continuity, scope coverage, and transition confidence outweigh its weaker commercial remedies.`;
  }
  if (profile.vendorId.includes("scale")) {
    return `Lowest-cost challenger at ${score.toFixed(1)}/10, but coverage staffing, retained effort, and productivity economics must close before the price advantage can be trusted.`;
  }
  return `Service-quality specialist at ${score.toFixed(1)}/10 with strong SLA economics, but scope and transition caveats must be normalized before it can lead.`;
}

function tradeoffsForVendor(profile: VendorResponseProfile): string[] {
  if (profile.vendorId.includes("incumbent")) {
    return [
      "Best continuity and transition risk posture.",
      "Needs stronger productivity price-down, SLA credit economics, and transition fee holdbacks.",
    ];
  }
  if (profile.vendorId.includes("scale")) {
    return [
      "Best apparent normalized TCO.",
      "Highest execution risk because productivity, staffing coverage, and retained-client effort remain conditional.",
    ];
  }
  return [
    "Best SLA remedy posture and clean evidence discipline.",
    "Narrower base scope and slower transition make the headline price less directly comparable.",
  ];
}

function money(value: number | null): string {
  if (value === null) return "Not provided";
  return `$${(value / 1_000_000).toFixed(1)}M`;
}

function commercialScore(profile: VendorResponseProfile): number {
  if (profile.vendorId.includes("scale")) return 8.4;
  if (profile.vendorId.includes("specialist")) return 7.2;
  return 6.9;
}

function commercialRationale(profile: VendorResponseProfile): string {
  if (profile.vendorId.includes("scale")) {
    return "Lowest apparent TCO, with pass-through and retained-effort caveats.";
  }
  if (profile.vendorId.includes("specialist")) {
    return "Middle TCO, but optional corporate support must be normalized.";
  }
  return "Highest TCO, offset by stronger continuity and incumbent knowledge.";
}

function scopeFitScore(profile: VendorResponseProfile): number {
  if (profile.vendorId.includes("incumbent")) return 8.2;
  if (profile.vendorId.includes("scale")) return 6.6;
  return 6.4;
}

function scopeFitRationale(profile: VendorResponseProfile): string {
  if (profile.vendorId.includes("incumbent")) {
    return "Strongest match to AMS scope and retained-team boundary.";
  }
  if (profile.vendorId.includes("scale")) {
    return "Broad scope story, but retained obligations and tower mapping need clarification.";
  }
  return "Good operational service fit, with corporate shared-services scope conditional.";
}

function slaScore(profile: VendorResponseProfile): number {
  if (profile.vendorId.includes("specialist")) return 8.8;
  if (profile.vendorId.includes("scale")) return 7.4;
  return 7.1;
}

function slaRationale(profile: VendorResponseProfile): string {
  if (profile.vendorId.includes("specialist")) {
    return "Strongest service-credit economics and chronic-miss posture.";
  }
  if (profile.vendorId.includes("scale")) {
    return "Complete SLA framework, but coverage staffing must prove it is executable.";
  }
  return "Clear targets, but credit cap is too light for critical operations.";
}

function transitionScore(profile: VendorResponseProfile): number {
  if (profile.vendorId.includes("incumbent")) return 8.0;
  if (profile.vendorId.includes("specialist")) return 6.5;
  return 5.9;
}

function transitionRationale(profile: VendorResponseProfile): string {
  if (profile.vendorId.includes("incumbent")) {
    return "Lowest practical transition risk, but fee timing should move behind accepted milestones.";
  }
  if (profile.vendorId.includes("specialist")) {
    return "Lower transition cost, with slower stabilization than the buyer target.";
  }
  return "Detailed plan, but client SME dependency and coverage proof create execution risk.";
}

function staffingScore(profile: VendorResponseProfile): number {
  if (profile.vendorId.includes("incumbent")) return 8.0;
  if (profile.vendorId.includes("specialist")) return 7.7;
  return 5.6;
}

function staffingRationale(profile: VendorResponseProfile): string {
  if (profile.vendorId.includes("scale")) {
    return "24x7 claim is not reconciled to role, shift, and location tables.";
  }
  return "Staffing model is usable for evaluation, with BAFO refinements still needed.";
}

function automationScore(profile: VendorResponseProfile): number {
  if (profile.vendorId.includes("specialist")) return 6.8;
  if (profile.vendorId.includes("incumbent")) return 6.2;
  return 5.3;
}

function automationRationale(profile: VendorResponseProfile): string {
  if (profile.vendorId.includes("scale")) {
    return "Largest claim, but baseline and price-down mechanism are missing.";
  }
  if (profile.vendorId.includes("incumbent")) {
    return "Credible operational story, only partially priced back.";
  }
  return "More modest automation claim, with better measurement discipline.";
}

function pricingTransparencyScore(profile: VendorResponseProfile): number {
  if (profile.vendorId.includes("incumbent")) return 7.1;
  if (profile.vendorId.includes("scale")) return 6.0;
  return 6.5;
}

function pricingTransparencyRationale(profile: VendorResponseProfile): string {
  if (profile.vendorId.includes("scale")) {
    return "Workbook exists, but pass-throughs and retained effort need caps and normalization.";
  }
  if (profile.vendorId.includes("specialist")) {
    return "Workbook is complete, but optional corporate tower pricing affects comparability.";
  }
  return "Workbook is complete, with transition fee timing as the main commercial caveat.";
}

function riskExceptionScore(profile: VendorResponseProfile): number {
  if (profile.vendorId.includes("incumbent")) return 7.0;
  if (profile.vendorId.includes("specialist")) return 6.4;
  return 5.6;
}

function riskExceptionRationale(profile: VendorResponseProfile): string {
  if (profile.vendorId.includes("scale")) {
    return "Retained responsibilities and demand volatility exceptions shift risk back to the buyer.";
  }
  if (profile.vendorId.includes("specialist")) {
    return "ERP, rationalization, and corporate support exceptions require executive disposition.";
  }
  return "A smaller set of buyer-risk exceptions remains for BAFO cleanup.";
}

function evidenceScore(profile: VendorResponseProfile): number {
  if (profile.vendorId.includes("incumbent")) return 8.0;
  if (profile.vendorId.includes("specialist")) return 8.2;
  return 6.2;
}

function evidenceRationale(profile: VendorResponseProfile): string {
  if (profile.vendorId.includes("scale")) {
    return "Response is broad, but several critical claims are only partially in structured exhibits.";
  }
  return "Evidence package is complete enough for conditional scoring with named caveats.";
}

function groupByVendor<T extends { vendorId: string }>(items: T[]): Map<string, T[]> {
  const grouped = new Map<string, T[]>();
  for (const item of items) {
    const bucket = grouped.get(item.vendorId) ?? [];
    bucket.push(item);
    grouped.set(item.vendorId, bucket);
  }
  return grouped;
}

function bafoInstructionForVendor(
  vendorId: string,
  challenges: VendorChallengeLogEntry[],
  seeds: CommercialLeverageSeed[],
): VendorBafoVendorInstruction {
  const vendorName =
    challenges[0]?.vendorName ?? seeds[0]?.vendorName ?? "Vendor";
  const seedByType = new Map(seeds.map((seed) => [seed.leverType, seed]));
  const questions = challenges.map((challenge, index) => {
    const seed =
      seedByType.get(leverTypeForChallenge(challenge)) ??
      seeds[index] ??
      leverageSeedFromChallenge(challenge, index);
    return bafoQuestionFromChallenge(challenge, seed, index);
  });
  const priority: VendorBafoVendorInstruction["priority"] = questions.some(
    (question) => question.priority === "must_resolve",
  )
    ? "high"
    : questions.length > 1
      ? "medium"
      : "low";

  return {
    vendorId,
    vendorName,
    readyForEvaluation:
      challenges.find((challenge) => challenge.readyForEvaluation !== "yes")
        ?.readyForEvaluation ?? "yes",
    priority,
    instructionCount: questions.length,
    mustResolveBeforeScoring: questions
      .filter((question) => question.priority === "must_resolve")
      .map((question) => question.scoringDisposition),
    questions,
  };
}

function bafoQuestionFromChallenge(
  challenge: VendorChallengeLogEntry,
  seed: CommercialLeverageSeed,
  index: number,
): VendorBafoQuestion {
  return {
    questionId: `BAFO-${challenge.vendorId.replace(/^vendor-/, "").toUpperCase()}-${String(index + 1).padStart(2, "0")}`,
    vendorId: challenge.vendorId,
    vendorName: challenge.vendorName,
    priority: challenge.severity === "high" ? "must_resolve" : "should_improve",
    category: challenge.issueCategory.replaceAll("_", " "),
    question: seed.bafoLanguage,
    requiredResponseFormat: requiredResponseFormatForLever(seed.leverType),
    evidenceLabel: challenge.evidenceLabel,
    buyerRisk: seed.buyerRisk,
    scoringDisposition: challenge.scoringImplication,
    sourceChallengeId: challenge.challengeId,
    sourceLeverageSeedId: seed.seedId,
  };
}

function requiredResponseFormatForLever(
  type: CommercialLeverageSeed["leverType"],
): string {
  switch (type) {
    case "productivity_not_priced_back":
      return "Baseline volume + committed % by year + price-down or gainshare schedule + remedy.";
    case "support_not_staffed":
      return "Role/FTE/shift/location table + named critical-app coverage + exception list.";
    case "transition_fee_not_milestone_based":
      return "Revised transition fee schedule tied to KT, cutover, stabilization, and acceptance milestones.";
    case "weak_sla_credit_economics":
      return "Updated SLA credit cap, chronic-miss escalator, earn-back limits, and reporting cadence.";
    case "pricing_not_comparable":
      return "Normalized included/excluded scope table + optional/pass-through pricing + buyer-retained effort.";
    case "vague_exclusions_change_order_exposure":
      return "Assumption/exclusion disposition: removed, priced, or buyer-accepted with quantified impact.";
    case "commercial_exception_buyer_risk":
      return "Exception disposition table with redline, pricing impact, and executive decision flag.";
    case "rate_card_or_staffing_mix_issue":
      return "Role-level rate card + pyramid/location mix + substitution and escalation rules.";
    case "outcome_claim_not_committed":
    case "proposal_claim_not_supported":
    default:
      return "Claim register update with evidence, owner, measure, due date, and contractual remedy.";
  }
}

function shouldChallengeCard(card: VendorExtractionCard): boolean {
  return (
    card.structuredExhibitStatus !== "supported" ||
    card.missingFields.length > 0 ||
    /not fully|not backed|not staffed|weak|front-loaded|optional|exclusion|risk|slower|not comparable|commercial/i.test(
      `${card.title} ${card.finding} ${card.recommendedAction}`,
    )
  );
}

function challengeFromCard(
  profile: VendorResponseProfile,
  card: VendorExtractionCard,
  index: number,
): VendorChallengeLogEntry {
  const issueCategory = issueCategoryForCard(card);
  const severity = severityForCard(card, profile);
  return {
    challengeId: `${profile.vendorId}-challenge-${String(index + 1).padStart(2, "0")}`,
    vendorId: profile.vendorId,
    vendorName: profile.vendorName,
    issueCategory,
    finding: card.finding,
    evidenceLabel: card.evidenceReference ?? "Evidence not provided in the MVE profile",
    severity,
    whyItMatters: whyItMatters(issueCategory),
    clarificationQuestion: clarificationQuestionForCard(card),
    scoringImplication: scoringImplicationForCard(card, issueCategory),
    readyForEvaluation: profile.readyForEvaluation,
  };
}

function issueCategoryForCard(
  card: VendorExtractionCard,
): VendorChallengeIssueCategory {
  if (card.type === "productivity") return "productivity_gap";
  if (card.type === "pricing") return "pricing_gap";
  if (card.type === "sla") return "sla_gap";
  if (card.type === "staffing") return "staffing_coverage_gap";
  if (card.type === "transition") return "transition_gap";
  if (card.type === "assumption") return "assumption_exclusion_risk";
  if (card.type === "exception") return "commercial_exception";
  if (card.type === "claim") return "unsupported_claim";
  return card.structuredExhibitStatus === "missing"
    ? "evidence_missing"
    : "unsupported_claim";
}

function severityForCard(
  card: VendorExtractionCard,
  profile: VendorResponseProfile,
): VendorChallengeLogEntry["severity"] {
  if (
    card.structuredExhibitStatus === "missing" ||
    profile.readyForEvaluation === "no" ||
    /not staffed|not commercially|not comparable|buyer-risk|change-order|SLA cap|retained responsibilities/i.test(
      `${card.title} ${card.finding}`,
    )
  ) {
    return "high";
  }
  if (
    card.structuredExhibitStatus === "partial" ||
    card.missingFields.length > 0 ||
    profile.readyForEvaluation === "conditional"
  ) {
    return "medium";
  }
  return "low";
}

function whyItMatters(issueCategory: VendorChallengeIssueCategory): string {
  switch (issueCategory) {
    case "productivity_gap":
      return "The buyer may not receive the economic benefit of the vendor's productivity story unless it is backed by baseline, measurement, and commercial credit.";
    case "pricing_gap":
      return "Pricing that cannot be normalized can distort TCO, evaluation scoring, and BAFO leverage.";
    case "sla_gap":
      return "Weak remedies reduce accountability on services that matter to airline operations.";
    case "staffing_coverage_gap":
      return "Coverage claims without staffing detail create operational risk after transition.";
    case "transition_gap":
      return "Transition economics and milestones need to protect the buyer during knowledge transfer, cutover, and stabilization.";
    case "assumption_exclusion_risk":
      return "Assumptions can move cost, effort, or delivery risk back to the buyer after award.";
    case "commercial_exception":
      return "Commercial exceptions can weaken the buyer's contracted position even when the proposal reads well.";
    case "scope_coverage_gap":
      return "Scope gaps make vendor comparisons unreliable and can create post-award change orders.";
    case "evidence_missing":
      return "The evaluation team should not score the claim as proven until supporting evidence is supplied.";
    case "unsupported_claim":
    default:
      return "A sourcing claim should not influence scoring or negotiation unless it is supported by a structured exhibit or citation.";
  }
}

function clarificationQuestionForCard(card: VendorExtractionCard): string {
  const missing = card.missingFields.length
    ? ` Include ${card.missingFields.join(", ")}.`
    : "";
  return `${card.recommendedAction}${missing}`.trim();
}

function scoringImplicationForCard(
  card: VendorExtractionCard,
  issueCategory: VendorChallengeIssueCategory,
): string {
  if (issueCategory === "productivity_gap") {
    return "Do not give full automation/productivity scoring credit until the economics are contractually committed.";
  }
  if (issueCategory === "staffing_coverage_gap") {
    return "Treat coverage as conditional until staffing, location, and shift evidence reconcile to the support model.";
  }
  if (issueCategory === "sla_gap") {
    return "Score SLA quality separately from SLA economics until the credit cap and chronic-miss terms are improved.";
  }
  if (issueCategory === "commercial_exception") {
    return "Evaluate only after the exception is accepted, priced, or removed.";
  }
  if (card.structuredExhibitStatus === "supported") {
    return "Can be scored with caveats if the buyer accepts the stated tradeoff.";
  }
  return "Treat as conditional before evaluation scoring.";
}

function leverageSeedFromChallenge(
  challenge: VendorChallengeLogEntry,
  index: number,
): CommercialLeverageSeed {
  const leverType = leverTypeForChallenge(challenge);
  return {
    seedId: `${challenge.vendorId}-leverage-${String(index + 1).padStart(2, "0")}`,
    vendorId: challenge.vendorId,
    vendorName: challenge.vendorName,
    leverType,
    finding: challenge.finding,
    evidenceLabel: challenge.evidenceLabel,
    buyerRisk: buyerRiskForLever(leverType),
    recommendedAsk: recommendedAskForLever(leverType),
    bafoLanguage: bafoLanguageForLever(leverType, challenge),
    confidence: challenge.severity === "high" ? "high" : "medium",
    estimatedImpact: estimatedImpactForLever(leverType),
  };
}

function leverTypeForChallenge(
  challenge: VendorChallengeLogEntry,
): CommercialLeverageSeed["leverType"] {
  switch (challenge.issueCategory) {
    case "productivity_gap":
      return "productivity_not_priced_back";
    case "transition_gap":
      return "transition_fee_not_milestone_based";
    case "sla_gap":
      return "weak_sla_credit_economics";
    case "staffing_coverage_gap":
      return "support_not_staffed";
    case "pricing_gap":
      return "pricing_not_comparable";
    case "assumption_exclusion_risk":
      return "vague_exclusions_change_order_exposure";
    case "commercial_exception":
      return "commercial_exception_buyer_risk";
    case "scope_coverage_gap":
      return "pricing_not_comparable";
    case "evidence_missing":
      return "proposal_claim_not_supported";
    case "unsupported_claim":
    default:
      return "outcome_claim_not_committed";
  }
}

function buyerRiskForLever(type: CommercialLeverageSeed["leverType"]): string {
  switch (type) {
    case "productivity_not_priced_back":
      return "Transformation upside remains with the vendor unless savings are priced back or gainshared.";
    case "transition_fee_not_milestone_based":
      return "Buyer pays before knowledge transfer, cutover, and stabilization outcomes are accepted.";
    case "weak_sla_credit_economics":
      return "Operational misses may be cheaper for the vendor than service recovery.";
    case "support_not_staffed":
      return "The promised operating model may fail during peak or 24x7 coverage windows.";
    case "pricing_not_comparable":
      return "Evaluation may select the wrong vendor because cost scope is not apples-to-apples.";
    case "vague_exclusions_change_order_exposure":
      return "Post-award change orders may absorb expected savings.";
    case "rate_card_or_staffing_mix_issue":
      return "The delivery economics may depend on an unstated or unstable role mix.";
    case "commercial_exception_buyer_risk":
      return "Contract protections may be weaker than the proposal narrative implies.";
    case "outcome_claim_not_committed":
    case "proposal_claim_not_supported":
    default:
      return "The proposal can influence perception without creating a binding delivery obligation.";
  }
}

function recommendedAskForLever(type: CommercialLeverageSeed["leverType"]): string {
  switch (type) {
    case "productivity_not_priced_back":
      return "Require a year-by-year productivity credit or gainshare schedule tied to baseline volume and automation delivery.";
    case "transition_fee_not_milestone_based":
      return "Put a meaningful portion of transition fees at risk behind accepted KT, cutover, and stabilization milestones.";
    case "weak_sla_credit_economics":
      return "Increase service-credit caps, add chronic-miss escalators, and limit earn-back rights for critical services.";
    case "support_not_staffed":
      return "Require a shift, location, and FTE coverage table that reconciles to 24x7 and critical-app commitments.";
    case "pricing_not_comparable":
      return "Normalize all optional, pass-through, retained-effort, and excluded-scope costs before scoring.";
    case "vague_exclusions_change_order_exposure":
      return "Convert vague exclusions into priced, accepted, or removed positions before BAFO.";
    case "commercial_exception_buyer_risk":
      return "Require the vendor to remove, price, or explicitly flag each buyer-risk exception for executive decision.";
    case "rate_card_or_staffing_mix_issue":
      return "Require role-level rate card, pyramid, location mix, and substitution rules.";
    case "outcome_claim_not_committed":
    case "proposal_claim_not_supported":
    default:
      return "Require the claim to be added to the vendor claim register with evidence, owner, measure, and remedy.";
  }
}

function bafoLanguageForLever(
  type: CommercialLeverageSeed["leverType"],
  challenge: VendorChallengeLogEntry,
): string {
  if (type === "productivity_not_priced_back") {
    return "Please provide a year-by-year productivity credit schedule, including baseline volumes, automation use cases, measurement method, and financial credit if committed productivity is not achieved.";
  }
  if (type === "support_not_staffed") {
    return "Please reconcile the proposed coverage model to a staffing table by role, shift, location, and critical application tier.";
  }
  if (type === "transition_fee_not_milestone_based") {
    return "Please revise transition pricing so payment is tied to accepted knowledge transfer, cutover, stabilization, and exit criteria.";
  }
  if (type === "weak_sla_credit_economics") {
    return "Please improve service-credit economics for critical services, including cap, chronic-miss escalation, earn-back rules, and reporting cadence.";
  }
  return `Please address this BAFO issue before evaluation scoring: ${challenge.clarificationQuestion}`;
}

function estimatedImpactForLever(type: CommercialLeverageSeed["leverType"]): string {
  switch (type) {
    case "productivity_not_priced_back":
      return "Potential multi-year run-rate improvement if converted into price-down or gainshare.";
    case "transition_fee_not_milestone_based":
      return "Reduces transition cash-flow and delivery acceptance risk.";
    case "weak_sla_credit_economics":
      return "Improves operational accountability without inventing new savings.";
    case "support_not_staffed":
      return "Reduces service-failure and retained-team backfill risk.";
    case "pricing_not_comparable":
      return "Improves TCO comparability before executive decision.";
    default:
      return "Qualitative negotiation leverage; value depends on vendor BAFO response.";
  }
}
