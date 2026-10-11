import { getAzureWriteFluentClient } from "@/lib/data-plane/postgresCompat";
import { phaseCaptureModuleKey, evaluatePhaseCapture, getPhaseCaptureSections } from "@/lib/programs/phase-capture-contract";
import { phaseStepRecordSections } from "@/lib/programs/phase-workflow-registry";
import { isP1CharterEvidenceFamily } from "@/lib/programs/p1-charter-evidence";
import { computeCaptureRevision, findPlaceholderValues } from "@/lib/programs/phase-capture-integrity";
import { readValueModel } from "@/lib/programs/value-model-capture";
import { writeProgramAuditLogBestEffort } from "@/lib/programs/audit-log";
import type { TenancyCtx } from "@/lib/programs/types.db";

/** The same module-state persistence path is used by signed-in capture and the governed ACA job. */
export async function persistPhaseCaptureModules(input: {
  programId: string;
  phase: number;
  evaluation: ReturnType<typeof evaluatePhaseCapture>;
  storedValues: Record<string, string>;
  changedKeys: ReadonlySet<string>;
  basisKeys: ReadonlySet<string>;
  nextBasisRecords: Record<string, Record<string, unknown> | null>;
  markComplete: boolean;
}): Promise<{ nowIso: string; moduleKeys: string[] }> {
  const { programId, phase, evaluation, storedValues, changedKeys, basisKeys, nextBasisRecords, markComplete } = input;
    const sb = getAzureWriteFluentClient();
    const nowIso = new Date().toISOString();
    const moduleKeys = evaluation.sections.map((section) =>
      phaseCaptureModuleKey(phase, section.key),
    );
    const stateKeys = [...moduleKeys, ...phaseStepRecordSections(phase).map((record) => phaseCaptureModuleKey(phase, record.key))];
    const { data: existingRows, error: existingError } = await sb
      .from("program_modules")
      .select("id, module_key, status, state_jsonb")
      .eq("engagement_id", programId)
      .in("module_key", stateKeys);
    if (existingError) throw existingError;
    const existingByKey = new Map(
      (
        (existingRows as Array<{
          id: string;
          module_key: string;
          status: string;
          state_jsonb: Record<string, unknown> | null;
        }> | null) ?? []
      ).map((row) => [row.module_key, row]),
    );

    for (const [order, section] of evaluation.sections.entries()) {
      const existing = existingByKey.get(phaseCaptureModuleKey(phase, section.key));
      const basisChanged = basisKeys.has(section.key);
      // Untouched sections are skipped entirely unless this call is also
      // marking the phase complete, which legitimately changes their status.
      if (!changedKeys.has(section.key) && !basisChanged && !markComplete) continue;
      const moduleKey = phaseCaptureModuleKey(phase, section.key);
      const status =
        markComplete && section.complete
          ? "completed"
          : section.complete
            ? "in_progress"
            : "not_started";
      const state: Record<string, unknown> = {
        ...(existing?.state_jsonb ?? {}),
        capture_section_key: section.key,
        label: section.label,
        description: section.description,
        value: section.value,
        completed_from_phase_capture_path: markComplete && section.complete,
        updated_at: nowIso,
      };
      if (phase === 1 && isP1CharterEvidenceFamily(section.evidenceFamily)) {
        if (nextBasisRecords[section.key]) {
          state.p1_charter_basis = nextBasisRecords[section.key];
        } else {
          delete state.p1_charter_basis;
        }
      }
      if (existing) {
        const update: Record<string, unknown> = {
          module_name: section.label,
          phase_number: phase,
          module_order: order,
          status,
          state_jsonb: state,
          ...(status === "completed" ? { completed_at: nowIso } : {}),
          ...(status === "in_progress" ? { started_at: nowIso } : {}),
        };
        const { error } = await sb
          .from("program_modules")
          .update(update)
          .eq("id", existing.id)
          .eq("engagement_id", programId);
        if (error) throw error;
      } else {
        const { error } = await sb.from("program_modules").insert({
          engagement_id: programId,
          module_key: moduleKey,
          module_name: section.label,
          phase_number: phase,
          module_order: order,
          status,
          state_jsonb: state,
          started_at: nowIso,
          completed_at: status === "completed" ? nowIso : null,
        });
        if (error) throw error;
      }
    }

    // The phase-0 charter mirror is the most dangerous write in this route:
    // `engagements.charter` is the authoritative origination record and the
    // rehydration source of last resort. Only mirror when a capture value
    // actually changed — a no-edit save must never touch it.
    for (const [index, record] of phaseStepRecordSections(phase).entries()) {
      const moduleKey = phaseCaptureModuleKey(phase, record.key);
      const existing = existingByKey.get(moduleKey);
      const value = storedValues[record.key] ?? "";
      // A saved record completes with the phase, exactly as an answer does:
      // the next phase inherits only completed modules, so a record left
      // `in_progress` would never reach P4's carried capture. An unsaved
      // record is never created just because the phase completed.
      if (!changedKeys.has(record.key) && !(markComplete && value)) continue;
      const state: Record<string, unknown> = {
        ...(existing?.state_jsonb ?? {}),
        capture_section_key: record.key,
        label: record.label,
        description: record.description,
        value,
        step_record: true,
        updated_at: nowIso,
      };
      const status = !value
        ? "not_started"
        : markComplete
          ? "completed"
          : "in_progress";
      if (existing) {
        const { error } = await sb
          .from("program_modules")
          .update({
            module_name: record.label,
            phase_number: phase,
            module_order: 100 + index,
            status,
            state_jsonb: state,
            ...(status === "completed" ? { completed_at: nowIso } : {}),
          })
          .eq("id", existing.id)
          .eq("engagement_id", programId);
        if (error) throw error;
      } else {
        const { error } = await sb.from("program_modules").insert({
          engagement_id: programId,
          module_key: moduleKey,
          module_name: record.label,
          phase_number: phase,
          module_order: 100 + index,
          status,
          state_jsonb: state,
          started_at: nowIso,
          completed_at: status === "completed" ? nowIso : null,
        });
        if (error) throw error;
      }
    }

    return { nowIso, moduleKeys };
}

