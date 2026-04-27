'use client';

import type * as React from 'react';
import {
  buildNexusProgramWorkbenchView,
  type NexusProgramWorkbenchInput,
  type NexusWorkbenchAgentHandoff,
  type NexusWorkbenchPhaseNode,
} from '@/lib/programs/nexus-program-workbench-view';

const SURFACE = '#FBFAF7';
const CARD = '#FFFFFF';
const INK = '#0A0C12';
const BODY = '#1F2433';
const MUTED = '#525866';
const BORDER = '#E8E6E1';
const NAVY = '#132B4F';
const NAVY_SOFT = 'rgba(19,43,79,0.08)';
const BLUE = '#0B4A91';
const BLUE_SOFT = '#E8F2FF';
const AMBER = '#A65F00';
const AMBER_SOFT = '#FFF0D2';
const RED = '#9F2E25';
const RED_SOFT = '#FCE8E4';
const GREEN = '#0F766E';
const GREEN_SOFT = '#DFF4EE';
const CONV_USER = 'rgba(19, 43, 79, 0.86)';
const CONV_NEXUS = '#FFFFFF';

const FONT =
  '"DM Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

export interface NexusProgramWorkbenchProps extends NexusProgramWorkbenchInput {
  id?: string;
}

function chipStyle(tone: 'blue' | 'amber' | 'red' | 'green' | 'neutral') {
  if (tone === 'blue') return { background: BLUE_SOFT, color: NAVY };
  if (tone === 'amber') return { background: AMBER_SOFT, color: AMBER };
  if (tone === 'red') return { background: RED_SOFT, color: RED };
  if (tone === 'green') return { background: GREEN_SOFT, color: GREEN };
  return { background: '#F4EFE6', color: MUTED };
}

function Chip({
  children,
  tone = 'neutral',
}: {
  children: React.ReactNode;
  tone?: 'blue' | 'amber' | 'red' | 'green' | 'neutral';
}) {
  const colors = chipStyle(tone);
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        minHeight: 24,
        padding: '5px 10px',
        borderRadius: 999,
        background: colors.background,
        color: colors.color,
        fontFamily: FONT,
        fontSize: 11,
        fontWeight: 700,
        lineHeight: 1,
      }}
    >
      {children}
    </span>
  );
}

function ContextChips({ labels }: { labels: string[] }) {
  return (
    <div
      aria-label="Context used"
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 8,
      }}
    >
      <span
        style={{
          width: '100%',
          color: NAVY,
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          marginBottom: 3,
        }}
      >
        Context used
      </span>
      {labels.map((label) => (
        <Chip key={label}>{label}</Chip>
      ))}
    </div>
  );
}

function PhaseNode({ phase }: { phase: NexusWorkbenchPhaseNode }) {
  const isCurrent = phase.state === 'current';
  const isBlocked = phase.state === 'blocked';
  const isComplete = phase.state === 'complete';

  return (
    <div
      data-phase-state={phase.state}
      style={{
        position: 'relative',
        minHeight: isCurrent ? 106 : 88,
        padding: isCurrent ? '18px 18px 16px' : '14px 14px',
        border: `1px solid ${
          isCurrent ? '#9CCBF4' : isBlocked ? 'rgba(166,95,0,0.34)' : BORDER
        }`,
        borderRadius: 16,
        background: isCurrent ? BLUE_SOFT : isBlocked ? AMBER_SOFT : CARD,
        boxShadow: isCurrent
          ? '0 18px 36px rgba(11,74,145,0.14)'
          : 'none',
        transform: isCurrent ? 'translateY(-8px)' : 'none',
        transition: 'transform 160ms ease, box-shadow 160ms ease',
      }}
    >
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 28,
          height: 28,
          borderRadius: 999,
          background: isCurrent
            ? NAVY
            : isBlocked
              ? AMBER
              : isComplete
                ? GREEN
                : '#F4EFE6',
          color: isCurrent || isBlocked || isComplete ? '#FFFFFF' : MUTED,
          fontSize: 11,
          fontWeight: 800,
        }}
      >
        {isCurrent ? 'M' : isBlocked ? 'G' : isComplete ? '✓' : '•'}
      </span>
      <strong
        style={{
          display: 'block',
          marginTop: 12,
          color: INK,
          fontSize: isCurrent ? 18 : 14,
          lineHeight: 1.1,
        }}
      >
        {phase.label}
      </strong>
      <span
        style={{
          display: 'block',
          marginTop: 6,
          color: MUTED,
          fontSize: 11,
          lineHeight: 1.35,
        }}
      >
        {phase.note}
      </span>
    </div>
  );
}

