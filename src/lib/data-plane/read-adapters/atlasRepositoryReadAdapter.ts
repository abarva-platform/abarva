// Atlas repository read adapter (Slice 9 — read side of src/lib/atlas/repository.ts).
//
// `src/lib/atlas/repository.ts` mixed 15+ read queries with the Atlas thread /
// trace / observation writes. Slice 6 (Tower) flagged it as needing its own
// slice precisely because reads and writes were interleaved. This adapter owns
// every PHYSICAL READ the repository issues; the companion
// `write-adapters/atlasRepositoryWriteAdapter.ts` owns every physical write.
// The repository keeps the orchestration: the row→view-model mapping, the
// legacy-fallback branching, and the two functions that genuinely interleave a
// read and a write (`getOrCreateAtlasThread`, `appendAtlasTrace`) stay in the
// repository and call BOTH adapters — a read adapter never writes.
//
//   ABARVA_DATA_PLANE=supabase        -> Supabase PostgREST reads (DEFAULT)
//   ABARVA_DATA_PLANE=azure-postgres  -> Azure Postgres SQL reads (opt-in)
//
// Every method returns the exact raw row projection the pre-seam repository
// consumed, so the repository's public function signatures and return shapes
// are byte-identical and every caller keeps working unchanged.

import type { PostgresCompatClient as SupabaseClient } from '@/lib/supabase-server';
import { getServerSupabase } from '@/lib/supabase-server';
import { createDefaultSession, type SessionRunner } from './azureSession';
import { resolveDataPlane } from './resolveDataPlane';
import type { DataPlane } from './types';

type JsonObject = Record<string, unknown>;

// --- raw row shapes (byte-identical to the pre-seam repository reads) -------

/** A `clients` name lookup row. */
export interface AtlasClientNameRow {
  name?: string;
}

/** A latest `portfolio_aggregates` row for a client. */
export interface AtlasPortfolioAggregateRow {
  client_id: string;
  aggregate_date: string;
  active_use_case_count: number;
  critical_signal_count: number;
  warning_signal_count: number;
  governed_ai_spend_usd: number;
  shadow_ai_spend_usd: number;
  estimated_value_usd: number;
  realized_value_usd: number;
  average_trustworthiness_score: number | null;
  stale_integration_count: number;
  aggregate_jsonb: JsonObject;
}

/** A legacy Shadow-AI `applications` row used by the fallback signal. */
export interface AtlasLegacyShadowAppRow {
  id: string;
  name: string;
  vendor: string | null;
  criticality: string | null;
  annual_cost_usd: number | null;
}

/** A `signal_firings` summary row (list view, with the catalog embed). */
export interface AtlasSignalFiringSummaryRow {
  id: string;
  headline: string;
  severity: 'critical' | 'warning' | 'info';
  state: 'new' | 'triaged' | 'actioned' | 'resolved' | 'suppressed';
  impact_usd: number | null;
  fired_at: string | null;
  evidence_summary_jsonb: JsonObject;
  cohort_context_jsonb: JsonObject;
  signal_catalog: { key: string; title: string; pillar: string } | null;
}

/** A `signal_firings` detail row (single signal, with routing defaults). */
export interface AtlasSignalFiringDetailRow {
  id: string;
  headline: string;
  severity: 'critical' | 'warning' | 'info';
  state: 'new' | 'triaged' | 'actioned' | 'resolved' | 'suppressed';
  impact_usd: number | null;
  fired_at: string | null;
  narrative_jsonb: JsonObject;
  evidence_summary_jsonb: JsonObject;
  cohort_context_jsonb: JsonObject;
  signal_catalog: { key: string; title: string; pillar: string; routing_defaults?: JsonObject } | null;
}

/** A `signal_evidence_chains` row for a signal firing. */
export interface AtlasSignalEvidenceRow {
  id: string;
  position: number;
  evidence_type: string;
  source_label: string;
  artifact_ref: string | null;
  vendor_name: string | null;
  title: string;
  summary: string | null;
  amount_usd: number | null;
  metric_value: number | null;
  metric_unit: string | null;
  confidence: 'high' | 'medium' | 'low';
  metadata_jsonb: JsonObject;
}

