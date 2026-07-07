/**
 * POST /api/webhooks/clerk — PRE-W4-PR-1.
 *
 * Receives Clerk webhook events. The PR-1 surface only consumes
 * `user.created` events that originate from an invitation acceptance —
 * those carry an `invitation_id` we can match back to the
 * `invite_sent` audit row written by the `sendInvite` server action.
 *
 * For Wave 4 the comms surface SELECTs `admin_audit_log` WHERE
 * `action IN ('invite_sent', 'invite_accepted')` and renders the
 * timeline. Both rows share the `invitation_id` in metadata so the
 * surface can group "sent at HH:MM → accepted at HH:MM" pairs.
 *
 * Security:
 *   - Verifies the `svix-id` / `svix-timestamp` / `svix-signature`
 *     headers against `CLERK_WEBHOOK_SIGNING_SECRET` using the
 *     explicit `svix` dependency.
 *   - Without the env var the route returns 503 — a misconfigured
 *     deploy MUST NOT silently accept unsigned payloads.
 *   - The verifier sees the raw body. We do not parse JSON until
 *     after the signature is confirmed.
 *
 * Failure handling: an unrecognized event returns 200 (Clerk retries
 * 5xx). A signature-verification failure returns 400. A successful
 * `user.created` whose `public_metadata` does NOT contain
 * `invitation_id` is treated as a regular sign-up — we log a
 * structured note and return 200.
 */

import { NextRequest, NextResponse } from "next/server";
import { writeInviteAudit } from "@/lib/admin/invite-collaborator-audit";
import { emitNotification } from "@/lib/admin/broker/notification-broker";
import { maskEmail } from "@/lib/notifications/templates/_shared/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ClerkUserCreatedEvent {
  type: "user.created";
  data: {
    id: string;
    email_addresses?: Array<{ email_address?: string }>;
    public_metadata?: {
      invitation_id?: string;
      invited_by_user_id?: string;
      tenant_canonical_key?: string;
      role?: string;
      programs?: string[];
    };
  };
}

type ClerkWebhookEvent =
  | ClerkUserCreatedEvent
  | { type: string; data: unknown };

async function verifySignature(
  rawBody: string,
  headers: Headers,
  secret: string,
): Promise<ClerkWebhookEvent | null> {
  try {
    // Lazy-import svix so the module is only resolved at request time.
    const { Webhook } = await import("svix");
    const wh = new Webhook(secret);
    const verified = wh.verify(rawBody, {
      "svix-id": headers.get("svix-id") ?? "",
      "svix-timestamp": headers.get("svix-timestamp") ?? "",
      "svix-signature": headers.get("svix-signature") ?? "",
    });
    return verified as ClerkWebhookEvent;
  } catch (err) {
    console.warn(
      JSON.stringify({
        event: "clerk_webhook_signature_failed",
        reason: err instanceof Error ? err.message : "unknown",
      }),
    );
    return null;
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const secret = process.env.CLERK_WEBHOOK_SIGNING_SECRET;
  if (!secret) {
    console.warn(
      JSON.stringify({
        event: "clerk_webhook_misconfigured",
        reason: "CLERK_WEBHOOK_SIGNING_SECRET is not set",
      }),
    );
    return NextResponse.json(
      { error: "webhook_misconfigured" },
      { status: 503 },
    );
  }

  const rawBody = await req.text();
  const event = await verifySignature(rawBody, req.headers, secret);
  if (!event) {
    return NextResponse.json({ error: "invalid_signature" }, { status: 400 });
  }

  if (event.type !== "user.created") {
    // Future PRs will handle additional event types. For now we
    // acknowledge the delivery so Clerk doesn't retry.
    return NextResponse.json(
      { ok: true, ignored: event.type },
      { status: 200 },
    );
  }

  const userEvent = event as ClerkUserCreatedEvent;
  const meta = userEvent.data.public_metadata ?? {};
  const invitationId = meta.invitation_id;
  const tenantKey = meta.tenant_canonical_key;
  const role = meta.role ?? "";

  if (!invitationId || !tenantKey) {
    // Regular sign-up (no invitation context). Not a webhook error —
    // PR-1 only audits the invitation-accepted path.
    console.info(
      JSON.stringify({
        event: "clerk_user_created_no_invitation_context",
        user_id: userEvent.data.id,
      }),
    );
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  const inviteeEmail = userEvent.data.email_addresses?.[0]?.email_address ?? "";

  await writeInviteAudit({
    tenantCanonicalKey: tenantKey,
    actorUserId: meta.invited_by_user_id ?? null,
    inviteeEmail,
    invitationId,
    role,
    programs: meta.programs,
    action: "invite_accepted",
  });

  // W4-PR-3 · Emit `auth.invite_accepted` through the broker. The
  // invitee email is passed in masked form for log redaction; the
  // template's `maskEmail` will leave it unchanged. The webhook
  // response is unaffected by notification failures — Clerk only
  // cares about the 200 / 5xx code.
  const acceptedAtIso = new Date().toISOString();
  void emitNotification({
    tenantKey,
    eventType: "auth.invite_accepted",
    payload: {
      inviteeEmailMasked: maskEmail(inviteeEmail),
      // Template reads `inviteeEmail` for rendering; we mask before
      // handing it to the registry so the broker's PII redactor sees
      // a pre-redacted value either way.
      inviteeEmail: maskEmail(inviteeEmail),
      inviteeUserId: userEvent.data.id,
      role,
      tenantKey,
      acceptedAtIso,
      producedAtIso: acceptedAtIso,
    },
    actorUserId: meta.invited_by_user_id ?? undefined,
    targetResourceId: invitationId,
  }).catch((err: unknown) => {
    console.warn(
      JSON.stringify({
        event: "auth_invite_accepted.notification_emit_failed",
        tenant_key: tenantKey,
        invitation_id: invitationId,
        error: err instanceof Error ? err.message : String(err),
      }),
    );
  });

  return NextResponse.json({ ok: true }, { status: 200 });
}
