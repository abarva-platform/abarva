// Moves Expert Kernel — rate-card ingestion contract.
//
// Pure implementation of docs/build/MOVES_RATE_CARD_INGESTION_SPEC_2026-06-03.md.
// The governed upload path can parse Excel/CSV however it likes, but it must
// hand rows through this module before any estimator consumes them. Formula
// preview columns in the workbook are never trusted.

import type { Confidence, Range } from "../types";
import { rangeOf, round2 } from "../types";

export const ANNUAL_BILLABLE_HOURS_V2 = 1880;
export const VENDOR_GOVERNANCE_OVERHEAD_DEFAULT = 0.12;

export const FUNCTION_GROUPS = [
  "Digital",
  "Full-Stack Dev",
  "Data/Analytics",
  "Legacy/Mainframe",
  "EPIC/Clarity",
  "ERP",
  "Infra/Cloud",
  "PMO",
  "Security",
  "Integration",
] as const;

export const ROLE_LEVELS = [
  "Junior",
  "Mid-Level",
  "Senior",
  "Lead/Architect",
] as const;

export const VENDOR_TIERS = [
  "Big 4 Advisory",
  "SI Tier-1 (Onshore)",
  "SI Tier-1 (Offshore)",
  "Boutique Specialist",
  "Custom Vendor",
] as const;

export const SOURCING_LOCATIONS = ["Onshore", "Nearshore", "Offshore"] as const;

export type FunctionGroup = (typeof FUNCTION_GROUPS)[number];
export type RoleLevel = (typeof ROLE_LEVELS)[number];
export type VendorTier = (typeof VENDOR_TIERS)[number];
export type SourcingLocation = (typeof SOURCING_LOCATIONS)[number];

export interface RateCardProvenance {
  source: string;
  asOf: string;
  confidence: Confidence;
}

export interface InternalRateCardRow extends RateCardProvenance {
  functionGroup: FunctionGroup;
  specialization: string;
  roleLevel: RoleLevel;
  /** National baseline, not localized. */
  baseAnnualLowUsd: number;
  /** National baseline, not localized. Must be >= low. */
  baseAnnualHighUsd: number;
  /** Decimal percentage, e.g. 0.28 for 28%. */
  benefitsOverheadPct: number;
}

export interface VendorRateCardRow extends RateCardProvenance {
  vendorTier: VendorTier;
  namedVendor?: string;
  functionalTower: FunctionGroup;
  roleLevel: RoleLevel;
  sourcingLocation: SourcingLocation;
  hourlyLowUsd: number;
  hourlyHighUsd: number;
}

export interface GeoModifierRow extends RateCardProvenance {
  region: string;
  geoIndex: number;
}

export type RateCardRowKind = "internal" | "vendor" | "geo_modifier";

export interface RateCardValidationMessage {
  severity: "error" | "warning";
  rowKind: RateCardRowKind;
  rowIndex: number;
  field: string;
  message: string;
}

export interface RateCardValidationResult {
  valid: boolean;
  errors: RateCardValidationMessage[];
  warnings: RateCardValidationMessage[];
}

export interface InternalComputedRate {
  functionGroup: FunctionGroup;
  specialization: string;
  roleLevel: RoleLevel;
  targetRegion: string;
  nationalMidpointUsd: number;
  loadedNationalMidpointUsd: number;
  localizedAnnualUsd: Range;
  provenance: RateCardProvenance[];
}

export interface VendorComputedRate {
  vendorTier: VendorTier;
  namedVendor?: string;
  functionalTower: FunctionGroup;
  roleLevel: RoleLevel;
  sourcingLocation: SourcingLocation;
  hourlyMidpointUsd: number;
  annualEquivalentUsd: Range;
  costToClientUsd: Range;
  governanceOverheadPct: number;
  provenance: RateCardProvenance;
}

export interface SourcingComparisonOption {
  option: "insource" | "outsource_onshore" | "outsource_offshore" | "hybrid";
  label: string;
  annualUsd: Range;
  provenance: RateCardProvenance[];
  confidence: Confidence;
  note: string;
}

export interface BuildRoleConstantComparisonInput {
  internal: InternalRateCardRow;
  geo: GeoModifierRow;
  onshoreVendor: VendorRateCardRow;
  offshoreVendor: VendorRateCardRow;
  /** Local/internal percentage for hybrid, 0..1. Offshore share is 1 - pct. */
  hybridLocalPct: number;
  governanceOverheadPct?: number;
}

