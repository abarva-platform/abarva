import { notFound, redirect } from 'next/navigation';
import { findTenantByRouteSlug } from '@/lib/deliverables/seed-route-resolver';
import { isTowerSubsurfaceSlug } from '@/lib/integrity/route-catalog';
import { assertTenantAccess } from '@/lib/auth/tenant-access';

export default async function TenantTowerSubsurfacePage({
  params,
}: {
  params: Promise<{ tenantSlug: string; surface: string }>;
}) {
  const { tenantSlug, surface } = await params;
  await assertTenantAccess(tenantSlug);
  const tenant = findTenantByRouteSlug(tenantSlug);
  if (!tenant || !isTowerSubsurfaceSlug(surface)) notFound();

  const redirectParams = new URLSearchParams({ client: tenant.tenantKey });
  if (surface === 'vendors') redirectParams.set('view', 'evidence');
  redirect(`/tower?${redirectParams.toString()}`);
}
