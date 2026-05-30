// ServiceNow ITSM CSV parser — slice S6.
//
// Accepts a CSV blob extracted from ServiceNow incident/problem/change tables and
// normalizes it into ItsmRecord[]. Tolerant of header casing / whitespace and the
// usual ServiceNow boolean and date formats. No I/O. Pure function.

import Papa from 'papaparse';
import {
  PRIORITIES,
  RECORD_TYPES,
  type ItsmParseResult,
  type ItsmRecord,
  type ItsmRowError,
  type Priority,
  type RecordType,
} from './types';

/** Canonical column keys we extract — order matches the workbook Data sheet. */
export const ITSM_COLUMNS = [
  'record_number',
  'record_type',
  'priority',
  'service',
  'assignment_group',
  'opened_at',
  'closed_at',
  'mttr_minutes',
  'change_success',
] as const;
export type ItsmColumn = (typeof ITSM_COLUMNS)[number];

const PRIORITY_SET: ReadonlySet<string> = new Set(PRIORITIES);
const RECORD_TYPE_SET: ReadonlySet<string> = new Set(RECORD_TYPES);

const TRUE_TOKENS = new Set(['true', 't', 'yes', 'y', '1', 'success', 'successful']);
const FALSE_TOKENS = new Set(['false', 'f', 'no', 'n', '0', 'failed', 'failure', 'unsuccessful']);
const EMPTY_TOKENS = new Set(['', 'null', 'n/a', 'na', '-', 'unknown']);

function normHeader(h: string): string {
  return h.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
}

function pick(
  row: Record<string, string>,
  candidates: readonly string[],
): string {
  for (const cand of candidates) {
    const v = row[cand];
    if (v != null && String(v).trim().length > 0) return String(v).trim();
  }
  return '';
}

function parseRecordType(raw: string): RecordType | null {
  const v = raw.trim().toLowerCase();
  if (RECORD_TYPE_SET.has(v)) return v as RecordType;
  // ServiceNow source table names often arrive as "incident", "problem", "change_request".
  if (v.startsWith('change')) return 'change';
  if (v.startsWith('incident')) return 'incident';
  if (v.startsWith('problem')) return 'problem';
  return null;
}

function parsePriority(raw: string): Priority | null {
  const v = raw.trim().toUpperCase();
  if (PRIORITY_SET.has(v)) return v as Priority;
  // Numeric form: "1" -> "P1".
  if (/^[1-4]$/.test(v)) return `P${v}` as Priority;
  // "1 - Critical" -> "P1".
  const m = v.match(/^([1-4])\b/);
  if (m) return `P${m[1]}` as Priority;
  return null;
}

/** Parse a date string into ISO8601 UTC. Returns null if unparseable / empty. */
export function parseIsoDate(raw: string): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (EMPTY_TOKENS.has(trimmed.toLowerCase())) return null;
  // ServiceNow default: "YYYY-MM-DD HH:MM:SS" (no TZ → treat as UTC).
  const snowMatch = trimmed.match(
    /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(Z|[+-]\d{2}:?\d{2})?$/,
  );
  if (snowMatch) {
    const tz = snowMatch[7] ?? 'Z';
    const iso = `${snowMatch[1]}-${snowMatch[2]}-${snowMatch[3]}T${snowMatch[4]}:${snowMatch[5]}:${snowMatch[6]}${tz === 'Z' ? 'Z' : tz}`;
    const d = new Date(iso);
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  }
  // Bare date.
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const d = new Date(`${trimmed}T00:00:00Z`);
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  }
  // Fallback: native parser.
  const d = new Date(trimmed);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function parseChangeSuccess(raw: string): boolean | null {
  const v = raw.trim().toLowerCase();
  if (v.length === 0 || EMPTY_TOKENS.has(v)) return null;
  if (TRUE_TOKENS.has(v)) return true;
  if (FALSE_TOKENS.has(v)) return false;
  return null;
}

function parseNumber(raw: string): number | null {
  if (!raw) return null;
  const v = raw.trim();
  if (EMPTY_TOKENS.has(v.toLowerCase())) return null;
  const n = Number(v.replace(/,/g, ''));
  return Number.isFinite(n) ? n : null;
}

/**
 * Normalize an arbitrary CSV row (whose keys may have mixed casing / spaces) into a
 * lookup keyed by snake_case header.
 */
function normalizeRow(raw: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw)) {
    out[normHeader(k)] = v == null ? '' : String(v);
  }
  return out;
}

