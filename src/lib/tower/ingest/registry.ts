// Tower ingest registry · append-only.
//
// Each Tower source-system ingest registers ONE entry here. Sister slices
// (Claude Code, Cursor, etc.) append additional entries to this array —
// never edit or reorder existing entries. Conflicts must be union-merged.
//
// Consumers (UI catalog, CLI router, classifier) read this array to know
// which ingests exist and where their templates / parsers / runbooks live.

export interface TowerIngestEntry {
  /** Stable kebab-case identifier — matches the slug in the directory path. */
  slug: string;
  /** Human-readable source name. */
  displayName: string;
  /** Source category — drives grouping in the in-app catalog. */
  category:
    | 'ai_coding_tool'
    | 'ticketing'
    | 'observability'
    | 'identity'
    | 'finops'
    | 'cmdb'
    | 'devops'
    | 'other';
  /** Discriminator value written to the shared `tower_ai_tool_usage.tool` column, when applicable. */
  toolKind?: 'github_copilot' | 'claude_code' | 'cursor';
  /** Path under public/templates/tower/ for the empty + sample workbooks. */
  templateDir: string;
  /** Path to the runbook README for IT admins. */
  runbookPath: string;
  /** Path to the ingest CLI entrypoint. */
  cliScript: string;
  /** Path to the parser module. */
  parserModule: string;
  /** Path to the validator module. */
  validatorModule: string;
  /** Target Postgres table this slice writes into. */
  targetTable: string;
  /** Suggested refresh cadence for the source data. */
  refreshCadence: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  /** Owning persona/team responsible for keeping the runbook current. */
  ownerRole: string;
}

export const TOWER_INGEST_REGISTRY: TowerIngestEntry[] = [
  {
    slug: 'copilot',
    displayName: 'GitHub Copilot — Usage + Cost',
    category: 'ai_coding_tool',
    toolKind: 'github_copilot',
    templateDir: 'public/templates/tower/copilot/',
    runbookPath: 'docs/templates/tower/copilot/README.md',
    cliScript: 'src/scripts/tower/ingest-copilot.ts',
    parserModule: 'src/lib/tower/ingest/copilot/parse.ts',
    validatorModule: 'src/lib/tower/ingest/copilot/validate.ts',
    targetTable: 'tower_ai_tool_usage',
    refreshCadence: 'monthly',
    ownerRole: 'IT FinOps + DevEx',
  },
];

export function findIngest(slug: string): TowerIngestEntry | undefined {
  return TOWER_INGEST_REGISTRY.find((e) => e.slug === slug);
}
