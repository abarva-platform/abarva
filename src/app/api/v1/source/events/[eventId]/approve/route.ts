// POST /api/v1/source/events/[eventId]/approve
//
// Client-scoped Source approval endpoint. EVERY stage gate is a real approval
// that advances the event to the next stage in the event's resolved journey.
// The event-creation approval IS the strategy gate (attests the reviewer read the
// auto-generated strategy memo, the value target, and the archetype + rigor call)
// and advances strategy → scope; approving on any later stage advances to that
// stage's successor. Confirmations are validated
// against the CURRENT stage's gate keys, not a hardcoded strategy set.
//
// Actions:
//   approve   → lifecycle_state 'active' while work remains, or 'completed'
//               on the resolved journey's terminal stage; requires the current
//               stage's confirmations and otherwise advances to the next stage.
//   send_back → stays 'waiting_on_client'; the reviewer's comment is recorded
//               so the creator can revise.
//   reject    → lifecycle_state 'archived'.
// An approval record is written to source_event_approvals in every case.

import { getAzureReadFluentClient } from "@/lib/data-plane/postgresCompat";
import { after } from "next/server";
import { requireTenancy, tenancyErrorResponse } from "@/lib/auth/tenancy";
import { getActiveClientRow } from "@/lib/active-client";
import { loadUserSourceAccessPolicy } from "@/lib/auth/source-access-policy";
import {
  isGateApprovalStrictMode,
  isStrictModeApprovalRole,
} from "@/lib/auth/gate-approval-strict-mode";
import { selectSourceWriteAdapter } from "@/lib/data-plane/write-adapters/sourceWriteAdapter";
import {
  evaluateSourceApprovalDecision,
  type SourceStageConfirmations,
} from "@/lib/source/approval-decision";
import { confirmationKeysForStage } from "@/lib/source/stage-gate-confirmations";
import { autoDraftOnStageEntry } from "@/lib/source/stage-entry-autodraft";
import { getStageSubstrate } from "@/lib/source/canvas-substrate/queries";
import { normalizeSourceStageKey } from "@/lib/source/constants";
import { evaluateSourceGateAdvanceContract } from "@/lib/source/gate-advance-contract";
import { hasVerifiedSponsorDelegation } from "@/lib/source/sponsor-delegation-repository";
import {
  coerceStageToSourceJourney,
  getSourceJourneyForEvent,
  nextSourceStageForJourney,
  sourceJourneyStageKeys,
} from "@/lib/source/sourcing-motion-journeys";
import { getContractOptimizationProfile } from "@/lib/source/contract-optimization/read";
import {
  normalizeApprovalReason,
  validateApprovalReason,
} from "@/lib/source/source-governance-enforcement";
import { readSourceAuthorityVersionState } from "@/lib/source/new-workspace/authority-version-store";

// Every lifecycle decision gets its own action type, so the activity table can
// be read without inferring the decision from the reason text.
const ACTIVITY_ACTION_TYPE = {
  approve: "source_event_approved",
  reject: "source_event_rejected",
  send_back: "source_event_sent_back",
} as const;

const ACTIVITY_ACTION_LABEL = {
  approve: "Approved the event stage gate",
  reject: "Rejected the event",
  send_back: "Sent the event back for changes",
} as const;

interface ApproveBody {
  action: "approve" | "reject" | "send_back";
  notes?: string;
  confirmations?: SourceStageConfirmations;
  selfApproveIfAuthorized?: boolean;
  requestAuthorityVersionId?: string;
}

/**
 * Fold the reviewer's free-text comment and the attested confirmations into a
 * single human-readable notes string for the append-only approval record.
 */
