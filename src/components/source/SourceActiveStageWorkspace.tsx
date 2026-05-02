import { SOURCE_ARTIFACT_STATUS_LABELS } from '@/lib/source/constants';
import { getActiveStage, getStageStateLabel } from '@/lib/source/lifecycle';
import {
  buildSourceDataReadinessProjectionFromAdminSetup,
  buildSourceBafoNegotiationPlan,
  buildPricingComparisonViewModel,
  buildSourceVendorSelectionReadiness,
  buildSourceVendorResponseCompleteness,
  type SourceAgentMission,
  type SourceAgentMissionReport,
} from '@/lib/source';
import type { SourcingEventDetail } from '@/lib/source/types';
import type { CSSProperties, ReactNode } from 'react';
import { SHELL } from '@/lib/shell/shell-tokens';
import { SourceDataReadinessPanel } from './SourceDataReadinessPanel';
import { SourceScopeStageWorkspace } from './SourceScopeStageWorkspace';
import { SourceBafoNegotiationPanel } from './SourceBafoNegotiationPanel';
import { SourceVendorSelectionReadinessPanel } from './SourceVendorSelectionReadinessPanel';
import { SourceVendorResponseCompletenessPanel } from './SourceVendorResponseCompletenessPanel';
import { SourcePricingComparisonPanel } from './SourcePricingComparisonPanel';

const sourceCard = {
  background: SHELL.CARD_WHITE,
  border: '1px solid ' + SHELL.CARD_LINE,
  borderRadius: 10,
  padding: '16px 18px',
  display: 'flex',
  flexDirection: 'column' as const,
  gap: 12,
};

const sourceSectionLabel = {
  fontFamily: SHELL.MONO,
  fontSize: 9,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.14em',
  color: SHELL.INK_MUTED,
  marginBottom: 0,
};

