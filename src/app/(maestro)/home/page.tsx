import type { Metadata } from 'next';

import { AppShell } from '@/components/shell/AppShell';
import { getActiveClientRow } from '@/lib/active-client';
import { canonicalClientDisplayName, getClientOption } from '@/lib/client-config';
import { getIntelligenceBindingPayload } from '@/lib/intelligence/binding/binding-payload';
import { HomeSurface } from '@/components/home/HomeSurface';

export const metadata: Metadata = {
  title: 'Home · Context Explorer | AbarVa',
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type HomePageProps = {
  searchParams?: Promise<{
    client?: string | string[];
  }>;
};

function firstSearchParam(value: string | string[] | null | undefined): string | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function bindingTenantKey(value: string | null | undefined): string | null {
  const key = value?.trim().toLowerCase();
  if (!key) return null;
  if (key === 'arcturus' || key === 'firstcapital') return 'first-capital';
  if (key === 'meridian') return 'meridian-health';
  if (key === 'apexretail') return 'apex-retail';
  return key;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const requestedClient = firstSearchParam((await searchParams)?.client);
  const activeClient = await getActiveClientRow(requestedClient);

  const activeTenantName =
    canonicalClientDisplayName({
      key: activeClient?.key,
      name: activeClient?.name,
    }) ?? activeClient?.name ?? 'Your workspace';

  const clientOption = activeClient?.key
    ? getClientOption(activeClient.key)
    : null;

  const homeTenantKey = bindingTenantKey(activeClient?.key ?? requestedClient);
  const binding = getIntelligenceBindingPayload(homeTenantKey);

  return (
    <AppShell
      surface="home"
      topBarProps={{
        tenantName: activeTenantName,
        showLocked: Boolean(activeClient?.key),
        context: clientOption?.vertical ? `Home · ${clientOption.vertical}` : 'Home',
      }}
      hasTenantKey={Boolean(activeClient?.key)}
    >
      <main style={{ flex: 1, minHeight: 0, overflowY: 'auto', background: '#FBFAF7' }}>
        <HomeSurface
          clientKey={activeClient?.key ?? homeTenantKey}
          payload={binding}
        />
      </main>
    </AppShell>
  );
}
