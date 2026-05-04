-- Strategic Moves · demo value-at-stake backfill (Wave 1 of the data strategy)
--
-- Populates value_projected_low_usd / value_projected_high_usd /
-- value_verified_usd / value_verified_status / value_currency /
-- value_assumptions_jsonb on engagements that belong to the 5 demo
-- clients and are missing a projection.
--
-- Design rules (locked with founder 2026-05-04):
--   1. Non-destructive — only touches rows where
--      value_projected_high_usd IS NULL.
--   2. Scoped — only rows whose client_id is one of the 5 demo clients
--      (Apex Retail, First Capital, Helix Therapeutics,
--      Keystone Energy Holdings, Meridian Health). Any other tenant
--      is left untouched.
--   3. Idempotent — re-running is a no-op because the WHERE clause
--      excludes rows already backfilled.
--   4. Deterministic — every value is computed from the row id or
--      archetype. No random(). Same input, same output, every time.
--   5. Reversible — every row stamped with
--      value_assumptions_jsonb->>'source' =
--      'strategic_moves_demo_value_backfill_2026_05_04'.
--      Full reversal in one SQL statement:
--
--        UPDATE engagements
--        SET value_projected_low_usd  = NULL,
--            value_projected_high_usd = NULL,
--            value_verified_usd       = NULL,
--            value_verified_status    = NULL,
--            value_assumptions_jsonb  = NULL
--        WHERE value_assumptions_jsonb->>'source'
--            = 'strategic_moves_demo_value_backfill_2026_05_04';
--
-- Projection bands (USD, mid-range × ±25% deterministic jitter):
--   strategic_transformation  →  $20M – $40M
--   platform_modernization    →  $12M – $25M
--   ai_product_enablement     →  $ 8M – $18M
--   workflow_automation       →  $ 4M – $10M
--   operational_optimization  →  $ 6M – $14M
--   (unknown, default fallback) → $ 5M – $12M
--
-- Verified-amount curve (only for rows in later phases):
--   P5 (Execute)   → 30% of projected low,  status 'tracked'
--   P6 (Verify)    → 70% of projected high, status 'tracked'
--   P7 (Handoff)   → 100% of projected high, status 'final'
--   (P0–P4 get no verified amount.)

BEGIN;

-- ────────────────────────────────────────────────────────────────────
-- Step 1 · resolve demo client IDs into a CTE so we touch only them.
-- ────────────────────────────────────────────────────────────────────
WITH demo_clients AS (
  SELECT id
  FROM clients
  WHERE name IN (
    'Apex Retail',
    'First Capital',
    'Helix Therapeutics',
    'Keystone Energy Holdings',
    'Meridian Health'
  )
),

-- ────────────────────────────────────────────────────────────────────
-- Step 2 · candidate rows: demo-client engagements with no projection.
-- ────────────────────────────────────────────────────────────────────
candidates AS (
  SELECT
    e.id,
    e.client_id,
    e.name,
    e.program_archetype,
    e.current_phase,
    -- hashtext is deterministic per input. Bucket into 0..99 and
    -- map to [-25%, +25%] jitter. Ensures two moves in the same
    -- archetype don't end up stacked at identical coordinates on
    -- the scatter plot, while remaining fully reproducible.
    ((abs(hashtext(e.id::text)) % 100)::numeric / 100.0 - 0.5) * 0.5
      AS jitter  -- range: -0.25 .. +0.25
  FROM engagements e
  WHERE e.client_id IN (SELECT id FROM demo_clients)
    AND e.archived_at IS NULL
    AND e.deleted_at IS NULL
    AND e.value_projected_high_usd IS NULL
),

-- ────────────────────────────────────────────────────────────────────
-- Step 3 · resolve the effective archetype.
-- Existing non-null archetype wins. Otherwise, name-heuristic rules
-- classify. If no rule matches we fall back to the default band and
-- stamp archetype_source='default' so downstream reporting can flag.
-- ────────────────────────────────────────────────────────────────────
typed AS (
  SELECT
    c.id,
    c.client_id,
    c.name,
    c.current_phase,
    c.jitter,
    COALESCE(
      c.program_archetype,
      CASE
        -- AI / Copilot products & enablement (PG POSIX word-boundary is \y)
        WHEN c.name ~* '(copilot|\yai\y|assistant|agentic|genai|\yllm\y|\yml\y)'
          THEN 'ai_product_enablement'
        -- Platform / data-platform / modernization
        WHEN c.name ~* '(platform|modernization|modernisation|data platform|\yerp\y|migration|cutover|rebuild|architecture)'
          THEN 'platform_modernization'
        -- Workflow automation / ops scripts / detection / compliance
        WHEN c.name ~* '(automation|detection|fraud|compliance|reporting|\ykyc\y|control)'
          THEN 'workflow_automation'
        -- Operational efficiency / labor / consolidation / margin
        WHEN c.name ~* '(labor|consolidation|consolidate|optimization|optimisation|margin|\ycost\y|efficiency|forecast|demand|supply|rationalization|rationalisation)'
          THEN 'operational_optimization'
        -- Strategic transformation (broader re-positioning)
        WHEN c.name ~* '(strategy|strategic|transformation|governance|operating model|value chain)'
          THEN 'strategic_transformation'
        ELSE NULL
      END
    ) AS effective_archetype,
    CASE
      WHEN c.program_archetype IS NOT NULL THEN 'program_archetype'
      WHEN c.name ~* '(copilot|\yai\y|assistant|agentic|genai|\yllm\y|\yml\y|platform|modernization|modernisation|data platform|\yerp\y|migration|cutover|rebuild|architecture|automation|detection|fraud|compliance|reporting|\ykyc\y|control|labor|consolidation|consolidate|optimization|optimisation|margin|\ycost\y|efficiency|forecast|demand|supply|rationalization|rationalisation|strategy|strategic|transformation|governance|operating model|value chain)'
        THEN 'name_heuristic'
      ELSE 'default'
    END AS archetype_source
  FROM candidates c
),