/** A `cohort_benchmarks` row for a metric. */
export interface AtlasCohortBenchmarkRow {
  pillar: string;
  metric_name: string;
  cohort_definition: JsonObject;
  sample_size: number;
  p25: number | null;
  p50: number | null;
  p75: number | null;
  p90: number | null;
  computation_notes: JsonObject;
}

/** A `cohort_peers` row used to plot peer benchmark points. */
export interface AtlasCohortPeerRow {
  display_name: string;
  metric_snapshot: JsonObject;
}

/** An `atlas_observations` row scoped to a client. */
export interface AtlasObservationRow {
  id: string;
  summary: string;
  severity: string;
  observation_kind: string;
  route_type: string;
  details_jsonb: JsonObject;
  created_at: string;
}

/** An `engagements` row as the Atlas programs list consumes it. */
export interface AtlasEngagementRow {
  id: string;
  name: string;
  current_phase: number | null;
  status: string | null;
  origin_source: string | null;
}

/** A `use_cases` row as the Atlas use-cases list consumes it. */
export interface AtlasUseCaseRow {
  id: string;
  name: string;
  stage: string | null;
  business_unit: string | null;
  vendor: string | null;
}

/**
 * The Atlas-repository read adapter for one physical data plane. Each method
 * is a thin physical read; the repository owns all view-model mapping and
 * fallback branching. Methods never write.
 */
export interface AtlasRepositoryReadAdapter {
  readonly name: DataPlane;
  /** Resolve a client's display name. Returns `null` when absent. */
  getClientName(clientId: string): Promise<AtlasClientNameRow | null>;
  /** Latest portfolio-aggregate row for a client, or `null`. */
  getLatestPortfolioAggregate(clientId: string): Promise<AtlasPortfolioAggregateRow | null>;
  /** Top-N legacy Shadow-AI application rows for the fallback signal. */
  listLegacyShadowApps(clientId: string): Promise<AtlasLegacyShadowAppRow[]>;
  /** Active signal firings for a client, ranked by impact then recency. */
  listSignalFirings(clientId: string, limit: number): Promise<AtlasSignalFiringSummaryRow[]>;
  /** One signal-firing detail row for a client, or `null`. */
  getSignalFiringDetail(clientId: string, signalId: string): Promise<AtlasSignalFiringDetailRow | null>;
  /** Evidence-chain rows for a signal firing, ordered by position. */
  listSignalEvidence(signalFiringId: string): Promise<AtlasSignalEvidenceRow[]>;
  /** Latest cohort benchmark for a metric, or `null`. */
  getCohortBenchmark(metricName: string): Promise<AtlasCohortBenchmarkRow | null>;
  /** Active cohort-peer rows (capped at 7). */
  listCohortPeers(): Promise<AtlasCohortPeerRow[]>;
  /** Recent `atlas_observations` rows for a client. */
  listObservations(clientId: string, limit: number): Promise<AtlasObservationRow[]>;
  /** Recent `engagements` rows for a client. */
  listEngagements(clientId: string, limit: number): Promise<AtlasEngagementRow[]>;
  /** Recent `use_cases` rows for a client. */
  listUseCases(clientId: string, limit: number): Promise<AtlasUseCaseRow[]>;
  /**
   * Look up an existing Atlas thread by id, scoped to the client. Returns the
   * `{ id }` row when it exists, `null` otherwise. Read-only — thread creation
   * is the write adapter's job; the repository orchestrates the two.
   */
  findThreadId(threadId: string, clientId: string): Promise<{ id: string } | null>;
  /**
   * Read the highest `turn_index` recorded for a thread. Returns `null` when
   * the thread has no traces yet. The repository turns this into the next
   * index and hands it to the write adapter.
   */
  getMaxTurnIndex(threadId: string): Promise<number | null>;
}

// Column / select lists lifted verbatim from `atlas/repository.ts`.
const SIGNAL_SUMMARY_SELECT =
  'id, headline, severity, state, impact_usd, fired_at, evidence_summary_jsonb, cohort_context_jsonb, signal_catalog:signal_catalog_id(key, title, pillar)';
const SIGNAL_DETAIL_SELECT =
  'id, headline, severity, state, impact_usd, fired_at, narrative_jsonb, evidence_summary_jsonb, cohort_context_jsonb, signal_catalog:signal_catalog_id(key, title, pillar, routing_defaults)';

// --- Supabase adapter (DEFAULT) --------------------------------------------

export type SupabaseFactory = () => SupabaseClient;

