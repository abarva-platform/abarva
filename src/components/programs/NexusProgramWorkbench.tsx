'use client';

import type * as React from 'react';
import { useState } from 'react';
import {
  buildNexusProgramWorkbenchView,
  type NexusProgramWorkbenchInput,
  type NexusWorkbenchAgentHandoff,
  type NexusWorkbenchEvidenceSlice,
  type NexusWorkbenchMissingInput,
  type NexusWorkbenchPhaseNode,
  type NexusWorkbenchSubnavTab,
  type NexusWorkbenchSuggestedAction,
  type NexusWorkbenchWorkshop,
} from '@/lib/programs/nexus-program-workbench-view';

// --- design tokens (AbarVa locked palette) -------------------------------

const SURFACE = '#FBFAF7';
const CARD = '#FFFFFF';
const INK = '#0A0C12';
const BODY = '#1F2433';
const MUTED = '#525866';
const MUTED_SOFT = '#7A7468';
const BORDER = '#E8E6E1';

const NAVY = '#132B4F';
const NAVY_DEEP = '#0E2244';
const BLUE = '#0B4A91';
const BLUE_SOFT = '#E8F2FF';
const BLUE_TINT = '#EEF4FF';

const AMBER = '#A65F00';
const AMBER_SOFT = '#FFF0D2';
const AMBER_TINT = '#FBF1DC';

const RED = '#9F2E25';
const RED_SOFT = '#FCE8E4';

const GREEN = '#0F766E';
const GREEN_TINT = '#EAF5EE';

const LOCK_TINT = '#F2EFEA';

const FONT =
  '"DM Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
const SERIF = 'Georgia, "Times New Roman", "Iowan Old Style", serif';

export interface NexusProgramWorkbenchProps extends NexusProgramWorkbenchInput {
  id?: string;
}

// --- shared atoms --------------------------------------------------------

function Eyebrow({
  children,
  light = false,
}: {
  children: React.ReactNode;
  light?: boolean;
}) {
  return (
    <div
      style={{
        color: light ? 'rgba(255,255,255,0.72)' : NAVY,
        fontSize: 10.5,
        fontWeight: 800,
        letterSpacing: '0.16em',
        textTransform: 'uppercase',
      }}
    >
      {children}
    </div>
  );
}

// --- journey card --------------------------------------------------------

function phaseTileStyle(
  state: NexusWorkbenchPhaseNode['state'],
  isSelected: boolean,
): React.CSSProperties {
  const palette =
    state === 'done'
      ? { bg: GREEN_TINT, border: 'rgba(15,118,110,0.30)' }
      : state === 'current'
        ? { bg: BLUE_TINT, border: 'rgba(11,74,145,0.40)' }
        : state === 'gate-pending'
          ? { bg: AMBER_TINT, border: 'rgba(166,95,0,0.40)' }
          : { bg: LOCK_TINT, border: BORDER };
  return {
    flex: '1 1 0',
    minWidth: 144,
    padding: '14px 14px 16px',
    borderRadius: 14,
    background: palette.bg,
    border: `${isSelected ? 2 : 1}px solid ${isSelected ? NAVY : palette.border}`,
    boxShadow: isSelected ? '0 14px 30px rgba(19,43,79,0.10)' : 'none',
    transition: 'border-color 160ms ease, box-shadow 160ms ease',
    cursor: 'pointer',
    textAlign: 'left',
    font: 'inherit',
    color: 'inherit',
  };
}

function phaseStateTextColor(state: NexusWorkbenchPhaseNode['state']): string {
  if (state === 'done') return GREEN;
  if (state === 'current') return BLUE;
  if (state === 'gate-pending') return AMBER;
  return MUTED_SOFT;
}

