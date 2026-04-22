-- Migration 035 · Pack H Phase 3 — user role model + client memberships
-- Idempotent. Renumbered from spec's 028 to keep sequential with 034.

BEGIN;

DO $$ BEGIN
  CREATE TYPE user_role_type AS ENUM ('maestro', 'client_viewer', 'observer');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE persons ADD COLUMN IF NOT EXISTS primary_role user_role_type DEFAULT 'client_viewer';

-- A person can be tied to N clients with role per membership.
-- Maestros typically have memberships across all clients.
-- Client viewers have exactly one membership (their employer).
CREATE TABLE IF NOT EXISTS person_client_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  role user_role_type NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (person_id, client_id)
);

CREATE INDEX IF NOT EXISTS idx_memberships_person ON person_client_memberships(person_id);
CREATE INDEX IF NOT EXISTS idx_memberships_client ON person_client_memberships(client_id);

-- Backfill: mark any existing Maestros (by email convention) as primary_role='maestro'
UPDATE persons
SET primary_role = 'maestro'
WHERE email IN ('anand@abarva.com', 'anand+clerk_test@abarva.com', 'anand.sundaram@thesundaram.com')
  AND primary_role IS DISTINCT FROM 'maestro';

-- Seed maestro memberships across all clients (idempotent via UNIQUE)
INSERT INTO person_client_memberships (person_id, client_id, role)
SELECT p.id, c.id, 'maestro'::user_role_type
FROM persons p
CROSS JOIN clients c
WHERE p.primary_role = 'maestro'
ON CONFLICT (person_id, client_id) DO NOTHING;

ALTER TABLE person_client_memberships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all_memberships" ON person_client_memberships;
CREATE POLICY "service_role_all_memberships" ON person_client_memberships
  FOR ALL TO service_role USING (true) WITH CHECK (true);

NOTIFY pgrst, 'reload schema';

COMMIT;