/**
 * Build the Supabase Atlas-repository read adapter. Every query is the exact
 * `.from(...).select(...)` chain the pre-seam repository ran, so the returned
 * rows are byte-identical.
 */
export function createSupabaseAtlasRepositoryReadAdapter(
  getClient: SupabaseFactory = getServerSupabase,
): AtlasRepositoryReadAdapter {
  return {
    name: 'supabase',

    async getClientName(clientId) {
      const { data } = await getClient()
        .from('clients')
        .select('name')
        .eq('id', clientId)
        .maybeSingle();
      return (data as AtlasClientNameRow | null) ?? null;
    },

    async getLatestPortfolioAggregate(clientId) {
      const { data } = await getClient()
        .from('portfolio_aggregates')
        .select('*')
        .eq('client_id', clientId)
        .order('aggregate_date', { ascending: false })
        .limit(1)
        .maybeSingle();
      return (data as AtlasPortfolioAggregateRow | null) ?? null;
    },

    async listLegacyShadowApps(clientId) {
      const { data } = await getClient()
        .from('applications')
        .select('id, name, vendor, criticality, annual_cost_usd')
        .eq('client_id', clientId)
        .eq('business_function', 'Shadow AI')
        .order('annual_cost_usd', { ascending: false })
        .limit(6);
      return (data as AtlasLegacyShadowAppRow[] | null) ?? [];
    },

    async listSignalFirings(clientId, limit) {
      const { data } = await getClient()
        .from('signal_firings')
        .select(SIGNAL_SUMMARY_SELECT)
        .eq('client_id', clientId)
        .in('state', ['new', 'triaged', 'actioned'])
        .order('impact_usd', { ascending: false, nullsFirst: false })
        .order('fired_at', { ascending: false })
        .limit(limit);
      return (data as AtlasSignalFiringSummaryRow[] | null) ?? [];
    },

    async getSignalFiringDetail(clientId, signalId) {
      const { data } = await getClient()
        .from('signal_firings')
        .select(SIGNAL_DETAIL_SELECT)
        .eq('client_id', clientId)
        .eq('id', signalId)
        .maybeSingle();
      return (data as AtlasSignalFiringDetailRow | null) ?? null;
    },

    async listSignalEvidence(signalFiringId) {
      const { data } = await getClient()
        .from('signal_evidence_chains')
        .select('*')
        .eq('signal_firing_id', signalFiringId)
        .order('position', { ascending: true });
      return (data as AtlasSignalEvidenceRow[] | null) ?? [];
    },

    async getCohortBenchmark(metricName) {
      const { data } = await getClient()
        .from('cohort_benchmarks')
        .select('*')
        .eq('metric_name', metricName)
        .order('computed_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      return (data as AtlasCohortBenchmarkRow | null) ?? null;
    },

    async listCohortPeers() {
      const { data } = await getClient()
        .from('cohort_peers')
        .select('display_name, metric_snapshot')
        .eq('active', true)
        .limit(7);
      return (data as AtlasCohortPeerRow[] | null) ?? [];
    },

    async listObservations(clientId, limit) {
      const { data } = await getClient()
        .from('atlas_observations')
        .select('id, summary, severity, observation_kind, route_type, details_jsonb, created_at')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(limit);
      return (data as AtlasObservationRow[] | null) ?? [];
    },

    async listEngagements(clientId, limit) {
      const { data } = await getClient()
        .from('engagements')
        .select('id, name, current_phase, status, origin_source')
        .eq('client_id', clientId)
        .order('updated_at', { ascending: false })
        .limit(limit);
      return (data as AtlasEngagementRow[] | null) ?? [];
    },

    async listUseCases(clientId, limit) {
      const { data } = await getClient()
        .from('use_cases')
        .select('id, name, stage, business_unit, vendor')
        .eq('client_id', clientId)
        .order('updated_at', { ascending: false })
        .limit(limit);
      return (data as AtlasUseCaseRow[] | null) ?? [];
    },

    async findThreadId(threadId, clientId) {
      const { data } = await getClient()
        .from('atlas_threads')
        .select('id')
        .eq('id', threadId)
        .eq('client_id', clientId)
        .maybeSingle();
      return (data as { id: string } | null) ?? null;
    },

    async getMaxTurnIndex(threadId) {
      const { data } = await getClient()
        .from('atlas_message_traces')
        .select('turn_index')
        .eq('atlas_thread_id', threadId)
        .order('turn_index', { ascending: false })
        .limit(1)
        .maybeSingle();
      const value = (data as { turn_index?: number } | null)?.turn_index;
      return typeof value === 'number' ? value : null;
    },
  };
}

// --- Azure Postgres adapter (opt-in) ---------------------------------------

/**
 * Build the Azure Postgres Atlas-repository read adapter. PostgREST `.eq()` /
 * `.in()` filters become `WHERE` predicates; `.order()` becomes `ORDER BY`;
 * the `signal_catalog:signal_catalog_id(...)` embed becomes a `LEFT JOIN`
 * whose columns are re-nested into the `signal_catalog` object so both planes
 * return one shared shape. The session runner is injectable for tests.
 */
export function createAzureAtlasRepositoryReadAdapter(
  session: SessionRunner = createDefaultSession('abarva-data-plane-atlas-repository'),
): AtlasRepositoryReadAdapter {
  return {
    name: 'azure-postgres',

    async getClientName(clientId) {
      return session(async (run) => {
        const rows = await run<AtlasClientNameRow>(
          'SELECT name FROM clients WHERE id = $1 LIMIT 1',
          [clientId],
        );
        return rows[0] ?? null;
      });
    },

    async getLatestPortfolioAggregate(clientId) {
      return session(async (run) => {
        const rows = await run<AtlasPortfolioAggregateRow>(
          `SELECT * FROM portfolio_aggregates
            WHERE client_id = $1
            ORDER BY aggregate_date DESC
            LIMIT 1`,
          [clientId],
        );
        return rows[0] ?? null;
      });
    },

    async listLegacyShadowApps(clientId) {
      return session((run) =>
        run<AtlasLegacyShadowAppRow>(
          `SELECT id, name, vendor, criticality, annual_cost_usd
             FROM applications
            WHERE client_id = $1 AND business_function = 'Shadow AI'
            ORDER BY annual_cost_usd DESC
            LIMIT 6`,
          [clientId],
        ),
      );
    },

    async listSignalFirings(clientId, limit) {
      return session(async (run) => {
        const rows = await run<AtlasSignalFiringSummaryRow & {
          sc_key: string | null;
          sc_title: string | null;
          sc_pillar: string | null;
        }>(
          `SELECT sf.id, sf.headline, sf.severity, sf.state, sf.impact_usd, sf.fired_at,
                  sf.evidence_summary_jsonb, sf.cohort_context_jsonb,
                  sc.key AS sc_key, sc.title AS sc_title, sc.pillar AS sc_pillar
             FROM signal_firings sf
             LEFT JOIN signal_catalog sc ON sc.id = sf.signal_catalog_id
            WHERE sf.client_id = $1
              AND sf.state = ANY($2::text[])
            ORDER BY sf.impact_usd DESC NULLS LAST, sf.fired_at DESC
            LIMIT $3`,
          [clientId, ['new', 'triaged', 'actioned'], limit],
        );
        return rows.map((r) => ({
          id: r.id,
          headline: r.headline,
          severity: r.severity,
          state: r.state,
          impact_usd: r.impact_usd,
          fired_at: r.fired_at,
          evidence_summary_jsonb: r.evidence_summary_jsonb,
          cohort_context_jsonb: r.cohort_context_jsonb,
          signal_catalog:
            r.sc_key == null
              ? null
              : { key: r.sc_key, title: r.sc_title ?? '', pillar: r.sc_pillar ?? '' },
        }));
      });
    },

    async getSignalFiringDetail(clientId, signalId) {
      return session(async (run) => {
        const rows = await run<AtlasSignalFiringDetailRow & {
          sc_key: string | null;
          sc_title: string | null;
          sc_pillar: string | null;
          sc_routing_defaults: JsonObject | null;
        }>(
          `SELECT sf.id, sf.headline, sf.severity, sf.state, sf.impact_usd, sf.fired_at,
                  sf.narrative_jsonb, sf.evidence_summary_jsonb, sf.cohort_context_jsonb,
                  sc.key AS sc_key, sc.title AS sc_title, sc.pillar AS sc_pillar,
                  sc.routing_defaults AS sc_routing_defaults
             FROM signal_firings sf
             LEFT JOIN signal_catalog sc ON sc.id = sf.signal_catalog_id
            WHERE sf.client_id = $1 AND sf.id = $2
            LIMIT 1`,
          [clientId, signalId],
        );
        const r = rows[0];
        if (!r) return null;
        return {
          id: r.id,
          headline: r.headline,
          severity: r.severity,
          state: r.state,
          impact_usd: r.impact_usd,
          fired_at: r.fired_at,
          narrative_jsonb: r.narrative_jsonb,
          evidence_summary_jsonb: r.evidence_summary_jsonb,
          cohort_context_jsonb: r.cohort_context_jsonb,
          signal_catalog:
            r.sc_key == null
              ? null
              : {
                  key: r.sc_key,
                  title: r.sc_title ?? '',
                  pillar: r.sc_pillar ?? '',
                  routing_defaults: r.sc_routing_defaults ?? undefined,
                },
        };
      });
    },

    async listSignalEvidence(signalFiringId) {
      return session((run) =>
        run<AtlasSignalEvidenceRow>(
          `SELECT * FROM signal_evidence_chains
            WHERE signal_firing_id = $1
            ORDER BY position ASC`,
          [signalFiringId],
        ),
      );
    },

    async getCohortBenchmark(metricName) {
      return session(async (run) => {
        const rows = await run<AtlasCohortBenchmarkRow>(
          `SELECT * FROM cohort_benchmarks
            WHERE metric_name = $1
            ORDER BY computed_at DESC
            LIMIT 1`,
          [metricName],
        );
        return rows[0] ?? null;
      });
    },

    async listCohortPeers() {
      return session((run) =>
        run<AtlasCohortPeerRow>(
          `SELECT display_name, metric_snapshot
             FROM cohort_peers
            WHERE active = true
            LIMIT 7`,
          [],
        ),
      );
    },

    async listObservations(clientId, limit) {
      return session((run) =>
        run<AtlasObservationRow>(
          `SELECT id, summary, severity, observation_kind, route_type, details_jsonb, created_at
             FROM atlas_observations
            WHERE client_id = $1
            ORDER BY created_at DESC
            LIMIT $2`,
          [clientId, limit],
        ),
      );
    },

    async listEngagements(clientId, limit) {
      return session((run) =>
        run<AtlasEngagementRow>(
          `SELECT id, name, current_phase, status, origin_source
             FROM engagements
            WHERE client_id = $1
            ORDER BY updated_at DESC
            LIMIT $2`,
          [clientId, limit],
        ),
      );
    },

    async listUseCases(clientId, limit) {
      return session((run) =>
        run<AtlasUseCaseRow>(
          `SELECT id, name, stage, business_unit, vendor
             FROM use_cases
            WHERE client_id = $1
            ORDER BY updated_at DESC
            LIMIT $2`,
          [clientId, limit],
        ),
      );
    },

    async findThreadId(threadId, clientId) {
      return session(async (run) => {
        const rows = await run<{ id: string }>(
          'SELECT id FROM atlas_threads WHERE id = $1 AND client_id = $2 LIMIT 1',
          [threadId, clientId],
        );
        return rows[0] ?? null;
      });
    },

    async getMaxTurnIndex(threadId) {
      return session(async (run) => {
        const rows = await run<{ turn_index?: number }>(
          `SELECT turn_index FROM atlas_message_traces
            WHERE atlas_thread_id = $1
            ORDER BY turn_index DESC
            LIMIT 1`,
          [threadId],
        );
        const value = rows[0]?.turn_index;
        return typeof value === 'number' ? value : null;
      });
    },
  };
}

// --- Selection -------------------------------------------------------------

/** Default singletons. */
export const supabaseAtlasRepositoryReadAdapter: AtlasRepositoryReadAdapter =
  createSupabaseAtlasRepositoryReadAdapter();
export const azureAtlasRepositoryReadAdapter: AtlasRepositoryReadAdapter =
  createAzureAtlasRepositoryReadAdapter();

/** Select the Atlas-repository read adapter for the configured data plane. */
export function selectAtlasRepositoryReadAdapter(
  plane?: DataPlane,
): AtlasRepositoryReadAdapter {
  const target = plane ?? resolveDataPlane();
  return target === 'azure-postgres'
    ? azureAtlasRepositoryReadAdapter
    : supabaseAtlasRepositoryReadAdapter;
}
