export const SOURCE_REQUIREMENT_CATEGORIES = [
  "service scope",
  "service management",
  "staffing and location",
  "SLA and performance",
  "transition",
  "security and compliance",
  "architecture and tooling",
  "automation and productivity",
  "commercial and pricing",
  "governance",
  "innovation and value",
] as const;

export type SourceRequirementCategory =
  (typeof SOURCE_REQUIREMENT_CATEGORIES)[number];

export const SOURCE_REQUIREMENT_LEVELS = [
  "Mandatory",
  "Scored",
  "Informational",
] as const;

export type SourceRequirementLevel =
  (typeof SOURCE_REQUIREMENT_LEVELS)[number];

export const SOURCE_RESPONSE_DISPOSITIONS = [
  "Comply",
  "Partially Comply",
  "Exception",
  "Not Applicable",
] as const;

export type SourceResponseDisposition =
  (typeof SOURCE_RESPONSE_DISPOSITIONS)[number];

export const SOURCE_RESPONSE_TYPES = [
  "Narrative",
  "Evidence",
  "Pricing",
  "SLA / KPI",
  "Staffing",
  "Transition",
  "Security",
  "Commercial exception",
] as const;

export type SourceResponseType = (typeof SOURCE_RESPONSE_TYPES)[number];

/**
 * One issued RFP requirement and the vendor's normalized answer. Empty vendor
 * fields are allowed so the same shape can represent a workbook before and
 * after submission without inventing an answer.
 */
export interface NormalizedRequirementResponse {
  requirementId: string;
  category: SourceRequirementCategory;
  section: string;
  requirement: string;
  requirementLevel: SourceRequirementLevel;
  responseType: SourceResponseType;
  evidenceRequired: boolean;
  evaluationCriterionId?: string | null;
  responseDisposition?: SourceResponseDisposition | null;
  responseNarrative?: string | null;
  evidenceRefs?: string[];
  pricingRef?: string | null;
  slaRef?: string | null;
  exceptionRef?: string | null;
  vendorOwner?: string | null;
}

export interface NormalizedResponseQualityAnalytics {
  requirementCount: number;
  requirementCoverageScore: number;
  mandatoryCompletenessScore: number;
  evidenceCoverageScore: number;
  pricingTraceabilityScore: number;
  slaTraceabilityScore: number;
  exceptionDisclosureScore: number;
  criterionLinkageScore: number;
  readyForEvaluation: "yes" | "conditional" | "no";
  nonConformances: string[];
  clarificationQuestions: string[];
}

export interface NormalizedVendorResponsePackage {
  artifactId: string;
  originalName: string;
  receivedAt: string;
  vendorId: string;
  vendorName: string;
  rows: NormalizedRequirementResponse[];
  analytics: NormalizedResponseQualityAnalytics;
  parserWarnings: string[];
}
