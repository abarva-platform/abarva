import { redirect } from 'next/navigation';
import { assertTenantAccess } from '@/lib/auth/tenant-access';

export default async function TenantProgramsCanonicalPage({
  params,
}: {
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;
  await assertTenantAccess(tenantSlug);
  redirect('/programs');
}
