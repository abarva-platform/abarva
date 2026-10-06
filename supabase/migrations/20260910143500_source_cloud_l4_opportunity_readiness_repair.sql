-- Repair Source cloud-consumption Layer 4 opportunity readiness.
--
-- The Layer 4 opportunity view unions legacy Source opportunity rows with the
-- canonical optimization spine. When a cloud package has matching opportunity
-- IDs in both paths, the canonical spine must win; otherwise zero-dollar
-- control actions can be rendered as finance-required opportunities.

BEGIN;

DO $$
DECLARE
  annual_value_position integer;
  timing_window_position integer;
BEGIN
  SELECT ordinal_position
    INTO annual_value_position
    FROM information_schema.columns
   WHERE table_schema = 'consumption'
     AND table_name = 'sourcing_opportunity_v1'
     AND column_name = 'annual_value_exposed';

  SELECT ordinal_position
    INTO timing_window_position
    FROM information_schema.columns
   WHERE table_schema = 'consumption'
     AND table_name = 'sourcing_opportunity_v1'
     AND column_name = 'timing_window';

  IF timing_window_position IS NOT NULL
     AND annual_value_position IS NOT NULL
     AND timing_window_position < annual_value_position THEN
    EXECUTE $view$
      CREATE OR REPLACE VIEW consumption.sourcing_opportunity_v1 AS
      SELECT
        legacy.tenant_key,
        legacy.opportunity_id AS opportunity_ref,
        legacy.opportunity_id,
        legacy.vendor_id AS vendor_ref,
        legacy.vendor_id,
        legacy.contract_id AS contract_ref,
        legacy.contract_id,
        legacy.event_id AS event_ref,
        legacy.event_id,
        legacy.opportunity_type AS action_type,
        legacy.opportunity_type,
        legacy.title,
        legacy.finding_summary,
        legacy.deterministic_basis,
        legacy.value_low,
        legacy.value_high,
        legacy.timing_window,
        COALESCE(legacy.value_high, legacy.value_low) AS annual_value_exposed,
        COALESCE(legacy.value_low, 0) AS addressable_spend,
        CASE
          WHEN COALESCE(legacy.value_high, legacy.value_low, 0) >= 10000000 THEN 'high'
          WHEN COALESCE(legacy.value_high, legacy.value_low, 0) >= 1000000 THEN 'medium'
          ELSE 'low'
        END AS priority,
        legacy.confidence,
        CASE
          WHEN legacy.quality_state = 'accepted' AND legacy.confidence >= 0.75 THEN 'ready_to_act'
          WHEN legacy.quality_state IN ('missing_evidence', 'blocked') THEN 'evidence_blocked'
          ELSE 'review_required'
        END AS readiness_state,
        CASE WHEN legacy.evidence_reference IS NULL OR legacy.evidence_reference = '' THEN 'missing' ELSE 'present' END AS evidence_state,
        legacy.recommended_action,
        legacy.accountable_role,
        legacy.quality_state,
        NULL::date AS decision_due_date,
        legacy.opportunity_type AS finding_rule_ref,
        legacy.as_of_date,
        'skyharbor-v3-live-load-20260803'::text AS knowledge_baseline_ref,
        'sourcing-consumption-v1'::text AS projection_contract_version,
        legacy.quality_state AS authority_state,
        'current'::text AS freshness_state,
        'available'::text AS availability_state,
        legacy.load_run_id
      FROM source.sourcing_opportunity legacy
      WHERE source.can_read_sourcing_tenant(legacy.tenant_key)
        AND NOT EXISTS (
          SELECT 1
          FROM source.optimization_opportunity canonical
          WHERE canonical.tenant_key = legacy.tenant_key
            AND canonical.opportunity_id = legacy.opportunity_id
        )

      UNION ALL

      SELECT
        o.tenant_key,
        o.opportunity_id AS opportunity_ref,
        o.opportunity_id,
        o.vendor_id AS vendor_ref,
        o.vendor_id,
        o.contract_id AS contract_ref,
        o.contract_id,
        NULL::text AS event_ref,
        NULL::text AS event_id,
        o.value_type AS action_type,
        o.value_type AS opportunity_type,
        COALESCE(o.payload ->> 'title', o.narrative) AS title,
        COALESCE(o.payload ->> 'finding_summary', o.narrative) AS finding_summary,
        COALESCE(o.payload ->> 'deterministic_basis', o.payload ->> 'native_vs_nexus_note', o.blocking_gap, o.narrative) AS deterministic_basis,
        o.amount_usd AS value_low,
        o.amount_usd AS value_high,
        COALESCE(o.payload ->> 'timing_window', o.deadline::text) AS timing_window,
        o.amount_usd AS annual_value_exposed,
        o.amount_usd AS addressable_spend,
        CASE
          WHEN o.value_type = 'control_action' THEN 'control'
          WHEN COALESCE(o.amount_usd, 0) >= 10000000 THEN 'high'
          WHEN COALESCE(o.amount_usd, 0) >= 1000000 THEN 'medium'
          ELSE 'low'
        END AS priority,
        o.confidence,
        CASE
          WHEN o.value_type = 'control_action' THEN 'control_required'
          WHEN o.stage = 'finance_confirmed' THEN 'ready_to_act'
          WHEN o.approval_state = 'requires_review' THEN 'finance_confirmation_required'
          WHEN o.stage IN ('evidence_required', 'baseline_conflict') THEN 'evidence_blocked'
          ELSE 'review_required'
        END AS readiness_state,
        CASE
          WHEN EXISTS (
            SELECT 1
            FROM source.opportunity_evidence e
            WHERE e.tenant_key = o.tenant_key
              AND e.dataset_version = o.dataset_version
              AND e.opportunity_id = o.opportunity_id
              AND e.evidence_status = 'EVIDENCE_AVAILABLE'
          ) THEN 'present'
          ELSE 'missing'
        END AS evidence_state,
        o.next_action AS recommended_action,
        o.owner AS accountable_role,
        o.evidence_grade AS quality_state,
        o.deadline AS decision_due_date,
        o.value_type AS finding_rule_ref,
        o.created_at::date AS as_of_date,
        o.dataset_version AS knowledge_baseline_ref,
        'source-optimization-opportunity-v1'::text AS projection_contract_version,
        o.approval_state AS authority_state,
        'current'::text AS freshness_state,
        'available'::text AS availability_state,
        c.load_run_id
      FROM source.optimization_opportunity o
      JOIN source.contract c
        ON c.tenant_key = o.tenant_key
       AND c.contract_id = o.contract_id
      WHERE source.can_read_sourcing_tenant(o.tenant_key)
    $view$;
  ELSE
    EXECUTE $view$
      CREATE OR REPLACE VIEW consumption.sourcing_opportunity_v1 AS
      SELECT
        legacy.tenant_key,
        legacy.opportunity_id AS opportunity_ref,
        legacy.opportunity_id,
        legacy.vendor_id AS vendor_ref,
        legacy.vendor_id,
        legacy.contract_id AS contract_ref,
        legacy.contract_id,
        legacy.event_id AS event_ref,
        legacy.event_id,
        legacy.opportunity_type AS action_type,
        legacy.opportunity_type,
        legacy.title,
        legacy.finding_summary,
        legacy.deterministic_basis,
        legacy.value_low,
        legacy.value_high,
        COALESCE(legacy.value_high, legacy.value_low) AS annual_value_exposed,
        COALESCE(legacy.value_low, 0) AS addressable_spend,
        CASE
          WHEN COALESCE(legacy.value_high, legacy.value_low, 0) >= 10000000 THEN 'high'
          WHEN COALESCE(legacy.value_high, legacy.value_low, 0) >= 1000000 THEN 'medium'
          ELSE 'low'
        END AS priority,
        legacy.confidence,
        CASE
          WHEN legacy.quality_state = 'accepted' AND legacy.confidence >= 0.75 THEN 'ready_to_act'
          WHEN legacy.quality_state IN ('missing_evidence', 'blocked') THEN 'evidence_blocked'
          ELSE 'review_required'
        END AS readiness_state,
        CASE WHEN legacy.evidence_reference IS NULL OR legacy.evidence_reference = '' THEN 'missing' ELSE 'present' END AS evidence_state,
        legacy.recommended_action,
        legacy.accountable_role,
        NULL::date AS decision_due_date,
        legacy.opportunity_type AS finding_rule_ref,
        legacy.as_of_date,
        'skyharbor-v3-live-load-20260803'::text AS knowledge_baseline_ref,
        'sourcing-consumption-v1'::text AS projection_contract_version,
        legacy.quality_state AS authority_state,
        'current'::text AS freshness_state,
        'available'::text AS availability_state,
        legacy.load_run_id,
        legacy.timing_window,
        legacy.quality_state
      FROM source.sourcing_opportunity legacy
      WHERE source.can_read_sourcing_tenant(legacy.tenant_key)
        AND NOT EXISTS (
          SELECT 1
          FROM source.optimization_opportunity canonical
          WHERE canonical.tenant_key = legacy.tenant_key
            AND canonical.opportunity_id = legacy.opportunity_id
        )

      UNION ALL

      SELECT
        o.tenant_key,
        o.opportunity_id AS opportunity_ref,
        o.opportunity_id,
        o.vendor_id AS vendor_ref,
        o.vendor_id,
        o.contract_id AS contract_ref,
        o.contract_id,
        NULL::text AS event_ref,
        NULL::text AS event_id,
        o.value_type AS action_type,
        o.value_type AS opportunity_type,
        COALESCE(o.payload ->> 'title', o.narrative) AS title,
        COALESCE(o.payload ->> 'finding_summary', o.narrative) AS finding_summary,
        COALESCE(o.payload ->> 'deterministic_basis', o.payload ->> 'native_vs_nexus_note', o.blocking_gap, o.narrative) AS deterministic_basis,
        o.amount_usd AS value_low,
        o.amount_usd AS value_high,
        o.amount_usd AS annual_value_exposed,
        o.amount_usd AS addressable_spend,
        CASE
          WHEN o.value_type = 'control_action' THEN 'control'
          WHEN COALESCE(o.amount_usd, 0) >= 10000000 THEN 'high'
          WHEN COALESCE(o.amount_usd, 0) >= 1000000 THEN 'medium'
          ELSE 'low'
        END AS priority,
        o.confidence,
        CASE
          WHEN o.value_type = 'control_action' THEN 'control_required'
          WHEN o.stage = 'finance_confirmed' THEN 'ready_to_act'
          WHEN o.approval_state = 'requires_review' THEN 'finance_confirmation_required'
          WHEN o.stage IN ('evidence_required', 'baseline_conflict') THEN 'evidence_blocked'
          ELSE 'review_required'
        END AS readiness_state,
        CASE
          WHEN EXISTS (
            SELECT 1
            FROM source.opportunity_evidence e
            WHERE e.tenant_key = o.tenant_key
              AND e.dataset_version = o.dataset_version
              AND e.opportunity_id = o.opportunity_id
              AND e.evidence_status = 'EVIDENCE_AVAILABLE'
          ) THEN 'present'
          ELSE 'missing'
        END AS evidence_state,
        o.next_action AS recommended_action,
        o.owner AS accountable_role,
        o.deadline AS decision_due_date,
        o.value_type AS finding_rule_ref,
        o.created_at::date AS as_of_date,
        o.dataset_version AS knowledge_baseline_ref,
        'source-optimization-opportunity-v1'::text AS projection_contract_version,
        o.approval_state AS authority_state,
        'current'::text AS freshness_state,
        'available'::text AS availability_state,
        c.load_run_id,
        COALESCE(o.payload ->> 'timing_window', o.deadline::text) AS timing_window,
        o.evidence_grade AS quality_state
      FROM source.optimization_opportunity o
      JOIN source.contract c
        ON c.tenant_key = o.tenant_key
       AND c.contract_id = o.contract_id
      WHERE source.can_read_sourcing_tenant(o.tenant_key)
    $view$;
  END IF;
END $$;

COMMIT;
