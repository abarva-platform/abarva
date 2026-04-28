'use client';

import React, { useEffect, useRef, useState } from 'react';
import { MaestroFigure } from './MaestroFigure';
import { PHASES } from '@/lib/public-site/phases';

const PHASE_COUNT = PHASES.length; // 6
const PHASE_DURATION_MS = 3000; // 3s per phase → 18s full cycle

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() =>
    typeof window === 'undefined'
      ? false
      : window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return reduced;
}

export function MaestroHero() {
  const reducedMotion = useReducedMotion();
  const [currentPhase, setCurrentPhase] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (reducedMotion) {
      return;
    }

    intervalRef.current = setInterval(() => {
      setCurrentPhase((prev) => (prev + 1) % PHASE_COUNT);
    }, PHASE_DURATION_MS);

    return () => {
      if (intervalRef.current !== null) clearInterval(intervalRef.current);
    };
  }, [reducedMotion]);

  const activePhase = PHASES[currentPhase];

  // Figure left position: 0% to 100% across the 6 markers
  const figureLeftPct = (currentPhase / (PHASE_COUNT - 1)) * 100;

  return (
    <section
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: '56px',
        paddingBottom: '80px',
        paddingLeft: '32px',
        paddingRight: '32px',
        background: 'var(--pub-paper)',
        textAlign: 'center',
      }}
      aria-label="Maestro hero"
    >
      {/* Timeline */}
      <div
        aria-hidden="true"
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '860px',
          marginBottom: '64px',
        }}
      >
        {/* Dotted line */}
        <div
          style={{
            position: 'absolute',
            top: '12px',
            left: '20px',
            right: '20px',
            height: '1px',
            borderTop: '2px dotted var(--pub-stone)',
          }}
        />

        {/* Phase markers */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            position: 'relative',
          }}
        >
          {PHASES.map((phase) => {
            const isActive = phase.position === currentPhase;
            return (
              <div
                key={phase.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                  width: '80px',
                }}
              >
                {/* Dot */}
                <div
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    marginTop: '8px',
                    background: isActive ? '#0066CC' : 'var(--pub-stone)',
                    transition: reducedMotion ? 'none' : 'background 300ms ease',
                    flexShrink: 0,
                  }}
                />
                {/* Label */}
                <span
                  style={{
                    fontFamily: '"JetBrains Mono", ui-monospace, Menlo, monospace',
                    fontSize: '12px',
                    fontWeight: isActive ? 600 : 400,
                    color: isActive ? '#0066CC' : 'var(--pub-stone)',
                    transition: reducedMotion ? 'none' : 'color 300ms ease, font-weight 0ms',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {phase.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Maestro figure — positioned above the timeline, tracking phase */}
        <div
          style={{
            position: 'absolute',
            top: '-148px',
            left: `calc(${figureLeftPct}% - 40px)`,
            transition: reducedMotion ? 'none' : 'left 600ms cubic-bezier(0.4, 0, 0.2, 1)',
            pointerEvents: 'none',
          }}
        >
          <MaestroFigure phase={currentPhase} animate={!reducedMotion} />
        </div>

        {/* Marketing message beneath phases */}
        <p
          aria-live="polite"
          aria-atomic="true"
          style={{
            marginTop: '16px',
            fontFamily: 'var(--pub-font-mono, "JetBrains Mono", ui-monospace, monospace)',
            fontSize: '13px',
            color: 'var(--pub-slate)',
            minHeight: '20px',
            transition: reducedMotion ? 'none' : 'opacity 300ms ease',
          }}
        >
          {activePhase.marketingMessage}
        </p>
      </div>

      {/* Hero copy */}
      <h1
        style={{
          fontFamily: 'var(--pub-font-serif)',
          fontSize: 'clamp(36px, 6vw, 52px)',
          fontWeight: 500,
          lineHeight: 1.15,
          letterSpacing: '-0.03em',
          color: 'var(--pub-ink)',
          maxWidth: '760px',
          marginBottom: '20px',
        }}
      >
        A knowledge layer for AI programs.
      </h1>

      <p
        style={{
          fontFamily: 'var(--pub-font-sans)',
          fontSize: '18px',
          lineHeight: 1.6,
          color: 'var(--pub-slate)',
          maxWidth: '600px',
          marginBottom: '40px',
        }}
      >
        60 patterns. 30 signals. 10 contradictions. Cited reasoning for every decision your AI
        portfolio depends on.
      </p>

      {/* CTAs */}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <a
          href="/atlas/"
          style={{
            fontFamily: 'var(--pub-font-sans)',
            fontSize: '16px',
            fontWeight: 600,
            color: '#ffffff',
            background: 'var(--pub-signal)',
            border: 'none',
            borderRadius: '8px',
            padding: '14px 28px',
            textDecoration: 'none',
            display: 'inline-block',
          }}
        >
          Search the corpus
        </a>
        <a
          href="#how-it-works"
          style={{
            fontFamily: 'var(--pub-font-sans)',
            fontSize: '16px',
            fontWeight: 600,
            color: 'var(--pub-ink)',
            background: 'transparent',
            border: '1.5px solid #000000',
            borderRadius: '8px',
            padding: '14px 28px',
            textDecoration: 'none',
            display: 'inline-block',
          }}
        >
          How it works
        </a>
      </div>
    </section>
  );
}
