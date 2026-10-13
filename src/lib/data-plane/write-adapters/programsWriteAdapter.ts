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
import { createTxSession, type SqlRunner, type TxSessionRunner } from '../read-adapters/azureSession';
import { resolveDataPlaneForTenant } from '../read-adapters/resolveDataPlane';
import type { DataPlane } from './types';
import { embedDiscoveryPlanInCharter } from '@/lib/programs/discovery/charter-transformers';
import type { DiscoveryPlan } from '@/lib/programs/discovery/discovery-intake';
import { authoredDocumentSpec, readAuthoredUploadReceipt, type AuthoredUploadReceipt } from '@/lib/programs/authored-deliverable-receipt';

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
// helpers (`advancePhase`, `draftModuleDeliverable`).
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

export interface InitialAuthoredDeliverableInput {
  programId: string;
  clientId: string;
  title: string;
  content: string;
  receipt: AuthoredUploadReceipt;
}
export type InitialAuthoredDeliverableResult =
  | { kind: 'conflict' }
  | { kind: 'created' | 'replay'; deliverableId: string; versionId: string;
      version: number; currentVersion: number; receipt: AuthoredUploadReceipt };
export interface AuthoredApprovalInput {
  programId: string; clientId: string; deliverableId: string; versionId: string;
  version: number; content: string; receipt: AuthoredUploadReceipt;
  userId: string; reviewerRole: string; approvalRationale: string | null;
}

