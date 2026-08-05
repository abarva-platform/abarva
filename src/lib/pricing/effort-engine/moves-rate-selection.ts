/**
 * Moves pricing bridge for the global rate-card extension.
 *
 * This module is deliberately pure: callers provide already-loaded candidate
 * rows and receive one selected rate with precedence/provenance. It does not
 * read a database, activate the generated reference files, or mutate approved
 * pricing snapshots.
 */
import { dollarsToCents } from "./money";
import type { Cents } from "./types";

export type MovesRateSourceKind =
  | "deal_override"
  | "tenant_contracted_rate"
  | "tenant_internal_rate"
  | "industry_overlay"
  | "global_reference";

export type MovesRateCommercialModel =
  | "internal_loaded_cost"
  | "internal_scarcity_adjusted_cost"
  | "partner_market_bill_rate"
  | "partner_buy_rate"
  | "abarva_sell_rate";

export interface MovesRateSelectionRequest {
  roleCode: string;
  levelCode: string;
  technologyCode?: string | null;
  locationCode: string;
  providerClassCode?: string | null;
  commercialModel: MovesRateCommercialModel;
}

export interface MovesRateCandidate {
  sourceKind: MovesRateSourceKind;
  sourceLabel: string;
  roleCode: string;
  levelCode: string;
  towerCode: string | null;
  towerName: string | null;
  capabilityCode: string | null;
  capabilityName: string | null;
  technologyCodes: readonly string[];
  locationCode: string;
  locationName: string | null;
  shoreCategory: string | null;
  providerClassCode: string | null;
  providerClassName: string | null;
  commercialModel: MovesRateCommercialModel;
  lowRateUsdPerHour: number | null;
  baseRateUsdPerHour: number | null;
  highRateUsdPerHour: number | null;
  currency: string;
  confidence: string | null;
  approvalStatus: string | null;
  pricingDatasetVersion: string | null;
  sourceFormula: string | null;
  selectedRateSourceId: string | null;
  manualOverrideReason?: string | null;
  requiresManualReview?: boolean;
  eligibleForCommittedSolutionPrice?: boolean;
}

export interface PricingRateSelectionPolicy {
  rateSourceKind: MovesRateSourceKind;
  precedenceRank: number;
  selectedRateSourceLabel: string;
  allowUnapproved: boolean;
  eligibleForCommittedSolutionPrice: boolean;
}

export interface MovesSelectedRate {
  selected: true;
  sourceKind: MovesRateSourceKind;
  sourceLabel: string;
  selectedRateSourceId: string | null;
  pricingDatasetVersion: string | null;
  roleCode: string;
  levelCode: string;
  towerCode: string | null;
  towerName: string | null;
  capabilityCode: string | null;
  capabilityName: string | null;
  technologyCode: string | null;
  locationCode: string;
  locationName: string | null;
  shoreCategory: string | null;
  providerClassCode: string | null;
  providerClassName: string | null;
  commercialModel: MovesRateCommercialModel;
  lowRateCentsPerHour: Cents | null;
  baseRateCentsPerHour: Cents;
  highRateCentsPerHour: Cents | null;
  currency: string;
  confidence: string | null;
  approvalStatus: string | null;
  sourceFormula: string | null;
  manualOverrideReason: string | null;
  requiresManualReview: boolean;
  eligibleForCommittedSolutionPrice: boolean;
  planningAssumption: boolean;
}

export interface MissingMovesRate {
  selected: false;
  gapReason: string;
}

export type MovesRateSelectionResult = MovesSelectedRate | MissingMovesRate;

