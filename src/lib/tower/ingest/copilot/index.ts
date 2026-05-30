import type { TowerIngestSource } from '../registry';

export * from './parse';
export * from './validate';
export * from './schema';
export * from './template-builder';
export * from './synthetic';

export const copilotSource: TowerIngestSource = {
  key: 'copilot',
  displayName: 'GitHub Copilot — Usage + Cost',
  vendor: 'GitHub',
  kind: 'usage',
  targetTable: 'tower_ai_tool_usage',
  templatePath: '/templates/tower/copilot/template.xlsx',
  samplePath: '/templates/tower/copilot/sample-filled.xlsx',
  readmePath: 'docs/templates/tower/copilot/README.md',
  parserModule: 'lib/tower/ingest/copilot/parse',
  validatorModule: 'lib/tower/ingest/copilot/validate',
  cliScript: 'ingest-copilot',
  extractPath:
    'GitHub Org → Settings → Copilot → Usage Metrics CSV; Seats export; Billing API for cost allocation.',
  sampleSummary: { tenant: 'Northwind Retail', rowsApprox: 120 },
};