/** Read-only P4 revision preflight. The register-ID preflight is separate. */
export async function readValuePlanCaptureRevision(ctx: TenancyCtx, moveId: string): Promise<{revision: string; value: string}> {
  const sb = getAzureWriteFluentClient();
  const { data: move, error: moveError } = await sb.from("engagements")
    .select("id, client_id, current_phase, deleted_at")
    .eq("id", moveId).eq("client_id", ctx.clientId).maybeSingle();
  if (moveError) throw moveError;
  if (!move || move.deleted_at || (move.current_phase !== 3 && move.current_phase !== 4))
    throw new Error("value_plan_move_or_phase_refused");
  const keys = [...getPhaseCaptureSections(4).map((section) => section.key),
    ...phaseStepRecordSections(4).map((record) => record.key)];
  const { data, error } = await sb.from("program_modules").select("module_key, state_jsonb")
    .eq("engagement_id", moveId).in("module_key", keys.map((key) => phaseCaptureModuleKey(4,key)));
  if (error) throw error;
  const rows = new Map(((data ?? []) as Array<{module_key:string;state_jsonb:Record<string,unknown>|null}>).map((row) => [row.module_key,row]));
  const values = Object.fromEntries(keys.map((key) => {
    const value = rows.get(phaseCaptureModuleKey(4,key))?.state_jsonb?.value;
    return [key,typeof value === "string" ? value : ""];
  }));
  return {revision:computeCaptureRevision(values),value:values.value_plan ?? ""};
}

/** P4 seed write through the signed-in route's capture persistence and audit path. */
export async function writeGovernedValuePlan(input: {
  ctx: TenancyCtx; moveId: string; value: string; expectedRevision: string;
}): Promise<void> {
  const {ctx,moveId,value,expectedRevision} = input;
  if (readValueModel(value).kind !== "model" || findPlaceholderValues({value_plan:value}).length)
    throw new Error("value_plan_invalid_or_placeholder");
  const current = await readValuePlanCaptureRevision(ctx,moveId);
  if (current.revision !== expectedRevision) throw new Error("value_plan_stale_revision");
  if (current.value && current.value !== value) throw new Error("value_plan_existing_drift");
  if (current.value === value) return;
  const evaluation = evaluatePhaseCapture(4,{value_plan:value},{valueEngineV1:false});
  const section = evaluation.sections.find((item) => item.key === "value_plan");
  if (!section || section.value !== value.trim()) throw new Error("value_plan_capture_normalization_refused");
  await persistPhaseCaptureModules({programId:moveId,phase:4,evaluation,
    storedValues:{value_plan:section.value},changedKeys:new Set(["value_plan"]),
    basisKeys:new Set(),nextBasisRecords:{},markComplete:false});
  await writeProgramAuditLogBestEffort(ctx,{programId:moveId,engagementId:moveId,
    action:"phase_capture_saved",fromState:null,toState:"P4",
    rationale:"P4 value plan saved through governed operator capture path; no phase completion or approval.",
    evidenceRefs:[phaseCaptureModuleKey(4,"value_plan")]});
}
