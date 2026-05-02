import 'server-only';

import { requireTenancy, TenancyError } from '@/app/api/v1/programs/_auth';
import { getActiveClientRow } from '@/lib/active-client';
import { loadUserProgramAccessPolicy } from '@/lib/auth/program-access-policy';
import { CLIENT_KEY_TO_INDUSTRY_CODE } from '@/lib/client-config';
import { getServerSupabase } from '@/lib/supabase-server';
import { submitForApproval } from '@/lib/programs/approval';
import { markDraftCommitted } from '@/lib/programs/origination-drafts';
import type { OriginSource } from '@/lib/programs/types.db';
import { normalizeProgramArchetype } from '@/lib/programs/archetype-normalization';

export interface SubmitOriginationBriefInput {
  surface: string;
  programName: string;
  problemStatement: string;
  targetOutcome?: string | null;
  timeline?: string | null;
  classification?: string | null;
  sponsor: string;
  lead?: string | null;
  matchedPatternId?: string | null;
}

export interface SubmitOriginationBriefResult {
  engagementId: string;
  approvalRequestId: string;
  programName: string;
  lifecycleState: 'submitted_for_approval';
  redirectTo: string;
}

export class OriginationSubmitError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status = 400,
  ) {
    super(message);
    this.name = 'OriginationSubmitError';
  }
}

interface ResolvedPerson {
  id: string;
  name: string;
  role: string | null;
}

interface Classification {
  functionCode: 'FRONT_OFFICE' | 'MIDDLE_OFFICE' | 'BACK_OFFICE';
  objectiveCode: 'GROW' | 'OPTIMISE' | 'CONTROL';
  topicCode: string;
}

function requiredText(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new OriginationSubmitError('missing_field', `${field} is required`);
  }
  return value.trim();
}

