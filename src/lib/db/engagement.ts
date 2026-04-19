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

export interface DecisionEntry {
  summary: string;
  rationale: string;
  decision_maker: string;
  impact: string;
  logged_at?: string;
}

export async function appendDecision(engagementId: string, decision: DecisionEntry): Promise<void> {
  const sb = getServerSupabase();
  const { data: current } = await sb
    .from('engagements')
    .select('decisions')
    .eq('id', engagementId)
    .single();
  const existing = ((current?.decisions as DecisionEntry[] | null) ?? []);
  await sb
    .from('engagements')
    .update({ decisions: [...existing, { ...decision, logged_at: new Date().toISOString() }] })
    .eq('id', engagementId);
}

export async function updateActualMetrics(
  engagementId: string,
  items: Array<{ metric: string; actual_value: string; measurement_date?: string; source?: string }>,
): Promise<void> {
  await getServerSupabase()
    .from('engagements')
    .update({
      actual_metrics: { items, captured_at: new Date().toISOString() },
    })
    .eq('id', engagementId);
}

export async function proposeOutcomeFee(
  engagementId: string,
  feeUsd: number,
): Promise<void> {
  await getServerSupabase()
    .from('engagements')
    .update({ outcome_fee_usd: feeUsd, outcome_fee_status: 'proposed' })
    .eq('id', engagementId);
}

export interface CreateEngagementArgs {
  name: string;
  sponsor_person_id: string;
  industry_code: string;
  function_code: string;
  objective_code: string;
  topic_code: string;
  maestro_person_id?: string | null;
}

export interface RecordGateApprovalArgs {
  engagementId: string;
  phase: number;
  approvedByPersonId: string;
  approvalText: string;
  summary: string;
}

export async function recordGateApproval(args: RecordGateApprovalArgs): Promise<EngagementRow> {
  const sb = getServerSupabase();
  const { data: current, error: readErr } = await sb
    .from('engagements')
    .select('gates_passed, current_phase')
    .eq('id', args.engagementId)
    .single();
  if (readErr) throw readErr;

  const gates = ((current?.gates_passed as Array<Record<string, unknown>> | null) ?? []);
  const existing = gates.find((g) => g.phase === args.phase && g.status === 'approved');
  if (existing) {
    return (await getEngagementById(args.engagementId)) as EngagementRow;
  }

  const newGate = {
    phase: args.phase,
    status: 'approved',
    signed_at: new Date().toISOString(),
    signed_by: args.approvedByPersonId,
    approval_text: args.approvalText,
    summary: args.summary,
  };
  const updatedGates = [...gates.filter((g) => g.phase !== args.phase), newGate];
  const newPhase = Math.min(4, args.phase + 1);

  const { data: updated, error: updateErr } = await sb
    .from('engagements')
    .update({ gates_passed: updatedGates, current_phase: newPhase })
    .eq('id', args.engagementId)
    .select()
    .single();
  if (updateErr) throw updateErr;
  return updated as EngagementRow;
}

export async function createEngagement(args: CreateEngagementArgs): Promise<EngagementRow> {
  const slug = args.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
  const graphNodeId = `eng_${slug}_${Date.now().toString(36)}`;

  const { data, error } = await getServerSupabase()
    .from('engagements')
    .insert({
      graph_node_id: graphNodeId,
      name: args.name,
      industry_code: args.industry_code,
      function_code: args.function_code,
      objective_code: args.objective_code,
      topic_code: args.topic_code,
      sponsor_person_id: args.sponsor_person_id,
      maestro_person_id: args.maestro_person_id ?? null,
      current_phase: 0,
      status: 'active',
      charter: {},
      gates_passed: [],
      decisions: [],
      deliverables: [],
      sponsor_approvals: [],
      baseline_metrics: {},
      actual_metrics: {},
      phase_0_started_at: new Date().toISOString(),
    })
    .select()
    .single();
  if (error) throw error;
  return data as EngagementRow;
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
    .select('id, current_phase, baseline_metrics, actual_metrics, gates_passed, deliverables')
    .eq('status', 'active');
  if (activeErr) throw activeErr;
  const activeRows = (active ?? []) as Array<{
    current_phase: number;
    baseline_metrics: Record<string, unknown> | null;
    actual_metrics: Record<string, unknown> | null;
    gates_passed: unknown[] | null;
    deliverables: Array<Record<string, unknown>> | null;
  }>;

  const activeCount = activeRows.length;

  // Tracked savings in-flight:
  // Prefer the verified savings from outcome_verification deliverables; else fall
  // back to baseline/actual jsonb deltas for engagements not yet at Phase 4.
  let trackedSavingsUsd = 0;
  for (const r of activeRows) {
    const outcome = (r.deliverables ?? []).find((d) => d.type === 'outcome_verification');
    const verified = outcome && typeof (outcome.content as { total_savings_usd?: unknown })?.total_savings_usd === 'number'
      ? ((outcome.content as { total_savings_usd: number }).total_savings_usd)
      : 0;
    if (verified > 0) {
      trackedSavingsUsd += verified;
      continue;
    }
    const base = jsonNumber(r.baseline_metrics, 'savings_usd');
    const actual = jsonNumber(r.actual_metrics, 'savings_usd');
    if (base > 0 && actual > 0) trackedSavingsUsd += actual - base;
  }

  // Gates pending: gate objects that have been submitted (exist in gates_passed)
  // but not yet approved. Fresh engagements with empty gates_passed contribute 0.
  let gatesPending = 0;
  for (const r of activeRows) {
    const passed = Array.isArray(r.gates_passed) ? r.gates_passed : [];
    for (const g of passed) {
      if (typeof g !== 'object' || g === null) continue;
      const gate = g as Record<string, unknown>;
      const approved =
        Boolean(gate.approved_at) ||
        Boolean(gate.approved_by) ||
        gate.status === 'approved';
      if (!approved) gatesPending += 1;
    }
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
