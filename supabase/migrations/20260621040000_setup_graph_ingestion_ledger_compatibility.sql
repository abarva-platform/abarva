-- Setup graph + ingestion ledger compatibility substrate.
--
-- Live Azure/Postgres preflight on 2026-06-21 found the setup inventory
-- tables present while enterprise_graph_nodes, enterprise_graph_edges, and
-- data_ingestion_runs were absent. Runtime code and setup-data loaders already
-- treat these tables as the Postgres relationship graph and ingestion ledger.
-- This migration is additive only: it creates missing objects and does not
-- mutate tenant rows.

BEGIN;

CREATE TABLE IF NOT EXISTS public.enterprise_graph_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  tenant_key TEXT NOT NULL,
  node_id TEXT NOT NULL,
  node_type TEXT NOT NULL,
  label TEXT NOT NULL,
  source_segment_id TEXT,
  source_record_id TEXT,
  source_doc TEXT,
  source_basis TEXT NOT NULL DEFAULT 'tenant_admin_upload',
  data_classification TEXT NOT NULL DEFAULT 'Internal',
  confidence NUMERIC(4,3) CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1)),
  last_reviewed DATE,
  properties JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_key, node_id)
);

CREATE TABLE IF NOT EXISTS public.enterprise_graph_edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  tenant_key TEXT NOT NULL,
  edge_id TEXT NOT NULL,
  from_node_id TEXT NOT NULL,
  to_node_id TEXT NOT NULL,
  edge_type TEXT NOT NULL,
  source_segment_id TEXT,
  source_record_id TEXT,
  source_doc TEXT,
  source_basis TEXT NOT NULL DEFAULT 'tenant_admin_upload',
  confidence NUMERIC(4,3) CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1)),
  properties JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_key, edge_id)
);

CREATE INDEX IF NOT EXISTS idx_enterprise_graph_nodes_tenant_type
  ON public.enterprise_graph_nodes(tenant_key, node_type);
CREATE INDEX IF NOT EXISTS idx_enterprise_graph_edges_tenant_type
  ON public.enterprise_graph_edges(tenant_key, edge_type);
CREATE INDEX IF NOT EXISTS idx_enterprise_graph_edges_from
  ON public.enterprise_graph_edges(tenant_key, from_node_id);
CREATE INDEX IF NOT EXISTS idx_enterprise_graph_edges_to
  ON public.enterprise_graph_edges(tenant_key, to_node_id);

CREATE TABLE IF NOT EXISTS public.data_ingestion_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  tenant_key TEXT NOT NULL,
  source_label TEXT NOT NULL,
  source_root TEXT,
  status TEXT NOT NULL CHECK (status IN ('started','completed','failed')) DEFAULT 'started',
  records_loaded BIGINT NOT NULL DEFAULT 0,
  chunks_loaded BIGINT NOT NULL DEFAULT 0,
  nodes_loaded BIGINT NOT NULL DEFAULT 0,
  edges_loaded BIGINT NOT NULL DEFAULT 0,
  summary JSONB NOT NULL DEFAULT '{}'::jsonb,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_data_ingestion_runs_tenant_started
  ON public.data_ingestion_runs(tenant_key, started_at DESC);

ALTER TABLE public.enterprise_graph_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enterprise_graph_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_ingestion_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all_enterprise_graph_nodes" ON public.enterprise_graph_nodes;
CREATE POLICY "service_role_all_enterprise_graph_nodes"
  ON public.enterprise_graph_nodes FOR ALL TO service_role
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_all_enterprise_graph_edges" ON public.enterprise_graph_edges;
CREATE POLICY "service_role_all_enterprise_graph_edges"
  ON public.enterprise_graph_edges FOR ALL TO service_role
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_all_data_ingestion_runs" ON public.data_ingestion_runs;
CREATE POLICY "service_role_all_data_ingestion_runs"
  ON public.data_ingestion_runs FOR ALL TO service_role
  USING (true) WITH CHECK (true);

NOTIFY pgrst, 'reload schema';

COMMIT;
