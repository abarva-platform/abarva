import type { TowerIngestSource } from '../registry';

export * from './parse';
export * from './validate';
export * from './plan';
export * from './types';

export const claudeCodeSource: TowerIngestSource = {
  key: 'claude-code',
  displayName: 'Claude Code (Anthropic)',
  vendor: 'Anthropic',
  kind: 'usage',
  targetTable: 'tower_ai_tool_usage',
  templatePath: '/templates/tower/claude-code/template.xlsx',
  samplePath: '/templates/tower/claude-code/sample-filled.xlsx',
  readmePath: 'docs/templates/tower/claude-code/README.md',
  parserModule: 'lib/tower/ingest/claude-code/parse',
  validatorModule: 'lib/tower/ingest/claude-code/validate',
  cliScript: 'ingest-claude-code',
  extractPath:
    'Anthropic Console → Organization Admin → Usage → per-developer CSV; Billing API for cost allocation.',
  sampleSummary: { tenant: 'Northwind Retail', rowsApprox: 60 },
};
