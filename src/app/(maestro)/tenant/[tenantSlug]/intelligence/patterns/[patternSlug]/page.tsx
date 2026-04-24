import { notFound } from 'next/navigation';
import { SeedTenantPattern } from '@/components/deliverables/SeedRouteShell';
import { findTenantByRouteSlug } from '@/lib/deliverables/seed-route-resolver';
import { assertTenantAccess } from '@/lib/auth/tenant-access';

export default async function TenantPatternSeedPage({
  params,
}: {
  params: Promise<{ tenantSlug: string; patternSlug: string }>;
}) {
  const { tenantSlug, patternSlug } = await params;
  await assertTenantAccess(tenantSlug);
  const tenant = findTenantByRouteSlug(tenantSlug);
  if (!tenant) notFound();

  return <SeedTenantPattern tenant={tenant} patternSlug={patternSlug} />;
}
