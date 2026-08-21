// GET/POST /api/v1/programs/:programId/phase-gate-approval
//
// Signed-in phase gate approval path for real Strategic Moves. This does not
// bypass gates: it first verifies durable phase capture, then uses the existing
// P0 close helper or governed advancePhase path to create approved phase
// snapshots and advance the Move.
//
// INCIDENT 2026-07-20 (fixed here): this route used to call
// `preparePhaseGateApprovalRecords`, which — for EVERY phase, unconditionally
// — auto-CREATED a placeholder `deliverables_v2` row (content: literally
// "P{phase} gate approval record\n\n{rationale}", no real generated content)
// for a hardcoded `PHASE_GATE_DELIVERABLES` map, then immediately called
// `signOffDeliverable` on it, all BEFORE `evaluateGate` ever ran. For P3 the
// map's keys (`design_spec`, `requirements_traceability`) were STALE — the
// real orchestrator registry (deliverable-registry.ts) has never produced
// those exact type keys since it was restructured to produce
// `target_state_architecture`/`solution_design`/`operating_model_design`/
// `sourcing_strategy` instead. Because no real row with those stale keys
// could ever exist, this branch fabricated-and-signed-off a fake stand-in
// EVERY time, regardless of whether real P3 generation had run at all — this
// is exactly how a real Move (MEMBER AI ASSIST) advanced P3→P4 with zero real
// P3 deliverables ever generated. `evaluateGate`'s `design_approved`/
// `requirements_design_outcome_trace` hard checks then genuinely found these
// fabricated, self-signed rows and passed — this was never a gate bypass or
// an override; it was a real hard-gate pass on fabricated evidence.
//
// Fix: this route no longer creates or signs off ANYTHING. `evaluateGate`
// (governance.ts) already independently and correctly checks every phase's
// REAL required deliverables against REAL `deliverables_v2` rows (updated
// this session to also require role approvals where applicable, and to
// require a genuinely completed phase module before any free-text fallback
// can contribute) — that is the single, authoritative gate. Duplicating a
// subset of that logic here with a second, stale, unmaintained map was the
// root cause; the fix is to delete the duplicate, not patch it again.

import { NextRequest } from "next/server";
import {
  requireTenancy,
  tenancyErrorResponse,
} from "@/app/api/v1/programs/_auth";
import { loadUserProgramAccessPolicy } from "@/lib/auth/program-access-policy";
import { getAzureWriteFluentClient } from "@/lib/data-plane/postgresCompat";
import {
  getModuleState,
  getPhaseSnapshots,
  getProgramById,
} from "@/lib/programs/queries";
import { evaluateGate } from "@/lib/programs/governance";
import { advancePhase } from "@/lib/programs/mutations";
import { closeP0OnApproval } from "@/lib/programs/origination-close";
import { writeProgramAuditLogBestEffort } from "@/lib/programs/audit-log";
import { saveGateDecisionArtifact } from "@/lib/programs/deliverables/gate-override-artifact";
import {
  getPhaseCaptureSections,
  phaseCaptureModuleKey,
} from "@/lib/programs/phase-capture-contract";
import { persistP0PhaseCaptureFromSource } from "@/lib/programs/p0-phase-capture";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function gateIdFor(programId: string, phase: number): string {
  return `moves-phase-gate:${programId}:P${phase}->P${phase + 1}`;
}

function parsePhase(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return 0;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0 || parsed > 5) return null;
  return parsed;
}

function appendGatePassed(gatesPassed: unknown, phase: number): unknown[] {
  const existing = Array.isArray(gatesPassed) ? gatesPassed : [];
  const alreadyPresent = existing.some((entry) => {
    if (entry === phase || entry === String(phase) || entry === `P${phase}`) {
      return true;
    }
    if (!entry || typeof entry !== "object") return false;
    const record = entry as Record<string, unknown>;
    return [
      record.phase,
      record.phaseNumber,
      record.phase_number,
      record.fromPhase,
      record.from_phase,
      record.completedPhase,
      record.completed_phase,
    ].some(
      (value) =>
        value === phase || value === String(phase) || value === `P${phase}`,
    );
  });
  return alreadyPresent ? existing : [...existing, phase];
}

