import { NextResponse, type NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';

import { getActiveClientKey } from '@/lib/active-client';
import { resolveClientId } from '@/lib/admin/data/admin-db-helpers';
import {
  listInboxNotifications,
  markInboxNotificationsRead,
} from '@/lib/admin/broker/notification-inbox-broker';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function requireInboxContext() {
  const session = await auth();
  if (!session.userId) {
    return {
      ok: false as const,
      reason: 'unauthorized' as const,
      response: NextResponse.json({ error: 'unauthorized' }, { status: 401 }),
    };
  }
  const tenantKey = await getActiveClientKey();
  const tenantId = await resolveClientId(tenantKey);
  if (!tenantId) {
    return {
      ok: false as const,
      reason: 'tenant_not_found' as const,
      response: NextResponse.json({ error: 'tenant_not_found' }, { status: 404 }),
    };
  }
  return { ok: true as const, userId: session.userId, tenantId };
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const ctx = await requireInboxContext();
  if (!ctx.ok) {
    if (ctx.reason === 'tenant_not_found') {
      return NextResponse.json({
        ok: false,
        reason: ctx.reason,
        items: [],
        unreadCount: 0,
      });
    }
    return ctx.response;
  }

  const limitRaw = request.nextUrl.searchParams.get('limit');
  const limit = limitRaw ? Number(limitRaw) : undefined;
  const includeArchived = request.nextUrl.searchParams.get('includeArchived') === 'true';
  const inbox = await listInboxNotifications({
    tenantId: ctx.tenantId,
    userId: ctx.userId,
    limit: Number.isFinite(limit) ? limit : undefined,
    includeArchived,
  });
  return NextResponse.json({ ok: true, ...inbox });
}

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  const ctx = await requireInboxContext();
  if (!ctx.ok) return ctx.response;

  let body: unknown = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  const deliveryIds =
    body && typeof body === 'object' && Array.isArray((body as { deliveryIds?: unknown }).deliveryIds)
      ? (body as { deliveryIds: unknown[] }).deliveryIds.filter((id): id is string => typeof id === 'string')
      : undefined;

  const result = await markInboxNotificationsRead({
    tenantId: ctx.tenantId,
    userId: ctx.userId,
    deliveryIds,
  });
  return NextResponse.json({ ok: true, ...result });
}
