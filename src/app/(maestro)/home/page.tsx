import type { Metadata } from 'next';

import { ImpactInsightsHome } from '@/components/home/ImpactInsightsHome';
import { getActiveClientRow } from '@/lib/active-client';
import { getCurrentUser } from '@/lib/auth/current-user';
import { canonicalClientDisplayName, getClientOption } from '@/lib/client-config';
import { listInitiativesForClient } from '@/lib/admin/ai-initiatives/queries';
import { getApprovalQueueForTenant } from '@/lib/programs/approval';
import { buildHomeBrief } from '@/lib/home/home-brief';

export const metadata: Metadata = {
  title: 'Home · AbarVa',
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function HomePage() {
  const activeClient = await getActiveClientRow().catch(() => null);
  const currentUser = await getCurrentUser().catch(() => null);

  const activeTenantName =
    canonicalClientDisplayName({
      key: activeClient?.key,
      name: activeClient?.name,
    }) ?? activeClient?.name ?? 'Your workspace';

  const clientOption = activeClient?.key
    ? getClientOption(activeClient.key)
    : null;

  // ── Real per-tenant brief data (build-for-pilot: honest empty states,
  //    never fabricated numbers). Initiatives drive the KPI strip + the
  //    portfolio table; the approval queue drives the single decision.
  //    Both are client-scoped; both degrade to a calm empty state. ──────
  const [initiatives, approvals] = await Promise.all([
    activeClient?.id
      ? listInitiativesForClient(activeClient.id).catch(() => [])
      : Promise.resolve([]),
    activeClient?.key
      ? getApprovalQueueForTenant(activeClient.key).catch(() => [])
      : Promise.resolve([]),
  ]);

  const brief = buildHomeBrief({
    tenantName: activeTenantName,
    industryLabel: clientOption?.vertical ?? null,
    logoColor: clientOption?.color ?? null,
    firstName: currentUser?.name?.split(/\s+/)[0] ?? null,
    initiatives,
    approvals,
  });

  return (
    <ImpactInsightsHome
      activeTenantName={activeTenantName}
      hasTenantKey={Boolean(activeClient?.key)}
      brief={brief}
    />
  );
}
