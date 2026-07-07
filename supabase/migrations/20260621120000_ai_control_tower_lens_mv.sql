-- TOWER DURABLE P4 PROJECTION — ai_control_tower_lens_mv
--
-- Implements §4f of docs/codex-handoff/FIRST_CAPITAL_INTELLIGENCE_SUBSTRATE_BRIEF.md
-- ("Tower projection — retire the dual substrate").
--
-- Problem this fixes (confirmed live 2026-06-18): the Tower read model
-- (src/lib/ai-control-tower/read-model.ts) reads a *separate* substrate
-- (`ai_control_*` + `ai_control_refresh_runs`, scoped by client_id /
-- refresh_run_id). For first-capital that substrate was never loaded — only
-- the context layer (`enterprise_context_*`) was — so Tower falls back to the
-- packaged synthetic demo substrate ("Demo fallback" banner).
--
-- The durable fix is to make the Tower a DETERMINISTIC PROJECTION over the
-- committed context layer, so every tenant with committed context gets a live
-- Tower with no per-tenant Tower load. This migration materializes that
-- projection as `ai_control_tower_lens_mv`, projected from
-- `enterprise_context_records` + `enterprise_context_facts` filtered to the
-- Tower record types and the `governance_ai_evidence` dimension family (the
-- T01–T10 supplement, dimension 18). Every row is scoped by `tenant_key` and
-- `client_id`.
--
-- The MV emits ONE row per (tenant, record) carrying the typed facts the eight
-- Tower lenses need (initiative / spend / risk / agent / productivity / usage /
-- evidence / action). The read model
-- src/lib/tower/control-tower-lens-projection.ts shapes these rows into the
-- existing AiControlTowerReadModel lens types — the lens SHAPES are unchanged,
-- only their source.
--
-- Defensive note on typed columns: the P3 migration
-- (20260619000000_fact_typed_values_and_canonical_identity.sql — typed
-- value_numeric/value_date/value_text/unit/as_of_date + records.canonical_entity_id)
-- is specced but may not be applied yet on a given environment. This MV does
-- NOT depend on those columns. It reads values out of `fact_value` JSONB and
-- `fact_text`, so it is correct against the base schema and only gets richer
-- (not broken) once P3 lands. The MV is guarded so it is skipped cleanly if the
-- context layer is absent.
--
-- Refresh: idx_ai_control_tower_lens_mv_unique is a UNIQUE index over
-- (tenant_key, record_uid) so the projection can be refreshed with
-- REFRESH MATERIALIZED VIEW CONCURRENTLY ai_control_tower_lens_mv. The refresh
-- job (scripts/jobs/refresh-read-models.ts, per §4b) runs at the end of every
-- context load and on demand.
--
-- Rollback (down): see the explicit DROP block at the bottom of this file.
--
-- NOT live-proven here: localhost cannot reach the private VNet Postgres.
-- This migration must be applied as an ACA job inside the VNet
-- (az acr build → override the db-migrate job image → run → read Log Analytics).

BEGIN;

