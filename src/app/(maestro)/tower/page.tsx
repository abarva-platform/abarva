import Link from 'next/link';
import { TowerIndexPage } from '@/components/tower/TowerIndexPage';
import { TowerLensTabs } from '@/components/tower/TowerLensTabs';
import { TowerProvenanceRibbon } from '@/components/tower/TowerProvenanceRibbon';
import { TowerTopPatternsTile } from '@/components/tower/TowerTopPatternsTile';
import { TowerMissionQueue } from '@/components/tower/TowerMissionQueue';
import { TowerPortfolioSummaryStrip } from '@/components/tower/TowerPortfolioSummaryStrip';
import { TowerPortfolioCascadeGraph } from '@/components/tower/TowerPortfolioCascadeGraph';
import { PortfolioAlertsPanel } from '@/components/tower/PortfolioAlertsPanel';
import { RiskRegisterPanel } from '@/components/_shared/RiskRegisterPanel';
import { ReasoningErrorBoundary } from '@/components/reasoning/ReasoningErrorBoundary';
import { buildTowerSynthesisContext } from '@/lib/reasoning/tower-synthesis-context-builder';
import { buildPortfolioRiskRegister } from '@/lib/reasoning/risk-register';
import { buildPortfolioAlerts } from '@/lib/reasoning/portfolio-alerts';
import { APEX_RETAIL_PROGRAM_INSTANCES } from '@/lib/programs/program-instances';
import { SOURCE_EVENT_INSTANCES } from '@/lib/source/source-event-instances';
import { findTenantByRouteSlug } from '@/lib/deliverables/seed-route-resolver';
import { getServerSupabase } from '@/lib/supabase-server';
import { requireTenancy } from '@/lib/auth/tenancy';
import { loadUserProgramAccessPolicy } from '@/lib/auth/program-access-policy';
import { loadUserSourceAccessPolicy } from '@/lib/auth/source-access-policy';
import { getActiveClientRow } from '@/lib/active-client';
import {
  TOWER_TABS,
  resolveTowerTab,
  type TowerTabKey,
} from '@/lib/tower/tower-lens-tabs-view';
import {
  applySetupAiInitiativeFinancialFirewall,
  getSetupAiInitiatives,
  listPersistedSetupAiInitiatives,
  normalizeSetupAiInitiativeTenantKey,
  summarizeSetupAiInitiatives,
  type SetupAiInitiativeRecord,
} from '@/lib/setup';
import {
  listInitiativesForClient,
  listVendorsForClient,
  type AIInitiative,
  type AIInitiativeVendorRow,
} from '@/lib/admin/ai-initiatives/queries';
import {
  buildTowerBandMetrics,
  type TowerBandMetricsView,
  type TowerLens,
} from '@/lib/tower/band-metrics-view';
import {
  buildTowerPressuresView,
  type TowerPressuresView,
} from '@/lib/tower/pressure-cards-view';
import {
  buildTowerAtlasObservationsView,
  type AtlasObservationsView,
} from '@/lib/tower/atlas-observations-view';
import { resolveTowerToday } from '@/lib/tower/today-resolution';
import { buildStrategicAlignment2x2View } from '@/lib/tower/strategic-alignment-2x2-view';
import { buildAtlasInterpretation } from '@/lib/tower/atlas-interpretation-view';

export const metadata = { title: 'Control Tower · AbarVa' };

/**
 * T-4 (AI Initiatives Substrate v1.1.0): query the canonical AI Initiatives
 * Registry for the active tenant so Tower CFO View can plot real names in
 * the Strategic Alignment 2×2 instead of invented placeholders.
 *
 * Fail-soft: any error (auth, DB, RLS) returns an empty array so the legacy
 * hardcoded 2×2 fallback continues to render — never blocks the page.
 */
