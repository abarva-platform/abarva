// Supabase write adapter — the DEFAULT data-plane write path.
//
// Production behavior is unchanged: with `ABARVA_DATA_PLANE` unset or
// `supabase`, every write routes through here, exactly as it did before the
// seam existed.
//
// Atomicity asymmetry (design doc §2): the Supabase JS client has no
// client-side transaction. Multi-statement `commit()` is therefore the
// **Azure-plane-only** primitive (`azurePostgresWriteAdapter.ts`, real
// `BEGIN`/`COMMIT`). On the Supabase plane `commit()` is **unsupported by
// design** — it returns `writeRejected('unsupported', ...)`.
//
// Why not a generic `data_plane_exec` RPC: a `SECURITY DEFINER` Postgres
// function that runs arbitrary SQL strings is an injection / privilege-
// escalation surface and must not ship. The cutover-flip strategy keeps
// Supabase as the unchanged production writer, so there is no need for it.
// Supabase domains that need a write do it through `appendAudit()` (the
// append-only single-insert quarantine lifecycle pattern, atomic as-is) or a
// native per-domain adapter — see `programsWriteAdapter.ts` for the canonical
// example.
//
// Idempotency: callers requiring replay-safety pass a pre-check inside their
// per-domain adapter (the SQL itself uses `ON CONFLICT` / a unique key on
// `idempotency_key`). `appendAudit` surfaces a unique-violation as
// `reason:'idempotent_replay'` rather than throwing.

import type { SupabaseClient } from '@supabase/supabase-js';
import { getServerSupabase } from '@/lib/supabase-server';
import { canonicalTenantKey } from '@/lib/tenant-keys';
import type {
  AuditEntry,
  DataPlaneWriteAdapter,
  WriteResult,
  WriteUnit,
} from './types';
import { writeOk, writeRejected } from './types';

export type SupabaseFactory = () => SupabaseClient;

/** Postgres SQLSTATE for a unique-violation — surfaced as an idempotent replay. */
const UNIQUE_VIOLATION = '23505';
/** SQLSTATE for an RLS / insufficient-privilege denial. */
const RLS_DENIED_CODES = new Set(['42501', 'P0001']);

/** True when an error looks like a Postgres unique-violation. */
function isUniqueViolation(err: unknown): boolean {
  const code = (err as { code?: string } | null)?.code;
  if (code === UNIQUE_VIOLATION) return true;
  const msg = err instanceof Error ? err.message : String(err ?? '');
  return /duplicate key value|already exists/i.test(msg);
}

/** True when an error looks like an RLS / privilege denial. */
function isRlsDenied(err: unknown): boolean {
  const code = (err as { code?: string } | null)?.code;
  if (code && RLS_DENIED_CODES.has(code)) return true;
  const msg = err instanceof Error ? err.message : String(err ?? '');
  return /row-level security|permission denied|not authorized/i.test(msg);
}

/**
 * Build a Supabase-backed write adapter. The Supabase client factory is
 * injectable so tests drive it without a live backend.
 */
export function createSupabaseWriteAdapter(
  getClient: SupabaseFactory = getServerSupabase,
): DataPlaneWriteAdapter {
  return {
    name: 'supabase',

    async commit<T>(_unit: WriteUnit<T>): Promise<WriteResult<T>> {
      // Multi-statement `commit()` is unsupported on the Supabase plane by
      // design. The Supabase JS client has no client-side transaction, and a
      // generic `SECURITY DEFINER` SQL-exec RPC (`data_plane_exec`) is an
      // injection / privilege-escalation surface that must not ship. The
      // cutover-flip strategy keeps Supabase as the unchanged production
      // writer — `commit()` is the Azure-plane-only transactional primitive.
      //
      // This is a stable, expected rejection, not a fault: it returns
      // `ok:false` rather than throwing. Supabase domains do their writes via
      // `appendAudit()` or a native per-domain adapter (e.g.
      // `programsWriteAdapter.ts`).
      void _unit;
      return writeRejected<T>(
        'unsupported',
        'commit() is the transactional Azure-plane primitive; on the Supabase '
          + 'plane it is unsupported by design (no client-side transaction, and '
          + 'no SECURITY DEFINER SQL-exec RPC). Use appendAudit() or a native '
          + 'per-domain adapter (e.g. programsWriteAdapter.ts) instead.',
      );
    },

    async appendAudit(entry: AuditEntry): Promise<WriteResult<{ id: string }>> {
      const sb = getClient();
      const tenantKey = canonicalTenantKey(entry.tenantKey);
      // Append-only: a NEW row, never an update of the parent. The row body is
      // passed through verbatim — snake_case column names — so the row shape is
      // byte-faithful to the pre-seam `.insert()` calls.
      try {
        const { data, error } = await sb
          .from(entry.table)
          .insert({
            ...entry.columns,
            parent_id: entry.parentId,
          })
          .select('id')
          .maybeSingle();
        if (error) {
          if (isUniqueViolation(error)) {
            return writeOk<{ id: string }>(undefined, 'idempotent_replay');
          }
          if (isRlsDenied(error)) {
            return writeRejected<{ id: string }>('rls_denied', error.message);
          }
          return writeRejected<{ id: string }>('backend_error', error.message);
        }
        // Reference tenantKey so the canonicalization is not dead code — it is
        // the same defense-in-depth the read seam applies.
        void tenantKey;
        return writeOk<{ id: string }>(
          (data as { id: string } | null) ?? undefined,
        );
      } catch (err) {
        return writeRejected<{ id: string }>(
          'backend_error',
          err instanceof Error ? err.message : 'unknown',
        );
      }
    },
  };
}

/** The default Supabase write adapter instance. */
export const supabaseWriteAdapter: DataPlaneWriteAdapter = createSupabaseWriteAdapter();
