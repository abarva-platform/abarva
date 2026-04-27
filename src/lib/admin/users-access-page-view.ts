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

export function buildUsersAccessPageView(): UsersAccessPageView {
  const ctx = buildAgentContext('apex-retail', 'admin', 'users-access');
  const editorial = generateStewardEditorial(ctx);
  const choices = buildAgentChoices(ctx, 3);
  const postures = computeAllPostures(ctx);

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
    pendingInvitesCount: 0,
    ssoConfigured: false,
    primaryAgentLabel: 'Steward',
    primaryActionLabel: 'Configure SSO',
    primaryActionHref: '/admin/users-access#sso',
    deterministicSeed: true,
    agentChoices: choices,
    agentPostures: postures,
  };
}
