// Structured retrieval · typed SQL against L2 industry tables.
// Reads: spend_breakdown, cost_centers, tech_projects, tech_stack_items,
// staff_augmentation, benchmarks (from knowledge_sources). All queries
// tenancy-scoped by client_id.

import { getIntelSupabase } from '../db/client';
import type { RetrievalResult, Source, TenancyCtx } from '../types';

export interface StructuredQuery {
  tenancy: TenancyCtx;
  entities: string[];
  mode: 'research' | 'grounded' | 'pivot';
}

interface SpendRow { month: string; spend_usd: number | null; cost_center_id: string | null; }
interface ProjectRow { id: string; name: string; status: string | null; total_budget_usd: number | null; touches_ai: boolean | null; }
interface TechStackRow { id: string; vendor_name: string; annual_spend_usd: number | null; touches_ai: boolean | null; category: string; }

export async function structuredSearch(q: StructuredQuery): Promise<RetrievalResult> {
  const started = Date.now();
  const sb = getIntelSupabase();
  const claims: RetrievalResult['claims'] = [];
  let partial = false;

  try {
    // AI-touching projects (signal of active AI investment)
    const { data: aiProjects } = await sb
      .from('tech_projects')
      .select('id, name, status, total_budget_usd, touches_ai')
      .eq('client_id', q.tenancy.clientId)
      .eq('touches_ai', true)
      .limit(10);
    const aiBudget = ((aiProjects as ProjectRow[] | null) ?? []).reduce((s, r) => s + Number(r.total_budget_usd ?? 0), 0);
    if (((aiProjects as ProjectRow[] | null) ?? []).length > 0) {
      claims.push({
        text: `${aiProjects!.length} AI-touching projects in portfolio totaling $${(aiBudget / 1_000_000).toFixed(1)}M budget`,
        source: { id: 'tech_projects:ai', type: 'engagement', name: 'Technology projects (AI subset)', confidence: 'high' },
        confidence: 'high',
      });
    }

    // Tech stack concentration
    const { data: stack } = await sb
      .from('tech_stack_items')
      .select('id, vendor_name, annual_spend_usd, touches_ai, category')
      .eq('client_id', q.tenancy.clientId)
      .order('annual_spend_usd', { ascending: false, nullsFirst: false })
      .limit(5);
    for (const s of ((stack as TechStackRow[] | null) ?? [])) {
      if (!s.annual_spend_usd) continue;
      claims.push({
        text: `${s.vendor_name} · ${s.category} · $${Math.round(Number(s.annual_spend_usd) / 1000)}k/yr${s.touches_ai ? ' · AI' : ''}`,
        source: { id: `tech_stack:${s.id}`, type: 'vendor', name: s.vendor_name, confidence: 'high' },
        confidence: 'high',
      });
    }

    // 12-month spend trajectory
    const { data: spend } = await sb
      .from('spend_breakdown')
      .select('month, spend_usd, cost_center_id')
      .eq('client_id', q.tenancy.clientId)
      .order('month', { ascending: false })
      .limit(12);
    const rows = ((spend as SpendRow[] | null) ?? []);
    if (rows.length > 0) {
      const total = rows.reduce((s, r) => s + Number(r.spend_usd ?? 0), 0);
      claims.push({
        text: `Last 12 months IT spend: $${(total / 1_000_000).toFixed(1)}M across ${rows.length} monthly rollups`,
        source: { id: 'spend_breakdown:trailing12', type: 'engagement', name: 'IT spend trajectory', confidence: 'high' },
        confidence: 'high',
      });
    }

    // Benchmarks from knowledge_sources where tagged to the same industry
    const { data: client } = await sb
      .from('clients')
      .select('industry_code')
      .eq('id', q.tenancy.clientId)
      .maybeSingle();
    const industry = (client as { industry_code: string | null } | null)?.industry_code;
    if (industry) {
      const { data: benchmarks } = await sb
        .from('knowledge_sources')
        .select('id, title, publisher, source_url, published_at')
        .eq('content_type', 'benchmark')
        .contains('industry_tags', [industry])
        .limit(5);
      for (const b of (benchmarks as Array<{ id: string; title: string; publisher: string | null; source_url: string | null; published_at: string | null }> | null ?? [])) {
        const source: Source = {
          id: `benchmark:${b.id}`,
          type: 'benchmark',
          name: b.title,
          detail: b.publisher ?? undefined,
          url: b.source_url ?? undefined,
          asOf: b.published_at ?? undefined,
          confidence: 'medium',
        };
        claims.push({ text: b.title, source, confidence: 'medium' });
      }
    }
  } catch (err) {
    partial = true;
    return {
      dimension: 'structured',
      claims,
      latencyMs: Date.now() - started,
      partial,
      error: (err as Error).message,
    };
  }

  return { dimension: 'structured', claims, latencyMs: Date.now() - started, partial };
}
