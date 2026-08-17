// /intelligence · Advisory board surface.

import { AppShell } from "@/components/shell/AppShell";
import { ProductFanoutSummaryStrip } from "@/components/enterprise-data/ProductFanoutSummaryStrip";
import { AdvisoryIntelligencePage } from "@/components/intelligence-advisory/AdvisoryIntelligencePage";
import {
  getActiveClientRow,
  hasLockedTenantSession,
} from "@/lib/active-client";
import { canonicalClientDisplayName } from "@/lib/client-config";
import { getEnterpriseLandscapeViewModel } from "@/lib/home/enterprise-landscape-view-model";
import { resolveIntelligenceViewModelClientKey } from "@/lib/intelligence/intelligence-view-model-client-key";
import { resolveTenant } from "@/lib/tenant/resolveTenant";
import { listProductFanoutTotals } from "@/lib/enterprise-data/product-fanout-summary";

export const metadata = {
  title: "Intelligence · Advisory Board | AbarVa",
  description:
    "A virtual advisory board that turns enterprise context and corpus knowledge into guidance, risks, benchmarks, and next actions.",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface IntelligencePageProps {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

function firstSearchValue(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function enterpriseContextTenantKey(
  value: string | null | undefined,
): string | null {
  const key = value?.trim().toLowerCase();
  if (!key) return null;
  if (key === "arcturus" || key === "firstcapital") return "first-capital";
  if (key === "meridian") return "meridian-health";
  if (key === "apexretail") return "apex-retail";
  return key;
}

export default async function IntelligencePage({
  searchParams,
}: IntelligencePageProps = {}) {
  const rawRequestedClient = firstSearchValue((await searchParams)?.client);
  const requestedClient = (await hasLockedTenantSession())
    ? rawRequestedClient
    : null;
  const [client, tenant] = await Promise.all([
    getActiveClientRow(requestedClient).catch(() => null),
    resolveTenant({ requestedClient }).catch(() => null),
  ]);
  const effectiveClientKey = client?.key ?? tenant?.appClientKey ?? null;
  const contextTenantKey = enterpriseContextTenantKey(
    effectiveClientKey ?? requestedClient,
  );
  const viewModelClientKey = resolveIntelligenceViewModelClientKey({
    clientKey: effectiveClientKey,
    requestedClient,
    contextTenantKey,
  });
  const tenantName =
    canonicalClientDisplayName({
      key: effectiveClientKey,
      name: client?.name ?? tenant?.displayName,
    }) ??
    client?.name ??
    tenant?.displayName ??
    "AbarVa Client";
  const productFanout = await listProductFanoutTotals({
    tenantKeyCandidates: [
      effectiveClientKey,
      requestedClient,
      contextTenantKey,
      tenant?.canonicalKey,
      tenant?.brokerKey,
    ],
  });

  return (
    <AppShell
      surface="intelligence"
      topBarProps={{
        tenantName,
        showLocked: Boolean(effectiveClientKey),
        context: "Intelligence",
      }}
      hasTenantKey={Boolean(effectiveClientKey)}
    >
      <div className="bg-[#f7f7f2] px-8 pt-8">
        <div className="mx-auto max-w-7xl">
          <ProductFanoutSummaryStrip
            rows={productFanout}
            activeProduct="intelligence"
          />
        </div>
      </div>
      <AdvisoryIntelligencePage
        viewModel={getEnterpriseLandscapeViewModel({
          clientKey: viewModelClientKey,
          tenantName,
        })}
      />
    </AppShell>
  );
}
