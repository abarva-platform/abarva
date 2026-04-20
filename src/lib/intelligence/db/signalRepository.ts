// portfolio_signals CRUD + async generator pulling from contradictions.

import { assertTenancy, getIntelSupabase } from './client';
import type { PortfolioSignal, SignalCategory, SignalSeverity, TenancyCtx } from '../types';

interface SignalRow {
  id: string;
  client_id: string;
  category: SignalCategory;
  severity: SignalSeverity;
  headline: string;
  context_jsonb: Record<string, unknown> | null;
  source_contradiction_id: string | null;
  affected_engagement_ids: string[] | null;
  sponsor_notified: boolean;
  fired_at: string;
  resolved_at: string | null;
  dismissed_at: string | null;
  dismissed_by_user_id: string | null;
}

function rowToSignal(r: SignalRow): PortfolioSignal {
  return {
    id: r.id,
    clientId: r.client_id,
    category: r.category,
    severity: r.severity,
    headline: r.headline,
    context: r.context_jsonb ?? {},
    sourceContradictionId: r.source_contradiction_id,
    affectedEngagementIds: r.affected_engagement_ids ?? [],
    sponsorNotified: r.sponsor_notified,
    firedAt: r.fired_at,
    resolvedAt: r.resolved_at,
    dismissedAt: r.dismissed_at,
    dismissedByUserId: r.dismissed_by_user_id,
  };
}

const SEVERITY_ORDER: Record<SignalSeverity, number> = { critical: 0, warning: 1, info: 2 };

export async function listSignals(
  ctx: TenancyCtx,
  opts: { minSeverity?: SignalSeverity; limit?: number } = {},
): Promise<PortfolioSignal[]> {
  assertTenancy(ctx);
  const sb = getIntelSupabase();
  const limit = opts.limit ?? 20;
  const { data, error } = await sb
    .from('portfolio_signals')
    .select('*')
    .eq('client_id', ctx.clientId)
    .is('resolved_at', null)
    .is('dismissed_at', null)
    .order('fired_at', { ascending: false })
    .limit(200);
  if (error) throw error;
  const all = (data as SignalRow[] | null ?? []).map(rowToSignal);
  const filtered = opts.minSeverity
    ? all.filter((s) => SEVERITY_ORDER[s.severity] <= SEVERITY_ORDER[opts.minSeverity!])
    : all;
  return filtered
    .sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity] || b.firedAt.localeCompare(a.firedAt))
    .slice(0, limit);
}

export async function getSignal(ctx: TenancyCtx, signalId: string): Promise<PortfolioSignal | null> {
  assertTenancy(ctx);
  const sb = getIntelSupabase();
  const { data, error } = await sb
    .from('portfolio_signals')
    .select('*')
    .eq('id', signalId)
    .eq('client_id', ctx.clientId)
    .maybeSingle();
  if (error) throw error;
  return data ? rowToSignal(data as SignalRow) : null;
}

export async function dismissSignal(ctx: TenancyCtx, signalId: string): Promise<void> {
  assertTenancy(ctx);
  const sb = getIntelSupabase();
  const { error } = await sb
    .from('portfolio_signals')
    .update({ dismissed_at: new Date().toISOString(), dismissed_by_user_id: ctx.userId })
    .eq('id', signalId)
    .eq('client_id', ctx.clientId);
  if (error) throw error;
}

export async function resolveSignal(ctx: TenancyCtx, signalId: string): Promise<void> {
  assertTenancy(ctx);
  const sb = getIntelSupabase();
  const { error } = await sb
    .from('portfolio_signals')
    .update({ resolved_at: new Date().toISOString() })
    .eq('id', signalId)
    .eq('client_id', ctx.clientId);
  if (error) throw error;
}

export async function createSignal(
  ctx: TenancyCtx,
  input: {
    category: SignalCategory;
    severity: SignalSeverity;
    headline: string;
    context?: Record<string, unknown>;
    sourceContradictionId?: string | null;
    affectedEngagementIds?: string[];
    sponsorNotified?: boolean;
  },
): Promise<PortfolioSignal> {
  assertTenancy(ctx);
  const sb = getIntelSupabase();
  const { data, error } = await sb
    .from('portfolio_signals')
    .insert({
      client_id: ctx.clientId,
      category: input.category,
      severity: input.severity,
      headline: input.headline,
      context_jsonb: input.context ?? {},
      source_contradiction_id: input.sourceContradictionId ?? null,
      affected_engagement_ids: input.affectedEngagementIds ?? [],
      sponsor_notified: input.sponsorNotified ?? false,
    })
    .select('*')
    .single();
  if (error) throw error;
  return rowToSignal(data as SignalRow);
}

/**
 * Sync portfolio_signals from the existing contradictions table. Idempotent
 * via matching on source_contradiction_id. Called by the async signal
 * generator (intended to run every 15 minutes — see spec §4.1).
 */
export async function syncFromContradictions(clientId: string): Promise<{ inserted: number; skipped: number }> {
  const sb = getIntelSupabase();
  const { data: contras, error: cErr } = await sb
    .from('contradictions')
    .select('id, client_id, contradiction_type, severity, summary, impact, use_case_id')
    .eq('client_id', clientId)
    .is('resolved_at', null);
  if (cErr) throw cErr;

  const rows = (contras as Array<{
    id: string;
    client_id: string;
    contradiction_type: string;
    severity: string | null;
    summary: string | null;
    impact: Record<string, unknown> | null;
    use_case_id: string | null;
  }> | null) ?? [];

  let inserted = 0;
  let skipped = 0;
  for (const c of rows) {
    const { data: existing } = await sb
      .from('portfolio_signals')
      .select('id')
      .eq('source_contradiction_id', c.id)
      .maybeSingle();
    if (existing) {
      skipped += 1;
      continue;
    }
    const severity: SignalSeverity = c.severity === 'high' ? 'critical' : c.severity === 'medium' ? 'warning' : 'info';
    const headline = c.summary ?? `Contradiction · ${c.contradiction_type}`;
    const { error } = await sb
      .from('portfolio_signals')
      .insert({
        client_id: c.client_id,
        category: 'contradiction',
        severity,
        headline,
        context_jsonb: c.impact ?? {},
        source_contradiction_id: c.id,
        affected_engagement_ids: [],
        sponsor_notified: false,
      });
    if (error) throw error;
    inserted += 1;
  }
  return { inserted, skipped };
}
