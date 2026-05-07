import type { ContextLiveStatus } from '@/components/admin/ContextBar';
import type { EvidenceStrength } from '@/components/admin/EvidenceStrengthPill';
import { buildAgentContextAsync } from '@/lib/agent/context-bundle';
import {
  computeAllPostures,
  type AgentPosture as AgentFoundationPosture,
} from '@/lib/agent/posture';
import { generateStewardEditorial } from '@/lib/agent/editorial';
import { buildAgentChoices, type AgentChoice } from '@/lib/agent/choices';
import {
  getAdminInvites,
  getAdminRoleMatrix,
  getAdminUserDetail,
  getAdminUsers,
} from '@/lib/admin/data/admin-users-adapter';
import type {
  AdminInviteRow,
  AdminRoleSummary,
  AdminUserDetail,
  AdminUserRow,
} from '@/lib/admin/data/admin-users-adapter-types';

export interface RoleAccessRow {
  id: string;
  label: string;
  count: number;
  scope: string;
  readOnlyToday: boolean;
}

// ---------------------------------------------------------------------------
// ADMIN11 — Depth additions
// ---------------------------------------------------------------------------

export type UsersAccessTabKey = 'all' | 'roles' | 'permissions' | 'invites';

export interface UsersAccessTabMeta {
  key: UsersAccessTabKey;
  label: string;
  description: string;
}

export interface UsersAccessUserRow {
  id: string;
  name: string;
  email: string;
  roleId: string;
  roleLabel: string;
  tenant: string;
  lastSignIn: string;
  status: 'active' | 'invited' | 'suspended';
}

export interface UsersAccessUserDetail extends UsersAccessUserRow {
  permissions: ReadonlyArray<string>;
  inviteStatus: 'accepted' | 'pending' | 'expired' | 'never';
  recentActivity: ReadonlyArray<{
    at: string;
    label: string;
  }>;
}

export interface UsersAccessInviteRow {
  id: string;
  email: string;
  invitedRoleId: string;
  invitedRoleLabel: string;
  invitedBy: string;
  sentAt: string;
  status: 'pending' | 'expired';
}

export interface UsersAccessRoleSummaryRow {
  id: string;
  label: string;
  members: number;
  scope: string;
  permissionCount: number;
}

export interface UsersAccessPermissionMatrixRow {
  id: string;
  label: string;
  description: string;
  rolesAllowed: ReadonlyArray<string>;
}

export interface UsersAccessActionRow {
  id: 'invite_user' | 'configure_sso' | 'export_users';
  label: string;
  /**
   * Hard-gated actions render disabled with a reason chip; safe actions are
   * enabled (no live mutation, just deterministic surface affordances).
   */
  status: 'hard_gated' | 'safe';
  reason?: string;
  href?: string;
}

export interface UsersAccessPageView {
  eyebrow: string;
  title: string;
  subtitle: string;
  context: {
    tenant: string;
    mode: string;
    agent: string;
    data: string;
    liveStatus: string;
    liveStatusKind: ContextLiveStatus;
  };
  editorial: {
    title: string;
    body: string;
    contextUsed: ReadonlyArray<string>;
    evidenceStrength: EvidenceStrength;
    blocker?: string;
    primaryAction: { label: string; href: string };
  };
  roles: ReadonlyArray<RoleAccessRow>;
  pendingInvitesCount: number;
  ssoConfigured: boolean;
  primaryAgentLabel: string;
  primaryActionLabel: string;
  primaryActionHref: string;
  deterministicSeed: true;
  agentChoices?: ReadonlyArray<AgentChoice>;
  agentPostures?: ReadonlyArray<AgentFoundationPosture>;
  // ADMIN11 depth fields
  tabs: ReadonlyArray<UsersAccessTabMeta>;
  defaultTab: UsersAccessTabKey;
  userList: ReadonlyArray<UsersAccessUserRow>;
  userDetails: ReadonlyArray<UsersAccessUserDetail>;
  inviteList: ReadonlyArray<UsersAccessInviteRow>;
  roleSummary: ReadonlyArray<UsersAccessRoleSummaryRow>;
  permissionMatrix: ReadonlyArray<UsersAccessPermissionMatrixRow>;
  actionStrip: ReadonlyArray<UsersAccessActionRow>;
}

// ---------------------------------------------------------------------------
// Deterministic concept-level constants (NOT data — these are surface affordances).
// ADMIN-DATA3 keeps these in-module since they describe permission semantics
// and tab affordances rather than tenant-scoped records. The data that DOES
// flow through the adapter (users, invites, role summary) lives in the
// fixtures/live adapter.
// ---------------------------------------------------------------------------

