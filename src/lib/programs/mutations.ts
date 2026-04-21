// Programs write layer · Packet 13 §13.5.
// Three top-level mutations: originateProgram, advancePhase,
// publishDeliverable. Plus supporting writes (create milestone, create
// risk, module state transitions). All tenancy-asserted.

import { getServerSupabase } from '@/lib/supabase-server';
import type {
  ArchetypeKey,
  MilestoneStatus,
  ModuleStatus,
  OriginSource,
  OversightLevel,
  ProgramCore,
  RiskImpact,
  RiskLikelihood,
  TenancyCtx,
  WorkItemStatus,
  WorkItemType,
} from './types';
import { getProgramById } from './queries';

function assertTenancy(ctx: TenancyCtx): void {
  if (!ctx?.clientId || !ctx?.userId) {
    throw new Error('[programs/mutations] TenancyCtx missing clientId or userId');
  }
}

async function assertProgramTenancy(ctx: TenancyCtx, programId: string): Promise<void> {
  const program = await getProgramById(ctx, programId);
  if (!program) throw new Error(`[programs/mutations] program ${programId} not accessible`);
}

export interface OriginateProgramInput {
  name: string;
  useCase: string;
  archetype: ArchetypeKey | null;
  originSource: OriginSource;
  originSourceRef?: string | null;
  acceptedPatternKey?: string | null;
  sponsorUserId?: string;
  leadUserId?: string;
  industryHint?: string;
  maestroOversightLevel?: OversightLevel;
  founderApprovalRequired?: boolean;
  dataResidencyRegion?: string;
}

export async function originateProgram(ctx: TenancyCtx, input: OriginateProgramInput): Promise<ProgramCore> {
  assertTenancy(ctx);
  const sb = getServerSupabase();
  const { data, error } = await sb
    .from('engagements')
    .insert({
      client_id: ctx.clientId,
      name: input.name,
      status: 'active',
      current_phase: 0,
      program_archetype: input.archetype,
      origin_source: input.originSource,
      origin_source_ref: input.originSourceRef ?? null,
      maestro_oversight_level: input.maestroOversightLevel ?? 'partial',
      founder_approval_required: input.founderApprovalRequired ?? false,
      data_residency_region: input.dataResidencyRegion ?? null,
      retention_policy_years: 7,
      created_by: ctx.userId,
    })
    .select('*')
    .single();
  if (error) throw error;

  const programId = (data as { id: string }).id;

  // Record the pattern match event if a pattern was accepted
  if (input.acceptedPatternKey) {
    const { error: pmErr } = await sb.from('pattern_match_logs').insert({
      engagement_id: programId,
      pattern_key: input.acceptedPatternKey,
      match_confidence: null,
      match_context_jsonb: { use_case: input.useCase, accepted_at_origination: true },
      suggested_action: 'pattern',
      acted_upon: true,
      acted_upon_at: new Date().toISOString(),
      acted_upon_by_user_id: ctx.userId,
      matched_by_agent: 'classifier_v1',
    });
    if (pmErr) throw pmErr;
  }

  // Log initial state
  const { error: logErr } = await sb.from('module_state_log').insert({
    engagement_id: programId,
    module_key: 'origination',
    previous_state: null,
    new_state: 'completed',
    changed_by_user_id: ctx.userId,
    context_jsonb: { pattern_key: input.acceptedPatternKey, origin: input.originSource },
  });
  if (logErr) throw logErr;

  const program = await getProgramById(ctx, programId);
  if (!program) throw new Error('[originateProgram] created program not readable');
  return program;
}

export interface AdvancePhaseInput {
  programId: string;
  fromPhase: number;
  toPhase: number;
  snapshot: Record<string, unknown>;
  approvedByUserId?: string;
  bypassGate?: boolean;
}

