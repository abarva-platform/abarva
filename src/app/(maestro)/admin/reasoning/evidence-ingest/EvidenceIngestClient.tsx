'use client';

// EvidenceIngestClient — interactive form for injecting evidence items into
// an instance. POSTs to /api/reasoning/evidence/ingest and GETs the current
// list for the selected instance. Designed for demo use; all state is
// in-memory and resets on server restart.

import { useState, useEffect, useCallback, useRef, type ChangeEvent, type FormEvent } from 'react';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface InstanceOption {
  id: string;
  label: string;
  type: 'source' | 'program';
  description?: string;
}

interface IngestedEntry {
  item: Record<string, unknown>;
  ingestedAt: string;
}

export interface EvidenceIngestClientProps {
  instances: InstanceOption[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function groupByType(instances: InstanceOption[]) {
  const sources = instances.filter((i) => i.type === 'source');
  const programs = instances.filter((i) => i.type === 'program');
  return { sources, programs };
}

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toISOString().replace('T', ' ').slice(0, 19) + 'Z';
}

function formatItemField(item: Record<string, unknown>): string {
  if (typeof item.field === 'string') return item.field;
  return Object.keys(item).join(', ');
}

function formatItemValue(item: Record<string, unknown>): string {
  if (item.value !== undefined) return String(item.value);
  const vals = Object.values(item);
  if (vals.length > 0) return String(vals[0]);
  return '—';
}

function formatItemNote(item: Record<string, unknown>): string | null {
  if (typeof item.note === 'string' && item.note.length > 0) return item.note;
  return null;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function WarningBanner() {
  return (
    <div
      role="alert"
      style={{
        background: COLORS.amberSoft,
        border: `1px solid ${COLORS.amberInk}44`,
        borderRadius: RADIUS.md,
        padding: `${SPACING.sm} ${SPACING.md}`,
        fontFamily: TYPOGRAPHY.sans,
        fontSize: 13,
        color: COLORS.amberInk,
        display: 'flex',
        alignItems: 'center',
        gap: SPACING.sm,
        lineHeight: 1.4,
      }}
    >
      <span aria-hidden="true" style={{ flexShrink: 0, fontSize: 15 }}>⚠</span>
      <span>
        Evidence added here is <strong>in-memory only</strong> and resets on server restart. Use for demo
        purposes only.
      </span>
    </div>
  );
}

function StatusBanner({
  status,
}: {
  status: { kind: 'success' | 'error'; message: string } | null;
}) {
  if (!status) return null;
  const isSuccess = status.kind === 'success';
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        background: isSuccess ? COLORS.mintSoft : COLORS.coralSoft,
        border: `1px solid ${isSuccess ? '#6aad8a' : '#d9695a'}44`,
        borderRadius: RADIUS.md,
        padding: `${SPACING.sm} ${SPACING.md}`,
        fontFamily: TYPOGRAPHY.sans,
        fontSize: 13,
        color: isSuccess ? '#1a5c35' : '#8B1F0F',
        display: 'flex',
        alignItems: 'center',
        gap: SPACING.sm,
        lineHeight: 1.4,
      }}
    >
      <span aria-hidden="true" style={{ flexShrink: 0, fontSize: 15 }}>
        {isSuccess ? '✓' : '✕'}
      </span>
      {status.message}
    </div>
  );
}

function InstanceDescription({ instance }: { instance: InstanceOption | null }) {
  if (!instance) return null;
  return (
    <div
      style={{
        background: COLORS.skyPale,
        border: `1px solid ${COLORS.navy}22`,
        borderRadius: RADIUS.md,
        padding: `${SPACING.sm} ${SPACING.md}`,
        fontFamily: TYPOGRAPHY.sans,
        fontSize: 12,
        color: COLORS.navy,
        lineHeight: 1.5,
      }}
    >
      <span style={{ fontWeight: 600 }}>{instance.label}</span>
      {' · '}
      <span style={{ textTransform: 'capitalize' }}>{instance.type}</span>
      {' · '}
      <span style={{ fontFamily: TYPOGRAPHY.mono, fontSize: 11 }}>{instance.id}</span>
      {instance.description ? (
        <div style={{ marginTop: 4, color: `${COLORS.navy}cc` }}>{instance.description}</div>
      ) : null}
    </div>
  );
}

