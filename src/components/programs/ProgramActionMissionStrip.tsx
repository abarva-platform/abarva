'use client';

// PROG14 · Program Action / Agent Mission / Resume Strip.
//
// Compact, calm strip surfaced on a program detail page. Renders:
//   - A "Resume" mini-callout pointing at the last open work item.
//   - The next three actions, each owned by a single agent.
//   - The four canonical agent missions
//     (Nexus, Sentinel, Atlas, Steward), one row per agent.
//   - A short list of currently blocked / deferred items.
//
// The strip is read-only: no live execution, no writes, no chat feed,
// no large avatars. Agent badges are subtle text chips. Colors are
// drawn from the AbarVa canon (off-white / white / navy accent only;
// no teal, green, purple, or neon).

import {
  buildProgramActionMissionStripView,
  type AgentMissionRow,
  type BlockedItem,
  type ProgramActionMissionStripViewModel,
  type ProgramTopAction,
  type StripActionState,
  type StripAgentKey,
} from '@/lib/programs/program-action-mission-strip-view';

export interface ProgramActionMissionStripProps {
  programLabel?: string;
}

// ---------------------------------------------------------------------
// Canon palette (kept local so this strip never accidentally takes
// a stray color from a partner module).
// ---------------------------------------------------------------------

const SURFACE = '#FBFAF7';
const CARD = '#FFFFFF';
const BORDER = '#E8E6E1';
const INK = '#0A0C12';
const BODY = '#1F2433';
const MUTED = '#525866';
const NAVY = '#1B2B5C';
const NAVY_SOFT = '#F0F4FA';
const AMBER_BG = '#FAF1DD';
const AMBER_FG = '#7A5A12';
const RED_BG = '#F6E1DE';
const RED_FG = '#7A2A1F';
const GRAY_BG = '#EFEDE8';
const GRAY_FG = '#525866';

const FONT_BODY =
  '"DM Sans", system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

// ---------------------------------------------------------------------
// Agent label resolver — text-only, calm, no avatars.
// ---------------------------------------------------------------------

const AGENT_LABEL: Record<StripAgentKey, string> = {
  nexus: 'Nexus',
  sentinel: 'Sentinel',
  atlas: 'Atlas',
  steward: 'Steward',
};

function agentLabel(agent: StripAgentKey): string {
  return AGENT_LABEL[agent];
}

// ---------------------------------------------------------------------
// State chip palette (canon-only; navy / amber / red-muted / gray).
// ---------------------------------------------------------------------

interface ChipPalette {
  background: string;
  color: string;
  border: string;
  label: string;
}

function stateChipPalette(state: StripActionState): ChipPalette {
  if (state === 'next') {
    return {
      background: NAVY_SOFT,
      color: NAVY,
      border: NAVY,
      label: 'Next',
    };
  }
  if (state === 'in-progress') {
    return {
      background: AMBER_BG,
      color: AMBER_FG,
      border: AMBER_FG,
      label: 'In progress',
    };
  }
  if (state === 'blocked') {
    return {
      background: RED_BG,
      color: RED_FG,
      border: RED_FG,
      label: 'Blocked',
    };
  }
  return {
    background: GRAY_BG,
    color: GRAY_FG,
    border: GRAY_FG,
    label: 'Deferred',
  };
}

// ---------------------------------------------------------------------
// Primitive chip components
// ---------------------------------------------------------------------

function AgentChip({ agent }: { agent: StripAgentKey }) {
  return (
    <span
      data-agent={agent}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        fontFamily: FONT_BODY,
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: '0.10em',
        textTransform: 'uppercase',
        color: NAVY,
        background: NAVY_SOFT,
        border: `1px solid ${BORDER}`,
        borderRadius: 999,
        padding: '2px 8px',
        lineHeight: 1.4,
        whiteSpace: 'nowrap',
      }}
    >
      {agentLabel(agent)}
    </span>
  );
}

function StateChip({ state }: { state: StripActionState }) {
  const palette = stateChipPalette(state);
  return (
    <span
      data-state={state}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        fontFamily: FONT_BODY,
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: palette.color,
        background: palette.background,
        border: `1px solid ${BORDER}`,
        borderRadius: 999,
        padding: '2px 8px',
        lineHeight: 1.4,
        whiteSpace: 'nowrap',
      }}
    >
      {palette.label}
    </span>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: FONT_BODY,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color: MUTED,
        marginBottom: 8,
      }}
    >
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------
// Section A · Resume callout
// ---------------------------------------------------------------------

