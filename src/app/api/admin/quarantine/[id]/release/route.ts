// POST /api/admin/quarantine/[id]/release · B5c data wiring
//
// Release a previously quarantined upload after manual review. Writes
// a NEW lifecycle audit row pointing at the original via parent_id;
// the original quarantine row is never updated. Append-only audit
// trail. SOC2-friendly.
//
// Authorization:
//   1. Caller must be authenticated (middleware AUTH_REQUIRED gate)
//   2. Caller must hold admin or maestro role
//   3. The audit row must belong to the caller's active tenant
//      (defense-in-depth even though RLS does the same)
//
// Body (optional JSON):
//   { "note": "false positive — vendor name pattern" }
//
// Response: { ok: true } on success; error JSON on failure.

import { getAzureReadFluentClient } from '@/lib/data-plane/postgresCompat';
import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { requireTenancy, tenancyErrorResponse } from '@/lib/auth/tenancy';
import { dataPlaneQuarantineAuditDataSource } from '@/lib/security/quarantine-audit-data-plane';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function requireAdminRole(): Promise<{ userId: string; role: string } | NextResponse> {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const role = (user.publicMetadata?.role as string | undefined) ?? '';
  if (role !== 'admin' && role !== 'maestro') {
    return NextResponse.json({ error: 'forbidden_admin_only' }, { status: 403 });
  }
  return { userId, role };
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

  // Defense-in-depth: verify the row belongs to this tenant before
  // writing the lifecycle row. RLS would also block a cross-tenant
  // release once Phase 5 RLS is fully load-bearing, but checking here
  // means we never even ask the data source to act on someone else's
  // row.
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
  if (r.final_decision !== 'quarantine') {
    return NextResponse.json(
      { error: 'invalid_state', detail: `cannot release a row in state "${r.final_decision}"` },
      { status: 409 },
    );
  }

  const body = (await req.json().catch(() => ({}))) as { note?: string };

  try {
    await dataPlaneQuarantineAuditDataSource.release({
      id,
      reviewerUserId: adminCheck.userId,
      note: body.note,
    });
  } catch (err) {
    return NextResponse.json(
      { error: 'release_failed', detail: err instanceof Error ? err.message : 'unknown' },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
