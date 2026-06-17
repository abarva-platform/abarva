// /intelligence · Explore layer for AI bets.
//
// v3 (2026-05-07) reframe: pattern-to-Move funnel surface with
// Sentinel chat as a first-class three-mode layout.
//
// v4 (2026-06-16) gate: when tenant has 'context_corpus_explorer_enabled'
// flag, renders the Context & Corpus Explorer S1 shell instead.
//
// Spec: docs/build/intelligence/INTELLIGENCE_CONTEXT_CORPUS_EXPLORER_DESIGN_2026-06-16.md

import { IntelligenceV3Page } from '@/components/intelligence-v3/IntelligenceV3Page';
import { IntelligenceExplorerPage } from '@/components/intelligence-v4/IntelligenceExplorerPage';
import { buildIntelligenceV3PageData } from '@/lib/intelligence-v3/page-data';
import { getVendorsForClient } from '@/lib/intelligence-v3/vendors-data';
import {
  getByFunctionData,
  getPeerActivityData,
  getMyStrategyData,
} from '@/lib/intelligence-v3/stages-data';
import { getActiveClientRow, hasLockedTenantSession } from '@/lib/active-client';
import { getEnterpriseContextOverviewForTenant } from '@/lib/enterprise-context/intelligence-read-model';
import { listInitiativesForClient } from '@/lib/admin/ai-initiatives/queries';
import { loadTenantIntelligenceCorpusData } from '@/lib/intelligence-v3/tenant-corpus-loader';
import { isFeatureEnabled } from '@/lib/features/is-feature-enabled';

export const metadata = {
  title: 'Intelligence · Explore layer for AI bets | AbarVa',
  description:
    'Explore three substrates — what we know about you, what patterns exist, and what is possible — to originate stronger Strategic Moves or validate the bets already in flight.',
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

export default async function IntelligencePage({ searchParams }: IntelligencePageProps = {}) {
  // SEC-P0 (audit 2026-05-22): `/intelligence` is a PUBLIC route. A
  // `?client=` URL param must never resolve tenant-scoped data unless the
  // request carries an authenticated session pinned to exactly one tenant.
  // For unauthenticated (or non-tenant-locked) visitors the param is
  // ignored entirely — the page resolves the active client only from
  // server-trusted sources (session pin / cookie / email) and renders the
  // generic/corpus-only public state. Honoring the param here previously
  // let an anonymous visitor read any tenant's real AI portfolio via
  // `/intelligence?client=apexretail`.
  const rawRequestedClient = firstSearchValue((await searchParams)?.client);
  const requestedClient = (await hasLockedTenantSession()) ? rawRequestedClient : null;
  const client = await getActiveClientRow(requestedClient).catch(() => null);
  const resolvedClientKey = client?.key ?? requestedClient;

  // Feature flag: context_corpus_explorer_enabled
  // When the active tenant has this flag, render the S1 Explorer shell.
  // Falls back to V3 for all other tenants.
  const featureFlagCtx = { clientKey: client?.key ?? null };
  if (isFeatureEnabled(featureFlagCtx, 'context_corpus_explorer_enabled')) {
    return (
      <IntelligenceExplorerPage
        tenantKey={client?.key ?? 'unknown'}
        tenantName={client?.name ?? 'SkyHarbor Air'}
      />
    );
  }

  const [
    { data, isLiveBound },
    vendorsData,
    byFunctionData,
    peerActivityData,
    myStrategyData,
    initiatives,
    intelligenceCorpusData,
    enterpriseContextOverview,
  ] = await Promise.all([
    buildIntelligenceV3PageData(resolvedClientKey),
    client ? getVendorsForClient(client.id).catch(() => null) : Promise.resolve(null),
    getByFunctionData().catch(() => null),
    getPeerActivityData().catch(() => null),
    getMyStrategyData().catch(() => null),
    client ? listInitiativesForClient(client.id).catch(() => []) : Promise.resolve([]),
    loadTenantIntelligenceCorpusData(client, resolvedClientKey).catch(() => null),
    client ? getEnterpriseContextOverviewForTenant(client.key, client.name).catch(() => null) : Promise.resolve(null),
  ]);

  return (
    <IntelligenceV3Page
      data={data}
      isLiveBound={isLiveBound}
      vendorsData={vendorsData}
      byFunctionData={byFunctionData}
      peerActivityData={peerActivityData}
      myStrategyData={myStrategyData}
      initiatives={initiatives}
      intelligenceCorpusData={intelligenceCorpusData}
      clientKey={client?.key ?? requestedClient ?? null}
      enterpriseContextOverview={enterpriseContextOverview}
    />
  );
}
