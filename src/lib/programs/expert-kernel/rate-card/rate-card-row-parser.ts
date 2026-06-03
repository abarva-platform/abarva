// Moves Expert Kernel — rate-card row parser.
//
// Data Loads may receive CSV, workbook, or JSON rows. This adapter normalizes
// common header spellings into the canonical rate-card ingestion rows, then
// delegates validation and server-side math to rate-card-ingestion.ts.

import type { Confidence } from "../types";
import {
  FUNCTION_GROUPS,
  ROLE_LEVELS,
  SOURCING_LOCATIONS,
  VENDOR_TIERS,
  validateGeoModifierRows,
  validateInternalRateRows,
  validateVendorRateRows,
  type FunctionGroup,
  type GeoModifierRow,
  type InternalRateCardRow,
  type RateCardValidationResult,
  type RoleLevel,
  type SourcingLocation,
  type VendorRateCardRow,
  type VendorTier,
} from "./rate-card-ingestion";
import {
  getRateCardTemplateByObjectType,
  type RateCardObjectType,
  type RateCardTemplateDefinition,
} from "./rate-card-templates";

export type RawRateCardRecord = Record<string, unknown>;

export interface ParsedRateCardRows<T> {
  objectType: RateCardObjectType;
  template: RateCardTemplateDefinition;
  rows: T[];
  validation: RateCardValidationResult;
}

const INTERNAL_ALIASES = {
  functionGroup: ["function_group", "functionGroup", "function group", "tower"],
  specialization: [
    "specialization",
    "role_specialization",
    "role specialization",
  ],
  roleLevel: ["role_level", "roleLevel", "role level", "level"],
  baseAnnualLowUsd: [
    "base_annual_low_usd",
    "baseAnnualLowUsd",
    "base annual low usd",
    "annual_low",
    "low",
  ],
  baseAnnualHighUsd: [
    "base_annual_high_usd",
    "baseAnnualHighUsd",
    "base annual high usd",
    "annual_high",
    "high",
  ],
  benefitsOverheadPct: [
    "benefits_overhead_pct",
    "benefitsOverheadPct",
    "benefits overhead pct",
    "overhead_pct",
  ],
  source: ["source", "citation", "source_url", "source url"],
  asOf: ["as_of", "asOf", "as of", "effective_date", "effective date"],
  confidence: ["confidence", "source_confidence", "source confidence"],
} as const;

const VENDOR_ALIASES = {
  vendorTier: ["vendor_tier", "vendorTier", "vendor tier", "tier"],
  namedVendor: ["named_vendor", "namedVendor", "named vendor", "vendor"],
  functionalTower: [
    "functional_tower",
    "functionalTower",
    "functional tower",
    "function_group",
    "function group",
    "tower",
  ],
  roleLevel: ["role_level", "roleLevel", "role level", "level"],
  sourcingLocation: [
    "sourcing_location",
    "sourcingLocation",
    "sourcing location",
    "location",
  ],
  hourlyLowUsd: ["hourly_low_usd", "hourlyLowUsd", "hourly low usd", "low"],
  hourlyHighUsd: [
    "hourly_high_usd",
    "hourlyHighUsd",
    "hourly high usd",
    "high",
  ],
  source: ["source", "citation", "source_url", "source url"],
  asOf: ["as_of", "asOf", "as of", "effective_date", "effective date"],
  confidence: ["confidence", "source_confidence", "source confidence"],
} as const;

const GEO_ALIASES = {
  region: ["region", "geo_region", "geo region", "location"],
  geoIndex: ["geo_index", "geoIndex", "geo index", "modifier", "index"],
  source: ["source", "citation", "source_url", "source url"],
  asOf: ["as_of", "asOf", "as of", "effective_date", "effective date"],
  confidence: ["confidence", "source_confidence", "source confidence"],
} as const;

