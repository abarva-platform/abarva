// INT-LNS-QUALITY — Intelligence knowledge quality lens page.
// I7: New server-component route providing a meta-view of the knowledge
// layer's own health. Deterministic view model via
// buildIntelligenceQualityLensView(); aggregates all pattern seed counts,
// contradiction status, solution count, and identified gaps.

import { IntelligenceQualityLensPage } from '@/components/intelligence/IntelligenceQualityLensPage';
import { getActiveClientRow } from '@/lib/active-client';
import { buildIntelligenceQualityLensView } from '@/lib/intelligence/intelligence-quality-lens-view';
import { isFeatureEnabled } from '@/lib/features/is-feature-enabled';

export const metadata = {
  title: 'Knowledge Quality · Intelligence',
};

export default async function QualityLensRoute() {
  const view = buildIntelligenceQualityLensView();
  const activeClient = await getActiveClientRow().catch(() => null);

  // First Recharts visualizations on the Quality lens, behind the
  // `intelligence_quality_charts` tenant flag. Flag-off (default), the charts
  // section is never rendered and the lens is unchanged.
  const chartsEnabled = isFeatureEnabled(
    {
      clientKey: activeClient?.key ?? null,
      clientId: activeClient?.id ?? null,
    },
    'intelligence_quality_charts',
  );

  return (
    <IntelligenceQualityLensPage
      view={view}
      tenantName={activeClient?.name ?? 'Client workspace'}
      showCharts={chartsEnabled}
    />
  );
}

// Per-request render (tenant-scoped reads / useSearchParams CSR bailout) — no static prerender.
export const dynamic = 'force-dynamic';
