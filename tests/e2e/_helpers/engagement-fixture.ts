import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL } from './auth';

export interface EngagementFixtureSeed {
  graphNodeId: string;
  name: string;
  currentPhase: number;
  outcomeFeeUsd?: number | null;
  clientCandidates?: string[];
  clientName?: string;
  sponsor: {
    graphNodeId: string;
    name: string;
    email: string;
    role: string;
    organization: string;
    title: string;
    cxoFunction: string;
    primaryFocus: string;
    familiarity?: 'first_meeting' | 'returning_recent' | 'returning_dormant' | 'frequent_collaborator';
  };
  industryCode?: 'HEALTHCARE_IDN' | 'FINSERV' | 'RETAIL' | 'GENERAL';
  functionCode?: 'MIDDLE_OFFICE' | 'FRONT_OFFICE' | 'BACK_OFFICE' | 'OPERATIONS';
  objectiveCode?: 'OPTIMISE' | 'GROW' | 'DEFEND' | 'MODERNISE';
  topicCode?: string;
}

export interface EngagementFixtureState {
  clientId: string;
  clientName: string;
  sponsorId: string;
  engagementId: string;
  graphNodeId: string;
  currentPhase: number;
  outcomeFeeUsd: number | null;
}

let supabase: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Supabase env is required for engagement fixtures');
  }

  if (!supabase) {
    supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  return supabase;
}

export async function findClientRow(clientCandidates: string[]): Promise<{ id: string; name: string; industry_code: string | null } | null> {
  const sb = getSupabase();
  for (const candidate of clientCandidates) {
    const { data, error } = await sb
      .from('clients')
      .select('id, name, industry_code')
      .ilike('name', candidate)
      .maybeSingle();
    if (error) throw error;
    if (data) {
      return data as { id: string; name: string; industry_code: string | null };
    }
  }
  return null;
}

async function upsertPerson(seed: EngagementFixtureSeed['sponsor']): Promise<{ id: string }> {
  const sb = getSupabase();
  const payload = {
    graph_node_id: seed.graphNodeId,
    name: seed.name,
    email: seed.email,
    role: seed.role,
    organization: seed.organization,
    familiarity: seed.familiarity ?? 'first_meeting',
    communication_style: {
      title: seed.title,
      cxo_function: seed.cxoFunction,
      primary_focus: seed.primaryFocus,
    },
    working_rhythm: {},
    personal_threads: [],
  };

  const { data: existing, error: readError } = await sb
    .from('persons')
    .select('id')
    .eq('email', seed.email)
    .maybeSingle();
  if (readError) throw readError;

  if (existing) {
    const { error: updateError } = await sb
      .from('persons')
      .update(payload)
      .eq('id', (existing as { id: string }).id);
    if (updateError) throw updateError;
    return { id: (existing as { id: string }).id };
  }

  const { data: inserted, error: insertError } = await sb
    .from('persons')
    .insert(payload)
    .select('id')
    .single();
  if (insertError) throw insertError;
  return { id: (inserted as { id: string }).id };
}

async function upsertEngagement(seed: EngagementFixtureSeed, clientId: string, sponsorId: string): Promise<{ id: string }> {
  const sb = getSupabase();
  const payload = {
    graph_node_id: seed.graphNodeId,
    name: seed.name,
    industry_code: seed.industryCode ?? 'HEALTHCARE_IDN',
    function_code: seed.functionCode ?? 'MIDDLE_OFFICE',
    objective_code: seed.objectiveCode ?? 'OPTIMISE',
    topic_code: seed.topicCode ?? 'prior_authorization',
    sponsor_person_id: sponsorId,
    co_sponsor_person_id: null,
    maestro_person_id: null,
    client_id: clientId,
    current_phase: seed.currentPhase,
    status: 'active',
    charter: {},
    gates_passed: [],
    decisions: [],
    deliverables: [],
    sponsor_approvals: [],
    baseline_metrics: {},
    actual_metrics: {},
    outcome_fee_status: seed.outcomeFeeUsd && seed.outcomeFeeUsd > 0 ? 'proposed' : null,
    outcome_fee_usd: seed.outcomeFeeUsd ?? null,
    phase_0_started_at: new Date().toISOString(),
    phase_4_completed_at: null,
  };

  const { data: existing, error: readError } = await sb
    .from('engagements')
    .select('id')
    .eq('graph_node_id', seed.graphNodeId)
    .maybeSingle();
  if (readError) throw readError;

  if (existing) {
    const { error: updateError } = await sb
      .from('engagements')
      .update(payload)
      .eq('id', (existing as { id: string }).id);
    if (updateError) throw updateError;
    return { id: (existing as { id: string }).id };
  }

  const { data: inserted, error: insertError } = await sb
    .from('engagements')
    .insert(payload)
    .select('id')
    .single();
  if (insertError) throw insertError;
  return { id: (inserted as { id: string }).id };
}

export async function ensureEngagementFixture(seed: EngagementFixtureSeed): Promise<EngagementFixtureState> {
  const clientRow = await findClientRow(seed.clientCandidates ?? ['Meridian Health System', 'Meridian Health']);
  if (!clientRow) {
    throw new Error(`Unable to find a seeded client for ${seed.clientName ?? seed.name}`);
  }

  const sponsor = await upsertPerson(seed.sponsor);
  const engagement = await upsertEngagement(seed, clientRow.id, sponsor.id);

  const sb = getSupabase();
  const { error: deleteTurnsError } = await sb
    .from('turns')
    .delete()
    .eq('engagement_id', engagement.id);
  if (deleteTurnsError) throw deleteTurnsError;

  return {
    clientId: clientRow.id,
    clientName: clientRow.name,
    sponsorId: sponsor.id,
    engagementId: engagement.id,
    graphNodeId: seed.graphNodeId,
    currentPhase: seed.currentPhase,
    outcomeFeeUsd: seed.outcomeFeeUsd ?? null,
  };
}

