'use client';

// GeneratePhasePackage — per-document generate controls for the phase workspace.
//
// Shows every document in the phase from the registry.
// Each document has its own generate button so the user can regenerate
// a single doc without overwriting the others.
//
// A "Generate all" button runs all documents in sequence.
//
// States per document:
//   idle      — generate button
//   loading   — spinner (30–90s)
//   done      — green chip + download links per format
//   error     — red chip + retry

import { useState, useCallback } from 'react';
import {
  PHASE_CANONICAL_KEYS,
  DELIVERABLE_REGISTRY,
  FORMAT_LABELS,
  type DeliverableSpec,
  type DeliverableFormat,
} from '@/lib/programs/deliverable-registry';

interface Props {
  programId: string;
  phaseNum: number;
  phaseLabel: string;
  onGenerated?: (deliverableId: string, deliverableTypeKey: string, content: string) => void;
}

type DocState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'done'; deliverableId: string; title: string; format: DeliverableFormat }
  | { status: 'error'; message: string };

type AllDocState = Record<string, DocState>;

function FormatBadge({ format }: { format: DeliverableFormat }) {
  const labels = FORMAT_LABELS[format];
  const colors: Record<string, string> = {
    HTML: '#1B2B5C', Word: '#1D4ED8', Excel: '#15803D',
  };
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {labels.map((label) => (
        <span key={label} style={{
          fontSize: 9, fontWeight: 700, letterSpacing: '0.06em',
          padding: '1px 5px', borderRadius: 3,
          fontFamily: 'JetBrains Mono, monospace',
          backgroundColor: `${colors[label]}18`,
          color: colors[label] ?? '#525866',
        }}>
          {label}
        </span>
      ))}
    </div>
  );
}

function DownloadLinks({ deliverableId, programId, format }: { deliverableId: string; programId: string; format: DeliverableFormat }) {
  const base = `/api/programs/${programId}/deliverables/${deliverableId}/content-export`;
  const btnStyle: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 3,
    padding: '4px 10px', borderRadius: 4, fontSize: 11, fontWeight: 600,
    textDecoration: 'none', cursor: 'pointer',
  };

  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <a href={`/strategic-moves/${programId}/evidence`} style={{
        ...btnStyle,
        backgroundColor: '#1B2B5C', border: '1px solid #1B2B5C', color: '#FFFFFF',
      }}>
        View in Evidence Hub →
      </a>
      {format !== 'excel' && (
        <>
          <a href={`${base}?format=docx`} style={{ ...btnStyle, backgroundColor: '#ffffff', border: '1px solid #e5e5e5', color: '#1A1A18' }}>
            ↓ Word
          </a>
          <a href={`${base}?format=html`} style={{ ...btnStyle, backgroundColor: '#ffffff', border: '1px solid #e5e5e5', color: '#1A1A18' }}>
            ↓ HTML
          </a>
        </>
      )}
      {(format === 'excel' || format === 'html-word-excel') && (
        <a href={`${base}?format=xlsx`} style={{ ...btnStyle, backgroundColor: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.3)', color: '#15803D' }}>
          ↓ Excel
        </a>
      )}
    </div>
  );
}

function DocumentRow({
  spec,
  docState,
  programId,
  onGenerate,
  onReset,
}: {
  spec: DeliverableSpec;
  docState: DocState;
  programId: string;
  onGenerate: () => void;
  onReset: () => void;
}) {
  const isLoading = docState.status === 'loading';
  const isDone = docState.status === 'done';
  const isError = docState.status === 'error';

  return (
    <div style={{
      padding: '14px 16px',
      background: '#FFFFFF',
      border: `1px solid ${isDone ? 'rgba(22,163,74,0.25)' : isError ? 'rgba(185,28,28,0.2)' : '#e5e5e5'}`,
      borderLeft: `3px solid ${spec.gateArtifact ? '#1B2B5C' : '#e5e5e5'}`,
      borderRadius: 8,
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
    }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
            <FormatBadge format={spec.formatRecommendation} />
            {spec.gateArtifact && (
              <span style={{
                fontSize: 9, fontWeight: 700, letterSpacing: '0.07em',
                color: '#1B2B5C', backgroundColor: 'rgba(27,43,92,0.07)',
                border: '1px solid rgba(27,43,92,0.18)',
                padding: '1px 6px', borderRadius: 3,
                fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase',
              }}>Gate</span>
            )}
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#1A1A18' }}>{spec.documentTitle}</div>
          <div style={{ fontSize: 11, color: '#9AA3B2', marginTop: 1 }}>{spec.audiencePrimary}</div>
        </div>

        {/* Status / action */}
        <div style={{ flexShrink: 0 }}>
          {isLoading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#525866' }}>
              <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block', fontSize: 12 }}>◌</span>
              Generating…
            </div>
          )}
          {isDone && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{
                fontSize: 10, fontWeight: 600, color: '#15803D',
                backgroundColor: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.25)',
                padding: '2px 8px', borderRadius: 999,
              }}>✓ Generated</span>
              <button
                onClick={onReset}
                style={{ fontSize: 10, color: '#9AA3B2', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                type="button"
              >
                re-run
              </button>
            </div>
          )}
          {isError && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{
                fontSize: 10, fontWeight: 600, color: '#B91C1C',
                backgroundColor: 'rgba(185,28,28,0.06)', border: '1px solid rgba(185,28,28,0.2)',
                padding: '2px 8px', borderRadius: 999,
              }}>⚠ Failed</span>
              <button
                onClick={onReset}
                style={{ fontSize: 10, color: '#9AA3B2', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                type="button"
              >
                retry
              </button>
            </div>
          )}
          {docState.status === 'idle' && (
            <button
              onClick={onGenerate}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '5px 12px',
                backgroundColor: '#1B2B5C', border: 'none',
                borderRadius: 5, fontSize: 11, fontWeight: 700,
                color: '#FFFFFF', cursor: 'pointer',
              }}
              type="button"
            >
              <span style={{ fontSize: 11 }}>⚡</span> Generate
            </button>
          )}
        </div>
      </div>

      {/* Error message */}
      {isError && (
        <div style={{ fontSize: 11, color: '#B91C1C', padding: '4px 8px', backgroundColor: 'rgba(185,28,28,0.04)', borderRadius: 4 }}>
          {(docState as { status: 'error'; message: string }).message}
        </div>
      )}

      {/* Loading progress hint */}
      {isLoading && (
        <div style={{ fontSize: 11, color: '#9AA3B2', fontStyle: 'italic' }}>
          Assembling context + drafting — this takes 30–90 seconds
        </div>
      )}

      {/* Done: download links */}
      {isDone && (
        <DownloadLinks
          deliverableId={(docState as { status: 'done'; deliverableId: string; title: string; format: DeliverableFormat }).deliverableId}
          programId={programId}
          format={(docState as { status: 'done'; deliverableId: string; title: string; format: DeliverableFormat }).format}
        />
      )}
    </div>
  );
}

