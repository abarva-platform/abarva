'use client';

// AddProgramEvidenceForm — demo affordance for ingesting evidence against a
// typed ProgramInstance. Posts to /api/reasoning/evidence/ingest, then calls
// router.refresh() so the server re-renders the gate / contradiction / cascade
// panels with the new evidence factored in via
// buildProgramEvidenceMapWithIngestions.
//
// Mirror of src/components/source/AddEvidenceForm.tsx, adapted to the program
// 7-phase lifecycle (P0 Originate → P6 Tower Handoff).
//
// Style: AbarVa palette only — paper card, ink text, ghost button.

import { useState, type CSSProperties, type FormEvent, type ChangeEvent, type FocusEvent } from 'react';
import { useRouter } from 'next/navigation';
import { SHELL } from '@/lib/shell/shell-tokens';
import { EvidenceTagSelector } from '@/components/reasoning/EvidenceTagSelector';
import type { EvidenceTag } from '@/lib/reasoning/evidence-tags';

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

const FILE_LABEL: CSSProperties = {
  fontFamily: SHELL.SANS,
  fontSize: 12,
  color: SHELL.INK_SOFT,
};

const FILE_HINT: CSSProperties = {
  fontFamily: SHELL.MONO,
  fontSize: 11,
  color: SHELL.INK_MUTED,
  marginTop: 2,
};

const URL_HINT: CSSProperties = {
  fontFamily: SHELL.MONO,
  fontSize: 11,
  color: SHELL.INK_MUTED,
  marginTop: 2,
};

const URL_HINT_OK: CSSProperties = {
  fontFamily: SHELL.MONO,
  fontSize: 11,
  color: SHELL.MINT_TEXT,
  marginTop: 2,
};

interface FileMeta {
  fileName: string;
  fileType: string;
  fileSizeKb: number;
  pageCount?: number;
}

interface UrlMetaResponse {
  title: string;
  description: string;
}

interface AddProgramEvidenceFormProps {
  instanceId: string;
  currentPhase: number;
}

const PHASE_OPTIONS: ReadonlyArray<{ value: number; label: string }> = [
  { value: 0, label: 'P0 · Originate' },
  { value: 1, label: 'P1 · Discovery' },
  { value: 2, label: 'P2 · Synthesis' },
  { value: 3, label: 'P3 · Design' },
  { value: 4, label: 'P4 · Execution Roadmap' },
  { value: 5, label: 'P5 · Approval & Mobilization' },
  { value: 6, label: 'P6 · Tower Handoff' },
];

export function AddProgramEvidenceForm({ instanceId, currentPhase }: AddProgramEvidenceFormProps) {
  const router = useRouter();
  const [phase, setPhase] = useState<number>(currentPhase);
  const [field, setField] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [url, setUrl] = useState<string>('');
  const [fileMeta, setFileMeta] = useState<FileMeta | null>(null);
  const [selectedTags, setSelectedTags] = useState<EvidenceTag[]>([]);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [status, setStatus] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [fetchingMeta, setFetchingMeta] = useState<boolean>(false);
  const [titleFetched, setTitleFetched] = useState<boolean>(false);

  function onFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) {
      setFileMeta(null);
      return;
    }
    const fileSizeKb = file.size / 1024;
    const meta: FileMeta = {
      fileName: file.name,
      fileType: file.type,
      fileSizeKb,
    };
    if (file.type === 'application/pdf') {
      meta.pageCount = Math.max(1, Math.round(fileSizeKb / 80));
    }
    setFileMeta(meta);
  }

  async function onUrlBlur(e: FocusEvent<HTMLInputElement>) {
    const val = e.target.value.trim();
    if (!val.startsWith('http')) return;
    setFetchingMeta(true);
    setTitleFetched(false);
    try {
      const res = await fetch('/api/evidence/url-meta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: val }),
      });
      if (!res.ok) return;
      const data = (await res.json()) as UrlMetaResponse;
      if (data.title) {
        if (!note.trim()) {
          const combined = data.description
            ? `${data.title} — ${data.description}`
            : data.title;
          setNote(combined);
        }
        setTitleFetched(true);
        setTimeout(() => setTitleFetched(false), 2000);
      }
    } catch {
      // silently fail
    } finally {
      setFetchingMeta(false);
    }
  }

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
        phase,
        ...(selectedTags.length > 0 && { tags: selectedTags }),
        ...(url.trim() && { url: url.trim() }),
        ...(fileMeta !== null && {
          fileName: fileMeta.fileName,
          fileType: fileMeta.fileType,
          fileSizeKb: fileMeta.fileSizeKb,
          ...(fileMeta.pageCount !== undefined && { pageCount: fileMeta.pageCount }),
        }),
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
      setUrl('');
      setSelectedTags([]);
      setStatus({
        kind: 'ok',
        text: `evidence added · ${body.totalAddedForInstance} on this program`,
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
          Posts an evidence item to this program. Gate criteria whose evaluation
          hint matches the new field will flip on the next render.
        </p>
      </div>
      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 8 }}>
        <div style={ROW}>
          <select
            value={phase}
            onChange={(e) => setPhase(Number(e.target.value))}
            style={INPUT}
            disabled={submitting}
            aria-label="Phase"
          >
            {PHASE_OPTIONS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="field (e.g. dpia)"
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
        <EvidenceTagSelector selectedTags={selectedTags} onChange={setSelectedTags} />
        <div style={{ display: 'grid', gap: 4 }}>
          <label style={FILE_LABEL}>
            URL (optional — paste to auto-fill note)
          </label>
          <input
            type="url"
            placeholder="https://…"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onBlur={onUrlBlur}
            style={INPUT}
            disabled={submitting}
            aria-label="URL (optional)"
          />
          {fetchingMeta && (
            <div style={URL_HINT}>Fetching title…</div>
          )}
          {!fetchingMeta && titleFetched && (
            <div style={URL_HINT_OK}>Title fetched ✓</div>
          )}
        </div>
        <div style={{ display: 'grid', gap: 4 }}>
          <label style={FILE_LABEL}>
            Attach file (optional — metadata only)
          </label>
          <input
            type="file"
            accept=".pdf,.docx,.xlsx,.pptx,.txt"
            onChange={onFileChange}
            disabled={submitting}
            style={{ fontFamily: SHELL.SANS, fontSize: 12 }}
            aria-label="Attach file (optional — metadata only)"
          />
          {fileMeta !== null && (
            <div style={FILE_HINT}>
              Selected: {fileMeta.fileName} ({Math.round(fileMeta.fileSizeKb)} KB)
            </div>
          )}
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
