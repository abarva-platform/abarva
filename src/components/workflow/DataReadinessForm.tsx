'use client';

// DataReadinessForm · FM-02
//
// Five-dimension data-readiness assessment rendered on D03 Success
// Metric Tree (where data backing for the metrics is declared).
// Each dimension gets status / owner / note inline; posture captures
// the tenant's overall willingness to commit.

import { useMemo, useState } from 'react';
import {
  DIMENSION_LABELS,
  STATUS_LABELS,
  VALIDATION_REASON_COPY,
  validateDataReadiness,
  type DataReadinessInput,
  type DataReadinessRecord,
  type DataReadinessValidationError,
  type ReadinessDimension,
  type ReadinessDimensionInput,
  type ReadinessStatus,
} from '@/lib/workflow/dataReadiness';

interface DataReadinessFormProps {
  programCode: string;
  existing?: DataReadinessRecord | null;
  onCommitted?: (record: DataReadinessRecord) => void;
}

const DIMENSIONS: ReadinessDimension[] = ['availability', 'quality', 'governance', 'skills', 'integration'];

type Status =
  | { kind: 'idle' }
  | { kind: 'submitting' }
  | { kind: 'error'; message: string }
  | { kind: 'committed'; record: DataReadinessRecord };

export function DataReadinessForm({ programCode, existing, onCommitted }: DataReadinessFormProps) {
  const [dimensionRows, setDimensionRows] = useState<Record<ReadinessDimension, ReadinessDimensionInput>>(
    () =>
      Object.fromEntries(
        DIMENSIONS.map((d) => [
          d,
          { dimension: d, status: 'ready' as ReadinessStatus, owner: '', note: '' },
        ]),
      ) as Record<ReadinessDimension, ReadinessDimensionInput>,
  );
  const [posture, setPosture] = useState('');
  const [status, setStatus] = useState<Status>(existing ? { kind: 'committed', record: existing } : { kind: 'idle' });
  const [errors, setErrors] = useState<DataReadinessValidationError[]>([]);

  const composed = useMemo<Partial<DataReadinessInput>>(
    () => ({
      programCode,
      dimensions: DIMENSIONS.map((d) => dimensionRows[d]),
      posture,
    }),
    [programCode, dimensionRows, posture],
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status.kind === 'submitting' || status.kind === 'committed') return;
    const validationErrors = validateDataReadiness(composed);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors([]);
    setStatus({ kind: 'submitting' });
    try {
      const res = await fetch('/api/programs/data-readiness', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(composed),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus({ kind: 'error', message: data.error ?? `HTTP ${res.status}` });
        return;
      }
      const record = data.record as DataReadinessRecord;
      setStatus({ kind: 'committed', record });
      onCommitted?.(record);
    } catch (err) {
      setStatus({ kind: 'error', message: err instanceof Error ? err.message : 'network error' });
    }
  }

  function errorForDimension(dimension: ReadinessDimension, field: 'dimension_owner' | 'dimension_note'): string | null {
    const match = errors.find((e) => e.field === field && 'dimension' in e && e.dimension === dimension);
    return match ? VALIDATION_REASON_COPY[match.reason as keyof typeof VALIDATION_REASON_COPY] : null;
  }

  function errorForPosture(): string | null {
    const match = errors.find((e) => e.field === 'posture');
    return match ? VALIDATION_REASON_COPY[match.reason as keyof typeof VALIDATION_REASON_COPY] : null;
  }

  function setDimension(d: ReadinessDimension, update: Partial<ReadinessDimensionInput>) {
    setDimensionRows((rows) => ({ ...rows, [d]: { ...rows[d], ...update } }));
  }

  if (status.kind === 'committed') {
    return <CommittedView record={status.record} />;
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        padding: 22,
        borderRadius: 14,
        background: '#FFFDF8',
        border: '1px solid rgba(26,22,18,0.1)',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        fontFamily: 'DM Sans, -apple-system, sans-serif',
      }}
    >
      <header>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#0E9F8C' }}>
          Data readiness · FM-02 · {programCode}
        </div>
        <h3 style={{ margin: '6px 0 0', fontFamily: 'Fraunces, Georgia, serif', fontSize: 20, color: '#1a1612' }}>
          Five dimensions, named owners, no silent gaps.
        </h3>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {DIMENSIONS.map((d) => {
          const row = dimensionRows[d];
          const meta = DIMENSION_LABELS[d];
          return (
            <div
              key={d}
              style={{
                padding: 14,
                background: '#FFFFFF',
                border: '1px solid rgba(26,22,18,0.08)',
                borderRadius: 10,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10 }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13, color: '#1a1612' }}>{meta.label}</div>
                  <div style={{ fontSize: 12, color: '#6d625a', fontStyle: 'italic' }}>{meta.prompt}</div>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  {(['ready', 'gaps', 'blocked'] as ReadinessStatus[]).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setDimension(d, { status: s })}
                      style={{
                        padding: '4px 10px',
                        borderRadius: 999,
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        border: `1px solid ${STATUS_LABELS[s].accent}`,
                        background: row.status === s ? STATUS_LABELS[s].accent : 'transparent',
                        color: row.status === s ? '#FFFFFF' : STATUS_LABELS[s].accent,
                        cursor: 'pointer',
                      }}
                    >
                      {STATUS_LABELS[s].label}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <input
                  type="text"
                  placeholder="Owner (name + role)"
                  value={row.owner}
                  onChange={(e) => setDimension(d, { owner: e.target.value })}
                  style={{ ...inputStyle, flex: '1 1 200px' }}
                />
              </div>
              <textarea
                placeholder={row.status === 'ready' ? 'What makes this ready?' : 'Name the specific gap or block.'}
                value={row.note}
                onChange={(e) => setDimension(d, { note: e.target.value })}
                rows={2}
                style={inputStyle}
              />
              {errorForDimension(d, 'dimension_owner') ? (
                <span style={errStyle}>{errorForDimension(d, 'dimension_owner')}</span>
              ) : null}
              {errorForDimension(d, 'dimension_note') ? (
                <span style={errStyle}>{errorForDimension(d, 'dimension_note')}</span>
              ) : null}
            </div>
          );
        })}
      </div>

      <div>
        <label style={{ fontSize: 13, fontWeight: 600, color: '#1a1612' }}>Overall posture</label>
        <textarea
          placeholder="What is the tenant committing to across the data layer for the duration of this program?"
          value={posture}
          onChange={(e) => setPosture(e.target.value)}
          rows={3}
          style={{ ...inputStyle, marginTop: 4 }}
        />
        {errorForPosture() ? <span style={errStyle}>{errorForPosture()}</span> : null}
      </div>

      {status.kind === 'error' ? (
        <div style={{ fontSize: 12, color: '#E04444', fontFamily: 'JetBrains Mono, monospace' }}>Error: {status.message}</div>
      ) : null}

      <button
        type="submit"
        disabled={status.kind === 'submitting'}
        style={{
          alignSelf: 'flex-start',
          padding: '10px 18px',
          borderRadius: 999,
          background: '#0E9F8C',
          color: '#FFFFFF',
          border: 'none',
          cursor: 'pointer',
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          opacity: status.kind === 'submitting' ? 0.6 : 1,
        }}
      >
        {status.kind === 'submitting' ? 'Submitting\u2026' : 'Submit assessment \u2192'}
      </button>
    </form>
  );
}

