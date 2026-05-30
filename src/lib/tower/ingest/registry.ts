/**
 * Tower live-source ingest registry.
 *
 * Each Tower data source (Jira, GitHub, ServiceNow, Workday, cloud billing,
 * Copilot, etc.) registers ONE entry here so the `/tower/onboard` index, the
 * CLI runner, and the upload classifier all share a single source of truth.
 *
 * **Union-merge contract:** every slice appends ONE entry to
 * `TOWER_INGEST_SOURCES` keyed by `source`. The key must be globally unique
 * across slices. If two slices land the same key the build fails (see
 * {@link assertRegistryUniqueKeys}). This file deliberately exports a single
 * flat list — no nested categories — so cross-slice diffs are obvious.
 */

export type TowerIngestDimension =
  | 'engineering' // DORA, velocity, cycle time, work-in-flight
  | 'cmdb' // services, applications, owners
  | 'itsm' // tickets, change, incident
  | 'hcm' // roles, headcount, location
  | 'erp' // contracts, vendors, spend
  | 'cloud_cost' // billing, FinOps
  | 'ai_tooling' // Copilot / Cursor / Claude usage
  | 'portfolio_csv'; // legacy 5-dimension CSV bundle

export interface TowerIngestSource {
  /** Globally unique key. lowercase, kebab-case. e.g. "jira". */
  source: string;

  /** Human label shown in /tower/onboard. */
  displayName: string;

  /** Which Tower dimension(s) this source feeds. */
  dimensions: TowerIngestDimension[];

  /** Primary DB table populated by this source. */
  targetTable: string;

  /** Static path to the workbook template, relative to /public. */
  templatePath: string;

  /** Path to README runbook, relative to repo root. */
  readmePath: string;

  /**
   * Real-world extract recipe (one-liner). Surfaced in the Onboard catalog.
   * E.g. "JQL export of issues + history" or "GitHub REST API /repos/{owner}/{repo}/actions/runs".
   */
  extractRecipe: string;

  /** npm script that runs the CLI. e.g. "tower:ingest:jira". */
  cliScript: string;

  /** Migration file (basename) that creates the target table. */
  migration: string;
}

/**
 * Single flat list. Append ONE entry per slice. Keep alphabetical by `source`
 * so concurrent slices land different physical lines and union-merge cleanly.
 */
export const TOWER_INGEST_SOURCES: TowerIngestSource[] = [
  {
    source: 'jira',
    displayName: 'Jira — epics, stories, velocity, cycle time',
    dimensions: ['engineering'],
    targetTable: 'tower_jira_issues',
    templatePath: '/templates/tower/jira/template.xlsx',
    readmePath: 'docs/templates/tower/jira/README.md',
    extractRecipe:
      'Jira → Issues filter → Export Excel CSV (current fields), OR REST /rest/api/3/search?jql=… with history expansion',
    cliScript: 'tower:ingest:jira',
    migration: '20260530120000_tower_jira_issues.sql',
  },
];

/**
 * Throw if two registry entries share a key. Called at module load by tests
 * and at CLI startup so a bad merge never reaches deploy.
 */
export function assertRegistryUniqueKeys(
  sources: readonly TowerIngestSource[] = TOWER_INGEST_SOURCES,
): void {
  const seen = new Set<string>();
  const dupes: string[] = [];
  for (const s of sources) {
    if (seen.has(s.source)) dupes.push(s.source);
    seen.add(s.source);
  }
  if (dupes.length > 0) {
    throw new Error(
      `TOWER_INGEST_SOURCES has duplicate keys: ${dupes.join(', ')}. Each slice owns ONE key.`,
    );
  }
}

assertRegistryUniqueKeys();

export function findIngestSource(source: string): TowerIngestSource | undefined {
  return TOWER_INGEST_SOURCES.find((s) => s.source === source);
}
