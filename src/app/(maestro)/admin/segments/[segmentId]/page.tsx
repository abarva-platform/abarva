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

import { resolveAdminTenant } from '@/lib/admin/admin-tenant';
import { clientKeyToInventorySubstrateKey } from '@/lib/agent/tools/intelligence/_shared';
import {
  formatRelativeTimestamp,
  resolveSegmentRef,
} from '@/lib/admin/setup-acts-registry';
import { getSegmentRecordPage } from '@/lib/admin/setup-data-broker';
import { headers } from 'next/headers';

import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { SetupChatRail } from '@/components/admin/SetupChatRail';
import { SegmentDetailPage } from '@/components/admin/setup/SegmentDetailPage';
import { SetupSegmentTelemetryBridge } from '@/components/admin/setup/SetupSegmentTelemetryBridge';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PageProps {
  params: Promise<{ segmentId: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { segmentId } = await params;
  const ref = resolveSegmentRef(segmentId);
  if (!ref) return { title: 'Segment not found · AbarVa' };
  return { title: `${ref.displayName} · Admin · AbarVa` };
}

export default async function AdminSegmentPage({ params }: PageProps) {
  const { segmentId } = await params;
  const reference = resolveSegmentRef(segmentId);
  if (!reference) notFound();

  // PR-G (2026-05-30 · Apex-leak F8): tenant identity flows through
  // resolveAdminTenant — throws into /admin/error.tsx if no active tenant —
  // replacing the prior `?? 'Apex Retail Group' / ?? 'apexretail'` fallbacks.
  const tenant = await resolveAdminTenant();
  const activeClientDisplayName = tenant.tenantName;
  const clientKey = tenant.clientKey;
  const brokerTenantKey = clientKeyToInventorySubstrateKey(clientKey);
  const page = brokerTenantKey
    ? await getSegmentRecordPage(brokerTenantKey, reference.segmentKey).catch(() => null)
    : null;
  const lastIngestedRelative = page?.rollup?.lastIngestedAt
    ? formatRelativeTimestamp(page.rollup.lastIngestedAt)
    : undefined;

  const referer = (await headers()).get('referer') ?? '';
  const cameFromLanding = /\/admin(\/|\?|$)/.test(referer) && !/\/admin\/segments\//.test(referer);

  return (
    <AdminCanonShellV2 agentRail={<SetupChatRail />} tenantName={activeClientDisplayName}>
      <SegmentDetailPage
        reference={reference}
        rollup={page?.rollup ?? null}
        records={page?.records ?? []}
        lastIngestedRelative={lastIngestedRelative}
      />
      <SetupSegmentTelemetryBridge
        tenantKey={brokerTenantKey}
        segmentNumericId={reference.numericId}
        segmentKey={reference.segmentKey}
        familyNumber={reference.familyNumber}
        recordsLoaded={page?.rollup?.recordCount ?? null}
        rollupHealthState={page?.rollup?.healthState ?? null}
        cameFromLanding={cameFromLanding}
      />
    </AdminCanonShellV2>
  );
}
