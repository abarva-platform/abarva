import 'server-only';

import { getServerSupabase } from '@/lib/supabase-server';
import type { TenancyCtx } from '@/lib/programs/types.db';

export type ClientAccessLevel =
  | 'client_admin'
  | 'program_member'
  | 'program_viewer'
  | 'no_program_access';

export type DataAccessClass =
  | 'public'
  | 'internal'
  | 'confidential'
  | 'restricted_financial'
  | 'restricted_phi_pii'
  | 'admin_only';

export interface UserProgramAccessPolicy {
  userId: string;
  clientId: string;
  accessLevel: ClientAccessLevel;
  programScope: 'all_client_programs' | 'assigned_programs_only';
  programIdsAllowed: string[] | null;
  canAdminUsers: boolean;
  canCreatePrograms: boolean;
  canApproveGates: boolean;
  canUploadArtifacts: boolean;
  canGenerateDeliverables: boolean;
  canPublishDeliverables: boolean;
  canViewFinancialData: boolean;
  allowedDataClasses: DataAccessClass[];
  deniedDataClasses: DataAccessClass[];
  outputPolicy: {
    exactFinancialValues: boolean;
    financialSummaries: boolean;
    restrictedSourceIds: boolean;
    saveRestrictedContentToDeliverables: boolean;
  };
}

interface ClientMembershipRow {
  role?: string | null;
  access_level?: string | null;
  financial_visibility?: boolean | null;
  can_admin_users?: boolean | null;
  can_create_programs?: boolean | null;
  can_approve_gates?: boolean | null;
}

interface ParticipantRow {
  engagement_id: string;
  approval_authority?: string | null;
  program_access_level?: string | null;
  can_view_financial?: boolean | null;
  can_upload?: boolean | null;
  can_generate_deliverables?: boolean | null;
  can_publish_deliverables?: boolean | null;
  can_approve_phase_gates?: boolean | null;
}

