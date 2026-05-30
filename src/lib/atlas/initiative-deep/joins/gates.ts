// Join: gate passes + upcoming gate.
//
// Gate state in this codebase lives on `engagement_phases` (`gate_type`,
// `approvers_required`, `approvals_received`) and the per-criterion substrate
// (`gate_criteria`, `gate_criterion_states`). Both are keyed to
// `engagement_id`. An `ai_initiatives` row is NOT directly FK-linked to an
// engagement — the registry holds the high-level AI initiative, the
// engagement holds the originated Move.
//
// Best-effort link: when origination wrote the initiative_id into the
// engagement's `metadata` jsonb (the convention used by p18 reconciliation
// and other backfill paths), we can resolve the engagement and read its
// gate history. When no engagement is linked, we surface an empty
// `{ passed: [], upcoming: null }` — honestly.
//
// Tenant scope: every read is filtered by `client_id`.

import type { PostgresCompatClient } from '@/lib/data-plane/postgresCompat';
import type { AtlasTenancyCtx, InitiativeGates } from '../types';

interface EngagementForInitiativeRow {
  id: string;
  client_id: string;
  name: string | null;
  current_phase: number | null;
  metadata: Record<string, unknown> | null;
}

interface GateApprovalRow {
  phase_id: string;
  approved_at: string | null;
  approver_role: string | null;
  phase_name: string | null;
  phase_index: number | null;
}

/**
 * Resolve the engagement linked to an initiative, when one exists. Tenant
 * scope is enforced: we only consider engagements belonging to the caller's
 * tenant.
 *
 * Returns `null` when no engagement carries this initiative_id in metadata —
 * the honest "this AI initiative was not (yet) originated as a Move" state.
 */
export async function findEngagementForInitiative(
  client: PostgresCompatClient,
  initiativeId: string,
  ctx: AtlasTenancyCtx,
): Promise<EngagementForInitiativeRow | null> {
  try {
    // PostgREST supports `->>` JSON path filters via the `.eq` builder.
    const { data, error } = await client
      .from('engagements')
      .select('id, client_id, name, current_phase, metadata')
      .eq('client_id', ctx.clientId)
      .eq('metadata->>initiative_id', initiativeId)
      .limit(1)
      .maybeSingle();
    if (error || !data) return null;
    return data as EngagementForInitiativeRow;
  } catch {
    return null;
  }
}

/**
 * Load passed-gate approvals + the next upcoming gate for an engagement.
 *
 * Returns an empty result on any error or missing engagement.
 */
export async function loadGatesForEngagement(
  client: PostgresCompatClient,
  engagement: EngagementForInitiativeRow,
): Promise<InitiativeGates> {
  try {
    const { data, error } = await client
      .from('phase_approvals')
      .select('phase_id, approved_at, approver_role, phase_name, phase_index')
      .eq('engagement_id', engagement.id)
      .order('approved_at', { ascending: true });

    if (error || !data) {
      return { passed: [], upcoming: null };
    }

    const rows = data as GateApprovalRow[];
    const passed = rows
      .filter((row) => row.approved_at !== null)
      .map((row) => ({
        name: row.phase_name ?? `Gate ${row.phase_index ?? '?'}`,
        passedOn: row.approved_at ?? '',
        approverRole: row.approver_role ?? '',
      }));

    // The next gate is the lowest-indexed phase that is not yet approved.
    const upcoming = await loadUpcomingGate(client, engagement);

    return { passed, upcoming };
  } catch {
    return { passed: [], upcoming: null };
  }
}

interface PhaseRow {
  id: string;
  engagement_id: string;
  phase_index: number | null;
  phase_name: string | null;
  due_by: string | null;
  status: string | null;
}

async function loadUpcomingGate(
  client: PostgresCompatClient,
  engagement: EngagementForInitiativeRow,
): Promise<InitiativeGates['upcoming']> {
  try {
    const { data, error } = await client
      .from('engagement_phases')
      .select('id, engagement_id, phase_index, phase_name, due_by, status')
      .eq('engagement_id', engagement.id)
      .neq('status', 'approved')
      .order('phase_index', { ascending: true })
      .limit(1)
      .maybeSingle();
    if (error || !data) return null;
    const row = data as PhaseRow;
    return {
      name: row.phase_name ?? `Gate ${row.phase_index ?? '?'}`,
      dueBy: row.due_by ?? null,
    };
  } catch {
    return null;
  }
}

/**
 * Convenience wrapper used by the orchestrator: resolve the engagement
 * (tenant-scoped) and return its gates. Empty gates when no engagement is
 * linked — the honest "not yet originated" state.
 */
export async function loadGatesForInitiative(
  client: PostgresCompatClient,
  initiativeId: string,
  ctx: AtlasTenancyCtx,
): Promise<InitiativeGates> {
  const engagement = await findEngagementForInitiative(client, initiativeId, ctx);
  if (!engagement) return { passed: [], upcoming: null };
  return loadGatesForEngagement(client, engagement);
}