function isOneOf<T extends readonly string[]>(
  value: string,
  allowed: T,
): value is T[number] {
  return (allowed as readonly string[]).includes(value);
}

function hasIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isFiniteNumber(value: number): boolean {
  return Number.isFinite(value);
}

function confidenceRank(confidence: Confidence): number {
  return confidence === "high" ? 3 : confidence === "medium" ? 2 : 1;
}

function lowestConfidence(items: RateCardProvenance[]): Confidence {
  return items.reduce<Confidence>((lowest, item) => {
    return confidenceRank(item.confidence) < confidenceRank(lowest)
      ? item.confidence
      : lowest;
  }, "high");
}

function pushMessage(
  target: RateCardValidationMessage[],
  severity: RateCardValidationMessage["severity"],
  rowKind: RateCardRowKind,
  rowIndex: number,
  field: string,
  message: string,
): void {
  target.push({ severity, rowKind, rowIndex, field, message });
}

function validateProvenance(
  row: RateCardProvenance,
  rowKind: RateCardRowKind,
  rowIndex: number,
  errors: RateCardValidationMessage[],
  warnings: RateCardValidationMessage[],
): void {
  if (!row.source.trim()) {
    pushMessage(
      warnings,
      "warning",
      rowKind,
      rowIndex,
      "source",
      "Missing source; force confidence low and keep the row reviewable.",
    );
  }
  if (!hasIsoDate(row.asOf)) {
    pushMessage(
      warnings,
      "warning",
      rowKind,
      rowIndex,
      "asOf",
      "Missing or invalid as-of date; force confidence low and keep the row reviewable.",
    );
  }
  if (!["low", "medium", "high"].includes(row.confidence)) {
    pushMessage(
      errors,
      "error",
      rowKind,
      rowIndex,
      "confidence",
      "Confidence must be low, medium, or high.",
    );
  }
}

export function validateInternalRateRows(
  rows: InternalRateCardRow[],
): RateCardValidationResult {
  const errors: RateCardValidationMessage[] = [];
  const warnings: RateCardValidationMessage[] = [];

  rows.forEach((row, index) => {
    validateProvenance(row, "internal", index, errors, warnings);
    if (!isOneOf(row.functionGroup, FUNCTION_GROUPS)) {
      pushMessage(
        errors,
        "error",
        "internal",
        index,
        "functionGroup",
        "Unknown function group.",
      );
    }
    if (!row.specialization.trim()) {
      pushMessage(
        errors,
        "error",
        "internal",
        index,
        "specialization",
        "Specialization is required.",
      );
    }
    if (!isOneOf(row.roleLevel, ROLE_LEVELS)) {
      pushMessage(
        errors,
        "error",
        "internal",
        index,
        "roleLevel",
        "Unknown role level.",
      );
    }
    if (!isFiniteNumber(row.baseAnnualLowUsd) || row.baseAnnualLowUsd <= 0) {
      pushMessage(
        errors,
        "error",
        "internal",
        index,
        "baseAnnualLowUsd",
        "Low annual rate must be a positive number.",
      );
    }
    if (!isFiniteNumber(row.baseAnnualHighUsd) || row.baseAnnualHighUsd <= 0) {
      pushMessage(
        errors,
        "error",
        "internal",
        index,
        "baseAnnualHighUsd",
        "High annual rate must be a positive number.",
      );
    }
    if (row.baseAnnualLowUsd > row.baseAnnualHighUsd) {
      pushMessage(
        errors,
        "error",
        "internal",
        index,
        "baseAnnualHighUsd",
        "High annual rate must be >= low.",
      );
    }
    if (
      !isFiniteNumber(row.benefitsOverheadPct) ||
      row.benefitsOverheadPct < 0 ||
      row.benefitsOverheadPct > 1
    ) {
      pushMessage(
        errors,
        "error",
        "internal",
        index,
        "benefitsOverheadPct",
        "Benefits overhead must be between 0 and 1.",
      );
    }
  });

  return { valid: errors.length === 0, errors, warnings };
}

