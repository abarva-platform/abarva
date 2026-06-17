// INT-LNS-QUALITY — Intelligence knowledge quality lens page.
// I7: New server-component route providing a meta-view of the knowledge
// layer's own health. Deterministic view model via
// buildIntelligenceQualityLensView(); aggregates all pattern seed counts,
// contradiction status, solution count, and identified gaps.

import { IntelligenceQualityLensPage } from '@/components/intelligence/IntelligenceQualityLensPage';
import { getActiveClientRow } from '@/lib/active-client';
import { buildIntelligenceQualityLensView } from '@/lib/intelligence/intelligence-quality-lens-view';

export const metadata = {
  title: 'Knowledge Quality · Intelligence',
};

export default async function QualityLensRoute() {
  const view = buildIntelligenceQualityLensView();
  const activeClient = await getActiveClientRow().catch(() => null);
  return (
    <IntelligenceQualityLensPage
      view={view}
      tenantName={activeClient?.name ?? 'Client workspace'}
    />
  );
}

// Per-request render (tenant-scoped reads / useSearchParams CSR bailout) — no static prerender.
export const dynamic = 'force-dynamic';
