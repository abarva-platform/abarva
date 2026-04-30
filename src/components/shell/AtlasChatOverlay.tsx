'use client';

import { SHELL } from '@/lib/shell/shell-tokens';
import { useAtlasPageState } from '@/hooks/useAtlasPageState';
import { ATLAS_SYNTHESIS_TURN_ID } from '@/lib/shell/atlas-page-state';
// OV2-4b · in-conversation attachment chip rendering. Turns sent with
// attachments carry the refs through to the user-side view; chips link
// out to the signed-URL download endpoint.
import { PersistedAttachmentChip } from '@/components/programs/attachments/AttachmentChip';
// CB-6 · Context Assembled panel + 4-mode toggle live inside the
// chat overlay so the receipt for the agent's answer is visible
// next to it. The panel is the SIBLING of the chat answer, not
// part of NexusReactivePanel (which renders streamed reasoning
// artifacts). The toggle drives the next turn's bundle mode.
import { ContextAssembledPanel } from '@/components/context-broker/ContextAssembledPanel';
import {
  ModeToggle,
  availableModesFor,
} from '@/components/context-broker/ModeToggle';
import type { BrokerMode } from '@/lib/knowledge/context-broker';

interface AtlasChatOverlayProps {
  open: boolean;
  onClose: () => void;
}

const NARROW_WIDTH = 360;
const WIDE_WIDTH = 720; // 360 chat + 360 panel side-by-side on desktop

export function AtlasChatOverlay({ open, onClose }: AtlasChatOverlayProps) {
  const pageState = useAtlasPageState();

  if (!open || !pageState) return null;

  // CB-6 · whether the panel/toggle area should render. We always
  // render the toggle (so the user can pick a mode before the first
  // turn); the panel renders the cold-start state, then loading, then
  // the bundle. When the chat is in cold-start AND no toggle has been
  // touched we still take the wider footprint so the toggle is
  // visible — the founder explicitly wants the toggle prominent.
  const showContextRail = true;
  const drawerWidth = showContextRail ? WIDE_WIDTH : NARROW_WIDTH;

  // CB-8 · narrow the picker to modes that are admissible in the
  // current auth state. We use the explicit `hasTenantKey` boolean
  // threaded through `AtlasPageState` (set by surfaces that resolve
  // `getActiveClientRow()` server-side); the route does the strict
  // `isModeValidForAuth` check server-side regardless. `tenantName`
  // is unreliable here — `AppShell` defaults it to a display string
  // for unauthenticated demo opens, so the previous `tenantName`-based
  // proxy never disabled Tenant / Full.
  const availableModes = availableModesFor({ hasTenantKey: pageState.hasTenantKey });

  const handleModeChange = (mode: BrokerMode) => {
    pageState.setContextBundleMode(mode);
  };

  return (
    <aside
      aria-label={`${pageState.agentName} chat`}
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        width: drawerWidth,
        background: SHELL.INK,
        color: SHELL.PAPER,
        zIndex: 60,
        boxShadow: '-18px 0 40px rgba(0,0,0,0.22)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <header
        style={{
          padding: '18px 20px',
          borderBottom: '1px solid rgba(250,247,241,0.15)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <div style={{ fontFamily: SHELL.SERIF, fontSize: 18 }}>{pageState.agentName}</div>
          <div style={{ fontFamily: SHELL.MONO, fontSize: 10, opacity: 0.6 }}>
            {pageState.tenantName} / {pageState.surface}
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          style={{
            border: '1px solid rgba(250,247,241,0.25)',
            background: 'transparent',
            color: SHELL.PAPER,
            borderRadius: 999,
            width: 28,
            height: 28,
            cursor: 'pointer',
          }}
        >
          x
        </button>
      </header>

      {/* CB-6 · two-column body on desktop: chat (left) + Context
          Assembled panel (right). On mobile both stack vertically.
          We use plain flex; existing shell layout primitives don't
          have a paired-pane helper for this drawer. */}
      <div
        data-testid="atlas-chat-body"
        style={{
          display: 'flex',
          flexDirection: 'row',
          flexWrap: 'wrap',
          flex: 1,
          minHeight: 0,
        }}
      >
        <div
          data-testid="atlas-chat-thread"
          style={{
            padding: 20,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
            flex: '1 1 320px',
            minWidth: 0,
          }}
        >
          {pageState.conversation.map((turn) => (
            <article
              key={turn.id}
              style={{
                border:
                  turn.id === ATLAS_SYNTHESIS_TURN_ID
                    ? '1px solid rgba(250,247,241,0.28)'
                    : '1px solid rgba(250,247,241,0.12)',
                borderRadius: 16,
                padding: 14,
                background: turn.role === 'user' ? 'rgba(250,247,241,0.08)' : 'rgba(250,247,241,0.04)',
              }}
            >
              <div style={{ fontFamily: SHELL.MONO, fontSize: 10, opacity: 0.55, marginBottom: 6 }}>
                {turn.role === 'user' ? 'You' : turn.agentName}
              </div>
              <p style={{ margin: 0, fontFamily: SHELL.SANS, fontSize: 13, lineHeight: 1.5 }}>
                {turn.text}
              </p>
              {turn.attachments && turn.attachments.length > 0 && (
                <div
                  style={{
                    marginTop: 8,
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 6,
                  }}
                >
                  {turn.attachments.map((att) => (
                    <PersistedAttachmentChip key={att.id} attachment={att} />
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>

        {/* CB-6 · Context-rail column. Width matches the chat thread
            on desktop; on small screens flex-wrap stacks it below.
            The toggle is sticky-top inside this rail so the user can
            switch modes regardless of how far the panel has scrolled. */}
        <aside
          data-testid="atlas-chat-context-rail"
          style={{
            padding: 20,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
            flex: '1 1 320px',
            minWidth: 0,
            background: SHELL.PAPER,
            color: SHELL.INK,
            borderLeft: '1px solid rgba(12,26,58,0.08)',
          }}
        >
          <div
            data-testid="atlas-chat-mode-toggle-row"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 8,
              flexWrap: 'wrap',
            }}
          >
            <div
              style={{
                fontFamily: SHELL.MONO,
                fontSize: 10,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'rgba(12,26,58,0.55)',
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
        </aside>
      </div>
    </aside>
  );
}
