// Parallel retrieval orchestrator · Promise.allSettled with 2s hard
// timeout per spec §3.2. Returns partial results on timeout rather than
// failing whole-pipeline.

import type { RetrievalPlan, RetrievalResult } from '../types';
import { graphWalk } from './graphRetriever';
import { vectorSearch } from './vectorRetriever';
import { structuredSearch } from './structuredRetriever';
import { emergentSearch } from './emergentRetriever';

const DEFAULT_TIMEOUT_MS = 2000;

function timeoutWrap<T>(p: Promise<T>, ms: number, fallback: T): Promise<T> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(fallback), ms);
    p.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      () => {
        clearTimeout(timer);
        resolve(fallback);
      },
    );
  });
}

export interface ParallelRetrievalOutput {
  results: RetrievalResult[];
  totalLatencyMs: number;
  partialCount: number;
}

export async function parallelRetrieve(plan: RetrievalPlan, timeoutMs: number = DEFAULT_TIMEOUT_MS): Promise<ParallelRetrievalOutput> {
  const started = Date.now();
  const jobs: Array<Promise<RetrievalResult>> = [];

  if (plan.dimensions.includes('graph')) {
    jobs.push(
      timeoutWrap(
        graphWalk({ tenancy: plan.tenancy, entities: plan.entities }),
        timeoutMs,
        { dimension: 'graph', claims: [], latencyMs: timeoutMs, partial: true, error: 'timeout' },
      ),
    );
  }
  if (plan.dimensions.includes('vector')) {
    jobs.push(
      timeoutWrap(
        vectorSearch({ query: plan.query, tenancy: plan.tenancy }),
        timeoutMs,
        { dimension: 'vector', claims: [], latencyMs: timeoutMs, partial: true, error: 'timeout' },
      ),
    );
  }
  if (plan.dimensions.includes('structured')) {
    jobs.push(
      timeoutWrap(
        structuredSearch({ tenancy: plan.tenancy, entities: plan.entities, mode: plan.mode }),
        timeoutMs,
        { dimension: 'structured', claims: [], latencyMs: timeoutMs, partial: true, error: 'timeout' },
      ),
    );
  }
  if (plan.dimensions.includes('emergent')) {
    jobs.push(
      timeoutWrap(
        emergentSearch({ tenancy: plan.tenancy, industry: plan.layerHints.includes('L1') ? undefined : undefined }),
        timeoutMs,
        { dimension: 'emergent', claims: [], latencyMs: timeoutMs, partial: true, error: 'timeout' },
      ),
    );
  }

  const settled = await Promise.all(jobs);
  return {
    results: settled,
    totalLatencyMs: Date.now() - started,
    partialCount: settled.filter((r) => r.partial).length,
  };
}
