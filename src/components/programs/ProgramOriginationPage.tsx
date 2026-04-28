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
//
// Wizard steps:
//   Step 1 "opportunity" — program name + problem statement
//   Step 2 "success"     — target outcome + timeline horizon
//   Step 3 "owners"      — sponsor + lead + summary review + submit

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
const MONO  = SHELL.MONO;
const SANS  = SHELL.SANS;

// ─── Step metadata ─────────────────────────────────────────────────────────

const STEPS = [
  { n: 1, slug: 'opportunity', label: 'Name the opportunity' },
  { n: 2, slug: 'success',     label: 'Define success'       },
  { n: 3, slug: 'owners',      label: 'Assign owners + confirm' },
] as const;

type StepNumber = 1 | 2 | 3;

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

// ─── Step indicator ────────────────────────────────────────────────────────

function StepIndicator({ currentStep }: { currentStep: StepNumber }) {
  const step = STEPS[currentStep - 1];
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        marginBottom: 16,
      }}
    >
      {STEPS.map((s) => {
        const isCurrent  = s.n === currentStep;
        const isComplete = s.n < currentStep;
        return (
          <React.Fragment key={s.n}>
            {s.n > 1 && (
              <div
                style={{
                  flex: 1,
                  height: 1,
                  background: isComplete || isCurrent ? MINT : BORDER,
                  transition: 'background 0.2s',
                }}
              />
            )}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                opacity: isCurrent ? 1 : isComplete ? 0.75 : 0.38,
              }}
            >
              <div
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  background: isCurrent ? INK : isComplete ? MINT : 'transparent',
                  border: `1.5px solid ${isCurrent ? INK : isComplete ? MINT : BORDER}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  transition: 'background 0.2s, border-color 0.2s',
                }}
              >
                {isComplete ? (
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4l3 3 5-6" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  <span
                    style={{
                      fontFamily: MONO,
                      fontSize: 10,
                      fontWeight: 700,
                      color: isCurrent ? '#fff' : SUBTLE,
                      lineHeight: 1,
                    }}
                  >
                    {s.n}
                  </span>
                )}
              </div>
              <span
                style={{
                  fontFamily: SANS,
                  fontSize: 11,
                  fontWeight: isCurrent ? 600 : 400,
                  color: isCurrent ? INK : MUTED,
                  whiteSpace: 'nowrap',
                }}
              >
                {s.label}
              </span>
            </div>
          </React.Fragment>
        );
      })}
      {/* Current step label for screen readers / compact summary */}
      <span
        style={{
          fontFamily: MONO,
          fontSize: 10,
          color: SUBTLE,
          marginLeft: 'auto',
          flexShrink: 0,
        }}
      >
        Step {step.n} of {STEPS.length}
      </span>
    </div>
  );
}

// ─── Summary review card (step 3) ─────────────────────────────────────────

interface SummaryCardProps {
  programName: string;
  objective: string;
  targetOutcome: string;
  timeline: string;
}

function SummaryCard({ programName, objective, targetOutcome, timeline }: SummaryCardProps) {
  const rows: Array<{ label: string; value: string }> = [
    { label: 'Program name',      value: programName  || '—' },
    { label: 'Problem statement', value: objective     || '—' },
    { label: 'Target outcome',    value: targetOutcome || '—' },
    { label: 'Timeline',          value: timeline      || 'Not defined' },
  ];
  return (
    <div
      style={{
        background: 'rgba(27,38,50,0.03)',
        border: `1px solid ${BORDER}`,
        borderRadius: 8,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '8px 12px',
          borderBottom: `1px solid ${BORDER}`,
          fontFamily: SANS,
          fontSize: 10,
          fontWeight: 700,
          color: MUTED,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
        }}
      >
        Review · Steps 1 &amp; 2
      </div>
      <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {rows.map((r) => (
          <div key={r.label} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <span
              style={{
                fontFamily: SANS,
                fontSize: 11,
                fontWeight: 600,
                color: SUBTLE,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                width: 130,
                flexShrink: 0,
                paddingTop: 1,
              }}
            >
              {r.label}
            </span>
            <span
              style={{
                fontFamily: SANS,
                fontSize: 12,
                color: r.value === '—' || r.value === 'Not defined' ? SUBTLE : INK,
                lineHeight: 1.4,
                fontStyle: r.value === '—' || r.value === 'Not defined' ? 'italic' : 'normal',
              }}
            >
              {r.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────

export interface ProgramOriginationPageProps {
  tenantSlug: string;
}

export function ProgramOriginationPage({ tenantSlug: _tenantSlug }: ProgramOriginationPageProps) {
  const router = useRouter();
  void _tenantSlug;

  // Wizard step
  const [currentStep, setCurrentStep] = React.useState<StepNumber>(1);

  // Step 1 fields
  const [programName, setProgramName] = React.useState('');
  const [objective, setObjective]     = React.useState('');

  // Step 2 fields
  const [targetOutcome, setTargetOutcome] = React.useState('');
  const [timeline, setTimeline]           = React.useState('');

  // Step 3 fields
  const [sponsor, setSponsor]           = React.useState('');
  const [clientMaestro, setClientMaestro] = React.useState('');

  // Submission state (step 3 only)
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [showSuccess, setShowSuccess]   = React.useState(false);
  const [submitError, setSubmitError]   = React.useState<string | null>(null);
  const canonicalCreateHref = '/programs/new';

  // Step validity
  const step1Valid = programName.trim().length > 0 && objective.trim().length > 0;
  const step3Valid = sponsor !== '';
  const canOpen    = step1Valid && step3Valid;

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
          originSource: 'user_initiated',
          originSourceRef: null,
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

  // ── Button helpers ────────────────────────────────────────────────────────

  const ghostButtonStyle: React.CSSProperties = {
    fontFamily: SANS,
    fontSize: 12,
    fontWeight: 500,
    color: MUTED,
    background: CARD,
    border: `1px solid ${BORDER}`,
    borderRadius: 6,
    padding: '8px 14px',
    cursor: 'pointer',
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
  };

  const nextButtonStyle = (enabled: boolean): React.CSSProperties => ({
    fontFamily: SANS,
    fontSize: 12,
    fontWeight: 700,
    color: enabled ? '#fff' : SUBTLE,
    background: enabled ? INK : 'rgba(27,38,50,0.07)',
    border: `1px solid ${enabled ? INK : BORDER}`,
    borderRadius: 6,
    padding: '8px 18px',
    cursor: enabled ? 'pointer' : 'not-allowed',
    transition: 'background 0.15s, color 0.15s, border-color 0.15s',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    letterSpacing: '0.01em',
  });

  const submitButtonStyle = (enabled: boolean): React.CSSProperties => ({
    ...nextButtonStyle(enabled),
    minWidth: 148,
    justifyContent: 'center',
    background: showSuccess ? MINT : nextButtonStyle(enabled).background,
    border: `1px solid ${showSuccess ? MINT : enabled ? INK : BORDER}`,
    color: showSuccess ? '#fff' : nextButtonStyle(enabled).color,
  });

  // ── Render step content ───────────────────────────────────────────────────

  function renderStepContent() {
    if (currentStep === 1) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
            label="Problem statement"
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
        </div>
      );
    }

    if (currentStep === 2) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Field
            label="Target outcome"
            hint="What does measurable success look like?"
          >
            <textarea
              placeholder="e.g. Reduce handle time 30% · save $2.4M annually"
              value={targetOutcome}
              onChange={(e) => setTargetOutcome(e.target.value)}
              style={TEXTAREA_STYLE}
            />
          </Field>
          <Field label="Timeline horizon">
            <select
              value={timeline}
              onChange={(e) => setTimeline(e.target.value)}
              style={SELECT_STYLE}
            >
              <option value="">Not defined</option>
              <option value="3 months">3 months</option>
              <option value="6 months">6 months</option>
              <option value="12 months+">12 months+</option>
            </select>
          </Field>
        </div>
      );
    }

    // Step 3
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <SummaryCard
          programName={programName}
          objective={objective}
          targetOutcome={targetOutcome}
          timeline={timeline}
        />
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
          label="Program lead"
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
    );
  }

  // ── Render footer ─────────────────────────────────────────────────────────

  function renderFooter() {
    const isFirst = currentStep === 1;
    const isLast  = currentStep === 3;

    return (
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
        {/* Left: status message (step 3) or empty space */}
        <div
          style={{
            fontFamily: SANS,
            fontSize: 11,
            color: SUBTLE,
            lineHeight: 1.4,
            maxWidth: 440,
          }}
        >
          {isLast
            ? isSubmitting
              ? 'Creating program record in Supabase…'
              : showSuccess
                ? 'Program created. Redirecting to the canonical program workbench…'
                : canOpen
                  ? 'Steward will complete origination, then hand the program to Nexus on the canonical /programs/[id] route.'
                  : 'Select an executive sponsor to continue.'
            : null}
        </div>

        {/* Right: navigation buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Back / Cancel */}
            {isFirst ? (
              <Link
                href="/programs"
                style={ghostButtonStyle}
              >
                Cancel
              </Link>
            ) : (
              <button
                onClick={() => setCurrentStep((s) => (s - 1) as StepNumber)}
                style={ghostButtonStyle}
              >
                <span style={{ fontSize: 14, lineHeight: 1 }}>←</span> Back
              </button>
            )}

            {/* Next / Submit */}
            {isLast ? (
              <button
                onClick={handleOpen}
                disabled={!canOpen || isSubmitting}
                style={submitButtonStyle(canOpen && !isSubmitting)}
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
                    )}
              </button>
            ) : (
              <button
                onClick={() => {
                  if (currentStep === 1 && !step1Valid) return;
                  setCurrentStep((s) => (s + 1) as StepNumber);
                }}
                disabled={currentStep === 1 && !step1Valid}
                style={nextButtonStyle(currentStep === 2 || step1Valid)}
              >
                Next <span style={{ fontSize: 14, lineHeight: 1 }}>→</span>
              </button>
            )}
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
    );
  }

  // ── JSX ───────────────────────────────────────────────────────────────────

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
          <div
            style={{
              marginTop: 8,
              fontFamily: MONO,
              fontSize: 10,
              color: SUBTLE,
              letterSpacing: '0.06em',
            }}
          >
            Canonical route · <code>{canonicalCreateHref}</code>
          </div>
        </div>

        {/* ── Wizard card ──────────────────────────────────────────── */}
        <div
          style={{
            background: CARD,
            border: `1px solid ${BORDER}`,
            borderRadius: 10,
            overflow: 'hidden',
          }}
        >
          {/* Card header with step indicator */}
          <div
            style={{
              padding: '14px 18px',
              borderBottom: `1px solid ${BORDER}`,
            }}
          >
            <StepIndicator currentStep={currentStep} />
            <div
              style={{
                marginTop: 10,
                fontFamily: SANS,
                fontSize: 12,
                color: MUTED,
                lineHeight: 1.5,
              }}
            >
              Steward frames the opportunity here. Once the record opens, Nexus takes over on the canonical program detail route and the phase workbench begins at the current phase.
            </div>
          </div>

          {/* Step content */}
          <div style={{ padding: '18px' }}>
            {renderStepContent()}
          </div>

          {/* Footer navigation */}
          {renderFooter()}
        </div>
      </div>
    </AppShell>
  );
}
