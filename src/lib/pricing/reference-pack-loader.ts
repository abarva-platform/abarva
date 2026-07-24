/**
 * Nexus Pricing Engine — PR2 reference-pack loader.
 *
 * Takes PR1's checked-in CSV reference pack
 * (`datasets/reference/pricing-engine-v1/`) and idempotently loads it into
 * the `pricing_*` reference tables created by
 * `supabase/migrations/20260723233000_pricing_reference_schema_v1.sql`:
 * parse -> validate (reusing PR1's own coverage-validator rules) -> diff
 * against the current taxonomy version by content hash -> no-op or
 * new-version-insert.
 *
 * This is the first real consumer proving the idempotency contract
 * (`src/lib/pricing/versioning.ts`) end-to-end against real, checked-in
 * data. Per the PR2 execution prompt, this module is a directly-callable
 * service + test/CLI harness ONLY — it is NOT wired into any API route or
 * admin UI (that is PR3 scope).
 *
 * ## Design note: why this file reads CSVs itself rather than reusing
 * `scripts/pricing/csv-utils.ts`
 *
 * `src/lib/pricing/` is meant to be a self-contained module tree (it may
 * eventually be imported by API routes / server actions in PR3+), so its
 * CSV I/O is a small, local, dependency-free reader (same `papaparse`
 * dependency `scripts/pricing/csv-utils.ts` already uses) rather than a
 * `src/lib` -> `scripts/` import. The ONE deliberate exception is
 * `validateCoverage` from `scripts/pricing/validate-pricing-role-coverage.ts`
 * — the PR2 brief explicitly asks this loader to "validate against the same
 * validate-pricing-role-coverage rules where applicable", and duplicating
 * that validator's rules here would be exactly the kind of drift the brief
 * is trying to avoid. That function is pure and side-effect-free to import.
 */
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import Papa from "papaparse";
import { azureRead } from "@/lib/data-plane/azureRead";
import { createTxSession, type TxSessionRunner } from "@/lib/data-plane/read-adapters/azureSession";
import { validateCoverage, type CoverageResult } from "../../../scripts/pricing/validate-pricing-role-coverage";
import { computeContentHash, decideVersionAction, type VersionDecision } from "./versioning";

// ---------------------------------------------------------------------------
// CSV read
// ---------------------------------------------------------------------------

type RawRow = Record<string, string>;

function readCsvFile(filePath: string): RawRow[] {
  const raw = fs.readFileSync(filePath, "utf8");
  const parsed = Papa.parse<RawRow>(raw, { header: true, skipEmptyLines: true });
  if (parsed.errors.length > 0) {
    throw new Error(
      `${filePath}: CSV parse error(s): ${parsed.errors.map((e) => `${e.message} (row ${e.row})`).join("; ")}`,
    );
  }
  return parsed.data;
}

export interface ReferencePackManifest {
  dataset_id: string;
  version: string;
  generated_from: { source_file_name: string; source_sha256: string };
  row_counts: Record<string, number>;
  [key: string]: unknown;
}

export interface ReferencePackData {
  manifest: ReferencePackManifest;
  towers: RawRow[];
  capabilities: RawRow[];
  roleFamilies: RawRow[];
  roles: RawRow[];
  roleAliases: RawRow[];
  seniorityLevels: RawRow[];
  rateBands: RawRow[];
  providerClasses: RawRow[];
  deliveryLocations: RawRow[];
}

const CSV_FILES = {
  towers: "pricing_towers.csv",
  capabilities: "pricing_capabilities.csv",
  roleFamilies: "pricing_role_families.csv",
  roles: "pricing_roles.csv",
  roleAliases: "pricing_role_aliases.csv",
  seniorityLevels: "pricing_seniority_levels.csv",
  rateBands: "pricing_rate_bands.csv",
  providerClasses: "pricing_provider_classes.csv",
  deliveryLocations: "pricing_delivery_locations.csv",
} as const;