const DEFAULT_POLICIES: readonly PricingRateSelectionPolicy[] = [
  {
    rateSourceKind: "deal_override",
    precedenceRank: 1,
    selectedRateSourceLabel: "Deal or SOW-specific override",
    allowUnapproved: false,
    eligibleForCommittedSolutionPrice: true,
  },
  {
    rateSourceKind: "tenant_contracted_rate",
    precedenceRank: 2,
    selectedRateSourceLabel: "Tenant contracted/vendor rate",
    allowUnapproved: false,
    eligibleForCommittedSolutionPrice: true,
  },
  {
    rateSourceKind: "tenant_internal_rate",
    precedenceRank: 3,
    selectedRateSourceLabel: "Tenant internal loaded cost",
    allowUnapproved: false,
    eligibleForCommittedSolutionPrice: true,
  },
  {
    rateSourceKind: "industry_overlay",
    precedenceRank: 4,
    selectedRateSourceLabel: "Industry overlay assumption",
    allowUnapproved: true,
    eligibleForCommittedSolutionPrice: false,
  },
  {
    rateSourceKind: "global_reference",
    precedenceRank: 5,
    selectedRateSourceLabel: "Global reference rate",
    allowUnapproved: true,
    eligibleForCommittedSolutionPrice: false,
  },
];

export function defaultMovesRateSelectionPolicies(): readonly PricingRateSelectionPolicy[] {
  return DEFAULT_POLICIES;
}

export function validateMovesRateSelectionPolicies(
  policies: readonly PricingRateSelectionPolicy[],
): string[] {
  const errors: string[] = [];
  const ranks = new Set<number>();
  const kinds = new Set<MovesRateSourceKind>();
  for (const policy of policies) {
    if (ranks.has(policy.precedenceRank)) {
      errors.push(`duplicate precedence rank ${policy.precedenceRank}`);
    }
    ranks.add(policy.precedenceRank);
    if (kinds.has(policy.rateSourceKind)) {
      errors.push(`duplicate rate source kind ${policy.rateSourceKind}`);
    }
    kinds.add(policy.rateSourceKind);
  }
  const actual = [...policies]
    .sort((a, b) => a.precedenceRank - b.precedenceRank)
    .map((policy) => policy.rateSourceKind)
    .join(">");
  const expected = DEFAULT_POLICIES.map((policy) => policy.rateSourceKind).join(">");
  if (actual !== expected) {
    errors.push(`invalid pricing precedence order ${actual}; expected ${expected}`);
  }
  return errors;
}

function candidateMatches(request: MovesRateSelectionRequest, candidate: MovesRateCandidate): boolean {
  if (candidate.roleCode !== request.roleCode) return false;
  if (candidate.levelCode !== request.levelCode) return false;
  if (candidate.locationCode !== request.locationCode) return false;
  if (candidate.commercialModel !== request.commercialModel) return false;
  if (request.providerClassCode && candidate.providerClassCode !== request.providerClassCode) {
    return false;
  }
  if (request.technologyCode && candidate.technologyCodes.length > 0 && !candidate.technologyCodes.includes(request.technologyCode)) {
    return false;
  }
  return true;
}

function isApprovedEnough(policy: PricingRateSelectionPolicy, candidate: MovesRateCandidate): boolean {
  if (policy.allowUnapproved) return true;
  return candidate.approvalStatus === "approved" || candidate.approvalStatus === "client_approved";
}

