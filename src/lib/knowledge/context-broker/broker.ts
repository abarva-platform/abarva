import 'server-only';

/**
 * `ContextBroker` contract + default implementation — slice CB-1.
 *
 * The broker is the **only** module that calls the persisted
 * tenant-data adapter for retrieval purposes. App-tier code consumes
 * a `ContextBundle` exclusively (see `feedback_broker_boundary`).
 *
 * Per-mode discipline:
 *
 * - `generic` — no retrieval; returns an empty bundle with metadata
 *   only (the LLM is forced to answer from priors).
 * - `corpus`  — pattern-catalog retrieval; **stubbed in CB-1** (CB-6
 *   wires the catalog). Tags a `'Corpus retrieval pending CB-6.'`
 *   warning.
 * - `tenant`  — Postgres facts + graph + chunks for one tenant.
 *   Refuses to run without `tenantKey`. CB-3 wires real Pinecone
 *   vector retrieval; when `PINECONE_API_KEY` is missing the broker
 *   catches the throw and falls back to keyword retrieval (TD-6),
 *   tagging the bundle with
 *   `'Vector retrieval pending — using keyword-only chunk retrieval'`.
 *   On success the broker attaches a
 *   `'Vector retrieval via Pinecone (top-K=N).'` info-tag.
 * - `full`    — same as `tenant` plus (in the future) corpus
 *   composition. Behaves identically to `tenant` in CB-1 and tags a
 *   `'Corpus retrieval pending CB-6.'` warning.
 *
 * Telemetry: not wired in CB-1; CB-6 fires `context_bundle_assembled`.
 *
 * Singleton: `getContextBroker()` returns a process-wide
 * `DefaultContextBroker` instance, mirroring `getTenantDataAdapter()`.
 */

import { getTenantDataAdapter } from '@/lib/knowledge/tenant-data';
import type { TenantDataAdapter } from '@/lib/knowledge/tenant-data';
import type {
  ContextChunk,
  GraphNeighborhood,
  TenantRecord,
} from '@/lib/knowledge/tenant-data/types';

import {
  embedTexts,
  type OpenAIEmbeddingsLike,
} from './embedding-client';
import {
  MissingTenantKeyError,
  type ContextAssembleInput,
  type ContextBundle,
  type ContextProvenance,
  type SemanticChunkHit,
} from './types';

/** Public contract — what callers and tests pin against. */
export interface ContextBroker {
  assemble(input: ContextAssembleInput): Promise<ContextBundle>;
}

const DEFAULTS = {
  maxFacts: 12,
  maxChunks: 8,
  graphTraversalDepth: 2,
} as const;

const CLAMPS = {
  maxFacts: { min: 1, max: 50 },
  maxChunks: { min: 1, max: 20 },
  graphTraversalDepth: { min: 1, max: 4 },
} as const;

/**
 * Warning sentinels. Exported so consumers (panel, tests) can assert
 * exact copy without duplicating string literals.
 */
export const WARNING_VECTOR_PENDING =
  'Vector retrieval pending — using keyword-only chunk retrieval';
export const WARNING_CORPUS_PENDING = 'Corpus retrieval pending CB-6.';

/**
 * Info-tag emitted when vector retrieval succeeds (CB-3). Embeds the
 * topK actually used so the panel can render an accurate hover string
 * without having to introspect the bundle.
 */
export function vectorRetrievalInfoTag(topK: number): string {
  return `Vector retrieval via Pinecone (top-K=${topK}).`;
}

/**
 * English stopwords used by the keyword extractor. Intentionally
 * narrow — we don't want to drop tenant-meaningful nouns like
 * "program", "system", "vendor".
 */
const STOPWORDS = new Set([
  'a', 'an', 'and', 'or', 'but', 'the', 'of', 'to', 'in', 'on', 'at',
  'for', 'from', 'by', 'with', 'as', 'is', 'are', 'was', 'were', 'be',
  'been', 'being', 'do', 'does', 'did', 'have', 'has', 'had', 'i', 'we',
  'you', 'they', 'he', 'she', 'it', 'this', 'that', 'these', 'those',
  'what', 'which', 'who', 'whom', 'whose', 'when', 'where', 'why', 'how',
  'can', 'could', 'should', 'would', 'will', 'shall', 'may', 'might',
  'must', 'me', 'my', 'mine', 'our', 'ours', 'your', 'yours', 'their',
  'theirs', 'about', 'so', 'if', 'then', 'than', 'into', 'over', 'under',
]);

const KEYWORD_CAP = 10;