const sourceMuted = {
  fontFamily: SHELL.SANS,
  fontSize: 13,
  color: SHELL.INK_MUTED,
  lineHeight: 1.5,
};

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
  const dataReadinessProjection = buildSourceDataReadinessProjectionFromAdminSetup({ eventId: event.id });
  const dataReadinessItems = dataReadinessProjection.items.length > 0
    ? dataReadinessProjection.items
    : event.dataReadiness;
  const dataReadinessSummary = dataReadinessProjection.items.length > 0
    ? dataReadinessProjection.summary
    : undefined;
  const vendorResponseReadiness = buildSourceVendorResponseCompleteness({ event });

  if (activeStage.key === 'scope') {
    return (
      <SourceScopeStageWorkspace
        event={event}
        missionReport={missionReport}
        missionPreviewMissions={missionPreviewMissions}
      />
    );
  }

  if (activeStage.key === 'responses' || activeStage.key === 'vendor_responses') {
    return (
      <section style={{ ...sourceCard, background: SHELL.CARD_WHITE, border: '1px solid ' + SHELL.CARD_LINE }}>
        <div style={{ marginBottom: 10 }}>
          <div style={{ ...sourceSectionLabel, color: SHELL.INK_SOFT }}>Current-stage workspace</div>
          <h4 style={{ margin: '4px 0 0', color: SHELL.INK }}>
            {event.currentStageLabel}
          </h4>
          <div style={{ ...sourceMuted, color: SHELL.INK_MUTED }}>
            {activeStage.summary}
          </div>
          <div style={{ fontFamily: SHELL.SANS, fontSize: 12, lineHeight: 1.4, marginTop: 6, color: SHELL.PEACH_TEXT }}>
            Gate status: {getStageStateLabel(activeStage.status)}
          </div>
        </div>
        <SourceVendorResponseCompletenessPanel readiness={vendorResponseReadiness} />
      </section>
    );
  }

  if (activeStage.key === 'pricing') {
    const pricingView = buildPricingComparisonViewModel({
      eventId: event.id,
      eventName: event.name,
      vendors: [
        { vendorId: 'vendor-a', vendorName: 'Northbridge Services', totalQuotedCost: 1_000_000, currency: 'USD' },
        { vendorId: 'vendor-b', vendorName: 'Ardent Managed Solutions', totalQuotedCost: 925_000, currency: 'USD' },
        { vendorId: 'vendor-c', vendorName: 'Kestrel Technology Partners', totalQuotedCost: 1_080_000, currency: 'USD' },
      ],
    });

    return (
      <section style={{ ...sourceCard, background: SHELL.CARD_WHITE, border: '1px solid ' + SHELL.CARD_LINE }}>
        <div style={{ marginBottom: 10 }}>
          <div style={{ ...sourceSectionLabel, color: SHELL.INK_SOFT }}>Current-stage workspace</div>
          <h4 style={{ margin: '4px 0 0', color: SHELL.INK }}>{event.currentStageLabel}</h4>
          <div style={{ ...sourceMuted, color: SHELL.INK_MUTED }}>{activeStage.summary}</div>
          <div style={{ fontFamily: SHELL.SANS, fontSize: 12, lineHeight: 1.4, marginTop: 6, color: SHELL.PEACH_TEXT }}>
            Gate status: {getStageStateLabel(activeStage.status)}
          </div>
        </div>
        <SourcePricingComparisonPanel viewModel={pricingView} />
      </section>
    );
  }

  if (activeStage.key === 'bafo' || activeStage.key === 'orals_bafo') {
    const bafoPlan = buildSourceBafoNegotiationPlan({
      event: {
        ...event,
        currentStageKey: 'bafo',
      },
    });

    return (
      <section style={{ ...sourceCard, background: SHELL.CARD_WHITE, border: '1px solid ' + SHELL.CARD_LINE }}>
        <div style={{ marginBottom: 10 }}>
          <div style={{ ...sourceSectionLabel, color: SHELL.INK_SOFT }}>Current-stage workspace</div>
          <h4 style={{ margin: '4px 0 0', color: SHELL.INK }}>{event.currentStageLabel}</h4>
          <div style={{ ...sourceMuted, color: SHELL.INK_MUTED }}>
            {activeStage.summary}
          </div>
          <div style={{ fontFamily: SHELL.SANS, fontSize: 12, lineHeight: 1.4, marginTop: 6, color: SHELL.PEACH_TEXT }}>
            Gate status: {getStageStateLabel(activeStage.status)}
          </div>
        </div>
        <SourceBafoNegotiationPanel plan={bafoPlan} />
      </section>
    );
  }

  if (activeStage.key === 'executive_decision' || activeStage.key === 'selection') {
    const selectionReadiness = buildSourceVendorSelectionReadiness({
      event: {
        ...event,
        currentStageKey: activeStage.key,
      },
    });

    return (
      <section style={{ ...sourceCard, background: SHELL.CARD_WHITE, border: '1px solid ' + SHELL.CARD_LINE }}>
        <div style={{ marginBottom: 10 }}>
          <div style={{ ...sourceSectionLabel, color: SHELL.INK_SOFT }}>Current-stage workspace</div>
          <h4 style={{ margin: '4px 0 0', color: SHELL.INK }}>{event.currentStageLabel}</h4>
          <div style={{ ...sourceMuted, color: SHELL.INK_MUTED }}>
            {activeStage.summary}
          </div>
          <div style={{ fontFamily: SHELL.SANS, fontSize: 12, lineHeight: 1.4, marginTop: 6, color: SHELL.PEACH_TEXT }}>
            Gate status: {getStageStateLabel(activeStage.status)}
          </div>
        </div>
        <SourceVendorSelectionReadinessPanel readiness={selectionReadiness} />
      </section>
    );
  }

  return (
    <section
      style={{
        ...sourceCard,
        background: SHELL.CARD_WHITE,
        border: '1px solid ' + SHELL.CARD_LINE,
      }}
    >
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <div style={{ ...sourceSectionLabel, color: SHELL.INK_SOFT }}>Current-stage workspace</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: SHELL.INK }}>
            {activeStage.label}
          </div>
        </div>
        <div
          style={{
            alignSelf: 'start',
            border: '1px solid ' + SHELL.CARD_LINE,
            borderRadius: 999,
            background: SHELL.PAPER_SOFT,
            padding: '7px 10px',
            fontFamily: SHELL.MONO,
            fontSize: '10px',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: activeStage.status === 'blocked'
              ? SHELL.RUST_TEXT
              : SHELL.INK_MID,
          }}
        >
          {getStageStateLabel(activeStage.status)}
        </div>
      </div>
      <p style={{ ...sourceMuted, color: SHELL.INK_MUTED, margin: 0 }}>{activeStage.summary}</p>

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
          <div style={{ ...sourceSectionLabel, color: SHELL.INK_SOFT }}>Agent mission preview</div>
          <div style={{ display: 'grid', gap: 8 }}>
            {missionPreviewMissions.map((mission) => (
              <div key={mission.missionId} style={MISSION_ROW}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontFamily: SHELL.SANS, fontSize: 12, lineHeight: 1.4, color: SHELL.INK_MID, fontWeight: 800 }}>
                    {agentLabel(mission.agentName)}
                  </span>
                  <span style={{ fontFamily: SHELL.SANS, fontSize: 12, lineHeight: 1.4, color: priorityColor(mission.priority), fontWeight: 800 }}>
                    {mission.priority}
                  </span>
                </div>
                <div style={{ fontWeight: 800, color: SHELL.INK }}>{mission.title}</div>
                <div style={{ ...sourceMuted, color: SHELL.INK_MUTED, fontSize: '12px' }}>
                  {mission.recommendedAction}
                </div>
              </div>
            ))}
          </div>
        </div>

        <SourceDataReadinessPanel items={dataReadinessItems} progressSummary={dataReadinessSummary} />
      </div>

      <div style={INSET}>
        <div style={{ ...sourceSectionLabel, color: SHELL.INK_SOFT }}>Artifacts / reviews placeholder</div>
        <div style={{ display: 'grid', gap: 8 }}>
          {artifactPlaceholders.map((artifact) => (
            <div key={artifact.id} style={ARTIFACT_ROW}>
              <div style={{ fontWeight: 800, color: SHELL.INK }}>{artifact.title}</div>
              <div style={{ fontFamily: SHELL.SANS, fontSize: 12, lineHeight: 1.4, color: SHELL.INK_MUTED }}>
                {SOURCE_ARTIFACT_STATUS_LABELS[artifact.status]} / sources {artifact.sourceCount} / updated {artifact.updatedAt}
              </div>
            </div>
          ))}
        </div>
        <div style={{ ...sourceMuted, color: SHELL.INK_MUTED, fontSize: '12px' }}>
          Read-only shell state only. Drawer behavior, versioning, approvals, generation, and re-upload remain deferred.
        </div>
      </div>
    </section>
  );
}

