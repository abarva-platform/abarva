-- Migration 016 · Re-enable RLS with service-role-only posture on new tables
-- Posture: all client-side DB access is blocked; all server-side access uses
-- SUPABASE_SERVICE_ROLE_KEY (which bypasses RLS). Clients talk to our API routes,
-- not to Supabase directly. Per-user RLS via Clerk JWT templates is deferred.

BEGIN;

-- Enable RLS
ALTER TABLE persons ENABLE ROW LEVEL SECURITY;
ALTER TABLE engagements ENABLE ROW LEVEL SECURITY;
ALTER TABLE turns ENABLE ROW LEVEL SECURITY;
ALTER TABLE relationship_notes ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies (clean slate)
DROP POLICY IF EXISTS "allow service role all on persons" ON persons;
DROP POLICY IF EXISTS "allow service role all on engagements" ON engagements;
DROP POLICY IF EXISTS "allow service role all on turns" ON turns;
DROP POLICY IF EXISTS "allow service role all on relationship_notes" ON relationship_notes;

-- Service role policies
CREATE POLICY "allow service role all on persons"
  ON persons FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "allow service role all on engagements"
  ON engagements FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "allow service role all on turns"
  ON turns FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "allow service role all on relationship_notes"
  ON relationship_notes FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Defense in depth: revoke anon + authenticated grants, leave service_role only
REVOKE ALL ON persons, engagements, turns, relationship_notes FROM anon, authenticated;
GRANT ALL ON persons, engagements, turns, relationship_notes TO service_role;

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';

COMMIT;