/**
 * Graph-id prefix heuristic. If a record_id starts with one of these
 * prefixes, the broker treats it as a graph-node id and walks the
 * graph from it. Otherwise the fact contributes no graph paths in
 * CB-1. CB-6 may upgrade this to a record→node-id resolver.
 */
const GRAPH_ID_PREFIXES = ['program:', 'sys:', 'system:', 'person:', 'enterprise:', 'vendor:', 'kpi:'];

function clamp(value: number, range: { min: number; max: number }): number {
  if (!Number.isFinite(value)) return range.min;
  return Math.max(range.min, Math.min(range.max, Math.trunc(value)));
}

/**
 * Lowercase, trim punctuation, drop stopwords, dedupe, cap.
 *
 * Pilot-grade — not Lucene. Adequate for the keyword fallback path
 * the broker hands to `chunksByKeyword`, which itself runs an `ILIKE`
 * / `ts_rank` query (TD-6).
 */
export function extractKeywords(query: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  const tokens = query.toLowerCase().split(/\s+/);
  for (const raw of tokens) {
    const token = raw.replace(/[^\p{L}\p{N}_-]+/gu, '');
    if (!token) continue;
    if (token.length < 2) continue;
    if (STOPWORDS.has(token)) continue;
    if (seen.has(token)) continue;
    seen.add(token);
    out.push(token);
    if (out.length >= KEYWORD_CAP) break;
  }
  return out;
}

function isGraphCandidateId(recordId: string): boolean {
  return GRAPH_ID_PREFIXES.some((prefix) => recordId.startsWith(prefix));
}

function provenanceForFact(fact: TenantRecord): ContextProvenance {
  return {
    sourceClass: 'tenant_admin_upload',
    sourceId: fact.recordId,
    sourceDoc: fact.sourceBasis,
    confidence: fact.confidence,
    classification: fact.classification,
  };
}

function provenanceForChunk(hit: SemanticChunkHit): ContextProvenance {
  return {
    sourceClass: 'tenant_admin_upload',
    sourceId: hit.chunk.chunkId,
    sourceDoc: hit.chunk.sourceBasis,
    classification: hit.chunk.classification,
  };
}

function provenanceForNeighborhood(
  neighborhood: GraphNeighborhood,
): ContextProvenance {
  return {
    sourceClass: 'tenant_admin_upload',
    sourceId: neighborhood.rootId,
  };
}

function nowIso(): string {
  return new Date().toISOString();
}

function emptyBundle(
  input: ContextAssembleInput,
  tenantKey: string | null,
  warnings: string[],
): ContextBundle {
  return {
    query: input.query,
    mode: input.mode,
    tenantKey,
    facts: [],
    graphPaths: [],
    semanticChunks: [],
    corpusPatterns: [],
    provenance: [],
    assembledAt: nowIso(),
    warnings,
  };
}

/**
 * Default `ContextBroker` — TD-2/TD-3-backed for facts/graph/chunks
 * + Pinecone vector retrieval (CB-3); corpus retrieval is still
 * stubbed (CB-6).
 *
 * The constructor accepts an optional OpenAI-embeddings client for
 * tests so vector retrieval can be exercised without an OPENAI_API_KEY
 * or network. Production callers pass nothing — the broker imports
 * `embedTexts` directly from CB-2's embedding client.
 */
export class DefaultContextBroker implements ContextBroker {
  constructor(
    private readonly adapter: TenantDataAdapter = getTenantDataAdapter(),
    private readonly openaiClient?: OpenAIEmbeddingsLike,
  ) {}

