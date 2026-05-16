// Programs-domain write adapter (write seam — Slice 3a).
//
// Backs the DB-write half of the programs write routes. It follows the SAME
// per-domain plane-split pattern the Slice 2 read adapters established
// (`programsReadAdapter.ts`): a narrow domain interface with a `supabase`
// (default, native client) implementation and an `azure-postgres` (opt-in,
// `createTxSession` + SQL) implementation, switched by `resolveDataPlane()`.
//
// WHY a per-domain adapter rather than the generic `DataPlaneWriteAdapter`:
// the generic `commit()` runs a `WriteUnit` body through a SQL statement
// runner — on Supabase that runner depends on a `data_plane_exec` RPC that is
// NOT yet provisioned, so `commit()` is contract-only today. `appendAudit()`
// IS wired (native `.insert()`), but it unconditionally injects a `parent_id`
// column, so it only fits append-only audit tables. None of the Slice 3a
// routes write to such a table. The read seam solved the identical problem
// for reads with per-domain adapters; this module does the same for writes.
// When the foundation grows a Supabase-safe general-write primitive, these
// operations can move onto it without a route change — the route only ever
// sees this domain interface.
//
// The seam owns ONLY the physical DB write. Auth, RBAC, validation, classifier
// logging, and Maestro flags stay route-side, exactly as the design doc
// (§4 — "migrate at the route boundary") prescribes.
//
// Atomicity: on Azure each operation runs inside one `BEGIN`/`COMMIT`
// (`createTxSession`), so the multi-row module seed is genuinely atomic and
// rolls back as a whole on error — the real client-side transaction Supabase
// lacks (design doc §2). On Supabase the writes are the same per-row inserts
// the pre-seam route issued; behavior is byte-identical.

import type { SupabaseClient } from '@supabase/supabase-js';
import { getServerSupabase } from '@/lib/supabase-server';
import { canonicalTenantKey } from '@/lib/tenant-keys';
import { createTxSession, type TxSessionRunner } from '../read-adapters/azureSession';
import { resolveDataPlane } from '../read-adapters/resolveDataPlane';
import type { DataPlane } from './types';

// --- domain shapes ----------------------------------------------------------

/** A participant row to seed onto a freshly originated program. */
export interface ProgramParticipantSeed {
  /** Engagement (program) the participant belongs to. */
  readonly engagementId: string;
  /** Person id of the participant. */
  readonly userId: string;
  /** Display name — the pre-seam route passes the person id here. */
  readonly userName: string;
  /** Participant role, e.g. `sponsor` / `lead`. */
  readonly role: string;
  /** Approval authority, e.g. `sponsor` / `approver`. */
  readonly approvalAuthority: string;
}

/** A program-module row to seed from a canonical pattern shape. */
export interface ProgramModuleSeed {
  readonly engagementId: string;
  readonly moduleKey: string;
  readonly moduleName: string;
  readonly phaseNumber: number;
  readonly moduleOrder: number;
}

/** Inputs for advancing an engagement's phase (the phase-gate write). */
export interface AdvanceEngagementPhaseInput {
  /** Engagement UUID being advanced. */
  readonly engagementId: string;
  /** New `current_phase` value. */
  readonly toPhase: number;
  /** Deduplicated, sorted `gates_passed` array to persist. */
  readonly gatesPassed: number[];
  /** Tenant scope — canonicalized by the adapter (defense-in-depth). */
  readonly tenantKey: string;
}

/**
 * The programs-domain write adapter for one physical data plane. Each method
 * is best-effort at the SAME granularity the pre-seam route used — a single
 * participant insert that fails is logged and skipped by the caller; the
 * adapter surfaces the failure and lets the route keep its existing policy.
 */
export interface ProgramsWriteAdapter {
  readonly name: DataPlane;
  /**
   * Insert one participant row. Resolves to `true` on success, `false` on a
   * write error (the route logs a soft warning and continues, unchanged from
   * the pre-seam behavior).
   */
  seedParticipant(seed: ProgramParticipantSeed): Promise<boolean>;
  /**
   * Insert the program-module scaffold rows in order. On Azure this is one
   * atomic transaction; on Supabase it is the same per-row insert loop the
   * route ran before. Resolves to the number of rows written.
   */
  seedModules(modules: readonly ProgramModuleSeed[]): Promise<number>;
  /**
   * Update an engagement's `current_phase` + `gates_passed`. Resolves to
   * `true` on success, `false` on a write error — the phase-gate route keeps
   * its existing best-effort posture (the filesystem ledger is canonical).
   */
  advanceEngagementPhase(input: AdvanceEngagementPhaseInput): Promise<boolean>;
}

// --- Supabase adapter (DEFAULT) --------------------------------------------

export type SupabaseFactory = () => SupabaseClient;

/**
 * Build the Supabase programs write adapter. Insert/update logic is lifted
 * verbatim from the pre-seam routes, so the produced rows are byte-identical.
 * The client factory is injectable so tests drive it without a backend.
 */
