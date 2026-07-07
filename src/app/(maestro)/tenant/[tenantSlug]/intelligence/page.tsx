// Tenant intelligence URLs are compatibility deep links only.
// The canonical surface is /intelligence so the retired lens/explorer pages
// cannot appear through an alternate tenant route.

import { notFound, redirect } from 'next/navigation';
import { assertTenantAccess } from '@/lib/auth/tenant-access';
import { findTenantByRouteSlug } from '@/lib/deliverables/seed-route-resolver';

export default async function TenantIntelligencePage({
  params,
}: {
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;

  await assertTenantAccess(tenantSlug);
  const tenant = findTenantByRouteSlug(tenantSlug);
  if (!tenant) notFound();

  redirect(`/intelligence?client=${encodeURIComponent(tenant.tenantKey)}`);
}
