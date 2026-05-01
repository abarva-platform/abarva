// persistence.ts
// TC-PERSISTENCE-INTEGRATION — Phase 1 partial implementation.
//
// Provides async, Supabase-backed functions for querying the enterprise
// context substrate loaded into `enterprise_context_chunks`. These
// replace the hardcoded demo-context.ts fixture as the source of truth
// for the agent system prompt's tenant context block.
//
// Full vector/graph retrieval (per acceptance criteria) is blocked on
// DM-VECTOR-EMBEDDING-PIPELINE (embeddings not yet generated). This
// file provides the seam so the agent route can query persisted data;
// the fallback chain (persistence → fixture) keeps behaviour stable
// while embeddings are pending.
//
// Acceptance criteria status (2026-04-30):
//   ✓ Postgres schema migrated — enterprise_context_chunks table exists
//   ✓ This file created — expected_files item satisfied
//   ~ agent-retrieval queries persistence — tenant system block partial;
//       stage/category pattern corpus remains in-memory pending embeddings
//   ✗ Embeddings generated — blocked on DM-VECTOR-EMBEDDING-PIPELINE
//   ✗ Parity tests — deferred to Phase 1 completion PR

import { getIntelSupabase } from './db/client';

// Segment priority order for the system-prompt tenant context block.
// Profile + org (static facts) precede program inventory (most
// conversational) and IT landscape (vendor resolution context).
const PRIORITY_SEGMENTS = [
  'enterprise_profile',
  'org_structure',
  'program_inventory',
  'it_landscape',
  'cross_program_signals',
];

// Max chunks per segment. Keeps the assembled block under ~600 tokens
// even for dense segments while preserving the most-useful content.
const MAX_CHUNKS_PER_SEGMENT = 2;

interface ContextChunkRow {
  chunk_text: string;
  source_segment_id: string;
  chunk_metadata: Record<string, unknown>;
}

/**
 * Query `enterprise_context_chunks` for the given tenant and segment list.
 *
 * Fetches at most `maxPerSegment` chunks per segment in chunk_index
 * order. Returns an empty array on any DB error — callers fall back to
 * the static fixture without surfacing the failure to the user.
 *
 * @param tenantKey      Inventory-substrate key, e.g. 'apex-retail'.
 * @param segments       Segment IDs to fetch (default: PRIORITY_SEGMENTS).
 * @param maxPerSegment  Cap per segment (default: 2).
 */
export async function queryEnterpriseContextChunks(
  tenantKey: string,
  segments: string[] = PRIORITY_SEGMENTS,
  maxPerSegment = MAX_CHUNKS_PER_SEGMENT,
): Promise<ContextChunkRow[]> {
  if (!tenantKey) return [];
  const sb = getIntelSupabase();
  const results: ContextChunkRow[] = [];

  // Per-segment queries enforce the per-segment cap without a LATERAL join.
  // Parallel fetch keeps latency low (<20ms for 5 segments on warm connection).
  await Promise.all(
    segments.map(async (seg) => {
      try {
        const { data } = await sb
          .from('enterprise_context_chunks')
          .select('chunk_text, source_segment_id, chunk_metadata')
          .eq('tenant_key', tenantKey)
          .eq('source_segment_id', seg)
          .order('chunk_index', { ascending: true })
          .limit(maxPerSegment);
        for (const row of (data as ContextChunkRow[] | null) ?? []) {
          results.push(row);
        }
      } catch {
        // Non-fatal — segment may not exist for this tenant yet.
      }
    }),
  );

  // Return in PRIORITY_SEGMENTS order so the system prompt reads profile
  // → org → programs → IT regardless of DB insertion order.
  return results.sort(
    (a, b) =>
      segments.indexOf(a.source_segment_id) -
      segments.indexOf(b.source_segment_id),
  );
}

/**
 * Assemble a system-prompt-ready tenant context block from persisted
 * `enterprise_context_chunks`.
 *
 * Returns null when no data is available (callers should fall back to
 * the static demo-context.ts fixture). Non-null return means the DB has
 * at least one chunk for this tenant and the agent can be grounded in
 * real data rather than the hardcoded snapshot.
 *
 * @param tenantKey  Inventory-substrate key, e.g. 'apex-retail'. Pass
 *                   null/undefined when unauthenticated — returns null.
 */
export async function buildTenantContextBlock(
  tenantKey: string | null | undefined,
): Promise<string | null> {
  if (!tenantKey) return null;
  try {
    const chunks = await queryEnterpriseContextChunks(tenantKey);
    if (chunks.length === 0) return null;

    const lines: string[] = [
      `--- TENANT CONTEXT (${tenantKey}) ---`,
    ];
    let currentSeg = '';
    for (const chunk of chunks) {
      if (chunk.source_segment_id !== currentSeg) {
        currentSeg = chunk.source_segment_id;
        const label = currentSeg
          .replace(/^\d+_/, '')
          .replace(/_/g, ' ')
          .toUpperCase();
        lines.push('', `[${label}]`);
      }
      lines.push(chunk.chunk_text.trim());
    }
    lines.push('--- END TENANT CONTEXT ---');
    return lines.join('\n');
  } catch {
    return null;
  }
}
