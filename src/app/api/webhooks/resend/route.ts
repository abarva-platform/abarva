/**
 * POST /api/webhooks/resend — W4-PR-7
 *
 * Receives Resend webhook events (`email.sent`, `email.delivered`,
 * `email.bounced`, `email.complained`, ...). Verifies the Standard
 * Webhooks (svix-style) signature against `RESEND_WEBHOOK_SECRET`,
 * then hands the parsed event to the broker for delivery-row updates,
 * auto-disable, and admin notification.
 *
 * Per Spine §11 W4-PR-7:
 *   • Without RESEND_WEBHOOK_SECRET the route returns 503 — a
 *     misconfigured deploy MUST NOT silently accept unsigned payloads.
 *   • A failed signature returns 401.
 *   • A successful processing returns 200 — even on internal broker
 *     errors. We log + 200 so Resend does not retry endlessly. The
 *     forensic anchor is the broker's structured log + the delivery
 *     ledger; the webhook receiver is just transport.
 *
 * The route NEVER reaches Supabase directly — every DB write routes
 * through `processResendWebhookEvent()` in the broker.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  processResendWebhookEvent,
  recordWebhookReceived,
  type ResendWebhookEvent,
} from '@/lib/admin/broker/resend-webhook-broker';
import { verifyResendSignature } from '@/lib/notifications/resend-webhook-signature';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest): Promise<NextResponse> {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret || secret.trim().length === 0) {
    console.warn(
      JSON.stringify({
        event: 'resend_webhook.misconfigured',
        reason: 'RESEND_WEBHOOK_SECRET is not set',
      }),
    );
    return NextResponse.json(
      { error: 'webhook_misconfigured' },
      { status: 503 },
    );
  }

  // Read raw body BEFORE JSON.parse — the signature covers the raw bytes.
  const rawBody = await req.text();

  const verify = verifyResendSignature({
    rawBody,
    svixId: req.headers.get('svix-id') ?? '',
    svixTimestamp: req.headers.get('svix-timestamp') ?? '',
    svixSignature: req.headers.get('svix-signature') ?? '',
    secret,
  });

  if (!verify.ok) {
    console.warn(
      JSON.stringify({
        event: 'resend_webhook.signature_rejected',
        reason: verify.reason,
      }),
    );
    return NextResponse.json(
      { error: 'invalid_signature', reason: verify.reason },
      { status: 401 },
    );
  }

  // Mark liveness for the /health probe.
  recordWebhookReceived();

  let event: ResendWebhookEvent;
  try {
    event = JSON.parse(rawBody) as ResendWebhookEvent;
  } catch (err) {
    console.warn(
      JSON.stringify({
        event: 'resend_webhook.malformed_body',
        reason: err instanceof Error ? err.message : 'unknown',
      }),
    );
    // Still 200 — bad JSON from a verified sender is not a transport
    // failure we want Resend to retry forever on.
    return NextResponse.json({ ok: true, ignored: 'malformed_body' }, { status: 200 });
  }

  if (!event || typeof event !== 'object' || typeof event.type !== 'string') {
    return NextResponse.json({ ok: true, ignored: 'missing_type' }, { status: 200 });
  }

  try {
    const result = await processResendWebhookEvent(event);
    if (result.ok) {
      return NextResponse.json({ ok: true, action: result.action }, { status: 200 });
    }
    // Broker reported an internal failure. Log + 200 (we don't want
    // Resend to retry endlessly on our infra hiccup; the failure is
    // visible in our logs + the delivery ledger).
    console.warn(
      JSON.stringify({
        event: 'resend_webhook.broker_returned_error',
        type: event.type,
        error: result.error,
      }),
    );
    return NextResponse.json({ ok: true, error: result.error }, { status: 200 });
  } catch (err) {
    console.error(
      JSON.stringify({
        event: 'resend_webhook.broker_threw',
        type: event.type,
        error: err instanceof Error ? err.message : String(err),
      }),
    );
    return NextResponse.json({ ok: true, error: 'broker_threw' }, { status: 200 });
  }
}
