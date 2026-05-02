'use client';

import type { CSSProperties } from 'react';
import Link from 'next/link';
import { AtlasDrawer } from '@/components/shell/AtlasDrawer';
import { useAtlasPageState } from '@/components/shell/AtlasPageStateProvider';
import type { Artifact, SourceEventCreatedArtifact, SourcingStageProgressArtifact } from '@/lib/agent/artifacts';
import { SHELL } from '@/lib/shell/shell-tokens';
import type { SourcingEventSummary } from '@/lib/source/types';
import { formatSourceFinancialValue } from '@/lib/source/financial-display';

interface SourcePortfolioAgentCanvasProps {
  quote: string;
  events: SourcingEventSummary[];
  activeStage: string | null;
  activeStatus: string | null;
  artifacts: Artifact[];
  onArtifact: (artifact: Artifact) => void;
  canViewFinancialValues?: boolean;
}

const NEXUS_AGENT = {
  initials: 'Nx',
  name: 'Nexus',
  role: 'Source Orchestrator',
} as const;

export function SourcePortfolioAgentCanvas({
  quote,
  events,
  activeStage,
  activeStatus,
  artifacts,
  onArtifact,
  canViewFinancialValues = true,
}: SourcePortfolioAgentCanvasProps) {
  const activeEvents = events.filter((event) => event.status === 'active').length;
  const blockedEvents = events.filter((event) => event.isAtRisk || event.blocker).length;
  const valueAtStake = events.reduce((sum, event) => sum + event.valueAtStakeUsd, 0);

  return (
    <section
      data-testid="source-portfolio-agent-canvas"
      aria-label="Agent-led Source command workspace"
      style={AGENT_CANVAS}
    >
      <div style={CHAT_COLUMN}>
        <AtlasDrawer
          embedded
          isOpen={true}
          onClose={() => {
            // Embedded Source command workspace stays visible; it is not a drawer overlay.
          }}
          agent={NEXUS_AGENT}
          quote={quote}
          surface="/source"
          onArtifact={onArtifact}
          composerPlacement="afterHeader"
          conversationWindow={8}
          emptyState={<SourcePortfolioPromptDeck events={events} />}
        />
      </div>

      <aside aria-label="Source reasoning and evidence pane" style={REASONING_COLUMN}>
        <SourceFormationPanel
          events={events}
          activeStage={activeStage}
          activeStatus={activeStatus}
          artifacts={artifacts}
          activeEvents={activeEvents}
          blockedEvents={blockedEvents}
          valueAtStake={valueAtStake}
          canViewFinancialValues={canViewFinancialValues}
        />
      </aside>
    </section>
  );
}

function SourcePortfolioPromptDeck({ events }: { events: SourcingEventSummary[] }) {
  const pageState = useAtlasPageState();
  const amsEvent = events.find((event) =>
    `${event.name} ${event.archetype}`.toLowerCase().includes('ams')
    || `${event.name} ${event.archetype}`.toLowerCase().includes('managed services')
    || `${event.name}`.toLowerCase().includes('application')
  );
  const choices = [
    {
      label: 'AMS outsourcing',
      prompt: 'Create a Source event for AMS outsourcing. Ask me one question: what scope boundary must we lock first?',
    },
    {
      label: 'Cloud or infrastructure',
      prompt: 'Create a Source event for cloud or infrastructure sourcing. Ask me one question to define the trigger.',
    },
    {
      label: 'Data / AI platform',
      prompt: 'Create a Source event for a data or AI platform decision. Ask me one question to name the decision owner.',
    },
    {
      label: 'Enterprise software',
      prompt: 'Create a Source event for enterprise software selection. Ask me one question to capture baseline evidence.',
    },
    {
      label: 'Something else',
      prompt: 'Help me shape a different IT sourcing event. Ask me for the first missing fact only.',
    },
  ];

  const sendChoice = (prompt: string) => {
    pageState?.ask(prompt);
  };

  return (
    <div style={CHOICE_DECK}>
      <div style={CHOICE_HEADER}>
        <div style={DARK_EYEBROW}>Start with one move</div>
        <p style={CHOICE_LEAD}>
          Pick a path. Nexus will keep it crisp: one question, then the readiness rail updates.
        </p>
      </div>

      <div style={CHOICE_GRID}>
        {choices.map((choice) => (
          <button
            key={choice.label}
            type="button"
            onClick={() => sendChoice(choice.prompt)}
            disabled={!pageState || pageState.isStreaming}
            style={{
              ...CHOICE_BUTTON,
              opacity: pageState?.isStreaming ? 0.55 : 1,
              cursor: !pageState || pageState.isStreaming ? 'not-allowed' : 'pointer',
            }}
          >
            {choice.label}
          </button>
        ))}
      </div>

      <div style={CHOICE_FOOTER}>
        <Link href="/source/new" style={DARK_ACTION}>
          Open event form
        </Link>
        {amsEvent ? (
          <Link href={`/source/events/${amsEvent.id}`} style={DARK_ACTION}>
            Open seeded AMS
          </Link>
        ) : null}
      </div>
    </div>
  );
}

