// Graph retrieval via Azure Postgres reads over existing tables.
// Graph context stays inside the Azure private data plane.
//
// Walks: client -> engagements -> use_cases -> applications -> integrations
// and the contradictions edges. Every query scoped by client_id tenancy.

import { azureRead } from '@/lib/data-plane/azureRead';
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

export async function graphWalk(args: GraphWalkArgs): Promise<RetrievalResult> {
  const started = Date.now();
  const claims: RetrievalResult['claims'] = [];
  let partial = false;

  try {
    const ucs = await azureRead.query<UseCaseRow>(
      `SELECT id, title, description, engagement_id, business_function, value_hypothesis
         FROM use_cases
        WHERE client_id::text = $1
        LIMIT 10`,
      [args.tenancy.clientId],
      { missingTable: 'empty' },
    );
    for (const uc of ucs) {
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

    const vendors = await azureRead.query<VendorRow>(
      `SELECT id, vendor_name, product_name, business_function
         FROM applications
        WHERE client_id::text = $1
          AND vendor_name IS NOT NULL
        LIMIT 10`,
      [args.tenancy.clientId],
      { missingTable: 'empty' },
    );
    for (const v of vendors) {
      claims.push({
        text: `${v.vendor_name}${v.product_name ? ` / ${v.product_name}` : ''}${v.business_function ? ` · ${v.business_function}` : ''}`,
        source: { id: `app:${v.id}`, type: 'vendor', name: v.vendor_name, detail: v.product_name ?? undefined, confidence: 'high' },
        confidence: 'high',
      });
    }

    const contras = await azureRead.query<ContradictionRow>(
      `SELECT id, contradiction_type, summary, severity, impact
         FROM contradictions
        WHERE client_id::text = $1
          AND resolved_at IS NULL
        LIMIT 5`,
      [args.tenancy.clientId],
      { missingTable: 'empty' },
    );
    for (const c of contras) {
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
