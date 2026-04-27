'use client';

import type * as React from 'react';
import { useState } from 'react';
import {
  buildNexusProgramWorkbenchView,
  type NexusProgramWorkbenchInput,
  type NexusWorkbenchAgentHandoff,
  type NexusWorkbenchConversationTurn,
  type NexusWorkbenchPhaseFocus,
  type NexusWorkbenchPhaseNode,
  type NexusWorkbenchRequiredInput,
  type NexusWorkbenchSuggestedAction,
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
const GREEN = '#0F766E';
const GREEN_SOFT = '#DFF4EE';
const CONV_USER = 'rgba(19, 43, 79, 0.86)';

const FONT =
  '"DM Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
const SERIF =
  'Georgia, "Times New Roman", "Iowan Old Style", serif';

export interface NexusProgramWorkbenchProps extends NexusProgramWorkbenchInput {
  id?: string;
}

// --- shared chip ----------------------------------------------------------

function chipStyle(tone: 'blue' | 'amber' | 'red' | 'green' | 'neutral') {
  if (tone === 'blue') return { background: BLUE_SOFT, color: NAVY };
  if (tone === 'amber') return { background: AMBER_SOFT, color: AMBER };
  if (tone === 'red') return { background: '#FCE8E4', color: RED };
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
        minHeight: 22,
        padding: '4px 10px',
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

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        color: NAVY,
        fontSize: 10.5,
        fontWeight: 800,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
      }}
    >
      {children}
    </div>
  );
}

// --- journey hero ---------------------------------------------------------

function JourneyPhaseNode({
  phase,
  isSelected,
  isCurrent,
  onSelect,
}: {
  phase: NexusWorkbenchPhaseNode;
  isSelected: boolean;
  isCurrent: boolean;
  onSelect: (key: string) => void;
}) {
  const isBlocked = phase.state === 'blocked';
  const isComplete = phase.state === 'complete';
  const isFuture = phase.state === 'future';

  // The current phase ALWAYS pops above the strip; selection adds a navy ring
  // and stronger shadow so "where I'm looking" is distinct from "where the
  // maestro is".
  const popLift = isCurrent ? 18 : isSelected ? 10 : 0;
  const scale = isCurrent ? 1.06 : isSelected ? 1.02 : 1;
  const cardWidth = isCurrent ? 220 : 168;
  const cardHeight = isCurrent ? 148 : 112;

  const baseBackground = isCurrent
    ? 'linear-gradient(160deg, #132B4F 0%, #1F3F73 100%)'
    : isBlocked
      ? AMBER_SOFT
      : isComplete
        ? '#F1F8F4'
        : CARD;

  const baseBorder = isCurrent
    ? NAVY
    : isSelected
      ? NAVY
      : isBlocked
        ? 'rgba(166,95,0,0.42)'
        : isComplete
          ? 'rgba(15,118,110,0.30)'
          : BORDER;

  const titleColor = isCurrent ? '#FFFFFF' : INK;
  const noteColor = isCurrent ? 'rgba(255,255,255,0.78)' : MUTED;

  return (
    <button
      type="button"
      data-phase-state={phase.state}
      data-phase-selected={isSelected ? 'true' : 'false'}
      aria-pressed={isSelected}
      aria-label={`Focus Nexus workbench on ${phase.label} (${phase.state})`}
      onClick={() => onSelect(phase.key)}
      style={{
        position: 'relative',
        width: cardWidth,
        minHeight: cardHeight,
        flex: `0 0 ${cardWidth}px`,
        padding: isCurrent ? '20px 18px 22px' : '14px 14px',
        textAlign: 'left',
        cursor: 'pointer',
        border: `${isCurrent || isSelected ? 2 : 1}px solid ${baseBorder}`,
        borderRadius: 18,
        background: baseBackground,
        boxShadow: isCurrent
          ? '0 28px 56px rgba(11,74,145,0.32)'
          : isSelected
            ? '0 18px 36px rgba(11,74,145,0.18)'
            : isFuture
              ? '0 4px 10px rgba(19,43,79,0.04)'
              : '0 8px 18px rgba(19,43,79,0.06)',
        transform: `translateY(-${popLift}px) scale(${scale})`,
        transformOrigin: 'center bottom',
        transition:
          'transform 220ms cubic-bezier(.2,.7,.2,1), box-shadow 200ms ease, border-color 160ms ease',
        font: 'inherit',
        color: 'inherit',
        opacity: isFuture && !isSelected ? 0.78 : 1,
      }}
    >
      <span
        aria-hidden
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: isCurrent ? 34 : 26,
          height: isCurrent ? 34 : 26,
          borderRadius: 999,
          background: isCurrent
            ? '#FFFFFF'
            : isBlocked
              ? AMBER
              : isComplete
                ? GREEN
                : '#F4EFE6',
          color: isCurrent ? NAVY : isBlocked || isComplete ? '#FFFFFF' : MUTED,
          fontSize: isCurrent ? 13 : 11,
          fontWeight: 800,
          letterSpacing: 0.4,
        }}
      >
        {isCurrent ? 'M' : isBlocked ? 'G' : isComplete ? '✓' : '•'}
      </span>
      <strong
        style={{
          display: 'block',
          marginTop: isCurrent ? 14 : 10,
          color: titleColor,
          fontFamily: isCurrent ? SERIF : FONT,
          fontSize: isCurrent ? 22 : 14,
          fontWeight: isCurrent ? 600 : 700,
          lineHeight: 1.1,
        }}
      >
        {phase.label}
      </strong>
      <span
        style={{
          display: 'block',
          marginTop: 6,
          color: noteColor,
          fontSize: isCurrent ? 12 : 11,
          lineHeight: 1.4,
        }}
      >
        {phase.note}
      </span>

      {isCurrent ? (
        <span
          style={{
            position: 'absolute',
            top: -10,
            right: 16,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '4px 10px',
            borderRadius: 999,
            background: '#FFFFFF',
            color: NAVY,
            border: `1px solid ${NAVY}`,
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            boxShadow: '0 6px 14px rgba(19,43,79,0.18)',
          }}
        >
          <span aria-hidden style={{ width: 6, height: 6, borderRadius: 999, background: NAVY }} />
          Maestro is here
        </span>
      ) : null}
    </button>
  );
}

