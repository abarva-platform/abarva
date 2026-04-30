'use client';

// AgentCanvas · Surface 2 PR-F of Programs Strict Completion v1.2
//
// CB-7 layout choice (2026-04-29): the right rail is a TAB STRIP with two
// tabs — "Reasoning" (NexusReactivePanel · streamed artifacts during the
// turn) and "Context" (ContextAssembledPanel + ModeToggle · the receipt
// for the answer + the 4-mode picker). Keeping them in one column at
// equal width preserves the chat-dominant ratio AgentCanvas was tuned
// for, while giving the Context Assembled rail a real, visible home on
// the surface that ships. The panel and toggle are gated to Programs
// surfaces (`isProgramsSurface`) — `/source`, `/intelligence`, and the
// rest each have their own rail tooling that doesn't need this control.
//
// Agent-centric primary surface for /programs/[id]. Replaces the legacy
// "static dashboard with chat-as-overlay" layout with the layout the
// product premise requires:
//
//   ┌────────────────────────────────────────────────────────────┐
//   │  CHAT WITH NEXUS              │  REASONING | CONTEXT  ◄ tab │
//   │  (~60% of viewport width)     │  (right rail · ~35%)        │
//   │                               │                              │
//   │  • Phase pack drives Q's      │  Reasoning tab:              │
//   │  • Anti-pattern flags         │   reactive artifacts as     │
//   │  • advance_phase tool         │   they stream               │
//   │                               │  Context tab:                │
//   │                               │   assembled bundle +        │
//   │                               │   4-mode toggle             │
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

import { useState, type CSSProperties } from 'react';
import { AtlasDrawer } from '@/components/shell/AtlasDrawer';
import { NexusReactivePanel } from '@/components/programs/NexusReactivePanel';
import { ContextAssembledPanel } from '@/components/context-broker/ContextAssembledPanel';
import {
  ModeToggle,
  availableModesFor,
} from '@/components/context-broker/ModeToggle';
import { useAtlasPageState } from '@/hooks/useAtlasPageState';
import { isProgramsSurface } from '@/lib/programs/failure-mode-prompt';
import { SHELL } from '@/lib/shell/shell-tokens';
import type { Artifact } from '@/lib/agent/artifacts';
import type { BrokerMode } from '@/lib/knowledge/context-broker';

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

type RailTab = 'reasoning' | 'context';

