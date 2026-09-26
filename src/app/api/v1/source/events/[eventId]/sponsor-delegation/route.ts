import { clerkClient } from "@clerk/nextjs/server";
import { getActiveClientRow } from "@/lib/active-client";
import { requireTenancy, tenancyErrorResponse } from "@/lib/auth/tenancy";
import { getCurrentUser } from "@/lib/auth/current-user";
import { loadUserSourceAccessPolicy } from "@/lib/auth/source-access-policy";
import { getAzureReadFluentClient } from "@/lib/data-plane/postgresCompat";
import { isApprovedTestRecipient } from "@/lib/source/notifications/approval-recipient-policy";
import { sendSponsorDelegationNotice } from "@/lib/source/notifications/sponsor-delegation-notice";
import {
  appendSponsorDelegationAcknowledgement,
  appendSponsorDelegationNotice,
  hasVerifiedSponsorDelegation,
  isAssignedSponsorDelegate,
  readAssignedSponsorUserId,
  readCurrentScopeArtifactVersion,
} from "@/lib/source/sponsor-delegation-repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ eventId: string }> };

async function participantIdentity(userId: string): Promise<{ name: string; email: string } | null> {
  const clerkId = userId.startsWith("clerk:") ? userId.slice(6) : userId;
  if (clerkId.startsWith("user_")) {
    const user = await (await clerkClient()).users.getUser(clerkId);
    const name = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
    const email = user.primaryEmailAddress?.emailAddress?.trim();
    return name && email ? { name, email } : null;
  }
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) return null;
  const { data, error } = await getAzureReadFluentClient()
    .from("persons")
    .select("name, email")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  const name = data?.name?.trim();
  const email = data?.email?.trim();
  return name && email ? { name, email } : null;
}

async function contextForEvent(eventId: string) {
  const tenancy = await requireTenancy();
  const activeClient = await getActiveClientRow();
  if (!activeClient) return { error: Response.json({ error: "no_client" }, { status: 403 }) };
  const policy = await loadUserSourceAccessPolicy(tenancy, {
    activeClientKey: activeClient.key,
    sourceEventId: eventId,
  });
  if (policy.accessLevel === "no_source_access" || policy.accessLevel === "source_viewer" ||
    (policy.sourceEventIdsAllowed !== null &&
      policy.sourceEventIdsAllowed !== undefined &&
      !policy.sourceEventIdsAllowed.includes(eventId))) {
    return { error: Response.json({ error: "forbidden" }, { status: 403 }) };
  }
  const { data: event, error } = await getAzureReadFluentClient()
    .from("source_events")
    .select("id, client_key, event_name, current_stage_key")
    .eq("id", eventId)
    .eq("client_key", activeClient.key)
    .maybeSingle();
  if (error) throw error;
  if (!event) return { error: Response.json({ error: "not_found" }, { status: 404 }) };
  return { tenancy, activeClient, policy, event };
}

