import { getAzureWriteFluentClient } from '@/lib/data-plane/postgresCompat';
import type { WorkdayWorkforceRow } from './types';

export interface IngestArgs {
  clientId: string;
  asOfDate: string; // YYYY-MM-DD
  rows: WorkdayWorkforceRow[];
  sourceFileId?: string;
}

export interface IngestResult {
  rowsAttempted: number;
  rowsInserted: number;
  rowsUpdated: number;
  rowsFailed: number;
  notes: string[];
}

/**
 * Idempotent insert into `tower_workforce`.
 *
 * Idempotency model: the table has a UNIQUE (client_id, employee_id,
 * as_of_date) constraint. Re-running the same extract on the same
 * `as_of_date` is a no-op for unchanged rows; changed rows are updated
 * via ON CONFLICT DO UPDATE.
 */
export async function ingestWorkforceRows(args: IngestArgs): Promise<IngestResult> {
  const sb = getAzureWriteFluentClient();
  const notes: string[] = [];
  let inserted = 0;
  let updated = 0;
  let failed = 0;

  for (const row of args.rows) {
    const payload = {
      client_id: args.clientId,
      employee_id: row.employee_id,
      function: row.function,
      sub_function: row.sub_function,
      location: row.location,
      level: row.level,
      contractor_flag: row.contractor_flag,
      start_date: row.start_date,
      attrition_date: row.attrition_date,
      attrition_reason: row.attrition_reason,
      as_of_date: args.asOfDate,
      source_file_id: args.sourceFileId ?? null,
      data_class: 'restricted',
    };

    // Upsert against the (client_id, employee_id, as_of_date) unique key.
    const { data, error } = await sb
      .from('tower_workforce')
      .upsert(payload, { onConflict: 'client_id,employee_id,as_of_date' })
      .select('id, ingested_at');

    if (error) {
      failed += 1;
      notes.push(`row "${row.employee_id}": ${error.message}`);
      continue;
    }

    // `upsert` returns the row whether it was inserted or updated; we use
    // the ingested_at vs now() comparison heuristic for tagging.
    if (Array.isArray(data) && data.length > 0) {
      const ingestedAt = (data[0] as { ingested_at?: string })?.ingested_at;
      if (ingestedAt && Date.now() - new Date(ingestedAt).getTime() < 5_000) {
        inserted += 1;
      } else {
        updated += 1;
      }
    } else {
      inserted += 1;
    }
  }

  return {
    rowsAttempted: args.rows.length,
    rowsInserted: inserted,
    rowsUpdated: updated,
    rowsFailed: failed,
    notes,
  };
}
