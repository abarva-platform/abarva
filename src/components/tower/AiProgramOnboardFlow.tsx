'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/shell/AppShell';
import { AgentColumn } from '@/components/shell/AgentColumn';
import { SHELL } from '@/lib/shell/shell-tokens';
import { AI_PROGRAM_TYPE_LABELS, type AiProgramType } from '@/lib/tower/ai-program-portfolio-fixture';

// ---------------------------------------------------------------------------
// Step indicator
// ---------------------------------------------------------------------------

const STEPS = ['Program basics', 'Value hypothesis', 'Adoption plan', 'Review & launch'] as const;

function StepBar({ current }: { current: number }) {
  return (
    <div style={{ display: 'flex', gap: 0, marginBottom: 28 }}>
      {STEPS.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
              {i > 0 && (
                <div style={{ flex: 1, height: 2, background: done ? SHELL.MINT_TEXT : SHELL.CARD_LINE }} />
              )}
              <div style={{
                width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                background: done ? SHELL.MINT_TEXT : active ? SHELL.INK : SHELL.GRAY_BG,
                color: done || active ? SHELL.PAPER : SHELL.INK_MUTED,
                fontFamily: SHELL.MONO, fontSize: 11, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {done ? '✓' : String(i + 1)}
              </div>
              {i < STEPS.length - 1 && (
                <div style={{ flex: 1, height: 2, background: done ? SHELL.MINT_TEXT : SHELL.CARD_LINE }} />
              )}
            </div>
            <span style={{ fontFamily: SHELL.SANS, fontSize: 10, color: active ? SHELL.INK : SHELL.INK_MUTED, textAlign: 'center' }}>
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Field helpers
// ---------------------------------------------------------------------------

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{ fontFamily: SHELL.SANS, fontSize: 12, fontWeight: 600, color: SHELL.INK, display: 'block', marginBottom: 4 }}>
        {label}
      </label>
      {hint && <div style={{ fontFamily: SHELL.SANS, fontSize: 11, color: SHELL.INK_MUTED, marginBottom: 6 }}>{hint}</div>}
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box',
  padding: '8px 12px',
  fontFamily: SHELL.SANS, fontSize: 13, color: SHELL.INK,
  background: SHELL.CARD_WHITE, border: `1px solid ${SHELL.CARD_LINE}`, borderRadius: 7,
  outline: 'none',
};

const selectStyle: React.CSSProperties = { ...inputStyle };

// ---------------------------------------------------------------------------
// Steps
// ---------------------------------------------------------------------------

interface FormState {
  programName: string;
  vendor: string;
  programType: AiProgramType;
  owner: string;
  valueModelType: string;
  annualSpend: string;
  targetValue: string;
  eligibleUsers: string;
  targetAdoption: string;
  launchQuarter: string;
}

const INITIAL: FormState = {
  programName: '',
  vendor: '',
  programType: 'T-PROD',
  owner: '',
  valueModelType: 'time-saved',
  annualSpend: '',
  targetValue: '',
  eligibleUsers: '',
  targetAdoption: '75',
  launchQuarter: 'Q3 2026',
};

function Step1({ form, onChange }: { form: FormState; onChange: (k: keyof FormState, v: string) => void }) {
  return (
    <>
      <Field label="Program name" hint="The canonical name for this AI program.">
        <input style={inputStyle} value={form.programName} onChange={(e) => onChange('programName', e.target.value)} placeholder="e.g. Salesforce Einstein AI" />
      </Field>
      <Field label="Vendor" hint="Primary software vendor providing the AI capability.">
        <input style={inputStyle} value={form.vendor} onChange={(e) => onChange('vendor', e.target.value)} placeholder="e.g. Salesforce" />
      </Field>
      <Field label="Program type">
        <select style={selectStyle} value={form.programType} onChange={(e) => onChange('programType', e.target.value)}>
          {(Object.entries(AI_PROGRAM_TYPE_LABELS) as [AiProgramType, string][]).map(([k, v]) => (
            <option key={k} value={k}>{k} · {v}</option>
          ))}
        </select>
      </Field>
      <Field label="Program owner" hint="Senior leader accountable for ROI.">
        <input style={inputStyle} value={form.owner} onChange={(e) => onChange('owner', e.target.value)} placeholder="e.g. Chief Sales Officer" />
      </Field>
    </>
  );
}

const VALUE_MODEL_OPTIONS = [
  { value: 'time-saved', label: 'Time saved · manual task reduction' },
  { value: 'revenue-lift', label: 'Revenue lift · conversion or upsell' },
  { value: 'cost-deflection', label: 'Cost deflection · ticket/query reduction' },
  { value: 'error-reduction', label: 'Error reduction · rework cost savings' },
  { value: 'throughput', label: 'Throughput · output volume increase' },
  { value: 'composite', label: 'Composite · multiple models' },
];

function Step2({ form, onChange }: { form: FormState; onChange: (k: keyof FormState, v: string) => void }) {
  return (
    <>
      <Field label="Value model type" hint="How will you measure value delivered by this program?">
        <select style={selectStyle} value={form.valueModelType} onChange={(e) => onChange('valueModelType', e.target.value)}>
          {VALUE_MODEL_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </Field>
      <Field label="Annual spend ($)" hint="Total annual cost including licenses, implementation, and support.">
        <input style={inputStyle} type="number" value={form.annualSpend} onChange={(e) => onChange('annualSpend', e.target.value)} placeholder="e.g. 500000" />
      </Field>
      <Field label="Target annual value ($)" hint="The value this program promises to deliver in the first 12 months at full adoption.">
        <input style={inputStyle} type="number" value={form.targetValue} onChange={(e) => onChange('targetValue', e.target.value)} placeholder="e.g. 2000000" />
      </Field>
    </>
  );
}

function Step3({ form, onChange }: { form: FormState; onChange: (k: keyof FormState, v: string) => void }) {
  return (
    <>
      <Field label="Eligible users" hint="Total headcount who will have access to this tool.">
        <input style={inputStyle} type="number" value={form.eligibleUsers} onChange={(e) => onChange('eligibleUsers', e.target.value)} placeholder="e.g. 500" />
      </Field>
      <Field label="Target adoption (%)" hint="Percentage of eligible users who should be active within 12 months.">
        <input style={inputStyle} type="number" min={0} max={100} value={form.targetAdoption} onChange={(e) => onChange('targetAdoption', e.target.value)} placeholder="75" />
      </Field>
      <Field label="Target launch quarter">
        <select style={selectStyle} value={form.launchQuarter} onChange={(e) => onChange('launchQuarter', e.target.value)}>
          {['Q2 2026', 'Q3 2026', 'Q4 2026', 'Q1 2027', 'Q2 2027'].map((q) => (
            <option key={q} value={q}>{q}</option>
          ))}
        </select>
      </Field>
    </>
  );
}

function Step4({ form }: { form: FormState }) {
  const spend = Number(form.annualSpend) || 0;
  const value = Number(form.targetValue) || 0;
  const roi = spend > 0 ? ((value - spend) / spend).toFixed(2) : '—';
  const roiColor = value >= spend ? SHELL.MINT_TEXT : SHELL.RUST_TEXT;

  return (
    <div style={{ background: SHELL.CARD_WHITE, border: `1px solid ${SHELL.CARD_LINE}`, borderRadius: 10, padding: '20px 24px' }}>
      <div style={{ fontFamily: SHELL.SERIF, fontSize: 18, fontWeight: 700, color: SHELL.INK, marginBottom: 16 }}>
        {form.programName || 'Unnamed program'}
      </div>
      {[
        { label: 'Vendor', value: form.vendor || '—' },
        { label: 'Type', value: AI_PROGRAM_TYPE_LABELS[form.programType] },
        { label: 'Owner', value: form.owner || '—' },
        { label: 'Annual spend', value: spend ? `$${(spend / 1_000_000).toFixed(2)}M` : '—' },
        { label: 'Target value', value: value ? `$${(value / 1_000_000).toFixed(2)}M` : '—' },
        { label: 'Target ROI', value: spend > 0 ? `${roi}x` : '—', color: roiColor },
        { label: 'Eligible users', value: form.eligibleUsers || '—' },
        { label: 'Target adoption', value: form.targetAdoption ? `${form.targetAdoption}%` : '—' },
        { label: 'Launch target', value: form.launchQuarter },
      ].map((r) => (
        <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${SHELL.CARD_LINE}` }}>
          <span style={{ fontFamily: SHELL.SANS, fontSize: 12, color: SHELL.INK_MUTED }}>{r.label}</span>
          <span style={{ fontFamily: SHELL.MONO, fontSize: 12, color: (r as { color?: string }).color ?? SHELL.INK, fontWeight: 600 }}>{r.value}</span>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main flow
// ---------------------------------------------------------------------------

const NEXUS_QUOTES = [
  'Name the program and the vendor — this anchors the AI portfolio record.',
  'Define the value model first — without it, ROI tracking is guesswork.',
  'Set a realistic adoption target. Under 60% is shelfware risk territory.',
  'Review the program summary. Once launched, Nexus begins tracking against these numbers.',
];

export function AiProgramOnboardFlow() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(INITIAL);

  function onChange(k: keyof FormState, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  const steps = [
    <Step1 key="s1" form={form} onChange={onChange} />,
    <Step2 key="s2" form={form} onChange={onChange} />,
    <Step3 key="s3" form={form} onChange={onChange} />,
    <Step4 key="s4" form={form} />,
  ];

  return (
    <AppShell
      surface="tower"
      topBarProps={{ tenantName: 'Apex Retail Group', showLocked: true, context: 'AI Control Tower · New program' }}
    >
      <AgentColumn
        agent={{ initials: 'Nx', name: 'Nexus', role: 'Portfolio Strategist' }}
        quote={NEXUS_QUOTES[step]}
        agentContext={`Nexus · New program intake · Step ${step + 1} of ${STEPS.length}`}
        actions={[
          { letter: 'A', text: 'Use existing vendor template', detail: 'Pre-fill from Microsoft, Anthropic, ServiceNow, SAP' },
          { letter: 'B', text: 'Copy from similar program', detail: 'Clone settings from Claude Code or M365 Copilot' },
          { letter: 'C', text: 'Import from procurement record', detail: 'Pull contract data from Source event' },
        ]}
        surface="tower"
      />

      <div style={{ flex: 1, overflowY: 'auto', background: SHELL.PAPER, padding: '24px 32px' }}>
        <Link href="/tower" style={{ fontFamily: SHELL.MONO, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: SHELL.INK_SOFT, textDecoration: 'none', display: 'inline-block', marginBottom: 16 }}>
          ← Control Tower
        </Link>

        <h1 style={{ fontFamily: SHELL.SERIF, fontSize: 22, fontWeight: 400, color: SHELL.INK, margin: '0 0 4px', lineHeight: 1.2 }}>
          Add AI program
        </h1>
        <p style={{ fontFamily: SHELL.SANS, fontSize: 13, color: SHELL.INK_SOFT, margin: '0 0 24px' }}>
          Onboard a new vendor-backed AI program into the portfolio tracker
        </p>

        <StepBar current={step} />

        <div style={{ background: SHELL.CARD_WHITE, border: `1px solid ${SHELL.CARD_LINE}`, borderRadius: 10, padding: '20px 24px', marginBottom: 20 }}>
          <div style={{ fontFamily: SHELL.SERIF, fontSize: 15, fontWeight: 600, color: SHELL.INK, marginBottom: 16 }}>
            {STEPS[step]}
          </div>
          {steps[step]}
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          {step > 0 && (
            <button
              onClick={() => setStep((s) => s - 1)}
              style={{ fontFamily: SHELL.SANS, fontSize: 13, fontWeight: 600, color: SHELL.INK, background: SHELL.GRAY_BG, border: `1px solid ${SHELL.CARD_LINE}`, borderRadius: 7, padding: '8px 20px', cursor: 'pointer' }}
            >
              Back
            </button>
          )}
          {step < STEPS.length - 1 ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              style={{ fontFamily: SHELL.SANS, fontSize: 13, fontWeight: 600, color: SHELL.PAPER, background: SHELL.INK, border: 'none', borderRadius: 7, padding: '8px 24px', cursor: 'pointer' }}
            >
              Continue →
            </button>
          ) : (
            <button
              style={{ fontFamily: SHELL.SANS, fontSize: 13, fontWeight: 600, color: SHELL.PAPER, background: SHELL.MINT_TEXT, border: 'none', borderRadius: 7, padding: '8px 24px', cursor: 'pointer' }}
            >
              Launch program
            </button>
          )}
        </div>
      </div>
    </AppShell>
  );
}
