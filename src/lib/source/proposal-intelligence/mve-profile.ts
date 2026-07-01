import type {
  VendorExtractionCard,
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