function toSelectedRate(
  request: MovesRateSelectionRequest,
  candidate: MovesRateCandidate,
  policy: PricingRateSelectionPolicy,
): MovesSelectedRate {
  if (candidate.baseRateUsdPerHour === null) {
    throw new Error(`selected candidate ${candidate.sourceLabel} has no base hourly rate`);
  }
  const eligible =
    candidate.eligibleForCommittedSolutionPrice ??
    policy.eligibleForCommittedSolutionPrice;
  const planningAssumption =
    !eligible ||
    candidate.sourceKind === "industry_overlay" ||
    candidate.sourceKind === "global_reference" ||
    candidate.approvalStatus === "global_starter_unapproved";

  return {
    selected: true,
    sourceKind: candidate.sourceKind,
    sourceLabel: candidate.sourceLabel || policy.selectedRateSourceLabel,
    selectedRateSourceId: candidate.selectedRateSourceId,
    pricingDatasetVersion: candidate.pricingDatasetVersion,
    roleCode: candidate.roleCode,
    levelCode: candidate.levelCode,
    towerCode: candidate.towerCode,
    towerName: candidate.towerName,
    capabilityCode: candidate.capabilityCode,
    capabilityName: candidate.capabilityName,
    technologyCode: request.technologyCode ?? candidate.technologyCodes[0] ?? null,
    locationCode: candidate.locationCode,
    locationName: candidate.locationName,
    shoreCategory: candidate.shoreCategory,
    providerClassCode: candidate.providerClassCode,
    providerClassName: candidate.providerClassName,
    commercialModel: candidate.commercialModel,
    lowRateCentsPerHour: candidate.lowRateUsdPerHour === null ? null : dollarsToCents(candidate.lowRateUsdPerHour),
    baseRateCentsPerHour: dollarsToCents(candidate.baseRateUsdPerHour),
    highRateCentsPerHour: candidate.highRateUsdPerHour === null ? null : dollarsToCents(candidate.highRateUsdPerHour),
    currency: candidate.currency,
    confidence: candidate.confidence,
    approvalStatus: candidate.approvalStatus,
    sourceFormula: candidate.sourceFormula,
    manualOverrideReason: candidate.manualOverrideReason ?? null,
    requiresManualReview: candidate.requiresManualReview ?? false,
    eligibleForCommittedSolutionPrice: eligible,
    planningAssumption,
  };
}

export function selectMovesRate(
  request: MovesRateSelectionRequest,
  candidates: readonly MovesRateCandidate[],
  policies: readonly PricingRateSelectionPolicy[] = DEFAULT_POLICIES,
): MovesRateSelectionResult {
  const policyErrors = validateMovesRateSelectionPolicies(policies);
  if (policyErrors.length > 0) {
    return { selected: false, gapReason: `pricing precedence conflict: ${policyErrors.join("; ")}` };
  }

  const policyByKind = new Map(policies.map((policy) => [policy.rateSourceKind, policy]));
  const matching = candidates.filter((candidate) => candidateMatches(request, candidate));
  for (const policy of [...policies].sort((a, b) => a.precedenceRank - b.precedenceRank)) {
    const candidate = matching.find((item) => item.sourceKind === policy.rateSourceKind && isApprovedEnough(policy, item));
    if (candidate) return toSelectedRate(request, candidate, policy);
  }

  const rejectedHigherPriority = matching.filter((candidate) => {
    const policy = policyByKind.get(candidate.sourceKind);
    return policy && !isApprovedEnough(policy, candidate);
  });
  const suffix =
    rejectedHigherPriority.length > 0
      ? `; ${rejectedHigherPriority.length} higher-priority candidate(s) were present but not approved`
      : "";
  return {
    selected: false,
    gapReason:
      `no eligible Moves pricing rate for role ${request.roleCode}, level ${request.levelCode}, ` +
      `technology ${request.technologyCode ?? "any"}, location ${request.locationCode}, ` +
      `provider ${request.providerClassCode ?? "n/a"}, commercial model ${request.commercialModel}${suffix}`,
  };
}

export interface MaterializedProviderRateRow {
  rate_line_id: string;
  source_rate_band_code: string;
  role_code: string;
  canonical_role_name: string;
  level_code: string;
  tower_code: string;
  tower_name: string;
  capability_code: string;
  capability_name: string;
  technology_codes: string;
  provider_class_code: string;
  provider_class_name: string;
  location_code: string;
  location_name: string;
  shore_category: string;
  rate_type: string;
  currency: string;
  partner_market_bill_rate_usd_per_hour: string;
  planning_rate_low_usd_per_hour: string;
  planning_rate_base_usd_per_hour: string;
  planning_rate_high_usd_per_hour: string;
  source_formula: string;
  confidence: string;
  approval_status: string;
  version: string;
}

