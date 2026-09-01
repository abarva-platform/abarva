import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { WorkspaceClientLoader } from "./WorkspaceClientLoader";
import { getActiveClientRow } from "@/lib/active-client";
import { checkTenantAccessByKey } from "@/lib/auth/tenant-access";
import { requireTenancy, TenancyError } from "@/lib/auth/tenancy";
import { canonicalClientDisplayName } from "@/lib/client-config";
import { SOURCE_V4_CUBE_AS_OF_DATE } from "@/lib/source/data-model/source-v4-cube-ui-catalog";
import {
  appClientKeyForTenant,
  tenantProfileForClientKey,
} from "@/lib/tenant/aliases";
import { resolveTenant } from "@/lib/tenant/resolveTenant";
import type { SourceWorkspaceProviderMode } from "../preview/workspace/live/portfolioAdapter";

export const metadata: Metadata = {
  title: "Source Workspace · AbarVa",
};

export const dynamic = "force-dynamic";

// Source V4 and the contract-depth Source package carry a governed as-of date.
// Renewal and notice math must use that stable cut by default; `?asOf=`
// remains the operator override for explicit live-date comparisons.
const SOURCE_WORKSPACE_DEFAULT_AS_OF = `${SOURCE_V4_CUBE_AS_OF_DATE}T00:00:00Z`;

/**
 * /source/workspace — product Source workspace: native analytical canvas +
 * contextual Ask aVa, bound to the governed Source data plane
 * (source.contract_360, source.vendor_contract_portfolio,
 * source.contract_application_scope, source.contract_initiative_dependency).
 * Reads only; never writes. See docs/architecture/SOURCE_WORKSPACE_FIXTURE_AUDIT.md
 * for what was fabricated in the earlier illustrative build and how each
 * figure here now traces back to a real row or a governed pure function.
 */
export default async function SourceWorkspacePage({
  searchParams,
}: {
  searchParams: Promise<{
    asOf?: string;
    client?: string;
    contractId?: string;
    contractTab?: string;
    provider?: string;
    sourceProvider?: string;
    tab?: string;
  }>;
}) {
  let tenancy;
  try {
    tenancy = await requireTenancy();
  } catch (err) {
    if (err instanceof TenancyError && err.code === "unauthenticated") {
      redirect("/sign-in");
    }
    throw err;
  }

  const params = await searchParams;
  const requestedClient = params.client?.trim() || null;
  const requestedContractId = params.contractId?.trim() || null;
  const requestedContractTab =
    params.contractTab?.trim() || params.tab?.trim() || null;
  const requestedSourceProvider = sourceProviderOverrideFromRequest(
    params.sourceProvider ?? params.provider,
  );
  const requestedClientKey = appClientKeyForTenant(requestedClient);
  if (requestedClient && !requestedClientKey) {
    notFound();
  }
  if (requestedClientKey && requestedClientKey !== tenancy.clientKey) {
    const access = await checkTenantAccessByKey(requestedClientKey);
    if (!access.ok) {
      if (access.reason === "tenant_not_found") {
        notFound();
      }
      if (access.reason === "unauthenticated") {
        redirect("/sign-in");
      }
      return <SourceWorkspaceTenantAccessDenied />;
    }
  }

  const tenant = requestedClientKey
    ? null
    : await resolveTenant({ allowFallback: true }).catch(() => null);
  const activeClient = requestedClientKey
    ? null
    : tenant
      ? await getActiveClientRow(tenant.appClientKey).catch(() => null)
      : null;
  const requestedTenantProfile = requestedClientKey
    ? tenantProfileForClientKey(requestedClientKey)
    : null;

  const tenantKey =
    requestedClientKey ??
    activeClient?.key ??
    tenant?.appClientKey ??
    tenancy.clientKey ??
    "";
  const defaultAsOf = SOURCE_WORKSPACE_DEFAULT_AS_OF;
  const asOfDateIso = params.asOf?.trim() || defaultAsOf;

  const tenantName =
    canonicalClientDisplayName({
      key: tenantKey,
      name:
        activeClient?.name ??
        requestedTenantProfile?.displayName ??
        tenant?.displayName,
    }) ??
    requestedTenantProfile?.displayName ??
    tenant?.displayName ??
    "AbarVa Client";

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
      }}
    >
      <WorkspaceClientLoader
        tenantName={tenantName}
        tenantKey={tenantKey}
        asOfDateIso={asOfDateIso}
        sourceProviderKey={requestedSourceProvider}
        initialContractId={requestedContractId}
        initialContractTab={requestedContractTab}
      />
    </div>
  );
}

function SourceWorkspaceTenantAccessDenied() {
  return (
    <div
      style={{
        minHeight: "100%",
        display: "grid",
        placeItems: "center",
        padding: "48px 24px",
        background: "#f5f7fb",
      }}
    >
      <section
        role="status"
        aria-live="polite"
        style={{
          width: "min(560px, 100%)",
          border: "1px solid #d7deea",
          borderRadius: 12,
          background: "#ffffff",
          boxShadow: "0 18px 48px rgba(15, 23, 42, 0.08)",
          padding: 28,
        }}
      >
        <p
          style={{
            margin: "0 0 10px",
            color: "#5d6b82",
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          Source workspace blocked
        </p>
        <h1
          style={{
            margin: 0,
            color: "#0f1f3d",
            fontSize: 28,
            lineHeight: 1.12,
            letterSpacing: 0,
          }}
        >
          This session cannot open the requested tenant.
        </h1>
        <p
          style={{
            margin: "14px 0 0",
            color: "#475569",
            fontSize: 15,
            lineHeight: 1.6,
          }}
        >
          No Source contracts, vendor rollups, claim cards, evidence, or aVa
          grounding bundles were loaded. Switch to an authorized tenant session
          before using this workspace.
        </p>
      </section>
    </div>
  );
}

function sourceProviderOverrideFromRequest(
  value?: string,
): SourceWorkspaceProviderMode | null {
  if (process.env.SOURCE_WORKSPACE_ALLOW_PROVIDER_QUERY_OVERRIDE !== "true") {
    return null;
  }
  const normalized = value?.trim();
  if (
    normalized === "legacy" ||
    normalized === "ecl_projection" ||
    normalized === "ecl_projection_db"
  ) {
    return normalized;
  }
  return null;
}