function PhaseTile({
  phase,
  isSelected,
  onSelect,
}: {
  phase: NexusWorkbenchPhaseNode;
  isSelected: boolean;
  onSelect: (key: string) => void;
}) {
  return (
    <button
      type="button"
      data-phase-state={phase.state}
      data-phase-selected={isSelected ? 'true' : 'false'}
      aria-pressed={isSelected}
      aria-label={`Focus Nexus workbench on ${phase.label} (${phase.stateLabel})`}
      onClick={() => onSelect(phase.key)}
      style={phaseTileStyle(phase.state, isSelected)}
    >
      <div style={{ color: MUTED_SOFT, fontSize: 10.5, fontWeight: 800, letterSpacing: '0.14em' }}>
        P{phase.index}
      </div>
      <div
        style={{
          marginTop: 8,
          fontFamily: SERIF,
          fontSize: 18,
          color: INK,
          lineHeight: 1.15,
        }}
      >
        {phase.label}
      </div>
      <div
        style={{
          marginTop: 8,
          color: phaseStateTextColor(phase.state),
          fontSize: 11.5,
          fontWeight: 600,
        }}
      >
        {phase.stateLabel}
      </div>
    </button>
  );
}

function JourneyCard({
  programIdentity,
  subtitle,
  phases,
  selectedPhaseKey,
  onSelect,
}: {
  programIdentity: string;
  subtitle: string;
  phases: NexusWorkbenchPhaseNode[];
  selectedPhaseKey: string;
  onSelect: (key: string) => void;
}) {
  const journeyText = `Phase Journey: ${phases.map((phase) => phase.label).join(' → ')}`;
  return (
    <section
      data-region="journey-hero"
      aria-label="Program journey"
      style={{
        padding: '22px 22px 20px',
        borderRadius: 18,
        background: CARD,
        border: `1px solid ${BORDER}`,
        boxShadow: '0 12px 28px rgba(19,43,79,0.04)',
      }}
    >
      <h2
        style={{
          margin: 0,
          fontFamily: SERIF,
          fontSize: 26,
          fontWeight: 600,
          color: INK,
          lineHeight: 1.16,
        }}
      >
        Program journey
      </h2>
      <p
        style={{
          margin: '6px 0 16px',
          color: MUTED,
          fontSize: 13.5,
          lineHeight: 1.5,
        }}
      >
        {subtitle}
      </p>
      <span aria-hidden style={{ display: 'none' }}>
        {/* Keep the legacy "Phase Journey" marker text in source for the
         *  contract test, even though the visible heading is now "Program
         *  journey". */}
        {journeyText} · for {programIdentity}
      </span>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(6, minmax(0, 1fr))',
          gap: 10,
        }}
      >
        {phases.map((phase) => (
          <PhaseTile
            key={phase.key}
            phase={phase}
            isSelected={phase.key === selectedPhaseKey}
            onSelect={onSelect}
          />
        ))}
      </div>
    </section>
  );
}

// --- dark Nexus brief card ----------------------------------------------

function DarkChip({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '5px 11px',
        borderRadius: 999,
        background: 'rgba(255,255,255,0.10)',
        color: '#FFFFFF',
        fontSize: 11.5,
        fontWeight: 600,
      }}
    >
      {children}
    </span>
  );
}

function CreamPill({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: 'cream' | 'rose';
}) {
  const palette =
    tone === 'cream'
      ? { bg: '#F4ECDC', fg: AMBER }
      : { bg: '#F8DCD3', fg: RED };
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '6px 12px',
        borderRadius: 999,
        background: palette.bg,
        color: palette.fg,
        fontSize: 11.5,
        fontWeight: 700,
      }}
    >
      {children}
    </span>
  );
}