function ResumeCallout({
  view,
}: {
  view: ProgramActionMissionStripViewModel;
}) {
  const { resumeAction } = view;
  return (
    <div
      data-section="resume"
      style={{
        background: NAVY_SOFT,
        border: `1px solid ${BORDER}`,
        borderRadius: 10,
        padding: '12px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          flexWrap: 'wrap',
        }}
      >
        <span
          style={{
            fontFamily: FONT_BODY,
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: NAVY,
          }}
        >
          Resume
        </span>
        <span
          style={{
            fontFamily: FONT_BODY,
            fontSize: 16,
            fontWeight: 500,
            color: INK,
            lineHeight: 1.35,
          }}
        >
          {resumeAction.label}
        </span>
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          flexWrap: 'wrap',
        }}
      >
        <span
          style={{
            fontFamily: FONT_BODY,
            fontSize: 12,
            color: MUTED,
            lineHeight: 1.45,
            flex: '1 1 240px',
            minWidth: 0,
          }}
        >
          {resumeAction.rationale}
        </span>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            fontFamily: FONT_BODY,
            fontSize: 11,
            fontWeight: 500,
            color: MUTED,
            background: GRAY_BG,
            border: `1px solid ${BORDER}`,
            borderRadius: 6,
            padding: '2px 8px',
            lineHeight: 1.4,
            whiteSpace: 'nowrap',
          }}
        >
          {resumeAction.routeHint}
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
// Section B · Top 3 next actions
// ---------------------------------------------------------------------

function TopActionCard({ action }: { action: ProgramTopAction }) {
  return (
    <article
      data-action-id={action.actionId}
      style={{
        flex: '1 1 220px',
        minWidth: 0,
        background: SURFACE,
        border: `1px solid ${BORDER}`,
        borderRadius: 10,
        padding: '12px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          flexWrap: 'wrap',
        }}
      >
        <AgentChip agent={action.ownerAgent} />
        <StateChip state={action.state} />
      </div>
      <div
        style={{
          fontFamily: FONT_BODY,
          fontSize: 14,
          fontWeight: 500,
          color: INK,
          lineHeight: 1.35,
        }}
      >
        {action.label}
      </div>
      <div
        style={{
          fontFamily: FONT_BODY,
          fontSize: 12,
          color: MUTED,
          lineHeight: 1.45,
        }}
      >
        {action.rationale}
      </div>
      <div
        style={{
          fontFamily: FONT_BODY,
          fontSize: 11,
          color: MUTED,
          lineHeight: 1.45,
          fontStyle: 'italic',
          borderTop: `1px solid ${BORDER}`,
          paddingTop: 6,
        }}
      >
        <span
          style={{
            fontStyle: 'normal',
            fontWeight: 600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            fontSize: 10,
            color: BODY,
            marginRight: 6,
          }}
        >
          Stop when
        </span>
        {action.stopCondition}
      </div>
    </article>
  );
}

