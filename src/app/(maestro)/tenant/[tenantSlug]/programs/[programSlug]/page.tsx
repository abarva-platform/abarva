import { notFound } from 'next/navigation';
import { ProgramCanonicalDetail } from '@/components/programs/ProgramCanonicalDetail';
import { findProgramByRoute } from '@/lib/deliverables/seed-route-resolver';
import { assertTenantAccess } from '@/lib/auth/tenant-access';

export default async function TenantProgramCanonicalPage({
  params,
}: {
  params: Promise<{ tenantSlug: string; programSlug: string }>;
}) {
  const { tenantSlug, programSlug } = await params;
  await assertTenantAccess(tenantSlug);
  const context = findProgramByRoute(tenantSlug, programSlug);
  if (!context) notFound();

  return <ProgramCanonicalDetail tenant={context.tenant} program={context.program} />;
}
