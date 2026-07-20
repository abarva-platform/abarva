'use client';

import Link from 'next/link';
import { useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { AskAnythingBar } from '@/components/agent/AskAnythingBar';
import { SentinelAgentColumn } from '@/components/source/SentinelAgentColumn';
import { AppShell } from '@/components/shell/AppShell';
import type { AgentAction } from '@/components/shell/AgentColumn';
import {
  buildSourceEventShellView,
  type SourceEventShellView,
  type SourceShellArtifactLike,
  type SourceShellEvidenceBasis,
  type SourceShellFileItem,
  type SourceShellStepGroup,
  type SourceShellWorkspace,
} from '@/lib/source/source-event-shell-v2';
import type { ApprovalsInboxItem } from '@/lib/source/approvals-inbox';
import { SOURCE_STAGE_LABELS } from '@/lib/source/constants';
import type { SourceStageKey, SourcingEventSummary } from '@/lib/source/types';
import { ANALYTICS } from './analytics-tokens';
import { IntelPanel } from './IntelPanel';
import { TaskChecklist } from './TaskChecklist';
import { ValueWaterfall } from './ValueWaterfall';
import { StepInsightPanel } from './insights';
import {
  SAMPLE_SCOPE_STAGE,
  SAMPLE_RFP_STAGE,
  SAMPLE_BAFO_STAGE,
  SAMPLE_SELECTION_STAGE,
  SAMPLE_VALUE_STAGE,
} from './sample-view-model';
import { SAMPLE_STRATEGY_STAGE } from './strategy-sample-view-model';
import type {
  AvaLauncherView,
  StageAnalyticsView,
  StepInsightView,
} from './view-model';

type AvaDock = 'left' | 'right' | 'top' | 'bottom' | 'hidden';

interface SourceAnalyticsCanvasProps {
  event: SourcingEventSummary;
  viewStage: SourceStageKey;
  tenantName: string;
  stageView?: StageAnalyticsView;
  stepInsight?: StepInsightView;
  artifacts?: readonly SourceShellArtifactLike[];
  approvalItems?: readonly ApprovalsInboxItem[];
  /** Legacy prop retained for route compatibility; the duplicate launcher is no longer rendered. */
  avaLauncher?: AvaLauncherView;
}

const MAIN_STYLE: CSSProperties = {
  flex: 1,
  minHeight: 0,
  display: 'flex',
  overflow: 'hidden',
  fontFamily: ANALYTICS.SANS,
  color: ANALYTICS.INK,
  background: ANALYTICS.PAGE_BG,
};

const WORK_PANE_STYLE: CSSProperties = {
  flex: 1,
  minHeight: 0,
  overflowY: 'auto',
};

const CANVAS_STYLE: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '260px minmax(0, 1fr)',
  gap: 28,
  maxWidth: 1510,
  margin: '0 auto',
  padding: '28px 30px 150px',
  alignItems: 'start',
};

const CARD_STYLE: CSSProperties = {
  border: `1px solid ${ANALYTICS.LINE}`,
  borderRadius: 10,
  background: ANALYTICS.CARD,
  boxShadow: ANALYTICS.SHADOW_SM,
};

const BUTTON_STYLE: CSSProperties = {
  border: `1px solid ${ANALYTICS.LINE}`,
  borderRadius: 8,
  background: ANALYTICS.CARD,
  color: ANALYTICS.INK,
  cursor: 'pointer',
  fontFamily: ANALYTICS.SANS,
  fontSize: 12,
  fontWeight: 700,
};

function sampleStageViewFor(stageKey: SourceStageKey): StageAnalyticsView {
  if (stageKey === 'strategy') return SAMPLE_STRATEGY_STAGE;
  if (stageKey === 'rfp') return SAMPLE_RFP_STAGE;
  if (stageKey === 'bafo') return SAMPLE_BAFO_STAGE;
  if (stageKey === 'selection') return SAMPLE_SELECTION_STAGE;
  if (stageKey === 'value') return SAMPLE_VALUE_STAGE;
  return SAMPLE_SCOPE_STAGE;
}

