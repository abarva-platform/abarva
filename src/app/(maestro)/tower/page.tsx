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

  return (
    <TowerIndexPage
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
          <TowerHandoffProgramsPanel programs={towerHandoffPrograms} />
          <TowerHandoffSourceEventsPanel events={towerHandoffSourceEvents} />
        </>
      }
    />
  );
}
