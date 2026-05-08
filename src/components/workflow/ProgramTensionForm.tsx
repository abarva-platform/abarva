'use client';

// ProgramTensionForm · FM-04 companion to StakeholderSuccessForm
//
// Single-tension record form. Captures one Tier 1 stakeholder's top
// tension with a named owner and resolution path. Tensions without
// an owner or resolution path block the Phase 1 → 2 gate per FM-04.

import { useMemo, useState } from 'react';
import {
  validateProgramTension,
  VALIDATION_REASON_COPY,
  type ProgramTensionInput,
  type ProgramTensionRecord,
  type ProgramTensionValidationError,
} from '@/lib/workflow/stakeholderSuccess';

interface ProgramTensionFormProps {
  programCode: string;
  stakeholderId: string;
  stakeholderName: string;
  existing?: ProgramTensionRecord | null;
  onCommitted?: (record: ProgramTensionRecord) => void;
}

type Status =
  | { kind: 'idle' }
  | { kind: 'submitting' }
  | { kind: 'error'; message: string }
  | { kind: 'committed'; record: ProgramTensionRecord };

const CATEGORY_OPTIONS: Array<{ value: ProgramTensionInput['category']; label: string }> = [
  { value: 'scope', label: 'Scope' },
  { value: 'resource', label: 'Resource' },
  { value: 'political', label: 'Political' },
  { value: 'technical', label: 'Technical' },
  { value: 'timing', label: 'Timing' },
];

export function ProgramTensionForm({
  programCode,
  stakeholderId,
  stakeholderName,
  existing,
  onCommitted,
}: ProgramTensionFormProps) {
  const [tension, setTension] = useState('');
  const [category, setCategory] = useState<ProgramTensionInput['category']>('scope');
  const [resolutionPath, setResolutionPath] = useState('');
  const [owner, setOwner] = useState('');
  const [status, setStatus] = useState<Status>(existing ? { kind: 'committed', record: existing } : { kind: 'idle' });
  const [errors, setErrors] = useState<ProgramTensionValidationError[]>([]);

  const composed = useMemo<Partial<ProgramTensionInput>>(
    () => ({
      programCode,
      stakeholderId,
      stakeholderName,
      tension,
      category,
      resolutionPath,
      owner,
    }),
    [programCode, stakeholderId, stakeholderName, tension, category, resolutionPath, owner],
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status.kind === 'submitting' || status.kind === 'committed') return;
    const validationErrors = validateProgramTension(composed);
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
        body: JSON.stringify({ kind: 'tension', record: composed }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus({ kind: 'error', message: data.error ?? `HTTP ${res.status}` });
        return;
      }
      const record = data.record as ProgramTensionRecord;
      setStatus({ kind: 'committed', record });
      onCommitted?.(record);
    } catch (err) {
      setStatus({ kind: 'error', message: err instanceof Error ? err.message : 'network error' });
    }
  }

  function errorFor(field: ProgramTensionValidationError['field']): string | null {
    const match = errors.find((e) => e.field === field);
    return match ? VALIDATION_REASON_COPY[match.reason as keyof typeof VALIDATION_REASON_COPY] : null;
  }

  if (status.kind === 'committed') {
    return (
      <section
        style={{
          padding: 16,
          borderRadius: 12,
          background: 'rgba(245,158,11,0.06)',
          border: '1px solid rgba(245,158,11,0.4)',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          fontFamily: 'DM Sans, -apple-system, sans-serif',
        }}
      >
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#D97706' }}>
          Tension captured · {status.record.category}
        </div>
        <div style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 15, color: '#1a1612' }}>{status.record.stakeholderName}</div>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55, color: '#3d342d' }}>{status.record.tension}</p>
        <div style={{ fontSize: 12, color: '#6d625a' }}>
          <strong>Resolution:</strong> {status.record.resolutionPath} · owned by {status.record.owner}
        </div>
      </section>
    );
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
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#D97706' }}>
          Tension capture
        </div>
        <h4 style={{ margin: '6px 0 0', fontFamily: 'Fraunces, Georgia, serif', fontSize: 17, color: '#1a1612' }}>
          {stakeholderName} — what is the top tension that could block this program?
        </h4>
      </header>

      <Field label="Tension statement" error={errorFor('tension')}>
        <textarea
          placeholder="What specifically is in tension? One sentence."
          value={tension}
          onChange={(e) => setTension(e.target.value)}
          rows={2}
          style={inputStyle}
        />
      </Field>

      <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: 10 }}>
        <Field label="Category" error={errorFor('category')}>
          <select value={category} onChange={(e) => setCategory(e.target.value as ProgramTensionInput['category'])} style={inputStyle}>
            {CATEGORY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </Field>
        <Field label="Owner (required)" error={errorFor('owner')}>
          <input
            type="text"
            placeholder="Named person or role that owns resolving this"
            value={owner}
            onChange={(e) => setOwner(e.target.value)}
            style={inputStyle}
          />
        </Field>
      </div>

      <Field label="Resolution path" error={errorFor('resolutionPath')}>
        <textarea
          placeholder="What specific step or decision resolves this tension?"
          value={resolutionPath}
          onChange={(e) => setResolutionPath(e.target.value)}
          rows={2}
          style={inputStyle}
        />
      </Field>

      {status.kind === 'error' ? (
        <div style={{ fontSize: 12, color: '#E04444', fontFamily: 'JetBrains Mono, monospace' }}>Error: {status.message}</div>
      ) : null}

      <button type="submit" disabled={status.kind === 'submitting'} style={submitBtn}>
        {status.kind === 'submitting' ? 'Capturing\u2026' : 'Capture tension \u2192'}
      </button>
    </form>
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
  background: '#D97706',
  color: '#FFFFFF',
  border: 'none',
  cursor: 'pointer',
  fontFamily: 'JetBrains Mono, monospace',
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
};
