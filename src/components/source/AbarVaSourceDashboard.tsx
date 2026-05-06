import Link from 'next/link';
import type { CSSProperties } from 'react';
import { SHELL } from '@/lib/shell/shell-tokens';
import {
  buildSourceAgentContextBundle,
  createSourceAgentMissionReport,
  getSourceContextValidationReadableReport,
  getSourceWorkflowValidationReadableReport,
  type SourceAgentMission,
  type SourceAgentMissionReport,
} from '@/lib/source';
import {
  buildSentinelSourceBriefing,
  adaptSentinelBriefingToMultiAgent,
} from '@/lib/source/sentinel-source-orchestrator';
import type { AbarvaSourceDashboardData } from '@/lib/source/types';
import { formatUsd } from '@/lib/source/value-ledger';
import { SourceAlertPanel, type SourceAlertEventContext } from './SourceAlertPanel';
import { SourcingEventTable } from './SourcingEventTable';

const SOURCE_CARD: CSSProperties = {
  background: SHELL.CARD_WHITE,
  border: '1px solid ' + SHELL.CARD_LINE,
  borderRadius: 10,
  padding: '16px 18px',
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
};

const SOURCE_GRID: CSSProperties = {
  display: 'grid',
  gap: 16,
};

const SOURCE_SECTION_LABEL: CSSProperties = {
  fontFamily: SHELL.MONO,
  fontSize: 9,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.14em',
  color: SHELL.INK_MUTED,
  marginBottom: 0,
};

const SOURCE_MUTED: CSSProperties = {
  fontFamily: SHELL.SANS,
  fontSize: 13,
  color: SHELL.INK_MUTED,
  lineHeight: 1.5,
};

const SOURCE_METRIC_LABEL: CSSProperties = {
  fontFamily: SHELL.MONO,
  fontSize: 9,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.08em',
  color: SHELL.INK_MUTED,
};

const SOURCE_METRIC_VALUE: CSSProperties = {
  fontFamily: SHELL.SERIF,
  fontSize: 24,
  color: SHELL.INK,
};

const SOURCE_METRIC_DETAIL: CSSProperties = {
  fontFamily: SHELL.SANS,
  fontSize: 12,
  color: SHELL.INK_MUTED,
};

const RISK_PILL_HIGH: CSSProperties = {
  fontFamily: SHELL.MONO,
  fontSize: 9,
  padding: '3px 8px',
  borderRadius: 20,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.06em',
  background: SHELL.RUST_BG,
  color: SHELL.RUST_TEXT,
  border: '1px solid ' + SHELL.PEACH_LINE,
  display: 'inline-flex',
  alignItems: 'center',
  width: 'fit-content',
};

const RISK_PILL_MEDIUM: CSSProperties = {
  fontFamily: SHELL.MONO,
  fontSize: 9,
  padding: '3px 8px',
  borderRadius: 20,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.06em',
  background: SHELL.PEACH_BG,
  color: SHELL.PEACH_TEXT,
  border: '1px solid ' + SHELL.PEACH_LINE,
  display: 'inline-flex',
  alignItems: 'center',
  width: 'fit-content',
};

const KPI_CARD: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  minHeight: 86,
  justifyContent: 'space-between',
  border: '1px solid rgba(20, 32, 48, 0.10)',
  borderRadius: 12,
  padding: '12px 14px',
  background: 'rgba(255,255,255,0.82)',
};

const KPI_VALUE: CSSProperties = {
  ...SOURCE_METRIC_VALUE,
  fontSize: '25px',
  color: SHELL.INK,
};

const LIGHT = {
  page: SHELL.PAPER_SOFT,
  card: SHELL.CARD_WHITE,
  line: SHELL.CARD_LINE,
  ink: SHELL.INK,
  navy: '#07111F',
  muted: SHELL.INK_MUTED,
  teal: '#0F766E',
} as const;

const SOURCE_ACTION_LINK_PRIMARY: CSSProperties = {
  textDecoration: 'none',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '9px 12px',
  borderRadius: 999,
  border: '1px solid ' + SHELL.INK,
  background: SHELL.INK,
  color: SHELL.CARD_WHITE,
  fontFamily: SHELL.SANS,
  fontSize: 12,
  fontWeight: 600,
};

const LIGHT_ACTION_LINK: CSSProperties = {
  ...SOURCE_ACTION_LINK_PRIMARY,
  color: LIGHT.ink,
  background: 'rgba(15,118,110,0.10)',
  border: '1px solid rgba(15,118,110,0.24)',
};

const DASHBOARD_MISSION_GENERATED_AT = '2026-04-26T00:00:00.000Z';

