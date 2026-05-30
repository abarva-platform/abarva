// ServiceNow ITSM ingest types — slice S6.
//
// Real-world source: ServiceNow ITSM tables (incident, problem, change) exported via
// scheduled CSV or the Table API. We accept a normalized union row per record_type.

export const RECORD_TYPES = ['incident', 'problem', 'change'] as const;
export type RecordType = (typeof RECORD_TYPES)[number];

export const PRIORITIES = ['P1', 'P2', 'P3', 'P4'] as const;
export type Priority = (typeof PRIORITIES)[number];

/**
 * Canonical row shape after parsing. All optional fields fall back to null when
 * the source extract omits them (closed_at is null for open incidents, etc.).
 */
export interface ItsmRecord {
  record_number: string;
  record_type: RecordType;
  priority: Priority;
  service: string;
  assignment_group: string | null;
  opened_at: string; // ISO8601 UTC
  closed_at: string | null; // ISO8601 UTC or null if open
  mttr_minutes: number | null; // computed if absent and both timestamps present
  change_success: boolean | null; // only meaningful for record_type === 'change'
}

export interface ItsmRowError {
  row_index: number; // 1-based index in source CSV (excludes header)
  record_number: string | null;
  field: string;
  message: string;
}

export interface ItsmParseResult {
  rows_total: number;
  records: ItsmRecord[];
  errors: ItsmRowError[];
  notes: string[];
}

export interface ItsmIngestSummary {
  rows_total: number;
  rows_valid: number;
  rows_failed: number;
  rows_inserted: number;
  rows_skipped_duplicate: number;
  errors: ItsmRowError[];
  notes: string[];
}
