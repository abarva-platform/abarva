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

export default async function TowerPage({ searchParams }: TowerPageProps = {}) {
  const resolved = await searchParams;
  const rawRequestedClient = firstSearchValue(resolved?.client);
  const requestedClient = (await hasLockedTenantSession())
    ? rawRequestedClient
    : null;
  const client = await getActiveClientRow(requestedClient).catch(() => null);

  const tenantName =
    canonicalClientDisplayName({ key: client?.key, name: client?.name }) ??
    client?.name ??
    "AbarVa Client";

  const martView = await withTowerReadTimeout(
    loadTowerMartCommandView({
      tenantKeyCandidates: [client?.key, requestedClient, client?.id],
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
