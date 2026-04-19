import { getServerSupabase } from '@/lib/supabase-server';

export interface EngagementRow {
  id: string;
  graph_node_id: string;
  name: string;
  industry_code: string;
  function_code: string;
  objective_code: string;
  topic_code: string | null;
  sponsor_person_id: string | null;
  co_sponsor_person_id: string | null;
  maestro_person_id: string | null;
  current_phase: number;
  status: string;
  charter: Record<string, unknown> | null;
  gates_passed: unknown[];
  decisions: unknown[];
  deliverables: unknown[];
  sponsor_approvals: unknown[];
  baseline_metrics: Record<string, unknown> | null;
  actual_metrics: Record<string, unknown> | null;
  outcome_fee_status: string | null;
  outcome_fee_usd: number | null;
  created_at: string;
  updated_at: string;
  phase_0_started_at: string | null;
  phase_4_completed_at: string | null;
}

export async function getEngagementByGraphId(graphNodeId: string): Promise<EngagementRow | null> {
  const { data, error } = await getServerSupabase()
    .from('engagements')
    .select('*')
    .eq('graph_node_id', graphNodeId)
    .maybeSingle();
  if (error) throw error;
  return data as EngagementRow | null;
}

export async function getEngagementById(id: string): Promise<EngagementRow | null> {
  const { data, error } = await getServerSupabase()
    .from('engagements')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data as EngagementRow | null;
}
