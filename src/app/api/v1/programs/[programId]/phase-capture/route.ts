// GET/POST /api/v1/programs/:programId/phase-capture
//
// Signed-in phase capture path for real Strategic Moves. This writes the
// durable capture state that artifact generation already checks through
// assertPhaseReadyForGeneration: completed program_modules rows by phase.
// It does not approve a gate and does not generate artifacts.
//
// PHASE CAPTURE EVIDENCE INTEGRITY (fixed here): this route used to call
// `ensurePhaseGateDeliverable` once every required capture section was
// filled in, auto-creating a real, gate-satisfying `deliverables_v2` row
// (e.g. `design_spec`, `requirements_traceability` — both genuinely
// registered deliverable types, see completeDeliverable.ts's
// ALLOWED_PROGRAM_DELIVERABLE_TYPES and governance.ts's alias lists) whose
// entire content was just the user's raw capture-field text, concatenated
// into markdown sections. That row was left `in_review`, one call away from
// being flipped to `signed_off` by the generic sign-off route
// (deliverables/:deliverableId/sign-off/route.ts), which — before this fix
// — accepted ANY in_review/draft row for ANY authorized approver with no
// check on how the content was produced. That is a second, independent path
// to the same class of incident already fixed in
// `phase-gate-approval/route.ts` (PR #5158): a hard gate check finding real,
// signed-off deliverable evidence that was never actually reviewed,
// generated, or authored as a deliberate artifact.
//
// Fix: this route no longer creates any `deliverables_v2` row at all.
// Capture text persists only as `program_modules` state (notes/draft
// evidence for the workspace and for `phaseCaptureText` free-text checks in
// governance.ts) — it can inform generation and free-text fallbacks, but it
// can never itself become a signable gate artifact. Real gate deliverables
// are created only by real generation (the orchestrator) or by deliberate
// human/agent authorship (`completeDeliverable`/`draftArtifact`, which
// require an explicit acceptance moment and tag real provenance). The
// generic sign-off route now also independently rejects unrecognized
// deliverable types and capture-derived provenance as defense-in-depth (see
// its own PHASE CAPTURE EVIDENCE INTEGRITY comment).

import { NextRequest } from "next/server";
import {
  requireTenancy,
  tenancyErrorResponse,
} from "@/app/api/v1/programs/_auth";
import { getAzureWriteFluentClient } from "@/lib/data-plane/postgresCompat";
import { getModuleState, getProgramById } from "@/lib/programs/queries";
import { writeProgramAuditLogBestEffort } from "@/lib/programs/audit-log";
import {
  computeCaptureRevision,
  diffCaptureValues,
  findPlaceholderValues,
} from "@/lib/programs/phase-capture-integrity";
import {
  evaluatePhaseCapture,
  getPhaseCaptureSections,
  phaseCaptureModuleKey,
} from "@/lib/programs/phase-capture-contract";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parsePhase(value: string | null | undefined): number | null {
  if (value === null || value === undefined || value === "") return 0;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0 || parsed > 5) return null;
  return parsed;
}

