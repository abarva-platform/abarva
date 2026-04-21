import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL } from './env';

export interface SponsorSeed {
  graphNodeId: string;
  name: string;
  email: string;
  role: string;
  organization: string;
  familiarity: 'first_meeting' | 'returning_recent' | 'returning_dormant' | 'frequent_collaborator';
  communicationStyle: Record<string, unknown>;
}

export interface EngagementSeed {
  graphNodeId: string;
  name: string;
  industryCode: string;
  functionCode: string;
  objectiveCode: string;
  topicCode: string;
  currentPhase: number;
  status?: string;
  gatesPassed?: Record<string, unknown>[];
  deliverables?: Record<string, unknown>[];
  baselineMetrics?: Record<string, unknown>;
  actualMetrics?: Record<string, unknown>;
  outcomeFeeUsd?: number | null;
  outcomeFeeStatus?: string | null;
}

export interface ProgramFixtureSeed {
  clientNames: string[];
  sponsor: SponsorSeed;
  engagement: EngagementSeed;
  resetTurns?: boolean;
}

export interface ProgramFixtureState {
  clientId: string;
  clientName: string;
  sponsorId: string;
  engagementId: string;
  graphNodeId: string;
}

export const missingSupabasePrereqs = [
  !SUPABASE_URL ? 'NEXT_PUBLIC_SUPABASE_URL' : null,
  !SUPABASE_SERVICE_ROLE_KEY ? 'SUPABASE_SERVICE_ROLE_KEY' : null,
].filter(Boolean) as string[];

let sb: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Supabase env missing');
  }

  if (!sb) {
    sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  return sb;
}

async function resolveClient(clientNames: string[]): Promise<{ id: string; name: string }> {
  const client = getSupabase();

  for (const candidate of clientNames) {
    const { data, error } = await client
      .from('clients')
      .select('id, name')
      .ilike('name', candidate)
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    if (data) {
      return {
        id: (data as { id: string }).id,
        name: (data as { name: string }).name,
      };
    }
  }

  throw new Error(`Unable to find seeded client (${clientNames.join(' / ')})`);
}

async function upsertSponsor(seed: SponsorSeed): Promise<string> {
  const client = getSupabase();
  const payload = {
    graph_node_id: seed.graphNodeId,
    name: seed.name,
    email: seed.email,
    role: seed.role,
    organization: seed.organization,
    familiarity: seed.familiarity,
    communication_style: seed.communicationStyle,
    working_rhythm: {},
    personal_threads: [],
  };

  const { data: existing, error: readError } = await client
    .from('persons')
    .select('id')
    .eq('graph_node_id', seed.graphNodeId)
    .maybeSingle();
  if (readError) throw readError;

  if (existing) {
    const sponsorId = (existing as { id: string }).id;
    const { error } = await client.from('persons').update(payload).eq('id', sponsorId);
    if (error) throw error;
    return sponsorId;
  }

  const { data: inserted, error: insertError } = await client
    .from('persons')
    .insert(payload)
    .select('id')
    .single();
  if (insertError) throw insertError;

  return (inserted as { id: string }).id;
}

export async function clearEngagementTurns(engagementId: string) {
  const { error } = await getSupabase().from('turns').delete().eq('engagement_id', engagementId);
  if (error) throw error;
}

export async function updateEngagementState(
  engagementId: string,
  patch: Record<string, unknown>,
) {
  const { error } = await getSupabase().from('engagements').update(patch).eq('id', engagementId);
  if (error) throw error;
}

export async function ensureProgramFixture(seed: ProgramFixtureSeed): Promise<ProgramFixtureState> {
  const client = getSupabase();
  const clientRow = await resolveClient(seed.clientNames);
  const sponsorId = await upsertSponsor(seed.sponsor);
  const now = new Date().toISOString();

  const engagementPayload = {
    graph_node_id: seed.engagement.graphNodeId,
    name: seed.engagement.name,
    industry_code: seed.engagement.industryCode,
    function_code: seed.engagement.functionCode,
    objective_code: seed.engagement.objectiveCode,
    topic_code: seed.engagement.topicCode,
    sponsor_person_id: sponsorId,
    co_sponsor_person_id: null,
    maestro_person_id: null,
    client_id: clientRow.id,
    current_phase: seed.engagement.currentPhase,
    status: seed.engagement.status ?? 'active',
    charter: {},
    gates_passed: seed.engagement.gatesPassed ?? [],
    decisions: [],
    deliverables: seed.engagement.deliverables ?? [],
    sponsor_approvals: [],
    baseline_metrics: seed.engagement.baselineMetrics ?? {},
    actual_metrics: seed.engagement.actualMetrics ?? {},
    outcome_fee_status: seed.engagement.outcomeFeeStatus ?? null,
    outcome_fee_usd: seed.engagement.outcomeFeeUsd ?? null,
    phase_0_started_at: now,
    phase_4_completed_at: seed.engagement.currentPhase >= 4 ? now : null,
  };

  const { data: existing, error: readError } = await client
    .from('engagements')
    .select('id')
    .eq('graph_node_id', seed.engagement.graphNodeId)
    .maybeSingle();
  if (readError) throw readError;

  let engagementId: string;
  if (existing) {
    engagementId = (existing as { id: string }).id;
    const { error } = await client
      .from('engagements')
      .update(engagementPayload)
      .eq('id', engagementId);
    if (error) throw error;
  } else {
    const { data: inserted, error: insertError } = await client
      .from('engagements')
      .insert(engagementPayload)
      .select('id')
      .single();
    if (insertError) throw insertError;
    engagementId = (inserted as { id: string }).id;
  }

  if (seed.resetTurns) {
    await clearEngagementTurns(engagementId);
  }

  return {
    clientId: clientRow.id,
    clientName: clientRow.name,
    sponsorId,
    engagementId,
    graphNodeId: seed.engagement.graphNodeId,
  };
}
