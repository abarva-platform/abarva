import { AppShell } from "@/components/shell/AppShell";
import { getActiveClientRow } from "@/lib/active-client";
import { canonicalClientDisplayName } from "@/lib/client-config";
import { TowerIframeContainer } from "./TowerIframeContainer";

export const metadata = { title: "IT Investment Tower · AbarVa" };
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function TowerPage() {
  const activeClient = await getActiveClientRow();
  const frameSrc = activeClient?.key
    ? `/api/tower/v2-frame?client=${encodeURIComponent(activeClient.key)}`
    : "/api/tower/v2-frame";
  const activeTenantName =
    canonicalClientDisplayName({
      key: activeClient?.key,
      name: activeClient?.name,
    }) ??
    activeClient?.name ??
    "Your workspace";

  return (
    <AppShell
      surface="tower"
      topBarProps={{
        tenantName: activeTenantName,
        showLocked: Boolean(activeClient?.key),
        context: "Tower",
      }}
      hasTenantKey={Boolean(activeClient?.key)}
    >
      <main
        style={{
          flex: 1,
          minHeight: 0,
          overflow: "hidden",
          background: "#f7f5ef",
        }}
      >
        <TowerIframeContainer src={frameSrc} />
      </main>
    </AppShell>
  );
}
