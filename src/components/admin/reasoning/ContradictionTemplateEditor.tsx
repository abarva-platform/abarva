'use client';

// Client form wrapper for the ContradictionTemplate admin editor.
//
// Renders editable fields (label, severity, partyA, partyB, detectionHint,
// resolutionPath) for one template. Save POSTs to the override API; Reset
// DELETEs the override and reloads the page so the server-rendered UI
// reflects the change.

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { ContradictionTemplate } from '@/lib/intelligence/seed-types';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';

type Status = 'idle' | 'saving' | 'success' | 'error';

interface Props {
  patternId: string;
  baseline: ContradictionTemplate;
  current: ContradictionTemplate;
  isOverridden: boolean;
}

const FIELD_LABEL_STYLE: React.CSSProperties = {
  fontFamily: TYPOGRAPHY.sans,
  fontSize: 11,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: `${COLORS.ink}99`,
  fontWeight: 600,
  marginBottom: 4,
  display: 'block',
};

const INPUT_STYLE: React.CSSProperties = {
  width: '100%',
  fontFamily: TYPOGRAPHY.sans,
  fontSize: 13,
  color: COLORS.ink,
  background: COLORS.white,
  border: `1px solid ${COLORS.ink}22`,
  borderRadius: RADIUS.sm,
  padding: '6px 10px',
  boxSizing: 'border-box',
};

const TEXTAREA_STYLE: React.CSSProperties = {
  ...INPUT_STYLE,
  minHeight: 64,
  fontFamily: TYPOGRAPHY.sans,
  resize: 'vertical',
  lineHeight: 1.5,
};

const BUTTON_BASE: React.CSSProperties = {
  fontFamily: TYPOGRAPHY.sans,
  fontSize: 12,
  fontWeight: 600,
  padding: '8px 16px',
  borderRadius: RADIUS.sm,
  cursor: 'pointer',
  border: `1px solid ${COLORS.ink}`,
  letterSpacing: '0.02em',
};

const SAVE_BUTTON: React.CSSProperties = {
  ...BUTTON_BASE,
  background: COLORS.ink,
  color: COLORS.white,
};

const RESET_BUTTON: React.CSSProperties = {
  ...BUTTON_BASE,
  background: 'transparent',
  color: COLORS.ink,
};

export function ContradictionTemplateEditor({
  patternId,
  baseline,
  current,
  isOverridden,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<Status>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [form, setForm] = useState<ContradictionTemplate>(current);

  function update<K extends keyof ContradictionTemplate>(
    key: K,
    value: ContradictionTemplate[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    setStatus('saving');
    setErrorMessage(null);
    try {
      const response = await fetch('/api/reasoning/contradiction-templates/override', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patternId,
          templateId: baseline.id,
          override: form,
        }),
      });
      if (!response.ok) {
        const text = await response.text().catch(() => '');
        throw new Error(text || `HTTP ${response.status}`);
      }
      setStatus('success');
      startTransition(() => router.refresh());
    } catch (err) {
      setStatus('error');
      setErrorMessage(err instanceof Error ? err.message : 'unknown error');
    }
  }

  async function handleReset() {
    setStatus('saving');
    setErrorMessage(null);
    try {
      const response = await fetch('/api/reasoning/contradiction-templates/override', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patternId, templateId: baseline.id }),
      });
      if (!response.ok) {
        const text = await response.text().catch(() => '');
        throw new Error(text || `HTTP ${response.status}`);
      }
      setForm(baseline);
      setStatus('success');
      startTransition(() => router.refresh());
    } catch (err) {
      setStatus('error');
      setErrorMessage(err instanceof Error ? err.message : 'unknown error');
    }
  }

  const busy = status === 'saving' || isPending;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: SPACING.md,
      }}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: SPACING.md }}>
        <div>
          <label style={FIELD_LABEL_STYLE} htmlFor={`label-${baseline.id}`}>
            Label
          </label>
          <input
            id={`label-${baseline.id}`}
            type="text"
            value={form.label}
            onChange={(e) => update('label', e.target.value)}
            style={INPUT_STYLE}
            disabled={busy}
          />
        </div>
        <div>
          <label style={FIELD_LABEL_STYLE} htmlFor={`severity-${baseline.id}`}>
            Severity
          </label>
          <select
            id={`severity-${baseline.id}`}
            value={form.severity}
            onChange={(e) =>
              update('severity', e.target.value as ContradictionTemplate['severity'])
            }
            style={INPUT_STYLE}
            disabled={busy}
          >
            <option value="low">low</option>
            <option value="medium">medium</option>
            <option value="high">high</option>
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: SPACING.md }}>
        <div>
          <label style={FIELD_LABEL_STYLE} htmlFor={`partyA-${baseline.id}`}>
            Party A
          </label>
          <input
            id={`partyA-${baseline.id}`}
            type="text"
            value={form.partyA}
            onChange={(e) => update('partyA', e.target.value)}
            style={INPUT_STYLE}
            disabled={busy}
          />
        </div>
        <div>
          <label style={FIELD_LABEL_STYLE} htmlFor={`partyB-${baseline.id}`}>
            Party B
          </label>
          <input
            id={`partyB-${baseline.id}`}
            type="text"
            value={form.partyB}
            onChange={(e) => update('partyB', e.target.value)}
            style={INPUT_STYLE}
            disabled={busy}
          />
        </div>
      </div>

      <div>
        <label style={FIELD_LABEL_STYLE} htmlFor={`hint-${baseline.id}`}>
          Detection hint
        </label>
        <textarea
          id={`hint-${baseline.id}`}
          value={form.detectionHint}
          onChange={(e) => update('detectionHint', e.target.value)}
          style={TEXTAREA_STYLE}
          disabled={busy}
        />
      </div>

      <div>
        <label style={FIELD_LABEL_STYLE} htmlFor={`resolution-${baseline.id}`}>
          Resolution path
        </label>
        <textarea
          id={`resolution-${baseline.id}`}
          value={form.resolutionPath}
          onChange={(e) => update('resolutionPath', e.target.value)}
          style={TEXTAREA_STYLE}
          disabled={busy}
        />
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: SPACING.md,
          flexWrap: 'wrap',
        }}
      >
        <button type="button" onClick={handleSave} disabled={busy} style={SAVE_BUTTON}>
          {busy ? 'Saving…' : 'Save override'}
        </button>
        <button
          type="button"
          onClick={handleReset}
          disabled={busy || !isOverridden}
          style={{
            ...RESET_BUTTON,
            opacity: !isOverridden ? 0.4 : 1,
            cursor: !isOverridden ? 'default' : 'pointer',
          }}
        >
          Reset to default
        </button>
        {status === 'success' ? (
          <span
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 12,
              color: COLORS.mintInk,
            }}
          >
            Saved.
          </span>
        ) : null}
        {status === 'error' && errorMessage ? (
          <span
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 12,
              color: COLORS.coralInk,
            }}
          >
            Error: {errorMessage}
          </span>
        ) : null}
      </div>
    </div>
  );
}
