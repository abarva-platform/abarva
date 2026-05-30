// Tower live-ingest registry.
//
// Append-only catalog of live source-system extractors that land into the
// Tower substrate. Each slice (S2 Copilot, S3 Claude Code, S4 Cursor, …)
// publishes ONE entry here so the Tower onboarding surface can display
// "what we extract today" honestly.
//
// Coordination rule (master brief):
//   - Append-only — never reorder, never delete.
//   - On conflict (two slices touch the same key), UNION-MERGE: combine
//     `dimensions`, `target_tables`, and `templates`; preserve the first
//     write of identity fields (`label`, `category`, `cadence`, `status`).
//
// This module intentionally avoids importing slice-specific parsers so
// adding a future slice never requires editing other slices.

export type TowerIngestCategory =
  | 'ai_coding_tool_usage'
  | 'project_tracker'
  | 'cmdb_itsm'
  | 'erp_hcm'
  | 'cloud_billing'
  | 'observability';

export type TowerIngestStatus = 'pilot' | 'production' | 'planned';

export type TowerIngestCadence = 'monthly' | 'weekly' | 'daily' | 'on_demand';

export interface TowerIngestEntry {
  key: string;
  label: string;
  category: TowerIngestCategory;
  source_system: string;
  extract_path: string;
  cadence: TowerIngestCadence;
  status: TowerIngestStatus;
  target_tables: string[];
  templates: string[];
  /**
   * Discriminator value used inside shared tables (e.g. `tower_ai_tool_usage.tool`).
   * Undefined for slices that land in dedicated tables.
   */
  tool_discriminator?: string;
  dimensions?: Array<'inventory' | 'adoption' | 'value' | 'risk' | 'cost'>;
  owner_slice: string;
}

/**
 * The mutable registry. Each slice appends ONE entry by importing the
 * module and pushing — never mutates anyone else's row.
 *
 * Order matches arrival order so audits can read it as a ledger.
 */
const ENTRIES: TowerIngestEntry[] = [];

export function registerTowerIngest(entry: TowerIngestEntry): TowerIngestEntry {
  if (!entry.key) throw new Error('TowerIngestEntry.key is required');
  const existing = ENTRIES.find((e) => e.key === entry.key);
  if (!existing) {
    ENTRIES.push(entry);
    return entry;
  }
  // Union-merge: combine list-valued fields, retain first-writer identity.
  existing.target_tables = uniq([...existing.target_tables, ...entry.target_tables]);
  existing.templates = uniq([...existing.templates, ...entry.templates]);
  existing.dimensions = uniq([
    ...(existing.dimensions ?? []),
    ...(entry.dimensions ?? []),
  ]) as TowerIngestEntry['dimensions'];
  return existing;
}

export function listTowerIngestEntries(): readonly TowerIngestEntry[] {
  return ENTRIES;
}

export function getTowerIngestEntry(key: string): TowerIngestEntry | undefined {
  return ENTRIES.find((e) => e.key === key);
}

/** Test-only: clear the registry between tests so the order assertions
 * remain deterministic. NOT exported via `index.ts` to avoid prod misuse. */
export function __resetTowerIngestRegistryForTests(): void {
  ENTRIES.length = 0;
}

function uniq<T>(xs: T[]): T[] {
  return Array.from(new Set(xs));
}