  async assemble(input: ContextAssembleInput): Promise<ContextBundle> {
    const maxFacts = clamp(input.maxFacts ?? DEFAULTS.maxFacts, CLAMPS.maxFacts);
    const maxChunks = clamp(input.maxChunks ?? DEFAULTS.maxChunks, CLAMPS.maxChunks);
    const graphDepth = clamp(
      input.graphTraversalDepth ?? DEFAULTS.graphTraversalDepth,
      CLAMPS.graphTraversalDepth,
    );

    if (input.mode === 'generic') {
      return emptyBundle(input, null, []);
    }

    if (input.mode === 'corpus') {
      // CB-6 wires the pattern catalog. Until then `corpus` mode
      // returns an empty bundle but tags the gap so the panel renders
      // the right empty-state copy.
      return emptyBundle(input, null, [WARNING_CORPUS_PENDING]);
    }

    // tenant / full — both require a tenantKey.
    if (!input.tenantKey) {
      throw new MissingTenantKeyError(input.mode);
    }
    const tenantKey = input.tenantKey;

    const warnings: string[] = [];
    const keywords = extractKeywords(input.query);

    // ──────────────── Facts ────────────────
    // chunksByKeyword returns keyword-matched chunks; we walk back to
    // their source records via getRecord and dedupe. We over-fetch
    // (`maxFacts * 2`) to compensate for chunks that share a record.
    const seedChunks = keywords.length > 0
      ? await this.adapter.chunksByKeyword(tenantKey, keywords, maxFacts * 2)
      : [];

    const seenRecordIds = new Set<string>();
    const facts: TenantRecord[] = [];
    for (const chunk of seedChunks) {
      if (!chunk.recordId) continue;
      if (seenRecordIds.has(chunk.recordId)) continue;
      seenRecordIds.add(chunk.recordId);
      const record = await this.adapter.getRecord(tenantKey, chunk.recordId);
      if (record) {
        facts.push(record);
        if (facts.length >= maxFacts) break;
      }
    }

    // ──────────────── Graph paths ────────────────
    // Heuristic: when a fact's recordId looks like a graph-node id,
    // walk a depth-1 neighborhood around it. CB-6 may upgrade this
    // to a record→node resolver.
    const graphPaths: Array<GraphNeighborhood> = [];
    for (const fact of facts) {
      if (!isGraphCandidateId(fact.recordId)) continue;
      const neighborhood = await this.adapter.getGraphNeighborhood(
        tenantKey,
        fact.recordId,
        { maxDepth: graphDepth },
      );
      if (neighborhood.nodes.length > 0 || neighborhood.edges.length > 0) {
        graphPaths.push(neighborhood);
      }
    }

    // ──────────────── Semantic chunks ────────────────
    // CB-3: try real vector retrieval first. The adapter throws when
    // Pinecone is not configured (no PINECONE_API_KEY); on that
    // throw, or any embedding/query failure, fall back to keyword
    // retrieval and tag the bundle so the panel renders the right
    // empty-state copy.
    let semanticChunks: SemanticChunkHit[] = [];
    let vectorSucceeded = false;
    try {
      // Embed the query once. `embedTexts` throws if OPENAI_API_KEY
      // is missing — which we catch below and fall back as if
      // Pinecone weren't configured.
      const embedResult = await embedTexts([input.query], undefined, this.openaiClient);
      const queryVector = embedResult.results[0]?.embedding ?? [];
      if (queryVector.length === 0) {
        throw new Error('embedTexts returned an empty embedding for the query.');
      }
      const vectorChunks = await this.adapter.chunksByVector(
        tenantKey,
        queryVector,
        maxChunks,
      );
      semanticChunks = vectorChunks.map((chunk) => ({
        chunk,
        score: chunk.vectorScore ?? 0,
      }));
      vectorSucceeded = true;
    } catch {
      warnings.push(WARNING_VECTOR_PENDING);
      const fallback: ContextChunk[] = keywords.length > 0
        ? await this.adapter.chunksByKeyword(tenantKey, keywords, maxChunks)
        : [];
      semanticChunks = fallback.map((chunk) => ({ chunk, score: 0 }));
    }
    if (vectorSucceeded) {
      warnings.push(vectorRetrievalInfoTag(maxChunks));
    }

    if (input.mode === 'full') {
      // CB-6 will compose corpus patterns into `full` mode. Until
      // then, signal the gap so the panel renders the right copy.
      warnings.push(WARNING_CORPUS_PENDING);
    }

    // ──────────────── Provenance ────────────────
    const provenance: ContextProvenance[] = [
      ...facts.map(provenanceForFact),
      ...graphPaths.map(provenanceForNeighborhood),
      ...semanticChunks.map(provenanceForChunk),
    ];

    return {
      query: input.query,
      mode: input.mode,
      tenantKey,
      facts,
      graphPaths,
      semanticChunks,
      corpusPatterns: [],
      provenance,
      assembledAt: nowIso(),
      warnings,
    };
  }
}

let cached: ContextBroker | null = null;

/**
 * Process-wide singleton accessor. Mirrors `getTenantDataAdapter()`.
 *
 * Always returns the same instance so a downstream cache / metrics
 * layer can hang state on the broker without per-call resets.
 */
export function getContextBroker(): ContextBroker {
  if (!cached) {
    cached = new DefaultContextBroker();
  }
  return cached;
}

/**
 * Test seam — clears the cached singleton so a test can install a
 * different adapter via `new DefaultContextBroker(mockAdapter)`. Not
 * exported from the package barrel.
 */
export function __resetContextBrokerForTests(): void {
  cached = null;
}
