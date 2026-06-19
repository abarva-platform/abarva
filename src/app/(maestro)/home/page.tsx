import { EnterpriseLandscapeHome } from '@/components/home/EnterpriseLandscapeHome';
import { AppShell } from '@/components/shell/AppShell';
import { getActiveClientRow } from '@/lib/active-client';
import { canonicalClientDisplayName } from '@/lib/client-config';
import { getEnterpriseLandscapeViewModel } from '@/lib/home/enterprise-landscape-view-model';

export const metadata = {
  title: 'Home · Enterprise Landscape | AbarVa',
  description:
    'A consulting-report view of the loaded enterprise context, current-state landscape, sources, and leadership implications.',
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function HomePage() {
  const client = await getActiveClientRow().catch(() => null);
  const tenantName =
    canonicalClientDisplayName({ key: client?.key, name: client?.name }) ??
    client?.name ??
    'AbarVa Client';

  return (
    <AppShell
      surface="home"
      topBarProps={{
        tenantName,
        showLocked: Boolean(client?.key),
        context: `Enterprise Landscape · ${tenantName}`,
      }}
      hasTenantKey={Boolean(client?.key)}
    >
      <EnterpriseLandscapeHome
        viewModel={getEnterpriseLandscapeViewModel({
          clientKey: client?.key ?? null,
          tenantName,
        })}
      />
    </AppShell>
  );
}
