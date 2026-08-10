// Source / artifact domain write adapter (Slice 3b).
//
// Backs the DB-write half of the source / artifact write routes:
//   - POST   /api/v1/source/events                     (participant insert)
//   - POST   /api/v1/source/events/:id/approve          (event update + approval insert)
//   - PATCH  /api/v1/source/:id/stage                   (event update)
//   - PATCH  /api/v1/source/:id/gate-criteria/:cid/state(criterion update)
//   - POST   .../artifacts/:code/generate-from-claude   (artifact body update)
//   - PATCH  .../artifacts/:code/status                 (artifact status update)
//   - POST   /api/v1/source/:id/nexus/ask               (attachment link update)
//
// Each route keeps its auth, RBAC, validation, Claude/LLM and blob work; the
// adapter owns ONLY the physical insert/update. Supabase stays the default
// (`ABARVA_DATA_PLANE` unset / `supabase`); `azure-postgres` is opt-in for the
// pre-flip rehearsal and post-flip canonical path — never an implicit default,
// never dual-written (design doc §2, cutover-flip).
//
// The Azure path runs each write inside a real `BEGIN`/`COMMIT` transaction so
// a multi-statement unit (event update + approval insert) is genuinely atomic;
// the Supabase JS client has no client-side transaction, so its statements are
// applied individually — the pre-seam behavior, unchanged.
//
// The shared helpers `createSourcingEvent` (src/lib/source/queries.ts) and
// `registerSourceArtifactUpload` (src/lib/source/artifact-registry) are NOT
// migrated here: both are also called from outside Slice 3b
// (commitSourceEvent tool, artifacts/upload route). Migrating them is a
// follow-up so a shared-helper change does not collide with parallel slices.

import {
  getAzureWriteFluentClient,
  type PostgresCompatClient as SupabaseClient,
} from "@/lib/data-plane/postgresCompat";
import {
  createTxSession,
  type TxSessionRunner,
} from "../read-adapters/azureSession";
import { resolveDataPlaneForTenant } from "../read-adapters/resolveDataPlane";
import type { DataPlane } from "./types";

// --- write inputs ----------------------------------------------------------

/** Insert a participant row when a Source event is created via the API path. */
export interface SourceParticipantInsert {
  readonly clientKey: string;
  readonly sourceEventId: string;
  readonly userId: string;
}

/** Approve / reject a Source event: lifecycle update + append-only approval. */
export interface SourceApprovalWrite {
  readonly eventId: string;
  readonly clientKey: string;
  readonly fromState: string;
  readonly toState: string;
  readonly approvalAction: "admin_review" | "rejected" | "sent_back";
  readonly approvedByUserId: string;
  readonly notes: string | null;
  /** The canonical stage key this approval was for, or null if unknown. */
  readonly stageKey?: string | null;
}

/** Append a gate-criterion approval/waiver record and return its id. */
export interface SourceCriterionApprovalWrite {
  readonly eventId: string;
  readonly fromState: string;
  readonly toState: string;
  readonly approvalAction: "stage_advance" | "admin_review";
  readonly approvedByUserId: string;
  readonly notes: string | null;
  /** The canonical stage key this approval was for, or null if unknown. */
  readonly stageKey?: string | null;
}

/** Append a named Source event activity log row. */
export interface SourceActivityInsert {
  readonly eventId: string;
  readonly clientKey: string;
  readonly actorUserId: string | null;
  readonly actorDisplayName: string | null;
  readonly actorRole: string | null;
  readonly actionType: string;
  readonly actionLabel: string;
  readonly stageKey?: string | null;
  readonly artifactCode?: string | null;
  readonly criterionId?: string | null;
  readonly reason?: string | null;
  readonly metadata?: Readonly<Record<string, unknown>> | null;
  readonly occurredAtIso: string;
}

/** Advance a persisted Source event to a new stage. */
export interface SourceStageUpdate {
  readonly eventId: string;
  readonly clientKey: string;
  readonly stageKey: string;
  readonly lifecycleState: string;
  readonly updatedAtIso: string;
}

