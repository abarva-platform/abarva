// AG11 - Agent Mission Panel server component.
//
// Renders the AbarVa Agent Activity UI Pattern (File 16) across five
// variants: compact_strip, right_panel, inline_recommendation,
// executive_brief, and hidden_drawer. The component is a server
// component only - no client hooks, no client directive, no live
// runtime calls. Open/close drawer state is NOT managed here; the
// hidden_drawer variant renders a closed shell with aria-expanded
// "false".
//
// All variants:
// - Calm, mostly white/off-white surfaces.
// - NAVY accent only (per File 16 visual rules).
// - No avatars, no icons larger than 16x16, no emoji.
// - Mission count over feed.
// - Honest disclaimer always visible.
// - Recommended actions render as text (no live click).
//
// Source data must come from src/lib/agents/agent-mission-view (the
// AG11 view-model). AG10 (live mission queue) integration is deferred.

import {
  BORDER,
  COLORS,
  FONT,
  RADIUS,
  SPACING,
} from '@/lib/design/abarva-theme';
import { AgentBadge } from '@/components/abarva/AgentBadge';
import {
  agentDisplayLabel,
  priorityChipLabel,
  stateChipLabel,
  summarizeAgentMissionPanelView,
  type AgentMissionPanelMission,
  type AgentMissionPanelPriority,
  type AgentMissionPanelView,
} from '@/lib/agents/agent-mission-view';

export interface AgentMissionPanelProps {
  view: AgentMissionPanelView;
}

// ---------------------------------------------------------------------
// Shared chip primitives
// ---------------------------------------------------------------------

function PriorityChip({ priority }: { priority: AgentMissionPanelPriority }) {
  const isHigh = priority === 'critical' || priority === 'high';
  const fg = isHigh ? COLORS.navy : COLORS.muted;
  const bg = isHigh ? COLORS.navySoft : 'rgba(82, 88, 102, 0.10)';
  return (
    <span
      data-priority={priority}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        fontFamily: FONT.mono,
        fontSize: 10,
        fontWeight: 500,
        letterSpacing: '0.10em',
        textTransform: 'uppercase',
        color: fg,
        background: bg,
        border: BORDER.hairlineSoft,
        borderRadius: RADIUS.pill,
        padding: '2px 8px',
        lineHeight: 1.4,
        whiteSpace: 'nowrap',
      }}
    >
      {priorityChipLabel(priority)}
    </span>
  );
}

function StateChip({
  state,
}: {
  state: AgentMissionPanelMission['state'];
}) {
  return (
    <span
      data-state={state}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        fontFamily: FONT.mono,
        fontSize: 10,
        fontWeight: 500,
        letterSpacing: '0.10em',
        textTransform: 'uppercase',
        color: COLORS.muted,
        background: COLORS.surface2,
        border: BORDER.hairlineSoft,
        borderRadius: RADIUS.pill,
        padding: '2px 8px',
        lineHeight: 1.4,
        whiteSpace: 'nowrap',
      }}
    >
      {stateChipLabel(state)}
    </span>
  );
}

function TypeChip({ type }: { type: AgentMissionPanelMission['type'] }) {
  return (
    <span
      data-mission-type={type}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        fontFamily: FONT.mono,
        fontSize: 10,
        fontWeight: 500,
        letterSpacing: '0.10em',
        textTransform: 'uppercase',
        color: COLORS.muted,
        background: COLORS.card,
        border: BORDER.hairlineSoft,
        borderRadius: RADIUS.pill,
        padding: '2px 8px',
        lineHeight: 1.4,
        whiteSpace: 'nowrap',
      }}
    >
      {type.replace(/_/g, ' ')}
    </span>
  );
}

function HonestDisclaimer({ text }: { text: string }) {
  return (
    <p
      data-honest-disclaimer="true"
      style={{
        margin: 0,
        marginTop: SPACING.sm,
        fontFamily: FONT.mono,
        fontSize: 10,
        letterSpacing: '0.10em',
        textTransform: 'uppercase',
        color: COLORS.mutedSoft,
        lineHeight: 1.4,
      }}
    >
      {text}
    </p>
  );
}

