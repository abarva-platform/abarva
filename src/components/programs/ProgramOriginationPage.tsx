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
import { AppShell } from '@/components/shell/AppShell';
import { AgentColumn } from '@/components/shell/AgentColumn';
import { PhaseStrip } from '@/components/shell/PhaseStrip';
import type { PhaseStripSlot } from '@/components/shell/PhaseStrip';
import { SHELL } from '@/lib/shell/shell-tokens';

// ─── Design tokens (keep local copies for form elements) ──────────────────

const CARD    = '#FFFFFF';
const BORDER  = 'rgba(20, 33, 47, 0.14)';
const INK     = '#0c1a3a';
const MUTED   = 'rgba(27, 38, 50, 0.62)';
const SUBTLE  = 'rgba(27, 38, 50, 0.42)';
const MINT    = '#0f766e';
const BLUE    = '#2563eb';
const BLUE_BG = 'rgba(37, 99, 235, 0.10)';
const AMBER   = '#b7791f';

const MONO  = SHELL.MONO;
const SANS  = SHELL.SANS;

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

  // Submission state
  const [isSubmitting, setIsSubmitting]     = React.useState(false);
  const [showSuccess, setShowSuccess]       = React.useState(false);
  const [submitError, setSubmitError]       = React.useState<string | null>(null);

  const canOpen = programName.trim().length > 0 && objective.trim().length > 0 && sponsor !== '';

  const handleOpen = async () => {
    if (!canOpen || isSubmitting) return;
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch('/api/v1/programs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originationFormResult: {
            name: programName.trim(),
            useCase: objective.trim(),
            targetOutcome: targetOutcome.trim(),
            sponsorPersonId: sponsor,
            leadPersonId: clientMaestro || sponsor,
          },
          originSource: sourceEvent
            ? (sourceEvent.startsWith('thread') ? 'intelligence_thread' : 'tower_signal')
            : 'user_initiated',
          originSourceRef: sourceEvent || null,
        }),
      });

      if (response.status === 401) {
        throw new Error('Session expired — please sign in again');
      }
      if (response.status === 403) {
        throw new Error('No active client for this account — contact your administrator');
      }
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(
          (err as { detail?: string; error?: string }).detail ??
          (err as { detail?: string; error?: string }).error ??
          'Failed to create program'
        );
      }

      const data = (await response.json()) as { programId?: string; redirectTo?: string };
      const newProgramId = data.programId;

      if (!newProgramId) {
        throw new Error('No program ID returned — please try again');
      }

      setShowSuccess(true);
      await new Promise<void>((resolve) => setTimeout(resolve, 800));
      router.push(`/programs/${newProgramId}`);
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : 'Something went wrong');
      setIsSubmitting(false);
    }
  };

  // PhaseStrip slots for origination (P0 done implied, show P1-P6)
  const originationStripPhases: PhaseStripSlot[] = [
    { id: 1, label: 'Discovery', state: 'current' },
    { id: 2, label: 'Synthesis', state: 'locked' },
    { id: 3, label: 'Design',    state: 'locked' },
    { id: 4, label: 'Build',     state: 'locked' },
    { id: 5, label: 'Activate',  state: 'locked' },
    { id: 6, label: 'Operate',   state: 'locked' },
  ];

  const stewardActions: Array<{ letter: 'A' | 'B' | 'C'; text: string; detail: string }> = [
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
  ];

  return (
    <AppShell
      surface="programs"
      topBarProps={{
        tenantName: 'Apex Retail Group',
        showLocked: true,
        context: 'New Program · P0 Originate',
      }}
      middleStrip={<PhaseStrip phases={originationStripPhases} />}
    >
      <AgentColumn
        agent={{ initials: 'Stw', name: 'Steward', role: 'Origination Lead' }}
        quote="Name the opportunity and identify the executive champion. Steward will classify the use case, match it to a proven delivery pattern, and draft a program scope for sponsor review."
        agentContext="Origination Brief · Steward active"
        actions={stewardActions}
        inputPlaceholder="Ask Steward..."
        surface="programs"
      />

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          background: SHELL.PAPER,
          padding: '24px 32px',
          fontFamily: SANS,
          color: INK,
        }}
      >
        {/* ── Page header ──────────────────────────────────────────── */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <Link
              href="/programs"
              style={{ fontFamily: MONO, fontSize: 11, color: MUTED, textDecoration: 'none' }}
            >
              Programs
            </Link>
            <span style={{ color: SUBTLE, fontFamily: MONO, fontSize: 11 }}>›</span>
            <span style={{ fontFamily: MONO, fontSize: 11, color: INK, fontWeight: 600 }}>
              New Program
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1
              style={{
                fontFamily: SHELL.SERIF,
                fontSize: 20,
                fontWeight: 600,
                color: INK,
                margin: 0,
                lineHeight: 1.2,
              }}
            >
              New Program
            </h1>
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
              P0 · Originate
            </span>
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
            {isSubmitting
              ? 'Creating program record in Supabase…'
              : showSuccess
                ? 'Program created. Redirecting to program workbench…'
                : canOpen
                  ? 'Steward will begin classifying once the program opens. Charter gate activates after scope review.'
                  : 'Fill in program name, objective, and executive sponsor to continue.'}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
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
                  pointerEvents: isSubmitting ? 'none' : undefined,
                  opacity: isSubmitting ? 0.5 : 1,
                }}
              >
                Cancel
              </Link>
              <button
                onClick={handleOpen}
                disabled={!canOpen || isSubmitting}
                style={{
                  fontFamily: SANS,
                  fontSize: 12,
                  fontWeight: 700,
                  color: (canOpen && !isSubmitting) ? '#fff' : SUBTLE,
                  background: showSuccess
                    ? MINT
                    : (canOpen && !isSubmitting)
                      ? INK
                      : 'rgba(27,38,50,0.07)',
                  border: `1px solid ${showSuccess ? MINT : (canOpen && !isSubmitting) ? INK : BORDER}`,
                  borderRadius: 6,
                  padding: '8px 18px',
                  cursor: (canOpen && !isSubmitting) ? 'pointer' : 'not-allowed',
                  transition: 'background 0.15s, color 0.15s, border-color 0.15s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  letterSpacing: '0.01em',
                  minWidth: 148,
                  justifyContent: 'center',
                }}
              >
                {showSuccess
                  ? 'Program created ✓'
                  : isSubmitting
                    ? 'Creating program…'
                    : (
                      <>
                        Open Program
                        <span style={{ fontSize: 14, lineHeight: 1 }}>→</span>
                      </>
                    )
                }
              </button>
            </div>

            {submitError && (
              <div
                style={{
                  padding: '7px 12px',
                  background: 'rgba(185, 28, 28, 0.07)',
                  border: '1px solid rgba(185, 28, 28, 0.35)',
                  borderRadius: 6,
                  fontFamily: SANS,
                  fontSize: 12,
                  color: '#b91c1c',
                  maxWidth: 340,
                  textAlign: 'right',
                }}
              >
                {submitError}
              </div>
            )}
          </div>
        </div>
      </div>
      </div>
    </AppShell>
  );
}
