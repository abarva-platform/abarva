import { getActiveClientRow } from "@/lib/active-client";
import { canonicalClientDisplayName } from "@/lib/client-config";
import {
  TowerIndexPage,
  type TowerSubstrateCounts,
} from "@/components/tower/TowerIndexPage";
import { buildAtlasTowerCurrentState } from "@/lib/atlas/tower-grounding";
import { resolveTowerTab } from "@/lib/tower/tower-lens-tabs-view";
import { canonicalCioTowerTenantKey } from "@/lib/cio-tower/metric-packet";
import { loadCioTowerMetricPackets } from "@/lib/cio-tower/metric-packet-store";

export const metadata = { title: "IT Investment Tower · AbarVa" };
export const dynamic = "force-dynamic";
export const revalidate = 0;

function substrateCountsFromState(
  state: Awaited<ReturnType<typeof buildAtlasTowerCurrentState>>,
): TowerSubstrateCounts {
  return {
    initiatives: state.substrateCounts.initiatives,
    vendors: state.substrateCounts.vendors,
    kpis: state.substrateCounts.kpiSnapshots,
    decisions: state.substrateCounts.decisions,
    stakeholderNotes: state.substrateCounts.stakeholderNotes,
    scenarios: state.substrateCounts.scenarios,
  };
}

export default async function TowerPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const activeClient = await getActiveClientRow();
  const activeTenantName =
    canonicalClientDisplayName({
      key: activeClient?.key,
      name: activeClient?.name,
    }) ??
    activeClient?.name ??
    "Your workspace";
  const activeTab = resolveTowerTab(tab);

  const towerTenantKey = activeClient?.key
    ? canonicalCioTowerTenantKey(activeClient.key)
    : activeClient?.id;
  const [towerState, metricPackets] = activeClient?.id
    ? await Promise.all([
        buildAtlasTowerCurrentState({
          clientId: activeClient.id,
          surfaceContext: { activeTowerLens: "value" },
        }).catch(() => null),
        towerTenantKey
          ? loadCioTowerMetricPackets(towerTenantKey).catch(() => [])
          : Promise.resolve([]),
      ])
    : [null, []];

  return (
    <TowerIndexPage
      tenantName={activeTenantName}
      context="Tower"
      clientId={activeClient?.id}
      activeTab={activeTab}
      towerToday={towerState?.todayIso}
      initiatives={towerState?.initiatives}
      vendors={towerState?.vendors}
      budgetRollups={towerState?.budgetRollups}
      metricPackets={metricPackets}
      bandMetrics={towerState?.bandMetrics}
      pressuresView={towerState?.pressuresView}
      atlasObservationsView={towerState?.atlasObservationsView}
      substrateCounts={
        towerState ? substrateCountsFromState(towerState) : undefined
      }
    />
  );
}
