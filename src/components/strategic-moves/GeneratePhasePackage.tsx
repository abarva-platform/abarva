'use client';

// GeneratePhasePackage — "Generate [Phase] Package" button for the phase workspace.
//
// Calls POST /api/v1/programs/{programId}/generate with the current phase
// and a sensible deliverableTypeKey. The API assembles all available context
// (engagement data, prior phase deliverables, tenant context chunks, phase
// pack methodology, matched patterns) and asks Claude to produce a complete
// consulting-grade document — no 6,000-char limit, no "concise" constraint.
//
// States:
//   idle      — button showing phase label
//   loading   — spinner + "Generating…" (can take 30–90s)
//   done      — green chip + links to Evidence Hub and download
//   error     — red chip + retry
//
// The generated content is saved as a deliverable_version row and is
// immediately visible in the Phase Evidence Hub (/strategic-moves/{id}/evidence).

import { useState } from 'react';

interface Props {
  programId: string;
  phaseNum: number;
  phaseLabel: string;
  /** Called after successful generation so parent can refresh deliverable shelf */
  onGenerated?: (deliverableId: string, content: string) => void;
}

// Phase → deliverableTypeKey mapping
const PHASE_DELIVERABLE_KEY: Record<number, string> = {
  1: 'charter',
  2: 'discovery_report',
  3: 'p3_design',
  4: 'roadmap',
  5: 'handoff_package',
};

type State =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'done'; deliverableId: string; title: string }
  | { status: 'error'; message: string };

export function GeneratePhasePackage({ programId, phaseNum, phaseLabel, onGenerated }: Props) {
  const [state, setState] = useState<State>({ status: 'idle' });

  async function generate() {
    setState({ status: 'loading' });

    const deliverableTypeKey = PHASE_DELIVERABLE_KEY[phaseNum] ?? `p${phaseNum}_package`;

    try {
      const res = await fetch(`/api/v1/programs/${programId}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phase: phaseNum, deliverableTypeKey }),
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
      };

      if (!data.content?.trim()) throw new Error('No content returned from generation.');

      setState({
        status: 'done',
        deliverableId: data.deliverableId ?? '',
        title: data.title,
      });

      if (data.deliverableId && onGenerated) {
        onGenerated(data.deliverableId, data.content);
      }
    } catch (err) {
      setState({
        status: 'error',
        message: err instanceof Error ? err.message : 'Generation failed. Please try again.',
      });
    }
  }

  if (state.status === 'loading') {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 16px',
        backgroundColor: '#1B2B5C',
        borderRadius: 6,
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: 600,
      }}>
        <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block', fontSize: 14 }}>◌</span>
        Generating {phaseLabel} package — assembling context &amp; drafting…
        <span style={{ fontSize: 11, opacity: 0.7, fontWeight: 400 }}>This takes 30–90 seconds</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (state.status === 'done') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 14px',
          backgroundColor: 'rgba(22,163,74,0.08)',
          border: '1px solid rgba(22,163,74,0.3)',
          borderRadius: 6,
          fontSize: 12,
          color: '#15803D',
          fontWeight: 600,
        }}>
          <span>✓</span>
          <span>{state.title} generated and saved</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <a
            href={`/strategic-moves/${programId}/evidence`}
            style={{
              padding: '5px 12px',
              backgroundColor: '#1B2B5C',
              border: '1px solid #1B2B5C',
              borderRadius: 5,
              fontSize: 12,
              fontWeight: 600,
              color: '#FFFFFF',
              textDecoration: 'none',
            }}
          >
            View in Evidence Hub →
          </a>
          {state.deliverableId && (
            <>
              <a
                href={`/api/programs/${programId}/deliverables/${state.deliverableId}/content-export?format=docx`}
                style={{
                  padding: '5px 12px',
                  backgroundColor: '#F8F7F4',
                  border: '1px solid #D4D0C8',
                  borderRadius: 5,
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#1A1A18',
                  textDecoration: 'none',
                }}
              >
                ↓ Word
              </a>
              <a
                href={`/api/programs/${programId}/deliverables/${state.deliverableId}/content-export?format=html`}
                style={{
                  padding: '5px 12px',
                  backgroundColor: '#F8F7F4',
                  border: '1px solid #D4D0C8',
                  borderRadius: 5,
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#1A1A18',
                  textDecoration: 'none',
                }}
              >
                ↓ HTML
              </a>
            </>
          )}
          <button
            onClick={() => setState({ status: 'idle' })}
            style={{
              padding: '5px 12px',
              backgroundColor: 'transparent',
              border: '1px solid #D4D0C8',
              borderRadius: 5,
              fontSize: 12,
              color: '#525866',
              cursor: 'pointer',
            }}
            type="button"
          >
            Generate again
          </button>
        </div>
      </div>
    );
  }

  if (state.status === 'error') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 12px',
          backgroundColor: 'rgba(185,28,28,0.06)',
          border: '1px solid rgba(185,28,28,0.2)',
          borderRadius: 5,
          fontSize: 12,
          color: '#B91C1C',
        }}>
          <span>⚠</span> {state.message}
        </div>
        <button
          onClick={() => setState({ status: 'idle' })}
          style={{
            alignSelf: 'flex-start',
            padding: '5px 12px',
            backgroundColor: '#1B2B5C',
            border: '1px solid #1B2B5C',
            borderRadius: 5,
            fontSize: 12,
            fontWeight: 600,
            color: '#FFFFFF',
            cursor: 'pointer',
          }}
          type="button"
        >
          Try again
        </button>
      </div>
    );
  }

  // idle
  return (
    <button
      onClick={generate}
      data-testid={`generate-phase-${phaseNum}-package`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '9px 18px',
        backgroundColor: '#1B2B5C',
        border: 'none',
        borderRadius: 6,
        fontSize: 13,
        fontWeight: 700,
        color: '#FFFFFF',
        cursor: 'pointer',
        letterSpacing: '0.01em',
      }}
      type="button"
    >
      <span style={{ fontSize: 15 }}>⚡</span>
      Generate {phaseLabel} Package
      <span style={{ fontSize: 11, opacity: 0.7, fontWeight: 400, marginLeft: 4 }}>
        Full consulting deliverable
      </span>
    </button>
  );
}
