/**
 * POST /api/admin/connectors/[id]/test · PRE-W4-PR-3
 *
 * Real probe handler for the Setup / Admin connector detail page's
 * "Test connection" button. Replaces the 250 ms placeholder banner
 * shipped in Wave 2 PR-6 with a live verdict + latency from the
 * connector-health broker.
 *
 * Layering (broker boundary doctrine, memory ·
 * feedback_broker_boundary.md):
 *
 *   route.ts        → auth, rate-limit, audit log write
 *      ↓
 *   broker          → testConnector(tenantKey, id) (per-tenant)
 *      ↓
 *   probes registry → per-kind probe function (HTTP, DB, …)
 *
 * The route handler does NOT call the adapter directly, does NOT
 * call Supabase directly. All data reads go through the broker;
 * audit writes go through `writeConnectorTestAudit`.
 *
 * Safety contract (matches the probe registry's invariants):
 *   • 5 s hard timeout on the probe (enforced inside the probe).
 *   • 10 probes/min/tenant rate limit (enforced here).
 *   • No OAuth exchange — probes use existing config only.
 *   • Audit row written for every probe attempt; credentials
 *     never appear in metadata.
 *   • Manual probes do NOT emit Wave 4 notifications. The
 *     `connector.degraded` / `connector.recovered` stream is fed
 *     by auto-monitoring transitions; the broker calculates the
 *     transition but persistence + notify land in Wave 4.
 *
 * Response shape (200):
 *   {
 *     ok: boolean,
 *     latencyMs: number,
 *     reason?: string,
 *     probedAtIso: string,
 *     transition: { kind: 'none' | 'degraded' | 'recovered', reason?: string }
 *   }
 *
 * Errors:
 *   401 unauthenticated         · no Clerk session
 *   403 forbidden               · authenticated but missing admin posture
 *   404 not_found               · connectorId not present in tenant
 *   429 rate_limited            · over 10 probes/min for this tenant
 *   500 internal_error          · unexpected failure outside the probe layer
 *
 * The probe itself never throws — failures are reported as
 * `{ ok: false, reason }` with a 200 status code so the UI can
 * render the verdict inline.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';

import { getActiveClientRow } from '@/lib/active-client';
import { testConnector } from '@/lib/admin/broker/connector-health-broker';
import { acquireConnectorTestSlot } from '@/lib/admin/broker/connector-test-rate-limit';
import { writeConnectorTestAudit } from '@/lib/admin/connector-test-audit';
import { emitNotification } from '@/lib/admin/broker/notification-broker';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function requireAdminRole(): Promise<
  | { userId: string }
  | NextResponse
> {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  }
  const clerk = await clerkClient();
  const user = await clerk.users.getUser(userId);
  const role = (user.publicMetadata?.role as string | undefined) ?? '';
  if (role !== 'admin' && role !== 'maestro') {
    return NextResponse.json(
      { error: 'forbidden_admin_only' },
      { status: 403 },
    );
  }
  return { userId };
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const adminCheck = await requireAdminRole();
  if (adminCheck instanceof NextResponse) return adminCheck;

  const client = await getActiveClientRow();
  if (!client) {
    return NextResponse.json({ error: 'no_tenant' }, { status: 403 });
  }
  const tenantKey = client.key;

  const { id: connectorId } = await params;
  if (!connectorId) {
    return NextResponse.json({ error: 'missing_id' }, { status: 400 });
  }

  // Per-tenant rate limit · 10 probes / minute.
  const slot = acquireConnectorTestSlot(tenantKey);
  if (!slot.allowed) {
    const retryAfterSec = Math.max(1, Math.ceil((slot.retryAfterMs ?? 0) / 1000));
    return NextResponse.json(
      {
        error: 'rate_limited',
        retryAfterMs: slot.retryAfterMs ?? 0,
      },
      {
        status: 429,
        headers: { 'Retry-After': String(retryAfterSec) },
      },
    );
  }

  let result;
  try {
    result = await testConnector(tenantKey, connectorId);
  } catch (err) {
    return NextResponse.json(
      {
        error: 'internal_error',
        detail: err instanceof Error ? err.message : 'unknown',
      },
      { status: 500 },
    );
  }

  if (result.reason === 'not_found' && result.priorStatus === null) {
    // The broker uses `reason: 'not_found'` as a sentinel when the
    // connectorId doesn't resolve. Surface as 404 so the UI can
    // route accordingly. We deliberately skip the audit write here
    // — there is no canonical target to log against.
    return NextResponse.json(
      { error: 'not_found' },
      { status: 404 },
    );
  }

  // Fire-and-forget audit write. The structured warn inside the
  // writer is the second channel; we do not block the response on
  // audit success.
  void writeConnectorTestAudit({
    actorUserId: adminCheck.userId,
    tenantKey,
    connectorId,
    // The probe result doesn't carry the label, but the route
    // doesn't need it on the hot path — the connector_id is the
    // canonical identifier in metadata. Use the id as the label
    // fallback for the summary line.
    connectorLabel: connectorId,
    result,
  });

  // W4-PR-3 · Wire `connector.failed` to a live → degraded transition.
  // Fire-and-forget so a broker outage does not surface in the probe
  // verdict. The payload matches the W4-PR-6 ConnectorFailedPayload
  // contract (connector identity, last-success timestamp, reason).
  if (result.transition.kind === 'degraded') {
    const failureReason = result.transition.reason;
    void emitNotification({
      tenantKey,
      eventType: 'connector.failed',
      payload: {
        connectorId,
        connectorName: connectorId,
        lastSuccessIso: null,
        lastPullIso: null,
        failureReason,
        suggestedAction: 'Open Connectors and re-authenticate or fix the configuration.',
        producedAtIso: result.probedAtIso,
      },
      actorUserId: adminCheck.userId,
      targetResourceId: connectorId,
    }).catch((err: unknown) => {
      console.warn(
        JSON.stringify({
          event: 'connector_test.notification_emit_failed',
          tenant_key: tenantKey,
          connector_id: connectorId,
          error: err instanceof Error ? err.message : String(err),
        }),
      );
    });
  }

  return NextResponse.json({
    ok: result.ok,
    latencyMs: result.latencyMs,
    reason: result.reason,
    probedAtIso: result.probedAtIso,
    transition: result.transition,
  });
}
