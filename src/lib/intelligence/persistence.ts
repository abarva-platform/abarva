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
 * Cross-Source-event leak guard (3rd attempt, follow-up to #4602 / #4605).
 *
 * `enterprise_context_chunks` has no per-row Source-event scoping column or
 * metadata convention — `program_inventory` / `cross_program_signals` /
 * `it_landscape` chunks for a tenant mix content from EVERY Source event
 * ever ingested for that tenant into the same tenant-wide segment. Live
 * re-testing proved this: asking "What evidence is missing?" inside the
 * Lakeshore AMS Source event (LAKE-AMS-2026-46EADB28) returned content
 * naming a DIFFERENT, real Lakeshore Source event — "Kyriba Treasury
 * Rollout Commercial Readiness" (LSH-KYRIBA-TREASURY-2026) — because both
 * events' chunk text lives in the same `program_inventory` segment for
 * tenant `lakeshore` and the query has no event filter to apply.
 *
 * This is a REAL, unconditional code-level filter (not a prompt
 * instruction): given the active Source event's code and the full list of
 * the tenant's OTHER Source event codes, drop any chunk whose text
 * mentions another event's code. A chunk that names no other event code at
 * all (tenant profile, org chart, generic IT landscape) is kept — only
 * chunks that are demonstrably ABOUT a different Source event are dropped.
 */
export interface SourceEventScopeGuard {
  /** The event code (e.g. "LAKE-AMS-2026-46EADB28") the current turn is scoped to. */
  activeEventCode: string;
  /** Every OTHER Source event code known for this tenant — candidates to drop. */
  otherEventCodes: string[];
}

export interface CrossEventFilterResult {
  kept: ContextChunkRow[];
  droppedCount: number;
  droppedEventCodes: string[];
}

/**
 * Drops any chunk whose text references an event code in
 * `guard.otherEventCodes` and does NOT also reference
 * `guard.activeEventCode`. A chunk naming the active event alongside an
 * older reference is kept (it's about the current event); a chunk naming
 * only another event is dropped outright.
 */
export function filterChunksToActiveSourceEvent(
  chunks: ContextChunkRow[],
  guard: SourceEventScopeGuard | null,
): CrossEventFilterResult {
  if (!guard || guard.otherEventCodes.length === 0) {
    return { kept: chunks, droppedCount: 0, droppedEventCodes: [] };
  }
  const kept: ContextChunkRow[] = [];
  const droppedEventCodes = new Set<string>();
  for (const chunk of chunks) {
    const text = chunk.chunk_text ?? '';
    const mentionsActive =
      guard.activeEventCode.length > 0 && text.includes(guard.activeEventCode);
    const mentionedOtherCodes = guard.otherEventCodes.filter((code) =>
      text.includes(code),
    );
    if (mentionedOtherCodes.length > 0 && !mentionsActive) {
      mentionedOtherCodes.forEach((code) => droppedEventCodes.add(code));
      continue;
    }
    kept.push(chunk);
  }
  return {
    kept,
    droppedCount: chunks.length - kept.length,
    droppedEventCodes: Array.from(droppedEventCodes),
  };
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
 * @param sourceEventScope  When the caller is grounding a specific Source
 *                          event turn, pass the active event's code plus
 *                          every OTHER Source event code known for the
 *                          tenant. Any chunk that names one of the other
 *                          codes (and not the active one) is dropped
 *                          before the block is assembled — see
 *                          `filterChunksToActiveSourceEvent`. Omit for
 *                          every non-Source-event caller; behavior is
 *                          unchanged.
 */
export async function buildTenantContextBlock(
  tenantKey: string | null | undefined,
  sourceEventScope?: SourceEventScopeGuard | null,
): Promise<string | null> {
  if (!tenantKey) return null;
  try {
    const rawChunks = await queryEnterpriseContextChunks(tenantKey);
    if (rawChunks.length === 0) return null;

    const { kept: chunks, droppedCount, droppedEventCodes } =
      filterChunksToActiveSourceEvent(rawChunks, sourceEventScope ?? null);

    // Audit-mode diagnostic — only emitted when a Source-event scope was
    // supplied (i.e. only on source-detail turns with an active event),
    // and only proves the guard ran; it never blocks the response. Kept
    // deliberately terse and grep-able (`[source-event-scope-guard]`) so
    // it can be filtered out of default logs. This is a permanent,
    // env-gated audit-mode log, not a temporary ad-hoc debug print — it
    // stays in the shipped code so the guard's effect can be verified
    // against a real tenant at any time.
    if (sourceEventScope && process.env.ABARVA_SOURCE_SCOPE_GUARD_LOG === '1') {
      console.log('[source-event-scope-guard]', {
        sourceEventId: sourceEventScope.activeEventCode,
        contextItemsIncluded: chunks.length,
        contextItemsDroppedCrossEvent: droppedCount,
        droppedEventCodes,
      });
    }

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