export function validateVendorRateRows(
  rows: VendorRateCardRow[],
): RateCardValidationResult {
  const errors: RateCardValidationMessage[] = [];
  const warnings: RateCardValidationMessage[] = [];

  rows.forEach((row, index) => {
    validateProvenance(row, "vendor", index, errors, warnings);
    if (!isOneOf(row.vendorTier, VENDOR_TIERS)) {
      pushMessage(
        errors,
        "error",
        "vendor",
        index,
        "vendorTier",
        "Unknown vendor tier.",
      );
    }
    if (!isOneOf(row.functionalTower, FUNCTION_GROUPS)) {
      pushMessage(
        errors,
        "error",
        "vendor",
        index,
        "functionalTower",
        "Unknown functional tower.",
      );
    }
    if (!isOneOf(row.roleLevel, ROLE_LEVELS)) {
      pushMessage(
        errors,
        "error",
        "vendor",
        index,
        "roleLevel",
        "Unknown role level.",
      );
    }
    if (!isOneOf(row.sourcingLocation, SOURCING_LOCATIONS)) {
      pushMessage(
        errors,
        "error",
        "vendor",
        index,
        "sourcingLocation",
        "Unknown sourcing location.",
      );
    }
    if (!isFiniteNumber(row.hourlyLowUsd) || row.hourlyLowUsd <= 0) {
      pushMessage(
        errors,
        "error",
        "vendor",
        index,
        "hourlyLowUsd",
        "Low hourly rate must be a positive number.",
      );
    }
    if (!isFiniteNumber(row.hourlyHighUsd) || row.hourlyHighUsd <= 0) {
      pushMessage(
        errors,
        "error",
        "vendor",
        index,
        "hourlyHighUsd",
        "High hourly rate must be a positive number.",
      );
    }
    if (row.hourlyLowUsd > row.hourlyHighUsd) {
      pushMessage(
        errors,
        "error",
        "vendor",
        index,
        "hourlyHighUsd",
        "High hourly rate must be >= low.",
      );
    }
  });

  return { valid: errors.length === 0, errors, warnings };
}

export function validateGeoModifierRows(
  rows: GeoModifierRow[],
): RateCardValidationResult {
  const errors: RateCardValidationMessage[] = [];
  const warnings: RateCardValidationMessage[] = [];

  rows.forEach((row, index) => {
    validateProvenance(row, "geo_modifier", index, errors, warnings);
    if (!row.region.trim()) {
      pushMessage(
        errors,
        "error",
        "geo_modifier",
        index,
        "region",
        "Region is required.",
      );
    }
    if (!isFiniteNumber(row.geoIndex) || row.geoIndex <= 0) {
      pushMessage(
        errors,
        "error",
        "geo_modifier",
        index,
        "geoIndex",
        "Geo index must be a positive number.",
      );
    }
  });

  return { valid: errors.length === 0, errors, warnings };
}

export function computeInternalPlanningRate(
  row: InternalRateCardRow,
  geo: GeoModifierRow,
): InternalComputedRate {
  const nationalMidpointUsd = rangeOf(
    row.baseAnnualLowUsd,
    row.baseAnnualHighUsd,
  ).point;
  const loadedLow = row.baseAnnualLowUsd * (1 + row.benefitsOverheadPct);
  const loadedHigh = row.baseAnnualHighUsd * (1 + row.benefitsOverheadPct);
  const loadedNationalMidpointUsd =
    nationalMidpointUsd * (1 + row.benefitsOverheadPct);

  return {
    functionGroup: row.functionGroup,
    specialization: row.specialization,
    roleLevel: row.roleLevel,
    targetRegion: geo.region,
    nationalMidpointUsd: Math.round(nationalMidpointUsd),
    loadedNationalMidpointUsd: Math.round(loadedNationalMidpointUsd),
    localizedAnnualUsd: {
      low: Math.round(loadedLow * geo.geoIndex),
      point: Math.round(loadedNationalMidpointUsd * geo.geoIndex),
      high: Math.round(loadedHigh * geo.geoIndex),
    },
    provenance: [row, geo],
  };
}

