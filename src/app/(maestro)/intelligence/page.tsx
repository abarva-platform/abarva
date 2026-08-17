// /intelligence · Advisory board surface.

import { AppShell } from "@/components/shell/AppShell";
import { AdvisoryIntelligencePage } from "@/components/intelligence-advisory/AdvisoryIntelligencePage";
import {
  getActiveClientRow,
  hasLockedTenantSession,
} from "@/lib/active-client";
import { canonicalClientDisplayName } from "@/lib/client-config";
import { getEnterpriseLandscapeViewModel } from "@/lib/home/enterprise-landscape-view-model";
import { buildCanonicalLandscapeSections } from "@/lib/intelligence/canonical-landscape-sections";
import { resolveIntelligenceViewModelClientKey } from "@/lib/intelligence/intelligence-view-model-client-key";
import { resolveTenant } from "@/lib/tenant/resolveTenant";

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

  // Canonical first. The authored view model stays as a fallback for the case where the projector
  // has not yet run for a tenant, but it is a fallback and is labelled as one — the previous
  // behaviour was to render authored content under a "current state assessment" heading with
  // nothing distinguishing it from a client fact.
  const canonical = await buildCanonicalLandscapeSections(contextTenantKey, tenantName);
  const authored = getEnterpriseLandscapeViewModel({
    clientKey: viewModelClientKey,
    tenantName,
  });
  const viewModel = canonical
    ? { ...authored, sections: canonical.sections }
    : authored;

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
      <AdvisoryIntelligencePage viewModel={viewModel} />
    </AppShell>
  );
}
