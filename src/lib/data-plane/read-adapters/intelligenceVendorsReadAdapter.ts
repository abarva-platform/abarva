// Intelligence vendors read adapter (Slice 4 — server-component read paths).
//
// Backs the Intelligence v3 Vendors stage rendered by the `/intelligence`
// server component (`src/app/intelligence/page.tsx` → `getVendorsForClient`).
//
// The Vendors stage rolls up `ai_initiative_vendors` joined to
// `ai_initiatives` for the active tenant. The roll-up / sort / totals logic
// is pure presentation maths and stays in `intelligence-v3/vendors-data.ts`;
// the ONE thing the data plane owns is the joined row read. That read is
// extracted here behind the same `ABARVA_DATA_PLANE` switch as the rest of
// the seam, so the Intelligence page can parallel-run against Azure Postgres.
//
//   ABARVA_DATA_PLANE=supabase        -> Supabase PostgREST join (DEFAULT)
//   ABARVA_DATA_PLANE=azure-postgres  -> Azure Postgres SQL JOIN (opt-in)
//
// The adapter returns the flat `IntelligenceVendorRow[]` projection — exactly
// the shape `vendors-data.ts`'s `JoinedRow[]` consumed pre-seam — so the
// helper signature and `VendorsData` return shape are byte-identical and
// every caller keeps working unchanged.

import type { SupabaseClient } from '@supabase/supabase-js';
import { getServerSupabase } from '@/lib/supabase-server';
import { createDefaultSession, type SessionRunner } from './azureSession';
import { resolveDataPlane } from './resolveDataPlane';
import type { DataPlane } from './types';

/**
 * One `ai_initiative_vendors` row joined to its `ai_initiatives` parent —
 * the flat projection the Vendors stage roll-up consumes. `initiative` is
 * `null` only defensively; the join is an inner join so every returned row
 * has a parent.
 */
export interface IntelligenceVendorRow {
  vendor_id: string;
  initiative_id: string;
  vendor_name: string;
  contract_value_usd: number | string | null;
  renewal_date: string | null;
  financial_health: string | null;
  notes: string | null;
  initiative: {
    initiative_id: string;
    display_id: string;
    name: string;
    status_flag: string;
    stage: string;
    client_id: string;
  } | null;
}

/** An Intelligence-vendors read adapter for one physical data plane. */
export interface IntelligenceVendorsReadAdapter {
  readonly name: DataPlane;
  /**
   * Read every `ai_initiative_vendors` row whose parent `ai_initiatives`
   * row belongs to `clientId`. Throws on a read failure — the pre-seam
   * helper threw on the Supabase error, so callers' error handling is
   * preserved.
   */
  getVendorRowsForClient(clientId: string): Promise<IntelligenceVendorRow[]>;
}

// --- Supabase adapter (DEFAULT) --------------------------------------------

export type SupabaseFactory = () => SupabaseClient;

/** PostgREST embed selector — lifted verbatim from `getVendorsForClient`. */
const SUPABASE_SELECT =
  'vendor_id, initiative_id, vendor_name, contract_value_usd, renewal_date, financial_health, notes, ' +
  'ai_initiatives!inner(initiative_id, display_id, name, status_flag, stage, client_id)';

/** A raw Supabase joined row, before the `ai_initiatives` rename. */
interface SupabaseJoinedRow {
  vendor_id: string;
  initiative_id: string;
  vendor_name: string;
  contract_value_usd: number | string | null;
  renewal_date: string | null;
  financial_health: string | null;
  notes: string | null;
  ai_initiatives: IntelligenceVendorRow['initiative'];
}

/**
 * Build the Supabase Intelligence-vendors adapter. The query is the exact
 * `.from('ai_initiative_vendors').select(...).eq('ai_initiatives.client_id', ...)`
 * the pre-seam helper ran, so the returned rows are byte-identical.
 */
