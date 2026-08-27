// Tenant-scoped Tower route. Tenant access is proven here, then passed to the
// shared Tower renderer so the route does not lose tenant scope through a
// generic query-param hop.

import { assertTenantAccess } from "@/lib/auth/tenant-access";
import { renderTowerPage } from "@/app/(maestro)/tower/page";

export default async function TenantTowerSeedPage({
  params,
  searchParams,
}: {
  params: Promise<{ tenantSlug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { tenantSlug } = await params;
  const access = await assertTenantAccess(tenantSlug);

  return renderTowerPage({
    searchParams,
    trustedTenant: {
      clientKey: access.clientKey,
      displayName: access.tenant.displayName,
    },
  });
}
