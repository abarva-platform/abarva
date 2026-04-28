import { notFound } from 'next/navigation';
import { ProgramsCanonicalIndex } from '@/components/programs/ProgramsCanonicalIndex';
import { ProgramCanonShell } from '@/components/programs/ProgramCanonShell';
import { findTenantByRouteSlug } from '@/lib/deliverables/seed-route-resolver';
import { assertTenantAccess } from '@/lib/auth/tenant-access';

export default async function TenantProgramsCanonicalPage({
  params,
}: {
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;
  await assertTenantAccess(tenantSlug);
  const tenant = findTenantByRouteSlug(tenantSlug);
  if (!tenant) notFound();

  return (
    <ProgramCanonShell
      title={`${tenant.displayName} programs`}
      summary="Canonical tenant program portfolio with phase/gate progression, deliverable/evidence signals, and mission orientation."
    >
      <ProgramsCanonicalIndex tenant={tenant} />
    </ProgramCanonShell>
  );
}
