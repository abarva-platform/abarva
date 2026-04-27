'use client';

// PROG-E — Phase 0 Origination page (/programs/new)
//
// Application density: 12-14px text, 44px form rows, compact.
// Steward-led workbench: Steward classifies the use case + matches patterns.
// Nexus is on-call (available once program is opened).
//
// Journey rail: Phase 1 (Origination) is active; phases 2–6 are locked.
// "Open Program →" is disabled until name + objective + sponsor are filled.
// On open → redirect to /programs/apx-01 (demo anchor for Apex Retail).

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ProgramJourneyRail,
  type ProgramPhaseSlot,
} from './ProgramJourneyRail';

// ─── Design tokens ─────────────────────────────────────────────────────────

const SURFACE = '#F8F7F4';
const CARD    = '#FFFFFF';
const DARK    = '#0F1E3F';
const DARK2   = '#162447';
const BORDER  = 'rgba(20, 33, 47, 0.14)';
const INK     = '#0c1a3a';
const MUTED   = 'rgba(27, 38, 50, 0.62)';
const SUBTLE  = 'rgba(27, 38, 50, 0.42)';
const MINT    = '#0f766e';
const MINT_BG = 'rgba(15, 118, 110, 0.10)';
const BLUE    = '#2563eb';
const BLUE_BG = 'rgba(37, 99, 235, 0.10)';
const AMBER   = '#b7791f';

const MONO  = '"JetBrains Mono", "Fira Code", monospace';
const SANS  = '"DM Sans", -apple-system, BlinkMacSystemFont, sans-serif';
const SERIF = 'Georgia, "Times New Roman", serif';

// ─── Static phase rail (Origination=1 active, 2-6 locked) ─────────────────

const ORIGINATION_RAIL: ProgramPhaseSlot[] = [
  { id: 1, label: 'Origination', state: 'current' },
  { id: 2, label: 'Charter',     state: 'locked' },
  { id: 3, label: 'Diagnose',    state: 'locked' },
  { id: 4, label: 'Design',      state: 'locked' },
  { id: 5, label: 'Execute',     state: 'locked' },
  { id: 6, label: 'Verify',      state: 'locked' },
];

// ─── Agent rail ────────────────────────────────────────────────────────────

interface OriginationAgent {
  initials: string;
  name: string;
  job: string;
  state: 'active' | 'on_call' | 'advisory' | 'idle';
}

const ORIGINATION_AGENTS: OriginationAgent[] = [
  {
    initials: 'STW',
    name: 'Steward',
    job: 'Classifying use case · matching patterns',
    state: 'active',
  },
  {
    initials: 'NXS',
    name: 'Nexus',
    job: 'On call — available after program opens',
    state: 'on_call',
  },
];

