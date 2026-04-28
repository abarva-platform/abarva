import type { ReactNode } from 'react';
import { AppRail } from './AppRail';
import { AppTopBar } from './AppTopBar';
import { AppMiddleStrip } from './AppMiddleStrip';
import { CommandPaletteLoader } from './CommandPaletteLoader';

interface AppShellProps {
  surface?: 'setup' | 'programs' | 'source' | 'intelligence' | 'tower';
  topBarProps?: {
    tenantName?: string;
    showLocked?: boolean;
    context?: string;
    timeString?: string;
  };
  middleStrip?: ReactNode;
  children: ReactNode;
}

export function AppShell({
  topBarProps,
  middleStrip,
  children,
}: AppShellProps) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '76px 1fr',
        minHeight: '100vh',
        overflow: 'hidden',
      }}
    >
      {/* Left rail */}
      <AppRail />

      {/* Right main column */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          minHeight: '100vh',
          overflow: 'hidden',
        }}
      >
        <AppTopBar
          tenantName={topBarProps?.tenantName}
          showLocked={topBarProps?.showLocked}
          context={topBarProps?.context}
          timeString={topBarProps?.timeString}
        />

        {middleStrip && (
          <AppMiddleStrip>{middleStrip}</AppMiddleStrip>
        )}

        {/* Body: fills remaining height */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            minHeight: 0,
            overflow: 'hidden',
          }}
        >
          {children}
        </div>
      </div>

      {/* Command palette · self-manages open state via Cmd+K listener */}
      <CommandPaletteLoader />
    </div>
  );
}
