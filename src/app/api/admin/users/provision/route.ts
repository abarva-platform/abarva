import { NextRequest, NextResponse } from 'next/server';

import { requireTenancy, tenancyErrorResponse } from '@/app/api/v1/programs/_auth';
import { loadUserProgramAccessPolicy } from '@/lib/auth/program-access-policy';
import { getServerSupabase } from '@/lib/supabase-server';
import { writeProgramAuditLogBestEffort } from '@/lib/programs/audit-log';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type ProgramAccessLevel = 'client_admin' | 'program_member' | 'program_viewer';

interface ProvisionUserBody {
  email?: unknown;
  name?: unknown;
  accessLevel?: unknown;
  programIds?: unknown;
  financialVisibility?: unknown;
  canCreatePrograms?: unknown;
  canApproveGates?: unknown;
  canUploadArtifacts?: unknown;
  canGenerateDeliverables?: unknown;
  canPublishDeliverables?: unknown;
}

interface ProgramAssignmentInput {
  sb: ReturnType<typeof getServerSupabase>;
  clientId: string;
  programId: string;
  personId: string;
  name: string;
  accessLevel: ProgramAccessLevel;
  canApproveGates: boolean;
  canUploadArtifacts: boolean;
  canGenerateDeliverables: boolean;
  canPublishDeliverables: boolean;
  financialVisibility: boolean;
}

function stringValue(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function boolValue(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function normalizeAccess(value: unknown): ProgramAccessLevel {
  return value === 'client_admin' || value === 'program_member' || value === 'program_viewer'
    ? value
    : 'program_member';
}

function normalizeProgramIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => stringValue(item))
    .filter((item): item is string => Boolean(item));
}

async function assignProgramParticipant(input: ProgramAssignmentInput): Promise<{
  programId: string;
  status: 'assigned' | 'failed';
  detail?: string;
}> {
  const { sb, programId } = input;

  const { data: program, error: programError } = await sb
    .from('engagements')
    .select('id')
    .eq('id', programId)
    .eq('client_id', input.clientId)
    .maybeSingle();
  if (programError) {
    return { programId, status: 'failed', detail: programError.message };
  }
  if (!program) {
    return { programId, status: 'failed', detail: 'program_not_found_for_active_client' };
  }

  const participantPayload = {
    engagement_id: programId,
    user_id: input.personId,
    user_name: input.name,
    role: input.accessLevel === 'program_viewer' ? 'observer' : 'contributor',
    notify_on: ['phase_gate', 'approval'],
    approval_authority: input.canApproveGates ? 'approver' : input.accessLevel === 'program_viewer' ? 'observer' : 'contributor',
    program_access_level: input.accessLevel === 'program_viewer' ? 'program_viewer' : 'program_member',
    can_view_financial: input.financialVisibility,
    can_upload: input.canUploadArtifacts,
    can_generate_deliverables: input.canGenerateDeliverables,
    can_publish_deliverables: input.canPublishDeliverables,
    can_approve_phase_gates: input.canApproveGates,
  };

  const { data: existing, error: existingError } = await sb
    .from('engagement_participants')
    .select('id')
    .eq('engagement_id', programId)
    .eq('user_id', input.personId)
    .maybeSingle();
  if (existingError) {
    return { programId, status: 'failed', detail: existingError.message };
  }

  const existingId = existing && typeof existing === 'object' && 'id' in existing
    ? String((existing as { id: unknown }).id)
    : null;
  const { error } = existingId
    ? await sb.from('engagement_participants').update(participantPayload).eq('id', existingId)
    : await sb.from('engagement_participants').insert(participantPayload);

  return error
    ? { programId, status: 'failed', detail: error.message }
    : { programId, status: 'assigned' };
}