export function SourceAnalyticsCanvas({
  event,
  viewStage,
  tenantName,
  stageView,
  stepInsight,
  artifacts = [],
  approvalItems = [],
}: SourceAnalyticsCanvasProps) {
  const [workspace, setWorkspace] = useState<SourceShellWorkspace>('steps');
  const [avaDock, setAvaDock] = useState<AvaDock>('left');

  const baseStageView = useMemo(
    () => stageView ?? sampleStageViewFor(viewStage),
    [stageView, viewStage],
  );
  const resolvedStageView: StageAnalyticsView = useMemo(
    () => (stepInsight ? { ...baseStageView, stepInsight } : baseStageView),
    [baseStageView, stepInsight],
  );

  const shellView = useMemo(
    () =>
      buildSourceEventShellView({
        event,
        tenantName,
        viewedStageKey: viewStage,
        stageView: resolvedStageView,
        stepInsight,
        artifacts,
        approvalItems,
        activeWorkspace: workspace,
        intelligenceOpen: workspace === 'intelligence',
      }),
    [
      approvalItems,
      artifacts,
      event,
      resolvedStageView,
      stepInsight,
      tenantName,
      viewStage,
      workspace,
    ],
  );

  const stageLabel =
    SOURCE_STAGE_LABELS[viewStage] ?? resolvedStageView.stageName;
  const showSideAva = avaDock === 'left' || avaDock === 'right';
  const showInlineAva = avaDock === 'top' || avaDock === 'bottom';

  const agentColumnStyle: CSSProperties =
    avaDock === 'right'
      ? { order: 2, borderLeft: '1px solid rgba(250,247,241,0.12)' }
      : {};

  const agentQuote =
    shellView.stage.total === 0
      ? `Ask me about ${shellView.stage.label}.`
      : shellView.stage.ready >= shellView.stage.total
        ? `All ${shellView.stage.total} step${shellView.stage.total === 1 ? '' : 's'} on ${shellView.stage.label} are complete.`
        : `${shellView.stage.total - shellView.stage.ready} of ${shellView.stage.total} step${shellView.stage.total === 1 ? '' : 's'} left on ${shellView.stage.label}.`;

  return (
    <AppShell
      surface="source-detail"
      agentName="aVa"
      surfaceContext={{
        sourceEventId: event.id,
        sourceEventCode: event.code,
        viewStage,
        surfaceVariant: 'source_analytics_v2',
      }}
      topBarProps={{
        tenantName,
        showLocked: true,
        context: `${event.code} · ${event.name}`,
      }}
    >
      <main data-testid="source-analytics-canvas" style={MAIN_STYLE}>
        {showSideAva ? (
          <SentinelAgentColumn
            quote={agentQuote}
            agentContext={`${event.code} · ${stageLabel}`}
            actions={agentActions(shellView)}
            surface="source-detail"
            columnStyle={agentColumnStyle}
          />
        ) : null}
        <div style={WORK_PANE_STYLE}>
          <div style={CANVAS_STYLE}>
            <SourceShellRail
              view={shellView}
              workspace={workspace}
              onWorkspaceChange={setWorkspace}
            />
            <div style={{ minWidth: 0 }}>
              {showInlineAva && avaDock === 'top' ? (
                <AvaInlinePanel view={shellView} quote={agentQuote} />
              ) : null}
              <SourceWorkspace
                view={shellView}
                stageView={resolvedStageView}
                eventId={event.id}
                workspace={workspace}
                onWorkspaceChange={setWorkspace}
              />
              {showInlineAva && avaDock === 'bottom' ? (
                <AvaInlinePanel view={shellView} quote={agentQuote} />
              ) : null}
            </div>
          </div>
        </div>
      </main>
      <AvaDockControls dock={avaDock} onDockChange={setAvaDock} />
      {avaDock !== 'hidden' ? (
        <AskAnythingBar
          agent="sentinel"
          scopeLabel={`${event.code} · ${stageLabel}`}
          surface="source-detail"
          placeholder={`Ask aVa about ${stageLabel}...`}
        />
      ) : null}
    </AppShell>
  );
}

