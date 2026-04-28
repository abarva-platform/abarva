import { SHELL } from '@/lib/shell/shell-tokens';

export interface AppTopBarProps {
  tenantName?: string;
  showLocked?: boolean;
  context?: string;
  timeString?: string;
}

export function AppTopBar({
  tenantName = 'Apex Retail Group',
  showLocked,
  context,
  timeString,
}: AppTopBarProps) {
  return (
    <div
      style={{
        height: 48,
        background: SHELL.PAPER,
        borderBottom: `1px solid ${SHELL.CARD_LINE_SOFT}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        flexShrink: 0,
      }}
    >
      {/* Left side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {/* Tenant badge */}
        <div
          style={{
            background: '#e8eef7',
            borderRadius: 6,
            padding: '5px 11px',
            display: 'flex',
            alignItems: 'center',
            gap: 7,
          }}
        >
          {/* Amber dot */}
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: SHELL.AMBER_DOT,
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontFamily: SHELL.SERIF,
              fontSize: 12.5,
              fontWeight: 600,
              color: SHELL.INK,
              lineHeight: 1,
            }}
          >
            {tenantName}
          </span>
        </div>

        {/* LOCKED pill */}
        {showLocked ? (
          <span
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 8.5,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: SHELL.INK,
              padding: '3px 7px',
              border: `1px solid ${SHELL.INK}`,
              borderRadius: 3,
              lineHeight: 1,
            }}
          >
            Locked
          </span>
        ) : null}

        {/* Context string */}
        {context ? (
          <span
            style={{
              fontFamily: SHELL.SANS,
              fontSize: 13,
              color: SHELL.INK_MID,
            }}
          >
            {context}
          </span>
        ) : null}

        {/* ⌘K hint */}
        <span
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 9,
            letterSpacing: '0.12em',
            color: SHELL.INK_MUTED,
            background: SHELL.GRAY_BG,
            padding: '3px 7px',
            borderRadius: 4,
          }}
        >
          ⌘K
        </span>
      </div>

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        {/* Time string */}
        {timeString ? (
          <span
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 11,
              color: SHELL.INK_SOFT,
              letterSpacing: '0.04em',
            }}
          >
            {timeString}
          </span>
        ) : null}

        {/* Avatar */}
        <div
          style={{
            width: 26,
            height: 26,
            borderRadius: '50%',
            background: '#c5b9d1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontFamily: SHELL.SANS,
              fontSize: 11,
              fontWeight: 600,
              color: SHELL.INK,
              lineHeight: 1,
            }}
          >
            D
          </span>
        </div>
      </div>
    </div>
  );
}
