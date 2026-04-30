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
  type WorldviewChunkHit,
} from './types';
import { callWorldviewRetriever } from './worldview-retrieval';

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
export const WARNING_CORPUS_PENDING = 'Corpus pattern retrieval not yet active on this surface.';
/**
 * INT-WV-2 · raised when the worldview Pinecone index can't be
 * reached (no API key, network, index missing). The bundle still
 * ships with `worldviewChunks: []`; this warning surfaces the gap
 * so the panel renders the right empty-state copy.
 */
export const WARNING_WORLDVIEW_PENDING =
  'Worldview retrieval pending — index unreachable.';

/**
 * INT-WV-2 · info tag emitted when worldview retrieval succeeds.
 */
export function worldviewRetrievalInfoTag(hits: number, topK: number): string {
  return `Worldview retrieval via Pinecone (hits=${hits}, top-K=${topK}).`;
}

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
  infoTags: string[] = [],
  worldviewChunks: WorldviewChunkHit[] = [],
): ContextBundle {
  return {
    query: input.query,
    mode: input.mode,
    tenantKey,
    facts: [],
    graphPaths: [],
    semanticChunks: [],
    corpusPatterns: [],
    worldviewChunks,
    provenance: [],
    assembledAt: nowIso(),
    warnings,
    infoTags,
  };
}

/**
 * INT-WV-2 · embed the user query with text-embedding-3-large
 * (3072-dim) so the worldview index can be queried. The shared
 * `embedTexts` helper is hardcoded to text-embedding-3-small
 * (1536-dim) for the tenant-context path; worldview needs the
 * larger model. Returns null on failure (no key, network error)
 * so the broker can fall back without throwing.
 */
async function embedQueryForWorldview(
  query: string,
  openaiClient: OpenAIEmbeddingsLike | undefined,
): Promise<number[] | null> {
  if (!openaiClient && !process.env.OPENAI_API_KEY) return null;
  try {
    const client =
      openaiClient ??
      (await (async () => {
        const { default: OpenAI } = await import('openai');
        return new OpenAI({ apiKey: process.env.OPENAI_API_KEY?.trim() }) as unknown as OpenAIEmbeddingsLike;
      })());
    const res = await client.embeddings.create({
      model: 'text-embedding-3-large',
      input: [query],
    });
    const v = res.data[0]?.embedding ?? [];
    if (!Array.isArray(v) || v.length !== 3072) return null;
    return v;
  } catch {
    return null;
  }
}

function provenanceForWorldviewChunk(hit: WorldviewChunkHit): ContextProvenance {
  return {
    sourceClass: 'corpus',
    sourceId: hit.chunkId,
    confidence: hit.confidence,
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
      // INT-WV-2 · `corpus` mode now queries the worldview index.
      // Pattern catalog is still pending (CB-6); when worldview is
      // reachable we surface the worldview hits and skip the
      // pattern-catalog warning since the user IS getting corpus
      // content. When worldview itself is unreachable we tag both.
      const worldviewResult = await this.queryWorldviewSafe(input.query);
      const corpusWarnings: string[] = [];
      const corpusInfoTags: string[] = [];
      if (worldviewResult.reached) {
        if (worldviewResult.hits.length > 0) {
          corpusInfoTags.push(
            worldviewRetrievalInfoTag(worldviewResult.hits.length, 6),
          );
        }
        // Pattern catalog remains pending — distinct from worldview.
        corpusWarnings.push(WARNING_CORPUS_PENDING);
      } else {
        corpusWarnings.push(WARNING_WORLDVIEW_PENDING);
        corpusWarnings.push(WARNING_CORPUS_PENDING);
      }
      const bundle = emptyBundle(
        input,
        null,
        corpusWarnings,
        corpusInfoTags,
        worldviewResult.hits,
      );
      bundle.provenance = worldviewResult.hits.map(provenanceForWorldviewChunk);
      return bundle;
    }

    // tenant / full — both require a tenantKey.
    if (!input.tenantKey) {
      throw new MissingTenantKeyError(input.mode);
    }
    const tenantKey = input.tenantKey;

    const warnings: string[] = [];
    // CB-10 · info-tags are success metadata about how retrieval ran
    // (e.g. "Vector retrieval via Pinecone (top-K=N).") — kept distinct
    // from warnings so the panel can render them in a separate
    // slate-toned strip rather than the amber warnings strip.
    const infoTags: string[] = [];
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
      // CB-10 · vector-retrieval-succeeded is success metadata, not a
      // warning — pushed onto `infoTags` so the panel renders it in a
      // distinct slate-toned strip rather than the amber warnings.
      infoTags.push(vectorRetrievalInfoTag(maxChunks));
    }

    // ──────────────── Worldview chunks (full mode) ────────────────
    // INT-WV-2 · in `full` mode, query the worldview index alongside
    // the tenant retrieval. Pattern catalog is still pending (CB-6)
    // so we only flag the catalog gap when worldview also fails to
    // reach — otherwise corpus content IS being delivered, just from
    // the worldview namespace rather than the pattern manifest.
    let worldviewChunks: WorldviewChunkHit[] = [];
    if (input.mode === 'full') {
      const worldviewResult = await this.queryWorldviewSafe(input.query);
      worldviewChunks = worldviewResult.hits;
      if (worldviewResult.reached) {
        if (worldviewChunks.length > 0) {
          infoTags.push(worldviewRetrievalInfoTag(worldviewChunks.length, 6));
        }
        // Pattern catalog still pending — distinct gap.
        warnings.push(WARNING_CORPUS_PENDING);
      } else {
        warnings.push(WARNING_WORLDVIEW_PENDING);
        warnings.push(WARNING_CORPUS_PENDING);
      }
    }

    // ──────────────── Provenance ────────────────
    const provenance: ContextProvenance[] = [
      ...facts.map(provenanceForFact),
      ...graphPaths.map(provenanceForNeighborhood),
      ...semanticChunks.map(provenanceForChunk),
      ...worldviewChunks.map(provenanceForWorldviewChunk),
    ];

    return {
      query: input.query,
      mode: input.mode,
      tenantKey,
      facts,
      graphPaths,
      semanticChunks,
      corpusPatterns: [],
      worldviewChunks,
      provenance,
      assembledAt: nowIso(),
      warnings,
      infoTags,
    };
  }

  /**
   * INT-WV-2 · embed the query in 3072-dim and query the worldview
   * Pinecone index. Returns `{ hits: [], reached: false }` on any
   * failure (no key, embed fail, network, index missing) so the
   * caller can surface the warning rather than throw.
   */
  private async queryWorldviewSafe(
    query: string,
  ): Promise<{ hits: WorldviewChunkHit[]; reached: boolean }> {
    const queryVector = await embedQueryForWorldview(query, this.openaiClient);
    if (!queryVector) return { hits: [], reached: false };
    return callWorldviewRetriever({ queryVector });
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
