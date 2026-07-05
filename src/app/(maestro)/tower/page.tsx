import { getActiveClientRow } from "@/lib/active-client";
import {
  TowerIndexPage,
  type TowerSubstrateCounts,
} from "@/components/tower/TowerIndexPage";
import { buildAtlasTowerCurrentState } from "@/lib/atlas/tower-grounding";
import { resolveTowerTab } from "@/lib/tower/tower-lens-tabs-view";
import { loadCioTowerCxoView } from "@/lib/cio-tower/cxo-view-model";
import { loadCioTowerMetricPackets } from "@/lib/cio-tower/metric-packet-store";
import { canonicalClientDisplayName } from "@/lib/client-config";
import { canonicalCioTowerTenantDisplayName } from "@/lib/cio-tower/metric-packet";

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
    canonicalCioTowerTenantDisplayName({
      key: activeClient?.key,
      name: activeClient?.name,
    }) ??
    canonicalClientDisplayName({
      key: activeClient?.key,
      name: activeClient?.name,
    }) ??
    activeClient?.name ??
    "Your workspace";
  const activeTab = resolveTowerTab(tab);

  const [towerState, metricPackets, cxoView] = activeClient?.id
    ? await Promise.all([
        buildAtlasTowerCurrentState({
          clientId: activeClient.id,
          clientKey: activeClient.key,
          clientName: activeClient.name,
          tenantKeyCandidates: [
            activeClient.key,
            activeClient.name,
            activeClient.id,
          ],
          surfaceContext: { activeTowerLens: "value" },
        }).catch(() => null),
        loadCioTowerMetricPackets([
          activeClient.key,
          activeClient.name,
          activeClient.id,
        ]).catch(() => []),
        loadCioTowerCxoView({
          tenantKeyCandidates: [
            activeClient.key,
            activeClient.name,
            activeClient.id,
          ],
          tenantName: activeTenantName,
        }).catch(() => null),
      ])
    : [null, [], null];

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
      cxoView={cxoView}
      bandMetrics={towerState?.bandMetrics}
      pressuresView={towerState?.pressuresView}
      atlasObservationsView={towerState?.atlasObservationsView}
      substrateCounts={
        towerState ? substrateCountsFromState(towerState) : undefined
      }
    />
  );
}
