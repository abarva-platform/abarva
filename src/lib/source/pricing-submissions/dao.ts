// Source · vendor pricing submissions · DAO
//
// Read / write helpers around source_event_pricing_submissions. All
// queries are tenant-scoped via RLS — callers don't add tenant_key
// predicates manually.
//
// Reads: listActiveSubmissions returns the latest non-superseded row
// per vendor for a given event. listAllSubmissionsForEvent returns
// the full history (including superseded rows) for audit views.
//
// Writes: insertSubmission accepts the parser output. supersedePrior
// chains a vendor's prior active submission to the new id (so revisions
// don't show in the active list).

import 'server-only';

import { getServerSupabase } from '@/lib/supabase-server';
import type {
  AssumptionDeviation,
  ParseStatus,
  ParseWarning,
  VendorPricingSubmissionInsert,
  VendorPricingSubmissionRow,
} from './types';

// ── Row mapper ─────────────────────────────────────────────────────────────

interface DbRow {
  id: string;
  source_event_id: string;
  tenant_key: string;
  vendor_name: string;
  submitted_at: string;
  uploaded_by_user_id: string | null;
  uploaded_filename: string | null;
  unit_prices_by_id: Record<string, number> | null;
  vendor_notes_by_id: Record<string, string> | null;
  pricing_notes: string | null;
  assumption_deviations: AssumptionDeviation[] | null;
  parse_status: ParseStatus;
  parse_warnings: ParseWarning[] | null;
  superseded_by: string | null;
  created_at: string;
  updated_at: string;
}

function rowToView(row: DbRow): VendorPricingSubmissionRow {
  return {
    id: row.id,
    sourceEventId: row.source_event_id,
    tenantKey: row.tenant_key,
    vendorName: row.vendor_name,
    submittedAt: row.submitted_at,
    uploadedByUserId: row.uploaded_by_user_id,
    uploadedFilename: row.uploaded_filename,
    unitPricesById: row.unit_prices_by_id ?? {},
    vendorNotesById: row.vendor_notes_by_id ?? {},
    pricingNotes: row.pricing_notes ?? '',
    assumptionDeviations: row.assumption_deviations ?? [],
    parseStatus: row.parse_status,
    parseWarnings: row.parse_warnings ?? [],
    supersededBy: row.superseded_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ── Reads ──────────────────────────────────────────────────────────────────

/** Return one row per vendor — the latest non-superseded submission. */
export async function listActiveSubmissionsForEvent(
  sourceEventId: string,
): Promise<VendorPricingSubmissionRow[]> {
  let supabase;
  try {
    supabase = getServerSupabase();
  } catch {
    return [];
  }
  const { data, error } = await supabase
    .from('source_event_pricing_submissions')
    .select('*')
    .eq('source_event_id', sourceEventId)
    .is('superseded_by', null)
    .order('vendor_name', { ascending: true });
  if (error) {
    console.error('[listActiveSubmissionsForEvent]', error.message);
    return [];
  }
  return ((data as DbRow[] | null) ?? []).map(rowToView);
}

/** Full history including superseded rows. For audit / debugging. */
export async function listAllSubmissionsForEvent(
  sourceEventId: string,
): Promise<VendorPricingSubmissionRow[]> {
  let supabase;
  try {
    supabase = getServerSupabase();
  } catch {
    return [];
  }
  const { data, error } = await supabase
    .from('source_event_pricing_submissions')
    .select('*')
    .eq('source_event_id', sourceEventId)
    .order('submitted_at', { ascending: false });
  if (error) {
    console.error('[listAllSubmissionsForEvent]', error.message);
    return [];
  }
  return ((data as DbRow[] | null) ?? []).map(rowToView);
}

// ── Writes ─────────────────────────────────────────────────────────────────

export interface InsertSubmissionResult {
  ok: true;
  row: VendorPricingSubmissionRow;
  /** Number of prior submissions superseded by this insert. */
  supersededCount: number;
}
export interface InsertSubmissionFailure {
  ok: false;
  error: string;
  detail: string;
}

/**
 * Insert a new submission. If a non-superseded row exists for the same
 * (event, vendor), it gets superseded_by set to the new row's id so
 * the active list returns only the latest.
 */
export async function insertSubmission(
  insert: VendorPricingSubmissionInsert,
): Promise<InsertSubmissionResult | InsertSubmissionFailure> {
  let supabase;
  try {
    supabase = getServerSupabase();
  } catch (err) {
    return {
      ok: false,
      error: 'db_unavailable',
      detail: err instanceof Error ? err.message : 'getServerSupabase() failed',
    };
  }

  // Insert the new row.
  const { data: inserted, error: insertErr } = await supabase
    .from('source_event_pricing_submissions')
    .insert({
      source_event_id: insert.sourceEventId,
      tenant_key: insert.tenantKey,
      vendor_name: insert.vendorName,
      uploaded_by_user_id: insert.uploadedByUserId,
      uploaded_filename: insert.uploadedFilename,
      unit_prices_by_id: insert.unitPricesById,
      vendor_notes_by_id: insert.vendorNotesById,
      pricing_notes: insert.pricingNotes,
      assumption_deviations: insert.assumptionDeviations,
      parse_status: insert.parseStatus,
      parse_warnings: insert.parseWarnings,
    })
    .select('*')
    .single();

  if (insertErr || !inserted) {
    return {
      ok: false,
      error: 'insert_failed',
      detail: insertErr?.message ?? 'No row returned from insert.',
    };
  }
  const newRow = rowToView(inserted as DbRow);

  // Supersede prior active submissions for the same vendor on this event.
  const { data: priorRows, error: priorErr } = await supabase
    .from('source_event_pricing_submissions')
    .update({ superseded_by: newRow.id, updated_at: new Date().toISOString() })
    .eq('source_event_id', insert.sourceEventId)
    .eq('vendor_name', insert.vendorName)
    .is('superseded_by', null)
    .neq('id', newRow.id)
    .select('id');

  if (priorErr) {
    console.warn(
      '[insertSubmission] failed to supersede prior rows; non-fatal',
      priorErr.message,
    );
  }

  return {
    ok: true,
    row: newRow,
    supersededCount: priorRows?.length ?? 0,
  };
}

/** Hard-delete a submission. Reserved for admin / test cleanup. */
export async function deleteSubmission(submissionId: string): Promise<boolean> {
  let supabase;
  try {
    supabase = getServerSupabase();
  } catch {
    return false;
  }
  const { error } = await supabase
    .from('source_event_pricing_submissions')
    .delete()
    .eq('id', submissionId);
  return !error;
}
