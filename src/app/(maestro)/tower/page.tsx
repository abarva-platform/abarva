import { AiControlTowerPage } from "@/components/tower/AiControlTowerPage";
import type { TowerSubstrateCounts } from "@/components/tower/TowerIndexPage";
import { selectTowerPageReadAdapter } from "@/lib/data-plane/read-adapters/towerPageReadAdapter";
import { requireTenancy } from "@/lib/auth/tenancy";
import { loadUserProgramAccessPolicy } from "@/lib/auth/program-access-policy";
import { loadUserSourceAccessPolicy } from "@/lib/auth/source-access-policy";
import { getActiveClientRow } from "@/lib/active-client";
import { canonicalClientDisplayName } from "@/lib/client-config";
import {
  listPersistedSetupAiInitiatives,
  normalizeSetupAiInitiativeTenantKey,
  summarizeSetupAiInitiatives,
  type SetupAiInitiativeRecord,
} from "@/lib/setup";
import {
  listInitiativesForClient,
  listVendorsForClient,
  type AIInitiative,
  type AIInitiativeVendorRow,
} from "@/lib/admin/ai-initiatives/queries";
import {
  buildTowerBandMetrics,
  type TowerBandMetricsView,
  type TowerLens,
} from "@/lib/tower/band-metrics-view";
import {
  buildTowerPressuresView,
  type TowerPressuresView,
} from "@/lib/tower/pressure-cards-view";
import { resolveTowerToday } from "@/lib/tower/today-resolution";
import { buildStrategicAlignment2x2View } from "@/lib/tower/strategic-alignment-2x2-view";
import {
  buildAtlasInterpretation,
  type AtlasReasoningInput,
} from "@/lib/tower/atlas-interpretation-view";
import { buildTowerRightRailReasoningTrace } from "@/lib/tower/atlas-reasoning-trace";
import { appendAtlasReasoningTrace } from "@/lib/atlas/repository";

export const metadata = { title: "Control Tower · AbarVa" };

type TowerClientRow = NonNullable<
  Awaited<ReturnType<typeof getActiveClientRow>>
>;

const TOWER_PILOT_CLIENT_KEYS = ["apexretail", "meridian", "arcturus"] as const;

async function clientHasTowerSubstrate(clientId: string): Promise<boolean> {
  // The physical `ai_initiatives` count moved behind the Tower-page read
  // adapter (Slice 9); the adapter already fails soft to `0`.
  const count =
    await selectTowerPageReadAdapter().countClientInitiatives(clientId);
  return count > 0;
}

async function resolveTowerClient(
  requestedClientKey?: string,
): Promise<TowerClientRow | null> {
  const activeClient = await getActiveClientRow(requestedClientKey).catch(
    () => null,
  );
  if (activeClient) return activeClient;
  if (requestedClientKey) return null;

  for (const clientKey of TOWER_PILOT_CLIENT_KEYS) {
    const candidate = await getActiveClientRow(clientKey).catch(() => null);
    if (candidate && (await clientHasTowerSubstrate(candidate.id))) {
      return candidate;
    }
  }
  return null;
}

/**
 * T-4 (AI Initiatives Substrate v1.1.0): query the canonical AI Initiatives
 * Registry for the active tenant so Tower CFO View can plot real names in
 * the Strategic Alignment 2×2 instead of invented placeholders.
 *
 * Fail-soft: any error (DB, RLS, missing active client) returns an empty
 * array. The Tower UI renders an explicit DB-empty state instead of
 * substituting demo data.
 */
async function buildTowerInitiatives(
  clientId: string | null,
): Promise<ReadonlyArray<AIInitiative>> {
  if (!clientId) return [];
  try {
    return await listInitiativesForClient(clientId);
  } catch {
    return [];
  }
}

/**
 * T-5 (Bind 1): query tenant-level vendor records so the dashboard band
 * can compute Renewals · 90d from real contract renewal dates. Fail-soft:
 * any error (auth, DB, RLS) returns an empty array so the page still
 * renders — the band tile shows "0 / none in 90d" with a "no substrate"
 * tooltip.
 */
async function buildTowerVendors(
  clientId: string | null,
): Promise<ReadonlyArray<AIInitiativeVendorRow>> {
  if (!clientId) return [];
  try {
    return await listVendorsForClient(clientId);
  } catch {
    return [];
  }
}

async function countByInitiatives(
  table: string,
  initiativeIds: ReadonlyArray<string>,
): Promise<number> {
  // The physical substrate-child count moved behind the Tower-page read
  // adapter (Slice 9); the adapter fails soft to `0` and allowlists `table`.
  return selectTowerPageReadAdapter().countByInitiatives(table, initiativeIds);
}

async function buildTowerSubstrateCounts(
  initiatives: ReadonlyArray<AIInitiative>,
  vendors: ReadonlyArray<AIInitiativeVendorRow>,
): Promise<TowerSubstrateCounts> {
  const initiativeIds = initiatives.map(
    (initiative) => initiative.initiativeId,
  );
  const [kpis, decisions, stakeholderNotes, scenarios] = await Promise.all([
    countByInitiatives("ai_initiative_kpis", initiativeIds),
    countByInitiatives("ai_initiative_decisions", initiativeIds),
    countByInitiatives("ai_initiative_stakeholder_notes", initiativeIds),
    countByInitiatives("ai_initiative_scenarios", initiativeIds),
  ]);

  return {
    initiatives: initiatives.length,
    vendors: vendors.length,
    kpis,
    decisions,
    stakeholderNotes,
    scenarios,
  };
}

