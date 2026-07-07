import { getActiveClientRow } from "@/lib/active-client";
import { requireTenancy, tenancyErrorResponse } from "@/lib/auth/tenancy";
import { loadUserSourceAccessPolicy } from "@/lib/auth/source-access-policy";
import { getAzureReadFluentClient } from "@/lib/data-plane/postgresCompat";
import { selectSourceWriteAdapter } from "@/lib/data-plane/write-adapters/sourceWriteAdapter";
import {
  firstGovernanceBlocker,
  normalizeApprovalReason,
  validateApprovalReason,
} from "@/lib/source/source-governance-enforcement";

interface ActionBody {
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
    return Response.json({ error: "no_client" }, { status: 403 });
  }

  const accessPolicy = await loadUserSourceAccessPolicy(tenancy, {
    activeClientKey: activeClient.key,
    sourceEventId: eventId,
  }).catch(() => null);
  if (!accessPolicy?.canApproveSourceStages) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }

  const body = (await request.json().catch(() => ({}))) as ActionBody;
  if (body.confirmed !== true) {
    return Response.json({ error: "confirmation_required" }, { status: 409 });
  }
  const reason = normalizeApprovalReason(body.notes);
  const reasonVerdict = validateApprovalReason(reason);
  if (!reasonVerdict.ok) {
    const blocker = firstGovernanceBlocker(reasonVerdict);
    return Response.json(
      { error: blocker.code, detail: blocker.detail },
      { status: 409 },
    );
  }

  const { data: event, error } = await getAzureReadFluentClient()
    .from("source_events")
    .select("id, lifecycle_state, client_key")
    .eq("id", eventId)
    .eq("client_key", activeClient.key)
    .single();
  if (error || !event) {
    return Response.json({ error: "not_found" }, { status: 404 });
  }

  const sourceWrite = selectSourceWriteAdapter(undefined, activeClient.key);
  const transition = await sourceWrite.transitionLifecycle({
    eventId,
    clientKey: activeClient.key,
    lifecycleState: "draft_revision",
    updatedAtIso: new Date().toISOString(),
  });
  if (!transition.ok) {
    return Response.json(
      { error: "update_failed", detail: transition.error },
      { status: 500 },
    );
  }

  await sourceWrite.insertActivityLog({
    eventId,
    clientKey: activeClient.key,
    actorUserId: tenancy.userId,
    actorDisplayName: tenancy.email ?? tenancy.userId,
    actorRole: tenancy.role ?? accessPolicy.accessLevel,
    actionType: "source_event_changes_requested",
    actionLabel: "Source intake changes requested",
    reason,
    metadata: {
      fromState: event.lifecycle_state,
      toState: "draft_revision",
    },
    occurredAtIso: new Date().toISOString(),
  });

  return Response.json({
    ok: true,
    eventId,
    newLifecycleState: "draft_revision",
    redirectTo: `/source/new?eventId=${encodeURIComponent(eventId)}`,
  });
}
