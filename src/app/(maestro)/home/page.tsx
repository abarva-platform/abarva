import type { Metadata } from 'next';

import { HomeIndexPage } from '@/components/home/HomeIndexPage';
import { getActiveClientRow } from '@/lib/active-client';
import { getCurrentModuleAccess } from '@/lib/auth/server-module-access';
import { canonicalClientDisplayName } from '@/lib/client-config';

export const metadata: Metadata = {
  title: 'Home · AbarVa',
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function HomePage() {
  const [activeClient, moduleAccess] = await Promise.all([
    getActiveClientRow().catch(() => null),
    getCurrentModuleAccess(),
  ]);

  const activeTenantName =
    canonicalClientDisplayName({
      key: activeClient?.key,
      name: activeClient?.name,
    }) ?? activeClient?.name ?? 'Your workspace';

  return (
    <HomeIndexPage
      activeTenantName={activeTenantName}
      hasTenantKey={Boolean(activeClient?.key)}
      moduleAccess={moduleAccess.access}
    />
  );
}
