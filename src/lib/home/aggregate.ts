import { getServerSupabase } from '@/lib/supabase-server';

// Home page attention aggregator — what the signed-in user should look at
// today. Spec: alerts needing attention + queue of things awaiting their
// input. Empty-safe: every loader returns [] on error so the page renders.

export interface HomeAlert {
  id: string;
  kind: 'contradiction' | 'gate_pending' | 'data_gap';
  severity: 'high' | 'medium' | 'low';
  clientId: string | null;
  clientName: string | null;
  summary: string;
  detail: string | null;
  href: string;
  detectedAt: string;
}

export interface HomeQueueItem {
  id: string;
  engagementId: string;
  engagementName: string;
  kind: 'awaiting_response' | 'gate_pending' | 'phase_advance';
  detail: string;
  updatedAt: string;
  href: string;
}

export interface HomeAttention {
  alerts: HomeAlert[];
  queue: HomeQueueItem[];
}

function sevOrder(s: string): number {
  if (s === 'high') return 0;
  if (s === 'medium') return 1;
  return 2;
}

export async function loadHomeAttention(limit = 6): Promise<HomeAttention> {
  const sb = getServerSupabase();

  // ── Alerts: open contradictions + gate-pending engagements ─────────────
  const alerts: HomeAlert[] = [];

  try {
    const { data: contradictions } = await sb
      .from('contradictions')
      .select('id, client_id, contradiction_type, severity, description, detected_at, triggered_engagement_id, client:clients(id, name)')
      .is('resolved_at', null)
      .order('detected_at', { ascending: false })
      .limit(limit);

    for (const c of (contradictions as Array<{
      id: string;
      client_id: string | null;
      contradiction_type: string;
      severity: 'high' | 'medium' | 'low';
      description: string;
      detected_at: string;
      triggered_engagement_id: string | null;
      client: { id: string; name: string } | null;
    }> | null) ?? []) {
      alerts.push({
        id: c.id,
        kind: 'contradiction',
        severity: c.severity,
        clientId: c.client?.id ?? c.client_id,
        clientName: c.client?.name ?? null,
        summary: c.contradiction_type.replace(/_/g, ' '),
        detail: c.description,
        href: c.triggered_engagement_id
          ? `/engage/${encodeURIComponent(c.triggered_engagement_id)}`
          : c.client?.id
            ? `/tower?clientId=${encodeURIComponent(c.client.id)}`
            : '/tower',
        detectedAt: c.detected_at,
      });
    }
  } catch (err) {
    console.warn('[home.alerts.contradictions]', err);
  }

  // ── Queue: engagements awaiting maestro response (last turn by user) ──
  const queue: HomeQueueItem[] = [];

  try {
    const { data: actives } = await sb
      .from('engagements')
      .select('id, graph_node_id, name, current_phase, status, updated_at, gates_passed')
      .eq('status', 'active')
      .order('updated_at', { ascending: false })
      .limit(30);

    const activeRows = (actives as Array<{
      id: string;
      graph_node_id: string;
      name: string;
      current_phase: number;
      status: string;
      updated_at: string;
      gates_passed: unknown[] | null;
    }> | null) ?? [];

    // Pending gates
    for (const e of activeRows) {
      const passed = Array.isArray(e.gates_passed) ? e.gates_passed : [];
      for (const g of passed) {
        if (typeof g !== 'object' || g === null) continue;
        const gate = g as Record<string, unknown>;
        const approved =
          Boolean(gate.approved_at) ||
          Boolean(gate.approved_by) ||
          gate.status === 'approved';
        if (!approved) {
          queue.push({
            id: `gate-${e.id}-${String(gate.phase ?? '?')}`,
            engagementId: e.id,
            engagementName: e.name,
            kind: 'gate_pending',
            detail: `Phase ${gate.phase ?? '?'} gate awaiting approval`,
            updatedAt: e.updated_at,
            href: `/engage/${encodeURIComponent(e.graph_node_id)}`,
          });
          break;
        }
      }
    }

    // Most recent turns — flag those where the last turn is user-sent (agent
    // hasn't responded yet).
    if (activeRows.length > 0) {
      const ids = activeRows.map((e) => e.id);
      const { data: lastTurns } = await sb
        .from('turns')
        .select('engagement_id, sender, created_at')
        .in('engagement_id', ids)
        .order('created_at', { ascending: false })
        .limit(60);

      const seen = new Set<string>();
      const lastPerEng: Record<string, { sender: string; created_at: string }> = {};
      for (const t of (lastTurns as Array<{ engagement_id: string; sender: string; created_at: string }> | null) ?? []) {
        if (seen.has(t.engagement_id)) continue;
        seen.add(t.engagement_id);
        lastPerEng[t.engagement_id] = { sender: t.sender, created_at: t.created_at };
      }

      for (const e of activeRows) {
        const last = lastPerEng[e.id];
        if (last && last.sender === 'user') {
          queue.push({
            id: `awaiting-${e.id}`,
            engagementId: e.id,
            engagementName: e.name,
            kind: 'awaiting_response',
            detail: 'Sponsor message waiting',
            updatedAt: last.created_at,
            href: `/engage/${encodeURIComponent(e.graph_node_id)}`,
          });
        }
      }
    }
  } catch (err) {
    console.warn('[home.queue]', err);
  }

  alerts.sort((a, b) => sevOrder(a.severity) - sevOrder(b.severity));
  queue.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  return {
    alerts: alerts.slice(0, limit),
    queue: queue.slice(0, limit),
  };
}
