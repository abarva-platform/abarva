// Tower — primary route.
//
// As of 2026-07-23 this always serves the **Command Center** (the rebuilt page
// against `docs/design/tower/command-center-2026-07-23/`). The previous Tower
// page is no longer a runtime fallback.

import { Suspense } from "react";

import { AppShell } from "@/components/shell/AppShell";
import { ProductFanoutSummaryStrip } from "@/components/enterprise-data/ProductFanoutSummaryStrip";
import { TowerCommandCenterAvaShell } from "@/components/tower/command-center/TowerCommandCenterAvaShell";
import {
  getActiveClientRow,
  hasLockedTenantSession,
} from "@/lib/active-client";
import { canonicalClientDisplayName } from "@/lib/client-config";
import { readTowerCommandCenter } from "@/lib/tower/readTowerCommandCenter";
import { buildTowerCommandCenterView } from "@/lib/tower/command-center/view-model";
import { resolveTenant } from "@/lib/tenant/resolveTenant";
import { listProductFanoutTotals } from "@/lib/enterprise-data/product-fanout-summary";

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
  const [client, tenant] = await Promise.all([
    getActiveClientRow(requestedClient).catch(() => null),
    resolveTenant({ requestedClient }).catch(() => null),
  ]);
  const effectiveClientKey = client?.key ?? tenant?.appClientKey ?? null;

  const tenantName =
    canonicalClientDisplayName({
      key: effectiveClientKey,
      name: client?.name ?? tenant?.displayName,
    }) ??
    client?.name ??
    tenant?.displayName ??
    "AbarVa Client";

  const tenantKeyCandidates = [
    effectiveClientKey,
    requestedClient,
    client?.id,
    tenant?.canonicalKey,
    tenant?.brokerKey,
  ];
  const [towerView, productFanout] = await Promise.all([
    withTowerReadTimeout(
      readTowerCommandCenter({
        tenantKeyCandidates,
      }),
      null,
    ),
    listProductFanoutTotals({ tenantKeyCandidates }),
  ]);
  const commandCenterView = buildTowerCommandCenterView(towerView, {
    tenantName,
  });
  const towerChatClientId =
    client?.id ?? effectiveClientKey ?? requestedClient ?? null;

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
      <div className="bg-[#f7f7f2] px-8 pt-8">
        <div className="mx-auto max-w-7xl">
          <ProductFanoutSummaryStrip
            rows={productFanout}
            activeProduct="tower"
          />
        </div>
      </div>
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
