import type { ReactNode } from 'react';
import { AppRail } from './AppRail';
import { AppTopBar } from './AppTopBar';
import { AppMiddleStrip } from './AppMiddleStrip';
import { CommandPaletteLoader } from './CommandPaletteLoader';
import { AtlasPageStateProvider } from './AtlasPageStateProvider';
import type { SurfaceId } from '@/lib/shell/atlas-page-state';

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
  surface,
  topBarProps,
  middleStrip,
  children,
}: AppShellProps) {
  const tenantName = topBarProps?.tenantName ?? 'Apex Retail Group';
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

        {/* Body: fills remaining height — wrapped in AtlasPageStateProvider so
            every child (AgentColumn, AskAnythingBar, etc.) shares one Atlas
            state object. Shell Layout Spec v2 §6. */}
        <AtlasPageStateProvider
          surface={(surface as SurfaceId) ?? 'home'}
          tenantName={tenantName}
        >
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
        </AtlasPageStateProvider>
      </div>

      {/* Command palette · self-manages open state via Cmd+K listener */}
      <CommandPaletteLoader />
    </div>
  );
}
