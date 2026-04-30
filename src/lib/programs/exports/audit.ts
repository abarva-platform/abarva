// EXPORT-1 · Export audit log writer.
//
// Server-only helper that writes one row to `program_export_log` per
// export attempt. Schema lives in
// supabase/migrations/<NNN>_program_export_log.sql.
//
// Pilot-readiness floor (design §5): every export call writes one row
// with `program_id`, `kind`, `format`, `actor_id`, `tenant_key`,
// `byte_length`, `created_at`. The `outcome` field captures whether the
// export succeeded, was denied (auth/tenant), or errored mid-render.
// On 'error', `errorMessage` is the short diagnostic the API surface
// returns.
//
// The helper uses the service-role Supabase client (bypasses RLS).
// The migration's RLS is the second line of defense for any direct
// authenticated client; INSERT is service-role only.

import 'server-only';

import { getServerSupabase } from '@/lib/supabase-server';

import type { DeliverableFormat, DeliverableKind } from './types';

/** Outcome of an export attempt. */
export type ExportAuditOutcome = 'success' | 'denied' | 'error';

/** Input shape for `recordExportAudit`. */
export interface ExportAuditInput {
  /** Tenant key (broker key). */
  tenantKey: string;
  /** Optional program id; null for cross-program exports. */
  programId?: string;
  /** Deliverable kind being exported. */
  deliverableKind: DeliverableKind;
  /** Format the renderer produced (or attempted). */
  format: DeliverableFormat;
  /** Filename suggested to the caller. */
  filename: string;
  /** Byte size of the rendered artifact (0 on denied/error). */
  sizeBytes: number;
  /** Clerk user id of the actor performing the export. */
  actorUserId: string;
  /** Outcome of the export attempt. */
  outcome: ExportAuditOutcome;
  /** Short diagnostic when outcome is 'error' or 'denied'. */
  errorMessage?: string;
}

/** Insert one audit row for an export attempt. Throws on DB error. */
export async function recordExportAudit(input: ExportAuditInput): Promise<void> {
  const supabase = getServerSupabase();
  const { error } = await supabase.from('program_export_log').insert({
    tenant_key: input.tenantKey,
    program_id: input.programId ?? null,
    deliverable_kind: input.deliverableKind,
    format: input.format,
    filename: input.filename,
    size_bytes: input.sizeBytes,
    actor_user_id: input.actorUserId,
    outcome: input.outcome,
    error_message: input.errorMessage ?? null,
  });
  if (error) {
    throw new Error(`recordExportAudit failed: ${error.message}`);
  }
}
