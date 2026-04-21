// Value specialist · quantifies economic impact for Mode 2/3 turns.
// Pulls from structured retrieval (spend_breakdown, applications,
// tech_projects) and emergent cohort aggregates to frame $ opportunity
// + risk. Output feeds the hero sentence + crux condition evaluation.

import { getServerSupabase } from '@/lib/supabase-server';
import type { TenancyCtx } from '@/lib/intelligence/types';
import type { EvidenceClaim } from './evidence';

export interface ValueSignal {
  label: string;
  valueUsd: number | null;
  detail: string;
  source: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface ValueOutput {
  signals: ValueSignal[];
  headline: string | null;
}

export async function runValue(ctx: TenancyCtx, claims: EvidenceClaim[]): Promise<ValueOutput> {
  const sb = getServerSupabase();
  const signals: ValueSignal[] = [];

  try {
    // Top AI-touching tech project spend
    const { data: aiProjects } = await sb
      .from('tech_projects')
      .select('name, total_budget_usd')
      .eq('client_id', ctx.clientId)
      .eq('touches_ai', true);
    const aiTotal = ((aiProjects as Array<{ name: string; total_budget_usd: number | null }> | null) ?? [])
      .reduce((s, r) => s + Number(r.total_budget_usd ?? 0), 0);
    if (aiTotal > 0) {
      signals.push({
        label: 'AI portfolio spend',
        valueUsd: aiTotal,
        detail: `${aiProjects!.length} active AI projects · committed budget`,
        source: 'tech_projects',
        confidence: 'high',
      });
    }

    // Trailing 12mo total
    const { data: spend } = await sb
      .from('spend_breakdown')
      .select('spend_usd')
      .eq('client_id', ctx.clientId)
      .order('month', { ascending: false })
      .limit(12);
    const t12 = ((spend as Array<{ spend_usd: number | null }> | null) ?? [])
      .reduce((s, r) => s + Number(r.spend_usd ?? 0), 0);
    if (t12 > 0) {
      signals.push({
        label: 'Trailing 12-month IT spend',
        valueUsd: t12,
        detail: 'baseline for savings framing',
        source: 'spend_breakdown',
        confidence: 'high',
      });
    }
  } catch {
    // silent — partial signals are acceptable
  }

  // Extract any dollar figures surfaced in evidence claims
  for (const c of claims.slice(0, 5)) {
    const m = c.text.match(/\$\d[\d,]*(?:\.\d+)?(?:M|B|k)?/i);
    if (m) {
      signals.push({
        label: 'Claim-level figure',
        valueUsd: null,
        detail: `"${c.text.slice(0, 140)}"`,
        source: c.source.name,
        confidence: c.confidence,
      });
    }
    if (signals.filter((s) => s.source === c.source.name).length >= 1) break;
  }

  const headline = signals.length > 0
    ? `Value envelope · ${signals.map((s) => `${s.label}${s.valueUsd ? ` ~$${(s.valueUsd / 1_000_000).toFixed(1)}M` : ''}`).join(' · ')}`
    : null;

  return { signals, headline };
}
