import "server-only";
import { createHash } from "node:crypto";
import {
  resolveDatabaseUrlCandidates,
  withAzureWriteTransaction,
} from "@/lib/data-plane/postgresCompat";
import {
  resolveTenantDatabaseConnection,
  tenantConnectionScopeFromEnv,
  tenantDatabaseEnvNamesForScope,
} from "@/lib/data-plane/tenantConnectionResolver";
import { canonicalTenantKey } from "@/lib/tenant-keys";
import { isDeclaredSyntheticDemoTenant } from "@/lib/tenant/synthetic-tenant-declaration";
import { isFeatureEnabled } from "@/lib/features/is-feature-enabled";
import { computeCaptureRevision } from "@/lib/programs/phase-capture-integrity";
import {
  P0CaptureCorrectionRefusal,
  p0CaptureValues,
  p0CorrectionRecordRevision,
  p0SignatureRevision,
  previewP0ReviewedCaptureCorrection,
  type P0CorrectionModule,
} from "@/lib/programs/p0-reviewed-capture-correction";
import type { PhaseSnapshot, TenancyCtx } from "@/lib/programs/types.db";
import { loadUserProgramAccessPolicy } from "@/lib/auth/program-access-policy";

export interface P0CorrectionCommand {
  expectedRevision: string;
  sourceRevision: string;
  snapshotId: string;
  snapshotRevision: string;
  signatureRevision: string;
  rationale: string;
}

function refuse(code: string, detail: string, status = 409): never {
  throw new P0CaptureCorrectionRefusal(code, detail, status);
}
const sha = (value: string) => createHash("sha256").update(value).digest("hex");

/** Private planes require their scoped URL; declared demo data uses its existing transport. */
export function resolveP0ReviewedCaptureConnection(
  ctx: TenancyCtx,
  env: NodeJS.ProcessEnv = process.env,
): string | undefined {
  const key = canonicalTenantKey(ctx.clientKey ?? "");
  const scoped =
    resolveTenantDatabaseConnection({ ...ctx, clientKey: key }, env, {
      allowSharedFallback: false,
    }).candidates[0] ??
    (key !== ctx.clientKey
      ? resolveTenantDatabaseConnection(ctx, env, {
          allowSharedFallback: false,
        }).candidates[0]
      : undefined);
  if (scoped) return scoped;
  if (
    !isDeclaredSyntheticDemoTenant(key) ||
    tenantDatabaseEnvNamesForScope(tenantConnectionScopeFromEnv(env)).length > 0
  )
    return undefined;
  return resolveDatabaseUrlCandidates(env)[0];
}

