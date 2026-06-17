// INT-IDX-SIGNALS — Signal stream index page.
// I3: IntelligenceSignalsIndexPage (server component) with ProvenanceRibbon.
// View model built server-side via buildIntelligenceSignalsIndexView().
// Signal rows link to individual signal detail pages.

import { TenantIdentityStrip } from '@/components/tenant/TenantIdentityStrip';
import { IntelligenceSignalsIndexPage } from '@/components/intelligence/IntelligenceSignalsIndexPage';
import { getActiveClientRow } from '@/lib/active-client';
import { buildIntelligenceSignalsIndexView } from '@/lib/intelligence/intelligence-signals-index-view';

export const metadata = {
  title: 'Signal Stream · Intelligence',
};

export default async function SignalsRoute() {
  const activeClient = await getActiveClientRow().catch(() => null);
  const view = buildIntelligenceSignalsIndexView();
  const tenantName = activeClient?.name ?? 'Client workspace';
  return (
    <>
      <div style={{ padding: '24px 32px 0', background: '#F8F7F4' }}>
        <TenantIdentityStrip clientName={activeClient?.name} surface="Intelligence signals" />
      </div>
      <IntelligenceSignalsIndexPage view={view} tenantName={tenantName} />
    </>
  );
}

// Per-request render (tenant-scoped reads / useSearchParams CSR bailout) — no static prerender.
export const dynamic = 'force-dynamic';