function SourceFormationPanel({
  events,
  activeStage,
  activeStatus,
  artifacts,
  activeEvents,
  blockedEvents,
  valueAtStake,
  canViewFinancialValues,
}: {
  events: SourcingEventSummary[];
  activeStage: string | null;
  activeStatus: string | null;
  artifacts: Artifact[];
  activeEvents: number;
  blockedEvents: number;
  valueAtStake: number;
  canViewFinancialValues: boolean;
}) {
  const topEvent = selectTopEvent(events);
  const progressCards = artifacts.filter(
    (artifact): artifact is SourcingStageProgressArtifact => artifact.type === 'sourcing-stage-progress',
  );
  const createdEvent = [...artifacts].reverse().find(
    (artifact): artifact is SourceEventCreatedArtifact => artifact.type === 'source-event-created',
  );
  const readiness = Math.min(90, 35 + (progressCards.length * 15) + (topEvent ? 10 : 0));
  const filterLabel = [activeStage, activeStatus].filter(Boolean).join(' / ') || 'all IT sourcing';
  const knownRows = [
    { label: 'Portfolio', value: `${events.length} events in view` },
    { label: 'Top event', value: topEvent?.name ?? 'Not selected yet' },
    { label: 'Category', value: topEvent?.archetype ?? 'IT sourcing only' },
  ];
  const missingRows = [
    { label: 'Trigger', done: progressCards.some((artifact) => artifact.label.toLowerCase().includes('trigger')) },
    { label: 'Decision owner', done: progressCards.some((artifact) => artifact.label.toLowerCase().includes('owner')) },
    { label: 'Scope boundary', done: progressCards.some((artifact) => artifact.label.toLowerCase().includes('scope')) },
    { label: 'Baseline evidence', done: progressCards.some((artifact) => artifact.label.toLowerCase().includes('evidence')) },
    { label: 'Stop / approval', done: progressCards.some((artifact) => artifact.label.toLowerCase().includes('approval')) },
  ];

  return (
    <section style={FORMATION_CARD} aria-label="Source event formation status">
      <div style={FORMATION_HEADER}>
        <div>
          <div style={EYEBROW}>Event formation - live</div>
          <h2 style={FORMATION_TITLE}>{readiness}% shaped</h2>
        </div>
        <div style={FORMATION_BADGE}>Right rail</div>
      </div>
      <div aria-hidden="true" style={PROGRESS_TRACK}>
        <div style={{ ...PROGRESS_BAR, width: `${readiness}%` }} />
      </div>
      <p style={INTRO_COPY}>
        As Nexus asks questions, this rail tracks the event shape: what is known, what is missing, and what
        unlocks the next gate.
      </p>

      <div style={METRIC_GRID}>
        <ReasoningMetric label="Active" value={String(activeEvents)} />
        <ReasoningMetric label="Blocked" value={String(blockedEvents)} />
        <ReasoningMetric label="Value" value={formatSourceFinancialValue(valueAtStake, canViewFinancialValues)} />
      </div>

      <div style={FORMATION_SECTION}>
        <div style={FORMATION_SECTION_TITLE}>Known now</div>
        {knownRows.map((row) => (
          <div key={row.label} style={FORMATION_ROW}>
            <span>{row.label}</span>
            <strong>{row.value}</strong>
          </div>
        ))}
      </div>

      <div style={FORMATION_SECTION}>
        <div style={FORMATION_SECTION_TITLE}>Still needed</div>
        <div style={CHECK_GRID}>
          {missingRows.map((row) => (
            <span key={row.label} style={row.done ? CHECK_DONE : CHECK_TODO}>
              {row.done ? 'Done:' : 'Todo:'} {row.label}
            </span>
          ))}
        </div>
      </div>

      <div style={NEXT_MOVE_CARD}>
        <div style={FORMATION_SECTION_TITLE}>Next move</div>
        <p style={NEXT_MOVE_COPY}>
          {createdEvent
            ? `${createdEvent.eventCode}: tenant admin approval is next. Then decision owner and sourcing lead co-sign S0 exit.`
            : topEvent
            ? `${topEvent.currentStageLabel}: ${topEvent.nextAction}.`
            : `Pick a sourcing type for ${filterLabel}, then Nexus will ask for the first missing fact.`}
        </p>
        {createdEvent ? (
          <a href={createdEvent.approvalUrl ?? '/source/events'} style={APPROVAL_LINK}>
            Open approval queue
          </a>
        ) : null}
      </div>
    </section>
  );
}

