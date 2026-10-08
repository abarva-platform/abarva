// POST /api/v1/programs/:programId/advance · advance one phase
// Body: { toPhase: number, snapshot?: object, bypassGate?: boolean }
// P1 capture evidence and evaluateGate must both pass before advance.
// Soft gate failures may be carried only by an explicit authorized action.

import { NextRequest } from "next/server";
import { getModuleState, getProgramById } from "@/lib/programs/queries";
import { advancePhase } from "@/lib/programs/mutations";
import { evaluateGate } from "@/lib/programs/governance";
import { getPhaseCaptureSections } from "@/lib/programs/phase-capture-contract";
import { listApprovedPhaseEvidence } from "@/lib/programs/approved-phase-evidence";
import { missingP1CaptureSections } from "@/lib/programs/p1-charter-evidence";
import { isFeatureEnabled } from "@/lib/features/is-feature-enabled";
import { requireTenancy, tenancyErrorResponse } from "../../_auth";
import { loadUserProgramAccessPolicy } from "@/lib/auth/program-access-policy";
import { getProgramsRouteSupabase } from "@/lib/programs/programs-auth-mode-server";
import {
  isGateApprovalStrictMode,
  isStrictModeApprovalRole,
} from "@/lib/auth/gate-approval-strict-mode";
import {
  appendMovesDecisionSupportToSnapshot,
  buildMovesPhaseDecisionEvidencePacket,
  coerceDecisionSupportList,
  normalizeMovesHumanRationale,
  validateMovesHumanRationale,
} from "@/lib/programs/moves-ai-liability";
import { resolvePhaseGateActorPersonId } from "@/lib/programs/phase-gate-actor";
import { saveGateDecisionArtifact } from "@/lib/programs/deliverables/gate-override-artifact";
import { sendMoveProgressUpdate } from "@/lib/programs/move-progress-notifications";
import { resolvePhaseAdvanceAllowlistRefusal } from "@/lib/programs/phase-advance-authorization-outcome";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ programId: string }> },
) {
  try {
    const { programId } = await params;
    const ctx = await requireTenancy();
    const { supabase } = await getProgramsRouteSupabase("mutation");
    const accessPolicy = await loadUserProgramAccessPolicy(ctx, { programId });
    const allowlistRefusal = resolvePhaseAdvanceAllowlistRefusal({
      programId,
      programIdsAllowed: accessPolicy.programIdsAllowed,
    });
    if (allowlistRefusal) {
      return Response.json(allowlistRefusal, { status: 403 });
    }
    const body = (await req.json()) as {
      toPhase?: number;
      snapshot?: Record<string, unknown>;
      bypassGate?: boolean;
      selfApproveIfAuthorized?: boolean;
      humanRationale?: unknown;
      rationale?: unknown;
      evidenceIds?: unknown;
      missingInputs?: unknown;
      assumptions?: unknown;
      alternativesConsidered?: unknown;
    };
    if (typeof body?.toPhase !== "number") {
      return Response.json(
        { error: "bad_request", detail: "toPhase required" },
        { status: 400 },
      );
    }

    const program = await getProgramById(ctx, programId, { supabase });
    if (!program) return Response.json({ error: "not_found" }, { status: 404 });
    if (!accessPolicy.canApproveGates) {
      return Response.json(
        {
          error: "forbidden",
          detail: "Only an authorized workspace user can approve a phase gate.",
        },
        { status: 403 },
      );
    }
    const fromPhase = program.currentPhase ?? 0;
    const humanRationale = normalizeMovesHumanRationale(
      body.humanRationale ??
        body.rationale ??
        body.snapshot?.humanRationale ??
        body.snapshot?.rationale,
    );
    const rationaleError = validateMovesHumanRationale(humanRationale);
    if (rationaleError) {
      return Response.json(
        { error: "human_rationale_required", detail: rationaleError },
        { status: 400 },
      );
    }

    if (fromPhase === 1) {
      const [modules, approvedEvidence] = await Promise.all([
        getModuleState(ctx, programId),
        listApprovedPhaseEvidence(ctx, programId, 1),
      ]);
      const requireBasis = isFeatureEnabled(
        { clientKey: ctx.clientKey, clientId: ctx.clientId },
        "moves_charter_basis_v1",
      );
      const missing = missingP1CaptureSections(
        getPhaseCaptureSections(1),
        modules,
        approvedEvidence,
        { requireBasis },
      );
      if (missing.length > 0) {
        return Response.json(
          {
            error: "capture_incomplete",
            phase: 1,
            missing,
            detail: requireBasis
              ? "P1 capture requires every Charter field saved with a recorded basis (approved evidence, a workspace assertion, or an owned assumption)."
              : "P1 capture requires saved fields and matching approved evidence.",
          },
          { status: 409 },
        );
      }
    }

    const gate = await evaluateGate(ctx, programId, fromPhase, body.toPhase, {
      supabase,
    });
    const hardFails = gate.failedChecks.filter((c) => c.severity === "hard");

    if (hardFails.length > 0) {
      const hardFailDetail = hardFails
        .map((check) => check.reason || check.check)
        .filter(Boolean)
        .join("; ");
      return Response.json(
        {
          error: "gate_blocked",
          gate,
          detail: hardFailDetail
            ? `Hard-gate checks must pass before advance: ${hardFailDetail}`
            : "Hard-gate checks must pass before advance",
        },
        { status: 409 },
      );
    }

    // Only an explicit in-product action by an authorized workspace user can
    // approve a gate; do not create an alternate approver request.
    const strictMode = isGateApprovalStrictMode();
    const strictRoleOk = !strictMode || isStrictModeApprovalRole(ctx.role);
    if (body.selfApproveIfAuthorized !== true) {
      return Response.json(
        {
          error: "explicit_approval_required",
          detail:
            "The authorized workspace user must explicitly submit the gate approval in Nexus.",
        },
        { status: 409 },
      );
    }

    const actor = await resolvePhaseGateActorPersonId(ctx);
    if (!actor.ok) {
      return Response.json(
        {
          error: "operator_person_required",
          detail: actor.detail,
        },
        { status: 409 },
      );
    }
    const writeCtx = { ...ctx, userId: actor.personId };

    // Under strict mode, bypassing a gate still requires an admin/maestro role.
    if (body.bypassGate && strictMode && !strictRoleOk) {
      return Response.json(
        {
          error: "forbidden",
          detail:
            "GATE_APPROVAL_STRICT_MODE is enabled — bypassing a gate requires an admin or maestro role.",
        },
        { status: 403 },
      );
    }

    const evidencePacket = buildMovesPhaseDecisionEvidencePacket({
      programId,
      tenantName: ctx.clientKey ?? ctx.clientId,
      fromPhase,
      toPhase: body.toPhase,
      gateCriterion: `Phase gate advance ${fromPhase} -> ${body.toPhase}`,
      humanRationale,
      decisionOwner: {
        name: ctx.email ?? ctx.userId,
        title: ctx.role ?? "Gate approver",
        tenantName: ctx.clientKey ?? ctx.clientId,
        userId: actor.personId,
      },
      evidenceIds: coerceDecisionSupportList(body.evidenceIds),
      missingInputs: coerceDecisionSupportList(body.missingInputs),
      assumptions: coerceDecisionSupportList(body.assumptions),
      alternativesConsidered: coerceDecisionSupportList(
        body.alternativesConsidered,
      ),
      overrideDisposition: body.bypassGate ? "modified" : "accepted",
    });

    const result = await advancePhase(
      writeCtx,
      {
        programId,
        fromPhase,
        toPhase: body.toPhase,
        snapshot: appendMovesDecisionSupportToSnapshot(
          body.snapshot ?? {},
          evidencePacket,
        ),
        approvedByUserId: actor.personId,
        bypassGate: body.bypassGate,
      },
      { supabase },
    );

    // PR-4 Phase Gate Flexibility: persist a durable Phase Gate Decision Record
    // to the Artifact Vault. Soft-fail checks that were not satisfied are the
    // carried-forward gaps — they stay visible in the File Cabinet (and on the
    // record) instead of vanishing once the gate is crossed. Best-effort.
    //
    // NOTE: `bypassGate` never lets a HARD check through — the unconditional
    // gate_blocked 409 above already ran before this point regardless of the
    // flag. So this is never a hard-gate override; at most it's an explicit
    // human acknowledgment of unmet SOFT criteria (a normal, hard-gate-clean
    // pass). `hardGateOverride` stays null — this route implements no hard
    // bypass capability today (see gate-override-artifact.ts's module
    // comment for why that distinction matters).
    const carriedGaps = gate.failedChecks.filter((c) => c.severity === "soft");
    const softGapsCarried = carriedGaps.length > 0 || !!body.bypassGate;
    const gateArtifact = await saveGateDecisionArtifact(ctx, {
      moveId: programId,
      moveName: program.name ?? undefined,
      fromPhase,
      toPhase: body.toPhase,
      approverName: ctx.email ?? actor.personId,
      approverRole: ctx.role ?? "gate approver",
      rationale: humanRationale,
      softGapsCarried,
      hardGateOverride: null,
      carriedGaps: carriedGaps.map((c) => ({
        check: c.check,
        reason: c.reason ?? null,
        severity: c.severity,
      })),
      assumptions: coerceDecisionSupportList(body.assumptions),
      missingInputs: coerceDecisionSupportList(body.missingInputs),
      approvalId: null,
    });
    await sendMoveProgressUpdate({
      ctx,
      programId,
      moveName: program.name ?? `Move ${programId}`,
      fromPhase,
      toPhase: result.newPhase,
    });

    return Response.json({
      ok: true,
      programId: result.programId,
      newPhase: result.newPhase,
      snapshotId: result.snapshotId,
      evidencePacket,
      gateDecision: {
        recorded: !!gateArtifact,
        artifactId: gateArtifact?.artifactId ?? null,
        blobStored: gateArtifact?.blobStored ?? false,
        softGapsCarried,
        hardGateOverride: null,
        carriedGaps: carriedGaps.map((c) => c.check),
      },
    });
  } catch (err) {
    try {
      return tenancyErrorResponse(err);
    } catch {}
    console.error("[POST /programs/:id/advance]", err);
    return Response.json(
      { error: "internal_error", message: (err as Error).message },
      { status: 500 },
    );
  }
}
