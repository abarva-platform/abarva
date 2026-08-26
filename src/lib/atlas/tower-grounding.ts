import { getAzureReadFluentClient } from "@/lib/data-plane/postgresCompat";
import "server-only";
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
import {
  buildTowerAtlasObservationsView,
  type AtlasObservationsView,
} from "@/lib/tower/atlas-observations-view";
import {
  buildStrategicAlignment2x2View,
  type StrategicAlignment2x2View,
} from "@/lib/tower/strategic-alignment-2x2-view";
import {
  listTowerBudgetRollupsForClient,
  shapeTowerBudgetRollupsFromInitiatives,
  type TowerBudgetRollup,
} from "@/lib/tower/tower-budget-rollups";
import { listMaterializedTowerReadModelForClient } from "@/lib/tower/tower-materialized-read-model";
import { resolveTowerToday } from "@/lib/tower/today-resolution";
import {
  canonicalTenantDisplayName,
  canonicalTenantKey,
  tenantIndustryCode,
} from "@/lib/tenant/aliases";
import { canonicalCioTowerTenantDisplayName } from "@/lib/tower/metric-packet";

type IndustryCode = "HEALTHCARE_IDN" | "FINSERV" | "RETAIL" | "GENERAL";

interface ClientProfile {
  clientId: string;
  clientName: string;
  tenantKey: string | null;
  industryCode: IndustryCode;
}

export interface AtlasTowerKpiSnapshot {
  initiativeDisplayId: string;
  initiativeName: string;
  kpiName: string;
  quarter: string;
  value: number | null;
  targetValue: number | null;
  peerMedian: number | null;
  confidenceLevel: string | null;
}

export interface AtlasTowerDecisionSnapshot {
  initiativeDisplayId: string;
  initiativeName: string;
  decisionName: string;
  decisionDate: string | null;
  decisionStatus: string | null;
  dissentRecorded: boolean;
  dissentSummary: string | null;
  outcomeStatus: string | null;
}

export interface AtlasTowerScenarioSnapshot {
  initiativeDisplayId: string;
  initiativeName: string;
  scenarioName: string;
  probabilityPct: number | null;
  impactSummary: string | null;
  timeHorizonMonths: number | null;
}

export interface AtlasTowerStakeholderSnapshot {
  initiativeDisplayId: string;
  initiativeName: string;
  stakeholderTitle: string | null;
  attributionConsent: string | null;
  themes: string[];
}

export interface AtlasTowerCurrentState {
  client: ClientProfile;
  todayIso: string;
  activeLens: TowerLens;
  substrateCounts: {
    initiatives: number;
    vendors: number;
    kpiSnapshots: number;
    decisions: number;
    scenarios: number;
    stakeholderNotes: number;
    pressures: number;
    observations: number;
    alignmentDots: number;
  };
  bandMetrics: TowerBandMetricsView;
  pressuresView: TowerPressuresView;
  atlasObservationsView: AtlasObservationsView;
  alignment2x2View: StrategicAlignment2x2View;
  budgetRollups: ReadonlyArray<TowerBudgetRollup>;
  initiatives: ReadonlyArray<AIInitiative>;
  vendors: ReadonlyArray<AIInitiativeVendorRow>;
  kpiSnapshots: ReadonlyArray<AtlasTowerKpiSnapshot>;
  decisions: ReadonlyArray<AtlasTowerDecisionSnapshot>;
  scenarios: ReadonlyArray<AtlasTowerScenarioSnapshot>;
  stakeholderNotes: ReadonlyArray<AtlasTowerStakeholderSnapshot>;
}

function resolveLens(value: unknown): TowerLens {
  if (value === "risk" || value === "contract" || value === "adopt")
    return value;
  return "value";
}

