'use client';

/**
 * PersistentNexusPanel — Chat lane (left column of canvas shell)
 *
 * Redesigned to match T03 Universal Canvas design:
 *   - Agent avatar + name + SCOPED status line
 *   - Context bundle strip (compact mono)
 *   - Static agent messages as chat bubbles (deterministic guidance)
 *   - "Three choices" for current step (from suggestedActions)
 *   - Freeform input row (sticky bottom)
 *
 * Width is controlled by the parent BODY_GRID (380px fixed column).
 */

import type { CSSProperties } from 'react';
import { SHELL } from '@/lib/shell/shell-tokens';
import type { SourceAgentMissionReport } from '@/lib/source';
import type { SourcingEventDetail } from '@/lib/source/types';
import { formatUsd } from '@/lib/source/value-ledger';

// ─── Layout ──────────────────────────────────────────────────────────────────

const LANE: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  borderRight: '1px solid ' + SHELL.CARD_LINE,
  background: SHELL.CARD_WHITE,
  overflow: 'hidden',
  minHeight: 0,
};

const LANE_HEAD: CSSProperties = {
  padding: '14px 16px 12px',
  borderBottom: '1px solid ' + SHELL.CARD_LINE,
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  flexShrink: 0,
};

const AGENT_ROW: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
};

const CONTEXT_STRIP: CSSProperties = {
  background: SHELL.PAPER_SOFT,
  border: '1px solid ' + SHELL.CARD_LINE,
  borderRadius: 7,
  padding: '7px 10px',
  display: 'flex',
  flexDirection: 'column',
  gap: 3,
};

const CHAT_THREAD: CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  padding: '14px 16px',
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
};

const CHAT_INPUT_AREA: CSSProperties = {
  borderTop: '1px solid ' + SHELL.CARD_LINE,
  padding: '12px 14px',
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  flexShrink: 0,
  background: SHELL.CARD_WHITE,
};

// ─── Agent identity helpers ───────────────────────────────────────────────────

