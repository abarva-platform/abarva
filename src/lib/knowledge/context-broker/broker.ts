import "server-only";

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
 *   Refuses to run without `tenantKey`. SCB W2.2 uses Postgres
 *   pgvector retrieval; when the vector path is unavailable the broker
 *   catches the throw and falls back to keyword retrieval (TD-6),
 *   tagging the bundle with
 *   `'Vector retrieval pending — using keyword-only chunk retrieval'`.
 *   On success the broker attaches a
 *   `'Vector retrieval via Postgres pgvector (top-K=N).'` info-tag.
 * - `full`    — same as `tenant` plus (in the future) corpus
 *   composition. Behaves identically to `tenant` in CB-1 and tags a
 *   `'Corpus retrieval pending CB-6.'` warning.
 *
 * Telemetry: not wired in CB-1; CB-6 fires `context_bundle_assembled`.
 *
 * Singleton: `getContextBroker()` returns a process-wide
 * `DefaultContextBroker` instance, mirroring `getTenantDataAdapter()`.
 */

import { getTenantDataAdapter } from "@/lib/knowledge/tenant-data";
import {
  getPrivateDataPlaneResource,
  isPrivateVectorAvailable,
  type PrivateDataPlaneResource,
} from "@/lib/knowledge/private-data-plane/registry";
import { isFeatureEnabled } from "@/lib/features/is-feature-enabled";
import { queryTenantContext } from "@/lib/azure-search/tenant-context-retriever";
import {
  WARNING_CANONICAL_CORPUS_EMPTY,
  WARNING_CANONICAL_CORPUS_READ_FAILED,
  WARNING_CANONICAL_PATTERN_NO_MATCH,
  type CanonicalPatternIndexHit,
  type CanonicalPatternIndexResult,
} from "@/lib/intelligence/canonical/runtime-pattern-index";
import { searchIndustryScopedCorpusPatternIndex } from "@/lib/intelligence/canonical/scoped-corpus-pattern-index";
import type { CanonicalIndustry } from "@/lib/intelligence/canonical/industry-ai-pattern";
import type { TenantDataAdapter } from "@/lib/knowledge/tenant-data";
import {
  getInferenceEconomicsForVendor,
  type VendorInferenceEconomics,
} from "@/lib/source/vendor-inference-economics";
import type {
  ContextChunk,
  GraphNeighborhood,
  TenantRecord,
} from "@/lib/knowledge/tenant-data/types";

import { embedTexts, type OpenAIEmbeddingsLike } from "./embedding-client";
import {
  MissingTenantKeyError,
  type ContextAssembleInput,
  type ContextBundle,
  type ContextProvenance,
  type CorpusPatternHit,
  type GraphPath,
  type SemanticChunkHit,
  type WorldviewChunkHit,
} from "./types";
import { callWorldviewRetriever } from "./worldview-retrieval";

/** Public contract — what callers and tests pin against. */
export interface ContextBroker {
  assemble(input: ContextAssembleInput): Promise<ContextBundle>;
  getInferenceEconomicsForVendor(
    vendorId: string,
  ): VendorInferenceEconomics | null;
}

export type CorpusPatternRetriever = (
  input: ContextAssembleInput,
  tenantKey: string | null,
) => Promise<CanonicalPatternIndexResult>;

/**
 * Test seam for the Azure AI Search retrieval lane. Production wiring
 * uses `queryTenantContext` from `@/lib/azure-search/tenant-context-retriever`.
 * Returning `ContextChunk[]` keeps the shape identical to the pgvector
 * `chunksByVector` path so the broker dispatches without branching
 * downstream.
 */
export type AzureSearchTenantContextRetriever = (args: {
  tenantClientKey: string;
  query: string;
  topK: number;
}) => Promise<ContextChunk[]>;

/**
 * Info-tag emitted when the Azure AI Search retrieval lane runs.
 */
export function azureSearchRetrievalInfoTag(topK: number): string {
  return `Vector retrieval via Azure AI Search (top-K=${topK}).`;
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
  "Vector retrieval pending — using keyword-only chunk retrieval";
export const WARNING_CORPUS_PENDING =
  "Corpus pattern retrieval not yet active on this surface.";
/**
 * INT-WV-2 · raised when the worldview Pinecone index can't be
 * reached (no API key, network, index missing). The bundle still
 * ships with `worldviewChunks: []`; this warning surfaces the gap
 * so the panel renders the right empty-state copy.
 */
export const WARNING_WORLDVIEW_PENDING =
  "Worldview retrieval pending — index unreachable.";

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
  return `Vector retrieval via Postgres pgvector (top-K=${topK}).`;
}

/**
 * English stopwords used by the keyword extractor. Intentionally
 * narrow — we don't want to drop tenant-meaningful nouns like
 * "program", "system", "vendor".
 */
