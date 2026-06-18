// /intelligence · Context & Corpus Explorer inside the maestro app shell.

import { AppShell } from '@/components/shell/AppShell';
import { ContextCorpusExplorerPage } from '@/components/intelligence-v4/ContextCorpusExplorerPage';
import { getActiveClientRow, hasLockedTenantSession } from '@/lib/active-client';
import { canonicalClientDisplayName } from '@/lib/client-config';
import { getAiControlTowerReadModel } from '@/lib/ai-control-tower/read-model';
import { getEnterpriseContextOverviewForTenant } from '@/lib/enterprise-context/intelligence-read-model';

export const metadata = {
  title: 'Intelligence · Context & Corpus Explorer | AbarVa',
  description:
    'Explore tenant context, live facts, coverage, trust posture, and derived insights from the enterprise context layer.',
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface IntelligencePageProps {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

function firstSearchValue(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function enterpriseContextTenantKey(value: string | null | undefined): string | null {
  const key = value?.trim().toLowerCase();
  if (!key) return null;
  if (key === 'arcturus' || key === 'firstcapital') return 'first-capital';
  if (key === 'meridian') return 'meridian-health';
  if (key === 'apexretail') return 'apex-retail';
  return key;
}

export default async function IntelligencePage({ searchParams }: IntelligencePageProps = {}) {
  const rawRequestedClient = firstSearchValue((await searchParams)?.client);
  const requestedClient = (await hasLockedTenantSession()) ? rawRequestedClient : null;
  const client = await getActiveClientRow(requestedClient).catch(() => null);
  const contextTenantKey = enterpriseContextTenantKey(client?.key ?? requestedClient);
  const tenantName =
    canonicalClientDisplayName({ key: client?.key, name: client?.name }) ??
    client?.name ??
    'AbarVa Client';
  const overview = contextTenantKey
    ? await getEnterpriseContextOverviewForTenant(contextTenantKey, tenantName).catch(() => null)
    : null;
  const towerModel = await getAiControlTowerReadModel({
    clientId: client?.id ?? null,
    clientKey: client?.key ?? requestedClient,
    tenantName,
  });

  return (
    <AppShell
      surface="intelligence"
      topBarProps={{
        tenantName,
        showLocked: Boolean(client?.key),
        context: 'Intelligence',
      }}
      hasTenantKey={Boolean(client?.key)}
    >
      <ContextCorpusExplorerPage
        tenantName={tenantName}
        tenantKey={contextTenantKey}
        overview={overview}
        towerModel={towerModel}
      />
    </AppShell>
  );
}
