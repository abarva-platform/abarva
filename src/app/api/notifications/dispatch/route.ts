import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase-server';
import { canonicalTenantKey } from '@/lib/tenant-keys';
import {
  buildNotificationEmailDispatchTasks,
  dispatchNotificationEmailTasks,
  parseNotificationRoleEmailMap,
  selectNotificationStoreAdapter,
} from '@/lib/notifications';

function bearer(req: NextRequest): string | null {
  const header = req.headers.get('authorization');
  const match = header ? /^Bearer\s+(.+)$/i.exec(header.trim()) : null;
  return match?.[1] ?? req.headers.get('x-notification-dispatch-token');
}

function expectedToken(): string | null {
  return (
    process.env.NOTIFICATION_DISPATCH_TOKEN?.trim()
    || process.env.CRON_SECRET?.trim()
    || null
  );
}

function authorized(req: NextRequest): boolean {
  const expected = expectedToken();
  if (!expected) return false;
  return bearer(req) === expected;
}

function numberOrDefault(value: unknown, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return Math.max(1, Math.min(100, Math.floor(value)));
}

async function deliveredTaskKeys(tenantKey: string): Promise<Set<string>> {
  const { data, error } = await getServerSupabase()
    .from('platform_notification_deliveries')
    .select('notification_event_id, recipient_email')
    .eq('tenant_key', canonicalTenantKey(tenantKey))
    .eq('channel', 'email_now')
    .eq('status', 'sent');
  if (error) return new Set();

  return new Set(
    (data ?? [])
      .map((row) => {
        const id = String((row as Record<string, unknown>).notification_event_id ?? '');
        const email = String((row as Record<string, unknown>).recipient_email ?? '').toLowerCase();
        return id && email ? `${id}:email_now:${email}` : null;
      })
      .filter((key): key is string => Boolean(key)),
  );
}

async function recordDeliveries(
  results: Awaited<ReturnType<typeof dispatchNotificationEmailTasks>>,
): Promise<void> {
  if (results.length === 0) return;
  const rows = results.map((result) => ({
    tenant_key: canonicalTenantKey(result.tenantKey),
    notification_event_id: result.eventId,
    channel: 'email_now',
    recipient_ref: result.recipientRef,
    recipient_email: result.recipientEmail,
    status: result.status,
    provider_message_id: result.providerMessageId,
    error_text: result.errorText,
    metadata_jsonb: { taskKey: result.taskKey },
  }));
  await getServerSupabase()
    .from('platform_notification_deliveries')
    .insert(rows);
}

export async function POST(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    const raw = await req.json();
    body = raw && typeof raw === 'object' && !Array.isArray(raw)
      ? raw as Record<string, unknown>
      : {};
  } catch {
    body = {};
  }

  const tenantKeyRaw = body.tenantKey;
  if (typeof tenantKeyRaw !== 'string' || tenantKeyRaw.trim().length === 0) {
    return NextResponse.json({ error: 'tenantKey required' }, { status: 400 });
  }

  const tenantKey = canonicalTenantKey(tenantKeyRaw.trim());
  const limit = numberOrDefault(body.limit, 50);
  const dryRun = body.dryRun === true;
  const roleEmails = parseNotificationRoleEmailMap(process.env.NOTIFICATION_ROLE_EMAILS_JSON);
  const adapter = selectNotificationStoreAdapter();
  const listed = await adapter.listEvents({ tenantKey, limit });

  if (!listed.ok || !listed.data) {
    return NextResponse.json(
      { error: listed.error ?? 'notification_list_failed' },
      { status: 500 },
    );
  }

  const delivered = dryRun ? new Set<string>() : await deliveredTaskKeys(tenantKey);
  const tasks = buildNotificationEmailDispatchTasks({
    events: listed.data,
    deliveredTaskKeys: delivered,
    roleEmails,
  });

  if (dryRun) {
    return NextResponse.json({
      ok: true,
      dryRun: true,
      plane: adapter.name,
      tenantKey,
      candidateEvents: listed.data.length,
      tasks: tasks.map((task) => ({
        taskKey: task.taskKey,
        eventId: task.event.id,
        recipientEmail: task.recipient.email,
        title: task.event.title,
      })),
    });
  }

  const results = await dispatchNotificationEmailTasks(tasks);
  await recordDeliveries(results);

  return NextResponse.json({
    ok: true,
    dryRun: false,
    plane: adapter.name,
    tenantKey,
    candidateEvents: listed.data.length,
    attempted: results.length,
    sent: results.filter((result) => result.status === 'sent').length,
    failed: results.filter((result) => result.status === 'failed').length,
  });
}
