// Tower — primary route.
//
// As of 2026-07-23 this serves the **Command Center** (the rebuilt page against
// `docs/design/tower/command-center-2026-07-23/`) when `tower_command_center_v2`
// is enabled for the tenant, and the previous surface when it is not.
//
// The flag is the promotion and rollback switch, and it is the whole rollback
// plan: turning it off for a tenant restores the previous Tower for that tenant
// on the next request, with no deploy. The previous surface is archived intact
// at `/tower/legacy` and is always reachable there for side-by-side comparison,
// regardless of the flag.
//
// `TowerIndexPage.tsx` was not modified to make this change.

import { Suspense } from "react";

import { AppShell } from "@/components/shell/AppShell";
import { TowerCommandCenterAvaShell } from "@/components/tower/command-center/TowerCommandCenterAvaShell";
import { TowerLegacySurface } from "@/components/tower/TowerLegacySurface";
import {
  getActiveClientRow,
  hasLockedTenantSession,
} from "@/lib/active-client";
import { canonicalClientDisplayName } from "@/lib/client-config";
import { loadTowerMartCommandView } from "@/lib/cio-tower/tower-mart-view-model";
import { isFeatureEnabled } from "@/lib/features/is-feature-enabled";
import { buildTowerCommandCenterView } from "@/lib/tower/command-center/view-model";

export const metadata = { title: "Tower · AbarVa" };
export const dynamic = "force-dynamic";
export const revalidate = 0;

/** Same budget the legacy surface uses. */
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
  const clientKey = client?.key ?? requestedClient ?? null;

  // Flag off → the previous Tower, unchanged, with its own data loading.
  if (
    !isFeatureEnabled(
      { clientKey, clientId: client?.id },
      "tower_command_center_v2",
    )
  ) {
    return <TowerLegacySurface searchParams={searchParams} />;
  }

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
          refreshedOn={new Date().toISOString().slice(0, 10)}
        />
      </Suspense>
    </AppShell>
  );
}