export function GeneratePhasePackage({ programId, phaseNum, phaseLabel, onGenerated }: Props) {
  const canonicalKeys = PHASE_CANONICAL_KEYS[phaseNum] ?? [];
  const specs = canonicalKeys
    .map((key) => DELIVERABLE_REGISTRY.find((d) => d.deliverableTypeKey === key))
    .filter(Boolean) as DeliverableSpec[];

  const [docStates, setDocStates] = useState<AllDocState>(() =>
    Object.fromEntries(specs.map((s) => [s.deliverableTypeKey, { status: 'idle' } as DocState])),
  );
  const [isRunningAll, setIsRunningAll] = useState(false);

  const generateDoc = useCallback(async (spec: DeliverableSpec) => {
    const key = spec.deliverableTypeKey;
    setDocStates((prev) => ({ ...prev, [key]: { status: 'loading' } }));

    try {
      const res = await fetch(`/api/v1/programs/${programId}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phase: phaseNum,
          deliverableTypeKey: key,
          title: `${spec.documentTitle} — ${phaseLabel}`,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as Record<string, unknown>;
        throw new Error((err.detail as string) || (err.error as string) || `HTTP ${res.status}`);
      }

      const data = await res.json() as {
        deliverableId: string | null;
        title: string;
        content: string;
        saved: boolean;
        format?: string;
      };

      if (!data.content?.trim()) throw new Error('No content returned from generation.');

      setDocStates((prev) => ({
        ...prev,
        [key]: {
          status: 'done',
          deliverableId: data.deliverableId ?? '',
          title: data.title,
          format: (data.format as DeliverableFormat) ?? spec.formatRecommendation,
        },
      }));

      if (data.deliverableId && onGenerated) {
        onGenerated(data.deliverableId, key, data.content);
      }
    } catch (err) {
      setDocStates((prev) => ({
        ...prev,
        [key]: {
          status: 'error',
          message: err instanceof Error ? err.message : 'Generation failed. Please retry.',
        },
      }));
    }
  }, [programId, phaseNum, phaseLabel, onGenerated]);

  const generateAll = useCallback(async () => {
    setIsRunningAll(true);
    // Run sequentially to avoid overloading Claude API
    for (const spec of specs) {
      const current = docStates[spec.deliverableTypeKey];
      if (current?.status === 'done') continue; // skip already generated
      await generateDoc(spec);
    }
    setIsRunningAll(false);
  }, [specs, docStates, generateDoc]);

  const resetDoc = useCallback((key: string) => {
    setDocStates((prev) => ({ ...prev, [key]: { status: 'idle' } }));
  }, []);

  if (specs.length === 0) {
    return (
      <div style={{ fontSize: 12, color: '#9AA3B2', fontStyle: 'italic' }}>
        No documents configured for this phase.
      </div>
    );
  }

  const anyLoading = Object.values(docStates).some((s) => s.status === 'loading');
  const doneCount = Object.values(docStates).filter((s) => s.status === 'done').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Generate All button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          onClick={generateAll}
          disabled={anyLoading || isRunningAll}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            padding: '8px 18px',
            backgroundColor: anyLoading ? '#6B7280' : '#1B2B5C',
            border: 'none', borderRadius: 6,
            fontSize: 12, fontWeight: 700,
            color: '#FFFFFF', cursor: anyLoading ? 'not-allowed' : 'pointer',
            opacity: anyLoading ? 0.7 : 1,
          }}
          type="button"
        >
          {anyLoading ? (
            <>
              <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>◌</span>
              Generating…
            </>
          ) : (
            <>
              <span>⚡</span>
              Generate all {phaseLabel} documents
            </>
          )}
        </button>
        {doneCount > 0 && (
          <span style={{ fontSize: 11, color: '#15803D', fontWeight: 600 }}>
            {doneCount}/{specs.length} complete
          </span>
        )}
        <span style={{ fontSize: 11, color: '#9AA3B2' }}>
          Or generate each document individually below
        </span>
      </div>

      {/* Per-document rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {specs.map((spec) => (
          <DocumentRow
            key={spec.deliverableTypeKey}
            spec={spec}
            docState={docStates[spec.deliverableTypeKey] ?? { status: 'idle' }}
            programId={programId}
            onGenerate={() => { void generateDoc(spec); }}
            onReset={() => resetDoc(spec.deliverableTypeKey)}
          />
        ))}
      </div>
    </div>
  );
}
