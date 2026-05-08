// Home Panel Inventory · canonical 8-panel structure per
// docs/build/home-refinement-package/HOME_PANELS_INVENTORY.md.
//
// Each panel carries route + group + visibleToRoles metadata. The
// metadata is informational today (every signed-in user sees every
// panel); ROLE_READINESS_DOCTRINE.md describes the future enforcement
// path. PR-H5 adds requiresRole metadata to admin-flavored CTAs.

export type Role = 'admin' | 'cxo' | 'analyst' | 'end_user';

export type HomePanelGroup = 'explore' | 'configure' | 'learn';

export interface HomePanelMetadata {
  id: string;
  label: string;
  route: string;
  group: HomePanelGroup;
  visibleToRoles: ReadonlyArray<Role>;
  description: string;
  /** Single-line "what's there" stat shown on the card. Optional —
   *  the page renders a placeholder when omitted. */
  statHint?: string;
}

export const HOME_PANELS: ReadonlyArray<HomePanelMetadata> = [
  {
    id: 'overview',
    label: 'Overview',
    route: '/home',
    group: 'explore',
    visibleToRoles: ['admin', 'cxo', 'analyst', 'end_user'],
    description: 'Tenant status and what needs attention',
  },
  {
    id: 'data-trust',
    label: 'Data Trust',
    route: '/home/data-trust',
    group: 'explore',
    visibleToRoles: ['admin', 'analyst'],
    description: 'Data provenance and substrate completeness',
  },
  {
    id: 'ai-initiatives',
    label: 'AI Initiatives',
    route: '/home/ai-initiatives',
    group: 'explore',
    visibleToRoles: ['admin', 'cxo', 'analyst'],
    description: 'AI initiative inventory across the tenant',
  },
  {
    id: 'agent-readiness',
    label: 'Agent Readiness',
    route: '/home/agent-readiness',
    group: 'explore',
    visibleToRoles: ['admin', 'analyst'],
    description: 'Agent state and substrate access verification',
  },
  {
    id: 'connectors',
    label: 'Connectors',
    route: '/home/connectors',
    group: 'configure',
    visibleToRoles: ['admin'],
    description: 'Manage integrations and data sources',
  },
  {
    id: 'tenant-profile',
    label: 'Tenant Profile',
    route: '/home/tenant-profile',
    group: 'configure',
    visibleToRoles: ['admin'],
    description: 'Tenant context and named CXOs',
  },
  {
    id: 'configuration',
    label: 'Configuration',
    route: '/home/configuration',
    group: 'configure',
    visibleToRoles: ['admin'],
    description: 'Platform settings and feature flags',
  },
  {
    id: 'learn',
    label: 'Learn',
    route: '/home/learn',
    group: 'learn',
    visibleToRoles: ['admin', 'cxo', 'analyst', 'end_user'],
    description: 'Product info, doctrine, glossary',
  },
];

export const HOME_PANEL_GROUP_LABELS: Record<HomePanelGroup, string> = {
  explore: 'Explore',
  configure: 'Configure',
  learn: 'Learn',
};

export const HOME_PANEL_GROUP_SUBTITLES: Record<HomePanelGroup, string> = {
  explore: 'Operational · daily use',
  configure: 'Admin · periodic',
  learn: 'Orient · on demand',
};

export function panelsByGroup(
  panels: ReadonlyArray<HomePanelMetadata> = HOME_PANELS,
): ReadonlyArray<{
  group: HomePanelGroup;
  label: string;
  subtitle: string;
  panels: ReadonlyArray<HomePanelMetadata>;
}> {
  const order: ReadonlyArray<HomePanelGroup> = ['explore', 'configure', 'learn'];
  return order.map((g) => ({
    group: g,
    label: HOME_PANEL_GROUP_LABELS[g],
    subtitle: HOME_PANEL_GROUP_SUBTITLES[g],
    panels: panels.filter((p) => p.group === g),
  }));
}
