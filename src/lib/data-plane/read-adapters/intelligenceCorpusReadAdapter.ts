// Intelligence corpus read adapter (Slice 5 — server-component read paths).
//
// Backs the Apex Retail live intelligence layer rendered by the
// `/intelligence` server component via `intelligence-v3/apex-retail-live.ts`.
// That module composes a `ApexRetailIntelligenceData` view-model from five
// retail-corpus reads plus a `clients` lookup; all the composition maths
// (pattern roll-ups, map / brief builders) is pure presentation logic and
// stays in `apex-retail-live.ts`. The data plane owns ONLY the physical
// reads, extracted here behind the same `ABARVA_DATA_PLANE` switch.
//
//   ABARVA_DATA_PLANE=supabase        -> Supabase PostgREST (DEFAULT)
//   ABARVA_DATA_PLANE=azure-postgres  -> Azure Postgres SQL (opt-in)
//
// The pre-seam reads threw on a query error (`if (result.error) throw`) and
// the `clients` lookup threw too — the adapters preserve that exactly so
// callers' error handling is unchanged. Row shapes are the exact projections
// `apex-retail-live.ts` consumed pre-seam, so helper signatures and the
// `ApexRetailIntelligenceData` return shape are byte-identical.

import {
  getAzureReadFluentClient,
  type PostgresCompatClient as SupabaseClient,
} from '@/lib/data-plane/postgresCompat';
import { createDefaultSession, type SessionRunner } from './azureSession';
import { resolveDataPlane } from './resolveDataPlane';
import type { DataPlane } from './types';

/** A minimal `clients` row — what the demo loader resolves the tenant from. */
export interface CorpusClientRow {
  id: string;
  name: string;
  industry_code: string | null;
}

/** One `genome_patterns` row — the retail failure-pattern projection. */
export interface CorpusGenomePatternRow {
  code: string;
  name: string;
  description: string | null;
  summary: string | null;
  failure_rate_pct: number | null;
  office_category: string | null;
  keywords: string[] | null;
}

/** One `knowledge_sources` row — the retail knowledge-source projection. */
export interface CorpusKnowledgeSourceRow {
  source_key: string;
  title: string;
  publisher: string;
  content_type: string;
  summary: string | null;
}

/** One `use_cases` row — the Apex Retail use-case projection. */
export interface CorpusUseCaseRow {
  external_id: string | null;
  name: string;
  description: string | null;
  business_unit: string | null;
  domain: string | null;
  stage: string;
  ai_type: string | null;
  scope: string | null;
  vendor: string | null;
  systems: unknown;
  metadata: { related_patterns?: string[] } | null;
}

/** One `contradictions` row — the open-tension projection. */
export interface CorpusContradictionRow {
  short_title: string | null;
  summary: string | null;
  long_description: string | null;
  severity: 'high' | 'medium' | 'low';
  category: string | null;
  surfacing_priority: number;
  related_pattern_ids: string[] | null;
  implicated_initiative_refs: string[] | null;
}

/** One `intelligence_graph_edges` row — the portfolio-relationship projection. */
export interface CorpusEdgeRow {
  from_node_type: string;
  from_node_id: string;
  edge_type: string;
  to_node_type: string;
  to_node_id: string;
  source_key: string | null;
}

/** The full bundle of corpus reads for one tenant. */
export interface IntelligenceCorpusBundle {
  patterns: CorpusGenomePatternRow[];
  sources: CorpusKnowledgeSourceRow[];
  useCases: CorpusUseCaseRow[];
  contradictions: CorpusContradictionRow[];
  edges: CorpusEdgeRow[];
}

/** An Intelligence-corpus read adapter for one physical data plane. */
export interface IntelligenceCorpusReadAdapter {
  readonly name: DataPlane;
  /**
   * Resolve the Apex Retail tenant `clients` row by name. Returns `null`
   * when no matching row exists. Throws on a read failure — the pre-seam
   * demo loader threw on the Supabase error.
   */
  getApexRetailClient(): Promise<CorpusClientRow | null>;
  /**
   * Read the five retail-corpus projections for `clientId`. Throws on any
   * read failure — the pre-seam helper threw on the first query error.
   */
  getCorpusBundle(clientId: string): Promise<IntelligenceCorpusBundle>;
}

// --- Shared SQL / select fragments -----------------------------------------

const CLIENT_SELECT = 'id, name, industry_code';
const PATTERNS_SELECT =
  'code, name, description, summary, failure_rate_pct, office_category, keywords';
const SOURCES_SELECT = 'source_key, title, publisher, content_type, summary';
const USE_CASES_SELECT =
  'external_id, name, description, business_unit, domain, stage, ai_type, scope, vendor, systems, metadata';
const CONTRADICTIONS_SELECT =
  'short_title, summary, long_description, severity, category, surfacing_priority, related_pattern_ids, implicated_initiative_refs';
const EDGES_SELECT =
  'from_node_type, from_node_id, edge_type, to_node_type, to_node_id, source_key';

/** Apex Retail tenant name aliases — lifted verbatim from the demo loader. */
const APEX_RETAIL_NAMES = ['Apex Retail', 'Apex Retail Group'];

// --- Supabase adapter (DEFAULT) --------------------------------------------

export type SupabaseFactory = () => SupabaseClient;

/**
 * Build the Supabase Intelligence-corpus adapter. Each query is the exact
 * builder chain `apex-retail-live.ts` ran pre-seam, so returned rows are
 * byte-identical.
 */
