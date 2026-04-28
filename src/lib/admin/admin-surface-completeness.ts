// ADM7 · Admin Surface Completeness
// Deterministic inventory of the admin surface: what panels are implemented,
// what is planned, and what is deferred — with an overall completeness percentage.
// NO model calls · NO DB writes · NO 'use client' · NO React

type PanelStatus = 'implemented' | 'planned' | 'deferred'

export interface AdminPanel {
  panelId: string
  label: string
  status: PanelStatus
  componentPath: string | null   // non-null for implemented panels only
  sliceId: string                // which slice built or will build it
  notes: string
}

export interface AdminSurfaceCompletenessReport {
  panels: AdminPanel[]
  implementedCount: number
  plannedCount: number
  deferredCount: number
  completenessPercent: number    // implementedCount / panels.length * 100
  nextPanelToBuild: AdminPanel | null  // first panel with status 'planned'
  createdFrom: 'adm7_admin_surface_completeness'
  generatedAt: string
}

export function buildAdminPanelInventory(): AdminPanel[] {
  return [
    {
      panelId: 'prod-readiness-tracker',
      label: 'Production Readiness Tracker',
      status: 'implemented',
      componentPath: 'src/components/admin/ProductionReadinessTracker.tsx',
      sliceId: 'ADM3',
      notes:
        'Deterministic read model covering all 15 components; no live monitoring; surface-level readiness percent displayed.',
    },
    {
      panelId: 'deployment-status-card',
      label: 'Deployment Status Card',
      status: 'implemented',
      componentPath: 'src/components/admin/DeploymentStatusCard.tsx',
      sliceId: 'PROD5',
      notes:
        'Shows last-known Vercel deployment status from the deterministic ingestion read model; no live Vercel polling at render time.',
    },
    {
      panelId: 'steward-setup-control-center',
      label: 'Steward Setup Control Center',
      status: 'implemented',
      componentPath: 'src/components/admin/StewardSetupControlCenter.tsx',
      sliceId: 'ADM6',
      notes:
        'Canonical operator control center for Steward configuration; mounts AG11 agent mission panel in compact_strip variant; no live Steward runtime.',
    },
    {
      panelId: 'prod-readiness-live-panel',
      label: 'Production Readiness Live Panel',
      status: 'implemented',
      componentPath: 'src/components/admin/ProductionReadinessLivePanel.tsx',
      sliceId: 'PROD3',
      notes:
        'Auto-refreshing production readiness panel backed by deterministic polling; no real-time event bus wired.',
    },
    {
      panelId: 'dataset-explorer-panel',
      label: 'Dataset Explorer Panel',
      status: 'implemented',
      componentPath: 'src/components/admin/DatasetExplorerPanel.tsx',
      sliceId: 'ADM4',
      notes:
        'Left-filter + right-grid Snowflake-inspired dataset explorer; reads from the deterministic dataset domain inventory.',
    },
    {
      panelId: 'users-access-surface',
      label: 'Users & Access Surface',
      status: 'implemented',
      componentPath: 'src/components/admin/UsersAccessSurface.tsx',
      sliceId: 'ADM6',
      notes:
        'Read-only roles-and-counts surface for all 7 canonical roles; no real person names; invite/edit/revoke disabled as future pills.',
    },
    {
      panelId: 'live-ci-dashboard',
      label: 'Live CI Dashboard',
      status: 'planned',
      componentPath: null,
      sliceId: 'ADM8',
      notes:
        'Will surface GitHub Actions run status, branch health, and test-coverage trends; requires live CI webhook integration.',
    },
    {
      panelId: 'tenant-health-panel',
      label: 'Tenant Health Panel',
      status: 'planned',
      componentPath: null,
      sliceId: 'ADM9',
      notes:
        'Per-tenant health overview (data freshness, agent activity, quota usage); will consume TEN2 isolation envelope and TEN3 blueprint.',
    },
    {
      panelId: 'user-access-panel',
      label: 'User Access Panel',
      status: 'planned',
      componentPath: null,
      sliceId: 'ADM10',
      notes:
        'Full invite/edit/revoke workflow panel expanding ADM6 read-only surface; requires Clerk admin API integration.',
    },
    {
      panelId: 'cost-governance-panel',
      label: 'Cost Governance Panel',
      status: 'planned',
      componentPath: null,
      sliceId: 'ADM11',
      notes:
        'Per-tenant cost observability across compute / storage / vector / graph / gateway spend; no tenant content exposed to control plane.',
    },
    {
      panelId: 'realtime-alerts-panel',
      label: 'Real-time Alerts Panel',
      status: 'deferred',
      componentPath: null,
      sliceId: 'ADM-DEFERRED-1',
      notes:
        'Push-based anomaly and threshold alerts for admin operators; deferred pending event bus and alert routing infrastructure.',
    },
    {
      panelId: 'audit-log-viewer',
      label: 'Audit Log Viewer',
      status: 'deferred',
      componentPath: null,
      sliceId: 'ADM-DEFERRED-2',
      notes:
        'Structured audit log viewer covering agent decisions, dataset access, and governance events; deferred pending audit ledger write path.',
    },
  ]
}

export function buildAdminSurfaceCompletenessReport(): AdminSurfaceCompletenessReport {
  const panels = buildAdminPanelInventory()

  const implementedCount = panels.filter((p) => p.status === 'implemented').length
  const plannedCount = panels.filter((p) => p.status === 'planned').length
  const deferredCount = panels.filter((p) => p.status === 'deferred').length
  const completenessPercent = (implementedCount / panels.length) * 100
  const nextPanelToBuild = panels.find((p) => p.status === 'planned') ?? null

  return {
    panels,
    implementedCount,
    plannedCount,
    deferredCount,
    completenessPercent,
    nextPanelToBuild,
    createdFrom: 'adm7_admin_surface_completeness',
    generatedAt: new Date().toISOString(),
  }
}
