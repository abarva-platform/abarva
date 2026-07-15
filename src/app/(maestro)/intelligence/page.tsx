// /intelligence · Advisory board surface.

import { AppShell } from '@/components/shell/AppShell';
import { AdvisoryIntelligencePage } from '@/components/intelligence-advisory/AdvisoryIntelligencePage';
import { getActiveClientRow, hasLockedTenantSession } from '@/lib/active-client';
import { canonicalClientDisplayName } from '@/lib/client-config';
import { getEnterpriseLandscapeViewModel } from '@/lib/home/enterprise-landscape-view-model';
import { resolveIntelligenceViewModelClientKey } from '@/lib/intelligence/intelligence-view-model-client-key';

export const metadata = {
  title: 'Intelligence · Advisory Board | AbarVa',
  description:
    'A virtual advisory board that turns enterprise context and corpus knowledge into guidance, risks, benchmarks, and next actions.',
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
  const viewModelClientKey = resolveIntelligenceViewModelClientKey({
    clientKey: client?.key,
    requestedClient,
    contextTenantKey,
  });
  const tenantName =
    canonicalClientDisplayName({ key: client?.key, name: client?.name }) ??
    client?.name ??
    'AbarVa Client';

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
      <AdvisoryIntelligencePage
        viewModel={getEnterpriseLandscapeViewModel({
          clientKey: viewModelClientKey,
          tenantName,
        })}
      />
    </AppShell>
  );
}
