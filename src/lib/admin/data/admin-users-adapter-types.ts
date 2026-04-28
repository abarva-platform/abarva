/**
 * ADMIN-DATA2 — Admin users adapter types.
 */

export type AdminUserStatus = 'active' | 'invited' | 'suspended';
export type AdminUserPrimaryRole = 'maestro' | 'client_viewer' | 'observer';

export interface AdminUserRow {
  id: string;
  email: string;
  displayName: string;
  primaryRole: AdminUserPrimaryRole;
  tenantRoles: ReadonlyArray<{ tenantSlug: string; role: string }>;
  lastSignIn: string | null;
  status: AdminUserStatus;
}

export interface AdminUserActivityEntry {
  at: string;
  action: string;
  targetTable: string;
}

export interface AdminUserDetail extends AdminUserRow {
  permissions: ReadonlyArray<string>;
  recentActivity: ReadonlyArray<AdminUserActivityEntry>;
}

export interface AdminRoleSummary {
  roleId: string;
  label: string;
  memberCount: number;
  scope: string;
  permissionCount: number;
}

export type AdminInviteStatus = 'pending' | 'expired';

export interface AdminInviteRow {
  id: string;
  email: string;
  invitedRoleId: string;
  invitedRoleLabel: string;
  invitedBy: string;
  sentAt: string;
  status: AdminInviteStatus;
}
