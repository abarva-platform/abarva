import { getActiveClientRow } from "@/lib/active-client";
import { resolveAdminTenant } from "@/lib/admin/admin-tenant";
import { cachedInventorySnapshot } from "@/app/(maestro)/admin/_cached-helpers";
import { clientKeyToInventorySubstrateKey } from "@/lib/agent/tools/intelligence/_shared";
import { AdminSetupExperience } from "@/components/admin/AdminSetupExperience";
import { AppShell } from "@/components/shell/AppShell";
import { getTenantSourceFiles } from "@/lib/context-ingestion/tenant-context-read-model";
import { buildLoadStudioView } from "@/lib/admin/setup-load-studio-view";
import { getClientOption, isClientKey } from "@/lib/client-config";

export const metadata = { title: "Setup · AbarVa" };
export const dynamic = "force-dynamic";
export const revalidate = 0;

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "AV";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[parts.length - 1]![0] ?? ""}`.toUpperCase();
}

export default async function AdminSetupPage() {
  const tenant = await resolveAdminTenant();
  const activeClient = await getActiveClientRow().catch(() => null);
  const clientKey = tenant.clientKey;
  const brokerTenantKey = clientKeyToInventorySubstrateKey(clientKey);
  const snapshot = await cachedInventorySnapshot(brokerTenantKey);
  const vertical = isClientKey(clientKey)
    ? getClientOption(clientKey).vertical
    : (activeClient?.industry_code ?? "Enterprise");
  const view = buildLoadStudioView({
    tenantName: tenant.tenantName,
    vertical,
    snapshot,
  });

  // For the section-01 (Readiness across modules) and section-05
  // (Setup panels) blocks the eager static composer still owns the
  // data path. They are part of the same `extras` payload. The
  // `blocks` static prop is left empty-shaped so the Suspense-driven
  // zones own the live content path.
  const emptyBlocks = composeOverviewBlocks({
    tenantName: activeClientDisplayName,
    industryCode: activeClient?.industry_code,
    clientKey,
    segments,
    content,
    programApprovalPendingCount: 0,
    atlasSignalCount: 0,
    atlasHighSeverityCount: 0,
    ssoConfigured: false,
    recentSnapshotActivity: [],
  });

  const ctx: ZoneContext = {
    brokerTenantKey,
    clientKey,
    clientId,
    activeClientDisplayName,
    industryCode: activeClient?.industry_code ?? null,
    baseContentClientKey: clientKey,
  };
  const clientOption = getClientOption(clientKey);
  const tenantTabConfig: TenantConfig = {
    name: activeClientDisplayName,
    slug: tenant.tenantSlug,
    industry: clientOption.vertical,
    region: activeClient?.industry_code ?? 'Tenant configured',
    tier: 'Enterprise',
    status: 'locked',
    contractStart: 'Tenant record',
    contractEnd: 'Tenant record',
    renewalOwner: 'Tenant success',
    programCount: programsCount,
    activePrograms: programsCount,
    dataResidency: 'Tenant configured',
    ssoProvider: 'Tenant configured',
    createdDate: 'Tenant record',
  };
  return (
    <AppShell
      surface="setup"
      topBarProps={{
        tenantName: tenant.tenantName,
        showLocked: true,
        context: "Setup",
      }}
      showProductNav={false}
    >
      <AdminSetupExperience
        tenantName={tenant.tenantName}
        tenantInitials={initialsOf(tenant.tenantName)}
        tenantKey={clientKey}
        clientId={activeClient?.id ?? ""}
        view={view}
        sourceFiles={sourceFiles.map((file) => ({
          sourceDoc: file.source_doc,
          chunkCount: file.chunk_count,
          firstLoadedAt: file.first_loaded_at,
          sampleChunkId: file.sample_chunk_id,
        }))}
      />
    </AppShell>
  );
}
