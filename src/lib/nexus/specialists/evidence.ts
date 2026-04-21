// Evidence specialist · wraps parallelRetrieve (Phase 2) into a typed
// claim stream. Produces claims with confidence + source pills.

import { parallelRetrieve } from '@/lib/intelligence/retrieval/parallelRetrieve';
import type {
  NexusConfidence,
  RetrievalPlan,
  RetrievalResult,
  Source,
} from '@/lib/intelligence/types';

export interface EvidenceClaim {
  text: string;
  source: Source;
  confidence: NexusConfidence;
  dimension: RetrievalResult['dimension'];
}

export interface EvidenceOutput {
  claims: EvidenceClaim[];
  latencyMs: number;
  partialDimensions: RetrievalResult['dimension'][];
}

export async function runEvidence(plan: RetrievalPlan, timeoutMs = 2000): Promise<EvidenceOutput> {
  const { results, totalLatencyMs } = await parallelRetrieve(plan, timeoutMs);
  const claims: EvidenceClaim[] = [];
  const partialDimensions: RetrievalResult['dimension'][] = [];
  for (const r of results) {
    if (r.partial) partialDimensions.push(r.dimension);
    for (const c of r.claims) {
      claims.push({ text: c.text, source: c.source, confidence: c.confidence, dimension: r.dimension });
    }
  }
  return { claims, latencyMs: totalLatencyMs, partialDimensions };
}
