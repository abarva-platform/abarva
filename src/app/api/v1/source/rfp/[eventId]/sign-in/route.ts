// POST /api/v1/source/rfp/:eventId/sign-in
//
// Vendor-facing. NO Clerk session — the caller is outside the organisation.
// The credential is shared by a vendor's bid team, so this route must be
// forgiving of repeated attempts and unforgiving about what it reveals.

import { NextRequest, NextResponse } from 'next/server';
import { verifyPassword } from '@/lib/source/vendor-portal/credentials';
import { issueSession, sessionCookieName, hashIp } from '@/lib/source/vendor-portal/session';
import { backoffMs, isThrottled, recordFailure, shouldAlertInternally, type AttemptState } from '@/lib/source/vendor-portal/throttle';
import { findVendorForSignIn, createSession, recordVendorEvent } from '@/lib/source/vendor-portal/dao';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * In-process attempt state. Deliberately NOT persisted: a durable failure
 * counter is one schema change away from becoming a lockout, and a lockout on a
 * shared credential can remove a bidder from a live procurement. Losing this on
 * restart is the safe direction to fail.
 */
const attempts = new Map<string, AttemptState>();

/**
 * Cost-matched dummy verification for an unknown username. Without it, "no such
 * user" returns in microseconds while a real user costs a full scrypt — and the
 * response time alone enumerates which vendors were invited.
 */
const DUMMY_HASH = '0'.repeat(128);
const DUMMY_SALT = '0'.repeat(32);

function clientIp(req: NextRequest): string | null {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    null
  );
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> },
) {
  const { eventId } = await params;
  let body: { username?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'bad_request' }, { status: 400 });
  }

  const username = (body.username ?? '').trim().toLowerCase();
  const password = body.password ?? '';
  if (!username || !password) {
    return NextResponse.json({ ok: false, error: 'missing_credentials' }, { status: 400 });
  }

  const ip = clientIp(req);
  const throttleKey = `${eventId}:${username}:${ip ?? 'no-ip'}`;
  const state = attempts.get(throttleKey) ?? null;

  if (state && isThrottled(state)) {
    // 429, never 403. The door is slow, not shut, and we say when it reopens.
    const waitMs = backoffMs(state.failures);
    return NextResponse.json(
      { ok: false, error: 'too_many_attempts', retryAfterSeconds: Math.ceil(waitMs / 1000) },
      { status: 429, headers: { 'Retry-After': String(Math.ceil(waitMs / 1000)) } },
    );
  }

  const vendor = await findVendorForSignIn(eventId, username);

  const passwordOk = vendor
    ? await verifyPassword(password, vendor.passwordHash, vendor.passwordSalt)
    : await verifyPassword(password, DUMMY_HASH, DUMMY_SALT);

  if (!vendor || !passwordOk) {
    const next = recordFailure(state);
    attempts.set(throttleKey, next);
    if (vendor) {
      await recordVendorEvent({
        vendorId: vendor.id,
        tenantKey: vendor.tenantKey,
        type: 'sign_in_failed',
        ipHash: hashIp(ip),
        payload: { failures: next.failures },
      });
    }
    if (shouldAlertInternally(next)) {
      console.warn('[vendor-portal] sustained sign-in failures', {
        eventId,
        username,
        failures: next.failures,
      });
    }
    // One message for both cases. Distinguishing them tells an outsider which
    // organisations were invited to compete, which is itself confidential.
    return NextResponse.json({ ok: false, error: 'invalid_credentials' }, { status: 401 });
  }

  if (vendor.invitationState === 'withdrawn') {
    return NextResponse.json({ ok: false, error: 'access_withdrawn' }, { status: 403 });
  }

  attempts.delete(throttleKey);

  const session = issueSession({ respondBy: vendor.respondBy });
  const stored = await createSession({
    vendorId: vendor.id,
    tenantKey: vendor.tenantKey,
    tokenHash: session.tokenHash,
    expiresAt: session.expiresAt,
    ipHash: hashIp(ip),
    userAgent: req.headers.get('user-agent'),
  });
  if (!stored) {
    return NextResponse.json({ ok: false, error: 'session_unavailable' }, { status: 503 });
  }

  await recordVendorEvent({
    vendorId: vendor.id,
    tenantKey: vendor.tenantKey,
    type: 'signed_in',
    ipHash: hashIp(ip),
  });

  const res = NextResponse.json({ ok: true, vendorDisplayName: vendor.vendorDisplayName });
  res.cookies.set(sessionCookieName(eventId), session.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: session.expiresAt,
  });
  return res;
}
