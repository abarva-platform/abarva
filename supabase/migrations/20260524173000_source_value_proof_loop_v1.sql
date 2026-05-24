-- Packet 23 · Source Procurement Value Proof Loop v1.
--
-- Tracks baseline commercial exposure, AbarVa intervention, negotiated
-- outcome, and realized/CFO-attested value for every Source event.

BEGIN;

CREATE TABLE IF NOT EXISTS public.source_value_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id TEXT NOT NULL,
  source_event_id UUID NOT NULL,
  state_layer TEXT NOT NULL
    CHECK (state_layer IN ('baseline', 'intervention', 'negotiated', 'realized')),
  state_subtype TEXT
    CHECK (state_subtype IS NULL OR state_subtype IN ('cost', 'risk_avoided', 'value_delivered', 'commercial_terms')),
  amount_usd NUMERIC,
  amount_basis TEXT NOT NULL
    CHECK (amount_basis IN ('projected', 'tracked', 'verified')),
  methodology TEXT NOT NULL,
  evidence_ledger_ids UUID[] NOT NULL DEFAULT ARRAY[]::UUID[],
  state_date TIMESTAMPTZ NOT NULL,
  attested_by TEXT,
  attested_at TIMESTAMPTZ,
  attestation_audit_id UUID REFERENCES public.ai_egress_audit(id),
  superseded_by UUID REFERENCES public.source_value_states(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by TEXT NOT NULL,
  CHECK (
    state_layer <> 'baseline'
    OR COALESCE(array_length(evidence_ledger_ids, 1), 0) >= 2
  ),
  CHECK (
    state_layer <> 'realized'
    OR (attested_by IS NOT NULL AND attested_at IS NOT NULL)
  )
);

CREATE OR REPLACE FUNCTION public.prevent_realized_source_value_state_update()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.state_layer = 'realized' OR NEW.state_layer = 'realized' THEN
    RAISE EXCEPTION 'realized source value state rows are immutable';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_realized_source_value_state_update
  ON public.source_value_states;

CREATE TRIGGER prevent_realized_source_value_state_update
  BEFORE UPDATE ON public.source_value_states
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_realized_source_value_state_update();

CREATE TABLE IF NOT EXISTS public.source_value_chain (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_event_id UUID NOT NULL,
  chain_step INTEGER NOT NULL CHECK (chain_step BETWEEN 1 AND 4),
  state_id UUID NOT NULL REFERENCES public.source_value_states(id) ON DELETE CASCADE,
  delta_from_prior_usd NUMERIC,
  delta_classification TEXT
    CHECK (delta_classification IS NULL OR delta_classification IN ('cost_avoided', 'cost_saved', 'risk_reduced', 'value_increased')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (source_event_id, chain_step)
);

CREATE INDEX IF NOT EXISTS source_value_states_event_idx
  ON public.source_value_states (client_id, source_event_id, state_layer, state_date DESC);

CREATE INDEX IF NOT EXISTS source_value_states_evidence_idx
  ON public.source_value_states USING gin (evidence_ledger_ids);

CREATE INDEX IF NOT EXISTS source_value_chain_event_idx
  ON public.source_value_chain (source_event_id, chain_step);

ALTER TABLE public.source_value_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.source_value_chain ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS service_role_all_source_value_states ON public.source_value_states;
CREATE POLICY service_role_all_source_value_states
  ON public.source_value_states
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS service_role_all_source_value_chain ON public.source_value_chain;
CREATE POLICY service_role_all_source_value_chain
  ON public.source_value_chain
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

DO $source_value_proof_rls$
BEGIN
  IF to_regprocedure('can_read_tenant_by_key(text)') IS NOT NULL
     AND to_regprocedure('can_write_tenant_by_key(text)') IS NOT NULL THEN
    DROP POLICY IF EXISTS authenticated_select_source_value_states ON public.source_value_states;
    CREATE POLICY authenticated_select_source_value_states
      ON public.source_value_states
      FOR SELECT TO authenticated
      USING (can_read_tenant_by_key(client_id));

    DROP POLICY IF EXISTS authenticated_insert_source_value_states ON public.source_value_states;
    CREATE POLICY authenticated_insert_source_value_states
      ON public.source_value_states
      FOR INSERT TO authenticated
      WITH CHECK (can_write_tenant_by_key(client_id));

    DROP POLICY IF EXISTS authenticated_update_source_value_states ON public.source_value_states;
    CREATE POLICY authenticated_update_source_value_states
      ON public.source_value_states
      FOR UPDATE TO authenticated
      USING (can_write_tenant_by_key(client_id))
      WITH CHECK (can_write_tenant_by_key(client_id));

    DROP POLICY IF EXISTS authenticated_select_source_value_chain ON public.source_value_chain;
    CREATE POLICY authenticated_select_source_value_chain
      ON public.source_value_chain
      FOR SELECT TO authenticated
      USING (
        EXISTS (
          SELECT 1
          FROM public.source_value_states svs
          WHERE svs.id = source_value_chain.state_id
            AND can_read_tenant_by_key(svs.client_id)
        )
      );
  ELSE
    RAISE NOTICE 'source-value-proof-v1: tenant key RLS helpers absent; authenticated policies skipped';
  END IF;
END
$source_value_proof_rls$;

GRANT SELECT, INSERT, UPDATE ON public.source_value_states TO authenticated;
GRANT SELECT ON public.source_value_chain TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.source_value_states TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.source_value_chain TO service_role;
REVOKE DELETE ON public.source_value_states FROM anon, authenticated, service_role;
REVOKE DELETE ON public.source_value_chain FROM anon, authenticated, service_role;

COMMENT ON TABLE public.source_value_states IS
  'Packet 23 Source value proof states: baseline, intervention, negotiated, realized.';

COMMENT ON TABLE public.source_value_chain IS
  'Ordered Source value proof chain with deltas between baseline, intervention, negotiated, and realized states.';

COMMIT;
