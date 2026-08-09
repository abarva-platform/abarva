// PATCH /api/v1/source/:eventId/stage
// Body: { stageKey: SourceStageKey }
//
// Advances a persisted Source event to the requested stage. Seed events keep the
// legacy in-memory override path for demo fixtures, but DB rows must persist so
// the production E2E crawler can resume the lifecycle.

import { getAzureReadFluentClient } from "@/lib/data-plane/postgresCompat";
import type { NextRequest } from "next/server";
import { requireTenancy, tenancyErrorResponse } from "@/lib/auth/tenancy";
import { getActiveClientRow } from "@/lib/active-client";
import { getCurrentUser } from "@/lib/auth/current-user";
import { CANONICAL_CLIENT_ADMIN_EMAILS } from "@/lib/auth/canonical-auth-roster";
import { loadUserSourceAccessPolicy } from "@/lib/auth/source-access-policy";
import { selectSourceWriteAdapter } from "@/lib/data-plane/write-adapters/sourceWriteAdapter";
import { setStageOverride } from "@/lib/source/stage-overrides";
import { getSourceEventSeed } from "@/lib/source/mock-seed";
import {
  isCanonicalSourceStageKey,
  normalizeSourceStageKey,
  SOURCE_STAGE_ORDER,
} from "@/lib/source/constants";
import type { SourceStageKey } from "@/lib/source/types";
import { inferClientKeyFromEmail, isClientKey } from "@/lib/client-config";
import {
  artifactStateRowToView,
  evidenceStateRowToView,
  gateCriterionStateRowToView,
  type SourceEventArtifactStateRow,
  type SourceEventEvidenceStateRow,
  type SourceEventGateCriterionStateRow,
} from "@/lib/source/canvas-substrate/types";
import { getStageSubstrate } from "@/lib/source/canvas-substrate/queries";
import { persistAutoAssessment } from "@/lib/source/gate-auto-assessment-persist";
import { normalizeApprovalReason } from "@/lib/source/source-governance-enforcement";
import type { SourceStageConfirmations } from "@/lib/source/approval-decision";
import { evaluateSourceGateAdvanceContract } from "@/lib/source/gate-advance-contract";
import {
  isGateApprovalStrictMode,
  isStrictModeApprovalRole,
} from "@/lib/auth/gate-approval-strict-mode";
import {
  resolveSourceEventUuidForClient,
  scaffoldNewEventSubstrate,
} from "@/lib/source/queries";
import { autoDraftOnStageEntry } from "@/lib/source/stage-entry-autodraft";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteCtx = { params: Promise<{ eventId: string }> };

function isCanonicalClientAdminEmail(
  email: string | null | undefined,
): boolean {
  const normalized = email?.trim().toLowerCase() ?? "";
  return CANONICAL_CLIENT_ADMIN_EMAILS.includes(
    normalized as (typeof CANONICAL_CLIENT_ADMIN_EMAILS)[number],
  );
}

