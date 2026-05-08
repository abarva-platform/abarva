'use client';

// SponsorCommitmentForm · File 01 FM-03 P0 form UI
//
// Structured sponsor commitment — every field is required before submit.
// Validation runs client-side against the same validator the server uses
// (`src/lib/workflow/sponsorCommitment.ts`) so the sponsor sees every
// error at once rather than round-tripping per field.
//
// On successful submit, the form calls `onCommitted(record)` with the
// persisted record. Consumers (D01 Charter) use that callback to refresh
// their view and re-check phase-gate readiness.

import { useMemo, useState } from 'react';
import {
  VALIDATION_REASON_COPY,
  validateSponsorCommitment,
  type SponsorCommitmentInput,
  type SponsorCommitmentRecord,
  type SponsorCommitmentValidationError,
} from '@/lib/workflow/sponsorCommitment';

interface SponsorCommitmentFormProps {
  programCode: string;
  existing?: SponsorCommitmentRecord | null;
  onCommitted?: (record: SponsorCommitmentRecord) => void;
}

interface DecisionGateDraft {
  phase: number;
  moment: string;
  willOwn: boolean;
}

type Status =
  | { kind: 'idle' }
  | { kind: 'submitting' }
  | { kind: 'error'; message: string }
  | { kind: 'committed'; record: SponsorCommitmentRecord };

