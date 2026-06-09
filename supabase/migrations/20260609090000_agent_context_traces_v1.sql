-- Agent Context-Bundle Trace v1.
--
-- One row per governed Nexus / Sentinel response. Proves Claude reasoning was
-- downstream of retrieval / context-bundle assembly, records included vs
-- excluded context objects (with governance reason), and carries the
-- post-response validation verdicts (wisdom rubric, claim/citation, tenant
-- isolation). Append-only by trigger.
--
-- PRIVACY: stores object IDs, source IDs, chunk/record/pattern/artifact IDs,
-- policy decisions, counts, and a sha256 hash of the model input. It does NOT
-- store raw full prompts or sensitive source text. Human-readable labels are
-- stripped in redacted mode (the default). See src/lib/agent-trace/redaction.ts.

BEGIN;

CREATE TABLE IF NOT EXISTS public.agent_context_traces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id TEXT NOT NULL,
  tenant_id TEXT,
  tenant_key TEXT,
  agent TEXT NOT NULL CHECK (agent IN ('nexus', 'sentinel')),
  surface TEXT NOT NULL
    CHECK (surface IN ('moves', 'intelligence', 'source', 'tower', 'chat', 'unknown')),
  user_intent TEXT,
  resolved_phase TEXT,
  source_basis_count INTEGER NOT NULL DEFAULT 0,
  model_input_hash TEXT NOT NULL,
  response_id TEXT,
  validation_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (validation_status IN ('pending', 'pass', 'fail', 'not_run')),
  claim_validation_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (claim_validation_status IN ('pending', 'pass', 'fail', 'not_run')),
  tenant_isolation_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (tenant_isolation_status IN ('pending', 'pass', 'fail', 'not_run')),
  redacted BOOLEAN NOT NULL DEFAULT true,
  trace_version TEXT NOT NULL,
  -- Full structured spine: eligible_datasets, retrieved_* (ids/kinds only),
  -- excluded_objects (id + reason), confidence_distribution, missing_context,
  -- grounding_report, citation_objects_emitted. No raw source text.
  trace JSONB NOT NULL DEFAULT '{}'::jsonb,
  emitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS agent_context_traces_tenant_idx
  ON public.agent_context_traces (tenant_key, agent, surface);

CREATE INDEX IF NOT EXISTS agent_context_traces_question_idx
  ON public.agent_context_traces (question_id);

CREATE INDEX IF NOT EXISTS agent_context_traces_emitted_idx
  ON public.agent_context_traces (emitted_at);

CREATE INDEX IF NOT EXISTS agent_context_traces_validation_idx
  ON public.agent_context_traces (validation_status, tenant_isolation_status);

ALTER TABLE public.agent_context_traces ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS service_role_all_agent_context_traces ON public.agent_context_traces;
CREATE POLICY service_role_all_agent_context_traces
  ON public.agent_context_traces
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

DO $agent_context_traces_rls$
BEGIN
  IF to_regprocedure('can_read_tenant_by_key(text)') IS NOT NULL
     AND to_regprocedure('can_write_tenant_by_key(text)') IS NOT NULL THEN
    DROP POLICY IF EXISTS authenticated_select_agent_context_traces ON public.agent_context_traces;
    CREATE POLICY authenticated_select_agent_context_traces
      ON public.agent_context_traces
      FOR SELECT TO authenticated
      USING (tenant_key IS NULL OR can_read_tenant_by_key(tenant_key));

    DROP POLICY IF EXISTS authenticated_insert_agent_context_traces ON public.agent_context_traces;
    CREATE POLICY authenticated_insert_agent_context_traces
      ON public.agent_context_traces
      FOR INSERT TO authenticated
      WITH CHECK (tenant_key IS NULL OR can_write_tenant_by_key(tenant_key));
  ELSE
    RAISE NOTICE 'agent-context-traces-v1: tenant key RLS helpers absent; authenticated policies skipped';
  END IF;
END
$agent_context_traces_rls$;

CREATE OR REPLACE FUNCTION public.agent_context_traces_immutable()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'agent_context_traces is append-only: UPDATE and DELETE are not permitted';
END;
$$;

DROP TRIGGER IF EXISTS agent_context_traces_no_update ON public.agent_context_traces;
CREATE TRIGGER agent_context_traces_no_update
  BEFORE UPDATE ON public.agent_context_traces
  FOR EACH ROW EXECUTE FUNCTION public.agent_context_traces_immutable();

DROP TRIGGER IF EXISTS agent_context_traces_no_delete ON public.agent_context_traces;
CREATE TRIGGER agent_context_traces_no_delete
  BEFORE DELETE ON public.agent_context_traces
  FOR EACH ROW EXECUTE FUNCTION public.agent_context_traces_immutable();

GRANT SELECT, INSERT ON public.agent_context_traces TO authenticated;
GRANT SELECT, INSERT ON public.agent_context_traces TO service_role;
REVOKE UPDATE, DELETE ON public.agent_context_traces FROM anon, authenticated, service_role;

COMMENT ON TABLE public.agent_context_traces IS
  'Append-only trace of every governed Nexus/Sentinel response: included/excluded context objects (ids + reasons), grounding report, hashed model input, and validation verdicts. No raw prompts or source text.';

COMMENT ON COLUMN public.agent_context_traces.model_input_hash IS
  'sha256 of the exact system+user input sent to Claude. Proves which input produced the response without persisting the text.';

COMMENT ON COLUMN public.agent_context_traces.trace IS
  'Structured spine (ids/kinds/reasons/counts only). Human-readable labels are stripped when redacted = true.';

NOTIFY pgrst, 'reload schema';

COMMIT;
