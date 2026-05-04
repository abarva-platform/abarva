-- Strategic Moves · archetype backfill (Wave 2 · A of E)
--
-- Writes program_archetype onto demo-tenant engagements where it is
-- currently NULL, using the same name-heuristic as the Wave 1 value
-- backfill. This persists what the Wave 1 migration only *inferred*
-- at projection time: now the row itself carries the classification,
-- which drives:
--   - home card archetype tag
--   - home filter + sort by archetype
--   - detail kv panel "Archetype" line
--   - any future segmentation analytics
--
-- Hard rules (locked with founder 2026-05-04):
--   1. Non-destructive — only touches rows where program_archetype IS NULL.
--   2. Scoped — only 5 demo clients. Any other tenant untouched.
--   3. Idempotent — re-running is a no-op.
--   4. Deterministic — same name → same archetype, every time.
--   5. Traceable — every stamped row carries
--      baseline_metrics->>'archetype_backfill_source' = 'name_heuristic_2026_05_04'.
--
-- Reversal:
--   UPDATE engagements
--   SET program_archetype = NULL,
--       baseline_metrics = baseline_metrics - 'archetype_backfill_source'
--   WHERE baseline_metrics->>'archetype_backfill_source' = 'name_heuristic_2026_05_04';

BEGIN;

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
candidates AS (
  SELECT
    e.id,
    e.name,
    CASE
      WHEN e.name ~* '(copilot|\yai\y|assistant|agentic|genai|\yllm\y|\yml\y)'
        THEN 'ai_product_enablement'
      WHEN e.name ~* '(platform|modernization|modernisation|data platform|\yerp\y|migration|cutover|rebuild|architecture)'
        THEN 'platform_modernization'
      WHEN e.name ~* '(automation|detection|fraud|compliance|reporting|\ykyc\y|control)'
        THEN 'workflow_automation'
      WHEN e.name ~* '(labor|consolidation|consolidate|optimization|optimisation|margin|\ycost\y|efficiency|forecast|demand|supply|rationalization|rationalisation)'
        THEN 'operational_optimization'
      WHEN e.name ~* '(strategy|strategic|transformation|governance|operating model|value chain)'
        THEN 'strategic_transformation'
      ELSE NULL
    END AS inferred_archetype
  FROM engagements e
  WHERE e.client_id IN (SELECT id FROM demo_clients)
    AND e.archived_at IS NULL
    AND e.deleted_at IS NULL
    AND e.program_archetype IS NULL
)
UPDATE engagements e
SET
  program_archetype = c.inferred_archetype,
  baseline_metrics = COALESCE(e.baseline_metrics, '{}'::jsonb)
    || jsonb_build_object(
      'archetype_backfill_source', 'name_heuristic_2026_05_04',
      'archetype_backfilled_at', to_jsonb(NOW())
    )
FROM candidates c
WHERE e.id = c.id
  AND c.inferred_archetype IS NOT NULL;  -- don't stamp rows the heuristic couldn't classify

COMMIT;