/**
 * Parse a CSV blob produced by ServiceNow ITSM exports into ItsmRecord[].
 *
 * Behavior:
 * - Header casing/whitespace is normalized.
 * - Record type, priority, dates, and change_success are coerced.
 * - mttr_minutes is computed when both opened_at and closed_at parse and the
 *   source omits or zeroes the column.
 * - Rows missing record_number / record_type / priority / service / opened_at
 *   are returned as errors but do not abort parsing.
 */
export function parseServiceNowItsmCsv(csvText: string): ItsmParseResult {
  const parsed = Papa.parse<Record<string, unknown>>(csvText, {
    header: true,
    skipEmptyLines: true,
  });
  const rawRows = (parsed.data ?? []) as Record<string, unknown>[];
  const notes: string[] = [];
  if (parsed.errors.length > 0) {
    notes.push(
      `csv parse warnings: ${parsed.errors
        .slice(0, 3)
        .map((e) => e.message)
        .join('; ')}`,
    );
  }

  const records: ItsmRecord[] = [];
  const errors: ItsmRowError[] = [];

  rawRows.forEach((rawRow, idx) => {
    const row = normalizeRow(rawRow);
    const rowIndex = idx + 1;

    const recordNumber = pick(row, ['record_number', 'number']);
    const recordTypeRaw = pick(row, ['record_type', 'sys_class_name', 'type', 'table']);
    const priorityRaw = pick(row, ['priority']);
    const service = pick(row, ['service', 'business_service', 'cmdb_ci']);
    const assignmentGroup = pick(row, ['assignment_group', 'group']);
    const openedAtRaw = pick(row, ['opened_at', 'sys_created_on', 'start_date']);
    const closedAtRaw = pick(row, ['closed_at', 'resolved_at', 'end_date']);
    const mttrRaw = pick(row, ['mttr_minutes', 'mttr', 'resolve_time_minutes']);
    const changeSuccessRaw = pick(row, ['change_success', 'success', 'close_code']);

    const recordType = parseRecordType(recordTypeRaw);
    const priority = parsePriority(priorityRaw);
    const openedAt = parseIsoDate(openedAtRaw);
    const closedAt = parseIsoDate(closedAtRaw);

    const rowErrors: ItsmRowError[] = [];
    if (!recordNumber) {
      rowErrors.push({ row_index: rowIndex, record_number: null, field: 'record_number', message: 'missing' });
    }
    if (!recordType) {
      rowErrors.push({
        row_index: rowIndex,
        record_number: recordNumber || null,
        field: 'record_type',
        message: `invalid record_type "${recordTypeRaw}" (expected incident|problem|change)`,
      });
    }
    if (!priority) {
      rowErrors.push({
        row_index: rowIndex,
        record_number: recordNumber || null,
        field: 'priority',
        message: `invalid priority "${priorityRaw}" (expected P1|P2|P3|P4)`,
      });
    }
    if (!service) {
      rowErrors.push({
        row_index: rowIndex,
        record_number: recordNumber || null,
        field: 'service',
        message: 'missing',
      });
    }
    if (!openedAt) {
      rowErrors.push({
        row_index: rowIndex,
        record_number: recordNumber || null,
        field: 'opened_at',
        message: `unparseable opened_at "${openedAtRaw}"`,
      });
    }
    if (closedAtRaw && !closedAt) {
      rowErrors.push({
        row_index: rowIndex,
        record_number: recordNumber || null,
        field: 'closed_at',
        message: `unparseable closed_at "${closedAtRaw}"`,
      });
    }

    if (rowErrors.length > 0) {
      errors.push(...rowErrors);
      return;
    }

    // Type guards for narrowing.
    if (!recordType || !priority || !openedAt) return;

    // Compute MTTR if missing.
    let mttr = parseNumber(mttrRaw);
    if ((mttr == null || mttr <= 0) && closedAt) {
      const diffMs = new Date(closedAt).getTime() - new Date(openedAt).getTime();
      if (diffMs >= 0) mttr = Math.round(diffMs / 60000);
    }

    records.push({
      record_number: recordNumber,
      record_type: recordType,
      priority,
      service,
      assignment_group: assignmentGroup || null,
      opened_at: openedAt,
      closed_at: closedAt,
      mttr_minutes: mttr,
      change_success: recordType === 'change' ? parseChangeSuccess(changeSuccessRaw) : null,
    });
  });

  return {
    rows_total: rawRows.length,
    records,
    errors,
    notes,
  };
}