export async function PATCH(req: NextRequest, { params }: RouteCtx) {
  let tenancy;
  let tenancyError: unknown = null;
  try {
    tenancy = await requireTenancy();
  } catch (err) {
    tenancyError = err;
  }

  try {
    const { eventId } = await params;
    const [activeClient, currentUser] = await Promise.all([
      getActiveClientRow().catch(() => null),
      getCurrentUser().catch(() => null),
    ]);

    const body = (await req.json()) as {
      stageKey?: unknown;
      reason?: unknown;
      selfApproveIfAuthorized?: unknown;
      approvalId?: unknown;
      confirmations?: SourceStageConfirmations;
    };
    const stageKey = body?.stageKey;
    const reason = normalizeApprovalReason(body?.reason);
    const selfApproveIfAuthorized = body?.selfApproveIfAuthorized === true;

    if (!isCanonicalSourceStageKey(stageKey)) {
      return Response.json(
        {
          error: "bad_request",
          detail: `stageKey must be one of: ${SOURCE_STAGE_ORDER.join(", ")}`,
        },
        { status: 400 },
      );
    }

    const fallbackClientKey =
      (isClientKey(currentUser?.metadataClientKey)
        ? currentUser.metadataClientKey
        : null) ?? inferClientKeyFromEmail(currentUser?.email);
    const effectiveClientKey = activeClient?.key ?? fallbackClientKey;
    if (!effectiveClientKey) {
      if (tenancyError) return tenancyErrorResponse(tenancyError);
      return Response.json(
        {
          error: "no_client",
          detail: "No active client for Source stage advancement",
        },
        { status: 403 },
      );
    }

    const supabase = getAzureReadFluentClient();
    const resolvedEventId = await resolveSourceEventUuidForClient(
      eventId,
      effectiveClientKey,
    ).catch(() => null);
    const persistedEventLookupId = resolvedEventId ?? eventId;
    const { data: persistedEvent, error: fetchError } = await supabase
      .from("source_events")
      .select("id, client_key, current_stage_key, lifecycle_state")
      .eq("id", persistedEventLookupId)
      .maybeSingle();

    if (fetchError) {
      return Response.json(
        { error: "lookup_failed", detail: fetchError.message },
        { status: 500 },
      );
    }

    const canonicalAdminFallbackAllowed =
      !activeClient &&
      isCanonicalClientAdminEmail(currentUser?.email) &&
      Boolean(persistedEvent) &&
      persistedEvent?.client_key === effectiveClientKey;
    const accessPolicy =
      tenancy && activeClient
        ? await loadUserSourceAccessPolicy(tenancy, {
            activeClientKey: activeClient.key,
            sourceEventId: persistedEvent?.id ?? eventId,
          }).catch(() => null)
        : null;
    const canAdvance = Boolean(
      accessPolicy?.canApproveSourceStages || canonicalAdminFallbackAllowed,
    );
    const strictMode = isGateApprovalStrictMode();
    if (!canAdvance) {
      return Response.json(
        {
          error: "forbidden_source_stage_approval_required",
          detail:
            "Source stage approval rights are required to advance sourcing events.",
        },
        { status: 403 },
      );
    }

    if (persistedEvent) {
      if (persistedEvent.client_key !== effectiveClientKey) {
        return Response.json(
          { error: "not_found", detail: `No source event with id ${eventId}` },
          { status: 404 },
        );
      }

      await scaffoldNewEventSubstrate(
        persistedEvent.id,
        persistedEvent.client_key,
      ).catch((error) => {
        console.warn(
          "[source stage] substrate scaffold repair failed:",
          error instanceof Error ? error.message : String(error),
        );
      });
      const currentStage =
        normalizeSourceStageKey(persistedEvent.current_stage_key) ?? "strategy";
      const currentActorUserId =
        currentUser?.personId ?? currentUser?.clerkUserId ?? null;
      const canPilotSelfApprove =
        selfApproveIfAuthorized && canAdvance && !strictMode;
      if (
        selfApproveIfAuthorized &&
        strictMode &&
        !isStrictModeApprovalRole(tenancy?.role ?? currentUser?.primaryRole)
      ) {
        return Response.json(
          {
            error: "forbidden",
            detail:
              "GATE_APPROVAL_STRICT_MODE is enabled — self-approval requires an admin or maestro role and a separate approver.",
          },
          { status: 403 },
        );
      }
      if (selfApproveIfAuthorized && strictMode) {
        return Response.json(
          {
            error: "forbidden",
            detail:
              "GATE_APPROVAL_STRICT_MODE is enabled — same-person self-approval is not allowed for Source stage advancement.",
          },
          { status: 403 },
        );
      }
      const [
        { data: criterionRows, error: criteriaError },
        { data: artifactRows, error: artifactError },
        { data: evidenceRows, error: evidenceError },
      ] = await Promise.all([
        supabase
          .from("source_event_gate_criterion_states")
          .select("*")
          .eq("source_event_id", persistedEvent.id),
        supabase
          .from("source_event_artifact_states")
          .select("*")
          .eq("source_event_id", persistedEvent.id)
          .eq("stage_key", currentStage),
        supabase
          .from("source_event_evidence_states")
          .select("*")
          .eq("source_event_id", persistedEvent.id)
          .eq("stage_key", currentStage),
      ]);
      if (criteriaError) {
        return Response.json(
          { error: "lookup_failed", detail: criteriaError.message },
          { status: 500 },
        );
      }
      if (artifactError) {
        return Response.json(
          { error: "lookup_failed", detail: artifactError.message },
          { status: 500 },
        );
      }
      if (evidenceError) {
        return Response.json(
          { error: "lookup_failed", detail: evidenceError.message },
          { status: 500 },
        );
      }

      const criteria = (
        (criterionRows ?? []) as SourceEventGateCriterionStateRow[]
      ).map(gateCriterionStateRowToView);
      const artifacts = (
        (artifactRows ?? []) as SourceEventArtifactStateRow[]
      ).map(artifactStateRowToView);
      const evidence = (
        (evidenceRows ?? []) as SourceEventEvidenceStateRow[]
      ).map(evidenceStateRowToView);
      const gateContract = evaluateSourceGateAdvanceContract({
        currentStage,
        targetStage: stageKey,
        confirmations: body.confirmations,
        criteria,
        artifacts,
        evidence,
        reason,
        allowComputedReadinessBypass: canPilotSelfApprove,
      });
      if (!gateContract.ok) {
        return Response.json(
          {
            error: gateContract.error,
            detail: gateContract.detail,
            missingConfirmations: gateContract.missingConfirmations,
            blockers: gateContract.readiness.blockers,
          },
          { status: gateContract.status },
        );
      }
      if (gateContract.bypassedGovernanceBlockers.length > 0) {
        console.warn(
          "[source stage] pilot self-approval bypassed governance blockers:",
          gateContract.bypassedGovernanceBlockers
            .map((blocker) => blocker.detail)
            .join(" | "),
        );
      }

      // DB write routed through the data-plane write seam (Slice 3b).
      const sourceWrite = selectSourceWriteAdapter(
        undefined,
        effectiveClientKey,
      );
      const nowIso = new Date().toISOString();
      const stageWrite = await sourceWrite.updateStage({
        eventId: persistedEvent.id,
        clientKey: effectiveClientKey,
        stageKey,
        lifecycleState: "active",
        updatedAtIso: nowIso,
      });

      if (!stageWrite.ok) {
        return Response.json(
          { error: "update_failed", detail: stageWrite.error },
          { status: 500 },
        );
      }

      const autoAssessmentWrite = await getStageSubstrate(
        persistedEvent.id,
        stageKey,
      )
        .then((substrate) =>
          persistAutoAssessment({
            eventId: persistedEvent.id,
            clientKey: effectiveClientKey,
            fromStage: stageKey,
            criteria: substrate.criteria,
            artifacts: substrate.artifacts,
            evidence: substrate.evidence,
          }),
        )
        .catch((error) => {
          console.error(
            "[source stage] auto-assessment persistence failed:",
            error instanceof Error ? error.message : String(error),
          );
          return null;
        });

      const activityWrite = await sourceWrite.insertActivityLog({
        eventId: persistedEvent.id,
        clientKey: effectiveClientKey,
        actorUserId: currentActorUserId,
        actorDisplayName: currentUser?.name ?? currentUser?.email ?? null,
        actorRole: currentUser?.primaryRole ?? null,
        actionType: "stage_promoted",
        actionLabel: `Promoted Source event from ${currentStage} to ${stageKey}`,
        stageKey,
        reason,
        metadata: {
          fromStage: currentStage,
          toStage: stageKey,
          selfApproved: canPilotSelfApprove,
          autoAssessment: autoAssessmentWrite,
          bypassedGovernanceBlockers: gateContract.bypassedGovernanceBlockers,
        },
        occurredAtIso: nowIso,
      });
      if (!activityWrite.ok) {
        console.error(
          "[source stage activity] insert failed:",
          activityWrite.error,
        );
      }

      void autoDraftOnStageEntry(
        {
          eventId: persistedEvent.id,
          clientKey: effectiveClientKey,
          enteredStage: currentStage,
        },
        { request: req },
      ).catch((error) => {
        console.error(
          "[source stage] auto-draft failed:",
          error instanceof Error ? error.message : String(error),
        );
      });

      return Response.json({
        ok: true,
        eventId: persistedEvent.id,
        stageKey,
        persisted: true,
      });
    }

    const event = getSourceEventSeed(eventId);
    if (!event) {
      return Response.json(
        { error: "not_found", detail: `No source event with id ${eventId}` },
        { status: 404 },
      );
    }

    setStageOverride(eventId, stageKey as SourceStageKey);

    return Response.json({ ok: true, eventId, stageKey, persisted: false });
  } catch (err) {
    console.error("[PATCH /api/v1/source/:eventId/stage]", err);
    return Response.json({ error: "internal_error" }, { status: 500 });
  }
}