export async function advancePhase(ctx: TenancyCtx, input: AdvancePhaseInput): Promise<{ programId: string; newPhase: number; snapshotId: string }> {
  assertTenancy(ctx);
  await assertProgramTenancy(ctx, input.programId);
  const sb = getServerSupabase();

  // Snapshot current phase
  const { data: snap, error: snapErr } = await sb
    .from('phase_snapshots')
    .insert({
      engagement_id: input.programId,
      phase_number: input.fromPhase,
      snapshot_jsonb: input.snapshot,
      locked_by_user_id: ctx.userId,
      locked_at: new Date().toISOString(),
      approval_status: input.approvedByUserId ? 'approved' : 'pending',
    })
    .select('id')
    .single();
  if (snapErr) throw snapErr;

  // Advance phase on engagements
  const { error: eErr } = await sb
    .from('engagements')
    .update({
      current_phase: input.toPhase,
      phase_locked_at: new Date().toISOString(),
      phase_locked_by_user_id: ctx.userId,
    })
    .eq('id', input.programId)
    .eq('client_id', ctx.clientId);
  if (eErr) throw eErr;

  // Log state transition
  const { error: logErr } = await sb.from('module_state_log').insert({
    engagement_id: input.programId,
    module_key: `phase_${input.fromPhase}`,
    previous_state: 'in_progress',
    new_state: 'completed',
    changed_by_user_id: ctx.userId,
    notes: `Advanced ${input.fromPhase} → ${input.toPhase}`,
    context_jsonb: { bypass_gate: !!input.bypassGate, approved_by: input.approvedByUserId ?? null },
  });
  if (logErr) throw logErr;

  return { programId: input.programId, newPhase: input.toPhase, snapshotId: (snap as { id: string }).id };
}

/**
 * Publish a deliverable (flip draft → in_review). Uses existing
 * deliverables_v2 infra; this is a thin programs-facing wrapper.
 */
export async function publishDeliverable(ctx: TenancyCtx, programId: string, deliverableId: string): Promise<void> {
  assertTenancy(ctx);
  await assertProgramTenancy(ctx, programId);
  const sb = getServerSupabase();
  const { error } = await sb
    .from('deliverables_v2')
    .update({ status: 'in_review', updated_at: new Date().toISOString() })
    .eq('id', deliverableId)
    .eq('engagement_id', programId)
    .eq('status', 'draft');
  if (error) throw error;
}

