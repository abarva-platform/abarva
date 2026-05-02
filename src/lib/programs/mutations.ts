// Programs write layer · Packet 13 §13.5.
// Three top-level mutations: originateProgram, advancePhase,
// publishDeliverable. Plus supporting writes (create milestone, create
// risk, module state transitions). All tenancy-asserted.

import { getServerSupabase } from '@/lib/supabase-server';
import { industryCodeForClientName } from '@/lib/client-config';
import type {
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
} from './types.db';
import type { ArchetypeKey } from './types.ui';
import { getProgramById } from './queries';
import { writeProgramAuditLogBestEffort } from './audit-log';

function assertTenancy(ctx: TenancyCtx): void {
  if (!ctx?.clientId || !ctx?.userId) {
    throw new Error('[programs/mutations] TenancyCtx missing clientId or userId');
  }
}

async function assertProgramTenancy(ctx: TenancyCtx, programId: string): Promise<void> {
  const program = await getProgramById(ctx, programId);
  if (!program) throw new Error(`[programs/mutations] program ${programId} not accessible`);
}

export function resolveProgramIndustryCode(
  client: { name?: string | null; industry_code?: string | null } | null,
  fallback?: string | null,
): string {
  return (
    client?.industry_code?.trim() ||
    industryCodeForClientName(client?.name) ||
    fallback?.trim() ||
    'UNKNOWN'
  ).toUpperCase();
}

export interface ProgramClassificationCodes {
  functionCode: 'FRONT_OFFICE' | 'MIDDLE_OFFICE' | 'BACK_OFFICE';
  objectiveCode: 'GROW' | 'OPTIMISE' | 'CONTROL';
  topicCode: string;
}

function slugifyTopicCode(value: string): string {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 80);
  return slug || 'program_origination';
}

export function resolveProgramClassificationCodes(input: {
  name: string;
  useCase: string;
  archetype?: string | null;
  acceptedPatternKey?: string | null;
}): ProgramClassificationCodes {
  const text = [
    input.name,
    input.useCase,
    input.archetype ?? '',
    input.acceptedPatternKey ?? '',
  ].join(' ').toLowerCase();

  let functionCode: ProgramClassificationCodes['functionCode'] = 'MIDDLE_OFFICE';
  if (
    /\b(finance|financial close|hr|hcm|erp|procurement|supply chain|payroll|back[- ]office|revenue cycle|rcm)\b/.test(text)
  ) {
    functionCode = 'BACK_OFFICE';
  } else if (
    /\b(customer|consumer|patient|member|sales|marketing|commerce|checkout|abandonment|store|portal|front door|front[- ]office)\b/.test(text)
  ) {
    functionCode = 'FRONT_OFFICE';
  }

  let objectiveCode: ProgramClassificationCodes['objectiveCode'] = 'OPTIMISE';
  if (/\b(risk|control|compliance|governance|audit|security|regulatory|privacy)\b/.test(text)) {
    objectiveCode = 'CONTROL';
  } else if (/\b(growth|grow|revenue|acquisition|retention|conversion|market share)\b/.test(text)) {
    objectiveCode = 'GROW';
  }

  return {
    functionCode,
    objectiveCode,
    topicCode: slugifyTopicCode(input.acceptedPatternKey || input.name),
  };
}

