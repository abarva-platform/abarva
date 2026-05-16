// Admin user-provisioning write adapter (Slice 3d).
//
// Backs the DB writes of `POST /api/admin/users/provision`:
//   - the `persons` upsert (onConflict: email),
//   - the `person_client_memberships` upsert (onConflict: person_id,client_id),
//   - the per-program `engagement_participants` insert-or-update.
//
// The route keeps everything that is NOT a physical DB write — tenancy
// resolution, the `canAdminUsers` RBAC gate, request-body validation, the
// best-effort program audit log, and all Clerk invitation calls. Clerk is an
// external identity provider, NOT a data plane, so it is deliberately out of
// scope here.
//
// `POST /api/admin/seed-clerk-metadata` is also a Slice 3d route, but it issues
// NO Postgres write — it only reads `persons.id` and then calls Clerk. There is
// nothing to route through the write seam for that route; it is listed in the
// slice for completeness and audited here as read-only.
//
// Every row body is byte-faithful to the pre-seam `.upsert()` / `.insert()` /
// `.update()` calls — identical snake_case columns, identical values. Default
// behavior is unchanged: `ABARVA_DATA_PLANE` selects the plane, `supabase`
// unless explicitly opted out.

import type { SupabaseClient } from '@supabase/supabase-js';
import { getServerSupabase } from '@/lib/supabase-server';
import { createTxSession, type TxSessionRunner } from '../read-adapters/azureSession';
import { resolveDataPlane } from '../read-adapters/resolveDataPlane';
import type { DataPlane } from './types';

/** Input for the `persons` upsert keyed on email. */
export interface PersonUpsertInput {
  graphNodeId: string;
  email: string;
  name: string;
  role: string;
  organization: string;
}

/** Input for the `person_client_memberships` upsert keyed on (person, client). */
export interface MembershipUpsertInput {
  personId: string;
  clientId: string;
  accessLevel: string;
  financialVisibility: boolean;
  canAdminUsers: boolean;
  canCreatePrograms: boolean;
  canApproveGates: boolean;
}

/** The `engagement_participants` row body — built route-side, written here. */
export interface ParticipantUpsertInput {
  /** Existing participant row id when this is an update; null to insert. */
  existingId: string | null;
  payload: Record<string, unknown>;
}

/** Outcome of an admin write that may legitimately fail (surface to the route). */
export type AdminWriteResult<T> =
  | { ok: true; data: T }
  | { ok: false; detail: string };

/** An admin user-provisioning write adapter bound to one physical data plane. */
export interface AdminWriteAdapter {
  readonly name: DataPlane;
  /** Upsert the `persons` row; returns the person id. */
  upsertPerson(input: PersonUpsertInput): Promise<AdminWriteResult<{ id: string }>>;
  /** Upsert the `person_client_memberships` row. */
  upsertMembership(input: MembershipUpsertInput): Promise<AdminWriteResult<void>>;
  /** Insert or update one `engagement_participants` row. */
  upsertParticipant(input: ParticipantUpsertInput): Promise<AdminWriteResult<void>>;
}

// --- shared row-body builders (single source of truth for both planes) ------

function personColumns(input: PersonUpsertInput): Record<string, unknown> {
  return {
    graph_node_id: input.graphNodeId,
    email: input.email,
    name: input.name,
    role: input.role,
    organization: input.organization,
  };
}

function membershipColumns(input: MembershipUpsertInput): Record<string, unknown> {
  return {
    person_id: input.personId,
    client_id: input.clientId,
    role: 'client_viewer',
    access_level: input.accessLevel,
    financial_visibility: input.financialVisibility,
    can_admin_users: input.canAdminUsers,
    can_create_programs: input.canCreatePrograms,
    can_approve_gates: input.canApproveGates,
  };
}

function errDetail(err: unknown): string {
  return err instanceof Error ? err.message : 'unknown';
}

// --- Supabase admin write adapter (DEFAULT) --------------------------------

/**
 * Supabase admin write adapter — the DEFAULT path. Uses the native
 * service-role client with the exact `onConflict` upsert semantics the
 * pre-seam route relied on.
 */
