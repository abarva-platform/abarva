'use client';

// StakeholderSuccessForm · File 01 FM-04 UI
//
// Companion to SponsorCommitmentForm. Captures a single Tier 1
// stakeholder's measurable definition of success. Consumers render one
// instance per required stakeholder (D02 Stakeholder Map surface owns
// the looping; this component is single-record).
//
// Shares the client-side validator with the server route so the sponsor
// sees every error at once rather than round-trip per field.

import { useMemo, useState } from 'react';
import {
  validateStakeholderSuccess,
  VALIDATION_REASON_COPY,
  type StakeholderSuccessInput,
  type StakeholderSuccessRecord,
  type StakeholderSuccessValidationError,
} from '@/lib/workflow/stakeholderSuccess';

interface StakeholderSuccessFormProps {
  programCode: string;
  stakeholderId: string;
  stakeholderName: string;
  stakeholderRole: string;
  existing?: StakeholderSuccessRecord | null;
  onCommitted?: (record: StakeholderSuccessRecord) => void;
}

type Status =
  | { kind: 'idle' }
  | { kind: 'submitting' }
  | { kind: 'error'; message: string }
  | { kind: 'committed'; record: StakeholderSuccessRecord };

export function StakeholderSuccessForm({
  programCode,
  stakeholderId,
  stakeholderName,
  stakeholderRole,
  existing,
  onCommitted,
}: StakeholderSuccessFormProps) {
  const [definition, setDefinition] = useState('');
  const [metric, setMetric] = useState('');
  const [target, setTarget] = useState('');
  const [horizonMonths, setHorizonMonths] = useState('');
  const [status, setStatus] = useState<Status>(existing ? { kind: 'committed', record: existing } : { kind: 'idle' });
  const [errors, setErrors] = useState<StakeholderSuccessValidationError[]>([]);

  const composed = useMemo<Partial<StakeholderSuccessInput>>(
    () => ({
      programCode,
      stakeholderId,
      stakeholderName,
      stakeholderRole,
      successDefinition: definition,
      metric,
      target,
      horizonMonths: Number(horizonMonths) || 0,
    }),
    [programCode, stakeholderId, stakeholderName, stakeholderRole, definition, metric, target, horizonMonths],
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status.kind === 'submitting' || status.kind === 'committed') return;
    const validationErrors = validateStakeholderSuccess(composed);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors([]);
    setStatus({ kind: 'submitting' });
    try {
      const res = await fetch('/api/programs/stakeholder-success', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'success', record: composed }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus({ kind: 'error', message: data.error ?? `HTTP ${res.status}` });
        return;
      }
      const record = data.record as StakeholderSuccessRecord;
      setStatus({ kind: 'committed', record });
      onCommitted?.(record);
    } catch (err) {
      setStatus({ kind: 'error', message: err instanceof Error ? err.message : 'network error' });
    }
  }

  function errorFor(field: StakeholderSuccessValidationError['field']): string | null {
    const match = errors.find((e) => e.field === field);
    return match ? VALIDATION_REASON_COPY[match.reason as keyof typeof VALIDATION_REASON_COPY] : null;
  }

  if (status.kind === 'committed') {
    return <CommittedView record={status.record} />;
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        padding: 18,
        borderRadius: 12,
        background: '#FFFDF8',
        border: '1px solid rgba(26,22,18,0.1)',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        fontFamily: 'DM Sans, -apple-system, sans-serif',
      }}
    >
      <header>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#9B6DFF' }}>
          Success definition · {stakeholderRole}
        </div>
        <h4 style={{ margin: '6px 0 0', fontFamily: 'Fraunces, Georgia, serif', fontSize: 17, color: '#1a1612' }}>
          {stakeholderName} — what does success look like for you?
        </h4>
      </header>

      <Field label="Definition of success" error={errorFor('successDefinition')}>
        <textarea
          placeholder="Name a measurable outcome. Numbers, percents, or dollar figures required."
          value={definition}
          onChange={(e) => setDefinition(e.target.value)}
          rows={3}
          style={inputStyle}
        />
      </Field>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <Field label="Metric" error={errorFor('metric')}>
          <input
            type="text"
            placeholder="e.g. documentation minutes per encounter"
            value={metric}
            onChange={(e) => setMetric(e.target.value)}
            style={inputStyle}
          />
        </Field>
        <Field label="Target" error={errorFor('target')}>
          <input
            type="text"
            placeholder="e.g. < 10 min by month 12"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            style={inputStyle}
          />
        </Field>
      </div>

      <Field label="Horizon (months)" error={errorFor('horizonMonths')}>
        <input
          type="number"
          min={1}
          value={horizonMonths}
          onChange={(e) => setHorizonMonths(e.target.value)}
          style={{ ...inputStyle, width: 140 }}
        />
      </Field>

      {status.kind === 'error' ? (
        <div style={{ fontSize: 12, color: '#E04444', fontFamily: 'JetBrains Mono, monospace' }}>Error: {status.message}</div>
      ) : null}

      <button type="submit" disabled={status.kind === 'submitting'} style={submitBtn}>
        {status.kind === 'submitting' ? 'Submitting\u2026' : 'Capture success \u2192'}
      </button>
    </form>
  );
}

function CommittedView({ record }: { record: StakeholderSuccessRecord }) {
  return (
    <section
      style={{
        padding: 16,
        borderRadius: 12,
        background: 'rgba(155,109,255,0.06)',
        border: '1px solid rgba(155,109,255,0.35)',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#9B6DFF' }}>
        Captured · {record.stakeholderRole}
      </div>
      <div style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 16, color: '#1a1612' }}>{record.stakeholderName}</div>
      <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55, color: '#3d342d' }}>{record.successDefinition}</p>
      <div style={{ fontSize: 12, color: '#6d625a' }}>
        <strong>{record.metric}</strong> · {record.target} · horizon {record.horizonMonths} mo
      </div>
    </section>
  );
}

function Field({ label, error, children }: { label: string; error: string | null; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: '#1a1612' }}>{label}</label>
      {children}
      {error ? <span style={{ fontSize: 11, color: '#E04444', fontFamily: 'JetBrains Mono, monospace' }}>{error}</span> : null}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: '8px 10px',
  borderRadius: 6,
  border: '1px solid rgba(26,22,18,0.15)',
  fontSize: 13,
  fontFamily: 'inherit',
  background: '#FFFFFF',
  color: '#1a1612',
  resize: 'vertical' as const,
};

const submitBtn: React.CSSProperties = {
  alignSelf: 'flex-start',
  padding: '8px 14px',
  borderRadius: 999,
  background: '#9B6DFF',
  color: '#FFFFFF',
  border: 'none',
  cursor: 'pointer',
  fontFamily: 'JetBrains Mono, monospace',
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
};
