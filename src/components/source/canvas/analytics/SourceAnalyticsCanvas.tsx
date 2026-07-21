'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState, type CSSProperties, type ComponentPropsWithoutRef, type ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import { AskAnythingBar } from '@/components/agent/AskAnythingBar';
import { AppShell } from '@/components/shell/AppShell';
import { AcceptClientFinalButton } from '@/components/source/canvas/workspace-tabs/AcceptClientFinalButton';
import {
  buildSourceEventShellView,
  type SourceEventShellView,
  type SourceShellArtifactLike,
  type SourceShellEvidenceBasis,
  type SourceShellFileItem,
  type SourceShellStepGroup,
  type SourceShellWorkspace,
} from '@/lib/source/source-event-shell-v2';
import {
  buildSourceArtifactStandardsCsv,
  type SourceArtifactLifecycleRow,
} from '@/lib/source/artifact-lifecycle-matrix';
import type { ApprovalsInboxItem } from '@/lib/source/approvals-inbox';
import { SOURCE_STAGE_LABELS } from '@/lib/source/constants';
import type { SourceStageKey, SourcingEventSummary } from '@/lib/source/types';
import type { SourceStageGuidebookRecord } from '@/lib/source/stage-guidebooks/types';
import { ANALYTICS } from './analytics-tokens';
import { IntelPanel } from './IntelPanel';
import { TaskProvideUpload } from './TaskChecklist';
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

interface SourceAnalyticsCanvasProps {
  event: SourcingEventSummary;
  viewStage: SourceStageKey;
  tenantName: string;
  stageView?: StageAnalyticsView;
  stepInsight?: StepInsightView;
  artifacts?: readonly SourceShellArtifactLike[];
  approvalItems?: readonly ApprovalsInboxItem[];
  /** Facilitator guidebook for the viewed stage; null when none has been authored yet. */
  guidebook?: SourceStageGuidebookRecord | null;
  /** Legacy prop retained for route compatibility; the duplicate launcher is no longer rendered. */
  avaLauncher?: AvaLauncherView;
}

const MAIN_STYLE: CSSProperties = {
  flex: 1,
  minHeight: 0,
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
  gridTemplateColumns: '264px minmax(0, 1fr)',
  gap: 0,
  minHeight: '100%',
  alignItems: 'stretch',
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
  guidebook = null,
}: SourceAnalyticsCanvasProps) {
  const router = useRouter();
  const [workspace, setWorkspace] = useState<SourceShellWorkspace>('steps');
  const [avaOpen, setAvaOpen] = useState(false);

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
        guidebook,
      }),
    [
      approvalItems,
      artifacts,
      event,
      guidebook,
      resolvedStageView,
      stepInsight,
      tenantName,
      viewStage,
      workspace,
    ],
  );

  const stageLabel =
    SOURCE_STAGE_LABELS[viewStage] ?? resolvedStageView.stageName;

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
        <div style={WORK_PANE_STYLE}>
          <div style={CANVAS_STYLE}>
            <SourceShellRail
              view={shellView}
              workspace={workspace}
              onWorkspaceChange={setWorkspace}
            />
            <div style={{ minWidth: 0, padding: '28px 92px 150px' }}>
              <SourceWorkspace
                view={shellView}
                stageView={resolvedStageView}
                workspace={workspace}
                onWorkspaceChange={setWorkspace}
                onClientFinalAccepted={() => router.refresh()}
              />
            </div>
          </div>
        </div>
      </main>
      <AskAvaLauncher open={avaOpen} onClick={() => setAvaOpen((value) => !value)} />
      {avaOpen ? (
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
    <aside
      data-testid="source-shell-v2-rail"
      style={{
        minWidth: 0,
        padding: '24px 16px 18px',
        borderRight: `1px solid ${ANALYTICS.LINE}`,
        background: ANALYTICS.PAGE_BG,
      }}
    >
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
          label="Files & deliverables"
          active={workspace === 'files'}
          onClick={() => onWorkspaceChange('files')}
        />
        <WorkspaceButton
          label="Intelligence Explorer"
          badge={workspace === 'intelligence' ? 'open' : 'hidden'}
          active={workspace === 'intelligence'}
          onClick={() => onWorkspaceChange('intelligence')}
        />
        <WorkspaceButton
          label="Approvals"
          active={workspace === 'approvals'}
          onClick={() => onWorkspaceChange('approvals')}
        />
        {view.guidebook.available ? (
          <WorkspaceButton
            label="Guidebook"
            active={workspace === 'guidebook'}
            onClick={() => onWorkspaceChange('guidebook')}
          />
        ) : null}
      </div>
      <div
        style={{
          marginTop: 26,
          paddingTop: 18,
          borderTop: `1px solid ${ANALYTICS.LINE_SOFT}`,
          color: ANALYTICS.MUTED,
          fontSize: 12,
          lineHeight: 1.45,
        }}
      >
        <Link
          href="/source"
          style={{ color: ANALYTICS.MUTED, textDecoration: 'none' }}
        >
          Design contract →
        </Link>
        <div style={{ marginTop: 14 }}>
          <b style={{ color: ANALYTICS.INK_2 }}>aVa</b> guides steps 1–9 ·
          Atlas takes over for Transition &amp; Value.
        </div>
      </div>
    </aside>
  );
}