function SourceShellRail({
  view,
  workspace,
  onWorkspaceChange,
}: {
  view: SourceEventShellView;
  workspace: SourceShellWorkspace;
  onWorkspaceChange: (workspace: SourceShellWorkspace) => void;
}) {
  return (
    <aside data-testid="source-shell-v2-rail" style={{ minWidth: 0 }}>
      <Link
        href="/source/portfolio"
        style={{
          color: ANALYTICS.MUTED,
          fontSize: 12,
          textDecoration: 'none',
        }}
      >
        ← All Source events
      </Link>
      <div style={{ marginTop: 16, marginBottom: 22 }}>
        <div
          style={{
            fontFamily: ANALYTICS.SERIF,
            fontSize: 20,
            fontWeight: 700,
            letterSpacing: '-0.3px',
            lineHeight: 1.12,
          }}
        >
          {view.event.name}
        </div>
        <div style={{ color: ANALYTICS.MUTED, fontSize: 12, marginTop: 6 }}>
          {view.event.accountName} · {view.event.tenantName}
        </div>
        <div style={{ color: ANALYTICS.MUTED, fontSize: 12, marginTop: 3 }}>
          {view.event.valueAtStakeLabel} · {view.event.statusLabel}
        </div>
      </div>

      <RailLabel>Journey</RailLabel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {view.journey.map((stage) => (
          <Link
            key={stage.key}
            href={`/source/events/${view.event.id}?stage=${stage.key}`}
            style={{
              display: 'grid',
              gridTemplateColumns: '22px 1fr auto',
              gap: 9,
              alignItems: 'center',
              padding: '8px 9px',
              borderRadius: 8,
              border: stage.viewed
                ? `1px solid ${ANALYTICS.LINE}`
                : '1px solid transparent',
              background: stage.viewed ? ANALYTICS.CARD : 'transparent',
              textDecoration: 'none',
            }}
          >
            <span
              style={{
                width: 20,
                height: 20,
                borderRadius: 999,
                display: 'grid',
                placeItems: 'center',
                background:
                  stage.state === 'past'
                    ? ANALYTICS.INK
                    : stage.current
                      ? ANALYTICS.BLUE
                      : ANALYTICS.CARD,
                color:
                  stage.state === 'past' || stage.current
                    ? '#fff'
                    : ANALYTICS.FAINT,
                border:
                  stage.state === 'past' || stage.current
                    ? 'none'
                    : `1px solid ${ANALYTICS.LINE_STRONG}`,
                fontFamily: ANALYTICS.MONO,
                fontSize: 9,
                fontWeight: 800,
              }}
            >
              {stage.state === 'past'
                ? '✓'
                : String(stage.index).padStart(2, '0')}
            </span>
            <span
              style={{
                color:
                  stage.viewed || stage.current || stage.state === 'past'
                    ? ANALYTICS.INK
                    : ANALYTICS.MUTED,
                fontSize: 13,
                fontWeight: stage.viewed ? 700 : 600,
              }}
            >
              {stage.label}
            </span>
            <span
              style={{
                color: ANALYTICS.FAINT,
                fontFamily: ANALYTICS.MONO,
                fontSize: 10,
                fontWeight: 700,
              }}
            >
              {stage.viewed ? `${stage.done}/${stage.total}` : ''}
            </span>
          </Link>
        ))}
      </div>

      <div
        style={{
          marginTop: 18,
          paddingTop: 14,
          borderTop: `1px solid ${ANALYTICS.LINE_SOFT}`,
        }}
      >
        <RailLabel>Workspace</RailLabel>
        <WorkspaceButton
          label="Steps"
          active={workspace === 'steps'}
          onClick={() => onWorkspaceChange('steps')}
        />
        <WorkspaceButton
          label="Files & deliverables"
          active={workspace === 'files'}
          onClick={() => onWorkspaceChange('files')}
        />
        <WorkspaceButton
          label="Intelligence Explorer"
          active={workspace === 'intelligence'}
          onClick={() => onWorkspaceChange('intelligence')}
        />
        <WorkspaceButton
          label="Approvals"
          active={workspace === 'approvals'}
          onClick={() => onWorkspaceChange('approvals')}
        />
      </div>
    </aside>
  );
}

