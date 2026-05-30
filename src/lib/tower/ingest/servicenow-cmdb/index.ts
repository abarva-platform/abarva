import type { TowerIngestSource } from '../registry';

export * from './parse';
export * from './validate';
export * from './schema';

export const servicenowCmdbSource: TowerIngestSource = {
  key: 'servicenow-cmdb',
  displayName: 'ServiceNow CMDB',
  vendor: 'ServiceNow',
  kind: 'inventory',
  targetTable: 'tower_cmdb_cis',
  templatePath: '/templates/tower/servicenow-cmdb/template.xlsx',
  samplePath: '/templates/tower/servicenow-cmdb/sample.xlsx',
  readmePath: 'docs/templates/tower/servicenow-cmdb/README.md',
  parserModule: 'lib/tower/ingest/servicenow-cmdb/parse',
  validatorModule: 'lib/tower/ingest/servicenow-cmdb/validate',
  cliScript: 'ingest-servicenow-cmdb',
  extractPath:
    'ServiceNow → CMDB → CI export (Table API on cmdb_ci, paginated) + relationship export (Table API on cmdb_rel_ci). Most customers schedule both as nightly exports to S3 / Azure Blob.',
  sampleSummary: { tenant: 'Northwind Retail', rowsApprox: 500 },
};
