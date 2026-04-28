import { AnnotatedScreenshot } from './AnnotatedScreenshot';

interface PhaseSectionProps {
  phase: { id: string; label: string; position: number; marketingMessage: string };
  isActive: boolean; // true when this section is in viewport
  index: number; // 0-5
}

const PHASE_ANNOTATIONS: Record<string, string> = {
  discovery: 'Atlas · context loaded',
  synthesis: 'Atlas · 150-word answer with citations',
  design: 'corpus patterns applied to architecture',
  build: 'Sentinel · PR validated',
  activate: 'Atlas · contradictions surfaced',
  operate: 'KPI panel · drift signals active',
};

const PHASE_NUMBERS = ['01', '02', '03', '04', '05', '06'];

export function PhaseSection({ phase, isActive, index }: PhaseSectionProps) {
  const annotation = PHASE_ANNOTATIONS[phase.id] ?? phase.label;

  return (
    <div
      data-phase-section={phase.id}
      style={{
        minHeight: '80vh',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '64px',
        alignItems: 'center',
        padding: '80px 0',
        opacity: isActive ? 1 : 0.6,
        transition: 'opacity 300ms ease',
      }}
    >
      {/* Left column: phase meta + marketing message */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        {/* Phase number */}
        <span
          style={{
            fontFamily: 'var(--pub-font-mono)',
            fontSize: '12px',
            color: 'var(--pub-stone)',
            letterSpacing: '0.08em',
          }}
        >
          {PHASE_NUMBERS[index]}
        </span>

        {/* Phase label */}
        <h3
          style={{
            fontFamily: 'var(--pub-font-serif)',
            fontSize: '32px',
            fontWeight: 500,
            lineHeight: 1.2,
            letterSpacing: '-0.02em',
            color: isActive ? '#0066CC' : 'var(--pub-ink)',
            transition: 'color 300ms ease',
            margin: 0,
          }}
        >
          {phase.label}
        </h3>

        {/* Marketing message */}
        <p
          style={{
            fontFamily: 'var(--pub-font-sans)',
            fontSize: '18px',
            lineHeight: 1.6,
            color: 'var(--pub-slate)',
            margin: 0,
            maxWidth: '420px',
          }}
        >
          {phase.marketingMessage}
        </p>

        {/* Active indicator dot */}
        {isActive && (
          <div
            aria-hidden="true"
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#0066CC',
              marginTop: '4px',
            }}
          />
        )}
      </div>

      {/* Right column: screenshot */}
      <AnnotatedScreenshot
        phase={phase.id}
        alt={`${phase.label} phase screenshot`}
        annotation={annotation}
      />
    </div>
  );
}
