import type { Metadata } from 'next';

import { HomeSurface } from '@/components/home/HomeSurface';
import { cachedInventorySnapshot } from '@/app/(maestro)/admin/_cached-helpers';
import { AppShell } from '@/components/shell/AppShell';
import { getActiveClientRow } from '@/lib/active-client';
import { buildAdminSetupControlReadModel } from '@/lib/admin/setup-control';
import { getTenantSourceFiles } from '@/lib/context-ingestion/tenant-context-read-model';
import { canonicalClientDisplayName, getClientOption } from '@/lib/client-config';
import { clientKeyToInventorySubstrateKey } from '@/lib/agent/tools/intelligence/_shared';
import { buildHomeDataQualityModel } from '@/lib/home/home-data-quality';
import { buildHomeEnglishSummary } from '@/lib/home/home-english-summary';
import { getHomeV6ContextBrowser } from '@/lib/home/v6-context-browser';
import { getHomeV7ContextBrowser } from '@/lib/home/v7-context-browser';
import { getIntelligenceBindingPayload } from '@/lib/intelligence/binding/binding-payload';

export const metadata: Metadata = {
  title: 'Home · Enterprise Knowledge | AbarVa',
  description: 'Browse known facts, source-backed evidence, evidence gaps, and relationships.',
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type HomePageProps = {
  searchParams?: Promise<{
    client?: string | string[];
    candidatePreview?: string | string[];
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
  const params = await searchParams;
  const requestedClient = firstSearchParam(params?.client);
  const candidatePreviewParam = firstSearchParam(params?.candidatePreview);
  const candidatePreviewEnabled = candidatePreviewParam === "true";
  const activeClient = await getActiveClientRow(requestedClient).catch(() => null);
  const homeTenantKey = bindingTenantKey(activeClient?.key ?? requestedClient);
  const displayClientKey = activeClient?.key ?? homeTenantKey ?? requestedClient;
  const activeTenantName =
    canonicalClientDisplayName({
      key: displayClientKey,
      name: activeClient?.name,
    }) ??
    activeClient?.name ??
    'Your workspace';

  const clientOption = displayClientKey ? getClientOption(displayClientKey) : null;
  const binding = getIntelligenceBindingPayload(homeTenantKey);
  const v7Browser = await getHomeV7ContextBrowser({
    tenantKey: activeClient?.key ?? homeTenantKey,
  }).catch(() => null);
  const browser = v7Browser ?? getHomeV6ContextBrowser(activeClient?.key ?? homeTenantKey);
  const setupControl =
    clientOption && activeClient?.key
      ? buildAdminSetupControlReadModel({
          tenantKey: clientOption.id,
          displayName: activeTenantName,
          coverName: clientOption.name,
          snapshot: await cachedInventorySnapshot(
            clientKeyToInventorySubstrateKey(clientOption.id),
          ).catch(() => null),
          sourceFiles: await getTenantSourceFiles(activeClient.id).catch(() => []),
        })
      : null;
  const dataQuality = buildHomeDataQualityModel({
    tenantKey: activeClient?.key ?? homeTenantKey,
    tenantDisplayName: activeTenantName,
    candidatePreviewEnabled,
    setupControl,
    browser,
  });
  const englishSummary = buildHomeEnglishSummary(dataQuality);

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
          candidatePreviewEnabled={candidatePreviewEnabled}
          clientKey={activeClient?.key ?? homeTenantKey}
          payload={binding}
          setupControl={setupControl}
          dataQuality={dataQuality}
          englishSummary={englishSummary}
          v6Browser={browser}
        />
      </main>
    </AppShell>
  );
}
