// Tower — primary route.
//
// As of 2026-07-23 this always serves the **Command Center** (the rebuilt page
// against `docs/design/tower/command-center-2026-07-23/`). The previous Tower
// page is no longer a runtime fallback.

import { Suspense } from "react";

import { EclDemoFindingsPanel } from "@/components/ecl/EclDemoFindingsPanel";
import { EclServingSurfaceCoverage } from "@/components/ecl/EclServingSurfaceCoverage";
import { AppShell } from "@/components/shell/AppShell";
import { TowerCommandCenterAvaShell } from "@/components/tower/command-center/TowerCommandCenterAvaShell";
import { getActiveClientRow } from "@/lib/active-client";
import { canonicalClientDisplayName } from "@/lib/client-config";
import {
  isEclProductProvider,
  resolveEclProductProvider,
} from "@/lib/ecl/product-provider";
import { canonicalTenantKey } from "@/lib/tenant/aliases";
import { buildTowerCommandCenterView } from "@/lib/tower/command-center/view-model";
import {
  readTowerEclProjectionPreview,
  type TowerEclProjectionPreview,
} from "@/lib/tower/eclProjectionPreview";
import { readTowerCommandCenter } from "@/lib/tower/readTowerCommandCenter";

export const metadata = { title: "Tower · AbarVa" };
export const dynamic = "force-dynamic";
export const revalidate = 0;

/** Keep the Tower read bounded so sparse/private data states still render. */
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

function isEclDiagnosticsRequest(value: string | null): boolean {
  return value?.trim().toLowerCase() === "ecl";
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
  const requestedProvider = firstSearchValue(resolved?.provider);
  const productProvider = resolveEclProductProvider(requestedProvider);
  const showEclDiagnostics =
    isEclDiagnosticsRequest(firstSearchValue(resolved?.diagnostics)) ||
    isEclDiagnosticsRequest(firstSearchValue(resolved?.debug));
  const rawRequestedClient = firstSearchValue(resolved?.client);
  const requestedClient = trustedTenant?.clientKey ?? rawRequestedClient;
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
  const tenantKeyCandidates = [
    trustedTenant?.clientKey,
    effectiveClientKey,
    requestedClient,
    client?.id,
  ];

  const martView = await withTowerReadTimeout(
    readTowerCommandCenter({
      tenantKeyCandidates,
      tenantDisplayName: tenantName,
    }),
    null,
  );
  const commandCenterView = buildTowerCommandCenterView(martView, {
    tenantName,
  });
  const towerEclPreview =
    showEclDiagnostics && isEclProductProvider(productProvider)
      ? await readTowerEclProjectionPreview(
          canonicalTenantKey(effectiveClientKey),
        ).catch(() => null)
      : null;
  const towerChatClientId =
    client?.id ?? client?.key ?? requestedClient ?? null;
  const towerChatClientKey =
    effectiveClientKey ?? requestedClient ?? client?.key ?? null;

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
          clientKey={towerChatClientKey}
        />
      </Suspense>
      {showEclDiagnostics ? (
        <>
          <TowerEclProjectionPanel preview={towerEclPreview} />
          {isEclProductProvider(productProvider) ? (
            <EclDemoFindingsPanel product="tower" />
          ) : null}
          <EclServingSurfaceCoverage product="tower" />
        </>
      ) : null}
    </AppShell>
  );
}

export default async function TowerPage(props: TowerPageProps = {}) {
  return renderTowerPage(props);
}

function TowerEclProjectionPanel({
  preview,
}: {
  preview: TowerEclProjectionPreview | null;
}) {
  if (!preview) return null;

  const money = new Intl.NumberFormat("en-US", {
    currency: "USD",
    maximumFractionDigits: 0,
    notation: "compact",
    style: "currency",
  });

  return (
    <section className="border-b border-emerald-900/10 bg-emerald-50/45 px-6 py-5 text-slate-950">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-700">
            ECL projection read
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">
            Tower command center projection is loaded
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-700">
            This route reads governed Tower serving rows for the dense tenant
            assessment. It separates funded activity, promised value, claimable
            value, blocked value, evidence gates and source references.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 text-right md:grid-cols-4">
          <TowerEclStat
            label="Rows"
            value={preview.rowCount.toLocaleString()}
          />
          <TowerEclStat
            label="Claimable"
            value={money.format(preview.totals.claimableUsd)}
          />
          <TowerEclStat
            label="Blocked"
            value={money.format(preview.totals.blockedUsd)}
          />
          <TowerEclStat
            label="Gates"
            value={preview.gateCounts.length.toLocaleString()}
          />
        </div>
      </div>
    </section>
  );
}

function TowerEclStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <div className="text-xl font-semibold tabular-nums">{value}</div>
      <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.16em] text-slate-500">
        {label}
      </div>
    </div>
  );
}
