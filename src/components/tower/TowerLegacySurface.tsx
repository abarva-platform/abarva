// Tower — the legacy surface, archived 2026-07-23.
//
// This is `src/app/(maestro)/tower/page.tsx` as it stood before the Command
// Center became primary, lifted verbatim into a reusable async server component
// so it can be mounted from more than one route. Nothing in its behaviour, data
// loading, or rendering changed, and `TowerIndexPage.tsx` (13,727 lines) was not
// edited.
//
// It is mounted by:
//   • /tower/legacy      — always, so the previous surface stays reachable for
//                          comparison and as the rollback target.
//   • /tower             — only when `tower_command_center_v2` is OFF for the
//                          tenant. That flag is the promotion/rollback switch.
//
// Do not delete this until the Command Center is live-proven on every tenant.
// The Command Center has its own governed aVa shell; this path remains the
// intact previous surface and rollback target.

import { TowerIndexPage } from "@/components/tower/TowerIndexPage";
import {
  getActiveClientRow,
  hasLockedTenantSession,
} from "@/lib/active-client";
import { canonicalClientDisplayName } from "@/lib/client-config";
import { loadCioTowerCxoView } from "@/lib/cio-tower/cxo-view-model";
import { loadTowerMartCommandView } from "@/lib/cio-tower/tower-mart-view-model";
import { buildTowerV3ContextPackFromTenantInputs } from "@/lib/enterprise-knowledge/tower/tower-v3-context-pack-from-tenant-inputs";
import { isFeatureEnabled } from "@/lib/features/is-feature-enabled";
import { applyTowerCxoClaudeStory } from "@/lib/tower/tower-cxo-claude-story";
import { listTowerBudgetRollupsForClient } from "@/lib/tower/tower-budget-rollups";
import {
  isTowerV3ContextRuntimeEnabled,
  isMeridianTowerRuntimeTenant,
} from "@/lib/tower/tower-v3-runtime-flag";
import { buildTowerV3RuntimeViewModel } from "@/lib/tower/tower-v3-runtime-view";

const TOWER_READ_TIMEOUT_MS = 8_000;

export interface TowerLegacySurfaceProps {
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

export async function TowerLegacySurface({
  searchParams,
}: TowerLegacySurfaceProps = {}) {
  const rawRequestedClient = firstSearchValue((await searchParams)?.client);
  const requestedClient = (await hasLockedTenantSession())
    ? rawRequestedClient
    : null;
  const client = await getActiveClientRow(requestedClient).catch(() => null);
  const tenantName =
    canonicalClientDisplayName({ key: client?.key, name: client?.name }) ??
    client?.name ??
    "AbarVa Client";

  const [towerMartView, cxoView, budgetRollups] = await Promise.all([
    withTowerReadTimeout(
      loadTowerMartCommandView({
        tenantKeyCandidates: [client?.key, requestedClient, client?.id],
      }),
      null,
    ),
    withTowerReadTimeout(
      loadCioTowerCxoView({
        tenantKeyCandidates: [client?.key, requestedClient, client?.id],
        tenantName,
      }),
      null,
    ),
    withTowerReadTimeout(
      listTowerBudgetRollupsForClient({
        clientId: client?.id ?? "",
        tenantKey: client?.key ?? requestedClient,
      }),
      [],
    ),
  ]);
  let towerV3RuntimeView =
    isTowerV3ContextRuntimeEnabled() &&
    (isMeridianTowerRuntimeTenant(client?.key) ||
      isMeridianTowerRuntimeTenant(requestedClient) ||
      isMeridianTowerRuntimeTenant(client?.name))
      ? (() => {
          const { contextPack } = buildTowerV3ContextPackFromTenantInputs({
            tenantKey: "meridian-health",
            tenantName,
            activeInputRoot:
              "datasets/tenant-inputs/active/meridian-health/current",
          });
          return buildTowerV3RuntimeViewModel({
            tenantName,
            contextPack,
          });
        })()
      : null;

  if (
    towerV3RuntimeView &&
    isFeatureEnabled(
      {
        clientKey:
          client?.key ?? requestedClient ?? towerV3RuntimeView.tenantKey,
      },
      "tower_cxo_claude_story_blocks",
    )
  ) {
    const { contextPack } = buildTowerV3ContextPackFromTenantInputs({
      tenantKey: "meridian-health",
      tenantName,
      activeInputRoot: "datasets/tenant-inputs/active/meridian-health/current",
    });
    const claudeStory = await withTowerReadTimeout(
      applyTowerCxoClaudeStory({
        view: towerV3RuntimeView,
        contextPack,
        tenantName,
      }),
      {
        used: false,
        view: towerV3RuntimeView,
        issues: [
          "Tower Claude story enrichment timed out; deterministic view rendered.",
        ],
      },
    );
    towerV3RuntimeView = claudeStory.view;
  }

  return (
    <TowerIndexPage
      tenantName={tenantName}
      context={`Portfolio Command Center · ${tenantName}`}
      towerToday={new Date().toISOString().slice(0, 10)}
      clientId={client?.id}
      towerMartView={towerMartView}
      cxoView={cxoView}
      towerV3RuntimeView={towerV3RuntimeView}
      budgetRollups={budgetRollups}
    />
  );
}
