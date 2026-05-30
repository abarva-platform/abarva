/**
 * GET /api/webhooks/resend/health — W4-PR-7
 *
 * Operator-visible liveness probe. Returns 200 with the timestamp of
 * the most recent webhook the route accepted (after signature
 * verification). Lets us monitor "has Resend stopped delivering?"
 * without needing to query the delivery ledger.
 *
 * Public — no Clerk middleware required. Returns no PII. The route
 * deliberately exposes only an ISO timestamp + a configured flag.
 */

import { NextResponse } from 'next/server';
import { getLastWebhookReceivedAt } from '@/lib/admin/broker/resend-webhook-broker';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse> {
  const lastReceivedAt = getLastWebhookReceivedAt();
  const configured = Boolean(process.env.RESEND_WEBHOOK_SECRET?.trim());
  return NextResponse.json(
    {
      ok: true,
      configured,
      lastWebhookReceivedAt: lastReceivedAt,
    },
    { status: 200 },
  );
}
