/**
 * W4-PR-5 · Notifications dispatch worker · health probe
 *
 * Lightweight read-only endpoint that exposes:
 *   • queuedCount       — rows in notification_deliveries with status='queued'
 *   • oldestQueuedAt    — created_at of the oldest queued row (null if none)
 *   • lastSentAt        — sent_at of the most recent successful dispatch
 *   • lastFailedAt      — sent_at (transition time) of the most recent failed row
 *
 * Lets an external monitor alarm on a stuck queue (e.g. oldestQueuedAt
 * older than 10 minutes → cron worker is wedged). Requires the same
 * `Authorization: Bearer $CRON_SECRET` header as the tick handler so
 * the watermarks are not publicly exposed.
 *
 * Per broker-boundary doctrine, this route delegates to
 * `dispatchHealth()` in the broker — no Supabase calls live here.
 */

import { NextResponse, type NextRequest } from 'next/server';

import { dispatchHealth } from '@/lib/admin/broker/notification-dispatch-broker';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function expectedCronSecret(): string | null {
  const value = process.env.CRON_SECRET?.trim();
  return value && value.length > 0 ? value : null;
}

function bearerToken(req: NextRequest): string | null {
  const header = req.headers.get('authorization');
  if (!header) return null;
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  return match?.[1]?.trim() ?? null;
}

function authorized(req: NextRequest): boolean {
  const expected = expectedCronSecret();
  if (!expected) return false;
  return bearerToken(req) === expected;
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  if (!authorized(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const snapshot = await dispatchHealth();
  return NextResponse.json({
    ok: true,
    lastTickTs: new Date().toISOString(),
    ...snapshot,
  });
}
