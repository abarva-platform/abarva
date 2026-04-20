import { getServerSupabase } from '@/lib/supabase-server';

// Density-plan · engagements list · rich per-card summary data.
// For each engagement, pull:
//   - deliverables count + top deliverable's % complete
//   - last turn timestamp + total turn count
//   - assigned topics count + primary topic title
//   - contradictions count for the engagement's client
//   - value_at_stake estimate (baseline.savings_usd * 18mo or outcome deliverable)
//   - baseline_locked_at (Phase 2 gate approval date when available)
//   - next gate date (estimated 30d from phase advance, or from baseline)
//
// Empty-safe · every field falls back to null when its source isn't
// populated. Prat's demo engagement (Meridian demo seed) will show
// fully populated; fresh engagements show partial.

export interface EngagementSummaryExtras {
  engagementId: string;
  deliverablesCount: number;
  topDeliverableType: string | null;
  topDeliverableQuality: number | null;
  turnCount: number;
  lastTurnAt: string | null;
  assignedTopicsCount: number;
  primaryTopicTitle: string | null;
  contradictionsCount: number;
  valueAtStakeUsd: number | null;
  baselineLockedAt: string | null;
  nextGateDate: string | null;
  clientId: string | null;
  clientScale: { employees: number | null; revenue_usd: number | null } | null;
}

function jsonNumber(obj: Record<string, unknown> | null | undefined, key: string): number {
  if (!obj) return 0;
  const v = obj[key];
  return typeof v === 'number' && Number.isFinite(v) ? v : 0;
}

