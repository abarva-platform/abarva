/**
 * Tower ingest source registry.
 *
 * Tower watches real enterprise systems (CMDB, observability, FinOps, ITSM,
 * identity, etc.). Each "source" is a slice owned by one of the parallel
 * tower-ingest branches. This file is APPEND-ONLY: each slice adds exactly
 * one entry via {@link registerTowerIngestSource}. Order is not significant —
 * lookups are by key. Duplicate keys throw at module-load time so two slices
 * cannot silently overwrite each other.
 *
 * The audit (`docs/build/TOWER_AUDIT_2026-05-06.md`) found ZERO live
 * integrations in Tower. This registry is the spine that pulls each
 * source-specific ingest (parser, validator, CLI, template, README,
 * migration) into one discoverable map so Atlas — and the future
 * connector-onboarding UI — can enumerate what Tower can ingest today.
 */

export type TowerIngestSourceKey =
  | 'servicenow-cmdb'
  // Sibling slices append their keys here (one per PR). Use the same
  // hyphenated slug as the `public/templates/tower/<slug>/` directory.
  ;

export interface TowerIngestSourceManifest {
  /** Stable kebab-case key. Matches the template + docs directory name. */
  key: TowerIngestSourceKey;
  /** Human-readable label shown in Atlas surfaces. */
  label: string;
  /** One-line description of the source system. */
  summary: string;
  /** The external system Tower watches. */
  vendor: string;
  /** ITIL / IT Ops capability the source covers. */
  capability:
    | 'cmdb_inventory'
    | 'observability'
    | 'finops'
    | 'itsm'
    | 'identity'
    | 'security'
    | 'release'
    | 'asset_management';
  /** Relative path to the blank workbook (synthetic banner present). */
  templatePath: string;
  /** Relative path to the sample-filled workbook (banner: synthetic data). */
  samplePath: string;
  /** Relative path to the enterprise runbook README. */
  readmePath: string;
  /** Relative path to the SQL migration that defines the target tables. */
  migrationPath: string;
  /** Target Postgres tables this source writes into. */
  targetTables: ReadonlyArray<string>;
  /**
   * Short description of the canonical "real-world extract path" — how a
   * customer actually gets the data out of the source system. Surfaced to
   * the user in the connector picker so they know what to do before
   * downloading the template.
   */
  realWorldExtractPath: string;
  /** Owner team that maintains the source-specific parser + tests. */
  ownerTeam: string;
}

const REGISTRY = new Map<TowerIngestSourceKey, TowerIngestSourceManifest>();

/**
 * Register a tower ingest source. Idempotent: re-registering the same
 * manifest object (by reference) is a no-op. Registering a *different*
 * manifest under an existing key throws — that's the union-merge guard
 * that catches two slices stomping on the same slot.
 */
export function registerTowerIngestSource(
  manifest: TowerIngestSourceManifest,
): void {
  const existing = REGISTRY.get(manifest.key);
  if (existing && existing !== manifest) {
    throw new Error(
      `tower_ingest_registry_conflict: key "${manifest.key}" already registered by a different manifest`,
    );
  }
  REGISTRY.set(manifest.key, manifest);
}

export function getTowerIngestSource(
  key: TowerIngestSourceKey,
): TowerIngestSourceManifest | null {
  return REGISTRY.get(key) ?? null;
}

export function listTowerIngestSources(): ReadonlyArray<TowerIngestSourceManifest> {
  return Array.from(REGISTRY.values());
}

// --- registrations ----------------------------------------------------------
//
// Each slice appends ONE registration below. Keep the list alphabetical by
// key. The import-for-side-effect pattern keeps every registration in one
// auditable file without cross-slice coupling.

import { SERVICENOW_CMDB_MANIFEST } from './servicenow-cmdb/manifest';

registerTowerIngestSource(SERVICENOW_CMDB_MANIFEST);