function resolveAgentIdentity(leadAgent: string): {
  avatar: string;
  avatarBg: string;
  dotColor: string;
  subhead: string;
} {
  const name = (leadAgent ?? '').toLowerCase();
  if (name.includes('steward')) {
    return {
      avatar: 'S',
      avatarBg: '#1B2B5C',
      dotColor: '#d49b3a',
      subhead: 'Steward is leading this step. I keep the scorecard and gate criteria honest.',
    };
  }
  if (name.includes('sentinel')) {
    return {
      avatar: 'Σ',
      avatarBg: '#1a3a6c',
      dotColor: '#4f8fd4',
      subhead: 'Sentinel is scoped to this event. I surface risk, data gaps, and pricing traps.',
    };
  }
  if (name.includes('atlas')) {
    return {
      avatar: 'A',
      avatarBg: '#2a3040',
      dotColor: '#7a8aaa',
      subhead: 'Atlas is leading this step. I synthesise evidence into a decision brief.',
    };
  }
  // Default: Nexus
  return {
    avatar: '✦',
    avatarBg: '#1B2B5C',
    dotColor: '#d49b3a',
    subhead: 'Nexus is leading this step. I keep the event on track and surface blockers early.',
  };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function AgentAvatar({ letter, bg }: { letter: string; bg: string }) {
  return (
    <div
      style={{
        width: 32,
        height: 32,
        borderRadius: '50%',
        background: bg,
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: SHELL.SANS,
        fontSize: letter.length > 1 ? 14 : 15,
        fontWeight: 800,
        flexShrink: 0,
      }}
    >
      {letter}
    </div>
  );
}

function Bubble({
  variant,
  children,
}: {
  variant: 'agent' | 'user';
  children: React.ReactNode;
}) {
  const isAgent = variant === 'agent';
  return (
    <div
      style={{
        alignSelf: isAgent ? 'flex-start' : 'flex-end',
        maxWidth: '88%',
        background: isAgent ? SHELL.PAPER_SOFT : '#1B2B5C',
        border: isAgent ? '1px solid ' + SHELL.CARD_LINE : 'none',
        borderRadius: isAgent ? '4px 12px 12px 12px' : '12px 12px 4px 12px',
        padding: '9px 12px',
        fontFamily: SHELL.SANS,
        fontSize: 12.5,
        lineHeight: 1.55,
        color: isAgent ? SHELL.INK : '#fff',
      }}
    >
      {children}
    </div>
  );
}

function ThreeChoices({
  stepLabel,
  choices,
}: {
  stepLabel: string;
  choices: Array<{ id: string; label: string; description: string }>;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div
        style={{
          fontFamily: SHELL.MONO,
          fontSize: 9,
          letterSpacing: '0.10em',
          textTransform: 'uppercase',
          color: SHELL.INK_MUTED,
        }}
      >
        ↳ Three choices for {stepLabel}
      </div>
      {choices.slice(0, 3).map((choice) => (
        <button
          key={choice.id}
          style={{
            display: 'block',
            width: '100%',
            textAlign: 'left',
            background: SHELL.PAPER_SOFT,
            border: '1px solid ' + SHELL.CARD_LINE,
            borderRadius: 8,
            padding: '8px 10px',
            fontFamily: SHELL.SANS,
            fontSize: 12,
            lineHeight: 1.5,
            color: SHELL.INK,
            cursor: 'pointer',
          }}
        >
          <strong style={{ fontWeight: 700 }}>{choice.label}</strong>
          {choice.description ? ` — ${choice.description}` : ''}
        </button>
      ))}
    </div>
  );
}

// ─── Main export ─────────────────────────────────────────────────────────────

export function PersistentNexusPanel({
  event,
  missionReport,
}: {
  event: SourcingEventDetail;
  missionReport: SourceAgentMissionReport;
}) {
  const { avatar, avatarBg, dotColor, subhead } = resolveAgentIdentity(event.leadAgent ?? 'Nexus');
  const agentName = event.leadAgent ?? 'Nexus';
  const statusLine = `SCOPED · ${event.id.toUpperCase()} · ${event.currentStageLabel.toUpperCase()}`;

  // Context bundle: compact summary for the strip
  const artifactCount = missionReport.missionCount ?? 0;
  const contextLine = [
    'EVENT',
    event.currentStageLabel.toUpperCase(),
    `ARTIFACTS ${artifactCount}`,
    event.valueAtStakeUsd ? `VALUE ${formatUsd(event.valueAtStakeUsd)}` : null,
    `${missionReport.topMissions.length} MISSIONS`,
  ]
    .filter(Boolean)
    .join(' · ');

  // Static agent messages — deterministic guidance surfaced as chat bubbles
  const agentMessages: string[] = [];
  if (missionReport.recommendedNextAction) {
    agentMessages.push(missionReport.recommendedNextAction);
  }
  if (event.blocker) {
    agentMessages.push(`Blocker flagged: ${event.blocker}`);
  } else if (event.nextDecision) {
    agentMessages.push(`Next decision needed: ${event.nextDecision}`);
  }
  if (missionReport.handoffs?.[0]) {
    agentMessages.push(missionReport.handoffs[0]);
  }

  // Three choices from suggestedActions
  const choices = missionReport.suggestedActions?.slice(0, 3) ?? [];

  return (
    <div style={LANE}>
      {/* ── Agent header ── */}
      <div style={LANE_HEAD}>
        <div style={AGENT_ROW}>
          <AgentAvatar letter={avatar} bg={avatarBg} />
          <div>
            <div
              style={{
                fontFamily: SHELL.SANS,
                fontSize: 14,
                fontWeight: 700,
                color: SHELL.INK,
                lineHeight: 1.2,
              }}
            >
              {agentName}
            </div>
            <div
              style={{
                fontFamily: SHELL.MONO,
                fontSize: 9,
                letterSpacing: '0.10em',
                color: dotColor,
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                marginTop: 2,
              }}
            >
              <span
                style={{
                  display: 'inline-block',
                  width: 5,
                  height: 5,
                  borderRadius: '50%',
                  background: dotColor,
                }}
              />
              {statusLine}
            </div>
          </div>
        </div>
        <div
          style={{
            fontFamily: SHELL.SANS,
            fontSize: 12,
            color: SHELL.INK_MUTED,
            lineHeight: 1.45,
          }}
        >
          {subhead}
        </div>

        {/* Context bundle strip */}
        <div style={CONTEXT_STRIP}>
          <div
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 9,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: SHELL.INK_MUTED,
            }}
          >
            Context bundle
          </div>
          <div
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 10,
              color: SHELL.INK_SOFT,
              lineHeight: 1.4,
            }}
          >
            {contextLine}
          </div>
        </div>
      </div>

      {/* ── Chat thread ── */}
      <div style={CHAT_THREAD}>
        {agentMessages.map((msg, i) => (
          <Bubble key={i} variant="agent">
            {msg}
          </Bubble>
        ))}

        {/* Top mission as a structured agent card */}
        {missionReport.topMissions[0] && (
          <div
            style={{
              background: SHELL.PAPER_SOFT,
              border: '1px solid ' + SHELL.CARD_LINE,
              borderRadius: '4px 12px 12px 12px',
              padding: '9px 12px',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}
          >
            <div
              style={{
                fontFamily: SHELL.MONO,
                fontSize: 9,
                letterSpacing: '0.10em',
                textTransform: 'uppercase',
                color: SHELL.INK_MUTED,
              }}
            >
              Top mission · {missionReport.topMissions[0].priority}
            </div>
            <div
              style={{
                fontFamily: SHELL.SANS,
                fontSize: 12.5,
                fontWeight: 700,
                color: SHELL.INK,
                lineHeight: 1.4,
              }}
            >
              {missionReport.topMissions[0].title}
            </div>
            {missionReport.topMissions[0].evidenceStatus && (
              <div
                style={{
                  fontFamily: SHELL.SANS,
                  fontSize: 11.5,
                  color: SHELL.INK_MUTED,
                }}
              >
                Evidence: {missionReport.topMissions[0].evidenceStatus}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Three choices + input (sticky bottom) ── */}
      <div style={CHAT_INPUT_AREA}>
        {choices.length > 0 && (
          <ThreeChoices stepLabel={event.currentStageLabel} choices={choices} />
        )}
        <div
          style={{
            display: 'flex',
            gap: 6,
            alignItems: 'center',
          }}
        >
          <input
            type="text"
            placeholder={`Or ask ${agentName}…`}
            style={{
              flex: 1,
              background: SHELL.PAPER_SOFT,
              border: '1px solid ' + SHELL.CARD_LINE,
              borderRadius: 8,
              padding: '8px 10px',
              fontFamily: SHELL.SANS,
              fontSize: 12.5,
              color: SHELL.INK,
              outline: 'none',
            }}
          />
          <button
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: '#1B2B5C',
              border: 'none',
              color: '#fff',
              fontFamily: SHELL.SANS,
              fontSize: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            ↑
          </button>
        </div>
      </div>
    </div>
  );
}