DO $$
BEGIN
  IF to_regclass('public.enterprise_context_records') IS NULL
     OR to_regclass('public.enterprise_context_facts') IS NULL THEN
    RAISE NOTICE 'enterprise_context_records/_facts absent - skipping ai_control_tower_lens_mv.';
    RETURN;
  END IF;

  -- Idempotent: drop an existing projection before recreating so re-runs and
  -- column-contract changes are clean.
  EXECUTE 'DROP MATERIALIZED VIEW IF EXISTS public.ai_control_tower_lens_mv CASCADE';

  EXECUTE $mv$
    CREATE MATERIALIZED VIEW public.ai_control_tower_lens_mv AS
    WITH tower_records AS (
      -- The Tower record universe: explicit Tower record types plus anything
      -- the loader tagged into the governance_ai_evidence dimension family
      -- (the T01–T10 AI Control supplement, dimension 18).
      SELECT
        r.id                AS record_id,
        r.client_id,
        r.tenant_key,
        r.canonical_record_id,
        r.record_type,
        r.record_subtype,
        r.title,
        r.business_function,
        r.dimension_family,
        r.domain_segment,
        r.owner,
        r.steward_owner,
        r.payload,
        r.confidence        AS record_confidence,
        r.freshness_status,
        r.evidence_pointer,
        r.source_file,
        r.source_row_number,
        r.created_at        AS record_created_at,
        r.updated_at        AS record_updated_at
      FROM public.enterprise_context_records r
      WHERE r.lifecycle_state = 'active'
        AND (
          r.dimension_family = 'governance_ai_evidence'
          OR r.record_type IN (
            'initiative',
            'spend_contract',
            'benefit_realization',
            'risk_governance',
            'model_risk',
            'agent',
            'productivity',
            'usage',
            'evidence',
            'action'
          )
        )
    ),
    fact_rollup AS (
      -- Collapse each record's active facts into one JSONB bag keyed by
      -- fact_key, preserving the raw value, the typed scalar (numeric/date/
      -- text), the unit and the as_of date when the loader supplied them in
      -- the JSONB payload. The Tower read model reads scalars out of this bag.
      SELECT
        f.record_id,
        jsonb_object_agg(
          f.fact_key,
          jsonb_build_object(
            'value',     f.fact_value,
            'text',      f.fact_text,
            'numeric',   (f.fact_value ->> 'numeric'),
            'date',      COALESCE(f.fact_value ->> 'date', f.fact_value ->> 'as_of_date'),
            'unit',      (f.fact_value ->> 'unit'),
            'as_of',     COALESCE(f.fact_value ->> 'as_of_date', f.valid_from::text),
            'confidence', f.confidence,
            'evidence',  f.evidence_pointer,
            'fact_id',   f.id
          )
        )                                            AS facts,
        COUNT(*)                                     AS fact_count,
        MAX(f.confidence)                            AS max_fact_confidence,
        BOOL_OR(f.evidence_pointer IS NOT NULL)      AS has_evidence_pointer
      FROM public.enterprise_context_facts f
      WHERE f.lifecycle_state = 'active'
      GROUP BY f.record_id
    )
    SELECT
      -- record_uid is the unique grain (tenant_key, record_uid) backing the
      -- CONCURRENTLY refresh index.
      tr.record_id                                   AS record_uid,
      tr.client_id,
      tr.tenant_key,
      tr.canonical_record_id,
      tr.record_type                                 AS lens_record_type,
      tr.record_subtype,
      tr.title,
      tr.business_function,
      tr.dimension_family,
      tr.domain_segment,
      tr.owner,
      tr.steward_owner,
      tr.payload,
      COALESCE(fr.facts, '{}'::jsonb)                AS facts,
      COALESCE(fr.fact_count, 0)                     AS fact_count,
      tr.record_confidence,
      fr.max_fact_confidence,
      tr.freshness_status,
      tr.evidence_pointer,
      COALESCE(fr.has_evidence_pointer, false)       AS has_evidence_pointer,
      tr.source_file,
      tr.source_row_number,
      tr.record_created_at,
      tr.record_updated_at
    FROM tower_records tr
    LEFT JOIN fact_rollup fr ON fr.record_id = tr.record_id
  $mv$;

  -- UNIQUE index → enables REFRESH MATERIALIZED VIEW CONCURRENTLY.
  EXECUTE 'CREATE UNIQUE INDEX IF NOT EXISTS idx_ai_control_tower_lens_mv_unique '
        || 'ON public.ai_control_tower_lens_mv (tenant_key, record_uid)';

  -- Tenant + lens lookup index (the read model filters by tenant_key, then
  -- groups by lens_record_type).
  EXECUTE 'CREATE INDEX IF NOT EXISTS idx_ai_control_tower_lens_mv_tenant_type '
        || 'ON public.ai_control_tower_lens_mv (tenant_key, lens_record_type)';

  -- client_id lookup (the read model resolves either by client_id or tenant_key).
  EXECUTE 'CREATE INDEX IF NOT EXISTS idx_ai_control_tower_lens_mv_client '
        || 'ON public.ai_control_tower_lens_mv (client_id)';

  EXECUTE $cmt$
    COMMENT ON MATERIALIZED VIEW public.ai_control_tower_lens_mv IS
      'Durable Tower P4 projection (§4f). Deterministic projection of the AI '
      'Control Tower lens over the committed context layer '
      '(enterprise_context_records + enterprise_context_facts, '
      'source = context_projection). One row per active Tower record carrying '
      'a JSONB fact bag for the eight Tower lenses. Refresh with REFRESH '
      'MATERIALIZED VIEW CONCURRENTLY ai_control_tower_lens_mv. Read via '
      'src/lib/tower/control-tower-lens-projection.ts. Do not write to this view.'
  $cmt$;
END $$;

NOTIFY pgrst, 'reload schema';

COMMIT;

-- ─────────────────────────────────────────────────────────────────────────────
-- DOWN / ROLLBACK
-- ─────────────────────────────────────────────────────────────────────────────
-- To roll this migration back, run:
--
--   BEGIN;
--   DROP MATERIALIZED VIEW IF EXISTS public.ai_control_tower_lens_mv CASCADE;
--   NOTIFY pgrst, 'reload schema';
--   COMMIT;
--
-- Dropping the MV cascades its indexes
-- (idx_ai_control_tower_lens_mv_unique / _tenant_type / _client). No base
-- tables are affected — this projection is read-only over the context layer.
