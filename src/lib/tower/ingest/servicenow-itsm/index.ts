// Public entry points for the ServiceNow ITSM ingest module.

import type { TowerIngestSource } from '../registry';

export const servicenowItsmSource: TowerIngestSource = {
  key: 'servicenow-itsm',
  displayName: 'ServiceNow ITSM',
  vendor: 'ServiceNow',
  kind: 'risk',
  targetTable: 'tower_itsm_records',
  templatePath: '/templates/tower/servicenow-itsm/template.xlsx',
  samplePath: '/templates/tower/servicenow-itsm/sample.xlsx',
  readmePath: 'docs/templates/tower/servicenow-itsm/README.md',
  parserModule: 'lib/tower/ingest/servicenow-itsm/parse',
  validatorModule: 'lib/tower/ingest/servicenow-itsm/validate',
  cliScript: 'ingest-servicenow-itsm',
  extractPath:
    'ServiceNow → incident, problem, change_request tables → CSV export (REST API or scheduled export).',
  sampleSummary: { tenant: 'Northwind Retail', rowsApprox: 300 },
};

export type {
  ItsmIngestSummary,
  ItsmParseResult,
  ItsmRecord,
  ItsmRowError,
  Priority,
  RecordType,
} from './types';
export { PRIORITIES, RECORD_TYPES } from './types';
export { parseServiceNowItsmCsv, parseIsoDate, ITSM_COLUMNS } from './parse';
export { validateItsmRecords } from './validate';
export type { ItsmValidationResult } from './validate';
export { summarize, writeItsmRecords } from './writer';
export type { WriteArgs, WriteResult } from './writer';
export {
  NORTHWIND_ASSIGNMENT_GROUPS,
  NORTHWIND_SERVICES,
  SYNTHETIC_BANNER,
  buildNorthwindSampleRecords,
} from './sample';
export { ITSM_COLUMN_SPECS, ITSM_TEMPLATE_VERSION } from './template-schema';
export type { ItsmColumnSpec } from './template-schema';
