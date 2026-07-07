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
import { sendApprovalRequestEmail } from '@/lib/source/notifications/approval-request';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface Body {
  eventName?: string;
  stageLabel?: string;
  stageKey?: string;
  approverEmail?: string;
}

export async function POST(req: Request, ctxParam: { params: Promise<{ eventId: string }> }) {
  try {
    const ctx = await requireTenancy();
    const { eventId } = await ctxParam.params;
    if (!eventId?.trim()) {
      return Response.json({ error: 'bad_request', detail: 'eventId is required.' }, { status: 400 });
    }

    let body: Body = {};
    try {
      body = (await req.json()) as Body;
    } catch {
      // Tolerate a missing/empty body — fall back to defaults below.
      body = {};
    }

    const eventName = body.eventName?.trim() || `Sourcing event ${eventId}`;
    const stageLabel = body.stageLabel?.trim() || 'Stage gate';
    const stageKey = body.stageKey?.trim();

    const base = process.env.NEXT_PUBLIC_APP_URL || 'https://app.abarva.ai';
    const reviewUrl = stageKey
      ? `${base}/source/events/${encodeURIComponent(eventId)}?stage=${encodeURIComponent(stageKey)}`
      : `${base}/source/events/${encodeURIComponent(eventId)}/approval`;

    const result = await sendApprovalRequestEmail({
      eventId,
      eventName,
      stageLabel,
      reviewUrl,
      approverEmail: body.approverEmail ?? null,
      requestedBy: ctx.userId,
      tenantName: ctx.clientKey ?? null,
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
