'use client';

// IntelligenceAgentCanvas · Surface 2 PR-INT-B.
//
// Agent-centric primary surface for /intelligence. Mirrors
// AgentCanvas (Programs surface) but wires the Sentinel agent and
// the Sentinel-curated reactive panel.
//
//   ┌────────────────────────────────────────────────────────────┐
//   │  CHAT WITH SENTINEL           │  REACTIVE KNOWLEDGE PANE   │
//   │  (~60% of viewport width)     │  (~35% of viewport width)  │
//   │                               │                            │
//   │  • "Show me patterns like…"   │  • Pattern cards           │
//   │  • "Cite evidence for…"       │  • Evidence citations      │
//   │  • "What contradicts…"        │  • Linked programs         │
//   └────────────────────────────────────────────────────────────┘
//
// The static pattern library table sits BELOW this canvas inside a
// collapsible accordion — present but de-emphasized.

import { useCallback, useState } from 'react';
import { AtlasDrawer } from '@/components/shell/AtlasDrawer';
import { SentinelReactivePanel } from '@/components/intelligence/SentinelReactivePanel';
import type { Artifact } from '@/lib/agent/artifacts';

export interface IntelligenceAgentCanvasProps {
  /** Synthesis quote shown as the chat header. */
  quote: string;
  /**
   * Canvas height. Defaults to a viewport-relative height that gives
   * the agent ~70% of the screen. Pages with nested layouts can
   * override.
   */
  heightCss?: string;
}

const SENTINEL_AGENT = {
  initials: 'Sn',
  name: 'Sentinel',
  role: 'Knowledge Librarian',
} as const;

export function IntelligenceAgentCanvas({
  quote,
  heightCss = 'calc(100vh - 220px)',
}: IntelligenceAgentCanvasProps) {
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);

  const handleArtifact = useCallback((artifact: Artifact) => {
    setArtifacts((prev) => {
      const key = JSON.stringify(artifact);
      if (prev.some((a) => JSON.stringify(a) === key)) return prev;
      return [...prev, artifact];
    });
  }, []);

  return (
    <>
      <style>{`
        @media (max-width: 640px) {
          [data-testid="intelligence-agent-canvas"] {
            grid-template-columns: 1fr !important;
            height: auto !important;
            min-height: 0 !important;
          }
          [data-testid="intelligence-agent-canvas"] > aside {
            display: none;
          }
        }
      `}</style>
    <section
      data-testid="intelligence-agent-canvas"
      aria-label="Sentinel canvas"
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1.7fr) minmax(0, 1fr)',
        gap: 16,
        height: heightCss,
        minHeight: 480,
        marginBottom: 20,
      }}
    >
      {/* Left column — chat (embedded AtlasDrawer, no overlay). */}
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
            // No-op — embedded chat is always visible.
          }}
          agent={SENTINEL_AGENT}
          quote={quote}
          surface="/intelligence"
          onArtifact={handleArtifact}
        />
      </div>

      {/* Right column — reactive panel. */}
      <aside
        aria-label="Sentinel reactive workbench"
        style={{
          minHeight: 0,
          minWidth: 0,
          overflowY: 'auto',
          paddingRight: 4,
        }}
      >
        <SentinelReactivePanel artifacts={artifacts} />
      </aside>
    </section>
    </>
  );
}
