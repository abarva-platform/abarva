import { AdminCanonShellV2 } from "@/components/admin/AdminCanonShellV2";
import { SetupChatRail } from "@/components/admin/SetupChatRail";
import { SetupAiInitiativesPage } from "@/components/admin/setup/SetupAiInitiativesPage";
import { getActiveClientRow } from "@/lib/active-client";
import { canonicalClientDisplayName } from "@/lib/client-config";
import {
  getSetupAiInitiatives,
  listPersistedSetupAiInitiatives,
  summarizeSetupAiInitiatives,
} from "@/lib/setup";

export const metadata = { title: "AI Initiatives · Setup · AbarVa" };
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminAiInitiativesPage() {
  const activeClient = await getActiveClientRow().catch(() => null);
  const tenantKey = activeClient?.key ?? "apexretail";
  const tenantName =
    canonicalClientDisplayName({
      key: activeClient?.key,
      name: activeClient?.name,
    }) ?? "Apex Retail Group";
  const persisted = await listPersistedSetupAiInitiatives({
    tenantKey,
    financialVisibility: false,
  }).catch(() => null);
  const fromPrivate =
    persisted?.status === "private_db" && persisted.initiatives.length > 0;
  const records = fromPrivate
    ? persisted.initiatives
    : getSetupAiInitiatives(tenantKey);
  return (
    <AdminCanonShellV2 agentRail={<SetupChatRail />} tenantName={tenantName}>
      <SetupAiInitiativesPage
        tenantName={tenantName}
        records={records}
        summary={summarizeSetupAiInitiatives(tenantKey, records)}
        source={fromPrivate ? "private_db" : "fixture_fallback"}
      />
    </AdminCanonShellV2>
  );
}
