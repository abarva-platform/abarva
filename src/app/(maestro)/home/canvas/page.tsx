import type { Metadata } from "next";
import { connection } from "next/server";
import { AppShell } from "@/components/shell/AppShell";
import { HomeCanvasApp } from "@/components/home/canvas/HomeCanvasApp";
import { canonicalClientDisplayName } from "@/lib/client-config";
import {
  getHomeReviewBundle,
  HOME_PREVIEW_TENANT_KEYS,
  isHomePreviewTenantKey,
  type HomePreviewTenantKey,
} from "@/lib/home/preview/golden-snapshot";
import { getHomeEclProjectionBundleOrReviewedSnapshotWithSource } from "@/lib/home/preview/ecl-projection-bundle";
import { homeRecordSourceToken } from "@/lib/home/preview/record-source-token";
import { canonicalTenantKey } from "@/lib/tenant/aliases";
import { resolveTenant } from "@/lib/tenant/resolveTenant";
import {
  isEclProductProvider,
  resolveEclProductProvider,
} from "@/lib/ecl/product-provider";

export const metadata: Metadata = { title: "Home Canvas Preview | AbarVa" };
export const dynamic = "force-dynamic";
export const revalidate = 0;

function homeTenant(
  value: string | null | undefined,
): HomePreviewTenantKey | null {
  if (!value) return null;
  const key = canonicalTenantKey(value);
  return isHomePreviewTenantKey(key) ? key : null;
}

export default async function HomeCanvasPage({
  searchParams,
}: {
  searchParams: Promise<{ tenant?: string; provider?: string }>;
}) {
  await connection();
  const tenant = await resolveTenant().catch(() => null);
  const params = await searchParams;
  const activeTenant =
    homeTenant(tenant?.appClientKey) ?? homeTenant(tenant?.displayName);
  const requestedTenant = homeTenant(params.tenant);
  // The same synthetic-only allowlist and reader as the existing Home route.
  const tenantKey =
    requestedTenant ?? activeTenant ?? HOME_PREVIEW_TENANT_KEYS[0];
  const served = isEclProductProvider(
    resolveEclProductProvider(params.provider),
  )
    ? await getHomeEclProjectionBundleOrReviewedSnapshotWithSource(tenantKey)
    : null;
  const bundle = served?.bundle ?? getHomeReviewBundle(tenantKey);
  if (!bundle) throw new Error("Home canvas: governed bundle unavailable.");
  const recordSource = served?.recordSource ?? {
    kind: "reviewed_snapshot" as const,
    canonicalSnapshotHash: bundle.provenance.canonical_snapshot_hash,
  };
  const tenantName =
    canonicalClientDisplayName({
      key: tenantKey,
      name:
        !requestedTenant && activeTenant === tenantKey
          ? tenant?.displayName
          : undefined,
    }) ??
    canonicalClientDisplayName({ key: tenantKey }) ??
    "AbarVa Client";
  return (
    <AppShell
      surface="home"
      topBarProps={{
        tenantName,
        preserveTenantName: true,
        showLocked: true,
        context: "Home",
      }}
      hasTenantKey
    >
      <HomeCanvasApp
        bundle={bundle}
        recordSource={recordSource}
        recordToken={homeRecordSourceToken(tenantKey, recordSource)}
        tenantKey={tenantKey}
        tenantName={tenantName}
        requestedProvider={params.provider}
      />
    </AppShell>
  );
}
