import { notFound } from 'next/navigation';
import { findTenantByRouteSlug } from '@/lib/deliverables/seed-route-resolver';
import { isTowerSubsurfaceSlug } from '@/lib/integrity/route-catalog';
import { SeedTenantTowerSubsurface } from '@/components/deliverables/SeedRouteShell';
import { assertTenantAccess } from '@/lib/auth/tenant-access';
import { VendorPortfolioSurface } from '@/components/tower/VendorPortfolioSurface';
import { loadVendorPortfolio } from '@/lib/tower/vendor-portfolio';
import { isClientKey } from '@/lib/client-config';

export default async function TenantTowerSubsurfacePage({
  params,
}: {
  params: Promise<{ tenantSlug: string; surface: string }>;
}) {
  const { tenantSlug, surface } = await params;
  await assertTenantAccess(tenantSlug);
  const tenant = findTenantByRouteSlug(tenantSlug);
  if (!tenant || !isTowerSubsurfaceSlug(surface)) notFound();

  // F04 Z1-B · Vendor Portfolio gets real content from the seeded vendor
  // adapter. Other Tower subsurfaces stay on the scheduled-stub shell
  // until each is built out.
  if (surface === 'vendors' && isClientKey(tenant.tenantKey)) {
    const portfolio = await loadVendorPortfolio(tenant.tenantKey, tenant.displayName);
    if (portfolio) {
      return (
        <main style={{ minHeight: '100vh', background: '#F8F7F4', padding: '48px clamp(24px, 4vw, 72px)' }}>
          <div style={{ maxWidth: 1280, margin: '0 auto' }}>
            <VendorPortfolioSurface vm={portfolio} />
          </div>
        </main>
      );
    }
  }

  return <SeedTenantTowerSubsurface tenant={tenant} surface={surface} />;
}
