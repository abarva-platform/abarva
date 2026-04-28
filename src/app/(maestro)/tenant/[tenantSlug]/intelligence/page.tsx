// INTEL4 · Intelligence Lens Tabs wired into tenant Intelligence page.
//
// I1: Old route shell retired (audit §1 gap G4). IntelligenceLensTabs renders
// directly — AppChrome from (maestro) layout provides the outer chrome.
//
// Tab switching is URL-searchParam-driven (?tab=<key>).
// No client state. Server component only.

import { notFound } from 'next/navigation';
import { assertTenantAccess } from '@/lib/auth/tenant-access';
import { findTenantByRouteSlug } from '@/lib/deliverables/seed-route-resolver';
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
    <IntelligenceLensTabs
      tenant={tenant}
      activeTab={activeTab}
      baseUrl={baseUrl}
    />
  );
}