const ROLES: ReadonlyArray<RoleAccessRow> = [
  {
    id: 'platform_admin',
    label: 'Platform admin',
    count: 1,
    scope: 'Full platform scope · read-only on live mutation',
    readOnlyToday: true,
  },
  {
    id: 'tenant_admin',
    label: 'Tenant admin',
    count: 2,
    scope: 'Single-tenant scope · no cross-tenant reach',
    readOnlyToday: true,
  },
  {
    id: 'maestro',
    label: 'Maestro',
    count: 3,
    scope: 'Engagement owner · composes deliverables, drives Programs',
    readOnlyToday: true,
  },
  {
    id: 'sponsor',
    label: 'Sponsor',
    count: 2,
    scope: 'Tower brief, scorecards, pressure cards · no edit',
    readOnlyToday: true,
  },
  {
    id: 'investor',
    label: 'Investor',
    count: 1,
    scope: 'Portfolio brief read-only · no raw datasets',
    readOnlyToday: true,
  },
  {
    id: 'observer',
    label: 'Observer',
    count: 0,
    scope: 'Reserved · no seats today',
    readOnlyToday: true,
  },
];

const TABS: ReadonlyArray<UsersAccessTabMeta> = [
  {
    key: 'all',
    label: 'All Users',
    description: 'Active users across all roles · deterministic seed',
  },
  {
    key: 'roles',
    label: 'Roles',
    description: 'Role inventory and member counts',
  },
  {
    key: 'permissions',
    label: 'Permissions',
    description: 'Permission map across canonical roles',
  },
  {
    key: 'invites',
    label: 'Invites',
    description: 'Pending invitations · live writes deferred to Wave 27',
  },
];

const DEFAULT_TAB: UsersAccessTabKey = 'all';

const VALID_TABS: ReadonlyArray<UsersAccessTabKey> = [
  'all',
  'roles',
  'permissions',
  'invites',
];

export function resolveUsersAccessTab(input: string | undefined): UsersAccessTabKey {
  if (!input) return DEFAULT_TAB;
  const found = VALID_TABS.find((t) => t === input);
  return found ?? DEFAULT_TAB;
}

const ROLE_LABELS: Record<string, string> = {
  platform_admin: 'Platform admin',
  tenant_admin: 'Tenant admin',
  maestro: 'Maestro',
  sponsor: 'Sponsor',
  investor: 'Investor',
  observer: 'Observer',
  client_viewer: 'Client viewer',
};

const TENANT_LABELS: Record<string, string> = {
  'abarva-platform': 'AbarVa Platform',
  'apex-retail': 'Apex Retail',
  meridian: 'Meridian',
};

function tenantLabel(slug: string): string {
  return (
    TENANT_LABELS[slug] ??
    slug
      .split('-')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ')
  );
}

function pickPrimaryRoleId(adminRow: AdminUserRow): string {
  const first = adminRow.tenantRoles[0];
  return first?.role ?? adminRow.primaryRole;
}

function pickTenantSlug(adminRow: AdminUserRow): string {
  return adminRow.tenantRoles[0]?.tenantSlug ?? '';
}

function adminUserToRow(row: AdminUserRow): UsersAccessUserRow {
  const roleId = pickPrimaryRoleId(row);
  return {
    id: row.id,
    name: row.displayName,
    email: row.email,
    roleId,
    roleLabel: ROLE_LABELS[roleId] ?? roleId,
    tenant: tenantLabel(pickTenantSlug(row)),
    lastSignIn: row.lastSignIn ?? '',
    status: row.status,
  };
}

function adminUserDetailToView(detail: AdminUserDetail): UsersAccessUserDetail {
  const base = adminUserToRow(detail);
  return {
    ...base,
    permissions: detail.permissions,
    // Adapter contract doesn't surface invite status — fixture users are all accepted.
    inviteStatus: detail.status === 'invited' ? 'pending' : 'accepted',
    recentActivity: detail.recentActivity.map((entry) => ({
      at: entry.at,
      label: entry.action,
    })),
  };
}

function adminInviteToRow(row: AdminInviteRow): UsersAccessInviteRow {
  return {
    id: row.id,
    email: row.email,
    invitedRoleId: row.invitedRoleId,
    invitedRoleLabel: row.invitedRoleLabel,
    invitedBy: row.invitedBy,
    sentAt: row.sentAt,
    status: row.status,
  };
}

function adminRoleSummaryToRow(row: AdminRoleSummary): UsersAccessRoleSummaryRow {
  return {
    id: row.roleId,
    label: row.label,
    members: row.memberCount,
    scope: row.scope,
    permissionCount: row.permissionCount,
  };
}