async function captureCompletion(
  ctx: Awaited<ReturnType<typeof requireTenancy>>,
  programId: string,
  phase: number,
  program?: Awaited<ReturnType<typeof getProgramById>> | null,
): Promise<{ complete: boolean; missing: string[] }> {
  const modules = await getModuleState(ctx, programId);
  const missing: string[] = [];
  for (const section of getPhaseCaptureSections(phase)) {
    const capturedModule = modules.find(
      (entry) => entry.moduleKey === phaseCaptureModuleKey(phase, section.key),
    );
    if (
      !capturedModule ||
      !["completed", "skipped"].includes(capturedModule.status)
    ) {
      missing.push(section.label);
    }
  }
  if (missing.length === 0) return { complete: true, missing: [] };

  if (phase === 0 && program?.charter) {
    const repaired = await persistP0PhaseCaptureFromSource(ctx, programId, {
      name: program.name,
      problemStatement: program.problemStatement,
      targetOutcome: program.targetOutcome,
      timelineHorizon: program.timelineHorizon,
      charter: program.charter,
    });
    if (repaired.complete) {
      return { complete: true, missing: [] };
    }
    return { complete: false, missing: repaired.missing };
  }

  return { complete: false, missing };
}

async function isPhaseApproved(
  ctx: Awaited<ReturnType<typeof requireTenancy>>,
  programId: string,
  phase: number,
): Promise<boolean> {
  const program = await getProgramById(ctx, programId);
  const gatesPassed = Array.isArray(program?.gatesPassed)
    ? program.gatesPassed
    : [];
  if (
    gatesPassed.some(
      (entry) =>
        entry === phase || entry === String(phase) || entry === `P${phase}`,
    )
  ) {
    return true;
  }
  const snapshots = await getPhaseSnapshots(ctx, programId, phase).catch(
    () => [],
  );
  return snapshots.some((snapshot) => snapshot.approvalStatus === "approved");
}

async function ensureSponsorAuthorityForApprover(
  sb: ReturnType<typeof getAzureWriteFluentClient>,
  programId: string,
  ctx: Awaited<ReturnType<typeof requireTenancy>>,
): Promise<void> {
  const { data: sponsorRows, error: sponsorError } = await sb
    .from("engagement_participants")
    .select("id")
    .eq("engagement_id", programId)
    .eq("approval_authority", "sponsor")
    .limit(1);
  if (sponsorError) throw sponsorError;
  if (((sponsorRows as Array<{ id: string }> | null) ?? []).length > 0) return;

  const { data: currentRows, error: currentError } = await sb
    .from("engagement_participants")
    .select("id")
    .eq("engagement_id", programId)
    .eq("user_id", ctx.userId)
    .limit(1);
  if (currentError) throw currentError;

  const currentParticipant = ((currentRows as Array<{ id: string }> | null) ??
    [])[0];
  if (currentParticipant) {
    const { error } = await sb
      .from("engagement_participants")
      .update({
        role: "Sponsor",
        approval_authority: "sponsor",
      })
      .eq("id", currentParticipant.id)
      .eq("engagement_id", programId);
    if (error) throw error;
    return;
  }

  const { error } = await sb.from("engagement_participants").insert({
    engagement_id: programId,
    user_id: ctx.userId,
    user_name: ctx.email ?? ctx.userId,
    role: "Sponsor",
    approval_authority: "sponsor",
  });
  if (error) throw error;
}