function JourneyConnector({ active }: { active: boolean }) {
  return (
    <span
      aria-hidden="true"
      style={{
        flex: '0 0 28px',
        alignSelf: 'center',
        height: 2,
        margin: '0 4px',
        background: active
          ? `linear-gradient(90deg, ${NAVY} 0%, rgba(11,74,145,0.18) 100%)`
          : 'rgba(19,43,79,0.18)',
        borderRadius: 2,
      }}
    />
  );
}

function JourneyHero({
  programIdentity,
  phases,
  selectedPhaseKey,
  onSelect,
}: {
  programIdentity: string;
  phases: NexusWorkbenchPhaseNode[];
  selectedPhaseKey: string;
  onSelect: (key: string) => void;
}) {
  const journeyText = `Phase Journey: ${phases.map((phase) => phase.label).join(' → ')}`;
  return (
    <div
      data-region="journey-hero"
      style={{
        position: 'relative',
        marginBottom: 28,
        padding: '28px 28px 36px',
        borderRadius: 22,
        background:
          'linear-gradient(180deg, rgba(232,242,255,0.55) 0%, rgba(248,247,244,1) 70%)',
        border: `1px solid ${BORDER}`,
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
          <Eyebrow>Phase journey · click any phase to focus</Eyebrow>
          <div
            style={{
              marginTop: 4,
              fontFamily: SERIF,
              fontSize: 18,
              color: INK,
              lineHeight: 1.2,
            }}
          >
            {programIdentity}
          </div>
        </div>
        <span
          style={{
            color: MUTED,
            fontSize: 10.5,
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
          }}
          aria-label="Phase Journey"
        >
          {journeyText}
        </span>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'flex-start',
          flexWrap: 'nowrap',
          overflowX: 'auto',
          paddingTop: 24,
          paddingBottom: 6,
          gap: 0,
        }}
      >
        {phases.map((phase, index) => {
          const isSelected = phase.key === selectedPhaseKey;
          const isCurrent = phase.state === 'current';
          const next = phases[index + 1];
          const connectorActive =
            phase.state === 'complete' || phase.state === 'current';
          return (
            <span
              key={phase.key}
              style={{ display: 'inline-flex', alignItems: 'flex-end' }}
            >
              <JourneyPhaseNode
                phase={phase}
                isSelected={isSelected}
                isCurrent={isCurrent}
                onSelect={onSelect}
              />
              {next ? <JourneyConnector active={connectorActive} /> : null}
            </span>
          );
        })}
      </div>
    </div>
  );
}

// --- left rail · phase requirements --------------------------------------

