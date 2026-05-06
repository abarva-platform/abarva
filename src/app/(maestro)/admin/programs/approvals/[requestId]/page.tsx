// OV2-2c · Tenant-admin approval queue · /admin/programs/approvals/[requestId]
//
// Server component. Loads a single approval request scoped to the
// active tenant, renders the read-only brief snapshot on the left,
// the decision panel on the right, and a thin audit trail beneath.

import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@clerk/nextjs/server';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { AgentRail } from '@/components/admin/AgentRail';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { getActiveClientRow } from '@/lib/active-client';
import { getApprovalRequestById } from '@/lib/programs/approval';
import { ApprovalBriefSnapshotCard } from '@/components/admin/programs/ApprovalBriefSnapshotCard';
import { ApprovalDecisionPanel } from '@/components/admin/programs/ApprovalDecisionPanel';
import { formatRelativeTime } from '@/components/admin/programs/ApprovalQueueTable';
import { loadApprovalPersonDisplayMap } from '@/lib/programs/approval-person-resolver';
import { safeApprovalActorLabel } from '@/lib/programs/approval-display';

export const metadata = { title: 'Review Approval · AbarVa Setup' };
export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PageProps {
  params: Promise<{ requestId: string }>;
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

export default async function AdminProgramApprovalDetailPage({ params }: PageProps) {
  const { requestId } = await params;

  const session = await auth();
  if (!session.userId) {
    redirect('/');
  }

  const client = await getActiveClientRow().catch(() => null);
  if (!client) {
    notFound();
  }

  const request = await getApprovalRequestById(requestId).catch((err) => {
    console.error('[admin/programs/approvals/[requestId]] fetch failed', err);
    return null;
  });
  if (!request) {
    notFound();
  }
  // Tenant-scope guard. Treat cross-tenant access as not_found.
  if (request.tenantKey !== client.key) {
    notFound();
  }

  const programName =
    pickString(request.briefSnapshot, 'program_name', 'programName') ??
    'Untitled program';

  const alreadyDecided = request.requestStatus !== 'pending';
  const sponsorId = pickString(request.briefSnapshot, 'sponsor_person_id');
  const leadId = pickString(request.briefSnapshot, 'lead_person_id');
  const personDisplay = await loadApprovalPersonDisplayMap([
    request.requestedByUserId,
    request.decidedByUserId,
    sponsorId,
    leadId,
  ]);
  const resolvePersonName = (personId: string) =>
    personDisplay.get(personId) ?? null;

  return (
    <AdminCanonShellV2
      agentRail={
        <AgentRail
          primaryAgentLabel="Steward"
          primaryActionLabel="Back to queue"
          primaryActionHref="/admin/programs/approvals"
        />
      }
    >
      <EditorialCanvas
        eyebrow="Review approval"
        title={programName}
        subtitle={`Tenant ${client.key} · review the brief and decide.`}
      >
        <BackLink />
        <RequestStatusLine status={request.requestStatus} />
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)',
            gap: SPACING.lg,
            alignItems: 'start',
          }}
        >
          <ApprovalBriefSnapshotCard
            briefSnapshot={request.briefSnapshot}
            resolvePersonName={resolvePersonName}
          />
          <ApprovalDecisionPanel
            requestId={request.id}
            alreadyDecided={alreadyDecided}
          />
        </div>
        <AuditTrailCard
          requestedByDisplayName={
            personDisplay.get(request.requestedByUserId) ??
            safeApprovalActorLabel(request.requestedByUserId)
          }
          requestedAt={request.requestedAt}
          decidedByDisplayName={
            request.decidedByUserId
              ? personDisplay.get(request.decidedByUserId) ??
                safeApprovalActorLabel(request.decidedByUserId)
              : null
          }
          decidedAt={request.decidedAt}
          decisionRationale={request.decisionRationale}
          status={request.requestStatus}
        />
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}

function BackLink() {
  return (
    <Link
      href="/admin/programs/approvals"
      style={{
        fontFamily: TYPOGRAPHY.sans,
        fontSize: 13,
        color: COLORS.navy,
        textDecoration: 'none',
        fontWeight: 600,
      }}
    >
      ← Back to queue
    </Link>
  );
}

function RequestStatusLine({ status }: { status: string }) {
  return (
    <div
      style={{
        display: 'flex',
        gap: SPACING.md,
        alignItems: 'center',
        fontFamily: TYPOGRAPHY.mono,
        fontSize: 11,
        color: `${COLORS.ink}80`,
      }}
    >
      <span>Approval request</span>
      <span aria-hidden="true">·</span>
      <span style={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {status}
      </span>
    </div>
  );
}

function AuditTrailCard({
  requestedByDisplayName,
  requestedAt,
  decidedByDisplayName,
  decidedAt,
  decisionRationale,
  status,
}: {
  requestedByDisplayName: string;
  requestedAt: string;
  decidedByDisplayName: string | null;
  decidedAt: string | null;
  decisionRationale: string | null;
  status: string;
}) {
  return (
    <section
      aria-label="Audit trail"
      data-testid="approval-audit-trail"
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}12`,
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
        fontFamily: TYPOGRAPHY.sans,
        fontSize: 13,
        color: `${COLORS.ink}99`,
        display: 'flex',
        flexDirection: 'column',
        gap: SPACING.sm,
      }}
    >
      <div
        style={{
          fontFamily: TYPOGRAPHY.mono,
          fontSize: 10,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: `${COLORS.ink}80`,
          fontWeight: 700,
        }}
      >
        Audit trail
      </div>
      <div>
        <span style={{ color: COLORS.ink, fontWeight: 600 }}>
          {requestedByDisplayName}
        </span>{' '}
        submitted this brief{' '}
        <span title={requestedAt}>{formatRelativeTime(requestedAt)}</span>
        {' · '}
        <span style={{ fontFamily: TYPOGRAPHY.mono, fontSize: 11 }}>
          {requestedAt}
        </span>
      </div>
      {decidedByDisplayName && decidedAt ? (
        <div>
          <span style={{ color: COLORS.ink, fontWeight: 600 }}>
            {decidedByDisplayName}
          </span>{' '}
          {status === 'approved' ? 'approved' : 'rejected'} this request{' '}
          <span title={decidedAt}>{formatRelativeTime(decidedAt)}</span>
          {' · '}
          <span style={{ fontFamily: TYPOGRAPHY.mono, fontSize: 11 }}>
            {decidedAt}
          </span>
        </div>
      ) : null}
      {decisionRationale ? (
        <div
          style={{
            marginTop: SPACING.sm,
            padding: SPACING.md,
            background: COLORS.cream,
            borderRadius: RADIUS.md,
            color: COLORS.ink,
            lineHeight: 1.55,
            whiteSpace: 'pre-wrap',
          }}
        >
          {decisionRationale}
        </div>
      ) : null}
    </section>
  );
}