function MissionCount({ count, surfaceLabel }: { count: number; surfaceLabel: string }) {
  return (
    <div
      data-mission-count="true"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: SPACING.sm,
        fontFamily: FONT.mono,
        fontSize: 10,
        fontWeight: 500,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color: COLORS.muted,
      }}
    >
      <span>{surfaceLabel}</span>
      <span aria-hidden="true" style={{ opacity: 0.5 }}>·</span>
      <span>
        {count} {count === 1 ? 'mission' : 'missions'} queued
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------
// Compact strip variant
// ---------------------------------------------------------------------

function CompactStrip({ view }: { view: AgentMissionPanelView }) {
  const summary = summarizeAgentMissionPanelView(view);
  const top = view.missions[0];
  return (
    <section
      data-agent-mission-panel="ag11"
      data-agent-mission-panel-variant="compact_strip"
      aria-label={view.surfaceLabel}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        background: COLORS.card,
        border: BORDER.hairline,
        borderRadius: RADIUS.md,
        padding: `${SPACING.sm}px ${SPACING.lg}px`,
        fontFamily: FONT.body,
        color: COLORS.body,
        maxHeight: 60,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: SPACING.md,
        }}
      >
        <MissionCount count={summary.totalMissions} surfaceLabel={view.surfaceLabel} />
        {view.missions.map((mission) => (
          <span
            key={mission.id}
            data-mission-id={mission.id}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: SPACING.xs,
              fontFamily: FONT.mono,
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: '0.10em',
              textTransform: 'uppercase',
              color: COLORS.muted,
            }}
          >
            <AgentBadge agent={mission.agent} status={mission.type.replace(/_/g, ' ')} />
          </span>
        ))}
        {top ? (
          <span
            style={{
              fontFamily: FONT.body,
              fontSize: 12,
              color: COLORS.body,
              lineHeight: 1.4,
              flex: '1 1 200px',
              minWidth: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            <strong style={{ color: COLORS.ink, fontWeight: 600 }}>
              {agentDisplayLabel(top.agent)}
            </strong>
            <span aria-hidden="true" style={{ opacity: 0.5, padding: '0 6px' }}>
              ·
            </span>
            {top.workObjectLabel}
          </span>
        ) : null}
      </div>
      <HonestDisclaimer text={view.honestDisclaimer} />
    </section>
  );
}

// ---------------------------------------------------------------------
// Right panel variant
// ---------------------------------------------------------------------

function MissionCard({ mission }: { mission: AgentMissionPanelMission }) {
  return (
    <article
      data-mission-id={mission.id}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: SPACING.sm,
        background: COLORS.card,
        border: BORDER.hairlineSoft,
        borderRadius: RADIUS.md,
        padding: SPACING.md,
      }}
    >
      <header
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: SPACING.xs,
        }}
      >
        <AgentBadge agent={mission.agent} status={mission.state} />
        <TypeChip type={mission.type} />
        <PriorityChip priority={mission.priority} />
        <StateChip state={mission.state} />
      </header>
      <div
        style={{
          fontFamily: FONT.body,
          fontSize: 13,
          fontWeight: 600,
          color: COLORS.ink,
          lineHeight: 1.35,
        }}
      >
        {mission.workObjectLabel}
      </div>
      <p
        style={{
          margin: 0,
          fontFamily: FONT.body,
          fontSize: 13,
          color: COLORS.body,
          lineHeight: 1.45,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {mission.rationale}
      </p>
      <div
        style={{
          background: COLORS.surface2,
          border: BORDER.hairlineSoft,
          borderLeft: `3px solid ${COLORS.navy}`,
          borderRadius: RADIUS.sm,
          padding: `${SPACING.xs}px ${SPACING.sm}px`,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        <span
          style={{
            fontFamily: FONT.mono,
            fontSize: 9,
            fontWeight: 500,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: COLORS.navy,
          }}
        >
          recommended action
        </span>
        <span
          style={{
            fontFamily: FONT.body,
            fontSize: 13,
            fontWeight: 500,
            color: COLORS.ink,
            lineHeight: 1.45,
          }}
        >
          {mission.recommendedAction}
        </span>
      </div>
      <div
        style={{
          fontFamily: FONT.mono,
          fontSize: 9,
          letterSpacing: '0.10em',
          textTransform: 'uppercase',
          color: COLORS.mutedSoft,
        }}
      >
        stops when · {mission.stopCondition}
      </div>
    </article>
  );
}

function RightPanel({ view }: { view: AgentMissionPanelView }) {
  const summary = summarizeAgentMissionPanelView(view);
  return (
    <section
      data-agent-mission-panel="ag11"
      data-agent-mission-panel-variant="right_panel"
      aria-label={view.surfaceLabel}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: SPACING.md,
        background: COLORS.surface,
        border: BORDER.hairline,
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
        fontFamily: FONT.body,
        color: COLORS.body,
        width: '100%',
        maxWidth: 320,
      }}
    >
      <header
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: SPACING.xs,
        }}
      >
        <MissionCount count={summary.totalMissions} surfaceLabel={view.surfaceLabel} />
      </header>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: SPACING.sm,
        }}
      >
        {view.missions.map((mission) => (
          <MissionCard key={mission.id} mission={mission} />
        ))}
      </div>
      <HonestDisclaimer text={view.honestDisclaimer} />
    </section>
  );
}

