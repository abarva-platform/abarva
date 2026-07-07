-- FIRST CAPITAL CONTEXT ENGINE: DIMENSION FAMILY COLUMNS
-- Additive metadata needed to query the same context substrate by
-- family, domain segment, business function, load order, and graph edges.

BEGIN;

DO $$
BEGIN
  IF to_regclass('public.enterprise_context_records') IS NULL THEN
    RAISE NOTICE 'enterprise_context_records absent - skipping dimension family record columns and indexes.';
  ELSE
    ALTER TABLE public.enterprise_context_records
      ADD COLUMN IF NOT EXISTS dimension_family TEXT CHECK (dimension_family IN (
        'enterprise_operating_model',
        'technology_estate',
        'data_connectivity',
        'financial_commercial',
        'execution_operations',
        'governance_ai_evidence',
        'personas_workforce'
      ));

    ALTER TABLE public.enterprise_context_records
      ADD COLUMN IF NOT EXISTS domain_segment TEXT CHECK (domain_segment IN (
        'DATA_ANALYTICS',
        'ERP',
        'DIGITAL_CX',
        'OPERATIONS',
        'INFRASTRUCTURE',
        'SECURITY_IDENTITY',
        'HR_WORKFORCE',
        'COLLABORATION'
      ));

    ALTER TABLE public.enterprise_context_records
      ADD COLUMN IF NOT EXISTS business_function TEXT;

    ALTER TABLE public.enterprise_context_records
      ADD COLUMN IF NOT EXISTS load_order INTEGER;

    CREATE INDEX IF NOT EXISTS idx_ecr_tenant_family
      ON public.enterprise_context_records (tenant_key, dimension_family)
      WHERE lifecycle_state = 'active';
  END IF;

  IF to_regclass('public.enterprise_context_facts') IS NULL THEN
    RAISE NOTICE 'enterprise_context_facts absent - skipping dimension family fact columns and indexes.';
  ELSE
    ALTER TABLE public.enterprise_context_facts
      ADD COLUMN IF NOT EXISTS dimension_family TEXT;

    ALTER TABLE public.enterprise_context_facts
      ADD COLUMN IF NOT EXISTS domain_segment TEXT;

    CREATE INDEX IF NOT EXISTS idx_ecf_tenant_family
      ON public.enterprise_context_facts (tenant_key, dimension_family)
      WHERE lifecycle_state = 'active';
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.enterprise_context_relationships') IS NULL THEN
    RAISE NOTICE 'enterprise_context_relationships absent - skipping ai_control_graph_view.';
  ELSE
    EXECUTE $view$
      CREATE OR REPLACE VIEW public.ai_control_graph_view AS
        SELECT
          r.id,
          r.tenant_key,
          r.relationship_type,
          r.from_record_id,
          r.to_record_id,
          r.from_external_id,
          r.to_external_id,
          r.properties,
          r.lifecycle_state,
          r.created_at
        FROM public.enterprise_context_relationships r
    $view$;

    COMMENT ON VIEW public.ai_control_graph_view IS
      'Read-only alias over enterprise_context_relationships for Tower substrate queries. Write to enterprise_context_relationships directly.';
  END IF;
END $$;

COMMIT;