function actorIdentities(tenancy: { userId: string; clerkUserId?: string | null }): string[] {
  return [
    tenancy.userId,
    tenancy.clerkUserId ?? "",
    tenancy.clerkUserId ? `clerk:${tenancy.clerkUserId}` : "",
  ].filter(Boolean);
}

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const { eventId } = await params;
    const context = await contextForEvent(eventId);
    if (context.error) return context.error;
    const { activeClient, event, policy, tenancy } = context;
    const actorUserIds = actorIdentities(tenancy);
    const [sponsorUserId, scopeArtifact, verified, assignedDelegate] = await Promise.all([
      readAssignedSponsorUserId(eventId, activeClient.key),
      readCurrentScopeArtifactVersion(eventId, activeClient.key),
      hasVerifiedSponsorDelegation({ eventId, tenantKey: activeClient.key }),
      policy.canApproveSourceStages && policy.accessLevel !== "client_admin"
        ? isAssignedSponsorDelegate(eventId, activeClient.key, actorUserIds)
        : Promise.resolve(false),
    ]);
    const sponsorIdentity = sponsorUserId && !actorUserIds.includes(sponsorUserId)
      ? await participantIdentity(sponsorUserId)
      : null;
    const recipientReady = Boolean(sponsorIdentity && isApprovedTestRecipient(
      sponsorIdentity.email,
      process.env.SOURCE_APPROVAL_TEST_RECIPIENT_ALLOWLIST,
    ));
    return Response.json({
      verified,
      available: Boolean(process.env.SOURCE_SPONSOR_DELEGATION_SIGNING_KEY?.trim()),
      sponsorAssigned: Boolean(sponsorUserId),
      sponsorName: sponsorIdentity?.name ?? null,
      recipientReady,
      scopeArtifact: scopeArtifact ? { id: scopeArtifact.id, sha256: scopeArtifact.sha256 } : null,
      currentStage: event.current_stage_key,
      canDelegate: Boolean(process.env.SOURCE_SPONSOR_DELEGATION_SIGNING_KEY?.trim()) &&
        policy.canApproveSourceStages &&
        (policy.accessLevel === "client_admin" || assignedDelegate) &&
        sponsorUserId !== null && !actorUserIds.includes(sponsorUserId) && recipientReady,
    });
  } catch (error) {
    try { return tenancyErrorResponse(error); } catch { /* non-tenancy error */ }
    console.error("[source sponsor delegation GET]", error);
    return Response.json({ error: "internal_error" }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const { eventId } = await params;
    const context = await contextForEvent(eventId);
    if (context.error) return context.error;
    const { tenancy, activeClient, policy, event } = context;
    if (event.current_stage_key !== "scope") {
      return Response.json({ error: "scope_not_current" }, { status: 409 });
    }
    if (!policy.canApproveSourceStages) {
      return Response.json({ error: "delegate_approval_rights_required" }, { status: 403 });
    }
    if (!process.env.SOURCE_SPONSOR_DELEGATION_SIGNING_KEY?.trim()) {
      return Response.json({ error: "delegated_commitment_not_configured" }, { status: 503 });
    }
    const actorUserId = tenancy.userId;
    const actorUserIds = actorIdentities(tenancy);
    if (
      policy.accessLevel !== "client_admin" &&
      !(await isAssignedSponsorDelegate(eventId, activeClient.key, actorUserIds))
    ) {
      return Response.json({ error: "delegate_assignment_required" }, { status: 403 });
    }
    const body = await request.json().catch(() => null) as {
      acknowledged?: unknown;
      scopeArtifactId?: unknown;
      scopeArtifactSha256?: unknown;
    } | null;
    if (body?.acknowledged !== true ||
      typeof body.scopeArtifactId !== "string" ||
      typeof body.scopeArtifactSha256 !== "string") {
      return Response.json({ error: "explicit_acknowledgement_required" }, { status: 400 });
    }
    const [sponsorUserId, scopeArtifact, currentUser] = await Promise.all([
      readAssignedSponsorUserId(eventId, activeClient.key),
      readCurrentScopeArtifactVersion(eventId, activeClient.key),
      getCurrentUser(),
    ]);
    if (!sponsorUserId || actorUserIds.includes(sponsorUserId)) {
      return Response.json({ error: "distinct_sponsor_assignment_required" }, { status: 409 });
    }
    if (!scopeArtifact || scopeArtifact.id !== body.scopeArtifactId ||
      scopeArtifact.sha256 !== body.scopeArtifactSha256) {
      return Response.json({ error: "current_approved_scope_artifact_required" }, { status: 409 });
    }
    if (await hasVerifiedSponsorDelegation({ eventId, tenantKey: activeClient.key })) {
      return Response.json({ ok: true, verified: true, alreadyRecorded: true });
    }
    const identity = await participantIdentity(sponsorUserId);
    const delegateName = currentUser?.name?.trim();
    if (!identity || !delegateName || /^(user|test|unknown)$/i.test(identity.name)) {
      return Response.json({ error: "named_sponsor_and_delegate_required" }, { status: 409 });
    }
    if (!isApprovedTestRecipient(
      identity.email,
      process.env.SOURCE_APPROVAL_TEST_RECIPIENT_ALLOWLIST,
    )) {
      return Response.json({ error: "sponsor_recipient_not_allowed" }, { status: 403 });
    }

    const acknowledgementId = await appendSponsorDelegationAcknowledgement({
      eventId,
      actorUserId,
      sponsorUserId,
      scopeArtifact,
    });
    const base = process.env.NEXT_PUBLIC_APP_URL || "https://app.abarva.ai";
    const delivery = await sendSponsorDelegationNotice({
      sponsorEmail: identity.email,
      sponsorName: identity.name,
      delegateName,
      eventName: event.event_name?.trim() || `Sourcing event ${eventId}`,
      eventId,
      reviewUrl: `${base}/source/events/${encodeURIComponent(eventId)}?stage=scope`,
    });
    if (delivery.channel !== "email_sent" || !delivery.providerMessageId) {
      return Response.json({
        ok: true,
        verified: false,
        acknowledgementId,
        notification: delivery.channel,
      }, { status: 202 });
    }
    await appendSponsorDelegationNotice({
      eventId,
      actorUserId,
      sponsorUserId,
      acknowledgementId,
      providerMessageId: delivery.providerMessageId,
    });
    return Response.json({ ok: true, verified: true, acknowledgementId, notification: "email_sent" });
  } catch (error) {
    try { return tenancyErrorResponse(error); } catch { /* non-tenancy error */ }
    console.error("[source sponsor delegation POST]", error);
    return Response.json({ error: "internal_error" }, { status: 500 });
  }
}