function SourceWorkspace({
  view,
  stageView,
  eventId,
  workspace,
  onWorkspaceChange,
}: {
  view: SourceEventShellView;
  stageView: StageAnalyticsView;
  eventId: string;
  workspace: SourceShellWorkspace;
  onWorkspaceChange: (workspace: SourceShellWorkspace) => void;
}) {
  if (workspace === 'files') return <FilesWorkspace view={view} />;
  if (workspace === 'intelligence') {
    return <IntelligenceWorkspace view={view} stageView={stageView} />;
  }
  if (workspace === 'approvals') return <ApprovalsWorkspace view={view} />;

  return (
    <section data-testid="source-shell-v2-steps">
      <StageHeader view={view} onWorkspaceChange={onWorkspaceChange} />
      <WorkflowBlocks groups={view.stage.groups} />
      <div style={{ marginTop: 18 }}>
        <TaskChecklist
          tasks={stageView.tasks}
          eventId={eventId}
          stageKey={view.stage.key}
        />
      </div>
      <GateHandoffCard view={view} onWorkspaceChange={onWorkspaceChange} />
    </section>
  );
}

function StageHeader({
  view,
  onWorkspaceChange,
}: {
  view: SourceEventShellView;
  onWorkspaceChange: (workspace: SourceShellWorkspace) => void;
}) {
  return (
    <header style={{ marginBottom: 18 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 22,
        }}
      >
        <div>
          <div
            style={{
              color: ANALYTICS.FAINT,
              fontFamily: ANALYTICS.MONO,
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              marginBottom: 8,
            }}
          >
            {view.event.code} · {view.event.viewedStageLabel}
          </div>
          <h1
            style={{
              fontFamily: ANALYTICS.SERIF,
              fontSize: 36,
              lineHeight: 1,
              margin: 0,
              letterSpacing: '-0.5px',
            }}
          >
            {view.stage.label}
          </h1>
          <p
            style={{
              margin: '10px 0 0',
              color: ANALYTICS.INK_2,
              fontSize: 17,
              lineHeight: 1.45,
              maxWidth: 760,
            }}
          >
            {view.stage.purpose}
          </p>
        </div>
        <div style={{ minWidth: 280 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: 13,
              color: ANALYTICS.INK_2,
              fontWeight: 700,
            }}
          >
            <span>
              {view.stage.ready} of {view.stage.total} complete
            </span>
            <button
              type="button"
              onClick={() => onWorkspaceChange('approvals')}
              style={{
                ...BUTTON_STYLE,
                padding: '10px 14px',
                color: ANALYTICS.MUTED,
              }}
            >
              Continue to approval →
            </button>
          </div>
          <div
            aria-hidden
            style={{
              height: 6,
              marginTop: 12,
              background: ANALYTICS.LINE_SOFT,
              borderRadius: 999,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${view.stage.readyPct}%`,
                height: '100%',
                background: ANALYTICS.GREEN,
              }}
            />
          </div>
        </div>
      </div>
    </header>
  );
}

function WorkflowBlocks({ groups }: { groups: SourceShellStepGroup[] }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${Math.min(Math.max(groups.length, 1), 3)}, minmax(0, 1fr))`,
        gap: 10,
        marginBottom: 20,
      }}
    >
      {groups.map((group, index) => {
        const done = group.steps.filter((step) => step.status === 'captured').length;
        return (
          <div
            key={group.id}
            style={{
              ...CARD_STYLE,
              padding: '13px 14px',
              borderColor: index === 0 ? ANALYTICS.BLUE : ANALYTICS.LINE,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: 10,
                fontWeight: 800,
                fontSize: 14,
              }}
            >
              <span>
                {index + 1}. {group.label}
              </span>
              <span>
                {done}/{group.steps.length}
              </span>
            </div>
            <div style={{ color: ANALYTICS.MUTED, fontSize: 12, marginTop: 7 }}>
              {group.steps.map((step) => step.title).join(' · ')}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function GateHandoffCard({
  view,
  onWorkspaceChange,
}: {
  view: SourceEventShellView;
  onWorkspaceChange: (workspace: SourceShellWorkspace) => void;
}) {
  return (
    <section
      style={{
        ...CARD_STYLE,
        marginTop: 18,
        padding: 18,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
        }}
      >
        <div>
          <div
            style={{
              fontFamily: ANALYTICS.SERIF,
              fontSize: 19,
              fontWeight: 800,
            }}
          >
            {view.stage.label} approval handoff
          </div>
          <p style={{ color: ANALYTICS.INK_2, margin: '7px 0 0', fontSize: 14 }}>
            {view.stage.gateReadinessLine}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onWorkspaceChange('approvals')}
          style={{
            ...BUTTON_STYLE,
            display: 'inline-flex',
            alignItems: 'center',
            padding: '11px 14px',
            background: ANALYTICS.INK,
            color: '#fff',
            flexShrink: 0,
          }}
        >
          Open approval workspace
        </button>
      </div>
    </section>
  );
}

function FilesWorkspace({ view }: { view: SourceEventShellView }) {
  return (
    <section data-testid="source-shell-v2-files">
      <WorkspaceTitle
        eyebrow="Files & deliverables"
        title="Evidence ledger"
        subtitle="Every file stays tied to its event, stage, state, and source basis."
      />
      {view.files.byStage.length === 0 ? (
        <EmptyCard text="No Source artifacts are registered for this event yet." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {view.files.byStage.map((group) => (
            <section key={group.stageKey} style={{ ...CARD_STYLE, padding: 18 }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 12,
                }}
              >
                <h2
                  style={{
                    fontFamily: ANALYTICS.SERIF,
                    fontSize: 21,
                    margin: 0,
                  }}
                >
                  {group.stageLabel}
                </h2>
                <span style={{ color: ANALYTICS.MUTED, fontSize: 12 }}>
                  {group.items.length} item{group.items.length === 1 ? '' : 's'}
                </span>
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                  gap: 10,
                }}
              >
                {group.items.map((item) => (
                  <FileCard key={item.id} item={item} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </section>
  );
}

function IntelligenceWorkspace({
  view,
  stageView,
}: {
  view: SourceEventShellView;
  stageView: StageAnalyticsView;
}) {
  return (
    <section data-testid="source-shell-v2-intelligence">
      <WorkspaceTitle
        eyebrow="Intelligence Explorer"
        title={`${view.stage.label} intelligence`}
        subtitle="Dynamic stage intelligence reads the same governed facts, artifacts, and model-state boundaries the workflow uses."
      />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 320px',
          gap: 16,
          alignItems: 'start',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {view.intelligence.stepInsight ? (
            <StepInsightPanel insight={view.intelligence.stepInsight} />
          ) : null}
          {stageView.waterfall ? (
            <ValueWaterfall waterfall={stageView.waterfall} />
          ) : null}
          <IntelPanel intel={stageView.intel} stageName={view.stage.label} />
        </div>
        <IntelligenceExplorerCard view={view} />
      </div>
    </section>
  );
}

function ApprovalsWorkspace({ view }: { view: SourceEventShellView }) {
  return (
    <section data-testid="source-shell-v2-approvals">
      <WorkspaceTitle
        eyebrow="Approvals"
        title="Stage decisions"
        subtitle="The workflow prepares the evidence; this page records the approval decision."
      />
      {view.approvals.currentStageItem ? (
        <ApprovalCard item={view.approvals.currentStageItem} featured />
      ) : (
        <EmptyCard text={view.approvals.readinessLine} />
      )}
      {view.approvals.items.length > 0 ? (
        <div style={{ marginTop: 14, display: 'grid', gap: 10 }}>
          {view.approvals.items.map((item) => (
            <ApprovalCard
              key={`${item.eventId}-${item.kind}-${item.stageKey ?? 'intake'}`}
              item={item}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}

function IntelligenceExplorerCard({ view }: { view: SourceEventShellView }) {
  return (
    <aside style={{ ...CARD_STYLE, padding: 18, position: 'sticky', top: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            display: 'grid',
            placeItems: 'center',
            background: ANALYTICS.TEAL_DEEP,
            color: ANALYTICS.TEAL_BRIGHT,
            fontFamily: ANALYTICS.SERIF,
            fontWeight: 900,
          }}
        >
          a
        </div>
        <div>
          <div style={{ fontWeight: 800 }}>aVa</div>
          <div style={{ color: ANALYTICS.MUTED, fontSize: 12 }}>
            Analyst · {view.stage.label}
          </div>
        </div>
      </div>
      <p style={{ color: ANALYTICS.INK_2, fontSize: 13, lineHeight: 1.55 }}>
        {view.intelligence.lead}
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {view.intelligence.contextChips.map((chip) => (
          <span
            key={chip}
            style={{
              borderRadius: 999,
              background: 'rgba(10,10,11,0.06)',
              color: ANALYTICS.MUTED,
              padding: '4px 8px',
              fontSize: 11,
              fontWeight: 700,
            }}
          >
            {chip}
          </span>
        ))}
      </div>
      <div
        style={{
          marginTop: 16,
          paddingTop: 14,
          borderTop: `1px solid ${ANALYTICS.LINE_SOFT}`,
          display: 'grid',
          gap: 10,
        }}
      >
        {view.intelligence.findings.slice(0, 4).map((finding) => (
          <div key={finding.id}>
            <EvidenceBadge basis={finding.sourceBasis} label={finding.tag} />
            <div
              style={{
                color: ANALYTICS.INK_2,
                fontSize: 12.5,
                lineHeight: 1.45,
                marginTop: 5,
              }}
            >
              {finding.text}
            </div>
          </div>
        ))}
      </div>
      <div
        style={{
          marginTop: 16,
          padding: 12,
          borderRadius: 8,
          background: ANALYTICS.SOFT,
          color: ANALYTICS.MUTED,
          fontSize: 12,
          lineHeight: 1.45,
        }}
      >
        {view.intelligence.captureSemantics.conversationOnlyLabel}
      </div>
      <button
        type="button"
        disabled
        style={{
          ...BUTTON_STYLE,
          width: '100%',
          marginTop: 10,
          padding: '10px 12px',
          color: ANALYTICS.FAINT,
          cursor: 'not-allowed',
        }}
      >
        {view.intelligence.captureSemantics.saveActionLabel}
      </button>
    </aside>
  );
}

function AvaInlinePanel({
  view,
  quote,
}: {
  view: SourceEventShellView;
  quote: string;
}) {
  return (
    <section
      style={{
        ...CARD_STYLE,
        padding: 14,
        marginBottom: 14,
        display: 'grid',
        gridTemplateColumns: '36px 1fr',
        gap: 12,
      }}
    >
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: 999,
          background: ANALYTICS.TEAL_DEEP,
          color: ANALYTICS.TEAL_BRIGHT,
          display: 'grid',
          placeItems: 'center',
          fontFamily: ANALYTICS.SERIF,
          fontWeight: 900,
        }}
      >
        aV
      </div>
      <div>
        <div style={{ fontWeight: 800 }}>aVa · {view.stage.label}</div>
        <div style={{ color: ANALYTICS.INK_2, fontSize: 13, marginTop: 3 }}>
          {quote}
        </div>
      </div>
    </section>
  );
}

function FileCard({ item }: { item: SourceShellFileItem }) {
  return (
    <div
      style={{
        border: `1px solid ${ANALYTICS.LINE_SOFT}`,
        borderRadius: 8,
        padding: 12,
        background: ANALYTICS.SOFT,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
        <span style={{ fontWeight: 800, fontSize: 13 }}>{item.name}</span>
        <span
          style={{
            fontFamily: ANALYTICS.MONO,
            fontSize: 10,
            fontWeight: 800,
            color: ANALYTICS.MUTED,
          }}
        >
          {item.format}
        </span>
      </div>
      <div style={{ color: ANALYTICS.MUTED, fontSize: 12, marginTop: 8 }}>
        {item.group} · {item.state}
      </div>
      <div style={{ marginTop: 9 }}>
        <EvidenceBadge basis={item.sourceBasis} label="File evidence" />
      </div>
    </div>
  );
}

function ApprovalCard({
  item,
  featured = false,
}: {
  item: ApprovalsInboxItem;
  featured?: boolean;
}) {
  return (
    <section
      style={{
        ...CARD_STYLE,
        padding: 16,
        borderColor: featured ? ANALYTICS.BLUE : ANALYTICS.LINE,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 14,
        }}
      >
        <div>
          <div style={{ fontWeight: 800 }}>{item.ask}</div>
          <div style={{ color: ANALYTICS.MUTED, fontSize: 13, marginTop: 5 }}>
            {item.eventCode} · {item.stageLabel ?? 'Intake'}
          </div>
          <div style={{ color: ANALYTICS.INK_2, fontSize: 13, marginTop: 8 }}>
            {item.readiness}
          </div>
        </div>
        <Link
          href={item.href}
          style={{
            ...BUTTON_STYLE,
            padding: '10px 12px',
            textDecoration: 'none',
            flexShrink: 0,
          }}
        >
          {item.actionLabel}
        </Link>
      </div>
    </section>
  );
}

function WorkspaceTitle({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
}) {
  return (
    <header style={{ marginBottom: 18 }}>
      <div
        style={{
          fontFamily: ANALYTICS.MONO,
          fontSize: 10,
          fontWeight: 800,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: ANALYTICS.FAINT,
          marginBottom: 8,
        }}
      >
        {eyebrow}
      </div>
      <h1
        style={{
          fontFamily: ANALYTICS.SERIF,
          margin: 0,
          fontSize: 34,
          letterSpacing: '-0.4px',
        }}
      >
        {title}
      </h1>
      <p
        style={{
          color: ANALYTICS.INK_2,
          margin: '8px 0 0',
          fontSize: 16,
          maxWidth: 780,
          lineHeight: 1.45,
        }}
      >
        {subtitle}
      </p>
    </header>
  );
}

function WorkspaceButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: '100%',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        border: active ? `1px solid ${ANALYTICS.LINE}` : '1px solid transparent',
        borderRadius: 8,
        background: active ? ANALYTICS.CARD : 'transparent',
        padding: '9px 10px',
        cursor: 'pointer',
        fontFamily: ANALYTICS.SANS,
        fontSize: 13,
        fontWeight: active ? 800 : 650,
        color: active ? ANALYTICS.INK : ANALYTICS.INK_2,
        textAlign: 'left',
      }}
    >
      <span>{label}</span>
      <span style={{ color: ANALYTICS.FAINT }}>›</span>
    </button>
  );
}

function RailLabel({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        color: ANALYTICS.FAINT,
        fontFamily: ANALYTICS.MONO,
        fontSize: 10,
        fontWeight: 800,
        letterSpacing: '0.14em',
        margin: '0 0 8px',
        textTransform: 'uppercase',
      }}
    >
      {children}
    </div>
  );
}

function EmptyCard({ text }: { text: string }) {
  return (
    <div
      style={{
        ...CARD_STYLE,
        padding: 18,
        color: ANALYTICS.MUTED,
        fontSize: 14,
      }}
    >
      {text}
    </div>
  );
}

function EvidenceBadge({
  basis,
  label,
}: {
  basis: SourceShellEvidenceBasis;
  label?: string;
}) {
  const tone =
    basis === 'live_fact' || basis === 'live_artifact'
      ? { bg: ANALYTICS.GREEN_TINT, fg: ANALYTICS.GREEN_TEXT }
      : basis === 'sample'
        ? { bg: 'rgba(10,10,11,0.06)', fg: ANALYTICS.MUTED }
        : basis === 'missing'
          ? { bg: ANALYTICS.AMBER_TINT, fg: ANALYTICS.AMBER_TEXT }
          : { bg: ANALYTICS.BLUE_TINT, fg: ANALYTICS.BLUE };
  return (
    <span
      style={{
        display: 'inline-flex',
        borderRadius: 999,
        background: tone.bg,
        color: tone.fg,
        padding: '3px 8px',
        fontSize: 10,
        fontWeight: 800,
        letterSpacing: '0.03em',
        textTransform: 'uppercase',
      }}
    >
      {label ?? basis.replaceAll('_', ' ')}
    </span>
  );
}

function AvaDockControls({
  dock,
  onDockChange,
}: {
  dock: AvaDock;
  onDockChange: (dock: AvaDock) => void;
}) {
  const controls: { key: AvaDock; label: string; title: string }[] = [
    { key: 'left', label: 'L', title: 'Lock aVa left' },
    { key: 'right', label: 'R', title: 'Lock aVa right' },
    { key: 'top', label: 'T', title: 'Dock aVa top' },
    { key: 'bottom', label: 'B', title: 'Dock aVa bottom' },
    { key: 'hidden', label: dock === 'hidden' ? 'aV' : '×', title: 'Hide aVa' },
  ];
  return (
    <div
      aria-label="aVa dock controls"
      style={{
        position: 'fixed',
        left: 14,
        bottom: 96,
        zIndex: 80,
        display: 'flex',
        gap: 6,
        padding: 6,
        borderRadius: 999,
        background: 'rgba(250,247,241,0.96)',
        border: `1px solid ${ANALYTICS.LINE}`,
        boxShadow: ANALYTICS.SHADOW_SM,
      }}
    >
      {controls.map((control) => (
        <button
          key={control.key}
          type="button"
          aria-label={control.title}
          title={control.title}
          data-testid={`ava-dock-${control.key}`}
          onClick={() => onDockChange(control.key === 'hidden' && dock === 'hidden' ? 'left' : control.key)}
          style={{
            ...BUTTON_STYLE,
            width: 30,
            height: 28,
            borderRadius: 999,
            padding: 0,
            background: dock === control.key ? ANALYTICS.INK : ANALYTICS.CARD,
            color: dock === control.key ? '#fff' : ANALYTICS.INK_2,
            fontSize: 11,
          }}
        >
          {control.label}
        </button>
      ))}
    </div>
  );
}

function agentActions(view: SourceEventShellView): AgentAction[] {
  const actions: AgentAction[] = [];
  const firstOpen = view.stage.activeStep;
  const remaining = Math.max(view.stage.total - view.stage.ready, 0);
  const approvalDetail =
    remaining === 0
      ? 'All steps complete - review approval inside this event workspace.'
      : `${remaining} step${remaining === 1 ? '' : 's'} left - finish the inputs, then open Approvals in this event workspace.`;
  if (firstOpen) {
    actions.push({
      letter: 'A',
      text: `What is needed for "${firstOpen.title}"?`,
      detail: firstOpen.help,
    });
  }
  actions.push({
    letter: actions.length === 0 ? 'A' : 'B',
    text: `What changed in ${view.stage.label} intelligence?`,
    detail:
      view.intelligence.sourceBasis === 'sample'
        ? 'Sample/model context is marked before use.'
        : 'Reads current governed context.',
  });
  actions.push({
    letter: actions.length === 1 ? 'B' : 'C',
    text: `What is left before ${view.stage.label} approval?`,
    detail: approvalDetail,
  });
  return actions.slice(0, 3);
}
