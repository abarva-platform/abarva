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

import {
  getAzureWriteFluentClient,
  type PostgresCompatClient as SupabaseClient,
} from '@/lib/data-plane/postgresCompat';
import { canonicalTenantKey } from '@/lib/tenant-keys';
import { createTxSession, type TxSessionRunner } from '../read-adapters/azureSession';
import { resolveDataPlane } from '../read-adapters/resolveDataPlane';
import type { DataPlane } from './types';
import { embedDiscoveryPlanInCharter } from '@/lib/programs/discovery/charter-transformers';
import type { DiscoveryPlan } from '@/lib/programs/discovery/discovery-intake';

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

// --- Slice 3f: shared-helper write shapes -----------------------------------
//
// These three ops back the DB writes inside the `src/lib/programs` shared
// helpers (`advancePhase`, `requestFounderApproval`, `draftModuleDeliverable`).
// Unlike the seed/advance ops above, the helpers RE-THROW on a DB error and
// depend on the inserted row ids, so these ops return a `ProgramsWriteOutcome`
// — `ok:false` carries the error message the helper turns back into a throw,
// and `data` carries the ids the helper returns to its callers.

/** A write outcome that carries inserted data or an error to re-throw. */
export interface ProgramsWriteOutcome<T> {
  readonly ok: boolean;
  readonly data?: T;
  readonly error?: string;
}

/** The full `advancePhase` transaction: snapshot insert + engagement update +
 *  state-log insert. On Azure this is one `BEGIN`/`COMMIT`; on Supabase the
 *  same three statements the pre-seam helper issued. */
export interface AdvancePhaseTxInput {
  readonly programId: string;
  readonly clientId: string;
  readonly userId: string;
  readonly fromPhase: number;
  readonly toPhase: number;
  readonly snapshot: Record<string, unknown>;
  readonly approvedByUserId?: string;
  readonly bypassGate?: boolean;
  // Discovery Intake (S2c): when present, the P1 plan is merged into the
  // engagements.charter JSONB during the phase advance. Already flag-gated
  // upstream in mutations.advancePhase — the adapter just persists it.
  readonly discoveryPlan?: DiscoveryPlan | null;
}

/** The `requestFounderApproval` insert into `founder_approval_requests`. */
export interface FounderApprovalInsertInput {
  readonly programId: string;
  readonly requestedByUserId: string;
  readonly requestType: string;
  readonly headline: string;
  readonly context: Record<string, unknown>;
  readonly approverUserId: string | null;
  readonly approverRole: string | null;
  readonly deadlineAtIso: string | null;
}

/** The `draftModuleDeliverable` upsert: deliverables_v2 row + version insert. */
export interface DraftModuleDeliverableTxInput {
  readonly programId: string;
  readonly deliverableTypeKey: string;
  readonly title: string;
  readonly draftContent: string;
  readonly structuredData: Record<string, unknown>;
  readonly provenanceMap: Record<string, unknown> | null;
  readonly contextHash: string | null;
}

/**
 * The programs-domain write adapter for one physical data plane. Each method
 * is best-effort at the SAME granularity the pre-seam route used — a single
 * participant insert that fails is logged and skipped by the caller; the
 * adapter surfaces the failure and lets the route keep its existing policy.
 */
/** The `updateEngagementCharter` write: replace an engagement's charter JSONB. */
export interface UpdateEngagementCharterTxInput {
  readonly programId: string;
  readonly clientId: string;
  readonly charter: Record<string, unknown>;
}

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

  // --- Slice 3f shared-helper ops -------------------------------------------

  /**
   * Run the `advancePhase` write: insert a `phase_snapshots` row, update
   * `engagements.current_phase`, and insert a `module_state_log` row. On Azure
   * all three run in ONE transaction; on Supabase they are the same three
   * statements the helper issued. `data.snapshotId` is the new snapshot row id.
   * On any DB error returns `ok:false` with the message — the helper re-throws.
   */
  runAdvancePhase(
    input: AdvancePhaseTxInput,
  ): Promise<ProgramsWriteOutcome<{ snapshotId: string }>>;

  /**
   * Insert a `founder_approval_requests` row. `data.approvalId` is the new
   * row id. On a DB error returns `ok:false` — the helper re-throws.
   */
  insertFounderApproval(
    input: FounderApprovalInsertInput,
  ): Promise<ProgramsWriteOutcome<{ approvalId: string }>>;

  /**
   * Run the `draftModuleDeliverable` write: upsert the `deliverables_v2` row
   * (insert if absent, version-bump if present) and insert a
   * `deliverable_versions` row. On Azure both run in ONE transaction; on
   * Supabase they are the same statements the helper issued. On a DB error
   * returns `ok:false` — the helper re-throws.
   */
  /**
   * Update an engagement's `charter` JSONB (e.g. merge discovery extraction on
   * upload). On a DB error returns `ok:false` — the caller surfaces it.
   */
  updateEngagementCharter(
    input: UpdateEngagementCharterTxInput,
  ): Promise<ProgramsWriteOutcome<{ updated: boolean }>>;

  runDraftModuleDeliverable(
    input: DraftModuleDeliverableTxInput,
  ): Promise<ProgramsWriteOutcome<{ deliverableId: string; versionId: string }>>;
}