// ---------------------------------------------------------------------
// Inline recommendation variant
// ---------------------------------------------------------------------

function InlineRecommendation({ view }: { view: AgentMissionPanelView }) {
  const mission = view.missions[0];
  return (
    <section
      data-agent-mission-panel="ag11"
      data-agent-mission-panel-variant="inline_recommendation"
      aria-label={view.surfaceLabel}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: SPACING.xs,
        background: COLORS.card,
        border: BORDER.hairlineSoft,
        borderLeft: `3px solid ${COLORS.navy}`,
        borderRadius: RADIUS.md,
        padding: `${SPACING.sm}px ${SPACING.md}px`,
        fontFamily: FONT.body,
        color: COLORS.body,
      }}
    >
      {mission ? (
        <>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: SPACING.sm,
              flexWrap: 'wrap',
            }}
          >
            <AgentBadge agent={mission.agent} status={mission.type.replace(/_/g, ' ')} />
            <PriorityChip priority={mission.priority} />
          </div>
          <p
            style={{
              margin: 0,
              fontSize: 13,
              color: COLORS.body,
              lineHeight: 1.45,
              display: '-webkit-box',
              WebkitLineClamp: 1,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {mission.rationale}
          </p>
          <div
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: COLORS.ink,
              lineHeight: 1.45,
            }}
          >
            {mission.recommendedAction}
          </div>
        </>
      ) : (
        <p style={{ margin: 0, fontSize: 13, color: COLORS.muted }}>
          No agent recommendation right now.
        </p>
      )}
      <HonestDisclaimer text={view.honestDisclaimer} />
    </section>
  );
}

// ---------------------------------------------------------------------
// Executive brief variant
// ---------------------------------------------------------------------