function JourneyArrow() {
  return (
    <span
      aria-hidden="true"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: NAVY,
        fontSize: 20,
        fontWeight: 800,
        opacity: 0.62,
        marginTop: 26,
      }}
    >
      →
    </span>
  );
}

function ConversationThread({
  customAskPlaceholder,
  customAskDeferredState,
}: {
  customAskPlaceholder: string;
  customAskDeferredState: string;
}) {
  const thread = [
    {
      speaker: 'You',
      tone: CONV_USER,
      text: 'Can we move this program to Build?',
    },
    {
      speaker: 'Nexus',
      tone: CONV_NEXUS,
      text: 'Hold until Design gate blockers are resolved: value evidence, workshop outcomes, and stakeholder alignment.',
    },
  ];

  return (
    <div
      aria-label="Nexus conversation"
      style={{
        position: 'relative',
        padding: 16,
        border: `1px solid ${BORDER}`,
        borderRadius: 16,
        background: 'linear-gradient(180deg, #F4F8FF 0%, #FFFFFF 100%)',
      }}
    >
      <div
        aria-hidden
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          height: 2,
          background: 'linear-gradient(90deg, rgba(11,74,145,0.05), rgba(11,74,145,0.22), rgba(11,74,145,0.05))',
        }}
      />
      <div
        style={{
          color: NAVY,
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          marginBottom: 10,
        }}
      >
        Nexus conversation
      </div>
      <div style={{ display: 'grid', gap: 8 }}>
        {thread.map((entry) => (
          <div
            key={entry.text}
            style={{
              padding: '10px 12px',
              borderRadius: 12,
              background: entry.speaker === 'You' ? '#F7F8FB' : NAVY_SOFT,
              color: entry.speaker === 'You' ? CONV_USER : BODY,
              fontSize: 12,
              lineHeight: 1.45,
            }}
          >
            <span
              style={{
                display: 'inline-block',
                fontWeight: 800,
                color: NAVY,
                fontSize: 11,
                marginBottom: 6,
              }}
            >
              {entry.speaker}
            </span>
            <span
              style={{
                display: 'block',
                color: entry.speaker === 'You' ? CONV_USER : BODY,
              }}
            >
              {entry.text}
            </span>
          </div>
        ))}
      </div>

      <div
        style={{
          marginTop: 10,
          borderTop: `1px solid ${BORDER}`,
          paddingTop: 12,
        }}
      >
        <label
          htmlFor="nexus-program-custom-ask"
          style={{
            display: 'block',
            color: NAVY,
            fontSize: 11,
            fontWeight: 750,
            marginBottom: 8,
          }}
        >
          Ask Nexus
        </label>
        <textarea
          id="nexus-program-custom-ask"
          disabled
          rows={3}
          placeholder={customAskPlaceholder}
          style={{
            width: '100%',
            resize: 'vertical',
            border: `1px solid ${BORDER}`,
            borderRadius: 12,
            background: '#FFFFFF',
            color: BODY,
            padding: 12,
            fontFamily: FONT,
            fontSize: 12,
            lineHeight: 1.4,
          }}
        />
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            marginTop: 10,
          }}
        >
          <span style={{ color: MUTED, fontSize: 10, lineHeight: 1.35 }}>
            {customAskDeferredState}
          </span>
          <button
            type="button"
            disabled
            style={{
              border: 0,
              borderRadius: 999,
              background: '#D9D5CC',
              color: '#72695F',
              padding: '8px 12px',
              fontSize: 11,
              fontWeight: 800,
            }}
          >
            Submit deferred
          </button>
        </div>
      </div>
    </div>
  );
}