/** Transition only the event lifecycle_state. */
export interface SourceLifecycleTransition {
  readonly eventId: string;
  readonly clientKey: string;
  readonly lifecycleState: string;
  readonly updatedAtIso: string;
}

/** Flip a per-event gate-criterion state. */
export interface GateCriterionUpdate {
  readonly criterionRowId: string;
  readonly state: string;
  readonly reviewerUserId: string | null;
  readonly reviewedAtIso: string | null;
  readonly notes?: string | null;
  readonly evidenceArtifactIds?: readonly string[];
  readonly waiverApprovalId?: string | null;
  readonly updatedAtIso: string;
}

/** Persist a Claude-generated artifact body onto the substrate row. */
export interface ArtifactBodyUpdate {
  readonly artifactRowId: string;
  /** snake_case column body — already shaped by the route. */
  readonly columns: Readonly<Record<string, unknown>>;
}

/** Flip a per-event artifact status. */
export interface ArtifactStatusUpdate {
  readonly artifactRowId: string;
  readonly status: string;
  readonly updatedAtIso: string;
}

/** Stamp `linked_event_id` on agent-attachment rows for a Source turn. */
export interface AttachmentLinkUpdate {
  readonly attachmentIds: readonly string[];
  readonly tenantId: string;
  readonly eventId: string;
}

/** A generic write outcome — `ok:false` carries a human-readable message. */
export interface SourceWriteOutcome<T> {
  readonly ok: boolean;
  readonly data?: T;
  readonly error?: string;
}

function ok<T>(data?: T): SourceWriteOutcome<T> {
  return { ok: true, data };
}
function fail<T>(error: string): SourceWriteOutcome<T> {
  return { ok: false, error };
}

// --- adapter contract ------------------------------------------------------

/** A source/artifact write adapter for one physical data plane. */
export interface SourceWriteAdapter {
  readonly name: DataPlane;
  /** Insert the event-creator participant row. Idempotent-ish: the route
   *  already tolerates a missing table; a duplicate is harmless. */
  insertParticipant(
    input: SourceParticipantInsert,
  ): Promise<SourceWriteOutcome<void>>;
  /** Advance lifecycle_state and append the approval record. Both writes are
   *  required: a stage gate is not approved unless the append-only approval
   *  evidence row is persisted. */
  applyApproval(input: SourceApprovalWrite): Promise<SourceWriteOutcome<void>>;
  /** Append an approval record for a criterion-level mark-met/waive decision. */
  insertCriterionApproval(
    input: SourceCriterionApprovalWrite,
  ): Promise<SourceWriteOutcome<{ id: string }>>;
  /** Update the persisted event's stage + lifecycle. */
  updateStage(input: SourceStageUpdate): Promise<SourceWriteOutcome<void>>;
  /** Update only the persisted event lifecycle. */
  transitionLifecycle(
    input: SourceLifecycleTransition,
  ): Promise<SourceWriteOutcome<void>>;
  /** Update a gate-criterion row; returns the updated row. */
  updateGateCriterion(
    input: GateCriterionUpdate,
  ): Promise<SourceWriteOutcome<Record<string, unknown>>>;
  /** Persist a generated artifact body; returns the updated row. */
  updateArtifactBody(
    input: ArtifactBodyUpdate,
  ): Promise<SourceWriteOutcome<Record<string, unknown>>>;
  /** Flip an artifact status; returns the updated row. */
  updateArtifactStatus(
    input: ArtifactStatusUpdate,
  ): Promise<SourceWriteOutcome<Record<string, unknown>>>;
  /** Link agent-attachment rows to a Source event (best-effort, never throws). */
  linkAttachments(
    input: AttachmentLinkUpdate,
  ): Promise<SourceWriteOutcome<void>>;
  /** Append an audit log row. Best-effort; callers should not roll back core writes. */
  insertActivityLog(
    input: SourceActivityInsert,
  ): Promise<SourceWriteOutcome<void>>;
}

// --- Supabase adapter (DEFAULT) --------------------------------------------