export async function signOffDeliverable(ctx: TenancyCtx, programId: string, deliverableId: string): Promise<void> {
  assertTenancy(ctx);
  await assertProgramTenancy(ctx, programId);
  const sb = getServerSupabase();
  const { error } = await sb
    .from('deliverables_v2')
    .update({
      status: 'signed_off',
      signed_off_by: ctx.userId,
      signed_off_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', deliverableId)
    .eq('engagement_id', programId)
    .eq('status', 'in_review');
  if (error) throw error;
}

export async function setModuleStatus(
  ctx: TenancyCtx,
  programId: string,
  moduleKey: string,
  status: ModuleStatus,
  patch: { assignedUserId?: string; notes?: string } = {},
): Promise<void> {
  assertTenancy(ctx);
  await assertProgramTenancy(ctx, programId);
  const sb = getServerSupabase();

  // Read current state for audit log
  const { data: current } = await sb
    .from('program_modules')
    .select('status')
    .eq('engagement_id', programId)
    .eq('module_key', moduleKey)
    .maybeSingle();

  const now = new Date().toISOString();
  const update: Record<string, unknown> = { status };
  if (status === 'in_progress' && !current) update.started_at = now;
  if (status === 'completed') update.completed_at = now;
  if (patch.assignedUserId) update.assigned_user_id = patch.assignedUserId;

  const { error } = await sb
    .from('program_modules')
    .update(update)
    .eq('engagement_id', programId)
    .eq('module_key', moduleKey);
  if (error) throw error;

  const { error: logErr } = await sb.from('module_state_log').insert({
    engagement_id: programId,
    module_key: moduleKey,
    previous_state: (current as { status: string } | null)?.status ?? null,
    new_state: status,
    changed_by_user_id: ctx.userId,
    notes: patch.notes ?? null,
  });
  if (logErr) throw logErr;
}

export async function createMilestone(
  ctx: TenancyCtx,
  programId: string,
  input: { name: string; description?: string; targetDate?: string; phaseNumber?: number; moduleKey?: string; ownerUserId?: string },
): Promise<string> {
  assertTenancy(ctx);
  await assertProgramTenancy(ctx, programId);
  const sb = getServerSupabase();
  const { data, error } = await sb
    .from('program_milestones')
    .insert({
      engagement_id: programId,
      name: input.name,
      description: input.description ?? null,
      target_date: input.targetDate ?? null,
      status: 'upcoming',
      phase_number: input.phaseNumber ?? null,
      module_key: input.moduleKey ?? null,
      owner_user_id: input.ownerUserId ?? null,
    })
    .select('id')
    .single();
  if (error) throw error;
  return (data as { id: string }).id;
}

export async function updateMilestoneStatus(
  ctx: TenancyCtx,
  programId: string,
  milestoneId: string,
  status: MilestoneStatus,
  actualDate?: string,
): Promise<void> {
  assertTenancy(ctx);
  await assertProgramTenancy(ctx, programId);
  const sb = getServerSupabase();
  const { error } = await sb
    .from('program_milestones')
    .update({ status, actual_date: actualDate ?? null })
    .eq('id', milestoneId)
    .eq('engagement_id', programId);
  if (error) throw error;
}

export async function createWorkItem(
  ctx: TenancyCtx,
  programId: string,
  input: {
    title: string;
    description?: string;
    itemType: WorkItemType;
    parentId?: string;
    priority?: 'critical' | 'high' | 'medium' | 'low';
    assignedUserId?: string;
    moduleKey?: string;
    phaseNumber?: number;
    dueDate?: string;
  },
): Promise<string> {
  assertTenancy(ctx);
  await assertProgramTenancy(ctx, programId);
  const sb = getServerSupabase();
  const { data, error } = await sb
    .from('program_work_items')
    .insert({
      engagement_id: programId,
      parent_id: input.parentId ?? null,
      title: input.title,
      description: input.description ?? null,
      item_type: input.itemType,
      status: 'open',
      priority: input.priority ?? null,
      assigned_user_id: input.assignedUserId ?? null,
      module_key: input.moduleKey ?? null,
      phase_number: input.phaseNumber ?? null,
      due_date: input.dueDate ?? null,
    })
    .select('id')
    .single();
  if (error) throw error;
  return (data as { id: string }).id;
}

export async function updateWorkItemStatus(
  ctx: TenancyCtx,
  programId: string,
  workItemId: string,
  status: WorkItemStatus,
): Promise<void> {
  assertTenancy(ctx);
  await assertProgramTenancy(ctx, programId);
  const sb = getServerSupabase();
  const update: Record<string, unknown> = { status };
  if (status === 'done') update.completed_at = new Date().toISOString();
  const { error } = await sb
    .from('program_work_items')
    .update(update)
    .eq('id', workItemId)
    .eq('engagement_id', programId);
  if (error) throw error;
}

export async function createRisk(
  ctx: TenancyCtx,
  programId: string,
  input: {
    title: string;
    description?: string;
    likelihood?: RiskLikelihood;
    impact?: RiskImpact;
    mitigationPlan?: string;
    ownerUserId?: string;
    phaseNumber?: number;
    moduleKey?: string;
  },
): Promise<string> {
  assertTenancy(ctx);
  await assertProgramTenancy(ctx, programId);
  const sb = getServerSupabase();
  const { data, error } = await sb
    .from('program_risks')
    .insert({
      engagement_id: programId,
      title: input.title,
      description: input.description ?? null,
      likelihood: input.likelihood ?? 'medium',
      impact: input.impact ?? 'medium',
      status: 'open',
      mitigation_plan: input.mitigationPlan ?? null,
      owner_user_id: input.ownerUserId ?? null,
      phase_number: input.phaseNumber ?? null,
      module_key: input.moduleKey ?? null,
    })
    .select('id')
    .single();
  if (error) throw error;
  return (data as { id: string }).id;
}
