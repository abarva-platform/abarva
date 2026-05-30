// Column / schema definitions for the ServiceNow ITSM template workbook.
//
// Shared between the xlsx generator and the README/Schema sheet so the
// description in the workbook and the docs never drift.

import { PRIORITIES, RECORD_TYPES } from './types';

export interface ItsmColumnSpec {
  key: string;
  label: string;
  required: boolean;
  type: 'string' | 'enum' | 'date' | 'number' | 'boolean';
  enumValues?: readonly string[];
  description: string;
  example: string;
}

export const ITSM_TEMPLATE_VERSION = '1.0';

export const ITSM_COLUMN_SPECS: ItsmColumnSpec[] = [
  {
    key: 'record_number',
    label: 'record_number',
    required: true,
    type: 'string',
    description: 'ServiceNow record number — INC*, PRB*, or CHG*. Stable, unique per record.',
    example: 'INC0001042',
  },
  {
    key: 'record_type',
    label: 'record_type',
    required: true,
    type: 'enum',
    enumValues: RECORD_TYPES,
    description: 'incident | problem | change.',
    example: 'incident',
  },
  {
    key: 'priority',
    label: 'priority',
    required: true,
    type: 'enum',
    enumValues: PRIORITIES,
    description: 'ServiceNow priority — P1 (critical) through P4 (low). Numeric "1"-"4" also accepted.',
    example: 'P2',
  },
  {
    key: 'service',
    label: 'service',
    required: true,
    type: 'string',
    description: 'Business service the record is associated with (cmdb_ci / business_service).',
    example: 'POS Checkout',
  },
  {
    key: 'assignment_group',
    label: 'assignment_group',
    required: false,
    type: 'string',
    description: 'Team assigned to resolve the record. Optional.',
    example: 'NWR-Retail-Apps',
  },
  {
    key: 'opened_at',
    label: 'opened_at',
    required: true,
    type: 'date',
    description: 'ISO8601 timestamp (UTC). ServiceNow "sys_created_on" or "opened_at".',
    example: '2026-04-18T14:22:00Z',
  },
  {
    key: 'closed_at',
    label: 'closed_at',
    required: false,
    type: 'date',
    description: 'ISO8601 timestamp (UTC). Blank if still open. Must be ≥ opened_at.',
    example: '2026-04-18T15:11:00Z',
  },
  {
    key: 'mttr_minutes',
    label: 'mttr_minutes',
    required: false,
    type: 'number',
    description: 'Optional. Computed from opened_at / closed_at when omitted.',
    example: '49',
  },
  {
    key: 'change_success',
    label: 'change_success',
    required: false,
    type: 'boolean',
    description: 'For change records only. true/false/blank. Ignored for incident & problem.',
    example: 'true',
  },
];
