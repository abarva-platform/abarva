import type { TowerIngestSource } from '../registry';

export * from './parse';
export * from './validate';
export * from './sample';
export * from './template';

export const azureCostSource: TowerIngestSource = {
  key: 'azure-cost',
  displayName: 'Azure Cost Management',
  vendor: 'Microsoft Azure',
  kind: 'cost',
  targetTable: 'tower_cloud_cost',
  templatePath: '/templates/tower/azure-cost/template.xlsx',
  samplePath: '/templates/tower/azure-cost/sample.xlsx',
  readmePath: 'docs/templates/tower/azure-cost/README.md',
  parserModule: 'lib/tower/ingest/azure-cost/parse',
  validatorModule: 'lib/tower/ingest/azure-cost/validate',
  cliScript: 'ingest-azure-cost',
  extractPath:
    'Azure Portal → Cost Management + Billing → Exports → monthly CSV to Blob; or Cost Management REST API.',
  sampleSummary: { tenant: 'Northwind Retail', rowsApprox: 2000 },
};
