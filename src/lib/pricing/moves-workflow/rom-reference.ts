/**
 * Moves ROM service — reference loaders over the committed cost foundation.
 *
 * Reads the rows `rom-service.ts` needs from the committed reference pack
 * (`datasets/reference/pricing-engine-v1/`): rate bands, delivery locations
 * and provider classes for the pod rate resolver, the pod library for
 * template pods, and the range-policy score tiers. This is global reference
 * data, not client data, and it ships in the web image.
 *
 * The pod library has no Postgres table yet, so the whole ROM reads the pack
 * from disk for one consistent source version rather than mixing the
 * database's rate bands with the pack's pods.
 *
 * Each loader reads its files once per loader set and returns the same rows
 * thereafter, so a `computeRom` call over these loaders is deterministic.
 * The pod-library parse mirrors `reference-pack-loader.ts#parsePodLibrary`
 * without importing that module's database and script dependencies into a
 * request path.
 */
import fs from "node:fs";
import path from "node:path";
import Papa from "papaparse";
import type { PodRateReference } from "../effort-engine/pod-rate-adapter";
import type { PodTemplateLibrary } from "../effort-engine/pod-templates";
import { loadPodLibrary as loadCanonicalPodLibrary } from "../reference-pack-loader";
import type { RomReferenceLoaders } from "./rom-service";

export const ROM_REFERENCE_PACK_RELATIVE_DIR = path.join(
  "datasets",
  "reference",
  "pricing-engine-v1",
);

/** The source label every ROM loaded from the committed pack carries. */
export const ROM_REFERENCE_SOURCE =
  "committed reference pack datasets/reference/pricing-engine-v1";

type RawRow = Record<string, string>;

function readCsv(dir: string, fileName: string): RawRow[] {
  const filePath = path.join(dir, fileName);
  const parsed = Papa.parse<RawRow>(fs.readFileSync(filePath, "utf8"), {
    header: true,
    skipEmptyLines: true,
  });
  if (parsed.errors.length > 0) {
    throw new Error(
      `${filePath}: CSV parse error(s): ${parsed.errors.map((e) => e.message).join("; ")}`,
    );
  }
  return parsed.data;
}

function requiredNumber(value: string | undefined, where: string): number {
  const n =
    value === undefined || value === "" ? Number.NaN : Number.parseFloat(value);
  if (!Number.isFinite(n))
    throw new Error(`${where}: expected a number, got "${value ?? ""}"`);
  return n;
}

function optionalNumber(value: string | undefined): number | null {
  if (value === undefined || value === "") return null;
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : null;
}

function once<T>(load: () => T): () => T {
  let loaded: { value: T } | null = null;
  return () => {
    if (!loaded) loaded = { value: load() };
    return loaded.value;
  };
}

/** Loaders over the committed pack at `dir` (default: `<cwd>/datasets/reference/pricing-engine-v1`). */
export function createCommittedRomReferenceLoaders(
  dir: string = path.join(process.cwd(), ROM_REFERENCE_PACK_RELATIVE_DIR),
): RomReferenceLoaders {
  const loadRateReference = once(
    (): Omit<PodRateReference, "basis"> => ({
      rateBands: readCsv(dir, "pricing_rate_bands.csv").map((r) => ({
        rate_band_code: r.rate_band_code,
        role_code: r.role_code,
        level_code: r.level_code,
        currency: r.currency || "USD",
        rate_basis: r.rate_basis,
        loaded_rate: optionalNumber(r.loaded_rate),
        scarcity_adj_rate: optionalNumber(r.scarcity_adj_rate),
        indicative_bill_rate: optionalNumber(r.indicative_bill_rate),
        confidence: r.confidence || null,
        approval_status: r.approval_status || null,
      })),
      locations: readCsv(dir, "pricing_delivery_locations.csv").map((r) => ({
        location_code: r.location_code,
        shore_category: r.shore_category,
        salary_multiplier: requiredNumber(
          r.salary_multiplier,
          `location ${r.location_code} salary_multiplier`,
        ),
        rate_multiplier: requiredNumber(
          r.rate_multiplier,
          `location ${r.location_code} rate_multiplier`,
        ),
      })),
      providerClasses: readCsv(dir, "pricing_provider_classes.csv").map(
        (r) => ({
          provider_class_code: r.provider_class_code,
          tier_multiplier: requiredNumber(
            r.tier_multiplier,
            `provider class ${r.provider_class_code} tier_multiplier`,
          ),
        }),
      ),
    }),
  );

  // The canonical pod-library parser (validation, mapping status, level
  // clamps and provenance) — never a second copy that can drift from it.
  const loadPodLibrary = once((): PodTemplateLibrary => {
    const { data } = loadCanonicalPodLibrary(dir);
    return {
      podTemplates: data.podTemplates,
      podTemplateRoles: data.podTemplateRoles,
    };
  });

  const loadRangePolicies = once(() =>
    readCsv(dir, "pricing_range_policies.csv")
      .filter((r) => (r.status || "active") === "active")
      .map((r) => ({
        policy_code: r.policy_code,
        policy_name: r.policy_name,
        min_score: requiredNumber(
          r.min_score,
          `range policy ${r.policy_code} min_score`,
        ),
        max_score: requiredNumber(
          r.max_score,
          `range policy ${r.policy_code} max_score`,
        ),
        low_multiplier: requiredNumber(
          r.low_multiplier,
          `range policy ${r.policy_code} low_multiplier`,
        ),
        high_multiplier: requiredNumber(
          r.high_multiplier,
          `range policy ${r.policy_code} high_multiplier`,
        ),
      })),
  );

  return { loadRateReference, loadPodLibrary, loadRangePolicies };
}
