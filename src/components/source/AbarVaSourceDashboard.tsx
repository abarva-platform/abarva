import Link from 'next/link';
import type { CSSProperties } from 'react';
import { COMPONENTS, FONTS } from '@/lib/design-system';
import {
  buildSourceAgentContextBundle,
  buildSourceMultiAgentBriefing,
  createSourceAgentMissionReport,
  getSourceContextValidationReadableReport,
  getSourceWorkflowValidationReadableReport,
  type SourceAgentMission,
  type SourceAgentMissionReport,
} from '@/lib/source';
import type { AbarvaSourceDashboardData } from '@/lib/source/types';
import { formatUsd } from '@/lib/source/value-ledger';
import {
  sourceActionLink,
  sourceCard,
  sourceGrid,
  sourceMetricDetail,
  sourceMetricLabel,
  sourceMetricValue,
  sourceMuted,
  sourceSectionLabel,
} from './foundationStyles';
import { SourceAlertPanel, type SourceAlertEventContext } from './SourceAlertPanel';
import { SourcingEventTable } from './SourcingEventTable';

const KPI_CARD: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  minHeight: 96,
  justifyContent: 'space-between',
  border: '1px solid rgba(20, 32, 48, 0.10)',
  borderRadius: 12,
  padding: '14px 15px',
  background: 'rgba(255,255,255,0.82)',
};

const KPI_VALUE: CSSProperties = {
  ...sourceMetricValue,
  fontSize: '27px',
  color: '#111827',
};

const LIGHT = {
  page: '#F7F4EF',
  card: '#FFFFFF',
  line: 'rgba(20, 32, 48, 0.12)',
  ink: '#101827',
  navy: '#07111F',
  muted: '#5F6673',
  teal: '#0F766E',
} as const;

