-- Lakeshore L01 · holding-group tenancy substrate
--
-- The live tenant table is `clients`, not `tenants`. This migration adds the
-- smallest parent/child metadata required for Lakeshore L0 aggregate reads
-- while preserving transaction-grain isolation for L1 HoldCos.

BEGIN;

ALTER TABLE clients ADD COLUMN IF NOT EXISTS holding_group_id UUID;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS parent_client_id UUID REFERENCES clients(id) ON DELETE SET NULL;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS holding_group_role TEXT NOT NULL DEFAULT 'standalone';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS aggregate_visibility_level TEXT NOT NULL DEFAULT 'own_client';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'clients_holding_group_role_check'
  ) THEN
    ALTER TABLE clients
      ADD CONSTRAINT clients_holding_group_role_check
      CHECK (holding_group_role IN ('standalone', 'l0_sponsor', 'l1_holdco', 'l2_portco'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'clients_aggregate_visibility_level_check'
  ) THEN
    ALTER TABLE clients
      ADD CONSTRAINT clients_aggregate_visibility_level_check
      CHECK (aggregate_visibility_level IN ('own_client', 'group_aggregate', 'transaction_grant_required'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_clients_holding_group
  ON clients (holding_group_id, holding_group_role)
  WHERE holding_group_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_clients_parent_client
  ON clients (parent_client_id)
  WHERE parent_client_id IS NOT NULL;

WITH lakeshore_parent AS (
  SELECT id
  FROM clients
  WHERE tenant_key = 'lakeshore-holdings'
     OR slug = 'lakeshore-holdings'
     OR name = 'Lakeshore Holdings'
  ORDER BY created_at NULLS LAST
  LIMIT 1
),
seed_l1 AS (
  SELECT *
  FROM (
    VALUES
      (
        '830de810-0011-4c9e-8f59-000000000101'::uuid,
        'Morgan Street Holdings Chicago',
        'Morgan Street Holdings Chicago LLC',
        'DIVERSIFIED_HOLDCO',
        'morgan-street-holdings',
        'morgan-street-holdings'
      ),
      (
        '830de810-0011-4c9e-8f59-000000000102'::uuid,
        'Roosevelt Holdings Atlanta',
        'Roosevelt Holdings Atlanta LLC',
        'DIVERSIFIED_HOLDCO',
        'roosevelt-holdings',
        'roosevelt-holdings'
      ),
      (
        '830de810-0011-4c9e-8f59-000000000103'::uuid,
        'Lakefront Capital Boston',
        'Lakefront Capital Boston LLC',
        'DIVERSIFIED_HOLDCO',
        'lakefront-capital',
        'lakefront-capital'
      )
  ) AS rows(id, name, legal_name, industry_code, tenant_key, slug)
),
insert_l1 AS (
  INSERT INTO clients (
    id,
    name,
    legal_name,
    industry_code,
    tenant_key,
    slug,
    holding_group_id,
    parent_client_id,
    holding_group_role,
    aggregate_visibility_level
  )
  SELECT
    seed_l1.id,
    seed_l1.name,
    seed_l1.legal_name,
    seed_l1.industry_code,
    seed_l1.tenant_key,
    seed_l1.slug,
    '830de810-0000-4c9e-8f59-000000000000',
    (SELECT id FROM lakeshore_parent),
    'l1_holdco',
    'group_aggregate'
  FROM seed_l1
  WHERE NOT EXISTS (
    SELECT 1
    FROM clients existing
    WHERE existing.id = seed_l1.id
       OR existing.tenant_key = seed_l1.tenant_key
       OR existing.slug = seed_l1.slug
       OR existing.name = seed_l1.name
  )
  RETURNING id
),
normalize_l1 AS (
  UPDATE clients
  SET legal_name = seed_l1.legal_name,
      industry_code = seed_l1.industry_code,
      tenant_key = seed_l1.tenant_key,
      slug = seed_l1.slug,
      holding_group_id = '830de810-0000-4c9e-8f59-000000000000',
      parent_client_id = (SELECT id FROM lakeshore_parent),
      holding_group_role = 'l1_holdco',
      aggregate_visibility_level = 'group_aggregate',
      updated_at = now()
  FROM seed_l1
  WHERE clients.id = seed_l1.id
     OR clients.tenant_key = seed_l1.tenant_key
     OR clients.slug = seed_l1.slug
     OR clients.name = seed_l1.name
  RETURNING clients.id
)
UPDATE clients
SET holding_group_id = '830de810-0000-4c9e-8f59-000000000000',
    parent_client_id = NULL,
    holding_group_role = 'l0_sponsor',
    aggregate_visibility_level = 'group_aggregate',
    updated_at = now()
WHERE id IN (SELECT id FROM lakeshore_parent);

CREATE OR REPLACE FUNCTION can_read_holding_group_aggregate_by_id(p_client_id UUID)
RETURNS BOOLEAN AS $$
  SELECT can_read_tenant_by_id(p_client_id)
      OR EXISTS (
        SELECT 1
        FROM clients requester
        JOIN clients target
          ON target.id = p_client_id
         AND target.holding_group_id = requester.holding_group_id
        WHERE requester.tenant_key = current_tenant_key()
          AND requester.holding_group_role = 'l0_sponsor'
          AND requester.holding_group_id IS NOT NULL
          AND target.aggregate_visibility_level = 'group_aggregate'
      )
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION can_read_holding_group_aggregate_by_key(p_tenant_key TEXT)
RETURNS BOOLEAN AS $$
  SELECT can_read_tenant_by_key(p_tenant_key)
      OR EXISTS (
        SELECT 1
        FROM clients requester
        JOIN clients target
          ON target.tenant_key = p_tenant_key
         AND target.holding_group_id = requester.holding_group_id
        WHERE requester.tenant_key = current_tenant_key()
          AND requester.holding_group_role = 'l0_sponsor'
          AND requester.holding_group_id IS NOT NULL
          AND target.aggregate_visibility_level = 'group_aggregate'
      )
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION can_read_transaction_grain_by_id(p_client_id UUID)
RETURNS BOOLEAN AS $$
  SELECT can_read_tenant_by_id(p_client_id)
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION can_read_transaction_grain_by_key(p_tenant_key TEXT)
RETURNS BOOLEAN AS $$
  SELECT can_read_tenant_by_key(p_tenant_key)
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION can_approve_holding_group_spawn_by_key(p_tenant_key TEXT)
RETURNS BOOLEAN AS $$
  SELECT can_write_tenant_by_key(p_tenant_key)
      OR EXISTS (
        SELECT 1
        FROM clients requester
        JOIN clients target
          ON target.tenant_key = p_tenant_key
         AND target.holding_group_id = requester.holding_group_id
        WHERE requester.tenant_key = current_tenant_key()
          AND requester.holding_group_role = 'l0_sponsor'
          AND requester.holding_group_id IS NOT NULL
          AND is_tenant_admin()
      )
$$ LANGUAGE sql STABLE SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION can_read_holding_group_aggregate_by_id(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION can_read_holding_group_aggregate_by_key(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION can_read_transaction_grain_by_id(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION can_read_transaction_grain_by_key(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION can_approve_holding_group_spawn_by_key(TEXT) TO authenticated;

COMMENT ON COLUMN clients.holding_group_id IS
  'Shared id for a parent sponsor and its child HoldCos/PortCos. Used for aggregate-only L0 reads.';
COMMENT ON COLUMN clients.parent_client_id IS
  'Parent client for L1/L2 hierarchy. L0 sponsor rows keep this NULL.';
COMMENT ON COLUMN clients.holding_group_role IS
  'Federated tenant role: standalone, l0_sponsor, l1_holdco, or l2_portco.';
COMMENT ON COLUMN clients.aggregate_visibility_level IS
  'Controls whether parent L0 can read aggregate metrics without transaction-grain access.';

NOTIFY pgrst, 'reload schema';

COMMIT;