function readModuleValue(
  moduleState: Record<string, unknown> | null | undefined,
): string {
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
      // The authoritative values, flat, plus the revision a client must echo
      // back on write. Surfaced so a page can render persisted state directly
      // instead of synthesizing it — the defect this route now guards against.
      values,
      revision: computeCaptureRevision(values),
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
      /** Revision the client loaded. A mismatch means the write is stale. */
      expectedRevision?: string;
    };
    const phase = parsePhase(
      body.phase === undefined
        ? String(program.currentPhase ?? 0)
        : String(body.phase),
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
    const currentRevision = computeCaptureRevision(currentValues);

    // GUARD 1 — revision fence. A client that loaded revision R may only write
    // against revision R. If the persisted state has moved on, the write is
    // stale by definition and is rejected rather than applied over newer data.
    // Optional so existing non-Move callers keep working; clients that send it
    // get the protection.
    if (
      typeof body.expectedRevision === "string" &&
      body.expectedRevision !== currentRevision
    ) {
      return Response.json(
        {
          error: "stale_revision",
          phase,
          expectedRevision: body.expectedRevision,
          currentRevision,
          values: currentValues,
          capture: evaluatePhaseCapture(phase, currentValues),
          detail:
            "This page was loaded before the capture state changed. Reload the authoritative values and re-apply the edit.",
        },
        { status: 409 },
      );
    }

    // GUARD 2 — placeholder rejection. Known synthetic draft text must never be
    // persisted as an authoritative client answer, whatever sends it. This is
    // the floor that survives an old browser tab replaying the original bug.
    const placeholders = findPlaceholderValues(incoming);
    if (placeholders.length > 0) {
      return Response.json(
        {
          error: "placeholder_value_rejected",
          phase,
          rejected: placeholders.map((p) => p.key),
          detail:
            "Synthetic placeholder text cannot be saved as phase capture. Send the authoritative persisted value or a real edit.",
        },
        { status: 422 },
      );
    }

    // Only sections that actually changed are written. A no-edit save therefore
    // performs no write at all — which is the point: the destructive path was a
    // read-into-browser-then-POST-it-all-back round-trip, and removing the write
    // removes the opportunity to get it wrong.
    const changedSections = diffCaptureValues(currentValues, incoming);
    const hasEdits = changedSections.length > 0;

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
          detail:
            "Required capture sections must be completed before phase capture can be marked complete.",
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
      (
        (existingRows as Array<{
          id: string;
          module_key: string;
          status: string;
        }> | null) ?? []
      ).map((row) => [row.module_key, row]),
    );

    const changedKeys = new Set(changedSections.map((c) => c.key));
    for (const [order, section] of evaluation.sections.entries()) {
      // Untouched sections are skipped entirely unless this call is also
      // marking the phase complete, which legitimately changes their status.
      if (!changedKeys.has(section.key) && !markComplete) continue;
      const moduleKey = phaseCaptureModuleKey(phase, section.key);
      const status =
        markComplete && section.complete
          ? "completed"
          : section.complete
            ? "in_progress"
            : "not_started";
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

    // The phase-0 charter mirror is the most dangerous write in this route:
    // `engagements.charter` is the authoritative origination record and the
    // rehydration source of last resort. Only mirror when a capture value
    // actually changed — a no-edit save must never touch it.
    if (phase === 0 && hasEdits) {
      const knownEvidence =
        evaluation.sections.find((s) => s.key === "known_evidence")?.value ??
        "";
      const charter = {
        ...(program.charter ?? {}),
        business_trigger:
          evaluation.sections.find((s) => s.key === "business_trigger")
            ?.value ?? "",
        problem_statement:
          evaluation.sections.find((s) => s.key === "problem_statement")
            ?.value ?? "",
        affected_function_process:
          evaluation.sections.find((s) => s.key === "affected_function_process")
            ?.value ?? "",
        value_hypothesis:
          evaluation.sections.find((s) => s.key === "initial_value_hypothesis")
            ?.value ?? "",
        sponsor_candidate:
          evaluation.sections.find((s) => s.key === "stakeholder_owner_view")
            ?.value ?? "",
        scope_boundary:
          evaluation.sections.find((s) => s.key === "affected_function_process")
            ?.value ?? "",
        evidence_family: knownEvidence,
        known_evidence: knownEvidence,
        missing_evidence_open_questions:
          evaluation.sections.find(
            (s) => s.key === "missing_evidence_open_questions",
          )?.value ?? "",
        recommendation_to_advance:
          evaluation.sections.find((s) => s.key === "recommendation_to_advance")
            ?.value ?? "",
        phase_capture_completed_at: markComplete ? nowIso : null,
      };
      const { error } = await sb
        .from("engagements")
        .update({
          charter,
          problem_statement:
            charter.problem_statement || program.problemStatement,
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
      action: markComplete
        ? "phase_capture_completed"
        : hasEdits
          ? "phase_capture_saved"
          : "phase_capture_validated_no_change",
      fromState: null,
      toState: `P${phase}`,
      rationale: markComplete
        ? `Phase ${phase} capture completed through signed-in capture path.`
        : hasEdits
          ? `Phase ${phase} capture saved (${changedSections.length} field(s) changed) through signed-in capture path.`
          : `Phase ${phase} capture validated with no changes; no values written.`,
      evidenceRefs: moduleKeys,
    });

    // No deliverables_v2 row is created here — see the file-level "PHASE
    // CAPTURE EVIDENCE INTEGRITY" comment above. Real gate deliverables come
    // only from generation or deliberate authorship; capture text is
    // durable evidence for the workspace and for generation context, never
    // itself a signable gate artifact.
    return Response.json({
      ok: true,
      programId,
      phase,
      persisted: hasEdits || markComplete,
      changedFields: changedSections.map((c) => c.key),
      revision: computeCaptureRevision(mergedValues),
      savedFields: evaluation.sections
        .filter((section) => section.complete)
        .map((section) => section.key),
      allSaved: evaluation.complete,
      capture: evaluation,
      generationEligibility: {
        captureComplete: evaluation.complete,
        gateApprovalRequired: true,
        nextAction: evaluation.complete
          ? "Generate the phase's required deliverables, then approve the phase gate."
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