const STOPWORDS = new Set([
  "a",
  "an",
  "and",
  "or",
  "but",
  "the",
  "of",
  "to",
  "in",
  "on",
  "at",
  "for",
  "from",
  "by",
  "with",
  "as",
  "is",
  "are",
  "was",
  "were",
  "be",
  "been",
  "being",
  "do",
  "does",
  "did",
  "have",
  "has",
  "had",
  "i",
  "we",
  "you",
  "they",
  "he",
  "she",
  "it",
  "this",
  "that",
  "these",
  "those",
  "what",
  "which",
  "who",
  "whom",
  "whose",
  "when",
  "where",
  "why",
  "how",
  "can",
  "could",
  "should",
  "would",
  "will",
  "shall",
  "may",
  "might",
  "must",
  "me",
  "my",
  "mine",
  "our",
  "ours",
  "your",
  "yours",
  "their",
  "theirs",
  "about",
  "so",
  "if",
  "then",
  "than",
  "into",
  "over",
  "under",
]);

const KEYWORD_CAP = 10;
const TENANT_PROFILE_QUESTION_RE =
  /\b(?:what do you know|highest-confidence facts|company profile|enterprise profile|who are we|tell me about (?:our|the) company|business profile|at a glance)\b/i;
const VENDOR_SPEND_RENEWAL_QUESTION_RE =
  /\b(?:top\s+\d+\s+vendors?|vendors?|supplier|contract|renewal|renews?|expiry|expires?|annual\s+spend|spend\s+by\s+vendor|run[-\s]?rate|commercial exposure)\b/i;
const STRATEGIC_DECISION_QUESTION_RE =
  /\b(?:which\b[\s\S]{0,40}\b(?:bet|move|initiative|program)\b[\s\S]{0,40}\b(?:move|fund|rank|prioriti[sz]e)|move\s+now|ai\s+create[\s\S]{0,40}\bvalue|digital\s+bet|ai\s+bet|rank\s+(?:the\s+)?top\s+\d+|most\s+measurable\s+value)\b/i;
const RISK_ADJUSTMENT_QUESTION_RE =
  /\b(?:hcc|raf|risk\s+adjustment|suspect\s+capture|coding\s+capture)\b/i;
const MODEL_RISK_QUESTION_RE =
  /\b(?:sr\s*11-?7|model\s+risk|model\s+validation|parallel\s+gates|new\s+ml\s+model|aml)\b/i;

const TENANT_INDUSTRY_ALLOWLISTS: ReadonlyArray<{
  pattern: RegExp;
  industries: ReadonlySet<CanonicalIndustry>;
}> = [
  {
    pattern: /\b(?:apex|apx|retail)\b/i,
    industries: new Set<CanonicalIndustry>(["retail", "cross_industry"]),
  },
  {
    pattern: /\b(?:meridian|health|heliara)\b/i,
    industries: new Set<CanonicalIndustry>([
      "healthcare_provider",
      "cross_industry",
    ]),
  },
  {
    pattern: /\b(?:northstar|medtech|clinical[-_]?technologies|solventum)\b/i,
    industries: new Set<CanonicalIndustry>([
      "healthcare_medtech",
      "cross_industry",
    ]),
  },
  {
    pattern: /\b(?:first[-_]?capital|firstcapital|fcfi|arcturus|financial)\b/i,
    industries: new Set<CanonicalIndustry>([
      "financial_services_banking",
      "cross_industry",
    ]),
  },
  {
    pattern: /\b(?:skyharbor|airline|aviation)\b/i,
    industries: new Set<CanonicalIndustry>(["airline", "cross_industry"]),
  },
];

/**
 * Graph-id prefix heuristic. If a record_id starts with one of these
 * prefixes, the broker treats it as a graph-node id and walks the
 * graph from it. Otherwise the fact contributes no graph paths in
 * CB-1. CB-6 may upgrade this to a record→node-id resolver.
 */
const GRAPH_ID_PREFIXES = [
  "program:",
  "sys:",
  "system:",
  "person:",
  "enterprise:",
  "vendor:",
  "kpi:",
];

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
    const token = raw.replace(/[^\p{L}\p{N}_-]+/gu, "");
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

function shouldIncludeTenantProfileAnchors(query: string): boolean {
  return TENANT_PROFILE_QUESTION_RE.test(query);
}

function shouldIncludeVendorSpendAnchors(query: string): boolean {
  return VENDOR_SPEND_RENEWAL_QUESTION_RE.test(query);
}

function shouldIncludeStrategicDecisionAnchors(query: string): boolean {
  return (
    STRATEGIC_DECISION_QUESTION_RE.test(query) ||
    RISK_ADJUSTMENT_QUESTION_RE.test(query) ||
    MODEL_RISK_QUESTION_RE.test(query)
  );
}

function stringifyPayloadValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return String(value);
  }
  if (Array.isArray(value))
    return value.map(stringifyPayloadValue).filter(Boolean).join(" ");
  if (typeof value === "object") {
    return Object.values(value as Record<string, unknown>)
      .map(stringifyPayloadValue)
      .filter(Boolean)
      .join(" ");
  }
  return "";
}

function recordSearchText(record: TenantRecord): string {
  return [
    record.segmentId,
    record.recordKind,
    record.recordId,
    record.title,
    stringifyPayloadValue(record.payload),
  ]
    .join(" ")
    .toLocaleLowerCase();
}