export function AbarVaSourceDashboard({ data }: { data: AbarvaSourceDashboardData }) {
  const waitingOrBlockedEvents = data.events.filter(
    (event) => event.blocker || event.status.startsWith('waiting_on'),
  );
  const valueInWaitingOrBlocked = waitingOrBlockedEvents.reduce(
    (total, event) => total + event.valueAtStakeUsd,
    0,
  );
  const mostExposedEvent =
    data.events.find((event) => event.isAtRisk) ?? waitingOrBlockedEvents[0] ?? data.events[0];
  const missionReport = mostExposedEvent ? buildDashboardMissionReport(mostExposedEvent) : null;
  const missionPreviewMissions = missionReport ? getDashboardMissionPreviewMissions(missionReport) : [];
  const eventContextById = data.events.reduce<Record<string, SourceAlertEventContext>>((context, event) => {
    context[event.id] = {
      name: event.name,
      valueAtStakeUsd: event.valueAtStakeUsd,
      agingDays: event.agingDays,
      statusLabel: event.statusLabel,
      blocker: event.blocker,
    };
    return context;
  }, {});

  return (
    <div
      style={{
        display: 'grid',
        gap: 10,
        background: LIGHT.page,
        border: `1px solid ${LIGHT.line}`,
        borderRadius: 20,
        padding: 12,
        boxShadow: '0 16px 44px rgba(0,0,0,0.13)',
        color: LIGHT.ink,
        maxWidth: '100%',
        overflow: 'hidden',
      }}
    >
      <section
        aria-label="AbarVa Source command center entry"
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) auto',
          gap: 12,
          alignItems: 'end',
          background: LIGHT.card,
          border: `1px solid ${LIGHT.line}`,
          borderRadius: 14,
          padding: '14px 16px',
        }}
      >
        <div style={{ display: 'grid', gap: 5 }}>
          <div style={{ ...SOURCE_SECTION_LABEL, color: LIGHT.teal }}>Source command center</div>
          <div
            style={{
              fontFamily: SHELL.SERIF,
              fontSize: 'clamp(22px, 2.4vw, 30px)',
              lineHeight: 1.08,
              color: LIGHT.ink,
              fontWeight: 800,
            }}
          >
            Technology sourcing portfolio, mission preview, and event queue.
          </div>
          <p style={{ ...SOURCE_MUTED, margin: 0, maxWidth: 760, color: LIGHT.muted }}>
            Create and govern IT sourcing events for AMS, cloud, data, AI, cybersecurity, enterprise software,
            SI partners, and technology operating-model work. This is not a blank prompt or generic procurement surface.
          </p>
        </div>
        <Link href="/source/new" style={SOURCE_ACTION_LINK_PRIMARY}>
          Create sourcing event
        </Link>
      </section>

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
          gap: 12,
          alignItems: 'stretch',
          minWidth: 0,
        }}
      >
        <div
          style={{
            ...SOURCE_CARD,
            gap: 10,
            minHeight: 'auto',
            background: LIGHT.navy,
            border: '1px solid rgba(255,255,255,0.10)',
            boxShadow: '0 12px 24px rgba(7,17,31,0.16)',
            padding: 14,
            minWidth: 0,
          }}
        >
          <div style={{ display: 'grid', gap: 7 }}>
            <div style={{ ...SOURCE_SECTION_LABEL, color: '#5EEAD4' }}>Source command read</div>
            <div
              style={{
                fontFamily: SHELL.SERIF,
                fontSize: 'clamp(20px, 2.2vw, 25px)',
                lineHeight: 1.18,
                color: '#F8FAFC',
                maxWidth: 720,
              }}
            >
              {data.metrics.atRiskEvents} at-risk event, {waitingOrBlockedEvents.length} waiting or blocked states,{' '}
              {formatUsd(data.metrics.valueAtStakeUsd)} under management.
            </div>
            <p style={{ ...SOURCE_MUTED, margin: 0, maxWidth: 760, color: 'rgba(248,250,252,0.72)' }}>
              {data.nexusSummary}
            </p>
          </div>

          {mostExposedEvent ? (
            <div
              style={{
                borderTop: '1px solid rgba(255,255,255,0.12)',
                paddingTop: 12,
                display: 'grid',
                gap: 9,
              }}
            >
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={mostExposedEvent.isAtRisk ? RISK_PILL_HIGH : RISK_PILL_MEDIUM}>
                  Most exposed
                </span>
                <span style={{ ...SOURCE_METRIC_DETAIL, color: 'rgba(248,250,252,0.78)', fontWeight: 700 }}>
                  {mostExposedEvent.name}
                </span>
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                  gap: 8,
                }}
              >
                <div>
                  <div style={{ ...SOURCE_METRIC_LABEL, color: 'rgba(248,250,252,0.58)' }}>Owner</div>
                  <div style={{ color: '#F8FAFC', fontWeight: 700 }}>{mostExposedEvent.owner}</div>
                </div>
                <div>
                  <div style={{ ...SOURCE_METRIC_LABEL, color: 'rgba(248,250,252,0.58)' }}>Aging</div>
                  <div style={{ color: '#F8FAFC', fontWeight: 700 }}>{mostExposedEvent.agingDays} days</div>
                </div>
                <div>
                  <div style={{ ...SOURCE_METRIC_LABEL, color: 'rgba(248,250,252,0.58)' }}>Value exposed</div>
                  <div style={{ color: '#F8FAFC', fontWeight: 700 }}>
                    {formatUsd(mostExposedEvent.valueAtStakeUsd)}
                  </div>
                </div>
              </div>
              <div style={{ ...SOURCE_MUTED, margin: 0, color: 'rgba(248,250,252,0.76)' }}>
                Next action: {mostExposedEvent.nextAction}
              </div>
              {missionPreviewMissions.length > 0 && missionReport ? (
                <div
                  style={{
                    borderTop: '1px solid rgba(255,255,255,0.12)',
                    paddingTop: 10,
                    display: 'grid',
                    gap: 8,
                  }}
                >
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'space-between' }}>
                    <span style={{ ...SOURCE_SECTION_LABEL, color: '#5EEAD4' }}>Agent missions</span>
                    <span style={{ ...SOURCE_METRIC_DETAIL, color: 'rgba(248,250,252,0.66)' }}>
                      {missionReport.countByPriority.critical} critical / {missionReport.countByPriority.high} high
                    </span>
                  </div>
                  <div style={{ display: 'grid', gap: 7 }}>
                    {missionPreviewMissions.map((mission) => (
                      <div
                        key={mission.missionId}
                        style={{
                          display: 'grid',
                          gap: 5,
                          border: mission.agentName === 'sentinel'
                            ? '1px solid rgba(94,234,212,0.30)'
                            : '1px solid rgba(255,255,255,0.10)',
                          borderRadius: 10,
                          background: mission.agentName === 'sentinel'
                            ? 'rgba(94,234,212,0.10)'
                            : 'rgba(255,255,255,0.045)',
                          padding: '9px 10px',
                        }}
                      >
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                          <span style={{ ...SOURCE_METRIC_LABEL, color: '#5EEAD4' }}>
                            {mission.agentName === 'sentinel' ? 'Sentinel lead' : agentLabel(mission.agentName)}
                          </span>
                          <span style={{ ...SOURCE_METRIC_DETAIL, color: 'rgba(248,250,252,0.70)', fontWeight: 800 }}>
                            {mission.priority} / {mission.state}
                          </span>
                          <span style={{ ...SOURCE_METRIC_DETAIL, color: 'rgba(248,250,252,0.58)' }}>
                            evidence: {mission.evidenceStatus}
                          </span>
                        </div>
                        <div style={{ color: '#F8FAFC', fontWeight: 800, fontSize: '13px' }}>{mission.title}</div>
                        <div style={{ ...SOURCE_MUTED, margin: 0, color: 'rgba(248,250,252,0.72)', fontSize: '12px' }}>
                          {mission.recommendedAction}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        <SourceAlertPanel
          alerts={data.attentionItems}
          title="Executive pressure signals"
          eventContextById={eventContextById}
          variant="light"
        />
      </section>

      <section style={{ ...SOURCE_GRID, gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 165px), 1fr))', gap: 10 }}>
        <div style={KPI_CARD}>
          <div style={{ display: 'grid', gap: 8 }}>
            <div style={{ ...SOURCE_METRIC_LABEL, color: LIGHT.muted }}>Active Events</div>
            <div style={KPI_VALUE}>{data.metrics.activeEvents}</div>
          </div>
          <div style={{ ...SOURCE_METRIC_DETAIL, color: LIGHT.muted }}>Open sourcing events under active Source governance.</div>
        </div>

        <div style={KPI_CARD}>
          <div style={{ display: 'grid', gap: 8 }}>
            <div style={{ ...SOURCE_METRIC_LABEL, color: LIGHT.muted }}>Waiting / Blocked</div>
            <div style={KPI_VALUE}>{waitingOrBlockedEvents.length}</div>
          </div>
          <div style={{ ...SOURCE_METRIC_DETAIL, color: LIGHT.muted }}>Client, vendor, or blocker states that need owner action.</div>
        </div>

        <div style={KPI_CARD}>
          <div style={{ display: 'grid', gap: 8 }}>
            <div style={{ ...SOURCE_METRIC_LABEL, color: LIGHT.muted }}>At Risk</div>
            <div style={KPI_VALUE}>{data.metrics.atRiskEvents}</div>
          </div>
          <div style={{ ...SOURCE_METRIC_DETAIL, color: LIGHT.muted }}>Events outside tolerance due to aging, blockers, or readiness drift.</div>
        </div>

        <div style={KPI_CARD}>
          <div style={{ display: 'grid', gap: 8 }}>
            <div style={{ ...SOURCE_METRIC_LABEL, color: LIGHT.muted }}>Value At Stake</div>
            <div style={{ ...KPI_VALUE, fontSize: '24px' }}>{formatUsd(data.metrics.valueAtStakeUsd)}</div>
          </div>
          <div style={{ ...SOURCE_METRIC_DETAIL, color: LIGHT.muted }}>
            {formatUsd(valueInWaitingOrBlocked)} sits in waiting or blocked events.
          </div>
        </div>
      </section>

      <SourcingEventTable events={data.events} variant="light" />

      <section
        style={{
          ...SOURCE_CARD,
          gap: 10,
          background: LIGHT.card,
          border: `1px solid ${LIGHT.line}`,
        }}
      >
        <div style={{ ...SOURCE_SECTION_LABEL, color: LIGHT.teal }}>Portfolio operating posture</div>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 10,
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ ...SOURCE_MUTED, margin: 0, maxWidth: 720, color: LIGHT.muted }}>
            {data.description} {data.metrics.decisionsNeeded} decisions need attention before downstream sourcing work expands.
          </div>
          <Link href="/source/value" style={LIGHT_ACTION_LINK}>
            Inspect value ledger
          </Link>
        </div>
      </section>
    </div>
  );
}

