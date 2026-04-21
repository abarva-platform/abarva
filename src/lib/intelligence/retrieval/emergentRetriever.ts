// Emergent retrieval · cross-client aggregates with n≥3 enforcement.
// Returns aggregate_outcomes only — no client IDs, ever (spec §4.7 + §7.3).

import { findEmergentPattern } from '../db/emergentRepository';
import type { NexusConfidence, RetrievalResult, Source, TenancyCtx } from '../types';

export interface EmergentQuery {
  tenancy: TenancyCtx;
  patternKey?: string;
  industry?: string;
  tier?: string;
}

function inferConfidence(cohortSize: number): NexusConfidence {
  if (cohortSize >= 10) return 'high';
  if (cohortSize >= 5) return 'medium';
  return 'low';
}

export async function emergentSearch(q: EmergentQuery): Promise<RetrievalResult> {
  const started = Date.now();
  const claims: RetrievalResult['claims'] = [];

  try {
    const pattern = await findEmergentPattern({
      patternKey: q.patternKey,
      industry: q.industry,
      tier: q.tier,
    });

    if (!pattern) {
      return { dimension: 'emergent', claims, latencyMs: Date.now() - started, partial: false, error: 'insufficient peer data (n<3)' };
    }

    const confidence = inferConfidence(pattern.cohortSize);
    const outcomes = pattern.aggregateOutcomes ?? {};
    const median = typeof outcomes.median === 'number' ? outcomes.median : null;
    const range = Array.isArray(outcomes.range) && outcomes.range.length === 2 ? outcomes.range : null;
    const successRate = typeof outcomes.success_rate === 'number' ? outcomes.success_rate : null;

    const bits: string[] = [`Cohort n=${pattern.cohortSize}`];
    if (median != null) bits.push(`median ${median}`);
    if (range) bits.push(`range ${(range as number[])[0]}–${(range as number[])[1]}`);
    if (successRate != null) bits.push(`${Math.round(successRate * 100)}% success`);

    const source: Source = {
      id: `emergent:${pattern.id}`,
      type: 'emergent',
      name: `${pattern.patternKey} · ${pattern.industry} · ${pattern.tier}`,
      detail: `Cross-client aggregate · last refreshed ${new Date(pattern.lastAggregatedAt).toLocaleDateString()}`,
      asOf: pattern.lastAggregatedAt,
      confidence,
    };

    claims.push({
      text: bits.join(' · '),
      source,
      confidence,
    });
  } catch (err) {
    return { dimension: 'emergent', claims, latencyMs: Date.now() - started, partial: true, error: (err as Error).message };
  }

  return { dimension: 'emergent', claims, latencyMs: Date.now() - started, partial: false };
}