async function completeTerminalTowerHandoff(
  sb: ReturnType<typeof getAzureWriteFluentClient>,
  ctx: Awaited<ReturnType<typeof requireTenancy>>,
  programId: string,
  rationale: string,
  gatesPassed: unknown,
): Promise<{ snapshotId: string }> {
  const nowIso = new Date().toISOString();
  const snapshot = {
    humanRationale: rationale,
    signed_in_phase_gate_approval: true,
    terminal_tower_handoff: true,
    capture_path: `/api/v1/programs/${programId}/phase-capture`,
  };
  const { data: snap, error: snapError } = await sb
    .from("phase_snapshots")
    .insert({
      engagement_id: programId,
      phase_number: 5,
      snapshot_jsonb: snapshot,
      locked_by_user_id: ctx.userId,
      locked_at: nowIso,
      approval_status: "approved",
    })
    .select("id")
    .single();
  if (snapError) throw snapError;
  const snapshotId = (snap as { id?: string } | null)?.id;
  if (!snapshotId)
    throw new Error("P5 terminal handoff snapshot insert returned no id");

  const { error: updateError } = await sb
    .from("engagements")
    .update({
      lifecycle_state: "completed",
      gates_passed: appendGatePassed(gatesPassed, 5),
      phase_locked_at: nowIso,
      phase_locked_by_user_id: ctx.userId,
      updated_at: nowIso,
    })
    .eq("id", programId)
    .eq("client_id", ctx.clientId);
  if (updateError) throw updateError;

  const { error: logError } = await sb.from("module_state_log").insert({
    engagement_id: programId,
    module_key: "phase_5",
    previous_state: "in_progress",
    new_state: "completed",
    changed_by_user_id: ctx.userId,
    notes: "Completed P5 terminal Tower handoff",
    context_jsonb: {
      terminal_tower_handoff: true,
      approved_by: ctx.userId,
      snapshot_id: snapshotId,
    },
  });
  if (logError) throw logError;

  return { snapshotId };
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
    const [capture, approved] = await Promise.all([
      captureCompletion(ctx, programId, phase, program),
      isPhaseApproved(ctx, programId, phase),
    ]);
    return Response.json({
      ok: true,
      programId,
      phase,
      gateId: gateIdFor(programId, phase),
      transition: {
        fromPhase: phase,
        toPhase: phase + 1,
      },
      currentPhase: program.currentPhase,
      capture,
      approved,
      canApprove: capture.complete && !approved,
      approvePath: `/api/v1/programs/${programId}/phase-gate-approval`,
    });
  } catch (err) {
    try {
      return tenancyErrorResponse(err);
    } catch {
      /* not a tenancy error */
    }
    console.error("[GET /api/v1/programs/:programId/phase-gate-approval]", err);
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
      rationale?: string;
    };
    const phase = parsePhase(body.phase ?? program.currentPhase ?? 0);
    if (phase === null || phase > 5) {
      return Response.json(
        { error: "bad_request", detail: "phase must be an integer in [0,5]" },
        { status: 400 },
      );
    }

    const policy = await loadUserProgramAccessPolicy(ctx, { programId });
    if (!policy.canApproveGates) {
      return Response.json(
        {
          error: "forbidden",
          detail:
            "Approving a phase gate requires gate-approval permission for this Move.",
        },
        { status: 403 },
      );
    }

    const capture = await captureCompletion(ctx, programId, phase, program);
    if (phase === 0 && !capture.complete) {
      return Response.json(
        {
          error: "capture_incomplete",
          phase,
          gateId: gateIdFor(programId, phase),
          missing: capture.missing,
          capture,
          detail: `P${phase} capture is incomplete.`,
        },
        { status: 409 },
      );
    }

    if (await isPhaseApproved(ctx, programId, phase)) {
      return Response.json({
        ok: true,
        programId,
        phase,
        gateId: gateIdFor(programId, phase),
        approved: true,
        alreadyApproved: true,
        nextAction:
          phase >= 5
            ? "tower_handoff_complete_or_already_terminal"
            : `open_phase_${phase + 1}`,
      });
    }

    const rationale =
      body.rationale?.trim() ||
      `P${phase} capture reviewed and approved through the signed-in phase gate path.`;

    if (phase === 0) {
      const closed = await closeP0OnApproval({
        programId,
        tenantKey: ctx.clientKey ?? ctx.clientId,
        deciderUserId: ctx.userId,
        rationale,
        actorTenancy: ctx,
      });
      if (!closed.advanced) {
        return Response.json(
          {
            error: "gate_blocked",
            phase,
            blockedBy: closed.blockedBy,
            closeResult: closed,
            detail: closed.blockedBy.length
              ? `P0 gate remains blocked by: ${closed.blockedBy.join(", ")}.`
              : "P0 gate approval could not advance the Move. Check server logs for the phase close helper.",
          },
          { status: 409 },
        );
      }
      return Response.json({
        ok: true,
        programId,
        phase,
        gateId: gateIdFor(programId, phase),
        approved: true,
        newPhase: closed.newPhase,
        transition: {
          fromPhase: phase,
          toPhase: closed.newPhase,
        },
        nextAction: `open_phase_${closed.newPhase}`,
        closeResult: closed,
      });
    }

    const sb = getAzureWriteFluentClient();
    const toPhase = phase + 1;
    // No deliverable is created or signed off here — evaluateGate below is
    // the single, authoritative check against REAL deliverables_v2 rows.
    // ensureSponsorAuthorityForApprover is unrelated to deliverable
    // fabrication (it only grants the approving user sponsor authority when
    // none exists yet for P0→P1) and is kept as-is.
    if (phase === 1) {
      await ensureSponsorAuthorityForApprover(sb, programId, ctx);
    }
    const gate = await evaluateGate(ctx, programId, phase, toPhase, {
      supabase: sb,
    });
    const hardFails = gate.failedChecks.filter(
      (check) => check.severity === "hard",
    );
    if (hardFails.length > 0) {
      return Response.json(
        {
          error: "gate_blocked",
          phase,
          gateId: gateIdFor(programId, phase),
          gate,
          capture,
          detail: `Hard-gate checks must pass before approval: ${hardFails
            .map((check) => check.reason || check.check)
            .join("; ")}`,
        },
        { status: 409 },
      );
    }

    const carried = gate.failedChecks.filter(
      (check) => check.severity === "soft",
    );
    const captureGapsCarried =
      phase > 0 && !capture.complete
        ? capture.missing.map((label) => ({
            check: "phase_capture_incomplete",
            reason: `${label} was not separately captured before gate approval.`,
            severity: "soft" as const,
          }))
        : [];
    const advanced =
      phase === 5
        ? {
            programId,
            newPhase: 6,
            ...(await completeTerminalTowerHandoff(
              sb,
              ctx,
              programId,
              rationale,
              program.gatesPassed,
            )),
          }
        : await advancePhase(
            ctx,
            {
              programId,
              fromPhase: phase,
              toPhase,
              snapshot: {
                humanRationale: rationale,
                signed_in_phase_gate_approval: true,
                capture_path: `/api/v1/programs/${programId}/phase-capture`,
              },
              approvedByUserId: ctx.userId,
            },
            { supabase: sb },
          );
    await saveGateDecisionArtifact(ctx, {
      moveId: programId,
      moveName: program.name ?? undefined,
      fromPhase: phase,
      toPhase,
      approverName: ctx.email ?? ctx.userId,
      approverRole: ctx.role ?? "gate approver",
      rationale,
      softGapsCarried: carried.length + captureGapsCarried.length > 0,
      hardGateOverride: null,
      carriedGaps: [
        ...carried.map((check) => ({
          check: check.check,
          reason: check.reason ?? null,
          severity: check.severity,
        })),
        ...captureGapsCarried,
      ],
    }).catch(() => null);
    await writeProgramAuditLogBestEffort(ctx, {
      programId,
      engagementId: programId,
      action: "phase_gate_approved",
      fromState: `P${phase}`,
      toState: `P${toPhase}`,
      rationale,
    });

    return Response.json({
      ok: true,
      programId,
      phase,
      gateId: gateIdFor(programId, phase),
      approved: true,
      newPhase: advanced.newPhase,
      transition: {
        fromPhase: phase,
        toPhase: advanced.newPhase,
      },
      nextAction:
        toPhase === 6
          ? "open_tower_handoff"
          : `open_phase_${advanced.newPhase}`,
      terminalHandoff: toPhase === 6,
      snapshotId: advanced.snapshotId,
      carriedGaps: [
        ...carried.map((check) => check.check),
        ...captureGapsCarried.map((check) => check.check),
      ],
    });
  } catch (err) {
    try {
      return tenancyErrorResponse(err);
    } catch {
      /* not a tenancy error */
    }
    console.error(
      "[POST /api/v1/programs/:programId/phase-gate-approval]",
      err,
    );
    return Response.json(
      { error: "internal_error", message: (err as Error).message },
      { status: 500 },
    );
  }
}
