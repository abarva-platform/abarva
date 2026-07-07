/**
 * W4-PR-5 · Enterprise Comms Spine · Notifications dispatch cron
 *
 * Authenticated notifications dispatch endpoint. Azure scheduler or an
 * approved operator job can invoke this route on the configured cadence. On
 * each tick:
 *
 *   1. Validate the `Authorization: Bearer $CRON_SECRET` header.
 *   2. Delegate to `dispatchTick()` in
 *      `src/lib/admin/broker/notification-dispatch-broker.ts`.
 *   3. Return `{ processed, sent, failed, skipped, durationMs }`.
 *
 * Per broker-boundary doctrine, this route does NO direct Supabase
 * access — it only authenticates and forwards into the broker layer.
 *
 * Per Spine §11 W4-PR-5: digest assembly (daily / weekly) is deferred
 * to Wave 5 (W5-PR-3 / W5-PR-4). This handler processes immediate-
 * frequency queued rows only.
 *
 * Source: docs/build/ENTERPRISE_COMMS_SPINE_2026-05-30.md §6, §8, §11.
 */

import { NextResponse, type NextRequest } from "next/server";

import { dispatchTick } from "@/lib/admin/broker/notification-dispatch-broker";

// This route holds open DB connections + Resend calls — do NOT run on
// the edge runtime. Default Node.js runtime is correct.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function expectedCronSecret(): string | null {
  const value = process.env.CRON_SECRET?.trim();
  return value && value.length > 0 ? value : null;
}

function bearerToken(req: NextRequest): string | null {
  const header = req.headers.get("authorization");
  if (!header) return null;
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  return match?.[1]?.trim() ?? null;
}

function authorized(req: NextRequest): boolean {
  const expected = expectedCronSecret();
  if (!expected) return false;
  return bearerToken(req) === expected;
}

/**
 * GET — authenticated scheduler entry point.
 * Scheduled invocations and manual probes must supply
 * `Authorization: Bearer $CRON_SECRET`.
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  if (!authorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const result = await dispatchTick();
  return NextResponse.json({
    ok: true,
    processed: result.processed,
    sent: result.sent,
    failed: result.failed,
    skipped: result.skipped,
    durationMs: result.durationMs,
  });
}