export type SupabaseFactory = () => SupabaseClient;

/**
 * Build the Supabase source write adapter. Every statement is the verbatim
 * pre-seam `.insert()` / `.update()` call — the produced rows are
 * byte-faithful to the routes' prior behavior. The Supabase client factory is
 * injectable so tests drive it without a live backend.
 */
export function createSupabaseSourceWriteAdapter(
  getClient: SupabaseFactory = getAzureWriteFluentClient,
): SourceWriteAdapter {
  return {
    name: "supabase",

    async insertParticipant(input) {
      const { error } = await getClient()
        .from("source_event_participants")
        .insert({
          client_key: input.clientKey,
          source_event_id: input.sourceEventId,
          source_event_row_id: input.sourceEventId,
          user_id: input.userId,
          role: "source creator",
          approval_authority: "contributor",
          source_access_level: "source_member",
          can_view_financial: false,
          can_upload_source_artifacts: true,
          can_generate_sourcing_artifacts: true,
          can_publish_sourcing_artifacts: false,
          can_approve_source_stages: false,
          can_approve_award: false,
          notify_on: ["source_event_update", "approval_needed"],
        });
      // The route only treats a missing-table error as benign.
      if (
        error &&
        !/source_event_participants|schema cache|does not exist/i.test(
          error.message,
        )
      ) {
        return fail(`source participant assignment failed: ${error.message}`);
      }
      return ok();
    },

    async applyApproval(input) {
      const sb = getClient();
      const { error: updateError } = await sb
        .from("source_events")
        .update({ lifecycle_state: input.toState })
        .eq("id", input.eventId)
        .eq("client_key", input.clientKey);
      if (updateError) return fail(updateError.message);

      const { error: approvalError } = await sb
        .from("source_event_approvals")
        .insert({
          event_id: input.eventId,
          action: input.approvalAction,
          approved_by_user_id: input.approvedByUserId,
          from_state: input.fromState,
          to_state: input.toState,
          notes: input.notes,
          stage_key: input.stageKey ?? null,
        });
      if (approvalError) {
        return fail(`approval record insert failed: ${approvalError.message}`);
      }
      return ok();
    },

    async insertCriterionApproval(input) {
      const { data, error } = await getClient()
        .from("source_event_approvals")
        .insert({
          event_id: input.eventId,
          action: input.approvalAction,
          approved_by_user_id: input.approvedByUserId,
          from_state: input.fromState,
          to_state: input.toState,
          notes: input.notes,
          stage_key: input.stageKey ?? null,
        })
        .select("id")
        .single();
      if (error) return fail(error.message);
      const id = (data as { id?: unknown } | null)?.id;
      if (typeof id !== "string" || id.length === 0) {
        return fail("approval record insert did not return an id");
      }
      return ok({ id });
    },

    async updateStage(input) {
      const { error } = await getClient()
        .from("source_events")
        .update({
          current_stage_key: input.stageKey,
          lifecycle_state: input.lifecycleState,
          updated_at: input.updatedAtIso,
        })
        .eq("id", input.eventId)
        .eq("client_key", input.clientKey);
      if (error) return fail(error.message);
      return ok();
    },

    async transitionLifecycle(input) {
      const { error } = await getClient()
        .from("source_events")
        .update({
          lifecycle_state: input.lifecycleState,
          updated_at: input.updatedAtIso,
        })
        .eq("id", input.eventId)
        .eq("client_key", input.clientKey);
      if (error) return fail(error.message);
      return ok();
    },

    async updateGateCriterion(input) {
      const updates: Record<string, unknown> = {
        state: input.state,
        reviewer_user_id: input.reviewerUserId,
        reviewed_at: input.reviewedAtIso,
        updated_at: input.updatedAtIso,
      };
      if ("notes" in input) updates.notes = input.notes ?? null;
      if (input.evidenceArtifactIds) {
        updates.evidence_artifact_ids = [...input.evidenceArtifactIds];
      }
      if ("waiverApprovalId" in input) {
        updates.waiver_approval_id = input.waiverApprovalId ?? null;
      }
      const { data, error } = await getClient()
        .from("source_event_gate_criterion_states")
        .update(updates)
        .eq("id", input.criterionRowId)
        .select("*")
        .single();
      if (error) return fail(error.message);
      return ok(data as Record<string, unknown>);
    },

    async updateArtifactBody(input) {
      const { data, error } = await getClient()
        .from("source_event_artifact_states")
        .update({ ...input.columns })
        .eq("id", input.artifactRowId)
        .select("*")
        .single();
      if (error) return fail(error.message);
      return ok(data as Record<string, unknown>);
    },

    async updateArtifactStatus(input) {
      const { data, error } = await getClient()
        .from("source_event_artifact_states")
        .update({ status: input.status, updated_at: input.updatedAtIso })
        .eq("id", input.artifactRowId)
        .select("*")
        .single();
      if (error) return fail(error.message);
      return ok(data as Record<string, unknown>);
    },

    async linkAttachments(input) {
      if (input.attachmentIds.length === 0) return ok();
      try {
        await getClient()
          .from("agent_attachment")
          .update({ linked_event_id: input.eventId })
          .in("id", [...input.attachmentIds])
          .eq("tenant_id", input.tenantId)
          .is("linked_event_id", null);
        return ok();
      } catch (err) {
        // Best-effort — never block the agent turn on attachment metadata.
        return fail(
          err instanceof Error ? err.message : "attachment link failed",
        );
      }
    },

    async insertActivityLog(input) {
      const { error } = await getClient()
        .from("source_event_activity")
        .insert({
          event_id: input.eventId,
          client_key: input.clientKey,
          actor_user_id: input.actorUserId,
          actor_display_name: input.actorDisplayName,
          actor_role: input.actorRole,
          action_type: input.actionType,
          action_label: input.actionLabel,
          stage_key: input.stageKey ?? null,
          artifact_code: input.artifactCode ?? null,
          criterion_id: input.criterionId ?? null,
          reason: input.reason ?? null,
          metadata: input.metadata ?? {},
          occurred_at: input.occurredAtIso,
        });
      if (error) return fail(error.message);
      return ok();
    },
  };
}

