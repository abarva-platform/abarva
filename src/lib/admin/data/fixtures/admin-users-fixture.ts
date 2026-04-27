/**
 * ADMIN-DATA2 — Admin users fixture.
 *
 * Lifts SEED_USER_DETAILS, SEED_INVITES, SEED_ROLE_SUMMARY from
 * `users-access-page-view.ts`.
 */

import type {
  AdminInviteRow,
  AdminRoleSummary,
  AdminUserDetail,
  AdminUserPrimaryRole,
  AdminUserRow,
} from '../admin-users-adapter-types';

function classifyPrimaryRole(roleId: string): AdminUserPrimaryRole {
  if (roleId === 'maestro') return 'maestro';
  if (roleId === 'investor' || roleId === 'sponsor' || roleId === 'platform_admin' || roleId === 'tenant_admin') {
    return 'client_viewer';
  }
  return 'observer';
}

function tenantSlugFor(tenantLabel: string): string {
  const map: Record<string, string> = {
    'AbarVa Platform': 'abarva-platform',
    'Apex Retail': 'apex-retail',
    'Meridian': 'meridian',
  };
  return map[tenantLabel] ?? tenantLabel.toLowerCase().replace(/\s+/g, '-');
}

const APEX_USER_DETAILS: ReadonlyArray<AdminUserDetail> = [
  {
    id: 'usr_001',
    email: 'anand@abarva.io',
    displayName: 'Anand Sundaram',
    primaryRole: classifyPrimaryRole('platform_admin'),
    tenantRoles: [{ tenantSlug: tenantSlugFor('AbarVa Platform'), role: 'platform_admin' }],
    lastSignIn: '2026-04-26T09:18:00Z',
    status: 'active',
    permissions: ['platform.read', 'platform.write', 'tenant.read', 'tenant.write'],
    recentActivity: [
      { at: '2026-04-26T09:18:00Z', action: 'Signed in via Clerk OTP', targetTable: 'auth' },
      { at: '2026-04-25T17:42:00Z', action: 'Reviewed admin readiness audit', targetTable: 'admin_audit_log' },
    ],
  },
  {
    id: 'usr_002',
    email: 'maya@apex-retail.demo',
    displayName: 'Maya Iyer',
    primaryRole: classifyPrimaryRole('tenant_admin'),
    tenantRoles: [{ tenantSlug: 'apex-retail', role: 'tenant_admin' }],
    lastSignIn: '2026-04-25T14:02:00Z',
    status: 'active',
    permissions: ['tenant.read', 'tenant.write', 'programs.read'],
    recentActivity: [
      { at: '2026-04-25T14:02:00Z', action: 'Approved Phase 3 dataset', targetTable: 'admin_datasets' },
      { at: '2026-04-24T11:30:00Z', action: 'Updated tenant SSO posture', targetTable: 'admin_connectors' },
    ],
  },
  {
    id: 'usr_003',
    email: 'daniel@apex-retail.demo',
    displayName: 'Daniel Cho',
    primaryRole: classifyPrimaryRole('maestro'),
    tenantRoles: [{ tenantSlug: 'apex-retail', role: 'maestro' }],
    lastSignIn: '2026-04-26T08:05:00Z',
    status: 'active',
    permissions: ['programs.read', 'programs.write', 'deliverables.read'],
    recentActivity: [
      { at: '2026-04-26T08:05:00Z', action: 'Composed deliverable for Contact Center AI', targetTable: 'programs' },
    ],
  },
  {
    id: 'usr_004',
    email: 'priya@meridian.demo',
    displayName: 'Priya Rao',
    primaryRole: classifyPrimaryRole('maestro'),
    tenantRoles: [{ tenantSlug: 'meridian', role: 'maestro' }],
    lastSignIn: '2026-04-23T16:20:00Z',
    status: 'active',
    permissions: ['programs.read', 'programs.write', 'deliverables.read'],
    recentActivity: [
      { at: '2026-04-23T16:20:00Z', action: 'Authored Intelligence brief', targetTable: 'intelligence' },
    ],
  },
  {
    id: 'usr_005',
    email: 'eli@apex-retail.demo',
    displayName: 'Eli Park',
    primaryRole: classifyPrimaryRole('sponsor'),
    tenantRoles: [{ tenantSlug: 'apex-retail', role: 'sponsor' }],
    lastSignIn: '2026-04-22T10:14:00Z',
    status: 'active',
    permissions: ['tower.read', 'scorecard.read'],
    recentActivity: [
      { at: '2026-04-22T10:14:00Z', action: 'Reviewed pressure cards', targetTable: 'tower' },
    ],
  },
  {
    id: 'usr_006',
    email: 'naomi@meridian.demo',
    displayName: 'Naomi Stein',
    primaryRole: classifyPrimaryRole('sponsor'),
    tenantRoles: [{ tenantSlug: 'meridian', role: 'sponsor' }],
    lastSignIn: '2026-04-20T18:55:00Z',
    status: 'active',
    permissions: ['tower.read', 'scorecard.read'],
    recentActivity: [
      { at: '2026-04-20T18:55:00Z', action: 'Read executive brief', targetTable: 'tower' },
    ],
  },
  {
    id: 'usr_007',
    email: 'karim@investors.demo',
    displayName: 'Karim Bell',
    primaryRole: classifyPrimaryRole('investor'),
    tenantRoles: [{ tenantSlug: tenantSlugFor('AbarVa Platform'), role: 'investor' }],
    lastSignIn: '2026-04-18T07:33:00Z',
    status: 'active',
    permissions: ['portfolio.read'],
    recentActivity: [
      { at: '2026-04-18T07:33:00Z', action: 'Viewed portfolio brief', targetTable: 'portfolio' },
    ],
  },
];