export interface ProgramsWriteAdapter {
  readonly name: DataPlane;
  runInitialAuthoredDeliverable(input: InitialAuthoredDeliverableInput): Promise<ProgramsWriteOutcome<InitialAuthoredDeliverableResult>>;
  runAuthoredApproval(input: AuthoredApprovalInput): Promise<ProgramsWriteOutcome<{ applied: boolean }>>;
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
    async runInitialAuthoredDeliverable() { return { ok: false, error: 'authored_upload_requires_azure_transaction' }; },
    async runAuthoredApproval() { return { ok: false, error: 'authored_approval_requires_azure_transaction' }; },

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
async function lockP2AuthoredOriginals(run: SqlRunner, r: AuthoredUploadReceipt) {
  if (r.phase !== 2) return;
  const originals = [{ ...r, fileRole: 'primary', fileFormat: authoredDocumentSpec(r.phase, r.deliverableTypeKey)!.format },
    ...(r.companion ? [r.companion] : [])];
  for (const original of originals) {
    const rows = await run('SELECT artifact_id FROM move_artifacts WHERE artifact_id = $1 AND move_id = $2 AND tenant_key = $3 '
      + "AND phase = $4 AND file_format = $5 AND version = $6 AND blob_sha256 = $7 AND lifecycle_state = 'current' "
      + "AND metadata->>'storage' = 'azure_blob' AND metadata->>'authoredRequestId' = $8 "
      + "AND metadata->>'canonicalDeliverableKey' = $9 AND metadata->>'authoredOrigin' = 'abarva_uploaded' "
      + "AND metadata->>'authoredFileRole' = $10 AND metadata->>'authoredUploadedBy' = $11 "
      + "AND metadata->>'authoredTextSha256' = $12 FOR UPDATE",
      [original.artifactId, r.moveId, r.storageTenantKey, r.phase, original.fileFormat, original.artifactVersion,
        original.sha256, r.requestId, r.deliverableTypeKey, original.fileRole, r.uploadedBy, original.textSha256]);
    if (rows.length !== 1) throw new Error('authored_package_original_changed');
  }
}

export function createAzureProgramsWriteAdapter(
  session: TxSessionRunner = createTxSession('abarva-data-plane-programs-write'),
): ProgramsWriteAdapter {
  return {
    name: 'azure-postgres',

    async runInitialAuthoredDeliverable(input) {
      try {
        const data = await session(async (run): Promise<InitialAuthoredDeliverableResult> => {
          const r = input.receipt;
          if (r.moveId !== input.programId || !authoredDocumentSpec(r.phase, r.deliverableTypeKey) || r.origin !== 'abarva_uploaded' ||
              (r.phase === 2 && !readAuthoredUploadReceipt(r)) || !input.content.trim())
            throw new Error('authored_receipt_invalid');
          // Serialize this admission operation. Original storage is completed
          // before entering this transaction, avoiding a nested pool write.
          await run('SELECT pg_advisory_xact_lock(64833, hashtext($1))',
            [`${canonicalTenantKey(r.tenantKey)}:${input.programId}:${r.deliverableTypeKey}`]);
          const programs = await run('SELECT id FROM engagements WHERE id = $1 AND client_id::text = $2'
            + (r.phase === 2 ? ' AND current_phase = 2 FOR UPDATE' : ''),
            [input.programId, input.clientId]);
          if (programs.length !== 1) throw new Error('authored_move_scope_unavailable');
          const existing = await run<{ id: string; current_version: number }>(
            'SELECT id, current_version FROM deliverables_v2 WHERE engagement_id = $1 AND deliverable_type_key = $2 FOR UPDATE',
            [input.programId, r.deliverableTypeKey]);
          if (existing.length) {
            if (existing.length !== 1) return { kind: 'conflict' };
            await lockP2AuthoredOriginals(run, r);
            const replay = await run<{ id: string; version: number; structured_data: { authoredUpload: AuthoredUploadReceipt } }>(
              'SELECT id, version, structured_data FROM deliverable_versions WHERE deliverable_id = $1 '
              + "AND origin = 'abarva_uploaded' AND structured_data->'authoredUpload' @> $2::jsonb",
              [existing[0].id, JSON.stringify({ source: r.source, origin: r.origin, tenantKey: r.tenantKey,
                moveId: r.moveId, phase: r.phase, deliverableTypeKey: r.deliverableTypeKey, requestId: r.requestId,
                sha256: r.sha256, uploadedBy: r.uploadedBy, authoringBasis: r.authoringBasis,
                ...(r.phase === 2 ? { fileRole: r.fileRole, fileFormat: r.fileFormat, textSha256: r.textSha256,
                  ...(r.companion ? { companion: r.companion } : {}) } : {}) })]);
            if (replay.length !== 1) return { kind: 'conflict' };
            return { kind: 'replay', deliverableId: existing[0].id, versionId: replay[0].id,
              version: replay[0].version, currentVersion: existing[0].current_version, receipt: replay[0].structured_data.authoredUpload };
          }
          await lockP2AuthoredOriginals(run, r);
          const types = await run('SELECT type_key FROM deliverable_types WHERE type_key = $1', [r.deliverableTypeKey]);
          if (types.length > 1) throw new Error('authored_declared_type_unavailable');
          if (types.length === 0) {
            // The code registry declares these keys. Provision only that
            // missing catalog identity; never alter an existing definition.
            await run('INSERT INTO deliverable_types (type_key, title, description, applicable_phases, output_format, maturity) '
              + `VALUES ($1, $2, 'Registered authored phase document', ${r.phase === 2 ? 'ARRAY[2]' : 'ARRAY[1]'}, 'markdown', 'pilot') ON CONFLICT (type_key) DO NOTHING`,
              [r.deliverableTypeKey, input.title]);
          }
          const documents = await run<{ id: string }>('INSERT INTO deliverables_v2 '
            + '(engagement_id, deliverable_type_key, title, status, current_version, created_by, requires_revalidation) '
            + "VALUES ($1, $2, $3, 'draft', 1, $4, false) RETURNING id",
            [input.programId, r.deliverableTypeKey, input.title, r.uploadedBy]);
          const documentId = documents[0]?.id;
          if (!documentId) throw new Error('authored_document_write_failed');
          const versions = await run<{ id: string }>('INSERT INTO deliverable_versions '
            + '(deliverable_id, version, content, origin, structured_data, generated_from_context_hash) '
            + "VALUES ($1, 1, $2, 'abarva_uploaded', $3::jsonb, NULL) RETURNING id",
            [documentId, input.content, JSON.stringify({ source: r.source, authoredUpload: r })]);
          const versionId = versions[0]?.id;
          if (!versionId) throw new Error('authored_version_write_failed');
          await run('INSERT INTO deliverable_lifecycle_events '
            + '(deliverable_id, version, event_type, origin, source_file_checksum, approval_scope) '
            + "VALUES ($1, 1, 'version_created', 'abarva_uploaded', $2, 'Unsigned authored file uploaded')",
            [documentId, r.sha256]);
          return { kind: 'created', deliverableId: documentId, versionId, version: 1, currentVersion: 1, receipt: r };
        });
        return { ok: true, data };
      } catch { return { ok: false, error: 'authored_admission_transaction_failed' }; }
    },

    async runAuthoredApproval(input) {
      try {
        const data = await session(async (run) => {
          const r = input.receipt;
          if (r.moveId !== input.programId || r.origin !== 'abarva_uploaded' || !authoredDocumentSpec(r.phase, r.deliverableTypeKey) ||
              (r.phase === 2 && !readAuthoredUploadReceipt(r)) ||
              !r.evidenceSnapshotHash || !r.phaseEvidenceSnapshotHash ||
              canonicalTenantKey(r.storageTenantKey) !== r.tenantKey)
            throw new Error('authored_approval_scope_invalid');
          const rows = await run<{ id: string }>('SELECT d.id FROM deliverables_v2 d JOIN engagements e ON e.id = d.engagement_id '
            + 'JOIN deliverable_versions v ON v.deliverable_id = d.id AND v.version = d.current_version '
            + 'JOIN move_artifacts a ON a.artifact_id = $9 AND a.move_id = e.id AND a.tenant_key = $10 '
            + 'WHERE d.id = $1 AND e.id = $2 AND e.client_id::text = $3 AND d.current_version = $4 '
            + "AND d.status IN ('draft','in_review') AND d.signed_off_version IS NULL AND v.id = $5 "
            + "AND v.content = $6 AND v.origin = 'abarva_uploaded' AND v.structured_data->'authoredUpload' = $7::jsonb "
            + `AND d.deliverable_type_key = $8 AND a.phase = ${r.phase === 2 ? '2' : '1'} AND a.version = $11 AND a.blob_sha256 = $12 `
            + "AND a.metadata->>'storage' = 'azure_blob' AND a.metadata->>'authoredRequestId' = $13 AND a.metadata->>'canonicalDeliverableKey' = $8 "
            + "AND a.metadata->>'authoredOrigin' = 'abarva_uploaded'"
            + (r.phase === 2 ? " AND v.structured_data->>'source' = $14" : '')
            + (r.phase === 2 ? ' AND e.current_phase = 2 FOR UPDATE OF e, d, v, a' : ' FOR UPDATE OF d, v, a'),
            [input.deliverableId, input.programId, input.clientId, input.version, input.versionId,
              input.content, JSON.stringify(r), r.deliverableTypeKey, r.artifactId, r.storageTenantKey,
              r.artifactVersion, r.sha256, r.requestId, ...(r.phase === 2 ? [r.source] : [])]);
          if (rows.length !== 1) return { applied: false };
          await lockP2AuthoredOriginals(run, r);
          await run('UPDATE deliverables_v2 SET status = $1, signed_off_by = $2, signed_off_at = now(), '
            + 'signed_off_version = $3, approved_artifact_id = $4, authoritative_lifecycle_state = $5, '
            + 'authoritative_flag_source = $6, requires_revalidation = false, updated_at = now(), '
            + "structured_data = COALESCE(structured_data, '{}'::jsonb) || $7::jsonb WHERE id = $8",
            ['signed_off', input.userId, input.version, r.artifactId, 'human_approved', 'normal_flow',
              JSON.stringify({ source: r.source, authoredUpload: r, evidenceSnapshotHash: r.evidenceSnapshotHash,
                phaseEvidenceSnapshotHash: r.phaseEvidenceSnapshotHash, evidenceSnapshotScope: 'phase', generatedAt: r.observedAt,
                approvalMode: 'approve_authored_upload_as_is', approvalAttribution: 'workspace_actor', approvalRationale: input.approvalRationale }),
              input.deliverableId]);
          await run("UPDATE move_artifacts SET status = 'approved', updated_at = now() WHERE artifact_id = $1", [r.artifactId]);
          if (r.companion) await run("UPDATE move_artifacts SET status = 'approved', updated_at = now() WHERE artifact_id = $1", [r.companion.artifactId]);
          await run('INSERT INTO deliverable_lifecycle_events '
            + '(deliverable_id, version, event_type, origin, reviewer_name, reviewer_role_code, reviewer_role_label, approval_scope, source_file_checksum, decision) '
            + "VALUES ($1, $2, 'approval_granted', 'abarva_uploaded', $3, $4, CASE WHEN $4 = 'other' THEN 'Workspace actor' ELSE NULL END, $5, $6, 'approved')",
            [input.deliverableId, input.version, input.userId, input.reviewerRole,
              input.approvalRationale || 'Exact uploaded authored version approved by the workspace actor', r.sha256]);
          return { applied: true };
        });
        return { ok: true, data };
      } catch { return { ok: false, error: 'authored_approval_transaction_failed' }; }
    },

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
                + "SET current_version = $1, status = 'draft', "
                + 'requires_revalidation = false, updated_at = now() '
                + 'WHERE id = $2',
              [nextVersion, deliverableId],
            );
          } else {
            const createdRows = await run<{ id: string }>(
              'INSERT INTO deliverables_v2 '
                + '(engagement_id, deliverable_type_key, title, status, '
                + 'current_version, created_by, requires_revalidation) '
                + "VALUES ($1, $2, $3, 'draft', 1, 'nexus', false) RETURNING id",
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
 * plane. Defaults to Supabase for legacy tenants. Governed foundation tenants
 * are Azure/Postgres-only and fail closed on explicit Supabase.
 */
export function selectProgramsWriteAdapter(
  plane?: DataPlane,
  tenantKey?: string,
): ProgramsWriteAdapter {
  const target = resolveDataPlaneForTenant(tenantKey, plane);
  return target === 'azure-postgres'
    ? createAzureProgramsWriteAdapter()
    : createSupabaseProgramsWriteAdapter();
}
