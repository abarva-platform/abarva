import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";

import { AppShell } from "@/components/shell/AppShell";
import { isPlatformAdminSession } from "@/lib/auth/platform-admin-session";
import { isFeatureEnabled } from "@/lib/features/is-feature-enabled";
import { requireTenancy } from "@/lib/auth/tenancy";
import { listFixtureTenants, DEFAULT_FIXTURE_TENANT } from "@/lib/knowledge/fixtures";
import { KnowledgePreviewApp } from "@/components/knowledge/vnext/KnowledgePreviewApp";
import { canonicalTenantKey } from "@/lib/tenant/aliases";

/**
 * Home / Knowledge vNext — ADMIN PREVIEW ROUTE (isolated, not activated).
 *
 * - Gated to platform-admin sessions only (role/claim based, no email allowlist).
 *   `notFound()` for everyone else, including any signed-in tenant/maestro user.
 * - The feature flag `home_knowledge_vnext` is default-OFF for all tenants and is
 *   NOT the gate for admin preview; it exists so a pilot tenant can be enabled
 *   later. Tenant users never reach this route today.
 * - Serves ONLY contract-valid fixture packs (synthetic namespaces). No real
 *   tenant data, no legacy Home/V6/V7/SkyHarbor packs, no operational tables.
 * - The existing `/home` route is untouched; nothing here activates a tenant.
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

const ADMIN_HTTP_CANARY_TENANT = "airline-demo-new";

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

  // Admin-only. Role/claim based; no hard-coded email allowlist here.
  if (!(await isPlatformAdminSession())) {
    notFound();
  }

  // Consult the authenticated tenancy seam (never a browser-supplied key). Best
  // effort: an admin may have no bound client, and this preview uses fixtures,
  // so we do not fail the page if tenancy is unavailable.
  const tenancy = await requireTenancy().catch(() => null);

  // Flag is checked for transparency/telemetry; it governs FUTURE tenant
  // activation, not admin preview. Default OFF → never true for tenant users.
  const tenantFlagOn = isFeatureEnabled(
    { clientKey: tenancy?.clientKey ?? null, clientId: tenancy?.clientId ?? null },
    "home_knowledge_vnext",
  );
  void tenantFlagOn;

  const fixtureTenants = listFixtureTenants();
  const provider = firstParam(params.provider)?.toLowerCase();
  const requestedTenant = canonicalTenantKey(firstParam(params.tenant) ?? "");
  const useHttpCanary = provider === "http";
  if (useHttpCanary && requestedTenant !== ADMIN_HTTP_CANARY_TENANT) {
    notFound();
  }

  return (
    <AppShell surface="product" topBarProps={{ context: "Knowledge (vNext preview)" }}>
      <KnowledgePreviewApp
        fixtureTenants={fixtureTenants}
        defaultTenantKey={DEFAULT_FIXTURE_TENANT}
        source={
          useHttpCanary
            ? {
                kind: "http",
                tenantKey: ADMIN_HTTP_CANARY_TENANT,
                adminCanaryTenantKey: ADMIN_HTTP_CANARY_TENANT,
                modelsEnabled: firstParam(params.models) === "on",
              }
            : undefined
        }
      />
    </AppShell>
  );
}