function TopActions({
  view,
}: {
  view: ProgramActionMissionStripViewModel;
}) {
  return (
    <div data-section="top-actions">
      <SectionTitle>Next actions</SectionTitle>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 10,
        }}
      >
        {view.topActions.map((action) => (
          <TopActionCard key={action.actionId} action={action} />
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
// Section C · Agent missions
// ---------------------------------------------------------------------

function AgentMissionRowView({ row }: { row: AgentMissionRow }) {
  return (
    <li
      data-agent={row.agent}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        padding: '10px 0',
        borderTop: `1px solid ${BORDER}`,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          flexWrap: 'wrap',
        }}
      >
        <AgentChip agent={row.agent} />
        <span
          style={{
            fontFamily: FONT_BODY,
            fontSize: 13,
            fontWeight: 500,
            color: INK,
            lineHeight: 1.4,
            flex: '1 1 240px',
            minWidth: 0,
          }}
        >
          {row.mission}
        </span>
        <StateChip state={row.state} />
      </div>
      <div
        style={{
          fontFamily: FONT_BODY,
          fontSize: 12,
          color: MUTED,
          lineHeight: 1.45,
          paddingLeft: 2,
        }}
      >
        {row.detail}
      </div>
    </li>
  );
}

function AgentMissions({
  view,
}: {
  view: ProgramActionMissionStripViewModel;
}) {
  return (
    <div data-section="agent-missions">
      <SectionTitle>Agent missions</SectionTitle>
      <ul
        style={{
          listStyle: 'none',
          margin: 0,
          padding: 0,
          borderBottom: `1px solid ${BORDER}`,
        }}
      >
        {view.agentMissions.map((row) => (
          <AgentMissionRowView key={row.agent} row={row} />
        ))}
      </ul>
    </div>
  );
}

// ---------------------------------------------------------------------
// Section D · Blocked / deferred
// ---------------------------------------------------------------------

function BlockedItemRow({ item }: { item: BlockedItem }) {
  return (
    <li
      data-item-id={item.itemId}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        padding: '8px 0',
        borderTop: `1px solid ${BORDER}`,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          flexWrap: 'wrap',
        }}
      >
        <span
          style={{
            fontFamily: FONT_BODY,
            fontSize: 13,
            fontWeight: 500,
            color: INK,
            lineHeight: 1.4,
            flex: '1 1 220px',
            minWidth: 0,
          }}
        >
          {item.label}
        </span>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            fontFamily: FONT_BODY,
            fontSize: 11,
            color: MUTED,
          }}
        >
          <span
            style={{
              fontWeight: 600,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              fontSize: 10,
              color: BODY,
            }}
          >
            Unblocked by
          </span>
          <AgentChip agent={item.unblockedBy} />
        </span>
      </div>
      <div
        style={{
          fontFamily: FONT_BODY,
          fontSize: 12,
          color: MUTED,
          lineHeight: 1.45,
          fontStyle: 'italic',
        }}
      >
        <span
          style={{
            fontStyle: 'normal',
            fontWeight: 600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            fontSize: 10,
            color: BODY,
            marginRight: 6,
          }}
        >
          Blocked by
        </span>
        {item.blockedBy}
      </div>
    </li>
  );
}

function BlockedSection({
  view,
}: {
  view: ProgramActionMissionStripViewModel;
}) {
  if (view.blockedItems.length === 0) {
    return null;
  }
  return (
    <div data-section="blocked">
      <SectionTitle>Blocked</SectionTitle>
      <ul
        style={{
          listStyle: 'none',
          margin: 0,
          padding: 0,
          borderBottom: `1px solid ${BORDER}`,
        }}
      >
        {view.blockedItems.map((item) => (
          <BlockedItemRow key={item.itemId} item={item} />
        ))}
      </ul>
    </div>
  );
}

// ---------------------------------------------------------------------
// Public component
// ---------------------------------------------------------------------

export function ProgramActionMissionStrip({
  programLabel,
}: ProgramActionMissionStripProps) {
  const view = buildProgramActionMissionStripView({ programLabel });
  return (
    <section
      data-program-action-mission-strip="prog14"
      aria-label={`Program action and mission strip · ${view.programLabel}`}
      style={{
        background: CARD,
        border: `1px solid ${BORDER}`,
        borderRadius: 12,
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 18,
        fontFamily: FONT_BODY,
        color: BODY,
      }}
    >
      <header
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        <span
          style={{
            fontFamily: FONT_BODY,
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: MUTED,
          }}
        >
          Program orientation
        </span>
        <h2
          style={{
            margin: 0,
            fontFamily: FONT_BODY,
            fontSize: 16,
            fontWeight: 600,
            color: INK,
            lineHeight: 1.3,
            letterSpacing: '-0.005em',
          }}
        >
          {view.programLabel}
        </h2>
      </header>

      <ResumeCallout view={view} />
      <TopActions view={view} />
      <AgentMissions view={view} />
      <BlockedSection view={view} />

      <footer
        style={{
          fontFamily: FONT_BODY,
          fontSize: 10,
          fontStyle: 'italic',
          color: MUTED,
          lineHeight: 1.5,
          borderTop: `1px solid ${BORDER}`,
          paddingTop: 10,
        }}
      >
        {view.caveat}
      </footer>
    </section>
  );
}
