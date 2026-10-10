// POST /api/v1/source/rfp/:eventId/acknowledge
//
// The step with legal weight: a vendor stating, against a deadline, whether it
// intends to compete. Everything about this route treats that as evidence.

import { NextRequest, NextResponse } from 'next/server';
import { sessionCookieName, hashIp } from '@/lib/source/vendor-portal/session';
import { resolveVendorAccess } from '@/lib/source/vendor-portal/access';
import {
  resolveVendorBySession,
  recordAcknowledgement,
  recordVendorEvent,
} from '@/lib/source/vendor-portal/dao';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> },
) {
  const { eventId } = await params;
  const token = req.cookies.get(sessionCookieName(eventId))?.value ?? '';
  const vendor = await resolveVendorBySession(eventId, token);
  if (!vendor) {
    return NextResponse.json({ ok: false, error: 'not_signed_in' }, { status: 401 });
  }

  // Re-check the gate on the server against stored timestamps. The UI hides the
  // form once acceptance closes; that is a convenience, not the control.
  const access = resolveVendorAccess({
    invitationState: vendor.invitationState,
    acceptBy: vendor.acceptBy,
    respondBy: vendor.respondBy,
  });
  if (!access.canAcknowledge) {
    return NextResponse.json(
      { ok: false, error: access.denial ?? 'not_available' },
      { status: 409 },
    );
  }

  let body: {
    intendsToRespond?: boolean;
    declaredName?: string;
    declaredTitle?: string;
    declaredEmail?: string;
    declineReason?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'bad_request' }, { status: 400 });
  }

  const declaredName = (body.declaredName ?? '').trim();
  const declaredTitle = (body.declaredTitle ?? '').trim();
  const declaredEmail = (body.declaredEmail ?? '').trim();
  if (typeof body.intendsToRespond !== 'boolean') {
    return NextResponse.json({ ok: false, error: 'intent_required' }, { status: 400 });
  }
  // Required in BOTH directions. A decline is as evidentially significant as an
  // acceptance — it is the record that a bidder was invited and chose not to
  // compete, and a contested award may turn on exactly that.
  if (!declaredName || !declaredTitle || !declaredEmail) {
    return NextResponse.json({ ok: false, error: 'declared_contact_required' }, { status: 400 });
  }

  const ok = await recordAcknowledgement({
    vendorId: vendor.id,
    intendsToRespond: body.intendsToRespond,
    declaredName,
    declaredTitle,
    declaredEmail,
    ...(body.declineReason ? { declineReason: body.declineReason.trim() } : {}),
  });
  if (!ok) {
    // The update is conditioned on invitation_state = 'invited', so a false here
    // usually means someone else on the vendor's team answered first. That is a
    // normal race on a SHARED credential, not an error.
    return NextResponse.json({ ok: false, error: 'already_answered' }, { status: 409 });
  }

  await recordVendorEvent({
    vendorId: vendor.id,
    tenantKey: vendor.tenantKey,
    type: body.intendsToRespond ? 'acknowledged' : 'declined',
    ipHash: hashIp(req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null),
    payload: {
      declaredName,
      declaredTitle,
      declaredEmail,
      // Flag it at the point of storage so nothing downstream mistakes this for
      // a verified identity.
      identityBasis: 'self_declared_shared_credential',
    },
  });

  return NextResponse.json({ ok: true, invitationState: body.intendsToRespond ? 'accepted' : 'declined' });
}