export function createSupabaseIntelligenceVendorsReadAdapter(
  getClient: SupabaseFactory = getServerSupabase,
): IntelligenceVendorsReadAdapter {
  return {
    name: 'supabase',
    async getVendorRowsForClient(clientId) {
      const sb = getClient();
      const { data, error } = await sb
        .from('ai_initiative_vendors')
        .select(SUPABASE_SELECT)
        .eq('ai_initiatives.client_id', clientId);
      if (error) throw new Error(`getVendorsForClient: ${error.message}`);

      const rows = (data ?? []) as unknown as ReadonlyArray<SupabaseJoinedRow>;
      // Rename the PostgREST `ai_initiatives` embed key to the neutral
      // `initiative` field so both planes return one shared shape.
      return rows.map((r) => ({
        vendor_id: r.vendor_id,
        initiative_id: r.initiative_id,
        vendor_name: r.vendor_name,
        contract_value_usd: r.contract_value_usd,
        renewal_date: r.renewal_date,
        financial_health: r.financial_health,
        notes: r.notes,
        initiative: r.ai_initiatives,
      }));
    },
  };
}

// --- Azure Postgres adapter (opt-in) ---------------------------------------

/**
 * Build the Azure Postgres Intelligence-vendors adapter. The PostgREST
 * embed becomes an explicit `INNER JOIN`; the `eq('ai_initiatives.client_id')`
 * filter becomes the join's `WHERE` predicate — identical row semantics.
 * The session runner is injectable so tests drive an in-memory fake.
 */
export function createAzureIntelligenceVendorsReadAdapter(
  session: SessionRunner = createDefaultSession('abarva-data-plane-intelligence-vendors'),
): IntelligenceVendorsReadAdapter {
  return {
    name: 'azure-postgres',
    async getVendorRowsForClient(clientId) {
      return session(async (run) => {
        const rows = await run<{
          vendor_id: string;
          initiative_id: string;
          vendor_name: string;
          contract_value_usd: number | string | null;
          renewal_date: string | null;
          financial_health: string | null;
          notes: string | null;
          i_initiative_id: string;
          i_display_id: string;
          i_name: string;
          i_status_flag: string;
          i_stage: string;
          i_client_id: string;
        }>(
          `SELECT v.vendor_id, v.initiative_id, v.vendor_name,
                  v.contract_value_usd, v.renewal_date, v.financial_health, v.notes,
                  i.initiative_id AS i_initiative_id, i.display_id AS i_display_id,
                  i.name AS i_name, i.status_flag AS i_status_flag,
                  i.stage AS i_stage, i.client_id AS i_client_id
             FROM ai_initiative_vendors v
             INNER JOIN ai_initiatives i ON i.initiative_id = v.initiative_id
            WHERE i.client_id = $1`,
          [clientId],
        );
        return rows.map((r) => ({
          vendor_id: r.vendor_id,
          initiative_id: r.initiative_id,
          vendor_name: r.vendor_name,
          contract_value_usd: r.contract_value_usd,
          renewal_date: r.renewal_date,
          financial_health: r.financial_health,
          notes: r.notes,
          initiative: {
            initiative_id: r.i_initiative_id,
            display_id: r.i_display_id,
            name: r.i_name,
            status_flag: r.i_status_flag,
            stage: r.i_stage,
            client_id: r.i_client_id,
          },
        }));
      });
    },
  };
}

// --- Selection -------------------------------------------------------------

/** Default singletons. */
export const supabaseIntelligenceVendorsReadAdapter: IntelligenceVendorsReadAdapter =
  createSupabaseIntelligenceVendorsReadAdapter();
export const azureIntelligenceVendorsReadAdapter: IntelligenceVendorsReadAdapter =
  createAzureIntelligenceVendorsReadAdapter();

/** Select the Intelligence-vendors read adapter for the configured data plane. */
export function selectIntelligenceVendorsReadAdapter(
  plane?: DataPlane,
): IntelligenceVendorsReadAdapter {
  const target = plane ?? resolveDataPlane();
  return target === 'azure-postgres'
    ? azureIntelligenceVendorsReadAdapter
    : supabaseIntelligenceVendorsReadAdapter;
}