export async function loadEngagementSummaries(
  engagementIds: string[],
): Promise<Record<string, EngagementSummaryExtras>> {
  if (engagementIds.length === 0) return {};
  const sb = getServerSupabase();
  const out: Record<string, EngagementSummaryExtras> = {};

  // ── Engagements meta in one round-trip (deliverables JSONB, baseline,
  //    actual metrics, gates_passed, client linkage) ─────────────────────
  const { data: engRows } = await sb
    .from('engagements')
    .select('id, client_id, deliverables, baseline_metrics, actual_metrics, gates_passed, current_phase')
    .in('id', engagementIds);

  const clientIds = new Set<string>();
  for (const e of (engRows as Array<{
    id: string;
    client_id: string | null;
    deliverables: Array<Record<string, unknown>> | null;
    baseline_metrics: Record<string, unknown> | null;
    actual_metrics: Record<string, unknown> | null;
    gates_passed: unknown[] | null;
    current_phase: number;
  }> | null) ?? []) {
    const deliverables = Array.isArray(e.deliverables) ? e.deliverables : [];
    const topDeliverable = deliverables[0] as { type?: string; content?: { quality_score?: number } } | undefined;

    // Baseline locked · Phase 2 gate approval date (phase advancement from
    // 2 → 3 locks the baseline per AbarVa's outcome-accountable model).
    const gates = (e.gates_passed as Array<{ phase?: number; signed_at?: string; status?: string }> | null) ?? [];
    const phase2Gate = gates.find((g) => g.phase === 2 && g.status === 'approved');
    const baselineLockedAt = phase2Gate?.signed_at ?? null;

    // Value at stake · annualize baseline savings forecast, or 18mo if no
    // clearer proxy exists
    const baselineSavings = jsonNumber(e.baseline_metrics, 'savings_usd');
    const valueAtStake = baselineSavings > 0 ? baselineSavings : null;

    // Next gate estimate · + 30d from last gate signed_at
    const latestGate = gates
      .filter((g) => g.status === 'approved' && typeof g.signed_at === 'string')
      .sort((a, b) => (b.signed_at ?? '').localeCompare(a.signed_at ?? ''))[0];
    const nextGateDate = latestGate?.signed_at
      ? new Date(new Date(latestGate.signed_at).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
      : null;

    out[e.id] = {
      engagementId: e.id,
      deliverablesCount: deliverables.length,
      topDeliverableType: topDeliverable?.type ?? null,
      topDeliverableQuality: typeof topDeliverable?.content?.quality_score === 'number'
        ? topDeliverable.content.quality_score
        : null,
      turnCount: 0,
      lastTurnAt: null,
      assignedTopicsCount: 0,
      primaryTopicTitle: null,
      contradictionsCount: 0,
      valueAtStakeUsd: valueAtStake,
      baselineLockedAt,
      nextGateDate,
      clientId: e.client_id,
      clientScale: null,
    };
    if (e.client_id) clientIds.add(e.client_id);
  }

  // ── Turn counts + last turn ─────────────────────────────────────────
  try {
    const { data: turnStats } = await sb
      .from('turns')
      .select('engagement_id, created_at')
      .in('engagement_id', engagementIds)
      .order('created_at', { ascending: false });
    const counts = new Map<string, { count: number; last: string }>();
    for (const t of (turnStats as Array<{ engagement_id: string; created_at: string }> | null) ?? []) {
      const prev = counts.get(t.engagement_id);
      if (!prev) counts.set(t.engagement_id, { count: 1, last: t.created_at });
      else counts.set(t.engagement_id, { count: prev.count + 1, last: prev.last });
    }
    for (const [id, stat] of counts.entries()) {
      if (out[id]) {
        out[id].turnCount = stat.count;
        out[id].lastTurnAt = stat.last;
      }
    }
  } catch (err) {
    console.warn('[engagement-summary.turns]', err);
  }

  // ── Assigned topics (count + primary title) ────────────────────────
  try {
    const { data: mapRows } = await sb
      .from('engagement_topics_map')
      .select('engagement_id, topic_key, is_primary')
      .in('engagement_id', engagementIds);
    const topicKeysByEng = new Map<string, Array<{ topic_key: string; is_primary: boolean }>>();
    for (const r of (mapRows as Array<{ engagement_id: string; topic_key: string; is_primary: boolean }> | null) ?? []) {
      const arr = topicKeysByEng.get(r.engagement_id) ?? [];
      arr.push({ topic_key: r.topic_key, is_primary: r.is_primary });
      topicKeysByEng.set(r.engagement_id, arr);
    }

    // Single fetch of all referenced topic titles
    const allKeys = new Set<string>();
    for (const arr of topicKeysByEng.values()) for (const a of arr) allKeys.add(a.topic_key);
    if (allKeys.size > 0) {
      const { data: topicRows } = await sb
        .from('engagement_topics')
        .select('topic_key, title')
        .in('topic_key', Array.from(allKeys));
      const titles = new Map<string, string>();
      for (const t of (topicRows as Array<{ topic_key: string; title: string }> | null) ?? []) {
        titles.set(t.topic_key, t.title);
      }
      for (const [engId, arr] of topicKeysByEng.entries()) {
        if (!out[engId]) continue;
        out[engId].assignedTopicsCount = arr.length;
        const primary = arr.find((a) => a.is_primary) ?? arr[0];
        out[engId].primaryTopicTitle = primary ? titles.get(primary.topic_key) ?? null : null;
      }
    }
  } catch (err) {
    console.warn('[engagement-summary.topics]', err);
  }

  // ── Contradictions + client scale (per client, not per engagement) ──
  if (clientIds.size > 0) {
    const ids = Array.from(clientIds);
    try {
      const { data: contra } = await sb
        .from('contradictions')
        .select('client_id')
        .in('client_id', ids)
        .is('resolved_at', null);
      const counts = new Map<string, number>();
      for (const c of (contra as Array<{ client_id: string }> | null) ?? []) {
        counts.set(c.client_id, (counts.get(c.client_id) ?? 0) + 1);
      }
      for (const engId of Object.keys(out)) {
        const cid = out[engId].clientId;
        if (cid && counts.has(cid)) out[engId].contradictionsCount = counts.get(cid) ?? 0;
      }
    } catch (err) {
      console.warn('[engagement-summary.contradictions]', err);
    }

    try {
      const { data: clients } = await sb
        .from('clients')
        .select('id, employees_count, annual_revenue_usd')
        .in('id', ids);
      const scale = new Map<string, { employees: number | null; revenue_usd: number | null }>();
      for (const c of (clients as Array<{ id: string; employees_count: number | null; annual_revenue_usd: number | null }> | null) ?? []) {
        scale.set(c.id, { employees: c.employees_count, revenue_usd: c.annual_revenue_usd });
      }
      for (const engId of Object.keys(out)) {
        const cid = out[engId].clientId;
        if (cid && scale.has(cid)) out[engId].clientScale = scale.get(cid) ?? null;
      }
    } catch {
      // clients.employees_count + annual_revenue_usd may not exist yet — quiet fail
    }
  }

  return out;
}
