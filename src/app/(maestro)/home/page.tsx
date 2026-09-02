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
import { canonicalTenantKey } from "@/lib/tenant/aliases";
import { resolveTenant } from "@/lib/tenant/resolveTenant";

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
  searchParams: Promise<{ tenant?: string }>;
}) {
  await connection();

  const [tenant, params] = await Promise.all([
    resolveTenant().catch(() => null),
    searchParams,
  ]);
  const activeTenantKey =
    toHomeTenantKey(tenant?.appClientKey) ??
    toHomeTenantKey(tenant?.displayName);
  const requestedTenantKey = toHomeTenantKey(params.tenant);
  const tenantKey =
    requestedTenantKey ?? activeTenantKey ?? HOME_PREVIEW_TENANT_KEYS[0];
  const served =
    tenantKey === "meridian-health"
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
      key: tenant?.appClientKey ?? tenantKey,
      name: tenant?.displayName,
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
        tenantKey={tenantKey}
      />
    </AppShell>
  );
}