/** Normal capture command: one scoped transaction restores retained source and audit. */
export async function restoreP0ReviewedCapture(
  ctx: TenancyCtx,
  moveId: string,
  command: P0CorrectionCommand,
) {
  if (
    !ctx.clientId ||
    !ctx.userId ||
    !ctx.clientKey ||
    !isFeatureEnabled(ctx, "moves_extended_intake_fields_v1") ||
    !isFeatureEnabled(ctx, "moves_step_pages_p0p1_v1") ||
    !isFeatureEnabled(ctx, "moves_step_pages_v3")
  )
    refuse(
      "correction_not_available",
      "This captured-input correction is not available.",
      404,
    );
  if (
    typeof command.expectedRevision !== "string" ||
    !command.expectedRevision ||
    typeof command.snapshotId !== "string" ||
    !command.snapshotId ||
    ![
      command.sourceRevision,
      command.snapshotRevision,
      command.signatureRevision,
    ].every(
      (value) => typeof value === "string" && /^[a-f0-9]{64}$/.test(value),
    ) ||
    typeof command.rationale !== "string" ||
    !command.rationale.trim() ||
    command.rationale.length > 2000
  )
    refuse(
      "correction_binding_required",
      "Review the retained source and record a correction rationale before continuing.",
      400,
    );
  const connection = resolveP0ReviewedCaptureConnection(ctx);
  if (!connection)
    refuse(
      "correction_unavailable",
      "The captured-input correction data plane is unavailable.",
      503,
    );

  return withAzureWriteTransaction(
    connection,
    async (query) => {
      const { rows: programs } = await query(
        "SELECT * FROM engagements WHERE id = $1 AND client_id = $2 FOR UPDATE",
        [moveId, ctx.clientId],
      );
      const program = programs[0];
      if (
        !program ||
        program.id !== moveId ||
        program.client_id !== ctx.clientId
      )
        refuse(
          "correction_move_unavailable",
          "This Move could not be read for the captured-input correction.",
          404,
        );
      if (
        program.current_phase !== 1 ||
        program.archived_at ||
        program.deleted_at
      )
        refuse(
          "correction_phase_refused",
          "This correction is available only before the P1 gate advances.",
        );
      const policy = await loadUserProgramAccessPolicy(ctx);
      if (
        !policy.canApproveGates ||
        policy.clientId !== ctx.clientId ||
        policy.userId !== ctx.userId ||
        (policy.programIdsAllowed !== null &&
          !policy.programIdsAllowed.includes(moveId))
      )
        refuse(
          "correction_permission_refused",
          "Current permission to correct this Move could not be verified.",
          403,
        );
      const programRevision = p0CorrectionRecordRevision(program);
      const { rows: snapshotRows } = await query(
        "SELECT * FROM phase_snapshots WHERE engagement_id = $1 AND phase_number = 0 ORDER BY created_at DESC LIMIT 1 FOR UPDATE",
        [moveId],
      );
      const rawSnapshot = snapshotRows[0];
      if (
        !rawSnapshot ||
        rawSnapshot.engagement_id !== moveId ||
        rawSnapshot.phase_number !== 0 ||
        rawSnapshot.approval_status !== "approved" ||
        rawSnapshot.locked_by_user_id !== ctx.userId
      )
        refuse(
          "correction_actor_refused",
          "Only the recorded P0 approver can restore this captured input.",
          403,
        );
      const snapshot: PhaseSnapshot = {
        id: rawSnapshot.id,
        engagementId: rawSnapshot.engagement_id,
        phaseNumber: rawSnapshot.phase_number,
        phaseName: rawSnapshot.phase_name ?? null,
        snapshot: rawSnapshot.snapshot_jsonb ?? {},
        lockedByUserId: rawSnapshot.locked_by_user_id,
        lockedAt: rawSnapshot.locked_at ?? null,
        approvalStatus: rawSnapshot.approval_status,
        createdAt: rawSnapshot.created_at,
      };
      const signedRows = await query(
        "SELECT * FROM deliverables_v2 WHERE engagement_id = $1 AND deliverable_type_key = ANY($2::text[]) ORDER BY updated_at DESC FOR UPDATE",
        [moveId, ["origination_brief", "program_seed_brief", "program_seed"]],
      );
      if (signedRows.rows.length !== 1)
        refuse(
          "correction_signature_unavailable",
          "The signed origination version binding is unavailable.",
        );
      const signed = signedRows.rows[0];
      const { rows: requestRows } = await query(
        "SELECT * FROM program_approval_requests WHERE program_id = $1 ORDER BY created_at DESC FOR UPDATE",
        [moveId],
      );
      const requestsRevision = p0CorrectionRecordRevision(requestRows);
      const { rows: rawModules } = await query(
        "SELECT * FROM program_modules WHERE engagement_id = $1 ORDER BY phase_number, module_order ASC NULLS LAST FOR UPDATE",
        [moveId],
      );
      if (rawModules.some((row) => row.engagement_id !== moveId))
        refuse(
          "correction_module_scope_refused",
          "Captured input returned an invalid Move binding.",
        );
      const modules: P0CorrectionModule[] = rawModules
        .filter((row) => row.phase_number === 0)
        .map((row) => ({
          id: row.id,
          moduleKey: row.module_key,
          status: row.status,
          state: row.state_jsonb ?? null,
        }));
      const preview = previewP0ReviewedCaptureCorrection({
        program: {
          id: program.id,
          currentPhase: program.current_phase,
          charter: program.charter,
        },
        actorId: ctx.userId,
        modules,
        snapshots: [snapshot],
        signedBrief: signed,
      });
      if (preview.state !== "available")
        refuse(
          "correction_source_unavailable",
          preview.reason ??
            "There is no verified retained-input correction to apply.",
        );
      if (
        preview.captureRevision !== command.expectedRevision ||
        preview.sourceRevision !== command.sourceRevision ||
        preview.snapshotId !== command.snapshotId ||
        preview.snapshotRevision !== command.snapshotRevision ||
        preview.signatureRevision !== command.signatureRevision
      )
        refuse(
          "correction_stale_binding",
          "The captured input or approval binding changed. Reload the correction preview.",
        );

      const correctedAt = new Date().toISOString();
      const readback = modules.map((row) => ({ ...row }));
      for (const field of preview.fields) {
        const before = modules.find((row) => row.id === field.moduleId)!;
        const state = {
          ...before.state,
          value: field.retained,
          updated_at: correctedAt,
          reviewed_input_correction: {
            source: "retained_capture_mirror",
            actorId: ctx.userId,
            phaseSnapshotId: snapshot.id,
            correctedAt,
            priorValueSha256: sha(field.current),
            restoredValueSha256: sha(field.retained),
            sourceRevision: preview.sourceRevision,
          },
        };
        const updated = await query(
          "UPDATE program_modules SET state_jsonb = $1::jsonb WHERE id = $2 AND engagement_id = $3 AND phase_number = 0 RETURNING id, state_jsonb, status",
          [JSON.stringify(state), field.moduleId, moveId],
        );
        const stored = updated.rows[0];
        if (
          updated.rowCount !== 1 ||
          !stored ||
          stored.id !== field.moduleId ||
          stored.state_jsonb?.value !== field.retained ||
          stored.status !== before.status
        )
          refuse(
            "correction_readback_failed",
            "The captured-input correction could not be read back.",
          );
        readback.find((row) => row.id === field.moduleId)!.state =
          stored.state_jsonb;
      }
      const audit = await query(
        "INSERT INTO program_audit_log (tenant_key, program_id, engagement_id, actor_id, actor_role, action, from_state, to_state, rationale, evidence_refs) VALUES ($1,$2,$2,$3,$4,$5,$6,$7,$8,$9::text[]) RETURNING id",
        [
          ctx.clientKey,
          moveId,
          ctx.userId,
          ctx.role ?? ctx.tenantRole ?? null,
          "phase_capture_reviewed_input_corrected",
          preview.captureRevision,
          computeCaptureRevision(p0CaptureValues(readback)),
          command.rationale.trim(),
          [
            snapshot.id,
            signed.id,
            preview.sourceRevision,
            ...preview.fields.map((field) => field.moduleId),
          ],
        ],
      );
      if (audit.rowCount !== 1 || !audit.rows[0]?.id)
        refuse(
          "correction_audit_failed",
          "The correction audit could not be recorded.",
        );
      const [
        afterProgram,
        afterSnapshot,
        afterSigned,
        afterRequests,
        afterModules,
      ] = await Promise.all([
        query("SELECT * FROM engagements WHERE id = $1 AND client_id = $2", [
          moveId,
          ctx.clientId,
        ]),
        query(
          "SELECT * FROM phase_snapshots WHERE id = $1 AND engagement_id = $2",
          [snapshot.id, moveId],
        ),
        query(
          "SELECT * FROM deliverables_v2 WHERE id = $1 AND engagement_id = $2",
          [signed.id, moveId],
        ),
        query(
          "SELECT * FROM program_approval_requests WHERE program_id = $1 ORDER BY created_at DESC",
          [moveId],
        ),
        query(
          "SELECT * FROM program_modules WHERE engagement_id = $1 ORDER BY phase_number, module_order ASC NULLS LAST",
          [moveId],
        ),
      ]);
      if (
        p0CorrectionRecordRevision(afterProgram.rows[0]) !== programRevision ||
        p0CorrectionRecordRevision(afterSnapshot.rows[0]) !==
          p0CorrectionRecordRevision(rawSnapshot) ||
        !afterSigned.rows[0] ||
        p0SignatureRevision(afterSigned.rows[0]) !==
          preview.signatureRevision ||
        p0CorrectionRecordRevision(afterSigned.rows[0]) !==
          p0CorrectionRecordRevision(signed) ||
        p0CorrectionRecordRevision(afterRequests.rows) !== requestsRevision
      )
        refuse(
          "correction_preservation_failed",
          "The preserved approval or source binding changed; the correction is refused.",
        );
      const changedIds = new Set(preview.fields.map((field) => field.moduleId));
      if (
        afterModules.rows.length !== rawModules.length ||
        rawModules.some((before) => {
          const after = afterModules.rows.find((row) => row.id === before.id);
          return (
            !after ||
            after.status !== before.status ||
            (changedIds.has(before.id) &&
              p0CorrectionRecordRevision({ ...after, state_jsonb: null }) !==
                p0CorrectionRecordRevision({ ...before, state_jsonb: null })) ||
            (!changedIds.has(before.id) &&
              p0CorrectionRecordRevision(after) !==
                p0CorrectionRecordRevision(before))
          );
        })
      )
        refuse(
          "correction_preservation_failed",
          "Another capture record changed; the correction is refused.",
        );
      if (
        preview.fields.some(
          (field) =>
            afterModules.rows.find((row) => row.id === field.moduleId)
              ?.state_jsonb?.value !== field.retained,
        )
      )
        refuse(
          "correction_readback_failed",
          "The captured-input correction could not be read back.",
        );
      const values = p0CaptureValues(
        afterModules.rows
          .filter((row) => row.phase_number === 0)
          .map((row) => ({
            id: row.id,
            moduleKey: row.module_key,
            status: row.status,
            state: row.state_jsonb ?? null,
          })),
      );
      return {
        ok: true as const,
        programId: moveId,
        phase: 0,
        persisted: true,
        changedFields: preview.fields.map((field) => field.key),
        values,
        revision: computeCaptureRevision(values),
        correctionAuditId: audit.rows[0].id,
        snapshotId: snapshot.id,
        signedBriefId: signed.id,
        signedOffVersion: 1,
        preservedBindings: true as const,
      };
    },
    { includeReads: true },
  );
}
