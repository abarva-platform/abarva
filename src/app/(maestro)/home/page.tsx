import type { Metadata } from 'next';

import { AppShell } from '@/components/shell/AppShell';
import { getActiveClientRow } from '@/lib/active-client';
import { canonicalClientDisplayName, getClientOption } from '@/lib/client-config';

export const metadata: Metadata = {
  title: 'Home · Context Explorer | AbarVa',
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function HomePage() {
  const activeClient = await getActiveClientRow();

  const activeTenantName =
    canonicalClientDisplayName({
      key: activeClient?.key,
      name: activeClient?.name,
    }) ?? activeClient?.name ?? 'Your workspace';

  const clientOption = activeClient?.key
    ? getClientOption(activeClient.key)
    : null;

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
      <main style={{ flex: 1, minHeight: 0, overflow: 'hidden', background: '#f7f5ef' }}>
        <iframe
          src="/api/home/v2-frame"
          title="AbarVa Home Context Explorer"
          style={{
            width: '100%',
            height: '100%',
            border: 0,
            display: 'block',
            background: '#f7f5ef',
          }}
        />
      </main>
    </AppShell>
  );
}