function composeApprovalNotes(
  comment: string | undefined,
  action: ApproveBody["action"],
  currentStageKey: string | null,
  isSelfApproval = false,
): string | null {
  const trimmed = comment?.trim();
  // The approval screen tells a self-approving creator that this decision is
  // flagged. The marker on the append-only record is what makes that true.
  const selfApprovalNotice = isSelfApproval
    ? "Self-approval notice: the approver is the recorded event creator."
    : null;
  const withNotice = (value: string | null) =>
    [selfApprovalNotice, value].filter(Boolean).join("\n\n") || null;
  if (action === "approve") {
    // Strategy approval is the P0 memo/value/archetype attestation; every other
    // stage attests that stage's gate boxes.
    const attest =
      currentStageKey === "strategy"
        ? "Confirmed review of strategy memo, value target, and archetype + rigor."
        : "Confirmed the stage gate: evidence complete, inputs reviewed, stage final.";
    return withNotice(trimmed ? `${attest}\n${trimmed}` : attest);
  }
  return withNotice(trimmed ? trimmed : null);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> },
) {
  const { eventId } = await params;

  let tenancy;
  try {
    tenancy = await requireTenancy();
  } catch (err) {
    return tenancyErrorResponse(err);
  }

  const activeClient = await getActiveClientRow();
  if (!activeClient) {
    return Response.json(
      { error: "no_client", detail: "No active client for Source approval" },
      { status: 403 },
    );
  }

  const accessPolicy = await loadUserSourceAccessPolicy(tenancy, {
    activeClientKey: activeClient.key,
    sourceEventId: eventId,
  }).catch(() => null);

  if (!accessPolicy?.canApproveSourceStages) {
    return Response.json(
      {
        error: "forbidden_source_admin_required",
        detail:
          "Client admin or explicit Source stage approval rights are required to approve sourcing events.",
      },
      { status: 403 },
    );
  }

  let body: ApproveBody;
  try {
    body = (await request.json()) as ApproveBody;
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }

  // Every decision this route commits is an audit record, so it needs the same
  // human rationale the sibling lifecycle routes (request-changes,
  // route-to-co-approver, the event PATCH) already require server-side. The
  // approval card and the admin queue check the same minimum in the browser;
  // a client-side check is not a control, and `reject` / `send_back` reached
  // the write with a null reason whenever a caller skipped the UI. Validated
  // before the event is read so a decision with no rationale touches nothing.
  //
  // The check lives here rather than in evaluateSourceApprovalDecision because
  // that pure function is also the confirmation gate for
  // evaluateSourceGateAdvanceContract, which answers stage readiness — a
  // different question from whether a human wrote down why they decided.
  const approvalReason = normalizeApprovalReason(body.notes);
  const reasonVerdict = validateApprovalReason(approvalReason);
  if (!reasonVerdict.ok) {
    const blocker = reasonVerdict.blockers[0];
    return Response.json(
      { error: blocker.code, detail: blocker.detail },
      { status: 409 },
    );
  }

  const supabase = getAzureReadFluentClient();

  // Fetch the event to check it exists and get current state + stage.
  const { data: event, error: fetchError } = await supabase
    .from("source_events")
    .select(
      "id, lifecycle_state, current_stage_key, event_name, event_code, event_type, sourcing_motion, classified_category, trigger_description, client_key, created_by_user_id",
    )
    .eq("id", eventId)
    .eq("client_key", activeClient.key)
    .single();

  if (fetchError || !event) {
    return Response.json({ error: "not_found" }, { status: 404 });
  }

  // Resolve the decision (validates action + confirmations, decides the
  // lifecycle transition and whether to advance the stage). Confirmations are
  // validated against the CURRENT stage's gate keys — not a hardcoded strategy
  // set — so an approve on any stage requires exactly that stage's boxes.
  const currentStageKey = event.current_stage_key as string | null;
  const currentStage = normalizeSourceStageKey(currentStageKey);
  const normalizedClientKey = activeClient.key.trim().toLowerCase();
  const hasContractOptimizationProfile = Boolean(
    await getContractOptimizationProfile(normalizedClientKey, eventId).catch(
      () => null,
    ),
  );
  const journey = getSourceJourneyForEvent({
    sourcingMotion: event.sourcing_motion as string | null,
    eventName: event.event_name as string | null,
    eventCode: event.event_code as string | null,
    eventType: event.event_type as string | null,
    classifiedCategory: event.classified_category as string | null,
    triggerDescription: event.trigger_description as string | null,
    hasContractOptimizationProfile,
  });
  const effectiveCurrentStage = currentStage
    ? coerceStageToSourceJourney(journey, currentStage, currentStage)
    : null;
  const nextStage = nextSourceStageForJourney(effectiveCurrentStage, journey);
  const decision = evaluateSourceApprovalDecision(
    body.action,
    body.confirmations,
    {
      currentStageKey: effectiveCurrentStage ?? currentStageKey,
      requiredConfirmationKeys: confirmationKeysForStage(
        effectiveCurrentStage ?? currentStageKey,
      ),
      nextStageKey: nextStage,
      isTerminalStage: effectiveCurrentStage !== null && nextStage === null,
    },
  );
  if (!decision.ok) {
    const status = decision.error === "confirmations_required" ? 422 : 400;
    return Response.json(
      {
        error: decision.error,
        detail: decision.detail,
        ...(decision.missingConfirmations
          ? { missingConfirmations: decision.missingConfirmations }
          : {}),
      },
      { status },
    );
  }

  const strictMode = isGateApprovalStrictMode();
  // Whether this is a self-approval is a fact about the event and the caller,
  // so the server derives it from the stored creator. The client flag stays
  // honoured for callers that send it, but omitting it no longer hides a
  // self-approval from the strict-mode gate or from the approval record.
  const isSelfApproval = Boolean(
    event.created_by_user_id && event.created_by_user_id === tenancy.userId,
  );
  const selfApprovalClaimed = body.selfApproveIfAuthorized === true;
  if ((selfApprovalClaimed || isSelfApproval) && strictMode) {
    if (!isStrictModeApprovalRole(tenancy.role)) {
      return Response.json(
        {
          error: "forbidden",
          detail:
            "GATE_APPROVAL_STRICT_MODE is enabled — self-approval requires an admin or maestro role and a separate approver.",
        },
        { status: 403 },
      );
    }
    return Response.json(
      {
        error: "forbidden",
        detail:
          "GATE_APPROVAL_STRICT_MODE is enabled — same-person self-approval is not allowed for Source stage advancement.",
      },
      { status: 403 },
    );
  }

  const isTerminalClosure =
    body.action === "approve" &&
    effectiveCurrentStage !== null &&
    nextStage === null;
  if (
    body.action === "approve" &&
    (decision.advanceStageTo || isTerminalClosure)
  ) {
    if (!effectiveCurrentStage) {
      return Response.json(
        {
          error: "invalid_stage",
          detail:
            "Current Source stage is not canonical; approval cannot advance it.",
        },
        { status: 409 },
      );
    }

    const substrate = await getStageSubstrate(eventId, effectiveCurrentStage);
    const gateContract = evaluateSourceGateAdvanceContract({
      currentStage: effectiveCurrentStage,
      targetStage: decision.advanceStageTo ?? null,
      isTerminalClosure,
      stageOrder: sourceJourneyStageKeys(journey),
      confirmations: body.confirmations,
      criteria: substrate.criteria,
      artifacts: substrate.artifacts,
      evidence: substrate.evidence,
      reason: body.notes,
      verifiedDelegatedSponsorAcknowledgement:
        effectiveCurrentStage === "scope"
          ? await hasVerifiedSponsorDelegation({
              eventId,
              tenantKey: activeClient.key,
            })
          : false,
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
  }

  const fromState = event.lifecycle_state as string;
  const toState = decision.toState!;
  const acceptsInitialRequest =
    body.action === "approve" &&
    fromState === "waiting_on_client" &&
    (effectiveCurrentStage ?? currentStageKey) === "strategy";
  let authorityApproval:
    | {
        authorityKind: "request";
        versionId: string;
        role: "request_acceptor";
        decision: "approved";
        actorUserId: string;
        reason: string;
      }
    | undefined;
  if (acceptsInitialRequest) {
    const requestAuthority = await readSourceAuthorityVersionState(
      eventId,
      normalizedClientKey,
      "request",
    );
    if (
      requestAuthority.kind !== "available" ||
      !requestAuthority.currentVersion
    ) {
      return Response.json(
        {
          error: "request_authority_unavailable",
          detail:
            "The current governed Request version is unavailable. Reload or repair the intake before approval.",
        },
        { status: 409 },
      );
    }
    if (
      !body.requestAuthorityVersionId ||
      body.requestAuthorityVersionId !== requestAuthority.currentVersion.id
    ) {
      return Response.json(
        {
          error: "request_authority_version_changed",
          detail:
            "The Request changed after this page loaded. Review the current version before approving.",
        },
        { status: 409 },
      );
    }
    authorityApproval = {
      authorityKind: "request",
      versionId: requestAuthority.currentVersion.id,
      role: "request_acceptor",
      decision: "approved",
      actorUserId: tenancy.userId,
      reason: approvalReason,
    };
  }

  // DB write routed through the data-plane write seam (Slice 3b): the
  // lifecycle update + the append-only approval record. On Azure the two
  // run in one transaction; on Supabase they apply individually as before.
  const approvalWrite = await selectSourceWriteAdapter(
    undefined,
    activeClient.key,
  ).applyApproval({
    eventId,
    clientKey: activeClient.key,
    fromState,
    toState,
    approvalAction: decision.approvalAction,
    approvedByUserId: tenancy.userId,
    notes: composeApprovalNotes(
      body.notes,
      body.action,
      effectiveCurrentStage ?? currentStageKey,
      isSelfApproval,
    ),
    stageKey: effectiveCurrentStage ?? currentStageKey,
    authorityApproval,
  });

  if (!approvalWrite.ok) {
    return Response.json(
      { error: "update_failed", detail: approvalWrite.error },
      { status: 500 },
    );
  }

  // The lifecycle decision belongs in the activity table alongside every other
  // Source action. It is written as soon as the approval record commits, not
  // after stage advancement: the human decided even if the advance then fails.
  // A failed activity write cannot fail the request — the decision is already
  // persisted — so it is logged loudly instead of swallowed.
  const activityWrite = await selectSourceWriteAdapter(
    undefined,
    activeClient.key,
  ).insertActivityLog({
    eventId,
    clientKey: activeClient.key,
    actorUserId: tenancy.userId,
    actorDisplayName: null,
    actorRole: tenancy.role ?? null,
    actionType: ACTIVITY_ACTION_TYPE[body.action],
    actionLabel: ACTIVITY_ACTION_LABEL[body.action],
    stageKey: effectiveCurrentStage ?? currentStageKey,
    reason: body.notes?.trim() || null,
    metadata: {
      fromState,
      toState,
      approvalAction: decision.approvalAction,
      selfApproval: isSelfApproval,
      intendedAdvanceStageTo: decision.advanceStageTo ?? null,
    },
    occurredAtIso: new Date().toISOString(),
  });
  if (!activityWrite.ok) {
    console.error(
      "[POST /api/v1/source/events/:eventId/approve] activity_insert_failed",
      { eventId, action: body.action, message: activityWrite.error },
    );
  }

  if (body.action === "approve" && effectiveCurrentStage) {
    // Gate approval materializes the approved stage's required, gate-defining
    // artifacts as AI-prepared drafts. Stage entry can still draft the next
    // stage through the stage API, but approval output belongs to the stage the
    // human just attested.
    after(async () => {
      try {
        await autoDraftOnStageEntry(
          {
            eventId,
            clientKey: activeClient.key,
            enteredStage: effectiveCurrentStage,
          },
          { request },
        );
      } catch (autoDraftError) {
        console.error(
          "[POST /api/v1/source/events/:eventId/approve] approved_stage_autodraft_failed",
          {
            eventId,
            approvedStage: effectiveCurrentStage,
            message:
              autoDraftError instanceof Error
                ? autoDraftError.message
                : autoDraftError,
          },
        );
      }
    });
  }

  // Advance the event to the next stage on approval (strategy→scope, scope→rfp,
  // …; no-op on the final `value` stage). A failed stage write fails closed so
  // the page never implies a gate advanced when the database says otherwise.
  let stageAdvancedTo: string | null = null;
  if (decision.advanceStageTo) {
    const stageWrite = await selectSourceWriteAdapter(
      undefined,
      activeClient.key,
    ).updateStage({
      eventId,
      clientKey: activeClient.key,
      stageKey: decision.advanceStageTo,
      lifecycleState: toState,
      updatedAtIso: new Date().toISOString(),
    });
    if (!stageWrite.ok) {
      console.error(
        "[POST /api/v1/source/events/:eventId/approve] stage_advance_failed",
        {
          eventId,
          message: stageWrite.error,
        },
      );
      return Response.json(
        {
          error: "stage_advance_failed",
          detail:
            "The approval was recorded, but the event could not advance to the next stage. Reload and retry; if it repeats, check the Source write adapter.",
        },
        { status: 500 },
      );
    } else {
      stageAdvancedTo = decision.advanceStageTo;
    }
  }

  return Response.json({
    ok: true,
    eventId,
    action: body.action,
    newLifecycleState: toState,
    stageAdvancedTo,
  });
}