function RequiredInputRow({ input }: { input: NexusWorkbenchRequiredInput }) {
  const tone =
    input.state === 'satisfied'
      ? { bg: GREEN_SOFT, fg: GREEN, mark: '✓', label: 'Satisfied' }
      : input.state === 'in-progress'
        ? { bg: BLUE_SOFT, fg: NAVY, mark: '◐', label: 'In progress' }
        : { bg: AMBER_SOFT, fg: AMBER, mark: '○', label: 'Open' };
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 8,
        padding: '8px 10px',
        borderRadius: 10,
        background: '#FFFFFF',
        border: `1px solid ${BORDER}`,
      }}
    >
      <span
        aria-label={tone.label}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 22,
          height: 22,
          borderRadius: 999,
          background: tone.bg,
          color: tone.fg,
          fontSize: 12,
          fontWeight: 800,
          flex: '0 0 auto',
        }}
      >
        {tone.mark}
      </span>
      <span style={{ color: BODY, fontSize: 12.5, lineHeight: 1.4 }}>
        {input.label}
      </span>
    </div>
  );
}

function PhaseRequirementsRail({
  phaseLabel,
  requiredInputs,
  blocker,
  confidenceState,
  evidenceState,
}: {
  phaseLabel: string;
  requiredInputs: NexusWorkbenchRequiredInput[];
  blocker: string;
  confidenceState: string;
  evidenceState: string;
}) {
  return (
    <aside
      aria-label="Phase requirements"
      style={{
        padding: 18,
        borderRadius: 16,
        background: SURFACE,
        border: `1px solid ${BORDER}`,
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        alignSelf: 'flex-start',
      }}
    >
      <div>
        <Eyebrow>Phase requirements</Eyebrow>
        <div
          style={{
            marginTop: 4,
            fontFamily: SERIF,
            fontSize: 16,
            color: INK,
            lineHeight: 1.2,
          }}
        >
          {phaseLabel}
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        <Chip tone="amber">{confidenceState}</Chip>
        <Chip tone="blue">{evidenceState}</Chip>
      </div>

      <div style={{ display: 'grid', gap: 6 }}>
        <Eyebrow>Required inputs</Eyebrow>
        {requiredInputs.map((input) => (
          <RequiredInputRow key={input.label} input={input} />
        ))}
      </div>

      <div
        style={{
          padding: '10px 12px',
          borderRadius: 10,
          background: AMBER_SOFT,
          border: `1px solid rgba(166,95,0,0.30)`,
        }}
      >
        <Eyebrow>Open blocker</Eyebrow>
        <p
          style={{
            margin: '6px 0 0',
            color: BODY,
            fontSize: 12.5,
            lineHeight: 1.45,
          }}
        >
          {blocker}
        </p>
      </div>
    </aside>
  );
}

// --- center · Nexus brief -------------------------------------------------

function ContextChips({ labels }: { labels: string[] }) {
  return (
    <div
      aria-label="Context used"
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 6,
        alignItems: 'center',
      }}
    >
      <Eyebrow>Context used</Eyebrow>
      {labels.map((label) => (
        <Chip key={label}>{label}</Chip>
      ))}
    </div>
  );
}

function ConversationPreview({
  conversation,
}: {
  conversation: NexusWorkbenchConversationTurn[];
}) {
  const userTurn = conversation.find((turn) => turn.speaker === 'You');
  const nexusTurn = conversation.find((turn) => turn.speaker === 'Nexus');
  if (!nexusTurn) return null;
  return (
    <div
      aria-label="Latest Nexus exchange"
      style={{
        padding: '12px 14px',
        borderRadius: 12,
        border: `1px solid ${BORDER}`,
        background: '#FCFCFB',
      }}
    >
      <Eyebrow>Latest Nexus exchange</Eyebrow>
      {userTurn ? (
        <p
          style={{
            margin: '8px 0 4px',
            color: CONV_USER,
            fontSize: 12,
            lineHeight: 1.5,
            fontStyle: 'italic',
          }}
        >
          You · &ldquo;{userTurn.text}&rdquo;
        </p>
      ) : null}
      <p
        style={{
          margin: 0,
          color: INK,
          fontSize: 13,
          lineHeight: 1.55,
        }}
      >
        Nexus · {nexusTurn.text}
      </p>
    </div>
  );
}

