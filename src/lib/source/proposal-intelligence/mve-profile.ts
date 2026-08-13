import type {
  CommercialLeverageSeed,
  VendorBafoInstructionPack,
  VendorBafoQuestion,
  VendorBafoVendorInstruction,
  VendorEvaluationComparisonRow,
  VendorEvaluationDecisionView,
  VendorEvaluationRecommendation,
  VendorEvaluationScoreImpact,
  VendorEvaluationScorecardRow,
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
import {
  scoreCriterionFromEvidence,
  weightedScoreOverScorable,
  type CriterionEvidenceSpec,
} from "./evidence-scoring";

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
      {
        sectionNumber: 1,
        rfpSection: "Executive Summary",
        page: "pp. 1-5",
        status: "complete",
        notes: "Clear continuity thesis and incumbent risk posture.",
      },
      {
        sectionNumber: 2,
        rfpSection: "Scope Understanding",
        page: "pp. 6-11",
        status: "complete",
        notes: "Matches AMS scope and retained-team boundary.",
      },
      {
        sectionNumber: 3,
        rfpSection: "Service Delivery Model",
        page: "pp. 12-19",
        status: "complete",
        notes:
          "Run model is mature and airline-critical apps are named by tower.",
      },
      {
        sectionNumber: 4,
        rfpSection: "Application Support Model",
        page: "pp. 20-29",
        status: "complete",
        notes: "L1/L2/L3 split is described with tooling cadence.",
      },
      {
        sectionNumber: 5,
        rfpSection: "Airline Operations Support",
        page: "pp. 30-38",
        status: "complete",
        notes: "Good IROPS and airport operations coverage.",
      },
      {
        sectionNumber: 6,
        rfpSection: "Corporate Shared Services Support",
        page: "pp. 39-45",
        status: "complete",
        notes: "Finance and HR support model included.",
      },
      {
        sectionNumber: 7,
        rfpSection: "Transition Plan",
        page: "pp. 46-58",
        status: "partial",
        notes:
          "Milestones exist, but transition fee is not sufficiently at-risk.",
      },
      {
        sectionNumber: 8,
        rfpSection: "Staffing Model",
        page: "pp. 59-65",
        status: "complete",
        notes: "Named role pyramid and follow-the-sun coverage.",
      },
      {
        sectionNumber: 9,
        rfpSection: "SLA Commitments",
        page: "pp. 66-72",
        status: "partial",
        notes: "Targets are clear; service-credit cap remains weak.",
      },
      {
        sectionNumber: 10,
        rfpSection: "Automation / Productivity",
        page: "pp. 73-80",
        status: "partial",
        notes:
          "Narrative claims 18% productivity, but pricing credit is only partial.",
      },
      {
        sectionNumber: 11,
        rfpSection: "Governance",
        page: "pp. 81-84",
        status: "complete",
        notes: "QBR, operational review, and escalation cadence included.",
      },
      {
        sectionNumber: 12,
        rfpSection: "Security / Compliance",
        page: "pp. 85-88",
        status: "complete",
        notes: "SOC, incident, and data-handling controls included.",
      },
      {
        sectionNumber: 13,
        rfpSection: "Pricing",
        page: "Workbook",
        status: "complete",
        notes:
          "Workbook provided; normalization adjustment required for transition fee.",
      },
      {
        sectionNumber: 14,
        rfpSection: "Assumptions / Exclusions",
        page: "Appendix B",
        status: "complete",
        notes: "Buyer dependency list is explicit.",
      },
      {
        sectionNumber: 15,
        rfpSection: "Exceptions",
        page: "Appendix C",
        status: "exception",
        notes:
          "Exceptions include transition payment timing and SLA credit cap.",
      },
    ]),
    exhibits: exhibits([
      {
        kind: "claim_register",
        label: "Vendor Claim Register",
        status: "complete",
        evidenceReference: "Vendor A Exhibit CR-1",
        issue: null,
      },
      {
        kind: "productivity_commitments",
        label: "Automation/Productivity Commitment Table",
        status: "partial",
        evidenceReference: "Vendor A Exhibit AP-1",
        issue: "18% narrative claim only returns 8% as contractual price-down.",
      },
      {
        kind: "pricing_workbook",
        label: "Pricing Workbook",
        status: "complete",
        evidenceReference: "Vendor A Pricing Workbook v1",
        issue: "Transition fee is front-loaded.",
      },
      {
        kind: "staffing_location_model",
        label: "Staffing and Location Model",
        status: "complete",
        evidenceReference: "Vendor A Exhibit SL-1",
        issue: null,
      },
      {
        kind: "sla_commitments",
        label: "SLA Commitment Table",
        status: "partial",
        evidenceReference: "Vendor A Exhibit SLA-1",
        issue: "Service credits capped at 4% of monthly fee.",
      },
      {
        kind: "assumptions_exclusions",
        label: "Assumptions and Exclusions Log",
        status: "complete",
        evidenceReference: "Vendor A Appendix B",
        issue: null,
      },
      {
        kind: "transition_milestones",
        label: "Transition Milestone Plan",
        status: "partial",
        evidenceReference: "Vendor A Exhibit TP-1",
        issue: "Milestone acceptance not tied to enough transition fee.",
      },
      {
        kind: "commercial_exceptions",
        label: "Commercial Exceptions Table",
        status: "complete",
        evidenceReference: "Vendor A Appendix C",
        issue: "Two buyer-risk exceptions remain.",
      },
      {
        kind: "evidence_index",
        label: "Evidence Attachment Index",
        status: "complete",
        evidenceReference: "Vendor A Exhibit EI-1",
        issue: null,
      },
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
      card({
        vendorId: "vendor-a-incumbent-profile",
        n: 1,
        type: "productivity",
        title: "Productivity claim is only partially commercialized",
        extractedValue: "18% productivity by year 2; 8% priced back",
        evidenceReference: "Vendor A Narrative 10.2 + Exhibit AP-1",
        confidence: "high",
        structuredExhibitStatus: "partial",
        missingFields: ["full year-by-year price-down mechanism"],
        finding:
          "Operational automation story is stronger than the commercial commitment.",
        recommendedAction:
          "Require BAFO credit schedule for the remaining productivity delta.",
      }),
      card({
        vendorId: "vendor-a-incumbent-profile",
        n: 2,
        type: "sla",
        title: "SLA cap weakens service accountability",
        extractedValue:
          "P1 response and restoration targets present; service credits capped at 4%",
        evidenceReference: "Vendor A Exhibit SLA-1",
        confidence: "high",
        structuredExhibitStatus: "partial",
        missingFields: ["chronic miss multiplier", "earn-back restrictions"],
        finding:
          "SLA target is usable, but financial remedy is too light for airline-critical operations.",
        recommendedAction:
          "Ask for higher cap and chronic-miss escalator before scoring SLA economics.",
      }),
      card({
        vendorId: "vendor-a-incumbent-profile",
        n: 3,
        type: "transition",
        title: "Transition fee needs milestone linkage",
        extractedValue: "$4.8M transition cost; payment schedule front-loaded",
        evidenceReference: "Vendor A Pricing Workbook + Exhibit TP-1",
        confidence: "high",
        structuredExhibitStatus: "partial",
        missingFields: ["acceptance holdback"],
        finding:
          "Transition risk is lower than peers, but fee economics are vendor-protective.",
        recommendedAction:
          "Move at least 30% of transition fees behind accepted KT and stabilization milestones.",
      }),
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
      {
        sectionNumber: 1,
        rfpSection: "Executive Summary",
        page: "pp. 1-6",
        status: "complete",
        notes: "Strong transformation thesis.",
      },
      {
        sectionNumber: 2,
        rfpSection: "Scope Understanding",
        page: "pp. 7-14",
        status: "partial",
        notes:
          "Corporate shared services support is broad but retained obligations are unclear.",
      },
      {
        sectionNumber: 3,
        rfpSection: "Service Delivery Model",
        page: "pp. 15-24",
        status: "complete",
        notes: "Global delivery model is detailed.",
      },
      {
        sectionNumber: 4,
        rfpSection: "Application Support Model",
        page: "pp. 25-35",
        status: "partial",
        notes: "Application tower scope differs from the RFP baseline.",
      },
      {
        sectionNumber: 5,
        rfpSection: "Airline Operations Support",
        page: "pp. 36-44",
        status: "partial",
        notes: "IROPS coverage claim lacks staffed evidence.",
      },
      {
        sectionNumber: 6,
        rfpSection: "Corporate Shared Services Support",
        page: "pp. 45-52",
        status: "complete",
        notes: "Finance and HR towers included.",
      },
      {
        sectionNumber: 7,
        rfpSection: "Transition Plan",
        page: "pp. 53-67",
        status: "complete",
        notes: "Detailed plan, but heavy dependency on client SMEs.",
      },
      {
        sectionNumber: 8,
        rfpSection: "Staffing Model",
        page: "pp. 68-73",
        status: "partial",
        notes:
          "24x7 coverage claim not reconciled to named FTE/location table.",
      },
      {
        sectionNumber: 9,
        rfpSection: "SLA Commitments",
        page: "pp. 74-81",
        status: "complete",
        notes: "SLA framework is complete.",
      },
      {
        sectionNumber: 10,
        rfpSection: "Automation / Productivity",
        page: "pp. 82-93",
        status: "partial",
        notes: "22% productivity claim lacks baseline and pricing credit.",
      },
      {
        sectionNumber: 11,
        rfpSection: "Governance",
        page: "pp. 94-98",
        status: "complete",
        notes: "Governance structure included.",
      },
      {
        sectionNumber: 12,
        rfpSection: "Security / Compliance",
        page: "pp. 99-102",
        status: "complete",
        notes: "Security response complete.",
      },
      {
        sectionNumber: 13,
        rfpSection: "Pricing",
        page: "Workbook",
        status: "partial",
        notes: "Pricing is complete but tooling pass-throughs are not capped.",
      },
      {
        sectionNumber: 14,
        rfpSection: "Assumptions / Exclusions",
        page: "Appendix D",
        status: "exception",
        notes: "Retained-client workload assumptions are material.",
      },
      {
        sectionNumber: 15,
        rfpSection: "Exceptions",
        page: "Appendix E",
        status: "exception",
        notes: "Commercial exceptions shift runbook and demand-risk to buyer.",
      },
    ]),
    exhibits: exhibits([
      {
        kind: "claim_register",
        label: "Vendor Claim Register",
        status: "partial",
        evidenceReference: "Vendor B Exhibit CR-1",
        issue:
          "Automation claim appears in narrative but is incomplete in the register.",
      },
      {
        kind: "productivity_commitments",
        label: "Automation/Productivity Commitment Table",
        status: "partial",
        evidenceReference: "Vendor B Exhibit AP-1",
        issue: "No baseline ticket volume and no pricing credit.",
      },
      {
        kind: "pricing_workbook",
        label: "Pricing Workbook",
        status: "complete",
        evidenceReference: "Vendor B Pricing Workbook v1",
        issue: "Tooling pass-throughs uncapped.",
      },
      {
        kind: "staffing_location_model",
        label: "Staffing and Location Model",
        status: "partial",
        evidenceReference: "Vendor B Exhibit SL-1",
        issue: "24x7 claim not backed by location coverage table.",
      },
      {
        kind: "sla_commitments",
        label: "SLA Commitment Table",
        status: "complete",
        evidenceReference: "Vendor B Exhibit SLA-1",
        issue: null,
      },
      {
        kind: "assumptions_exclusions",
        label: "Assumptions and Exclusions Log",
        status: "complete",
        evidenceReference: "Vendor B Appendix D",
        issue: "Client SME dependency is broad.",
      },
      {
        kind: "transition_milestones",
        label: "Transition Milestone Plan",
        status: "complete",
        evidenceReference: "Vendor B Exhibit TP-1",
        issue: null,
      },
      {
        kind: "commercial_exceptions",
        label: "Commercial Exceptions Table",
        status: "complete",
        evidenceReference: "Vendor B Appendix E",
        issue: "Demand volatility exception creates change-order exposure.",
      },
      {
        kind: "evidence_index",
        label: "Evidence Attachment Index",
        status: "partial",
        evidenceReference: "Vendor B Exhibit EI-1",
        issue: "Case study evidence is not mapped to airline operations scope.",
      },
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
      card({
        vendorId: "vendor-b-scale-profile",
        n: 1,
        type: "productivity",
        title: "Automation claim is unsupported commercially",
        extractedValue: "22% productivity by year 2",
        evidenceReference: "Vendor B Narrative 10.1",
        confidence: "medium",
        structuredExhibitStatus: "partial",
        missingFields: [
          "baseline volume",
          "measurement method",
          "price-down mechanism",
        ],
        finding:
          "Productivity is a marketing claim until the exhibit and pricing workbook commit it.",
        recommendedAction:
          "Require baseline, use-case list, year-by-year impact, and BAFO pricing credit.",
      }),
      card({
        vendorId: "vendor-b-scale-profile",
        n: 2,
        type: "staffing",
        title: "24x7 coverage is not staffed",
        extractedValue: "24x7 follow-the-sun support asserted",
        evidenceReference: "Vendor B Narrative 5.4 + Exhibit SL-1",
        confidence: "medium",
        structuredExhibitStatus: "partial",
        missingFields: ["named location coverage", "FTE by shift"],
        finding: "Coverage claim is not backed by the staffing exhibit.",
        recommendedAction:
          "Request shift/FTE/location table before giving SLA coverage credit.",
      }),
      card({
        vendorId: "vendor-b-scale-profile",
        n: 3,
        type: "assumption",
        title: "Retained responsibilities may erode savings",
        extractedValue:
          "Client SMEs provide runbooks, triage support, and demand validation during first 120 days",
        evidenceReference: "Vendor B Appendix D",
        confidence: "high",
        structuredExhibitStatus: "supported",
        missingFields: ["client effort estimate"],
        finding:
          "Savings may be overstated unless retained-client effort is costed.",
        recommendedAction:
          "Ask for retained-role RACI and include retained effort in normalized TCO.",
      }),
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
      {
        sectionNumber: 1,
        rfpSection: "Executive Summary",
        page: "pp. 1-4",
        status: "complete",
        notes: "Focused service-quality thesis.",
      },
      {
        sectionNumber: 2,
        rfpSection: "Scope Understanding",
        page: "pp. 5-10",
        status: "partial",
        notes: "Narrower ERP and corporate shared-services coverage.",
      },
      {
        sectionNumber: 3,
        rfpSection: "Service Delivery Model",
        page: "pp. 11-18",
        status: "complete",
        notes: "Clear pod model.",
      },
      {
        sectionNumber: 4,
        rfpSection: "Application Support Model",
        page: "pp. 19-27",
        status: "partial",
        notes: "Application rationalization support is limited.",
      },
      {
        sectionNumber: 5,
        rfpSection: "Airline Operations Support",
        page: "pp. 28-35",
        status: "complete",
        notes: "Airline operational run coverage is strong.",
      },
      {
        sectionNumber: 6,
        rfpSection: "Corporate Shared Services Support",
        page: "pp. 36-40",
        status: "partial",
        notes: "Finance/HR/legal support requires optional addendum.",
      },
      {
        sectionNumber: 7,
        rfpSection: "Transition Plan",
        page: "pp. 41-52",
        status: "partial",
        notes: "Longer stabilization period than buyer target.",
      },
      {
        sectionNumber: 8,
        rfpSection: "Staffing Model",
        page: "pp. 53-58",
        status: "complete",
        notes: "Staffing table is complete.",
      },
      {
        sectionNumber: 9,
        rfpSection: "SLA Commitments",
        page: "pp. 59-64",
        status: "complete",
        notes: "Best SLA credit economics of the set.",
      },
      {
        sectionNumber: 10,
        rfpSection: "Automation / Productivity",
        page: "pp. 65-69",
        status: "partial",
        notes:
          "Modest automation claim with measurement, but no broad value upside.",
      },
      {
        sectionNumber: 11,
        rfpSection: "Governance",
        page: "pp. 70-72",
        status: "complete",
        notes: "Lean governance, higher buyer participation.",
      },
      {
        sectionNumber: 12,
        rfpSection: "Security / Compliance",
        page: "pp. 73-74",
        status: "complete",
        notes: "Security response complete.",
      },
      {
        sectionNumber: 13,
        rfpSection: "Pricing",
        page: "Workbook",
        status: "complete",
        notes:
          "Pricing workbook complete with optional corporate tower addendum.",
      },
      {
        sectionNumber: 14,
        rfpSection: "Assumptions / Exclusions",
        page: "Appendix A",
        status: "exception",
        notes: "ERP support and app rationalization have exclusions.",
      },
      {
        sectionNumber: 15,
        rfpSection: "Exceptions",
        page: "Appendix B",
        status: "exception",
        notes: "Corporate shared-services support is conditional.",
      },
    ]),
    exhibits: exhibits([
      {
        kind: "claim_register",
        label: "Vendor Claim Register",
        status: "complete",
        evidenceReference: "Vendor C Exhibit CR-1",
        issue: null,
      },
      {
        kind: "productivity_commitments",
        label: "Automation/Productivity Commitment Table",
        status: "complete",
        evidenceReference: "Vendor C Exhibit AP-1",
        issue: "Commitment is modest: 9% by year 3.",
      },
      {
        kind: "pricing_workbook",
        label: "Pricing Workbook",
        status: "complete",
        evidenceReference: "Vendor C Pricing Workbook v1",
        issue: "Corporate support priced as optional.",
      },
      {
        kind: "staffing_location_model",
        label: "Staffing and Location Model",
        status: "complete",
        evidenceReference: "Vendor C Exhibit SL-1",
        issue: null,
      },
      {
        kind: "sla_commitments",
        label: "SLA Commitment Table",
        status: "complete",
        evidenceReference: "Vendor C Exhibit SLA-1",
        issue: null,
      },
      {
        kind: "assumptions_exclusions",
        label: "Assumptions and Exclusions Log",
        status: "complete",
        evidenceReference: "Vendor C Appendix A",
        issue: "ERP and rationalization exclusions create scope risk.",
      },
      {
        kind: "transition_milestones",
        label: "Transition Milestone Plan",
        status: "partial",
        evidenceReference: "Vendor C Exhibit TP-1",
        issue: "Stabilization period extends beyond buyer target.",
      },
      {
        kind: "commercial_exceptions",
        label: "Commercial Exceptions Table",
        status: "complete",
        evidenceReference: "Vendor C Appendix B",
        issue: "Corporate support addendum exception.",
      },
      {
        kind: "evidence_index",
        label: "Evidence Attachment Index",
        status: "complete",
        evidenceReference: "Vendor C Exhibit EI-1",
        issue: null,
      },
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
      card({
        vendorId: "vendor-c-specialist-profile",
        n: 1,
        type: "sla",
        title: "SLA economics are strongest",
        extractedValue:
          "P1/P2 targets with 8% monthly service-credit cap and chronic miss escalation",
        evidenceReference: "Vendor C Exhibit SLA-1",
        confidence: "high",
        structuredExhibitStatus: "supported",
        missingFields: [],
        finding: "Service accountability is stronger than peers.",
        recommendedAction:
          "Preserve SLA economics if vendor remains in evaluation.",
      }),
      card({
        vendorId: "vendor-c-specialist-profile",
        n: 2,
        type: "exception",
        title: "Corporate support is not fully in base scope",
        extractedValue:
          "Finance, HR, and legal support require optional addendum",
        evidenceReference: "Vendor C Appendix B + Pricing Workbook",
        confidence: "high",
        structuredExhibitStatus: "supported",
        missingFields: ["final included/excluded tower decision"],
        finding:
          "Headline base price is not comparable until optional corporate support is normalized.",
        recommendedAction:
          "Either include the optional tower in normalized TCO or exclude it from all vendors.",
      }),
      card({
        vendorId: "vendor-c-specialist-profile",
        n: 3,
        type: "transition",
        title: "Transition timeline is slower",
        extractedValue: "Stabilization extends to 26 weeks",
        evidenceReference: "Vendor C Exhibit TP-1",
        confidence: "high",
        structuredExhibitStatus: "partial",
        missingFields: ["accelerated cutover option"],
        finding: "Lower transition cost comes with schedule risk.",
        recommendedAction:
          "Request accelerated transition option and price impact.",
      }),
    ],
  },
];

