// Top nav inventory · canonical 5-item nav per
// docs/build/home-refinement-package/NAV_REORGANIZATION.md.
//
// Today AbarvaNav.tsx renders these items inline (each `navLink(...)`
// call). This file is the metadata-shape pendant per the role-
// readiness doctrine: each item declares visibleToRoles so the
// future role-gated rendering doesn't need a refactor.
//
// TODO: enforce role-based filtering when role kit ships. Today
// every signed-in user sees every item.

import type { Role } from './panel-inventory';

export interface TopNavItem {
  id: 'home' | 'intelligence' | 'moves' | 'source' | 'tower';
  label: string;
  href: string;
  /** Module key checked by canShow() in AbarvaNav (legacy module
   *  access, separate from the visibleToRoles metadata below). */
  moduleKey: 'programs' | 'source' | 'intelligence' | 'tower' | null;
  visibleToRoles: ReadonlyArray<Role>;
}

export const TOP_NAV_ITEMS: ReadonlyArray<TopNavItem> = [
  {
    // CL-1 (2026-05-30) · Top-nav "Home" lands on the /admin Trust
    // Plane; matches the canonical entry in
    // src/components/shell/topbar-nav-items.ts. See
    // docs/build/SETUP_AUDIT_2026-05-30_VERDICT.md §2.
    id: 'home',
    label: 'Home',
    href: '/admin',
    moduleKey: null,
    visibleToRoles: ['admin', 'cxo', 'analyst', 'end_user'],
  },
  {
    id: 'intelligence',
    label: 'Intelligence',
    href: '/intelligence',
    moduleKey: 'intelligence',
    visibleToRoles: ['admin', 'cxo', 'analyst', 'end_user'],
  },
  {
    id: 'moves',
    label: 'Moves',
    href: '/strategic-moves',
    moduleKey: 'programs',
    visibleToRoles: ['admin', 'cxo', 'analyst', 'end_user'],
  },
  {
    id: 'source',
    label: 'Source',
    href: '/source',
    moduleKey: 'source',
    visibleToRoles: ['admin', 'cxo', 'analyst', 'end_user'],
  },
  {
    id: 'tower',
    label: 'Tower',
    href: '/tower',
    moduleKey: 'tower',
    visibleToRoles: ['admin', 'cxo', 'analyst', 'end_user'],
  },
];
