import type { CSSProperties, ReactNode } from 'react';
import { SHELL } from '@/lib/shell/shell-tokens';
import type { SourcingEventDetail } from '@/lib/source/types';
import { buildSourceDataReadinessProjectionFromAdminSetup, buildSourceRfpReadiness } from '@/lib/source';
import { SourceDataReadinessPanel } from './SourceDataReadinessPanel';
import type { SourceAgentMission, SourceAgentMissionReport } from '@/lib/source';
import { SourceRfpReadinessPanel } from './SourceRfpReadinessPanel';

type ScopeWorkspaceProps = {
  event: SourcingEventDetail;
  missionReport: SourceAgentMissionReport;
  missionPreviewMissions: SourceAgentMission[];
};

const READY_STATE_THRESHOLD = 4;
const IN_SCOPE_DEFAULT = [
  'Application and data modernization services',
  'Analytics workload operations',
  'Vendor performance expectations for managed services',
  'Transition and baseline support scope',
];
const OUT_SCOPE_DEFAULT = [
  'ERP or core infra platform replacement',
  'Product engineering staffing selection',
  'Enterprise security architecture redesign',
];

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

const sourceInsetCard = {
  background: SHELL.PAPER_SOFT,
  border: '1px solid ' + SHELL.CARD_LINE_SOFT,
  borderRadius: 8,
  padding: '12px 14px',
  display: 'flex',
  flexDirection: 'column' as const,
  gap: 10,
};

export function SourceScopeStageWorkspace({
  event,
  missionReport,
  missionPreviewMissions,
}: ScopeWorkspaceProps) {
  const readyStatus = buildScopeReadiness(event);
  const artifactStatuses = buildScopeArtifacts(event);
  const rfpReadiness = buildSourceRfpReadiness({ event: buildRfpReadinessInputEvent(event) });
  const dataReadinessProjection = buildSourceDataReadinessProjectionFromAdminSetup({ eventId: event.id });
  const dataReadinessItems = dataReadinessProjection.items.length > 0
    ? dataReadinessProjection.items
    : event.dataReadiness;
  const dataReadinessSummary = dataReadinessProjection.items.length > 0
    ? dataReadinessProjection.summary
    : undefined;

  return (
    <section style={SECTION} aria-label="Scope stage workspace">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, flexWrap: 'wrap' }}>
        <div>
          <div style={{ ...sourceSectionLabel, color: SHELL.INK_SOFT }}>Current stage workspace</div>
          <h3 style={{ margin: 0, fontSize: 28, color: SHELL.INK }}>
            Scope pricing readiness
          </h3>
          <p style={{ margin: '8px 0 0', ...sourceMuted, color: SHELL.INK_MUTED }}>
            Answer: {readyStatus.state}.
          </p>
        </div>
        <div style={READY_PANEL}>
          <div style={READINESS_BAND}>{readyStatus.state}</div>
          <div style={{ fontFamily: SHELL.SANS, fontSize: 12, lineHeight: 1.4, color: SHELL.INK_MUTED, fontWeight: 700 }}>
            score {readyStatus.score}/10
          </div>
          <div style={{ fontFamily: SHELL.SANS, fontSize: 12, lineHeight: 1.4, color: SHELL.INK_MUTED }}>
            {readyStatus.reason}
          </div>
        </div>
      </div>

      <div style={GRID_TWO_COL}>
        <WorkspaceCard title="Stage goal" tone="teal">
          <div style={{ color: SHELL.INK, fontWeight: 700 }}>{getScopeStageSummary(event)}</div>
          <div style={sourceMuted}>Goal: make scope and baseline clear enough for pricing teams to submit comparable response packages.</div>
        </WorkspaceCard>
        <WorkspaceCard title="Stage gate signal" tone="blue">
          <div style={{ fontWeight: 800, color: SHELL.INK }}>{readyStatus.canMoveText}</div>
          <div style={sourceMuted}>{readyStatus.gateImpact}</div>
        </WorkspaceCard>
      </div>

      <div style={GRID_TWO_COL}>
        <ScopeDefinitionCard
          title="In-scope and out-of-scope"
          inScope={getInScopeItems(event)}
          outOfScope={getOutOfScopeItems(event)}
          assumptions={event.problemStatement.split('.').filter(Boolean).slice(0, 2)}
          ambiguities={getAmbiguities(event)}
        />
        <MissionSummaryCard missionPreview={missionPreviewMissions[0]} />
      </div>

      <div style={GRID_TWO_COL}>
        <WorkspaceCard title="Required baseline" tone="teal">
          <SourceDataReadinessPanel items={dataReadinessItems} progressSummary={dataReadinessSummary} />
        </WorkspaceCard>
        <WorkspaceCard title="Pricing-impact baseline (seeded view)" tone="amber">
          <ListBlock
            items={getRequiredCategories(event).map((item) => `${item.category} — ${item.stateDisplay}`)}
            tone="neutral"
          />
          <ListBlock
            items={readyStatus.missingInputs.map((item) => `${item.label} · ${item.impact}`)}
            tone="risk"
            />
          <div style={{ ...sourceMuted, color: SHELL.INK_MUTED, marginTop: 8 }}>
            Loaded and Available remain distinct from Usable Evidence.
          </div>
        </WorkspaceCard>
      </div>

      <div style={GRID_TWO_COL}>
        <WorkspaceCard title="Artifact placeholders" tone="blue">
          <div style={{ display: 'grid', gap: 8 }}>
            {artifactStatuses.map((artifact) => (
              <div key={artifact.title} style={ARTIFACT_ROW}>
                <div style={{ fontWeight: 800, color: SHELL.INK }}>{artifact.title}</div>
                <div style={{ fontFamily: SHELL.SANS, fontSize: 12, lineHeight: 1.4, color: SHELL.INK_MUTED }}>{artifact.status}</div>
              </div>
            ))}
          </div>
          <div style={{ ...sourceMuted, color: SHELL.INK_MUTED, marginTop: 10 }}>
            Placeholder state only. No artifact creation, drawer, or approval behavior in this slice.
          </div>
        </WorkspaceCard>
        <WorkspaceCard title="Sentinel guidance" tone="teal">
          <div style={{ color: SHELL.INK, fontWeight: 700 }}>{missionReport.recommendedNextAction}</div>
          <p style={{ ...sourceMuted, color: SHELL.INK_MUTED, margin: '6px 0 0' }}>
            Context used:{' '}
            {JSON.stringify(missionReport.contextUsedSummary, null, 1) ??
              'seeded event context and deterministic validation summary.'}
          </p>
          <ThreeChoiceStrip />
          <div style={{ ...sourceMuted, color: SHELL.INK_MUTED, marginTop: 8 }}>
            Custom action: add evidence owner + date + impact for any waived baseline category.
          </div>
        </WorkspaceCard>
        <SourceRfpReadinessPanel readiness={rfpReadiness} />
      </div>
    </section>
  );
}