async function buildTowerInitiatives(): Promise<ReadonlyArray<AIInitiative>> {
  try {
    const tenancy = await requireTenancy();
    return await listInitiativesForClient(tenancy.clientId);
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
async function buildTowerVendors(): Promise<ReadonlyArray<AIInitiativeVendorRow>> {
  try {
    const tenancy = await requireTenancy();
    return await listVendorsForClient(tenancy.clientId);
  } catch {
    return [];
  }
}

/**
 * T-5 (Bind 1): resolve today's date once for all Tower view-models.
 * `TOWER_DEMO_TODAY` lets pilot deploys pin a specific day; the fallback
 * stays stable for demo determinism across local, preview, and production.
 */
function buildTowerToday(): string {
  return resolveTowerToday();
}

/**
 * T-8 (Bind 4): resolve `?lens=<key>` to a valid TowerLens, defaulting to
 * 'value' for unknown / missing values. Mirrors resolveTowerTab pattern.
 */
function resolveTowerLens(raw: string | undefined): TowerLens {
  if (raw === 'value' || raw === 'risk' || raw === 'contract' || raw === 'adopt') {
    return raw;
  }
  return 'value';
}

// T-2 (Tower Fix Package): reduced from 10 to 5 tabs. Dropped:
// pressure, source_commercial, decisions, value_at_risk,
// reasoning_activity (duplicates Portfolio / lives elsewhere).
const TOWER_SUBMENU_LABELS: Record<TowerTabKey, string> = {
  portfolio: 'Portfolio',
  scorecards: 'Scorecards',
  programme_gates: 'Gates',
  dependencies: 'Dependencies',
  executive_brief: 'Executive brief',
};

function TowerMainSubmenuStrip({ activeTab }: { activeTab: TowerTabKey }) {
  return (
    <nav
      aria-label="Tower workspace submenu"
      data-testid="tower-main-submenu"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        width: '100%',
        overflowX: 'auto',
        padding: '0 10px',
      }}
    >
      <span
        style={{
          flex: '0 0 auto',
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          fontSize: 10,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: '#6b7280',
          fontWeight: 700,
        }}
      >
        Tower
      </span>
      {TOWER_TABS.map((tab) => {
        const isActive = tab.key === activeTab;
        return (
          <Link
            key={tab.key}
            href={tab.key === 'portfolio' ? '/tower' : `/tower?tab=${tab.key}`}
            aria-current={isActive ? 'page' : undefined}
            title={tab.description}
            data-testid={`tower-main-submenu-${tab.key}`}
            style={{
              flex: '0 0 auto',
              border: '0',
              borderBottom: `2px solid ${isActive ? '#0f1f4d' : 'transparent'}`,
              background: 'transparent',
              color: isActive ? '#0f1f4d' : '#4b5563',
              fontFamily: 'var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif',
              fontSize: 13,
              fontWeight: isActive ? 700 : 560,
              lineHeight: 1.2,
              padding: '9px 2px 10px',
              textDecoration: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            {TOWER_SUBMENU_LABELS[tab.key]}
          </Link>
        );
      })}
    </nav>
  );
}

async function buildTowerHandoffPrograms() {
  try {
    const tenancy = await requireTenancy();
    const policy = await loadUserProgramAccessPolicy(tenancy);
    if (policy.accessLevel === 'no_program_access') return [];

    let query = getServerSupabase()
      .from('engagements')
      .select('id, graph_node_id, name, current_phase, lifecycle_state, updated_at')
      .eq('client_id', tenancy.clientId)
      .eq('current_phase', 6)
      .is('archived_at', null)
      .is('deleted_at', null)
      .order('updated_at', { ascending: false })
      .limit(6);

    if (policy.programIdsAllowed && policy.programIdsAllowed.length > 0) {
      query = query.in('id', policy.programIdsAllowed);
    } else if (policy.programIdsAllowed && policy.programIdsAllowed.length === 0) {
      return [];
    }

    const { data, error } = await query;
    if (error || !data) return [];
    return data as Array<{
      id: string;
      graph_node_id: string | null;
      name: string;
      current_phase: number | null;
      lifecycle_state: string | null;
      updated_at: string | null;
    }>;
  } catch {
    return [];
  }
}

async function buildTowerHandoffSourceEvents() {
  try {
    const tenancy = await requireTenancy();
    const activeClient = await getActiveClientRow();
    if (!activeClient || activeClient.id !== tenancy.clientId) return [];

    const policy = await loadUserSourceAccessPolicy(tenancy, {
      activeClientKey: activeClient.key,
    });
    if (policy.sourceScope === 'none') return [];

    let query = getServerSupabase()
      .from('source_events')
      .select('id, event_code, event_name, current_stage_key, lifecycle_state, linked_program_id, updated_at')
      .eq('client_key', activeClient.key)
      .in('current_stage_key', ['transition', 'value', 'contract_mobilization', 'value_realization'])
      .order('updated_at', { ascending: false })
      .limit(6);

    if (policy.sourceEventIdsAllowed && policy.sourceEventIdsAllowed.length > 0) {
      query = query.in('id', policy.sourceEventIdsAllowed);
    } else if (policy.sourceEventIdsAllowed && policy.sourceEventIdsAllowed.length === 0) {
      return [];
    }

    const { data, error } = await query;
    if (error || !data) return [];
    return data as Array<{
      id: string;
      event_code: string;
      event_name: string;
      current_stage_key: string;
      lifecycle_state: string | null;
      linked_program_id: string | null;
      updated_at: string | null;
    }>;
  } catch {
    return [];
  }
}

async function buildTowerSetupInitiativesFeed() {
  const empty = {
    tenantName: 'AbarVa Client',
    tenantKey: 'unknown',
    source: 'empty' as const,
    privateSchema: null as string | null,
    financialVisibility: false,
    summary: summarizeSetupAiInitiatives('unknown', []),
    initiatives: [] as SetupAiInitiativeRecord[],
  };

  try {
    const tenancy = await requireTenancy();
    const activeClient = await getActiveClientRow();
    if (!activeClient || activeClient.id !== tenancy.clientId) return empty;

    const [programPolicy, sourcePolicy] = await Promise.all([
      loadUserProgramAccessPolicy(tenancy).catch(() => null),
      loadUserSourceAccessPolicy(tenancy, {
        activeClientKey: activeClient.key,
      }).catch(() => null),
    ]);
    const financialVisibility = Boolean(
      programPolicy?.canViewFinancialData || sourcePolicy?.canViewFinancialData,
    );
    const tenantKey = normalizeSetupAiInitiativeTenantKey(activeClient.key);
    const persisted = await listPersistedSetupAiInitiatives({
      tenantKey,
      financialVisibility,
    }).catch(() => ({
      status: 'skipped_no_database_url' as const,
      tenantKey,
      privateSchema: null,
      initiatives: [] as SetupAiInitiativeRecord[],
    }));
    const fromPrivate =
      persisted.status === 'private_db' && persisted.initiatives.length > 0;
    const initiatives = fromPrivate
      ? [...persisted.initiatives]
      : getSetupAiInitiatives(tenantKey).map((record) =>
          applySetupAiInitiativeFinancialFirewall(record, financialVisibility),
        );

    return {
      tenantName: activeClient.name,
      tenantKey,
      source: fromPrivate ? ('private_db' as const) : ('fixture_fallback' as const),
      privateSchema: persisted.privateSchema,
      financialVisibility,
      summary: summarizeSetupAiInitiatives(tenantKey, initiatives),
      initiatives,
    };
  } catch {
    return empty;
  }
}

function TowerHandoffProgramsPanel({ programs }: { programs: Awaited<ReturnType<typeof buildTowerHandoffPrograms>> }) {
  if (programs.length === 0) {
    return (
      <div style={{ border: '1px solid #e5dfd2', borderRadius: 10, background: '#fffaf0', padding: '14px 16px' }}>
        <div style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#8a735c', fontWeight: 700 }}>Tower handoffs</div>
        <div style={{ marginTop: 6, fontSize: 13, color: '#5b5148' }}>No P6 Tower handoff programs are visible for your current assignment.</div>
      </div>
    );
  }

  return (
    <div style={{ border: '1px solid #d8e2d1', borderRadius: 10, background: '#f8fbf4', padding: '14px 16px' }}>
      <div style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#49613d', fontWeight: 700 }}>Tower handoffs · P6 active</div>
      <div style={{ display: 'grid', gap: 8, marginTop: 10 }}>
        {programs.map((program) => (
          <a key={program.id} href={`/programs/${program.id}`} style={{ display: 'block', textDecoration: 'none', color: '#111827', border: '1px solid #dde8d7', borderRadius: 8, background: '#ffffff', padding: '10px 12px' }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{program.name}</div>
            <div style={{ marginTop: 3, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#66715e' }}>
              {(program.graph_node_id ?? program.id).slice(0, 12)} · P6 Tower Handoff · {program.lifecycle_state ?? 'active'}
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

function formatSourceTowerStage(stageKey: string): string {
  if (stageKey === 'transition') return 'Transition setup';
  if (stageKey === 'value') return 'Value monitoring';
  if (stageKey === 'contract_mobilization') return 'Transition setup';
  if (stageKey === 'value_realization') return 'Value monitoring';
  return stageKey.replace(/_/g, ' ');
}

function TowerHandoffSourceEventsPanel({ events }: { events: Awaited<ReturnType<typeof buildTowerHandoffSourceEvents>> }) {
  if (events.length === 0) {
    return (
      <div style={{ border: '1px solid #e5dfd2', borderRadius: 10, background: '#fffaf0', padding: '14px 16px' }}>
        <div style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#8a735c', fontWeight: 700 }}>Source handoffs</div>
        <div style={{ marginTop: 6, fontSize: 13, color: '#5b5148' }}>No transitioned Source events are visible for your current assignment.</div>
      </div>
    );
  }

  return (
    <div style={{ border: '1px solid #d6e1ea', borderRadius: 10, background: '#f5f9fc', padding: '14px 16px' }} data-testid="tower-source-handoff-panel">
      <div style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#38556d', fontWeight: 700 }}>Source handoffs · Tower observation</div>
      <div style={{ marginTop: 6, fontSize: 13, color: '#516272' }}>
        Source events in Transition or Value now surface here so Atlas can observe KPI cadence, vendor onboarding, and realized-value drift.
      </div>
      <div style={{ display: 'grid', gap: 8, marginTop: 10 }}>
        {events.map((event) => (
          <a key={event.id} href={`/source/events/${event.id}`} style={{ display: 'block', textDecoration: 'none', color: '#111827', border: '1px solid #dce8f0', borderRadius: 8, background: '#ffffff', padding: '10px 12px' }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{event.event_name}</div>
            <div style={{ marginTop: 3, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#5f7180' }}>
              {event.event_code} · {formatSourceTowerStage(event.current_stage_key)} · {event.lifecycle_state ?? 'active'}
              {event.linked_program_id ? ` · linked program ${event.linked_program_id}` : ''}
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

function formatInitiativeArchetype(archetype: SetupAiInitiativeRecord['archetype']): string {
  return archetype
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function TowerSetupInitiativesPanel({
  feed,
}: {
  feed: Awaited<ReturnType<typeof buildTowerSetupInitiativesFeed>>;
}) {
  if (feed.initiatives.length === 0) {
    return (
      <div
        data-testid="tower-setup-initiatives-panel"
        style={{ border: '1px solid #e5dfd2', borderRadius: 10, background: '#fffaf0', padding: '14px 16px' }}
      >
        <div style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#8a735c', fontWeight: 700 }}>Setup initiatives</div>
        <div style={{ marginTop: 6, fontSize: 13, color: '#5b5148' }}>
          No Setup AI Initiatives are registered for Tower observation yet. Register initiatives in Setup; Tower will observe status, risks, realized signals, and linked program handoffs.
        </div>
      </div>
    );
  }

  const statusRank: Record<SetupAiInitiativeRecord['status'], number> = {
    'at-risk': 0,
    active: 1,
    realizing: 2,
    planning: 3,
    paused: 4,
    settled: 5,
    canceled: 6,
  };
  const visibleInitiatives = [...feed.initiatives]
    .sort((a, b) => statusRank[a.status] - statusRank[b.status])
    .slice(0, 4);
  const summaryItems: Array<[string, number]> = [
    ['registered', feed.summary.total],
    ['active / realizing', feed.summary.activeOrRealizing],
    ['at risk', feed.summary.atRisk],
    ['linked programs', feed.summary.linkedPrograms],
  ];

  return (
    <section
      data-testid="tower-setup-initiatives-panel"
      aria-label="Setup AI Initiatives Tower feed"
      style={{ border: '1px solid #d8e2d1', borderRadius: 10, background: '#f8fbf4', padding: '14px 16px' }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#49613d', fontWeight: 700 }}>Setup initiatives · Tower feed</div>
          <div style={{ marginTop: 6, fontSize: 13, color: '#51604a', lineHeight: 1.45 }}>
            Tower observes registered AI initiatives from Setup. Setup owns the registry; Atlas watches status, risk signals, realized signals, and linked-program drift.
          </div>
        </div>
        <div style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 10, letterSpacing: '0.10em', textTransform: 'uppercase', color: '#66715e', whiteSpace: 'nowrap' }}>
          {feed.source === 'private_db' ? 'Private plane' : 'Fixture fallback'}
          {feed.privateSchema ? ` · ${feed.privateSchema}` : ''}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 8, marginTop: 12 }}>
        {summaryItems.map(([label, value]) => (
          <div key={label} style={{ border: '1px solid #dde8d7', borderRadius: 8, background: '#ffffff', padding: '9px 10px' }}>
            <div style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#66715e' }}>{label}</div>
            <div style={{ marginTop: 4, fontSize: 18, fontWeight: 700, color: '#152212' }}>{value}</div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 10, fontSize: 12, color: '#5f6d58', lineHeight: 1.45 }}>
        {feed.financialVisibility
          ? 'Directional financial posture shown in Tower; exact figures remain behind governed evidence views.'
          : 'Exact financial values withheld; Tower shows directional spend/value posture only.'}
      </div>

      <div style={{ display: 'grid', gap: 8, marginTop: 10 }}>
        {visibleInitiatives.map((initiative) => (
          <div key={initiative.initiativeId} style={{ border: '1px solid #dde8d7', borderRadius: 8, background: '#ffffff', padding: '10px 12px' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, justifyContent: 'space-between' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{initiative.name}</div>
              <div style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: initiative.status === 'at-risk' ? '#8a3c1f' : '#5f7180' }}>
                {initiative.status}
              </div>
            </div>
            <div style={{ marginTop: 4, fontSize: 12, color: '#536156', lineHeight: 1.45 }}>
              {formatInitiativeArchetype(initiative.archetype)} · Sponsor: {initiative.sponsorRole} · Owner: {initiative.ownerRole}
              {initiative.linkedProgramId ? ` · Linked program ${initiative.linkedProgramId}` : ''}
            </div>
            <div style={{ marginTop: 6, fontSize: 12, color: '#66715e', lineHeight: 1.45 }}>
              Value posture: {initiative.directionalSummary.value}. Spend posture: {initiative.directionalSummary.spend}. Trajectory: {initiative.directionalSummary.trajectory.replace(/_/g, ' ')}.
            </div>
            {initiative.riskSignals.length > 0 ? (
              <div style={{ marginTop: 6, fontSize: 12, color: '#70472f', lineHeight: 1.45 }}>
                Risk: {initiative.riskSignals[0].description}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}

export default async function TowerPage({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string; lens?: string }>;
}) {
  // REASON-29 — Build the portfolio-level Atlas SynthesisContext server-side so
  // the provenance ribbon can surface the inputs that grounded the streamed
  // Atlas synthesis quote (patterns cited, gate counts, blockers, cascades).
  const synthesisContext = buildTowerSynthesisContext(
    APEX_RETAIL_PROGRAM_INSTANCES,
    SOURCE_EVENT_INSTANCES,
  );

  // Portfolio-level risk register: top 10 risks aggregated across every
  // active program + source-event instance, sorted globally by severity
  // and confidence.
  const portfolioRisks = buildPortfolioRiskRegister();

  // Portfolio alerts: cross-instance feed of urgent reasoning signals
  // (red-grade health, high-severity contradictions, high-confidence
  // failure modes, high-impact cascades). Surfaces above the provenance
  // ribbon so the executive sees the most urgent items first.
  const portfolioAlerts = buildPortfolioAlerts();

  const towerHandoffPrograms = await buildTowerHandoffPrograms();
  const towerHandoffSourceEvents = await buildTowerHandoffSourceEvents();
  const towerSetupInitiativesFeed = await buildTowerSetupInitiativesFeed();
  const towerInitiatives = await buildTowerInitiatives();
  const towerVendors = await buildTowerVendors();
  // Active client id (when bound) — wires the AgentDock chat lane to
  // /api/v1/atlas/chat. Fail-soft: when no client row resolves we omit
  // clientId and the dock surfaces a soft "Atlas needs an active tenant"
  // message instead of crashing the page.
  const activeClient = await getActiveClientRow().catch(() => null);
  const activeClientId = activeClient?.id ?? null;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const activeTab = resolveTowerTab(resolvedSearchParams.tab);
  // T-8 (Bind 4): resolve the active lens server-side so the band/pressures
  // view-models can re-rank per lens. Falls back to 'value' for unknown.
  const activeLens: TowerLens = resolveTowerLens(resolvedSearchParams.lens);
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
  const deterministicAtlasObservations: AtlasObservationsView = buildTowerAtlasObservationsView(
    towerInitiatives,
    towerVendors,
    towerPressures,
    towerToday,
  );
  const towerAlignment2x2 = buildStrategicAlignment2x2View(towerInitiatives);
  const towerAtlasInterpretation = buildAtlasInterpretation({
    tenant: { name: towerSetupInitiativesFeed.tenantName, clientId: activeClientId },
    todayIso: towerToday,
    lens: activeLens,
    bandMetrics: towerBandMetrics,
    pressuresView: towerPressures,
    alignment2x2View: towerAlignment2x2,
    initiatives: towerInitiatives,
    vendors: towerVendors,
  });
  const towerAtlasObservations: AtlasObservationsView =
    towerAtlasInterpretation.interpretationConfidence === 'low'
      ? deterministicAtlasObservations
      : towerAtlasInterpretation;
  const seedTenant =
    findTenantByRouteSlug(towerSetupInitiativesFeed.tenantKey) ??
    findTenantByRouteSlug('apexretail');

  return (
    <TowerIndexPage
      tenantName={towerSetupInitiativesFeed.tenantName}
      context={`Control Tower · ${TOWER_SUBMENU_LABELS[activeTab]} · ${towerSetupInitiativesFeed.summary.total} initiatives observed`}
      clientId={activeClientId ?? undefined}
      initiatives={towerInitiatives}
      bandMetrics={towerBandMetrics}
      pressuresView={towerPressures}
      atlasObservationsView={towerAtlasObservations}
      towerSubmenuSlot={<TowerMainSubmenuStrip activeTab={activeTab} />}
      provenanceSlot={
        <>
          <PortfolioAlertsPanel alerts={portfolioAlerts} />
          <TowerProvenanceRibbon context={synthesisContext} />
          <ReasoningErrorBoundary section="Risk Register">
            <RiskRegisterPanel
              risks={portfolioRisks}
              title="Risk register · portfolio"
              maxRows={10}
            />
          </ReasoningErrorBoundary>
          <TowerTopPatternsTile />
          <TowerMissionQueue limit={8} />
        </>
      }
      portfolioSummarySlot={<TowerPortfolioSummaryStrip />}
      cascadeGraphSlot={<TowerPortfolioCascadeGraph />}
      towerHandoffSlot={
        <>
          <TowerSetupInitiativesPanel feed={towerSetupInitiativesFeed} />
          <TowerHandoffProgramsPanel programs={towerHandoffPrograms} />
          <TowerHandoffSourceEventsPanel events={towerHandoffSourceEvents} />
        </>
      }
      towerLensSlot={
        seedTenant ? (
          <section
            aria-label={`${TOWER_SUBMENU_LABELS[activeTab]} Tower lens`}
            data-testid="tower-main-lens-canvas"
            style={{
              border: '1px solid #e5dfd2',
              borderRadius: 12,
              background: '#ffffff',
              overflow: 'hidden',
            }}
          >
            <TowerLensTabs
              tenant={seedTenant}
              activeTab={activeTab}
              baseUrl="/tower"
              showTabBar={false}
            />
          </section>
        ) : null
      }
    />
  );
}
