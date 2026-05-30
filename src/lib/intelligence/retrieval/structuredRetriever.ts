// Structured retrieval · typed SQL against Azure Postgres L2 industry tables.
// Reads: spend_breakdown, cost_centers, tech_projects, tech_stack_items,
// staff_augmentation, benchmarks (from knowledge_sources). All queries
// tenancy-scoped by client_id.

import { azureRead } from '@/lib/data-plane/azureRead';
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
  const claims: RetrievalResult['claims'] = [];
  let partial = false;

  try {
    const aiProjects = await azureRead.query<ProjectRow>(
      `SELECT id, name, status, total_budget_usd, touches_ai
         FROM tech_projects
        WHERE client_id::text = $1
          AND touches_ai = true
        LIMIT 10`,
      [q.tenancy.clientId],
      { missingTable: 'empty' },
    );
    const aiBudget = aiProjects.reduce((s, r) => s + Number(r.total_budget_usd ?? 0), 0);
    if (aiProjects.length > 0) {
      claims.push({
        text: `${aiProjects.length} AI-touching projects in portfolio totaling $${(aiBudget / 1_000_000).toFixed(1)}M budget`,
        source: { id: 'tech_projects:ai', type: 'engagement', name: 'Technology projects (AI subset)', confidence: 'high' },
        confidence: 'high',
      });
    }

    const stack = await azureRead.query<TechStackRow>(
      `SELECT id, vendor_name, annual_spend_usd, touches_ai, category
         FROM tech_stack_items
        WHERE client_id::text = $1
        ORDER BY annual_spend_usd DESC NULLS LAST
        LIMIT 5`,
      [q.tenancy.clientId],
      { missingTable: 'empty' },
    );
    for (const s of stack) {
      if (!s.annual_spend_usd) continue;
      claims.push({
        text: `${s.vendor_name} · ${s.category} · $${Math.round(Number(s.annual_spend_usd) / 1000)}k/yr${s.touches_ai ? ' · AI' : ''}`,
        source: { id: `tech_stack:${s.id}`, type: 'vendor', name: s.vendor_name, confidence: 'high' },
        confidence: 'high',
      });
    }

    const rows = await azureRead.query<SpendRow>(
      `SELECT month, spend_usd, cost_center_id
         FROM spend_breakdown
        WHERE client_id::text = $1
        ORDER BY month DESC
        LIMIT 12`,
      [q.tenancy.clientId],
      { missingTable: 'empty' },
    );
    if (rows.length > 0) {
      const total = rows.reduce((s, r) => s + Number(r.spend_usd ?? 0), 0);
      claims.push({
        text: `Last 12 months IT spend: $${(total / 1_000_000).toFixed(1)}M across ${rows.length} monthly rollups`,
        source: { id: 'spend_breakdown:trailing12', type: 'engagement', name: 'IT spend trajectory', confidence: 'high' },
        confidence: 'high',
      });
    }

    const client = await azureRead.maybeSingle<{ industry_code: string | null }>({
      table: 'clients',
      columns: ['industry_code'],
      where: { id: q.tenancy.clientId },
      missingTable: 'empty',
    });
    const industry = client?.industry_code;
    if (industry) {
      const benchmarks = await azureRead.query<Array<{ id: string; title: string; publisher: string | null; source_url: string | null; published_at: string | null }>[number]>(
        `SELECT id, title, publisher, source_url, published_at
           FROM knowledge_sources
          WHERE content_type = 'benchmark'
            AND industry_tags @> ARRAY[$1]::text[]
          LIMIT 5`,
        [industry],
        { missingTable: 'empty' },
      );
      for (const b of benchmarks) {
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
