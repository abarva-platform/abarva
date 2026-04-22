'use client';

import { PersonaLensChip } from './PersonaLensChip';

export function NextMovesFloater({
  programFit,
  primaryAction,
  onCounter,
  onPersona,
  canScope,
}: {
  programFit: { score: 'low' | 'medium' | 'high'; dotsFilled: number; rationale: string; preloadablePhases: number };
  primaryAction: () => void;
  onCounter: () => void;
  onPersona: (persona: string) => void;
  canScope: boolean;
}) {
  return (
    <aside className="intel-floater">
      <div className="intel-next-panel intel-section">
        <div className="intel-eyebrow">Next moves</div>
        <div style={{ marginTop: 12 }}>
          <div className="intel-row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 16, fontWeight: 700 }}>Program fit</div>
            <span className={`intel-chip mono ${programFit.score === 'high' ? 'amber' : programFit.score === 'medium' ? 'teal' : ''}`}>
              {programFit.score}
            </span>
          </div>
          <div className="intel-inline-list" style={{ marginTop: 10 }}>
            {Array.from({ length: 4 }).map((_, index) => (
              <span
                key={index}
                style={{
                  width: 22,
                  height: 8,
                  borderRadius: 999,
                  background: index < programFit.dotsFilled ? 'var(--intel-amber)' : 'rgba(255,255,255,0.12)',
                }}
              />
            ))}
          </div>
          <div className="intel-subtle" style={{ marginTop: 10, fontSize: 13, lineHeight: 1.5 }}>
            {programFit.rationale}
          </div>
          <div className="intel-chip mono teal" style={{ marginTop: 12 }}>
            {programFit.preloadablePhases}/4 preloadable phases
          </div>
        </div>
        <div className="intel-stack" style={{ marginTop: 16, gap: 10 }}>
          <button type="button" className="intel-button" onClick={primaryAction} disabled={!canScope}>
            Scope as program
          </button>
          <button type="button" className="intel-button-outline" onClick={onCounter}>
            Counter-argument
          </button>
        </div>
      </div>

      <div className="intel-next-panel intel-section">
        <div className="intel-eyebrow">Persona lens</div>
        <div className="intel-inline-list" style={{ marginTop: 12 }}>
          {['CFO', 'CIO', 'CMIO', 'Sponsor'].map((persona) => (
            <PersonaLensChip key={persona} persona={persona} onClick={() => onPersona(persona)} />
          ))}
        </div>
      </div>
    </aside>
  );
}
