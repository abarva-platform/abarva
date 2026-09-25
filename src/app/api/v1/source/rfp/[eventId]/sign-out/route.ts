// POST /api/v1/source/rfp/:eventId/sign-out
//
// Revokes ONE session. Deliberately not all sessions for the credential: the
// credential is shared, and signing out on your laptop must not log out a
// colleague mid-upload.

import { NextRequest, NextResponse } from 'next/server';
import { sessionCookieName, hashToken } from '@/lib/source/vendor-portal/session';
import { resolveVendorBySession, revokeSession, recordVendorEvent } from '@/lib/source/vendor-portal/dao';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> },
) {
  const { eventId } = await params;
  const cookie = sessionCookieName(eventId);
  const token = req.cookies.get(cookie)?.value ?? '';
  if (token) {
    const vendor = await resolveVendorBySession(eventId, token);
    await revokeSession(hashToken(token));
    if (vendor) {
      await recordVendorEvent({
        vendorId: vendor.id,
        tenantKey: vendor.tenantKey,
        type: 'signed_out',
      });
    }
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(cookie, '', { path: `/rfp/${eventId}`, expires: new Date(0) });
  return res;
}