export function createSupabaseProgramsWriteAdapter(
  getClient: SupabaseFactory = getServerSupabase,
): ProgramsWriteAdapter {
  return {
    name: 'supabase',

    async seedParticipant(seed) {
      const sb = getClient();
      const { error } = await sb.from('engagement_participants').insert({
        engagement_id: seed.engagementId,
        user_id: seed.userId,
        user_name: seed.userName,
        role: seed.role,
        approval_authority: seed.approvalAuthority,
      });
      if (error) {
        console.warn('[programsWriteAdapter] participant insert failed', {
          engagementId: seed.engagementId,
          error: error.message,
        });
        return false;
      }
      return true;
    },

    async seedModules(modules) {
      if (modules.length === 0) return 0;
      const sb = getClient();
      let written = 0;
      for (const m of modules) {
        const { error } = await sb.from('program_modules').insert({
          engagement_id: m.engagementId,
          module_key: m.moduleKey,
          module_name: m.moduleName,
          phase_number: m.phaseNumber,
          module_order: m.moduleOrder,
          status: 'not_started',
        });
        if (error) {
          console.warn('[programsWriteAdapter] module insert failed', {
            engagementId: m.engagementId,
            moduleKey: m.moduleKey,
            error: error.message,
          });
          continue;
        }
        written += 1;
      }
      return written;
    },

    async advanceEngagementPhase(input) {
      // Canonicalize for parity with the Azure path — the same defense-in-depth
      // the read seam applies. The Supabase update is keyed by engagement id.
      void canonicalTenantKey(input.tenantKey);
      const sb = getClient();
      const { error } = await sb
        .from('engagements')
        .update({
          current_phase: input.toPhase,
          gates_passed: input.gatesPassed,
          updated_at: new Date().toISOString(),
        })
        .eq('id', input.engagementId);
      if (error) {
        console.error('[programsWriteAdapter] engagement phase update failed', {
          engagementId: input.engagementId,
          error: error.message,
        });
        return false;
      }
      return true;
    },
  };
}

// --- Azure Postgres adapter (opt-in) ---------------------------------------

/**
 * Build the Azure Postgres programs write adapter. Mirrors the Supabase
 * semantics row-for-row, but each operation runs inside a real
 * `BEGIN`/`COMMIT` transaction (`createTxSession`). The session runner is
 * injectable so tests drive it with an in-memory fake.
 */
export function createAzureProgramsWriteAdapter(
  session: TxSessionRunner = createTxSession('abarva-data-plane-programs-write'),
): ProgramsWriteAdapter {
  return {
    name: 'azure-postgres',

    async seedParticipant(seed) {
      try {
        await session(async (run) => {
          await run(
            'INSERT INTO engagement_participants '
              + '(engagement_id, user_id, user_name, role, approval_authority) '
              + 'VALUES ($1, $2, $3, $4, $5)',
            [seed.engagementId, seed.userId, seed.userName, seed.role, seed.approvalAuthority],
          );
        });
        return true;
      } catch (err) {
        console.warn('[programsWriteAdapter] participant insert failed (azure)', {
          engagementId: seed.engagementId,
          error: err instanceof Error ? err.message : String(err),
        });
        return false;
      }
    },

    async seedModules(modules) {
      if (modules.length === 0) return 0;
      try {
        // One transaction for the whole scaffold — atomic, unlike Supabase.
        return await session(async (run) => {
          for (const m of modules) {
            await run(
              'INSERT INTO program_modules '
                + '(engagement_id, module_key, module_name, phase_number, module_order, status) '
                + "VALUES ($1, $2, $3, $4, $5, 'not_started')",
              [m.engagementId, m.moduleKey, m.moduleName, m.phaseNumber, m.moduleOrder],
            );
          }
          return modules.length;
        });
      } catch (err) {
        console.warn('[programsWriteAdapter] module seed failed (azure)', {
          error: err instanceof Error ? err.message : String(err),
        });
        return 0;
      }
    },

    async advanceEngagementPhase(input) {
      void canonicalTenantKey(input.tenantKey);
      try {
        await session(async (run) => {
          await run(
            'UPDATE engagements '
              + 'SET current_phase = $1, gates_passed = $2, updated_at = now() '
              + 'WHERE id = $3',
            [input.toPhase, input.gatesPassed, input.engagementId],
          );
        });
        return true;
      } catch (err) {
        console.error('[programsWriteAdapter] engagement phase update failed (azure)', {
          engagementId: input.engagementId,
          error: err instanceof Error ? err.message : String(err),
        });
        return false;
      }
    },
  };
}

// --- selection --------------------------------------------------------------

/**
 * Select the programs write adapter for the configured (or explicitly passed)
 * plane. Defaults to Supabase — production write behavior is unchanged.
 */
export function selectProgramsWriteAdapter(plane?: DataPlane): ProgramsWriteAdapter {
  const target = plane ?? resolveDataPlane();
  return target === 'azure-postgres'
    ? createAzureProgramsWriteAdapter()
    : createSupabaseProgramsWriteAdapter();
}