export function createSupabaseIntelligenceCorpusReadAdapter(
  getClient: SupabaseFactory = getAzureReadFluentClient,
): IntelligenceCorpusReadAdapter {
  return {
    name: 'supabase',
    async getApexRetailClient() {
      const sb = getClient();
      const { data, error } = await sb
        .from('clients')
        .select(CLIENT_SELECT)
        .in('name', APEX_RETAIL_NAMES)
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return (data as CorpusClientRow | null) ?? null;
    },
    async getCorpusBundle(clientId) {
      const sb = getClient();
      const [
        patternsResult,
        sourcesResult,
        useCasesResult,
        contradictionsResult,
        edgesResult,
      ] = await Promise.all([
        sb
          .from('genome_patterns')
          .select(PATTERNS_SELECT)
          .eq('vertical', 'retail')
          .gte('code', 'F200')
          .lte('code', 'F239')
          .eq('is_active', true)
          .order('code'),
        sb
          .from('knowledge_sources')
          .select(SOURCES_SELECT)
          .eq('pinecone_namespace', 'retail-knowledge-sources')
          .eq('status', 'active')
          .order('source_key'),
        sb
          .from('use_cases')
          .select(USE_CASES_SELECT)
          .eq('client_id', clientId)
          .like('external_id', 'apex_retail_%')
          .order('name'),
        sb
          .from('contradictions')
          .select(CONTRADICTIONS_SELECT)
          .eq('client_id', clientId)
          .is('resolved_at', null)
          .order('surfacing_priority', { ascending: false }),
        sb
          .from('intelligence_graph_edges')
          .select(EDGES_SELECT)
          .eq('vertical', 'retail'),
      ]);

      if (patternsResult.error) throw patternsResult.error;
      if (sourcesResult.error) throw sourcesResult.error;
      if (useCasesResult.error) throw useCasesResult.error;
      if (contradictionsResult.error) throw contradictionsResult.error;
      if (edgesResult.error) throw edgesResult.error;

      return {
        patterns: (patternsResult.data ?? []) as CorpusGenomePatternRow[],
        sources: (sourcesResult.data ?? []) as CorpusKnowledgeSourceRow[],
        useCases: (useCasesResult.data ?? []) as CorpusUseCaseRow[],
        contradictions: (contradictionsResult.data ?? []) as CorpusContradictionRow[],
        edges: (edgesResult.data ?? []) as CorpusEdgeRow[],
      };
    },
  };
}

// --- Azure Postgres adapter (opt-in) ---------------------------------------

/**
 * Build the Azure Postgres Intelligence-corpus adapter. Each PostgREST
 * builder chain becomes the equivalent SQL: `.in('name', names)` →
 * `name = ANY($1)`, `.like(...)` → `LIKE`, `.is('resolved_at', null)` →
 * `IS NULL`, `.order(...)` → `ORDER BY`. Row semantics are identical. A
 * read failure throws — matching the pre-seam helper. The session runner is
 * injectable so tests drive an in-memory fake.
 */
export function createAzureIntelligenceCorpusReadAdapter(
  session: SessionRunner = createDefaultSession('abarva-data-plane-intelligence-corpus'),
): IntelligenceCorpusReadAdapter {
  return {
    name: 'azure-postgres',
    async getApexRetailClient() {
      return session(async (run) => {
        const rows = await run<CorpusClientRow>(
          `SELECT ${CLIENT_SELECT} FROM clients WHERE name = ANY($1::text[]) LIMIT 1`,
          [APEX_RETAIL_NAMES],
        );
        return rows[0] ?? null;
      });
    },
    async getCorpusBundle(clientId) {
      return session(async (run) => {
        const [patterns, sources, useCases, contradictions, edges] = await Promise.all([
          run<CorpusGenomePatternRow>(
            `SELECT ${PATTERNS_SELECT}
               FROM genome_patterns
              WHERE vertical = 'retail'
                AND code >= 'F200' AND code <= 'F239'
                AND is_active = true
              ORDER BY code`,
            [],
          ),
          run<CorpusKnowledgeSourceRow>(
            `SELECT ${SOURCES_SELECT}
               FROM knowledge_sources
              WHERE pinecone_namespace = 'retail-knowledge-sources'
                AND status = 'active'
              ORDER BY source_key`,
            [],
          ),
          run<CorpusUseCaseRow>(
            `SELECT ${USE_CASES_SELECT}
               FROM use_cases
              WHERE client_id = $1
                AND external_id LIKE 'apex_retail_%'
              ORDER BY name`,
            [clientId],
          ),
          run<CorpusContradictionRow>(
            `SELECT ${CONTRADICTIONS_SELECT}
               FROM contradictions
              WHERE client_id = $1
                AND resolved_at IS NULL
              ORDER BY surfacing_priority DESC`,
            [clientId],
          ),
          run<CorpusEdgeRow>(
            `SELECT ${EDGES_SELECT}
               FROM intelligence_graph_edges
              WHERE vertical = 'retail'`,
            [],
          ),
        ]);
        return { patterns, sources, useCases, contradictions, edges };
      });
    },
  };
}

// --- Selection -------------------------------------------------------------

/** Default singletons. */
export const supabaseIntelligenceCorpusReadAdapter: IntelligenceCorpusReadAdapter =
  createSupabaseIntelligenceCorpusReadAdapter();
export const azureIntelligenceCorpusReadAdapter: IntelligenceCorpusReadAdapter =
  createAzureIntelligenceCorpusReadAdapter();

/** Select the Intelligence-corpus read adapter for the configured data plane. */
export function selectIntelligenceCorpusReadAdapter(
  plane?: DataPlane,
): IntelligenceCorpusReadAdapter {
  const target = plane ?? resolveDataPlane();
  return target === 'azure-postgres'
    ? azureIntelligenceCorpusReadAdapter
    : supabaseIntelligenceCorpusReadAdapter;
}