export function SponsorCommitmentForm({ programCode, existing, onCommitted }: SponsorCommitmentFormProps) {
  const [budgetAmount, setBudgetAmount] = useState<string>('');
  const [budgetScope, setBudgetScope] = useState<string>('');
  const [gates, setGates] = useState<DecisionGateDraft[]>([{ phase: 1, moment: '', willOwn: false }]);
  const [resistance, setResistance] = useState<string>('');
  const [hoursPerWeek, setHoursPerWeek] = useState<string>('');
  const [termWeeks, setTermWeeks] = useState<string>('');
  const [status, setStatus] = useState<Status>(existing ? { kind: 'committed', record: existing } : { kind: 'idle' });
  const [clientErrors, setClientErrors] = useState<SponsorCommitmentValidationError[]>([]);

  const isLocked = status.kind === 'committed' || status.kind === 'submitting';

  const composed = useMemo<Partial<SponsorCommitmentInput>>(
    () => ({
      programCode,
      budgetCeiling: {
        amount: Number(budgetAmount) || 0,
        currency: 'USD' as const,
        scope: budgetScope.trim(),
      },
      decisionGates: gates.map((g) => ({ phase: g.phase, moment: g.moment.trim(), willOwn: g.willOwn })),
      resistanceInterventions: resistance,
      timeAllocation: {
        hoursPerWeek: Number(hoursPerWeek) || 0,
        commitmentTermWeeks: Number(termWeeks) || 0,
      },
    }),
    [programCode, budgetAmount, budgetScope, gates, resistance, hoursPerWeek, termWeeks],
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isLocked) return;
    const errors = validateSponsorCommitment(composed);
    if (errors.length > 0) {
      setClientErrors(errors);
      return;
    }
    setClientErrors([]);
    setStatus({ kind: 'submitting' });
    try {
      const res = await fetch('/api/programs/sponsor-commitment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(composed),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus({ kind: 'error', message: data.error ?? `HTTP ${res.status}` });
        return;
      }
      const record = data.record as SponsorCommitmentRecord;
      setStatus({ kind: 'committed', record });
      onCommitted?.(record);
    } catch (err) {
      setStatus({ kind: 'error', message: err instanceof Error ? err.message : 'network error' });
    }
  }

  function errorFor(field: SponsorCommitmentValidationError['field']): string | null {
    const match = clientErrors.find((e) => e.field === field);
    return match ? VALIDATION_REASON_COPY[match.reason] : null;
  }

  if (status.kind === 'committed') {
    return <CommittedView record={status.record} />;
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="sponsor-commitment"
      style={{
        padding: 22,
        borderRadius: 14,
        background: '#FFFDF8',
        border: '1px solid rgba(26,22,18,0.1)',
        display: 'flex',
        flexDirection: 'column',
        gap: 18,
        fontFamily: 'DM Sans, -apple-system, sans-serif',
      }}
    >
      <header>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#0E9F8C' }}>
          Sponsor commitment · {programCode}
        </div>
        <h3 style={{ margin: '8px 0 0', fontFamily: 'Fraunces, Georgia, serif', fontSize: 20, color: '#1a1612', letterSpacing: '-0.01em' }}>
          What are you committing to before this phase advances?
        </h3>
        <p style={{ margin: '8px 0 0', fontSize: 13, lineHeight: 1.6, color: '#544b42' }}>
          The Phase 1 \u2192 Phase 2 gate requires an explicit sponsor commitment on all four dimensions. Once submitted, this record becomes the audit trail the gate checks against.
        </p>
      </header>

      <Field label="Budget ceiling (USD)" error={errorFor('budgetCeiling')}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <input
            type="number"
            min={0}
            placeholder="e.g. 240000000"
            value={budgetAmount}
            onChange={(e) => setBudgetAmount(e.target.value)}
            style={inputStyle}
          />
          <input
            type="text"
            placeholder="Scope (e.g. three-year envelope)"
            value={budgetScope}
            onChange={(e) => setBudgetScope(e.target.value)}
            style={{ ...inputStyle, flex: 1, minWidth: 200 }}
          />
        </div>
      </Field>

      <Field label="Decision gates you will own" error={errorFor('decisionGates')}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {gates.map((gate, idx) => (
            <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <input
                type="number"
                min={1}
                max={5}
                value={gate.phase}
                onChange={(e) => setGates((g: DecisionGateDraft[]) => g.map((x, i) => (i === idx ? { ...x, phase: Number(e.target.value) } : x)))}
                style={{ ...inputStyle, width: 60 }}
                title="Phase number"
              />
              <input
                type="text"
                placeholder="Decision moment (e.g. Vendor selection)"
                value={gate.moment}
                onChange={(e) => setGates((g: DecisionGateDraft[]) => g.map((x, i) => (i === idx ? { ...x, moment: e.target.value } : x)))}
                style={{ ...inputStyle, flex: 1, minWidth: 200 }}
              />
              <label style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 13, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={gate.willOwn}
                  onChange={(e) => setGates((g: DecisionGateDraft[]) => g.map((x, i) => (i === idx ? { ...x, willOwn: e.target.checked } : x)))}
                />
                I will own this
              </label>
              {gates.length > 1 ? (
                <button
                  type="button"
                  onClick={() => setGates((g: DecisionGateDraft[]) => g.filter((_, i) => i !== idx))}
                  style={miniBtnStyle}
                  aria-label="Remove gate"
                >
                  \u00d7
                </button>
              ) : null}
            </div>
          ))}
          <button
            type="button"
            onClick={() => setGates((g: DecisionGateDraft[]) => [...g, { phase: (g[g.length - 1]?.phase ?? 1) + 1, moment: '', willOwn: false }])}
            style={{ ...miniBtnStyle, alignSelf: 'flex-start', marginTop: 4 }}
          >
            + Add gate
          </button>
        </div>
      </Field>

      <Field label="How will you handle resistance?" error={errorFor('resistanceInterventions')}>
        <textarea
          placeholder="What will you personally do when a Tier 1 stakeholder escalates? One substantive sentence."
          value={resistance}
          onChange={(e) => setResistance(e.target.value)}
          rows={3}
          style={{ ...inputStyle, resize: 'vertical' }}
        />
      </Field>

      <Field label="Time allocation" error={errorFor('timeAllocation')}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            type="number"
            min={0}
            step={0.5}
            placeholder="hours/week"
            value={hoursPerWeek}
            onChange={(e) => setHoursPerWeek(e.target.value)}
            style={{ ...inputStyle, width: 140 }}
          />
          <span style={{ fontSize: 13, color: '#6d625a' }}>for</span>
          <input
            type="number"
            min={0}
            placeholder="weeks"
            value={termWeeks}
            onChange={(e) => setTermWeeks(e.target.value)}
            style={{ ...inputStyle, width: 120 }}
          />
        </div>
      </Field>

      {status.kind === 'error' ? (
        <div style={{ fontSize: 12, color: '#E04444', fontFamily: 'JetBrains Mono, monospace' }}>
          Error: {status.message}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={isLocked}
        style={{
          alignSelf: 'flex-start',
          padding: '10px 18px',
          borderRadius: 999,
          background: '#0E9F8C',
          color: '#FFFFFF',
          border: 'none',
          cursor: isLocked ? 'not-allowed' : 'pointer',
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          opacity: isLocked ? 0.6 : 1,
        }}
      >
        {status.kind === 'submitting' ? 'Submitting\u2026' : 'Submit commitment \u2192'}
      </button>
    </form>
  );
}

function Field({ label, error, children }: { label: string; error: string | null; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 13, fontWeight: 600, color: '#1a1612' }}>{label}</label>
      {children}
      {error ? <span style={{ fontSize: 11, color: '#E04444', fontFamily: 'JetBrains Mono, monospace' }}>{error}</span> : null}
    </div>
  );
}

