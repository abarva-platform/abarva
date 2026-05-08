// Sample admin-CTA metadata descriptors · pendant to the
// role-readiness doctrine.
//
// This file documents the metadata shape every admin-flavored
// button (edit · delete · re-run · reset) should carry. The
// descriptors here are illustrative — they don't drive any
// rendering today. When the role kit lands, every CTA in the
// codebase gets converted to read its descriptor from a registry
// like this one.
//
// Doctrine: docs/build/home-refinement-package/ROLE_READINESS_DOCTRINE.md

import type {
  RequiresRoleMetadata,
  RoleVisibilityMetadata,
} from './role-visibility';

export interface AdminCtaMetadata extends RoleVisibilityMetadata, RequiresRoleMetadata {
  id: string;
  label: string;
  description: string;
}

/**
 * Examples of admin CTAs across the platform. The visibleToRoles
 * + requiresRole fields are illustrative; UI today renders them all
 * for every signed-in user.
 *
 * TODO: enforce role-based gating when role kit ships.
 */
export const ADMIN_CTA_DESCRIPTORS: ReadonlyArray<AdminCtaMetadata> = [
  {
    id: 'ai-initiative.edit',
    label: 'Edit Initiative',
    description: 'Edit AI initiative metadata · admin only',
    visibleToRoles: ['admin'],
    requiresRole: 'admin',
  },
  {
    id: 'connector.rerun',
    label: 'Re-run integration',
    description: 'Force re-run of a data integration · admin only',
    visibleToRoles: ['admin'],
    requiresRole: 'admin',
  },
  {
    id: 'connector.disconnect',
    label: 'Disconnect',
    description: 'Disconnect an integration · admin only',
    visibleToRoles: ['admin'],
    requiresRole: 'admin',
  },
  {
    id: 'data-trust.reset',
    label: 'Reset trust ladder',
    description: 'Manually reset substrate trust ladder · admin only',
    visibleToRoles: ['admin'],
    requiresRole: 'admin',
  },
  {
    id: 'tenant-profile.edit',
    label: 'Edit Tenant Profile',
    description: 'Edit tenant context · admin only',
    visibleToRoles: ['admin'],
    requiresRole: 'admin',
  },
  {
    id: 'learn.feedback',
    label: 'Send feedback',
    description: 'Open feedback link · everyone',
    visibleToRoles: ['admin', 'cxo', 'analyst', 'end_user'],
    // requiresRole undefined — no admin gate
  },
];