export interface MaterializedInternalRateRow {
  rate_line_id: string;
  source_rate_band_code: string;
  role_code: string;
  canonical_role_name: string;
  level_code: string;
  tower_code: string;
  tower_name: string;
  capability_code: string;
  capability_name: string;
  technology_codes: string;
  location_code: string;
  location_name: string;
  shore_category: string;
  currency: string;
  internal_loaded_rate_usd_per_hour: string;
  internal_scarcity_adjusted_rate_usd_per_hour: string;
  planning_rate_low_usd_per_hour: string;
  planning_rate_base_usd_per_hour: string;
  planning_rate_high_usd_per_hour: string;
  source_formula: string;
  confidence: string;
  approval_status: string;
  version: string;
}

function parseNumber(value: string): number | null {
  if (value === "") return null;
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : null;
}

function technologyCodes(value: string): string[] {
  return value.split("|").filter(Boolean);
}

export function providerReferenceRateToCandidate(row: MaterializedProviderRateRow): MovesRateCandidate {
  return {
    sourceKind: row.rate_type === "partner_market_bill_rate_requires_review" ? "industry_overlay" : "global_reference",
    sourceLabel: row.rate_type === "partner_market_bill_rate_requires_review" ? "Industry overlay assumption" : "Global reference rate",
    roleCode: row.role_code,
    levelCode: row.level_code,
    towerCode: row.tower_code,
    towerName: row.tower_name,
    capabilityCode: row.capability_code,
    capabilityName: row.capability_name,
    technologyCodes: technologyCodes(row.technology_codes),
    locationCode: row.location_code,
    locationName: row.location_name,
    shoreCategory: row.shore_category,
    providerClassCode: row.provider_class_code,
    providerClassName: row.provider_class_name,
    commercialModel: "partner_market_bill_rate",
    lowRateUsdPerHour: parseNumber(row.planning_rate_low_usd_per_hour),
    baseRateUsdPerHour: parseNumber(row.partner_market_bill_rate_usd_per_hour),
    highRateUsdPerHour: parseNumber(row.planning_rate_high_usd_per_hour),
    currency: row.currency,
    confidence: row.confidence,
    approvalStatus: row.approval_status,
    pricingDatasetVersion: row.version,
    sourceFormula: row.source_formula,
    selectedRateSourceId: row.rate_line_id,
    requiresManualReview: row.rate_type === "partner_market_bill_rate_requires_review",
    eligibleForCommittedSolutionPrice: false,
  };
}

export function internalReferenceRateToCandidate(
  row: MaterializedInternalRateRow,
  commercialModel: "internal_loaded_cost" | "internal_scarcity_adjusted_cost" = "internal_scarcity_adjusted_cost",
): MovesRateCandidate {
  const baseRate =
    commercialModel === "internal_loaded_cost"
      ? parseNumber(row.internal_loaded_rate_usd_per_hour)
      : parseNumber(row.internal_scarcity_adjusted_rate_usd_per_hour);
  return {
    sourceKind: "global_reference",
    sourceLabel: "Global reference rate",
    roleCode: row.role_code,
    levelCode: row.level_code,
    towerCode: row.tower_code,
    towerName: row.tower_name,
    capabilityCode: row.capability_code,
    capabilityName: row.capability_name,
    technologyCodes: technologyCodes(row.technology_codes),
    locationCode: row.location_code,
    locationName: row.location_name,
    shoreCategory: row.shore_category,
    providerClassCode: "INTERNAL",
    providerClassName: "Internal team",
    commercialModel,
    lowRateUsdPerHour: baseRate,
    baseRateUsdPerHour: baseRate,
    highRateUsdPerHour: baseRate,
    currency: row.currency,
    confidence: row.confidence,
    approvalStatus: row.approval_status,
    pricingDatasetVersion: row.version,
    sourceFormula: row.source_formula,
    selectedRateSourceId: row.rate_line_id,
    requiresManualReview: false,
    eligibleForCommittedSolutionPrice: false,
  };
}
