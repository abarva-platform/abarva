import { getActiveClientRow } from "@/lib/active-client";
import { resolveAdminTenant } from "@/lib/admin/admin-tenant";
import { cachedInventorySnapshot } from "@/app/(maestro)/admin/_cached-helpers";
import { clientKeyToInventorySubstrateKey } from "@/lib/agent/tools/intelligence/_shared";
import { AdminSetupExperience } from "@/components/admin/AdminSetupExperience";
import { AppShell } from "@/components/shell/AppShell";
import { getTenantSourceFiles } from "@/lib/context-ingestion/tenant-context-read-model";
import { buildLoadStudioView } from "@/lib/admin/setup-load-studio-view";
import { buildAdminSetupControlReadModel } from "@/lib/admin/setup-control";
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
  const sourceFiles = await getTenantSourceFiles(activeClient?.id ?? "").catch(
    () => [],
  );
  const setupControl = buildAdminSetupControlReadModel({
    tenantKey: clientKey,
    displayName: tenant.tenantName,
    coverName: getClientOption(clientKey).name,
    snapshot,
    sourceFiles,
  });

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
        setupControl={setupControl}
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
