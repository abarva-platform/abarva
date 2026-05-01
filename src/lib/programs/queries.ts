// Programs read layer · Packet 13 §13.5.
// Every query scoped by client_id (tenancy) and applies archived/deleted
// exclusion. DB stays `engagements`.

import { getServerSupabase } from '@/lib/supabase-server';
import type {
  FounderApprovalRequestRow,
  MaestroFlag,
  ModuleStatus,
  OriginSource,
  OversightLevel,
  PhaseSnapshot,
  ProgramCore,
  ProgramLifecycleState,
  ProgramMilestoneRow,
  ProgramModuleRow,
  ProgramRiskRow,
  ProgramWorkItemRow,
  TenancyCtx,
} from './types.db';
import type { ArchetypeKey } from './types.ui';

function assertTenancy(ctx: TenancyCtx): void {
  if (!ctx?.clientId || !ctx?.userId) {
    throw new Error('[programs/queries] TenancyCtx missing clientId or userId');
  }
}

interface EngagementRow {
  id: string;
  client_id: string;
  name: string;
  program_archetype: ArchetypeKey | null;
  origin_source: OriginSource | null;
  origin_source_ref: string | null;
  status: string | null;
  lifecycle_state: ProgramLifecycleState | null;
  current_phase: number | null;
  current_module_key: string | null;
  maestro_oversight_level: OversightLevel | null;
  founder_approval_required: boolean | null;
  phase_locked_at: string | null;
  phase_locked_by_user_id: string | null;
  data_residency_region: string | null;
  retention_policy_years: number | null;
  archived_at: string | null;
  deleted_at: string | null;
  created_at: string;
}

function rowToProgram(r: EngagementRow): ProgramCore {
  return {
    id: r.id,
    clientId: r.client_id,
    name: r.name,
    archetype: r.program_archetype,
    originSource: r.origin_source,
    originSourceRef: r.origin_source_ref,
    status: r.status,
    lifecycleState: r.lifecycle_state,
    currentPhase: r.current_phase,
    currentModuleKey: r.current_module_key,
    maestroOversightLevel: r.maestro_oversight_level,
    founderApprovalRequired: r.founder_approval_required ?? false,
    phaseLockedAt: r.phase_locked_at,
    phaseLockedByUserId: r.phase_locked_by_user_id,
    dataResidencyRegion: r.data_residency_region,
    retentionPolicyYears: r.retention_policy_years,
    archivedAt: r.archived_at,
    deletedAt: r.deleted_at,
    createdAt: r.created_at,
  };
}

/**
 * Program portfolio for a client — excludes archived + soft-deleted.
 */
export async function getProgramPortfolio(ctx: TenancyCtx, opts: { limit?: number } = {}): Promise<ProgramCore[]> {
  assertTenancy(ctx);
  const sb = getServerSupabase();
  const limit = opts.limit ?? 100;
  const { data, error } = await sb
    .from('engagements')
    .select('id, client_id, name, program_archetype, origin_source, origin_source_ref, status, lifecycle_state, current_phase, current_module_key, maestro_oversight_level, founder_approval_required, phase_locked_at, phase_locked_by_user_id, data_residency_region, retention_policy_years, archived_at, deleted_at, created_at')
    .eq('client_id', ctx.clientId)
    .is('archived_at', null)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return ((data as EngagementRow[] | null) ?? []).map(rowToProgram);
}

export async function getProgramById(ctx: TenancyCtx, programId: string): Promise<ProgramCore | null> {
  assertTenancy(ctx);
  const sb = getServerSupabase();
  const { data, error } = await sb
    .from('engagements')
    .select('id, client_id, name, program_archetype, origin_source, origin_source_ref, status, lifecycle_state, current_phase, current_module_key, maestro_oversight_level, founder_approval_required, phase_locked_at, phase_locked_by_user_id, data_residency_region, retention_policy_years, archived_at, deleted_at, created_at')
    .eq('id', programId)
    .eq('client_id', ctx.clientId)
    .maybeSingle();
  if (error) throw error;
  return data ? rowToProgram(data as EngagementRow) : null;
}

