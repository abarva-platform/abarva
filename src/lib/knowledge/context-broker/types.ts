import 'server-only';

/**
 * ContextBundle types — slice CB-1.
 *
 * Typed contracts for the retrieval broker that returns a single
 * `ContextBundle` (Postgres facts + graph paths + Pinecone semantic
 * chunks + corpus pattern hits) for the 4-mode answer comparison and
 * the "Context Assembled" panel.
 *
 * See `docs/build/CONTEXT_BROKER_DESIGN.md` (PR #1249) §2 + §4 for the
 * architecture and the per-mode composition discipline. This file is
 * the contract every CB-* slice from CB-2 onward consumes.
 *
 * Boundary: server-only. App-tier code (routes, surfaces, panel) consumes
 * the `ContextBundle` JSON shape and must NOT import the broker
 * implementation directly outside `src/lib/knowledge/**` and the demo
 * endpoint that lands in CB-4 (`src/app/api/context/**`). The matching
 * eslint rule lands alongside CB-4 once the consumer surface exists; for
 * CB-1 the broker has no app-tier callers yet.
 */

import type {
  ContextChunk,
  GraphEdge,
  GraphNeighborhood,
  GraphNode,
  GraphPath,
  TenantRecord,
} from '@/lib/knowledge/tenant-data/types';

// Re-export the tenant-data shapes that app-tier consumers
// need so they don't have to reach into tenant-data/types
// (which is restricted by the broker-boundary ESLint rule).
// Per CB-5 + the boundary doctrine: every shape app code
// reads from a `ContextBundle` is reachable through the
// context-broker module.
export type {
  ContextChunk,
  GraphEdge,
  GraphNeighborhood,
  GraphNode,
  GraphPath,
  TenantRecord,
};

/**
 * The 4 retrieval modes per design doc Section 4.
 *
 * - `generic` — no retrieval; the LLM answers from priors only.
 * - `corpus` — pattern-catalog retrieval only (CB-6 wires it; empty in CB-1).
 * - `tenant` — Postgres facts + graph + chunks for one tenant; no corpus.
 * - `full`  — `tenant` + `corpus` composed.
 */
export type BrokerMode = 'generic' | 'corpus' | 'tenant' | 'full';

/**
 * Per-source citation discipline. Every emitted item in a `ContextBundle`
 * must carry provenance the panel can render and the LLM guardrail can
 * enforce.
 *
 * The `sourceClass` matches the design doc's source-class taxonomy and
 * drives the panel's left-border color and the prompt formatter's
 * section labels.
 */
export interface ContextProvenance {
  /** Source class — drives panel color coding + downstream filters. */
  sourceClass:
    | 'tenant_admin_upload'
    | 'corpus'
    | 'pattern_catalog'
    | 'synthetic'
    | 'unknown';
  /** Stable id of the source record / chunk / pattern. */
  sourceId: string;
  /** Optional: source document or url the source was authored from. */
  sourceDoc?: string;
  /** Confidence 0..1 if available. */
  confidence?: number;
  /** Data classification for the panel's privacy badge. */
  classification?: 'public' | 'internal' | 'confidential' | 'restricted';
}

/**
 * Pinecone hit — chunk + similarity score.
 *
 * In CB-1 vector retrieval is not yet live; the broker falls back to
 * keyword retrieval and tags the bundle with a warning. Score is `0`
 * for keyword-only hits since we don't have a similarity to report.
 */
export interface SemanticChunkHit {
  chunk: ContextChunk;
  /** Cosine similarity 0..1 from Pinecone; `0` for keyword-fallback hits. */
  score: number;
}

/**
 * Corpus pattern hit (placeholder shape; full type lives in the
 * intelligence module). CB-6 narrows this when it wires real corpus
 * retrieval. CB-1 always returns `[]` for corpus pattern hits.
 */
export interface CorpusPatternHit {
  patternId: string;
  patternName: string;
  /** Similarity 0..1 if available. */
  score?: number;
  /** One-line summary for the panel. */
  summary?: string;
}

/**
 * The unified retrieval result shape every surface and the demo
 * endpoint consume.
 *
 * Per-mode composition is the broker's responsibility — callers do not
 * branch on `mode`. The bundle ships every section even when it's
 * empty so the panel renders deterministically.
 */
export interface ContextBundle {
  /** The user's verbatim query (kept for audit). */
  query: string;
  /** The mode used to assemble this bundle. */
  mode: BrokerMode;
  /** Tenant key (null for generic / corpus-only modes). */
  tenantKey: string | null;
  /** Postgres-backed structured records. */
  facts: TenantRecord[];
  /** Graph fragments traversed during assembly. */
  graphPaths: Array<GraphNeighborhood | GraphPath>;
  /** Semantic chunks retrieved from Pinecone. Empty until CB-3 lights the index. */
  semanticChunks: SemanticChunkHit[];
  /** Corpus pattern hits. Empty until CB-6 wires the pattern catalog. */
  corpusPatterns: CorpusPatternHit[];
  /** Per-source citation set — one entry per emitted fact / chunk / graph path / pattern. */
  provenance: ContextProvenance[];
  /** ISO timestamp of assembly. */
  assembledAt: string;
  /** Optional cost estimate for telemetry; populated by CB-3 onward. */
  costEstimate?: {
    embeddingTokensCharged?: number;
    pineconeQueriesCharged?: number;
    postgresRowsRead?: number;
  };
  /** Warnings (e.g. `'Vector retrieval pending — using keyword-only chunk retrieval'`). */
  warnings: string[];
}

/**
 * Input to `ContextBroker.assemble`. Caller-supplied limits are
 * clamped by the broker — see `DefaultContextBroker.assemble` for the
 * clamp ceilings.
 */
export interface ContextAssembleInput {
  /** The user's verbatim query. */
  query: string;
  /** Required for `tenant` / `full` modes; ignored for `generic` / `corpus`. */
  tenantKey?: string;
  /** Mode discriminator — drives composition. */
  mode: BrokerMode;
  /** Default 12; clamped to [1, 50]. */
  maxFacts?: number;
  /** Default 8; clamped to [1, 20]. */
  maxChunks?: number;
  /** Default 2; clamped to [1, 4]. */
  graphTraversalDepth?: number;
}

/**
 * Typed error thrown when `tenant` / `full` mode is requested without
 * a `tenantKey`. Surfaces a stable `code` so callers can branch
 * without string matching.
 */
export class MissingTenantKeyError extends Error {
  readonly code = 'CONTEXT_BROKER_TENANT_KEY_REQUIRED' as const;
  constructor(mode: BrokerMode) {
    super(
      `ContextBroker.assemble requires a tenantKey for mode='${mode}'.`,
    );
    this.name = 'MissingTenantKeyError';
  }
}
