'use client';

// AddEvidenceForm — demo affordance for ingesting evidence against a typed
// SourceEventInstance. Posts to /api/reasoning/evidence/ingest, then calls
// router.refresh() so the server re-renders the gate panel with the new
// evidence factored in via buildEvidenceMapWithIngestions.
//
// Style: AbarVa palette only — paper card, ink text, ghost button.

import { useState, type CSSProperties, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { SHELL } from '@/lib/shell/shell-tokens';

const SECTION: CSSProperties = {
  display: 'grid',
  gap: 10,
  border: '1px solid ' + SHELL.CARD_LINE,
  borderRadius: 12,
  background: SHELL.CARD_WHITE,
  padding: 14,
};

const SECTION_LABEL: CSSProperties = {
  fontFamily: SHELL.MONO,
  fontSize: 9,
  textTransform: 'uppercase',
  letterSpacing: '0.14em',
  color: SHELL.INK_MUTED,
};

const TITLE: CSSProperties = {
  margin: '4px 0 0',
  color: SHELL.INK,
  fontFamily: SHELL.SERIF,
  fontSize: 16,
  fontWeight: 700,
  letterSpacing: '-0.01em',
};

const HELP: CSSProperties = {
  margin: 0,
  fontFamily: SHELL.SANS,
  fontSize: 12,
  color: SHELL.INK_SOFT,
};

const ROW: CSSProperties = {
  display: 'grid',
  gap: 8,
  gridTemplateColumns: '120px 160px 1fr auto',
  alignItems: 'center',
};

const INPUT: CSSProperties = {
  fontFamily: SHELL.SANS,
  fontSize: 13,
  color: SHELL.INK,
  background: SHELL.PAPER,
  border: '1px solid ' + SHELL.CARD_LINE,
  borderRadius: 6,
  padding: '6px 8px',
  outline: 'none',
};

const BUTTON: CSSProperties = {
  fontFamily: SHELL.SANS,
  fontSize: 12,
  fontWeight: 600,
  color: SHELL.INK,
  background: 'transparent',
  border: '1px solid ' + SHELL.INK,
  borderRadius: 6,
  padding: '6px 14px',
  cursor: 'pointer',
};

const STATUS_OK: CSSProperties = {
  fontFamily: SHELL.MONO,
  fontSize: 11,
  color: SHELL.MINT_TEXT,
};

const STATUS_ERR: CSSProperties = {
  fontFamily: SHELL.MONO,
  fontSize: 11,
  color: SHELL.RUST_TEXT,
};

interface AddEvidenceFormProps {
  instanceId: string;
  currentStage: string;
}

const STAGE_OPTIONS = [
  'Plan',
  'RFI',
  'Shortlist',
  'RFP',
  'Q&A',
  'Initial-Bid',
  'BAFO',
  'Selection',
  'Award',
  'Onboard',
];

export function AddEvidenceForm({ instanceId, currentStage }: AddEvidenceFormProps) {
  const router = useRouter();
  const [stage, setStage] = useState<string>(currentStage);
  const [field, setField] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [status, setStatus] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!field.trim() || !note.trim()) {
      setStatus({ kind: 'err', text: 'field and note are required' });
      return;
    }
    setSubmitting(true);
    setStatus(null);
    try {
      const item = {
        id: `ev-ingest-${Date.now()}`,
        kind: 'attestation',
        field: field.trim(),
        value: note.trim(),
        source: 'demo-add-evidence',
        recordedAt: new Date().toISOString(),
        stageId: stage,
      };
      const res = await fetch('/api/reasoning/evidence/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instanceId, item }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `ingest failed (${res.status})`);
      }
      const body = (await res.json()) as { ok: boolean; totalAddedForInstance: number };
      setField('');
      setNote('');
      setStatus({
        kind: 'ok',
        text: `evidence added · ${body.totalAddedForInstance} on this instance`,
      });
      router.refresh();
    } catch (err) {
      const text = err instanceof Error ? err.message : 'ingest failed';
      setStatus({ kind: 'err', text });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section style={SECTION}>
      <div>
        <div style={SECTION_LABEL}>Demo · Evidence ingestion</div>
        <h3 style={TITLE}>Add evidence</h3>
        <p style={HELP}>
          Posts an evidence item to this instance. Gate criteria whose evaluation
          hint matches the new field will flip on the next render.
        </p>
      </div>
      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 8 }}>
        <div style={ROW}>
          <select
            value={stage}
            onChange={(e) => setStage(e.target.value)}
            style={INPUT}
            disabled={submitting}
            aria-label="Stage"
          >
            {STAGE_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="field (e.g. soc2)"
            value={field}
            onChange={(e) => setField(e.target.value)}
            style={INPUT}
            disabled={submitting}
            aria-label="Field"
          />
          <input
            type="text"
            placeholder="note / value"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            style={INPUT}
            disabled={submitting}
            aria-label="Note"
          />
          <button type="submit" style={BUTTON} disabled={submitting}>
            {submitting ? 'adding…' : 'Add'}
          </button>
        </div>
        {status && (
          <div style={status.kind === 'ok' ? STATUS_OK : STATUS_ERR} role="status">
            {status.text}
          </div>
        )}
      </form>
    </section>
  );
}