/** Read the reference pack directory (manifest.json + 9 CSVs) into memory. Pure I/O, no validation. */
export function readReferencePackDir(dir: string): ReferencePackData {
  const manifest = JSON.parse(
    fs.readFileSync(path.join(dir, "manifest.json"), "utf8"),
  ) as ReferencePackManifest;
  return {
    manifest,
    towers: readCsvFile(path.join(dir, CSV_FILES.towers)),
    capabilities: readCsvFile(path.join(dir, CSV_FILES.capabilities)),
    roleFamilies: readCsvFile(path.join(dir, CSV_FILES.roleFamilies)),
    roles: readCsvFile(path.join(dir, CSV_FILES.roles)),
    roleAliases: readCsvFile(path.join(dir, CSV_FILES.roleAliases)),
    seniorityLevels: readCsvFile(path.join(dir, CSV_FILES.seniorityLevels)),
    rateBands: readCsvFile(path.join(dir, CSV_FILES.rateBands)),
    providerClasses: readCsvFile(path.join(dir, CSV_FILES.providerClasses)),
    deliveryLocations: readCsvFile(path.join(dir, CSV_FILES.deliveryLocations)),
  };
}

/** Row counts keyed exactly like `manifest.json`'s own `row_counts` field, for direct comparison in tests. */
export function rowCountsByTable(data: ReferencePackData): Record<string, number> {
  return {
    [CSV_FILES.towers]: data.towers.length,
    [CSV_FILES.capabilities]: data.capabilities.length,
    [CSV_FILES.roleFamilies]: data.roleFamilies.length,
    [CSV_FILES.roles]: data.roles.length,
    [CSV_FILES.roleAliases]: data.roleAliases.length,
    [CSV_FILES.seniorityLevels]: data.seniorityLevels.length,
    [CSV_FILES.rateBands]: data.rateBands.length,
    [CSV_FILES.providerClasses]: data.providerClasses.length,
    [CSV_FILES.deliveryLocations]: data.deliveryLocations.length,
  };
}

/** Reuses PR1's own pure coverage validator — see file header for why this one cross-directory import is deliberate. */
export function validateAgainstCoverageRules(data: ReferencePackData): CoverageResult {
  return validateCoverage({
    towers: data.towers as never,
    capabilities: data.capabilities as never,
    roles: data.roles as never,
    aliases: data.roleAliases as never,
    levels: data.seniorityLevels as never,
    rateBands: data.rateBands as never,
  });
}

/** sha256 of the whole normalized row set (every table, rows sorted by their natural code column). */
export function computePackContentHash(data: ReferencePackData): string {
  const sortBy = (rows: RawRow[], key: string) =>
    [...rows].sort((a, b) => (a[key] < b[key] ? -1 : a[key] > b[key] ? 1 : 0));
  return computeContentHash({
    towers: sortBy(data.towers, "tower_code"),
    capabilities: sortBy(data.capabilities, "capability_code"),
    roleFamilies: sortBy(data.roleFamilies, "role_family_code"),
    roles: sortBy(data.roles, "role_code"),
    roleAliases: sortBy(data.roleAliases, "alias_code"),
    seniorityLevels: sortBy(data.seniorityLevels, "level_code"),
    rateBands: sortBy(data.rateBands, "rate_band_code"),
    providerClasses: sortBy(data.providerClasses, "provider_class_code"),
    deliveryLocations: sortBy(data.deliveryLocations, "location_code"),
  });
}

// ---------------------------------------------------------------------------
// Numeric/boolean coercion for the physical INSERT (CSV fields arrive as strings)
// ---------------------------------------------------------------------------

function toIntOrNull(value: string | undefined): number | null {
  if (value === undefined || value === "") return null;
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? n : null;
}
function toNumOrNull(value: string | undefined): number | null {
  if (value === undefined || value === "") return null;
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : null;
}
function toBool(value: string | undefined, fallback = true): boolean {
  if (value === undefined || value === "") return fallback;
  return value.trim().toLowerCase() === "true";
}

