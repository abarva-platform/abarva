import { notFound } from 'next/navigation';
import { findTenantByRouteSlug } from '@/lib/deliverables/seed-route-resolver';
import { isTowerSubsurfaceSlug } from '@/lib/integrity/route-catalog';
import { SeedTenantTowerSubsurface } from '@/components/deliverables/SeedRouteShell';

export default async function TenantTowerSubsurfacePage({
  params,
}: {
  params: Promise<{ tenantSlug: string; surface: string }>;
}) {
  const { tenantSlug, surface } = await params;
  const tenant = findTenantByRouteSlug(tenantSlug);
  if (!tenant || !isTowerSubsurfaceSlug(surface)) notFound();

  return <SeedTenantTowerSubsurface tenant={tenant} surface={surface} />;
}