function IngestedList({
  entries,
  loading,
}: {
  entries: IngestedEntry[];
  loading: boolean;
}) {
  if (loading) {
    return (
      <div
        style={{
          padding: SPACING.md,
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 12,
          color: `${COLORS.ink}88`,
        }}
      >
        Loading…
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div
        style={{
          padding: SPACING.md,
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 13,
          color: `${COLORS.ink}88`,
          textAlign: 'center',
        }}
      >
        No evidence ingested for this instance yet.
      </div>
    );
  }

  const HEADER_CELL: React.CSSProperties = {
    fontFamily: TYPOGRAPHY.serif,
    fontSize: 12,
    fontWeight: 700,
    color: COLORS.ink,
    textAlign: 'left',
    padding: `${SPACING.xs} ${SPACING.sm}`,
    borderBottom: `1px solid ${COLORS.ink}22`,
    letterSpacing: '0.01em',
  };
  const CELL: React.CSSProperties = {
    fontFamily: TYPOGRAPHY.mono,
    fontSize: 11,
    color: COLORS.ink,
    padding: `${SPACING.xs} ${SPACING.sm}`,
    borderBottom: `1px solid ${COLORS.ink}0a`,
    verticalAlign: 'top',
  };

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={HEADER_CELL}>#</th>
            <th style={HEADER_CELL}>Field</th>
            <th style={HEADER_CELL}>Value</th>
            <th style={HEADER_CELL}>Note</th>
            <th style={HEADER_CELL}>Ingested at</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry, i) => (
            <tr key={i}>
              <td style={{ ...CELL, color: `${COLORS.ink}66`, width: 32 }}>{i + 1}</td>
              <td style={{ ...CELL, fontWeight: 600 }}>{formatItemField(entry.item)}</td>
              <td style={CELL}>{formatItemValue(entry.item)}</td>
              <td style={{ ...CELL, color: `${COLORS.ink}99` }}>{formatItemNote(entry.item) ?? '—'}</td>
              <td style={{ ...CELL, color: `${COLORS.ink}88`, whiteSpace: 'nowrap' }}>
                {formatTimestamp(entry.ingestedAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Label / Input helpers ─────────────────────────────────────────────────────

const LABEL_STYLE: React.CSSProperties = {
  fontFamily: TYPOGRAPHY.sans,
  fontSize: 12,
  fontWeight: 600,
  color: COLORS.ink,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  display: 'block',
  marginBottom: 4,
};

const INPUT_STYLE: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  fontFamily: TYPOGRAPHY.mono,
  fontSize: 13,
  color: COLORS.ink,
  background: COLORS.white,
  border: `1px solid ${COLORS.ink}33`,
  borderRadius: RADIUS.sm,
  padding: `${SPACING.sm} ${SPACING.md}`,
  outline: 'none',
};

// ─── Main component ───────────────────────────────────────────────────────────

export function EvidenceIngestClient({ instances }: EvidenceIngestClientProps) {
  const { sources, programs } = groupByType(instances);

  const [selectedId, setSelectedId] = useState<string>('');
  const [field, setField] = useState('');
  const [value, setValue] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<{ kind: 'success' | 'error'; message: string } | null>(null);
  const [entries, setEntries] = useState<IngestedEntry[]>([]);
  const [listLoading, setListLoading] = useState(false);

  const autoClearRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectedInstance = instances.find((i) => i.id === selectedId) ?? null;

  // Fetch evidence list for selected instance
  const fetchEntries = useCallback(async (instanceId: string) => {
    if (!instanceId) {
      setEntries([]);
      return;
    }
    setListLoading(true);
    try {
      const res = await fetch(
        `/api/reasoning/evidence/ingest?instanceId=${encodeURIComponent(instanceId)}`,
      );
      if (res.ok) {
        const data = (await res.json()) as { items: IngestedEntry[] };
        setEntries(data.items ?? []);
      }
    } catch {
      // silently swallow — list is a best-effort read
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchEntries(selectedId);
  }, [selectedId, fetchEntries]);

  function showStatus(kind: 'success' | 'error', message: string) {
    setStatus({ kind, message });
    if (autoClearRef.current) clearTimeout(autoClearRef.current);
    if (kind === 'success') {
      autoClearRef.current = setTimeout(() => setStatus(null), 3000);
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedId || !field.trim() || !value.trim()) return;

    setSubmitting(true);
    try {
      const item: Record<string, string> = { field: field.trim(), value: value.trim() };
      if (note.trim()) item.note = note.trim();

      const res = await fetch('/api/reasoning/evidence/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instanceId: selectedId, item }),
      });

      if (res.ok) {
        const data = (await res.json()) as { ok: boolean; totalAddedForInstance: number };
        showStatus(
          'success',
          `Evidence added. ${data.totalAddedForInstance} item${data.totalAddedForInstance === 1 ? '' : 's'} ingested for this instance.`,
        );
        setField('');
        setValue('');
        setNote('');
        // Refresh the list
        await fetchEntries(selectedId);
      } else {
        const data = (await res.json()) as { error?: string };
        showStatus('error', data.error ?? `Server error ${res.status}`);
      }
    } catch (err) {
      showStatus('error', err instanceof Error ? err.message : 'Network error');
    } finally {
      setSubmitting(false);
    }
  }

  const canSubmit = Boolean(selectedId && field.trim() && value.trim() && !submitting);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.md }}>
      <WarningBanner />
      <StatusBanner status={status} />

      {/* Form card */}
      <div
        style={{
          background: COLORS.white,
          border: `1px solid ${COLORS.ink}14`,
          borderRadius: RADIUS.lg,
          overflow: 'hidden',
        }}
      >
        <header
          style={{
            padding: `${SPACING.md} ${SPACING.lg}`,
            borderBottom: `1px solid ${COLORS.ink}10`,
          }}
        >
          <h2
            style={{
              fontFamily: TYPOGRAPHY.serif,
              fontSize: 18,
              color: COLORS.ink,
              margin: 0,
              letterSpacing: '-0.01em',
            }}
          >
            Inject evidence
          </h2>
          <p
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 12,
              color: `${COLORS.ink}88`,
              margin: '4px 0 0',
              lineHeight: 1.4,
            }}
          >
            Select an instance, then enter a field name and value to inject. Gate criteria that
            reference this field will re-evaluate on the next synthesis call.
          </p>
        </header>

        <form onSubmit={(e: FormEvent<HTMLFormElement>) => { void handleSubmit(e); }} style={{ padding: SPACING.lg, display: 'flex', flexDirection: 'column', gap: SPACING.md }}>
          {/* Instance selector */}
          <div>
            <label htmlFor="instance-select" style={LABEL_STYLE}>Instance</label>
            <select
              id="instance-select"
              value={selectedId}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => setSelectedId(e.target.value)}
              style={{ ...INPUT_STYLE, fontFamily: TYPOGRAPHY.sans, cursor: 'pointer' }}
            >
              <option value="">— Select an instance —</option>
              {sources.length > 0 && (
                <optgroup label="Source events">
                  {sources.map((inst) => (
                    <option key={inst.id} value={inst.id}>
                      {inst.label}
                    </option>
                  ))}
                </optgroup>
              )}
              {programs.length > 0 && (
                <optgroup label="Programs">
                  {programs.map((inst) => (
                    <option key={inst.id} value={inst.id}>
                      {inst.label}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>

          {/* Instance description strip */}
          {selectedInstance && <InstanceDescription instance={selectedInstance} />}

          {/* Field + Value row */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: SPACING.md,
            }}
          >
            <div>
              <label htmlFor="evidence-field" style={LABEL_STYLE}>Field</label>
              <input
                id="evidence-field"
                type="text"
                placeholder="e.g. vendor-selected, GATE-AMS-RFI-01"
                value={field}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setField(e.target.value)}
                style={INPUT_STYLE}
                autoComplete="off"
                spellCheck={false}
              />
            </div>
            <div>
              <label htmlFor="evidence-value" style={LABEL_STYLE}>Value</label>
              <input
                id="evidence-value"
                type="text"
                placeholder="e.g. true, done, 4"
                value={value}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setValue(e.target.value)}
                style={INPUT_STYLE}
                autoComplete="off"
                spellCheck={false}
              />
            </div>
          </div>

          {/* Optional note */}
          <div>
            <label htmlFor="evidence-note" style={LABEL_STYLE}>
              Note{' '}
              <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: `${COLORS.ink}66` }}>
                (optional)
              </span>
            </label>
            <input
              id="evidence-note"
              type="text"
              placeholder="Why this evidence is being injected"
              value={note}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setNote(e.target.value)}
              style={INPUT_STYLE}
              autoComplete="off"
            />
          </div>

          {/* Submit */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="submit"
              disabled={!canSubmit}
              style={{
                fontFamily: TYPOGRAPHY.sans,
                fontSize: 13,
                fontWeight: 600,
                letterSpacing: '0.02em',
                padding: '8px 20px',
                background: canSubmit ? COLORS.ink : `${COLORS.ink}44`,
                color: COLORS.white,
                border: 'none',
                borderRadius: RADIUS.pill,
                cursor: canSubmit ? 'pointer' : 'not-allowed',
                transition: 'background 0.15s',
              }}
            >
              {submitting ? 'Adding…' : 'Add evidence'}
            </button>
          </div>
        </form>
      </div>

      {/* Evidence list card — only shown when an instance is selected */}
      {selectedId && (
        <div
          style={{
            background: COLORS.white,
            border: `1px solid ${COLORS.ink}14`,
            borderRadius: RADIUS.lg,
            overflow: 'hidden',
          }}
        >
          <header
            style={{
              padding: `${SPACING.md} ${SPACING.lg}`,
              borderBottom: `1px solid ${COLORS.ink}10`,
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              gap: SPACING.md,
            }}
          >
            <h2
              style={{
                fontFamily: TYPOGRAPHY.serif,
                fontSize: 18,
                color: COLORS.ink,
                margin: 0,
                letterSpacing: '-0.01em',
              }}
            >
              Ingested evidence
            </h2>
            <span
              style={{
                fontFamily: TYPOGRAPHY.mono,
                fontSize: 11,
                color: `${COLORS.ink}88`,
              }}
            >
              {listLoading ? '…' : `${entries.length} item${entries.length === 1 ? '' : 's'}`}
            </span>
          </header>
          <IngestedList entries={entries} loading={listLoading} />
        </div>
      )}
    </div>
  );
}