-- ────────────────────────────────────────────────────────────────────
-- Step 4 · apply the archetype → band mapping with deterministic jitter.
-- ────────────────────────────────────────────────────────────────────
projected AS (
  SELECT
    t.*,
    CASE t.effective_archetype
      WHEN 'strategic_transformation' THEN 20000000::numeric
      WHEN 'platform_modernization'   THEN 12000000::numeric
      WHEN 'ai_product_enablement'    THEN  8000000::numeric
      WHEN 'workflow_automation'      THEN  4000000::numeric
      WHEN 'operational_optimization' THEN  6000000::numeric
      ELSE                                   5000000::numeric
    END AS band_low,
    CASE t.effective_archetype
      WHEN 'strategic_transformation' THEN 40000000::numeric
      WHEN 'platform_modernization'   THEN 25000000::numeric
      WHEN 'ai_product_enablement'    THEN 18000000::numeric
      WHEN 'workflow_automation'      THEN 10000000::numeric
      WHEN 'operational_optimization' THEN 14000000::numeric
      ELSE                                  12000000::numeric
    END AS band_high
  FROM typed t
),
final_proj AS (
  SELECT
    p.*,
    -- Apply jitter symmetrically so both ends shift together and
    -- the span stays positive (low stays below high by construction
    -- because band_low < band_high and jitter is bounded to ±25%).
    round(p.band_low  * (1 + p.jitter), -5) AS proj_low,   -- rounded to nearest $100K
    round(p.band_high * (1 + p.jitter), -5) AS proj_high
  FROM projected p
),

-- ────────────────────────────────────────────────────────────────────
-- Step 5 · verified amount + status curve for later phases.
-- ────────────────────────────────────────────────────────────────────
verified AS (
  SELECT
    f.*,
    CASE f.current_phase
      WHEN 5 THEN round(f.proj_low  * 0.30, -5)
      WHEN 6 THEN round(f.proj_high * 0.70, -5)
      WHEN 7 THEN f.proj_high
      ELSE NULL
    END AS verified_amount,
    CASE f.current_phase
      WHEN 5 THEN 'tracked'
      WHEN 6 THEN 'tracked'
      WHEN 7 THEN 'final'
      ELSE NULL
    END AS verified_status
  FROM final_proj f
)

-- ────────────────────────────────────────────────────────────────────
-- Step 6 · the actual UPDATE (only touches candidate rows from step 2).
-- ────────────────────────────────────────────────────────────────────
UPDATE engagements e
SET
  value_projected_low_usd  = v.proj_low,
  value_projected_high_usd = v.proj_high,
  value_verified_usd       = v.verified_amount,
  value_verified_status    = v.verified_status,
  value_currency           = COALESCE(e.value_currency, 'USD'),
  value_assumptions_jsonb  = jsonb_build_object(
    'source',            'strategic_moves_demo_value_backfill_2026_05_04',
    'derived_from',      'program_archetype_band',
    'effective_archetype', v.effective_archetype,
    'archetype_source',  v.archetype_source,
    'band_low_usd',      v.band_low,
    'band_high_usd',     v.band_high,
    'jitter',            round(v.jitter, 4),
    'current_phase_at_backfill', v.current_phase,
    'verified_basis',    CASE v.current_phase
                           WHEN 5 THEN '30% of projected low (P5 Execute early signal)'
                           WHEN 6 THEN '70% of projected high (P6 Verify in flight)'
                           WHEN 7 THEN '100% of projected high (P7 Handoff final)'
                           ELSE 'none (pre-P5)'
                         END,
    'backfilled_at',     to_jsonb(NOW()),
    'reversal_hint',     'UPDATE engagements SET value_projected_low_usd=NULL, value_projected_high_usd=NULL, value_verified_usd=NULL, value_verified_status=NULL, value_assumptions_jsonb=NULL WHERE value_assumptions_jsonb->>''source'' = ''strategic_moves_demo_value_backfill_2026_05_04'';'
  )
FROM verified v
WHERE e.id = v.id;

COMMIT;
