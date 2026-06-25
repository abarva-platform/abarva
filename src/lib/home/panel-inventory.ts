// Home Panel Inventory · pure Home structure per
// docs/build/home-refinement-package/HOME_PANELS_INVENTORY.md.
//
// Each panel carries route + group + visibleToRoles metadata. The
// metadata is informational today (every signed-in user sees every
// panel); ROLE_READINESS_DOCTRINE.md describes the future enforcement
// path. Admin/setup surfaces live in /admin/* and are intentionally
// absent from this Home inventory.

export type Role = 'admin' | 'cxo' | 'analyst' | 'end_user';

export type HomePanelGroup = 'insight' | 'decision' | 'action' | 'learn';

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
    group: 'insight',
    visibleToRoles: ['admin', 'cxo', 'analyst', 'end_user'],
    description: 'Tenant status and what needs attention',
  },
  {
    id: 'queue',
    label: 'Action Queue',
    route: '/home/queue',
    group: 'action',
    visibleToRoles: ['admin', 'cxo', 'analyst'],
    description: 'Open actions and approval follow-through',
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
  insight: 'Insight',
  decision: 'Decision',
  action: 'Action',
  learn: 'Learn',
};

export const HOME_PANEL_GROUP_SUBTITLES: Record<HomePanelGroup, string> = {
  insight: 'Understand · compare',
  decision: 'Focus · choose',
  action: 'Act · follow through',
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
  const order: ReadonlyArray<HomePanelGroup> = ['insight', 'decision', 'action', 'learn'];
  return order.map((g) => ({
    group: g,
    label: HOME_PANEL_GROUP_LABELS[g],
    subtitle: HOME_PANEL_GROUP_SUBTITLES[g],
    panels: panels.filter((p) => p.group === g),
  }));
}
