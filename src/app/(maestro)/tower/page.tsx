import { AppShell } from '@/components/shell/AppShell';
import { getActiveClientRow } from '@/lib/active-client';
import { canonicalClientDisplayName } from '@/lib/client-config';

export const metadata = { title: 'IT Investment Tower · AbarVa' };
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function TowerPage() {
  const client = await getActiveClientRow().catch(() => null);
  const tenantName =
    canonicalClientDisplayName({ key: client?.key, name: client?.name }) ??
    client?.name ??
    'AbarVa Client';

  return (
    <AppShell surface="tower" topBarProps={{ tenantName }} hasTenantKey={Boolean(client?.key)}>
      <main style={{ width: '100%', height: '100%', overflow: 'hidden', background: '#f7f5ef' }}>
        <iframe
          src="/api/tower/v2-frame"
          title="AbarVa IT Investment Tower"
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
