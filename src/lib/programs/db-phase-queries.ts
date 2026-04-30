// db-phase-queries.ts — Sprint 1 DB binding layer
//
// Phase-level DB queries for the programs detail page.
// Returns real engagement data merged with evidence, gate approvals, and
// module status. Falls back gracefully — any error returns null.
//
// Schema notes (adapted from real migrations):
//   evidence         : linked via related_entity_id = engagementId,
//                      related_entity_type = 'engagement'
//   phase_approvals  : linked via phase_id → engagement_phases
//                      (no direct engagement_id on phase_approvals table)
//   phase_snapshots  : uses engagement_id + approval_status (from queries.ts)

import { getServerSupabase } from '@/lib/supabase-server';

export interface EngagementPhaseData {
  engagement: {
    id: string;
    name: string;
    status: string | null;
    current_phase: number | null;
    maestro_oversight_level: string | null;
    program_milestones: Array<{
      id: string;
      name: string;
      status: string;
      target_date: string | null;
      phase_number: number | null;
    }>;
    program_risks: Array<{
      id: string;
      title: string;
      likelihood: string;
      impact: string;
      status: string;
      phase_number: number | null;
    }>;
  };
  evidence: Array<{
    id: string;
    summary: string;
    evidence_type: string;
    confidence_level: string | null;
    observed_at: string | null;
    created_at: string;
  }>;
  gateApprovals: Array<{
    id: string;
    action: string;
    actor_name: string;
    created_at: string | null;
  }>;
  modules: Array<{
    module_key: string;
    status: string;
    updated_at?: string;
  }>;
}

/**
 * Returns real engagement record merged with phase-level data.
 * Returns null if the engagement is not found or any critical query fails.
 *
 * @param clientUUID - When provided, enforces tenant isolation by adding
 *   `.eq('client_id', clientUUID)` to the engagements query. Callers should
 *   pass the UUID from getActiveClientRow() so cross-tenant reads return null.
 */
export async function getEngagementWithPhaseData(
  engagementId: string,
  clientUUID?: string | null,
): Promise<EngagementPhaseData | null> {
  try {
    const supabase = getServerSupabase();

    // Core engagement with milestones and risks via FK relations
    let query = supabase
      .from('engagements')
      .select(`
        id,
        name,
        status,
        current_phase,
        maestro_oversight_level,
        program_milestones(id, name, status, target_date, phase_number),
        program_risks(id, title, likelihood, impact, status, phase_number)
      `)
      .eq('id', engagementId);
    if (clientUUID) query = query.eq('client_id', clientUUID);
    const { data: engagement, error: engError } = await query.single();

    if (engError || !engagement) return null;

    // Evidence linked by related_entity_id — this is the real schema shape
    const { data: evidence } = await supabase
      .from('evidence')
      .select('id, summary, evidence_type, confidence_level, observed_at, created_at')
      .eq('related_entity_id', engagementId)
      .eq('related_entity_type', 'engagement')
      .order('created_at', { ascending: false })
      .limit(10);

    // Phase approvals via engagement_phases join
    // phase_approvals doesn't have a direct engagement_id column; join through
    // engagement_phases which does.
    const { data: phases } = await supabase
      .from('engagement_phases')
      .select('id')
      .eq('engagement_id', engagementId);

    let gateApprovals: EngagementPhaseData['gateApprovals'] = [];
    if (phases && phases.length > 0) {
      const phaseIds = phases.map((p: { id: string }) => p.id);
      const { data: approvals } = await supabase
        .from('phase_approvals')
        .select('id, action, actor_name, created_at')
        .in('phase_id', phaseIds)
        .order('created_at', { ascending: false });
      gateApprovals = (approvals as EngagementPhaseData['gateApprovals'] | null) ?? [];
    }

    // Module status
    const { data: modules } = await supabase
      .from('program_modules')
      .select('module_key, status')
      .eq('engagement_id', engagementId);

    return {
      engagement: engagement as EngagementPhaseData['engagement'],
      evidence: (evidence as EngagementPhaseData['evidence'] | null) ?? [],
      gateApprovals,
      modules: (modules as EngagementPhaseData['modules'] | null) ?? [],
    };
  } catch {
    return null;
  }
}
