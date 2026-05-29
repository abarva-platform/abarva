// POST /api/admin/quarantine/[id]/hard-delete · B5c data wiring
//
// Permanently delete a quarantined upload. Writes a NEW lifecycle
// audit row (final_decision='hard_deleted'); the original audit row
// is preserved for the SOC2 trail. The blob itself is NOT deleted
// by this route — that's a per-tier storage-client concern that
// follows when the unified storage abstraction lands.
//
// Same authorization shape as the release route: admin + tenancy
// guard + state check.

import { getAzureReadFluentClient } from '@/lib/data-plane/postgresCompat';
import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { requireTenancy, tenancyErrorResponse } from '@/lib/auth/tenancy';
import { dataPlaneQuarantineAuditDataSource } from '@/lib/security/quarantine-audit-data-plane';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function requireAdminRole(): Promise<{ userId: string } | NextResponse> {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const role = (user.publicMetadata?.role as string | undefined) ?? '';
  if (role !== 'admin' && role !== 'maestro') {
    return NextResponse.json({ error: 'forbidden_admin_only' }, { status: 403 });
  }
  return { userId };
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const adminCheck = await requireAdminRole();
  if (adminCheck instanceof NextResponse) return adminCheck;

  let ctx;
  try {
    ctx = await requireTenancy();
  } catch (err) {
    return tenancyErrorResponse(err) as NextResponse;
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: 'missing_id' }, { status: 400 });
  }

  const sb = getAzureReadFluentClient();
  const { data: row, error: lookupErr } = await sb
    .from('sensitive_upload_audit')
    .select('tenant_client_key, final_decision')
    .eq('id', id)
    .maybeSingle();
  if (lookupErr) {
    return NextResponse.json(
      { error: 'lookup_failed', detail: lookupErr.message },
      { status: 500 },
    );
  }
  if (!row) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }
  const r = row as { tenant_client_key: string; final_decision: string };
  if (r.tenant_client_key !== (ctx.clientKey ?? '')) {
    return NextResponse.json({ error: 'forbidden_cross_tenant' }, { status: 403 });
  }
  if (r.final_decision === 'hard_deleted') {
    return NextResponse.json(
      { error: 'invalid_state', detail: 'row already hard-deleted' },
      { status: 409 },
    );
  }

  const body = (await req.json().catch(() => ({}))) as { note?: string };

  try {
    await dataPlaneQuarantineAuditDataSource.hardDelete({
      id,
      reviewerUserId: adminCheck.userId,
      note: body.note,
    });
  } catch (err) {
    return NextResponse.json(
      { error: 'hard_delete_failed', detail: err instanceof Error ? err.message : 'unknown' },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
