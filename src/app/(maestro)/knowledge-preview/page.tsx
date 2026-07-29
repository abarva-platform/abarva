import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";

import { AppShell } from "@/components/shell/AppShell";
import {
  isFoundationPreviewTenantKey,
  isFoundationPreviewTenantSession,
} from "@/lib/auth/foundation-preview-session";
import { isPlatformAdminSession } from "@/lib/auth/platform-admin-session";
import { isFeatureEnabled } from "@/lib/features/is-feature-enabled";
import { requireTenancy } from "@/lib/auth/tenancy";
import {
  DEFAULT_FIXTURE_TENANT,
  listFixtureTenants,
} from "@/lib/knowledge/fixtures";
import { KnowledgePreviewApp } from "@/components/knowledge/vnext/KnowledgePreviewApp";
import { canonicalTenantKey } from "@/lib/tenant/aliases";

/**
 * Home / Knowledge vNext — governed preview route.
 *
 * - Fixture preview remains platform-admin only.
 * - HTTP preview accepts platform-admins and foundation proof users pinned by
 *   Clerk metadata to a foundation tenant.
 * - HTTP preview uses governed consumption APIs. It must not fall back to
 *   legacy Home packs, fixtures, or old tenant aliases.
 * - `/home` redirects foundation tenants here so the old Home shells stay
 *   archived for foundation proof sessions.
 */
export const metadata: Metadata = {
  title: "Knowledge (vNext preview) | AbarVa",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface PageSearchParams {
  provider?: string | string[];
  tenant?: string | string[];
  models?: string | string[];
}

function firstParam(value: string | string[] | undefined): string | null {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

export default async function KnowledgePreviewPage({
  searchParams,
}: {
  searchParams?: Promise<PageSearchParams>;
}) {
  await connection();
  const params = searchParams ? await searchParams : {};

  const fixtureTenants = listFixtureTenants();
  const provider = firstParam(params.provider)?.toLowerCase();
  const requestedTenant = canonicalTenantKey(firstParam(params.tenant) ?? "");
  const useHttpCanary = provider === "http";
  if (useHttpCanary && !isFoundationPreviewTenantKey(requestedTenant)) {
    notFound();
  }
  const hasPlatformAdmin = await isPlatformAdminSession();
  const hasFoundationPreviewAccess =
    useHttpCanary &&
    (await isFoundationPreviewTenantSession(requestedTenant));

  // Fixture preview remains admin-only. The HTTP path also accepts explicit
  // foundation proof users whose Clerk metadata is pinned to the requested
  // baseline tenant. That lets Airline/Healthcare foundation tenants be
  // browser-proven before the legacy product-wide ClientKey migration.
  if (!hasPlatformAdmin && !hasFoundationPreviewAccess) {
    notFound();
  }

  // Consult the authenticated tenancy seam (never a browser-supplied key). Best
  // effort: a platform admin or foundation proof user may have no legacy bound
  // client, and this preview only uses the governed HTTP consumption path.
  const tenancy = await requireTenancy().catch(() => null);

  // Flag is checked for transparency/telemetry; it governs FUTURE tenant
  // activation, not admin/proof preview. Default OFF → never true for tenant users.
  const tenantFlagOn = isFeatureEnabled(
    {
      clientKey: tenancy?.clientKey ?? null,
      clientId: tenancy?.clientId ?? null,
    },
    "home_knowledge_vnext",
  );
  void tenantFlagOn;

  return (
    <AppShell
      surface="product"
      topBarProps={{ context: "Knowledge (vNext preview)" }}
    >
      <KnowledgePreviewApp
        fixtureTenants={fixtureTenants}
        defaultTenantKey={DEFAULT_FIXTURE_TENANT}
        source={
          useHttpCanary
            ? {
                kind: "http",
                tenantKey: requestedTenant,
                adminCanaryTenantKey: requestedTenant,
                modelsEnabled: firstParam(params.models) === "on",
              }
            : undefined
        }
      />
    </AppShell>
  );
}