/**
 * T-5 (Bind 1): resolve today's date once for all Tower view-models.
 * `TOWER_DEMO_TODAY` lets pilot deploys pin a specific day; the fallback
 * stays stable for demo determinism across local, preview, and production.
 */
function buildTowerToday(): string {
  return resolveTowerToday();
}

async function buildTowerSetupInitiativesFeed(
  activeClient: Awaited<ReturnType<typeof getActiveClientRow>>,
) {
  const empty = {
    tenantName: "AbarVa Client",
    tenantKey: "unknown",
    source: "empty" as const,
    privateSchema: null as string | null,
    financialVisibility: false,
    summary: summarizeSetupAiInitiatives("unknown", []),
    initiatives: [] as SetupAiInitiativeRecord[],
  };

  try {
    if (!activeClient) return empty;
    const tenancy = await requireTenancy().catch(() => null);

    const [programPolicy, sourcePolicy] =
      tenancy && tenancy.clientId === activeClient.id
        ? await Promise.all([
            loadUserProgramAccessPolicy(tenancy).catch(() => null),
            loadUserSourceAccessPolicy(tenancy, {
              activeClientKey: activeClient.key,
            }).catch(() => null),
          ])
        : [null, null];
    const financialVisibility = Boolean(
      programPolicy?.canViewFinancialData || sourcePolicy?.canViewFinancialData,
    );
    const tenantKey = normalizeSetupAiInitiativeTenantKey(activeClient.key);
    const persisted = await listPersistedSetupAiInitiatives({
      tenantKey,
      financialVisibility,
    }).catch(() => ({
      status: "skipped_no_database_url" as const,
      tenantKey,
      privateSchema: null,
      initiatives: [] as SetupAiInitiativeRecord[],
    }));
    const fromPrivate = persisted.status === "private_db";
    const initiatives = fromPrivate ? [...persisted.initiatives] : [];

    const tenantName =
      canonicalClientDisplayName({
        key: activeClient.key,
        name: activeClient.name,
      }) ?? activeClient.name;

    return {
      tenantName,
      tenantKey,
      source: fromPrivate ? ("private_db" as const) : ("empty" as const),
      privateSchema: persisted.privateSchema,
      financialVisibility,
      summary: summarizeSetupAiInitiatives(tenantKey, initiatives),
      initiatives,
    };
  } catch {
    return empty;
  }
}

export default async function TowerPage({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string; lens?: string; client?: string }>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  // Active client id (when bound) — wires the AgentDock chat lane to
  // /api/v1/atlas/chat. If the session has no resolvable client row (for
  // example an internal pilot account with cleared active-client cookie),
  // bind Tower to the first pilot client that has real AI Initiative rows.
  const activeClient = await resolveTowerClient(resolvedSearchParams.client);
  const activeClientId = activeClient?.id ?? null;
  const towerSetupInitiativesFeed =
    await buildTowerSetupInitiativesFeed(activeClient);
  const towerInitiatives = await buildTowerInitiatives(activeClientId);
  const towerVendors = await buildTowerVendors(activeClientId);
  const towerSubstrateCounts = await buildTowerSubstrateCounts(
    towerInitiatives,
    towerVendors,
  );
  // The dashboard band is fixed. Canvas controls can change the lower pane,
  // but stale ?lens= URLs must not re-rank the executive metrics underneath.
  const activeLens: TowerLens = "value";
  const towerToday = buildTowerToday();
  const towerBandMetrics: TowerBandMetricsView = buildTowerBandMetrics(
    towerInitiatives,
    towerVendors,
    towerToday,
    activeLens,
  );
  const towerPressures: TowerPressuresView = buildTowerPressuresView(
    towerInitiatives,
    towerVendors,
    towerToday,
    activeLens,
  );
  const towerAlignment2x2 = buildStrategicAlignment2x2View(towerInitiatives);
  const atlasReasoningInput: AtlasReasoningInput = {
    tenant: {
      name: towerSetupInitiativesFeed.tenantName,
      clientId: activeClientId,
    },
    todayIso: towerToday,
    lens: activeLens,
    bandMetrics: towerBandMetrics,
    pressuresView: towerPressures,
    alignment2x2View: towerAlignment2x2,
    initiatives: towerInitiatives,
    vendors: towerVendors,
  };
  const towerAtlasInterpretation =
    buildAtlasInterpretation(atlasReasoningInput);
  if (activeClientId) {
    const traceTenancy = await requireTenancy().catch(() => null);
    await appendAtlasReasoningTrace(
      buildTowerRightRailReasoningTrace({
        ctx: {
          clientId: activeClientId,
          userId: traceTenancy?.userId ?? null,
        },
        reasoningInput: atlasReasoningInput,
        interpretation: towerAtlasInterpretation,
        fallbackUsed:
          towerAtlasInterpretation.interpretationConfidence === "low",
        fallbackReason:
          towerAtlasInterpretation.interpretationConfidence === "low"
            ? "low_confidence"
            : null,
      }),
    ).catch(() => null);
  }
  return (
    <AiControlTowerPage
      tenantName={towerSetupInitiativesFeed.tenantName}
      clientId={activeClientId ?? undefined}
      towerToday={towerToday}
      initiatives={towerInitiatives}
      vendors={towerVendors}
      bandMetrics={towerBandMetrics}
      pressuresView={towerPressures}
      substrateCounts={towerSubstrateCounts}
    />
  );
}
