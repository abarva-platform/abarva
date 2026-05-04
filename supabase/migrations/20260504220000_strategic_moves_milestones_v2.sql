-- Strategic Moves · milestones v2 (Wave 2b · re-seed) [follow-up F4]
--
-- ⚠️  REPLACEMENT, not additive.
-- Wipes the prior stamped milestone rows from migration C of
-- 2026-05-04 (stamp prefix '[demo_milestones_backfill_2026_05_04]')
-- and re-seeds with the founder-locked archetype templates.
--
-- Safe because: every prior row carried a stamped description
-- prefix, making the wipe selectorable by `LIKE '%stamp%'` with
-- zero risk to rows outside the backfill's scope. Any row NOT
-- stamped with the prior or current prefix is untouched.
--
-- Archetype templates (founder lock 2026-05-04):
--   platform_modernization (7 milestones):
--     architecture_approved, vendor_selected, dev_environment_setup,
--     integration_complete, pilot_launched, production_cutover,
--     decommission_legacy
--   strategic_transformation (6):
--     org_design_approved, change_plan_signed, pilot_cohort_launched,
--     broad_rollout, success_metrics_validated, sustaining_capability_handoff
--   ai_product_enablement (6):
--     use_case_validated, model_baseline, pilot_evaluation,
--     production_deployment, monitoring_active, scale_decision
--   workflow_automation (5):
--     process_mapped, automation_designed, pilot_run,
--     broad_deployment, exception_handling_stabilized
--   operational_optimization (5):
--     baseline_locked, intervention_designed, pilot_complete,
--     scaled_rollout, sustained_savings_validated
--
-- Status per move (derived from current_phase):
--   - milestones tied to phases < current_phase → status 'hit' with actual_date
--   - the milestone matching current_phase → 'upcoming' (active/in-progress)
--   - milestones tied to phases > current_phase → 'upcoming'
--
-- Hard rules:
--   1. Non-destructive to unstamped data — WHERE clause scopes strictly
--      to stamped rows for the wipe, and INSERT targets only demo clients.
--   2. Scoped — 5 demo clients.
--   3. Idempotent — re-run produces the same final state (v2 stamp
--      persists; a re-run wipes the v2 rows and re-seeds with the
--      same deterministic values).
--   4. Deterministic — dates derived from created_at + fixed per-phase
--      offsets + ±7 day deterministic jitter via hashtext(id).
--   5. Reversible — DELETE WHERE description LIKE '[demo_milestones_v2_2026_05_04]%'.

BEGIN;

-- Step 1 · wipe prior-stamped demo milestones.
DELETE FROM program_milestones
WHERE description LIKE '[demo_milestones_backfill_2026_05_04]%'
   OR description LIKE '[demo_milestones_v2_2026_05_04]%';

-- Step 2 · stage target moves (demo clients only, archetype-aware).
CREATE TEMP TABLE _mv2_demo_clients ON COMMIT DROP AS
SELECT id, name FROM clients WHERE name IN (
  'Apex Retail','First Capital','Helix Therapeutics',
  'Keystone Energy Holdings','Meridian Health'
);

CREATE TEMP TABLE _mv2_target_moves ON COMMIT DROP AS
SELECT
  e.id,
  e.client_id,
  e.name,
  COALESCE(e.program_archetype, 'operational_optimization') AS archetype,
  COALESCE(e.current_phase, 0) AS current_phase,
  COALESCE(e.created_at, NOW()) AS anchor_date,
  -- Deterministic ±7 day jitter for realism
  ((abs(hashtext(e.id::text)) % 14)::int - 7) AS jitter_days
FROM engagements e
WHERE e.client_id IN (SELECT id FROM _mv2_demo_clients)
  AND e.archived_at IS NULL
  AND e.deleted_at IS NULL;