export function computeVendorPlanningRate(
  row: VendorRateCardRow,
  governanceOverheadPct = VENDOR_GOVERNANCE_OVERHEAD_DEFAULT,
): VendorComputedRate {
  if (governanceOverheadPct < 0 || governanceOverheadPct > 1) {
    throw new Error("governanceOverheadPct must be between 0 and 1.");
  }

  const hourlyMidpointUsd = rangeOf(row.hourlyLowUsd, row.hourlyHighUsd).point;
  const annualEquivalentUsd = {
    low: Math.round(row.hourlyLowUsd * ANNUAL_BILLABLE_HOURS_V2),
    point: Math.round(hourlyMidpointUsd * ANNUAL_BILLABLE_HOURS_V2),
    high: Math.round(row.hourlyHighUsd * ANNUAL_BILLABLE_HOURS_V2),
  };
  const costToClientUsd = {
    low: Math.round(annualEquivalentUsd.low * (1 + governanceOverheadPct)),
    point: Math.round(annualEquivalentUsd.point * (1 + governanceOverheadPct)),
    high: Math.round(annualEquivalentUsd.high * (1 + governanceOverheadPct)),
  };

  return {
    vendorTier: row.vendorTier,
    namedVendor: row.namedVendor,
    functionalTower: row.functionalTower,
    roleLevel: row.roleLevel,
    sourcingLocation: row.sourcingLocation,
    hourlyMidpointUsd,
    annualEquivalentUsd,
    costToClientUsd,
    governanceOverheadPct,
    provenance: row,
  };
}

export function buildRoleConstantSourcingComparison(
  input: BuildRoleConstantComparisonInput,
): SourcingComparisonOption[] {
  const { internal, onshoreVendor, offshoreVendor } = input;
  const governanceOverheadPct =
    input.governanceOverheadPct ?? VENDOR_GOVERNANCE_OVERHEAD_DEFAULT;

  if (input.hybridLocalPct < 0 || input.hybridLocalPct > 1) {
    throw new Error("hybridLocalPct must be between 0 and 1.");
  }
  if (onshoreVendor.sourcingLocation !== "Onshore") {
    throw new Error("onshoreVendor must have sourcingLocation Onshore.");
  }
  if (offshoreVendor.sourcingLocation !== "Offshore") {
    throw new Error("offshoreVendor must have sourcingLocation Offshore.");
  }

  const matches = [onshoreVendor, offshoreVendor].every((row) => {
    return (
      row.functionalTower === internal.functionGroup &&
      row.roleLevel === internal.roleLevel
    );
  });
  if (!matches) {
    throw new Error(
      "Role-constant comparison requires matching function/tower and role level.",
    );
  }

  const internalRate = computeInternalPlanningRate(internal, input.geo);
  const onshoreRate = computeVendorPlanningRate(
    onshoreVendor,
    governanceOverheadPct,
  );
  const offshoreRate = computeVendorPlanningRate(
    offshoreVendor,
    governanceOverheadPct,
  );
  const offshorePct = 1 - input.hybridLocalPct;
  const hybridAnnual = {
    low: round2(
      internalRate.localizedAnnualUsd.low * input.hybridLocalPct +
        offshoreRate.costToClientUsd.low * offshorePct,
    ),
    point: round2(
      internalRate.localizedAnnualUsd.point * input.hybridLocalPct +
        offshoreRate.costToClientUsd.point * offshorePct,
    ),
    high: round2(
      internalRate.localizedAnnualUsd.high * input.hybridLocalPct +
        offshoreRate.costToClientUsd.high * offshorePct,
    ),
  };

  return [
    {
      option: "insource",
      label: `100% insourced — ${input.geo.region}`,
      annualUsd: internalRate.localizedAnnualUsd,
      provenance: internalRate.provenance,
      confidence: lowestConfidence(internalRate.provenance),
      note: "Planning range, not a quote. National loaded midpoint localized by geo index.",
    },
    {
      option: "outsource_onshore",
      label: `100% outsourced — ${onshoreVendor.vendorTier} onshore`,
      annualUsd: onshoreRate.costToClientUsd,
      provenance: [onshoreRate.provenance],
      confidence: onshoreVendor.confidence,
      note: "Planning range, not a quote. Vendor midpoint annualized and governance overhead applied.",
    },
    {
      option: "outsource_offshore",
      label: `100% outsourced — ${offshoreVendor.vendorTier} offshore`,
      annualUsd: offshoreRate.costToClientUsd,
      provenance: [offshoreRate.provenance],
      confidence: offshoreVendor.confidence,
      note: "Planning range, not a quote. Vendor midpoint annualized and governance overhead applied.",
    },
    {
      option: "hybrid",
      label: `Hybrid — ${Math.round(input.hybridLocalPct * 100)}% local / ${Math.round(offshorePct * 100)}% offshore`,
      annualUsd: hybridAnnual,
      provenance: [...internalRate.provenance, offshoreRate.provenance],
      confidence: lowestConfidence([
        ...internalRate.provenance,
        offshoreRate.provenance,
      ]),
      note: "Planning range, not a quote. Role is held constant; only sourcing mode changes.",
    },
  ];
}