const PERMISSION_MATRIX: ReadonlyArray<UsersAccessPermissionMatrixRow> = [
  {
    id: 'platform.read',
    label: 'Platform read',
    description: 'Read all tenants, audit, deployment posture',
    rolesAllowed: ['platform_admin'],
  },
  {
    id: 'platform.write',
    label: 'Platform write',
    description: 'Mutate platform-level settings (deferred to Wave 27)',
    rolesAllowed: ['platform_admin'],
  },
  {
    id: 'tenant.read',
    label: 'Tenant read',
    description: 'Read tenant data, programs, datasets',
    rolesAllowed: ['platform_admin', 'tenant_admin'],
  },
  {
    id: 'tenant.write',
    label: 'Tenant write',
    description: 'Mutate tenant settings, approve datasets',
    rolesAllowed: ['platform_admin', 'tenant_admin'],
  },
  {
    id: 'programs.read',
    label: 'Programs read',
    description: 'Read program canvas, deliverables, phase gates',
    rolesAllowed: ['tenant_admin', 'maestro'],
  },
  {
    id: 'programs.write',
    label: 'Programs write',
    description: 'Compose deliverables, advance phase gates',
    rolesAllowed: ['maestro'],
  },
  {
    id: 'tower.read',
    label: 'Tower read',
    description: 'Read scorecards, pressure cards, executive brief',
    rolesAllowed: ['tenant_admin', 'maestro', 'sponsor'],
  },
  {
    id: 'portfolio.read',
    label: 'Portfolio read',
    description: 'Read aggregate portfolio brief across tenants',
    rolesAllowed: ['investor'],
  },
];

const ACTION_STRIP: ReadonlyArray<UsersAccessActionRow> = [
  {
    id: 'invite_user',
    label: 'Invite user',
    status: 'hard_gated',
    // Reason rendered as inline explanation, not as a tooltip on a disabled
    // button — see UsersAccessActionStrip per Setup Fix Package PR 5 §2.3.
    reason: 'Live invite pipeline lights up after SSO is configured and the audit event store ships in Wave 27.',
  },
  {
    id: 'configure_sso',
    label: 'Configure SSO',
    status: 'safe',
    href: '/admin/users-access/sso-configuration',
  },
  {
    id: 'export_users',
    label: 'Export users',
    status: 'safe',
    href: '/admin/users-access?tab=all&export=csv',
  },
];

export function findUsersAccessUser(
  view: UsersAccessPageView,
  userId: string | undefined,
): UsersAccessUserDetail | null {
  if (!userId) return null;
  return view.userDetails.find((u) => u.id === userId) ?? null;
}

export async function buildUsersAccessPageView(
  tenantSlug: string = 'apex-retail',
): Promise<UsersAccessPageView> {
  const ctx = await buildAgentContextAsync(tenantSlug, 'admin', 'users-access');
  const editorial = generateStewardEditorial(ctx);
  const choices = buildAgentChoices(ctx, 3);
  const postures = computeAllPostures(ctx);

  // ADMIN-DATA3 — consume the admin-users-adapter rather than hardcoded seeds.
  const [adminUsers, adminInvites, adminRoleMatrix] = await Promise.all([
    getAdminUsers(tenantSlug),
    getAdminInvites(tenantSlug),
    getAdminRoleMatrix(tenantSlug),
  ]);

  // Pull full per-user details (permissions + recent activity) by id.
  const adminUserDetails = (
    await Promise.all(
      adminUsers.map((row) => getAdminUserDetail(tenantSlug, row.id)),
    )
  ).filter((d): d is AdminUserDetail => d !== null);

  const userList: ReadonlyArray<UsersAccessUserRow> = adminUsers.map(adminUserToRow);
  const userDetails: ReadonlyArray<UsersAccessUserDetail> =
    adminUserDetails.map(adminUserDetailToView);
  const inviteList: ReadonlyArray<UsersAccessInviteRow> =
    adminInvites.map(adminInviteToRow);
  const roleSummary: ReadonlyArray<UsersAccessRoleSummaryRow> =
    adminRoleMatrix.map(adminRoleSummaryToRow);

  const pendingInvitesCount = inviteList.filter((i) => i.status === 'pending').length;

  return {
    eyebrow: 'Roles, scope, and access posture',
    title: 'Users & Access',
    subtitle:
      'Role inventory and access posture. No live invite API, no permission editor, no SSO yet — read-only for now.',
    context: {
      tenant: ctx.tenant.name,
      mode: 'Setup/Admin',
      agent: 'Steward',
      data: 'Manifest + seeds',
      liveStatus: 'Deferred',
      liveStatusKind: 'deferred',
    },
    editorial: {
      title: editorial.title,
      body: editorial.body,
      contextUsed: editorial.contextUsed,
      evidenceStrength: editorial.evidenceStrength,
      blocker: editorial.blocker ?? undefined,
      primaryAction: editorial.primaryAction,
    },
    roles: ROLES,
    pendingInvitesCount,
    ssoConfigured: false,
    primaryAgentLabel: 'Steward',
    primaryActionLabel: 'Configure SSO',
    primaryActionHref: '/admin/users-access/sso-configuration',
    deterministicSeed: true,
    agentChoices: choices,
    agentPostures: postures,
    tabs: TABS,
    defaultTab: DEFAULT_TAB,
    userList,
    userDetails,
    inviteList,
    roleSummary,
    permissionMatrix: PERMISSION_MATRIX,
    actionStrip: ACTION_STRIP,
  };
}
