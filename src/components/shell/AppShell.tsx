import type { ReactNode } from 'react';
import { AppRail } from './AppRail';
import { AppTopBar } from './AppTopBar';
import { AppMiddleStrip } from './AppMiddleStrip';
// GlobalSearchModal is mounted in the maestro layout for app-wide coverage.
import { AtlasPageStateProvider } from './AtlasPageStateProvider';
import type { SurfaceId, StageId } from '@/lib/shell/atlas-page-state';

interface AppShellProps {
  surface?: 'setup' | 'setup-detail' | 'programs' | 'programs-detail' | 'source' | 'source-detail' | 'intelligence' | 'tower' | 'home';
  /**
   * Workflow stage for stage-aware surfaces (Shell Layout Spec v2 §7).
   * P0-P6 for Programs phases, S1-S7 for Source event stages.
   * Pass null or omit for monitoring surfaces (Tower, Intelligence, Home).
   */
  stage?: StageId | null;
  /**
   * Surface-specific context injected into every agent turn.
   * E.g. program metadata, pressure items, source event details.
   */
  surfaceContext?: Record<string, unknown>;
  topBarProps?: {
    tenantName?: string;
    showLocked?: boolean;
    context?: string;
    timeString?: string;
  };
  /**
   * CB-8 · whether the session has a real tenant binding (i.e. an
   * active client row resolved server-side via `getActiveClientRow()`).
   * Used by the 4-mode toggle to disable Tenant / Full when no tenant
   * is bound. `tenantName` is unreliable for this check — it defaults
   * to a display string for unauthenticated demo opens. Defaults to
   * `false` when omitted.
   */
  hasTenantKey?: boolean;
  agentName?: string;
  middleStrip?: ReactNode;
  /**
   * PR-L · structured-artifact dispatcher passed through to
   * AtlasPageStateProvider. Pages on /programs/<id> wire this to
   * update the reactive panel and trigger router.refresh() when the
   * agent emits a program-phase-changed artifact.
   */
  onArtifact?: (artifact: import('@/lib/agent/artifacts').Artifact) => void;
  children: ReactNode;
}

export function AppShell({
  surface,
  stage,
  surfaceContext,
  topBarProps,
  hasTenantKey = false,
  agentName,
  middleStrip,
  onArtifact,
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
          hasTenantKey={hasTenantKey}
          stage={stage ?? null}
          surfaceContext={surfaceContext ?? {}}
          agentName={agentName}
          onArtifact={onArtifact}
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

      {/* Global search modal is rendered in the maestro layout for app-wide coverage */}
    </div>
  );
}
