// GET/POST /api/v1/programs/:programId/phase-gate-approval
//
// Signed-in phase gate approval path for real Strategic Moves. This does not
// bypass gates: it first verifies durable phase capture, then uses the existing
// P0 close helper or governed advancePhase path to create approved phase
// snapshots and advance the Move.
//
// Gate approval relies on the single authoritative `evaluateGate` check.
// This route must not synthesize deliverable rows or mark generated content
// signed off; only reviewed deliverables and completed phase inputs count.

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
import { sendMoveProgressUpdate } from "@/lib/programs/move-progress-notifications";
import { writeProgramAuditLogBestEffort } from "@/lib/programs/audit-log";
import { saveGateDecisionArtifact } from "@/lib/programs/deliverables/gate-override-artifact";
import {
  getPhaseCaptureSections,
  phaseCaptureModuleKey,
} from "@/lib/programs/phase-capture-contract";
import { listApprovedPhaseEvidence } from "@/lib/programs/approved-phase-evidence";
import { resolveConfirmedSolutionRoute } from "@/lib/programs/solution-route-assessment";
import { persistP0PhaseCaptureFromSource } from "@/lib/programs/p0-phase-capture";
import { loadApprovedMoveEvidenceSnapshot } from "@/lib/programs/approved-move-evidence-snapshot";
import { loadP0MinimumEvidenceStatus } from "@/lib/programs/p0-source-evidence";
import { loadDiscoveryEvidenceReadiness } from "@/lib/programs/discovery/evidence-readiness";
import { buildMoveEvidenceNeedPackets } from "@/lib/programs/evidence-readiness/move-evidence-need-packet";
import { currentPhaseRequiredEvidenceGaps } from "@/lib/programs/phase-progress-readiness";
import { applyStageReadinessToEvidencePackets } from "@/lib/programs/stage-readiness-workbooks/gate-readiness";
import { loadAcceptedStageReadinessContext } from "@/lib/programs/stage-readiness-workbooks/accepted-context";
import {
  phaseApprovalMatchesEvidence,
  type PhaseGateEvidenceState,
} from "@/lib/programs/phase-gate-evidence-binding";
import { missingP1CaptureSections } from "@/lib/programs/p1-charter-evidence";

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

