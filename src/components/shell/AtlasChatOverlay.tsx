'use client';

import { SHELL } from '@/lib/shell/shell-tokens';
import { useAtlasPageState } from '@/hooks/useAtlasPageState';
import { ATLAS_SYNTHESIS_TURN_ID } from '@/lib/shell/atlas-page-state';

interface AtlasChatOverlayProps {
  open: boolean;
  onClose: () => void;
}

export function AtlasChatOverlay({ open, onClose }: AtlasChatOverlayProps) {
  const pageState = useAtlasPageState();

  if (!open || !pageState) return null;

  return (
    <aside
      aria-label={`${pageState.agentName} chat`}
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        width: 360,
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
      <div style={{ padding: 20, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
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
          </article>
        ))}
      </div>
    </aside>
  );
}
