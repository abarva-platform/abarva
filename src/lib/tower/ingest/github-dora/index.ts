// Public surface for the GitHub → DORA Tower ingest slice (S1).
//
// Re-exports the parse / validate / ingest functions plus the schema
// so the registry, CLI, and tests can import from a single path.

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
