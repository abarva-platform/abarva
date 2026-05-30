// Tower ingest-source registry.
//
// One entry per live source connector. Each entry is the single source of
// truth for: template file location, README path, parser entrypoint module,
// target DB table, and human-readable description. Slices append exactly one
// entry to TOWER_INGEST_SOURCES — `union-merge` semantics mean entries with
// the same `key` are deduped (last-write-wins), so concurrent slices don't
// clobber each other when their PRs merge.

export interface TowerIngestSource {
  key: string;
  label: string;
  recordType: 'itsm' | 'observability' | 'fin-ops' | 'governance' | 'identity' | 'other';
  description: string;
  templatePath: string; // public/templates/...
  readmePath: string; // docs/templates/...
  parserModule: string; // import path
  cliScript: string; // src/scripts/...
  targetTable: string;
  status: 'planned' | 'available';
}

/**
 * Union-merge: keep entries unique by `key`, preserving last-write-wins so a
 * downstream extension can override an entry without rewriting the registry.
 */
export function mergeIngestSources(
  base: readonly TowerIngestSource[],
  extra: readonly TowerIngestSource[],
): TowerIngestSource[] {
  const out = new Map<string, TowerIngestSource>();
  for (const src of base) out.set(src.key, src);
  for (const src of extra) out.set(src.key, src);
  return Array.from(out.values());
}

const REGISTRY_BASE: TowerIngestSource[] = [
  {
    key: 'servicenow-itsm',
    label: 'ServiceNow ITSM',
    recordType: 'itsm',
    description:
      'Incidents, problems, and changes from ServiceNow ITSM tables. Feeds Atlas MTTR / P1 / P2 / change-success read models.',
    templatePath: 'public/templates/tower/servicenow-itsm/template.xlsx',
    readmePath: 'docs/templates/tower/servicenow-itsm/README.md',
    parserModule: '@/lib/tower/ingest/servicenow-itsm',
    cliScript: 'src/scripts/tower/ingest-servicenow-itsm.ts',
    targetTable: 'tower_itsm_records',
    status: 'available',
  },
];

// Final registry — derived via union-merge so future appends preserve
// idempotency and don't bork if two slices touch the same line.
export const TOWER_INGEST_SOURCES: TowerIngestSource[] = mergeIngestSources(REGISTRY_BASE, []);

export function findIngestSource(key: string): TowerIngestSource | undefined {
  return TOWER_INGEST_SOURCES.find((s) => s.key === key);
}
