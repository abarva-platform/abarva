// INTEL4 · Intelligence Lens Tabs wired into tenant Intelligence page.
//
// Replaces the single-view SentinelActivePatterns render with a
// four-tab lens surface: Overview · Patterns · Evidence · Signals.
//
// Tab switching is URL-searchParam-driven (?tab=<key>).
// No client state. Server component only.

import { notFound } from 'next/navigation';
import { assertTenantAccess } from '@/lib/auth/tenant-access';
import { findTenantByRouteSlug } from '@/lib/deliverables/seed-route-resolver';
import { IntelligenceRouteShell } from '@/components/intelligence/IntelligenceRouteShell';
import { IntelligenceLensTabs } from '@/components/intelligence/IntelligenceLensTabs';
import { resolveIntelligenceTab } from '@/lib/intelligence/intelligence-lens-tabs-view';

export default async function TenantIntelligencePage({
  params,
  searchParams,
}: {
  params: Promise<{ tenantSlug: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tenantSlug } = await params;
  const { tab } = await searchParams;

  await assertTenantAccess(tenantSlug);
  const tenant = findTenantByRouteSlug(tenantSlug);
  if (!tenant) notFound();

  const activeTab = resolveIntelligenceTab(tab);
  const baseUrl = `/tenant/${tenantSlug}/intelligence`;

  return (
    <IntelligenceRouteShell tenantName={tenant.displayName} pageMode="index" dataTier="thin">
      <IntelligenceLensTabs
        tenant={tenant}
        activeTab={activeTab}
        baseUrl={baseUrl}
      />
    </IntelligenceRouteShell>
  );
}
