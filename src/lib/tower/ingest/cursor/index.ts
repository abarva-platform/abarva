import type { TowerIngestSource } from '../registry';

export * from './parse';
export * from './validate';
export * from './schema';

export const cursorSource: TowerIngestSource = {
  key: 'cursor',
  displayName: 'Cursor — team usage + cost (monthly)',
  vendor: 'Cursor',
  kind: 'usage',
  targetTable: 'tower_ai_tool_usage',
  templatePath: '/templates/tower/cursor/template.xlsx',
  samplePath: '/templates/tower/cursor/sample-filled.xlsx',
  readmePath: 'docs/templates/tower/cursor/README.md',
  parserModule: 'lib/tower/ingest/cursor/parse',
  validatorModule: 'lib/tower/ingest/cursor/validate',
  cliScript: 'ingest-cursor',
  extractPath:
    'Cursor Admin Dashboard → Settings → Teams → Usage → Export CSV; Cursor Billing Portal → Invoices → per-team cost.',
  sampleSummary: { tenant: 'Northwind Retail', rowsApprox: 120 },
};