function NexusBriefCenter({
  selectedPhase,
  focus,
  isSelectedCurrent,
  programIdentity,
  currentGateState,
  currentWorkflowStage,
  deterministicCaveat,
}: {
  selectedPhase: NexusWorkbenchPhaseNode;
  focus: NexusWorkbenchPhaseFocus;
  isSelectedCurrent: boolean;
  programIdentity: string;
  currentGateState: string;
  currentWorkflowStage: string;
  deterministicCaveat: string;
}) {
  return (
    <article
      aria-label="Nexus brief"
      style={{
        padding: '22px 22px 18px',
        borderRadius: 18,
        background: CARD,
        border: `1px solid ${BORDER}`,
        boxShadow: '0 14px 30px rgba(19,43,79,0.05)',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 14,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <Eyebrow>
            Nexus brief · {selectedPhase.label}
            {isSelectedCurrent ? ' · current phase' : ' · scouting'}
          </Eyebrow>
          <h3
            style={{
              margin: '6px 0 0',
              fontFamily: SERIF,
              fontWeight: 600,
              fontSize: 22,
              lineHeight: 1.22,
              color: INK,
            }}
          >
            {programIdentity}
          </h3>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <Chip tone="blue">{currentWorkflowStage}</Chip>
          <Chip tone="amber">{currentGateState}</Chip>
        </div>
      </div>

      <p
        style={{
          margin: 0,
          color: INK,
          fontSize: 16.5,
          fontWeight: 500,
          lineHeight: 1.5,
        }}
      >
        {focus.brief}
      </p>

      <ContextChips labels={focus.contextUsed} />

      <div
        style={{
          padding: '12px 14px',
          borderRadius: 12,
          background: GREEN_SOFT,
          border: `1px solid rgba(15,118,110,0.30)`,
        }}
      >
        <Eyebrow>Recommended next action</Eyebrow>
        <p style={{ margin: '6px 0 0', color: BODY, fontSize: 13, lineHeight: 1.5 }}>
          {focus.recommendedNextAction}
        </p>
      </div>

      <ConversationPreview conversation={focus.conversation} />

      <p
        style={{
          margin: 0,
          color: MUTED,
          fontSize: 11,
          fontStyle: 'italic',
          lineHeight: 1.45,
        }}
      >
        {deterministicCaveat}
      </p>
    </article>
  );
}

// --- right · agent rail + suggested actions + Ask Nexus ------------------

function agentTone(state: NexusWorkbenchAgentHandoff['state']) {
  if (state === 'active') return { chip: 'Active', dotBg: NAVY };
  if (state === 'blocker') return { chip: 'Blocker', dotBg: RED };
  if (state === 'gap') return { chip: 'Gap', dotBg: AMBER };
  return { chip: 'Impact', dotBg: BLUE };
}

function AgentRow({ handoff }: { handoff: NexusWorkbenchAgentHandoff }) {
  const tone = agentTone(handoff.state);
  const isActive = handoff.state === 'active';
  const monogram = handoff.label.slice(0, 1);
  return (
    <div
      style={{
        display: 'flex',
        gap: 10,
        padding: '10px 12px',
        borderRadius: 12,
        background: isActive ? NAVY : '#FFFFFF',
        color: isActive ? '#FFFFFF' : BODY,
        border: `1px solid ${isActive ? NAVY : BORDER}`,
      }}
    >
      <span
        aria-hidden
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 26,
          height: 26,
          borderRadius: 999,
          background: isActive ? '#FFFFFF' : NAVY_SOFT,
          color: NAVY,
          fontSize: 11,
          fontWeight: 800,
          flex: '0 0 auto',
        }}
      >
        {monogram}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
          }}
        >
          <strong style={{ fontSize: 12.5, letterSpacing: 0.1 }}>{handoff.label}</strong>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '2px 7px',
              borderRadius: 999,
              background: isActive ? 'rgba(255,255,255,0.14)' : 'rgba(19,43,79,0.06)',
              color: isActive ? '#FFFFFF' : NAVY,
              fontSize: 9.5,
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.10em',
            }}
          >
            <span
              aria-hidden
              style={{
                width: 6,
                height: 6,
                borderRadius: 999,
                background: isActive ? '#FFFFFF' : tone.dotBg,
              }}
            />
            {tone.chip}
          </span>
        </div>
        <p
          style={{
            margin: '4px 0 0',
            color: isActive ? 'rgba(255,255,255,0.78)' : MUTED,
            fontSize: 11.5,
            lineHeight: 1.4,
          }}
        >
          {handoff.summary}
        </p>
      </div>
    </div>
  );
}

