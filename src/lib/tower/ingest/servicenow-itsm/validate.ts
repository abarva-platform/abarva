// ServiceNow ITSM record validator — slice S6.
//
// Pure. Applies the invariants we expect to hold post-parse:
//
//   - priority is one of P1|P2|P3|P4
//   - record_type is one of incident|problem|change
//   - opened_at is a valid ISO date
//   - closed_at, if present, is >= opened_at
//   - mttr_minutes is non-negative; computed from timestamps when absent
//   - change_success is null for non-change records (defensively coerced)
//
// Returns a refined record on success or a list of field-scoped errors.

import { PRIORITIES, RECORD_TYPES, type ItsmRecord, type ItsmRowError } from './types';

const PRIORITY_SET: ReadonlySet<string> = new Set(PRIORITIES);
const RECORD_TYPE_SET: ReadonlySet<string> = new Set(RECORD_TYPES);

export interface ItsmValidationResult {
  valid: ItsmRecord[];
  errors: ItsmRowError[];
}

function isFiniteIso(s: string): boolean {
  const t = Date.parse(s);
  return Number.isFinite(t);
}

/**
 * Validate a batch of parsed records. Records that fail any invariant are
 * dropped and an error per failure is returned. MTTR is recomputed defensively
 * when both timestamps are present and the stored value disagrees.
 */
export function validateItsmRecords(records: ItsmRecord[]): ItsmValidationResult {
  const valid: ItsmRecord[] = [];
  const errors: ItsmRowError[] = [];

  records.forEach((r, idx) => {
    const rowIndex = idx + 1;
    const rowErrors: ItsmRowError[] = [];

    if (!r.record_number || r.record_number.length === 0) {
      rowErrors.push({ row_index: rowIndex, record_number: null, field: 'record_number', message: 'empty' });
    }
    if (!RECORD_TYPE_SET.has(r.record_type)) {
      rowErrors.push({
        row_index: rowIndex,
        record_number: r.record_number ?? null,
        field: 'record_type',
        message: `invalid "${r.record_type}"`,
      });
    }
    if (!PRIORITY_SET.has(r.priority)) {
      rowErrors.push({
        row_index: rowIndex,
        record_number: r.record_number ?? null,
        field: 'priority',
        message: `invalid "${r.priority}"`,
      });
    }
    if (!r.service || r.service.length === 0) {
      rowErrors.push({
        row_index: rowIndex,
        record_number: r.record_number ?? null,
        field: 'service',
        message: 'empty',
      });
    }
    if (!isFiniteIso(r.opened_at)) {
      rowErrors.push({
        row_index: rowIndex,
        record_number: r.record_number ?? null,
        field: 'opened_at',
        message: 'unparseable',
      });
    }

    let mttr = r.mttr_minutes;

    if (r.closed_at) {
      if (!isFiniteIso(r.closed_at)) {
        rowErrors.push({
          row_index: rowIndex,
          record_number: r.record_number ?? null,
          field: 'closed_at',
          message: 'unparseable',
        });
      } else if (isFiniteIso(r.opened_at)) {
        const openedMs = Date.parse(r.opened_at);
        const closedMs = Date.parse(r.closed_at);
        if (closedMs < openedMs) {
          rowErrors.push({
            row_index: rowIndex,
            record_number: r.record_number ?? null,
            field: 'closed_at',
            message: 'closed_at precedes opened_at',
          });
        } else {
          const computed = Math.round((closedMs - openedMs) / 60000);
          if (mttr == null) {
            mttr = computed;
          } else if (Math.abs(mttr - computed) > 1) {
            // Disagreement → trust the timestamps and note it.
            mttr = computed;
          }
        }
      }
    }

    if (mttr != null && mttr < 0) {
      rowErrors.push({
        row_index: rowIndex,
        record_number: r.record_number ?? null,
        field: 'mttr_minutes',
        message: `negative value ${mttr}`,
      });
    }

    if (r.record_type !== 'change' && r.change_success != null) {
      // Coerce — only changes carry success/failure semantics.
      r = { ...r, change_success: null };
    }

    if (rowErrors.length > 0) {
      errors.push(...rowErrors);
      return;
    }

    valid.push({ ...r, mttr_minutes: mttr });
  });

  return { valid, errors };
}