function isUuidLike(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

function normalizeAccessLevel(value: string | null | undefined): ClientAccessLevel | null {
  if (value === 'abarva_super_admin') {
    return 'client_admin';
  }
  if (value === 'client_admin' || value === 'program_member' || value === 'program_viewer') {
    return value;
  }
  if (value === 'source_member' || value === 'source_viewer') {
    return 'no_program_access';
  }
  return null;
}

function isClientAdminRole(role: string | null | undefined): boolean {
  return role === 'maestro' || role === 'admin' || role === 'client_admin' || role === 'abarva_super_admin';
}

function isClientAdminPolicy(level: ClientAccessLevel): boolean {
  return level === 'client_admin';
}

function defaultDataClasses(canViewFinancialData: boolean): Pick<UserProgramAccessPolicy, 'allowedDataClasses' | 'deniedDataClasses'> {
  const allowed: DataAccessClass[] = ['public', 'internal', 'confidential'];
  const denied: DataAccessClass[] = ['restricted_phi_pii', 'admin_only'];
  if (canViewFinancialData) {
    allowed.push('restricted_financial');
  } else {
    denied.push('restricted_financial');
  }
  return { allowedDataClasses: allowed, deniedDataClasses: denied };
}

function buildPolicy(args: {
  ctx: TenancyCtx;
  accessLevel: ClientAccessLevel;
  programIdsAllowed: string[] | null;
  canViewFinancialData: boolean;
  canAdminUsers?: boolean;
  canCreatePrograms?: boolean;
  canApproveGates?: boolean;
  canUploadArtifacts?: boolean;
  canGenerateDeliverables?: boolean;
  canPublishDeliverables?: boolean;
}): UserProgramAccessPolicy {
  const admin = isClientAdminPolicy(args.accessLevel);
  const none = args.accessLevel === 'no_program_access';
  const classes = defaultDataClasses(args.canViewFinancialData);
  return {
    userId: args.ctx.userId,
    clientId: args.ctx.clientId,
    accessLevel: args.accessLevel,
    programScope: none ? 'assigned_programs_only' : args.programIdsAllowed === null ? 'all_client_programs' : 'assigned_programs_only',
    programIdsAllowed: none ? [] : args.programIdsAllowed,
    canAdminUsers: none ? false : args.canAdminUsers ?? admin,
    canCreatePrograms: none ? false : args.canCreatePrograms ?? admin,
    canApproveGates: none ? false : args.canApproveGates ?? admin,
    canUploadArtifacts: none ? false : args.canUploadArtifacts ?? true,
    canGenerateDeliverables: none ? false : args.canGenerateDeliverables ?? true,
    canPublishDeliverables: none ? false : args.canPublishDeliverables ?? admin,
    canViewFinancialData: args.canViewFinancialData,
    ...classes,
    outputPolicy: {
      exactFinancialValues: args.canViewFinancialData,
      financialSummaries: true,
      restrictedSourceIds: args.canViewFinancialData,
      saveRestrictedContentToDeliverables: args.canViewFinancialData,
    },
  };
}

async function loadClientMembership(ctx: TenancyCtx): Promise<ClientMembershipRow | null> {
  if (!isUuidLike(ctx.userId)) return null;
  const sb = getServerSupabase();
  const { data } = await sb
    .from('person_client_memberships')
    .select('role, access_level, financial_visibility, can_admin_users, can_create_programs, can_approve_gates')
    .eq('person_id', ctx.userId)
    .eq('client_id', ctx.clientId)
    .maybeSingle();
  return (data as ClientMembershipRow | null) ?? null;
}

async function loadProgramParticipants(ctx: TenancyCtx): Promise<ParticipantRow[]> {
  const sb = getServerSupabase();
  const { data } = await sb
    .from('engagement_participants')
    .select('engagement_id, approval_authority, program_access_level, can_view_financial, can_upload, can_generate_deliverables, can_publish_deliverables, can_approve_phase_gates, engagement:engagements!inner(client_id, archived_at, deleted_at)')
    .eq('user_id', ctx.userId)
    .eq('engagement.client_id', ctx.clientId)
    .is('engagement.archived_at', null)
    .is('engagement.deleted_at', null);
  return ((data as ParticipantRow[] | null) ?? []).filter((row) => Boolean(row.engagement_id));
}

function inferAccessLevel(ctx: TenancyCtx, membership: ClientMembershipRow | null, participants: ParticipantRow[]): ClientAccessLevel {
  const explicit = normalizeAccessLevel(membership?.access_level);
  if (explicit) return explicit;
  if (isClientAdminRole(ctx.role) || isClientAdminRole(membership?.role)) return 'client_admin';
  if (participants.length > 0) {
    return participants.some((p) => p.program_access_level === 'program_member' || p.approval_authority === 'sponsor' || p.approval_authority === 'approver')
      ? 'program_member'
      : 'program_viewer';
  }
  return 'no_program_access';
}

export async function loadUserProgramAccessPolicy(
  ctx: TenancyCtx,
  opts: { programId?: string | null } = {},
): Promise<UserProgramAccessPolicy> {
  const [membership, participants] = await Promise.all([
    loadClientMembership(ctx),
    loadProgramParticipants(ctx),
  ]);

  const accessLevel = inferAccessLevel(ctx, membership, participants);
  const admin = isClientAdminPolicy(accessLevel);
  const none = accessLevel === 'no_program_access';
  const scopedParticipants = opts.programId
    ? participants.filter((p) => p.engagement_id === opts.programId)
    : participants;
  const participantFinancial = scopedParticipants.some((p) => p.can_view_financial === true);
  const canViewFinancialData = Boolean(membership?.financial_visibility || participantFinancial);
  const explicitProgramScopedMembership =
    membership?.access_level === 'program_member' || membership?.access_level === 'program_viewer';
  const programIdsAllowed = none
    ? []
    : admin
    ? null
    : participants.length > 0
      ? Array.from(new Set(participants.map((p) => p.engagement_id)))
      : explicitProgramScopedMembership
        ? []
        : null;

  return buildPolicy({
    ctx,
    accessLevel,
    programIdsAllowed,
    canViewFinancialData,
    canAdminUsers: !none && (Boolean(membership?.can_admin_users) || admin),
    canCreatePrograms: !none && (Boolean(membership?.can_create_programs) || admin),
    canApproveGates:
      !none && (
        Boolean(membership?.can_approve_gates) ||
        scopedParticipants.some((p) => p.can_approve_phase_gates === true || p.approval_authority === 'sponsor' || p.approval_authority === 'approver') ||
        admin
      ),
    canUploadArtifacts: !none && (scopedParticipants.length === 0 || scopedParticipants.some((p) => p.can_upload !== false)),
    canGenerateDeliverables: !none && (scopedParticipants.length === 0 || scopedParticipants.some((p) => p.can_generate_deliverables !== false)),
    canPublishDeliverables: !none && (scopedParticipants.some((p) => p.can_publish_deliverables === true) || admin),
  });
}

export async function allowedProgramIdsForUser(ctx: TenancyCtx): Promise<string[] | null> {
  const policy = await loadUserProgramAccessPolicy(ctx);
  return policy.programIdsAllowed;
}

export async function canReadProgram(ctx: TenancyCtx, programId: string): Promise<boolean> {
  const policy = await loadUserProgramAccessPolicy(ctx, { programId });
  return policy.programIdsAllowed === null || policy.programIdsAllowed.includes(programId);
}

export function formatUserProgramAccessPolicyForPrompt(policy: UserProgramAccessPolicy): string {
  return [
    'USER ACCESS POLICY:',
    `- Client role: ${policy.accessLevel} (client-pinned; no cross-client admin role exists)`,
    `- Data-plane scope: exactly one active client (${policy.clientId})`,
    `- Program visibility: ${policy.programScope}`,
    `- Allowed program ids: ${policy.programIdsAllowed === null ? 'all programs in active client only' : policy.programIdsAllowed.join(', ') || 'none'}`,
    `- Financial visibility: ${policy.canViewFinancialData ? 'allowed' : 'restricted'}`,
    `- Can create programs: ${policy.canCreatePrograms ? 'yes' : 'no'}`,
    `- Can approve gates: ${policy.canApproveGates ? 'yes' : 'no'}`,
    `- Can publish deliverables: ${policy.canPublishDeliverables ? 'yes' : 'no'}`,
    `- Denied data classes: ${policy.deniedDataClasses.join(', ')}`,
    policy.canViewFinancialData
      ? '- Output rule: exact financial values may be shown only when present in retrieved context.'
      : '- Output rule: restricted financial context may guide risk/readiness judgment, but exact budgets, spend, revenue, margins, ROI, NPV, payback, business-case dollars, or sensitive KPI values must not appear in chat or deliverables.',
  ].join('\n');
}
