// Source Decision Queue read adapter (data-plane seam).
//
// Backs the Decision Queue + Renewal Cockpit surfaces with the physical reads
// against the persisted tenant-data substrate created by migration
// `20260430121500_apex_setup_data_layer.sql`:
//
//   data_inventory_records (segment_id = 'vendor_contracts') — contract rows
//   data_inventory_records (segment_id = 'it_financials')    — financial lines
//   data_inventory_segments — segment freshness / last-ingested provenance
//
// The detector / projection / cockpit logic stays pure in
// `src/lib/source/decision-queue/*` and `renewal-cockpit/*`; this module owns
// ONLY the reads. Every read is fail-soft — a query error yields an empty
// projection, never a throw, so the surface always renders (and the queue's
// own `emptyState` covers the no-data case).
//
// Tenant-key note: the app uses legacy client keys (`apexretail`,
// `meridian`, `arcturus`) while the tenant-data substrate keys rows under
// the canonical slugs (`apex-retail`, `meridian-health`, `first-capital`).
// `canonicalTenantKey` from `@/lib/tenant-keys` is the single source of
// truth for that map — every tenant must be canonicalized before a read or
// the queries split between the alias and canonical key and return empty.

import 'server-only';
import { getServerSupabase } from '@/lib/supabase-server';
import { canonicalTenantKey } from '@/lib/tenant-keys';
import type { ContextSourceType } from '@/lib/context-trust/freshness-model';
import type { RawTenantRecord } from '@/lib/source/decision-queue/projection';
import type { SegmentFreshnessInput } from '@/lib/source/decision-queue/detector-inputs';

interface InventoryRecordRow {
  record_id: string;
  record_kind: string;
  title: string;
  record_payload: Record<string, unknown> | null;
}

interface SegmentRow {
  segment_id: string;
  last_ingested_at: string | null;
  source_basis: string | null;
}

const RECORD_SELECT = 'record_id, record_kind, title, record_payload';
const SEGMENT_SELECT = 'segment_id, last_ingested_at';

function toRawRecords(rows: InventoryRecordRow[] | null): RawTenantRecord[] {
  return (rows ?? []).map((r) => ({
    recordId: r.record_id,
    recordKind: r.record_kind,
    title: r.title,
    payload: (r.record_payload ?? {}) as Record<string, unknown>,
  }));
}

/** The raw substrate bundle a surface needs to assemble the queue / cockpit. */
export interface SourceDecisionQueueRawData {
  vendorContractRecords: RawTenantRecord[];
  financialRecords: RawTenantRecord[];
  segmentFreshness: SegmentFreshnessInput[];
}

/**
 * Read the `vendor_contracts` + `it_financials` substrate for a tenant.
 * Fail-soft: any query error degrades that slice to `[]` so the surface
 * always renders. `sourceType` is `'sourced'` — these rows are imported from
 * a real tenant dataset but not human-confirmed (per the freshness model).
 */
export async function readSourceDecisionQueueData(
  clientKey: string,
): Promise<SourceDecisionQueueRawData> {
  const tenantKey = canonicalTenantKey(clientKey);
  let vendorContractRecords: RawTenantRecord[] = [];
  let financialRecords: RawTenantRecord[] = [];
  const freshnessBySegment = new Map<string, string | null>();

  try {
    const sb = getServerSupabase();

    const [contractsRes, financialsRes, segmentsRes] = await Promise.all([
      sb
        .from('data_inventory_records')
        .select(RECORD_SELECT)
        .eq('tenant_key', tenantKey)
        .eq('segment_id', 'vendor_contracts')
        .limit(200),
      sb
        .from('data_inventory_records')
        .select(RECORD_SELECT)
        .eq('tenant_key', tenantKey)
        .eq('segment_id', 'it_financials')
        .limit(200),
      sb
        .from('data_inventory_segments')
        .select(SEGMENT_SELECT)
        .eq('tenant_key', tenantKey)
        .in('segment_id', ['vendor_contracts', 'it_financials']),
    ]);

    vendorContractRecords = toRawRecords(
      contractsRes.error ? null : (contractsRes.data as InventoryRecordRow[] | null),
    );
    financialRecords = toRawRecords(
      financialsRes.error ? null : (financialsRes.data as InventoryRecordRow[] | null),
    );
    if (!segmentsRes.error) {
      for (const row of (segmentsRes.data as SegmentRow[] | null) ?? []) {
        freshnessBySegment.set(row.segment_id, row.last_ingested_at);
      }
    }
  } catch {
    // Fully fail-soft — leave projections empty; the queue emptyState covers it.
  }

  const sourceType: ContextSourceType = 'sourced';
  const segmentFreshness: SegmentFreshnessInput[] = (
    ['vendor_contracts', 'it_financials'] as const
  ).map((segment) => ({
    segment,
    lastUpdated: freshnessBySegment.get(segment) ?? null,
    sourceType: freshnessBySegment.has(segment) ? sourceType : 'absent',
  }));

  return { vendorContractRecords, financialRecords, segmentFreshness };
}
