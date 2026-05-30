// DB writer for ServiceNow ITSM ingest — slice S6.
//
// Idempotent. Conflict on (tenant_key, record_number) updates the existing row.
// In --dry-run mode the writer is bypassed entirely by the CLI; this module is
// only invoked when commits are real.

import { getAzureWriteFluentClient } from '@/lib/data-plane/postgresCompat';
import type { ItsmIngestSummary, ItsmRecord, ItsmRowError } from './types';

export interface WriteArgs {
  tenantKey: string;
  sourceFileId: string;
  records: ItsmRecord[];
}

export interface WriteResult {
  inserted: number;
  skippedDuplicate: number;
  errors: ItsmRowError[];
}

/**
 * Upsert ITSM records. Conflict on (tenant_key, record_number) overwrites the
 * existing row — re-ingesting the same export is a no-op for unchanged rows.
 */
export async function writeItsmRecords(args: WriteArgs): Promise<WriteResult> {
  const sb = getAzureWriteFluentClient();
  let inserted = 0;
  let skippedDuplicate = 0;
  const errors: ItsmRowError[] = [];

  for (let i = 0; i < args.records.length; i += 1) {
    const r = args.records[i];
    const payload = {
      tenant_key: args.tenantKey,
      record_number: r.record_number,
      record_type: r.record_type,
      priority: r.priority,
      service: r.service,
      assignment_group: r.assignment_group,
      opened_at: r.opened_at,
      closed_at: r.closed_at,
      mttr_minutes: r.mttr_minutes,
      change_success: r.change_success,
      source: 'servicenow_itsm' as const,
      source_file_id: args.sourceFileId,
    };

    const { error } = await sb
      .from('tower_itsm_records')
      .upsert(payload, { onConflict: 'tenant_key,record_number' });

    if (error) {
      const msg = (error as { message?: string }).message ?? String(error);
      if (/duplicate key/i.test(msg)) {
        skippedDuplicate += 1;
      } else {
        errors.push({
          row_index: i + 1,
          record_number: r.record_number,
          field: 'db',
          message: msg,
        });
      }
    } else {
      inserted += 1;
    }
  }

  return { inserted, skippedDuplicate, errors };
}

export function summarize(args: {
  rowsTotal: number;
  validCount: number;
  parseErrors: ItsmRowError[];
  validationErrors: ItsmRowError[];
  writeResult: WriteResult | null;
  notes: string[];
}): ItsmIngestSummary {
  const failed = args.parseErrors.length + args.validationErrors.length;
  const writeErrors = args.writeResult?.errors ?? [];
  return {
    rows_total: args.rowsTotal,
    rows_valid: args.validCount,
    rows_failed: failed + writeErrors.length,
    rows_inserted: args.writeResult?.inserted ?? 0,
    rows_skipped_duplicate: args.writeResult?.skippedDuplicate ?? 0,
    errors: [...args.parseErrors, ...args.validationErrors, ...writeErrors],
    notes: args.notes,
  };
}