function optionalText(value: string | null | undefined): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeLabel(value: string): string {
  return value
    .toLowerCase()
    .replace(/\([^)]*\)/g, ' ')
    .replace(/[^\p{L}\p{N}@.]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function personTokens(value: string): string[] {
  const stop = new Set([
    'the',
    'a',
    'an',
    'is',
    'as',
    'sponsor',
    'lead',
    'owner',
    'program',
    'director',
    'chief',
    'officer',
    'vp',
    'vice',
    'president',
  ]);
  return normalizeLabel(value)
    .split(' ')
    .filter((token) => token.length >= 2 && !stop.has(token))
    .slice(0, 4);
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

function classifyBrief(input: SubmitOriginationBriefInput): Classification {
  const text = [
    input.programName,
    input.problemStatement,
    input.targetOutcome ?? '',
    input.timeline ?? '',
    input.classification ?? '',
    input.matchedPatternId ?? '',
  ]
    .join(' ')
    .toLowerCase();

  let functionCode: Classification['functionCode'] = 'MIDDLE_OFFICE';
  if (/\b(finance|hr|hcm|erp|procurement|supply chain|payroll|back[- ]office|revenue cycle|rcm)\b/.test(text)) {
    functionCode = 'BACK_OFFICE';
  } else if (/\b(customer|consumer|patient|member|sales|marketing|commerce|checkout|store|portal|front[- ]office)\b/.test(text)) {
    functionCode = 'FRONT_OFFICE';
  }

  let objectiveCode: Classification['objectiveCode'] = 'OPTIMISE';
  if (/\b(risk|control|compliance|governance|audit|security|regulatory|privacy)\b/.test(text)) {
    objectiveCode = 'CONTROL';
  } else if (/\b(growth|grow|revenue|acquisition|retention|conversion|market share)\b/.test(text)) {
    objectiveCode = 'GROW';
  }

  return {
    functionCode,
    objectiveCode,
    topicCode: slugifyTopicCode(input.programName),
  };
}

async function resolvePersonByLabel(input: {
  label: string;
  clientName: string;
  fallbackUserId: string;
}): Promise<ResolvedPerson> {
  const sb = getServerSupabase();
  const fallbackLooksLikeUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    input.fallbackUserId,
  );

  const tokens = personTokens(input.label);
  const clauses = tokens.flatMap((token) => [
    `name.ilike.%${token}%`,
    `email.ilike.%${token}%`,
    `role.ilike.%${token}%`,
  ]);

  const query = clauses.length > 0
    ? sb.from('persons').select('id, name, role, organization, email').or(clauses.join(',')).limit(25)
    : sb.from('persons').select('id, name, role, organization, email').eq('id', input.fallbackUserId).limit(25);

  const { data, error } = await query;
  if (error) {
    throw new OriginationSubmitError('person_lookup_failed', error.message, 500);
  }

  type PersonRow = {
    id: string;
    name: string;
    role: string | null;
    organization: string | null;
    email: string | null;
  };

  const labelNorm = normalizeLabel(input.label);
  const clientNorm = normalizeLabel(input.clientName);
  const rows = ((data ?? []) as PersonRow[]).filter((row) => {
    const orgNorm = normalizeLabel(row.organization ?? '');
    return orgNorm.includes(clientNorm) || clientNorm.includes(orgNorm);
  });

  const exact = rows.find((row) => normalizeLabel(row.name) === labelNorm);
  const contains = exact ?? rows.find((row) => labelNorm.includes(normalizeLabel(row.name)) || normalizeLabel(row.name).includes(labelNorm));
  const currentUser = rows.find((row) => fallbackLooksLikeUuid && row.id === input.fallbackUserId);
  const picked = contains ?? currentUser ?? rows[0];

  if (!picked) {
    throw new OriginationSubmitError(
      'person_not_found',
      `Could not resolve "${input.label}" in ${input.clientName}'s people records`,
      422,
    );
  }

  return { id: picked.id, name: picked.name, role: picked.role };
}

async function insertParticipant(input: {
  programId: string;
  person: ResolvedPerson;
  role: string;
  approvalAuthority: 'sponsor' | 'contributor';
}): Promise<void> {
  const sb = getServerSupabase();
  const basePayload = {
    engagement_id: input.programId,
    user_id: input.person.id,
    user_name: input.person.name,
    role: input.role,
    notify_on: ['phase_gate', 'approval'],
    approval_authority: input.approvalAuthority,
    last_touchpoint_at: new Date().toISOString(),
  };
  const { error } = await sb.from('engagement_participants').insert({
    ...basePayload,
    program_access_level: 'program_member',
    can_view_financial: false,
    can_upload: true,
    can_generate_deliverables: true,
    can_publish_deliverables: input.approvalAuthority === 'sponsor',
    can_approve_phase_gates: input.approvalAuthority === 'sponsor',
  });
  if (error && /program_access_level|can_view_financial|can_upload|can_generate_deliverables|can_publish_deliverables|can_approve_phase_gates/i.test(error.message)) {
    const { error: retryError } = await sb.from('engagement_participants').insert(basePayload);
    if (retryError) throw retryError;
    return;
  }
  if (error) throw error;
}

async function rollbackEngagement(programId: string): Promise<void> {
  try {
    await getServerSupabase().from('engagements').delete().eq('id', programId);
  } catch (err) {
    console.error('[origination-submit] rollback failed', {
      programId,
      err: err instanceof Error ? err.message : String(err),
    });
  }
}

export async function submitOriginationBrief(
  rawInput: SubmitOriginationBriefInput,
): Promise<SubmitOriginationBriefResult> {
  const input: SubmitOriginationBriefInput = {
    ...rawInput,
    surface: optionalText(rawInput.surface) ?? '/programs/new',
    programName: requiredText(rawInput.programName, 'programName'),
    problemStatement: requiredText(rawInput.problemStatement, 'problemStatement'),
    targetOutcome: optionalText(rawInput.targetOutcome),
    timeline: optionalText(rawInput.timeline),
    classification: optionalText(rawInput.classification),
    sponsor: requiredText(rawInput.sponsor, 'sponsor'),
    lead: optionalText(rawInput.lead) ?? requiredText(rawInput.sponsor, 'sponsor'),
    matchedPatternId: optionalText(rawInput.matchedPatternId),
  };

  let tenancy;
  try {
    tenancy = await requireTenancy();
  } catch (err) {
    if (err instanceof TenancyError) {
      throw new OriginationSubmitError(err.code, err.code, err.code === 'unauthenticated' ? 401 : 403);
    }
    throw err;
  }

  const accessPolicy = await loadUserProgramAccessPolicy(tenancy).catch(() => null);
  if (!accessPolicy?.canCreatePrograms) {
    throw new OriginationSubmitError(
      'forbidden',
      'Your Programs access does not allow creating new programs for this client.',
      403,
    );
  }

  const activeClient = await getActiveClientRow();
  if (!activeClient || activeClient.id !== tenancy.clientId) {
    throw new OriginationSubmitError('tenant_resolution_failed', 'Active client does not match tenancy.', 403);
  }

  const sponsor = await resolvePersonByLabel({
    label: input.sponsor,
    clientName: activeClient.name,
    fallbackUserId: tenancy.userId,
  });
  const lead = input.lead
    ? await resolvePersonByLabel({
        label: input.lead,
        clientName: activeClient.name,
        fallbackUserId: tenancy.userId,
      })
    : sponsor;

  const sb = getServerSupabase();
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60_000).toISOString();
  const { data: existing } = await sb
    .from('engagements')
    .select('id, name, lifecycle_state, created_at')
    .eq('client_id', tenancy.clientId)
    .eq('name', input.programName)
    .gte('created_at', fiveMinutesAgo)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) {
    const row = existing as { id: string; name: string; lifecycle_state: string | null };
    const { data: approval } = await sb
      .from('program_approval_requests')
      .select('id')
      .eq('program_id', row.id)
      .eq('request_status', 'pending')
      .order('requested_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    return {
      engagementId: row.id,
      approvalRequestId: (approval as { id: string } | null)?.id ?? '',
      programName: row.name,
      lifecycleState: 'submitted_for_approval',
      redirectTo: `/programs/${row.id}`,
    };
  }

  const derived = classifyBrief(input);
  const programArchetype = normalizeProgramArchetype(input.classification);
  const industryCode = (
    activeClient.industry_code?.trim() || CLIENT_KEY_TO_INDUSTRY_CODE[activeClient.key]
  ).toUpperCase();

  const { data: inserted, error: insertError } = await sb
    .from('engagements')
    .insert({
      client_id: tenancy.clientId,
      industry_code: industryCode,
      function_code: derived.functionCode,
      objective_code: derived.objectiveCode,
      topic_code: derived.topicCode,
      name: input.programName,
      sponsor_person_id: sponsor.id,
      status: 'draft',
      lifecycle_state: 'submitted_for_approval',
      current_phase: 0,
      program_archetype: programArchetype,
      origin_source: 'user_initiated' as OriginSource,
      origin_source_ref: null,
      maestro_oversight_level: 'partial',
      founder_approval_required: false,
      data_residency_region: null,
      retention_policy_years: 7,
    })
    .select('id, name')
    .single();

  if (insertError || !inserted) {
    throw new OriginationSubmitError(
      'engagement_insert_failed',
      insertError?.message ?? 'Unknown engagement insert failure',
      500,
    );
  }

  const programId = (inserted as { id: string }).id;
  const programName = (inserted as { name: string }).name;
  try {
    const briefSnapshot: Record<string, unknown> = {
      program_name: input.programName,
      problem_statement: input.problemStatement,
      sponsor_person_id: sponsor.id,
      sponsor_name: sponsor.name,
      lead_person_id: lead.id,
      lead_name: lead.name,
      function_code: derived.functionCode,
      objective_code: derived.objectiveCode,
      topic_code: derived.topicCode,
      classification: programArchetype,
      matched_pattern_id: input.matchedPatternId ?? null,
      submitted_from_surface: input.surface,
      submitted_at: new Date().toISOString(),
    };
    if (input.targetOutcome) briefSnapshot.target_outcome = input.targetOutcome;
    if (input.timeline) briefSnapshot.timeline = input.timeline;

    const approval = await submitForApproval({
      tenantKey: activeClient.key,
      programId,
      requestedByUserId: tenancy.userId,
      briefSnapshot,
    });

    await insertParticipant({
      programId,
      person: sponsor,
      role: 'Sponsor',
      approvalAuthority: 'sponsor',
    });
    if (lead.id !== sponsor.id) {
      await insertParticipant({
        programId,
        person: lead,
        role: 'Program Lead',
        approvalAuthority: 'contributor',
      });
    }
    await markDraftCommitted(tenancy, input.surface, programId).catch(() => undefined);

    return {
      engagementId: programId,
      approvalRequestId: approval.id,
      programName,
      lifecycleState: 'submitted_for_approval',
      redirectTo: `/programs/${programId}`,
    };
  } catch (err) {
    await rollbackEngagement(programId);
    throw err;
  }
}
