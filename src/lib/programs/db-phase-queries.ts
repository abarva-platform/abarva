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

import { azureRead } from '@/lib/data-plane/azureRead';
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
    /** Origination charter JSONB. Includes initiative_context with the
     *  AI initiative display ID when the Move was originated from an
     *  Intelligence pattern or initiative page. Null for legacy Moves. */
    charter: Record<string, unknown> | null;
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

type EngagementRow = Omit<
  EngagementPhaseData['engagement'],
  'sponsor' | 'lead' | 'program_milestones' | 'program_risks'
> & {
  client_id: string;
};

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
    const [engagement, milestones, risks] = await Promise.all([
      azureRead.maybeSingle<EngagementRow>({
        table: 'engagements',
        columns: [
          'id',
          'client_id',
          'name',
          'status',
          'lifecycle_state',
          'current_phase',
          'program_archetype',
          'maestro_oversight_level',
          'sponsor_person_id',
          'maestro_person_id',
          'charter',
        ],
        where: {
          id: engagementId,
          ...(clientUUID ? { client_id: clientUUID } : {}),
        },
      }),
      azureRead.select<EngagementPhaseData['engagement']['program_milestones'][number]>({
        table: 'program_milestones',
        columns: ['id', 'name', 'status', 'target_date', 'phase_number'],
        where: { engagement_id: engagementId },
      }),
      azureRead.select<EngagementPhaseData['engagement']['program_risks'][number]>({
        table: 'program_risks',
        columns: ['id', 'title', 'likelihood', 'impact', 'status', 'phase_number'],
        where: { engagement_id: engagementId },
      }),
    ]);

    if (!engagement) return null;

    const engagementRow: EngagementPhaseData['engagement'] = {
      ...engagement,
      program_milestones: milestones,
      program_risks: risks,
      sponsor: null,
      lead: null,
    };
    const personIds = [
      engagementRow.sponsor_person_id,
      engagementRow.maestro_person_id,
    ].filter((value): value is string => Boolean(value));
    let peopleById = new Map<string, { name: string; role: string | null }>();
    if (personIds.length > 0) {
      const people = await azureRead.select<{ id: string; name: string; role: string | null }>({
        table: 'persons',
        columns: ['id', 'name', 'role'],
        where: { id: { op: 'in', value: personIds } },
      });
      peopleById = new Map(
        people.map((person) => [person.id, { name: person.name, role: person.role }]),
      );
    }
    engagementRow.sponsor = engagementRow.sponsor_person_id
      ? peopleById.get(engagementRow.sponsor_person_id) ?? null
      : null;
    engagementRow.lead = engagementRow.maestro_person_id
      ? peopleById.get(engagementRow.maestro_person_id) ?? null
      : null;

    // Evidence linked by related_entity_id — this is the real schema shape
    const evidence = await azureRead.select<EngagementPhaseData['evidence'][number]>({
      table: 'evidence',
      columns: ['id', 'summary', 'evidence_type', 'confidence_level', 'observed_at', 'created_at'],
      where: { related_entity_id: engagementId, related_entity_type: 'engagement' },
      orderBy: { column: 'created_at', direction: 'desc' },
      limit: 10,
    });

    // Phase approvals via engagement_phases join
    // phase_approvals doesn't have a direct engagement_id column; join through
    // engagement_phases which does.
    const phases = await azureRead.select<{ id: string }>({
      table: 'engagement_phases',
      columns: ['id'],
      where: { engagement_id: engagementId },
    });

    let gateApprovals: EngagementPhaseData['gateApprovals'] = [];
    if (phases && phases.length > 0) {
      const phaseIds = phases.map((p) => p.id);
      gateApprovals = await azureRead.select<EngagementPhaseData['gateApprovals'][number]>({
        table: 'phase_approvals',
        columns: ['id', 'action', 'actor_name', 'created_at'],
        where: { phase_id: { op: 'in', value: phaseIds } },
        orderBy: { column: 'created_at', direction: 'desc' },
      });
    }

    // Module status
    const modules = await azureRead.select<EngagementPhaseData['modules'][number]>({
      table: 'program_modules',
      columns: ['module_key', 'status'],
      where: { engagement_id: engagementId },
    });

    const [programEvidenceItems, deliverables, auditLogs] =
      await Promise.all([
        azureRead.select<EngagementPhaseData['programEvidenceItems'][number]>({
          table: 'program_evidence_items',
          columns: ['id', 'phase', 'evidence_type', 'title', 'summary', 'confidence', 'created_at'],
          where: { program_id: engagementId },
          orderBy: { column: 'created_at', direction: 'desc' },
          limit: 20,
        }),
        azureRead.select<EngagementPhaseData['deliverables'][number]>({
          table: 'deliverables_v2',
          columns: ['id', 'deliverable_type_key', 'title', 'status', 'updated_at'],
          where: { engagement_id: engagementId },
          orderBy: { column: 'updated_at', direction: 'desc' },
          limit: 20,
        }),
        azureRead.select<EngagementPhaseData['auditLogs'][number]>({
          table: 'program_audit_log',
          columns: ['id', 'action', 'from_state', 'to_state', 'rationale', 'created_at'],
          where: { engagement_id: engagementId },
          orderBy: { column: 'created_at', direction: 'desc' },
          limit: 20,
        }),
      ]);

    return {
      engagement: engagementRow,
      evidence,
      programEvidenceItems,
      deliverables,
      auditLogs,
      gateApprovals,
      modules,
    };
  } catch {
    return null;
  }
}
