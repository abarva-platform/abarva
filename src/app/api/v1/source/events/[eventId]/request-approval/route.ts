// POST /api/v1/source/events/{eventId}/request-approval
//
// Fire an approval-request email so a Source approver is notified that a
// sourcing event is waiting for their approval. Pilot-safe: the email
// channel logs a structured record (and returns a `console-*` id) when
// RESEND_API_KEY is not configured, so approvals can be simulated
// end-to-end by email during testing without a live provider.
//
// This is an explicit, operator-triggered notification — it is NOT yet
// auto-fired on gate state changes.

import { requireTenancy, tenancyErrorResponse } from '@/lib/auth/tenancy';
import { getActiveClientRow } from '@/lib/active-client';
import { loadUserSourceAccessPolicy } from '@/lib/auth/source-access-policy';
import { getAzureReadFluentClient } from '@/lib/data-plane/postgresCompat';
import { clerkClient } from '@clerk/nextjs/server';
import {
  isApprovedTestRecipient,
  soleApprovalParticipant,
  soleSponsorApprovalParticipant,
  type ApprovalParticipant,
} from '@/lib/source/notifications/approval-recipient-policy';
import { sendApprovalRequestEmail } from '@/lib/source/notifications/approval-request';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface Body {
  approvalKind?: 'stage_gate' | 'sponsor_commitment';
  stageLabel?: string;
  stageKey?: string;
  approverEmail?: string;
}

async function participantIdentity(userId: string): Promise<{ name: string; email: string } | null> {
  if (userId.startsWith('user_')) {
    const user = await (await clerkClient()).users.getUser(userId);
    const name = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
    const email = user.primaryEmailAddress?.emailAddress?.trim();
    return name && email ? { name, email } : null;
  }
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
    return null;
  }
  const { data, error } = await getAzureReadFluentClient()
    .from('persons')
    .select('name, email')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  const name = data?.name?.trim();
  const email = data?.email?.trim();
  return name && email ? { name, email } : null;
}

export async function POST(req: Request, ctxParam: { params: Promise<{ eventId: string }> }) {
  try {
    const ctx = await requireTenancy();
    const { eventId } = await ctxParam.params;
    if (!eventId?.trim()) {
      return Response.json({ error: 'bad_request', detail: 'eventId is required.' }, { status: 400 });
    }

    const activeClient = await getActiveClientRow();
    if (!activeClient) return Response.json({ error: 'no_client' }, { status: 403 });
    const policy = await loadUserSourceAccessPolicy(ctx, {
      activeClientKey: activeClient.key,
      sourceEventId: eventId,
    });
    if (policy.accessLevel === 'no_source_access' || policy.accessLevel === 'source_viewer' ||
      (policy.sourceEventIdsAllowed !== null && !policy.sourceEventIdsAllowed.includes(eventId))) {
      return Response.json({ error: 'forbidden' }, { status: 403 });
    }

    let body: Body = {};
    try {
      body = (await req.json()) as Body;
    } catch {
      // Tolerate a missing/empty body — fall back to defaults below.
      body = {};
    }

    if (body.approverEmail !== undefined) {
      return Response.json({ error: 'recipient_must_be_event_participant' }, { status: 400 });
    }
    if (body.approvalKind !== undefined &&
      body.approvalKind !== 'stage_gate' && body.approvalKind !== 'sponsor_commitment') {
      return Response.json({ error: 'invalid_approval_kind' }, { status: 400 });
    }

    const db = getAzureReadFluentClient();
    const { data: event, error: eventError } = await db
      .from('source_events')
      .select('id, event_name, client_key')
      .eq('id', eventId)
      .eq('client_key', activeClient.key)
      .maybeSingle();
    if (eventError) throw eventError;
    if (!event) return Response.json({ error: 'not_found' }, { status: 404 });

    const { data: participantRows, error: participantError } = await db
      .from('source_event_participants')
      .select('user_id, role, approval_authority, can_approve_source_stages')
      .eq('source_event_id', eventId)
      .eq('client_key', event.client_key);
    if (participantError) throw participantError;
    const sponsorRequest = body.approvalKind === 'sponsor_commitment';
    const participant = sponsorRequest
      ? soleSponsorApprovalParticipant((participantRows ?? []) as ApprovalParticipant[])
      : soleApprovalParticipant((participantRows ?? []) as ApprovalParticipant[]);
    if (!participant?.user_id) {
      return Response.json({ error: sponsorRequest ? 'sponsor_assignment_required' : 'approver_assignment_required' }, { status: 409 });
    }
    const identity = await participantIdentity(participant.user_id);
    if (!identity || /^(user|test|unknown)$/i.test(identity.name)) {
      return Response.json({ error: 'named_approver_required' }, { status: 409 });
    }

    // Until tenant-level notification provenance is authoritative, the pilot
    // lane permits only explicitly listed internal recipients for every tenant.
    if (!isApprovedTestRecipient(
      identity.email,
      process.env.SOURCE_APPROVAL_TEST_RECIPIENT_ALLOWLIST,
    )) {
      return Response.json({ error: 'test_recipient_not_allowed' }, { status: 403 });
    }

    const eventName = event.event_name?.trim() || `Sourcing event ${eventId}`;
    const stageLabel = sponsorRequest ? 'Sponsor commitment' : body.stageLabel?.trim() || 'Stage gate';
    const stageKey = sponsorRequest ? 'scope' : body.stageKey?.trim();

    const base = process.env.NEXT_PUBLIC_APP_URL || 'https://app.abarva.ai';
    const reviewUrl = stageKey
      ? `${base}/source/events/${encodeURIComponent(eventId)}?stage=${encodeURIComponent(stageKey)}`
      : `${base}/source/events/${encodeURIComponent(eventId)}/approval`;

    const result = await sendApprovalRequestEmail({
      approvalKind: sponsorRequest ? 'sponsor_commitment' : 'stage_gate',
      eventId,
      eventName,
      stageLabel,
      reviewUrl,
      approverEmail: identity.email,
      requestedBy: ctx.userId,
      tenantName: activeClient.key,
    });

    return Response.json(
      {
        ok: result.delivered,
        channel: result.channel,
        to: result.to,
        id: result.id ?? null,
        error: result.error ?? null,
      },
      { status: result.delivered ? 200 : 502 },
    );
  } catch (err) {
    try {
      return tenancyErrorResponse(err);
    } catch {
      /* not a tenancy error */
    }
    console.error('[POST /api/v1/source/events/[eventId]/request-approval]', err);
    return Response.json({ error: 'internal_error' }, { status: 500 });
  }
}
