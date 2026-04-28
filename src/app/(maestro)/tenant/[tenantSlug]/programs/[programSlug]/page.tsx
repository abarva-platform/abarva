import { notFound, redirect } from 'next/navigation';
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

  redirect(`/programs/${context.program.programSlug}`);
}
