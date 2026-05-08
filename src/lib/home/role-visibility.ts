// Role-visibility utility · pendant to the metadata in
// panel-inventory.ts and top-nav-items.ts.
//
// Today this is informational only — the resolver always returns
// true. When the role kit lands it'll filter against the current
// user's roles.
//
// Doctrine: docs/build/home-refinement-package/ROLE_READINESS_DOCTRINE.md

import type { Role } from './panel-inventory';

export interface RoleVisibilityMetadata {
  visibleToRoles: ReadonlyArray<Role>;
}

export interface RequiresRoleMetadata {
  /** Action requires this role (or higher) to execute. Today the
   *  field is not enforced; surfaced for documentation + future use. */
  requiresRole?: Role;
}

/**
 * Today: returns true for every component (no enforcement). When
 * role-based rendering ships, change to:
 *
 *   return component.visibleToRoles.some(r => currentUser.roles.includes(r));
 *
 * Search marker for the future migration: ROLE_KIT_FILTER_HOOK.
 */
export function isVisibleToCurrentUser(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  component: RoleVisibilityMetadata,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  currentUserRoles?: ReadonlyArray<Role>,
): boolean {
  // ROLE_KIT_FILTER_HOOK · TODO: enforce role-based filtering when role kit ships.
  return true;
}

/**
 * Today: returns true (every signed-in user is admin in current
 * deployments). When role-based gating ships, this checks the
 * action's requiresRole against the current user.
 *
 * Search marker for the future migration: ROLE_KIT_REQUIRES_HOOK.
 */
export function canExecuteAction(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  action: RequiresRoleMetadata,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  currentUserRoles?: ReadonlyArray<Role>,
): boolean {
  // ROLE_KIT_REQUIRES_HOOK · TODO: enforce role-based gating when role kit ships.
  return true;
}
