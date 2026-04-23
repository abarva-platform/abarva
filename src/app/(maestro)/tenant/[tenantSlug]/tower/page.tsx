import { notFound } from 'next/navigation';
import { SeedTenantTower } from '@/components/deliverables/SeedRouteShell';
import { findTenantByRouteSlug } from '@/lib/deliverables/seed-route-resolver';

export default async function TenantTowerSeedPage({
  params,
}: {
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;
  const tenant = findTenantByRouteSlug(tenantSlug);
  if (!tenant) notFound();

  return <SeedTenantTower tenant={tenant} />;
}