function ReasoningMetric({ label, value }: { label: string; value: string }) {
  return (
    <div style={METRIC_CARD}>
      <div style={METRIC_LABEL}>{label}</div>
      <div style={METRIC_VALUE}>{value}</div>
    </div>
  );
}

function selectTopEvent(events: SourcingEventSummary[]): SourcingEventSummary | null {
  return [...events].sort((left, right) => {
    if (Number(right.isAtRisk) !== Number(left.isAtRisk)) return Number(right.isAtRisk) - Number(left.isAtRisk);
    if (right.openAlerts !== left.openAlerts) return right.openAlerts - left.openAlerts;
    return right.valueAtStakeUsd - left.valueAtStakeUsd;
  })[0] ?? null;
}

const AGENT_CANVAS: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1.7fr) minmax(min(100%, 360px), 1fr)',
  gap: 12,
  alignItems: 'stretch',
  minHeight: 430,
  height: 'min(590px, calc(100vh - 210px))',
  marginBottom: 12,
};

const CHAT_COLUMN: CSSProperties = {
  minWidth: 0,
  minHeight: 430,
  height: '100%',
  display: 'grid',
};

const REASONING_COLUMN: CSSProperties = {
  minWidth: 0,
  minHeight: 0,
  display: 'grid',
  alignContent: 'start',
  gap: 10,
};

const EYEBROW: CSSProperties = {
  fontFamily: SHELL.MONO,
  fontSize: 9.5,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: SHELL.INK_MUTED,
  fontWeight: 800,
};

const INTRO_COPY: CSSProperties = {
  margin: '10px 0 0',
  fontFamily: SHELL.SANS,
  fontSize: 13,
  lineHeight: 1.5,
  color: SHELL.INK_SOFT,
};

const METRIC_GRID: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  gap: 8,
  marginTop: 12,
};

const METRIC_CARD: CSSProperties = {
  border: '1px solid ' + SHELL.CARD_LINE,
  borderRadius: 10,
  background: SHELL.PAPER_SOFT,
  padding: '8px 9px',
};

const METRIC_LABEL: CSSProperties = {
  fontFamily: SHELL.MONO,
  fontSize: 8,
  letterSpacing: '0.10em',
  textTransform: 'uppercase',
  color: SHELL.INK_MUTED,
  fontWeight: 800,
};

const METRIC_VALUE: CSSProperties = {
  marginTop: 4,
  fontFamily: SHELL.SERIF,
  fontSize: 19,
  lineHeight: 1,
  color: SHELL.INK,
  fontWeight: 800,
};

const CHOICE_DECK: CSSProperties = {
  width: '100%',
  display: 'grid',
  gap: 11,
  padding: '0 0 8px',
};

const CHOICE_HEADER: CSSProperties = {
  border: '1px solid rgba(250,247,241,0.12)',
  borderRadius: 12,
  background: 'rgba(250,247,241,0.055)',
  padding: '10px 12px',
};

const DARK_EYEBROW: CSSProperties = {
  fontFamily: SHELL.MONO,
  fontSize: 8.5,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'rgba(250,247,241,0.48)',
  fontWeight: 700,
};

const CHOICE_LEAD: CSSProperties = {
  margin: '6px 0 0',
  fontFamily: SHELL.SERIF,
  fontSize: 14,
  lineHeight: 1.36,
  color: 'rgba(250,247,241,0.88)',
};

