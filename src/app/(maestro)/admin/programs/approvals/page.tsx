// OV2-2c · Tenant-admin approval queue · /admin/programs/approvals
//
// Server component. Resolves the active tenant, fetches the pending
// queue + decided-this-week counts, and renders the page header,
// summary strip, and queue list. The /admin layout already enforces
// the platform-admin allowlist; this page additionally resolves the
// tenant via getActiveClientRow so all reads are tenant-scoped.

import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { AgentRail } from '@/components/admin/AgentRail';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { getActiveClientRow } from '@/lib/active-client';
import { getApprovalQueueForTenant } from '@/lib/programs/approval';
import { getServerSupabase } from '@/lib/supabase-server';
import { ApprovalQueueTable } from '@/components/admin/programs/ApprovalQueueTable';
import { loadApprovalPersonDisplayMap } from '@/lib/programs/approval-person-resolver';

export const metadata = { title: 'Program Approvals · Nexus Admin' };
export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface DecidedRow {
  request_status: 'approved' | 'rejected';
}

function pickString(
  snapshot: Record<string, unknown>,
  ...keys: string[]
): string | null {
  for (const key of keys) {
    const v = snapshot[key];
    if (typeof v === 'string' && v.trim().length > 0) return v.trim();
  }
  return null;
}

function collectQueuePersonIds(
  requests: Awaited<ReturnType<typeof getApprovalQueueForTenant>>,
): string[] {
  const ids: string[] = [];
  for (const request of requests) {
    ids.push(request.requestedByUserId);
    const sponsorId = pickString(request.briefSnapshot, 'sponsor_person_id');
    if (sponsorId) ids.push(sponsorId);
  }
  return ids;
}

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
    console.error(
      '[admin/programs/approvals] decided-counts query failed',
      error,
    );
    return { approved: 0, rejected: 0 };
  }
  const rows = (data ?? []) as DecidedRow[];
  let approved = 0;
  let rejected = 0;
  for (const r of rows) {
    if (r.request_status === 'approved') approved += 1;
    else if (r.request_status === 'rejected') rejected += 1;
  }
  return { approved, rejected };
}

export default async function AdminProgramApprovalsPage() {
  const session = await auth();
  if (!session.userId) {
    redirect('/');
  }

  const client = await getActiveClientRow().catch(() => null);
  if (!client) {
    return (
      <AdminCanonShellV2
        agentRail={
          <AgentRail
            primaryAgentLabel="Steward"
            primaryActionLabel="Return home"
            primaryActionHref="/"
          />
        }
      >
        <EditorialCanvas
          eyebrow="Program approvals"
          title="No tenant"
          subtitle="No active client could be resolved for this user. Switch tenant or contact your platform admin."
        >
          <div />
        </EditorialCanvas>
      </AdminCanonShellV2>
    );
  }

  const tenantKey = client.key;
  const [requests, decided] = await Promise.all([
    getApprovalQueueForTenant(tenantKey).catch((err) => {
      console.error('[admin/programs/approvals] queue fetch failed', err);
      return [];
    }),
    getDecidedThisWeekCounts(tenantKey),
  ]);
  const personDisplay = await loadApprovalPersonDisplayMap(
    collectQueuePersonIds(requests),
  );

  return (
    <AdminCanonShellV2
      agentRail={
        <AgentRail
          primaryAgentLabel="Steward"
          primaryActionLabel="Open setup overview"
          primaryActionHref="/admin"
        />
      }
    >
      <EditorialCanvas
        eyebrow="Program approvals"
        title="Program Approval Queue"
        subtitle="Review and approve / reject submitted programs."
      >
        <SummaryStrip
          pending={requests.length}
          approved={decided.approved}
          rejected={decided.rejected}
        />
        <ApprovalQueueTable
          requests={requests}
          resolveUserName={(userId) => personDisplay.get(userId) ?? null}
          resolvePersonName={(personId) => personDisplay.get(personId) ?? null}
        />
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}

function SummaryStrip({
  pending,
  approved,
  rejected,
}: {
  pending: number;
  approved: number;
  rejected: number;
}) {
  return (
    <div
      data-testid="approval-summary-strip"
      style={{
        display: 'flex',
        gap: SPACING.lg,
        alignItems: 'center',
        padding: SPACING.md,
        background: COLORS.skyPale,
        borderRadius: RADIUS.md,
        fontFamily: TYPOGRAPHY.sans,
        fontSize: 13,
        color: COLORS.ink,
      }}
    >
      <span>
        <strong>{pending}</strong> pending
      </span>
      <span style={{ opacity: 0.4 }}>·</span>
      <span>
        <strong>{approved}</strong> approved this week
      </span>
      <span style={{ opacity: 0.4 }}>·</span>
      <span>
        <strong>{rejected}</strong> rejected this week
      </span>
    </div>
  );
}