function CommittedView({ record }: { record: DataReadinessRecord }) {
  const blocked = record.dimensions.filter((d) => d.status === 'blocked');
  const gaps = record.dimensions.filter((d) => d.status === 'gaps');
  return (
    <section
      style={{
        padding: 18,
        borderRadius: 12,
        background: blocked.length > 0 ? 'rgba(224,68,68,0.06)' : 'rgba(20,184,166,0.06)',
        border: `1px solid ${blocked.length > 0 ? 'rgba(224,68,68,0.35)' : 'rgba(20,184,166,0.35)'}`,
        fontFamily: 'DM Sans, -apple-system, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: blocked.length > 0 ? '#E04444' : '#0E9F8C' }}>
        Readiness assessed {new Date(record.assessedAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })} {record.assessedByName ? `· ${record.assessedByName}` : ''}
      </div>
      <dl style={{ margin: 0, display: 'grid', gridTemplateColumns: 'max-content 1fr', gap: '4px 12px', fontSize: 13 }}>
        {record.dimensions.map((d) => (
          <div key={d.dimension} style={{ display: 'contents' }}>
            <dt style={{ fontWeight: 600, color: '#1a1612' }}>{DIMENSION_LABELS[d.dimension].label}</dt>
            <dd style={{ margin: 0, color: '#3d342d' }}>
              <span style={{ color: STATUS_LABELS[d.status].accent, fontWeight: 700, marginRight: 6 }}>
                [{STATUS_LABELS[d.status].label}]
              </span>
              {d.note} · <em>{d.owner}</em>
            </dd>
          </div>
        ))}
      </dl>
      <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55, color: '#3d342d' }}>{record.posture}</p>
      {blocked.length > 0 ? (
        <div style={{ fontSize: 12, color: '#E04444', fontFamily: 'JetBrains Mono, monospace' }}>
          ⚠ {blocked.length} blocked dimension{blocked.length === 1 ? '' : 's'} — Phase 1 → 2 gate is held.
        </div>
      ) : gaps.length > 0 ? (
        <div style={{ fontSize: 12, color: '#D97706', fontFamily: 'JetBrains Mono, monospace' }}>
          {gaps.length} dimension{gaps.length === 1 ? '' : 's'} with gaps · gate advances but each gap carries its owner into Phase 2.
        </div>
      ) : null}
    </section>
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
  width: '100%',
};

const errStyle: React.CSSProperties = {
  fontSize: 11,
  color: '#E04444',
  fontFamily: 'JetBrains Mono, monospace',
};