type SourceDashboardEvent = AbarvaSourceDashboardData['events'][number];

function buildDashboardMissionReport(event: SourceDashboardEvent): SourceAgentMissionReport {
  const contextBundle = buildSourceAgentContextBundle({
    tenant: {
      tenantId: 'source-dashboard-preview',
      tenantName: 'Source Dashboard Preview',
    },
    user: {
      id: 'source-dashboard-preview',
    },
    userRole: 'sourcingLead',
    persona: 'sourcingLead',
    route: '/source',
    surface: 'dashboard',
    userPrompt: 'Show deterministic Source dashboard missions.',
    eventId: event.id,
    stageKey: event.currentStageKey,
  });
  const contextValidationReport = getSourceContextValidationReadableReport({
    generatedAt: DASHBOARD_MISSION_GENERATED_AT,
  });
  const workflowValidationReport = getSourceWorkflowValidationReadableReport({
    generatedAt: DASHBOARD_MISSION_GENERATED_AT,
  });
  const sentinelBriefing = buildSentinelSourceBriefing({
    contextBundle,
    contextValidationReport,
    workflowValidationReport,
    userRole: 'sourcingLead',
    mode: 'dashboard',
    generatedAt: DASHBOARD_MISSION_GENERATED_AT,
  });

  return createSourceAgentMissionReport({
    contextBundle,
    contextValidationReport,
    workflowValidationReport,
    multiAgentBriefing: adaptSentinelBriefingToMultiAgent(sentinelBriefing),
    userRole: 'sourcingLead',
    mode: 'dashboard',
    generatedAt: DASHBOARD_MISSION_GENERATED_AT,
  });
}

function getDashboardMissionPreviewMissions(report: SourceAgentMissionReport): SourceAgentMission[] {
  const selected: SourceAgentMission[] = [];
  const seenAgents = new Set<string>();
  const nexusMission = report.topMissions.find((mission) => mission.agentName === 'sentinel');

  if (nexusMission) {
    selected.push(nexusMission);
    seenAgents.add(nexusMission.agentName);
  }

  for (const mission of report.topMissions) {
    if (!seenAgents.has(mission.agentName)) {
      selected.push(mission);
      seenAgents.add(mission.agentName);
    }
    if (selected.length === 3) return selected;
  }

  for (const mission of report.topMissions) {
    if (!selected.some((selectedMission) => selectedMission.missionId === mission.missionId)) {
      selected.push(mission);
    }
    if (selected.length === 3) return selected;
  }

  return selected;
}

function agentLabel(agentName: SourceAgentMission['agentName']): string {
  if (agentName === 'nexus') return 'Sentinel';
  if (agentName === 'sentinel') return 'Sentinel';
  if (agentName === 'atlas') return 'Atlas';
  return 'Steward';
}
