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
import { canReadProgram } from '@/lib/auth/program-access-policy';
import type { TenancyCtx } from '@/lib/programs/types.db';

export interface EngagementPhaseData {
  engagement: {
    id: string;
    name: string;
    status: string | null;
    lifecycle_state: string | null;
    current_phase: number | null;
    program_archetype: string | null;
    maestro_oversight_level: string | null;
    sponsor_person_id: string | null;
    maestro_person_id: string | null;
    sponsor: { name: string; role: string | null } | null;
    lead: { name: string; role: string | null } | null;
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
  programEvidenceItems: Array<{
    id: string;
    phase: number | null;
    evidence_type: string;
    title: string;
    summary: string;
    confidence: number | string | null;
    created_at: string;
  }>;
  deliverables: Array<{
    id: string;
    deliverable_type_key: string;
    title: string | null;
    status: string | null;
    updated_at: string | null;
  }>;
  auditLogs: Array<{
    id: string;
    action: string;
    from_state: string | null;
    to_state: string | null;
    rationale: string | null;
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
  tenancy?: TenancyCtx | null,
): Promise<EngagementPhaseData | null> {
  try {
    if (tenancy && !(await canReadProgram(tenancy, engagementId))) {
      return null;
    }
    const supabase = getServerSupabase();

    // Core engagement with milestones and risks via FK relations
    let query = supabase
      .from('engagements')
      .select(`
        id,
        client_id,
        name,
        status,
        lifecycle_state,
        current_phase,
        program_archetype,
        maestro_oversight_level,
        sponsor_person_id,
        maestro_person_id,
        program_milestones(id, name, status, target_date, phase_number),
        program_risks(id, title, likelihood, impact, status, phase_number)
      `)
      .eq('id', engagementId);
    if (clientUUID) query = query.eq('client_id', clientUUID);
    const { data: engagement, error: engError } = await query.single();

    if (engError || !engagement) return null;

    const engagementRow: EngagementPhaseData['engagement'] = {
      ...(engagement as Omit<EngagementPhaseData['engagement'], 'sponsor' | 'lead'>),
      sponsor: null,
      lead: null,
    };
    const personIds = [
      engagementRow.sponsor_person_id,
      engagementRow.maestro_person_id,
    ].filter((value): value is string => Boolean(value));
    let peopleById = new Map<string, { name: string; role: string | null }>();
    if (personIds.length > 0) {
      const { data: people } = await supabase
        .from('persons')
        .select('id, name, role')
        .in('id', personIds);
      peopleById = new Map(
        ((people as Array<{ id: string; name: string; role: string | null }> | null) ?? [])
          .map((person) => [person.id, { name: person.name, role: person.role }]),
      );
    }
    engagementRow.sponsor = engagementRow.sponsor_person_id
      ? peopleById.get(engagementRow.sponsor_person_id) ?? null
      : null;
    engagementRow.lead = engagementRow.maestro_person_id
      ? peopleById.get(engagementRow.maestro_person_id) ?? null
      : null;

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

    const [{ data: programEvidenceItems }, { data: deliverables }, { data: auditLogs }] =
      await Promise.all([
        supabase
          .from('program_evidence_items')
          .select('id, phase, evidence_type, title, summary, confidence, created_at')
          .eq('program_id', engagementId)
          .order('created_at', { ascending: false })
          .limit(20),
        supabase
          .from('deliverables_v2')
          .select('id, deliverable_type_key, title, status, updated_at')
          .eq('engagement_id', engagementId)
          .order('updated_at', { ascending: false })
          .limit(20),
        supabase
          .from('program_audit_log')
          .select('id, action, from_state, to_state, rationale, created_at')
          .eq('engagement_id', engagementId)
          .order('created_at', { ascending: false })
          .limit(20),
      ]);

    return {
      engagement: engagementRow,
      evidence: (evidence as EngagementPhaseData['evidence'] | null) ?? [],
      programEvidenceItems:
        (programEvidenceItems as EngagementPhaseData['programEvidenceItems'] | null) ?? [],
      deliverables: (deliverables as EngagementPhaseData['deliverables'] | null) ?? [],
      auditLogs: (auditLogs as EngagementPhaseData['auditLogs'] | null) ?? [],
      gateApprovals,
      modules: (modules as EngagementPhaseData['modules'] | null) ?? [],
    };
  } catch {
    return null;
  }
}
