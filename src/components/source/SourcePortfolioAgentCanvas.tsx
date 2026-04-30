'use client';

import { AtlasDrawer } from '@/components/shell/AtlasDrawer';
import { SourcePortfolioReactivePanel } from '@/components/source/SourcePortfolioReactivePanel';
import type { Artifact } from '@/lib/agent/artifacts';
import { SHELL } from '@/lib/shell/shell-tokens';
import type { SourcingEventSummary } from '@/lib/source/types';

interface SourcePortfolioAgentCanvasProps {
  quote: string;
  events: SourcingEventSummary[];
  activeStage: string | null;
  activeStatus: string | null;
  artifacts: Artifact[];
  onArtifact: (artifact: Artifact) => void;
  heightCss?: string;
}

const SENTINEL_AGENT = {
  initials: 'Sn',
  name: 'Sentinel',
  role: 'Sourcing Intelligence',
} as const;

export function SourcePortfolioAgentCanvas({
  quote,
  events,
  activeStage,
  activeStatus,
  artifacts,
  onArtifact,
  heightCss = 'calc(100vh - 220px)',
}: SourcePortfolioAgentCanvasProps) {
  return (
    <section
      data-testid="source-portfolio-agent-canvas"
      aria-label="Sentinel source portfolio canvas"
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1.7fr) minmax(0, 1fr)',
        gap: 16,
        height: heightCss,
        minHeight: 480,
        marginBottom: 20,
      }}
    >
      <div
        style={{
          minHeight: 0,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <AtlasDrawer
          embedded
          isOpen={true}
          onClose={() => {
            // Embedded chat is always visible on the source portfolio canvas.
          }}
          agent={SENTINEL_AGENT}
          quote={quote}
          surface="/source"
          onArtifact={onArtifact}
          emptyState={<SourcePortfolioPromptDeck events={events} />}
        />
      </div>

      <aside
        aria-label="Sentinel source portfolio reactive workbench"
        style={{
          minHeight: 0,
          minWidth: 0,
          overflowY: 'auto',
          paddingRight: 4,
        }}
      >
        <SourcePortfolioReactivePanel
          events={events}
          activeStage={activeStage}
          activeStatus={activeStatus}
          artifacts={artifacts}
        />
      </aside>
    </section>
  );
}

function SourcePortfolioPromptDeck({ events }: { events: SourcingEventSummary[] }) {
  const amsEvent = events.find((event) =>
    `${event.name} ${event.archetype}`.toLowerCase().includes('ams')
    || `${event.name} ${event.archetype}`.toLowerCase().includes('managed services')
  );

  const cards = [
    {
      label: 'Start an event',
      body: 'Tell me the category, owner, problem, scope boundary, decision needed, and stop condition. I will not treat it as registered until intake approval is clear.',
    },
    {
      label: 'Application managed services',
      body: 'For AMS, I need application/service inventory, incumbent/vendor list, run-rate, contract dates, service pain, transition constraints, and approval owner.',
    },
    {
      label: 'Open seeded event',
      body: amsEvent
        ? `${amsEvent.name} is available as a seeded reference at ${amsEvent.currentStageLabel}.`
        : 'No AMS seeded event is visible in this filter; reset filters or start a new intake.',
    },
  ];

  return (
    <div style={{ width: '100%', display: 'grid', gap: 10, padding: '0 0 8px' }}>
      <div
        style={{
          border: '1px solid rgba(250,247,241,0.12)',
          borderRadius: 12,
          background: 'rgba(250,247,241,0.055)',
          padding: '11px 12px',
        }}
      >
        <div
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 8.5,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'rgba(250,247,241,0.48)',
            fontWeight: 700,
          }}
        >
          Sentinel intake posture
        </div>
        <p
          style={{
            margin: '6px 0 0',
            fontFamily: SHELL.SERIF,
            fontSize: 14.5,
            lineHeight: 1.36,
            color: 'rgba(250,247,241,0.88)',
          }}
        >
          I can help register a sourcing event, but first I will make the intake gate visible:
          owner, problem, scope, evidence, kill criterion, and approval route.
        </p>
      </div>

      <div style={{ display: 'grid', gap: 7 }}>
        {cards.map((item) => (
          <div
            key={item.label}
            style={{
              border: '1px solid rgba(250,247,241,0.10)',
              borderRadius: 10,
              padding: '8px 10px',
              background: 'rgba(250,247,241,0.035)',
            }}
          >
            <div
              style={{
                fontFamily: SHELL.MONO,
                fontSize: 8,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'rgba(250,247,241,0.40)',
                fontWeight: 700,
              }}
            >
              {item.label}
            </div>
            <div
              style={{
                marginTop: 3,
                fontFamily: SHELL.SANS,
                fontSize: 11.8,
                lineHeight: 1.34,
                color: 'rgba(250,247,241,0.78)',
              }}
            >
              {item.body}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