function agentTone(state: NexusWorkbenchAgentHandoff['state']) {
  if (state === 'active') return { bg: NAVY, fg: '#FFFFFF', chip: 'Active' };
  if (state === 'blocker') return { bg: RED_SOFT, fg: RED, chip: 'Blocker' };
  if (state === 'gap') return { bg: AMBER_SOFT, fg: AMBER, chip: 'Gap' };
  return { bg: BLUE_SOFT, fg: BLUE, chip: 'Impact' };
}

function AgentHandoffCard({ handoff }: { handoff: NexusWorkbenchAgentHandoff }) {
  const tone = agentTone(handoff.state);
  return (
    <div
      style={{
        padding: 11,
        border: `1px solid ${BORDER}`,
        borderRadius: 14,
        background: handoff.state === 'active' ? NAVY : '#FFFFFF',
        color: handoff.state === 'active' ? '#FFFFFF' : BODY,
        boxShadow: handoff.state === 'active' ? '0 14px 30px rgba(19,43,79,0.16)' : 'none',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <strong style={{ fontSize: 12, letterSpacing: '0.01em' }}>{handoff.label}</strong>
        <span
          style={{
            display: 'inline-flex',
            padding: '3px 8px',
            borderRadius: 999,
            background: handoff.state === 'active' ? 'rgba(255,255,255,0.14)' : tone.bg,
            color: handoff.state === 'active' ? '#FFFFFF' : tone.fg,
            fontSize: 10,
            fontWeight: 800,
            textTransform: 'uppercase',
          }}
        >
          {tone.chip}
        </span>
      </div>
      <p
        style={{
          margin: '7px 0 0',
          color: handoff.state === 'active' ? 'rgba(255,255,255,0.76)' : MUTED,
          fontSize: 10.5,
          lineHeight: 1.4,
        }}
      >
        {handoff.summary}
      </p>
    </div>
  );
}

export function NexusProgramWorkbench(props: NexusProgramWorkbenchProps) {
  const view = buildNexusProgramWorkbenchView(props);
  const currentIndex = Math.max(0, view.phaseJourney.findIndex((phase) => phase.state === 'current'));
  const nextPhase = view.phaseJourney[currentIndex + 1];
  const journeyPath = `Phase Journey: ${view.phaseJourney.map((phase) => phase.label).join(' → ')}`;

  return (
    <section
      id={props.id}
      data-component="NexusProgramWorkbench"
      aria-label="Nexus program workbench"
      style={{
        background: SURFACE,
        border: `1px solid ${BORDER}`,
        borderRadius: 22,
        padding: 22,
        boxShadow: '0 22px 60px rgba(19,43,79,0.08)',
        fontFamily: FONT,
        color: BODY,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: 18,
          marginBottom: 20,
        }}
      >
        <div>
          <div
            style={{
              color: NAVY,
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
            }}
          >
            Nexus workbench · Program journey
          </div>
          <h2
            style={{
              margin: '8px 0 0',
              color: INK,
              fontSize: 28,
              lineHeight: 1.08,
            }}
          >
            {view.currentProgram}
          </h2>
        </div>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'flex-end',
            gap: 8,
          }}
        >
          <Chip tone="blue">{view.currentPhase}</Chip>
          <Chip tone="blue">{view.currentWorkflowStage}</Chip>
          <Chip tone="amber">{view.currentGateState}</Chip>
        </div>
      </div>

      <div
        aria-label="Phase Journey"
        style={{
          marginBottom: 8,
          color: NAVY,
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
        }}
      >
        {journeyPath}
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'stretch',
          gap: 10,
          overflowX: 'auto',
          paddingBottom: 6,
          marginBottom: 20,
        }}
      >
        {view.phaseJourney.map((phase, index) => (
          <div
            key={phase.key}
            style={{
              display: 'flex',
              alignItems: 'stretch',
              gap: 10,
            }}
          >
            <div
              style={{
                minWidth: 168,
                maxWidth: 198,
                flex: '0 0 178px',
              }}
            >
              <PhaseNode phase={phase} />
            </div>
            {index < view.phaseJourney.length - 1 ? <JourneyArrow /> : null}
          </div>
        ))}
      </div>

      {nextPhase ? (
        <div
          style={{
            margin: '0 0 16px',
            borderRadius: 12,
            background: NAVY_SOFT,
            border: '1px dashed #B9D3F1',
            padding: '10px 14px',
            color: BODY,
            fontSize: 12,
            lineHeight: 1.4,
          }}
        >
          Maestro trail: complete blocker and evidence work in <strong>Synthesis</strong> to unlock{' '}
          <strong>{nextPhase.label}</strong>.
        </div>
      ) : null}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.7fr) minmax(300px, 1fr)',
          gap: 16,
        }}
      >
        <article
          style={{
            padding: 20,
            border: `1px solid ${BORDER}`,
            borderRadius: 18,
            background: CARD,
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1fr) auto',
              gap: 14,
              alignItems: 'start',
            }}
          >
            <div>
              <div
                style={{
                  color: NAVY,
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                }}
              >
                Nexus brief
              </div>
              <p
                style={{
                  margin: '9px 0 0',
                  color: INK,
                  fontSize: 17,
                  fontWeight: 650,
                  lineHeight: 1.42,
                }}
              >
                {view.nexusBrief}
              </p>
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
                gap: 8,
              }}
            >
              <Chip tone="amber">{view.confidenceState}</Chip>
              <Chip tone="blue">Evidence • {view.evidenceState}</Chip>
            </div>
          </div>

          <div style={{ marginTop: 14 }}>
            <ContextChips labels={view.contextUsed} />
          </div>

          <div
            style={{
              marginTop: 14,
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: 10,
            }}
          >
            <div
              style={{
                padding: 12,
                borderRadius: 12,
                border: `1px solid ${AMBER}`,
                background: AMBER_SOFT,
              }}
            >
              <strong style={{ color: AMBER, fontSize: 12 }}>Blocker</strong>
              <p style={{ margin: '6px 0 0', color: MUTED, fontSize: 12, lineHeight: 1.4 }}>
                {view.blocker}
              </p>
            </div>
            <div
              style={{
                padding: 12,
                borderRadius: 12,
                border: `1px solid ${GREEN}`,
                background: GREEN_SOFT,
              }}
            >
              <strong style={{ color: GREEN, fontSize: 12 }}>Recommended next action</strong>
              <p style={{ margin: '6px 0 0', color: MUTED, fontSize: 12, lineHeight: 1.4 }}>
                {view.recommendedNextAction}
              </p>
            </div>
          </div>

          <p
            style={{
              margin: '14px 0 0',
              color: MUTED,
              fontSize: 11,
              fontStyle: 'italic',
              lineHeight: 1.45,
            }}
          >
            {view.deterministicCaveat}
          </p>
        </article>

        <aside
          aria-label="Agent handoff summary"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          <ConversationThread
            customAskPlaceholder={view.customAskPlaceholder}
            customAskDeferredState={view.customAskDeferredState}
          />

          <div
            style={{
              padding: 14,
              border: `1px solid ${BORDER}`,
              borderRadius: 16,
              background: '#FFFCF5',
            }}
          >
            <div
              style={{
                color: NAVY,
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                marginBottom: 10,
              }}
            >
              Suggested next actions
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9 }}>
              {view.suggestedActions.map((action) => (
                <button
                  key={action.label}
                  type="button"
                  aria-label={action.description}
                  style={{
                    border: `1px solid ${BORDER}`,
                    borderRadius: 999,
                    background: BLUE_SOFT,
                    color: NAVY,
                    padding: '8px 12px',
                    fontSize: 11,
                    fontWeight: 800,
                  }}
                >
                  {action.label}
                </button>
              ))}
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gap: 8,
              border: `1px solid ${BORDER}`,
              borderRadius: 14,
              padding: '10px 12px',
              background: '#F7F9FD',
            }}
          >
            <div
              style={{
                color: NAVY,
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
              }}
            >
              Agent signals
            </div>
            {view.agentHandoffs.map((handoff) => (
              <AgentHandoffCard key={handoff.agent} handoff={handoff} />
            ))}
          </div>
        </aside>
      </div>
    </section>
  );
}

export default NexusProgramWorkbench;
