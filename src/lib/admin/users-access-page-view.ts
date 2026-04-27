import type { ContextLiveStatus } from '@/components/admin/ContextBar';
import type { EvidenceStrength } from '@/components/admin/EvidenceStrengthPill';
import { buildAgentContext } from '@/lib/agent/context-bundle';
import {
  computeAllPostures,
  type AgentPosture as AgentFoundationPosture,
} from '@/lib/agent/posture';
import { generateStewardEditorial } from '@/lib/agent/editorial';
import { buildAgentChoices, type AgentChoice } from '@/lib/agent/choices';

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

// ---------------------------------------------------------------------------
// ADMIN11 — Deterministic seed data for depth surfaces
// ---------------------------------------------------------------------------

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

const SEED_USER_DETAILS: ReadonlyArray<UsersAccessUserDetail> = [
  {
    id: 'usr_001',
    name: 'Anand Sundaram',
    email: 'anand@abarva.io',
    roleId: 'platform_admin',
    roleLabel: 'Platform admin',
    tenant: 'AbarVa Platform',
    lastSignIn: '2026-04-26T09:18:00Z',
    status: 'active',
    permissions: ['platform.read', 'platform.write', 'tenant.read', 'tenant.write'],
    inviteStatus: 'accepted',
    recentActivity: [
      { at: '2026-04-26T09:18:00Z', label: 'Signed in via Clerk OTP' },
      { at: '2026-04-25T17:42:00Z', label: 'Reviewed admin readiness audit' },
    ],
  },
  {
    id: 'usr_002',
    name: 'Maya Iyer',
    email: 'maya@apex-retail.demo',
    roleId: 'tenant_admin',
    roleLabel: 'Tenant admin',
    tenant: 'Apex Retail',
    lastSignIn: '2026-04-25T14:02:00Z',
    status: 'active',
    permissions: ['tenant.read', 'tenant.write', 'programs.read'],
    inviteStatus: 'accepted',
    recentActivity: [
      { at: '2026-04-25T14:02:00Z', label: 'Approved Phase 3 dataset' },
      { at: '2026-04-24T11:30:00Z', label: 'Updated tenant SSO posture' },
    ],
  },
  {
    id: 'usr_003',
    name: 'Daniel Cho',
    email: 'daniel@apex-retail.demo',
    roleId: 'maestro',
    roleLabel: 'Maestro',
    tenant: 'Apex Retail',
    lastSignIn: '2026-04-26T08:05:00Z',
    status: 'active',
    permissions: ['programs.read', 'programs.write', 'deliverables.read'],
    inviteStatus: 'accepted',
    recentActivity: [
      { at: '2026-04-26T08:05:00Z', label: 'Composed deliverable for Contact Center AI' },
    ],
  },
  {
    id: 'usr_004',
    name: 'Priya Rao',
    email: 'priya@meridian.demo',
    roleId: 'maestro',
    roleLabel: 'Maestro',
    tenant: 'Meridian',
    lastSignIn: '2026-04-23T16:20:00Z',
    status: 'active',
    permissions: ['programs.read', 'programs.write', 'deliverables.read'],
    inviteStatus: 'accepted',
    recentActivity: [
      { at: '2026-04-23T16:20:00Z', label: 'Authored Intelligence brief' },
    ],
  },
  {
    id: 'usr_005',
    name: 'Eli Park',
    email: 'eli@apex-retail.demo',
    roleId: 'sponsor',
    roleLabel: 'Sponsor',
    tenant: 'Apex Retail',
    lastSignIn: '2026-04-22T10:14:00Z',
    status: 'active',
    permissions: ['tower.read', 'scorecard.read'],
    inviteStatus: 'accepted',
    recentActivity: [
      { at: '2026-04-22T10:14:00Z', label: 'Reviewed pressure cards' },
    ],
  },
  {
    id: 'usr_006',
    name: 'Naomi Stein',
    email: 'naomi@meridian.demo',
    roleId: 'sponsor',
    roleLabel: 'Sponsor',
    tenant: 'Meridian',
    lastSignIn: '2026-04-20T18:55:00Z',
    status: 'active',
    permissions: ['tower.read', 'scorecard.read'],
    inviteStatus: 'accepted',
    recentActivity: [
      { at: '2026-04-20T18:55:00Z', label: 'Read executive brief' },
    ],
  },
  {
    id: 'usr_007',
    name: 'Karim Bell',
    email: 'karim@investors.demo',
    roleId: 'investor',
    roleLabel: 'Investor',
    tenant: 'AbarVa Platform',
    lastSignIn: '2026-04-18T07:33:00Z',
    status: 'active',
    permissions: ['portfolio.read'],
    inviteStatus: 'accepted',
    recentActivity: [
      { at: '2026-04-18T07:33:00Z', label: 'Viewed portfolio brief' },
    ],
  },
];

