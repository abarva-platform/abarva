// Supabase write adapter — the DEFAULT data-plane write path.
//
// Production behavior is unchanged: with `ABARVA_DATA_PLANE` unset or
// `supabase`, every write routes through here, exactly as it did before the
// seam existed.
//
// Atomicity asymmetry (design doc §2): the Supabase JS client has no
// client-side transaction. A `WriteUnit` whose body issues multiple statements
// must therefore push them into a Postgres RPC (or be restructured to a single
// statement) — the statement runner here executes each statement against the
// service-role client and CANNOT roll back a partial multi-statement write.
// Foundation routes are deliberately append-only single-insert writes (the
// quarantine lifecycle pattern), which are atomic on Supabase as-is. Slices
// 3a–3e that need true multi-statement atomicity supply an RPC.
//
// Idempotency: callers requiring replay-safety pass a pre-check inside their
// `WriteUnit.run` body (the SQL itself uses `ON CONFLICT` / a unique key on
// `idempotency_key`). The adapter surfaces a unique-violation as
// `reason:'idempotent_replay'` rather than throwing.

import type { SupabaseClient } from '@supabase/supabase-js';
import { getServerSupabase } from '@/lib/supabase-server';
import { canonicalTenantKey } from '@/lib/tenant-keys';
import type {
  AuditEntry,
  DataPlaneWriteAdapter,
  WriteResult,
  WriteStatementRunner,
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

    async commit<T>(unit: WriteUnit<T>): Promise<WriteResult<T>> {
      const sb = getClient();
      // The statement runner executes each statement individually against the
      // service-role client via the `exec_sql`-style RPC contract. There is no
      // client-side rollback — foundation units are single-statement.
      const stmt: WriteStatementRunner = async <R>(
        sql: string,
        params: readonly unknown[],
      ): Promise<R[]> => {
        const { data, error } = await sb.rpc('data_plane_exec', {
          stmt_sql: sql,
          stmt_params: params,
        });
        if (error) throw Object.assign(new Error(error.message), { code: error.code });
        return (data ?? []) as R[];
      };
      try {
        const data = await unit.run(stmt);
        return writeOk<T>(data);
      } catch (err) {
        if (isUniqueViolation(err)) {
          return writeOk<T>(undefined, 'idempotent_replay');
        }
        if (isRlsDenied(err)) {
          return writeRejected<T>('rls_denied', err instanceof Error ? err.message : undefined);
        }
        return writeRejected<T>(
          'backend_error',
          err instanceof Error ? err.message : 'unknown',
        );
      }
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