function isAmsVendorResponseMveEvent(
  event: VendorResponseProfileEventRef,
): boolean {
  const text = [event.id, event.code, event.name, event.accountName]
    .filter((value): value is string => Boolean(value))
    .join(" ")
    .toLowerCase();
  return (
    /\b(skyh|skyharbor)\b/.test(text) ||
    (/\b(lake|lakeshore)\b/.test(text) &&
      /\b(shared[- ]?services|ams|managed[- ]?services|application[- ]?managed)\b/.test(
        text,
      ))
  );
}

function tenantKeyForVendorResponseEvent(
  event: VendorResponseProfileEventRef,
): string {
  const text = [event.id, event.code, event.name, event.accountName]
    .filter((value): value is string => Boolean(value))
    .join(" ")
    .toLowerCase();
  if (/\b(lake|lakeshore)\b/.test(text)) return "lakeshore";
  if (/\b(skyh|skyharbor)\b/.test(text)) return "skyharbor-air";
  return "demo-ams";
}

function defaultEventNameForVendorResponseEvent(
  event: VendorResponseProfileEventRef,
): string {
  const text = [event.id, event.code, event.name, event.accountName]
    .filter((value): value is string => Boolean(value))
    .join(" ")
    .toLowerCase();
  if (/\b(lake|lakeshore)\b/.test(text)) {
    return "Lakeshore Shared Services AMS";
  }
  return "SkyHarbor AMS Outsourcing";
}

