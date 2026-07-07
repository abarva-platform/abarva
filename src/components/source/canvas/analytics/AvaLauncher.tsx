'use client';

import { useState, type CSSProperties } from 'react';
import { ANALYTICS } from './analytics-tokens';
import type { AvaLauncherView } from './view-model';

interface AvaLauncherProps {
  launcher: AvaLauncherView;
}

/**
 * The docked, collapsed "Ask aVa" launcher — a pull-in, not a standing panel.
 * Scoped to real capabilities: gate-readiness, what's blocking, next move,
 * explain evidence, draft-on-demand. It complements the on-canvas intelligence;
 * it does not replace it.
 */
export function AvaLauncher({ launcher }: AvaLauncherProps) {
  const [open, setOpen] = useState(false);

  const fabStyle: CSSProperties = {
    position: 'fixed',
    right: 24,
    bottom: 24,
    zIndex: 70,
    display: 'flex',
    alignItems: 'center',
    gap: 9,
    background: ANALYTICS.INK,
    color: '#fff',
    border: 'none',
    borderRadius: 999,
    padding: '11px 16px 11px 12px',
    boxShadow: '0 6px 20px rgba(10,10,11,0.22)',
    cursor: 'pointer',
    fontFamily: ANALYTICS.SANS,
  };

  return (
    <>
      <button
        type="button"
        style={fabStyle}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        data-testid="ava-launcher-fab"
      >
        <span
          style={{
            width: 24,
            height: 24,
            borderRadius: 7,
            background: ANALYTICS.TEAL_BRIGHT,
            color: ANALYTICS.TEAL_DEEP,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: ANALYTICS.SERIF,
            fontWeight: 800,
            fontSize: 14,
          }}
        >
          a
        </span>
        <span style={{ fontSize: 13.5, fontWeight: 600 }}>Ask aVa</span>
      </button>

      {open ? (
        <div
          style={{
            position: 'fixed',
            right: 24,
            bottom: 78,
            zIndex: 71,
            width: 340,
            maxWidth: 'calc(100vw - 48px)',
            background: ANALYTICS.CARD,
            border: `1px solid ${ANALYTICS.LINE_STRONG}`,
            borderRadius: 16,
            boxShadow: '0 16px 44px rgba(10,10,11,0.20)',
            overflow: 'hidden',
          }}
          data-testid="ava-launcher-pop"
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '15px 17px',
              borderBottom: `1px solid ${ANALYTICS.LINE_SOFT}`,
            }}
          >
            <span
              style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                background: ANALYTICS.TEAL_DEEP,
                color: ANALYTICS.TEAL_BRIGHT,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: ANALYTICS.SERIF,
                fontWeight: 800,
                fontSize: 15,
              }}
            >
              a
            </span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14.5, color: ANALYTICS.INK }}>aVa</div>
              <div style={{ fontSize: 11, color: ANALYTICS.MUTED, marginTop: 1 }}>
                {launcher.role}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              style={{
                background: 'none',
                border: 'none',
                color: ANALYTICS.FAINT,
                fontSize: 16,
                cursor: 'pointer',
              }}
            >
              ✕
            </button>
          </div>

          <div style={{ padding: '15px 17px' }}>
            <div
              style={{
                fontSize: 12.5,
                color: ANALYTICS.INK_2,
                lineHeight: 1.5,
                background: ANALYTICS.SOFT,
                border: `1px solid ${ANALYTICS.LINE_SOFT}`,
                borderRadius: 10,
                padding: '11px 13px',
              }}
            >
              {launcher.context}
            </div>
            <div
              style={{
                fontSize: 11,
                letterSpacing: 0.4,
                textTransform: 'uppercase',
                color: ANALYTICS.FAINT,
                fontWeight: 600,
                margin: '14px 0 8px',
              }}
            >
              Ask about this stage
            </div>
            {launcher.suggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  border: `1px solid ${ANALYTICS.LINE_SOFT}`,
                  background: ANALYTICS.CARD,
                  borderRadius: 9,
                  padding: '9px 12px',
                  fontSize: 12.5,
                  color: ANALYTICS.INK_2,
                  cursor: 'pointer',
                  marginBottom: 6,
                  fontFamily: ANALYTICS.SANS,
                }}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </>
  );
}
