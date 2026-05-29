-- Packet 35 Phase 0B
-- Read-only export for the 28 legacy pattern_packs rows.
--
-- Founder must classify each row before migration:
--   industry-applicable -> corpus_patterns
--   client-specific     -> client_private_patterns
--
-- This script intentionally performs no writes.

SELECT
  pp.client_id,
  c.name AS client_name,
  c.tenant_key,
  c.industry_code,
  pp.id AS legacy_pattern_pack_id,
  pp.category,
  pp.name,
  left(coalesce(pp.short_description, pp.long_description, pp.raw_markdown, ''), 500) AS preview,
  pp.created_at,
  pp.updated_at,
  'UNCLASSIFIED' AS founder_classification
FROM public.pattern_packs pp
LEFT JOIN public.clients c ON c.id = pp.client_id
ORDER BY c.name NULLS LAST, pp.category, pp.id;