function normalizeKey(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function readCell(
  record: RawRateCardRecord,
  aliases: readonly string[],
): unknown {
  const normalized = new Map(
    Object.entries(record).map(([key, value]) => [normalizeKey(key), value]),
  );
  for (const alias of aliases) {
    const value = normalized.get(normalizeKey(alias));
    if (value !== undefined) return value;
  }
  return undefined;
}

function parseText(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function parseNumberCell(value: unknown): number {
  if (typeof value === "number") return value;
  const text = parseText(value);
  if (!text) return Number.NaN;
  const percentage = text.endsWith("%");
  const cleaned = text.replace(/[$,%\s]/g, "");
  const parsed = Number(cleaned);
  if (!Number.isFinite(parsed)) return Number.NaN;
  return percentage ? parsed / 100 : parsed;
}

function normalizeChoice<T extends readonly string[]>(
  value: unknown,
  allowed: T,
): T[number] | string {
  const text = parseText(value);
  const normalized = normalizeKey(text);
  return (
    allowed.find((candidate) => normalizeKey(candidate) === normalized) ?? text
  );
}

function parseConfidence(value: unknown): Confidence {
  return parseText(value).toLowerCase() as Confidence;
}

function templateFor(
  objectType: RateCardObjectType,
): RateCardTemplateDefinition {
  const template = getRateCardTemplateByObjectType(objectType);
  if (!template) {
    throw new Error(`unknown_rate_card_template:${objectType}`);
  }
  return template;
}

export function parseInternalRateCardRows(
  records: RawRateCardRecord[],
): ParsedRateCardRows<InternalRateCardRow> {
  const rows = records.map(
    (record): InternalRateCardRow => ({
      functionGroup: normalizeChoice(
        readCell(record, INTERNAL_ALIASES.functionGroup),
        FUNCTION_GROUPS,
      ) as FunctionGroup,
      specialization: parseText(
        readCell(record, INTERNAL_ALIASES.specialization),
      ),
      roleLevel: normalizeChoice(
        readCell(record, INTERNAL_ALIASES.roleLevel),
        ROLE_LEVELS,
      ) as RoleLevel,
      baseAnnualLowUsd: parseNumberCell(
        readCell(record, INTERNAL_ALIASES.baseAnnualLowUsd),
      ),
      baseAnnualHighUsd: parseNumberCell(
        readCell(record, INTERNAL_ALIASES.baseAnnualHighUsd),
      ),
      benefitsOverheadPct: parseNumberCell(
        readCell(record, INTERNAL_ALIASES.benefitsOverheadPct),
      ),
      source: parseText(readCell(record, INTERNAL_ALIASES.source)),
      asOf: parseText(readCell(record, INTERNAL_ALIASES.asOf)),
      confidence: parseConfidence(
        readCell(record, INTERNAL_ALIASES.confidence),
      ),
    }),
  );

  return {
    objectType: "rate_card_internal",
    template: templateFor("rate_card_internal"),
    rows,
    validation: validateInternalRateRows(rows),
  };
}

export function parseVendorRateCardRows(
  records: RawRateCardRecord[],
): ParsedRateCardRows<VendorRateCardRow> {
  const rows = records.map((record): VendorRateCardRow => {
    const namedVendor = parseText(readCell(record, VENDOR_ALIASES.namedVendor));
    return {
      vendorTier: normalizeChoice(
        readCell(record, VENDOR_ALIASES.vendorTier),
        VENDOR_TIERS,
      ) as VendorTier,
      namedVendor: namedVendor || undefined,
      functionalTower: normalizeChoice(
        readCell(record, VENDOR_ALIASES.functionalTower),
        FUNCTION_GROUPS,
      ) as FunctionGroup,
      roleLevel: normalizeChoice(
        readCell(record, VENDOR_ALIASES.roleLevel),
        ROLE_LEVELS,
      ) as RoleLevel,
      sourcingLocation: normalizeChoice(
        readCell(record, VENDOR_ALIASES.sourcingLocation),
        SOURCING_LOCATIONS,
      ) as SourcingLocation,
      hourlyLowUsd: parseNumberCell(
        readCell(record, VENDOR_ALIASES.hourlyLowUsd),
      ),
      hourlyHighUsd: parseNumberCell(
        readCell(record, VENDOR_ALIASES.hourlyHighUsd),
      ),
      source: parseText(readCell(record, VENDOR_ALIASES.source)),
      asOf: parseText(readCell(record, VENDOR_ALIASES.asOf)),
      confidence: parseConfidence(readCell(record, VENDOR_ALIASES.confidence)),
    };
  });

  return {
    objectType: "rate_card_vendor",
    template: templateFor("rate_card_vendor"),
    rows,
    validation: validateVendorRateRows(rows),
  };
}

export function parseGeoModifierRows(
  records: RawRateCardRecord[],
): ParsedRateCardRows<GeoModifierRow> {
  const rows = records.map(
    (record): GeoModifierRow => ({
      region: parseText(readCell(record, GEO_ALIASES.region)),
      geoIndex: parseNumberCell(readCell(record, GEO_ALIASES.geoIndex)),
      source: parseText(readCell(record, GEO_ALIASES.source)),
      asOf: parseText(readCell(record, GEO_ALIASES.asOf)),
      confidence: parseConfidence(readCell(record, GEO_ALIASES.confidence)),
    }),
  );

  return {
    objectType: "geo_modifier",
    template: templateFor("geo_modifier"),
    rows,
    validation: validateGeoModifierRows(rows),
  };
}
