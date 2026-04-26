import { SOURCE_ARTIFACT_STATUS_LABELS } from '@/lib/source/constants';
import { getActiveStage, getStageStateLabel } from '@/lib/source/lifecycle';
import type { SourceAgentMission, SourceAgentMissionReport } from '@/lib/source';
import type { SourcingEventDetail } from '@/lib/source/types';
import type { CSSProperties, ReactNode } from 'react';
import { EXPERIENCE_COLORS, FONTS, TEXT } from '@/lib/design-system';
import { sourceCard, sourceMuted, sourceSectionLabel } from './foundationStyles';
import { SourceDataReadinessPanel } from './SourceDataReadinessPanel';

export function SourceActiveStageWorkspace({
  event,
  missionReport,
  missionPreviewMissions,
}: {
  event: SourcingEventDetail;
  missionReport: SourceAgentMissionReport;
  missionPreviewMissions: SourceAgentMission[];
}) {
  const activeStage = getActiveStage(event.stages);
  const requiredInputs = getRequiredInputsForStage(event);
  const missingInputs = getMissingInputsForStage(event);
  const artifactPlaceholders = event.artifacts.slice(0, 3);

  return (
    <section
      style={{
        ...sourceCard,
        background: EXPERIENCE_COLORS.surface,
        border: `1px solid ${EXPERIENCE_COLORS.borderSoft}`,
      }}
    >
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <div style={{ ...sourceSectionLabel, color: EXPERIENCE_COLORS.accentTeal }}>Current-stage workspace</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: EXPERIENCE_COLORS.textPrimary }}>
            {activeStage.label}
          </div>
        </div>
        <div
          style={{
            alignSelf: 'start',
            border: `1px solid ${EXPERIENCE_COLORS.borderSoft}`,
            borderRadius: 999,
            background: EXPERIENCE_COLORS.surfaceWarm,
            padding: '7px 10px',
            fontFamily: FONTS.mono,
            fontSize: '10px',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: activeStage.status === 'blocked'
              ? EXPERIENCE_COLORS.riskRed
              : EXPERIENCE_COLORS.accentBlue,
          }}
        >
          {getStageStateLabel(activeStage.status)}
        </div>
      </div>
      <p style={{ ...sourceMuted, color: EXPERIENCE_COLORS.textSecondary, margin: 0 }}>{activeStage.summary}</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: 12 }}>
        <WorkspaceBlock title="Stage goal">
          Finalize the sourcing scope, baseline inputs, and gate evidence before strategy work expands.
        </WorkspaceBlock>
        <WorkspaceBlock title="Next decision">{event.nextDecision}</WorkspaceBlock>
        <WorkspaceBlock title="Nexus recommendation">{missionReport.recommendedNextAction}</WorkspaceBlock>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 250px), 1fr))', gap: 12 }}>
        <ListBlock title="Required inputs" items={requiredInputs} />
        <ListBlock title="Missing or weak inputs" items={missingInputs} tone="risk" />
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 230px), 1fr))',
          gap: 12,
          alignItems: 'start',
        }}
      >
        <div style={INSET}>
          <div style={{ ...sourceSectionLabel, color: EXPERIENCE_COLORS.accentTeal }}>Agent mission preview</div>
          <div style={{ display: 'grid', gap: 8 }}>
            {missionPreviewMissions.map((mission) => (
              <div key={mission.missionId} style={MISSION_ROW}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                  <span style={{ ...TEXT.small, color: EXPERIENCE_COLORS.accentTeal, fontWeight: 800 }}>
                    {agentLabel(mission.agentName)}
                  </span>
                  <span style={{ ...TEXT.small, color: priorityColor(mission.priority), fontWeight: 800 }}>
                    {mission.priority}
                  </span>
                </div>
                <div style={{ fontWeight: 800, color: EXPERIENCE_COLORS.textPrimary }}>{mission.title}</div>
                <div style={{ ...sourceMuted, color: EXPERIENCE_COLORS.textSecondary, fontSize: '12px' }}>
                  {mission.recommendedAction}
                </div>
              </div>
            ))}
          </div>
        </div>

        <SourceDataReadinessPanel items={event.dataReadiness} />
      </div>

      <div style={INSET}>
        <div style={{ ...sourceSectionLabel, color: EXPERIENCE_COLORS.accentTeal }}>Artifacts / reviews placeholder</div>
        <div style={{ display: 'grid', gap: 8 }}>
          {artifactPlaceholders.map((artifact) => (
            <div key={artifact.id} style={ARTIFACT_ROW}>
              <div style={{ fontWeight: 800, color: EXPERIENCE_COLORS.textPrimary }}>{artifact.title}</div>
              <div style={{ ...TEXT.small, color: EXPERIENCE_COLORS.textSecondary }}>
                {SOURCE_ARTIFACT_STATUS_LABELS[artifact.status]} / sources {artifact.sourceCount} / updated {artifact.updatedAt}
              </div>
            </div>
          ))}
        </div>
        <div style={{ ...sourceMuted, color: EXPERIENCE_COLORS.textSecondary, fontSize: '12px' }}>
          Read-only shell state only. Drawer behavior, versioning, approvals, generation, and re-upload remain deferred.
        </div>
      </div>
    </section>
  );
}

