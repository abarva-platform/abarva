// GET/POST /api/v1/programs/:programId/phase-capture
//
// Signed-in phase capture path for real Strategic Moves. This writes the
// durable capture state that artifact generation already checks through
// assertPhaseReadyForGeneration: completed program_modules rows by phase.
// It does not approve a gate and does not generate artifacts.

import { NextRequest } from "next/server";
import { requireTenancy, tenancyErrorResponse } from "@/app/api/v1/programs/_auth";
import { getAzureWriteFluentClient } from "@/lib/data-plane/postgresCompat";
import { getModuleState, getProgramById } from "@/lib/programs/queries";
import { writeProgramAuditLogBestEffort } from "@/lib/programs/audit-log";
import {
  evaluatePhaseCapture,
  getPhaseCaptureSections,
  phaseCaptureModuleKey,
} from "@/lib/programs/phase-capture-contract";
import { ensurePhaseGateDeliverable } from "@/lib/programs/mutations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// The gate deliverable each phase's Save → Approve → Generate sequence signs
// off. Mirrors PHASE_WORKFLOW in StrategicMovePhaseClient and the *_signed_off
// gate checks in governance.ts (e.g. P1 `charter_signed_off` reads a
// `deliverables_v2` row of type `charter`). P0's gate deliverable is the
// origination brief, created by the originate flow — not this path.
const PHASE_GATE_DELIVERABLE: Record<number, { typeKey: string; title: string }> = {
  1: { typeKey: "charter", title: "Program Charter" },
  2: { typeKey: "discovery_report", title: "Discovery & Diagnosis Report" },
  3: { typeKey: "design_spec", title: "Solution Design Specification" },
  4: { typeKey: "business_case", title: "Business Case" },
  5: { typeKey: "tower_handoff_plan", title: "Tower Handoff Plan" },
};

function parsePhase(value: string | null | undefined): number | null {
  if (value === null || value === undefined || value === "") return 0;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0 || parsed > 5) return null;
  return parsed;
}

function readModuleValue(moduleState: Record<string, unknown> | null | undefined): string {
  const value = moduleState?.value;
  return typeof value === "string" ? value : "";
}