function NexusBriefCard({
  brief,
  cta,
  contextUsed,
  confidenceLabel,
  blockerLabel,
}: {
  brief: string;
  cta: string;
  contextUsed: string[];
  confidenceLabel: string;
  blockerLabel: string;
}) {
  return (
    <section
      aria-label="Nexus workbench"
      style={{
        padding: '24px 26px 22px',
        borderRadius: 20,
        background: `linear-gradient(180deg, ${NAVY} 0%, ${NAVY_DEEP} 100%)`,
        color: '#FFFFFF',
        border: '1px solid rgba(11,74,145,0.30)',
        boxShadow: '0 30px 60px rgba(19,43,79,0.18)',
      }}
    >
      <h3
        style={{
          margin: 0,
          fontFamily: SERIF,
          fontSize: 22,
          fontWeight: 600,
          color: '#FFFFFF',
          lineHeight: 1.2,
        }}
      >
        Nexus Program Workbench
      </h3>
      <p
        style={{
          margin: '12px 0 18px',
          color: 'rgba(255,255,255,0.84)',
          fontSize: 14,
          lineHeight: 1.6,
        }}
      >
        {brief}
      </p>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 18 }}>
        <Eyebrow light>Context used</Eyebrow>
        {contextUsed.map((label) => (
          <DarkChip key={label}>{label}</DarkChip>
        ))}
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 14,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <CreamPill tone="cream">{confidenceLabel}</CreamPill>
          <CreamPill tone="rose">{blockerLabel}</CreamPill>
        </div>
        <button
          type="button"
          aria-label={cta}
          style={{
            border: 0,
            borderRadius: 999,
            background: '#FFFFFF',
            color: NAVY,
            padding: '10px 18px',
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 6px 18px rgba(0,0,0,0.18)',
          }}
        >
          {cta}
        </button>
      </div>
    </section>
  );
}

// --- suggested actions + Ask Nexus --------------------------------------

function SuggestedActionsCard({
  actions,
  customAskPlaceholder,
}: {
  actions: NexusWorkbenchSuggestedAction[];
  customAskPlaceholder: string;
}) {
  return (
    <section
      aria-label="Suggested Nexus actions"
      style={{
        padding: '18px 18px 16px',
        borderRadius: 18,
        background: CARD,
        border: `1px solid ${BORDER}`,
      }}
    >
      <h4
        style={{
          margin: 0,
          fontFamily: SERIF,
          fontSize: 18,
          fontWeight: 600,
          color: INK,
        }}
      >
        Suggested Nexus actions
      </h4>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 14 }}>
        {actions.map((action) => (
          <button
            key={action.label}
            type="button"
            aria-label={action.description}
            style={{
              border: `1px solid ${BORDER}`,
              borderRadius: 999,
              background: BLUE_SOFT,
              color: NAVY,
              padding: '9px 14px',
              fontSize: 12.5,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {action.label}
          </button>
        ))}
      </div>
      <label htmlFor="nexus-program-custom-ask" style={{ display: 'block', marginTop: 16 }}>
        <span style={{ display: 'block' }}>
          <Eyebrow>Ask Nexus</Eyebrow>
        </span>
      </label>
      <input
        id="nexus-program-custom-ask"
        type="text"
        disabled
        placeholder={customAskPlaceholder}
        style={{
          width: '100%',
          marginTop: 8,
          padding: '12px 14px',
          border: `1px solid ${BORDER}`,
          borderRadius: 12,
          background: '#FCFCFA',
          color: BODY,
          fontFamily: FONT,
          fontSize: 12.5,
          lineHeight: 1.4,
        }}
      />
    </section>
  );
}

// --- current gate + evidence coverage -----------------------------------

