import { AiControlTowerPage } from '@/components/tower/AiControlTowerPage';
import { AppShell } from '@/components/shell/AppShell';
import { getActiveClientRow, hasLockedTenantSession } from '@/lib/active-client';
import { canonicalClientDisplayName } from '@/lib/client-config';
import { getAiControlTowerReadModel } from '@/lib/ai-control-tower/read-model';

export const metadata = { title: 'AI Control Tower · AbarVa' };
export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface TowerPageProps {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

function firstSearchValue(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

export default async function TowerPage({ searchParams }: TowerPageProps = {}) {
  const rawRequestedClient = firstSearchValue((await searchParams)?.client);
  const requestedClient = (await hasLockedTenantSession()) ? rawRequestedClient : null;
  const client = await getActiveClientRow(requestedClient).catch(() => null);
  const tenantName =
    canonicalClientDisplayName({ key: client?.key, name: client?.name }) ??
    client?.name ??
    'AbarVa Client';
  const model = await getAiControlTowerReadModel({
    clientId: client?.id ?? null,
    clientKey: client?.key ?? requestedClient,
    tenantName,
  });

  return (
    <AppShell
      surface="tower"
      topBarProps={{
        tenantName,
        showLocked: Boolean(client?.key),
        context: `AI Control Tower · ${tenantName}`,
      }}
      hasTenantKey={Boolean(client?.key)}
    >
      <AiControlTowerPage model={model} />
    </AppShell>
  );
}