function SourceWorkspace({
  view,
  stageView,
  workspace,
  onWorkspaceChange,
  onClientFinalAccepted,
}: {
  view: SourceEventShellView;
  stageView: StageAnalyticsView;
  workspace: SourceShellWorkspace;
  onWorkspaceChange: (workspace: SourceShellWorkspace) => void;
  onClientFinalAccepted: () => void;
}) {
  if (workspace === 'files') {
    return (
      <FilesWorkspace
        view={view}
        onClientFinalAccepted={onClientFinalAccepted}
      />
    );
  }
  if (workspace === 'intelligence') {
    return <IntelligenceWorkspace view={view} stageView={stageView} />;
  }
  if (workspace === 'approvals') return <ApprovalsWorkspace view={view} />;
  if (workspace === 'guidebook') return <GuidebookWorkspace view={view} />;

  return (
    <section data-testid="source-shell-v2-steps">
      <StageHeader view={view} />
      <StageModeTabs workspace={workspace} onWorkspaceChange={onWorkspaceChange} />
      <WorkflowBlocks groups={view.stage.groups} />
      <FocusedWorkPanel view={view} />
    </section>
  );
}

function StageHeader({
  view,
}: {
  view: SourceEventShellView;
}) {
  const stageIndex =
    view.journey.find((stage) => stage.key === view.stage.key)?.index ?? 1;

  return (
    <header style={{ marginBottom: 22, maxWidth: 1040 }}>
      <div
        style={{
          color: ANALYTICS.FAINT,
          fontSize: 12,
          marginBottom: 12,
        }}
      >
        Source › {view.event.code} › {view.stage.label}
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 230px',
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
            Stage {String(stageIndex).padStart(2, '0')} · aVa
          </div>
          <h1
            style={{
              fontFamily: ANALYTICS.SERIF,
              fontSize: 35,
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
        <div
          style={{
            ...CARD_STYLE,
            minWidth: 0,
            padding: '18px 18px 17px',
            boxShadow: 'none',
          }}
        >
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
              <b
                style={{
                  color: ANALYTICS.INK,
                  fontFamily: ANALYTICS.SERIF,
                  fontSize: 22,
                }}
              >
                {view.stage.ready} / {view.stage.total}
              </b>
            </span>
            <span style={{ color: ANALYTICS.FAINT, fontSize: 12 }}>
              steps ready
            </span>
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
          <div style={{ color: ANALYTICS.FAINT, fontSize: 12, marginTop: 8 }}>
            {view.stage.readyPct}% ready · {view.stage.pattern.replace('-', ' ')}
          </div>
        </div>
      </div>
    </header>
  );
}

function StageModeTabs({
  workspace,
  onWorkspaceChange,
}: {
  workspace: SourceShellWorkspace;
  onWorkspaceChange: (workspace: SourceShellWorkspace) => void;
}) {
  const tabs: { key: SourceShellWorkspace; label: ReactNode }[] = [
    { key: 'steps', label: 'Steps' },
    { key: 'files', label: 'Files' },
    { key: 'intelligence', label: <>✦ Intelligence</> },
  ];

  return (
    <div
      style={{
        display: 'inline-flex',
        gap: 2,
        margin: '0 0 22px',
        padding: 3,
        borderRadius: 10,
        background: ANALYTICS.SOFT,
        border: `1px solid ${ANALYTICS.LINE_SOFT}`,
      }}
    >
      {tabs.map((tab) => {
        const active = workspace === tab.key;
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onWorkspaceChange(tab.key)}
            style={{
              border: active ? `1px solid ${ANALYTICS.LINE}` : '1px solid transparent',
              borderRadius: 8,
              background: active ? ANALYTICS.CARD : 'transparent',
              color: active ? ANALYTICS.INK : ANALYTICS.MUTED,
              boxShadow: active ? ANALYTICS.SHADOW_SM : 'none',
              cursor: 'pointer',
              fontFamily: ANALYTICS.SANS,
              fontSize: 13,
              fontWeight: 700,
              padding: '8px 17px',
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
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

function FocusedWorkPanel({ view }: { view: SourceEventShellView }) {
  const flatSteps = view.stage.groups.flatMap((group) => group.steps);
  const activeStep =
    flatSteps.find((step) => step.status === 'active') ??
    flatSteps.find((step) => step.status !== 'captured') ??
    flatSteps[0] ??
    null;
  const activeIndex = activeStep
    ? flatSteps.findIndex((step) => step.id === activeStep.id)
    : -1;

  if (!activeStep) {
    return <EmptyCard text="No required steps are defined for this stage yet." />;
  }

  return (
    <section
      style={{
        ...CARD_STYLE,
        display: 'grid',
        gridTemplateColumns: '272px minmax(0, 1fr)',
        maxWidth: 1040,
        overflow: 'hidden',
        boxShadow: 'none',
      }}
    >
      <div
        style={{
          borderRight: `1px solid ${ANALYTICS.LINE}`,
          padding: '24px 14px 18px',
          background: ANALYTICS.PAGE_BG,
        }}
      >
        {view.stage.groups.map((group) => (
          <div key={group.id} style={{ marginBottom: 18 }}>
            <RailLabel>{group.label}</RailLabel>
            <div style={{ display: 'grid', gap: 4 }}>
              {group.steps.map((step) => {
                const active = step.id === activeStep.id;
                const done = step.status === 'captured';
                return (
                  <div
                    key={step.id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '20px minmax(0, 1fr) auto',
                      gap: 8,
                      alignItems: 'center',
                      border: active
                        ? `1px solid ${ANALYTICS.LINE}`
                        : '1px solid transparent',
                      borderLeft: active
                        ? `2px solid ${ANALYTICS.BLUE}`
                        : '2px solid transparent',
                      borderRadius: 8,
                      background: active ? ANALYTICS.CARD : 'transparent',
                      padding: '8px 7px',
                      boxShadow: active ? ANALYTICS.SHADOW_SM : 'none',
                    }}
                  >
                    <StepDot done={done} active={active} />
                    <span
                      style={{
                        color: done
                          ? ANALYTICS.FAINT
                          : active
                            ? ANALYTICS.INK
                            : ANALYTICS.INK_2,
                        fontSize: 13,
                        fontWeight: active ? 800 : 650,
                        lineHeight: 1.25,
                      }}
                    >
                      {step.title}
                    </span>
                    {active ? (
                      <span
                        style={{
                          color: ANALYTICS.BLUE,
                          fontFamily: ANALYTICS.MONO,
                          fontSize: 8,
                          fontWeight: 800,
                          textTransform: 'uppercase',
                        }}
                      >
                        now
                      </span>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        <div
          style={{
            color: ANALYTICS.FAINT,
            fontSize: 12,
            lineHeight: 1.45,
            marginTop: 12,
            paddingTop: 14,
            borderTop: `1px solid ${ANALYTICS.LINE_SOFT}`,
          }}
        >
          {view.stage.gateReadinessLine}
        </div>
      </div>

      <div style={{ padding: '28px 30px 34px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 16,
            marginBottom: 14,
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '28px 1fr', gap: 14 }}>
            <StepDot active />
            <div>
              <div
                style={{
                  color: ANALYTICS.MUTED,
                  fontFamily: ANALYTICS.MONO,
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: '0.05em',
                  marginBottom: 4,
                }}
              >
                Step {activeIndex + 1} of {flatSteps.length}
              </div>
              <h2
                style={{
                  display: 'inline',
                  fontSize: 17,
                  lineHeight: 1.3,
                  margin: 0,
                }}
              >
                {activeStep.title}
              </h2>
              <EvidenceBadge basis={activeStep.sourceBasis} label={activeStep.type} />
            </div>
          </div>
          <span
            style={{
              borderRadius: 999,
              background: activeStep.status === 'captured' ? ANALYTICS.GREEN_TINT : ANALYTICS.AMBER_TINT,
              color: activeStep.status === 'captured' ? ANALYTICS.GREEN_TEXT : ANALYTICS.AMBER_TEXT,
              fontSize: 10,
              fontWeight: 800,
              padding: '5px 9px',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
            }}
          >
            {activeStep.status === 'captured' ? 'Done' : 'Do this now'}
          </span>
        </div>

        <p
          style={{
            color: ANALYTICS.INK_2,
            fontSize: 14,
            lineHeight: 1.55,
            margin: '0 0 16px 42px',
            maxWidth: 720,
          }}
        >
          {activeStep.help}
        </p>

        <StepDetail
          step={activeStep}
          eventId={view.event.id}
          stageKey={view.stage.key}
        />
      </div>
    </section>
  );
}

function StepDetail({
  step,
  eventId,
  stageKey,
}: {
  step: SourceEventShellView['stage']['activeStep'];
  eventId: string;
  stageKey: SourceStageKey;
}) {
  if (!step) return null;

  if (step.rows.length > 0) {
    return (
      <div
        style={{
          marginLeft: 42,
          border: `1px solid ${ANALYTICS.LINE}`,
          borderRadius: 8,
          overflow: 'hidden',
          maxWidth: 680,
        }}
      >
        {step.rows.map((row, index) => (
          <div
            key={`${row.key}-${index}`}
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr auto',
              gap: 16,
              padding: '10px 12px',
              borderTop: index === 0 ? 'none' : `1px solid ${ANALYTICS.LINE_SOFT}`,
              color: ANALYTICS.INK_2,
              fontSize: 13,
            }}
          >
            <span>{row.key}</span>
            <b style={{ color: row.flag ? ANALYTICS.AMBER_TEXT : ANALYTICS.INK }}>
              {row.value}
            </b>
          </div>
        ))}
        <div style={{ padding: '12px' }}>
          <ActionButton>{step.cta}</ActionButton>
        </div>
      </div>
    );
  }

  if (step.type === 'provide') {
    return (
      <div style={{ marginLeft: 42, maxWidth: 680 }}>
        <TaskProvideUpload
          signed={/letter|commit/i.test(step.title)}
          eventId={eventId}
          stageKey={stageKey}
          factTemplateCode={step.factTemplateCode ?? undefined}
        />
      </div>
    );
  }

  return (
    <div style={{ marginLeft: 42 }}>
      <ActionButton>{step.cta}</ActionButton>
    </div>
  );
}

function StepDot({
  done = false,
  active = false,
}: {
  done?: boolean;
  active?: boolean;
}) {
  return (
    <span
      style={{
        width: active ? 26 : 18,
        height: active ? 26 : 18,
        borderRadius: 999,
        display: 'grid',
        placeItems: 'center',
        background: done ? ANALYTICS.GREEN : active ? ANALYTICS.BLUE : ANALYTICS.CARD,
        color: done || active ? '#fff' : 'transparent',
        border: done || active ? 'none' : `1.5px solid ${ANALYTICS.LINE_STRONG}`,
        fontSize: 11,
        fontWeight: 900,
        flexShrink: 0,
      }}
    >
      {done ? '✓' : active ? '' : ''}
    </span>
  );
}

function ActionButton({ children }: { children: ReactNode }) {
  return (
    <button
      type="button"
      style={{
        border: 'none',
        borderRadius: 8,
        background: ANALYTICS.INK,
        color: '#fff',
        cursor: 'pointer',
        fontFamily: ANALYTICS.SANS,
        fontSize: 13,
        fontWeight: 800,
        padding: '11px 16px',
      }}
    >
      {children}
    </button>
  );
}

function FilesWorkspace({
  view,
  onClientFinalAccepted,
}: {
  view: SourceEventShellView;
  onClientFinalAccepted: () => void;
}) {
  return (
    <section data-testid="source-shell-v2-files">
      <WorkspaceTitle
        eyebrow="Files & deliverables"
        title="Evidence ledger"
        subtitle="Every file stays tied to its event, stage, state, and source basis."
      />
      <ArtifactLifecyclePanel
        view={view}
        onClientFinalAccepted={onClientFinalAccepted}
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

function ArtifactLifecyclePanel({
  view,
  onClientFinalAccepted,
}: {
  view: SourceEventShellView;
  onClientFinalAccepted: () => void;
}) {
  const lifecycle = view.files.lifecycle;
  const rowsByStage = groupLifecycleRows(lifecycle.rows);
  const standardsCsvHref = `data:text/csv;charset=utf-8,${encodeURIComponent(
    buildSourceArtifactStandardsCsv(lifecycle.rows),
  )}`;
  const standardsCsvFilename = `${view.event.code || 'source-event'}-artifact-standards.csv`;
  const summaryItems = [
    ['Quality score', `${lifecycle.quality.score}/100`],
    ['Hard fails', String(lifecycle.quality.hardFailCount)],
    ['Missing required', String(lifecycle.quality.missingRequiredCount)],
    ['Review-required', String(lifecycle.quality.reviewRequiredCount)],
    ['Content scored', String(lifecycle.quality.contentScoredCount)],
    ['Content blockers', String(lifecycle.quality.contentBlockerCount)],
    ['Content warnings', String(lifecycle.quality.contentWarningCount)],
    ['Expected artifacts', String(lifecycle.expectedCount)],
    ['Required', String(lifecycle.requiredCount)],
    ['Gate-defining', String(lifecycle.gateDefiningCount)],
    ['Prompt-backed', String(lifecycle.promptBackedCount)],
    ['Export-routed', String(lifecycle.renderableCount)],
    ['AI drafts', String(lifecycle.aiDraftCount)],
    ['Client finals', String(lifecycle.clientFinalCount)],
    ['Evidence-only', String(lifecycle.evidenceOnlyCount)],
  ];

  return (
    <section
      data-testid="source-artifact-lifecycle-matrix"
      style={{ ...CARD_STYLE, padding: 18, marginBottom: 16 }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: 18,
          alignItems: 'flex-start',
        }}
      >
        <div>
          <div
            style={{
              color: ANALYTICS.BLUE,
              fontFamily: ANALYTICS.MONO,
              fontSize: 11,
              fontWeight: 900,
              letterSpacing: 1.2,
              textTransform: 'uppercase',
            }}
          >
            Artifact lifecycle
          </div>
          <h2
            style={{
              margin: '6px 0 0',
              fontFamily: ANALYTICS.SERIF,
              fontSize: 22,
            }}
          >
            Draft, evidence, and final record
          </h2>
          <p
            style={{
              margin: '6px 0 0',
              color: ANALYTICS.MUTED,
              fontSize: 13,
              lineHeight: 1.5,
              maxWidth: 760,
            }}
          >
            Generated documents stay as AI-prepared drafts until a reviewed
            client-final version is accepted back into Source as the
            authoritative artifact of record.
          </p>
          <p
            data-testid="source-artifact-quality-scope"
            style={{
              margin: '8px 0 0',
              color: ANALYTICS.MUTED,
              fontSize: 12,
              lineHeight: 1.45,
              maxWidth: 760,
            }}
          >
            Quality rubric: {lifecycle.quality.label}. {lifecycle.quality.scopeLabel}
          </p>
          <a
            href={standardsCsvHref}
            download={standardsCsvFilename}
            data-testid="source-artifact-standards-export"
            style={{
              ...BUTTON_STYLE,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
              marginTop: 12,
              padding: '9px 12px',
              textDecoration: 'none',
            }}
          >
            Export standards CSV
          </a>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, minmax(82px, 1fr))',
            gap: 8,
            minWidth: 430,
          }}
        >
          {summaryItems.map(([label, value]) => (
            <div
              key={label}
              style={{
                border: `1px solid ${ANALYTICS.LINE_SOFT}`,
                borderRadius: 8,
                padding: '9px 10px',
                background: ANALYTICS.SOFT,
              }}
            >
              <div
                style={{
                  fontFamily: ANALYTICS.MONO,
                  color: ANALYTICS.MUTED,
                  fontSize: 9.5,
                  fontWeight: 900,
                  textTransform: 'uppercase',
                }}
              >
                {label}
              </div>
              <div
                style={{
                  marginTop: 4,
                  color: ANALYTICS.INK,
                  fontSize: 18,
                  fontWeight: 900,
                }}
              >
                {value}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div
        style={{
          marginTop: 16,
          border: `1px solid ${ANALYTICS.LINE_SOFT}`,
          borderRadius: 8,
          overflow: 'visible',
        }}
      >
        {rowsByStage.map((group) => (
          <LifecycleStageRows
            key={group.stageLabel}
            eventId={view.event.id}
            group={group}
            onClientFinalAccepted={onClientFinalAccepted}
          />
        ))}
      </div>
    </section>
  );
}

function LifecycleStageRows({
  eventId,
  group,
  onClientFinalAccepted,
}: {
  eventId: string;
  group: { stageLabel: string; rows: SourceArtifactLifecycleRow[] };
  onClientFinalAccepted: () => void;
}) {
  return (
    <div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '180px minmax(220px, 1fr) 180px 190px 180px',
          gap: 12,
          padding: '10px 12px',
          background: ANALYTICS.SOFT,
          borderTop: `1px solid ${ANALYTICS.LINE_SOFT}`,
          color: ANALYTICS.MUTED,
          fontFamily: ANALYTICS.MONO,
          fontSize: 10,
          fontWeight: 900,
          textTransform: 'uppercase',
        }}
      >
        <div>{group.stageLabel}</div>
        <div>Guideline / standard</div>
        <div>State</div>
        <div>Prompt / export</div>
        <div>Approval</div>
      </div>
      {group.rows.map((row) => (
        <div
          key={row.code}
          data-testid={`source-artifact-lifecycle-row-${row.code}`}
          style={{
            display: 'grid',
            gridTemplateColumns: '180px minmax(220px, 1fr) 180px 190px 180px',
            gap: 12,
            padding: '12px',
            borderTop: `1px solid ${ANALYTICS.LINE_SOFT}`,
            alignItems: 'start',
          }}
        >
          <div>
            <div style={{ fontWeight: 850, fontSize: 13 }}>{row.name}</div>
            <div
              style={{
                marginTop: 4,
                color: ANALYTICS.MUTED,
                fontFamily: ANALYTICS.MONO,
                fontSize: 10,
              }}
            >
              {row.code} · {row.requirementLabel} · {row.gateLabel}
            </div>
          </div>
          <div style={{ color: ANALYTICS.INK_2, fontSize: 12, lineHeight: 1.45 }}>
            <strong>{row.guidelineLabel}</strong>
            <div style={{ marginTop: 6, color: ANALYTICS.MUTED }}>
              {row.audienceLabel}
            </div>
            <div style={{ marginTop: 6 }}>{row.structureLabel}</div>
            <div style={{ marginTop: 6, color: ANALYTICS.MUTED }}>
              {row.pageGuidanceLabel}
            </div>
            <div style={{ marginTop: 6, color: ANALYTICS.MUTED }}>
              {row.controlsLabel}
            </div>
          </div>
          <div>
            <EvidenceBadge
              basis={row.lifecycleState === 'not_registered' ? 'missing' : 'live_artifact'}
              label={row.lifecycleLabel}
            />
            <div
              style={{
                marginTop: 8,
                color: ANALYTICS.INK_2,
                fontSize: 11.5,
                fontWeight: 800,
              }}
            >
              Quality {row.quality.score}/100
            </div>
            <div style={{ marginTop: 3, color: ANALYTICS.MUTED, fontSize: 11 }}>
              {row.quality.label}
            </div>
            <div
              data-testid={`source-artifact-content-quality-${row.code}`}
              style={{
                marginTop: 8,
                color: row.contentQuality.state === 'blocked' ? '#8A3A12' : ANALYTICS.INK_2,
                fontSize: 11.5,
                fontWeight: 800,
              }}
            >
              Content QA{' '}
              {row.contentQuality.score === null ? 'not scored' : `${row.contentQuality.score}/100`}
            </div>
            <div style={{ marginTop: 3, color: ANALYTICS.MUTED, fontSize: 11 }}>
              {row.contentQuality.label}
            </div>
            <div style={{ marginTop: 6, color: ANALYTICS.MUTED, fontSize: 11 }}>
              {row.familyLabel}
            </div>
          </div>
          <div style={{ color: ANALYTICS.MUTED, fontSize: 11.5, lineHeight: 1.45 }}>
            <strong style={{ color: ANALYTICS.INK_2 }}>{row.prompt.modelLabel}</strong>
            <br />
            {row.prompt.maxTokensLabel}
            <br />
            {row.exportFormatsLabel}
          </div>
          <div style={{ color: ANALYTICS.INK_2, fontSize: 12, lineHeight: 1.45 }}>
            <strong>{row.approvalLabel}</strong>
            <br />
            {row.governanceMessage}
            {row.quality.hardFails.length > 0 || row.quality.warnings.length > 0 ? (
              <div
                style={{
                  marginTop: 8,
                  color: row.quality.hardFails.length > 0 ? '#8A3A12' : ANALYTICS.MUTED,
                  fontSize: 11.5,
                }}
              >
                {row.quality.hardFails[0] ?? row.quality.warnings[0]}
              </div>
            ) : null}
            {row.contentQuality.state !== 'passed' ? (
              <div
                style={{
                  marginTop: 8,
                  color:
                    row.contentQuality.state === 'blocked' ? '#8A3A12' : ANALYTICS.MUTED,
                  fontSize: 11.5,
                }}
              >
                {row.contentQuality.blockers[0] ??
                  row.contentQuality.warnings[0] ??
                  row.contentQuality.nextAction}
              </div>
            ) : null}
            {row.lifecycleState === 'ai_draft' ? (
              <div style={{ marginTop: 10 }}>
                <AcceptClientFinalButton
                  eventId={eventId}
                  artifactCode={row.code}
                  artifactName={row.name}
                  hasGeneratedDraft
                  onAccepted={onClientFinalAccepted}
                />
              </div>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}

function groupLifecycleRows(rows: SourceArtifactLifecycleRow[]) {
  const groups = new Map<string, SourceArtifactLifecycleRow[]>();
  for (const row of rows) {
    const list = groups.get(row.stageLabel) ?? [];
    list.push(row);
    groups.set(row.stageLabel, list);
  }
  return Array.from(groups.entries()).map(([stageLabel, groupRows]) => ({
    stageLabel,
    rows: groupRows,
  }));
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

// Guidebook section bodies are authored Markdown (see
// SourceStageGuidebookSection.body's own type comment) — reuses the same
// react-markdown/remark-gfm/rehype-sanitize dependencies already bundled
// for AgentMarkdown (src/lib/agent/markdownRenderer.tsx), styled with this
// file's own ANALYTICS tokens rather than AgentMarkdown's chat-specific
// chart/citation overrides, which don't apply to facilitator content.
type GuidebookMarkdownComponents = NonNullable<
  ComponentPropsWithoutRef<typeof ReactMarkdown>['components']
>;

const GUIDEBOOK_MARKDOWN_COMPONENTS: GuidebookMarkdownComponents = {
  p: ({ children }) => (
    <p style={{ margin: '0 0 0.6em', fontSize: 14, lineHeight: 1.6, color: ANALYTICS.INK_2 }}>
      {children}
    </p>
  ),
  ul: ({ children }) => (
    <ul style={{ margin: '0 0 0.6em', paddingLeft: '1.3em', fontSize: 14, lineHeight: 1.6, color: ANALYTICS.INK_2 }}>
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol style={{ margin: '0 0 0.6em', paddingLeft: '1.3em', fontSize: 14, lineHeight: 1.6, color: ANALYTICS.INK_2 }}>
      {children}
    </ol>
  ),
  li: ({ children }) => <li style={{ margin: '0.15em 0' }}>{children}</li>,
  strong: ({ children }) => <strong style={{ fontWeight: 700, color: ANALYTICS.INK }}>{children}</strong>,
  em: ({ children }) => <em>{children}</em>,
  h1: ({ children }) => (
    <h4 style={{ fontFamily: ANALYTICS.SERIF, fontSize: 16, margin: '0.6em 0 0.3em', color: ANALYTICS.INK }}>{children}</h4>
  ),
  h2: ({ children }) => (
    <h4 style={{ fontFamily: ANALYTICS.SERIF, fontSize: 15, margin: '0.6em 0 0.3em', color: ANALYTICS.INK }}>{children}</h4>
  ),
  h3: ({ children }) => (
    <h4 style={{ fontFamily: ANALYTICS.SERIF, fontSize: 14, margin: '0.6em 0 0.3em', color: ANALYTICS.INK }}>{children}</h4>
  ),
  a: ({ children, href }) => (
    <a href={href} style={{ color: ANALYTICS.BLUE, textDecoration: 'underline' }}>
      {children}
    </a>
  ),
};

function GuidebookSectionBody({ body }: { body: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeSanitize]}
      components={GUIDEBOOK_MARKDOWN_COMPONENTS}
    >
      {body}
    </ReactMarkdown>
  );
}

function GuidebookWorkspace({ view }: { view: SourceEventShellView }) {
  const record = view.guidebook.record;
  return (
    <section data-testid="source-shell-v2-guidebook">
      <WorkspaceTitle
        eyebrow="Guidebook"
        title={record?.title ?? `${view.stage.label} facilitator guide`}
        subtitle={record?.purpose ?? 'Agenda and talking points for the working session that moves this stage to its gate.'}
      />
      {!record ? (
        <EmptyCard text={view.guidebook.emptyMessage} />
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          <div
            style={{
              display: 'flex',
              gap: 16,
              fontFamily: ANALYTICS.MONO,
              fontSize: 11,
              color: ANALYTICS.FAINT,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}
          >
            <span>{record.durationMinutes} min</span>
            <span>{record.clientKey ? 'Tenant guidebook' : 'Global default'}</span>
          </div>
          {record.sections.map((section, index) => (
            <article key={`${section.type}-${index}`} style={{ ...CARD_STYLE, padding: 18 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  justifyContent: 'space-between',
                  gap: 12,
                  marginBottom: 8,
                }}
              >
                <h3
                  style={{
                    fontFamily: ANALYTICS.SERIF,
                    margin: 0,
                    fontSize: 18,
                  }}
                >
                  {section.title}
                </h3>
                {section.timeBoxMinutes != null ? (
                  <span style={{ fontFamily: ANALYTICS.MONO, fontSize: 11, color: ANALYTICS.FAINT }}>
                    {section.timeBoxMinutes} min
                  </span>
                ) : null}
              </div>
              <GuidebookSectionBody body={section.body} />
            </article>
          ))}
        </div>
      )}
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

function AskAvaLauncher({
  open,
  onClick,
}: {
  open: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      data-testid="source-ask-ava-launcher"
      aria-expanded={open}
      onClick={onClick}
      style={{
        position: 'fixed',
        right: 24,
        bottom: 24,
        zIndex: 90,
        border: 'none',
        borderRadius: 999,
        background: ANALYTICS.TEAL_DEEP,
        color: '#fff',
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 10,
        padding: '11px 16px 11px 12px',
        boxShadow: '0 16px 36px rgba(10,10,11,0.22)',
        fontFamily: ANALYTICS.SANS,
        fontSize: 13,
        fontWeight: 800,
      }}
    >
      <span
        style={{
          width: 30,
          height: 30,
          borderRadius: 999,
          background: ANALYTICS.TEAL_BRIGHT,
          color: ANALYTICS.TEAL_DEEP,
          display: 'grid',
          placeItems: 'center',
          fontFamily: ANALYTICS.SERIF,
          fontWeight: 900,
        }}
      >
        a
      </span>
      <span>{open ? 'Close aVa' : 'Ask aVa'}</span>
    </button>
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
      <div style={{ marginTop: 9, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        <EvidenceBadge basis={item.sourceBasis} label={item.governanceLabel} />
        {item.needsComplianceReview ? (
          <span
            data-testid={`source-shell-file-compliance-flag-${item.id}`}
            style={{
              fontFamily: ANALYTICS.MONO,
              fontSize: 10,
              fontWeight: 800,
              padding: '3px 8px',
              borderRadius: 999,
              background: ANALYTICS.AMBER_TINT,
              color: ANALYTICS.AMBER_TEXT,
            }}
          >
            {item.complianceReviewLabel}
          </span>
        ) : null}
      </div>
      {item.governanceMessage ? (
        <div
          data-testid={`source-shell-file-governance-${item.id}`}
          style={{
            marginTop: 8,
            color: ANALYTICS.INK_2,
            fontSize: 11.5,
            lineHeight: 1.4,
          }}
        >
          {item.governanceMessage}
        </div>
      ) : null}
      {item.needsComplianceReview && item.complianceReviewMessage ? (
        <div
          data-testid={`source-shell-file-compliance-message-${item.id}`}
          style={{
            marginTop: 6,
            color: ANALYTICS.AMBER_TEXT,
            fontSize: 11.5,
            lineHeight: 1.4,
          }}
        >
          {item.complianceReviewMessage}
        </div>
      ) : null}
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
  badge,
  active,
  onClick,
}: {
  label: string;
  badge?: string;
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
      <span style={{ color: badge ? ANALYTICS.FAINT : ANALYTICS.AMBER_TEXT }}>
        {badge ?? '•'}
      </span>
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
