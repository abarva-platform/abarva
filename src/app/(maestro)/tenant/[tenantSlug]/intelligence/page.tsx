import { notFound } from 'next/navigation';
import { assertTenantAccess } from '@/lib/auth/tenant-access';
import { findTenantByRouteSlug } from '@/lib/deliverables/seed-route-resolver';
import { SentinelActivePatterns } from '@/components/intelligence/SentinelActivePatterns';

export default async function TenantIntelligencePage({
  params,
}: {
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;
  await assertTenantAccess(tenantSlug);
  const tenant = findTenantByRouteSlug(tenantSlug);
  if (!tenant) notFound();

  return (
    <main
      style={{
        padding: '24px clamp(16px, 4vw, 40px)',
        background: '#F8F7F4',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      <SentinelActivePatterns tenant={tenant} />
    </main>
  );
}