function normalizeIndustryCode(value: unknown): IndustryCode {
  const raw = String(value ?? "").toUpperCase();
  if (raw.includes("HEALTH")) return "HEALTHCARE_IDN";
  if (raw.includes("FIN") || raw.includes("BANK") || raw.includes("ASSET"))
    return "FINSERV";
  if (raw.includes("RETAIL")) return "RETAIL";
  return "GENERAL";
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function toStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

export function resolveTowerBudgetRollups(
  loaded: ReadonlyArray<TowerBudgetRollup>,
  derived: ReadonlyArray<TowerBudgetRollup>,
): TowerBudgetRollup[] {
  // Governed cio_tower rollups are a complete read-model slice. Mixing in
  // derived initiative rollups can reintroduce stale dashboard totals.
  return loaded.length > 0 ? [...loaded] : [...derived];
}

async function getClientProfile(
  clientId: string,
  clientKey?: string | null,
): Promise<ClientProfile> {
  const { data } = await getAzureReadFluentClient()
    .from("clients")
    .select("id, name, tenant_key, slug, industry_code, industry")
    .eq("id", clientId)
    .maybeSingle();

  const row = data as {
    id?: string;
    name?: string | null;
    tenant_key?: string | null;
    slug?: string | null;
    industry_code?: string | null;
    industry?: string | null;
  } | null;

  const fallbackTenantKey = clientKey ? canonicalTenantKey(clientKey) : null;
  const fallbackName = clientKey
    ? canonicalTenantDisplayName(clientKey, row?.name)
    : "Active client";
  const fallbackIndustry = clientKey ? tenantIndustryCode(clientKey) : null;
  const tenantKey = row?.tenant_key ?? row?.slug ?? fallbackTenantKey;
  const clientName =
    canonicalCioTowerTenantDisplayName({
      key: tenantKey ?? clientKey ?? null,
      name: row?.name ?? fallbackName,
    }) ??
    row?.name ??
    fallbackName;

  return {
    clientId,
    clientName,
    tenantKey,
    industryCode: normalizeIndustryCode(
      row?.industry_code ?? row?.industry ?? fallbackIndustry,
    ),
  };
}

async function listSupportingRows(
  initiatives: ReadonlyArray<AIInitiative>,
): Promise<{
  kpiSnapshots: AtlasTowerKpiSnapshot[];
  decisions: AtlasTowerDecisionSnapshot[];
  scenarios: AtlasTowerScenarioSnapshot[];
  stakeholderNotes: AtlasTowerStakeholderSnapshot[];
}> {
  if (initiatives.length === 0) {
    return {
      kpiSnapshots: [],
      decisions: [],
      scenarios: [],
      stakeholderNotes: [],
    };
  }

  const initiativeIds = initiatives.map(
    (initiative) => initiative.initiativeId,
  );
  const initiativeById = new Map(
    initiatives.map(
      (initiative) => [initiative.initiativeId, initiative] as const,
    ),
  );
  const sb = getAzureReadFluentClient();
  const [kpiRes, decisionRes, scenarioRes, stakeholderRes] = await Promise.all([
    sb
      .from("ai_initiative_kpis")
      .select(
        "initiative_id, kpi_name, quarter, kpi_value, target_value, peer_median, confidence_level",
      )
      .in("initiative_id", initiativeIds)
      .order("quarter", { ascending: false })
      .limit(24),
    sb
      .from("ai_initiative_decisions")
      .select(
        "initiative_id, decision_name, decision_date, decision_status, dissent_recorded, dissent_summary, outcome_status",
      )
      .in("initiative_id", initiativeIds)
      .order("decision_date", { ascending: false, nullsFirst: false })
      .limit(12),
    sb
      .from("ai_initiative_scenarios")
      .select(
        "initiative_id, scenario_name, probability_pct, impact_summary, time_horizon_months",
      )
      .in("initiative_id", initiativeIds)
      .order("probability_pct", { ascending: false, nullsFirst: false })
      .limit(10),
    sb
      .from("ai_initiative_stakeholder_notes")
      .select("initiative_id, stakeholder_title, attribution_consent, themes")
      .in("initiative_id", initiativeIds)
      .order("interview_date", { ascending: false, nullsFirst: false })
      .limit(10),
  ]);

  const initiativeRef = (initiativeId: string) => {
    const initiative = initiativeById.get(initiativeId);
    return {
      initiativeDisplayId: initiative?.displayId ?? initiativeId,
      initiativeName: initiative?.name ?? initiativeId,
    };
  };

  const kpiSnapshots = (
    (kpiRes.data as Array<Record<string, unknown>> | null) ?? []
  ).map((row) => ({
    ...initiativeRef(String(row.initiative_id)),
    kpiName: String(row.kpi_name ?? ""),
    quarter: String(row.quarter ?? ""),
    value: toNumber(row.kpi_value),
    targetValue: toNumber(row.target_value),
    peerMedian: toNumber(row.peer_median),
    confidenceLevel:
      typeof row.confidence_level === "string" ? row.confidence_level : null,
  }));

  const decisions = (
    (decisionRes.data as Array<Record<string, unknown>> | null) ?? []
  ).map((row) => ({
    ...initiativeRef(String(row.initiative_id)),
    decisionName: String(row.decision_name ?? ""),
    decisionDate:
      typeof row.decision_date === "string" ? row.decision_date : null,
    decisionStatus:
      typeof row.decision_status === "string" ? row.decision_status : null,
    dissentRecorded: row.dissent_recorded === true,
    dissentSummary:
      typeof row.dissent_summary === "string" ? row.dissent_summary : null,
    outcomeStatus:
      typeof row.outcome_status === "string" ? row.outcome_status : null,
  }));

  const scenarios = (
    (scenarioRes.data as Array<Record<string, unknown>> | null) ?? []
  ).map((row) => ({
    ...initiativeRef(String(row.initiative_id)),
    scenarioName: String(row.scenario_name ?? ""),
    probabilityPct: toNumber(row.probability_pct),
    impactSummary:
      typeof row.impact_summary === "string" ? row.impact_summary : null,
    timeHorizonMonths: toNumber(row.time_horizon_months),
  }));

  const stakeholderNotes = (
    (stakeholderRes.data as Array<Record<string, unknown>> | null) ?? []
  ).map((row) => ({
    ...initiativeRef(String(row.initiative_id)),
    stakeholderTitle:
      typeof row.stakeholder_title === "string" ? row.stakeholder_title : null,
    attributionConsent:
      typeof row.attribution_consent === "string"
        ? row.attribution_consent
        : null,
    themes: toStringArray(row.themes),
  }));

  return { kpiSnapshots, decisions, scenarios, stakeholderNotes };
}

export async function buildAtlasTowerCurrentState(input: {
  clientId: string;
  clientKey?: string | null;
  clientName?: string | null;
  tenantKeyCandidates?: readonly (string | null | undefined)[];
  surfaceContext?: Record<string, unknown>;
}): Promise<AtlasTowerCurrentState> {
  const todayIso = resolveTowerToday();
  const activeLens = resolveLens(input.surfaceContext?.activeTowerLens);
  const [client, initiatives, vendors] = await Promise.all([
    getClientProfile(input.clientId, input.clientKey),
    listInitiativesForClient(input.clientId),
    listVendorsForClient(input.clientId),
  ]);
  const [materialized, loadedBudgetRollups] = await Promise.all([
    listMaterializedTowerReadModelForClient({
      clientId: input.clientId,
      tenantKey: client.tenantKey,
    }).catch(() => ({
      source: "empty" as const,
      initiatives: [],
      vendors: [],
    })),
    listTowerBudgetRollupsForClient({
      clientId: input.clientId,
      tenantKey: client.tenantKey,
    }).catch(() => []),
  ]);
  const materializedHasProgramValue = materialized.initiatives.some(
    (initiative) =>
      (initiative.committedAnnualUsd ?? 0) > 0 ||
      (initiative.committedTotalUsd ?? 0) > 0 ||
      (initiative.measuredValueUsd ?? 0) > 0,
  );
  const materializedHasVendorValue = materialized.vendors.some(
    (vendor) => (vendor.contractValueUsd ?? 0) > 0 || Boolean(vendor.renewalDate),
  );
  const towerInitiatives = materialized.initiatives.length && materializedHasProgramValue
    ? materialized.initiatives
    : initiatives;
  const towerVendors = materialized.vendors.length && materializedHasVendorValue
    ? materialized.vendors
    : vendors;
  const budgetRollups = towerInitiatives.length
    ? resolveTowerBudgetRollups(
        loadedBudgetRollups,
        shapeTowerBudgetRollupsFromInitiatives(towerInitiatives),
      )
    : loadedBudgetRollups;
  const [supporting, bandMetrics, pressuresView] = await Promise.all([
    listSupportingRows(towerInitiatives),
    Promise.resolve(
      buildTowerBandMetrics(
        towerInitiatives,
        towerVendors,
        todayIso,
        activeLens,
      ),
    ),
    Promise.resolve(
      buildTowerPressuresView(
        towerInitiatives,
        towerVendors,
        todayIso,
        activeLens,
      ),
    ),
  ]);
  const atlasObservationsView = buildTowerAtlasObservationsView(
    towerInitiatives,
    towerVendors,
    pressuresView,
    todayIso,
  );
  const alignment2x2View = buildStrategicAlignment2x2View(towerInitiatives);

  return {
    client,
    todayIso,
    activeLens,
    substrateCounts: {
      initiatives: towerInitiatives.length,
      vendors: towerVendors.length,
      kpiSnapshots: supporting.kpiSnapshots.length,
      decisions: supporting.decisions.length,
      scenarios: supporting.scenarios.length,
      stakeholderNotes: supporting.stakeholderNotes.length,
      pressures: pressuresView.cards.length,
      observations: atlasObservationsView.observations.length,
      alignmentDots: alignment2x2View.totalPlotted,
    },
    bandMetrics,
    pressuresView,
    atlasObservationsView,
    alignment2x2View,
    budgetRollups,
    initiatives: towerInitiatives,
    vendors: towerVendors,
    ...supporting,
  };
}

function money(value: number | null | undefined): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return "n/a";
  if (Math.abs(value) >= 1_000_000)
    return `$${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `$${Math.round(value / 1_000)}K`;
  return `$${Math.round(value)}`;
}

export function formatTowerCurrentStateForPrompt(
  state: AtlasTowerCurrentState,
): string {
  const lines: string[] = [
    "TOWER CURRENT STATE",
    `Client: ${state.client.clientName} (${state.client.tenantKey ?? state.client.clientId})`,
    `Industry: ${state.client.industryCode}`,
    `Today: ${state.todayIso}`,
    `Active lens: ${state.activeLens}`,
    `Substrate counts: ${state.substrateCounts.initiatives} initiatives, ${state.substrateCounts.vendors} vendors, ${state.substrateCounts.kpiSnapshots} KPI snapshots, ${state.substrateCounts.decisions} decisions, ${state.substrateCounts.scenarios} scenarios, ${state.substrateCounts.stakeholderNotes} stakeholder notes.`,
    "",
    "Displayed KPI band:",
    ...state.bandMetrics.metrics.map(
      (metric) =>
        `- ${metric.label}: ${metric.value} (${metric.confidence}) — ${metric.subtext}`,
    ),
    "",
    "Displayed pressure cards:",
    ...(state.pressuresView.cards.length > 0
      ? state.pressuresView.cards
          .slice(0, 6)
          .map(
            (card) =>
              `- ${card.id}: ${card.headline} Magnitude ${card.magnitudeValue}${card.magnitudeUnit}; confidence ${card.magnitudeConfidence}. Next: ${card.nextAction}`,
          )
      : [
          `- None displayed. ${state.pressuresView.emptyHint ?? "No DB-derived pressure cards."}`,
        ]),
    "",
    "Displayed aVa observations:",
    ...(state.atlasObservationsView.observations.length > 0
      ? state.atlasObservationsView.observations.map(
          (obs) =>
            `- ${String(obs.number).padStart(2, "0")} ${obs.topic}: ${obs.body}`,
        )
      : [
          `- None displayed. ${state.atlasObservationsView.emptyHint ?? "No DB-derived observations."}`,
        ]),
    "",
    "Initiatives visible to Tower:",
    ...state.initiatives
      .slice(0, 10)
      .map(
        (initiative) =>
          `- ${initiative.name}: stage=${initiative.stage}/${initiative.stageDetail ?? "n/a"}; flag=${initiative.statusFlag}; committed=${money(initiative.committedAnnualUsd)} annual; measured=${money(initiative.measuredValueUsd)}; confidence=${initiative.confidenceLevel}. ${initiative.statusSummary}`,
      ),
    "",
    "Vendor renewal context:",
    ...(state.vendors.length > 0
      ? state.vendors
          .slice(0, 8)
          .map(
            (vendor) =>
              `- ${vendor.vendorName} for ${vendor.initiativeName || "linked program"}: renewal=${vendor.renewalDate ?? "n/a"}; contract=${money(vendor.contractValueUsd)}; health=${vendor.financialHealth ?? "n/a"}`,
          )
      : ["- No vendors loaded."]),
    "",
    "Recent decisions and dissent:",
    ...(state.decisions.length > 0
      ? state.decisions
          .slice(0, 8)
          .map(
            (decision) =>
              `- ${decision.initiativeName}: ${decision.decisionName}; status=${decision.decisionStatus ?? "n/a"}; dissent=${decision.dissentRecorded ? "yes" : "no"}${decision.dissentSummary ? ` (${decision.dissentSummary})` : ""}; outcome=${decision.outcomeStatus ?? "n/a"}`,
          )
      : ["- No decision history loaded."]),
    "",
    "Scenario library:",
    ...(state.scenarios.length > 0
      ? state.scenarios
          .slice(0, 6)
          .map(
            (scenario) =>
              `- ${scenario.initiativeName}: ${scenario.scenarioName}; probability=${scenario.probabilityPct ?? "n/a"}%; horizon=${scenario.timeHorizonMonths ?? "n/a"} months; ${scenario.impactSummary ?? "No impact summary."}`,
          )
      : ["- No scenarios loaded."]),
    "",
    "Stakeholder themes:",
    ...(state.stakeholderNotes.length > 0
      ? state.stakeholderNotes
          .slice(0, 6)
          .map(
            (note) =>
              `- ${note.initiativeName}: ${note.stakeholderTitle ?? "Stakeholder"}; consent=${note.attributionConsent ?? "n/a"}; themes=${note.themes.join(", ") || "n/a"}`,
          )
      : ["- No stakeholder notes loaded."]),
    "",
    "Strategic alignment display:",
    ...(state.alignment2x2View.dots.length > 0
      ? state.alignment2x2View.dots
          .slice(0, 8)
          .map(
            (dot) =>
              `- ${dot.name}: quadrant=${dot.quadrant}; amount=${dot.amount}; confidence=${dot.confidenceLevel}${dot.alignedCallout ? "; aligned callout" : ""}`,
          )
      : [
          `- No plotted initiatives. ${state.alignment2x2View.emptyHint ?? "No alignment dots displayed."}`,
        ]),
    ...(state.alignment2x2View.strategicBets.length > 0
      ? [
          "Strategic bets:",
          ...state.alignment2x2View.strategicBets
            .slice(0, 4)
            .map(
              (bet) =>
                `- ${bet.name}: ${bet.stageDetail}; amount=${bet.amount}; confidence=${bet.confidenceLevel}`,
            ),
        ]
      : []),
  ];

  return lines.join("\n");
}
