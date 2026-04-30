// OV2-2c · Tenant-admin approval queue · GET list endpoint
//
//   GET /api/admin/programs/approvals
//   → {
//       ok: true,
//       requests: ApprovalRequest[],
//       counts: { pending: number, approved: number, rejected: number }
//     }
//
// Auth: requireAdminAuth — authenticated + active tenant. The list
// is per-tenant (returned by getApprovalQueueForTenant scoped to
// the caller's tenantKey). Decide is gated by requireAdminDecide on
// the [requestId] route; see _auth.ts for the RBAC posture note.

import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase-server';
import { getApprovalQueueForTenant } from '@/lib/programs/approval';
import {
  adminAuthErrorResponse,
  requireAdminAuth,
} from './_auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface DecidedCountsRow {
  request_status: 'approved' | 'rejected';
}

/**
 * Decided-this-week counts. We bucket by 7-day window from now,
 * matching the summary-strip copy on /admin/programs/approvals.
 */
async function getDecidedThisWeekCounts(
  tenantKey: string,
): Promise<{ approved: number; rejected: number }> {
  const sb = getServerSupabase();
  const sinceIso = new Date(
    Date.now() - 7 * 24 * 60 * 60 * 1000,
  ).toISOString();

  const { data, error } = await sb
    .from('program_approval_requests')
    .select('request_status')
    .eq('tenant_key', tenantKey)
    .in('request_status', ['approved', 'rejected'])
    .gte('decided_at', sinceIso);

  if (error) {
    // Soft-fail: counts are decorative; the queue itself is the load-bearing
    // surface. Log and return zeros so the page still renders.
    console.error(
      '[admin/programs/approvals] decided-counts query failed',
      error,
    );
    return { approved: 0, rejected: 0 };
  }

  const rows = (data ?? []) as DecidedCountsRow[];
  let approved = 0;
  let rejected = 0;
  for (const r of rows) {
    if (r.request_status === 'approved') approved += 1;
    else if (r.request_status === 'rejected') rejected += 1;
  }
  return { approved, rejected };
}

export async function GET() {
  let ctx;
  try {
    ctx = await requireAdminAuth();
  } catch (err) {
    return adminAuthErrorResponse(err);
  }

  try {
    const requests = await getApprovalQueueForTenant(ctx.tenantKey);
    const decided = await getDecidedThisWeekCounts(ctx.tenantKey);

    return NextResponse.json({
      ok: true,
      requests,
      counts: {
        pending: requests.length,
        approved: decided.approved,
        rejected: decided.rejected,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'queue_query_failed';
    return NextResponse.json(
      { error: 'queue_query_failed', detail: message },
      { status: 500 },
    );
  }
}
