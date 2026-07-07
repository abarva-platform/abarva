-- Adds the concrete conflict target used by the Tower materializer.
-- The original expression index on lower(identifier) remains for case-insensitive lookup.

CREATE UNIQUE INDEX IF NOT EXISTS idx_tower_forbidden_identifiers_conflict_key
  ON public.tower_forbidden_identifiers(tenant_key, identifier);