export function createSupabaseAdminWriteAdapter(
  getClient: () => SupabaseClient = getServerSupabase,
): AdminWriteAdapter {
  return {
    name: 'supabase',

    async upsertPerson(input) {
      const { data, error } = await getClient()
        .from('persons')
        .upsert(personColumns(input), { onConflict: 'email' })
        .select('id')
        .single();
      if (error || !data) {
        return { ok: false, detail: error?.message ?? 'No person row returned.' };
      }
      return { ok: true, data: { id: (data as { id: string }).id } };
    },

    async upsertMembership(input) {
      const { error } = await getClient()
        .from('person_client_memberships')
        .upsert(membershipColumns(input), { onConflict: 'person_id,client_id' });
      return error ? { ok: false, detail: error.message } : { ok: true, data: undefined };
    },

    async upsertParticipant(input) {
      const sb = getClient();
      const { error } = input.existingId
        ? await sb
            .from('engagement_participants')
            .update(input.payload)
            .eq('id', input.existingId)
        : await sb.from('engagement_participants').insert(input.payload);
      return error ? { ok: false, detail: error.message } : { ok: true, data: undefined };
    },
  };
}

// --- Azure Postgres admin write adapter (opt-in) ---------------------------

/** Build an `INSERT ... ON CONFLICT (...) DO UPDATE` statement + values. */
function upsertStatement(
  table: string,
  columns: Record<string, unknown>,
  conflictColumns: string[],
  returning?: string,
): { sql: string; values: unknown[] } {
  const keys = Object.keys(columns);
  const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
  const updates = keys
    .filter((k) => !conflictColumns.includes(k))
    .map((k) => `${k} = EXCLUDED.${k}`)
    .join(', ');
  const sql =
    `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders}) `
    + `ON CONFLICT (${conflictColumns.join(', ')}) DO UPDATE SET ${updates}`
    + (returning ? ` RETURNING ${returning}` : '');
  return { sql, values: keys.map((k) => columns[k]) };
}

/**
 * Azure Postgres admin write adapter — opt-in cutover/rehearsal path. Each
 * upsert runs inside a real `BEGIN`/`COMMIT` transaction.
 */
export function createAzureAdminWriteAdapter(
  session: TxSessionRunner = createTxSession('abarva-admin-write'),
): AdminWriteAdapter {
  return {
    name: 'azure-postgres',

    async upsertPerson(input) {
      const { sql, values } = upsertStatement(
        'persons',
        personColumns(input),
        ['email'],
        'id',
      );
      try {
        const rows = await session(async (run) => run<{ id: string }>(sql, values));
        if (!rows[0]) return { ok: false, detail: 'No person row returned.' };
        return { ok: true, data: { id: rows[0].id } };
      } catch (err) {
        return { ok: false, detail: errDetail(err) };
      }
    },

    async upsertMembership(input) {
      const { sql, values } = upsertStatement(
        'person_client_memberships',
        membershipColumns(input),
        ['person_id', 'client_id'],
      );
      try {
        await session(async (run) => run(sql, values));
        return { ok: true, data: undefined };
      } catch (err) {
        return { ok: false, detail: errDetail(err) };
      }
    },

    async upsertParticipant(input) {
      try {
        await session(async (run) => {
          if (input.existingId) {
            const keys = Object.keys(input.payload);
            const sets = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
            const values = keys.map((k) => input.payload[k]);
            await run(
              `UPDATE engagement_participants SET ${sets} WHERE id = $${keys.length + 1}`,
              [...values, input.existingId],
            );
          } else {
            const keys = Object.keys(input.payload);
            const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
            await run(
              `INSERT INTO engagement_participants (${keys.join(', ')}) `
                + `VALUES (${placeholders})`,
              keys.map((k) => input.payload[k]),
            );
          }
        });
        return { ok: true, data: undefined };
      } catch (err) {
        return { ok: false, detail: errDetail(err) };
      }
    },
  };
}

/**
 * Select the admin write adapter for the configured (or explicitly passed)
 * plane. Defaults to Supabase — production write behavior unchanged.
 */
export function selectAdminWriteAdapter(plane?: DataPlane): AdminWriteAdapter {
  const target = plane ?? resolveDataPlane();
  return target === 'azure-postgres'
    ? createAzureAdminWriteAdapter()
    : createSupabaseAdminWriteAdapter();
}
