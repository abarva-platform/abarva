// Moves Expert Kernel — rate-card upload template contracts.
//
// These templates are intentionally separate from the enterprise-context
// template registry. Rate cards price Moves estimates; they are not business
// context facts and should not be forced into ContextDimension.

import type { UploadedFileFormat } from "@/lib/context-ingestion/types";

export type RateCardObjectType =
  | "rate_card_internal"
  | "rate_card_vendor"
  | "geo_modifier";

export interface RateCardTemplateDefinition {
  id: string;
  objectType: RateCardObjectType;
  label: string;
  description: string;
  acceptedFormats: Extract<UploadedFileFormat, "csv" | "xlsx" | "json">[];
  requiredFields: string[];
  optionalFields: string[];
  ownerRole: string;
  segmentFamily: "resource_rate_card" | "vendor_rate_card" | "geo_modifier";
  tenantScoped: boolean;
  unlocks: string[];
}

export const RATE_CARD_TEMPLATE_DEFINITIONS: RateCardTemplateDefinition[] = [
  {
    id: "moves-rate-card-internal",
    objectType: "rate_card_internal",
    label: "Internal loaded cost rates",
    description:
      "National in-house loaded-cost rows by function, specialization, and role level.",
    acceptedFormats: ["csv", "xlsx", "json"],
    requiredFields: [
      "function_group",
      "specialization",
      "role_level",
      "base_annual_low_usd",
      "base_annual_high_usd",
      "benefits_overhead_pct",
      "source",
      "as_of",
      "confidence",
    ],
    optionalFields: [],
    ownerRole: "CFO / IT finance",
    segmentFamily: "resource_rate_card",
    tenantScoped: true,
    unlocks: [
      "Moves estimates can replace generic benchmark labor costs with client-specific internal rates",
      "Role-constant in-house versus SI comparisons can use the same function and level",
    ],
  },
  {
    id: "moves-rate-card-vendor",
    objectType: "rate_card_vendor",
    label: "Vendor and SI hourly rates",
    description:
      "External vendor/SI hourly bill-rate rows by tier, tower, level, and sourcing location.",
    acceptedFormats: ["csv", "xlsx", "json"],
    requiredFields: [
      "vendor_tier",
      "functional_tower",
      "role_level",
      "sourcing_location",
      "hourly_low_usd",
      "hourly_high_usd",
      "source",
      "as_of",
      "confidence",
    ],
    optionalFields: ["named_vendor"],
    ownerRole: "Procurement / Vendor management",
    segmentFamily: "vendor_rate_card",
    tenantScoped: true,
    unlocks: [
      "Moves estimates can compare onshore, nearshore, and offshore SI delivery modes",
      "Source BAFO normalization can test vendor bids against role-constant market ranges",
    ],
  },
  {
    id: "moves-rate-card-geo-modifier",
    objectType: "geo_modifier",
    label: "Geography modifiers",
    description:
      "National-baseline localization indexes for state, metro, or offshore planning regions.",
    acceptedFormats: ["csv", "xlsx", "json"],
    requiredFields: ["region", "geo_index", "source", "as_of", "confidence"],
    optionalFields: [],
    ownerRole: "AbarVa research / Client finance",
    segmentFamily: "geo_modifier",
    tenantScoped: false,
    unlocks: [
      "One national internal rate row can be localized at estimate time",
      "Client overrides can sharpen shared AbarVa benchmark geo assumptions",
    ],
  },
];

export function getRateCardTemplateById(
  id: string,
): RateCardTemplateDefinition | null {
  return (
    RATE_CARD_TEMPLATE_DEFINITIONS.find((template) => template.id === id) ??
    null
  );
}

export function getRateCardTemplateByObjectType(
  objectType: RateCardObjectType,
): RateCardTemplateDefinition | null {
  return (
    RATE_CARD_TEMPLATE_DEFINITIONS.find(
      (template) => template.objectType === objectType,
    ) ?? null
  );
}
