import { notFound } from 'next/navigation';
import { assertTenantAccess } from '@/lib/auth/tenant-access';
import { findTenantByRouteSlug } from '@/lib/deliverables/seed-route-resolver';
import { SeedTenantPattern } from '@/components/deliverables/SeedRouteShell';
import { SentinelPatternDetail } from '@/components/intelligence/SentinelPatternDetail';
import { IntelligenceCanvasModeTabs } from '@/components/intelligence/IntelligenceCanvasModeTabs';
import {
  buildSentinelPatternDetailView,
  isSentinelPatternKey,
} from '@/lib/intelligence/sentinel-pattern-view';

export default async function TenantPatternDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ tenantSlug: string; patternKey: string }>;
  searchParams?: Promise<{ canvas?: string | string[] }>;
}) {
  const { tenantSlug, patternKey } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  await assertTenantAccess(tenantSlug);
  const tenant = findTenantByRouteSlug(tenantSlug);
  if (!tenant) notFound();

  if (isSentinelPatternKey(patternKey)) {
    const view = buildSentinelPatternDetailView(tenant, patternKey);
    if (!view) notFound();
    return (
      <main
        style={{
          padding: '24px clamp(16px, 4vw, 40px)',
          background: '#F8F7F4',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          gap: 18,
        }}
      >
        <IntelligenceCanvasModeTabs
          patternKey={patternKey}
          tenantSlug={tenantSlug}
          searchParams={resolvedSearchParams}
        />
        <SentinelPatternDetail view={view} />
      </main>
    );
  }

  return <SeedTenantPattern tenant={tenant} patternSlug={patternKey} />;
}