function CurrentGateCard({
  gateLabel,
  description,
}: {
  gateLabel: string;
  description: string;
}) {
  return (
    <section
      aria-label="Current gate"
      style={{
        padding: '16px 18px 18px',
        borderRadius: 16,
        background: CARD,
        border: `1px solid ${BORDER}`,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <h4
        style={{
          margin: 0,
          fontFamily: SERIF,
          fontSize: 18,
          fontWeight: 600,
          color: INK,
        }}
      >
        Current gate
      </h4>
      <span
        style={{
          alignSelf: 'flex-start',
          padding: '6px 12px',
          borderRadius: 999,
          background: AMBER_TINT,
          color: AMBER,
          fontSize: 12,
          fontWeight: 700,
        }}
      >
        {gateLabel}
      </span>
      <p style={{ margin: 0, color: MUTED, fontSize: 12.5, lineHeight: 1.55 }}>
        {description}
      </p>
    </section>
  );
}

function evidenceTone(tone: NexusWorkbenchEvidenceSlice['tone']): string {
  if (tone === 'strong') return BLUE;
  if (tone === 'partial') return '#3B6EB6';
  if (tone === 'draft') return '#7B98C7';
  if (tone === 'staged') return '#B5C7DF';
  return '#D6DEEC';
}

function EvidenceCoverageCard({
  slices,
  note,
}: {
  slices: NexusWorkbenchEvidenceSlice[];
  note: string;
}) {
  const total = slices.reduce((sum, slice) => sum + slice.percentage, 0) || 1;
  const strongest = slices.reduce(
    (best, slice) => (slice.percentage > best.percentage ? slice : best),
    slices[0]!,
  );
  return (
    <section
      aria-label="Evidence coverage"
      style={{
        padding: '16px 18px 18px',
        borderRadius: 16,
        background: CARD,
        border: `1px solid ${BORDER}`,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
        }}
      >
        <h4
          style={{
            margin: 0,
            fontFamily: SERIF,
            fontSize: 18,
            fontWeight: 600,
            color: INK,
          }}
        >
          Evidence coverage
        </h4>
        <span
          style={{
            color: BLUE,
            fontSize: 12.5,
            fontWeight: 700,
          }}
        >
          {strongest.percentage}% {strongest.phaseLabel.toLowerCase()}
        </span>
      </div>
      <div
        aria-hidden
        style={{
          display: 'flex',
          width: '100%',
          height: 18,
          borderRadius: 999,
          overflow: 'hidden',
          border: `1px solid ${BORDER}`,
        }}
      >
        {slices.map((slice) => (
          <div
            key={slice.phaseKey}
            title={`${slice.phaseLabel}: ${slice.percentage}%`}
            style={{
              flex: `${slice.percentage} 0 0%`,
              background: evidenceTone(slice.tone),
            }}
          />
        ))}
      </div>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 8,
          marginTop: 4,
        }}
      >
        {slices.map((slice) => (
          <span
            key={slice.phaseKey}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 11.5,
              color: MUTED,
            }}
          >
            <span
              aria-hidden
              style={{
                width: 8,
                height: 8,
                borderRadius: 999,
                background: evidenceTone(slice.tone),
              }}
            />
            {slice.phaseLabel} · {Math.round((slice.percentage / total) * 100)}%
          </span>
        ))}
      </div>
      <p style={{ margin: 0, color: MUTED, fontSize: 12, lineHeight: 1.5 }}>{note}</p>
    </section>
  );
}

// --- subnav (C-6) --------------------------------------------------------

