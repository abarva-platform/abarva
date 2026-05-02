import { TowerIndexPage } from '@/components/tower/TowerIndexPage';
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
import { getServerSupabase } from '@/lib/supabase-server';
import { requireTenancy } from '@/lib/auth/tenancy';
import { loadUserProgramAccessPolicy } from '@/lib/auth/program-access-policy';
import { loadUserSourceAccessPolicy } from '@/lib/auth/source-access-policy';
import { getActiveClientRow } from '@/lib/active-client';
import {
  applySetupAiInitiativeFinancialFirewall,
  getSetupAiInitiatives,
  listPersistedSetupAiInitiatives,
  normalizeSetupAiInitiativeTenantKey,
  summarizeSetupAiInitiatives,
  type SetupAiInitiativeRecord,
} from '@/lib/setup';

export const metadata = { title: 'Control Tower · AbarVa' };

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
      <div style={{ margin: '0 28px 16px', border: '1px solid #e5dfd2', borderRadius: 10, background: '#fffaf0', padding: '14px 16px' }}>
        <div style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#8a735c', fontWeight: 700 }}>Tower handoffs</div>
        <div style={{ marginTop: 6, fontSize: 13, color: '#5b5148' }}>No P6 Tower handoff programs are visible for your current assignment.</div>
      </div>
    );
  }

  return (
    <div style={{ margin: '0 28px 16px', border: '1px solid #d8e2d1', borderRadius: 10, background: '#f8fbf4', padding: '14px 16px' }}>
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
      <div style={{ margin: '0 28px 16px', border: '1px solid #e5dfd2', borderRadius: 10, background: '#fffaf0', padding: '14px 16px' }}>
        <div style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#8a735c', fontWeight: 700 }}>Source handoffs</div>
        <div style={{ marginTop: 6, fontSize: 13, color: '#5b5148' }}>No transitioned Source events are visible for your current assignment.</div>
      </div>
    );
  }

  return (
    <div style={{ margin: '0 28px 16px', border: '1px solid #d6e1ea', borderRadius: 10, background: '#f5f9fc', padding: '14px 16px' }} data-testid="tower-source-handoff-panel">
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
        style={{ margin: '0 28px 16px', border: '1px solid #e5dfd2', borderRadius: 10, background: '#fffaf0', padding: '14px 16px' }}
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
      style={{ margin: '0 28px 16px', border: '1px solid #d8e2d1', borderRadius: 10, background: '#f8fbf4', padding: '14px 16px' }}
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

export default async function TowerPage() {
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

  return (
    <TowerIndexPage
      tenantName={towerSetupInitiativesFeed.tenantName}
      context={`Control Tower · ${towerSetupInitiativesFeed.summary.total} initiatives observed`}
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
    />
  );
}