function AgentRailRight({
  agentHandoffs,
  suggestedActions,
  customAskPlaceholder,
  customAskDeferredState,
}: {
  agentHandoffs: NexusWorkbenchAgentHandoff[];
  suggestedActions: NexusWorkbenchSuggestedAction[];
  customAskPlaceholder: string;
  customAskDeferredState: string;
}) {
  return (
    <aside
      aria-label="Agent rail"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}
    >
      <div
        style={{
          padding: 14,
          borderRadius: 16,
          background: SURFACE,
          border: `1px solid ${BORDER}`,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        <Eyebrow>Agent rail</Eyebrow>
        {agentHandoffs.map((handoff) => (
          <AgentRow key={handoff.agent} handoff={handoff} />
        ))}
      </div>

      <div
        style={{
          padding: 14,
          borderRadius: 16,
          background: '#FFFCF5',
          border: `1px solid ${BORDER}`,
        }}
      >
        <Eyebrow>Suggested next actions</Eyebrow>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
          {suggestedActions.map((action) => (
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
                fontSize: 11.5,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>

      <div
        style={{
          padding: 14,
          borderRadius: 16,
          background: 'linear-gradient(180deg, #F4F8FF 0%, #FFFFFF 100%)',
          border: `1px solid ${BORDER}`,
        }}
      >
        <label
          htmlFor="nexus-program-custom-ask"
          style={{ display: 'block' }}
        >
          <Eyebrow>Ask Nexus</Eyebrow>
        </label>
        <textarea
          id="nexus-program-custom-ask"
          disabled
          rows={3}
          placeholder={customAskPlaceholder}
          style={{
            width: '100%',
            marginTop: 8,
            resize: 'vertical',
            border: `1px solid ${BORDER}`,
            borderRadius: 12,
            background: '#FFFFFF',
            color: BODY,
            padding: 12,
            fontFamily: FONT,
            fontSize: 12.5,
            lineHeight: 1.45,
          }}
        />
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            marginTop: 8,
          }}
        >
          <span style={{ color: MUTED, fontSize: 10.5, lineHeight: 1.35 }}>
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
    </aside>
  );
}

// --- main -----------------------------------------------------------------

export function NexusProgramWorkbench(props: NexusProgramWorkbenchProps) {
  const view = buildNexusProgramWorkbenchView(props);
  const currentIndex = Math.max(
    0,
    view.phaseJourney.findIndex((phase) => phase.state === 'current'),
  );

  const [selectedPhaseKey, setSelectedPhaseKey] = useState<string>(view.defaultPhaseKey);
  const selectedFocus =
    view.phaseFocusByKey[selectedPhaseKey] ?? view.phaseFocusByKey[view.defaultPhaseKey]!;
  const selectedPhase =
    view.phaseJourney.find((phase) => phase.key === selectedPhaseKey)
    ?? view.phaseJourney[currentIndex]!;
  const isSelectedCurrent = selectedPhase.state === 'current';

  return (
    <section
      id={props.id}
      data-component="NexusProgramWorkbench"
      aria-label="Nexus program workbench"
      style={{
        background: SURFACE,
        border: `1px solid ${BORDER}`,
        borderRadius: 22,
        padding: '24px 24px 24px',
        boxShadow: '0 22px 60px rgba(19,43,79,0.06)',
        fontFamily: FONT,
        color: BODY,
      }}
    >
      <header
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: 16,
          marginBottom: 18,
        }}
      >
        <div>
          <Eyebrow>Nexus workbench</Eyebrow>
          <h2
            style={{
              margin: '6px 0 0',
              fontFamily: SERIF,
              fontWeight: 600,
              fontSize: 26,
              lineHeight: 1.18,
              color: INK,
            }}
          >
            {view.currentProgram}
          </h2>
        </div>
        <Chip tone="blue">{view.currentPhase}</Chip>
      </header>

      <JourneyHero
        programIdentity={view.currentProgram}
        phases={view.phaseJourney}
        selectedPhaseKey={selectedPhaseKey}
        onSelect={setSelectedPhaseKey}
      />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(220px, 240px) minmax(0, 1fr) minmax(280px, 320px)',
          gap: 18,
          alignItems: 'start',
        }}
      >
        <PhaseRequirementsRail
          phaseLabel={selectedPhase.label}
          requiredInputs={selectedFocus.requiredInputs}
          blocker={selectedFocus.blocker}
          confidenceState={view.confidenceState}
          evidenceState={view.evidenceState}
        />

        <NexusBriefCenter
          selectedPhase={selectedPhase}
          focus={selectedFocus}
          isSelectedCurrent={isSelectedCurrent}
          programIdentity={view.currentProgram}
          currentGateState={view.currentGateState}
          currentWorkflowStage={view.currentWorkflowStage}
          deterministicCaveat={view.deterministicCaveat}
        />

        <AgentRailRight
          agentHandoffs={selectedFocus.agentHandoffs}
          suggestedActions={selectedFocus.suggestedActions}
          customAskPlaceholder={view.customAskPlaceholder}
          customAskDeferredState={view.customAskDeferredState}
        />
      </div>
    </section>
  );
}

export default NexusProgramWorkbench;
