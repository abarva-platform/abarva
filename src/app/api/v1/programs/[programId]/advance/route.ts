// POST /api/v1/programs/:programId/advance · advance one phase
// Body: { toPhase: number, snapshot?: object, bypassGate?: boolean, approvalId?: string }
// Runs evaluateGate first; hard-fails (severity='hard') block advance.
// Soft-fails allowed with bypassGate=true (lead override).

import { NextRequest } from "next/server";
import { getProgramById } from "@/lib/programs/queries";
import { advancePhase } from "@/lib/programs/mutations";
import {
  evaluateGate,
  requestFounderApproval,
} from "@/lib/programs/governance";
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
    if (
      accessPolicy.programIdsAllowed !== null &&
      !accessPolicy.programIdsAllowed.includes(programId)
    ) {
      return Response.json({ error: "forbidden" }, { status: 403 });
    }
    const body = (await req.json()) as {
      toPhase?: number;
      snapshot?: Record<string, unknown>;
      bypassGate?: boolean;
      approvalId?: string;
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

    // SECURITY (audit 2026-05-22, P1-4): under GATE_APPROVAL_STRICT_MODE
    // gate approval / self-approval / bypass requires an admin/maestro
    // role. In pilot (flag off) the canApproveGates capability suffices.
    const strictMode = isGateApprovalStrictMode();
    const strictRoleOk = !strictMode || isStrictModeApprovalRole(ctx.role);

    const canSelfApproveGate =
      body.selfApproveIfAuthorized === true &&
      strictRoleOk &&
      (accessPolicy.canApproveGates || ctx.role === "founder");

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

    if (gate.requiresApproval && !body.approvalId && !canSelfApproveGate) {
      // Create a pending founder approval request and return it
      const approvalId = await requestFounderApproval(
        writeCtx,
        programId,
        {
          requestType: "phase_gate",
          headline: `Approve phase ${fromPhase} → ${body.toPhase} gate`,
          approverRole: gate.approverRole ?? "sponsor",
          deadlineHours: 48,
          context: {
            from_phase: fromPhase,
            to_phase: body.toPhase,
            bypass_gate: !!body.bypassGate,
            human_rationale: humanRationale,
          },
        },
        { supabase },
      );
      return Response.json(
        {
          error: "approval_required",
          approvalId,
          gate,
          detail:
            "Approval request created · re-send with approvalId once approved",
        },
        { status: 202 },
      );
    }

    if (
      (body.bypassGate || canSelfApproveGate) &&
      !accessPolicy.canApproveGates &&
      ctx.role !== "founder"
    ) {
      return Response.json(
        {
          error: "forbidden",
          detail: "phase-gate approval permission is required to bypass a gate",
        },
        { status: 403 },
      );
    }
    // Under strict mode, bypassing a gate also requires an admin/maestro role.
    if (
      (body.bypassGate || body.selfApproveIfAuthorized) &&
      strictMode &&
      !strictRoleOk
    ) {
      return Response.json(
        {
          error: "forbidden",
          detail:
            "GATE_APPROVAL_STRICT_MODE is enabled — bypassing or self-approving a gate requires an admin or maestro role.",
        },
        { status: 403 },
      );
    }

    if (gate.requiresApproval && body.approvalId) {
      const { data: approval, error: approvalError } = await supabase
        .from("founder_approval_requests")
        .select("id, status, engagement_id, request_type, context_jsonb")
        .eq("id", body.approvalId)
        .eq("engagement_id", programId)
        .maybeSingle();
      if (approvalError || !approval || approval.status !== "approved") {
        return Response.json(
          {
            error: "approval_not_cleared",
            detail:
              "Phase gate approval must be approved before the phase can advance",
          },
          { status: 409 },
        );
      }
      // SECURITY (audit 2026-05-22, P1-3): bind the consumed approval to
      // THIS specific transition. Previously any approved approvalId on
      // the program was accepted, so a stale or unrelated approval (a
      // budget_change, or a phase_gate for a different transition) could
      // be replayed to advance a gate it never authorized.
      const approvalRow = approval as {
        request_type?: string | null;
        context_jsonb?: Record<string, unknown> | null;
      };
      if (approvalRow.request_type !== "phase_gate") {
        return Response.json(
          {
            error: "approval_type_mismatch",
            detail:
              "The supplied approval is not a phase_gate approval and cannot authorize a phase advance.",
          },
          { status: 409 },
        );
      }
      const approvalCtx = approvalRow.context_jsonb ?? {};
      const approvedFromPhase = approvalCtx.from_phase;
      const approvedToPhase = approvalCtx.to_phase;
      if (approvedFromPhase !== fromPhase || approvedToPhase !== body.toPhase) {
        return Response.json(
          {
            error: "approval_transition_mismatch",
            detail:
              `The supplied approval authorizes phase ${approvedFromPhase} → ${approvedToPhase}, ` +
              `not ${fromPhase} → ${body.toPhase}. Request a fresh approval for this transition.`,
          },
          { status: 409 },
        );
      }
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
      approvalId: body.approvalId ?? null,
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
