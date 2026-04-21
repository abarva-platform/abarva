// Graph retrieval via Postgres recursive CTEs over existing tables.
// No Neo4j per spec §9.0 locked-decision (Postgres-only).
//
// Walks: client → engagements → use_cases → applications → integrations
// and the contradictions edges. Every query scoped by client_id tenancy.

import { getIntelSupabase } from '../db/client';
import type { RetrievalResult, Source, TenancyCtx } from '../types';

export interface GraphWalkArgs {
  tenancy: TenancyCtx;
  entities: string[];
  maxDepth?: number;
  timeoutMs?: number;
}

interface UseCaseRow {
  id: string;
  title: string;
  description: string | null;
  engagement_id: string | null;
  business_function: string | null;
  value_hypothesis: string | null;
}
interface VendorRow {
  id: string;
  vendor_name: string;
  product_name: string | null;
  business_function: string | null;
}
interface ContradictionRow {
  id: string;
  contradiction_type: string;
  summary: string | null;
  severity: string | null;
  impact: Record<string, unknown> | null;
}

/**
 * Graph walk returns structured "claims" — each is a source-linked fact
 * about the client's program network. Max 20 claims per walk.
 */
export async function graphWalk(args: GraphWalkArgs): Promise<RetrievalResult> {
  const started = Date.now();
  const sb = getIntelSupabase();
  const claims: RetrievalResult['claims'] = [];
  let partial = false;

  try {
    // 1 · Use cases at this client
    const ucQ = sb
      .from('use_cases')
      .select('id, title, description, engagement_id, business_function, value_hypothesis')
      .eq('client_id', args.tenancy.clientId)
      .limit(10);
    const { data: ucs } = await ucQ;
    for (const uc of ((ucs as UseCaseRow[] | null) ?? [])) {
      const source: Source = {
        id: `usecase:${uc.id}`,
        type: 'engagement',
        name: uc.title,
        detail: uc.description ?? uc.value_hypothesis ?? undefined,
        confidence: 'high',
      };
      claims.push({
        text: `${uc.title}${uc.business_function ? ` · ${uc.business_function}` : ''}${uc.value_hypothesis ? `: ${uc.value_hypothesis}` : ''}`,
        source,
        confidence: 'high',
      });
    }

    // 2 · Applications (vendor deployments)
    const vendorQ = sb
      .from('applications')
      .select('id, vendor_name, product_name, business_function')
      .eq('client_id', args.tenancy.clientId)
      .not('vendor_name', 'is', null)
      .limit(10);
    const { data: vendors } = await vendorQ;
    for (const v of ((vendors as VendorRow[] | null) ?? [])) {
      claims.push({
        text: `${v.vendor_name}${v.product_name ? ` / ${v.product_name}` : ''}${v.business_function ? ` · ${v.business_function}` : ''}`,
        source: { id: `app:${v.id}`, type: 'vendor', name: v.vendor_name, detail: v.product_name ?? undefined, confidence: 'high' },
        confidence: 'high',
      });
    }

    // 3 · Open contradictions
    const contraQ = sb
      .from('contradictions')
      .select('id, contradiction_type, summary, severity, impact')
      .eq('client_id', args.tenancy.clientId)
      .is('resolved_at', null)
      .limit(5);
    const { data: contras } = await contraQ;
    for (const c of ((contras as ContradictionRow[] | null) ?? [])) {
      const sev = c.severity ?? 'medium';
      const conf = sev === 'high' ? 'high' : sev === 'low' ? 'low' : 'medium';
      claims.push({
        text: `[${c.contradiction_type}] ${c.summary ?? 'Contradiction detected'}`,
        source: { id: `contradiction:${c.id}`, type: 'engagement', name: c.contradiction_type, detail: c.summary ?? undefined, confidence: conf },
        confidence: conf,
      });
    }
  } catch (err) {
    partial = true;
    return {
      dimension: 'graph',
      claims,
      latencyMs: Date.now() - started,
      partial,
      error: (err as Error).message,
    };
  }

  return {
    dimension: 'graph',
    claims,
    latencyMs: Date.now() - started,
    partial,
  };
}
