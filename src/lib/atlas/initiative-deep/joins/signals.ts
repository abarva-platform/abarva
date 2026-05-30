// Join: signals affecting this initiative.
//
// `signal_firings` is tenant-scoped (`client_id`) and carries optional
// `engagement_id` / `use_case_id` FKs — no direct `initiative_id`. So this
// join surfaces:
//
//   - signals firing for the tenant that reference the engagement linked to
//     this initiative (when one is linked via `engagements.metadata`);
//   - PLUS the active high-severity signals for the tenant overall (capped
//     small), so the composer can include "and a portfolio-level signal
//     also touches this initiative" context. Each signal is labelled with
//     its `signal_catalog.title` so the composer can filter further.
//
// The output is a small list (≤ 10) — composer decides what to surface. We
// NEVER fabricate a signal.

import type { PostgresCompatClient } from '@/lib/data-plane/postgresCompat';
import type { AtlasTenancyCtx, InitiativeSignal } from '../types';
import { findEngagementForInitiative } from './gates';

interface SignalRow {
  id: string;
  client_id: string;
  severity: string | null;
  headline: string | null;
  state: string | null;
  signal_catalog: { title: string | null } | null;
}

/** Map the persisted severity strings to the deep-view enum. */
function mapSeverity(value: string | null): InitiativeSignal['severity'] {
  const s = (value ?? '').toLowerCase();
  if (s === 'critical') return 'critical';
  if (s === 'high' || s === 'warning') return 'high';
  if (s === 'medium' || s === 'med') return 'medium';
  return 'low';
}

/**
 * Load signals affecting this initiative. Tenant-scoped on every read.
 *
 * Strategy:
 *   1. Resolve the engagement (if any) linked via `engagements.metadata->>'initiative_id'`.
 *   2. Pull active signal_firings for the tenant scoped to that engagement.
 *   3. Pull the tenant's top active signals as a small backfill.
 *   4. De-duplicate by id.
 */
export async function loadSignalsForInitiative(
  client: PostgresCompatClient,
  initiativeId: string,
  ctx: AtlasTenancyCtx,
): Promise<InitiativeSignal[]> {
  const engagement = await findEngagementForInitiative(client, initiativeId, ctx);

  const out: InitiativeSignal[] = [];
  const seen = new Set<string>();

  if (engagement) {
    try {
      const { data } = await client
        .from('signal_firings')
        .select('id, client_id, severity, headline, state, signal_catalog:signal_catalog_id(title)')
        .eq('client_id', ctx.clientId)
        .eq('engagement_id', engagement.id)
        .in('state', ['new', 'triaged', 'actioned'])
        .order('fired_at', { ascending: false })
        .limit(10);
      for (const row of (data as SignalRow[] | null) ?? []) {
        if (seen.has(row.id)) continue;
        seen.add(row.id);
        out.push({
          signalId: row.id,
          severity: mapSeverity(row.severity),
          summary: row.signal_catalog?.title ?? row.headline ?? 'Signal',
        });
      }
    } catch {
      // tower / signal_firings absent — fall through to portfolio scan.
    }
  }

  // Portfolio-level backfill: tenant's most-recent active signals, capped low.
  try {
    const { data } = await client
      .from('signal_firings')
      .select('id, client_id, severity, headline, state, signal_catalog:signal_catalog_id(title)')
      .eq('client_id', ctx.clientId)
      .in('state', ['new', 'triaged'])
      .order('fired_at', { ascending: false })
      .limit(5);
    for (const row of (data as SignalRow[] | null) ?? []) {
      if (seen.has(row.id)) continue;
      seen.add(row.id);
      out.push({
        signalId: row.id,
        severity: mapSeverity(row.severity),
        summary: row.signal_catalog?.title ?? row.headline ?? 'Signal',
      });
      if (out.length >= 10) break;
    }
  } catch {
    // empty backfill — honest empty.
  }

  return out;
}