export function AgentCanvas({
  surface,
  programId,
  agent,
  quote,
  artifacts,
  onArtifact,
  heightCss = 'calc(100vh - 220px)',
}: AgentCanvasProps) {
  // CB-7 · the Context tab only renders on Programs surfaces. Other
  // surfaces (Source, Intelligence, …) have their own rail tooling and
  // do not consume the broker's bundle yet — for them, the rail
  // collapses back to the original Reasoning-only NexusReactivePanel.
  const showContextTab = isProgramsSurface(surface);

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

      {/* Right column — tabbed rail (Reasoning / Context). On non-Programs
          surfaces the tab strip collapses and the rail renders only the
          reactive panel, preserving the legacy single-purpose right rail
          for /home, /intelligence, etc. */}
      <aside
        aria-label={`${agent.name} reactive workbench`}
        style={{
          minHeight: 0,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {showContextTab ? (
          <RightRailTabs
            agentName={agent.name}
            artifacts={artifacts}
          />
        ) : (
          <div
            style={{
              minHeight: 0,
              minWidth: 0,
              overflowY: 'auto',
              paddingRight: 4,
              flex: 1,
            }}
          >
            <NexusReactivePanel
              artifacts={artifacts}
              agentLabel={agent.name}
              emptyStatePrompts={emptyStatePromptsFor(agent.name)}
            />
          </div>
        )}
      </aside>
    </section>
  );
}

/**
 * CB-7 · the right-rail tab container. Top tab strip switches between
 * the streamed reasoning artifacts and the post-assembly Context bundle
 * + 4-mode toggle. The Context tab reads bundle/loading/mode state
 * from the page-level AtlasPageStateProvider via useAtlasPageState();
 * if the provider is not mounted (defensive: AgentCanvas can be rendered
 * outside it in storybook-style previews) the Context tab hides itself
 * and the rail falls back to Reasoning-only.
 */
function RightRailTabs({
  agentName,
  artifacts,
}: {
  agentName: string;
  artifacts: Artifact[];
}) {
  const pageState = useAtlasPageState();
  const [activeTab, setActiveTab] = useState<RailTab>('reasoning');

  // Defensive fallback — without a provider, no bundle state is
  // available. We render the legacy single-purpose rail.
  if (!pageState) {
    return (
      <div
        style={{
          minHeight: 0,
          minWidth: 0,
          overflowY: 'auto',
          paddingRight: 4,
          flex: 1,
        }}
      >
        <NexusReactivePanel
          artifacts={artifacts}
          agentLabel={agentName}
          emptyStatePrompts={emptyStatePromptsFor(agentName)}
        />
      </div>
    );
  }

  // CB-8 · narrow the picker to modes that are admissible in the
  // current auth state. We use the explicit `hasTenantKey` boolean
  // threaded through `AtlasPageState` (set by surfaces that resolve
  // `getActiveClientRow()` / `getCurrentUser()` server-side); the
  // route does the strict `isModeValidForAuth` check server-side
  // regardless. `tenantName` is unreliable here — `AppShell` defaults
  // it to a display string for unauthenticated demo opens, so the
  // previous `tenantName`-based proxy never disabled Tenant / Full.
  const availableModes = availableModesFor({
    hasTenantKey: pageState.hasTenantKey,
  });

  const handleModeChange = (mode: BrokerMode) => {
    pageState.setContextBundleMode(mode);
  };

  return (
    <div
      data-testid="agent-canvas-right-rail"
      style={{
        minHeight: 0,
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
      }}
    >
      <div
        role="tablist"
        aria-label="Agent rail tabs"
        data-testid="agent-canvas-rail-tabs"
        style={{
          display: 'flex',
          gap: 0,
          borderBottom: `1px solid ${SHELL.CARD_LINE}`,
          marginBottom: 8,
          flexShrink: 0,
        }}
      >
        <RailTabButton
          tab="reasoning"
          label="Reasoning"
          isActive={activeTab === 'reasoning'}
          onSelect={setActiveTab}
        />
        <RailTabButton
          tab="context"
          label="Context"
          isActive={activeTab === 'context'}
          onSelect={setActiveTab}
        />
      </div>

      {/* Tabpanel · Reasoning. Always mounted (display-toggled) so the
          NexusReactivePanel keeps accumulating its visible artifacts
          while the user is on the Context tab — switching back doesn't
          reset card state. */}
      <div
        role="tabpanel"
        aria-label="Reasoning"
        data-testid="agent-canvas-rail-panel-reasoning"
        hidden={activeTab !== 'reasoning'}
        style={{
          minHeight: 0,
          minWidth: 0,
          overflowY: activeTab === 'reasoning' ? 'auto' : 'hidden',
          paddingRight: 4,
          flex: activeTab === 'reasoning' ? 1 : 0,
        }}
      >
        <NexusReactivePanel
          artifacts={artifacts}
          agentLabel={agentName}
          emptyStatePrompts={emptyStatePromptsFor(agentName)}
        />
      </div>

      {/* Tabpanel · Context. Mounted but hidden when on Reasoning so
          the bundle stays in the DOM (the panel reads from page state
          on every render anyway, so this is a render-cost
          optimization, not a correctness one). */}
      <div
        role="tabpanel"
        aria-label="Context"
        data-testid="agent-canvas-rail-panel-context"
        hidden={activeTab !== 'context'}
        style={{
          minHeight: 0,
          minWidth: 0,
          overflowY: activeTab === 'context' ? 'auto' : 'hidden',
          paddingRight: 4,
          flex: activeTab === 'context' ? 1 : 0,
          background: SHELL.PAPER,
          borderRadius: 10,
          border: `1px solid ${SHELL.CARD_LINE}`,
          padding: 12,
        }}
      >
        <div
          data-testid="agent-canvas-mode-toggle-row"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 8,
            marginBottom: 12,
            flexWrap: 'wrap',
          }}
        >
          <div
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 10,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: SHELL.GRAY_TEXT,
              fontWeight: 700,
            }}
          >
            Mode
          </div>
          <ModeToggle
            mode={pageState.contextBundleMode}
            onChange={handleModeChange}
            availableModes={availableModes}
          />
        </div>

        <ContextAssembledPanel
          bundle={pageState.latestContextBundle}
          isLoading={pageState.isAssemblingContextBundle}
        />
      </div>
    </div>
  );
}

function RailTabButton({
  tab,
  label,
  isActive,
  onSelect,
}: {
  tab: RailTab;
  label: string;
  isActive: boolean;
  onSelect: (tab: RailTab) => void;
}) {
  const style: CSSProperties = {
    background: 'transparent',
    border: 'none',
    borderBottom: isActive
      ? `2px solid ${SHELL.INK}`
      : '2px solid transparent',
    padding: '8px 12px',
    fontFamily: SHELL.MONO,
    fontSize: 11,
    letterSpacing: '0.10em',
    textTransform: 'uppercase',
    fontWeight: 700,
    color: isActive ? SHELL.INK : SHELL.GRAY_TEXT,
    cursor: 'pointer',
  };
  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      data-testid={`agent-canvas-rail-tab-${tab}`}
      data-active={isActive ? 'true' : 'false'}
      onClick={() => onSelect(tab)}
      style={style}
    >
      {label}
    </button>
  );
}

/**
 * PR-N · agent-specific empty-state copy. Atlas on /home gets
 * portfolio prompts; Nexus on /programs/* gets phase-pack prompts.
 * Sentinel has its own SentinelReactivePanel and doesn't pass through
 * here, but we cover the case for completeness.
 */
function emptyStatePromptsFor(agentName: string): { primary: string; secondary: string } {
  switch (agentName) {
    case 'Atlas':
      return {
        primary: "what needs my attention today?",
        secondary: "show me programs at risk",
      };
    case 'Sentinel':
      return {
        primary: "show me patterns like CDP activation",
        secondary: "cite evidence for vendor lock-in risk",
      };
    case 'Nexus':
    default:
      return {
        primary: "where are we?",
        secondary: "can we advance the gate?",
      };
  }
}