function WorkspaceCard({
  title,
  children,
  tone,
}: {
  title: string;
  children: ReactNode;
  tone: 'teal' | 'blue' | 'amber' | 'neutral';
}) {
  return (
    <div style={CARD}>
      <div style={sectionToneLabel(tone)}>{title}</div>
      <div>{children}</div>
    </div>
  );
}

function ListBlock({ items, tone }: { items: string[]; tone: 'neutral' | 'risk' }) {
  return (
    <ul style={{ margin: 0, paddingLeft: 18, color: tone === 'risk' ? SHELL.INK : SHELL.INK_MUTED }}>
      {items.map((item) => (
        <li key={item} style={{ marginBottom: 8 }}>
          {item}
        </li>
      ))}
      {items.length === 0 ? <li>Complete baseline visibility is seeded for the selected event.</li> : null}
    </ul>
  );
}

function ScopeDefinitionCard({
  title,
  inScope,
  outOfScope,
  assumptions,
  ambiguities,
}: {
  title: string;
  inScope: string[];
  outOfScope: string[];
  assumptions: string[];
  ambiguities: string[];
}) {
  return (
    <WorkspaceCard title={title} tone="blue">
      <div style={{ display: 'grid', gap: 10 }}>
        <div>
          <div style={BULLET_TITLE}>In-scope</div>
          {inScope.length > 0 ? (
            <ul style={BULLET_LIST}>
              {inScope.map((item) => (
                <li key={`in-${item}`}>{item}</li>
              ))}
            </ul>
          ) : (
            <div style={sourceMuted}>No explicit in-scope rows were recorded yet.</div>
          )}
        </div>
        <div>
          <div style={BULLET_TITLE}>Out-of-scope</div>
          {outOfScope.length > 0 ? (
            <ul style={BULLET_LIST}>
              {outOfScope.map((item) => (
                <li key={`out-${item}`}>{item}</li>
              ))}
            </ul>
          ) : (
            <div style={sourceMuted}>No explicit out-of-scope rows were recorded yet.</div>
          )}
        </div>
        <div>
          <div style={BULLET_TITLE}>Assumptions</div>
          <ul style={BULLET_LIST}>
            {assumptions.map((item) => (
              <li key={`assump-${item}`}>{item}</li>
            ))}
          </ul>
        </div>
        <div>
          <div style={BULLET_TITLE}>Ambiguities</div>
          <ul style={BULLET_LIST}>
            {ambiguities.map((item) => (
              <li key={`amb-${item}`}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
    </WorkspaceCard>
  );
}

function MissionSummaryCard({ missionPreview }: { missionPreview: SourceAgentMission | undefined }) {
  if (!missionPreview) {
    return (
      <WorkspaceCard title="Top mission signal" tone="amber">
        <div style={sourceMuted}>No top mission is available for this seeded event.</div>
      </WorkspaceCard>
    );
  }

  return (
    <WorkspaceCard title="Top mission signal" tone="blue">
      <div style={{ fontWeight: 800, color: SHELL.INK }}>
        {missionPreview.title}
      </div>
      <div style={{ fontFamily: SHELL.SANS, fontSize: 12, lineHeight: 1.4, color: SHELL.INK_MUTED }}>{missionPreview.agentName}</div>
      <p style={{ margin: 0, ...sourceMuted, color: SHELL.INK_MUTED }}>
        {missionPreview.recommendedAction}
      </p>
    </WorkspaceCard>
  );
}

function getScopeStageSummary(event: SourcingEventDetail): string {
  const scopedStageSummary = event.stages?.find((stage) => stage.key === 'scope')?.summary;
  return scopedStageSummary ?? event.nextDecision;
}

function buildRfpReadinessInputEvent(event: SourcingEventDetail): Parameters<typeof buildSourceRfpReadiness>[0]['event'] {
  return {
    id: event.id,
    name: event.name,
    currentStageKey: event.currentStageKey,
    stages: event.stages,
    artifacts: event.artifacts,
    dataReadiness: event.dataReadiness,
  };
}

function ThreeChoiceStrip() {
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
      <button type="button" style={CHOICE_PILL}>
        Request missing workload baseline
      </button>
      <button type="button" style={CHOICE_PILL}>
        Confirm scope split with PMO
      </button>
      <button type="button" style={CHOICE_PILL}>
        Add stewardship waiver
      </button>
    </div>
  );
}

function buildScopeReadiness(event: SourcingEventDetail) {
  const required = getRequiredCategories(event);
  const missing = required.filter((item) => item.severity === 'missing' || item.state === 'missing');
  const lowConfidence = required.filter((item) => item.severity === 'low_context');

  const score = Math.max(
    0,
    Math.min(
      READY_STATE_THRESHOLD,
      READY_STATE_THRESHOLD - missing.length * 2 - lowConfidence.length,
    ),
  );
  const readinessLabel =
    score >= READY_STATE_THRESHOLD
      ? 'Ready'
      : score >= 2 && missing.length > 0
        ? 'Blocked'
        : score >= 2
          ? 'Partially Ready'
          : 'Low Context';

  const canMoveText = missing.length === 0
    ? lowConfidence.length > 0
      ? 'Move to Sourcing Strategy: defer'
      : score >= READY_STATE_THRESHOLD
        ? 'Move to Sourcing Strategy: yes'
        : 'Move to Sourcing Strategy: defer'
    : 'Move to Sourcing Strategy: no';
  const gateImpact = missing.length === 0
    ? 'Required scope baselines are not yet fully usable evidence.'
    : `${missing.length} required baseline input(s) block RFP-ready pricing decisions.`;

  return {
    score: score + 2,
    state: readinessLabel,
    reason: required.length > 0 ? 'Deterministic scope readiness from seeded event data.' : 'Scope readiness is read-only and seeded.',
    missingInputs: required
      .filter((item) => item.severity === 'missing')
      .map((item) => ({
        label: item.category,
        impact: item.stateImpact,
      })),
    canMoveText,
    gateImpact,
  };
}

function getRequiredCategories(event: SourcingEventDetail): Array<{
  category: string;
  severity: 'missing' | 'low_context' | 'ok';
  state: 'missing' | 'partial' | 'ok';
  stateDisplay: string;
  stateImpact: string;
}> {
  const required = event.dataReadiness.filter((item) => item.requirementLevel === 'required');
  return required.map((item) => {
    const isUsable = item.evidenceUsability === 'usable';
    const isMissing = item.evidenceUsability === 'not_available' || item.readinessState === 'Requested';

    return {
      category: item.category,
      severity: isMissing ? 'missing' : item.confidence === 'low' ? 'low_context' : 'ok',
      state: isUsable ? 'ok' : 'partial',
      stateDisplay: item.readinessState,
      stateImpact: item.workflowImpact,
    };
  });
}

function getInScopeItems(event: SourcingEventDetail): string[] {
  const inScopeField = event.scorecard?.criteria
    .filter((criterion) => criterion.required)
    .map((criterion) => criterion.label);
  if (inScopeField.length > 0) {
    return inScopeField;
  }

  return [
    ...IN_SCOPE_DEFAULT,
    ...event.dataReadiness.map((item) => item.workflowImpact).slice(0, 1),
  ];
}

function getOutOfScopeItems(event: SourcingEventDetail): string[] {
  return event.problemStatement ? [OUT_SCOPE_DEFAULT[0], OUT_SCOPE_DEFAULT[1]] : OUT_SCOPE_DEFAULT;
}

function getAmbiguities(event: SourcingEventDetail): string[] {
  if (event.blocker) {
    return [event.blocker];
  }

  return ['Open assumption on transition responsibility by vendor category.', 'Rigor of baseline data and parsing window remain provisional.'];
}

function buildScopeArtifacts(event: SourcingEventDetail) {
  const map = {
    'Scope Document': 'read-only placeholder',
    'Minimum Data Request': 'read-only placeholder',
    'RFP Outline': 'read-only placeholder',
    'Retained/Vendor Responsibility Matrix': 'read-only placeholder',
  };

  const existing = Object.fromEntries(event.artifacts.map((artifact) => [artifact.title, `${artifact.status}`]));
  return Object.entries(map).map(([title, fallback]) => ({
    title,
    status: existing[title] ?? fallback,
  }));
}

const SECTION: CSSProperties = {
  display: 'grid',
  gap: 12,
  color: SHELL.INK,
};

const READY_PANEL: CSSProperties = {
  ...sourceInsetCard,
  minWidth: 210,
  borderColor: SHELL.CARD_LINE_SOFT,
  borderRadius: 12,
  padding: 12,
  background: SHELL.PAPER_SOFT,
};

const READINESS_BAND: CSSProperties = {
  borderRadius: 999,
  display: 'inline-block',
  border: '1px solid ' + SHELL.INK_MID,
  color: SHELL.INK_MID,
  background: SHELL.BLUE_BG,
  padding: '4px 10px',
  fontWeight: 800,
  fontSize: '12px',
  marginBottom: 6,
};

const GRID_TWO_COL: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
  gap: 10,
  alignItems: 'start',
};

const CARD: CSSProperties = {
  ...sourceSectionLabel,
  border: '1px solid ' + SHELL.CARD_LINE,
  borderRadius: 12,
  background: SHELL.PAPER_SOFT,
  padding: 12,
  display: 'grid',
  gap: 8,
};

const CHOICE_PILL: CSSProperties = {
  fontFamily: SHELL.SANS,
  fontSize: 12,
  lineHeight: 1.4,
  border: '1px solid ' + SHELL.CARD_LINE,
  background: SHELL.CARD_WHITE,
  color: SHELL.INK,
  borderRadius: 999,
  padding: '7px 10px',
  fontWeight: 700,
};

const BULLET_TITLE: CSSProperties = {
  ...sourceSectionLabel,
  color: SHELL.INK_SOFT,
};

const BULLET_LIST: CSSProperties = {
  margin: 0,
  paddingLeft: 16,
  color: SHELL.INK_MUTED,
  display: 'grid',
  gap: 5,
};

const ARTIFACT_ROW: CSSProperties = {
  display: 'grid',
  gap: 4,
  border: '1px solid ' + SHELL.CARD_LINE,
  background: SHELL.CARD_WHITE,
  padding: '8px 10px',
  borderRadius: 10,
};

function sectionToneLabel(tone: 'teal' | 'blue' | 'amber' | 'neutral') {
  const color = tone === 'teal'
    ? SHELL.INK_SOFT
    : tone === 'blue'
      ? SHELL.INK_MID
      : tone === 'amber'
        ? SHELL.PEACH_TEXT
        : SHELL.INK_MUTED;
  return {
    ...sourceSectionLabel,
    color,
  };
}
