import { TowerIndexPage } from "@/components/tower/TowerIndexPage";
import {
  getActiveClientRow,
  hasLockedTenantSession,
} from "@/lib/active-client";
import { canonicalClientDisplayName } from "@/lib/client-config";
import { loadCioTowerCxoView } from "@/lib/cio-tower/cxo-view-model";
import { buildTowerV3ContextPackFromTenantInputs } from "@/lib/enterprise-knowledge/tower/tower-v3-context-pack-from-tenant-inputs";
import { listTowerBudgetRollupsForClient } from "@/lib/tower/tower-budget-rollups";
import {
  isMeridianTowerRuntimeTenant,
  isTowerV3ContextRuntimeEnabled,
} from "@/lib/tower/tower-v3-runtime-flag";
import { buildTowerV3RuntimeViewModel } from "@/lib/tower/tower-v3-runtime-view";

export const metadata = { title: "Tower · AbarVa" };
export const dynamic = "force-dynamic";
export const revalidate = 0;

interface TowerPageProps {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

function firstSearchValue(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

export default async function TowerPage({ searchParams }: TowerPageProps = {}) {
  const rawRequestedClient = firstSearchValue((await searchParams)?.client);
  const requestedClient = (await hasLockedTenantSession())
    ? rawRequestedClient
    : null;
  const client = await getActiveClientRow(requestedClient).catch(() => null);
  const tenantName =
    canonicalClientDisplayName({ key: client?.key, name: client?.name }) ??
    client?.name ??
    "AbarVa Client";

  const [cxoView, budgetRollups] = await Promise.all([
    loadCioTowerCxoView({
      tenantKeyCandidates: [client?.key, requestedClient, client?.id],
      tenantName,
    }).catch(() => null),
    listTowerBudgetRollupsForClient({
      clientId: client?.id ?? "",
      tenantKey: client?.key ?? requestedClient,
    }).catch(() => []),
  ]);
  const towerV3RuntimeView =
    isTowerV3ContextRuntimeEnabled() &&
    (isMeridianTowerRuntimeTenant(client?.key) ||
      isMeridianTowerRuntimeTenant(requestedClient) ||
      isMeridianTowerRuntimeTenant(client?.name))
      ? buildTowerV3RuntimeViewModel({
          tenantName,
          contextPack: buildTowerV3ContextPackFromTenantInputs({
            tenantKey: "meridian-health",
            tenantName,
            activeInputRoot:
              "datasets/tenant-inputs/active/meridian-health/current",
          }).contextPack,
        })
      : null;

  return (
    <TowerIndexPage
      tenantName={tenantName}
      context={`Portfolio Command Center · ${tenantName}`}
      towerToday={new Date().toISOString().slice(0, 10)}
      clientId={client?.id}
      cxoView={cxoView}
      towerV3RuntimeView={towerV3RuntimeView}
      budgetRollups={budgetRollups}
    />
  );
}