function ExecutiveBrief({ view }: { view: AgentMissionPanelView }) {
  const summary = summarizeAgentMissionPanelView(view);
  const topThree = view.missions.slice(0, 3);
  return (
    <section
      data-agent-mission-panel="ag11"
      data-agent-mission-panel-variant="executive_brief"
      aria-label={view.surfaceLabel}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: SPACING.lg,
        background: COLORS.card,
        border: BORDER.hairline,
        borderTop: `3px solid ${COLORS.navy}`,
        borderRadius: RADIUS.lg,
        padding: SPACING.xxl,
        fontFamily: FONT.body,
        color: COLORS.body,
      }}
    >
      <header
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: SPACING.xs,
        }}
      >
        <span
          style={{
            fontFamily: FONT.mono,
            fontSize: 10,
            fontWeight: 500,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: COLORS.muted,
          }}
        >
          executive brief · agents
        </span>
        <h2
          style={{
            margin: 0,
            fontSize: 22,
            fontWeight: 600,
            letterSpacing: '-0.01em',
            lineHeight: 1.25,
            color: COLORS.ink,
          }}
        >
          {view.surfaceLabel}
        </h2>
      </header>
      <div
        data-summary-stat-row="true"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: SPACING.lg,
          padding: `${SPACING.sm}px 0`,
          borderTop: BORDER.hairlineSoft,
          borderBottom: BORDER.hairlineSoft,
        }}
      >
        <SummaryStat label="Missions queued" value={String(summary.totalMissions)} />
        <SummaryStat label="Critical" value={String(summary.byPriority.critical)} />
        <SummaryStat label="High" value={String(summary.byPriority.high)} />
        <SummaryStat label="Agents" value={String(countDistinctAgents(view))} />
      </div>
      <ol
        style={{
          margin: 0,
          padding: 0,
          listStyle: 'none',
          display: 'flex',
          flexDirection: 'column',
          gap: SPACING.md,
        }}
      >
        {topThree.map((mission, index) => (
          <li
            key={mission.id}
            data-mission-id={mission.id}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: SPACING.xs,
              padding: `${SPACING.sm}px 0`,
              borderTop: index === 0 ? 'none' : BORDER.hairlineSoft,
            }}
          >
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: SPACING.sm,
              }}
            >
              <AgentBadge agent={mission.agent} status="brief" />
              <PriorityChip priority={mission.priority} />
            </div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: COLORS.ink,
                lineHeight: 1.35,
              }}
            >
              Decision · {mission.workObjectLabel}
            </div>
            <p
              style={{
                margin: 0,
                fontSize: 13,
                color: COLORS.body,
                lineHeight: 1.5,
              }}
            >
              {mission.rationale}
            </p>
            <div
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: COLORS.navy,
                lineHeight: 1.45,
              }}
            >
              Recommended · {mission.recommendedAction}
            </div>
          </li>
        ))}
      </ol>
      <HonestDisclaimer text={view.honestDisclaimer} />
    </section>
  );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        minWidth: 80,
      }}
    >
      <span
        style={{
          fontFamily: FONT.body,
          fontSize: 22,
          fontWeight: 600,
          color: COLORS.ink,
          lineHeight: 1.1,
        }}
      >
        {value}
      </span>
      <span
        style={{
          fontFamily: FONT.mono,
          fontSize: 9,
          fontWeight: 500,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: COLORS.muted,
        }}
      >
        {label}
      </span>
    </div>
  );
}

function countDistinctAgents(view: AgentMissionPanelView): number {
  const seen = new Set<AgentMissionPanelMission['agent']>();
  for (const mission of view.missions) {
    seen.add(mission.agent);
  }
  return seen.size;
}

// ---------------------------------------------------------------------
// Hidden drawer variant (closed shell)
// ---------------------------------------------------------------------

function HiddenDrawer({ view }: { view: AgentMissionPanelView }) {
  const summary = summarizeAgentMissionPanelView(view);
  return (
    <section
      data-agent-mission-panel="ag11"
      data-agent-mission-panel-variant="hidden_drawer"
      aria-label={view.surfaceLabel}
      aria-expanded="false"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: SPACING.md,
        background: COLORS.card,
        border: BORDER.hairline,
        borderRadius: RADIUS.md,
        padding: `${SPACING.sm}px ${SPACING.md}px`,
        fontFamily: FONT.body,
        color: COLORS.body,
      }}
    >
      <span
        aria-hidden="true"
        style={{
          width: 8,
          height: 8,
          borderRadius: RADIUS.pill,
          background: COLORS.navy,
          flex: '0 0 auto',
        }}
      />
      <span
        style={{
          fontFamily: FONT.mono,
          fontSize: 11,
          fontWeight: 500,
          letterSpacing: '0.10em',
          textTransform: 'uppercase',
          color: COLORS.muted,
        }}
      >
        {summary.totalMissions} missions queued
      </span>
      <span
        style={{
          flex: '1 1 auto',
          textAlign: 'right',
          fontFamily: FONT.mono,
          fontSize: 9,
          letterSpacing: '0.10em',
          textTransform: 'uppercase',
          color: COLORS.mutedSoft,
        }}
      >
        drawer collapsed · open deferred
      </span>
      <HonestDisclaimer text={view.honestDisclaimer} />
    </section>
  );
}

// ---------------------------------------------------------------------
// Public component
// ---------------------------------------------------------------------

export function AgentMissionPanel({ view }: AgentMissionPanelProps) {
  if (view.variant === 'compact_strip') {
    return <CompactStrip view={view} />;
  }
  if (view.variant === 'right_panel') {
    return <RightPanel view={view} />;
  }
  if (view.variant === 'inline_recommendation') {
    return <InlineRecommendation view={view} />;
  }
  if (view.variant === 'executive_brief') {
    return <ExecutiveBrief view={view} />;
  }
  return <HiddenDrawer view={view} />;
}
