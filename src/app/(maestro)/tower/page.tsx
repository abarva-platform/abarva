import Link from 'next/link';
import { TowerIndexPage, type TowerSubstrateCounts } from '@/components/tower/TowerIndexPage';
import { PortfolioSequenceView } from '@/components/admin/tower/PortfolioSequenceView';
import { MovePortfolioCardPanel } from '@/components/tower/MovePortfolioCardPanel';
import { TowerOutcomeReportDownload } from '@/components/tower/TowerOutcomeReportDownload';
import {
  APEX_TENANT_KEY,
  buildApexPortfolioCards,
} from '@/lib/tower/apex-contact-center-portfolio-fixture';
import type { MovePortfolioCard } from '@/lib/tower/move-portfolio-card';
import { selectTowerPageReadAdapter } from '@/lib/data-plane/read-adapters/towerPageReadAdapter';
import { requireTenancy } from '@/lib/auth/tenancy';
import { loadUserProgramAccessPolicy } from '@/lib/auth/program-access-policy';
import { loadUserSourceAccessPolicy } from '@/lib/auth/source-access-policy';
import { getActiveClientRow } from '@/lib/active-client';
import { canonicalClientDisplayName } from '@/lib/client-config';
import {
  TOWER_TABS,
  resolveTowerTab,
  type TowerTabKey,
} from '@/lib/tower/tower-lens-tabs-view';
import {
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
import {
  buildAtlasInterpretation,
  type AtlasReasoningInput,
} from '@/lib/tower/atlas-interpretation-view';
import { buildTowerRightRailReasoningTrace } from '@/lib/tower/atlas-reasoning-trace';
import { buildPortfolioSequenceView } from '@/lib/tower/portfolio-sequence-view';
import { appendAtlasReasoningTrace } from '@/lib/atlas/repository';

export const metadata = { title: 'Control Tower · AbarVa' };

type TowerClientRow = NonNullable<Awaited<ReturnType<typeof getActiveClientRow>>>;

const TOWER_PILOT_CLIENT_KEYS = ['apexretail', 'meridian', 'arcturus'] as const;

async function clientHasTowerSubstrate(clientId: string): Promise<boolean> {
  // The physical `ai_initiatives` count moved behind the Tower-page read
  // adapter (Slice 9); the adapter already fails soft to `0`.
  const count = await selectTowerPageReadAdapter().countClientInitiatives(clientId);
  return count > 0;
}

async function resolveTowerClient(requestedClientKey?: string): Promise<TowerClientRow | null> {
  const activeClient = await getActiveClientRow(requestedClientKey).catch(() => null);
  if (activeClient) return activeClient;
  if (requestedClientKey) return null;

  for (const clientKey of TOWER_PILOT_CLIENT_KEYS) {
    const candidate = await getActiveClientRow(clientKey).catch(() => null);
    if (candidate && await clientHasTowerSubstrate(candidate.id)) {
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
async function buildTowerInitiatives(clientId: string | null): Promise<ReadonlyArray<AIInitiative>> {
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
async function buildTowerVendors(clientId: string | null): Promise<ReadonlyArray<AIInitiativeVendorRow>> {
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
  const initiativeIds = initiatives.map((initiative) => initiative.initiativeId);
  const [kpis, decisions, stakeholderNotes, scenarios] = await Promise.all([
    countByInitiatives('ai_initiative_kpis', initiativeIds),
    countByInitiatives('ai_initiative_decisions', initiativeIds),
    countByInitiatives('ai_initiative_stakeholder_notes', initiativeIds),
    countByInitiatives('ai_initiative_scenarios', initiativeIds),
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
        justifyContent: 'center',
        gap: 10,
        width: '100%',
        overflowX: 'auto',
        padding: '0 18px',
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
    // Access-policy gating stays in the page: a no-access caller never reaches
    // the data plane, and an empty allow-list means "deny all" — short-circuit
    // to [] without a read. Only the physical query moved to the read adapter.
    if (policy.accessLevel === 'no_program_access') return [];
    if (policy.programIdsAllowed && policy.programIdsAllowed.length === 0) return [];

    const allowedIds =
      policy.programIdsAllowed && policy.programIdsAllowed.length > 0
        ? policy.programIdsAllowed
        : null;

    return await selectTowerPageReadAdapter().listHandoffPrograms(
      tenancy.clientId,
      allowedIds,
    );
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
    // Access-policy gating stays in the page: a `none`-scope caller never
    // reaches the data plane, and an empty allow-list means "deny all".
    // Only the physical query moved to the read adapter.
    if (policy.sourceScope === 'none') return [];
    if (policy.sourceEventIdsAllowed && policy.sourceEventIdsAllowed.length === 0) return [];

    const allowedIds =
      policy.sourceEventIdsAllowed && policy.sourceEventIdsAllowed.length > 0
        ? policy.sourceEventIdsAllowed
        : null;

    return await selectTowerPageReadAdapter().listHandoffSourceEvents(
      activeClient.key,
      allowedIds,
    );
  } catch {
    return [];
  }
}

async function buildTowerSetupInitiativesFeed(
  activeClient: Awaited<ReturnType<typeof getActiveClientRow>>,
) {
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
    if (!activeClient) return empty;
    const tenancy = await requireTenancy().catch(() => null);

    const [programPolicy, sourcePolicy] = tenancy && tenancy.clientId === activeClient.id
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
      status: 'skipped_no_database_url' as const,
      tenantKey,
      privateSchema: null,
      initiatives: [] as SetupAiInitiativeRecord[],
    }));
    const fromPrivate = persisted.status === 'private_db';
    const initiatives = fromPrivate ? [...persisted.initiatives] : [];

    const tenantName = canonicalClientDisplayName({ key: activeClient.key, name: activeClient.name }) ?? activeClient.name;

    return {
      tenantName,
      tenantKey,
      source: fromPrivate ? ('private_db' as const) : ('empty' as const),
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
          {feed.source === 'private_db' ? 'Private plane' : 'DB required'}
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
  searchParams?: Promise<{ tab?: string; lens?: string; client?: string }>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  // Active client id (when bound) — wires the AgentDock chat lane to
  // /api/v1/atlas/chat. If the session has no resolvable client row (for
  // example an internal pilot account with cleared active-client cookie),
  // bind Tower to the first pilot client that has real AI Initiative rows.
  const activeClient = await resolveTowerClient(resolvedSearchParams.client);
  const activeClientId = activeClient?.id ?? null;
  const towerHandoffPrograms = await buildTowerHandoffPrograms();
  const towerHandoffSourceEvents = await buildTowerHandoffSourceEvents();
  // GAP-4 — render loop-completed Moves as first-class Tower portfolio
  // cards. The Apex contact-centre Move card is a hardcoded fixture
  // (see `apex-contact-center-portfolio-fixture.ts`) and is therefore
  // gated behind `TOWER_APEX_FIXTURE_ENABLED=1`. With the flag off
  // (the pilot default), Tower renders the honest empty state from
  // `MovePortfolioCardPanel` until a real loop-completed Move lands
  // through the broker. The flag is a temporary affordance for demo
  // walkthroughs while broker-backed portfolio reads are wired up;
  // see `docs/pilot/TOWER-REDIRECT-SHELL-DECISIONS.md`.
  const apexFixtureEnabled = process.env.TOWER_APEX_FIXTURE_ENABLED === '1';
  const movePortfolioCards: readonly MovePortfolioCard[] =
    apexFixtureEnabled && activeClient?.key === APEX_TENANT_KEY
      ? buildApexPortfolioCards()
      : [];
  const towerSetupInitiativesFeed = await buildTowerSetupInitiativesFeed(activeClient);
  const towerInitiatives = await buildTowerInitiatives(activeClientId);
  const towerVendors = await buildTowerVendors(activeClientId);
  const towerSubstrateCounts = await buildTowerSubstrateCounts(towerInitiatives, towerVendors);
  const portfolioSequenceView = activeClient
    ? buildPortfolioSequenceView({
        clientKey: activeClient.key,
        clientName: towerSetupInitiativesFeed.tenantName,
      })
    : null;
  const activeTab = resolveTowerTab(resolvedSearchParams.tab);
  // The dashboard band is fixed. Canvas controls can change the lower pane,
  // but stale ?lens= URLs must not re-rank the executive metrics underneath.
  const activeLens: TowerLens = 'value';
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
  const atlasReasoningInput: AtlasReasoningInput = {
    tenant: { name: towerSetupInitiativesFeed.tenantName, clientId: activeClientId },
    todayIso: towerToday,
    lens: activeLens,
    bandMetrics: towerBandMetrics,
    pressuresView: towerPressures,
    alignment2x2View: towerAlignment2x2,
    initiatives: towerInitiatives,
    vendors: towerVendors,
  };
  const towerAtlasInterpretation = buildAtlasInterpretation(atlasReasoningInput);
  const towerAtlasObservations: AtlasObservationsView =
    towerAtlasInterpretation.interpretationConfidence === 'low'
      ? deterministicAtlasObservations
      : towerAtlasInterpretation;
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
        fallbackUsed: towerAtlasInterpretation.interpretationConfidence === 'low',
        fallbackReason: towerAtlasInterpretation.interpretationConfidence === 'low' ? 'low_confidence' : null,
      }),
    ).catch(() => null);
  }
  return (
    <TowerIndexPage
      tenantName={towerSetupInitiativesFeed.tenantName}
      context={`Control Tower · ${TOWER_SUBMENU_LABELS[activeTab]} · ${towerSetupInitiativesFeed.summary.total} initiatives observed`}
      towerToday={towerToday}
      clientId={activeClientId ?? undefined}
      initiatives={towerInitiatives}
      vendors={towerVendors}
      bandMetrics={towerBandMetrics}
      pressuresView={towerPressures}
      atlasObservationsView={towerAtlasObservations}
      substrateCounts={towerSubstrateCounts}
      activeTab={activeTab}
      towerSubmenuSlot={<TowerMainSubmenuStrip activeTab={activeTab} />}
      portfolioSequenceSlot={portfolioSequenceView ? <PortfolioSequenceView model={portfolioSequenceView} /> : null}
      reportDownloadSlot={
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <Link
            href="/admin/dossiers"
            style={{
              border: '1px solid #d0d5dd',
              borderRadius: 6,
              background: '#fff',
              color: '#344054',
              padding: '9px 11px',
              fontSize: 12,
              fontWeight: 800,
              textDecoration: 'none',
            }}
          >
            View in Dossier
          </Link>
          {activeClient ? (
            <TowerOutcomeReportDownload clientKey={activeClient.key} />
          ) : null}
        </div>
      }
      towerHandoffSlot={
        <>
          <MovePortfolioCardPanel
            cards={movePortfolioCards}
            tenantName={towerSetupInitiativesFeed.tenantName}
          />
          <TowerSetupInitiativesPanel feed={towerSetupInitiativesFeed} />
          <TowerHandoffProgramsPanel programs={towerHandoffPrograms} />
          <TowerHandoffSourceEventsPanel events={towerHandoffSourceEvents} />
        </>
      }
    />
  );
}
