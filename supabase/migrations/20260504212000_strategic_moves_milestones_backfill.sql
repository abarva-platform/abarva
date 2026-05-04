-- Strategic Moves · milestones backfill (Wave 2 · C of E)
--
-- Seeds program_milestones rows for demo-tenant engagements that
-- currently have no milestones. Each archetype gets a canonical
-- 6-step journey (P1 charter → P7 handoff) with dates anchored to
-- the engagement's created_at.
--
-- Milestone status derived from current_phase:
--   milestones whose phase_number < current_phase → status 'hit' with actual_date
--   milestone whose phase_number = current_phase  → status 'upcoming' (active)
--   milestones whose phase_number > current_phase → status 'upcoming'
--
-- Hard rules:
--   1. Non-destructive — INSERT only, only when the engagement has 0
--      existing milestone rows.
--   2. Scoped — 5 demo clients.
--   3. Idempotent — re-run is no-op (WHERE NOT EXISTS on the outer
--      engagement).
--   4. Deterministic — dates derived from created_at + fixed deltas.
--   5. Traceable — every inserted row has
--      description starting with '[demo_milestones_backfill_2026_05_04]'.
--
-- Reversal:
--   DELETE FROM program_milestones
--   WHERE description LIKE '[demo_milestones_backfill_2026_05_04]%';

BEGIN;

WITH demo_clients AS (
  SELECT id FROM clients WHERE name IN (
    'Apex Retail','First Capital','Helix Therapeutics',
    'Keystone Energy Holdings','Meridian Health'
  )
),
-- Only target demo moves with zero milestones currently.
moves_without_milestones AS (
  SELECT
    e.id,
    e.client_id,
    e.name,
    e.program_archetype,
    COALESCE(e.current_phase, 0) AS current_phase,
    COALESCE(e.created_at, NOW()) AS anchor_date,
    -- Deterministic jitter ±7 days for actual_date realism
    ((abs(hashtext(e.id::text)) % 14)::int - 7) AS jitter_days
  FROM engagements e
  WHERE e.client_id IN (SELECT id FROM demo_clients)
    AND e.archived_at IS NULL
    AND e.deleted_at IS NULL
    AND NOT EXISTS (
      SELECT 1 FROM program_milestones pm WHERE pm.engagement_id = e.id
    )
),
-- Per-archetype canonical milestone template. Each row in this CTE
-- becomes one milestone on every target move. The template has 6
-- steps aligned to canonical P1..P6 phases; P0 (originate) and P7
-- (handoff) are bracketed off since P0 is pre-charter and P7 is
-- post-execute — neither warrants a traditional milestone.
milestone_templates AS (
  SELECT archetype, phase_number, name, description, offset_days FROM (VALUES
    -- Strategic Transformation (broad program lifecycle)
    ('strategic_transformation', 1, 'Charter signed',            'P1 charter approved by sponsor + steering committee',  10),
    ('strategic_transformation', 2, 'Operating model diagnosed', 'P2 target operating model + org-design baseline',      45),
    ('strategic_transformation', 3, 'Solution blueprint locked', 'P3 blueprint + roadmap ratified by executive sponsor', 90),
    ('strategic_transformation', 4, 'Foundational capabilities built','P4 first wave of capabilities delivered',          180),
    ('strategic_transformation', 5, 'Cutover to new operating model','P5 operating model fully active',                  270),
    ('strategic_transformation', 6, 'Outcomes verified',          'P6 outcome KPIs verified vs baseline',                360),

    -- Platform Modernization
    ('platform_modernization', 1, 'Charter + vision signed',     'P1 modernization charter + vision locked',              10),
    ('platform_modernization', 2, 'Current-state mapped',        'P2 architecture + data-flow baseline complete',         40),
    ('platform_modernization', 3, 'Target architecture approved','P3 target architecture + vendor shortlist ratified',    80),
    ('platform_modernization', 4, 'MVP platform provisioned',    'P4 MVP platform stood up; pilot data loaded',          160),
    ('platform_modernization', 5, 'Production cutover',          'P5 production cutover complete; legacy retired',       240),
    ('platform_modernization', 6, 'Performance + cost verified', 'P6 performance SLAs + TCO verified against projections',320),

    -- AI Product Enablement
    ('ai_product_enablement', 1, 'Use-case portfolio approved',  'P1 AI use-case portfolio + prioritization signed off',  10),
    ('ai_product_enablement', 2, 'Data & model readiness assessed','P2 data quality + model feasibility assessed',        35),
    ('ai_product_enablement', 3, 'MVP design approved',          'P3 MVP design + guardrails approved',                   70),
    ('ai_product_enablement', 4, 'MVP deployed to pilot users',  'P4 MVP deployed; first pilot cohort active',           130),
    ('ai_product_enablement', 5, 'Production rollout',           'P5 rollout to general population',                     200),
    ('ai_product_enablement', 6, 'Adoption + uplift verified',   'P6 adoption + outcome uplift verified',                270),

    -- Workflow Automation
    ('workflow_automation', 1, 'Charter + process scope locked', 'P1 charter + in-scope processes ratified',              10),
    ('workflow_automation', 2, 'Process discovery complete',     'P2 process-mining + exception patterns documented',     30),
    ('workflow_automation', 3, 'Automation blueprint approved',  'P3 bot + rules blueprint approved by ops + risk',       60),
    ('workflow_automation', 4, 'First wave of bots in production','P4 first cohort of automations in production',         120),
    ('workflow_automation', 5, 'Full rollout + exception mgmt',   'P5 full rollout + exception management operational',   180),
    ('workflow_automation', 6, 'Throughput + accuracy verified',  'P6 throughput, cycle time, and accuracy KPIs verified',240),

    -- Operational Optimization
    ('operational_optimization', 1, 'Charter + savings target',   'P1 charter + savings target ratified',                  10),
    ('operational_optimization', 2, 'Baseline + drivers mapped',  'P2 cost / labor / margin driver baseline complete',     30),
    ('operational_optimization', 3, 'Initiatives portfolio approved','P3 initiative portfolio + ROI model approved',        65),
    ('operational_optimization', 4, 'First wave executed',        'P4 first wave of initiatives executed',                120),
    ('operational_optimization', 5, 'All waves executed',         'P5 all initiative waves executed',                      200),
    ('operational_optimization', 6, 'Run-rate savings verified',  'P6 run-rate savings verified against target',           280)
  ) AS t(archetype, phase_number, name, description, offset_days)
)

INSERT INTO program_milestones (
  engagement_id, name, description, target_date, actual_date, status, phase_number, module_key, owner_user_id, created_at
)
SELECT
  m.id,
  mt.name,
  '[demo_milestones_backfill_2026_05_04] ' || mt.description,
  (m.anchor_date::date + (mt.offset_days + m.jitter_days)) AS target_date,
  CASE
    WHEN mt.phase_number < m.current_phase
      THEN (m.anchor_date::date + (mt.offset_days + m.jitter_days))
    ELSE NULL
  END AS actual_date,
  CASE
    WHEN mt.phase_number < m.current_phase THEN 'hit'
    WHEN mt.phase_number = m.current_phase THEN 'upcoming'
    ELSE 'upcoming'
  END AS status,
  mt.phase_number,
  NULL AS module_key,
  NULL AS owner_user_id,
  NOW()
FROM moves_without_milestones m
JOIN milestone_templates mt
  ON mt.archetype = COALESCE(m.program_archetype, 'operational_optimization')  -- fallback for any remaining NULL
;

COMMIT;