async function resolveClientIndustryCode(clientId: string, fallback?: string | null): Promise<string> {
  const sb = getServerSupabase();
  const { data } = await sb
    .from('clients')
    .select('name, industry_code')
    .eq('id', clientId)
    .maybeSingle();
  return resolveProgramIndustryCode(
    data as { name?: string | null; industry_code?: string | null } | null,
    fallback,
  );
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
  const industryCode = await resolveClientIndustryCode(ctx.clientId, input.industryHint);
  const classificationCodes = resolveProgramClassificationCodes({
    name: input.name,
    useCase: input.useCase,
    archetype: input.archetype,
    acceptedPatternKey: input.acceptedPatternKey,
  });
  // NOTE: engagements has no `created_by` column on the current schema —
  // creator attribution is captured in module_state_log (changed_by_user_id)
  // and downstream participant rows. Don't reintroduce a created_by write.
  const { data, error } = await sb
    .from('engagements')
    .insert({
      client_id: ctx.clientId,
      industry_code: industryCode,
      function_code: classificationCodes.functionCode,
      objective_code: classificationCodes.objectiveCode,
      topic_code: classificationCodes.topicCode,
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
    })
    .select('*')
    .single();
  if (error) throw error;

  const programId = (data as { id: string }).id;
  await writeProgramAuditLogBestEffort(ctx, {
    programId,
    engagementId: programId,
    action: 'program_originated',
    fromState: null,
    toState: 'phase_0_seed_created',
    rationale: input.useCase,
    evidenceRefs: input.acceptedPatternKey ? [input.acceptedPatternKey] : [],
  });

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

  await writeProgramAuditLogBestEffort(ctx, {
    programId: input.programId,
    engagementId: input.programId,
    action: 'program_phase_advanced',
    fromState: `P${input.fromPhase}`,
    toState: `P${input.toPhase}`,
    rationale: input.bypassGate ? 'Phase advanced with gate bypass flag.' : 'Phase advanced after gate evaluation.',
    evidenceRefs: [(snap as { id: string }).id],
  });

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

export interface CompleteDeliverableInput {
  deliverableTypeKey: string;
  title: string;
  content?: string;
  moduleKey?: string;
  structuredData?: Record<string, unknown>;
  provenanceMap?: Record<string, unknown>;
  signOff?: boolean;
}

/**
 * Create/update a deliverable and optionally sign it off in one atomic
 * crawl-facing operation. This is intentionally stricter than the draft
 * route: it exists for explicit user/admin approval moments where Nexus has
 * generated the artifact and the authorized user says to accept it.
 */
export async function completeDeliverable(
  ctx: TenancyCtx,
  programId: string,
  input: CompleteDeliverableInput,
): Promise<{ deliverableId: string; versionId: string | null; status: 'draft' | 'signed_off' }> {
  assertTenancy(ctx);
  await assertProgramTenancy(ctx, programId);
  const deliverableTypeKey = input.deliverableTypeKey.trim();
  const title = input.title.trim();
  if (!deliverableTypeKey) throw new Error('[completeDeliverable] deliverableTypeKey is required');
  if (!title) throw new Error('[completeDeliverable] title is required');

  const sb = getServerSupabase();
  const now = new Date().toISOString();
  const { data: existing, error: existingError } = await sb
    .from('deliverables_v2')
    .select('id, current_version')
    .eq('engagement_id', programId)
    .eq('deliverable_type_key', deliverableTypeKey)
    .maybeSingle();
  if (existingError) throw existingError;

  let deliverableId: string;
  let nextVersion = 1;
  if (existing) {
    deliverableId = (existing as { id: string; current_version: number | null }).id;
    nextVersion = ((existing as { current_version: number | null }).current_version ?? 0) + 1;
    const { error } = await sb
      .from('deliverables_v2')
      .update({
        title,
        current_version: nextVersion,
        status: input.signOff === false ? 'draft' : 'signed_off',
        signed_off_by: input.signOff === false ? null : ctx.userId,
        signed_off_at: input.signOff === false ? null : now,
        updated_at: now,
      })
      .eq('id', deliverableId)
      .eq('engagement_id', programId);
    if (error) throw error;
  } else {
    const { data: created, error } = await sb
      .from('deliverables_v2')
      .insert({
        engagement_id: programId,
        deliverable_type_key: deliverableTypeKey,
        title,
        status: input.signOff === false ? 'draft' : 'signed_off',
        current_version: 1,
        created_by: 'nexus',
        signed_off_by: input.signOff === false ? null : ctx.userId,
        signed_off_at: input.signOff === false ? null : now,
      })
      .select('id')
      .single();
    if (error) throw error;
    deliverableId = (created as { id: string }).id;
  }

  let versionId: string | null = null;
  const content = input.content?.trim();
  if (content) {
    const { data: version, error } = await sb
      .from('deliverable_versions')
      .insert({
        deliverable_id: deliverableId,
        version: nextVersion,
        content,
        structured_data: {
          ...(input.structuredData ?? {}),
          module_key: input.moduleKey ?? null,
          completed_by_tool: true,
          signed_off: input.signOff !== false,
        },
        quality_issues: input.provenanceMap ? { provenance_map: input.provenanceMap } : null,
        generated_from_context_hash: null,
      })
      .select('id')
      .single();
    if (error) throw error;
    versionId = (version as { id: string }).id;
  }

  const { error: logErr } = await sb.from('module_state_log').insert({
    engagement_id: programId,
    module_key: input.moduleKey ?? deliverableTypeKey,
    previous_state: null,
    new_state: input.signOff === false ? 'drafted' : 'signed_off',
    changed_by_user_id: ctx.userId,
    notes: `${title} ${input.signOff === false ? 'drafted' : 'signed off'} by Nexus tool`,
    context_jsonb: {
      deliverable_id: deliverableId,
      deliverable_type_key: deliverableTypeKey,
      version_id: versionId,
    },
  });
  if (logErr) throw logErr;

  await writeProgramAuditLogBestEffort(ctx, {
    programId,
    engagementId: programId,
    action: input.signOff === false ? 'deliverable_drafted' : 'deliverable_signed_off',
    fromState: existing ? 'existing_deliverable' : 'new_deliverable',
    toState: input.signOff === false ? 'draft' : 'signed_off',
    rationale: title,
    evidenceRefs: [deliverableId, ...(versionId ? [versionId] : [])],
  });

  return {
    deliverableId,
    versionId,
    status: input.signOff === false ? 'draft' : 'signed_off',
  };
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

  await writeProgramAuditLogBestEffort(ctx, {
    programId,
    engagementId: programId,
    action: 'program_module_status_changed',
    fromState: (current as { status: string } | null)?.status ?? null,
    toState: status,
    rationale: patch.notes ?? null,
    evidenceRefs: [moduleKey],
  });
}

export async function createMilestone(
  ctx: TenancyCtx,
  programId: string,
  input: { name: string; description?: string; targetDate?: string; phaseNumber?: number; moduleKey?: string; ownerUserId?: string },
): Promise<string> {
  assertTenancy(ctx);
  await assertProgramTenancy(ctx, programId);
  const sb = getServerSupabase();
  const phaseNumber = input.phaseNumber ?? null;
  const moduleKey = input.moduleKey ?? null;
  let existingQuery = sb
    .from('program_milestones')
    .select('id')
    .eq('engagement_id', programId)
    .eq('name', input.name)
    .order('created_at', { ascending: true })
    .limit(1);

  existingQuery = phaseNumber === null
    ? existingQuery.is('phase_number', null)
    : existingQuery.eq('phase_number', phaseNumber);
  existingQuery = moduleKey === null
    ? existingQuery.is('module_key', null)
    : existingQuery.eq('module_key', moduleKey);

  const { data: existing, error: existingError } = await existingQuery.maybeSingle();
  if (existingError) throw existingError;
  if (existing) {
    const existingId = (existing as { id: string }).id;
    const { error: updateError } = await sb
      .from('program_milestones')
      .update({
        description: input.description ?? null,
        target_date: input.targetDate ?? null,
        owner_user_id: input.ownerUserId ?? null,
      })
      .eq('id', existingId)
      .eq('engagement_id', programId);
    if (updateError) throw updateError;
    return existingId;
  }

  const { data, error } = await sb
    .from('program_milestones')
    .insert({
      engagement_id: programId,
      name: input.name,
      description: input.description ?? null,
      target_date: input.targetDate ?? null,
      status: 'upcoming',
      phase_number: phaseNumber,
      module_key: moduleKey,
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
