// emergent_patterns queries · n≥3 enforced both at DB and API layer.
// Client IDs are NEVER returned from this repo — only hashes and
// aggregated outcomes.

import { getIntelSupabase } from './client';
import type { EmergentPattern } from '../types';

interface EmergentRow {
  id: string;
  pattern_key: string;
  industry: string;
  tier: string;
  cohort_size: number;
  aggregate_outcomes_jsonb: Record<string, unknown> | null;
  contributing_client_hashes: string[] | null;
  last_aggregated_at: string;
  created_at: string;
}

function rowToPattern(r: EmergentRow): EmergentPattern {
  return {
    id: r.id,
    patternKey: r.pattern_key,
    industry: r.industry,
    tier: r.tier,
    cohortSize: r.cohort_size,
    aggregateOutcomes: r.aggregate_outcomes_jsonb ?? {},
    lastAggregatedAt: r.last_aggregated_at,
  };
}

export interface EmergentQuery {
  patternKey?: string;
  industry?: string;
  tier?: string;
}

/**
 * Look up emergent patterns. Returns null if the cohort is below n=3.
 * The DB CHECK constraint prevents n<3 rows from existing in the first
 * place, but we re-check here so the shape is explicit at the API edge.
 */
export async function findEmergentPattern(query: EmergentQuery): Promise<EmergentPattern | null> {
  const sb = getIntelSupabase();
  let q = sb.from('emergent_patterns').select('*');
  if (query.patternKey) q = q.eq('pattern_key', query.patternKey);
  if (query.industry) q = q.eq('industry', query.industry);
  if (query.tier) q = q.eq('tier', query.tier);
  const { data, error } = await q.order('last_aggregated_at', { ascending: false }).limit(1);
  if (error) throw error;
  const row = (data as EmergentRow[] | null)?.[0];
  if (!row) return null;
  if (row.cohort_size < 3) return null;
  return rowToPattern(row);
}

export async function listEmergentPatterns(query: EmergentQuery): Promise<EmergentPattern[]> {
  const sb = getIntelSupabase();
  let q = sb.from('emergent_patterns').select('*');
  if (query.patternKey) q = q.eq('pattern_key', query.patternKey);
  if (query.industry) q = q.eq('industry', query.industry);
  if (query.tier) q = q.eq('tier', query.tier);
  const { data, error } = await q.order('last_aggregated_at', { ascending: false }).limit(50);
  if (error) throw error;
  return (data as EmergentRow[] | null ?? [])
    .filter((r) => r.cohort_size >= 3)
    .map(rowToPattern);
}