const INSET: CSSProperties = {
  display: 'grid',
  gap: 10,
  border: `1px solid ${EXPERIENCE_COLORS.borderSoft}`,
  borderRadius: 12,
  background: EXPERIENCE_COLORS.surfaceWarm,
  padding: 13,
};

const MISSION_ROW: CSSProperties = {
  display: 'grid',
  gap: 5,
  border: `1px solid ${EXPERIENCE_COLORS.borderSoft}`,
  borderRadius: 10,
  background: EXPERIENCE_COLORS.surface,
  padding: '9px 10px',
};

const ARTIFACT_ROW: CSSProperties = {
  display: 'grid',
  gap: 4,
  border: `1px solid ${EXPERIENCE_COLORS.borderSoft}`,
  borderRadius: 10,
  background: EXPERIENCE_COLORS.surface,
  padding: '9px 10px',
};

function WorkspaceBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div style={INSET}>
      <div style={{ ...sourceSectionLabel, color: EXPERIENCE_COLORS.accentTeal }}>{title}</div>
      <div style={{ color: EXPERIENCE_COLORS.textPrimary, fontWeight: 700 }}>{children}</div>
    </div>
  );
}

function ListBlock({
  title,
  items,
  tone = 'default',
}: {
  title: string;
  items: string[];
  tone?: 'default' | 'risk';
}) {
  return (
    <div style={INSET}>
      <div style={{ ...sourceSectionLabel, color: tone === 'risk' ? EXPERIENCE_COLORS.riskAmber : EXPERIENCE_COLORS.accentTeal }}>
        {title}
      </div>
      <ul style={{ margin: 0, paddingLeft: 18, color: EXPERIENCE_COLORS.textSecondary }}>
        {items.map((item) => (
          <li key={item} style={{ marginBottom: 5 }}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function getRequiredInputsForStage(event: SourcingEventDetail): string[] {
  if (event.currentStageKey === 'scope') {
    return [
      'Application inventory',
      'Analytics workload baseline',
      'Stakeholder and owner confirmation',
      'Constraints and current delivery baseline',
    ];
  }

  const activeStage = getActiveStage(event.stages);
  return activeStage.gate.requiredArtifacts;
}

function getMissingInputsForStage(event: SourcingEventDetail): string[] {
  if (event.blocker) return [event.blocker];
  return ['No blocking input gap recorded in seeded event data.'];
}

function agentLabel(agentName: SourceAgentMission['agentName']): string {
  if (agentName === 'nexus') return 'Nexus';
  if (agentName === 'sentinel') return 'Sentinel';
  if (agentName === 'atlas') return 'Atlas';
  return 'Steward';
}

function priorityColor(priority: SourceAgentMission['priority']): string {
  if (priority === 'critical') return EXPERIENCE_COLORS.riskRed;
  if (priority === 'high') return EXPERIENCE_COLORS.riskAmber;
  if (priority === 'medium') return EXPERIENCE_COLORS.accentBlue;
  return EXPERIENCE_COLORS.textSecondary;
}
