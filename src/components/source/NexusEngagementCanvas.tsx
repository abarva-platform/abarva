import type { CSSProperties } from 'react';
import { EXPERIENCE_COLORS, FONTS, TEXT } from '@/lib/design-system';
import {
  buildSourceAgentContextBundle,
  buildSourceMultiAgentBriefing,
  createSourceAgentMissionReport,
  getSourceContextValidationReadableReport,
  getSourceWorkflowValidationReadableReport,
  type SourceAgentMission,
  type SourceAgentMissionReport,
} from '@/lib/source';
import type { SourcingEventDetail } from '@/lib/source/types';
import { formatUsd } from '@/lib/source/value-ledger';
import { SourceActiveStageWorkspace } from './SourceActiveStageWorkspace';
import { SourceAlertPanel } from './SourceAlertPanel';
import { SourceJourneyTracker } from './SourceJourneyTracker';
import { SourceStagePanel } from './SourceStagePanel';
import { PersistentNexusPanel } from './PersistentNexusPanel';

const EVENT_CANVAS_MISSION_GENERATED_AT = '2026-04-26T00:00:00.000Z';

const CANVAS: CSSProperties = {
  display: 'grid',
  gap: 16,
  color: EXPERIENCE_COLORS.textPrimary,
};

const CONTEXT_STRIP: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 150px), 1fr))',
  gap: 10,
  border: `1px solid ${EXPERIENCE_COLORS.borderSoft}`,
  borderRadius: 16,
  background: EXPERIENCE_COLORS.surface,
  padding: 14,
};

const CONTEXT_TILE: CSSProperties = {
  display: 'grid',
  gap: 5,
  border: `1px solid ${EXPERIENCE_COLORS.borderSoft}`,
  borderRadius: 10,
  background: EXPERIENCE_COLORS.surfaceWarm,
  padding: '10px 12px',
};

const BODY_GRID: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1.55fr) minmax(280px, 0.72fr)',
  gap: 16,
  alignItems: 'start',
  minWidth: 0,
};

export function NexusEngagementCanvas({ event }: { event: SourcingEventDetail }) {
  const missionReport = buildEventCanvasMissionReport(event);
  const missionPreviewMissions = getEventCanvasMissionPreviewMissions(missionReport);

  return (
    <section style={CANVAS}>
      <EventContextStrip event={event} missionReport={missionReport} />
      <div style={BODY_GRID}>
        <div style={{ display: 'grid', gap: 16, minWidth: 0 }}>
          <SourceJourneyTracker stages={event.stages} />
          <SourceActiveStageWorkspace
            event={event}
            missionReport={missionReport}
            missionPreviewMissions={missionPreviewMissions}
          />
          <SourceAlertPanel
            alerts={event.alerts}
            title="Event pressure signals"
            emptyLabel="No open event alerts. Nexus will keep this shell focused on the current stage."
            variant="light"
          />
          <SourceStagePanel event={event} />
        </div>
        <PersistentNexusPanel event={event} missionReport={missionReport} />
      </div>
    </section>
  );
}

function EventContextStrip({
  event,
  missionReport,
}: {
  event: SourcingEventDetail;
  missionReport: SourceAgentMissionReport;
}) {
  const contextItems = [
    { label: 'Account', value: event.accountName },
    { label: 'Archetype', value: event.archetype },
    { label: 'Rigor', value: event.rigor },
    { label: 'Owner', value: event.owner },
    { label: 'Current stage', value: event.currentStageLabel },
    { label: 'Value at stake', value: formatUsd(event.valueAtStakeUsd) },
    { label: 'Mission load', value: `${missionReport.missionCount} missions` },
    { label: 'Top action', value: missionReport.recommendedNextAction },
  ];

  return (
    <div style={CONTEXT_STRIP} aria-label="Source event context">
      {contextItems.map((item) => (
        <div key={item.label} style={CONTEXT_TILE}>
          <div
            style={{
              ...TEXT.small,
              color: EXPERIENCE_COLORS.textSecondary,
              textTransform: 'uppercase',
              fontFamily: FONTS.mono,
              letterSpacing: '0.08em',
            }}
          >
            {item.label}
          </div>
          <div style={{ fontSize: '13px', fontWeight: 800, color: EXPERIENCE_COLORS.textPrimary }}>
            {item.value}
          </div>
        </div>
      ))}
    </div>
  );
}

function buildEventCanvasMissionReport(event: SourcingEventDetail): SourceAgentMissionReport {
  const contextBundle = buildSourceAgentContextBundle({
    tenant: {
      tenantId: 'source-event-canvas-shell',
      tenantName: 'Source Event Canvas Shell',
    },
    user: {
      id: 'source-event-canvas-shell',
    },
    userRole: 'sourcingLead',
    persona: 'sourcingLead',
    route: `/source/events/${event.id}`,
    surface: 'eventCanvas',
    userPrompt: 'Show deterministic Source event canvas missions.',
    eventId: event.id,
    stageKey: event.currentStageKey,
  });
  const contextValidationReport = getSourceContextValidationReadableReport({
    generatedAt: EVENT_CANVAS_MISSION_GENERATED_AT,
  });
  const workflowValidationReport = getSourceWorkflowValidationReadableReport({
    generatedAt: EVENT_CANVAS_MISSION_GENERATED_AT,
  });
  const multiAgentBriefing = buildSourceMultiAgentBriefing({
    contextBundle,
    contextValidationReport,
    workflowValidationReport,
    userRole: 'sourcingLead',
    mode: 'event',
    generatedAt: EVENT_CANVAS_MISSION_GENERATED_AT,
  });

  return createSourceAgentMissionReport({
    contextBundle,
    contextValidationReport,
    workflowValidationReport,
    multiAgentBriefing,
    userRole: 'sourcingLead',
    mode: 'event',
    generatedAt: EVENT_CANVAS_MISSION_GENERATED_AT,
  });
}

function getEventCanvasMissionPreviewMissions(report: SourceAgentMissionReport): SourceAgentMission[] {
  const selected: SourceAgentMission[] = [];
  const seenAgents = new Set<string>();

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