export async function getModuleState(ctx: TenancyCtx, programId: string): Promise<ProgramModuleRow[]> {
  assertTenancy(ctx);
  const sb = getServerSupabase();
  const { data, error } = await sb
    .from('program_modules')
    .select('*')
    .eq('engagement_id', programId)
    .order('phase_number', { ascending: true })
    .order('module_order', { ascending: true, nullsFirst: false });
  if (error) throw error;
  return ((data as Array<Record<string, unknown>> | null) ?? []).map((r) => ({
    id: r.id as string,
    engagementId: r.engagement_id as string,
    moduleKey: r.module_key as string,
    moduleName: r.module_name as string,
    phaseNumber: r.phase_number as number,
    moduleOrder: (r.module_order as number | null) ?? null,
    status: r.status as ModuleStatus,
    state: (r.state_jsonb as Record<string, unknown>) ?? {},
    assignedUserId: (r.assigned_user_id as string | null) ?? null,
    startedAt: (r.started_at as string | null) ?? null,
    completedAt: (r.completed_at as string | null) ?? null,
  }));
}

export async function getWorkItems(ctx: TenancyCtx, programId: string): Promise<ProgramWorkItemRow[]> {
  assertTenancy(ctx);
  const sb = getServerSupabase();
  const { data, error } = await sb
    .from('program_work_items')
    .select('*')
    .eq('engagement_id', programId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return ((data as Array<Record<string, unknown>> | null) ?? []).map((r) => ({
    id: r.id as string,
    engagementId: r.engagement_id as string,
    parentId: (r.parent_id as string | null) ?? null,
    title: r.title as string,
    description: (r.description as string | null) ?? null,
    itemType: r.item_type as ProgramWorkItemRow['itemType'],
    status: r.status as ProgramWorkItemRow['status'],
    priority: (r.priority as ProgramWorkItemRow['priority']) ?? null,
    assignedUserId: (r.assigned_user_id as string | null) ?? null,
    moduleKey: (r.module_key as string | null) ?? null,
    phaseNumber: (r.phase_number as number | null) ?? null,
    dueDate: (r.due_date as string | null) ?? null,
    completedAt: (r.completed_at as string | null) ?? null,
    metadata: (r.metadata_jsonb as Record<string, unknown>) ?? {},
  }));
}

export async function getMilestones(ctx: TenancyCtx, programId: string): Promise<ProgramMilestoneRow[]> {
  assertTenancy(ctx);
  const sb = getServerSupabase();
  const { data, error } = await sb
    .from('program_milestones')
    .select('*')
    .eq('engagement_id', programId)
    .order('target_date', { ascending: true, nullsFirst: false });
  if (error) throw error;
  return ((data as Array<Record<string, unknown>> | null) ?? []).map((r) => ({
    id: r.id as string,
    engagementId: r.engagement_id as string,
    name: r.name as string,
    description: (r.description as string | null) ?? null,
    targetDate: (r.target_date as string | null) ?? null,
    actualDate: (r.actual_date as string | null) ?? null,
    status: r.status as ProgramMilestoneRow['status'],
    phaseNumber: (r.phase_number as number | null) ?? null,
    moduleKey: (r.module_key as string | null) ?? null,
    ownerUserId: (r.owner_user_id as string | null) ?? null,
  }));
}

export async function getRisks(ctx: TenancyCtx, programId: string): Promise<ProgramRiskRow[]> {
  assertTenancy(ctx);
  const sb = getServerSupabase();
  const { data, error } = await sb
    .from('program_risks')
    .select('*')
    .eq('engagement_id', programId)
    .order('identified_at', { ascending: false });
  if (error) throw error;
  return ((data as Array<Record<string, unknown>> | null) ?? []).map((r) => ({
    id: r.id as string,
    engagementId: r.engagement_id as string,
    title: r.title as string,
    description: (r.description as string | null) ?? null,
    likelihood: r.likelihood as ProgramRiskRow['likelihood'],
    impact: r.impact as ProgramRiskRow['impact'],
    status: r.status as ProgramRiskRow['status'],
    mitigationPlan: (r.mitigation_plan as string | null) ?? null,
    ownerUserId: (r.owner_user_id as string | null) ?? null,
    phaseNumber: (r.phase_number as number | null) ?? null,
    moduleKey: (r.module_key as string | null) ?? null,
    identifiedAt: r.identified_at as string,
    closedAt: (r.closed_at as string | null) ?? null,
  }));
}

export async function getOpenMaestroFlags(ctx: TenancyCtx, programId: string): Promise<MaestroFlag[]> {
  assertTenancy(ctx);
  const sb = getServerSupabase();
  const { data, error } = await sb
    .from('maestro_oversight_flags')
    .select('*')
    .eq('engagement_id', programId)
    .is('resolved_at', null)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return ((data as Array<Record<string, unknown>> | null) ?? []).map((r) => ({
    id: r.id as string,
    engagementId: r.engagement_id as string,
    flagType: r.flag_type as MaestroFlag['flagType'],
    severity: r.severity as MaestroFlag['severity'],
    raisedBy: r.raised_by as MaestroFlag['raisedBy'],
    raisedByUserId: (r.raised_by_user_id as string | null) ?? null,
    headline: r.headline as string,
    context: (r.context_jsonb as Record<string, unknown>) ?? {},
    resolvedAt: (r.resolved_at as string | null) ?? null,
    resolvedByUserId: (r.resolved_by_user_id as string | null) ?? null,
    resolutionNotes: (r.resolution_notes as string | null) ?? null,
    createdAt: r.created_at as string,
  }));
}

export async function getPendingApprovals(ctx: TenancyCtx, programId: string): Promise<FounderApprovalRequestRow[]> {
  assertTenancy(ctx);
  const sb = getServerSupabase();
  const { data, error } = await sb
    .from('founder_approval_requests')
    .select('*')
    .eq('engagement_id', programId)
    .eq('status', 'pending')
    .order('deadline_at', { ascending: true, nullsFirst: false });
  if (error) throw error;
  return ((data as Array<Record<string, unknown>> | null) ?? []).map((r) => ({
    id: r.id as string,
    engagementId: r.engagement_id as string,
    requestType: r.request_type as FounderApprovalRequestRow['requestType'],
    status: r.status as FounderApprovalRequestRow['status'],
    requestedByUserId: r.requested_by_user_id as string,
    approverUserId: (r.approver_user_id as string | null) ?? null,
    approverRole: (r.approver_role as string | null) ?? null,
    headline: r.headline as string,
    context: (r.context_jsonb as Record<string, unknown>) ?? {},
    decisionNotes: (r.decision_notes as string | null) ?? null,
    deadlineAt: (r.deadline_at as string | null) ?? null,
    decidedAt: (r.decided_at as string | null) ?? null,
    createdAt: r.created_at as string,
  }));
}

export async function getPhaseSnapshots(ctx: TenancyCtx, programId: string, phaseNumber?: number): Promise<PhaseSnapshot[]> {
  assertTenancy(ctx);
  const sb = getServerSupabase();
  let q = sb.from('phase_snapshots').select('*').eq('engagement_id', programId);
  if (phaseNumber !== undefined) q = q.eq('phase_number', phaseNumber);
  const { data, error } = await q.order('created_at', { ascending: false });
  if (error) throw error;
  return ((data as Array<Record<string, unknown>> | null) ?? []).map((r) => ({
    id: r.id as string,
    engagementId: r.engagement_id as string,
    phaseNumber: r.phase_number as number,
    phaseName: (r.phase_name as string | null) ?? null,
    snapshot: (r.snapshot_jsonb as Record<string, unknown>) ?? {},
    lockedByUserId: (r.locked_by_user_id as string | null) ?? null,
    lockedAt: (r.locked_at as string | null) ?? null,
    approvalStatus: r.approval_status as PhaseSnapshot['approvalStatus'],
    createdAt: r.created_at as string,
  }));
}
