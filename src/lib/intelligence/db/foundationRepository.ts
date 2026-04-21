// Zone 1 Foundation Readout — reads-only aggregates across the 4 layers.
// Reads existing tables only (no Intelligence-specific writes).

import { assertTenancy, getIntelSupabase } from './client';
import type { FoundationReadout, TenancyCtx } from '../types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Filterable = any;

async function countRows(table: string, apply?: (q: Filterable) => Filterable): Promise<number> {
  const sb = getIntelSupabase();
  const base: Filterable = sb.from(table).select('*', { count: 'exact', head: true });
  const q: Filterable = apply ? apply(base) : base;
  const { count, error } = await q;
  if (error) return 0;
  return count ?? 0;
}

export async function loadFoundation(ctx: TenancyCtx): Promise<FoundationReadout> {
  assertTenancy(ctx);
  const sb = getIntelSupabase();

  const clientQ = sb.from('clients').select('id, name, industry_code').eq('id', ctx.clientId).maybeSingle();
  const personQ = sb.from('persons').select('id, name, role').eq('id', ctx.userId).maybeSingle();

  const [clientR, personR] = await Promise.all([clientQ, personQ]);
  const client = clientR.data as { id: string; name: string; industry_code: string | null } | null;
  const person = personR.data as { id: string; name: string | null; role: string | null } | null;

  const [useCases, vendors, contradictions, patterns, benchmarks, engagements] = await Promise.all([
    countRows('use_cases', (q) => q.eq('client_id', ctx.clientId)),
    countRows('applications', (q) => q.eq('client_id', ctx.clientId)),
    countRows('contradictions', (q) => q.eq('client_id', ctx.clientId).is('resolved_at', null)),
    countRows('genome_patterns'),
    countRows('knowledge_sources', (q) => q.eq('content_type', 'benchmark')),
    countRows('engagements', (q) => q.eq('client_id', ctx.clientId).eq('status', 'active')),
  ]);

  return {
    client: {
      id: client?.id ?? ctx.clientId,
      name: client?.name ?? '—',
      industry: client?.industry_code ?? null,
    },
    user: {
      id: person?.id ?? ctx.userId,
      name: person?.name ?? null,
      role: person?.role ?? null,
    },
    layers: [
      { key: 'L4', label: 'You', count: 1, asOf: new Date().toISOString() },
      { key: 'L3', label: 'Programs', count: engagements },
      { key: 'L2', label: 'Enterprise', count: useCases },
      { key: 'L1', label: 'Public', count: patterns + benchmarks },
    ],
    metrics: {
      useCases,
      vendors,
      contradictions,
      patterns,
      benchmarks,
      engagements,
    },
    asOf: new Date().toISOString(),
  };
}
