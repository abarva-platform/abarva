// Data-plane write-adapter contract (write-seam foundation).
//
// The read seam (`src/lib/data-plane/read-adapters/`) made the backing store
// an implementation detail for reads. This module does the same for writes.
//
// Per `docs/architecture/azure/DATA-ACCESS-ADAPTER-WRITE-PATH-DESIGN.md`, the
// parallel-run write policy is **cutover-flip**: production (Supabase) stays
// the sole writer through the parallel-run window; Azure becomes canonical in
// one scheduled move. There is NO dual-write. The Azure write adapter exists
// for the pre-flip write rehearsal and the post-flip canonical path — it is
// selectable via `ABARVA_DATA_PLANE=azure-postgres`, never implicitly active.
//
// Four properties the write contract carries that the read contract did not
// (design doc §2):
//   - Transactions   — multi-statement writes must be atomic. Azure uses real
//                      BEGIN/COMMIT; Supabase has no client-side transaction,
//                      so a `WriteUnit` is the atomic boundary the adapter
//                      honors however its backend allows (RPC / single insert).
//   - Append-only audit — `appendAudit` is a first-class operation; it inserts
//                      a new row and never updates a prior one (SOC2 trail).
//   - RLS            — `actorUserId` rides on every unit so Azure can set the
//                      same per-user policy context Supabase RLS enforces.
//   - Idempotency    — every `WriteUnit` carries an `idempotencyKey`; a replay
//                      returns the prior result with `reason:'idempotent_replay'`.
//
// This file is the single source of truth for the write-seam shapes.

/**
 * Which physical data plane an adapter targets. Reused conceptually from the
 * read seam — re-exported here so write callers need not import the read
 * module just for the type.
 */
export type { DataPlane } from '../read-adapters/types';
import type { DataPlane } from '../read-adapters/types';

/**
 * Stable, machine-readable reason for a non-`ok` (or non-default-`ok`) write.
 * Codes are deliberately closed so callers can branch without string-matching
 * free text. `idempotent_replay` is an `ok` outcome — the prior write stood.
 */
export type WriteReason =
  | 'idempotent_replay'
  | 'rls_denied'
  | 'conflict'
  | 'not_found'
  | 'invalid_state'
  | 'unsupported'
  | 'backend_error';

/**
 * Outcome of a write. A write adapter NEVER throws for an *expected* business
 * rejection (conflict, RLS denial, replay) — it returns `ok:false` with a
 * `reason`. It may still throw for a genuinely unexpected fault; callers wrap
 * accordingly. `data` is present on success when the write produces a row.
 */
export interface WriteResult<T> {
  readonly ok: boolean;
  readonly data?: T;
  /** Set on rejection, and on a successful idempotent replay. */
  readonly reason?: WriteReason;
  /** Optional human-readable detail for logs — never load-bearing. */
  readonly detail?: string;
}

/** Convenience constructors keep call sites terse and the shape consistent. */
export function writeOk<T>(data?: T, reason?: WriteReason): WriteResult<T> {
  return { ok: true, data, reason };
}

export function writeRejected<T>(reason: WriteReason, detail?: string): WriteResult<T> {
  return { ok: false, reason, detail };
}

/**
 * An append-only audit entry. Mirrors the `QuarantineAuditDataSource` lifecycle
 * insert: a NEW row pointing at the original via `parentId`. The audit table
 * is reconstructed by joining on `parentId`; a prior row is NEVER updated.
 *
 * `table` is the physical table the row lands in. `columns` is the row body —
 * snake_case keys, exactly as the backend column names — so a Supabase
 * `.insert()` and an Azure `INSERT` produce a byte-faithful row on either
 * plane.
 */
export interface AuditEntry {
  /** Physical append-only audit table, e.g. `sensitive_upload_audit`. */
  readonly table: string;
  /** Tenant the row belongs to; canonicalized by the adapter. */
  readonly tenantKey: string;
  /** Actor performing the write — for RLS context and the audit row. */
  readonly actorUserId: string;
  /** The original row this lifecycle entry descends from, if any. */
  readonly parentId: string | null;
  /** Idempotency key — a replayed audit insert must not duplicate the row. */
  readonly idempotencyKey: string;
  /** Row body, snake_case column names → values. */
  readonly columns: Readonly<Record<string, unknown>>;
}

/**
 * A unit of work that may span multiple statements. The adapter decides how to
 * honor atomicity: Supabase = RPC / single-statement; Azure = real BEGIN/COMMIT.
 * `run` receives a plane-agnostic statement runner.
 */
export interface WriteUnit<T> {
  /** Caller-supplied key; the same key MUST yield the same result. */
  readonly idempotencyKey: string;
  /** Tenant scope; canonicalized by the adapter, as in the read seam. */
  readonly tenantKey: string;
  /** Actor — for RLS context and any audit row the unit writes. */
  readonly actorUserId: string;
  /** The unit's body. Receives a runner whose statements are atomic. */
  run(stmt: WriteStatementRunner): Promise<T>;
}

/**
 * A parameterized statement runner bound to an atomic write boundary. On Azure
 * this is a transaction-scoped `pg` runner; on Supabase it is an RPC/insert
 * shim. `WriteUnit.run` receives one of these.
 */
export type WriteStatementRunner = <R = Record<string, unknown>>(
  sql: string,
  params: readonly unknown[],
) => Promise<R[]>;

/**
 * A write adapter commits units of work to one physical data plane.
 * Implementations MUST:
 *   - canonicalize tenant keys on the way in;
 *   - honor `idempotencyKey` — a replay returns the prior result, never a
 *     double-apply, with `reason:'idempotent_replay'`;
 *   - return `ok:false` with a `reason` for expected business rejections
 *     rather than throwing;
 *   - keep `appendAudit` strictly append-only.
 */
export interface DataPlaneWriteAdapter {
  readonly name: DataPlane;
  /**
   * Execute a multi-statement unit of work atomically with idempotency +
   * audit guarantees.
   *
   * `commit()` is the **transactional Azure-plane primitive** — the Azure
   * adapter runs the unit inside a real `BEGIN`/`COMMIT`. On the **Supabase
   * plane it is unsupported by design**: the Supabase JS client has no
   * client-side transaction, and the cutover-flip strategy keeps Supabase as
   * the unchanged production writer rather than introducing a
   * `SECURITY DEFINER` SQL-exec RPC (an injection / privilege-escalation
   * surface). The Supabase adapter therefore returns `ok:false` with
   * `reason:'unsupported'`. Supabase domains do their writes via
   * `appendAudit()` or a native per-domain adapter — see
   * `programsWriteAdapter.ts` for the canonical example.
   */
  commit<T>(unit: WriteUnit<T>): Promise<WriteResult<T>>;
  /** Append-only audit insert — the SOC2 path; never updates a prior row. */
  appendAudit(entry: AuditEntry): Promise<WriteResult<{ id: string }>>;
}
