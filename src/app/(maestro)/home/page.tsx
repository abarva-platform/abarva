import type { Metadata } from 'next';

import { AppShell } from '@/components/shell/AppShell';
import { getActiveClientRow } from '@/lib/active-client';
import { canonicalClientDisplayName, getClientOption } from '@/lib/client-config';
import { isFeatureEnabled } from '@/lib/features/is-feature-enabled';
import { getIntelligenceBindingPayload } from '@/lib/intelligence/binding/binding-payload';
import { HomeSurface } from '@/components/home/HomeSurface';

export const metadata: Metadata = {
  title: 'Home · Context Explorer | AbarVa',
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function bindingTenantKey(value: string | null | undefined): string | null {
  const key = value?.trim().toLowerCase();
  if (!key) return null;
  if (key === 'arcturus' || key === 'firstcapital') return 'first-capital';
  if (key === 'meridian') return 'meridian-health';
  if (key === 'apexretail') return 'apex-retail';
  return key;
}

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

  // Real React Home (Home KNOW endpoint + HomeKnowResponse renderer) behind a
  // tenant flag. The static iframe remains the default until the React surface is
  // proven live, then we flip the flag and retire public/home-v2.
  const reactHome = isFeatureEnabled(
    { clientKey: activeClient?.key, clientId: activeClient?.id },
    'home_react_surface',
  );
  const binding = reactHome
    ? getIntelligenceBindingPayload(bindingTenantKey(activeClient?.key))
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
      {reactHome ? (
        <main style={{ flex: 1, minHeight: 0, overflowY: 'auto', background: '#FBFAF7' }}>
          <HomeSurface
            clientKey={activeClient?.key ?? null}
            payload={binding}
          />
        </main>
      ) : (
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
      )}
    </AppShell>
  );
}
