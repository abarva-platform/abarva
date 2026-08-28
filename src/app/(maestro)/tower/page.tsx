// Tower — primary route.
//
// As of 2026-07-23 this always serves the **Command Center** (the rebuilt page
// against `docs/design/tower/command-center-2026-07-23/`). The previous Tower
// page is no longer a runtime fallback.

import { Suspense } from "react";

import { AppShell } from "@/components/shell/AppShell";
import { TowerCommandCenterAvaShell } from "@/components/tower/command-center/TowerCommandCenterAvaShell";
import {
  getActiveClientRow,
  hasLockedTenantSession,
} from "@/lib/active-client";
import { canonicalClientDisplayName } from "@/lib/client-config";
import { loadTowerMartCommandView } from "@/lib/cio-tower/tower-mart-view-model";
import { buildTowerCommandCenterView } from "@/lib/tower/command-center/view-model";

export const metadata = { title: "Tower · AbarVa" };
export const dynamic = "force-dynamic";
export const revalidate = 0;

/** Keep the mart read bounded so sparse/private data states still render. */
const TOWER_READ_TIMEOUT_MS = 8_000;

interface TowerPageProps {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

interface TrustedTowerTenant {
  clientKey: string;
  displayName?: string | null;
}

interface RenderTowerPageProps extends TowerPageProps {
  /**
   * Tenant-scoped routes prove access before calling the shared renderer. This
   * keeps legacy tenant Tower URLs on the new contract surface without falling
   * back through a generic query-param route.
   */
  trustedTenant?: TrustedTowerTenant | null;
}

function firstSearchValue(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

async function withTowerReadTimeout<T>(
  read: Promise<T>,
  fallback: T,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | null = null;
  try {
    return await Promise.race([
      read,
      new Promise<T>((resolve) => {
        timer = setTimeout(() => resolve(fallback), TOWER_READ_TIMEOUT_MS);
      }),
    ]);
  } catch {
    return fallback;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export async function renderTowerPage({
  searchParams,
  trustedTenant = null,
}: RenderTowerPageProps = {}) {
  const resolved = await searchParams;
  const rawRequestedClient = firstSearchValue(resolved?.client);
  const requestedClient =
    trustedTenant?.clientKey ??
    ((await hasLockedTenantSession()) ? rawRequestedClient : null);
  const client = await getActiveClientRow(requestedClient).catch(() => null);
  const effectiveClientKey = trustedTenant?.clientKey ?? client?.key ?? null;

  const tenantName =
    canonicalClientDisplayName({
      key: effectiveClientKey,
      name: trustedTenant?.displayName ?? client?.name,
    }) ??
    trustedTenant?.displayName ??
    client?.name ??
    "AbarVa Client";

  const martView = await withTowerReadTimeout(
    loadTowerMartCommandView({
      tenantKeyCandidates: [
        trustedTenant?.clientKey,
        effectiveClientKey,
        requestedClient,
        client?.id,
      ],
    }),
    null,
  );
  const commandCenterView = buildTowerCommandCenterView(martView, {
    tenantName,
  });
  const towerChatClientId =
    client?.id ?? client?.key ?? requestedClient ?? null;

  return (
    <AppShell
      surface="tower"
      topBarProps={{
        tenantName,
        preserveTenantName: true,
        showLocked: true,
        context: `Command Center · ${tenantName}`,
      }}
    >
      <Suspense fallback={null}>
        <TowerCommandCenterAvaShell
          view={commandCenterView}
          tenantName={tenantName}
          clientId={towerChatClientId}
        />
      </Suspense>
    </AppShell>
  );
}

export default async function TowerPage(props: TowerPageProps = {}) {
  return renderTowerPage(props);
}
