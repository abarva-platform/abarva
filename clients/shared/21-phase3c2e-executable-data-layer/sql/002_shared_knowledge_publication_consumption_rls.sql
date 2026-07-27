-- Phase 3C-2E shared Knowledge, publication and consumption RLS layer.
-- Tenant-agnostic Azure/Postgres migration artifact. No tenant facts are inserted here.

\set ON_ERROR_STOP on

BEGIN;

CREATE SCHEMA IF NOT EXISTS governance;

CREATE OR REPLACE FUNCTION governance.current_tenant_key()
RETURNS TEXT
LANGUAGE sql
STABLE
AS $$
  SELECT nullif(current_setting('app.tenant_key', true), '')
$$;

CREATE OR REPLACE FUNCTION governance.is_controlled_database_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
  SELECT current_user IN ('airdn_admin')
$$;

CREATE OR REPLACE FUNCTION governance.can_access_tenant(p_tenant_key TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
  SELECT
    p_tenant_key IS NOT NULL
    AND p_tenant_key <> ''
    AND p_tenant_key <> 'all'
    AND p_tenant_key NOT LIKE '%*%'
    AND (
      governance.is_controlled_database_admin()
      OR p_tenant_key = governance.current_tenant_key()
    )
$$;

GRANT USAGE ON SCHEMA governance TO PUBLIC;
GRANT EXECUTE ON FUNCTION governance.current_tenant_key() TO PUBLIC;
GRANT EXECUTE ON FUNCTION governance.is_controlled_database_admin() TO PUBLIC;
GRANT EXECUTE ON FUNCTION governance.can_access_tenant(TEXT) TO PUBLIC;

DO $$
DECLARE
  table_row RECORD;
  policy_name TEXT;
  protected_schemas TEXT[] := ARRAY[
    'source_registry',
    'evidence',
    'working',
    'knowledge',
    'metrics',
    'governance',
    'publication',
    'consumption',
    'audit',
    'operations'
  ];
BEGIN
  FOR table_row IN
    SELECT c.table_schema, c.table_name
    FROM information_schema.columns c
    JOIN information_schema.tables t
      ON t.table_schema = c.table_schema
     AND t.table_name = c.table_name
     AND t.table_type = 'BASE TABLE'
    WHERE c.column_name = 'tenant_key'
      AND c.table_schema = ANY(protected_schemas)
    GROUP BY c.table_schema, c.table_name
    ORDER BY c.table_schema, c.table_name
  LOOP
    policy_name :=
      left(table_row.table_schema || '_' || table_row.table_name || '_tenant_rls', 54)
      || '_'
      || substr(md5(table_row.table_schema || '.' || table_row.table_name), 1, 8);

    EXECUTE format(
      'ALTER TABLE %I.%I ENABLE ROW LEVEL SECURITY',
      table_row.table_schema,
      table_row.table_name
    );

    EXECUTE format(
      'ALTER TABLE %I.%I FORCE ROW LEVEL SECURITY',
      table_row.table_schema,
      table_row.table_name
    );

    EXECUTE format(
      'DROP POLICY IF EXISTS %I ON %I.%I',
      policy_name,
      table_row.table_schema,
      table_row.table_name
    );

    EXECUTE format(
      'CREATE POLICY %I ON %I.%I FOR ALL USING (governance.can_access_tenant(tenant_key)) WITH CHECK (governance.can_access_tenant(tenant_key))',
      policy_name,
      table_row.table_schema,
      table_row.table_name
    );
  END LOOP;
END $$;

CREATE OR REPLACE VIEW governance.rls_table_coverage AS
SELECT
  n.nspname AS schema_name,
  c.relname AS table_name,
  c.relrowsecurity AS rls_enabled,
  c.relforcerowsecurity AS rls_forced,
  count(p.polname) FILTER (WHERE p.polname IS NOT NULL) AS policy_count
FROM pg_class c
JOIN pg_namespace n
  ON n.oid = c.relnamespace
JOIN information_schema.columns col
  ON col.table_schema = n.nspname
 AND col.table_name = c.relname
 AND col.column_name = 'tenant_key'
LEFT JOIN pg_policy p
  ON p.polrelid = c.oid
WHERE c.relkind = 'r'
  AND n.nspname IN (
    'source_registry',
    'evidence',
    'working',
    'knowledge',
    'metrics',
    'governance',
    'publication',
    'consumption',
    'audit',
    'operations'
  )
GROUP BY n.nspname, c.relname, c.relrowsecurity, c.relforcerowsecurity;

COMMIT;