const INSET: CSSProperties = {
  display: 'grid',
  gap: 10,
  border: '1px solid ' + SHELL.CARD_LINE,
  borderRadius: 12,
  background: SHELL.PAPER_SOFT,
  padding: 13,
};

const MISSION_ROW: CSSProperties = {
  display: 'grid',
  gap: 5,
  border: '1px solid ' + SHELL.CARD_LINE,
  borderRadius: 10,
  background: SHELL.CARD_WHITE,
  padding: '9px 10px',
};

const ARTIFACT_ROW: CSSProperties = {
  display: 'grid',
  gap: 4,
  border: '1px solid ' + SHELL.CARD_LINE,
  borderRadius: 10,
  background: SHELL.CARD_WHITE,
  padding: '9px 10px',
};

function WorkspaceBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div style={INSET}>
      <div style={{ fontFamily: SHELL.MONO, fontSize: 9, textTransform: 'uppercase' as const, letterSpacing: '0.14em', color: SHELL.INK_SOFT, marginBottom: 0 }}>{title}</div>
      <div style={{ color: SHELL.INK, fontWeight: 700 }}>{children}</div>
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
      <div style={{ fontFamily: SHELL.MONO, fontSize: 9, textTransform: 'uppercase' as const, letterSpacing: '0.14em', color: tone === 'risk' ? SHELL.PEACH_TEXT : SHELL.INK_SOFT, marginBottom: 0 }}>
        {title}
      </div>
      <ul style={{ margin: 0, paddingLeft: 18, color: SHELL.INK_MUTED }}>
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
  if (priority === 'critical') return SHELL.RUST_TEXT;
  if (priority === 'high') return SHELL.PEACH_TEXT;
  if (priority === 'medium') return SHELL.INK_MID;
  return SHELL.INK_MUTED;
}
