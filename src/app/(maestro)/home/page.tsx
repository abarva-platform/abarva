import type { Metadata } from 'next';

import { ImpactInsightsHome } from '@/components/home/ImpactInsightsHome';
import { getActiveClientRow } from '@/lib/active-client';
import { canonicalClientDisplayName } from '@/lib/client-config';

export const metadata: Metadata = {
  title: 'Home · AbarVa',
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function HomePage() {
  const activeClient = await getActiveClientRow().catch(() => null);

  const activeTenantName =
    canonicalClientDisplayName({
      key: activeClient?.key,
      name: activeClient?.name,
    }) ?? activeClient?.name ?? 'Your workspace';

  return (
    <ImpactInsightsHome
      activeTenantName={activeTenantName}
      hasTenantKey={Boolean(activeClient?.key)}
    />
  );
}