function adaptVendorPackageForEvent(
  pkg: VendorResponsePackageFixture,
  event: VendorResponseProfileEventRef,
): VendorResponsePackageFixture {
  const text = [event.id, event.code, event.name, event.accountName]
    .filter((value): value is string => Boolean(value))
    .join(" ")
    .toLowerCase();
  if (!/\b(lake|lakeshore)\b/.test(text)) {
    return { ...pkg, sourceEventId: event.id };
  }

  const adaptText = (value: string): string =>
    value
      .replace(
        /\bAirline Operations Support\b/g,
        "Corporate Shared Services Support",
      )
      .replace(
        /\bairline-critical apps\b/gi,
        "business-critical shared-services applications",
      )
      .replace(
        /\bairline-critical operations\b/gi,
        "shared-services operations",
      )
      .replace(
        /\bairline operations scope\b/gi,
        "corporate shared-services scope",
      )
      .replace(
        /\bIROPS and airport operations coverage\b/gi,
        "Finance, HR, Legal, Procurement, Treasury, and Compliance coverage",
      )
      .replace(/\bIROPS coverage claim\b/gi, "Shared-services coverage claim")
      .replace(
        /\bservices that matter to airline operations\b/gi,
        "business-critical shared services",
      );

  return {
    ...pkg,
    sourceEventId: event.id,
    tenantKey: "lakeshore",
    packageSummary: adaptText(pkg.packageSummary),
    sectionMap: pkg.sectionMap.map((section) => ({
      ...section,
      rfpSection: adaptText(section.rfpSection),
      notes: adaptText(section.notes),
    })),
    exhibits: pkg.exhibits.map((exhibit) => ({
      ...exhibit,
      issue: exhibit.issue ? adaptText(exhibit.issue) : exhibit.issue,
    })),
    pricingSummary: {
      ...pkg.pricingSummary,
      pricingBasis: adaptText(pkg.pricingSummary.pricingBasis),
    },
    extractionCards: pkg.extractionCards.map((card) => ({
      ...card,
      extractedValue: adaptText(card.extractedValue),
      finding: adaptText(card.finding),
      recommendedAction: adaptText(card.recommendedAction),
    })),
  };
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

function buildProfile(
  pkg: VendorResponsePackageFixture,
): VendorResponseProfile {
  const responseCompleteness = completeness(pkg.sectionMap);
  const partialOrMissingExhibits = pkg.exhibits.filter(
    (exhibit) => exhibit.status !== "complete" || exhibit.issue,
  );
  const unsupported = unsupportedClaims(pkg.extractionCards);
  const readyForEvaluation: VendorResponseProfile["readyForEvaluation"] =
    responseCompleteness.missingSections.length > 0 || unsupported.length >= 4
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
        ["claim", "productivity", "sla", "staffing"].includes(extraction.type),
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
  if (!isAmsVendorResponseMveEvent(event)) return null;
  const profiles = SKYHARBOR_VENDOR_PACKAGES.map((pkg) =>
    adaptVendorPackageForEvent(pkg, event),
  ).map(buildProfile);
  return {
    sourceEventId: event.id,
    tenantKey: tenantKeyForVendorResponseEvent(event),
    eventName: event.name ?? defaultEventNameForVendorResponseEvent(event),
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
  if (
    !intelligence?.challengeLog.length ||
    !intelligence.leverageSeeds.length
  ) {
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
  // Highest transition risk is the vendor with the lowest transition-readiness
  // score, which is itself derived from that vendor's transition exhibit and
  // transition extraction cards. Ranking by score rather than by array order
  // keeps the answer stable and explainable.
  const transitionRow = scorecardRows.find(
    (row) => row.criterionId === "transition-readiness",
  );
  const weakestTransition = transitionRow
    ? [...transitionRow.scores].sort((a, b) => a.score - b.score)[0]
    : null;
  const highestTransitionRisk =
    profiles.find(
      (profile) => profile.vendorId === weakestTransition?.vendorId,
    ) ??
    sorted.at(-1) ??
    profiles[0];

  return {
    sourceEventId: profileSet.sourceEventId,
    tenantKey: profileSet.tenantKey,
    generatedAt: profileSet.generatedAt,
    scoreBasis:
      "Default demo evaluation model derived from MVE profiles, challenge log, BAFO holdbacks, pricing summaries, SLA commitments, transition findings, assumptions, exceptions, and evidence completeness. Weighted scores are advisory and remain conditional until human reviewers validate BAFO evidence.",
    finalistRecommendation: buildFinalistRecommendation(vendorSummaries),
    scoringTransparency: [
      "Weighted total = sum of each criterion score multiplied by its weight; weights total 100%. Only criteria that have parsed evidence are included. A criterion with no evidence is excluded and its weight is spread across the rest, rather than scored as zero.",
      "Every criterion score is derived from the evidence it cites: the extraction cards of that type, the structured exhibit behind them, and the response section map. The rationale on each score names the drivers that moved it.",
      "Commercial value rewards lower normalized TCO only after pass-throughs, optional scope, retained effort, and transition costs are comparable.",
      "Execution-risk criteria can outweigh price when staffing, transition, SLA, scope, or exceptions remain conditional.",
      "A vendor can improve only by submitting cited BAFO exhibits that close the named scoring holdbacks.",
    ],
    vendorCount: profiles.length,
    comparisonRows: buildEvaluationComparisonRows(profiles),
    scorecardRows,
    vendorSummaries,
    scoreImprovementScenarios: buildScoreImprovementScenarios(
      vendorSummaries,
      profiles,
    ),
    executiveTradeoffs: buildExecutiveTradeoffs(
      vendorSummaries,
      cheapest ?? null,
    ),
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

/** Posture from the vendor's own structured exhibit for this dimension. */
function postureFromExhibit(
  profile: VendorResponseProfile,
  kind: VendorResponseExhibitStatus["kind"],
): VendorEvaluationComparisonRow["values"][number]["posture"] {
  const exhibit = profile.exhibits.find((item) => item.kind === kind);
  if (!exhibit) return "watch";
  if (exhibit.status === "missing") return "risk";
  if (exhibit.status === "complete" && !exhibit.issue) return "strength";
  return "watch";
}

/** Posture from where this vendor sits on a cost measure against the field. */
function postureFromCostRank(
  profile: VendorResponseProfile,
  profiles: VendorResponseProfile[],
  basis: (candidate: VendorResponseProfile) => number | null,
): VendorEvaluationComparisonRow["values"][number]["posture"] {
  const own = basis(profile);
  if (own === null) return "watch";
  const peers = profiles
    .map((candidate) => basis(candidate))
    .filter((value): value is number => value !== null);
  if (peers.length < 2) return "watch";
  if (own === Math.min(...peers)) return "strength";
  if (own === Math.max(...peers)) return "risk";
  return "watch";
}

/** The parsed finding for this dimension, so the caveat is vendor-specific. */
function caveatFromCard(
  profile: VendorResponseProfile,
  type: VendorExtractionCard["type"],
  fallback: string,
): string {
  const card = profile.extractionCards.find((item) => item.type === type);
  return card?.finding || fallback;
}

function buildEvaluationComparisonRows(
  profiles: VendorResponseProfile[],
): VendorEvaluationComparisonRow[] {
  return [
    comparisonRow(profiles, {
      id: "normalized-tco",
      label: "Normalized 5-year TCO",
      decisionUse:
        "Shows cost position after transition, optional, and one-time lines are visible.",
      value: (profile) => money(profile.pricingSummary.fiveYearTcoUsd),
      caveat: (profile) => profile.pricingSummary.pricingBasis,
      posture: (profile) =>
        postureFromCostRank(
          profile,
          profiles,
          (candidate) => candidate.pricingSummary.fiveYearTcoUsd,
        ),
      evidence: (profile) => profile.pricingSummary.pricingBasis,
    }),
    comparisonRow(profiles, {
      id: "year-one-run",
      label: "Year 1 run cost",
      decisionUse:
        "Separates ongoing run economics from transition and optional scope.",
      value: (profile) => money(profile.pricingSummary.yearOneRunCostUsd),
      caveat: (profile) =>
        caveatFromCard(profile, "pricing", profile.pricingSummary.pricingBasis),
      posture: (profile) =>
        postureFromCostRank(
          profile,
          profiles,
          (candidate) => candidate.pricingSummary.yearOneRunCostUsd,
        ),
      evidence: (profile) => profile.pricingSummary.pricingBasis,
    }),
    comparisonRow(profiles, {
      id: "transition-risk",
      label: "Transition risk",
      decisionUse:
        "Highlights whether transition commitments protect knowledge transfer, cutover, and stabilization.",
      value: (profile) => profile.transitionCommitments,
      caveat: (profile) =>
        caveatFromCard(
          profile,
          "transition",
          "No parsed transition finding for this vendor.",
        ),
      posture: (profile) =>
        postureFromExhibit(profile, "transition_milestones"),
      evidence: (profile) =>
        profile.extractionCards.find((card) => card.type === "transition")
          ?.evidenceReference ?? "Transition milestone exhibit",
    }),
    comparisonRow(profiles, {
      id: "sla-economics",
      label: "SLA economics",
      decisionUse:
        "Tests whether service promises carry operationally meaningful remedies.",
      value: (profile) => profile.slaCommitments,
      caveat: (profile) =>
        caveatFromCard(
          profile,
          "sla",
          "No parsed SLA finding for this vendor.",
        ),
      posture: (profile) => postureFromExhibit(profile, "sla_commitments"),
      evidence: (profile) =>
        profile.extractionCards.find((card) => card.type === "sla")
          ?.evidenceReference ?? "SLA commitment table",
    }),
    comparisonRow(profiles, {
      id: "automation-productivity",
      label: "Automation/productivity credibility",
      decisionUse:
        "Distinguishes automation narrative from priced, measured commitments.",
      value: (profile) => profile.productivityCommitment,
      caveat: (profile) =>
        caveatFromCard(
          profile,
          "productivity",
          "No parsed productivity finding for this vendor.",
        ),
      posture: (profile) =>
        postureFromExhibit(profile, "productivity_commitments"),
      evidence: (profile) =>
        profile.extractionCards.find((card) => card.type === "productivity")
          ?.evidenceReference ?? "Productivity commitment exhibit",
    }),
    comparisonRow(profiles, {
      id: "evaluation-readiness",
      label: "Evaluation readiness",
      decisionUse:
        "Summarizes whether the vendor can be scored now or only conditionally.",
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
    posture: (
      profile: VendorResponseProfile,
    ) => VendorEvaluationComparisonRow["values"][number]["posture"];
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

/**
 * Which parsed evidence backs each scorecard criterion. The score for a
 * criterion is derived only from the evidence listed here, and the citation
 * shown beside the score is taken from that same evidence.
 */
const CRITERION_EVIDENCE: Record<string, CriterionEvidenceSpec> = {
  "commercial-value": {
    cardTypes: ["pricing"],
    exhibitKinds: ["pricing_workbook"],
    claimPattern: /price|cost|saving|tco/i,
    costBasis: (profile) => profile.pricingSummary.fiveYearTcoUsd,
  },
  "scope-fit": {
    cardTypes: ["claim"],
    exhibitKinds: ["claim_register"],
    sectionPattern: /scope/i,
    claimPattern: /scope|tower|retained/i,
  },
  "service-sla-strength": {
    cardTypes: ["sla"],
    exhibitKinds: ["sla_commitments"],
    sectionPattern: /sla|service level/i,
    claimPattern: /sla|service level|credit|availability/i,
  },
  "transition-readiness": {
    cardTypes: ["transition"],
    exhibitKinds: ["transition_milestones"],
    sectionPattern: /transition/i,
    claimPattern: /transition|cutover|knowledge transfer/i,
  },
  "staffing-delivery": {
    cardTypes: ["staffing"],
    exhibitKinds: ["staffing_location_model"],
    sectionPattern: /staffing|delivery/i,
    claimPattern: /staffing|coverage|24x7|location|shift/i,
  },
  "automation-credibility": {
    cardTypes: ["productivity"],
    exhibitKinds: ["productivity_commitments"],
    sectionPattern: /automation|productivity/i,
    claimPattern: /automation|productivity|efficiency/i,
  },
  "pricing-transparency": {
    cardTypes: ["pricing"],
    exhibitKinds: ["pricing_workbook"],
    sectionPattern: /pricing/i,
    claimPattern: /pass-through|rate card|unit price|normali/i,
  },
  "risk-exceptions": {
    cardTypes: ["exception", "assumption"],
    exhibitKinds: ["commercial_exceptions", "assumptions_exclusions"],
    claimPattern: /exception|exclusion|assumption|risk/i,
  },
  "evidence-completeness": {
    cardTypes: [],
    exhibitKinds: ["evidence_index"],
    claimPattern: /evidence|reference|proof/i,
  },
};

function buildEvaluationScorecardRows(
  profiles: VendorResponseProfile[],
): VendorEvaluationScorecardRow[] {
  const criteria: Array<{
    id: string;
    label: string;
    weight: number;
    guidance: string;
  }> = [
    {
      id: "commercial-value",
      label: "Commercial value",
      weight: 18,
      guidance:
        "Score cost only after TCO, optional scope, pass-throughs, and retained effort are normalized.",
    },
    {
      id: "scope-fit",
      label: "Scope fit",
      weight: 14,
      guidance:
        "Score included scope, corporate tower coverage, application support boundaries, and exclusions.",
    },
    {
      id: "service-sla-strength",
      label: "Service and SLA strength",
      weight: 14,
      guidance:
        "Score service targets together with credit economics, chronic-miss handling, and reporting.",
    },
    {
      id: "transition-readiness",
      label: "Transition readiness",
      weight: 12,
      guidance:
        "Score KT, cutover, stabilization, milestone economics, and client dependency risk.",
    },
    {
      id: "staffing-delivery",
      label: "Staffing and delivery model",
      weight: 10,
      guidance:
        "Score role mix, shift coverage, location coverage, and critical application support.",
    },
    {
      id: "automation-credibility",
      label: "Automation/productivity credibility",
      weight: 10,
      guidance:
        "Score only when baseline, measurement method, year-by-year commitment, and commercial remedy are clear.",
    },
    {
      id: "pricing-transparency",
      label: "Pricing transparency",
      weight: 8,
      guidance:
        "Score unit rates, pass-throughs, optional scope, and change-order exposure.",
    },
    {
      id: "risk-exceptions",
      label: "Risk and exceptions",
      weight: 8,
      guidance:
        "Score assumptions, exclusions, and buyer-risk exceptions that shift obligation back to the buyer.",
    },
    {
      id: "evidence-completeness",
      label: "Evidence completeness",
      weight: 6,
      guidance:
        "Score section completeness, exhibits, and unresolved unsupported claims.",
    },
  ];

  return criteria.map((criterion) => {
    const spec = CRITERION_EVIDENCE[criterion.id];
    // Comparative criteria need the whole field, so gather peer values once.
    const peerCosts = spec.costBasis
      ? profiles
          .map((profile) => spec.costBasis?.(profile) ?? null)
          .filter((value): value is number => value !== null)
      : [];

    return {
      criterionId: criterion.id,
      label: criterion.label,
      weight: criterion.weight,
      guidance: criterion.guidance,
      scores: profiles.map((profile) => {
        const derived = scoreCriterionFromEvidence(profile, spec, peerCosts);
        return {
          vendorId: profile.vendorId,
          vendorName: profile.vendorName,
          score: derived.score,
          weightedContribution: derived.scorable
            ? weightedContribution(derived.score, criterion.weight)
            : 0,
          rationale: derived.rationale,
          evidenceLabel:
            derived.evidenceLabel ??
            (derived.scorable
              ? "Parsed response package"
              : "No parsed evidence for this criterion"),
          confidence: derived.confidence,
        };
      }),
    };
  });
}

function buildEvaluationVendorSummaries(args: {
  profiles: VendorResponseProfile[];
  scorecardRows: VendorEvaluationScorecardRow[];
  intelligence?: VendorChallengeIntelligence | null;
  bafoPack?: VendorBafoInstructionPack | null;
}): VendorEvaluationVendorSummary[] {
  const totals = args.profiles.map((profile) => {
    const weightedScore = weightedVendorScore(
      profile.vendorId,
      args.scorecardRows,
    );
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

  return totals.map(
    ({ profile, weightedScore, openChallenges, bafoInstruction }) => {
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
        finalistPosture: finalistPostureForVendor(profile),
      };
    },
  );
}

function weightedVendorScore(
  vendorId: string,
  scorecardRows: VendorEvaluationScorecardRow[],
): number {
  // A criterion with no parsed evidence is excluded and its weight is spread
  // across the rest, so a vendor is never penalized as if they had scored zero
  // on something we could not read.
  return weightedScoreOverScorable(
    scorecardRows.map((row) => {
      const value = row.scores.find(
        (candidate) => candidate.vendorId === vendorId,
      );
      return {
        weight: row.weight,
        score: value?.score ?? 0,
        scorable: Boolean(value && value.weightedContribution !== 0),
      };
    }),
  );
}

function recommendationForVendor(
  profile: VendorResponseProfile,
): VendorEvaluationRecommendation {
  // Derived from the vendor's own parsed readiness and unresolved claims, not
  // from which vendor they are.
  if (profile.readyForEvaluation === "no") return "hold_until_clarified";
  if (profile.unsupportedClaims.length > 2) return "hold_until_clarified";
  if (
    profile.readyForEvaluation === "yes" &&
    profile.unsupportedClaims.length === 0
  ) {
    return "advance_to_bafo";
  }
  return "advance_with_conditions";
}

function decisionRationale(
  profile: VendorResponseProfile,
  score: number,
): string {
  const openClaims = profile.unsupportedClaims.length;
  const partialExhibits = profile.exhibits.filter(
    (exhibit) => exhibit.status !== "complete",
  ).length;
  const missingSections = profile.responseCompleteness.missingSections.length;

  const strengths = profile.exhibits
    .filter((exhibit) => exhibit.status === "complete")
    .map((exhibit) => exhibit.label);
  const gaps = [
    openClaims > 0 ? `${openClaims} unsupported claim(s)` : null,
    partialExhibits > 0 ? `${partialExhibits} exhibit(s) not complete` : null,
    missingSections > 0 ? `${missingSections} missing section(s)` : null,
  ].filter((value): value is string => Boolean(value));

  const strengthText =
    strengths.length > 0
      ? `Complete evidence for ${strengths.slice(0, 2).join(" and ")}.`
      : "No criterion is fully evidenced yet.";
  const gapText =
    gaps.length > 0
      ? ` Outstanding before award: ${gaps.join(", ")}.`
      : " No outstanding evidence gaps.";

  return `Weighted ${score.toFixed(1)}/10 across evidenced criteria. ${strengthText}${gapText}`;
}

function finalistPostureForVendor(profile: VendorResponseProfile): string {
  const recommendation = recommendationForVendor(profile);
  if (recommendation === "hold_until_clarified") {
    return "Hold from preferred-finalist status until the named evidence gaps are closed at BAFO.";
  }
  if (recommendation === "advance_to_bafo") {
    return "Advance to BAFO: evidence is complete enough to score without caveats.";
  }
  return "Conditional finalist: advance only if the open exceptions and partial exhibits are normalized.";
}

/**
 * What a vendor's score could become if BAFO closes its named gaps.
 *
 * The headroom is recomputed, not asserted: every non-complete exhibit is
 * treated as complete and every missing card field as supplied, the scorecard
 * is scored again against that hypothetical package, and the difference is the
 * upside. The cure and the required evidence are the vendor's own parsed
 * recommended actions and missing fields.
 */
/** Advance/hold guidance built from each vendor's own derived recommendation. */
function buildFinalistRecommendation(
  summaries: VendorEvaluationVendorSummary[],
): string {
  if (summaries.length === 0) {
    return "No vendor packages have been parsed, so no finalist guidance can be given.";
  }
  const ranked = [...summaries].sort((a, b) => a.rank - b.rank);
  const advance = ranked.filter(
    (summary) => summary.recommendation === "advance_to_bafo",
  );
  const conditional = ranked.filter(
    (summary) => summary.recommendation === "advance_with_conditions",
  );
  const hold = ranked.filter(
    (summary) => summary.recommendation === "hold_until_clarified",
  );

  const parts: string[] = [];
  if (advance.length > 0) {
    parts.push(
      `Advance ${advance.map((summary) => summary.vendorName).join(", ")} to BAFO on current evidence.`,
    );
  }
  if (conditional.length > 0) {
    parts.push(
      `Advance ${conditional.map((summary) => summary.vendorName).join(", ")} only with the named conditions closed.`,
    );
  }
  if (hold.length > 0) {
    parts.push(
      `Hold ${hold.map((summary) => summary.vendorName).join(", ")} until the open evidence gaps are resolved.`,
    );
  }
  parts.push("Scoring remains human-owned; this guidance is advisory.");
  return parts.join(" ");
}

/** Executive tradeoffs stated from the derived ranking, not from assumed roles. */
function buildExecutiveTradeoffs(
  summaries: VendorEvaluationVendorSummary[],
  cheapest: VendorResponseProfile | null,
): string[] {
  if (summaries.length === 0) return [];
  const ranked = [...summaries].sort((a, b) => a.rank - b.rank);
  const leader = ranked[0];
  const tradeoffs: string[] = [];

  tradeoffs.push(
    `${leader.vendorName} leads on evidenced criteria at ${leader.weightedScore.toFixed(1)}/10. ${leader.decisionRationale}`,
  );

  if (cheapest && cheapest.vendorId !== leader.vendorId) {
    const cheapestSummary = ranked.find(
      (summary) => summary.vendorId === cheapest.vendorId,
    );
    tradeoffs.push(
      `${cheapest.vendorName} is lowest on normalized 5-year TCO but ranks ${cheapestSummary?.rank ?? "lower"} on evidenced criteria, so price and evidence do not point the same way.`,
    );
  }

  const held = ranked.filter(
    (summary) => summary.recommendation === "hold_until_clarified",
  );
  if (held.length > 0) {
    tradeoffs.push(
      `${held.map((summary) => summary.vendorName).join(", ")} cannot be scored without caveats until the named gaps close.`,
    );
  }

  tradeoffs.push(
    "The decision is whether the buyer accepts the leader's remaining conditions or forces them into BAFO commitments first.",
  );
  return tradeoffs;
}

function buildScoreImprovementScenarios(
  summaries: VendorEvaluationVendorSummary[],
  profiles: VendorResponseProfile[],
): VendorEvaluationScoreImpact[] {
  const cured = profiles.map(cureProfileGaps);
  const curedRows = buildEvaluationScorecardRows(cured);

  return summaries.map((summary) => {
    const profile = profiles.find(
      (candidate) => candidate.vendorId === summary.vendorId,
    );
    const potentialScore = weightedVendorScore(summary.vendorId, curedRows);

    const gapCards =
      profile?.extractionCards.filter(
        (card) =>
          card.missingFields.length > 0 ||
          card.structuredExhibitStatus !== "supported",
      ) ?? [];
    const openExhibits =
      profile?.exhibits.filter((exhibit) => exhibit.status !== "complete") ??
      [];

    const bafoCure =
      gapCards.length > 0
        ? gapCards
            .map((card) => card.recommendedAction)
            .filter(Boolean)
            .slice(0, 3)
            .join(" ")
        : "No parsed gaps remain for this vendor.";

    const requiredEvidence =
      [
        ...gapCards.flatMap((card) => card.missingFields),
        ...openExhibits.map(
          (exhibit) => `${exhibit.label} (${exhibit.status})`,
        ),
      ]
        .slice(0, 4)
        .join("; ") || "No further evidence required.";

    const delta =
      Math.round((potentialScore - summary.weightedScore) * 10) / 10;
    const decisionImpact =
      delta > 0
        ? `Closing the named gaps moves the weighted score from ${summary.weightedScore.toFixed(1)} to ${potentialScore.toFixed(1)} (+${delta.toFixed(1)}).`
        : "Closing the named gaps does not change the weighted score; the position is already evidenced.";

    return scoreImpact(summary, {
      potentialScore,
      bafoCure,
      requiredEvidence,
      decisionImpact,
    });
  });
}

/**
 * A hypothetical version of the package with its evidence gaps closed. Used
 * only to compute BAFO headroom; it never replaces the real profile.
 */
function cureProfileGaps(
  profile: VendorResponseProfile,
): VendorResponseProfile {
  return {
    ...profile,
    exhibits: profile.exhibits.map((exhibit) => ({
      ...exhibit,
      status: "complete" as const,
      issue: null,
    })),
    extractionCards: profile.extractionCards.map((card) => ({
      ...card,
      structuredExhibitStatus: "supported" as const,
      missingFields: [],
    })),
    unsupportedClaims: [],
  };
}

function scoreImpact(
  summary: VendorEvaluationVendorSummary,
  input: {
    potentialScore: number;
    bafoCure: string;
    requiredEvidence: string;
    decisionImpact: string;
  },
): VendorEvaluationScoreImpact {
  const currentScore = summary.weightedScore;
  const potentialScore = input.potentialScore;
  return {
    vendorId: summary.vendorId,
    vendorName: summary.vendorName,
    currentScore,
    potentialScore,
    scoreDelta: Math.round((potentialScore - currentScore) * 10) / 10,
    bafoCure: input.bafoCure,
    requiredEvidence: input.requiredEvidence,
    decisionImpact: input.decisionImpact,
  };
}

function weightedContribution(score: number, weight: number): number {
  return Math.round(score * weight) / 100;
}

function tradeoffsForVendor(profile: VendorResponseProfile): string[] {
  // Strongest and weakest areas come from the vendor's own exhibit and card
  // evidence rather than from an assumed vendor archetype.
  const complete = profile.exhibits.filter(
    (exhibit) => exhibit.status === "complete",
  );
  const weak = profile.exhibits.filter(
    (exhibit) => exhibit.status !== "complete",
  );
  const tradeoffs: string[] = [];

  if (complete.length > 0) {
    tradeoffs.push(
      `Strongest evidenced areas: ${complete
        .slice(0, 2)
        .map((exhibit) => exhibit.label)
        .join(" and ")}.`,
    );
  }
  if (weak.length > 0) {
    tradeoffs.push(
      `Still conditional: ${weak
        .slice(0, 2)
        .map((exhibit) => `${exhibit.label} (${exhibit.status})`)
        .join(" and ")}.`,
    );
  }
  if (tradeoffs.length === 0) {
    tradeoffs.push("No structured exhibits were parsed for this vendor.");
  }
  return tradeoffs;
}

function money(value: number | null): string {
  if (value === null) return "Not provided";
  return `$${(value / 1_000_000).toFixed(1)}M`;
}

function groupByVendor<T extends { vendorId: string }>(
  items: T[],
): Map<string, T[]> {
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
    evidenceLabel:
      card.evidenceReference ?? "Evidence not provided in the MVE profile",
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

function recommendedAskForLever(
  type: CommercialLeverageSeed["leverType"],
): string {
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

function estimatedImpactForLever(
  type: CommercialLeverageSeed["leverType"],
): string {
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
