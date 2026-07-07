import { IntelligenceAuthorPage } from '@/components/intelligence/IntelligenceAuthorPage';
import { getActiveClientRow } from '@/lib/active-client';
import { buildIntelligenceAuthorPageView } from '@/lib/intelligence/intelligence-i6-view';

// Per-request render: the page reads the active client (per-request DB) and the
// client component uses useSearchParams, which bails out of static CSR — so it
// must not be statically prerendered. Matches the sibling intelligence routes
// (map, brief, context-demo, [patternId]) which all set force-dynamic.
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Pattern authoring · Intelligence',
};

export default async function IntelligenceAuthorRoute() {
  const activeClient = await getActiveClientRow().catch(() => null);
  return (
    <IntelligenceAuthorPage
      view={buildIntelligenceAuthorPageView()}
      tenantName={activeClient?.name ?? 'Client workspace'}
    />
  );
}