export async function POST(req: NextRequest) {
  let ctx;
  try {
    ctx = await requireTenancy();
  } catch (err) {
    try { return tenancyErrorResponse(err); } catch {}
    return NextResponse.json({ error: 'auth_failed' }, { status: 500 });
  }

  const callerPolicy = await loadUserProgramAccessPolicy(ctx).catch(() => null);
  if (!callerPolicy?.canAdminUsers) {
    return NextResponse.json(
      { error: 'forbidden', detail: 'Client admin user-management permission is required.' },
      { status: 403 },
    );
  }

  let body: ProvisionUserBody;
  try {
    body = (await req.json()) as ProvisionUserBody;
  } catch {
    return NextResponse.json({ error: 'bad_request', detail: 'Invalid JSON body.' }, { status: 400 });
  }

  const email = stringValue(body.email)?.toLowerCase();
  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'bad_request', detail: 'email is required.' }, { status: 400 });
  }

  const accessLevel = normalizeAccess(body.accessLevel);
  const name = stringValue(body.name) ?? email.split('@')[0] ?? email;
  const programIds = normalizeProgramIds(body.programIds);
  const financialVisibility = boolValue(body.financialVisibility, false);
  const canCreatePrograms = accessLevel === 'client_admin' || boolValue(body.canCreatePrograms, false);
  const canApproveGates = accessLevel === 'client_admin' || boolValue(body.canApproveGates, false);
  const canAdminUsers = accessLevel === 'client_admin';
  const canUploadArtifacts = boolValue(body.canUploadArtifacts, true);
  const canGenerateDeliverables = boolValue(body.canGenerateDeliverables, true);
  const canPublishDeliverables = accessLevel === 'client_admin' || boolValue(body.canPublishDeliverables, false);

  const sb = getServerSupabase();

  const graphNodeId = `person:${ctx.clientId}:${email}`;
  const { data: person, error: personError } = await sb
    .from('persons')
    .upsert(
      {
        graph_node_id: graphNodeId,
        email,
        name,
        role: accessLevel,
        organization: ctx.clientId,
      },
      { onConflict: 'email' },
    )
    .select('id')
    .single();
  if (personError || !person) {
    return NextResponse.json(
      { error: 'person_upsert_failed', detail: personError?.message ?? 'No person row returned.' },
      { status: 500 },
    );
  }
  const personId = (person as { id: string }).id;

  const { error: membershipError } = await sb
    .from('person_client_memberships')
    .upsert(
      {
        person_id: personId,
        client_id: ctx.clientId,
        role: 'client_viewer',
        access_level: accessLevel,
        financial_visibility: financialVisibility,
        can_admin_users: canAdminUsers,
        can_create_programs: canCreatePrograms,
        can_approve_gates: canApproveGates,
      },
      { onConflict: 'person_id,client_id' },
    );
  if (membershipError) {
    return NextResponse.json(
      { error: 'membership_upsert_failed', detail: membershipError.message },
      { status: 500 },
    );
  }

  const participantResults: Array<{ programId: string; status: 'assigned' | 'failed'; detail?: string }> = [];
  for (const programId of programIds) {
    participantResults.push(await assignProgramParticipant({
      sb,
      clientId: ctx.clientId,
      programId,
      personId,
      name,
      accessLevel,
      canApproveGates,
      canUploadArtifacts,
      canGenerateDeliverables,
      canPublishDeliverables,
      financialVisibility,
    }));
  }

  await writeProgramAuditLogBestEffort(ctx, {
    programId: programIds[0] ?? 'client-user-provisioning',
    engagementId: programIds[0] ?? null,
    action: 'program_user_provisioned',
    fromState: null,
    toState: accessLevel,
    rationale: `Provisioned ${email} for Programs access.`,
    evidenceRefs: [personId, ...programIds],
  });

  return NextResponse.json({
    ok: true,
    personId,
    email,
    accessLevel,
    financialVisibility,
    canCreatePrograms,
    canApproveGates,
    canUploadArtifacts,
    canGenerateDeliverables,
    canPublishDeliverables,
    assignments: participantResults,
  });
}