// --- Azure Postgres adapter (opt-in) ---------------------------------------

/** SQLSTATE for a unique-violation. */
const UNIQUE_VIOLATION = "23505";

function pgCode(err: unknown): string | undefined {
  return (err as { code?: string } | null)?.code;
}
function isUniqueViolation(err: unknown): boolean {
  if (pgCode(err) === UNIQUE_VIOLATION) return true;
  const msg = err instanceof Error ? err.message : String(err ?? "");
  return /duplicate key value|already exists/i.test(msg);
}
function errMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err ?? "unknown");
}

const SOURCE_ARTIFACT_BODY_JSONB_COLUMNS = new Set([
  "body_generation_metadata",
]);

function sourceArtifactBodyAssignment(column: string, index: number): string {
  const placeholder = `$${index}`;
  return SOURCE_ARTIFACT_BODY_JSONB_COLUMNS.has(column)
    ? `${column} = ${placeholder}::jsonb`
    : `${column} = ${placeholder}`;
}

function sourceArtifactBodyValue(column: string, value: unknown): unknown {
  return SOURCE_ARTIFACT_BODY_JSONB_COLUMNS.has(column) && value !== null
    ? JSON.stringify(value ?? {})
    : value;
}

/**
 * Build the Azure Postgres source write adapter. Mirrors the Supabase row
 * semantics statement-for-statement; the `applyApproval` write runs both
 * statements in one transaction so the lifecycle update + approval insert are
 * atomic on Azure (Supabase cannot do this and is left as-is). The
 * transaction session is injectable so tests drive it without a live Azure
 * Postgres.
 */