function CommittedView({ record }: { record: SponsorCommitmentRecord }) {
  return (
    <section
      style={{
        padding: 22,
        borderRadius: 14,
        background: 'rgba(20,184,166,0.06)',
        border: '1px solid rgba(20,184,166,0.35)',
        fontFamily: 'DM Sans, -apple-system, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}
    >
      <header>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#0E9F8C' }}>
          Sponsor commitment \u00b7 COMMITTED
        </div>
        <h3 style={{ margin: '8px 0 0', fontFamily: 'Fraunces, Georgia, serif', fontSize: 20, color: '#1a1612' }}>
          {record.sponsorName ?? record.sponsorEmail ?? 'Sponsor'} committed {new Date(record.committedAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
        </h3>
      </header>
      <dl style={{ display: 'grid', gridTemplateColumns: 'max-content 1fr', gap: '6px 14px', margin: 0, fontSize: 13, lineHeight: 1.5 }}>
        <dt style={dtStyle}>Budget ceiling</dt>
        <dd style={ddStyle}>${record.budgetCeiling.amount.toLocaleString()} \u00b7 {record.budgetCeiling.scope}</dd>
        <dt style={dtStyle}>Time</dt>
        <dd style={ddStyle}>{record.timeAllocation.hoursPerWeek} hrs/week \u00d7 {record.timeAllocation.commitmentTermWeeks} weeks</dd>
        <dt style={dtStyle}>Gates owned</dt>
        <dd style={ddStyle}>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {record.decisionGates.map((g) => (
              <li key={`${g.phase}-${g.moment}`}>P{g.phase} \u00b7 {g.moment}</li>
            ))}
          </ul>
        </dd>
        <dt style={dtStyle}>Resistance plan</dt>
        <dd style={ddStyle}>{record.resistanceInterventions}</dd>
      </dl>
    </section>
  );
}

const inputStyle: React.CSSProperties = {
  padding: '9px 12px',
  borderRadius: 8,
  border: '1px solid rgba(26,22,18,0.15)',
  fontSize: 13,
  fontFamily: 'inherit',
  background: '#FFFFFF',
  color: '#1a1612',
};

const miniBtnStyle: React.CSSProperties = {
  padding: '6px 12px',
  borderRadius: 999,
  background: 'transparent',
  border: '1px solid rgba(26,22,18,0.15)',
  color: '#544b42',
  fontFamily: 'JetBrains Mono, monospace',
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  cursor: 'pointer',
};

const dtStyle: React.CSSProperties = {
  fontFamily: 'JetBrains Mono, monospace',
  fontSize: 10,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: '#8a7e72',
  fontWeight: 700,
};

const ddStyle: React.CSSProperties = {
  margin: 0,
  color: '#3d342d',
};
