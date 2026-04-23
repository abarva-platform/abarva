import { notFound } from 'next/navigation';
import { SeedTenantDashboard } from '@/components/deliverables/SeedRouteShell';
import { findTenantByRouteSlug } from '@/lib/deliverables/seed-route-resolver';

export default async function TenantSeedPage({
  params,
}: {
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;
  const tenant = findTenantByRouteSlug(tenantSlug);
  if (!tenant) notFound();

  return <SeedTenantDashboard tenant={tenant} />;
}
