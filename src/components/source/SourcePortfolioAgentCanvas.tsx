'use client';

import { AtlasDrawer } from '@/components/shell/AtlasDrawer';
import { SourcePortfolioReactivePanel } from '@/components/source/SourcePortfolioReactivePanel';
import type { Artifact } from '@/lib/agent/artifacts';
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
