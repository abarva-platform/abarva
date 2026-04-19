-- Migration 019 · Per-user RLS via Clerk JWT
-- Prerequisite: Clerk JWT template 'supabase' emits {person_id} in claims,
-- and Supabase → Authentication → Third-party auth has Clerk configured.
-- Without those, authenticated-role queries will return nothing.

BEGIN;

-- Drop the service-role-only policies from 016
DROP POLICY IF EXISTS "allow service role all on persons" ON persons;
DROP POLICY IF EXISTS "allow service role all on engagements" ON engagements;
DROP POLICY IF EXISTS "allow service role all on turns" ON turns;
DROP POLICY IF EXISTS "allow service role all on relationship_notes" ON relationship_notes;

-- Service role: still gets everything (server-side API routes)
CREATE POLICY "service_role_all_persons" ON persons
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_engagements" ON engagements
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_turns" ON turns
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_notes" ON relationship_notes
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Authenticated: can read themselves + persons in shared teams
CREATE POLICY "authenticated_read_persons" ON persons
  FOR SELECT TO authenticated
  USING (
    id::text = auth.jwt() ->> 'person_id'
    OR id IN (
      SELECT tm2.person_id FROM team_memberships tm2
      WHERE tm2.team_id IN (
        SELECT tm1.team_id FROM team_memberships tm1
        WHERE tm1.person_id::text = auth.jwt() ->> 'person_id'
      )
    )
  );

-- Authenticated: engagements in their teams or where they're directly named
CREATE POLICY "authenticated_read_engagements" ON engagements
  FOR SELECT TO authenticated
  USING (
    team_id IN (
      SELECT team_id FROM team_memberships
      WHERE person_id::text = auth.jwt() ->> 'person_id'
    )
    OR sponsor_person_id::text = auth.jwt() ->> 'person_id'
    OR co_sponsor_person_id::text = auth.jwt() ->> 'person_id'
    OR maestro_person_id::text = auth.jwt() ->> 'person_id'
  );

-- Authenticated: turns on engagements they can see (relies on engagement policy)
CREATE POLICY "authenticated_read_turns" ON turns
  FOR SELECT TO authenticated
  USING (engagement_id IN (SELECT id FROM engagements));

-- Authenticated: their own relationship notes only
CREATE POLICY "authenticated_read_own_notes" ON relationship_notes
  FOR SELECT TO authenticated
  USING (person_id::text = auth.jwt() ->> 'person_id');

-- NOTE: No INSERT/UPDATE/DELETE policies for authenticated role.
-- Writes still route through server API routes using SERVICE_ROLE_KEY.
-- This is intentional — writes need business logic + validation beyond
-- what's easily expressed in RLS.

-- Grant authenticated role basic SELECT; specific rows filtered by RLS
GRANT SELECT ON persons, engagements, turns, relationship_notes TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