const APEX_INVITES: ReadonlyArray<AdminInviteRow> = [
  {
    id: 'inv_001',
    email: 'sasha@apex-retail.demo',
    invitedRoleId: 'maestro',
    invitedRoleLabel: 'Maestro',
    invitedBy: 'Anand Sundaram',
    sentAt: '2026-04-24T10:00:00Z',
    status: 'pending',
  },
  {
    id: 'inv_002',
    email: 'lee@meridian.demo',
    invitedRoleId: 'sponsor',
    invitedRoleLabel: 'Sponsor',
    invitedBy: 'Priya Rao',
    sentAt: '2026-04-22T14:30:00Z',
    status: 'pending',
  },
  {
    id: 'inv_003',
    email: 'expired@example.demo',
    invitedRoleId: 'observer',
    invitedRoleLabel: 'Observer',
    invitedBy: 'Anand Sundaram',
    sentAt: '2026-03-30T08:15:00Z',
    status: 'expired',
  },
];

const APEX_ROLE_SUMMARY: ReadonlyArray<AdminRoleSummary> = [
  {
    roleId: 'platform_admin',
    label: 'Platform admin',
    memberCount: 1,
    scope: 'Full platform scope · read-only on live mutation',
    permissionCount: 4,
  },
  {
    roleId: 'tenant_admin',
    label: 'Tenant admin',
    memberCount: 2,
    scope: 'Single-tenant scope · no cross-tenant reach',
    permissionCount: 3,
  },
  {
    roleId: 'maestro',
    label: 'Maestro',
    memberCount: 3,
    scope: 'Engagement owner · composes deliverables, drives Programs',
    permissionCount: 3,
  },
  {
    roleId: 'sponsor',
    label: 'Sponsor',
    memberCount: 2,
    scope: 'Tower brief, scorecards, pressure cards · no edit',
    permissionCount: 2,
  },
  {
    roleId: 'investor',
    label: 'Investor',
    memberCount: 1,
    scope: 'Portfolio brief read-only · no raw datasets',
    permissionCount: 1,
  },
  {
    roleId: 'observer',
    label: 'Observer',
    memberCount: 0,
    scope: 'Reserved · no seats today',
    permissionCount: 0,
  },
];

function detailToRow(detail: AdminUserDetail): AdminUserRow {
  return {
    id: detail.id,
    email: detail.email,
    displayName: detail.displayName,
    primaryRole: detail.primaryRole,
    tenantRoles: detail.tenantRoles,
    lastSignIn: detail.lastSignIn,
    status: detail.status,
  };
}

export function adminUsersFixture(tenantSlug: string): ReadonlyArray<AdminUserRow> {
  if (tenantSlug !== 'apex-retail') return [];
  return APEX_USER_DETAILS.map(detailToRow);
}

export function adminUserDetailFixture(
  tenantSlug: string,
  userId: string,
): AdminUserDetail | null {
  if (tenantSlug !== 'apex-retail') return null;
  return APEX_USER_DETAILS.find((u) => u.id === userId) ?? null;
}

export function adminInvitesFixture(tenantSlug: string): ReadonlyArray<AdminInviteRow> {
  if (tenantSlug !== 'apex-retail') return [];
  return APEX_INVITES;
}

export function adminRoleSummaryFixture(tenantSlug: string): ReadonlyArray<AdminRoleSummary> {
  if (tenantSlug !== 'apex-retail') return [];
  return APEX_ROLE_SUMMARY;
}
