import { selectHomeAttentionReadAdapter } from '@/lib/data-plane/read-adapters/homeAttentionReadAdapter';

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

export async function loadHomeAttention(limit = 6, clientId?: string | null): Promise<HomeAttention> {
  const reads = selectHomeAttentionReadAdapter();

  // ── Alerts: open contradictions + gate-pending engagements ─────────────
  const alerts: HomeAlert[] = [];

  try {
    const contradictions = await reads.getOpenContradictions(limit, clientId);

    for (const c of contradictions) {
      alerts.push({
        id: c.id,
        kind: 'contradiction',
        severity: c.severity,
        clientId: c.client?.id ?? c.client_id,
        clientName: c.client?.name ?? null,
        summary: c.contradiction_type.replace(/_/g, ' '),
        detail: c.description,
        href: c.triggered_engagement_id
          ? `/engagements/${encodeURIComponent(c.triggered_engagement_id)}`
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
    const activeRows = await reads.getActiveEngagements(clientId);

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
            href: `/engagements/${encodeURIComponent(e.graph_node_id)}`,
          });
          break;
        }
      }
    }

    // Most recent turns — flag those where the last turn is user-sent (agent
    // hasn't responded yet).
    if (activeRows.length > 0) {
      const ids = activeRows.map((e) => e.id);
      const lastTurns = await reads.getRecentTurns(ids);

      const seen = new Set<string>();
      const lastPerEng: Record<string, { sender: string; created_at: string }> = {};
      for (const t of lastTurns) {
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
            href: `/engagements/${encodeURIComponent(e.graph_node_id)}`,
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
