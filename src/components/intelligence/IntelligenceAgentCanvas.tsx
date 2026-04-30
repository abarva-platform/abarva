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

import { useCallback, useState, type CSSProperties } from 'react';
import { AtlasDrawer } from '@/components/shell/AtlasDrawer';
import { useAtlasPageState } from '@/components/shell/AtlasPageStateProvider';
import { ContextAssembledPanel } from '@/components/context-broker/ContextAssembledPanel';
import {
  availableModesFor,
  ModeToggle,
} from '@/components/context-broker/ModeToggle';
import { SentinelReactivePanel } from '@/components/intelligence/SentinelReactivePanel';
import type { Artifact } from '@/lib/agent/artifacts';
import type { BrokerMode } from '@/lib/knowledge/context-broker';
import { SHELL } from '@/lib/shell/shell-tokens';

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

type RailTab = 'reasoning' | 'context';

export function IntelligenceAgentCanvas({
  quote,
  heightCss = 'min(660px, calc(100svh - 190px))',
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
            min-height: calc(100svh - 160px) !important;
          }
          [data-testid="intelligence-agent-canvas"] > div:first-child {
            min-height: calc(100svh - 170px) !important;
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
          composerPlacement="afterHeader"
          emptyState={<SentinelStarterChoices />}
        />
      </div>

      {/* Right column — reactive reasoning + context receipt. */}
      <aside
        aria-label="Sentinel reactive workbench"
        style={{
          minHeight: 0,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <IntelligenceRightRail artifacts={artifacts} />
      </aside>
    </section>
    </>
  );
}

function SentinelStarterChoices() {
  const pageState = useAtlasPageState();
  const choices = [
    {
      label: 'Find a pattern',
      message: 'Show me patterns like pilot-to-production failure.',
    },
    {
      label: 'Cite evidence',
      message: 'Cite evidence for why the binding layer matters.',
    },
    {
      label: 'Compare modes',
      message: 'Compare the generic answer to the corpus-grounded answer.',
    },
  ];

  return (
    <div
      data-testid="sentinel-starter-choices"
      style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <div
        style={{
          fontFamily: SHELL.MONO,
          fontSize: 9,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'rgba(250,247,241,0.38)',
          fontWeight: 700,
        }}
      >
        Start with one move
      </div>
      <div style={{ display: 'grid', gap: 8 }}>
        {choices.map((choice) => (
          <button
            key={choice.label}
            type="button"
            onClick={() => pageState?.ask(choice.message)}
            disabled={!pageState || pageState.isStreaming}
            style={{
              width: '100%',
              textAlign: 'left',
              borderRadius: 10,
              border: '1px solid rgba(250,247,241,0.14)',
              background: 'rgba(250,247,241,0.07)',
              color: 'rgba(250,247,241,0.84)',
              padding: '10px 12px',
              cursor: pageState && !pageState.isStreaming ? 'pointer' : 'default',
              fontFamily: SHELL.SANS,
              fontSize: 12.5,
              lineHeight: 1.4,
            }}
          >
            <span
              style={{
                display: 'block',
                fontFamily: SHELL.MONO,
                fontSize: 9,
                letterSpacing: '0.10em',
                textTransform: 'uppercase',
                color: 'rgba(250,247,241,0.48)',
                marginBottom: 3,
              }}
            >
              {choice.label}
            </span>
            {choice.message}
          </button>
        ))}
      </div>
      <div
        style={{
          fontFamily: SHELL.SERIF,
          fontSize: 12,
          fontStyle: 'italic',
          color: 'rgba(250,247,241,0.34)',
          lineHeight: 1.45,
        }}
      >
        Or type your own question in the composer above.
      </div>
    </div>
  );
}

function IntelligenceRightRail({ artifacts }: { artifacts: Artifact[] }) {
  const pageState = useAtlasPageState();
  const [activeTab, setActiveTab] = useState<RailTab>('reasoning');

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
        <SentinelReactivePanel artifacts={artifacts} />
      </div>
    );
  }

  const availableModes = availableModesFor({
    hasTenantKey: pageState.hasTenantKey,
  });

  const handleModeChange = (mode: BrokerMode) => {
    pageState.setContextBundleMode(mode);
  };

  return (
    <div
      data-testid="intelligence-agent-right-rail"
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
        aria-label="Sentinel rail tabs"
        data-testid="intelligence-agent-rail-tabs"
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

      <div
        role="tabpanel"
        aria-label="Reasoning"
        data-testid="intelligence-agent-rail-panel-reasoning"
        hidden={activeTab !== 'reasoning'}
        style={{
          minHeight: 0,
          minWidth: 0,
          overflowY: activeTab === 'reasoning' ? 'auto' : 'hidden',
          paddingRight: 4,
          flex: activeTab === 'reasoning' ? 1 : 0,
        }}
      >
        <SentinelReactivePanel artifacts={artifacts} />
      </div>

      <div
        role="tabpanel"
        aria-label="Context"
        data-testid="intelligence-agent-rail-panel-context"
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
          data-testid="intelligence-agent-mode-toggle-row"
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
      data-testid={`intelligence-agent-rail-tab-${tab}`}
      data-active={isActive ? 'true' : 'false'}
      onClick={() => onSelect(tab)}
      style={style}
    >
      {label}
    </button>
  );
}
