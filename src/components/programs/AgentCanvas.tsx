'use client';

// AgentCanvas · Surface 2 PR-F of Programs Strict Completion v1.2
//
// Agent-centric primary surface for /programs/[id]. Replaces the legacy
// "static dashboard with chat-as-overlay" layout with the layout the
// product premise requires:
//
//   ┌────────────────────────────────────────────────────────────┐
//   │  CHAT WITH NEXUS              │  REACTIVE PANEL            │
//   │  (~60% of viewport width)     │  (~35% of viewport width)  │
//   │                               │                            │
//   │  • Phase pack drives Q's      │  • Phase progress cards    │
//   │  • Anti-pattern flags         │  • Anti-pattern flags      │
//   │  • advance_phase tool         │  • Gate evaluations        │
//   │                               │  • Pattern matches         │
//   └────────────────────────────────────────────────────────────┘
//
// The static program-detail content (gate ribbon, mission list,
// evidence cards, deliverables) sits BELOW this canvas inside a
// collapsible accordion — present but de-emphasized.
//
// Why a wrapper component, not inline JSX in ProgramDetailPage:
//   ProgramDetailPage is already 4,994 lines. Inlining adds ~150 more
//   without giving anyone a place to read the layout intent. This
//   component owns the agent-canvas shape so future iteration (resize,
//   density tweaks, mobile collapse) doesn't bury the file further.

import { AtlasDrawer } from '@/components/shell/AtlasDrawer';
import { NexusReactivePanel } from '@/components/programs/NexusReactivePanel';
import type { Artifact } from '@/lib/agent/artifacts';

export interface AgentCanvasProps {
  /**
   * Surface key passed to the chat for tool resolution + artifact gating.
   * URL-shaped: '/programs/<id>' for detail, '/programs' for list,
   * '/home' for home, '/intelligence' for the knowledge surface.
   */
  surface: string;
  /**
   * Program id passed through to the embedded chat hook. Detail-mode
   * surfaces set this. Portfolio / list / home modes leave it undefined.
   */
  programId?: string;
  /** Agent header — Nexus on programs, Atlas on home/portfolio, Sentinel on intelligence. */
  agent: { initials: string; name: string; role: string };
  /** Synthesis quote shown as the chat header. */
  quote: string;
  /** Live artifact stream from the agent's emissions. */
  artifacts: Artifact[];
  /** Push artifacts back up to the parent page. */
  onArtifact: (artifact: Artifact) => void;
  /**
   * Canvas height. Defaults to a viewport-relative height that gives
   * the agent ~70% of the screen — chat + reactive panel are visually
   * dominant. Pages that need a different height (e.g. nested layouts)
   * can override.
   */
  heightCss?: string;
}

export function AgentCanvas({
  surface,
  programId,
  agent,
  quote,
  artifacts,
  onArtifact,
  heightCss = 'calc(100vh - 220px)',
}: AgentCanvasProps) {
  return (
    <section
      data-testid="program-agent-canvas"
      aria-label="Agent canvas"
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
          agent={agent}
          quote={quote}
          surface={surface}
          programId={programId}
          onArtifact={onArtifact}
        />
      </div>

      {/* Right column — reactive panel (sticky-ish, scrollable). */}
      <aside
        aria-label="Nexus reactive workbench"
        style={{
          minHeight: 0,
          minWidth: 0,
          overflowY: 'auto',
          paddingRight: 4,
        }}
      >
        <NexusReactivePanel artifacts={artifacts} />
      </aside>
    </section>
  );
}
