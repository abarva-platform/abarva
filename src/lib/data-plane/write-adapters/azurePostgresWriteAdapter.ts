// Azure Postgres write adapter — the cutover-flip / rehearsal write path.
//
// Per `docs/architecture/azure/DATA-ACCESS-ADAPTER-WRITE-PATH-DESIGN.md`, this
// adapter is NOT used for parallel-run dual-write. The parallel-run window has
// exactly one writer (production / Supabase). This path is exercised only:
//   - during the pre-flip write rehearsal against a non-pilot rehearsal tenant
//     (`ABARVA_DATA_PLANE=azure-postgres` pointed at a rehearsal DB), and
//   - after the scheduled cutover-flip, when Azure becomes canonical.
//
// It is selectable but never implicitly active — `resolveDataPlane()` defaults
// to `supabase`.
//
// Unlike the Supabase adapter, Azure has real client-side transactions: a
// `WriteUnit` body runs inside a `BEGIN`/`COMMIT` (`createTxSession`), so a
// multi-statement unit is genuinely atomic and rolls back as a whole on error.

import { createTxSession, type TxSessionRunner } from '../read-adapters/azureSession';
import { canonicalTenantKey } from '@/lib/tenant-keys';
import type {
  AuditEntry,
  DataPlaneWriteAdapter,
  WriteResult,
  WriteStatementRunner,
  WriteUnit,
} from './types';
import { writeOk, writeRejected } from './types';

/** Postgres SQLSTATE for a unique-violation — surfaced as an idempotent replay. */
const UNIQUE_VIOLATION = '23505';
/** SQLSTATEs for an RLS / insufficient-privilege denial. */
const RLS_DENIED_CODES = new Set(['42501', 'P0001']);

function pgCode(err: unknown): string | undefined {
  return (err as { code?: string } | null)?.code;
}

function isUniqueViolation(err: unknown): boolean {
  if (pgCode(err) === UNIQUE_VIOLATION) return true;
  const msg = err instanceof Error ? err.message : String(err ?? '');
  return /duplicate key value|already exists/i.test(msg);
}

function isRlsDenied(err: unknown): boolean {
  const code = pgCode(err);
  if (code && RLS_DENIED_CODES.has(code)) return true;
  const msg = err instanceof Error ? err.message : String(err ?? '');
  return /row-level security|permission denied|not authorized/i.test(msg);
}

/**
 * Build an Azure Postgres write adapter. The transaction-capable session is
 * injectable so tests drive it without a live Azure Postgres.
 */
export function createAzurePostgresWriteAdapter(
  session: TxSessionRunner = createTxSession('abarva-data-plane-write'),
): DataPlaneWriteAdapter {
  return {
    name: 'azure-postgres',

    async commit<T>(unit: WriteUnit<T>): Promise<WriteResult<T>> {
      try {
        const data = await session(async (run) => {
          // Set the per-user RLS context for this transaction so Azure policy
          // enforcement matches Supabase's per-user RLS (design doc §2).
          await run('SELECT set_config($1, $2, true)', [
            'abarva.actor_user_id',
            unit.actorUserId,
          ]);
          const stmt: WriteStatementRunner = async <R>(
            sql: string,
            params: readonly unknown[],
          ): Promise<R[]> => run<R>(sql, [...params]) as Promise<R[]>;
          return unit.run(stmt);
        });
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
      const tenantKey = canonicalTenantKey(entry.tenantKey);
      // Append-only INSERT — a NEW row with parent_id; never an UPDATE.
      const columns: Record<string, unknown> = {
        ...entry.columns,
        parent_id: entry.parentId,
      };
      const keys = Object.keys(columns);
      const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
      const values = keys.map((k) => columns[k]);
      const sql =
        `INSERT INTO ${entry.table} (${keys.join(', ')}) `
        + `VALUES (${placeholders}) RETURNING id`;
      try {
        const rows = await session(async (run) => {
          await run('SELECT set_config($1, $2, true)', [
            'abarva.actor_user_id',
            entry.actorUserId,
          ]);
          return run<{ id: string }>(sql, values);
        });
        void tenantKey;
        return writeOk<{ id: string }>(rows[0]);
      } catch (err) {
        if (isUniqueViolation(err)) {
          return writeOk<{ id: string }>(undefined, 'idempotent_replay');
        }
        if (isRlsDenied(err)) {
          return writeRejected<{ id: string }>(
            'rls_denied',
            err instanceof Error ? err.message : undefined,
          );
        }
        return writeRejected<{ id: string }>(
          'backend_error',
          err instanceof Error ? err.message : 'unknown',
        );
      }
    },
  };
}

/** The Azure Postgres write adapter instance (opt-in via ABARVA_DATA_PLANE). */
export const azurePostgresWriteAdapter: DataPlaneWriteAdapter =
  createAzurePostgresWriteAdapter();