async function loadCaptureValues(
  ctx: Awaited<ReturnType<typeof requireTenancy>>,
  programId: string,
  phase: number,
): Promise<Record<string, string>> {
  const modules = await getModuleState(ctx, programId);
  const values: Record<string, string> = {};
  for (const section of getPhaseCaptureSections(phase)) {
    const capturedModule = modules.find(
      (entry) => entry.moduleKey === phaseCaptureModuleKey(phase, section.key),
    );
    values[section.key] = readModuleValue(capturedModule?.state);
  }
  return values;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ programId: string }> },
) {
  try {
    const ctx = await requireTenancy();
    const { programId } = await params;
    const phase = parsePhase(req.nextUrl.searchParams.get("phase"));
    if (phase === null) {
      return Response.json(
        { error: "bad_request", detail: "phase must be an integer in [0,5]" },
        { status: 400 },
      );
    }

    const program = await getProgramById(ctx, programId);
    if (!program) return Response.json({ error: "not_found" }, { status: 404 });

    const values = await loadCaptureValues(ctx, programId, phase);
    const evaluation = evaluatePhaseCapture(phase, values);
    return Response.json({
      ok: true,
      programId,
      phase,
      currentPhase: program.currentPhase,
      capture: evaluation,
      savePath: `/api/v1/programs/${programId}/phase-capture`,
      approvalPath: `/api/v1/programs/${programId}/phase-gate-approval`,
    });
  } catch (err) {
    try {
      return tenancyErrorResponse(err);
    } catch {
      /* not a tenancy error */
    }
    console.error("[GET /api/v1/programs/:programId/phase-capture]", err);
    return Response.json({ error: "internal_error" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ programId: string }> },
) {
  try {
    const ctx = await requireTenancy();
    const { programId } = await params;
    const program = await getProgramById(ctx, programId);
    if (!program) return Response.json({ error: "not_found" }, { status: 404 });

    const body = (await req.json().catch(() => ({}))) as {
      phase?: number;
      items?: Record<string, unknown>;
      sections?: Record<string, unknown>;
      complete?: boolean;
    };
    const phase = parsePhase(
      body.phase === undefined ? String(program.currentPhase ?? 0) : String(body.phase),
    );
    if (phase === null) {
      return Response.json(
        { error: "bad_request", detail: "phase must be an integer in [0,5]" },
        { status: 400 },
      );
    }

    const incoming = body.sections ?? body.items ?? {};
    const currentValues = await loadCaptureValues(ctx, programId, phase).catch(
      () => ({}),
    );
    const mergedValues = { ...currentValues, ...incoming };
    const evaluation = evaluatePhaseCapture(phase, mergedValues);
    const markComplete = body.complete === true;

    if (markComplete && !evaluation.complete) {
      return Response.json(
        {
          error: "capture_incomplete",
          phase,
          missing: evaluation.missing,
          capture: evaluation,
          detail: "Required capture sections must be completed before phase capture can be marked complete.",
        },
        { status: 409 },
      );
    }

    const sb = getAzureWriteFluentClient();
    const nowIso = new Date().toISOString();
    const moduleKeys = evaluation.sections.map((section) =>
      phaseCaptureModuleKey(phase, section.key),
    );
    const { data: existingRows, error: existingError } = await sb
      .from("program_modules")
      .select("id, module_key, status")
      .eq("engagement_id", programId)
      .in("module_key", moduleKeys);
    if (existingError) throw existingError;
    const existingByKey = new Map(
      ((existingRows as Array<{ id: string; module_key: string; status: string }> | null) ?? [])
        .map((row) => [row.module_key, row]),
    );

    for (const [order, section] of evaluation.sections.entries()) {
      const moduleKey = phaseCaptureModuleKey(phase, section.key);
      const status = markComplete && section.complete ? "completed" : section.complete ? "in_progress" : "not_started";
      const state = {
        capture_section_key: section.key,
        label: section.label,
        description: section.description,
        value: section.value,
        completed_from_phase_capture_path: markComplete && section.complete,
        updated_at: nowIso,
      };
      const existing = existingByKey.get(moduleKey);
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

    if (phase === 0) {
      const knownEvidence =
        evaluation.sections.find((s) => s.key === "known_evidence")?.value ?? "";
      const charter = {
        ...(program.charter ?? {}),
        business_trigger: evaluation.sections.find((s) => s.key === "business_trigger")?.value ?? "",
        problem_statement: evaluation.sections.find((s) => s.key === "problem_statement")?.value ?? "",
        affected_function_process: evaluation.sections.find((s) => s.key === "affected_function_process")?.value ?? "",
        value_hypothesis: evaluation.sections.find((s) => s.key === "initial_value_hypothesis")?.value ?? "",
        sponsor_candidate: evaluation.sections.find((s) => s.key === "stakeholder_owner_view")?.value ?? "",
        scope_boundary: evaluation.sections.find((s) => s.key === "affected_function_process")?.value ?? "",
        evidence_family: knownEvidence,
        known_evidence: knownEvidence,
        missing_evidence_open_questions:
          evaluation.sections.find((s) => s.key === "missing_evidence_open_questions")?.value ?? "",
        recommendation_to_advance:
          evaluation.sections.find((s) => s.key === "recommendation_to_advance")?.value ?? "",
        phase_capture_completed_at: markComplete ? nowIso : null,
      };
      const { error } = await sb
        .from("engagements")
        .update({
          charter,
          problem_statement: charter.problem_statement || program.problemStatement,
          target_outcome: charter.value_hypothesis || program.targetOutcome,
          updated_at: nowIso,
        })
        .eq("id", programId)
        .eq("client_id", ctx.clientId);
      if (error) throw error;
    }

    await writeProgramAuditLogBestEffort(ctx, {
      programId,
      engagementId: programId,
      action: markComplete ? "phase_capture_completed" : "phase_capture_saved",
      fromState: null,
      toState: `P${phase}`,
      rationale: markComplete
        ? `Phase ${phase} capture completed through signed-in capture path.`
        : `Phase ${phase} capture saved through signed-in capture path.`,
      evidenceRefs: moduleKeys,
    });

    // Once every required section is captured, ensure the phase gate deliverable
    // exists so the workspace Approve step (sign-off) can act on it. Without this
    // the client's Save → Approve → Generate sequence dead-ends: Approve is gated
    // on a `deliverableId` the Save response never returned, so no Move could
    // advance past its gate through the primary UI. Best-effort: a failure here
    // must not fail the capture write (the fields are already persisted).
    const gate = PHASE_GATE_DELIVERABLE[phase];
    let recordCreated = false;
    let deliverableId: string | undefined;
    let recordError: string | undefined;
    if (gate && evaluation.complete) {
      try {
        const content = evaluation.sections
          .map((section) => `## ${section.label}\n${section.value}`)
          .join("\n\n");
        const result = await ensurePhaseGateDeliverable(
          ctx,
          programId,
          { deliverableTypeKey: gate.typeKey, title: gate.title, content },
          { supabase: sb },
        );
        deliverableId = result.deliverableId;
        recordCreated = result.created;
      } catch (err) {
        recordError = err instanceof Error ? err.message : "record creation failed";
      }
    }

    return Response.json({
      ok: true,
      programId,
      phase,
      persisted: true,
      savedFields: evaluation.sections
        .filter((section) => section.complete)
        .map((section) => section.key),
      allSaved: evaluation.complete,
      recordCreated,
      ...(deliverableId ? { deliverableId } : {}),
      ...(recordError ? { recordError } : {}),
      capture: evaluation,
      generationEligibility: {
        captureComplete: evaluation.complete,
        gateApprovalRequired: true,
        nextAction: evaluation.complete
          ? "Approve the phase gate."
          : "Complete all required capture sections.",
      },
    });
  } catch (err) {
    try {
      return tenancyErrorResponse(err);
    } catch {
      /* not a tenancy error */
    }
    console.error("[POST /api/v1/programs/:programId/phase-capture]", err);
    return Response.json(
      { error: "internal_error", message: (err as Error).message },
      { status: 500 },
    );
  }
}