const LIGHT_ACTION_LINK: CSSProperties = {
  ...sourceActionLink('primary'),
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
        gap: 12,
        background: LIGHT.page,
        border: `1px solid ${LIGHT.line}`,
        borderRadius: 20,
        padding: 14,
        boxShadow: '0 20px 70px rgba(0,0,0,0.18)',
        color: LIGHT.ink,
        maxWidth: '100%',
        overflow: 'hidden',
      }}
    >
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))',
          gap: 14,
          alignItems: 'stretch',
          minWidth: 0,
        }}
      >
        <div
          style={{
            ...sourceCard,
            gap: 12,
            minHeight: 'auto',
            background: LIGHT.navy,
            border: '1px solid rgba(255,255,255,0.10)',
            boxShadow: '0 14px 32px rgba(7,17,31,0.20)',
            minWidth: 0,
          }}
        >
          <div style={{ display: 'grid', gap: 7 }}>
            <div style={{ ...sourceSectionLabel, color: '#5EEAD4' }}>Source command read</div>
            <div
              style={{
                fontFamily: FONTS.serif,
                fontSize: 'clamp(22px, 2.6vw, 28px)',
                lineHeight: 1.18,
                color: '#F8FAFC',
                maxWidth: 760,
              }}
            >
              {data.metrics.atRiskEvents} at-risk event, {waitingOrBlockedEvents.length} waiting or blocked states,{' '}
              {formatUsd(data.metrics.valueAtStakeUsd)} under management.
            </div>
            <p style={{ ...sourceMuted, margin: 0, maxWidth: 760, color: 'rgba(248,250,252,0.72)' }}>
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
                <span style={COMPONENTS.riskPill(mostExposedEvent.isAtRisk ? 'high' : 'medium')}>
                  Most exposed
                </span>
                <span style={{ ...sourceMetricDetail, color: 'rgba(248,250,252,0.78)', fontWeight: 700 }}>
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
                  <div style={{ ...sourceMetricLabel, color: 'rgba(248,250,252,0.58)' }}>Owner</div>
                  <div style={{ color: '#F8FAFC', fontWeight: 700 }}>{mostExposedEvent.owner}</div>
                </div>
                <div>
                  <div style={{ ...sourceMetricLabel, color: 'rgba(248,250,252,0.58)' }}>Aging</div>
                  <div style={{ color: '#F8FAFC', fontWeight: 700 }}>{mostExposedEvent.agingDays} days</div>
                </div>
                <div>
                  <div style={{ ...sourceMetricLabel, color: 'rgba(248,250,252,0.58)' }}>Value exposed</div>
                  <div style={{ color: '#F8FAFC', fontWeight: 700 }}>
                    {formatUsd(mostExposedEvent.valueAtStakeUsd)}
                  </div>
                </div>
              </div>
              <div style={{ ...sourceMuted, margin: 0, color: 'rgba(248,250,252,0.76)' }}>
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
                    <span style={{ ...sourceSectionLabel, color: '#5EEAD4' }}>Agent missions</span>
                    <span style={{ ...sourceMetricDetail, color: 'rgba(248,250,252,0.66)' }}>
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
                          border: mission.agentName === 'nexus'
                            ? '1px solid rgba(94,234,212,0.30)'
                            : '1px solid rgba(255,255,255,0.10)',
                          borderRadius: 10,
                          background: mission.agentName === 'nexus'
                            ? 'rgba(94,234,212,0.10)'
                            : 'rgba(255,255,255,0.045)',
                          padding: '9px 10px',
                        }}
                      >
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                          <span style={{ ...sourceMetricLabel, color: '#5EEAD4' }}>
                            {mission.agentName === 'nexus' ? 'Nexus lead' : agentLabel(mission.agentName)}
                          </span>
                          <span style={{ ...sourceMetricDetail, color: 'rgba(248,250,252,0.70)', fontWeight: 800 }}>
                            {mission.priority} / {mission.state}
                          </span>
                          <span style={{ ...sourceMetricDetail, color: 'rgba(248,250,252,0.58)' }}>
                            evidence: {mission.evidenceStatus}
                          </span>
                        </div>
                        <div style={{ color: '#F8FAFC', fontWeight: 800, fontSize: '13px' }}>{mission.title}</div>
                        <div style={{ ...sourceMuted, margin: 0, color: 'rgba(248,250,252,0.72)', fontSize: '12px' }}>
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

      <section style={{ ...sourceGrid, gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 170px), 1fr))', gap: 12 }}>
        <div style={KPI_CARD}>
          <div style={{ display: 'grid', gap: 8 }}>
            <div style={{ ...sourceMetricLabel, color: LIGHT.muted }}>Active Events</div>
            <div style={KPI_VALUE}>{data.metrics.activeEvents}</div>
          </div>
          <div style={{ ...sourceMetricDetail, color: LIGHT.muted }}>Open sourcing events under active Source governance.</div>
        </div>

        <div style={KPI_CARD}>
          <div style={{ display: 'grid', gap: 8 }}>
            <div style={{ ...sourceMetricLabel, color: LIGHT.muted }}>Waiting / Blocked</div>
            <div style={KPI_VALUE}>{waitingOrBlockedEvents.length}</div>
          </div>
          <div style={{ ...sourceMetricDetail, color: LIGHT.muted }}>Client, vendor, or blocker states that need owner action.</div>
        </div>

        <div style={KPI_CARD}>
          <div style={{ display: 'grid', gap: 8 }}>
            <div style={{ ...sourceMetricLabel, color: LIGHT.muted }}>At Risk</div>
            <div style={KPI_VALUE}>{data.metrics.atRiskEvents}</div>
          </div>
          <div style={{ ...sourceMetricDetail, color: LIGHT.muted }}>Events outside tolerance due to aging, blockers, or readiness drift.</div>
        </div>

        <div style={KPI_CARD}>
          <div style={{ display: 'grid', gap: 8 }}>
            <div style={{ ...sourceMetricLabel, color: LIGHT.muted }}>Value At Stake</div>
            <div style={{ ...KPI_VALUE, fontSize: '26px' }}>{formatUsd(data.metrics.valueAtStakeUsd)}</div>
          </div>
          <div style={{ ...sourceMetricDetail, color: LIGHT.muted }}>
            {formatUsd(valueInWaitingOrBlocked)} sits in waiting or blocked events.
          </div>
        </div>
      </section>

      <SourcingEventTable events={data.events} variant="light" />

      <section
        style={{
          ...sourceCard,
          gap: 10,
          background: LIGHT.card,
          border: `1px solid ${LIGHT.line}`,
        }}
      >
        <div style={{ ...sourceSectionLabel, color: LIGHT.teal }}>Portfolio operating posture</div>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 10,
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ ...sourceMuted, margin: 0, maxWidth: 720, color: LIGHT.muted }}>
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
  const multiAgentBriefing = buildSourceMultiAgentBriefing({
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
    multiAgentBriefing,
    userRole: 'sourcingLead',
    mode: 'dashboard',
    generatedAt: DASHBOARD_MISSION_GENERATED_AT,
  });
}

function getDashboardMissionPreviewMissions(report: SourceAgentMissionReport): SourceAgentMission[] {
  const selected: SourceAgentMission[] = [];
  const seenAgents = new Set<string>();
  const nexusMission = report.topMissions.find((mission) => mission.agentName === 'nexus');

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
  if (agentName === 'nexus') return 'Nexus';
  if (agentName === 'sentinel') return 'Sentinel';
  if (agentName === 'atlas') return 'Atlas';
  return 'Steward';
}