function numericPayloadValue(
  record: TenantRecord,
  keys: string[],
): number | null {
  for (const key of keys) {
    const value = record.payload[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string") {
      const parsed = Number(value.replace(/[$,\s]/g, ""));
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return null;
}

function vendorSpendAnchorScore(record: TenantRecord, query: string): number {
  const haystack = recordSearchText(record);
  const normalizedQuery = query.toLocaleLowerCase();
  let score = 0;

  if (record.segmentId === "vendor_contracts") score += 20;
  if (record.segmentId === "it_financials") score += 16;
  if (record.segmentId === "it_landscape") score += 8;

  if (/\bvendor\b/.test(haystack)) score += 12;
  if (/\b(contract|renewal|expiry|expires|renews?)\b/.test(haystack))
    score += 12;
  if (
    /\b(spend|annual_spend|annual value|annual_value|fy2026_planned|run-rate|run rate)\b/.test(
      haystack,
    )
  )
    score += 12;
  if (/\b(scorecard|renewal_calendar|vendor spend top)\b/.test(haystack))
    score += 12;
  if (
    /\b(salesforce|aws|microsoft|adobe|snowflake|databricks|oracle|sap)\b/.test(
      haystack,
    )
  )
    score += 4;

  for (const term of extractKeywords(normalizedQuery)) {
    if (haystack.includes(term)) score += term.length > 5 ? 3 : 2;
  }

  const spend = numericPayloadValue(record, [
    "annual_spend_usd",
    "annual_value_usd",
    "fy2026_planned_usd",
    "fy2025_actual_usd",
    "annual_cost_usd",
  ]);
  if (spend !== null) {
    score += Math.min(12, Math.log10(Math.max(spend, 1)));
  }

  if (
    /\btop\s+\d+\s+vendors?|annual\s+spend|spend\b/.test(normalizedQuery) &&
    spend !== null
  ) {
    score += 8;
  }
  if (
    /\brenew|contract|expiry|expires\b/.test(normalizedQuery) &&
    /\brenew|contract|expiry|expires\b/.test(haystack)
  ) {
    score += 8;
  }

  return score;
}

function rankVendorSpendAnchorRecords(
  records: TenantRecord[],
  query: string,
): TenantRecord[] {
  return records
    .map((record, index) => ({
      record,
      score: vendorSpendAnchorScore(record, query) - index * 0.001,
      spend:
        numericPayloadValue(record, [
          "annual_spend_usd",
          "annual_value_usd",
          "fy2026_planned_usd",
          "fy2025_actual_usd",
          "annual_cost_usd",
        ]) ?? 0,
    }))
    .filter((entry) => entry.score >= 18)
    .sort(
      (a, b) =>
        b.score - a.score ||
        b.spend - a.spend ||
        a.record.title.localeCompare(b.record.title),
    )
    .map((entry) => entry.record);
}

function tenantDecisionTerms(
  tenantKey: string,
): Array<{ pattern: RegExp; score: number }> {
  if (/\bmeridian(?:-health)?\b/i.test(tenantKey)) {
    return [
      { pattern: /\bpopulation\s+health\b/i, score: 34 },
      { pattern: /\baco(s)?\b/i, score: 28 },
      { pattern: /\bmssp\b/i, score: 24 },
      { pattern: /\bambient\b/i, score: 18 },
      { pattern: /\bhcc\b/i, score: 18 },
      { pattern: /\braf\b/i, score: 18 },
      { pattern: /\bsepsis\b/i, score: 12 },
      { pattern: /\bprior\s+auth(?:orization)?\b/i, score: 8 },
    ];
  }
  if (/\b(?:first[-_]?capital|firstcapital|arcturus)\b/i.test(tenantKey)) {
    return [
      { pattern: /\bfed\s*now\b/i, score: 34 },
      { pattern: /\bdeposit\b/i, score: 28 },
      { pattern: /\bpayment(?:s)?\b/i, score: 22 },
      { pattern: /\bmodel\s+risk\b/i, score: 20 },
      { pattern: /\bsr\s*11-?7\b/i, score: 20 },
      { pattern: /\bmodel\s+validation\b/i, score: 20 },
      { pattern: /\baccount\s+opening\b/i, score: 14 },
      { pattern: /\baml\b/i, score: 10 },
    ];
  }
  if (/\b(?:apex|retail)\b/i.test(tenantKey)) {
    return [
      { pattern: /\bworkforce\s+scheduling\b/i, score: 30 },
      { pattern: /\blabor\b/i, score: 18 },
      { pattern: /\bdemand\s+sensing\b/i, score: 18 },
      { pattern: /\bloyalty\b/i, score: 14 },
      { pattern: /\bcdp\b/i, score: 14 },
    ];
  }
  return [];
}

function strategicDecisionAnchorScore(
  record: TenantRecord,
  query: string,
  tenantKey: string,
): number {
  const haystack = recordSearchText(record);
  const normalizedQuery = query.toLocaleLowerCase();
  let score = 0;

  if (record.segmentId === "program_inventory") score += 24;
  if (record.segmentId === "kpi_dictionary") score += 16;
  if (record.segmentId === "cross_program_signals") score += 14;
  if (record.segmentId === "evidence_ledger") score += 12;

  if (
    /\b(?:phase|p[0-5]|status|risk|blocked|gate|value|owner|sponsor|confidence)\b/.test(
      haystack,
    )
  ) {
    score += 8;
  }
  if (
    /\b(?:ai|ml|digital|automation|agentic|modernization|clinical|payment|platform)\b/.test(
      haystack,
    )
  ) {
    score += 8;
  }

  for (const term of tenantDecisionTerms(tenantKey)) {
    if (term.pattern.test(haystack)) score += term.score;
  }

  if (RISK_ADJUSTMENT_QUESTION_RE.test(normalizedQuery)) {
    if (/\bhcc\b/i.test(haystack)) score += 26;
    if (/\braf\b/i.test(haystack)) score += 26;
    if (/\bworkflow\b/i.test(haystack)) score += 14;
  }
  if (MODEL_RISK_QUESTION_RE.test(normalizedQuery)) {
    if (/\bsr\s*11-?7\b/i.test(haystack)) score += 28;
    if (/\bmodel\s+validation\b/i.test(haystack)) score += 24;
    if (/\bparallel\s+gates\b/i.test(haystack)) score += 20;
    if (/\bmodel\s+risk\b/i.test(haystack)) score += 18;
  }

  for (const term of extractKeywords(normalizedQuery)) {
    if (haystack.includes(term)) score += term.length > 5 ? 3 : 2;
  }

  return score;
}

function rankStrategicDecisionAnchorRecords(
  records: TenantRecord[],
  query: string,
  tenantKey: string,
): TenantRecord[] {
  return records
    .map((record, index) => ({
      record,
      score:
        strategicDecisionAnchorScore(record, query, tenantKey) - index * 0.001,
    }))
    .filter((entry) => entry.score >= 24)
    .sort(
      (a, b) =>
        b.score - a.score || a.record.title.localeCompare(b.record.title),
    )
    .map((entry) => entry.record);
}

function isGraphCandidateId(recordId: string): boolean {
  return GRAPH_ID_PREFIXES.some((prefix) => recordId.startsWith(prefix));
}

export function allowedPatternIndustriesForTenant(
  tenantKey: string | null,
): ReadonlySet<CanonicalIndustry> | null {
  if (!tenantKey) return null;
  return (
    TENANT_INDUSTRY_ALLOWLISTS.find((entry) => entry.pattern.test(tenantKey))
      ?.industries ?? null
  );
}

function patternMatchesTenantIndustry(
  pattern: CanonicalPatternIndexHit,
  allowedIndustries: ReadonlySet<CanonicalIndustry>,
): boolean {
  return pattern.industry.some((industry) => allowedIndustries.has(industry));
}

function filterCorpusPatternResultByTenantIndustry(
  result: CanonicalPatternIndexResult,
  tenantKey: string | null,
): CanonicalPatternIndexResult {
  const allowedIndustries = allowedPatternIndustriesForTenant(tenantKey);
  if (!allowedIndustries || result.patterns.length === 0) return result;

  const patterns = result.patterns.filter((pattern) =>
    patternMatchesTenantIndustry(pattern, allowedIndustries),
  );

  if (patterns.length === result.patterns.length) return result;

  return {
    ...result,
    status: patterns.length > 0 ? result.status : "no_match",
    patterns,
    total: patterns.length,
    warnings:
      patterns.length > 0
        ? result.warnings
        : Array.from(
            new Set([...result.warnings, WARNING_CANONICAL_PATTERN_NO_MATCH]),
          ),
    filters_applied: {
      ...result.filters_applied,
      tenant_key: tenantKey ?? result.filters_applied.tenant_key,
    },
  };
}

function sourceClassForTenant(
  resource: PrivateDataPlaneResource | null,
): ContextProvenance["sourceClass"] {
  return resource ? "private_client_data" : "tenant_admin_upload";
}

function provenanceForFact(
  fact: TenantRecord,
  resource: PrivateDataPlaneResource | null,
): ContextProvenance {
  return {
    sourceClass: sourceClassForTenant(resource),
    sourceId: fact.recordId,
    sourceDoc: fact.sourceBasis,
    confidence: fact.confidence,
    classification: fact.classification,
  };
}

function provenanceForChunk(
  hit: SemanticChunkHit,
  resource: PrivateDataPlaneResource | null,
): ContextProvenance {
  return {
    sourceClass: sourceClassForTenant(resource),
    sourceId: hit.chunk.chunkId,
    sourceDoc: hit.chunk.sourceBasis,
    classification: hit.chunk.classification,
  };
}

function provenanceForNeighborhood(
  neighborhood: GraphNeighborhood | GraphPath,
  resource: PrivateDataPlaneResource | null,
): ContextProvenance {
  return {
    sourceClass: sourceClassForTenant(resource),
    sourceId: graphRootId(neighborhood) ?? "graph-path",
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
  corpusPatterns: CorpusPatternHit[] = [],
): ContextBundle {
  const resource = getPrivateDataPlaneResource(tenantKey);
  return {
    query: input.query,
    mode: input.mode,
    tenantKey,
    facts: [],
    graphPaths: [],
    semanticChunks: [],
    corpusPatterns,
    worldviewChunks,
    provenance: [],
    assembledAt: nowIso(),
    warnings,
    infoTags,
    retrievalTrace: buildRetrievalTrace({
      tenantKey,
      resource,
      facts: [],
      graphPaths: [],
      semanticChunks: [],
      worldviewChunks,
      corpusPatterns,
    }),
  };
}

function graphRootId(path: GraphNeighborhood | GraphPath): string | null {
  if ("rootId" in path) return path.rootId;
  return path.fromId ? `${path.fromId}->${path.toId}` : null;
}

function buildRetrievalTrace(args: {
  tenantKey: string | null;
  resource: PrivateDataPlaneResource | null;
  facts: TenantRecord[];
  graphPaths: Array<GraphNeighborhood | GraphPath>;
  semanticChunks: SemanticChunkHit[];
  worldviewChunks: WorldviewChunkHit[];
  corpusPatterns: CorpusPatternHit[];
}): NonNullable<ContextBundle["retrievalTrace"]> {
  const privateFactIds = args.facts.map((fact) => fact.recordId);
  const privateChunkIds = args.semanticChunks.map((hit) => hit.chunk.chunkId);
  const graphRootIds = args.graphPaths
    .map(graphRootId)
    .filter((id): id is string => Boolean(id));
  const sharedCorpusIds = [
    ...args.worldviewChunks.map((hit) => hit.chunkId),
    ...args.corpusPatterns.map((hit) => hit.patternId),
  ];
  return {
    tenant_key: args.tenantKey,
    data_plane_id: args.resource?.dataPlaneId ?? null,
    schema: args.resource?.privateSchema ?? null,
    pinecone_index: args.resource?.privatePineconeIndex ?? null,
    vector_status: args.resource?.vectorStatus,
    retrieved_private_ids: [
      ...privateFactIds,
      ...privateChunkIds,
      ...graphRootIds,
    ],
    shared_corpus_ids: sharedCorpusIds,
    private_fact_ids: privateFactIds,
    private_chunk_ids: privateChunkIds,
    graph_root_ids: graphRootIds,
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
  tenantKey: string | null,
): Promise<number[] | null> {
  if (!openaiClient && (!tenantKey || !process.env.OPENAI_API_KEY)) return null;
  try {
    const client =
      openaiClient ??
      (await getAuditedOpenAIEmbeddingClient({
        tenantKey,
        query,
        workflow: "context-broker-worldview-embedding",
        model: "text-embedding-3-large",
      }));
    const res = await client.embeddings.create({
      model: "text-embedding-3-large",
      input: [query],
    });
    const v = res.data[0]?.embedding ?? [];
    if (!Array.isArray(v) || v.length !== 3072) return null;
    return v;
  } catch {
    return null;
  }
}

async function getAuditedOpenAIEmbeddingClient(args: {
  tenantKey: string | null;
  query: string;
  workflow: string;
  model: string;
}): Promise<OpenAIEmbeddingsLike> {
  if (!args.tenantKey)
    throw new Error("worldview embedding requires tenant context");
  const { preflightOpenAIDirectClient } =
    await import("@/lib/integrations/ai-egress");
  const preflight = await preflightOpenAIDirectClient({
    tenantId: args.tenantKey,
    workflow: args.workflow,
    model: args.model,
    prompt: args.query,
    dataClass: "internal",
    metadata: { tenantKey: args.tenantKey },
  });
  if (!preflight.ok) throw new Error(preflight.reason);
  return preflight.client as unknown as OpenAIEmbeddingsLike;
}

function provenanceForWorldviewChunk(
  hit: WorldviewChunkHit,
): ContextProvenance {
  return {
    sourceClass: "corpus",
    sourceId: hit.chunkId,
    confidence: hit.confidence,
  };
}

function provenanceForCorpusPattern(hit: CorpusPatternHit): ContextProvenance {
  return {
    sourceClass: "pattern_catalog",
    sourceId: hit.patternId,
    sourceDoc: hit.sourceBasis,
    confidence: hit.score,
    classification: "internal",
  };
}

function corpusPatternInfoTag(hits: number): string {
  return `Canonical pattern retrieval via persisted corpus (hits=${hits}).`;
}

function patternHitFromCanonical(
  hit: CanonicalPatternIndexHit,
): CorpusPatternHit {
  return {
    patternId: hit.canonical_id,
    patternName: hit.title,
    score: hit.score,
    summary: hit.summary,
    sourceBasis: hit.source_basis,
    confidenceLevel: hit.confidence_level,
    missingRequiredFields: hit.missing_required_fields.map(String),
    missingProvenance: hit.missing_provenance,
    unsupportedClaimCount: hit.unsupported_claim_flags.length,
    matchReasons: hit.match_reasons,
  };
}

function corpusWarningsFromIndex(
  result: CanonicalPatternIndexResult,
): string[] {
  if (result.status === "ready") return [];
  if (result.status === "empty") return [WARNING_CANONICAL_CORPUS_EMPTY];
  if (result.status === "no_match") return [WARNING_CANONICAL_PATTERN_NO_MATCH];
  return [WARNING_CANONICAL_CORPUS_READ_FAILED];
}

async function defaultCorpusPatternRetriever(
  input: ContextAssembleInput,
  tenantKey: string | null,
): Promise<CanonicalPatternIndexResult> {
  return searchIndustryScopedCorpusPatternIndex(
    {
      query: input.query,
      tenant_key: tenantKey ?? undefined,
      limit: 8,
    },
    {
      scope: { tenantKey },
    },
  );
}

/**
 * Default `ContextBroker` — TD-2/TD-3-backed for facts/graph/chunks
 * + Postgres pgvector retrieval; corpus retrieval is still stubbed
 * (CB-6).
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
    private readonly corpusPatternRetriever: CorpusPatternRetriever = defaultCorpusPatternRetriever,
    // Azure AI Search retrieval lane. Production default reaches the
    // `tenant-context-v1` index via `queryTenantContext`. The broker
    // only invokes it when the `retrieval_azure_search` feature flag
    // resolves on for the active tenant — see `assemble()`.
    private readonly azureSearchRetriever: AzureSearchTenantContextRetriever = async (
      args,
    ) => {
      const hits = await queryTenantContext({
        tenantClientKey: args.tenantClientKey,
        query: args.query,
        topK: args.topK,
      });
      // The retriever's `TenantContextChunk` is a structural mirror of
      // `ContextChunk` — the parity test pins the shape. The map is a
      // no-op at runtime; the cast is the TS-level narrowing.
      return hits as ContextChunk[];
    },
  ) {}

  getInferenceEconomicsForVendor(
    vendorId: string,
  ): VendorInferenceEconomics | null {
    return getInferenceEconomicsForVendor(vendorId);
  }

  async assemble(input: ContextAssembleInput): Promise<ContextBundle> {
    const maxFacts = clamp(
      input.maxFacts ?? DEFAULTS.maxFacts,
      CLAMPS.maxFacts,
    );
    const maxChunks = clamp(
      input.maxChunks ?? DEFAULTS.maxChunks,
      CLAMPS.maxChunks,
    );
    const graphDepth = clamp(
      input.graphTraversalDepth ?? DEFAULTS.graphTraversalDepth,
      CLAMPS.graphTraversalDepth,
    );

    if (input.mode === "generic") {
      return emptyBundle(input, null, []);
    }

    if (input.mode === "corpus") {
      // INT-WV-2 · `corpus` mode now queries the worldview index.
      // Pattern catalog is still pending (CB-6); when worldview is
      // reachable we surface the worldview hits and skip the
      // pattern-catalog warning since the user IS getting corpus
      // content. When worldview itself is unreachable we tag both.
      const worldviewResult = await this.queryWorldviewSafe(input.query, null);
      const corpusPatternResult = await this.queryCorpusPatternsSafe(
        input,
        null,
      );
      const corpusPatterns = corpusPatternResult.patterns.map(
        patternHitFromCanonical,
      );
      const corpusWarnings: string[] = [];
      const corpusInfoTags: string[] = [];
      if (worldviewResult.reached) {
        if (worldviewResult.hits.length > 0) {
          corpusInfoTags.push(
            worldviewRetrievalInfoTag(worldviewResult.hits.length, 6),
          );
        }
      } else {
        corpusWarnings.push(WARNING_WORLDVIEW_PENDING);
      }
      if (corpusPatterns.length > 0) {
        corpusInfoTags.push(corpusPatternInfoTag(corpusPatterns.length));
      }
      corpusWarnings.push(...corpusWarningsFromIndex(corpusPatternResult));
      const bundle = emptyBundle(
        input,
        null,
        corpusWarnings,
        corpusInfoTags,
        worldviewResult.hits,
        corpusPatterns,
      );
      bundle.provenance = [
        ...worldviewResult.hits.map(provenanceForWorldviewChunk),
        ...corpusPatterns.map(provenanceForCorpusPattern),
      ];
      return bundle;
    }

    // tenant / full — both require a tenantKey.
    if (!input.tenantKey) {
      throw new MissingTenantKeyError(input.mode);
    }
    const tenantKey = input.tenantKey;
    const privateResource = getPrivateDataPlaneResource(tenantKey);

    const warnings: string[] = [];
    // CB-10 · info-tags are success metadata about how retrieval ran
    // (e.g. "Vector retrieval via Postgres pgvector (top-K=N).") — kept distinct
    // from warnings so the panel can render them in a separate
    // slate-toned strip rather than the amber warnings strip.
    const infoTags: string[] = [];
    if (privateResource) {
      infoTags.push(
        privateResource.privatePineconeIndex
          ? `Private data plane ${privateResource.dataPlaneId}: schema=${privateResource.privateSchema}; pinecone=${privateResource.privatePineconeIndex}.`
          : `Private data plane ${privateResource.dataPlaneId}: schema=${privateResource.privateSchema}; vector index unavailable (${privateResource.notes}).`,
      );
      if (!isPrivateVectorAvailable(privateResource)) {
        warnings.push(
          `Private vector retrieval unavailable for ${tenantKey}: ${privateResource.notes}`,
        );
      }
    }
    const keywords = extractKeywords(input.query);

    // ──────────────── Facts ────────────────
    // chunksByKeyword returns keyword-matched chunks; we walk back to
    // their source records via getRecord and dedupe. We over-fetch
    // (`maxFacts * 2`) to compensate for chunks that share a record.
    const seenRecordIds = new Set<string>();
    const facts: TenantRecord[] = [];

    const addFact = (record: TenantRecord | null | undefined): void => {
      if (!record || seenRecordIds.has(record.recordId)) return;
      seenRecordIds.add(record.recordId);
      facts.push(record);
    };

    if (shouldIncludeTenantProfileAnchors(input.query)) {
      const anchorResults = await Promise.allSettled([
        this.adapter.listRecords(tenantKey, "enterprise_profile", { limit: 3 }),
        this.adapter.listRecords(tenantKey, "it_landscape", {
          limit: 6,
          recordKind: "systems_inventory",
        }),
      ]);
      for (const result of anchorResults) {
        if (result.status !== "fulfilled") continue;
        for (const record of result.value) {
          addFact(record);
          if (facts.length >= maxFacts) break;
        }
        if (facts.length >= maxFacts) break;
      }
    }

    if (
      shouldIncludeVendorSpendAnchors(input.query) &&
      facts.length < maxFacts
    ) {
      const anchorResults = await Promise.allSettled([
        this.adapter.listRecords(tenantKey, "vendor_contracts", { limit: 80 }),
        this.adapter.listRecords(tenantKey, "it_financials", { limit: 80 }),
        this.adapter.listRecords(tenantKey, "it_landscape", { limit: 80 }),
      ]);
      const records = anchorResults.flatMap((result) =>
        result.status === "fulfilled" ? result.value : [],
      );
      const ranked = rankVendorSpendAnchorRecords(records, input.query);
      for (const record of ranked) {
        addFact(record);
        if (facts.length >= maxFacts) break;
      }
    }

    if (
      shouldIncludeStrategicDecisionAnchors(input.query) &&
      facts.length < maxFacts
    ) {
      const anchorResults = await Promise.allSettled([
        this.adapter.listRecords(tenantKey, "program_inventory", { limit: 80 }),
        this.adapter.listRecords(tenantKey, "kpi_dictionary", { limit: 80 }),
        this.adapter.listRecords(tenantKey, "cross_program_signals", {
          limit: 80,
        }),
        this.adapter.listRecords(tenantKey, "evidence_ledger", { limit: 80 }),
      ]);
      const records = anchorResults.flatMap((result) =>
        result.status === "fulfilled" ? result.value : [],
      );
      const ranked = rankStrategicDecisionAnchorRecords(
        records,
        input.query,
        tenantKey,
      );
      for (const record of ranked) {
        addFact(record);
        if (facts.length >= maxFacts) break;
      }
    }

    const seedChunks =
      keywords.length > 0 && facts.length < maxFacts
        ? await this.adapter.chunksByKeyword(tenantKey, keywords, maxFacts * 2)
        : [];

    for (const chunk of seedChunks) {
      if (!chunk.recordId) continue;
      if (seenRecordIds.has(chunk.recordId)) continue;
      const record = await this.adapter.getRecord(tenantKey, chunk.recordId);
      addFact(record);
      if (facts.length >= maxFacts) {
        break;
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
    // CB-3 / SCB W2.2: try Postgres pgvector retrieval first. If the
    // vector column/index is unavailable, or any embedding/query failure
    // occurs, fall back to keyword
    // retrieval and tag the bundle so the panel renders the right
    // empty-state copy.
    let semanticChunks: SemanticChunkHit[] = [];
    let vectorSucceeded = false;
    let azureSearchUsed = false;
    const vectorBlocked = Boolean(
      privateResource && !isPrivateVectorAvailable(privateResource),
    );
    // Azure AI Search retrieval lane (parallel-run prereq). When the
    // `retrieval_azure_search` flag is on for this tenant, dispatch to
    // the Azure index instead of pgvector. Drop-in shape: same
    // `ContextChunk[]` contract. On failure, fall back to pgvector
    // (do NOT swallow into keyword-only) so the rollout never regresses
    // beyond the existing path. The pgvector path stays first-class.
    const useAzureSearch =
      !vectorBlocked &&
      isFeatureEnabled({ clientKey: tenantKey }, "retrieval_azure_search");
    if (useAzureSearch) {
      try {
        const azureChunks = await this.azureSearchRetriever({
          tenantClientKey: tenantKey,
          query: input.query,
          topK: maxChunks,
        });
        semanticChunks = azureChunks.map((chunk) => ({
          chunk,
          score: chunk.vectorScore ?? 0,
        }));
        vectorSucceeded = true;
        azureSearchUsed = true;
      } catch {
        // Fall through to the pgvector path below — keeps the rollout
        // safe when the Azure index hiccups during cutover.
        azureSearchUsed = false;
      }
    }
    if (vectorBlocked) {
      warnings.push(WARNING_VECTOR_PENDING);
      const fallback: ContextChunk[] =
        keywords.length > 0
          ? await this.adapter.chunksByKeyword(tenantKey, keywords, maxChunks)
          : [];
      semanticChunks = fallback.map((chunk) => ({ chunk, score: 0 }));
    } else if (azureSearchUsed) {
      // Already populated above — nothing to do here.
    } else {
      try {
        // Embed the query once. `embedTexts` throws if OPENAI_API_KEY
        // is missing — which we catch below and fall back as vector
        // retrieval unavailable.
        const embedResult = await embedTexts(
          [input.query],
          {
            aiEgress: {
              tenantId: tenantKey,
              workflow: "context-broker-query-embedding",
              dataClass: "confidential",
              metadata: { tenantKey },
            },
          },
          this.openaiClient,
        );
        const queryVector = embedResult.results[0]?.embedding ?? [];
        if (queryVector.length === 0) {
          throw new Error(
            "embedTexts returned an empty embedding for the query.",
          );
        }
        const vectorChunks = await this.adapter.chunksByVector(
          tenantKey,
          queryVector,
          maxChunks,
        );
        if (vectorChunks.length === 0) {
          throw new Error("Vector retrieval returned no tenant chunks.");
        }
        semanticChunks = vectorChunks.map((chunk) => ({
          chunk,
          score: chunk.vectorScore ?? 0,
        }));
        vectorSucceeded = true;
      } catch {
        warnings.push(WARNING_VECTOR_PENDING);
        const fallback: ContextChunk[] =
          keywords.length > 0
            ? await this.adapter.chunksByKeyword(tenantKey, keywords, maxChunks)
            : [];
        semanticChunks = fallback.map((chunk) => ({ chunk, score: 0 }));
      }
    }
    if (vectorSucceeded) {
      // CB-10 · vector-retrieval-succeeded is success metadata, not a
      // warning — pushed onto `infoTags` so the panel renders it in a
      // distinct slate-toned strip rather than the amber warnings.
      infoTags.push(
        azureSearchUsed
          ? azureSearchRetrievalInfoTag(maxChunks)
          : vectorRetrievalInfoTag(maxChunks),
      );
    }

    // ──────────────── Worldview chunks (full mode) ────────────────
    // INT-WV-2 · in `full` mode, query the worldview index alongside
    // the tenant retrieval. Pattern catalog is still pending (CB-6)
    // so we only flag the catalog gap when worldview also fails to
    // reach — otherwise corpus content IS being delivered, just from
    // the worldview namespace rather than the pattern manifest.
    let worldviewChunks: WorldviewChunkHit[] = [];
    let corpusPatterns: CorpusPatternHit[] = [];
    if (input.mode === "full") {
      const worldviewResult = await this.queryWorldviewSafe(
        input.query,
        tenantKey,
      );
      const corpusPatternResult = await this.queryCorpusPatternsSafe(
        input,
        tenantKey,
      );
      corpusPatterns = corpusPatternResult.patterns.map(
        patternHitFromCanonical,
      );
      worldviewChunks = worldviewResult.hits;
      if (worldviewResult.reached) {
        if (worldviewChunks.length > 0) {
          infoTags.push(worldviewRetrievalInfoTag(worldviewChunks.length, 6));
        }
      } else {
        warnings.push(WARNING_WORLDVIEW_PENDING);
      }
      if (corpusPatterns.length > 0) {
        infoTags.push(corpusPatternInfoTag(corpusPatterns.length));
      }
      warnings.push(...corpusWarningsFromIndex(corpusPatternResult));
    }

    // ──────────────── Provenance ────────────────
    const provenance: ContextProvenance[] = [
      ...facts.map((fact) => provenanceForFact(fact, privateResource)),
      ...graphPaths.map((path) =>
        provenanceForNeighborhood(path, privateResource),
      ),
      ...semanticChunks.map((chunk) =>
        provenanceForChunk(chunk, privateResource),
      ),
      ...worldviewChunks.map(provenanceForWorldviewChunk),
      ...corpusPatterns.map(provenanceForCorpusPattern),
    ];

    return {
      query: input.query,
      mode: input.mode,
      tenantKey,
      facts,
      graphPaths,
      semanticChunks,
      corpusPatterns,
      worldviewChunks,
      provenance,
      assembledAt: nowIso(),
      warnings,
      infoTags,
      retrievalTrace: buildRetrievalTrace({
        tenantKey,
        resource: privateResource,
        facts,
        graphPaths,
        semanticChunks,
        worldviewChunks,
        corpusPatterns,
      }),
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
    tenantKey: string | null,
  ): Promise<{ hits: WorldviewChunkHit[]; reached: boolean }> {
    const queryVector = await embedQueryForWorldview(
      query,
      this.openaiClient,
      tenantKey,
    );
    if (!queryVector) return { hits: [], reached: false };
    return callWorldviewRetriever({ queryVector });
  }

  private async queryCorpusPatternsSafe(
    input: ContextAssembleInput,
    tenantKey: string | null,
  ): Promise<CanonicalPatternIndexResult> {
    try {
      const result = await this.corpusPatternRetriever(input, tenantKey);
      return filterCorpusPatternResultByTenantIndustry(result, tenantKey);
    } catch (error) {
      return {
        source: "persisted_canonical_corpus",
        status: "error",
        patterns: [],
        total: 0,
        warnings: [WARNING_CANONICAL_CORPUS_READ_FAILED],
        filters_applied: {
          query: input.query,
          tenant_key: tenantKey ?? undefined,
          limit: 8,
        },
        cache: { mode: "disabled", key: null, ttl_ms: 0 },
        error: error instanceof Error ? error.message : String(error),
      };
    }
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
