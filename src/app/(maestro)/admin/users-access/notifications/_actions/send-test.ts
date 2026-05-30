'use server';

/**
 * sendTest server action · W4-PR-4
 *
 * Emits a scoped `system.health_alert` test event for the calling user
 * only, with a delivery row preconfigured for the requested channel.
 *
 * The full delivery pipeline (Resend / Slack / etc.) lands in a later
 * wave. For Phase 1 we write the event + delivery row in `queued`
 * status; the worker that materializes Phase 1 deliveries will pick
 * it up. Until that worker ships, the queued row is still useful — it
 * confirms the broker boundary and the audit trail are wired end-to-end.
 *
 * Returns the status the row landed at so the page can show
 * "dispatched (queued)".
 */

import { auth } from '@clerk/nextjs/server';
import { requireTenancy, TenancyError } from '@/lib/auth/tenancy';
import { getAzureWriteFluentClient } from '@/lib/data-plane/postgresCompat';
import { resolveTenantId } from '@/lib/admin/broker/notifications-preferences-broker';

export type SendTestActionResult =
  | { ok: true; status: 'queued' | 'sent' | 'suppressed' }
  | { ok: false; code: string; message: string };

const ALLOWED_CHANNELS = new Set(['email', 'in_app']);

export async function sendTest(channel: 'email' | 'in_app'): Promise<SendTestActionResult> {
  if (!ALLOWED_CHANNELS.has(channel)) {
    return { ok: false, code: 'invalid_channel', message: `Channel "${channel}" is not testable in Phase 1.` };
  }
  const { userId } = await auth();
  if (!userId) {
    return { ok: false, code: 'unauthenticated', message: 'Sign in to send a test.' };
  }
  let tenancy;
  try {
    tenancy = await requireTenancy();
  } catch (err) {
    if (err instanceof TenancyError) {
      return { ok: false, code: 'no_active_tenant', message: 'No active workspace.' };
    }
    throw err;
  }
  const tenantId = await resolveTenantId(tenancy.clientKey ?? '');
  if (!tenantId) {
    return { ok: false, code: 'unresolved_tenant', message: 'Could not resolve your tenant.' };
  }

  const sb = getAzureWriteFluentClient();
  try {
    const { data: ev, error: evErr } = await sb
      .from('notification_events')
      .insert({
        tenant_id: tenantId,
        event_type: 'system.health_alert',
        source_module: 'system',
        severity: 'info',
        category: 'operational',
        audit_class: 'transactional',
        payload: { test: true, dispatched_by: userId, channel },
        actor_user_id: userId,
        target_resource_id: `test:${userId}`,
      })
      .select('id')
      .single();
    if (evErr || !ev) {
      return {
        ok: false,
        code: 'db_error',
        message: evErr?.message ?? 'Could not write test event.',
      };
    }
    const eventId = (ev as { id: string }).id;

    const { error: delErr } = await sb.from('notification_deliveries').insert({
      event_id: eventId,
      user_id: userId,
      tenant_id: tenantId,
      channel,
      status: 'queued',
    });
    if (delErr) {
      return {
        ok: false,
        code: 'db_error',
        message: delErr.message ?? 'Could not write test delivery.',
      };
    }
    return { ok: true, status: 'queued' };
  } catch (err) {
    return {
      ok: false,
      code: 'db_error',
      message: err instanceof Error ? err.message : 'Test dispatch threw.',
    };
  }
}