/** Build the physical per-table row payloads (tagged with `taxonomy_version` + per-row `content_hash`) ready for INSERT. */
export function buildTaggedTableRows(
  data: ReferencePackData,
  taxonomyVersion: number,
): Record<string, Record<string, unknown>[]> {
  const tag = <T extends Record<string, unknown>>(row: T) => ({
    ...row,
    taxonomy_version: taxonomyVersion,
    content_hash: computeContentHash(row),
  });

  return {
    pricing_towers: data.towers.map((r) =>
      tag({
        tower_code: r.tower_code,
        tower_name: r.tower_name,
        scope: r.scope || null,
        source_artifact: r.source_artifact || null,
        source_row: toIntOrNull(r.source_row),
        source_label: r.source_label || null,
        status: r.status || "active",
      }),
    ),
    pricing_capabilities: data.capabilities.map((r) =>
      tag({
        capability_code: r.capability_code,
        tower_code: r.tower_code,
        capability_name: r.capability_name,
        scarcity_tier: r.scarcity_tier || null,
        agent_amenability: toIntOrNull(r.agent_amenability),
        source_artifact: r.source_artifact || null,
        source_row: toIntOrNull(r.source_row),
        source_label: r.source_label || null,
        status: r.status || "active",
      }),
    ),
    pricing_role_families: data.roleFamilies.map((r) =>
      tag({
        role_family_code: r.role_family_code,
        tower_code: r.tower_code,
        capability_code: r.capability_code,
        family_name: r.family_name,
        source_artifact: r.source_artifact || null,
        status: r.status || "active",
      }),
    ),
    pricing_roles: data.roles.map((r) =>
      tag({
        role_code: r.role_code,
        canonical_name: r.canonical_name,
        tower_code: r.tower_code,
        capability_code: r.capability_code,
        role_family_code: r.role_family_code,
        role_type: r.role_type,
        allowed_level_min: r.allowed_level_min,
        allowed_level_max: r.allowed_level_max,
        default_rate_band_code: r.default_rate_band_code || null,
        internal_external_default: r.internal_external_default || null,
        billable_default: toBool(r.billable_default, true),
        source_artifact: r.source_artifact || null,
        source_row: toIntOrNull(r.source_row),
        source_label: r.source_label || null,
        status: r.status || "active",
      }),
    ),
    pricing_role_aliases: data.roleAliases.map((r) =>
      tag({
        alias_code: r.alias_code,
        role_code: r.role_code,
        alias_label: r.alias_label,
        alias_type: r.alias_type,
        tenant_key: null, // PR1's reference pack is global-only
        provider_scope: null,
        source_artifact: r.source_artifact || null,
        source_row: toIntOrNull(r.source_row),
        status: r.status || "active",
      }),
    ),
    pricing_seniority_levels: data.seniorityLevels.map((r) =>
      tag({
        level_code: r.level_code,
        level_name: r.level_name,
        rank: toIntOrNull(r.rank),
        years_exp: r.years_exp || null,
        expectation: r.expectation || null,
        source_artifact: r.source_artifact || null,
        source_row: toIntOrNull(r.source_row),
        status: r.status || "active",
      }),
    ),
    pricing_rate_bands: data.rateBands.map((r) =>
      tag({
        rate_band_code: r.rate_band_code,
        role_code: r.role_code,
        level_code: r.level_code,
        currency: r.currency || "USD",
        rate_basis: r.rate_basis,
        rate_unit: r.rate_unit,
        loaded_rate: toNumOrNull(r.loaded_rate),
        scarcity_adj_rate: toNumOrNull(r.scarcity_adj_rate),
        indicative_bill_rate: toNumOrNull(r.indicative_bill_rate),
        valid_from: r.valid_from,
        source: r.source || null,
        confidence: r.confidence || null,
        approval_status: r.approval_status || null,
        status: r.status || "active",
      }),
    ),
    pricing_provider_classes: data.providerClasses.map((r) =>
      tag({
        provider_class_code: r.provider_class_code,
        class_name: r.class_name,
        archetype_label: r.archetype_label || null,
        tier_multiplier: toNumOrNull(r.tier_multiplier),
        source_artifact: r.source_artifact || null,
        source_row: toIntOrNull(r.source_row),
        status: r.status || "active",
      }),
    ),
    pricing_delivery_locations: data.deliveryLocations.map((r) =>
      tag({
        location_code: r.location_code,
        region_name: r.region_name,
        shore_category: r.shore_category,
        salary_multiplier: toNumOrNull(r.salary_multiplier),
        rate_multiplier: toNumOrNull(r.rate_multiplier),
        scarcity_multiplier: toNumOrNull(r.scarcity_multiplier),
        cost_of_living_index: toNumOrNull(r.cost_of_living_index),
        source_artifact: r.source_artifact || null,
        source_row: toIntOrNull(r.source_row),
        status: r.status || "active",
      }),
    ),
  };
}

// ---------------------------------------------------------------------------
// Storage seam — injectable so the full idempotency contract is testable
// without a live database (see __tests__/reference-pack-loader.test.ts).
// ---------------------------------------------------------------------------

