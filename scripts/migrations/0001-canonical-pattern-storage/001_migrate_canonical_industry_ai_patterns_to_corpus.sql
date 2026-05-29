-- Packet 35 Phase 0B
-- Migrate reviewed canonical_industry_ai_patterns rows into corpus_patterns.
--
-- This script is idempotent on corpus_patterns.slug and preserves the legacy
-- canonical_id inside corpus_pattern_content.synthesis_jsonb.provenance.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

WITH source_rows AS (
  SELECT
    c.*,
    lower(regexp_replace(c.canonical_id, '[^a-zA-Z0-9]+', '-', 'g')) AS migrated_slug,
    CASE c.confidence_level
      WHEN 'validated' THEN 0.950
      WHEN 'high' THEN 0.850
      WHEN 'medium' THEN 0.700
      ELSE 0.550
    END::numeric(4,3) AS mapped_confidence,
    CASE c.confidence_level
      WHEN 'validated' THEN 9.00
      WHEN 'high' THEN 8.00
      WHEN 'medium' THEN 6.50
      ELSE 5.00
    END::numeric(4,2) AS mapped_depth_score,
    CASE c.lifecycle_status
      WHEN 'validated' THEN 'published'::corpus_pattern_status
      WHEN 'reviewed' THEN 'published'::corpus_pattern_status
      WHEN 'deprecated' THEN 'retired'::corpus_pattern_status
      ELSE 'draft'::corpus_pattern_status
    END AS mapped_status,
    array_remove(ARRAY[
      NULLIF(c.function, ''),
      NULLIF(c.process_area, ''),
      NULLIF(c.use_case_category, '')
    ], NULL) AS mapped_region_overlays
  FROM public.canonical_industry_ai_patterns c
)
INSERT INTO public.corpus_patterns (
  slug,
  title,
  category,
  status,
  confidence,
  version,
  primary_author_id,
  published_at,
  retired_at,
  depth_score,
  vertical_overlays,
  region_overlays,
  applicable_horizons,
  created_at,
  updated_at
)
SELECT
  migrated_slug,
  title,
  coalesce(nullif(function, ''), nullif(use_case_category, ''), nullif(enterprise_area, ''), 'industry-pattern'),
  mapped_status,
  mapped_confidence,
  1,
  owner,
  CASE WHEN mapped_status = 'published' THEN coalesce(last_reviewed_at, source_snapshot_at, now()) ELSE NULL END,
  CASE WHEN mapped_status = 'retired' THEN coalesce(last_reviewed_at, source_snapshot_at, now()) ELSE NULL END,
  mapped_depth_score,
  coalesce(industry, ARRAY[]::text[]),
  mapped_region_overlays,
  coalesce(strategic_move_phases, ARRAY[]::text[]),
  coalesce(created_at, now()),
  now()
FROM source_rows
ON CONFLICT (slug) DO UPDATE SET
  title = excluded.title,
  category = excluded.category,
  status = excluded.status,
  confidence = excluded.confidence,
  primary_author_id = excluded.primary_author_id,
  published_at = coalesce(public.corpus_patterns.published_at, excluded.published_at),
  retired_at = excluded.retired_at,
  depth_score = excluded.depth_score,
  vertical_overlays = excluded.vertical_overlays,
  region_overlays = excluded.region_overlays,
  applicable_horizons = excluded.applicable_horizons,
  updated_at = now();

WITH source_rows AS (
  SELECT
    c.*,
    lower(regexp_replace(c.canonical_id, '[^a-zA-Z0-9]+', '-', 'g')) AS migrated_slug
  FROM public.canonical_industry_ai_patterns c
),
target_rows AS (
  SELECT p.id, p.slug
  FROM public.corpus_patterns p
  JOIN source_rows s ON s.migrated_slug = p.slug
)
INSERT INTO public.corpus_pattern_content (
  pattern_id,
  version,
  markdown_body,
  claims_jsonb,
  evidence_jsonb,
  counterarguments_jsonb,
  synthesis_jsonb,
  created_at,
  updated_at
)
SELECT
  t.id,
  1,
  concat_ws(E'\n\n',
    '# ' || s.title,
    nullif(s.summary, ''),
    nullif('Executive question: ' || s.executive_question_answered, 'Executive question: '),
    nullif('Business problem: ' || s.business_problem, 'Business problem: '),
    nullif('Value hypothesis: ' || s.value_hypothesis, 'Value hypothesis: '),
    nullif('Measurement method: ' || s.measurement_method, 'Measurement method: '),
    CASE WHEN cardinality(s.common_failure_modes) > 0 THEN 'Common failure modes: ' || array_to_string(s.common_failure_modes, '; ') END,
    CASE WHEN cardinality(s.recommended_artifacts) > 0 THEN 'Recommended artifacts: ' || array_to_string(s.recommended_artifacts, '; ') END
  ),
  coalesce(s.quantitative_claims, '[]'::jsonb),
  coalesce(s.source_references, '[]'::jsonb),
  coalesce(s.unsupported_claim_flags, '[]'::jsonb),
  jsonb_build_object(
    'source_basis', s.source_basis,
    'confidence_rationale', s.confidence_rationale,
    'primary_kpis', s.primary_kpis,
    'secondary_kpis', s.secondary_kpis,
    'baseline_needed', s.baseline_needed,
    'value_levers', s.value_levers,
    'required_data_domains', s.required_data_domains,
    'implementation_complexity', s.implementation_complexity,
    'provenance', jsonb_build_object(
      'source', 'migrated_from_canonical_industry_ai_patterns',
      'legacy_id', s.canonical_id,
      'source_systems', s.source_systems,
      'source_ids', s.source_ids,
      'migrated_at', now()
    )
  ),
  coalesce(s.created_at, now()),
  now()
FROM source_rows s
JOIN target_rows t ON t.slug = s.migrated_slug
ON CONFLICT (pattern_id) DO UPDATE SET
  markdown_body = excluded.markdown_body,
  claims_jsonb = excluded.claims_jsonb,
  evidence_jsonb = excluded.evidence_jsonb,
  counterarguments_jsonb = excluded.counterarguments_jsonb,
  synthesis_jsonb = excluded.synthesis_jsonb,
  updated_at = now();

COMMENT ON TABLE public.canonical_industry_ai_patterns IS
  'DEPRECATED by ADR-0001. Source of truth is public.corpus_patterns after Packet 35 Phase 0B migration.';

COMMIT;
