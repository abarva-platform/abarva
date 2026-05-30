// Public entry points for the ServiceNow ITSM ingest module.

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
