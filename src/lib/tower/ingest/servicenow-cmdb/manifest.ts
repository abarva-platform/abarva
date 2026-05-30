import type { TowerIngestSourceManifest } from '../registry';

export const SERVICENOW_CMDB_MANIFEST: TowerIngestSourceManifest = {
  key: 'servicenow-cmdb',
  label: 'ServiceNow CMDB',
  summary:
    'Configuration item inventory and dependency graph extracted from the ServiceNow CMDB.',
  vendor: 'ServiceNow',
  capability: 'cmdb_inventory',
  templatePath: 'public/templates/tower/servicenow-cmdb/template.xlsx',
  samplePath: 'public/templates/tower/servicenow-cmdb/sample.xlsx',
  readmePath: 'docs/templates/tower/servicenow-cmdb/README.md',
  migrationPath:
    'supabase/migrations/20260530120000_tower_cmdb.sql',
  targetTables: ['tower_cmdb_cis', 'tower_cmdb_dependencies'],
  realWorldExtractPath:
    'ServiceNow → CMDB → CI export (Table API on cmdb_ci, paginated) + relationship export (Table API on cmdb_rel_ci). Most customers schedule both as nightly exports to an S3 / Azure Blob landing zone.',
  ownerTeam: 'Tower · Atlas platform',
};
