import { notFound } from "next/navigation";
import { isTowerSubsurfaceSlug } from "@/lib/integrity/route-catalog";
import { assertTenantAccess } from "@/lib/auth/tenant-access";
import { renderTowerPage } from "@/app/(maestro)/tower/page";

const SURFACE_TO_TOWER_TAB: Record<string, string> = {
  vendors: "evidence",
  regulatory: "evidence",
  council: "lanes",
  models: "ai",
  "shadow-ai": "ai",
  value: "funnel",
};

export default async function TenantTowerSubsurfacePage({
  params,
}: {
  params: Promise<{ tenantSlug: string; surface: string }>;
}) {
  const { tenantSlug, surface } = await params;
  const access = await assertTenantAccess(tenantSlug);
  if (!isTowerSubsurfaceSlug(surface) && surface !== "value") notFound();

  return renderTowerPage({
    searchParams: Promise.resolve({
      tab: SURFACE_TO_TOWER_TAB[surface] ?? "command",
    }),
    trustedTenant: {
      clientKey: access.clientKey,
      displayName: access.tenant.displayName,
    },
  });
}