export interface ReferencePackStorePort {
  getCurrentVersion(): Promise<{ version: number; contentHash: string } | null>;
  insertNewVersion(input: {
    version: number;
    contentHash: string;
    sourceSha256: string;
    generatedFrom: string;
    tables: Record<string, Record<string, unknown>[]>;
  }): Promise<void>;
}

const TABLE_INSERT_ORDER = [
  "pricing_towers",
  "pricing_capabilities",
  "pricing_role_families",
  "pricing_seniority_levels",
  "pricing_roles",
  "pricing_role_aliases",
  "pricing_rate_bands",
  "pricing_provider_classes",
  "pricing_delivery_locations",
] as const;

function defaultReferencePackStore(
  session: TxSessionRunner = createTxSession("abarva-pricing-write"),
): ReferencePackStorePort {
  return {
    async getCurrentVersion() {
      const row = await azureRead.maybeSingle<{ version: number; content_hash: string }>({
        table: "pricing_taxonomy_versions",
        where: { is_current: true },
        missingTable: "empty",
      });
      return row ? { version: row.version, contentHash: row.content_hash } : null;
    },
    async insertNewVersion(input) {
      await session(async (run) => {
        await run(
          `UPDATE pricing_taxonomy_versions SET is_current = false WHERE is_current = true`,
          [],
        );
        await run(
          `INSERT INTO pricing_taxonomy_versions
             (id, version, generated_from, source_sha256, content_hash, status, is_current)
           VALUES ($1, $2, $3, $4, $5, 'active', true)`,
          [randomUUID(), input.version, input.generatedFrom, input.sourceSha256, input.contentHash],
        );
        for (const table of TABLE_INSERT_ORDER) {
          const rows = input.tables[table] ?? [];
          for (const row of rows) {
            const columns = Object.keys(row);
            const placeholders = columns.map((_, i) => `$${i + 2}`);
            await run(
              `INSERT INTO ${table} (id, ${columns.join(", ")}) VALUES ($1, ${placeholders.join(", ")})`,
              [randomUUID(), ...columns.map((c) => row[c])],
            );
          }
        }
      });
    },
  };
}

// ---------------------------------------------------------------------------
// Orchestration
// ---------------------------------------------------------------------------

export type ReferencePackLoadResult =
  | { action: "noop"; taxonomyVersion: number; rowCounts: Record<string, number> }
  | {
      action: "new_version";
      taxonomyVersion: number;
      previousVersion: number | null;
      rowCounts: Record<string, number>;
    };

export interface LoadReferencePackOptions {
  store?: ReferencePackStorePort;
}

/**
 * Load the reference pack at `dir` into the `pricing_*` reference tables,
 * idempotently. Validates against `validate-pricing-role-coverage` rules
 * first — an invalid pack throws rather than partially loading.
 */
export async function loadReferencePack(
  dir: string,
  options: LoadReferencePackOptions = {},
): Promise<ReferencePackLoadResult> {
  const store = options.store ?? defaultReferencePackStore();
  const data = readReferencePackDir(dir);

  const coverage = validateAgainstCoverageRules(data);
  if (coverage.errors.length > 0) {
    throw new Error(
      `Reference pack at ${dir} failed coverage validation:\n${coverage.errors.map((e) => `  - ${e}`).join("\n")}`,
    );
  }

  const contentHash = computePackContentHash(data);
  const current = await store.getCurrentVersion();
  const decision: VersionDecision = decideVersionAction(contentHash, current);
  const rowCounts = rowCountsByTable(data);

  if (decision.action === "noop") {
    return { action: "noop", taxonomyVersion: decision.version, rowCounts };
  }

  const tables = buildTaggedTableRows(data, decision.version);
  await store.insertNewVersion({
    version: decision.version,
    contentHash,
    sourceSha256: data.manifest.generated_from?.source_sha256 ?? "unknown",
    generatedFrom: data.manifest.generated_from?.source_file_name ?? data.manifest.dataset_id,
    tables,
  });

  return {
    action: "new_version",
    taxonomyVersion: decision.version,
    previousVersion: decision.previousVersion,
    rowCounts,
  };
}

/** Default location of the reference pack, matching `scripts/pricing/*.ts`'s own `defaultDir()`. */
export function defaultReferencePackDir(): string {
  return path.resolve(__dirname, "..", "..", "..", "datasets", "reference", "pricing-engine-v1");
}