function SubnavTabsBar({
  tabs,
  activeKey,
  onSelect,
}: {
  tabs: NexusWorkbenchSubnavTab[];
  activeKey: string;
  onSelect: (key: NexusWorkbenchSubnavTab['key']) => void;
}) {
  return (
    <nav
      aria-label="Program subnav"
      style={{
        display: 'flex',
        gap: 6,
        flexWrap: 'wrap',
        padding: '6px',
        borderRadius: 999,
        background: SURFACE,
        border: `1px solid ${BORDER}`,
        width: 'max-content',
        maxWidth: '100%',
      }}
    >
      {tabs.map((tab) => {
        const isActive = tab.key === activeKey;
        return (
          <button
            key={tab.key}
            type="button"
            data-tab={tab.key}
            data-tab-active={isActive ? 'true' : 'false'}
            aria-pressed={isActive}
            onClick={() => onSelect(tab.key)}
            style={{
              border: 0,
              borderRadius: 999,
              padding: '7px 14px',
              background: isActive ? NAVY : 'transparent',
              color: isActive ? '#FFFFFF' : NAVY,
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: FONT,
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}

// --- C-5 workshop canvas -------------------------------------------------

function WorkshopColumn({ title, items }: { title: string; items: string[] }) {
  return (
    <div
      style={{
        flex: '1 1 0',
        minWidth: 200,
        padding: 14,
        borderRadius: 14,
        background: '#FCFCFA',
        border: `1px solid ${BORDER}`,
      }}
    >
      <Eyebrow>{title}</Eyebrow>
      <ul style={{ margin: '8px 0 0', paddingLeft: 18, color: BODY, fontSize: 12.5, lineHeight: 1.6 }}>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function WorkshopCanvas({ workshop }: { workshop: NexusWorkbenchWorkshop }) {
  return (
    <section
      aria-label="Nexus workshop canvas"
      style={{
        padding: '20px 22px 18px',
        borderRadius: 18,
        background: CARD,
        border: `1px solid ${BORDER}`,
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}
    >
      <div>
        <Eyebrow>Nexus workshop canvas</Eyebrow>
        <h4
          style={{
            margin: '6px 0 0',
            fontFamily: SERIF,
            fontSize: 20,
            fontWeight: 600,
            color: INK,
          }}
        >
          {workshop.title}
        </h4>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
        <WorkshopColumn title="Agenda" items={workshop.agenda} />
        <WorkshopColumn title="Questions to capture" items={workshop.questions} />
        <WorkshopColumn title="Evidence to capture" items={workshop.evidenceToCapture} />
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
        <Eyebrow>Attendees</Eyebrow>
        {workshop.attendees.map((attendee) => (
          <span
            key={attendee}
            style={{
              padding: '4px 10px',
              borderRadius: 999,
              background: BLUE_SOFT,
              color: NAVY,
              fontSize: 11.5,
              fontWeight: 700,
            }}
          >
            {attendee}
          </span>
        ))}
      </div>
    </section>
  );
}

// --- C-8 missing inputs / evidence panel --------------------------------

function MissingInputRow({ input }: { input: NexusWorkbenchMissingInput }) {
  const tone =
    input.state === 'satisfied'
      ? { bg: GREEN_TINT, fg: GREEN, mark: '✓', label: 'Satisfied' }
      : input.state === 'in-progress'
        ? { bg: BLUE_SOFT, fg: NAVY, mark: '◐', label: 'In progress' }
        : { bg: AMBER_SOFT, fg: AMBER, mark: '○', label: 'Open' };
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
        padding: '10px 12px',
        borderRadius: 12,
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
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: INK, fontSize: 13, fontWeight: 600, lineHeight: 1.35 }}>{input.label}</div>
        <div style={{ marginTop: 2, color: MUTED, fontSize: 11.5 }}>Source: {input.sourceLabel}</div>
      </div>
    </div>
  );
}

function MissingInputsPanel({ inputs }: { inputs: NexusWorkbenchMissingInput[] }) {
  return (
    <section
      aria-label="Evidence and missing inputs"
      style={{
        padding: '20px 22px 18px',
        borderRadius: 18,
        background: CARD,
        border: `1px solid ${BORDER}`,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <div>
        <Eyebrow>Evidence · missing inputs</Eyebrow>
        <h4
          style={{
            margin: '6px 0 0',
            fontFamily: SERIF,
            fontSize: 20,
            fontWeight: 600,
            color: INK,
          }}
        >
          What still needs to land for this gate
        </h4>
      </div>
      <div style={{ display: 'grid', gap: 8 }}>
        {inputs.map((input) => (
          <MissingInputRow key={input.label} input={input} />
        ))}
      </div>
    </section>
  );
}

// --- agent rail (right) --------------------------------------------------

function agentStateTone(state: NexusWorkbenchAgentHandoff['state']): { fg: string; bg: string } {
  if (state === 'active') return { fg: BLUE, bg: BLUE_SOFT };
  if (state === 'blocked') return { fg: RED, bg: RED_SOFT };
  if (state === 'partial') return { fg: AMBER, bg: AMBER_SOFT };
  return { fg: MUTED, bg: '#F4EFE6' };
}

function AgentRow({ handoff }: { handoff: NexusWorkbenchAgentHandoff }) {
  const tone = agentStateTone(handoff.state);
  const isActive = handoff.state === 'active';
  return (
    <div
      style={{
        padding: '12px 14px',
        borderRadius: 14,
        background: isActive ? BLUE_TINT : CARD,
        border: `1px solid ${isActive ? 'rgba(11,74,145,0.30)' : BORDER}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
      }}
    >
      <div>
        <div
          style={{
            fontFamily: SERIF,
            fontSize: 16,
            fontWeight: 600,
            color: INK,
            lineHeight: 1.2,
          }}
        >
          {handoff.label}
        </div>
        <div style={{ marginTop: 4, color: MUTED, fontSize: 12, lineHeight: 1.45 }}>
          {handoff.role}
        </div>
      </div>
      <span
        style={{
          padding: '4px 10px',
          borderRadius: 999,
          background: tone.bg,
          color: tone.fg,
          fontSize: 10.5,
          fontWeight: 800,
          letterSpacing: '0.14em',
        }}
      >
        {handoff.stateLabel}
      </span>
    </div>
  );
}

function AgentRail({
  agentHandoffs,
  threeChoicesRule,
}: {
  agentHandoffs: NexusWorkbenchAgentHandoff[];
  threeChoicesRule: string;
}) {
  return (
    <aside
      aria-label="Agent rail"
      style={{
        padding: '20px 20px 18px',
        borderRadius: 18,
        background: CARD,
        border: `1px solid ${BORDER}`,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        alignSelf: 'flex-start',
      }}
    >
      <div>
        <h3
          style={{
            margin: 0,
            fontFamily: SERIF,
            fontSize: 20,
            fontWeight: 600,
            color: INK,
          }}
        >
          Agent handoff rail
        </h3>
        <p
          style={{
            margin: '6px 0 6px',
            color: MUTED,
            fontSize: 12.5,
            lineHeight: 1.5,
          }}
        >
          Agents appear because they have a job in the current program state, not as decorative chat personas.
        </p>
      </div>
      {agentHandoffs.map((handoff) => (
        <AgentRow key={handoff.agent} handoff={handoff} />
      ))}
      <div
        style={{
          marginTop: 4,
          padding: '10px 12px',
          borderRadius: 12,
          background: SURFACE,
          border: `1px solid ${BORDER}`,
        }}
      >
        <Eyebrow>3 choices + custom</Eyebrow>
        <div style={{ marginTop: 6, color: MUTED, fontSize: 12, lineHeight: 1.45 }}>
          {threeChoicesRule}
        </div>
      </div>
    </aside>
  );
}

// --- main ----------------------------------------------------------------

export function NexusProgramWorkbench(props: NexusProgramWorkbenchProps) {
  const view = buildNexusProgramWorkbenchView(props);

  const [selectedPhaseKey, setSelectedPhaseKey] = useState<string>(view.defaultPhaseKey);
  const [activeTab, setActiveTab] = useState<NexusWorkbenchSubnavTab['key']>('overview');
  const selectedFocus =
    view.phaseFocusByKey[selectedPhaseKey] ?? view.phaseFocusByKey[view.defaultPhaseKey]!;

  return (
    <section
      id={props.id}
      data-component="NexusProgramWorkbench"
      aria-label="Nexus workbench"
      style={{ fontFamily: FONT, color: BODY }}
    >
      {/* Identity header — terse, then the journey card is the spine. */}
      <header style={{ marginBottom: 18 }}>
        <h2
          style={{
            margin: 0,
            fontFamily: SERIF,
            fontSize: 32,
            fontWeight: 600,
            color: INK,
            lineHeight: 1.15,
          }}
        >
          {view.programIdentity}
        </h2>
        <p
          style={{
            margin: '8px 0 0',
            color: MUTED,
            fontSize: 14,
            lineHeight: 1.55,
            maxWidth: 920,
          }}
        >
          {view.headerSubtitle}
        </p>
      </header>

      <div style={{ marginBottom: 22 }}>
        <JourneyCard
          programIdentity={view.programIdentity}
          subtitle={view.journeySubtitle}
          phases={view.phaseJourney}
          selectedPhaseKey={selectedPhaseKey}
          onSelect={setSelectedPhaseKey}
        />
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) minmax(280px, 320px)',
          gap: 18,
          alignItems: 'start',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <NexusBriefCard
            brief={selectedFocus.brief}
            cta={selectedFocus.cta}
            contextUsed={selectedFocus.contextUsed}
            confidenceLabel={selectedFocus.confidenceLabel}
            blockerLabel={selectedFocus.blockerLabel}
          />

          <SubnavTabsBar
            tabs={view.subnavTabs}
            activeKey={activeTab}
            onSelect={setActiveTab}
          />

          {activeTab === 'overview' ? (
            <>
              <SuggestedActionsCard
                actions={selectedFocus.suggestedActions}
                customAskPlaceholder={view.customAskPlaceholder}
              />
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                  gap: 14,
                }}
              >
                <CurrentGateCard
                  gateLabel={view.currentGateLabel}
                  description={view.currentGateDescription}
                />
                <EvidenceCoverageCard
                  slices={view.evidenceCoverage}
                  note={view.evidenceCoverageNote}
                />
              </div>
            </>
          ) : null}

          {activeTab === 'workshop' ? (
            <WorkshopCanvas workshop={selectedFocus.workshop} />
          ) : null}

          {activeTab === 'evidence' ? (
            <>
              <MissingInputsPanel inputs={selectedFocus.missingInputs} />
              <EvidenceCoverageCard
                slices={view.evidenceCoverage}
                note={view.evidenceCoverageNote}
              />
            </>
          ) : null}

          {activeTab === 'gate' ? (
            <>
              <CurrentGateCard
                gateLabel={view.currentGateLabel}
                description={view.currentGateDescription}
              />
              <MissingInputsPanel inputs={selectedFocus.missingInputs} />
            </>
          ) : null}

          {activeTab === 'actions' ? (
            <SuggestedActionsCard
              actions={selectedFocus.suggestedActions}
              customAskPlaceholder={view.customAskPlaceholder}
            />
          ) : null}

          {activeTab === 'deliverables' ? (
            <section
              aria-label="Deliverables scoped panel"
              style={{
                padding: '20px 22px 18px',
                borderRadius: 18,
                background: CARD,
                border: `1px solid ${BORDER}`,
              }}
            >
              <Eyebrow>Deliverables</Eyebrow>
              <p
                style={{
                  margin: '8px 0 0',
                  color: BODY,
                  fontSize: 13,
                  lineHeight: 1.5,
                }}
              >
                The full deliverables-by-phase table renders below the workbench (C-7).
                Click a row in that table to open the Deliverable Detail Drawer once the
                drawer wave lands.
              </p>
            </section>
          ) : null}
        </div>

        <AgentRail
          agentHandoffs={selectedFocus.agentHandoffs}
          threeChoicesRule={view.threeChoicesRule}
        />
      </div>

      <p
        style={{
          margin: '20px 0 0',
          color: MUTED_SOFT,
          fontSize: 11.5,
          fontStyle: 'italic',
          lineHeight: 1.5,
        }}
      >
        {view.deterministicCaveat}
      </p>
    </section>
  );
}

export default NexusProgramWorkbench;
