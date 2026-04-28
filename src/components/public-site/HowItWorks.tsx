'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { PHASES } from '@/lib/public-site/phases';
import { MaestroFigure } from '@/components/public-site/MaestroFigure';
import { PhaseSection } from './PhaseSection';

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

export function HowItWorks() {
  const reducedMotion = useReducedMotion();
  const [activePhaseIndex, setActivePhaseIndex] = useState(0);
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const setRef = useCallback((index: number) => (el: HTMLDivElement | null) => {
    sectionRefs.current[index] = el;
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const phaseId = (entry.target as HTMLElement).dataset.phaseSection;
            const index = PHASES.findIndex((p) => p.id === phaseId);
            if (index !== -1) {
              setActivePhaseIndex(index);
            }
          }
        }
      },
      { threshold: 0.5 }
    );

    const currentRefs = sectionRefs.current;
    currentRefs.forEach((ref) => {
      if (ref) observerRef.current?.observe(ref);
    });

    return () => {
      currentRefs.forEach((ref) => {
        if (ref) observerRef.current?.unobserve(ref);
      });
      observerRef.current?.disconnect();
    };
  }, []);

  const activePhase = PHASES[activePhaseIndex];

  return (
    <section
      id="how-it-works"
      style={{
        background: 'var(--pub-paper)',
        paddingTop: '80px',
        paddingBottom: '120px',
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          marginLeft: 'auto',
          marginRight: 'auto',
          paddingLeft: '32px',
          paddingRight: '32px',
        }}
      >
        {/* Section header */}
        <div style={{ marginBottom: '64px' }}>
          <h2
            style={{
              fontFamily: 'var(--pub-font-serif)',
              fontSize: 'clamp(32px, 5vw, 40px)',
              fontWeight: 500,
              lineHeight: 1.2,
              letterSpacing: '-0.02em',
              color: 'var(--pub-ink)',
              marginBottom: '16px',
            }}
          >
            How it works
          </h2>
          <p
            style={{
              fontFamily: 'var(--pub-font-sans)',
              fontSize: '18px',
              lineHeight: 1.6,
              color: 'var(--pub-slate)',
              maxWidth: '560px',
            }}
          >
            The maestro through six phases. Each phase delivers a specific capability.
          </p>
        </div>

        {/* Two-column layout: sticky sidebar + phase sections */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '140px 1fr',
            gap: '48px',
            alignItems: 'start',
          }}
        >
          {/* Sticky sidebar: MaestroFigure + current phase label */}
          <div
            style={{
              position: 'sticky',
              top: '80px',
            }}
            aria-hidden="true"
          >
            <style>{`
              @media (max-width: 767px) {
                .pub-how-it-works__sidebar {
                  display: none !important;
                }
              }
            `}</style>
            <div
              className="pub-how-it-works__sidebar"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <MaestroFigure phase={activePhaseIndex} animate={!reducedMotion} />
              <span
                style={{
                  fontFamily: 'var(--pub-font-mono)',
                  fontSize: '11px',
                  color: 'var(--pub-stone)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  textAlign: 'center',
                }}
              >
                {activePhase.label}
              </span>
            </div>
          </div>

          {/* Phase sections */}
          <div>
            {PHASES.map((phase, index) => (
              <div key={phase.id} ref={setRef(index)}>
                <PhaseSection
                  phase={phase}
                  isActive={index === activePhaseIndex}
                  index={index}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