-- Step 3 · archetype templates. Each row = one milestone on every move
-- of that archetype. `phase_number` anchors the milestone to a phase
-- (used for the hit/upcoming status rule). `offset_days` gives a
-- realistic calendar spread from created_at.
CREATE TEMP TABLE _mv2_templates ON COMMIT DROP AS
SELECT * FROM (VALUES
  -- platform_modernization · 7 milestones across P1-P7
  ('platform_modernization', 1, 1, 'Architecture approved',            'Target architecture ratified by EA council',                        10),
  ('platform_modernization', 2, 3, 'Vendor selected',                  'Vendor contracted and onboarded',                                    45),
  ('platform_modernization', 3, 3, 'Dev environment setup',            'Dev + test environments provisioned and baselined',                  75),
  ('platform_modernization', 4, 4, 'Integration complete',             'Core integrations live and verified end-to-end',                    130),
  ('platform_modernization', 5, 4, 'Pilot launched',                   'Pilot in-flight with first cohort',                                 170),
  ('platform_modernization', 6, 5, 'Production cutover',               'Legacy workloads cut over to new platform',                         240),
  ('platform_modernization', 7, 7, 'Decommission legacy',              'Legacy systems decommissioned and budget reclaimed',                340),

  -- strategic_transformation · 6 milestones
  ('strategic_transformation', 1, 1, 'Org design approved',            'Target operating model and org shape signed off',                    20),
  ('strategic_transformation', 2, 2, 'Change plan signed',             'Change management plan + communications approved',                   60),
  ('strategic_transformation', 3, 4, 'Pilot cohort launched',          'Pilot cohort in-flight; first data collected',                      140),
  ('strategic_transformation', 4, 5, 'Broad rollout',                  'Broad rollout complete across in-scope population',                 230),
  ('strategic_transformation', 5, 6, 'Success metrics validated',      'Outcome KPIs verified against baseline',                            300),
  ('strategic_transformation', 6, 7, 'Sustaining capability handoff',  'BAU owners trained; sustaining capability active',                  360),

  -- ai_product_enablement · 6 milestones
  ('ai_product_enablement', 1, 1, 'Use case validated',                'Use case prioritized; feasibility + fit confirmed',                  15),
  ('ai_product_enablement', 2, 2, 'Model baseline',                    'Baseline model trained; quality + bias metrics captured',            60),
  ('ai_product_enablement', 3, 4, 'Pilot evaluation',                  'Pilot evaluation complete; thresholds cleared',                     130),
  ('ai_product_enablement', 4, 5, 'Production deployment',             'Production deployment cleared; guardrails active',                  200),
  ('ai_product_enablement', 5, 6, 'Monitoring active',                 'Drift + quality monitoring dashboards live; on-call rotation set',  260),
  ('ai_product_enablement', 6, 7, 'Scale decision',                    'Scale-vs-sunset decision made with data',                           340),

  -- workflow_automation · 5 milestones
  ('workflow_automation', 1, 2, 'Process mapped',                      'Process mining + exception patterns documented',                     30),
  ('workflow_automation', 2, 3, 'Automation designed',                 'Bot + rules blueprint approved by ops + risk',                       70),
  ('workflow_automation', 3, 4, 'Pilot run',                           'First cohort of automations in production',                         130),
  ('workflow_automation', 4, 5, 'Broad deployment',                    'Full rollout + exception management operational',                   210),
  ('workflow_automation', 5, 6, 'Exception handling stabilized',       'Exception backlog managed; SLA steady',                             290),

  -- operational_optimization · 5 milestones
  ('operational_optimization', 1, 1, 'Baseline locked',                'Cost / labor / margin driver baseline complete',                     20),
  ('operational_optimization', 2, 3, 'Intervention designed',          'Initiative portfolio + ROI model approved',                          70),
  ('operational_optimization', 3, 4, 'Pilot complete',                 'First wave of initiatives executed',                                150),
  ('operational_optimization', 4, 5, 'Scaled rollout',                 'All initiative waves executed',                                     230),
  ('operational_optimization', 5, 6, 'Sustained savings validated',    'Run-rate savings verified against target',                          310)
) AS t(archetype, sequence, phase_number, name, description, offset_days);

-- Step 4 · insert v2 milestones.
INSERT INTO program_milestones (
  engagement_id, name, description, target_date, actual_date, status,
  phase_number, module_key, owner_user_id, created_at
)
SELECT
  m.id,
  t.name,
  '[demo_milestones_v2_2026_05_04] ' || t.description,
  (m.anchor_date::date + (t.offset_days + m.jitter_days)) AS target_date,
  CASE
    WHEN t.phase_number < m.current_phase
      THEN (m.anchor_date::date + (t.offset_days + m.jitter_days))
    ELSE NULL
  END AS actual_date,
  CASE
    WHEN t.phase_number < m.current_phase THEN 'hit'
    WHEN t.phase_number = m.current_phase THEN 'upcoming'
    ELSE 'upcoming'
  END AS status,
  t.phase_number,
  NULL AS module_key,
  NULL AS owner_user_id,
  NOW()
FROM _mv2_target_moves m
JOIN _mv2_templates t
  ON t.archetype = m.archetype
ORDER BY m.id, t.sequence;

COMMIT;