export function createAzureSourceWriteAdapter(
  session: TxSessionRunner = createTxSession("abarva-data-plane-source-write"),
): SourceWriteAdapter {
  return {
    name: "azure-postgres",

    async insertParticipant(input) {
      try {
        await session((run) =>
          run(
            `INSERT INTO source_event_participants
               (client_key, source_event_id, source_event_row_id, user_id, role,
                approval_authority, source_access_level, can_view_financial,
                can_upload_source_artifacts, can_generate_sourcing_artifacts,
                can_publish_sourcing_artifacts, can_approve_source_stages,
                can_approve_award, notify_on)
             VALUES ($1,$2::text,$2::uuid,$3,'source creator','contributor','source_member',
                     false,true,true,false,false,false,$4)`,
            [
              input.clientKey,
              input.sourceEventId,
              input.userId,
              ["source_event_update", "approval_needed"],
            ],
          ),
        );
        return ok();
      } catch (err) {
        if (isUniqueViolation(err)) return ok();
        const msg = errMessage(err);
        if (/source_event_participants|does not exist/i.test(msg)) return ok();
        return fail(`source participant assignment failed: ${msg}`);
      }
    },

    async applyApproval(input) {
      try {
        await session(async (run) => {
          await run(
            `UPDATE source_events SET lifecycle_state = $1
             WHERE id = $2 AND client_key = $3`,
            [input.toState, input.eventId, input.clientKey],
          );
          await run(
            `INSERT INTO source_event_approvals
               (event_id, action, approved_by_user_id, from_state, to_state, notes, stage_key)
             VALUES ($1,$2,$3,$4,$5,$6,$7)`,
            [
              input.eventId,
              input.approvalAction,
              input.approvedByUserId,
              input.fromState,
              input.toState,
              input.notes,
              input.stageKey ?? null,
            ],
          );
        });
        return ok();
      } catch (err) {
        return fail(errMessage(err));
      }
    },

    async insertCriterionApproval(input) {
      try {
        const rows = await session((run) =>
          run<{ id: string }>(
            `INSERT INTO source_event_approvals
               (event_id, action, approved_by_user_id, from_state, to_state, notes, stage_key)
             VALUES ($1,$2,$3,$4,$5,$6,$7)
             RETURNING id`,
            [
              input.eventId,
              input.approvalAction,
              input.approvedByUserId,
              input.fromState,
              input.toState,
              input.notes,
              input.stageKey ?? null,
            ],
          ),
        );
        if (!rows[0]?.id)
          return fail("approval record insert did not return an id");
        return ok({ id: rows[0].id });
      } catch (err) {
        return fail(errMessage(err));
      }
    },

    async updateStage(input) {
      try {
        await session((run) =>
          run(
            `UPDATE source_events
               SET current_stage_key = $1, lifecycle_state = $2, updated_at = $3
             WHERE id = $4 AND client_key = $5`,
            [
              input.stageKey,
              input.lifecycleState,
              input.updatedAtIso,
              input.eventId,
              input.clientKey,
            ],
          ),
        );
        return ok();
      } catch (err) {
        return fail(errMessage(err));
      }
    },

    async transitionLifecycle(input) {
      try {
        await session((run) =>
          run(
            `UPDATE source_events
               SET lifecycle_state = $1, updated_at = $2
             WHERE id = $3 AND client_key = $4`,
            [
              input.lifecycleState,
              input.updatedAtIso,
              input.eventId,
              input.clientKey,
            ],
          ),
        );
        return ok();
      } catch (err) {
        return fail(errMessage(err));
      }
    },

    async updateGateCriterion(input) {
      try {
        const assignments = [
          "state = $1",
          "reviewer_user_id = $2",
          "reviewed_at = $3",
          "updated_at = $4",
        ];
        const values: unknown[] = [
          input.state,
          input.reviewerUserId,
          input.reviewedAtIso,
          input.updatedAtIso,
        ];
        if ("notes" in input) {
          values.push(input.notes ?? null);
          assignments.push(`notes = $${values.length}`);
        }
        if (input.evidenceArtifactIds) {
          values.push(JSON.stringify([...input.evidenceArtifactIds]));
          assignments.push(`evidence_artifact_ids = $${values.length}::jsonb`);
        }
        if ("waiverApprovalId" in input) {
          values.push(input.waiverApprovalId ?? null);
          assignments.push(`waiver_approval_id = $${values.length}`);
        }
        values.push(input.criterionRowId);
        const rows = await session((run) =>
          run<Record<string, unknown>>(
            `UPDATE source_event_gate_criterion_states
               SET ${assignments.join(", ")}
             WHERE id = $${values.length}
             RETURNING *`,
            values,
          ),
        );
        if (!rows[0]) return fail("gate criterion row not found after update");
        return ok(rows[0]);
      } catch (err) {
        return fail(errMessage(err));
      }
    },

    async updateArtifactBody(input) {
      try {
        const keys = Object.keys(input.columns);
        const assignments = keys
          .map((k, i) => sourceArtifactBodyAssignment(k, i + 1))
          .join(", ");
        const values = keys.map((k) =>
          sourceArtifactBodyValue(k, input.columns[k]),
        );
        const rows = await session((run) =>
          run<Record<string, unknown>>(
            `UPDATE source_event_artifact_states
               SET ${assignments}
             WHERE id = $${keys.length + 1}
             RETURNING *`,
            [...values, input.artifactRowId],
          ),
        );
        if (!rows[0]) return fail("artifact row not found after update");
        return ok(rows[0]);
      } catch (err) {
        return fail(errMessage(err));
      }
    },

    async updateArtifactStatus(input) {
      try {
        const rows = await session((run) =>
          run<Record<string, unknown>>(
            `UPDATE source_event_artifact_states
               SET status = $1, updated_at = $2
             WHERE id = $3
             RETURNING *`,
            [input.status, input.updatedAtIso, input.artifactRowId],
          ),
        );
        if (!rows[0]) return fail("artifact row not found after update");
        return ok(rows[0]);
      } catch (err) {
        return fail(errMessage(err));
      }
    },

    async linkAttachments(input) {
      if (input.attachmentIds.length === 0) return ok();
      try {
        await session((run) =>
          run(
            `UPDATE agent_attachment SET linked_event_id = $1
             WHERE id = ANY($2::text[]) AND tenant_id = $3 AND linked_event_id IS NULL`,
            [input.eventId, [...input.attachmentIds], input.tenantId],
          ),
        );
        return ok();
      } catch (err) {
        return fail(errMessage(err));
      }
    },

    async insertActivityLog(input) {
      try {
        await session((run) =>
          run(
            `INSERT INTO source_event_activity
               (event_id, client_key, actor_user_id, actor_display_name, actor_role,
                action_type, action_label, stage_key, artifact_code, criterion_id,
                reason, metadata, occurred_at)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12::jsonb,$13)`,
            [
              input.eventId,
              input.clientKey,
              input.actorUserId,
              input.actorDisplayName,
              input.actorRole,
              input.actionType,
              input.actionLabel,
              input.stageKey ?? null,
              input.artifactCode ?? null,
              input.criterionId ?? null,
              input.reason ?? null,
              JSON.stringify(input.metadata ?? {}),
              input.occurredAtIso,
            ],
          ),
        );
        return ok();
      } catch (err) {
        return fail(errMessage(err));
      }
    },
  };
}

// --- selection -------------------------------------------------------------

/** Default singletons. */
export const supabaseSourceWriteAdapter: SourceWriteAdapter =
  createSupabaseSourceWriteAdapter();
export const azureSourceWriteAdapter: SourceWriteAdapter =
  createAzureSourceWriteAdapter();

/**
 * Select the source/artifact write adapter for the configured data plane.
 * Defaults to Supabase for legacy tenants. Governed foundation tenants are
 * Azure/Postgres-only and fail closed on an explicit Supabase selection.
 */
export function selectSourceWriteAdapter(
  plane?: DataPlane,
  tenantKey?: string,
): SourceWriteAdapter {
  const target = resolveDataPlaneForTenant(tenantKey, plane);
  return target === "azure-postgres"
    ? azureSourceWriteAdapter
    : supabaseSourceWriteAdapter;
}
