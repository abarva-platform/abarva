import type { ReactNode } from 'react';
import { SHELL } from '@/lib/shell/shell-tokens';

export interface AppMiddleStripProps {
  children: ReactNode;
  rightSlot?: ReactNode;
}

export function AppMiddleStrip({ children, rightSlot }: AppMiddleStripProps) {
  return (
    <div
      style={{
        height: 44,
        background: SHELL.PAPER_SOFT,
        borderBottom: `1px solid ${SHELL.CARD_LINE_SOFT}`,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        padding: '0 24px',
        gap: 18,
        flexShrink: 0,
      }}
    >
      {/* Left content */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 18, minWidth: 0 }}>
        {children}
      </div>

      {/* Right action */}
      {rightSlot ? (
        <div style={{ flexShrink: 0 }}>
          <div
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 10,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: SHELL.INK,
              padding: '5px 11px',
              border: `1px solid ${SHELL.INK}`,
              borderRadius: 14,
              cursor: 'pointer',
              lineHeight: 1,
              display: 'inline-flex',
              alignItems: 'center',
            }}
          >
            {rightSlot}
          </div>
        </div>
      ) : null}
    </div>
  );
}
