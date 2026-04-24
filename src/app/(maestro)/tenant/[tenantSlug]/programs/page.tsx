import { notFound } from 'next/navigation';
import { SeedProgramsIndex } from '@/components/deliverables/SeedRouteShell';
import { findTenantByRouteSlug } from '@/lib/deliverables/seed-route-resolver';
import { assertTenantAccess } from '@/lib/auth/tenant-access';

export default async function TenantProgramsSeedPage({
  params,
}: {
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;
  await assertTenantAccess(tenantSlug);
  const tenant = findTenantByRouteSlug(tenantSlug);
  if (!tenant) notFound();

  return <SeedProgramsIndex tenant={tenant} />;
}
