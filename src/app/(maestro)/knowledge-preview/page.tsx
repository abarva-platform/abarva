import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";

import { AppShell } from "@/components/shell/AppShell";
import { isPlatformAdminSession } from "@/lib/auth/platform-admin-session";
import { isFeatureEnabled } from "@/lib/features/is-feature-enabled";
import { requireTenancy } from "@/lib/auth/tenancy";
import { listFixtureTenants, DEFAULT_FIXTURE_TENANT } from "@/lib/knowledge/fixtures";
import { KnowledgePreviewApp } from "@/components/knowledge/vnext/KnowledgePreviewApp";

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

export default async function KnowledgePreviewPage() {
  await connection();

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

  return (
    <AppShell surface="product" topBarProps={{ context: "Knowledge (vNext preview)" }}>
      <KnowledgePreviewApp
        fixtureTenants={fixtureTenants}
        defaultTenantKey={DEFAULT_FIXTURE_TENANT}
      />
    </AppShell>
  );
}