function AgentRailItem({ agent }: { agent: OriginationAgent }) {
  const stateColor: Record<OriginationAgent['state'], string> = {
    active:   MINT,
    on_call:  AMBER,
    advisory: SUBTLE,
    idle:     'rgba(27,38,50,0.35)',
  };
  const stateLabel: Record<OriginationAgent['state'], string> = {
    active:   'Active',
    on_call:  'On call',
    advisory: 'Advisory',
    idle:     'Idle',
  };
  const color = stateColor[agent.state];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '36px 1fr auto',
        alignItems: 'center',
        gap: 10,
        padding: '9px 12px',
        borderBottom: `1px solid ${BORDER}`,
        minHeight: 40,
      }}
    >
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: 6,
          background: agent.state === 'active' ? MINT_BG : 'rgba(27,38,50,0.06)',
          border: `1px solid ${agent.state === 'active' ? MINT : BORDER}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: MONO,
          fontSize: 9,
          fontWeight: 700,
          color: agent.state === 'active' ? MINT : MUTED,
          letterSpacing: '0.04em',
          flexShrink: 0,
        }}
      >
        {agent.initials}
      </div>
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontFamily: SANS,
            fontSize: 12,
            fontWeight: 600,
            color: INK,
            lineHeight: 1.2,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {agent.name}
        </div>
        <div
          style={{
            fontFamily: SANS,
            fontSize: 11,
            color: MUTED,
            lineHeight: 1.35,
            marginTop: 1,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {agent.job}
        </div>
      </div>
      <span
        style={{
          fontFamily: MONO,
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color,
          flexShrink: 0,
        }}
      >
        {stateLabel[agent.state]}
      </span>
    </div>
  );
}

// ─── Form field ────────────────────────────────────────────────────────────

interface FieldProps {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}

function Field({ label, required, hint, children }: FieldProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label
        style={{
          fontFamily: SANS,
          fontSize: 11,
          fontWeight: 600,
          color: INK,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
        }}
      >
        {label}
        {required && (
          <span style={{ color: MINT, fontSize: 12, fontWeight: 700, lineHeight: 1 }}>*</span>
        )}
      </label>
      {children}
      {hint && (
        <span
          style={{
            fontFamily: SANS,
            fontSize: 11,
            color: SUBTLE,
            lineHeight: 1.4,
          }}
        >
          {hint}
        </span>
      )}
    </div>
  );
}

const INPUT_STYLE: React.CSSProperties = {
  fontFamily: SANS,
  fontSize: 12,
  color: INK,
  background: CARD,
  border: `1px solid ${BORDER}`,
  borderRadius: 6,
  padding: '8px 10px',
  width: '100%',
  boxSizing: 'border-box',
  outline: 'none',
  lineHeight: 1.4,
};

const TEXTAREA_STYLE: React.CSSProperties = {
  ...INPUT_STYLE,
  resize: 'vertical',
  minHeight: 72,
};

const SELECT_STYLE: React.CSSProperties = {
  ...INPUT_STYLE,
  cursor: 'pointer',
  appearance: 'none',
  backgroundImage:
    'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'8\' viewBox=\'0 0 12 8\'%3E%3Cpath d=\'M1 1l5 5 5-5\' stroke=\'%23666\' stroke-width=\'1.5\' fill=\'none\'/%3E%3C/svg%3E")',
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 10px center',
  paddingRight: 28,
};

// ─── Main component ────────────────────────────────────────────────────────

export interface ProgramOriginationPageProps {
  tenantSlug: string;
}

export function ProgramOriginationPage({ tenantSlug: _tenantSlug }: ProgramOriginationPageProps) {
  const router = useRouter();

  // Form state
  const [programName, setProgramName]       = React.useState('');
  const [objective, setObjective]           = React.useState('');
  const [sponsor, setSponsor]               = React.useState('');
  const [targetOutcome, setTargetOutcome]   = React.useState('');
  const [sourceEvent, setSourceEvent]       = React.useState('');
  const [clientMaestro, setClientMaestro]   = React.useState('');

  const canOpen = programName.trim().length > 0 && objective.trim().length > 0 && sponsor !== '';

  const handleOpen = () => {
    if (!canOpen) return;
    // Demo anchor: always routes to apx-01 (Contact Center AI)
    router.push('/programs/apx-01?phase=1');
  };

  return (
    <div
      style={{
        background: SURFACE,
        minHeight: '100vh',
        fontFamily: SANS,
        color: INK,
        padding: '20px 24px 48px',
        maxWidth: 1240,
        margin: '0 auto',
        boxSizing: 'border-box',
      }}
    >
      {/* ── Breadcrumb ───────────────────────────────────────────── */}
      <nav
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontFamily: MONO,
          fontSize: 11,
          color: MUTED,
          marginBottom: 14,
        }}
      >
        <Link href="/programs" style={{ color: MUTED, textDecoration: 'none' }}>
          Programs
        </Link>
        <span style={{ color: SUBTLE }}>›</span>
        <span style={{ color: INK, fontWeight: 600 }}>New Program</span>
      </nav>

      {/* ── Status row ───────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBottom: 16,
          flexWrap: 'wrap',
        }}
      >
        <span
          style={{
            fontFamily: SANS,
            fontSize: 18,
            fontWeight: 700,
            color: INK,
            lineHeight: 1.2,
          }}
        >
          New Program
        </span>
        <span
          style={{
            padding: '3px 9px',
            borderRadius: 999,
            background: BLUE_BG,
            color: BLUE,
            fontSize: 11,
            fontWeight: 700,
            fontFamily: MONO,
            letterSpacing: '0.06em',
          }}
        >
          P0 · Origination
        </span>
      </div>

      {/* ── Journey rail ─────────────────────────────────────────── */}
      <div style={{ marginBottom: 20 }}>
        <ProgramJourneyRail
          phases={ORIGINATION_RAIL}
          viewingPhase={1}
          onPhaseSelect={() => {/* locked phases are non-interactive; Origination is already current */}}
          variant="full"
        />
      </div>

      {/* ── Two-column: Steward workbench + Agent rail ────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 280px',
          gap: 16,
          marginBottom: 20,
          alignItems: 'stretch',
        }}
      >
        {/* Dark Steward workbench */}
        <div
          style={{
            background: DARK,
            borderRadius: 10,
            padding: '18px 20px',
            color: '#fff',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Subtle gradient overlay */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `linear-gradient(135deg, ${DARK2} 0%, ${DARK} 60%)`,
              pointerEvents: 'none',
            }}
          />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 10,
              }}
            >
              <div
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 6,
                  background: MINT_BG,
                  border: `1px solid ${MINT}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: MONO,
                  fontSize: 9,
                  fontWeight: 700,
                  color: MINT,
                  letterSpacing: '0.04em',
                  flexShrink: 0,
                }}
              >
                STW
              </div>
              <span
                style={{
                  fontFamily: SERIF,
                  fontSize: 14,
                  fontWeight: 400,
                  color: 'rgba(255,255,255,0.92)',
                  letterSpacing: '0.01em',
                }}
              >
                Steward · Origination Brief
              </span>
            </div>

            <p
              style={{
                fontFamily: SANS,
                fontSize: 13,
                color: 'rgba(255,255,255,0.82)',
                lineHeight: 1.55,
                margin: 0,
                marginBottom: 14,
              }}
            >
              Name the opportunity and identify the executive champion. Steward will classify
              the use case, match it to a proven delivery pattern, and draft a program scope
              for sponsor review — typically within a few minutes.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                {
                  letter: 'A',
                  text: 'Use-case classifier',
                  detail: 'Steward maps your objective to Apex delivery archetypes',
                },
                {
                  letter: 'B',
                  text: 'Pattern matching',
                  detail: 'Retrieves similar completed programs + outcome benchmarks',
                },
                {
                  letter: 'C',
                  text: 'Charter pre-draft',
                  detail: 'Generates scope + success criteria for sponsor sign-off',
                },
              ].map(({ letter, text, detail }) => (
                <div
                  key={letter}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 9,
                    padding: '7px 10px',
                    borderRadius: 6,
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.09)',
                  }}
                >
                  <span
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 4,
                      background: 'rgba(255,255,255,0.12)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: MONO,
                      fontSize: 10,
                      fontWeight: 700,
                      color: 'rgba(255,255,255,0.7)',
                      flexShrink: 0,
                      marginTop: 1,
                    }}
                  >
                    {letter}
                  </span>
                  <div>
                    <div
                      style={{
                        fontFamily: SANS,
                        fontSize: 12,
                        fontWeight: 600,
                        color: 'rgba(255,255,255,0.9)',
                        lineHeight: 1.3,
                      }}
                    >
                      {text}
                    </div>
                    <div
                      style={{
                        fontFamily: SANS,
                        fontSize: 11,
                        color: 'rgba(255,255,255,0.52)',
                        lineHeight: 1.35,
                        marginTop: 2,
                      }}
                    >
                      {detail}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Agent rail card */}
        <div
          style={{
            background: CARD,
            border: `1px solid ${BORDER}`,
            borderRadius: 10,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '10px 12px 8px',
              borderBottom: `1px solid ${BORDER}`,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span
              style={{
                fontFamily: MONO,
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: MUTED,
              }}
            >
              Agents
            </span>
            <span
              style={{
                width: 18,
                height: 18,
                borderRadius: 999,
                background: MINT_BG,
                border: `1px solid ${MINT}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: MONO,
                fontSize: 9,
                fontWeight: 700,
                color: MINT,
              }}
            >
              1
            </span>
          </div>
          {ORIGINATION_AGENTS.map((agent) => (
            <AgentRailItem key={agent.initials} agent={agent} />
          ))}
        </div>
      </div>

      {/* ── Origination form ─────────────────────────────────────── */}
      <div
        style={{
          background: CARD,
          border: `1px solid ${BORDER}`,
          borderRadius: 10,
          overflow: 'hidden',
        }}
      >
        {/* Form header */}
        <div
          style={{
            padding: '12px 18px',
            borderBottom: `1px solid ${BORDER}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              style={{
                fontFamily: SANS,
                fontSize: 12,
                fontWeight: 700,
                color: INK,
                letterSpacing: '0.01em',
              }}
            >
              Program details
            </span>
            <span
              style={{
                fontFamily: MONO,
                fontSize: 10,
                color: SUBTLE,
              }}
            >
              · fields marked * are required
            </span>
          </div>

          {/* Required fields progress */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span
              style={{
                fontFamily: MONO,
                fontSize: 10,
                color: canOpen ? MINT : MUTED,
              }}
            >
              {[programName.trim().length > 0, objective.trim().length > 0, sponsor !== ''].filter(Boolean).length}
              /3 required
            </span>
            <div
              style={{
                width: 60,
                height: 3,
                borderRadius: 999,
                background: BORDER,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${([programName.trim().length > 0, objective.trim().length > 0, sponsor !== ''].filter(Boolean).length / 3) * 100}%`,
                  background: canOpen ? MINT : AMBER,
                  borderRadius: 999,
                  transition: 'width 0.2s ease',
                }}
              />
            </div>
          </div>
        </div>

        {/* 2-column form grid */}
        <div
          style={{
            padding: '18px',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '16px 20px',
          }}
        >
          {/* Left column */}
          <Field label="Program name" required>
            <input
              type="text"
              placeholder="e.g. Contact Center AI Transformation"
              value={programName}
              onChange={(e) => setProgramName(e.target.value)}
              style={INPUT_STYLE}
              autoFocus
            />
          </Field>

          <Field
            label="Target outcome"
            hint="Quantifiable business result this program delivers"
          >
            <textarea
              placeholder="e.g. Reduce handle time 30% · save $2.4M annually"
              value={targetOutcome}
              onChange={(e) => setTargetOutcome(e.target.value)}
              style={TEXTAREA_STYLE}
            />
          </Field>

          <Field
            label="Strategic objective"
            required
            hint="One sentence: what problem are we solving?"
          >
            <textarea
              placeholder="e.g. Deploy AI-assisted routing and summarization across 3 contact center hubs"
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              style={TEXTAREA_STYLE}
            />
          </Field>

          <Field
            label="Link source event"
            hint="Intelligence thread, signal, or meeting note that prompted this"
          >
            <select
              value={sourceEvent}
              onChange={(e) => setSourceEvent(e.target.value)}
              style={SELECT_STYLE}
            >
              <option value="">— None / enter manually —</option>
              <option value="thread-001">Thread · Q2 CX Cost Review (Apr 14)</option>
              <option value="thread-002">Thread · AI Productivity Signal (Apr 20)</option>
              <option value="signal-001">Signal · Atlas · Labor cost deviation +18%</option>
              <option value="signal-002">Signal · Sentinel · Cart abandonment spike</option>
            </select>
          </Field>

          <Field label="Executive sponsor" required hint="Must be a named executive with budget authority">
            <select
              value={sponsor}
              onChange={(e) => setSponsor(e.target.value)}
              style={SELECT_STYLE}
            >
              <option value="">— Select sponsor —</option>
              <option value="ceo">Sarah Chen · CEO</option>
              <option value="coo">Michael Torres · COO</option>
              <option value="cfo">David Kim · CFO</option>
              <option value="cto">Priya Patel · CTO</option>
              <option value="cmo">James Wright · CMO</option>
            </select>
          </Field>

          <Field
            label="Client maestro"
            hint="Apex team member driving this program day-to-day"
          >
            <select
              value={clientMaestro}
              onChange={(e) => setClientMaestro(e.target.value)}
              style={SELECT_STYLE}
            >
              <option value="">— Assign later —</option>
              <option value="maestro-001">Alex Rivera · VP Operations</option>
              <option value="maestro-002">Jordan Lee · Director, Digital</option>
              <option value="maestro-003">Morgan Blake · Head of Analytics</option>
            </select>
          </Field>
        </div>

        {/* Form footer + CTA */}
        <div
          style={{
            padding: '12px 18px',
            borderTop: `1px solid ${BORDER}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(27,38,50,0.02)',
          }}
        >
          <div
            style={{
              fontFamily: SANS,
              fontSize: 11,
              color: SUBTLE,
              lineHeight: 1.4,
              maxWidth: 440,
            }}
          >
            {canOpen
              ? 'Steward will begin classifying once the program opens. Charter gate activates after scope review.'
              : 'Fill in program name, objective, and executive sponsor to continue.'}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Link
              href="/programs"
              style={{
                fontFamily: SANS,
                fontSize: 12,
                fontWeight: 500,
                color: MUTED,
                textDecoration: 'none',
                padding: '8px 14px',
                borderRadius: 6,
                border: `1px solid ${BORDER}`,
                background: CARD,
              }}
            >
              Cancel
            </Link>
            <button
              onClick={handleOpen}
              disabled={!canOpen}
              style={{
                fontFamily: SANS,
                fontSize: 12,
                fontWeight: 700,
                color: canOpen ? '#fff' : SUBTLE,
                background: canOpen ? INK : 'rgba(27,38,50,0.07)',
                border: `1px solid ${canOpen ? INK : BORDER}`,
                borderRadius: 6,
                padding: '8px 18px',
                cursor: canOpen ? 'pointer' : 'not-allowed',
                transition: 'background 0.15s, color 0.15s',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                letterSpacing: '0.01em',
              }}
            >
              Open Program
              <span style={{ fontSize: 14, lineHeight: 1 }}>→</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