// --- Supabase adapter (DEFAULT) --------------------------------------------

export type SupabaseFactory = () => SupabaseClient;

/**
 * Build the Supabase programs write adapter. Insert/update logic is lifted
 * verbatim from the pre-seam routes, so the produced rows are byte-identical.
 * The client factory is injectable so tests drive it without a backend.
 */
export function createSupabaseProgramsWriteAdapter(
  getClient: SupabaseFactory = getAzureWriteFluentClient,
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

    async runAdvancePhase(input) {
      const sb = getClient();
      const nowIso = new Date().toISOString();
      const { data: snap, error: snapErr } = await sb
        .from('phase_snapshots')
        .insert({
          engagement_id: input.programId,
          phase_number: input.fromPhase,
          snapshot_jsonb: input.snapshot,
          locked_by_user_id: input.userId,
          locked_at: nowIso,
          approval_status: input.approvedByUserId ? 'approved' : 'pending',
        })
        .select('id')
        .single();
      if (snapErr) return { ok: false, error: snapErr.message };
      const snapshotId = (snap as { id: string }).id;

      // Discovery Intake (S2c): merge the P1 plan into the charter JSONB on
      // advance (read-modify-write via the shared, tested planner). No plan →
      // the update is byte-identical to today's.
      const engUpdate: Record<string, unknown> = {
        current_phase: input.toPhase,
        phase_locked_at: nowIso,
        phase_locked_by_user_id: input.userId,
      };
      if (input.discoveryPlan) {
        const { data: cur } = await sb
          .from('engagements')
          .select('charter')
          .eq('id', input.programId)
          .eq('client_id', input.clientId)
          .maybeSingle();
        const currentCharter =
          (cur as { charter: Record<string, unknown> | null } | null)?.charter ?? null;
        engUpdate.charter = embedDiscoveryPlanInCharter(currentCharter, input.discoveryPlan);
      }
      const { error: eErr } = await sb
        .from('engagements')
        .update(engUpdate)
        .eq('id', input.programId)
        .eq('client_id', input.clientId);
      if (eErr) return { ok: false, error: eErr.message };

      const { error: logErr } = await sb.from('module_state_log').insert({
        engagement_id: input.programId,
        module_key: `phase_${input.fromPhase}`,
        previous_state: 'in_progress',
        new_state: 'completed',
        changed_by_user_id: input.userId,
        notes: `Advanced ${input.fromPhase} → ${input.toPhase}`,
        context_jsonb: {
          bypass_gate: !!input.bypassGate,
          approved_by: input.approvedByUserId ?? null,
        },
      });
      if (logErr) return { ok: false, error: logErr.message };
      return { ok: true, data: { snapshotId } };
    },

    async insertFounderApproval(input) {
      const sb = getClient();
      const { data, error } = await sb
        .from('founder_approval_requests')
        .insert({
          engagement_id: input.programId,
          request_type: input.requestType,
          status: 'pending',
          requested_by_user_id: input.requestedByUserId,
          approver_user_id: input.approverUserId,
          approver_role: input.approverRole,
          headline: input.headline,
          context_jsonb: input.context,
          deadline_at: input.deadlineAtIso,
        })
        .select('id')
        .single();
      if (error) return { ok: false, error: error.message };
      return { ok: true, data: { approvalId: (data as { id: string }).id } };
    },

    async updateEngagementCharter(input) {
      const sb = getClient();
      const { error } = await sb
        .from('engagements')
        .update({ charter: input.charter })
        .eq('id', input.programId)
        .eq('client_id', input.clientId);
      if (error) return { ok: false, error: error.message };
      return { ok: true, data: { updated: true } };
    },

    async runDraftModuleDeliverable(input) {
      const sb = getClient();
      const { error: typeErr } = await sb.from('deliverable_types').upsert(
        {
          type_key: input.deliverableTypeKey,
          title: input.title,
          description: `Generated Moves deliverable: ${input.title}`,
          applicable_phases: [],
          applicable_topics: [],
          template_structure: {},
          required_data_inputs: {},
          quality_rubric: {},
          generation_prompt_template: '',
          output_format: 'markdown',
          maturity: 'pilot',
        },
        { onConflict: 'type_key' },
      );
      if (typeErr) return { ok: false, error: typeErr.message };

      const { data: existing, error: existingErr } = await sb
        .from('deliverables_v2')
        .select('id, current_version')
        .eq('engagement_id', input.programId)
        .eq('deliverable_type_key', input.deliverableTypeKey)
        .maybeSingle();
      if (existingErr) return { ok: false, error: existingErr.message };

      let deliverableId: string;
      let nextVersion = 1;
      if (existing) {
        deliverableId = (existing as { id: string; current_version: number }).id;
        nextVersion =
          ((existing as { current_version: number }).current_version ?? 0) + 1;
        const { error } = await sb
          .from('deliverables_v2')
          .update({
            current_version: nextVersion,
            status: 'draft',
            updated_at: new Date().toISOString(),
          })
          .eq('id', deliverableId);
        if (error) return { ok: false, error: error.message };
      } else {
        const { data: created, error } = await sb
          .from('deliverables_v2')
          .insert({
            engagement_id: input.programId,
            deliverable_type_key: input.deliverableTypeKey,
            title: input.title,
            status: 'draft',
            current_version: 1,
            created_by: 'nexus',
          })
          .select('id')
          .single();
        if (error) return { ok: false, error: error.message };
        deliverableId = (created as { id: string }).id;
      }

      const { data: version, error: vErr } = await sb
        .from('deliverable_versions')
        .insert({
          deliverable_id: deliverableId,
          version: nextVersion,
          content: input.draftContent,
          structured_data: input.structuredData,
          quality_issues: input.provenanceMap
            ? { provenance_map: input.provenanceMap }
            : null,
          generated_from_context_hash: input.contextHash,
        })
        .select('id')
        .single();
      if (vErr) return { ok: false, error: vErr.message };
      return {
        ok: true,
        data: { deliverableId, versionId: (version as { id: string }).id },
      };
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

    async runAdvancePhase(input) {
      try {
        // One transaction for snapshot insert + engagement update + state log
        // — the real atomicity Supabase cannot provide (design doc §2).
        const snapshotId = await session(async (run) => {
          const snapRows = await run<{ id: string }>(
            'INSERT INTO phase_snapshots '
              + '(engagement_id, phase_number, snapshot_jsonb, locked_by_user_id, '
              + 'locked_at, approval_status) '
              + 'VALUES ($1, $2, $3, $4, now(), $5) RETURNING id',
            [
              input.programId,
              input.fromPhase,
              input.snapshot,
              input.userId,
              input.approvedByUserId ? 'approved' : 'pending',
            ],
          );
          // Discovery Intake (S2c): merge the P1 plan into the charter inside
          // the SAME transaction (read-modify-write via the shared planner).
          if (input.discoveryPlan) {
            const curRows = await run<{ charter: Record<string, unknown> | null }>(
              'SELECT charter FROM engagements WHERE id = $1 AND client_id = $2',
              [input.programId, input.clientId],
            );
            const mergedCharter = embedDiscoveryPlanInCharter(
              curRows[0]?.charter ?? null,
              input.discoveryPlan,
            );
            await run(
              'UPDATE engagements '
                + 'SET current_phase = $1, phase_locked_at = now(), '
                + 'phase_locked_by_user_id = $2, charter = $3 '
                + 'WHERE id = $4 AND client_id = $5',
              [input.toPhase, input.userId, mergedCharter, input.programId, input.clientId],
            );
          } else {
            await run(
              'UPDATE engagements '
                + 'SET current_phase = $1, phase_locked_at = now(), '
                + 'phase_locked_by_user_id = $2 '
                + 'WHERE id = $3 AND client_id = $4',
              [input.toPhase, input.userId, input.programId, input.clientId],
            );
          }
          await run(
            'INSERT INTO module_state_log '
              + '(engagement_id, module_key, previous_state, new_state, '
              + 'changed_by_user_id, notes, context_jsonb) '
              + "VALUES ($1, $2, 'in_progress', 'completed', $3, $4, $5)",
            [
              input.programId,
              `phase_${input.fromPhase}`,
              input.userId,
              `Advanced ${input.fromPhase} → ${input.toPhase}`,
              {
                bypass_gate: !!input.bypassGate,
                approved_by: input.approvedByUserId ?? null,
              },
            ],
          );
          return snapRows[0]?.id ?? '';
        });
        if (!snapshotId) return { ok: false, error: 'phase snapshot insert returned no id' };
        return { ok: true, data: { snapshotId } };
      } catch (err) {
        return { ok: false, error: err instanceof Error ? err.message : String(err) };
      }
    },

    async insertFounderApproval(input) {
      try {
        const rows = await session((run) =>
          run<{ id: string }>(
            'INSERT INTO founder_approval_requests '
              + '(engagement_id, request_type, status, requested_by_user_id, '
              + 'approver_user_id, approver_role, headline, context_jsonb, deadline_at) '
              + "VALUES ($1, $2, 'pending', $3, $4, $5, $6, $7, $8) RETURNING id",
            [
              input.programId,
              input.requestType,
              input.requestedByUserId,
              input.approverUserId,
              input.approverRole,
              input.headline,
              input.context,
              input.deadlineAtIso,
            ],
          ),
        );
        const approvalId = rows[0]?.id;
        if (!approvalId) return { ok: false, error: 'approval insert returned no id' };
        return { ok: true, data: { approvalId } };
      } catch (err) {
        return { ok: false, error: err instanceof Error ? err.message : String(err) };
      }
    },

    async updateEngagementCharter(input) {
      try {
        await session((run) =>
          run('UPDATE engagements SET charter = $1 WHERE id = $2 AND client_id = $3', [
            input.charter,
            input.programId,
            input.clientId,
          ]),
        );
        return { ok: true, data: { updated: true } };
      } catch (err) {
        return { ok: false, error: err instanceof Error ? err.message : String(err) };
      }
    },

    async runDraftModuleDeliverable(input) {
      try {
        // One transaction: deliverables_v2 upsert + deliverable_versions insert.
        const result = await session(async (run) => {
          await run(
            'INSERT INTO deliverable_types '
              + '(type_key, title, description, applicable_phases, applicable_topics, '
              + 'template_structure, required_data_inputs, quality_rubric, '
              + 'generation_prompt_template, output_format, maturity) '
              + 'VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) '
              + 'ON CONFLICT (type_key) DO UPDATE SET '
              + 'title = EXCLUDED.title, description = EXCLUDED.description',
            [
              input.deliverableTypeKey,
              input.title,
              `Generated Moves deliverable: ${input.title}`,
              [],
              [],
              {},
              {},
              {},
              '',
              'markdown',
              'pilot',
            ],
          );
          const existingRows = await run<{ id: string; current_version: number }>(
            'SELECT id, current_version FROM deliverables_v2 '
              + 'WHERE engagement_id = $1 AND deliverable_type_key = $2 LIMIT 1',
            [input.programId, input.deliverableTypeKey],
          );
          let deliverableId: string;
          let nextVersion = 1;
          if (existingRows[0]) {
            deliverableId = existingRows[0].id;
            nextVersion = (existingRows[0].current_version ?? 0) + 1;
            await run(
              'UPDATE deliverables_v2 '
                + "SET current_version = $1, status = 'draft', updated_at = now() "
                + 'WHERE id = $2',
              [nextVersion, deliverableId],
            );
          } else {
            const createdRows = await run<{ id: string }>(
              'INSERT INTO deliverables_v2 '
                + '(engagement_id, deliverable_type_key, title, status, '
                + 'current_version, created_by) '
                + "VALUES ($1, $2, $3, 'draft', 1, 'nexus') RETURNING id",
              [input.programId, input.deliverableTypeKey, input.title],
            );
            deliverableId = createdRows[0]?.id ?? '';
          }
          const versionRows = await run<{ id: string }>(
            'INSERT INTO deliverable_versions '
              + '(deliverable_id, version, content, structured_data, '
              + 'quality_issues, generated_from_context_hash) '
              + 'VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
            [
              deliverableId,
              nextVersion,
              input.draftContent,
              input.structuredData,
              input.provenanceMap ? { provenance_map: input.provenanceMap } : null,
              input.contextHash,
            ],
          );
          return { deliverableId, versionId: versionRows[0]?.id ?? '' };
        });
        if (!result.deliverableId || !result.versionId) {
          return { ok: false, error: 'deliverable draft insert returned no id' };
        }
        return { ok: true, data: result };
      } catch (err) {
        return { ok: false, error: err instanceof Error ? err.message : String(err) };
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
