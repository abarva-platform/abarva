/**
 * Real, structured technology-estate records for the Home preview's tabular explorer -- distinct
 * from every other data-build output in this pipeline: it is pure canonical-CSV extraction, never
 * touches Claude, and needs no verification (there is nothing generated to verify; every value is
 * a direct CSV field). Scoped to the four object types a reader asking "what does the current
 * technology estate look like" actually wants first (applications, vendor contracts,
 * infrastructure platforms, data assets/integrations) -- the object types explicitly named in the
 * request that started this: "just for the applications/tech" first, expand to more segments as
 * more source files provide real structured columns.
 */

import type { CanonicalIngestionRecord } from "../../src/lib/enterprise-data/contracts/canonical-ingestion";

export const TECH_OBJECT_TYPES = [
  "application_system",
  "vendor_contract",
  "infrastructure_platform",
  "data_asset_or_integration",
] as const;
export type TechObjectType = (typeof TECH_OBJECT_TYPES)[number];

const TECH_OBJECT_TYPE_LABELS: Record<TechObjectType, string> = {
  application_system: "Applications & Systems",
  vendor_contract: "Vendor Contracts",
  infrastructure_platform: "Infrastructure & Platforms",
  data_asset_or_integration: "Data Assets & Integrations",
};

/** The one attribute per object type that answers "which business need does this serve" --
 * businessFunction on an application is "Clinical Informatics" or "Finance & Accounting";
 * dataDomain on a data asset is which functional domain owns it. This is precisely the tagging
 * the request named directly: "the data and analytics platform servicing finance needs or
 * clinical needs or population health." Precomputed here (deterministic, no guessing at render
 * time) rather than left to a generic "any low-cardinality string column" heuristic, since these
 * are the columns that actually carry that meaning in the source data -- not just any column that
 * happens to have few distinct values. */
const PRIMARY_DIMENSION_KEY: Record<TechObjectType, string> = {
  application_system: "businessFunction",
  vendor_contract: "serviceCategory",
  infrastructure_platform: "platformType",
  data_asset_or_integration: "dataDomain",
};

/** Fields every canonical record carries that describe the record's own provenance/ingestion
 * bookkeeping, not the real-world thing the record represents -- useful for audit, not for a
 * reader trying to make sense of the estate. Excluded from the table; still present in the
 * underlying record for anyone who needs it via Browse the Data's signal-level view. */
const METADATA_KEYS = new Set([
  "tenantKey",
  "sourceFile",
  "sourceDate",
  "confidence",
  "sourcePath",
  "sourcePaths",
  "sourceRowNumber",
  "sourceMentionCount",
  "sourceMentions",
  "displayName",
  "knownGaps",
]);

function isNarrativeKey(key: string): boolean {
  return /Narrative$|Notes$/.test(key);
}

function formatAttributeValue(value: unknown): string | number | boolean | null {
  if (value === null || value === undefined) return null;
  if (Array.isArray(value)) return value.map((v) => String(v)).join("; ");
  if (typeof value === "object") return JSON.stringify(value);
  return value as string | number | boolean;
}

export interface TechRecordType {
  objectType: TechObjectType;
  label: string;
  /** Column order matches each record's own attribute insertion order (i.e. the source CSV's
   * column order) -- not alphabetized, so a reader sees fields in the shape the source file
   * actually declared them. */
  columns: string[];
  rows: Array<Record<string, string | number | boolean | null>>;
  /** The column this object type's segmentation filter defaults to -- null if that attribute
   * isn't actually present on this tenant's records (a real, honest gap, not an error). */
  primaryDimension: string | null;
  /** Real counts per value of primaryDimension, sorted descending -- "servicing finance needs or
   * clinical needs" as an at-a-glance rollup, not just a filter dropdown with no sense of scale. */
  dimensionCounts: Array<{ value: string; count: number }>;
}

export interface TechnologyEstateBundle {
  recordTypes: TechRecordType[];
}

/** Extracts and trims the raw canonical records for the four tech object types into a table-ready
 * shape. Deterministic, no model call -- callable directly from build-home-chapters.ts alongside
 * the Claude-generated chapters, or standalone for a quick local check. */
export function buildTechnologyEstateBundle(records: CanonicalIngestionRecord[]): TechnologyEstateBundle {
  const recordTypes: TechRecordType[] = [];
  for (const objectType of TECH_OBJECT_TYPES) {
    const typeRecords = records.filter((r) => r.objectType === objectType);
    if (typeRecords.length === 0) continue;

    const columns: string[] = [];
    const seen = new Set<string>();
    for (const r of typeRecords) {
      for (const key of Object.keys(r.attributes)) {
        if (METADATA_KEYS.has(key) || isNarrativeKey(key) || seen.has(key)) continue;
        seen.add(key);
        columns.push(key);
      }
    }

    const rows = typeRecords.map((r) => {
      const row: Record<string, string | number | boolean | null> = {};
      for (const col of columns) {
        row[col] = formatAttributeValue(r.attributes[col]?.value ?? null);
      }
      return row;
    });

    const dimensionKey = PRIMARY_DIMENSION_KEY[objectType];
    const primaryDimension = columns.includes(dimensionKey) ? dimensionKey : null;
    const dimensionCounts: Array<{ value: string; count: number }> = [];
    if (primaryDimension) {
      const counts = new Map<string, number>();
      for (const row of rows) {
        const value = row[primaryDimension];
        const key = value === null || value === undefined || value === "" ? "(not specified)" : String(value);
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }
      dimensionCounts.push(...Array.from(counts, ([value, count]) => ({ value, count })).sort((a, b) => b.count - a.count));
    }

    recordTypes.push({ objectType, label: TECH_OBJECT_TYPE_LABELS[objectType], columns, rows, primaryDimension, dimensionCounts });
  }
  return { recordTypes };
}
