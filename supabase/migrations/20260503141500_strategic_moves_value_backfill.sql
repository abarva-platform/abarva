-- Strategic Moves value backfill
-- Populate new value-at-stake columns from legacy baseline_metrics payloads.

BEGIN;

WITH legacy_values AS (
  SELECT
    e.id,
    COALESCE(
      CASE
        WHEN jsonb_typeof(e.baseline_metrics -> 'savings_usd') = 'number'
          THEN (e.baseline_metrics ->> 'savings_usd')::numeric
        ELSE NULL
      END,
      item_values.best_value
    ) AS projected_value
  FROM engagements e
  LEFT JOIN LATERAL (
    SELECT MAX(candidate_value) AS best_value
    FROM (
      SELECT
        COALESCE(
          CASE
            WHEN jsonb_typeof(item -> 'savings_usd') = 'number'
              THEN (item ->> 'savings_usd')::numeric
            ELSE NULL
          END,
          CASE
            WHEN jsonb_typeof(item -> 'baseline_value') = 'number'
              THEN (item ->> 'baseline_value')::numeric
            ELSE NULL
          END,
          CASE
            WHEN jsonb_typeof(item -> 'actual_value') = 'number'
              THEN (item ->> 'actual_value')::numeric
            ELSE NULL
          END,
          CASE
            WHEN (item ->> 'savings_usd') ~ '[0-9]'
              THEN (
                NULLIF(regexp_replace(item ->> 'savings_usd', '[^0-9\.\-]', '', 'g'), '')::numeric *
                CASE
                  WHEN (item ->> 'savings_usd') ~* 'b\b' THEN 1000000000
                  WHEN (item ->> 'savings_usd') ~* 'm\b' THEN 1000000
                  WHEN (item ->> 'savings_usd') ~* 'k\b' THEN 1000
                  ELSE 1
                END
              )
            ELSE NULL
          END,
          CASE
            WHEN (item ->> 'baseline_value') ~ '[0-9]'
              THEN (
                NULLIF(regexp_replace(item ->> 'baseline_value', '[^0-9\.\-]', '', 'g'), '')::numeric *
                CASE
                  WHEN (item ->> 'baseline_value') ~* 'b\b' THEN 1000000000
                  WHEN (item ->> 'baseline_value') ~* 'm\b' THEN 1000000
                  WHEN (item ->> 'baseline_value') ~* 'k\b' THEN 1000
                  ELSE 1
                END
              )
            ELSE NULL
          END,
          CASE
            WHEN (item ->> 'actual_value') ~ '[0-9]'
              THEN (
                NULLIF(regexp_replace(item ->> 'actual_value', '[^0-9\.\-]', '', 'g'), '')::numeric *
                CASE
                  WHEN (item ->> 'actual_value') ~* 'b\b' THEN 1000000000
                  WHEN (item ->> 'actual_value') ~* 'm\b' THEN 1000000
                  WHEN (item ->> 'actual_value') ~* 'k\b' THEN 1000
                  ELSE 1
                END
              )
            ELSE NULL
          END
        ) AS candidate_value
      FROM jsonb_array_elements(COALESCE(e.baseline_metrics -> 'items', '[]'::jsonb)) item
    ) value_candidates
    WHERE candidate_value IS NOT NULL
      AND candidate_value > 0
  ) item_values ON TRUE
)
UPDATE engagements e
SET
  value_projected_low_usd = COALESCE(e.value_projected_low_usd, legacy_values.projected_value),
  value_projected_high_usd = COALESCE(e.value_projected_high_usd, legacy_values.projected_value),
  value_verified_status = COALESCE(
    e.value_verified_status,
    CASE WHEN legacy_values.projected_value IS NOT NULL THEN 'pending' ELSE NULL END
  ),
  value_currency = COALESCE(e.value_currency, 'USD'),
  value_assumptions_jsonb = CASE
    WHEN legacy_values.projected_value IS NOT NULL
      AND e.value_assumptions_jsonb IS NULL
      THEN jsonb_build_object(
        'source', 'legacy_baseline_metrics_backfill',
        'captured_at', NOW(),
        'backfilled_projected_usd', legacy_values.projected_value
      )
    ELSE e.value_assumptions_jsonb
  END
FROM legacy_values
WHERE e.id = legacy_values.id
  AND legacy_values.projected_value IS NOT NULL
  AND (
    e.value_projected_low_usd IS NULL
    OR e.value_projected_high_usd IS NULL
    OR e.value_assumptions_jsonb IS NULL
  );

COMMIT;

