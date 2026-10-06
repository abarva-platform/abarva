import type { Metadata } from "next";
import { connection } from "next/server";

import { AppShell } from "@/components/shell/AppShell";
import { HomePreviewAppRoot } from "@/components/home/preview/HomePreviewAppRoot";
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

export const metadata: Metadata = {
  title: "Home | AbarVa",
  description:
    "AbarVa Home executive readout, evidence explorer, architecture workbench, and technology-estate browser.",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

function toHomeTenantKey(
  value: string | null | undefined,
): HomePreviewTenantKey | null {
  if (!value) return null;
  const tenantKey = canonicalTenantKey(value);
  return isHomePreviewTenantKey(tenantKey) ? tenantKey : null;
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ tenant?: string; provider?: string }>;
}) {
  await connection();

  const [tenant, params] = await Promise.all([
    resolveTenant().catch(() => null),
    searchParams,
  ]);
  const { tenant: requestedTenant, provider } = params;
  const activeTenantKey =
    toHomeTenantKey(tenant?.appClientKey) ??
    toHomeTenantKey(tenant?.displayName);
  const requestedTenantKey = toHomeTenantKey(requestedTenant);
  // This serves any preview tenant to any signed-in user and defaults an unresolved one to the
  // first, which is acceptable only while every key in HOME_PREVIEW_TENANT_KEYS is declared a
  // synthetic demo tenant in the tenant input registry: this page must gain a tenancy check, as
  // src/app/api/home/walkthrough-export/route.ts has, before a non-demo tenant is added to it.
  const tenantKey =
    requestedTenantKey ?? activeTenantKey ?? HOME_PREVIEW_TENANT_KEYS[0];
  const productProvider = resolveEclProductProvider(provider);
  const served = isEclProductProvider(productProvider)
    ? await getHomeEclProjectionBundleOrReviewedSnapshotWithSource(tenantKey)
    : null;
  const bundle = served?.bundle ?? getHomeReviewBundle(tenantKey);

  if (!bundle) {
    throw new Error(`Home: missing governed Home bundle for ${tenantKey}.`);
  }

  const recordSource = served?.recordSource ?? {
    kind: "reviewed_snapshot" as const,
    canonicalSnapshotHash: bundle.provenance.canonical_snapshot_hash,
  };

  const tenantName =
    canonicalClientDisplayName({
      key: tenantKey,
      name:
        !requestedTenantKey && activeTenantKey === tenantKey
          ? tenant?.displayName
          : undefined,
    }) ??
    canonicalClientDisplayName({ key: tenantKey }) ??
    tenant?.displayName ??
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
      <HomePreviewAppRoot
        bundle={bundle}
        recordSource={recordSource}
        recordToken={homeRecordSourceToken(tenantKey, recordSource)}
        tenantKey={tenantKey}
        requestedProvider={provider}
      />
    </AppShell>
  );
}
