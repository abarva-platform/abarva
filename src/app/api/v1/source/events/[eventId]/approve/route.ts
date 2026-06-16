// POST /api/v1/source/events/[eventId]/approve
//
// Client-scoped Source approval endpoint: review and approve (or reject)
// a sourcing event created via the commit_source_event tool. On approval
// the event's lifecycle_state advances to 'active'; on rejection it moves
// to 'archived'. An approval record is written to source_event_approvals.

import { getAzureReadFluentClient } from "@/lib/data-plane/postgresCompat";
import { requireTenancy, tenancyErrorResponse } from "@/lib/auth/tenancy";
import { getActiveClientRow } from "@/lib/active-client";
import { loadUserSourceAccessPolicy } from "@/lib/auth/source-access-policy";
import { selectSourceWriteAdapter } from "@/lib/data-plane/write-adapters/sourceWriteAdapter";
import { isFeatureEnabled } from "@/lib/features/is-feature-enabled";
import {
  firstGovernanceBlocker,
  normalizeApprovalReason,
  validateApprovalReason,
} from "@/lib/source/source-governance-enforcement";
import { autoDraftOnStageEntry } from "@/lib/source/stage-entry-autodraft";

interface ApproveBody {
  action: "approve" | "reject";
  notes?: string;
  confirmed?: boolean;
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

  if (body.action !== "approve" && body.action !== "reject") {
    return Response.json(
      {
        error: "invalid_action",
        detail: 'action must be "approve" or "reject"',
      },
      { status: 400 },
    );
  }
  if (body.confirmed !== true) {
    return Response.json(
      {
        error: "confirmation_required",
        detail:
          "A confirmation step is required before approving or rejecting a Source event.",
      },
      { status: 409 },
    );
  }
  const reason = normalizeApprovalReason(body.notes);
  const reasonVerdict = validateApprovalReason(reason);
  if (!reasonVerdict.ok) {
    const blocker = firstGovernanceBlocker(reasonVerdict);
    return Response.json(
      {
        error: blocker.code,
        detail: blocker.detail,
        blockers: reasonVerdict.blockers,
      },
      { status: 409 },
    );
  }

  const supabase = getAzureReadFluentClient();

  // Fetch the event to check it exists and get current state
  const { data: event, error: fetchError } = await supabase
    .from("source_events")
    .select(
      "id, lifecycle_state, event_name, event_code, client_key, created_by_user_id",
    )
    .eq("id", eventId)
    .eq("client_key", activeClient.key)
    .single();

  if (fetchError || !event) {
    return Response.json({ error: "not_found" }, { status: 404 });
  }

  const fromState = event.lifecycle_state as string;
  const toState = body.action === "approve" ? "active" : "closed_rejected";
  const isSelfApproval = event.created_by_user_id === tenancy.userId;
  const approvalNotes = [
    reason,
    isSelfApproval
      ? "Self-approval notice: approver is also the recorded event creator."
      : null,
  ]
    .filter(Boolean)
    .join("\n\n");

  // DB write routed through the data-plane write seam (Slice 3b): the
  // lifecycle update + the append-only approval record. On Azure the two
  // run in one transaction; on Supabase they apply individually as before.
  // A failed approval insert stays non-fatal (logged inside the adapter).
  const sourceWrite = selectSourceWriteAdapter(undefined, activeClient.key);
  const approvalWrite = await sourceWrite.applyApproval({
    eventId,
    clientKey: activeClient.key,
    fromState,
    toState,
    approvalAction: body.action === "approve" ? "admin_review" : "rejected",
    approvedByUserId: tenancy.userId,
    notes: approvalNotes,
  });

  if (!approvalWrite.ok) {
    return Response.json(
      { error: "update_failed", detail: approvalWrite.error },
      { status: 500 },
    );
  }

  await sourceWrite.insertActivityLog({
    eventId,
    clientKey: activeClient.key,
    actorUserId: tenancy.userId,
    actorDisplayName: tenancy.email ?? tenancy.userId,
    actorRole: tenancy.role ?? accessPolicy.accessLevel ?? "Source approver",
    actionType:
      body.action === "approve"
        ? "source_event_approved"
        : "source_event_rejected",
    actionLabel:
      body.action === "approve"
        ? "Source event approved"
        : "Source event rejected",
    reason,
    metadata: {
      fromState,
      toState,
      selfApproval: isSelfApproval,
    },
    occurredAtIso: new Date().toISOString(),
  });

  // Strategy-at-P0 (flag: source_strategy_at_p0): fold Strategy into the
  // origination gate. On approval the event advances straight to Scope and the
  // three GATE-STRATEGY criteria are waived with an audit reason — the strategy
  // is set and endorsed at this approval (which the sponsor co-signs), so there
  // is no separate Strategy to-do page; the rail shows Strategy done. Best-
  // effort: a failure here leaves the standard Strategy stage intact (a safe
  // fallback) and never fails the approval itself.
  let advancedToStage: string | null = null;
  if (
    body.action === "approve" &&
    isFeatureEnabled(
      { clientKey: activeClient.key, clientId: activeClient.id ?? null },
      "source_strategy_at_p0",
    )
  ) {
    const nowIso = new Date().toISOString();
    try {
      const stageWrite = await sourceWrite.updateStage({
        eventId,
        clientKey: activeClient.key,
        stageKey: "scope",
        lifecycleState: toState,
        updatedAtIso: nowIso,
      });
      if (stageWrite.ok) advancedToStage = "scope";

      const { data: strategyRows } = await supabase
        .from("source_event_gate_criterion_states")
        .select("id, criterion_id")
        .eq("source_event_id", eventId)
        .in("criterion_id", [
          "GATE-STRATEGY-01",
          "GATE-STRATEGY-02",
          "GATE-STRATEGY-03",
        ]);

      for (const row of strategyRows ?? []) {
        await sourceWrite.updateGateCriterion({
          criterionRowId: String((row as { id: string }).id),
          state: "waived",
          reviewerUserId: tenancy.userId,
          reviewedAtIso: nowIso,
          notes:
            "Strategy set and endorsed at P0 origination (intake approval, sponsor co-signed); folded into the approval gate — no separate Strategy stage.",
          updatedAtIso: nowIso,
        });
      }
    } catch (err) {
      console.error(
        "[POST /api/v1/source/:eventId/approve] strategy_at_p0_failed",
        {
          eventId,
          message: err instanceof Error ? err.message : String(err),
        },
      );
    }

    if (advancedToStage === "scope") {
      void (async () => {
        await autoDraftOnStageEntry(
          {
            eventId,
            clientKey: activeClient.key,
            enteredStage: "strategy",
          },
          { request },
        );
        await autoDraftOnStageEntry(
          {
            eventId,
            clientKey: activeClient.key,
            enteredStage: "scope",
          },
          { request },
        );
      })().catch((error) => {
        console.error(
          "[POST /api/v1/source/:eventId/approve] strategy_at_p0_autodraft_failed",
          {
            eventId,
            message: error instanceof Error ? error.message : String(error),
          },
        );
      });
    }
  }

  return Response.json({
    ok: true,
    eventId,
    action: body.action,
    newLifecycleState: toState,
    selfApproval: isSelfApproval,
    advancedToStage,
  });
}
