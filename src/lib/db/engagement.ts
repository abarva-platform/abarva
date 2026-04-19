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

export interface EngagementListItem {
  id: string;
  graph_node_id: string;
  name: string;
  industry_code: string;
  current_phase: number;
  status: string;
  updated_at: string;
  sponsor_name: string | null;
  sponsor_role: string | null;
}

export interface DashboardMetrics {
  activeCount: number;
  trackedSavingsUsd: number;
  gatesPending: number;
  outcomeFeesQuarterUsd: number;
}

type ActiveEngagementJoinRow = {
  id: string;
  graph_node_id: string;
  name: string;
  industry_code: string;
  current_phase: number;
  status: string;
  updated_at: string;
  sponsor_person_id: string | null;
  sponsor: { name: string | null; role: string | null } | null;
};

export async function getAllActiveEngagements(): Promise<EngagementListItem[]> {
  const { data, error } = await getServerSupabase()
    .from('engagements')
    .select(
      'id, graph_node_id, name, industry_code, current_phase, status, updated_at, sponsor_person_id, sponsor:persons!engagements_sponsor_person_id_fkey(name, role)',
    )
    .eq('status', 'active')
    .order('updated_at', { ascending: false });
  if (error) throw error;
  const rows = (data ?? []) as unknown as ActiveEngagementJoinRow[];
  return rows.map((r) => ({
    id: r.id,
    graph_node_id: r.graph_node_id,
    name: r.name,
    industry_code: r.industry_code,
    current_phase: r.current_phase,
    status: r.status,
    updated_at: r.updated_at,
    sponsor_name: r.sponsor?.name ?? null,
    sponsor_role: r.sponsor?.role ?? null,
  }));
}

function quarterStartIso(now = new Date()): string {
  const q = Math.floor(now.getUTCMonth() / 3);
  return new Date(Date.UTC(now.getUTCFullYear(), q * 3, 1)).toISOString();
}

function jsonNumber(obj: Record<string, unknown> | null, key: string): number {
  if (!obj) return 0;
  const v = obj[key];
  return typeof v === 'number' && Number.isFinite(v) ? v : 0;
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const sb = getServerSupabase();

  const { data: active, error: activeErr } = await sb
    .from('engagements')
    .select('id, current_phase, baseline_metrics, actual_metrics, gates_passed')
    .eq('status', 'active');
  if (activeErr) throw activeErr;
  const activeRows = (active ?? []) as Array<{
    current_phase: number;
    baseline_metrics: Record<string, unknown> | null;
    actual_metrics: Record<string, unknown> | null;
    gates_passed: unknown[] | null;
  }>;

  const activeCount = activeRows.length;

  // Honest savings: only contribute when both baseline + actual have the key. No fabrication.
  let trackedSavingsUsd = 0;
  for (const r of activeRows) {
    const base = jsonNumber(r.baseline_metrics, 'savings_usd');
    const actual = jsonNumber(r.actual_metrics, 'savings_usd');
    if (base > 0 && actual > 0) trackedSavingsUsd += actual - base;
  }

  // Gates pending: active engagements whose current-phase gate is not in gates_passed
  let gatesPending = 0;
  for (const r of activeRows) {
    const passed = Array.isArray(r.gates_passed) ? r.gates_passed : [];
    const currentGateSigned = passed.some(
      (g) => typeof g === 'object' && g !== null && (g as Record<string, unknown>).phase === r.current_phase,
    );
    if (!currentGateSigned) gatesPending += 1;
  }

  // Outcome fees: SUM approved outcome_fee_usd this quarter (across any status)
  const { data: fees, error: feeErr } = await sb
    .from('engagements')
    .select('outcome_fee_usd, outcome_fee_status, updated_at')
    .eq('outcome_fee_status', 'approved')
    .gte('updated_at', quarterStartIso());
  if (feeErr) throw feeErr;
  const outcomeFeesQuarterUsd = ((fees ?? []) as Array<{ outcome_fee_usd: number | null }>).reduce(
    (acc, row) => acc + (typeof row.outcome_fee_usd === 'number' ? row.outcome_fee_usd : 0),
    0,
  );

  return { activeCount, trackedSavingsUsd, gatesPending, outcomeFeesQuarterUsd };
}
