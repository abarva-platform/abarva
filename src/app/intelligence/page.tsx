// /intelligence · Explore layer for AI bets.
//
// v3 (2026-05-07) reframe: pattern-to-Move funnel surface with
// Sentinel chat as a first-class three-mode layout.
//
// 2026-05-07 (live data wave): page reads the active tenant via
// getActiveClientRow → loads initiatives + goals + per-stage data
// in parallel → composes the v3 canvas data from real substrate.
//
// Spec: docs/build/intelligence/INTELLIGENCE_DESIGN_INTENT_2026-05-07.md
// Wireframe: docs/design-canon/wireframe-intelligence-v3-2026-05-07.html

import { IntelligenceV3Page } from '@/components/intelligence-v3/IntelligenceV3Page';
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
