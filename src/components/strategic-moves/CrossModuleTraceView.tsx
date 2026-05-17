// Cross-module decision trace viewer · Wave 5, Slice 5.4.
//
// Read-only surface that renders the joined evidence trail for one
// Move across Intelligence -> Move -> Source -> Tower. Each loop
// hand-off is one step: a `linked` step shows the joined artifact and
// a deep-link; a `not_yet_linked` step shows the gap honestly with the
// follow-on ticket reference, never a fabricated link.
//
// Styling uses the locked AbarVa design tokens (cream `--canon-bg-cream`,
// serif `--abarva-serif`, ink-black) — no new colours or fonts.

import Link from 'next/link';
import type { CrossModuleTrace, TraceStep } from '@/lib/programs/cross-module-trace-view';

interface Props {
  trace: CrossModuleTrace;
}

const COHERENCE_COPY: Record<CrossModuleTrace['coherence'], string> = {
  coherent: 'Every cross-module hand-off in this decision is wired.',
  partial:
    'Some cross-module hand-offs are wired; the rest are shown as honest gaps.',
  unwired:
    'None of the cross-module hand-offs are wired yet — the decision is coherent surface-by-surface only.',
};

function StepCard({ step, index }: { step: TraceStep; index: number }) {
  const linked = step.linkState === 'linked';
  return (
    <li
      style={{
        display: 'flex',
        gap: 16,
        padding: '20px 0',
        borderBottom: '1px solid var(--canon-border, #e5e5e5)',
      }}
    >
      <div
        aria-hidden
        style={{
          flex: '0 0 auto',
          width: 34,
          height: 34,
          borderRadius: 999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'var(--abarva-serif, Georgia, serif)',
          fontSize: 16,
          background: linked
            ? 'var(--abarva-ink-black, #1a1a1a)'
            : 'transparent',
          color: linked
            ? 'var(--canon-bg-cream, #F8F7F4)'
            : 'var(--abarva-stone, #6b6b6b)',
          border: linked
            ? 'none'
            : '1px dashed var(--abarva-stone, #6b6b6b)',
        }}
      >
        {index + 1}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 10,
            flexWrap: 'wrap',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-mono, ui-monospace, monospace)',
              fontSize: 11,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--abarva-stone, #6b6b6b)',
            }}
          >
            {step.moduleLabel} · {step.artifactKind}
          </span>
          <span
            style={{
              fontFamily: 'var(--font-mono, ui-monospace, monospace)',
              fontSize: 10,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              padding: '2px 8px',
              borderRadius: 3,
              background: linked
                ? 'rgba(26,26,26,0.06)'
                : 'rgba(163,45,45,0.06)',
              color: linked
                ? 'var(--abarva-ink-black, #1a1a1a)'
                : 'var(--canon-red, #a32d2d)',
            }}
          >
            {linked ? 'Linked' : 'Not yet linked'}
            {step.gapRef ? ` · ${step.gapRef}` : ''}
          </span>
        </div>
        <h3
          style={{
            margin: '6px 0 4px',
            fontFamily: 'var(--abarva-serif, Georgia, serif)',
            fontWeight: 'normal',
            fontSize: 18,
            color: 'var(--abarva-ink-black, #1a1a1a)',
          }}
        >
          {step.title}
        </h3>
        <p
          style={{
            margin: 0,
            fontSize: 14,
            lineHeight: 1.55,
            color: 'var(--canon-gray-900, #333)',
          }}
        >
          {step.detail}
        </p>
        <div
          style={{
            marginTop: 10,
            display: 'flex',
            gap: 16,
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          {step.joinId ? (
            <span
              style={{
                fontFamily: 'var(--font-mono, ui-monospace, monospace)',
                fontSize: 11,
                color: 'var(--abarva-stone, #6b6b6b)',
              }}
            >
              Join ID: {step.joinId}
            </span>
          ) : null}
          {step.href ? (
            <Link
              href={step.href}
              style={{
                fontSize: 13,
                color: 'var(--abarva-ink-black, #1a1a1a)',
                textDecoration: 'underline',
                textUnderlineOffset: 3,
              }}
            >
              Open artifact
            </Link>
          ) : null}
        </div>
      </div>
    </li>
  );
}

export function CrossModuleTraceView({ trace }: Props) {
  return (
    <div
      style={{
        background: 'var(--canon-bg-cream, #F8F7F4)',
        minHeight: '100%',
        padding: '32px clamp(20px, 5vw, 64px)',
      }}
    >
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <p
          style={{
            margin: 0,
            fontFamily: 'var(--font-mono, ui-monospace, monospace)',
            fontSize: 11,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--abarva-stone, #6b6b6b)',
          }}
        >
          Decision trace · read-only
        </p>
        <h1
          style={{
            margin: '8px 0 6px',
            fontFamily: 'var(--abarva-serif, Georgia, serif)',
            fontWeight: 'normal',
            fontSize: 30,
            lineHeight: 1.2,
            color: 'var(--abarva-ink-black, #1a1a1a)',
          }}
        >
          {trace.moveDisplayCode} · {trace.moveName}
        </h1>
        <p
          style={{
            margin: 0,
            fontSize: 14,
            color: 'var(--canon-gray-900, #333)',
          }}
        >
          {trace.tenantName} — evidence trail across Intelligence, Move,
          Source and Tower, joined by ID into one auditable trace.
        </p>

        <div
          style={{
            marginTop: 20,
            padding: '14px 16px',
            border: '1px solid var(--canon-border, #e5e5e5)',
            borderRadius: 4,
            background: 'var(--canon-bg-surface, #fff)',
            display: 'flex',
            gap: 24,
            flexWrap: 'wrap',
            alignItems: 'baseline',
          }}
        >
          <span style={{ fontSize: 13, color: 'var(--canon-gray-900, #333)' }}>
            <strong
              style={{ fontFamily: 'var(--abarva-serif, Georgia, serif)' }}
            >
              {trace.linkedCount}
            </strong>{' '}
            of {trace.steps.length} steps linked
          </span>
          <span style={{ fontSize: 13, color: 'var(--abarva-stone, #6b6b6b)' }}>
            {COHERENCE_COPY[trace.coherence]}
          </span>
        </div>

        <ol
          style={{
            listStyle: 'none',
            margin: '8px 0 0',
            padding: 0,
          }}
        >
          {trace.steps.map((step, i) => (
            <StepCard key={step.module} step={step} index={i} />
          ))}
        </ol>

        <p
          style={{
            marginTop: 20,
            fontSize: 12,
            lineHeight: 1.6,
            color: 'var(--abarva-stone, #6b6b6b)',
          }}
        >
          Unlinked steps reflect loop hand-offs that are not yet wired in
          product — see the wiring-gap inventories in
          {' '}
          <code style={{ fontFamily: 'var(--font-mono, ui-monospace, monospace)' }}>
            docs/strategy/scenarios/*-LOOP-WIRING-GAPS.md
          </code>
          . They are shown honestly rather than fabricated.
        </p>

        <div style={{ marginTop: 16 }}>
          <Link
            href={`/strategic-moves/${trace.moveId}`}
            style={{
              display: 'inline-block',
              padding: '8px 16px',
              border: '1px solid var(--abarva-ink-black, #1a1a1a)',
              borderRadius: 3,
              fontSize: 13,
              color: 'var(--abarva-ink-black, #1a1a1a)',
              textDecoration: 'none',
            }}
          >
            Back to Move
          </Link>
        </div>
      </div>
    </div>
  );
}