const SEED_INVITES: ReadonlyArray<UsersAccessInviteRow> = [
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

const SEED_ROLE_SUMMARY: ReadonlyArray<UsersAccessRoleSummaryRow> = [
  {
    id: 'platform_admin',
    label: 'Platform admin',
    members: 1,
    scope: 'Full platform scope · read-only on live mutation',
    permissionCount: 4,
  },
  {
    id: 'tenant_admin',
    label: 'Tenant admin',
    members: 2,
    scope: 'Single-tenant scope · no cross-tenant reach',
    permissionCount: 3,
  },
  {
    id: 'maestro',
    label: 'Maestro',
    members: 3,
    scope: 'Engagement owner · composes deliverables, drives Programs',
    permissionCount: 3,
  },
  {
    id: 'sponsor',
    label: 'Sponsor',
    members: 2,
    scope: 'Tower brief, scorecards, pressure cards · no edit',
    permissionCount: 2,
  },
  {
    id: 'investor',
    label: 'Investor',
    members: 1,
    scope: 'Portfolio brief read-only · no raw datasets',
    permissionCount: 1,
  },
  {
    id: 'observer',
    label: 'Observer',
    members: 0,
    scope: 'Reserved · no seats today',
    permissionCount: 0,
  },
];

const SEED_PERMISSION_MATRIX: ReadonlyArray<UsersAccessPermissionMatrixRow> = [
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

const SEED_ACTION_STRIP: ReadonlyArray<UsersAccessActionRow> = [
  {
    id: 'invite_user',
    label: 'Invite user',
    status: 'hard_gated',
    reason: 'Available in pilot environment (Wave 27)',
  },
  {
    id: 'configure_sso',
    label: 'Configure SSO',
    status: 'hard_gated',
    reason: 'Available in pilot environment (Wave 27)',
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

export function buildUsersAccessPageView(): UsersAccessPageView {
  const ctx = buildAgentContext('apex-retail', 'admin', 'users-access');
  const editorial = generateStewardEditorial(ctx);
  const choices = buildAgentChoices(ctx, 3);
  const postures = computeAllPostures(ctx);

  const userList: ReadonlyArray<UsersAccessUserRow> = SEED_USER_DETAILS.map(
    (detail) => ({
      id: detail.id,
      name: detail.name,
      email: detail.email,
      roleId: detail.roleId,
      roleLabel: detail.roleLabel,
      tenant: detail.tenant,
      lastSignIn: detail.lastSignIn,
      status: detail.status,
    }),
  );

  const pendingInvitesCount = SEED_INVITES.filter((i) => i.status === 'pending').length;

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
    primaryActionHref: '/admin/users-access#sso',
    deterministicSeed: true,
    agentChoices: choices,
    agentPostures: postures,
    tabs: TABS,
    defaultTab: DEFAULT_TAB,
    userList,
    userDetails: SEED_USER_DETAILS,
    inviteList: SEED_INVITES,
    roleSummary: SEED_ROLE_SUMMARY,
    permissionMatrix: SEED_PERMISSION_MATRIX,
    actionStrip: SEED_ACTION_STRIP,
  };
}
