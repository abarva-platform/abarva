// ADMIN8 — /admin/architecture is the canonical Architecture page.
// /platform/admin/architecture redirects here for backward compatibility.
// ADMIN17 — Per-plane drilldown + component drawer + Azure sub-tab.
import Link from 'next/link';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import { ContextBar } from '@/components/admin/ContextBar';
import { StewardEditorial } from '@/components/admin/StewardEditorial';
import { ArchitecturePlaneDrilldown } from '@/components/admin/ArchitecturePlaneDrilldown';
import { ComponentDetailDrawer } from '@/components/admin/ComponentDetailDrawer';
import { AzureArchitectureCanvas } from '@/components/admin/AzureArchitectureCanvas';
import { ArchitectureActionStrip } from '@/components/admin/ArchitectureActionStrip';
import {
  buildArchitecturePageView,
  type ArchitectureView,
} from '@/lib/admin/architecture-page-view';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';

export const metadata = {
  title: 'Architecture Overview | AbarVa Setup',
};

interface ArchitecturePageSearchParams {
  view?: string;
  expand?: string;
  component?: string;
}

function normalizeView(raw?: string): ArchitectureView {
  return raw === 'azure' ? 'azure' : 'core';
}

export default async function AdminArchitecturePage({
  searchParams,
}: {
  searchParams?: Promise<ArchitecturePageSearchParams>;
}) {
  const params = (await searchParams) ?? {};
  const view = await buildArchitecturePageView();
  const activeView = normalizeView(params.view);
  const expandedPlaneId = params.expand;
  const componentId = params.component;
  const selectedComponent = componentId
    ? view.componentDetailMap[componentId]
    : undefined;

  const basePath = '/admin/architecture';
  const coreHref = expandedPlaneId
    ? `${basePath}?expand=${expandedPlaneId}`
    : basePath;
  const azureHref = `${basePath}?view=azure`;

  const tabBase = {
    display: 'inline-flex',
    alignItems: 'center',
    padding: `${SPACING.sm} ${SPACING.md}`,
    borderRadius: RADIUS.pill,
    fontSize: 13,
    fontWeight: 600,
    textDecoration: 'none',
    fontFamily: TYPOGRAPHY.sans,
    border: `1px solid ${COLORS.ink}15`,
  } as const;

  return (
    <AdminCanonShellV2
      agentRail={
        <AgentRail
          primaryAgentLabel={view.primaryAgentLabel}
          primaryActionLabel={view.primaryActionLabel}
          primaryActionHref={view.primaryActionHref}
        />
      }
    >
      <EditorialCanvas eyebrow={view.eyebrow} title={view.title} subtitle={view.subtitle}>
        <ContextBar
          tenant={view.context.tenant}
          mode={view.context.mode}
          agent={view.context.agent}
          data={view.context.data}
          liveStatus={view.context.liveStatus}
          liveStatusKind={view.context.liveStatusKind}
        />
        <StewardEditorial
          title={view.editorial.title}
          body={view.editorial.body}
          contextUsed={view.editorial.contextUsed}
          evidenceStrength={view.editorial.evidenceStrength}
          blocker={view.editorial.blocker}
          primaryAction={view.editorial.primaryAction}
        />

        <nav
          data-architecture-subtabs="true"
          aria-label="Architecture views"
          style={{
            display: 'flex',
            gap: SPACING.sm,
            margin: `${SPACING.md} 0`,
          }}
        >
          <Link
            href={coreHref}
            data-architecture-subtab="core"
            data-architecture-subtab-active={activeView === 'core' ? 'true' : 'false'}
            style={{
              ...tabBase,
              background: activeView === 'core' ? COLORS.skyPale : COLORS.white,
              color: activeView === 'core' ? COLORS.navy : COLORS.ink,
            }}
          >
            Core architecture
          </Link>
          <Link
            href={azureHref}
            data-architecture-subtab="azure"
            data-architecture-subtab-active={activeView === 'azure' ? 'true' : 'false'}
            style={{
              ...tabBase,
              background: activeView === 'azure' ? COLORS.skyPale : COLORS.white,
              color: activeView === 'azure' ? COLORS.navy : COLORS.ink,
            }}
          >
            Azure target
          </Link>
        </nav>

        {activeView === 'core' ? (
          <>
            <ArchitecturePlaneDrilldown
              planes={view.planes}
              components={view.planeComponents}
              expandedPlaneId={expandedPlaneId}
              basePath={basePath}
            />
            {selectedComponent ? (
              <ComponentDetailDrawer
                component={selectedComponent}
                componentDetailMap={view.componentDetailMap}
                closeHref={
                  expandedPlaneId
                    ? `${basePath}?expand=${expandedPlaneId}`
                    : basePath
                }
              />
            ) : null}
          </>
        ) : (
          <AzureArchitectureCanvas
            services={view.azureServices}
            edges={view.azureTargetArchitecture.edges}
          />
        )}

        <ArchitectureActionStrip azureHref={azureHref} />
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}
