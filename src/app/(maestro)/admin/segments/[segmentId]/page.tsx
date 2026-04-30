/**
 * /admin/segments/[segmentId] · SETUP-1.7
 *
 * Per-segment detail surface. Lands when an admin clicks an Act 1
 * fact card or an Act 3 "Open segment" CTA from the /admin
 * landing. Server component.
 *
 * Route accepts both forms:
 *   • Numeric (e.g., "01" → enterprise_profile)
 *   • Substrate key (e.g., "enterprise_profile")
 *
 * 404s on unknown ids. Returns a "not loaded yet" notice when the
 * segment is recognized but no data has landed.
 */

import { notFound } from 'next/navigation';

import { getActiveClientKey } from '@/lib/active-client';
import { clientKeyToBrokerTenantKey } from '@/lib/agent/tools/intelligence/_shared';
import {
  formatRelativeTimestamp,
  resolveSegmentRef,
} from '@/lib/admin/setup-acts-registry';
import { getSegmentRecordPage } from '@/lib/admin/setup-data-broker';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { AgentRail } from '@/components/admin/AgentRail';
import { SegmentDetailPage } from '@/components/admin/setup/SegmentDetailPage';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PageProps {
  params: Promise<{ segmentId: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { segmentId } = await params;
  const ref = resolveSegmentRef(segmentId);
  if (!ref) return { title: 'Segment not found · AbarVa' };
  return { title: `${ref.displayName} · Setup · AbarVa` };
}

export default async function AdminSegmentPage({ params }: PageProps) {
  const { segmentId } = await params;
  const reference = resolveSegmentRef(segmentId);
  if (!reference) notFound();

  const clientKey = await getActiveClientKey().catch(() => null);
  const brokerTenantKey = clientKey ? clientKeyToBrokerTenantKey(clientKey) : null;
  const page = brokerTenantKey
    ? await getSegmentRecordPage(brokerTenantKey, reference.segmentKey).catch(() => null)
    : null;
  const lastIngestedRelative = page?.rollup?.lastIngestedAt
    ? formatRelativeTimestamp(page.rollup.lastIngestedAt)
    : undefined;

  return (
    <AdminCanonShellV2
      agentRail={
        <AgentRail
          primaryAgentLabel="Sentinel"
          primaryActionLabel="Ask Sentinel about this segment"
          primaryActionHref="/intelligence/ask"
        />
      }
    >
      <SegmentDetailPage
        reference={reference}
        rollup={page?.rollup ?? null}
        records={page?.records ?? []}
        lastIngestedRelative={lastIngestedRelative}
      />
    </AdminCanonShellV2>
  );
}