const DARK_ACTION: CSSProperties = {
  display: 'inline-flex',
  marginTop: 10,
  borderRadius: 999,
  border: '1px solid rgba(250,247,241,0.22)',
  background: 'rgba(250,247,241,0.08)',
  color: 'rgba(250,247,241,0.92)',
  padding: '7px 10px',
  fontFamily: SHELL.MONO,
  fontSize: 9.5,
  fontWeight: 800,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  textDecoration: 'none',
};

const CHOICE_GRID: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 145px), 1fr))',
  gap: 8,
};

const CHOICE_BUTTON: CSSProperties = {
  border: '1px solid rgba(250,247,241,0.10)',
  borderRadius: 999,
  padding: '9px 11px',
  background: 'rgba(250,247,241,0.065)',
  color: 'rgba(250,247,241,0.9)',
  fontFamily: SHELL.MONO,
  fontSize: 9.5,
  fontWeight: 800,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
};

const CHOICE_FOOTER: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
};

const FORMATION_CARD: CSSProperties = {
  border: '1px solid rgba(12, 26, 58, 0.12)',
  borderRadius: 14,
  background: SHELL.CARD_WHITE,
  padding: '14px 15px',
  display: 'grid',
  gap: 11,
  boxShadow: '0 18px 42px rgba(12,26,58,0.06)',
};

const FORMATION_HEADER: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: 12,
};

const FORMATION_TITLE: CSSProperties = {
  margin: '4px 0 0',
  fontFamily: SHELL.SERIF,
  fontSize: 28,
  lineHeight: 1,
  color: SHELL.INK,
};

const FORMATION_BADGE: CSSProperties = {
  border: '1px solid rgba(15,118,110,0.22)',
  borderRadius: 999,
  background: 'rgba(15,118,110,0.08)',
  color: '#0F766E',
  padding: '5px 8px',
  fontFamily: SHELL.MONO,
  fontSize: 8.5,
  fontWeight: 800,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
};

const PROGRESS_TRACK: CSSProperties = {
  height: 7,
  borderRadius: 999,
  background: 'rgba(12,26,58,0.08)',
  overflow: 'hidden',
};

const PROGRESS_BAR: CSSProperties = {
  height: '100%',
  borderRadius: 999,
  background: 'linear-gradient(90deg, #0F766E 0%, #D97706 100%)',
};

const FORMATION_SECTION: CSSProperties = {
  display: 'grid',
  gap: 7,
};

const FORMATION_SECTION_TITLE: CSSProperties = {
  fontFamily: SHELL.MONO,
  fontSize: 8.5,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: SHELL.INK_MUTED,
  fontWeight: 800,
};

const FORMATION_ROW: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '98px minmax(0, 1fr)',
  gap: 8,
  fontFamily: SHELL.SANS,
  fontSize: 12.2,
  lineHeight: 1.3,
  color: SHELL.INK_SOFT,
};

const CHECK_GRID: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 6,
};

const CHECK_TODO: CSSProperties = {
  border: '1px solid rgba(12,26,58,0.12)',
  borderRadius: 999,
  background: SHELL.PAPER_SOFT,
  padding: '5px 8px',
  fontFamily: SHELL.SANS,
  fontSize: 11.8,
  color: SHELL.INK_SOFT,
};

const CHECK_DONE: CSSProperties = {
  ...CHECK_TODO,
  border: '1px solid rgba(15,118,110,0.22)',
  background: 'rgba(15,118,110,0.08)',
  color: '#0F766E',
  fontWeight: 800,
};

const NEXT_MOVE_CARD: CSSProperties = {
  border: '1px solid rgba(217,119,6,0.22)',
  borderRadius: 12,
  background: 'rgba(217,119,6,0.08)',
  padding: '10px 11px',
};

const NEXT_MOVE_COPY: CSSProperties = {
  margin: '6px 0 0',
  fontFamily: SHELL.SANS,
  fontSize: 12.5,
  lineHeight: 1.45,
  color: SHELL.INK,
};

const APPROVAL_LINK: CSSProperties = {
  marginTop: 8,
  display: 'inline-flex',
  width: 'fit-content',
  borderRadius: 999,
  border: '1px solid rgba(12, 26, 58, 0.16)',
  padding: '6px 10px',
  fontFamily: SHELL.MONO,
  fontSize: 9,
  fontWeight: 800,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: SHELL.INK,
  textDecoration: 'none',
  background: 'rgba(253, 251, 246, 0.72)',
};
