-- Wave 3a: deliverables_v2 backfill for 20 demo moves with zero deliverables.
--
-- Seeds 4–12 deliverables_v2 rows per move drawn deterministically from
-- phase-appropriate entries in deliverable_types (archetype-keyed D-codes).
-- Shell only — no deliverable_versions content seeded.
--
-- Stamp: title prefix [wave3a_2026_05_04] for reversal.
-- Reversal: DELETE FROM deliverables_v2 WHERE title LIKE '[wave3a_2026_05_04]%';
--
-- Scoped to 5 demo clients. Idempotent via WHERE NOT EXISTS on stamp.

BEGIN;

-- Archetype → D-code mapping (materialized as a CTE)
WITH archetype_codes AS (
  SELECT 'platform_modernization'::text AS archetype, ARRAY[
    'd01_program_charter','d02_stakeholder_map','d03_success_metric_tree',
    'd04_intake_interview_synthesis','d05_current_state_process_map',
    'd06_current_state_data_system_map','d07_current_state_financial_baseline',
    'd12_estimation_roadmap','d13_target_state_architecture',
    'd14_target_state_operating_model','d15_intervention_portfolio','d19_delivery_plan_raci'
  ] AS type_keys
  UNION ALL
  SELECT 'strategic_transformation', ARRAY[
    'd01_program_charter','d02_stakeholder_map','d03_success_metric_tree',
    'd04_intake_interview_synthesis','d08_pain_point_register','d09_root_cause_analysis',
    'd11_hypothesis_backlog','d14_target_state_operating_model','d19_delivery_plan_raci',
    'd22_change_management_package','d24_outcome_measurement_plan','d28_lessons_learned_pattern_contribution'
  ]
  UNION ALL
  SELECT 'ai_product_enablement', ARRAY[
    'd01_program_charter','d03_success_metric_tree','d04_intake_interview_synthesis',
    'd11_hypothesis_backlog','d12_estimation_roadmap','d15_intervention_portfolio',
    'd21_model_system_build_specs','d22_change_management_package',
    'd23_go_live_readiness_assessment','d24_outcome_measurement_plan','d27_dual_ledger_reconciliation'
  ]
  UNION ALL
  SELECT 'workflow_automation', ARRAY[
    'd01_program_charter','d02_stakeholder_map','d05_current_state_process_map',
    'd06_current_state_data_system_map','d08_pain_point_register',
    'd12_estimation_roadmap','d15_intervention_portfolio','d19_delivery_plan_raci',
    'd22_change_management_package','d24_outcome_measurement_plan'
  ]
  UNION ALL
  SELECT 'operational_optimization', ARRAY[
    'd01_program_charter','d02_stakeholder_map','d03_success_metric_tree',
    'd07_current_state_financial_baseline','d08_pain_point_register',
    'd09_root_cause_analysis','d10_benchmark_comparison','d15_intervention_portfolio',
    'd16_business_case','d19_delivery_plan_raci','d22_change_management_package',
    'd28_lessons_learned_pattern_contribution'
  ]
),
demo_clients AS (
  SELECT id FROM clients WHERE name IN (
    'Apex Retail','First Capital','Helix Therapeutics',
    'Keystone Energy Holdings','Meridian Health'
  )
),
target_moves AS (
  SELECT e.id AS engagement_id, e.current_phase,
         COALESCE(e.program_archetype, 'operational_optimization') AS archetype
  FROM engagements e
  WHERE e.client_id IN (SELECT id FROM demo_clients)
    AND e.archived_at IS NULL AND e.deleted_at IS NULL
    AND NOT EXISTS (SELECT 1 FROM deliverables_v2 d WHERE d.engagement_id = e.id)
    AND NOT EXISTS (
      SELECT 1 FROM deliverables_v2 d2
      WHERE d2.engagement_id = e.id
        AND d2.title LIKE '[wave3a_2026_05_04]%'
    )
),
expanded AS (
  SELECT
    tm.engagement_id,
    tm.current_phase,
    dt.type_key,
    dt.title AS dt_title,
    dt.applicable_phases,
    ROW_NUMBER() OVER (
      PARTITION BY tm.engagement_id
      ORDER BY hashtext(tm.engagement_id::text || dt.type_key)
    ) AS rn
  FROM target_moves tm
  JOIN archetype_codes ac ON ac.archetype = tm.archetype
  JOIN deliverable_types dt ON dt.type_key = ANY(ac.type_keys)
  WHERE dt.applicable_phases && ARRAY(SELECT generate_series(0, tm.current_phase))
)
INSERT INTO deliverables_v2 (
  id, engagement_id, deliverable_type_key, title, status,
  current_version, created_at, updated_at
)
SELECT
  gen_random_uuid(),
  e.engagement_id,
  e.type_key,
  '[wave3a_2026_05_04] ' || e.dt_title,
  CASE
    WHEN e.applicable_phases <@ ARRAY(SELECT generate_series(0, e.current_phase - 1))
      THEN 'signed_off'
    WHEN e.current_phase = ANY(e.applicable_phases)
      THEN 'in_review'
    ELSE 'draft'
  END,
  0,
  NOW() - (interval '1 day' * (12 - e.rn)),
  NOW()
FROM expanded e
WHERE e.rn <= 12;

COMMIT;
