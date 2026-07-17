// GET/POST /api/v1/programs/:programId/phase-gate-approval
//
// Signed-in phase gate approval path for real Strategic Moves. This does not
// bypass gates: it first verifies durable phase capture, then uses the existing
// P0 close helper or governed advancePhase path to create approved phase
// snapshots and advance the Move.

import { NextRequest } from "next/server";
import { requireTenancy, tenancyErrorResponse } from "@/app/api/v1/programs/_auth";
import { loadUserProgramAccessPolicy } from "@/lib/auth/program-access-policy";
import { getAzureWriteFluentClient } from "@/lib/data-plane/postgresCompat";
import { getModuleState, getPhaseSnapshots, getProgramById } from "@/lib/programs/queries";
import { evaluateGate } from "@/lib/programs/governance";
import {
  advancePhase,
  ensurePhaseGateDeliverable,
  signOffDeliverable,
} from "@/lib/programs/mutations";
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

const PHASE_GATE_DELIVERABLES: Record<number, Array<{ typeKey: string; title: string }>> = {
  1: [{ typeKey: "charter", title: "Program Charter" }],
  2: [{ typeKey: "discovery_report", title: "Discovery & Diagnosis Report" }],
  3: [
    { typeKey: "design_spec", title: "Solution Design Specification" },
    { typeKey: "requirements_traceability", title: "Requirements Traceability Matrix" },
  ],
  4: [
    { typeKey: "execution_roadmap", title: "Execution Roadmap" },
    { typeKey: "business_case", title: "Business Case" },
    { typeKey: "readiness_and_change_plan", title: "Readiness & Change Plan" },
    { typeKey: "tower_metric_plan", title: "Tower Metrics Plan" },
  ],
  5: [
    { typeKey: "handoff_package", title: "Mobilization & Tower Handoff Package" },
    { typeKey: "value_measurement_contract", title: "Value Measurement Contract" },
  ],
};

function parsePhase(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return 0;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0 || parsed > 5) return null;
  return parsed;
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
    if (!capturedModule || !["completed", "skipped"].includes(capturedModule.status)) {
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
  const gatesPassed = Array.isArray(program?.gatesPassed) ? program.gatesPassed : [];
  if (
    gatesPassed.some(
      (entry) => entry === phase || entry === String(phase) || entry === `P${phase}`,
    )
  ) {
    return true;
  }
  const snapshots = await getPhaseSnapshots(ctx, programId, phase).catch(() => []);
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

  const currentParticipant = ((currentRows as Array<{ id: string }> | null) ?? [])[0];
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

async function preparePhaseGateApprovalRecords(
  sb: ReturnType<typeof getAzureWriteFluentClient>,
  ctx: Awaited<ReturnType<typeof requireTenancy>>,
  programId: string,
  phase: number,
  rationale: string,
): Promise<void> {
  const gates = PHASE_GATE_DELIVERABLES[phase] ?? [];
  for (const gate of gates) {
    const result = await ensurePhaseGateDeliverable(
      ctx,
      programId,
      {
        deliverableTypeKey: gate.typeKey,
        title: gate.title,
        content: `P${phase} gate approval record\n\n${rationale}`,
      },
      { supabase: sb },
    );
    if (result.status !== "signed_off") {
      await signOffDeliverable(ctx, programId, result.deliverableId, { supabase: sb });
    }
  }

  if (phase === 1) {
    await ensureSponsorAuthorityForApprover(sb, programId, ctx);
  }
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
    if (!capture.complete) {
      return Response.json(
        {
          error: "capture_incomplete",
          phase,
          missing: capture.missing,
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
        approved: true,
        alreadyApproved: true,
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
        approved: true,
        newPhase: closed.newPhase,
        closeResult: closed,
      });
    }

    const sb = getAzureWriteFluentClient();
    const toPhase = phase + 1;
    await preparePhaseGateApprovalRecords(sb, ctx, programId, phase, rationale);
    const gate = await evaluateGate(ctx, programId, phase, toPhase, { supabase: sb });
    const hardFails = gate.failedChecks.filter((check) => check.severity === "hard");
    if (hardFails.length > 0) {
      return Response.json(
        {
          error: "gate_blocked",
          phase,
          gate,
          detail: `Hard-gate checks must pass before approval: ${hardFails
            .map((check) => check.reason || check.check)
            .join("; ")}`,
        },
        { status: 409 },
      );
    }

    const advanced = await advancePhase(
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
    const carried = gate.failedChecks.filter((check) => check.severity === "soft");
    await saveGateDecisionArtifact(ctx, {
      moveId: programId,
      moveName: program.name ?? undefined,
      fromPhase: phase,
      toPhase,
      approverName: ctx.email ?? ctx.userId,
      approverRole: ctx.role ?? "gate approver",
      rationale,
      override: carried.length > 0,
      carriedGaps: carried.map((check) => ({
        check: check.check,
        reason: check.reason ?? null,
        severity: check.severity,
      })),
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
      approved: true,
      newPhase: advanced.newPhase,
      terminalHandoff: toPhase === 6,
      snapshotId: advanced.snapshotId,
      carriedGaps: carried.map((check) => check.check),
    });
  } catch (err) {
    try {
      return tenancyErrorResponse(err);
    } catch {
      /* not a tenancy error */
    }
    console.error("[POST /api/v1/programs/:programId/phase-gate-approval]", err);
    return Response.json(
      { error: "internal_error", message: (err as Error).message },
      { status: 500 },
    );
  }
}
