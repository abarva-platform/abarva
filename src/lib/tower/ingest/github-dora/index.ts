// Public surface for the GitHub → DORA Tower ingest slice (S1).
//
// Re-exports the parse / validate / ingest functions plus the schema
// so the registry, CLI, and tests can import from a single path.

import type { TowerIngestSource } from '../registry';

export const githubDoraSource: TowerIngestSource = {
  key: 'github-dora',
  displayName: 'GitHub → DORA metrics',
  vendor: 'GitHub',
  kind: 'productivity',
  targetTable: 'tower_dora_metrics',
  templatePath: '/templates/tower/github-dora/template.xlsx',
  samplePath: '/templates/tower/github-dora/sample-filled.xlsx',
  readmePath: 'docs/templates/tower/github-dora/README.md',
  parserModule: 'lib/tower/ingest/github-dora/parse',
  validatorModule: 'lib/tower/ingest/github-dora/validate',
  cliScript: 'ingest-github-dora',
  extractPath:
    'GitHub Actions deployments + PR merges + incident:* issues; REST API /repos/{owner}/{repo}/actions/runs.',
  sampleSummary: { tenant: 'Northwind Retail', rowsApprox: 100 },
};

export {
  GITHUB_DORA_COLUMNS,
  GITHUB_DORA_COLUMN_SPECS,
  GithubDoraRowSchema,
  type GithubDoraColumn,
  type GithubDoraColumnSpec,
  type GithubDoraRawRow,
  type GithubDoraRow,
  type GithubDoraRowError,
} from './schema';
export { parseGithubDoraWorkbook } from './parse';
export type { GithubDoraParseResult } from './parse';
export { validateGithubDoraRows } from './validate';
export type { GithubDoraValidationResult } from './validate';
export {
  applyIngestPlan,
  buildIngestPlan,
  resolveClientIdByTenantKey,
  type GithubDoraIngestPlan,
  type GithubDoraIngestPlanRow,
  type GithubDoraIngestSummary,
} from './ingest';