function gatePassedIncludes(gatesPassed: unknown, phase: number): boolean {
  const existing = Array.isArray(gatesPassed) ? gatesPassed : [];
  return existing.some((entry) => {
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
}

function appendGatePassed(gatesPassed: unknown, phase: number): unknown[] {
  const existing = Array.isArray(gatesPassed) ? gatesPassed : [];
  const alreadyPresent = gatePassedIncludes(existing, phase);
  return alreadyPresent ? existing : [...existing, phase];
}

function toJsonbParam(value: unknown): string {
  return JSON.stringify(value ?? null);
}

function terminalTowerHandoffComplete(
  program: Awaited<ReturnType<typeof getProgramById>>,
): boolean {
  if (!program) return false;
  return (
    program.lifecycleState === "completed" &&
    gatePassedIncludes(program.gatesPassed, 5)
  );
}

async function transitionEvidenceReadiness(
  ctx: Awaited<ReturnType<typeof requireTenancy>>,
  programId: string,
  moveName: string,
  phase: number,
): Promise<{ available: boolean; gaps: ReturnType<typeof currentPhaseRequiredEvidenceGaps> }> {
  if (phase < 1 || phase > 4) return { available: true, gaps: [] };
  try {
    const readiness = await loadDiscoveryEvidenceReadiness(ctx, programId);
    const packets = buildMoveEvidenceNeedPackets({
      moveId: programId,
      moveName,
      currentPhase: phase,
      readiness,
    });
    const workbook = await loadAcceptedStageReadinessContext(
      ctx,
      programId,
      phase + 1,
    );
    const assessedPackets = applyStageReadinessToEvidencePackets(
      packets,
      phase,
      workbook?.proposals ?? null,
      programId,
    );
    return {
      available: true,
      gaps: currentPhaseRequiredEvidenceGaps(assessedPackets, phase),
    };
  } catch {
    return { available: false, gaps: [] };
  }
}

async function captureCompletion(
  ctx: Awaited<ReturnType<typeof requireTenancy>>,
  programId: string,
  phase: number,
  program?: Awaited<ReturnType<typeof getProgramById>> | null,
): Promise<{ complete: boolean; missing: string[] }> {
  const modules = await getModuleState(ctx, programId);
  // P3 asks for a different, smaller set of inputs once the solution route is
  // confirmed. Check the set this Move was actually asked for — resolved the
  // same way the capture endpoint resolves it — not the default list.
  const moduleValue = (capturePhase: number, key: string): string => {
    const row = modules.find(
      (entry) => entry.moduleKey === phaseCaptureModuleKey(capturePhase, key),
    );
    const value = (row?.state as Record<string, unknown> | null | undefined)
      ?.value;
    return typeof value === "string" ? value : "";
  };
  const confirmedSolutionRoute =
    phase === 3
      ? resolveConfirmedSolutionRoute({
          businessChangeAssessment: moduleValue(
            1,
            "business_change_assessment",
          ),
          routeValidation: moduleValue(2, "solution_route_validation"),
          approvedEvidenceReferences: (
            await listApprovedPhaseEvidence(ctx, programId, 2)
          ).map((item) => item.evidenceId),
        })
      : null;
  const missing: string[] = [];
  const sections = getPhaseCaptureSections(phase, confirmedSolutionRoute);
  const approvedP1Evidence =
    phase === 1 ? await listApprovedPhaseEvidence(ctx, programId, 1) : [];
  if (phase === 1) {
    missing.push(
      ...missingP1CaptureSections(sections, modules, approvedP1Evidence),
    );
  } else {
    for (const section of sections) {
      const capturedModule = modules.find(
        (entry) =>
          entry.moduleKey === phaseCaptureModuleKey(phase, section.key),
      );
      if (
        !capturedModule ||
        !["completed", "skipped"].includes(capturedModule.status)
      ) {
        missing.push(section.label);
      }
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
  evidence: PhaseGateEvidenceState | null,
): Promise<boolean> {
  const snapshots = await getPhaseSnapshots(ctx, programId, phase).catch(
    () => [],
  );
  if (!phaseApprovalMatchesEvidence(phase, snapshots, evidence)) return false;
  if (phase === 0) return true;
  const gate = await evaluateGate(ctx, programId, phase, phase + 1, {
    allowHistoricalPhase: true,
  });
  return !gate.failedChecks.some((check) => check.severity === "hard");
}

async function loadEvidenceState(
  ctx: Awaited<ReturnType<typeof requireTenancy>>,
  programId: string,
): Promise<PhaseGateEvidenceState | null> {
  try {
    const snapshot = await loadApprovedMoveEvidenceSnapshot({
      tenantKey: ctx.clientKey ?? ctx.clientId,
      moveId: programId,
    });
    return snapshot
      ? {
          revision: snapshot.revision,
          latestEvidenceActivityAt: snapshot.latestEvidenceActivityAt,
          revisionByPhase: snapshot.revisionByPhase,
          latestEvidenceActivityAtByPhase:
            snapshot.latestEvidenceActivityAtByPhase,
        }
      : null;
  } catch {
    return null;
  }
}

async function completeTerminalTowerHandoff(
  sb: ReturnType<typeof getAzureWriteFluentClient>,
  ctx: Awaited<ReturnType<typeof requireTenancy>>,
  programId: string,
  rationale: string,
  gatesPassed: unknown,
  evidenceRevision: string,
  phaseEvidenceRevision: string,
): Promise<{ snapshotId: string }> {
  const nowIso = new Date().toISOString();
  const snapshot = {
    humanRationale: rationale,
    signed_in_phase_gate_approval: true,
    terminal_tower_handoff: true,
    capture_path: `/api/v1/programs/${programId}/phase-capture`,
    evidenceSnapshotHash: evidenceRevision,
    phaseEvidenceSnapshotHash: phaseEvidenceRevision,
    evidenceSnapshotScope: "phase",
  };
  const { data: snap, error: snapError } = await sb
    .from("phase_snapshots")
    .insert({
      engagement_id: programId,
      phase_number: 5,
      snapshot_jsonb: toJsonbParam(snapshot),
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
      gates_passed: toJsonbParam(appendGatePassed(gatesPassed, 5)),
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
    context_jsonb: toJsonbParam({
      terminal_tower_handoff: true,
      approved_by: ctx.userId,
      snapshot_id: snapshotId,
    }),
  });
  if (logError) throw logError;

  return { snapshotId };
}

async function recordReapprovalSnapshot(
  sb: ReturnType<typeof getAzureWriteFluentClient>,
  ctx: Awaited<ReturnType<typeof requireTenancy>>,
  programId: string,
  phase: number,
  snapshot: Record<string, unknown>,
): Promise<string> {
  const { data, error } = await sb
    .from("phase_snapshots")
    .insert({
      engagement_id: programId,
      phase_number: phase,
      snapshot_jsonb: toJsonbParam(snapshot),
      locked_by_user_id: ctx.userId,
      locked_at: new Date().toISOString(),
      approval_status: "approved",
    })
    .select("id")
    .single();
  if (error) throw error;
  const snapshotId = (data as { id?: string } | null)?.id;
  if (!snapshotId) throw new Error("Phase reapproval snapshot returned no id");
  return snapshotId;
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
    const evidence = await loadEvidenceState(ctx, programId);
    const p0Evidence =
      phase === 0
        ? await loadP0MinimumEvidenceStatus({
            tenantKey: ctx.clientKey ?? ctx.clientId,
            moveId: programId,
          })
        : null;
    const [capture, snapshots] = await Promise.all([
      captureCompletion(ctx, programId, phase, program),
      getPhaseSnapshots(ctx, programId, phase).catch(() => []),
    ]);
    const snapshotApproved = phaseApprovalMatchesEvidence(
      phase,
      snapshots,
      evidence,
    );
    const gate =
      phase === 0
        ? null
        : await evaluateGate(ctx, programId, phase, phase + 1, {
            allowHistoricalPhase: true,
          });
    const governanceGateReady =
      !gate || !gate.failedChecks.some((check) => check.severity === "hard");
    const transitionReadiness = await transitionEvidenceReadiness(
      ctx,
      programId,
      program.name ?? "Move",
      phase,
    );
    const gateReady =
      governanceGateReady &&
      transitionReadiness.available &&
      transitionReadiness.gaps.length === 0;
    const approved = snapshotApproved && gateReady;
    const approvalStale =
      !approved &&
      snapshots.some((snapshot) => snapshot.approvalStatus === "approved");
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
      approvalStale,
      gate,
      transitionReadiness: {
        available: transitionReadiness.available,
        ready: transitionReadiness.available && transitionReadiness.gaps.length === 0,
        openCount: transitionReadiness.gaps.length,
        blockers: transitionReadiness.gaps.map((gap) => ({
          evidenceSlot: gap.evidenceSlot,
          status: gap.status,
          nextAction: gap.nextAction,
        })),
      },
      evidenceSnapshotAvailable: Boolean(evidence),
      p0Evidence,
      canApprove:
        capture.complete &&
        gateReady &&
        transitionReadiness.available &&
        transitionReadiness.gaps.length === 0 &&
        !approved &&
        Boolean(evidence) &&
        (phase === 0
          ? Boolean(
              p0Evidence?.available && p0Evidence.approvedSourceFileCount >= 1,
            )
          : true),
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
    if (
      !policy.canApproveGates ||
      (Array.isArray(policy.programIdsAllowed) &&
        !policy.programIdsAllowed.includes(programId))
    ) {
      return Response.json(
        {
          error: "forbidden",
          detail:
            "Approving a phase gate requires gate-approval permission for this Move.",
        },
        { status: 403 },
      );
    }

    const evidence = await loadEvidenceState(ctx, programId);
    if (!evidence) {
      return Response.json(
        {
          error: "evidence_snapshot_unavailable",
          phase,
          detail:
            "Approved evidence could not be verified. The phase gate was not submitted.",
        },
        { status: 503 },
      );
    }
    if (
      phase > 1 &&
      !(await isPhaseApproved(ctx, programId, phase - 1, evidence))
    ) {
      return Response.json(
        {
          error: "prior_gate_stale",
          phase,
          stalePhase: phase - 1,
          detail: `P${phase - 1} must be current against approved evidence before P${phase} can be approved.`,
        },
        { status: 409 },
      );
    }

    const capture = await captureCompletion(ctx, programId, phase, program);
    if ((phase === 0 || phase === 1) && !capture.complete) {
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

    if (phase === 0) {
      const p0Evidence = await loadP0MinimumEvidenceStatus({
        tenantKey: ctx.clientKey ?? ctx.clientId,
        moveId: programId,
      });
      if (!p0Evidence.available) {
        return Response.json(
          {
            error: "p0_evidence_status_unavailable",
            phase,
            detail:
              "P0 evidence review could not be verified. The phase gate was not submitted.",
          },
          { status: 503 },
        );
      }
      if (p0Evidence.approvedSourceFileCount < 1) {
        return Response.json(
          {
            error: "p0_evidence_required",
            phase,
            requiredSourceFiles: 1,
            approvedSourceFiles: p0Evidence.approvedSourceFileCount,
            pendingReviewCount: p0Evidence.pendingReviewCount,
            evidenceTitles: p0Evidence.evidenceTitles,
            detail:
              "Upload at least one P0 source file in Files & Evidence and approve its extraction before approving P0.",
          },
          { status: 409 },
        );
      }
    }

    const approved = await isPhaseApproved(ctx, programId, phase, evidence);
    const existingSnapshots = await getPhaseSnapshots(
      ctx,
      programId,
      phase,
    ).catch(() => []);
    const approvalStale =
      !approved &&
      existingSnapshots.some(
        (snapshot) => snapshot.approvalStatus === "approved",
      );
    const terminalHandoffNeedsCompletion =
      phase === 5 && approved && !terminalTowerHandoffComplete(program);
    if (approved && !terminalHandoffNeedsCompletion) {
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

    const transitionReadiness = await transitionEvidenceReadiness(
      ctx,
      programId,
      program.name ?? "Move",
      phase,
    );
    if (!transitionReadiness.available) {
      return Response.json(
        {
          error: "transition_evidence_readiness_unavailable",
          phase,
          detail:
            "The current transition evidence and workbook review could not be verified. The phase gate was not submitted.",
        },
        { status: 503 },
      );
    }
    if (transitionReadiness.gaps.length > 0) {
      return Response.json(
        {
          error: "transition_evidence_incomplete",
          phase,
          requiredEvidenceGaps: transitionReadiness.gaps.map((gap) => ({
            evidenceSlot: gap.evidenceSlot,
            status: gap.status,
            nextAction: gap.nextAction,
          })),
          detail:
            "Required evidence must be approved, linked to a sourced workbook answer, or formally resolved before this phase can close.",
        },
        { status: 409 },
      );
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
    // The authenticated actor remains the approver; sponsor contacts are never
    // promoted or rewritten as a side effect of approving a gate.
    const gate = await evaluateGate(ctx, programId, phase, toPhase, {
      supabase: sb,
      allowHistoricalPhase: phase < (program.currentPhase ?? 0),
    });
    const hardFails = gate.failedChecks.filter(
      (check) => check.severity === "hard",
    );
    if (hardFails.length > 0) {
      return Response.json(
        {
          error: "gate_blocked",
          phase,
          approvalStale,
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
    const evidenceBoundSnapshot = {
      humanRationale: rationale,
      signed_in_phase_gate_approval: true,
      capture_path: `/api/v1/programs/${programId}/phase-capture`,
      ...(evidence
        ? {
            evidenceSnapshotHash: evidence.revision,
            phaseEvidenceSnapshotHash: evidence.revisionByPhase?.[phase] ?? "",
            evidenceSnapshotScope: "phase",
          }
        : {}),
    };
    const reapprovingEarlierPhase = phase < (program.currentPhase ?? 0);
    const advanced = reapprovingEarlierPhase
      ? {
          programId,
          newPhase: program.currentPhase ?? phase + 1,
          snapshotId: await recordReapprovalSnapshot(
            sb,
            ctx,
            programId,
            phase,
            evidenceBoundSnapshot,
          ),
        }
      : phase === 5
        ? {
            programId,
            newPhase: 6,
            ...(await completeTerminalTowerHandoff(
              sb,
              ctx,
              programId,
              rationale,
              program.gatesPassed,
              evidence?.revision ?? "",
              evidence?.revisionByPhase?.[phase] ?? "",
            )),
          }
        : await advancePhase(
            ctx,
            {
              programId,
              fromPhase: phase,
              toPhase,
              snapshot: evidenceBoundSnapshot,
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
    await sendMoveProgressUpdate({
      ctx,
      programId,
      moveName: program.name ?? `Move ${programId}`,
      fromPhase: phase,
      toPhase: advanced.newPhase,
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
      reapproved: reapprovingEarlierPhase,
      reapprovedPhase: reapprovingEarlierPhase ? phase : undefined,
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
